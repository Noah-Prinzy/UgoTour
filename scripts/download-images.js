// ============================================================
// PHASE 8 IMAGE DOWNLOADER
// ============================================================
// Run from the UgoTour project root with:
//   node scripts/download-images.js
// or:
//   npm run assets:download
//
// The ZIP already contains local fallback images so the UI works immediately.
// This script replaces those fallback files with the selected source images
// from Unsplash and Pinterest when an internet connection is available.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);
const imagesDirectory = join(projectRoot, "frontend", "images");

const images = [
  {
    fileName: "murchison-falls.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-river-with-a-waterfall-8WZRp0H75ao",
    downloadUrl: "https://unsplash.com/photos/8WZRp0H75ao/download?force=true"
  },
  {
    fileName: "bwindi.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-gorilla-standing-in-the-middle-of-a-forest-Lb65e5jMBMo",
    downloadUrl: "https://unsplash.com/photos/Lb65e5jMBMo/download?force=true"
  },
  {
    fileName: "queen-elizabeth.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/an-elephant-walks-across-the-african-savanna-ewBGsxuMv3Y",
    downloadUrl: "https://unsplash.com/photos/ewBGsxuMv3Y/download?force=true"
  },
  {
    fileName: "kidepo.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-herd-of-zebra-standing-on-top-of-a-grass-covered-field-1ejHmmazdjI",
    downloadUrl: "https://unsplash.com/photos/1ejHmmazdjI/download?force=true"
  },
  {
    fileName: "lake-bunyonyi.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-scenic-view-of-a-lake-surrounded-by-mountains-xd0k2HB4voA",
    downloadUrl: "https://unsplash.com/photos/xd0k2HB4voA/download?force=true"
  },
  {
    fileName: "sipi-falls.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-forest-BnjZe8tQUXQ",
    downloadUrl: "https://unsplash.com/photos/BnjZe8tQUXQ/download?force=true"
  },
  {
    fileName: "kampala.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/city-skyline-bathed-in-warm-sunset-light-Q3ymlvOJGFs",
    downloadUrl: "https://unsplash.com/photos/Q3ymlvOJGFs/download?force=true"
  },
  {
    fileName: "rwenzori.jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/green-trees-on-mountain-during-daytime-8PF8fl6e6yE",
    downloadUrl: "https://unsplash.com/photos/8PF8fl6e6yE/download?force=true"
  },
  {
    fileName: "jinja-pinterest.jpg",
    source: "Pinterest / Viator pin",
    pageUrl: "https://www.pinterest.com/pin/explore-the-source-of-the-nile-ssezibwa-falls-and-mabira-forest--424886546113650179/",
    downloadUrl: "https://i.pinimg.com/736x/56/bc/f8/56bcf8d8770ca967dc7d5045e7cf7387.jpg"
  }
];

await mkdir(imagesDirectory, { recursive: true });

let downloaded = 0;
let failed = 0;

for (const image of images) {
  const target = join(imagesDirectory, image.fileName);

  try {
    console.log(`Downloading ${image.fileName} from ${image.source}...`);

    const response = await fetch(image.downloadUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "UgoTour/0.8 educational project"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Expected an image but received ${contentType || "unknown content"}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(target, bytes);
    downloaded += 1;
    console.log(`  Saved -> frontend/images/${image.fileName}`);
  } catch (error) {
    failed += 1;
    console.warn(`  Could not replace ${image.fileName}: ${error.message}`);
    console.warn("  The bundled local fallback remains available.");
  }
}

console.log(`\nImage download finished: ${downloaded} downloaded, ${failed} kept as bundled fallbacks.`);
console.log("Source pages are documented in frontend/images/SOURCE_NOTES.txt and docs/PROJECT_PROGRESS.md.");
