// ============================================================
// FRONTEND ASSET PATH HELPER - PHASE 9
// ============================================================
// PostgreSQL keeps the original local image path for provenance. The browser
// serves a pre-generated WebP copy from /images/optimized when the path is a
// local JPG/PNG, cutting image transfer size substantially without changing DB
// records or source-credit metadata.

// Presentation-safe Mgahinga correction: the two database image paths stay
// unchanged, but on the destination browsing/details views they resolve to
// verified wildlife photography from Mgahinga Gorilla National Park instead of
// the older local images. Keeping the original DB paths avoids any migration or
// API change immediately before presentation.
const MGAHINGA_WILDLIFE_OVERRIDES = {
  "images/destinations/mgahinga/mgahinga-01.jpg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Mountain_Gorilla_in_Mgahinga_Gorilla_National_Park_1.jpg/1280px-Mountain_Gorilla_in_Mgahinga_Gorilla_National_Park_1.jpg",
  "images/destinations/mgahinga/mgahinga-02.jpg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Golden_monkey.JPG/1280px-Golden_monkey.JPG"
};

export function resolveAssetPath(assetPath, basePath = ".") {
  const value = String(assetPath ?? "").trim();
  if (!value) return `${basePath}/images/optimized/uganda-forest-fallback.webp`;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const cleanPath = value.replace(/^\.\//, "").replace(/^\//, "");

  // Scope the emergency wildlife swap to the two destination-focused pages so
  // unrelated UgoTour screens keep their existing asset behaviour unchanged.
  const destinationPhotoView =
    document.body?.classList.contains("destinations-page") ||
    document.body?.classList.contains("details-page");
  if (destinationPhotoView && MGAHINGA_WILDLIFE_OVERRIDES[cleanPath]) {
    return MGAHINGA_WILDLIFE_OVERRIDES[cleanPath];
  }

  const raster = cleanPath.match(/^images\/(.+)\.(jpe?g|png)$/i);
  if (raster) return `${basePath}/images/optimized/${raster[1]}.webp`;
  return `${basePath}/${cleanPath}`;
}
