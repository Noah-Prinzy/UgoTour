// ============================================================
// FRONTEND ASSET PATH HELPER - PHASE 9
// ============================================================
// PostgreSQL keeps the original local image path for provenance. The browser
// serves a pre-generated WebP copy from /images/optimized when the path is a
// local JPG/PNG, cutting image transfer size substantially without changing DB
// records or source-credit metadata.

export function resolveAssetPath(assetPath, basePath = ".") {
  const value = String(assetPath ?? "").trim();
  if (!value) return `${basePath}/images/optimized/uganda-forest-fallback.webp`;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const cleanPath = value.replace(/^\.\//, "").replace(/^\//, "");
  const raster = cleanPath.match(/^images\/(.+)\.(jpe?g|png)$/i);
  if (raster) return `${basePath}/images/optimized/${raster[1]}.webp`;
  return `${basePath}/${cleanPath}`;
}
