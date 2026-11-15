# KIRITSU mark & novel hanja attribution

The **規律** (and hidden **起立**) outlines in `src/ui/kanji.ts` and
`public/icons/icon.svg`, and the **hanja in the KIRITSU novel PDF**, are all
rendered from **Yuji Boku**, a brush-regular Japanese typeface.

- Font: **Yuji Boku**
- Source: <https://fonts.google.com/specimen/Yuji+Boku> ·
  <https://github.com/google/fonts/tree/main/ofl/yujiboku>
- License: **SIL Open Font License 1.1** (OFL)
  <https://openfontlicense.org/open-font-license-official-text/>
- Title outlines, the KIRITSU hanko icon and the 15-glyph novel subset are
  distributed under the OFL. The application code remains MIT.

Yuji Boku is a hand-brushed regular script in the Ouyang-Xun (欧陽詢) brush
lineage: thinner and less geometric than a black Mincho, with visible brush
entry/exit shapes. It is the face KIRITSU uses as its "구양순체" identity.
Strictly proprietary 欧体/Ouyang-Xun typesetting fonts (e.g. commercial
foundry families) are not bundled; Yuji Boku is the closest free face that
matches the mark.

## Novel hanja subset (2026-11-15)

The novel manuscript (`stories/kiritsu/work/*.md`) uses exactly **15 hanja**:
`人功唯審律憑抗月監立能規起零霊`. A 15-glyph subset is committed at
`stories/kiritsu/fonts/YujiBoku-KIRITSU-subset.ttf` (**~15.7 KB**, OFL) and is
wired into the PDF build with a CJK `unicode-range`, so those glyphs render in
the same brush style as the title while the Korean body stays NanumGothic.

- Regenerate: `cd stories/kiritsu && PYTHONPATH=<pikepdf deps> python3 subset-font.py`
  (downloads the 8.5MB full font locally; `fonts/*` is git-ignored, the subset
  is the only tracked font).
- If the manuscript gains new hanja, add them to `HANJA` in `subset-font.py`,
  rerun it and rebuild the PDF; the full Yuji Boku font is not committed.

If the mark is replaced, remove these paths and this attribution.
