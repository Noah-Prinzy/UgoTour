// ============================================================
// PHASE 8.1 DESTINATION IMAGE QUALITY GATE
// ============================================================
// Requires a successful download manifest produced by `npm run assets:download`
// and checks every curated destination image is at least 1400x800. This keeps
// the bundled compatibility placeholders from being mistaken for final photos.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(dirname(__dirname), "frontend", "images", "destinations");
const manifestPath = join(root, ".download-manifest.json");
const MIN_WIDTH = 1400;
const MIN_HEIGHT = 800;
const MIN_BYTES = 80_000;
const EXPECTED_COUNT = 32;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if ([".jpg", ".jpeg"].includes(extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

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
    const isSof = [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
    if (isSof && offset + 7 < buffer.length) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  console.error("FAIL No completed destination download manifest was found.");
  console.error("Run: npm run assets:download");
  console.error("The verifier deliberately refuses to approve bundled placeholders as final photography.");
  process.exit(1);
}

if (!manifest.complete || manifest.downloadedCount !== EXPECTED_COUNT || manifest.files?.length !== EXPECTED_COUNT) {
  console.error(`FAIL Image download set is incomplete: ${manifest.downloadedCount ?? 0}/${EXPECTED_COUNT}.`);
  console.error("Run npm run assets:download again until it reports 32/32, then verify again.");
  process.exit(1);
}

const files = await walk(root);
const expected = new Set(manifest.files.map((file) => join(dirname(__dirname), "frontend", "images", file)));
let failures = 0;

for (const file of [...expected].sort()) {
  let bytes;
  try {
    bytes = await readFile(file);
  } catch {
    failures += 1;
    console.log(`FAIL ${file.slice(root.length + 1)} — missing file`);
    continue;
  }

  const size = jpegSize(bytes);
  const fileInfo = await stat(file);
  const relative = file.slice(root.length + 1);

  if (!size) {
    failures += 1;
    console.log(`FAIL ${relative} — could not read JPEG dimensions`);
    continue;
  }

  const dimensionsOk = size.width >= MIN_WIDTH && size.height >= MIN_HEIGHT;
  const bytesOk = fileInfo.size >= MIN_BYTES;
  const ok = dimensionsOk && bytesOk;
  if (!ok) failures += 1;

  console.log(`${ok ? "PASS" : "FAIL"} ${relative} — ${size.width}×${size.height}, ${Math.round(fileInfo.size / 1024)} KB`);
}

if (files.length < EXPECTED_COUNT) {
  failures += 1;
  console.log(`FAIL Only ${files.length} JPEG files exist in the destination gallery tree; expected at least ${EXPECTED_COUNT}.`);
}

console.log(`\nChecked ${EXPECTED_COUNT} curated destination images. Minimum target: ${MIN_WIDTH}×${MIN_HEIGHT}.`);
if (failures) {
  console.log(`${failures} quality check(s) failed. Re-run npm run assets:download, then npm run assets:verify.`);
  process.exitCode = 1;
} else {
  console.log("All 32 downloaded destination images passed the Phase 8.1 quality gate.");
}
