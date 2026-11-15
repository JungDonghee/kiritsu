# KIRITSU title 規 (U+898F) / 律 (U+5F8B) — per-stroke ink segmentation research

> KIRITSU 리포에 보존된 조사 보고서(2026-11-15). 현재 결론과 다음 작업은
> [`STROKE_HANDOVER.md`](../TITLE_KANJI.md)를 우선한다.

**Author:** stroke-research (read-only research; repo untouched, no commits)
**Date:** 2026-11-15
**Target:** animate the two kanji of the KIRITSU title, using **Yuji Boku Light cut** glyphs
(`kiritsu/stories/kiritsu/fonts/YujiBoku-KIRITSU-subset.ttf`, 22,648 B, unitsPerEm 1000, contains 規/律;
full font `YujiBoku-Regular.ttf`, OFL 1.1).
**Definition used:** a per-stroke partition is "exact" iff every glyph-ink pixel/region belongs to exactly one
stroke ⇒ union = glyph, no other stroke's ink pre-revealed, own ink fully included (up to unavoidable stroke overlaps).

---

## 0. TL;DR — recommendation

| Rank | Approach | Exactness | Effort | License risk |
|---|---|---|---|---|
| **A (recommended)** | **Design-time exact vector partition: fontTools glyph outline + **skia-pathops** boolean "constrained tube" split (already the repo's `tools/gen-title-strokes.py` method; add a radius constraint)** | **exact by construction** (union==glyph, disjoint; verified 0.0 error, see §6) | low–medium (patch existing script) | none beyond OFL font; if KanjiVG centerlines are reused as adapted data → mark CC BY-SA |
| **B (fallback / runtime)** | **Raster Voronoi owner map from stroke centerlines** (already implemented in `src/ui/kanji.ts` `planStrokes()`) — optionally vectorize masks | pixel-exact partition; vectorized output approximate (−0.38 % area at 512 px, §6) | low (already exists) | none |
| C (not useful here) | Hanzi Writer / Make Me a Hanzi data | data exists (11/9 strokes+medians) but glyphs are Arphic Kai, not Yuji; **Arphic Public License copyleft on the data** | low | medium (see §2) |
| D (mask→SVG libraries) | contourpy / potracer / opencv / skimage / vtracer | approximate (−0.4 % @512 px), pip-installable on Py3.14 (all except `potrace`/`pypotrace`) | low | potracer GPLv2+ (dev-tool only) |
| E | KanjiVG directly | centerlines only (no outlines), Japanese order, CC BY-SA 3.0 | — | attribution + share-alike on adapted data |

**Bottom line:** do not adopt Arphic/Hanzi-Writer geometry (wrong font + copyleft data). Use
**A**: from the OFL Yuji Boku Light glyph, take stroke order/types/rough centerlines only as a *reference*
(KanjiVG, already credited in `src/ui/kanji.ts`), register them to the actual glyph (repo already does EDT
offset-search + local snap), then cut the glyph with **pathops** into sequentially-claimed "tubes"
(`part_i = remaining ∩ tube_i`). This gives an exact, disjoint, gap-free partition with no raster artifacts.
Fix the one real weakness we measured: **unconstrained tube radii can starve later strokes** — cap each point's
radius by the distance to the nearest *other* stroke, then validate per-stroke area against a raster Voronoi
reference (§6.3). If the animation only needs canvas masks (as today), **B** is already sufficient and exact at
pixel level.

---

## 1. Question 1 — Hanzi Writer data / Make Me a Hanzi

### 1.1 Data exists for both characters

| Source | URL | HTTP/size | 規 strokes/medians | 律 strokes/medians |
|---|---|---|---|---|
| Hanzi Writer data 2.0.1 (jsDelivr CDN) | `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/%E8%A6%8F.json` / `.../%E5%BE%8B.json` | **200 / 3,278 B**, **200 / 2,996 B** | **11 / 11** (`radStrokes: [4,5,6,7,8,9,10]` = 見) | **9 / 9** (`radStrokes: [0,1,2]` = 彳) |
| Hanzi Writer data, raw GitHub | `https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/data/%E8%A6%8F.json` (and `.../律.json`) | **200 / 3,278 B**; 200 / 2,996 B | 11 / 11 | 9 / 9 |
| Make Me a Hanzi `graphics.txt` | `https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt` | **200 / 30,778,076 B** | 11 / 11 | 9 / 9 |
| Make Me a Hanzi `dictionary.txt` | `.../dictionary.txt` | 200 / 2,570,140 B | has 規 | has 律 |

Data format (Make Me a Hanzi README, and HZW JSON is the same): `{"strokes": [SVG path d…],
"medians": [[[x,y],…],…], "radStrokes": [...]}`. Each **stroke is a closed filled SVG outline**; each
**median is a polyline** in the same coordinate system. Coordinate system (README quote):

> "Each stroke is laid out on a 1024x1024 size coordinate system where: The upper-left corner is at
> position (0, 900). The lower-right corner is at position (1024, -124). Note that the y-axes DECREASES as
> you move downwards… <g transform="scale(1, -1) translate(0, -900)">"

So: both a **per-stroke filled outline** and a **per-stroke centerline (median)** are available for 規 and 律.
HZW's data is a re-packaging of MMH (`package.json`: `"description": "The character data used by Hanzi
Writer. This data is derived from the Make Me a Hanzi project."`, version 2.0.1).

### 1.2 License — Arphic Public License (APL-1999), a *copyleft* data license, not permissive

Hanzi Writer data README quote:

> "## License
> This data comes from the Make Me A Hanzi project, which extracted the data from fonts by Arphic
> Technology … You can redistribute and/or modify this data under the terms of the Arphic Public License as
> published by Arphic Technology Co., Ltd. A copy of this license can be found in ARPHICPL.TXT."

(`https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/README.md`; npm package.json says
`"license": "SEE LICENSE IN ARPHICPL.TXT"`; license file shipped at
`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/APL/english/ARPHICPL.TXT`, HTTP 200 / 6,901 B.)

Make Me a Hanzi `COPYING` quote (`https://raw.githubusercontent.com/skishore/makemeahanzi/master/COPYING`):

> "graphics.txt is derived from: Arphic PL KaitiM GB / Arphic PL UKai … You can redistribute and/or modify
> graphics.txt under the terms of the Arphic Public License as published by Arphic Technology Co., Ltd."

APL-1999 key terms (SPDX: `https://spdx.org/licenses/Arphic-1999.html`; text also at
`http://ftp.gnu.org/gnu/non-gnu/chinese-fonts-truetype/LICENSE`):

- §0 "Font" includes "the derivatives of those fonts created through **any modification including modifying
  glyph, reordering glyph, converting format**, changing font name, or adding/deleting some characters"
  ⇒ the extracted SVG outlines/medians are derivative data.
- §1: verbatim redistribution allowed "provided that you retain this license file (ARPHICPL.TXT) **unaltered**
  in all copies."
- §2(b): you "must make such modifications **Freely Available as a whole to all third parties under the terms
  of this License**". §0 defines Freely Available as "freedom to copy or modify the Font as well as
  redistribute copies … not price" ⇒ **no non-commercial clause, but derivative data must be redistributable
  under APL** (source-available/copyleft), i.e. you cannot keep modified stroke data proprietary.
- §2 last para: "mere aggregation of another work not based on the Font with the Font … does not bring the
  other work under the scope of this License." ⇒ the KIRITSU app code (MIT) is not forced to APL; the derived
  **data** is.

**Answer to the commercial-use question:** commercial distribution is *permitted* (no NC clause), but shipping
the Arphic-derived outlines/medians (or an adapted/registered copy of them) triggers APL obligations:
keep `ARPHICPL.TXT`, mark modifications, and publish the modified data under APL. That is inconsistent with
shipping them as quiet proprietary assets — and unnecessary, because the font is wrong for KIRITSU anyway.

### 1.3 Is using it only as "stroke-order / stroke-region reference for a different font" OK?

Practically and legally, split it:

- **Clean:** read the data to learn *which order* the strokes are written in, then author/derive geometry from
  the Yuji Boku glyph itself (skeletonization, or the repo's KanjiVG-registered centerlines). Stroke order is
  a linguistic fact/idea; facts are not copyrightable (and no coordinates are copied).
- **Grey → treat as APL:** scale/transform the medians or outlines to Yuji's bbox and ship the transformed
  coordinates ("adaptation") ⇒ APL §2 applies. Also copyright-wise this is recognizably derived.
- **Wrong tool anyway:** MMH/HZW graphics are Arphic Kai glyphs and the README explicitly says the project
  targets **PRC stroke order**:
  > "This project is focused on building stroke order diagrams that follow the People's Republic of China
  > (PRC) stroke order. Some characters are written with different stroke orders in Japan, Taiwan, and
  > elsewhere." — and it points to KanjiVG / animCJK for Japanese.
  For 規 both HZW (11) and KanjiVG (11) agree on count and order; same for 律 (9/9) — a useful cross-check,
  but the **Japanese** order/type source for KIRITSU should stay KanjiVG (already cited in `src/ui/kanji.ts`).

---

## 2. Question 2 — KanjiVG

- Files: `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/0898f.svg` (200 / 4,074 B) and
  `.../kanji/05f8b.svg` (200 / 3,884 B). 規 = 11 paths, 律 = 9 paths; each `<path>` carries `kvg:type`
  (e.g. 規: `㇐,㇐,㇒,㇔/㇏,㇑,㇕a,㇐a,㇐a,㇐a,㇒,㇟`; 律: `㇒,㇒,㇑,㇕c,㇐,㇐,㇐,㇐,㇑`).
- **KanjiVG v2 files are centerlines, not filled outlines.** The path group style is
  `fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;`
  (verify: `grep -o 'style="[^"]*"' data/kvg-0898f.svg`) ⇒ each `d` is a stroke skeleton, no area.
- License: README (`.../KanjiVG/kanjivg/master/README.md`) quote:
  > "KanjiVG is copyright Ulrich Apel and released under the Creative Commons Attribution-Share Alike 3.0
  > licence: http://creativecommons.org/licenses/by-sa/3.0/"
  SVG header adds:
  > "Attribution. You must attribute the work by stating your use of KanjiVG in your own copyright header and
  > linking to KanjiVG's website (http://kanjivg.tagaini.net) … Share Alike. If you alter, transform, or build
  > upon this work, you may distribute the resulting work only under the same or similar license to this one."
  ⇒ adapting centerline coordinates = Adaptation under CC BY-SA 3.0; attribute + share-alike the adapted data.
  KIRITSU already has attribution in `src/ui/kanji.ts`; `docs/KANJI_ATTRIBUTION.md` currently mentions only
  Yuji/OFL — **it should also state the CC BY-SA 3.0 status of KanjiVG-derived centerline data** if that data
  is kept in-repo (e.g. `tools/title-plan.json`, title stroke skeletons). Pure "I looked at the order" is not
  an adaptation; copied/registered coordinates are.

---

## 3. Question 3 — vectorization tools on Python 3.14 (the `/home/jung/ai_station/sandbox/.pdfdeps` env)

Environment: `Python 3.14.10`, `pip 26.0.1`, `.pdfdeps` already had contourpy 1.4.0, numpy 2.5.4,
Pillow 13.0.0, fontTools 4.68.0, skia-pathops 0.9.2. Network to PyPI works.

### 3.1 Actual wheel availability (command + result)

```bash
PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 -m pip download \
  --only-binary=:all: --no-cache-dir -d /tmp/stroke-research/wheels <pkg>
```

| package | result | resolved wheel (proof of cp314 compatibility) |
|---|---|---|
| contourpy | **RC=0** | `contourpy-1.4.0-cp314-cp314-manylinux_2_27_x86_64…whl` |
| vitracer (vtracer) | **RC=0** | `vtracer-0.6.15-cp314-cp314-manylinux_2_17_x86_64…whl` |
| opencv-python-headless | **RC=0** | `opencv_python_headless-5.0.0.93-cp37-abi3-manylinux_2_28_x86_64.whl` (abi3) |
| scikit-image | **RC=0** | `scikit_image-0.26.0-cp314-cp314-manylinux_2_24_x86_64…whl` (+ scipy 1.18.1 cp314) |
| potracer | **RC=0** | `potracer-0.0.4-py2.py3-none-any.whl` (pure Python) |
| svgwrite | **RC=0** | `svgwrite-1.4.3-py3-none-any.whl` |
| `potrace` | **RC=1** | `ERROR: Could not find a version that satisfies the requirement potrace (from versions: none)` (no such PyPI project; also PyPI JSON 404) |
| `pypotrace` | **RC=1** | same "from versions: none", PyPI JSON 404 ⇒ not on PyPI (the real potrace is a C CLI, absent here: `which potrace` → not found) |

Install into a throwaway target was done offline from the downloaded wheels and **all imports work**:

```bash
PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 -m pip install --no-index \
  --find-links /tmp/stroke-research/wheels --target /tmp/stroke-research/pylibs \
  contourpy vtracer opencv-python-headless scikit-image potracer svgwrite      # RC=0
```

| module | import | version | license |
|---|---|---|---|
| contourpy | OK | 1.4.0 | BSD-3-Clause |
| cv2 | OK | 5.0.0 | Apache-2.0 |
| vtracer | OK | 0.6.15 | MIT |
| potrace (potracer) | OK | 0.0.4 | **GPLv2+** (dev-time tool only; potrace algorithm family is GPL) |
| skimage | OK | 0.26.0 | BSD-3-Clause |
| scipy | OK | 1.18.1 | BSD-3-Clause |
| numpy / Pillow / svgwrite | OK | 2.5.4 / 13.0.0 / 1.4.3 | BSD / MIT-CMU / MIT |
| skia-pathops (already in `.pdfdeps`) | OK | 0.9.2 | BSD-3-Clause |

**Known runtime gotcha (measured):** `vtracer.convert_pixels_to_svg(numpy RGBA)` **segfaults** in this
cp314 wheel (Python died with SIGSEGV at vtracer `.so`, faulthandler trace captured); the file API works:
`vtracer.convert_image_to_svg_py(in.png, out.svg)` → 200 OK, 808-byte SVG on a synthetic mask. So use the
file API if vtracer is ever needed.

### 3.2 Minimal working examples

**Best option for pure mask→SVG paths with holes in this env: contourpy** (BSD, already a dependency of the
PDF toolchain, no extra install; polygons only, smoothing left to you):

```python
import numpy as np, contourpy
def mask_to_svg_path(mask):                      # mask: np.bool_ (H,W), True = ink
    cg = contourpy.contour_generator(z=mask.astype(np.float64),
                                     line_type=contourpy.LineType.Separate,
                                     corner_mask=True)
    d = []
    for line in cg.lines(0.5):                   # one closed polygon per contour
        if len(line) < 3:
            continue
        d.append('M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in line) + 'Z')
    return f'<path fill-rule="evenodd" d="{" ".join(d)}"/>'   # even-odd = holes free
```

**If smooth Bézier output is wanted (dev-time only, GPLv2+ tool):** `potracer`
(note the inversion convention: `Bitmap` inverts internally, so pass "white=True" i.e. `~mask` for a bool array):

```python
import numpy as np, potrace
def mask_to_bezier(mask):                        # mask True = ink
    path = potrace.Bitmap(~mask).trace(turdsize=2, alphamax=1.0,
                                       opticurve=True, opttolerance=0.2)
    d = []
    for curve in path.curves:
        sp = curve.start_point; d.append(f'M{sp.x:.2f} {sp.y:.2f}')
        for seg in curve.segments:
            if seg.is_corner:
                c, e = seg.c, seg.end_point
                d.append(f'L{c.x:.2f} {c.y:.2f}L{e.x:.2f} {e.y:.2f}')
            else:
                c1, c2, e = seg.c1, seg.c2, seg.end_point
                d.append(f'C{c1.x:.2f} {c1.y:.2f} {c2.x:.2f} {c2.y:.2f} {e.x:.2f} {e.y:.2f}')
        d.append('Z')
    return ''.join(d)                            # nonzero winding; potrace emits holes reversed
```

Hole handling by tool (verified on the real glyph masks, §6):

| tool | API | holes |
|---|---|---|
| contourpy | `contour_generator(...).lines(0.5)` | separate closed contours; nest with even-odd fill rule (or signed-area/containment test if nonzero needed) |
| potracer | `Bitmap(~mask).trace()` | winding carries holes; works with `fill-rule="nonzero"` |
| opencv | `cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)` | hierarchy `[next, prev, first_child, parent]`; outer=parent −1, hole otherwise; net area = Σouter − Σhole |
| scikit-image | `measure.find_contours(mask, 0.5)` | marching squares: gives all iso-lines but **you** must stitch points and classify holes (signed area / point-in-polygon) |
| vtracer | file API only in this wheel | hierarchical tracing handles holes, but it is a colour vectorizer, not a partitioner |

---

## 4. Question 4 — algorithms, existing implementations, pitfalls

### 4.1 Raster Voronoi from stroke centerlines (nearest-centerline ownership)
Every ink pixel is assigned to the nearest point/segment of any stroke centerline (`chamfer` distance,
labels = stroke id). Properties: **exactly one owner per pixel**, owners partition the ink → union = glyph
trivially. This is already implemented in KIRITSU: `src/ui/kanji.ts` `planStrokes()` (nearest `(stroke, point)`
assignment + per-point cover radius + writing-order animation; comment says "잉크 픽셀을 가장 가까운
(획, 점)에 배정해 획별 소유권(owner)을 만든다"). It is the cheapest reliable runtime method (no external
data, only the OFL Yuji glyph). Limits: resolution-dependent; cannot express sub-pixel/vector exactness; hard
boundaries at overlaps are Voronoi bisectors, not the "true" brush-interaction boundary.

### 4.2 Distance transform / watershed
`scipy.ndimage.distance_transform_edt` for ink EDT (used by the repo for centerline snapping),
`skimage.segmentation.watershed(-edt, markers=stroke_seeds)` for marker-based splitting when centerlines are
missing/unreliable. Pitfalls: watershed over-segments at stroke junctions and bleeds across touching strokes;
if markers are centerline pixels, result ≈ Voronoi but noisier; good only as a fallback/skeleton aid.
Literature/examples: stroke-based font segmentation (StrokeStyles, ACM TOG 2022,
`https://dl.acm.org/doi/10.1145/3505246`); skeleton/Voronoi glyph analysis for robotic brush writing
(`https://graphics.uni-konstanz.de/publikationen/Zingrebe2023RoboticWriting/paper.pdf`); earlier brush-
calligraphy stroke extraction work surveyed e.g. `https://kops.uni-konstanz.de/` (see search trail in §8).

### 4.3 Contour tracing / marching squares
`contourpy` (marching squares; also what matplotlib uses) or `cv2.findContours`; `potrace` for simplification
into Béziers. Used **after** a mask partition to get SVG. Pitfalls: pixel-scale staircase → need smoothing
(repo's title pipeline smooths centerlines/radii, and pathops output is already smooth); holes need fill rule;
potrace drops "turd" components under `turdsize` px (keep 1–2 so thin brush tails survive); passing the mask
in the wrong polarity (potracer inverts internally) silently traces the background.

### 4.4 Vector-domain boolean partition (the repo's approach — strongest for "exact")
`tools/gen-title-strokes.py` already does: glyph = pathops path from the Yuji Boku SVG; per-stroke
`tube_i = ∪ disks(centerline points, cover_radius + 4)`; then in writing order
`part_i = remaining ∩ tube_i; remaining -= part_i`, leftover appended to the last stroke.
This is **exact by construction**: `∪ part_i = glyph`, parts disjoint, no raster error, no cross-bleed.
The dev-proof we reproduced independently (§6.2) gives `Σ area(part_i) == glyph.area` to <0.01 units²
(0.0 %) with leftover 0 — with pathops 0.9.2, fontTools 4.68 (both already in `.pdfdeps`).
**The one weakness measured:** unconstrained tube radii can let an early stroke's tube swallow a later stroke's
ink. On an unregistered cross-font median set, 規 stroke 9 ended up with **0.19 %** of the glyph and stroke 8
with 3.14 % (§6.2) — i.e. those strokes would pop in already-painted. Fix: cap each point's radius, e.g.
`r_k = min(cover_r_k, 0.55 * min_j∈other_strokes ||p_k - q_j||)`, then validate every stroke's pathops area
against a raster-Voronoi reference and re-expand only strokes that are starved (< ~30 % of reference area).
Also smooth radii along the centerline (repo does this) to avoid scalloped tubes.

### 4.5 Key semantic pitfall — "no other stroke's ink included" is unsatisfiable for overlaps
Strokes genuinely overlap (規's 目 horizontals meet the frame; 律's 聿 horizontals cross the vertical).
A disjoint partition must give each overlap area to **one** owner. For a sequential "write stroke 1…N" reveal,
give it to the **earlier** stroke (the repo's order): then an early stroke never shows a hole, and the final
union is exact; the cost is that a bit of a later stroke's ink is already visible before that stroke completes
(a few hundred px, invisible at title scale). Giving overlaps to later strokes causes visible bites in earlier
strokes — do not do that. Document this priority in the generator.

---

## 5. Question 5 — conclusion for KIRITSU

1. **Keep the existing exact-vector pipeline; do not switch to Hanzi Writer/Arphic data.**
   The repo's `fontTools + skia-pathops` partition is the only approach that guarantees
   *each stroke's own ink 100 % included / no other stroke's ink / union = glyph exactly* simultaneously
   (up to the documented overlap ownership). It also keeps all geometry derived from the OFL Yuji Boku Light
   font, so the only licensing work is attribution (`docs/KANJI_ATTRIBUTION.md` already covers OFL) plus a
   CC BY-SA 3.0 note for KanjiVG-derived centerlines if that data stays in-repo.
2. **Improve, don't replace:** add the radius cap + per-stroke area validation from §4.4; regenerate
   `src/ui/title-stroke-paths.ts` for 規 and 律 (they are 11 + 9 strokes; current generated asset already has
   20 paths for the pair, so this is a refinement of `tools/gen-title-strokes.py`, not new work).
3. **If a mask→SVG step is ever needed** (e.g. hand-drawn or screenshot-derived masks): use **contourpy**
   (already in `.pdfdeps`, BSD) + even-odd; use **potracer** only as a dev-time smoother (GPLv2+ — do not
   bundle the library in the app). Do not pick `potrace`/`pypotrace` (not on PyPI / no wheels); `vtracer`
   works only via its file API in the cp314 wheel.
4. **Effort estimate:** A ≈ 1–2 h (generator patch + validation + visual overlay), risk low; the only real
   risk is mis-registering centerlines to Yuji's brush shapes — mitigated by the repo's existing EDT offset
   search + local snap, plus the area-validation loop. B (runtime) is already done; no action.
5. **Do not** spend effort on: Hanzi Writer data geometry (wrong font, copyleft data), `potrace`/`pypotrace`
   Python bindings (absent), pure-CLI potrace (not installed), skimage hole classification (manual work, no
   advantage over contourpy/cv2 here).

---

## 6. Prototype evidence (real Yuji Boku Light glyphs, Python 3.14)

Artifacts (all under `/tmp/stroke-research/`): `proto2.py` (full script), `data/proto-report.json`
(machine-readable results), `data/exact-pathops-規.svg` / `-律.svg` (per-stroke vector partition, one colour
per stroke), `data/voronoi-規.svg` / `-律.svg` (raster Voronoi masks vectorized with potrace, one colour per
stroke), `data/mask-規.pgm` / `-律.pgm`, `logs/pip.log`, `logs/install.log`, `data/*.json` raw downloads.

Inputs: `YujiBoku-KIRITSU-subset.ttf`, rendered at 512×512 (font 384 px); centerlines for the demo were the
**Hanzi Writer medians** mapped by bbox (deliberately unregistered cross-font reference — this is the
worst-case reference-quality test; the repo's own KanjiVG + EDT-registered centerlines are much better
registered).

### 6.1 Raster Voronoi partition (owner map)
| | 規 | 律 |
|---|---|---|
| glyph ink pixels | 34,787 | 32,338 |
| HZW strokes / medians | 11 / 11 | 9 / 9 |
| every ink pixel owned (partition) | **True** | **True** |
| nearest-centerline distance mean / p90 / max (px) | 15.9 / 29.8 / 52.5 | 20.8 / 37.8 / 59.4 |
| per-stroke pixels | 3461,2299,5180,1510,2075,4328,2299,2094,933,3122,7486 | 2387,3107,3505,3903,3006,3153,3442,5212,4623 |

The mean 16–21 px distance is the **cross-font misregistration penalty** (median glyphs from Arphic Kai
projected onto Yuji Boku brush shapes) — exactly why copied centerlines must be registered/snapped or
hand-authored; the repo's `offsetSearch` + local EDT snap is the right mitigation.

### 6.2 Exact pathops partition (repo's method, reproduced) — union/disjoint verification
| | 規 | 律 |
|---|---|---|
| glyph outline area (font units²) | 235,515.3 | 219,172.2 |
| Σ area(part_i) | 235,515.2 | 219,172.2 |
| error | **−0.0 %** | **−0.0 %** |
| leftover assigned to last stroke | **0.0** | **0.0** |
| union == glyph / disjoint | **True / True** | **True / True** |
| stroke area share (%) | 11.1, 9.5, 13.2, **3.2**, 11.3, 17.2, 6.2, **3.1**, **0.19**, 7.2, 17.8 | 7.6, 13.6, 7.4, 21.0, 7.2, 10.4, 11.2, 12.4, 9.4 |

⇒ exactness is real (0.0 % union error, 0 leftover), **but** the 0.19 %/3.1 % shares for 規's inner 目 strokes
are the "starved stroke" bug: those strokes' tubes were swallowed by earlier frame strokes because radii were
unconstrained cross-font values. The radius cap + validation (§4.4) is the fix. (With the repo's registered
centerlines the effect is much smaller, but the validation is cheap insurance.)

### 6.3 Raster→vector approximation (if masks are vectorized anyway)
| | 規 | 律 |
|---|---|---|
| whole-glyph cv2 `RETR_CCOMP` | 2 outer + 1 hole, net area 33,185.5 px² (ink 34,787) | 3 outer + 2 holes, net 30,819.0 px² (ink 32,338) |
| potrace union of 11/9 per-stroke masks vs ink | **−0.47 % area error** (32,214.4 vs 34,787 px² incl. overlap duplicates) | **−0.38 %** |
| per-stroke path sizes (potrace `d` chars total) | 11,661 | 10,181 |

At 512 px a mask→vector round-trip is ~0.4 % off; that is fine for colouring/debug but not "exact". At
2048–4096 px and with pathops clipping to the true glyph outline the error shrinks, but it stays approximate:
**the vector-domain pathops partition is the only exact route** — use it.

---

## 7. Answers in one line each

1. **HZW/MMH:** both have 規 (11 strokes+medians) and 律 (9+9) as filled outlines + medians; data is
   Arphic-derived and under **Arphic Public License 1999** (copyleft-style: keep ARPHICPL.TXT, modifications
   must be "Freely Available as a whole" under APL; commercial redistribution allowed, no NC clause).
   Using it only as a *stroke-order fact reference* then drawing Yuji geometry is clean; transforming and
   shipping the medians is effectively an APL adaptation. And practically it is the wrong font and PRC order.
2. **KanjiVG:** per-stroke **centerlines** (fill:none; stroke-width:3), 規 11 / 律 9, Japanese order +
   `kvg:type`; **CC BY-SA 3.0** ⇒ attribution + share-alike on adapted coordinates.
3. **Tools on Py3.14:** contourpy, vtracer, opencv-python-headless, scikit-image, potracer all install with
   cp314 wheels (verified by `pip download --only-binary=:all:` RC=0 and by import); `potrace`/`pypotrace` do
   not exist as installable PyPI packages here. Best mask→SVG: **contourpy** (already in `.pdfdeps`, BSD,
   holes via even-odd) or **potracer** for Béziers (GPLv2+, dev-time).
4. **Algorithms:** raster Voronoi/nearest-centerline ownership (already in `kanji.ts`) = simple, pixel-exact;
   EDT+watershed = fallback/skeleton aid; contour tracing (contourpy/cv2/potrace) = mask→SVG; **vector pathops
   sequential tube partition = exact, already in the repo**. Pitfalls: cross-font misregistration, stroke
   starvation from fat tubes, overlap-ownership semantics, pixel staircases, hole fill rule, vtracer cp314
   segfault.
5. **Recommendation:** keep/refine the repo's **pathops tube partition** (add radius cap + per-stroke area
   validation; license-safe, exact) — 1–2 h; fallback = existing **raster Voronoi** in `kanji.ts` (already
   works). Avoid Arphic data for geometry.

---

## 8. Sources / raw evidence

**Downloads (HTTP status + size recorded in `/tmp/stroke-research/logs/downloads.log`)**
- Hanzi Writer data 2.0.1: `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/%E8%A6%8F.json` (200, 3278 B),
  `.../%E5%BE%8B.json` (200, 2996 B); raw `https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/data/%E8%A6%8F.json` (200, 3278 B) — repo `data/` subdir, master branch.
- HZW README/license: `.../chanind/hanzi-writer-data/master/README.md` (200), `.../APL/english/ARPHICPL.TXT`
  (200, 6901 B), npm `package.json` v2.0.1 (`"license": "SEE LICENSE IN ARPHICPL.TXT"`).
- Make Me a Hanzi: `https://github.com/skishore/makemeahanzi`, `graphics.txt` (200, 30,778,076 B),
  `COPYING` (200, 1016 B), `README.md` (200, 9268 B, format+license+PRC-order notes).
- KanjiVG: `https://github.com/KanjiVG/kanjivg`, `kanji/0898f.svg` (200, 4074 B), `kanji/05f8b.svg`
  (200, 3884 B), `README.md` (200, 2528 B), `COPYING` (200, 20596 B, CC BY-SA 3.0 full text).
- Arphic Public License: `https://spdx.org/licenses/Arphic-1999.html` (full text captured);
  canonical copy `http://ftp.gnu.org/gnu/non-gnu/chinese-fonts-truetype/LICENSE`.
- Research trail (web search): StrokeStyles, ACM TOG 2022 `https://dl.acm.org/doi/10.1145/3505246`;
  Zingrebe et al. robotic brush-writing with skeleton/Voronoi glyph graph
  `https://graphics.uni-konstanz.de/publikationen/Zingrebe2023RoboticWriting/paper.pdf`;
  related calligraphy stroke-extraction work on `https://kops.uni-konstanz.de/`.

**Local only (no repo modification):** repo files read for context: `src/ui/kanji.ts` (raster Voronoi
`planStrokes`), `tools/gen-title-strokes.py` (pathops partition), `docs/KANJI_ATTRIBUTION.md`,
`stories/kiritsu/fonts/YujiBoku-KIRITSU-subset.ttf`; PyPI/tooling evidence in `/tmp/stroke-research/logs/`.
