// Phase 8.8 tourism image quality gate: validates manifest completeness,
// corruption, byte size and dimensions across destination and attraction trees.
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const downloadManifestPath = join(projectRoot, "frontend", "images", "destinations", ".download-manifest.json");
const tourismManifestPath = join(projectRoot, "frontend", "images", "tourism-image-manifest.json");
const EXPECTED_IMAGES = 93;
const MIN_BYTES = 80_000;
const phase88DestinationNames = new Set([
  "Kibale National Park", "Lake Mburo National Park", "Semuliki National Park",
  "Mount Elgon National Park", "Mgahinga Gorilla National Park", "Fort Portal",
  "Entebbe", "Ssese Islands", "Lake Mutanda", "Ziwa Rhino Sanctuary"
]);

function jpegSize(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if ([0xd8, 0xd9].includes(marker)) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && offset + 7 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

let downloadManifest;
let tourismManifest;
try {
  downloadManifest = JSON.parse(await readFile(downloadManifestPath, "utf8"));
  tourismManifest = JSON.parse(await readFile(tourismManifestPath, "utf8"));
} catch {
  console.error("FAIL A completed Phase 8.8 image manifest is missing. Run: npm run assets:download");
  process.exit(1);
}

if (!downloadManifest.complete || downloadManifest.expectedCount !== EXPECTED_IMAGES || tourismManifest.images?.length !== EXPECTED_IMAGES) {
  console.error(`FAIL Image download set is incomplete: ${downloadManifest.downloadedCount ?? 0}/${EXPECTED_IMAGES}.`);
  process.exit(1);
}

const failures = [];
let passed = 0;
for (const image of tourismManifest.images) {
  const path = join(projectRoot, ...image.localPath.split("/"));
  const minWidth = image.minWidth ?? (image.type === "attraction" ? 1400 : phase88DestinationNames.has(image.place) ? 2000 : 1400);
  const minHeight = image.type === "attraction" ? 700 : 800;
  try {
    const [bytes, fileInfo] = await Promise.all([readFile(path), stat(path)]);
    let size;
    if (extname(path).toLowerCase() === ".svg") {
      const source = bytes.toString("utf8");
      const width = Number(source.match(/<svg[^>]*\bwidth="(\d+)"/)?.[1]);
      const height = Number(source.match(/<svg[^>]*\bheight="(\d+)"/)?.[1]);
      size = width && height ? { width, height } : null;
    } else {
      size = jpegSize(bytes);
    }
    if (!size) throw new Error("corrupt or unsupported image");
    if (size.width < minWidth || size.height < minHeight) throw new Error(`${size.width}x${size.height}; minimum ${minWidth}x${minHeight}`);
    const minimumBytes = extname(path).toLowerCase() === ".svg" ? 1_000 : MIN_BYTES;
    if (fileInfo.size < minimumBytes) throw new Error(`${Math.round(fileInfo.size / 1024)} KB; minimum ${Math.round(minimumBytes / 1024)} KB`);
    passed += 1;
  } catch (error) {
    failures.push(`${image.place} — ${image.localPath}: ${error.message}`);
  }
}

const destinations = new Set(tourismManifest.images.filter((image) => image.type === "destination").map((image) => image.place));
const attractions = new Set(tourismManifest.images.filter((image) => image.type === "attraction").map((image) => image.place));
console.log("Image verification");
console.log("------------------");
console.log(`Destinations checked: ${destinations.size}`);
console.log(`Attractions checked: ${attractions.size}`);
console.log(`Images checked: ${tourismManifest.images.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failures.length}`);
if (failures.length) {
  console.log("\nFAIL:");
  failures.forEach((failure) => console.log(failure));
  process.exitCode = 1;
}
