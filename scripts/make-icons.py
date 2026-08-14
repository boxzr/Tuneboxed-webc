#!/usr/bin/env python3
"""Build the favicon and app icons from the battle logo.

The icons in public/ had drifted badly: favicon.ico was a 1024x1024 PNG that
had simply been renamed, logo192.png was 1024x1024 and 847KB rather than
192x192, and all of them still carried the old boombox mark with a white
background baked in. That is why the old logo kept showing in the URL bar and
in search results no matter what the page itself rendered.

Everything here is generated from one source so they cannot drift again.

Two deliberate differences between the outputs:

- The favicon and the PWA icons keep transparency, so they sit correctly on
  both light and dark browser chrome.
- apple-touch-icon is flattened onto white, because iOS composites transparent
  icons onto black and the mark's dark outlines disappear into it.
"""

from __future__ import annotations

from pathlib import Path
import sys

from PIL import Image

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src" / "assets" / "tuneboxed-battle-logo.png"
OUT = ROOT / "public"

# Share of the canvas left empty around the mark. The source is cropped tight
# to the artwork, and an icon that runs edge to edge looks wrong next to the
# rounded, inset icons browsers and iOS draw around it.
MARGIN = 0.08

FAVICON_SIZES = [16, 32, 48]


def square(size: int, background: str | None = None) -> Image.Image:
    """Fit the mark, whole and centred, on a transparent or filled square."""
    src = Image.open(SRC).convert("RGBA")

    inner = int(round(size * (1 - 2 * MARGIN)))
    # thumbnail preserves aspect ratio, which matters because the mark is wider
    # than it is tall and stretching it to square would distort the note.
    art = src.copy()
    art.thumbnail((inner, inner), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(
        art,
        ((size - art.width) // 2, (size - art.height) // 2),
        art,
    )

    if background is None:
        return canvas

    filled = Image.new("RGBA", (size, size), background)
    filled.alpha_composite(canvas)
    return filled.convert("RGB")


def main() -> int:
    if not SRC.exists():
        print(f"source not found: {SRC}", file=sys.stderr)
        return 1

    written: list[tuple[str, int]] = []

    def save(img: Image.Image, name: str, **kwargs) -> None:
        path = OUT / name
        img.save(path, **kwargs)
        written.append((name, path.stat().st_size))

    # A real multi-resolution ICO this time, not a renamed PNG.
    save(
        square(FAVICON_SIZES[-1]),
        "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in FAVICON_SIZES],
    )

    save(square(192), "logo192.png", optimize=True)
    save(square(512), "logo512.png", optimize=True)
    save(square(180, background="white"), "apple-touch-icon.png", optimize=True)

    for name, size in written:
        print(f"  {name:24} {size / 1024:7.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
