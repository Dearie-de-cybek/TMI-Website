"""
Derives the website's optimised photography from the church's own originals.

Source of truth is `assets/images/_originals/` — the unmodified photographs the
church supplied (also bundled in the TwainMan Ministry mobile app under
`assets/images/church/`). Nothing here is stock photography: every crop below
is a hand-chosen region of a real TwainMan Ministry photograph.

Run: npm run images      (requires Python 3 + Pillow)

Each entry is (source, crop-box-or-None, output-widths, aspect-note). Crop boxes
are in source pixels, left/top/right/bottom. Output is WebP; the original JPEG
stays in `_originals/` so a crop can be re-cut without going back to the church.
"""

import os
import sys

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "images", "_originals")
OUT = os.path.join(ROOT, "assets", "images", "photos")
TEX = os.path.join(ROOT, "assets", "images", "texture")

# name: (source file, crop box or None, [widths], quality)
DERIVATIVES = {
    # Hero scene 1 — the congregation dancing, cropped wide.
    "congregation-wide": ("congregation-banner.jpg", None, [768, 1200, 1600], 76),
    # Hero scene 2 — the same gathering from the room, head-to-knee band.
    "house-wide": ("churchministration.jpg", (0, 900, 3024, 2601), [768, 1200, 1600, 2000], 76),
    # Hero scene 3 / Gethsemane — Pastor Patrick ministering, Gethsemane Camp Meeting '24.
    "ministering-wide": ("leadpastor.jpg", (0, 100, 1820, 1480), [768, 1200, 1800], 78),
    # Gethsemane tall plate — keeps the camp badge on the sleeve in frame.
    "gethsemane-tall": ("leadpastor.jpg", (0, 400, 1820, 2560), [600, 900, 1400], 78),
    # Z-grid portrait — the congregation, 4:5.
    "congregation-portrait": ("congregation-portrait.jpg", (110, 0, 990, 1100), [480, 760, 1100], 78),
    # Square crop of the same frame, for bento tiles.
    "congregation-square": ("congregation-banner.jpg", (430, 0, 1347, 917), [400, 700, 917], 78),
    # Pastor Patrick, square portrait for leadership.
    "pastor-portrait": ("leadpastor.jpg", (420, 180, 1520, 1280), [320, 560, 1000], 80),
    # The church's own flyer for the monthly service.
    "flyer-blessing-the-work": ("church_events.jpg", None, [400, 700, 1024], 80),
    # Detail crop: the hall's light and drapery, used as a quiet tonal panel.
    "hall-detail": ("churchministration.jpg", (0, 0, 3024, 1000), [600, 1000, 1600], 74),
}


def build_photos():
    os.makedirs(OUT, exist_ok=True)
    for name, (src, box, widths, quality) in DERIVATIVES.items():
        path = os.path.join(SRC, src)
        if not os.path.exists(path):
            print(f"  !! missing source {src} — skipped {name}")
            continue
        base = Image.open(path).convert("RGB")
        if box:
            base = base.crop(box)
        for w in widths:
            if w > base.width:
                continue
            h = round(base.height * w / base.width)
            im = base.resize((w, h), Image.LANCZOS)
            dest = os.path.join(OUT, f"{name}-{w}.webp")
            im.save(dest, "WEBP", quality=quality, method=6)
            print(f"  {name}-{w}.webp  {w}x{h}  {os.path.getsize(dest)//1024}KB")
        # Tiny blurred placeholder, inlined as a CSS background to avoid a flash.
        lq = base.resize((20, max(1, round(base.height * 20 / base.width))), Image.LANCZOS)
        lq = lq.filter(ImageFilter.GaussianBlur(0.6))
        lq.save(os.path.join(OUT, f"{name}-lqip.webp"), "WEBP", quality=40)


def build_logo():
    """Lift the church wordmark off its own flyer.

    This is a low-resolution extraction from a JPEG and is a stand-in only — the
    original logo file should replace it (see README, 'Assets still needed').
    """
    path = os.path.join(SRC, "church_events.jpg")
    if not os.path.exists(path):
        return
    im = Image.open(path).convert("RGB")
    w, h = im.size

    def is_plate_row(y, x0, x1):
        """True when a row is mostly the flyer's white logo plate."""
        row = [im.getpixel((x, y)) for x in range(x0, x1, 4)]
        light = sum(1 for p in row if min(p) > 200)
        return light / len(row) > 0.35

    # The plate spans the top of the flyer. Find its horizontal extent on the
    # very first row, then walk down while the row is still mostly white.
    top_row = [x for x in range(w) if min(im.getpixel((x, 2))) > 200]
    if not top_row:
        print("  !! logo plate not found on flyer - skipped")
        return
    left, right = min(top_row), max(top_row) + 1
    bottom, misses, y = 2, 0, 2
    while y < round(h * 0.2) and misses < 3:
        if is_plate_row(y, left, right):
            bottom, misses = y, 0
        else:
            misses += 1
        y += 1

    logo = im.crop((left + 2, 0, right - 2, bottom - 1))
    logo = logo.resize((logo.width * 3, logo.height * 3), Image.LANCZOS)
    logo.save(os.path.join(OUT, "wordmark-from-flyer.webp"), "WEBP", quality=90)
    print(f"  wordmark-from-flyer.webp  {logo.width}x{logo.height} (low-res, replace)")

    # The flyer plate is near-white; key it out so the mark sits on the site's
    # ivory ground instead of on a white rectangle. Saturated flame pixels keep
    # their alpha because their darkest channel is still low.
    keyed = Image.new("RGBA", logo.size)
    src = logo.convert("RGB")
    out_px = []
    for r, g, b in src.getdata():
        a = 255 - min(r, g, b)
        if a > 190:                 # ink and saturated flame: fully opaque
            alpha = 255
        elif a < 48:                # the flyer's white plate: gone entirely,
            alpha = 0               # or it shows as a halo when inverted
        else:
            alpha = min(255, round((a - 48) * 1.5))
        out_px.append((r, g, b, alpha))
    keyed.putdata(out_px)
    keyed = keyed.resize((528, round(528 * keyed.height / keyed.width)), Image.LANCZOS)
    keyed = keyed.quantize(colors=96, method=Image.FASTOCTREE)
    keyed.save(os.path.join(OUT, "wordmark.png"), optimize=True)
    print(f"  wordmark.png  {keyed.width}x{keyed.height}  {os.path.getsize(os.path.join(OUT,'wordmark.png'))//1024}KB")


def build_texture():
    """A 128px tile of film grain, ~3KB, tiled under the hero's upper zone.

    Deterministic so rebuilds do not churn the file.
    """
    os.makedirs(TEX, exist_ok=True)
    import random

    random.seed(7)
    size = 64
    tile = Image.new("LA", (size, size))
    # Four quantised levels only: the grain still reads, and the PNG stays ~2KB
    # instead of the ~24KB a full-range noise tile costs.
    levels = [(40, 10), (120, 6), (190, 12), (245, 18)]
    tile.putdata([levels[random.randint(0, 3)] for _ in range(size * size)])
    tile.save(os.path.join(TEX, "grain.png"), optimize=True)
    print(f"  grain.png  {size}x{size}  {os.path.getsize(os.path.join(TEX,'grain.png'))//1024}KB")


if __name__ == "__main__":
    print("photographs:")
    build_photos()
    print("wordmark:")
    build_logo()
    print("texture:")
    build_texture()
