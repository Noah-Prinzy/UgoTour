from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "images"
TARGET = SOURCE / "optimized"
MAX_WIDTH = 1920
QUALITY = 82

count = 0
original_bytes = 0
optimized_bytes = 0
for path in SOURCE.rglob("*"):
    if TARGET in path.parents or path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        continue
    relative = path.relative_to(SOURCE).with_suffix(".webp")
    out = TARGET / relative
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        if out.exists():
            original_bytes += path.stat().st_size
            optimized_bytes += out.stat().st_size
            count += 1
            continue
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
        print(f"SKIP {path}: {exc}")

print(f"Optimized {count} raster images")
print(f"Original raster bytes: {original_bytes:,}")
print(f"Optimized WebP bytes: {optimized_bytes:,}")
if original_bytes:
    print(f"Transfer-size reduction: {(1-optimized_bytes/original_bytes)*100:.1f}%")
