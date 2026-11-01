import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import { findSavedFile, scanAttempts } from "./attempts.ts";
import { buildMockPage } from "./mock-page.ts";
import { proxyToMoodle, writeToCache } from "./moodle-proxy.ts";
import { DEFAULT_DIR, DIST_DIR, PAGES_DIR } from "./paths.ts";
import { render } from "./templates.ts";

fs.mkdirSync(DEFAULT_DIR, { recursive: true });

// Keep track of the active folder by Moodle attempt ID to support folder-specific offline mock tests
const activeFolderMap = new Map<string, string>();

function sendHtml(res: ServerResponse, status: number, html: string) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function sendText(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(text);
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// 1. Local dev dashboard
function serveDashboard(res: ServerResponse) {
  try {
    const attempts = scanAttempts(PAGES_DIR);
    const cards = attempts.length
      ? attempts
          .map((att) =>
            render("attempt-card.html", {
              label: att.label,
              folder: att.folder || "root",
              attemptId: att.attemptId,
              href: `/mod/quiz/attempt.php?attempt=${att.attemptId}&page=0&folder=${encodeURIComponent(att.folder || "")}`,
            }),
          )
          .join("")
      : render("no-attempts.html");
    sendHtml(res, 200, render("dashboard.html", { attempts: cards }));
  } catch (err) {
    sendText(res, 500, `Error scanning attempts: ${(err as Error).message}`);
  }
}

// 2. Mock attempt page serving
function serveAttemptPage(res: ServerResponse, url: URL) {
  const attemptId = url.searchParams.get("attempt");
  const folderParam = url.searchParams.get("folder");
  const pageStr = url.searchParams.get("page") || "0";
  const pageNum = parseInt(pageStr, 10) + 1; // Moodle is 0-indexed, file prefix is 1-indexed

  if (!attemptId) {
    sendText(res, 400, "Missing attempt parameter");
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
  if (!filePath) {
    sendHtml(
      res,
      404,
      render("not-found.html", {
        pageNum,
        attemptId,
        folder: activeFolder ? ".pages/" + activeFolder : ".pages/",
      }),
    );
    return;
  }

  const saved = fs.readFileSync(filePath, "utf8");
  sendHtml(
    res,
    200,
    buildMockPage(saved, { withExtension: url.searchParams.has("ext") }),
  );
}

// 3. Built extension files for the ?ext=1 harness
function serveExtensionFile(res: ServerResponse, pathname: string) {
  const filePath = path.join(DIST_DIR, pathname.slice("/__ext/".length));
  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath)) {
    sendText(res, 404, "Not built yet. Run pnpm dev or pnpm build first.");
    return;
  }
  const types: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
  };
  res.writeHead(200, {
    "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}

// 4. Seed the asset cache from a browser that still has the files
async function cacheAsset(req: IncomingMessage, res: ServerResponse) {
  try {
    const { url, type, base64 } = JSON.parse(await readBody(req));
    writeToCache(url, Buffer.from(base64, "base64"), type);
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 400, { error: (err as Error).message });
  }
}

// 5. Save pages parsed on dl.nure.ua
async function savePage(req: IncomingMessage, res: ServerResponse) {
  try {
    const { pageNum, html, url } = JSON.parse(await readBody(req));

    // Name files by attempt so scanAttempts() can group them
    const attemptId =
      new URL(url).searchParams.get("attempt")?.replace(/\D/g, "") || "unknown";
    const filename = `page_${Number(pageNum)}_attempt_${attemptId}.html`;
    const filepath = path.join(DEFAULT_DIR, filename);

    // Write the HTML file with a comment containing the URL at the top
    const contentToWrite = `<!-- Saved from: ${url} at ${new Date().toISOString()} -->\n${html}`;
    fs.writeFileSync(filepath, contentToWrite, "utf8");
    console.log(`[Dev Server] Saved page to ${filepath}`);

    sendJson(res, 200, { success: true, path: filepath });
  } catch (err) {
    console.error("[Dev Server] Error writing file:", err);
    sendJson(res, 500, { error: (err as Error).message });
  }
}

function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(
    req.url ?? "/",
    `http://${req.headers.host || "localhost:3010"}`,
  );
  const { pathname } = url;

  if (req.method === "GET") {
    if (pathname === "/" || pathname === "/index.html") {
      return serveDashboard(res);
    }
    if (pathname === "/mod/quiz/attempt.php") {
      return serveAttemptPage(res, url);
    }
    if (pathname.startsWith("/__ext/")) {
      return serveExtensionFile(res, pathname);
    }
  }

  if (req.method === "POST") {
    if (pathname === "/api/cache-asset") return void cacheAsset(req, res);
    if (pathname === "/api/save-page") return void savePage(req, res);
  }

  // 6. Proxy all other Moodle requests (stylesheets, scripts, images, etc.)
  proxyToMoodle(req, res);
}

// `&delay=ms` on a mock page slows down it and every page the scraper fetches
// from it, which helps to see loading states
const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const delay = Math.min(Number(url.searchParams.get("delay")) || 0, 5000);
  if (delay > 0 && url.pathname === "/mod/quiz/attempt.php") {
    setTimeout(() => handleRequest(req, res), delay);
  } else {
    handleRequest(req, res);
  }
});

server.listen(3010, "localhost", () => {
  console.log(
    "[Dev Server] Running on http://localhost:3010 - listening for mock pages, saves & proxying dl.nure.ua static resources",
  );
});
