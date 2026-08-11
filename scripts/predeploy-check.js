import { access, readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const required = [
  "frontend/index.html", "frontend/offline.html", "frontend/manifest.webmanifest", "frontend/service-worker.js",
  "frontend/pages/map.html", "frontend/pages/saved.html", "frontend/pages/privacy.html",
  "frontend/pages/terms.html", "frontend/pages/contact.html", "frontend/pages/admin.html",
  "frontend/pages/forgot-password.html", "frontend/pages/reset-password.html",
  "database/migrations/008_phase9_predeployment_features.sql", ".env.example", "scripts/backup-db.ps1"
];
let failed = false;
function fail(message) { failed = true; console.error(`FAIL ${message}`); }
for (const file of required) {
  try { await access(resolve(root, file)); }
  catch { fail(`Missing ${file}`); }
}

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
}

const htmlFiles = (await walk(resolve(root, "frontend"))).filter((file) => extname(file) === ".html");
for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  const name = relative(root, file);
  if (/@tailwindcss\/browser/.test(source)) fail(`${name} still uses the Tailwind browser CDN.`);
  if (/<script(?=[^>]*type=["']module["'])(?![^>]*\bsrc=)[^>]*>\s*\S/.test(source)) fail(`${name} contains an inline module script.`);
  if (/\son[a-z]+\s*=/i.test(source)) fail(`${name} contains an inline event handler.`);
  if (!/id=["']main-content["']/.test(source)) fail(`${name} has no main-content landmark.`);
}

const sw = await readFile(resolve(root, "frontend/service-worker.js"), "utf8");
if (/tile\.openstreetmap\.org.*cache\.addAll/s.test(sw)) fail("Map tiles appear in the PWA pre-cache list.");
if (!/ugotour-v1-0-0/.test(sw)) fail("Final PWA cache version is not active.");

const api = await readFile(resolve(root, "frontend/js/api.js"), "utf8");
if (/setItem\([^\n]*auth_token|sessionStorage\.[^(]*\([^\n]*token/i.test(api)) fail("Browser authentication token storage detected.");
if (!/window\.location\.origin}\/api/.test(api)) fail("Production API client does not default to same-origin /api.");

const docs = (await readdir(resolve(root, "docs"))).filter((name) => name.toLowerCase().endsWith(".md"));
if (docs.length !== 1 || docs[0] !== "PROJECT_PROGRESS.md") fail("docs/ must contain only PROJECT_PROGRESS.md.");

// Every raster source image should have a browser-optimized WebP counterpart.
const imageRoot = resolve(root, "frontend/images");
const optimizedRoot = resolve(imageRoot, "optimized");
const sourceImages = (await walk(imageRoot)).filter((file) => {
  if (file.startsWith(optimizedRoot)) return false;
  return [".jpg", ".jpeg", ".png"].includes(extname(file).toLowerCase());
});
let missingOptimized = 0;
for (const source of sourceImages) {
  const rel = relative(imageRoot, source).replace(/\.(jpe?g|png)$/i, ".webp");
  try {
    const info = await stat(resolve(optimizedRoot, rel));
    if (!info.size) throw new Error();
  } catch { missingOptimized += 1; }
}
if (missingOptimized) fail(`${missingOptimized} raster images are missing optimized WebP counterparts. Run npm run assets:optimize.`);

if (failed) process.exit(1);
console.log(`Pre-deployment static checks passed (${htmlFiles.length} HTML pages, ${sourceImages.length} optimized raster sources).`);
