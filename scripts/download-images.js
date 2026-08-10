// ============================================================
// PHASE 8.1 HIGH-RES DESTINATION IMAGE DOWNLOADER
// ============================================================
// Downloads the exact-location Unsplash selections used by UgoTour into
// frontend/images/destinations/. The UI never hotlinks these photos.
//
// Run from the UgoTour root:
//   npm run assets:download
//   npm run assets:verify

import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { phase88Images } from "./tourism-image-manifest.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);
const imagesDirectory = join(projectRoot, "frontend", "images");
const galleryDirectory = join(imagesDirectory, "destinations");
const manifestPath = join(galleryDirectory, ".download-manifest.json");
const tourismManifestPath = join(imagesDirectory, "tourism-image-manifest.json");

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options, attempts = 4) {
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url, options);
    if (response.status !== 429) return response;
    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 4000 * attempt);
  }
  return response;
}

const legacyImages = [
  {
    "fileName": "destinations/murchison-falls/murchison-01.jpg",
    "destination": "Murchison Falls",
    "credit": "Ivan Sabayuki",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/8WZRp0H75ao",
    "downloadUrl": "https://unsplash.com/photos/8WZRp0H75ao/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/murchison-falls/murchison-02.jpg",
    "destination": "Murchison Falls",
    "credit": "Jonathan Göhner",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/dB9uhIxlHyE",
    "downloadUrl": "https://unsplash.com/photos/dB9uhIxlHyE/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/murchison-falls/murchison-03.jpg",
    "destination": "Murchison Falls",
    "credit": "Omoniyi David",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/XzpdMwnoUY0",
    "downloadUrl": "https://unsplash.com/photos/XzpdMwnoUY0/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/murchison-falls/murchison-04.jpg",
    "destination": "Murchison Falls",
    "credit": "Nathalie Lays",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/_3hT8Bw10Q0",
    "downloadUrl": "https://unsplash.com/photos/_3hT8Bw10Q0/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/bwindi/bwindi-01.jpg",
    "destination": "Bwindi Impenetrable National Park",
    "credit": "Nathalie Lays",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/Lb65e5jMBMo",
    "downloadUrl": "https://unsplash.com/photos/Lb65e5jMBMo/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/bwindi/bwindi-02.jpg",
    "destination": "Bwindi Impenetrable National Park",
    "credit": "2H Media",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/FKcRXTOHG8M",
    "downloadUrl": "https://unsplash.com/photos/FKcRXTOHG8M/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/bwindi/bwindi-03.jpg",
    "destination": "Bwindi Impenetrable National Park",
    "credit": "william pietermans",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/5SujvqCTuJc",
    "downloadUrl": "https://unsplash.com/photos/5SujvqCTuJc/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/bwindi/bwindi-04.jpg",
    "destination": "Bwindi Impenetrable National Park",
    "credit": "Gurth Bramall",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/dtiZl9O14zc",
    "downloadUrl": "https://unsplash.com/photos/dtiZl9O14zc/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/jinja/jinja-01.jpg",
    "destination": "Jinja",
    "credit": "Prince Beguin",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/Vq2pbzX9YtQ",
    "downloadUrl": "https://unsplash.com/photos/Vq2pbzX9YtQ/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/jinja/jinja-02.jpg",
    "destination": "Jinja",
    "credit": "Prince Beguin",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/pCveYAHgc4k",
    "downloadUrl": "https://unsplash.com/photos/pCveYAHgc4k/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/jinja/jinja-03.jpg",
    "destination": "Jinja",
    "credit": "Yoel Winkler",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/JMHFwovV65Y",
    "downloadUrl": "https://unsplash.com/photos/JMHFwovV65Y/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/jinja/jinja-04.jpg",
    "destination": "Jinja",
    "credit": "Kayla Farmer",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/ZFam6iMtEps",
    "downloadUrl": "https://unsplash.com/photos/ZFam6iMtEps/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/queen-elizabeth/queen-elizabeth-01.jpg",
    "destination": "Queen Elizabeth National Park",
    "credit": "Simone Dinoia",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/ewBGsxuMv3Y",
    "downloadUrl": "https://unsplash.com/photos/ewBGsxuMv3Y/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/queen-elizabeth/queen-elizabeth-02.jpg",
    "destination": "Queen Elizabeth National Park",
    "credit": "Simone Dinoia",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/eMayyM6F0xA",
    "downloadUrl": "https://unsplash.com/photos/eMayyM6F0xA/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/queen-elizabeth/queen-elizabeth-03.jpg",
    "destination": "Queen Elizabeth National Park",
    "credit": "Random Institute",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/QGlSeNMsLxk",
    "downloadUrl": "https://unsplash.com/photos/QGlSeNMsLxk/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/queen-elizabeth/queen-elizabeth-04.jpg",
    "destination": "Queen Elizabeth National Park",
    "credit": "Simone Dinoia",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/xxxvYWmZIAw",
    "downloadUrl": "https://unsplash.com/photos/xxxvYWmZIAw/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kidepo/kidepo-01.jpg",
    "destination": "Kidepo Valley National Park",
    "credit": "CLINTON MWEBAZE",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/XLivn95g--g",
    "downloadUrl": "https://unsplash.com/photos/XLivn95g--g/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kidepo/kidepo-02.jpg",
    "destination": "Kidepo Valley National Park",
    "credit": "CLINTON MWEBAZE",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/1ejHmmazdjI",
    "downloadUrl": "https://unsplash.com/photos/1ejHmmazdjI/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kidepo/kidepo-03.jpg",
    "destination": "Kidepo Valley National Park",
    "credit": "CLINTON MWEBAZE",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/o6iaYyalgoY",
    "downloadUrl": "https://unsplash.com/photos/o6iaYyalgoY/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kidepo/kidepo-04.jpg",
    "destination": "Kidepo Valley National Park",
    "credit": "Slim Emcee",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/v8lToRM9l4E",
    "downloadUrl": "https://unsplash.com/photos/v8lToRM9l4E/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/lake-bunyonyi/lake-bunyonyi-01.jpg",
    "destination": "Lake Bunyonyi",
    "credit": "Wietse Jongsma",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/xd0k2HB4voA",
    "downloadUrl": "https://unsplash.com/photos/xd0k2HB4voA/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/lake-bunyonyi/lake-bunyonyi-02.jpg",
    "destination": "Lake Bunyonyi",
    "credit": "Random Institute",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/KQ5djKAN35s",
    "downloadUrl": "https://unsplash.com/photos/KQ5djKAN35s/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/lake-bunyonyi/lake-bunyonyi-03.jpg",
    "destination": "Lake Bunyonyi",
    "credit": "Random Institute",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/n9buHOITydY",
    "downloadUrl": "https://unsplash.com/photos/n9buHOITydY/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/sipi-falls/sipi-falls-01.jpg",
    "destination": "Sipi Falls",
    "credit": "Tony Samuel Gachie",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/BnjZe8tQUXQ",
    "downloadUrl": "https://unsplash.com/photos/BnjZe8tQUXQ/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/sipi-falls/sipi-falls-02.jpg",
    "destination": "Sipi Falls",
    "credit": "ludovico di giorgi",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/-VpFLucS-5Q",
    "downloadUrl": "https://unsplash.com/photos/-VpFLucS-5Q/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kampala/kampala-01.jpg",
    "destination": "Kampala",
    "credit": "Robin Kutesa",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/Q3ymlvOJGFs",
    "downloadUrl": "https://unsplash.com/photos/Q3ymlvOJGFs/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kampala/kampala-02.jpg",
    "destination": "Kampala",
    "credit": "Keith Kasaija",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/lii0uaz8Ieo",
    "downloadUrl": "https://unsplash.com/photos/lii0uaz8Ieo/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kampala/kampala-03.jpg",
    "destination": "Kampala",
    "credit": "Alan David",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/BMt7AVX5b-w",
    "downloadUrl": "https://unsplash.com/photos/BMt7AVX5b-w/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/kampala/kampala-04.jpg",
    "destination": "Kampala",
    "credit": "Jonathan Ward",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/40I8Xjw91w0",
    "downloadUrl": "https://unsplash.com/photos/40I8Xjw91w0/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/rwenzori/rwenzori-01.jpg",
    "destination": "Rwenzori Mountains",
    "credit": "Itote Rubombora",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/8PF8fl6e6yE",
    "downloadUrl": "https://unsplash.com/photos/8PF8fl6e6yE/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/rwenzori/rwenzori-02.jpg",
    "destination": "Rwenzori Mountains",
    "credit": "Itote Rubombora",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/q7MveQH8acU",
    "downloadUrl": "https://unsplash.com/photos/q7MveQH8acU/download?force=true&w=2400"
  },
  {
    "fileName": "destinations/rwenzori/rwenzori-03.jpg",
    "destination": "Rwenzori Mountains",
    "credit": "Huzair Shafiq",
    "source": "Unsplash",
    "pageUrl": "https://unsplash.com/photos/FgcroAvD8Bk",
    "downloadUrl": "https://unsplash.com/photos/FgcroAvD8Bk/download?force=true&w=2400"
  }
];

const images = [...legacyImages, ...phase88Images];

async function resolveCommonsImage(image) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "search",
    gsrsearch: `${image.commonsQuery} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "30",
    prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "2400"
  });
  await delay(900);
  const response = await fetchWithRetry(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "UgoTour/0.8.8 educational tourism image research" }
  });
  if (!response.ok) throw new Error(`Commons API HTTP ${response.status}`);
  const payload = await response.json();
  const rejectedTitle = /\b(map|logo|icon|flag|seal|diagram|poster|locator|sign|route)\b/i;
  const candidates = Object.values(payload.query?.pages ?? {})
    .map((page) => ({ page, info: page.imageinfo?.[0] }))
    .filter(({ page, info }) => info?.mime === "image/jpeg" && info.width >= image.minWidth && !rejectedTitle.test(page.title))
    .sort((a, b) => (b.info.width * b.info.height) - (a.info.width * a.info.height));
  const selected = candidates[image.imageIndex];
  if (!selected) throw new Error(`no suitable ${image.minWidth}px Commons JPEG found for ${image.commonsQuery}`);
  const metadata = selected.info.extmetadata ?? {};
  return {
    ...image,
    downloadUrl: selected.info.thumburl ?? selected.info.url,
    pageUrl: selected.info.descriptionurl,
    credit: metadata.Artist?.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "Wikimedia Commons contributor",
    source: "Wikimedia Commons",
    width: selected.info.width,
    height: selected.info.height,
    license: metadata.LicenseShortName?.value ?? metadata.UsageTerms?.value ?? "See source page"
  };
}

await mkdir(galleryDirectory, { recursive: true });

let downloaded = 0;
let failed = 0;
const completedFiles = [];
const completedRecords = [];
let previousRecords = new Map();
try {
  const previousManifest = JSON.parse(await readFile(tourismManifestPath, "utf8"));
  previousRecords = new Map(previousManifest.images.map((record) => [record.localPath, record]));
} catch {
  // First complete download has no generated manifest to reuse.
}

for (const image of images) {
  const target = join(imagesDirectory, image.fileName);

  try {
    const knownPath = image.localPath ?? `frontend/images/${image.fileName}`;
    const previousRecord = previousRecords.get(knownPath);
    try {
      const existing = await stat(target);
      if (existing.size >= (image.editorialPlaceholder ? 1_000 : 80_000) && previousRecord) {
        completedFiles.push(image.fileName);
        completedRecords.push(previousRecord);
        console.log(`Keeping verified download: ${image.fileName}`);
        continue;
      }
    } catch {
      // Missing files continue into the downloader.
    }
    const resolvedImage = image.editorialPlaceholder ? {
      ...image,
      credit: "UgoTour editorial",
      source: "UgoTour editorial",
      pageUrl: image.sourceUrl,
      width: 1600,
      height: 1000,
      license: "Project-owned editorial artwork; not a location photograph"
    } : image.commonsQuery ? await resolveCommonsImage(image) : {
      ...image,
      place: image.destination,
      type: "destination",
      localPath: `frontend/images/${image.fileName}`,
      photographer: image.credit,
      provider: image.source,
      sourceUrl: image.pageUrl,
      width: null,
      height: null,
      license: "Unsplash License"
    };
    try {
      const existing = await stat(target);
      if (existing.size >= (image.editorialPlaceholder ? 1_000 : 80_000)) {
        completedFiles.push(image.fileName);
        completedRecords.push({
          place: resolvedImage.place ?? resolvedImage.destination,
          type: resolvedImage.type,
          localPath: resolvedImage.localPath ?? `frontend/images/${resolvedImage.fileName}`,
          photographer: resolvedImage.credit ?? resolvedImage.photographer,
          provider: resolvedImage.source ?? resolvedImage.provider,
          sourceUrl: resolvedImage.pageUrl ?? resolvedImage.sourceUrl,
          width: resolvedImage.width,
          height: resolvedImage.height,
          license: resolvedImage.license,
          minWidth: resolvedImage.minWidth ?? 1400
        });
        console.log(`Keeping existing high-resolution file: ${image.fileName}`);
        continue;
      }
    } catch {
      // Missing files continue into the downloader.
    }
    await mkdir(dirname(target), { recursive: true });
    console.log(`Downloading ${image.destination}: ${image.fileName}...`);

    await delay(1600);
    const response = await fetchWithRetry(resolvedImage.downloadUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "UgoTour/0.8.8 educational project"
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Expected image/* but received ${contentType || "unknown content"}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 80_000) {
      throw new Error(`Downloaded file is unexpectedly small (${bytes.length} bytes)`);
    }

    await writeFile(target, bytes);
    downloaded += 1;
    completedFiles.push(image.fileName);
    completedRecords.push({
      place: resolvedImage.place ?? resolvedImage.destination,
      type: resolvedImage.type,
      localPath: resolvedImage.localPath ?? `frontend/images/${resolvedImage.fileName}`,
      photographer: resolvedImage.credit ?? resolvedImage.photographer,
      provider: resolvedImage.source ?? resolvedImage.provider,
      sourceUrl: resolvedImage.pageUrl ?? resolvedImage.sourceUrl,
      width: resolvedImage.width,
      height: resolvedImage.height,
      license: resolvedImage.license,
      minWidth: resolvedImage.minWidth ?? 1400
    });
    console.log(`  Saved -> frontend/images/${image.fileName}`);
  } catch (error) {
    failed += 1;
    console.warn(`  Could not replace ${image.fileName}: ${error.message}`);
    console.warn("  The bundled placeholder remains only to prevent broken image paths.");
  }
}

// Phase 8.6 profile background reuses the curated Bwindi trekking selection.
// Keeping a dedicated filename lets the Profile UI remain independent from the
// destination gallery while still receiving the high-resolution download.
try {
  await copyFile(
    join(imagesDirectory, "destinations", "bwindi", "bwindi-03.jpg"),
    join(imagesDirectory, "profile-page-background.jpg")
  );
  console.log("Profile background synced -> frontend/images/profile-page-background.jpg");
} catch (error) {
  console.warn(`Could not sync profile background: ${error.message}`);
}

const manifest = {
  phase: "8.8",
  generatedAt: new Date().toISOString(),
  expectedCount: images.length,
  downloadedCount: completedFiles.length,
  complete: failed === 0 && completedFiles.length === images.length,
  files: completedFiles
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(tourismManifestPath, `${JSON.stringify({
  phase: "8.8",
  generatedAt: manifest.generatedAt,
  images: completedRecords
}, null, 2)}\n`);

console.log(`\nFinished: ${completedFiles.length}/${images.length} high-resolution tourism images available (${downloaded} downloaded this run).`);
if (failed) {
  console.log(`${failed} download(s) failed.`);
  console.log("Run npm run assets:download again until all images download successfully.");
}
console.log("Then run npm run assets:verify. It checks BOTH download completion and image dimensions.");
