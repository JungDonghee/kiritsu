#!/usr/bin/env python3
"""Regenerate the KIRITSU hanja subset from Yuji Boku (OFL 1.1).

The KIRITSU novel uses exactly 15 hanja. The title glyphs and the novel's
hanja share the same source typeface: **Yuji Boku** (a free brush-regular
Japanese typeface in the Ouyang-Xun lineage, SIL Open Font License 1.1).

  https://fonts.google.com/specimen/Yuji+Boku
  https://raw.githubusercontent.com/google/fonts/main/ofl/yujiboku/YujiBoku-Regular.ttf

The full 8.5MB font is NOT committed (fonts/* is ignored); this script downloads
or accepts it, verifies every novel hanja exists, and writes the ~16KB subset
`fonts/YujiBoku-KIRITSU-subset.ttf` which IS committed (OFL).

Usage:
  PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 subset-font.py [--font PATH]
"""
from __future__ import annotations
import argparse
import os
import sys
import urllib.request

sys.path.insert(0, "/home/jung/ai_station/sandbox/.pdfdeps")
from fontTools import subset  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402
from fontTools.pens.recordingPen import DecomposingRecordingPen  # noqa: E402
from fontTools.pens.ttGlyphPen import TTGlyphPen  # noqa: E402
from fontTools.pens.cu2quPen import Cu2QuPen  # noqa: E402
import pathops  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
HANJA = "人功唯審律憑抗月監立能規起零霊"  # unique hanja in work/*.md (novel manuscript)
URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/yujiboku/YujiBoku-Regular.ttf"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", help="path to full YujiBoku-Regular.ttf (downloads if omitted)")
    ap.add_argument("--erode", type=float, default=8.0, help="outline erosion in font units (default 8; 0 = original weight)")
    args = ap.parse_args()
    src = args.font
    if not src:
        src = os.path.join(HERE, "fonts", "YujiBoku-Regular.ttf")
        if not os.path.exists(src):
            os.makedirs(os.path.dirname(src), exist_ok=True)
            print("downloading", URL)
            urllib.request.urlretrieve(URL, src)
    font = subset.load_font(src, subset.Options())
    opts = subset.Options()
    opts.name_IDs = ["*"]
    opts.name_legacy = True
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.recalc_bounds = True
    opts.layout_features = ["*"]
    opts.drop_tables += ["DSIG"]
    sub = subset.Subsetter(options=opts)
    sub.populate(text=HANJA)
    sub.subset(font)
    out = os.path.join(HERE, "fonts", "YujiBoku-KIRITSU-subset.ttf")
    subset.save_font(font, out, opts)
    if args.erode > 0:
        font = TTFont(out)
        gs = font.getGlyphSet(); glyf = font["glyf"]
        for ch in HANJA:
            gname = font.getBestCmap().get(ord(ch))
            if not gname:
                continue
            rec = DecomposingRecordingPen(gs); gs[gname].draw(rec)
            orig = pathops.Path(); rec.replay(orig.getPen()); orig.simplify(); orig.convertConicsToQuads()
            stroke = pathops.Path(); stroke.addPath(orig)
            stroke.stroke(2 * args.erode, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
            stroke.convertConicsToQuads()
            eroded = pathops.Path()
            pathops.difference(orig.contours, stroke.contours, eroded.getPen())
            eroded.simplify(); eroded.convertConicsToQuads()
            pen = TTGlyphPen(None)
            eroded.draw(Cu2QuPen(pen, 1.0, reverse_direction=False))
            glyph = pen.glyph(); glyph.recalcBounds(glyf); glyf[gname] = glyph
        font.save(out)
        print(f"eroded outlines by {args.erode} units")
    check = TTFont(out)
    cmap = check.getBestCmap()
    missing = [c for c in HANJA if ord(c) not in cmap]
    print(f"subset: {out} ({os.path.getsize(out):,} bytes, glyphs {len(check.getGlyphOrder())}, missing {missing or 'none'})")
    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
