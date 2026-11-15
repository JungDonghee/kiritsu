#!/usr/bin/env python3
"""KIRITSU — PDF post-optimizer for mobile/phone reading.

Usage:
  python3 optimize-pdf.py in.pdf [out.pdf]

Without out.pdf the file is replaced in place (via a temp file):
- generates object streams (pdfwrite-style compression)
- linearizes the file (web viewer: byte-serving, first pages render early)
- reports before/after size

Font subsetting already happens inside Chromium's PDF writer. Image weight is
controlled at generation time (gen-art.mjs stores JPEG q80 @1024px). For a
further /ebook recompress install ghostscript and run:
  gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH \
     -sOutputFile=out.pdf in.pdf
"""
import os
import sys
import tempfile

sys.path.insert(0, "/home/jung/ai_station/sandbox/.pdfdeps")
import pikepdf

def main() -> int:
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    tmp = None
    if os.path.abspath(dst) == os.path.abspath(src):
        fd, tmp = tempfile.mkstemp(suffix=".pdf", dir=os.path.dirname(src) or ".")
        os.close(fd)
        dst = tmp
    pdf = pikepdf.open(src)
    pdf.save(
        dst,
        object_stream_mode=pikepdf.ObjectStreamMode.generate,
        compress_streams=True,
        linearize=True,
    )
    pdf.close()
    if tmp:
        os.replace(tmp, src)
        dst = src
    a = os.path.getsize(src)
    b = os.path.getsize(dst)
    print(f"optimized: {a:,} -> {b:,} bytes ({100 * b / a:.0f}%)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
