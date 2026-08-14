"""Cut the white matte off the battle logo so it sits on any background.

The source PNG ships from the iOS asset catalogue as RGB with no alpha, so on
the dark battle canvas it reads as a white rectangle. Everything below exists
to turn that matte into real transparency without eating the artwork.

Run: python3 scripts/make-logo.py
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(
    "/Users/boxzr/Library/Mobile Documents/com~apple~CloudDocs/Desktop/"
    "TuneBoxed/TuneBoxed/Assets.xcassets/Logo.imageset/tuneboxed-logo.png"
)
OUT = Path(__file__).parent.parent / "src" / "assets" / "tuneboxed-battle-logo.png"

# Longest edge of the web copy. The hero draws it at 112px tall, so this leaves
# headroom for a 3x display without shipping the full-resolution crop.
WEB_MAX_EDGE = 360

# A pixel counts as matte if it is bright and close to grey. The chroma test is
# what keeps the pale peach highlights on the glove from being read as matte.
WHITE_MIN = 238
CHROMA_MAX = 12

# An enclosed pale region this large is a hole in the artwork, such as the gap
# inside the note beam, so it should show the page through it. Anything smaller
# is a highlight and stays painted.
HOLE_MIN_FRACTION = 0.0015

BACKGROUND = 128


def matte_mask(rgb: np.ndarray) -> np.ndarray:
    bright = rgb.min(axis=2) >= WHITE_MIN
    flat = (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)) <= CHROMA_MAX
    return bright & flat


def flood_from_border(mask_img: Image.Image, w: int, h: int) -> None:
    """Mark every matte pixel reachable from the edge, i.e. the outer matte."""
    px = mask_img.load()
    border = (
        [(x, 0) for x in range(w)]
        + [(x, h - 1) for x in range(w)]
        + [(0, y) for y in range(h)]
        + [(w - 1, y) for y in range(h)]
    )
    for seed in border:
        if px[seed] == 255:
            ImageDraw.floodfill(mask_img, seed, BACKGROUND, thresh=0)


def flood_enclosed_holes(mask_img: Image.Image, w: int, h: int, min_area: int) -> int:
    """Punch out pale regions the border flood could not reach, if big enough.

    Each surviving region is measured with a local walk before deciding, so a
    small specular highlight keeps its paint while a genuine hole opens up.
    """
    px = mask_img.load()
    filled = 0
    seen = np.zeros((h, w), dtype=bool)
    for y in range(h):
        for x in range(w):
            if px[x, y] != 255 or seen[y, x]:
                continue
            region, queue = [], deque([(x, y)])
            seen[y, x] = True
            while queue:
                cx, cy = queue.popleft()
                region.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny, nx] and px[nx, ny] == 255:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(region) >= min_area:
                for cx, cy in region:
                    px[cx, cy] = BACKGROUND
                filled += 1
    return filled


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    w, h = src.size
    rgb = np.array(src)

    # copy() because an array-backed image is read-only, and both floods write.
    mask_img = Image.fromarray((matte_mask(rgb) * 255).astype(np.uint8)).copy()
    flood_from_border(mask_img, w, h)
    holes = flood_enclosed_holes(mask_img, w, h, int(w * h * HOLE_MIN_FRACTION))

    background = np.array(mask_img) == BACKGROUND
    alpha = np.where(background, 0, 255).astype(np.float32)

    # The matte edge is antialiased, so the ring just outside the shapes is a
    # blend of artwork and white. Left opaque it shows up as a pale halo on a
    # dark page. Fading that ring by how close it still is to white is what
    # makes the cutout read as clean at small sizes.
    grown = np.array(
        Image.fromarray((background * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    ) > 0
    fringe = grown & ~background
    luma = rgb.mean(axis=2)
    ramp = np.clip((250.0 - luma) / 25.0, 0.0, 1.0)
    alpha[fringe] = (ramp[fringe] * 255.0)

    out = np.dstack([rgb, alpha.astype(np.uint8)])
    img = Image.fromarray(out)

    # The source is mostly padding, so a fixed CSS height renders the mark far
    # smaller than the box suggests. Trimming lets the height mean the artwork.
    bbox = Image.fromarray((alpha > 8).astype(np.uint8) * 255).getbbox()
    img = img.crop(bbox)

    # The largest this is ever drawn is the 112px hero, so shipping the full
    # crop meant sending roughly 380KB to render 112 pixels. Capping the long
    # edge keeps enough for a 3x display and cuts the file by about 8x.
    if max(img.size) > WEB_MAX_EDGE:
        img.thumbnail((WEB_MAX_EDGE, WEB_MAX_EDGE), Image.LANCZOS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, optimize=True)

    print(f"holes punched: {holes}")
    print(f"cropped {w}x{h} -> {img.size[0]}x{img.size[1]}")
    print(f"wrote {OUT.relative_to(Path.cwd())} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
