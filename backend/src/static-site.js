// ============================================================
// UgoTour production static-site server
// ============================================================
// Railway runs the PWA and REST API from one Node.js process so browser
// sessions remain same-origin. Only files inside /frontend are exposed.

import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = fileURLToPath(new URL(".", import.meta.url));
const FRONTEND_ROOT = resolve(moduleDir, "../../frontend");

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".geojson", "application/geo+json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function safeFrontendPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const candidate = resolve(FRONTEND_ROOT, relative);
  const rootPrefix = `${FRONTEND_ROOT}${sep}`;
  if (candidate !== FRONTEND_ROOT && !candidate.startsWith(rootPrefix)) return null;
  return candidate;
}

function cachePolicy(filePath) {
  const filename = filePath.split(/[\\/]/).pop() || "";
  const extension = extname(filePath).toLowerCase();

  if (
    extension === ".html" ||
    filename === "service-worker.js" ||
    extension === ".webmanifest" ||
    filename === "robots.txt" ||
    filename === "sitemap.xml"
  ) {
    return "no-cache";
  }

  if ([".webp", ".jpg", ".jpeg", ".png", ".svg", ".woff", ".woff2"].includes(extension)) {
    return "public, max-age=604800";
  }

  return "public, max-age=3600";
}

function setStaticSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
}

export function serveStaticSite(request, response, url) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  const filePath = safeFrontendPath(url.pathname);
  if (!filePath) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid path");
    return;
  }

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  if (!stats.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath).toLowerCase();
  setStaticSecurityHeaders(response);
  response.setHeader("Content-Type", CONTENT_TYPES.get(extension) || "application/octet-stream");
  response.setHeader("Content-Length", String(stats.size));
  response.setHeader("Cache-Control", cachePolicy(filePath));

  if (request.method === "HEAD") {
    response.writeHead(200);
    response.end();
    return;
  }

  response.writeHead(200);
  const stream = createReadStream(filePath);
  stream.on("error", () => {
    if (!response.headersSent) response.writeHead(500);
    if (!response.writableEnded) response.end();
  });
  stream.pipe(response);
}
