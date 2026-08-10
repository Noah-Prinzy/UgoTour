// ============================================================
// FRONTEND ASSET PATH HELPER - PHASE 8.1
// ============================================================
// Destination photo paths come from PostgreSQL as project-relative paths such
// as "images/destinations/murchison-falls/murchison-01.jpg". Pages inside /pages are one directory
// deeper than index.html, so they pass ".." as the base path.

export function resolveAssetPath(assetPath, basePath = ".") {
  const value = String(assetPath ?? "").trim();

  if (!value) {
    return `${basePath}/images/uganda-forest-fallback.jpg`;
  }

  // Leave full URLs, data URLs and blob URLs untouched.
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const cleanPath = value.replace(/^\.\//, "").replace(/^\//, "");
  return `${basePath}/${cleanPath}`;
}
