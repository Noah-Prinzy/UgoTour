// ============================================================
// UgoTour production static-site server
// ============================================================
// Railway runs the PWA and REST API from one Node.js process so browser
// sessions remain same-origin. Only files inside /frontend are exposed.

import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
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

function decorateHtml(html) {
  let output = html;

  // Chromium recommends the generic capability meta alongside the Apple tag.
  if (/name=["']apple-mobile-web-app-capable["']/i.test(output) && !/name=["']mobile-web-app-capable["']/i.test(output)) {
    output = output.replace(
      /(<meta\s+name=["']apple-mobile-web-app-capable["'][^>]*>)/i,
      '<meta name="mobile-web-app-capable" content="yes" />\n  $1'
    );
  }

  // Use the compact Flag-O mark on every HTML page without duplicating the
  // favicon declaration across each individual source file. apple-touch-icon
  // does not count as the browser favicon here.
  if (!/<link\s+rel=["'](?:shortcut\s+)?icon["'][^>]*>/i.test(output)) {
    if (/<link\s+rel=["']manifest["'][^>]*>/i.test(output)) {
      output = output.replace(
        /(<link\s+rel=["']manifest["'][^>]*>)/i,
        '$1\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />'
      );
    } else {
      output = output.replace(
        /<\/head>/i,
        '  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n</head>'
      );
    }
  }

  return output;
}

export function serveStaticSite(request, response, url) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }

  // Browsers still probe the conventional /favicon.ico path even when the
  // application uses an SVG favicon. Serve the branded Flag-O asset centrally
  // so every UgoTour page gets a valid icon instead of a noisy 404.
  const requestedPath = url.pathname === "/favicon.ico" ? "/favicon.svg" : url.pathname;
  const filePath = safeFrontendPath(requestedPath);
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
  response.setHeader("Cache-Control", cachePolicy(filePath));

  if (extension === ".html") {
    let html;
    try {
      html = decorateHtml(readFileSync(filePath, "utf8"));
    } catch {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Could not read page");
      return;
    }

    response.setHeader("Content-Length", String(Buffer.byteLength(html)));
    response.writeHead(200);
    if (request.method === "HEAD") response.end();
    else response.end(html);
    return;
  }

  response.setHeader("Content-Length", String(stats.size));
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
