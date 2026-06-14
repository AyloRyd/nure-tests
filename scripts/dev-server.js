import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PAGES_DIR = path.join(ROOT_DIR, ".pages");

// Create .pages if it doesn't exist
if (!fs.existsSync(PAGES_DIR)) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scanAttempts(dir, list = []) {
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

function findSavedFile(dir, pageNum, attemptId) {
  if (!fs.existsSync(dir)) return null;
  // 1. Try matching attemptId
  let found = search(dir, pageNum, attemptId);
  if (found) return found;
  // 2. Fallback to just matching pageNum
  return search(dir, pageNum, null);

  function search(currentDir, pNum, attId) {
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

function proxyToMoodle(req, res) {
  const targetUrl = `https://dl.nure.ua${req.url}`;
  console.log(`[Dev Server] Proxying request: ${req.url} -> ${targetUrl}`);

  const options = {
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

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error(`[Dev Server] Proxy error for ${req.url}: ${err.message}`);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(proxyReq);
}

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
    req.url,
    `http://${req.headers.host || "localhost:3001"}`,
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
            <a href="/mod/quiz/attempt.php?attempt=${att.attemptId}&page=0">Start Mock Quiz Page 1 &rarr;</a>
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
      res.end(`Error scanning attempts: ${err.message}`);
    }
    return;
  }

  // 2. Mock attempt page serving
  if (req.method === "GET" && pathname === "/mod/quiz/attempt.php") {
    const attemptId = parsedUrl.searchParams.get("attempt");
    const pageStr = parsedUrl.searchParams.get("page") || "0";
    const pageNum = parseInt(pageStr, 10) + 1; // Moodle is 0-indexed, file prefix is 1-indexed

    if (!attemptId) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing attempt parameter");
      return;
    }

    console.log(
      `[Dev Server] Serving attempt ${attemptId}, page ${pageNum} (page param ${pageStr})`,
    );

    const filePath = findSavedFile(PAGES_DIR, pageNum, attemptId);
    if (filePath && fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, "utf8");

      // Rewrite dl.nure.ua references so assets (CSS, JS, images) load via our local proxy
      htmlContent = htmlContent.replaceAll(
        "https://dl.nure.ua",
        "http://localhost:3001",
      );
      htmlContent = htmlContent.replaceAll(
        "https:\\/\\/dl.nure.ua",
        "http:\\/\\/localhost:3001",
      );

      // Strip Moodle script tags to prevent automatic redirects and auth checks in local mock mode
      htmlContent = htmlContent.replace(
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
        "",
      );

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(htmlContent);
    } else {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html>
<head><title>Page Not Found</title></head>
<body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; text-align: center;">
  <h1 style="color: #f87171;">Saved Page Not Found</h1>
  <p>Could not find page file starting with <code>page_${pageNum}_</code> for attempt <code>${attemptId}</code> in the <code>.pages/</code> folder.</p>
  <p><a href="/" style="color: #38bdf8; text-decoration: none;">&larr; Back to Dashboard</a></p>
</body>
</html>`);
    }
    return;
  }

  // 3. Save Page API
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

        // Clean URL to make it safe for filenames
        const cleanUrl = url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
        const filename = `page_${pageNum}_${cleanUrl}.html`;
        const filepath = path.join(PAGES_DIR, filename);

        // Write the HTML file with a comment containing the URL at the top
        const contentToWrite = `<!-- Saved from: ${url} at ${new Date().toISOString()} -->\n${html}`;
        fs.writeFileSync(filepath, contentToWrite, "utf8");
        console.log(`[Dev Server] Saved page to ${filepath}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, path: filepath }));
      } catch (err) {
        console.error("[Dev Server] Error writing file:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. Proxy all other Moodle requests (stylesheets, scripts, images, etc.)
  proxyToMoodle(req, res);
});

server.listen(3001, "localhost", () => {
  console.log(
    "[Dev Server] Running on http://localhost:3001 - listening for mock pages, saves & proxying dl.nure.ua static resources",
  );
});
