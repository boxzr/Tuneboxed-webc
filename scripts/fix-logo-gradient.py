#!/usr/bin/env python3
"""Narrow the blue-to-orange blend in the logo so it stops passing through grey.

The mark is blue on one side and orange on the other, and the artwork fades
between them across a wide band. Those two hues are close to complementary, so
every intermediate step is less saturated than both ends, and the midpoint
lands on a dead grey-green (around 176,184,170). It reads as dirt on the
artwork, worst at hero size where the band is widest in absolute pixels.

There is no way to blend these two colours over a long distance without going
through grey, so the fix is to shorten the blend rather than recolour it: the
two hues still meet with a soft edge, just over far fewer pixels, and the
muddy middle is squeezed down to a sliver.

Shading is preserved. The artwork has 3D highlights and darker bevels, and the
gradient is not a plain RGB interpolation either (its midpoint is lighter than
a straight blend would be). So each pixel is split into "position along the
blend" and "everything else", only the position is remapped, and the rest is
added back untouched.

Writes the iOS asset in place. Run scripts/make-logo.py afterwards to rebuild
the web copy from it.
"""

from pathlib import Path
import sys

import numpy as np
from PIL import Image

SRC = Path(
    "/Users/boxzr/Library/Mobile Documents/com~apple~CloudDocs/Desktop/TuneBoxed/"
    "TuneBoxed/Assets.xcassets/Logo.imageset/tuneboxed-logo.png"
)

# The two ends of the blend, sampled from flat areas of the artwork.
BLUE = np.array([48.0, 198.0, 254.0])
ORANGE = np.array([254.0, 138.0, 2.0])

# How far a pixel may sit off the blue-orange line and still be treated as part
# of the blend. The gradient is lighter than a straight interpolation, so its
# own pixels sit about 48 off the line; the dark bevels and the black facial
# features sit much further and have to be left alone.
RESIDUAL_LIMIT = 60.0

# Steepness of the remap. 5 keeps a visible soft edge while cutting the muddy
# band to roughly a fifth of its width.
STEEPNESS = 5.0


def fix(rgb: np.ndarray) -> np.ndarray:
    """Return a copy of `rgb` with the blend band compressed."""
    a = rgb.astype(np.float64)
    direction = ORANGE - BLUE
    denom = float(direction @ direction)

    offset = a - BLUE
    # Position along the blue-to-orange line, per pixel. einsum rather than @
    # because matmul dispatches this shape to BLAS, which emits spurious
    # divide-by-zero and overflow warnings on output that is in fact clean.
    t = np.einsum("...i,i->...", offset, direction) / denom
    projected = BLUE + t[..., None] * direction
    residual = a - projected
    distance = np.linalg.norm(residual, axis=-1)

    # Only touch pixels that are genuinely a mix of the two ends. Pure blue and
    # pure orange have t at 0 or 1 and come out of the remap unchanged anyway,
    # but excluding everything else keeps the outlines and the white interior
    # of the note exactly as drawn.
    blend = (distance < RESIDUAL_LIMIT) & (t > 0.0) & (t < 1.0)

    steepened = np.clip((t - 0.5) * STEEPNESS + 0.5, 0.0, 1.0)
    rebuilt = BLUE + steepened[..., None] * direction + residual

    out = np.where(blend[..., None], rebuilt, a)
    return np.clip(out, 0, 255).astype(np.uint8)


def main() -> int:
    if not SRC.exists():
        print(f"source not found: {SRC}", file=sys.stderr)
        return 1

    src = Image.open(SRC)
    had_alpha = src.mode in ("RGBA", "LA")
    rgb = np.asarray(src.convert("RGB"))

    fixed = fix(rgb)
    out = Image.fromarray(fixed)

    if had_alpha:
        out.putalpha(src.getchannel("A"))

    out.save(SRC)

    # Report the midpoint so the change is visible without opening the file.
    mid = fixed[285, 700]
    print(f"wrote {SRC.name}  midpoint now {tuple(int(c) for c in mid)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
