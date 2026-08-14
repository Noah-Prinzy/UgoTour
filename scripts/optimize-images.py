# ============================================================
# UGOTOUR IMAGE OPTIMIZER
# Converts local JPG/PNG tourism photography into browser-friendly WebP copies
# under frontend/images/optimized while preserving the original source assets.
# ============================================================

from pathlib import Path
from PIL import Image, ImageOps

# Resolve repository paths relative to this script so it works from any shell folder.
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "images"
TARGET = SOURCE / "optimized"
MAX_WIDTH = 1920
QUALITY = 82

# Accumulators are used to print a useful transfer-size report at the end.
count = 0
original_bytes = 0
optimized_bytes = 0

# Walk every source raster image, skipping the optimized folder so generated WebP
# files are never treated as new source assets.
for path in SOURCE.rglob("*"):
    if TARGET in path.parents or path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        continue

    relative = path.relative_to(SOURCE).with_suffix(".webp")
    out = TARGET / relative
    out.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Existing outputs are counted but not recompressed on every run.
        if out.exists():
            original_bytes += path.stat().st_size
            optimized_bytes += out.stat().st_size
            count += 1
            continue

        # Correct EXIF orientation, normalize color mode, resize oversized images
        # proportionally, then encode the transfer copy as WebP.
        with Image.open(path) as image:
            image = ImageOps.exif_transpose(image)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGB")
            if image.width > MAX_WIDTH:
                height = round(image.height * MAX_WIDTH / image.width)
                image = image.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)
            save_kwargs = {"format": "WEBP", "quality": QUALITY, "method": 3}
            if image.mode == "RGBA": save_kwargs["lossless"] = False
            image.save(out, **save_kwargs)

        original_bytes += path.stat().st_size
        optimized_bytes += out.stat().st_size
        count += 1
    except Exception as exc:
        # One corrupt image should be reported without hiding the status of the rest.
        print(f"SKIP {path}: {exc}")

# Print totals so developers can verify the optimization pass and its size benefit.
print(f"Optimized {count} raster images")
print(f"Original raster bytes: {original_bytes:,}")
print(f"Optimized WebP bytes: {optimized_bytes:,}")
if original_bytes:
    print(f"Transfer-size reduction: {(1-optimized_bytes/original_bytes)*100:.1f}%")
