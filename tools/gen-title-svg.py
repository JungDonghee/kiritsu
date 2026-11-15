#!/usr/bin/env python3
"""Regenerate the canonical KIRITSU title glyph asset from Yuji Boku (OFL).

`public/kanji/ou-guilv-tight.svg` is no longer a traced/tightened logo variant:
it is generated *directly from the same Yuji Boku font* as the novel hanja, at
one uniform scale (no per-glyph tightening/distortion). This keeps the intro
kanji identical to the typeface, and makes the asset reproducible.

Prereqs (dev only; not part of the game build):
  - stories/kiritsu/fonts/YujiBoku-Regular.ttf  (full font, git-ignored)
    download: python3 stories/kiritsu/subset-font.py  (or URL in KANJI_ATTRIBUTION)
  - fontTools (the PDF toolchain already provides it at ../.pdfdeps)

Usage:
  python3 tools/gen-title-svg.py
"""
from __future__ import annotations
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), ".pdfdeps"))
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.pens.svgPathPen import SVGPathPen  # noqa: E402
from fontTools.pens.transformPen import TransformPen  # noqa: E402
from fontTools.pens.boundsPen import BoundsPen  # noqa: E402

FONT = os.path.join(ROOT, "stories", "kiritsu", "fonts", "YujiBoku-KIRITSU-subset.ttf")
if not os.path.exists(FONT):
    FONT = os.path.join(ROOT, "stories", "kiritsu", "fonts", "YujiBoku-Regular.ttf")
OUT = os.path.join(ROOT, "public", "kanji", "ou-guilv-tight.svg")
CHARS = "規律"
VIEW_W, VIEW_H = 600, 300
SCALE = 0.275          # uniform for both glyphs — never per-glyph stretching
MARGIN_X, MARGIN_Y = 24, 24
GAP = 12


def main() -> int:
    if not os.path.exists(FONT):
        print("missing full Yuji Boku font:", FONT, file=sys.stderr)
        print("run: python3 stories/kiritsu/subset-font.py (downloads it)", file=sys.stderr)
        return 2
    font = TTFont(FONT)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()

    # global ink bbox → one baseline for both glyphs (keeps font proportions)
    bboxes = {}
    for ch in CHARS:
        pen = BoundsPen(glyph_set)
        glyph_set[cmap[ord(ch)]].draw(pen)
        bboxes[ch] = pen.bounds
    y_min = min(b[1] for b in bboxes.values())
    y_max = max(b[3] for b in bboxes.values())
    # font y-up → svg y-down via scale(s,-s); put the global ink top at MARGIN_Y
    ty = MARGIN_Y + SCALE * y_max
    if ty - SCALE * y_min > VIEW_H - MARGIN_Y:
        print("layout too tall", file=sys.stderr)
        return 1

    x_cursor = MARGIN_X
    groups = []
    for ch in CHARS:
        (x0, _, x1, _) = bboxes[ch]
        tx = x_cursor - SCALE * x0
        pen = SVGPathPen(glyph_set)
        glyph_set[cmap[ord(ch)]].draw(TransformPen(pen, (SCALE, 0, 0, -SCALE, tx, ty)))
        groups.append((tx, pen.getCommands()))
        x_cursor += SCALE * (x1 - x0) + GAP

    width = x_cursor - GAP + MARGIN_X
    if width > VIEW_W:
        print(f"layout overflows viewBox: {width:.1f} > {VIEW_W}", file=sys.stderr)
        return 1

    body = "\n".join(f'<g transform="translate(0,0) scale(1)"><path d="{d}"/></g>' for _, d in groups)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_W} {VIEW_H}" role="img">'
        f'<g fill="#f2d8c9" fill-rule="nonzero">\n{body}\n</g></svg>\n'
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"wrote {OUT} ({len(svg):,} bytes, uniform scale {SCALE})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
