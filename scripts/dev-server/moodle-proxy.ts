import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { CACHE_DIR } from "./paths.ts";

function cachePathFor(url: string): string {
  const safe = url.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  return path.join(CACHE_DIR, safe);
}

export function writeToCache(url: string, body: Buffer, type: string) {
  const file = cachePathFor(url);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, body);
  fs.writeFileSync(`${file}.type`, type);
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

export function proxyToMoodle(req: IncomingMessage, res: ServerResponse) {
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
      writeToCache(req.url ?? "/", Buffer.concat(chunks), type);
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
