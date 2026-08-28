#!/usr/bin/env python3
"""Port the battle mascots out of the iOS asset catalogue.

The room UI uses the same three pieces of art the app does: the gloves touching
for branding, and the two boxers who square up either side of the VS badge in a
bracket matchup.

They cannot ship as they are. The boxers are 1024x1024 PNGs of about 1.4MB each
that are 81% empty, because the catalogue keeps them padded to a square for
SwiftUI to lay out. The web draws them around 84-110 CSS pixels, so nearly all
of that is bytes the browser downloads and then throws away.

Two things happen here: the transparent padding is cropped off, so a CSS height
means the artwork rather than mostly nothing, and the long edge is capped with
enough headroom for a 3x display.

Run: python3 scripts/make-sprites.py
"""

from __future__ import annotations

from pathlib import Path
import sys

from PIL import Image

CATALOGUE = Path(
    "/Users/boxzr/Library/Mobile Documents/com~apple~CloudDocs/Desktop/"
    "TuneBoxed/TuneBoxed/Assets.xcassets"
)
OUT = Path(__file__).parent.parent / "src" / "assets"

# Long edge of each web copy, sized against the largest the piece is ever
# drawn. The boxers top out around 110px in a matchup card and the gloves reach
# 360px on the TV board, so both get roughly 2-3x for retina.
SPRITES = {
    "battle-gloves.png": (
        CATALOGUE / "BattleGlovesTouch.imageset/battle_gloves_touch.png",
        720,
    ),
    "boxer-blue.png": (
        CATALOGUE / "BlueBoxer.imageset/bluespriteboxingstance.png",
        320,
    ),
    "boxer-orange.png": (
        CATALOGUE / "OrangeBoxer.imageset/orangespriteboxingstance.png",
        320,
    ),
}

# Alpha at or below this counts as empty when finding the crop box. The sprites
# have a soft antialiased edge, and cropping on "any non-zero alpha" would keep
# a ring of nearly-invisible pixels and defeat the trim.
ALPHA_FLOOR = 8


def convert(src: Path, max_edge: int) -> Image.Image:
    img = Image.open(src).convert("RGBA")

    alpha = img.getchannel("A")
    # point() rather than a numpy round trip: this is a one-channel threshold
    # and getbbox already knows how to read the result.
    box = alpha.point(lambda v: 255 if v > ALPHA_FLOOR else 0).getbbox()
    if box:
        img = img.crop(box)

    if max(img.size) > max_edge:
        img.thumbnail((max_edge, max_edge), Image.LANCZOS)

    return img


def main() -> int:
    missing = [str(src) for src, _ in SPRITES.values() if not src.exists()]
    if missing:
        print("source not found:", *missing, sep="\n  ", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)

    for name, (src, max_edge) in SPRITES.items():
        before = src.stat().st_size
        img = convert(src, max_edge)

        path = OUT / name
        img.save(path, optimize=True)
        after = path.stat().st_size

        print(
            f"  {name:20} {img.size[0]:>4}x{img.size[1]:<4} "
            f"{before / 1024:>7.0f} KB -> {after / 1024:>5.0f} KB"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
