import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PAGES_DIR = path.join(ROOT_DIR, ".pages");
const DEFAULT_DIR = path.join(PAGES_DIR, "default");
const DIST_DIR = path.join(ROOT_DIR, "dist");

// Create .pages and .pages/default if they don't exist
if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}
if (!fs.existsSync(DEFAULT_DIR)) {
  fs.mkdirSync(DEFAULT_DIR, { recursive: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SavedAttempt {
  attemptId: string;
  folder: string;
  label: string;
}

function scanAttempts(dir: string, list: SavedAttempt[] = []): SavedAttempt[] {
  if (!fs.existsSync(dir)) return list;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      scanAttempts(fullPath, list);
    } else if (
      file.isFile() &&
      file.name.endsWith(".html") &&
      file.name.startsWith("page_")
    ) {
      // Parse attempt ID
      const attemptMatch = file.name.match(/attempt_(\d+)/);
      if (attemptMatch) {
        const attemptId = attemptMatch[1];
        const relativeFolder = path.relative(PAGES_DIR, dir);
        const label = relativeFolder
          ? `${relativeFolder} (Attempt ${attemptId})`
          : `Attempt ${attemptId}`;
        const exists = list.some(
          (item) =>
            item.attemptId === attemptId && item.folder === relativeFolder,
        );
        if (!exists) {
          list.push({ attemptId, folder: relativeFolder, label });
        }
      }
    }
  }
  return list;
}

function findSavedFile(
  dir: string,
  pageNum: number,
  attemptId: string,
): string | null {
  if (!fs.existsSync(dir)) return null;
  // 1. Try matching attemptId
  const found = search(dir, pageNum, attemptId);
  if (found) return found;
  // 2. Fallback to just matching pageNum
  return search(dir, pageNum, null);

  function search(
    currentDir: string,
    pNum: number,
    attId: string | null,
  ): string | null {
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      if (file.isDirectory()) {
        const res = search(fullPath, pNum, attId);
        if (res) return res;
      } else if (file.isFile()) {
        if (
          file.name.startsWith(`page_${pNum}_`) &&
          file.name.endsWith(".html")
        ) {
          if (!attId || file.name.includes(`attempt_${attId}`)) {
            return fullPath;
          }
        }
      }
    }
    return null;
  }
}

// Static Moodle assets (theme CSS, fonts, images) are cached on disk, so mock
// pages render offline and don't hammer dl.nure.ua, whose firewall starts
// answering with a CAPTCHA page after too many requests.
const CACHE_DIR = path.join(PAGES_DIR, ".cache");

function cachePathFor(url: string): string {
  const safe = url.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  return path.join(CACHE_DIR, safe);
}

function serveFromCache(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method !== "GET" || !req.url) return false;
  const file = cachePathFor(req.url);
  if (!fs.existsSync(file) || !fs.existsSync(`${file}.type`)) return false;
  res.writeHead(200, {
    "Content-Type": fs.readFileSync(`${file}.type`, "utf8"),
    "Access-Control-Allow-Origin": "*",
  });
  fs.createReadStream(file).pipe(res);
  return true;
}

function proxyToMoodle(req: IncomingMessage, res: ServerResponse) {
  if (serveFromCache(req, res)) return;

  const targetUrl = `https://dl.nure.ua${req.url}`;
  console.log(`[Dev Server] Proxying request: ${req.url} -> ${targetUrl}`);

  const options: https.RequestOptions & { headers: http.OutgoingHttpHeaders } =
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: "dl.nure.ua", // Set host header to target host
      },
    };

  // Remove connection headers that should be handled by the target/client connection
  delete options.headers["connection"];
  delete options.headers["keep-alive"];
  delete options.headers["proxy-connection"];
  // Uncompressed bodies can be cached as they are
  delete options.headers["accept-encoding"];

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    const type = String(proxyRes.headers["content-type"] || "");
    const cacheable =
      req.method === "GET" &&
      proxyRes.statusCode === 200 &&
      !type.startsWith("text/html");

    if (proxyRes.statusCode === 405 || proxyRes.statusCode === 202) {
      console.warn(
        `[Dev Server] dl.nure.ua answered ${proxyRes.statusCode} for ${req.url} (probably its CAPTCHA page). Assets come from .pages/.cache when available.`,
      );
    }

    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    if (!cacheable) {
      proxyRes.pipe(res);
      return;
    }

    const chunks: Buffer[] = [];
    proxyRes.on("data", (chunk) => {
      chunks.push(chunk);
      res.write(chunk);
    });
    proxyRes.on("end", () => {
      res.end();
      const file = cachePathFor(req.url ?? "/");
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, Buffer.concat(chunks));
      fs.writeFileSync(`${file}.type`, type);
    });
  });

  proxyReq.on("error", (err) => {
    console.error(
      `[Dev Server] Proxy error for ${req.url}: ${(err as Error).message}`,
    );
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Proxy error: ${(err as Error).message}`);
  });

  req.pipe(proxyReq);
}

/**
 * Moodle's JS is stripped from mock pages, so the course index drawer would
 * stay open showing only loading placeholders. Start with it closed instead.
 */
function closeCourseIndexDrawer(html: string): string {
  return html
    .replace(/(<body[^>]*class="[^"]*)\bdrawer-open-index\b/, "$1")
    .replace(/(<div id="page"[^>]*class="[^"]*)\bshow-drawer-left\b/, "$1")
    .replace(
      /(<div\s+class="drawer drawer-left) show\b([^"]*" data-region="fixed-drawer" id="theme_boost-drawers-courseindex")/,
      "$1$2",
    );
}

const MOCK_PAGE_STYLE = `
<style id="nuretests-mock-style">
  /* Hidden until Moodle's JS initialises them */
  .drawer.not-initialized { visibility: visible; }
  #quiz-timer-wrapper, #quiznojswarning { display: none !important; }
  .drawertoggle.hidden, .drawerheadercontent.hidden { display: inline-flex !important; }
</style>`;

// Replaces the Moodle JS the mock pages need: page navigation and drawers
const MOCK_PAGE_SCRIPT = `
<script>
  (function () {
    function goToPage(page) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(page));
      window.location.href = window.location.pathname + "?" + params.toString();
    }

    document.addEventListener("DOMContentLoaded", () => {
      const current = parseInt(
        new URLSearchParams(window.location.search).get("page") || "0",
        10,
      );

      const form = document.getElementById("responseform");
      if (form) {
        let clickedButtonName = null;
        form.addEventListener("click", (e) => {
          const button = e.target.closest("input[type=submit], button[type=submit]");
          if (button) clickedButtonName = button.name;
        });
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          if (clickedButtonName === "next") goToPage(current + 1);
          else if (clickedButtonName === "previous") goToPage(current - 1);
          else console.log("[Dev Server] Ignored form action: " + clickedButtonName);
        });
      }

      document.addEventListener("click", (e) => {
        const qnbutton = e.target.closest(".qnbutton[data-quiz-page]");
        if (qnbutton) {
          const page = parseInt(qnbutton.dataset.quizPage, 10);
          if (page !== current) {
            e.preventDefault();
            goToPage(page);
          }
          return;
        }

        const toggler = e.target.closest('[data-toggler="drawers"]');
        if (!toggler) return;
        e.preventDefault();
        const drawer = document.getElementById(toggler.dataset.target);
        const page = document.getElementById("page");
        if (!drawer || !page) return;
        const open =
          toggler.dataset.action === "closedrawer"
            ? false
            : !drawer.classList.contains("show");
        drawer.classList.toggle("show", open);
        const side = drawer.classList.contains("drawer-right") ? "right" : "left";
        page.classList.toggle("show-drawer-" + side, open);
      });
    });
  })();
</script>`;

// Loads the built content script into a mock page with a tiny chrome.* shim,
// so the overlay works in any browser without installing the extension.
const EXTENSION_HARNESS = `
<script>
  (function () {
    const STORE_KEY = "__nuretests_harness_storage";
    const read = () => {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
      catch { return {}; }
    };
    const write = (data) => localStorage.setItem(STORE_KEY, JSON.stringify(data));
    const listeners = [];
    window.chrome = window.chrome || {};
    window.chrome.runtime = {
      getURL: (p) => "/__ext/" + p,
      onMessage: { addListener: (fn) => listeners.push(fn) },
    };
    window.chrome.storage = {
      local: {
        get: async (keys) => {
          const data = read();
          if (keys == null) return data;
          const list = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(list.filter((k) => k in data).map((k) => [k, data[k]]));
        },
        set: async (items) => write({ ...read(), ...items }),
        remove: async (keys) => {
          const data = read();
          for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
          write(data);
        },
      },
    };
    // Same as clicking "Parse" in the popup
    window.__nuretestsOpen = () =>
      listeners.forEach((fn) => fn({ action: "runParser" }, {}, () => {}));
    window.addEventListener("load", () => setTimeout(window.__nuretestsOpen, 300));
  })();
</script>
<script src="/__ext/assets/content.js"></script>`;

// Keep track of the active folder by Moodle attempt ID to support folder-specific offline mock tests
const activeFolderMap = new Map();

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(
    req.url ?? "/",
    `http://${req.headers.host || "localhost:3010"}`,
  );
  const pathname = parsedUrl.pathname;

  // 1. Local Dev Dashboard
  if (
    req.method === "GET" &&
    (pathname === "/" || pathname === "/index.html")
  ) {
    try {
      const attempts = scanAttempts(PAGES_DIR);

      let attemptsHtml = "";
      if (attempts.length === 0) {
        attemptsHtml = `<p style="color: #94a3b8;">No saved attempts found. Parse a quiz on dl.nure.ua in dev mode first to save pages!</p>`;
      } else {
        attemptsHtml = attempts
          .map(
            (att) => `
          <div class="quiz-card">
            <h3>${escapeHtml(att.label)}</h3>
            <p>Folder: <span class="badge">${escapeHtml(att.folder || "root")}</span> | Attempt ID: <span class="badge">${escapeHtml(att.attemptId)}</span></p>
            <a href="/mod/quiz/attempt.php?attempt=${att.attemptId}&page=0&folder=${encodeURIComponent(att.folder || "")}">Start Mock Quiz Page 1 &rarr;</a>
            <a class="secondary" href="/mod/quiz/attempt.php?attempt=${att.attemptId}&page=0&folder=${encodeURIComponent(att.folder || "")}&ext=1">With extension preloaded &rarr;</a>
          </div>
        `,
          )
          .join("");
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>NURETests Local Dev Server</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { color: #818cf8; margin-bottom: 0.5rem; }
    p.subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .quiz-card { background: #1e293b; padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.25rem; border: 1px solid #334155; }
    .quiz-card h3 { margin-top: 0; color: #e2e8f0; font-size: 1.1rem; }
    a { display: inline-block; background: #4f46e5; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: bold; text-decoration: none; margin-top: 0.75rem; transition: background 0.2s; }
    a:hover { background: #4338ca; }
    a.secondary { background: #334155; margin-left: 0.5rem; }
    a.secondary:hover { background: #475569; }
    .badge { background: #334155; color: #cbd5e1; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.8rem; font-family: monospace; }
  </style>
</head>
<body>
  <h1>NURETests Local Dev Server</h1>
  <p class="subtitle">Mock server for testing and previewing Moodle quiz parsing locally.</p>
  <div id="attempts">
    ${attemptsHtml}
  </div>
</body>
</html>`;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Error scanning attempts: ${(err as Error).message}`);
    }
    return;
  }

  // 2. Mock attempt page serving
  if (req.method === "GET" && pathname === "/mod/quiz/attempt.php") {
    const attemptId = parsedUrl.searchParams.get("attempt");
    const folderParam = parsedUrl.searchParams.get("folder");
    const pageStr = parsedUrl.searchParams.get("page") || "0";
    const pageNum = parseInt(pageStr, 10) + 1; // Moodle is 0-indexed, file prefix is 1-indexed

    if (!attemptId) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing attempt parameter");
      return;
    }

    // If folder is specified in URL, update/set active folder for this attempt.
    if (folderParam !== null) {
      activeFolderMap.set(attemptId, folderParam);
    }
    const activeFolder = activeFolderMap.get(attemptId) || "";

    console.log(
      `[Dev Server] Serving attempt ${attemptId}, folder "${activeFolder}", page ${pageNum} (page param ${pageStr})`,
    );

    const searchDir = activeFolder
      ? path.join(PAGES_DIR, activeFolder)
      : PAGES_DIR;
    const filePath = findSavedFile(searchDir, pageNum, attemptId);
    if (filePath && fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, "utf8");

      // Rewrite dl.nure.ua references so assets (CSS, JS, images) load via our local proxy
      htmlContent = htmlContent.replaceAll(
        "https://dl.nure.ua",
        "http://localhost:3010",
      );
      htmlContent = htmlContent.replaceAll(
        "https:\\/\\/dl.nure.ua",
        "http:\\/\\/localhost:3010",
      );

      // Strip Moodle script tags to prevent automatic redirects and auth checks in local mock mode
      htmlContent = htmlContent.replace(
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        "",
      );

      htmlContent = closeCourseIndexDrawer(htmlContent);

      const injected = [MOCK_PAGE_STYLE, MOCK_PAGE_SCRIPT];
      if (parsedUrl.searchParams.has("ext")) injected.push(EXTENSION_HARNESS);

      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace(
          "</body>",
          `${injected.join("\n")}\n</body>`,
        );
      } else {
        htmlContent += injected.join("\n");
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(htmlContent);
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html>
<head><title>Page Not Found</title></head>
<body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; text-align: center;">
  <h1 style="color: #f87171;">Saved Page Not Found</h1>
  <p>Could not find page file starting with <code>page_${pageNum}_</code> for attempt <code>${attemptId}</code> in the <code>${activeFolder ? ".pages/" + activeFolder : ".pages/"}</code> folder.</p>
  <p><a href="/" style="color: #38bdf8; text-decoration: none;">&larr; Back to Dashboard</a></p>
</body>
</html>`);
    }
    return;
  }

  // 3. Built extension files for the ?ext=1 harness
  if (req.method === "GET" && pathname.startsWith("/__ext/")) {
    const filePath = path.join(DIST_DIR, pathname.slice("/__ext/".length));
    if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not built yet. Run pnpm dev or pnpm build first.");
      return;
    }
    const types: Record<string, string> = {
      ".js": "text/javascript",
      ".css": "text/css",
    };
    res.writeHead(200, {
      "Content-Type":
        types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Seed the asset cache from a browser that still has the files
  if (req.method === "POST" && pathname === "/api/cache-asset") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { url, type, base64 } = JSON.parse(body);
        const file = cachePathFor(url);
        fs.mkdirSync(CACHE_DIR, { recursive: true });
        fs.writeFileSync(file, Buffer.from(base64, "base64"));
        fs.writeFileSync(`${file}.type`, type);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  // 4. Save Page API
  if (req.method === "POST" && pathname === "/api/save-page") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const pageNum = data.pageNum;
        const html = data.html;
        const url = data.url;

        // Name files by attempt so scanAttempts() can group them
        const attemptId =
          new URL(url).searchParams.get("attempt")?.replace(/\D/g, "") ||
          "unknown";
        const filename = `page_${Number(pageNum)}_attempt_${attemptId}.html`;
        const filepath = path.join(DEFAULT_DIR, filename);

        // Write the HTML file with a comment containing the URL at the top
        const contentToWrite = `<!-- Saved from: ${url} at ${new Date().toISOString()} -->\n${html}`;
        fs.writeFileSync(filepath, contentToWrite, "utf8");
        console.log(`[Dev Server] Saved page to ${filepath}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, path: filepath }));
      } catch (err) {
        console.error("[Dev Server] Error writing file:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  // 5. Proxy all other Moodle requests (stylesheets, scripts, images, etc.)
  proxyToMoodle(req, res);
});

server.listen(3010, "localhost", () => {
  console.log(
    "[Dev Server] Running on http://localhost:3010 - listening for mock pages, saves & proxying dl.nure.ua static resources",
  );
});
