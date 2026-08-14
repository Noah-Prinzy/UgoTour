// ============================================================
// UGOTOUR PRE-DEPLOYMENT STATIC CHECKS
// Runs a fast repository audit before deployment: required files, safe HTML
// patterns, PWA configuration, terminology/security expectations, documentation
// layout and optimized-image coverage.
// ============================================================

import { access, readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();

// These files represent deployment-critical features. Missing any one of them is
// considered a failed pre-deployment state.
const required = [
  "frontend/index.html", "frontend/offline.html", "frontend/manifest.webmanifest", "frontend/service-worker.js", "frontend/favicon.svg",
  "frontend/css/phase1-28.css", "frontend/css/phase1-29.css", "frontend/js/shared-navigation-copy.js",
  "frontend/pages/map.html", "frontend/pages/saved.html", "frontend/pages/terms.html", "frontend/pages/contact.html", "frontend/pages/admin.html",
  "frontend/pages/forgot-password.html", "frontend/pages/reset-password.html",
  "database/migrations/008_phase9_predeployment_features.sql", "database/migrations/009_profile_editorial_feedback.sql",
  ".env.example", "scripts/backup-db.ps1"
];

// Collect failures instead of stopping at the first one so one run can show the
// developer several fixes at once.
let failed = false;
function fail(message) { failed = true; console.error(`FAIL ${message}`); }

// Verify the required deployment files exist.
for (const file of required) {
  try { await access(resolve(root, file)); }
  catch { fail(`Missing ${file}`); }
}

// Recursively enumerate files under a directory. Several audits reuse this helper.
async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else output.push(path);
  }
  return output;
}

// Inspect every HTML page for patterns that would weaken the CSP/deployment model
// or accessibility landmark structure.
const htmlFiles = (await walk(resolve(root, "frontend"))).filter((file) => extname(file) === ".html");
for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  const name = relative(root, file);
  if (/@tailwindcss\/browser/.test(source)) fail(`${name} still uses the Tailwind browser CDN.`);
  if (/<script(?=[^>]*type=["']module["'])(?![^>]*\bsrc=)[^>]*>\s*\S/.test(source)) fail(`${name} contains an inline module script.`);
  if (/\son[a-z]+\s*=/i.test(source)) fail(`${name} contains an inline event handler.`);
  if (!/id=["']main-content["']/.test(source)) fail(`${name} has no main-content landmark.`);
}

// Privacy was intentionally retired/merged during Phase 1.28, so its old page
// returning is treated as an accidental regression.
try {
  await access(resolve(root, "frontend/pages/privacy.html"));
  fail("Retired Privacy page is still present.");
} catch {
  // Expected: Privacy was intentionally removed in Phase 1.28.
}

// Validate important service-worker rules: versioned cache, current app-shell files,
// no retired page, and no bulk pre-cache of live OpenStreetMap tiles.
const sw = await readFile(resolve(root, "frontend/service-worker.js"), "utf8");
if (/tile\.openstreetmap\.org.*cache\.addAll/s.test(sw)) fail("Map tiles appear in the PWA pre-cache list.");
if (!/const\s+CACHE_NAME\s*=\s*["']ugotour-v\d+-\d+-\d+["']/.test(sw)) fail("Versioned PWA cache name is missing or malformed.");
if (!/favicon\.svg/.test(sw)) fail("Flag-O favicon is missing from the PWA app shell.");
if (!/phase1-28\.css/.test(sw)) fail("Phase 1.28 stylesheet is missing from the PWA app shell.");
if (!/phase1-29\.css/.test(sw)) fail("Phase 1.29 stylesheet is missing from the PWA app shell.");
if (/pages\/privacy\.html/.test(sw)) fail("Retired Privacy page remains in the PWA app shell.");

// The shared PWA bootstrap must load the latest global visual-fix stylesheet.
const pwa = await readFile(resolve(root, "frontend/js/pwa.js"), "utf8");
if (!/phase1-29\.css/.test(pwa)) fail("Phase 1.29 stylesheet is not loaded by the shared PWA bootstrap.");

// Prevent internal development wording from leaking onto the public Terms page.
const terms = await readFile(resolve(root, "frontend/pages/terms.html"), "utf8");
if (/pre-deployment template/i.test(terms)) fail("Internal pre-deployment copy remains visible on Terms.");

// Authentication pages should use the public-facing Favorites terminology rather
// than the retired "Saved Places" product label.
for (const authPage of ["login.html", "signup.html"]) {
  const source = await readFile(resolve(root, "frontend/pages", authPage), "utf8");
  if (/saved places/i.test(source)) fail(`${authPage} still exposes retired Saved Places terminology.`);
}

// Security/deployment checks for the browser API client: no JavaScript token
// storage and production requests default to same-origin /api.
const api = await readFile(resolve(root, "frontend/js/api.js"), "utf8");
if (/setItem\([^\n]*auth_token|sessionStorage\.[^(]*\([^\n]*token/i.test(api)) fail("Browser authentication token storage detected.");
if (!/window\.location\.origin}\/api/.test(api)) fail("Production API client does not default to same-origin /api.");

// Keep the documentation directory intentionally small and predictable.
const docs = (await readdir(resolve(root, "docs"))).filter((name) => name.toLowerCase().endsWith(".md"));
if (docs.length !== 1 || docs[0] !== "PROJECT_PROGRESS.md") fail("docs/ must contain only PROJECT_PROGRESS.md.");

// Every source JPG/PNG should have a corresponding non-empty WebP transfer asset
// under frontend/images/optimized.
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

// Exit non-zero for CI/deployment tooling if any audit above reported a failure.
if (failed) process.exit(1);
console.log(`Pre-deployment static checks passed (${htmlFiles.length} HTML pages, ${sourceImages.length} optimized raster sources).`);
