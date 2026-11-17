# KIRITSU mobile keyboard — research notes & layout

The phone keyboard is not a QWERTY clone. It is a **Vim command surface** first,
with a familiar QWERTY layer only for INSERT/REPLACE text. This note records the
research that drove the layout, the resulting decisions, and the measurements
we verify.

## 1. What the literature says

### Fitts's law — distance and target width
Fitts's law models the time to acquire a target as a function of **distance to
the target** and **target width**: `ID = log2(D/W + 1)`, with movement time
linear in `ID` (Shannon form used in HCI and ISO 9241-9). The practical result
for a keyboard: keep frequent keys close to the resting thumb and make them
wide; long reaches and narrow targets cost time and errors.
Sources: [Fitts's law overview](https://en.wikipedia.org/wiki/Fitts%27s_law),
[ISO 9241](https://en.wikipedia.org/wiki/ISO_9241).

### Minimum touch targets and spacing
WCAG 2.2 **2.5.8** requires at least **24×24 CSS px**, or sufficient spacing
(24px circles centred on adjacent undersized targets may not intersect); the
enhanced **2.5.5** recommends **44×44 CSS px** for important controls. On a
game screen that must keep the play area readable, the keyboard deliberately
uses compact targets with separation; edge/dock controls are larger, and the
layout is toggleable. Sources:
[2.5.8 (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
[2.5.5 (enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html).

### Thumb zones & holding posture
Hoober's 1,333 street observations: **49% one-handed, 36% cradled, 15%
two-handed**; thumbs drive about **75%** of phone interactions. The easy,
accurate zone is at the bottom / side opposite the thumb; the top of the screen
is the stretch zone. Two-thumb grips create mirrored overlapping zones at the
bottom. The design consequence: put high-frequency controls near the bottom
corners/sides, not at the top. Sources:
[Hoober, UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php),
[Clark, A List Apart](https://alistapart.com/article/how-we-hold-our-gadgets/),
[Smashing thumb-zone summary](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/).

### Split, two-thumb optimisation (KALQ)
KALQ is a **split-screen keyboard optimised for two-thumb typing**; the
researchers used a model of thumb movement to search millions of layouts. The
key ideas: **minimise long sequences typed by one thumb**, place frequent
letters centrally, and encourage simultaneous/alternating thumb movement. The
reported gain after practice was **34% over QWERTY** (≈37 wpm). This supports
splitting the keyboard into left/right hand territories rather than one central
strip. Sources:
[MPI press release](https://www.mpi-inf.mpg.de/news/press-release-articles/2013/new-keyboard-for-touchscreens),
[KALQ overview](https://en.wikipedia.org/wiki/KALQ_keyboard).

### Large typing datasets & familiarity
The 136-million-keystroke study found that **hand alternation and rollover**
correlate with faster typing and that typist styles vary a lot. For free text,
users already own QWERTY skill; making INSERT mode a compact QWERTY (rather than
teaching a new letter layout) preserves that transfer. Source:
[Dhakal et al., CHI 2018](https://userinterfaces.aalto.fi/136Mkeystrokes/).

### Vim grammar
A Vim normal command is roughly **[count] [operator] [motion/object]**. The
keyboard mirrors that grammar: a thin **count/symbol rail**, a **MOVE** zone
(left hand), an **EDIT** zone (right hand), **NAV** for find/line motions, and
**INS** for mode/insert/visual keys. Grouping by role uses spatial memory and
avoids scanning a flat alphabet. Reference: `:help operator` in Vim.

## 2. KIRITSU-specific audit

- 51 stages; early chapters explicitly teach motions (`h j k l`, `w b e`) before
  operators and insert skills; the command gate means the keyboard must cover
  normal, visual, operator-pending, insert and cmdline/search modes.
- The mobile loop is landscape, thumbs on the lower corners. A full-width
  bottom bar is readable but permanently costs ~21–27% of the 430px landscape
  height and covers the statusline.
- The game already dispatches every action through `KeyboardEvent`s, so a
  mobile surface can emit synthetic keys and every screen/metadata path keeps
  working.

## 3. Creative directions considered

These are the ideas that survived the research pass. The **side rail** is the
current default; the minimal split pad is the compact alternative, and the
remaining ideas stay as documented future work.

1. **Minimal split pad with pages (compact alternative).** One command row split into
   MOVE (left thumb) and EDIT (right thumb), a thin SYS/CNT/SYM rail, and
   MOVE·EDIT ↔ NAV·INS pages swapped by tabs or a header swipe. This is the
   smallest layout that still lets a two-key command (`d w`) be typed without a
   page change. Height: **68.5px** at 900×430.
2. **Side rail (current default).** A full-height vertical Vim panel on the right
   edge: SYS/CNT/SYM at the top, then MOVE/EDIT/NAV/INS as 4×2 grids. Nothing is
   on the bottom, the game viewport keeps full height and narrows by the rail
   width; this is the layout that best matches Vim's horizontal text. The game
   stays immersive because the rail is outside the play area, not across it.
3. **Edge clusters.** SYS top, CNT/SYM bottom, MOVE/EDIT by the thumbs, NAV/INS
   above them. Uses screen edges instead of vertical height, keeps the centre
   more open, and is one grid-chip away. It overlays the play-area corners.
4. **Compact bar.** The full 3-row keyboard with zones; one grid-chip away.
5. **Grammar-aware auto-page (future).** Emit Vim `op`/`pending` state and
   switch pages automatically: after `d/c/y` show motions, after `f/t/r` show
   the character page, after a count keep the motion page. The engine already
   exposes `vim.op` and `vim.pending`, so this is a UI-only addition.
6. **Radial thumb pad (future).** A flick pad around each thumb for h/j/k/l +
   diagonals, with a compact operator cluster. MessagEase/Flick-style, very
   small, but a new motor skill to learn.
7. **Adaptive next-key suggestions (future).** Show the 4–6 most likely next
   keys based on Vim grammar + current pending state instead of the full page.
8. **Long-press chords (future).** Long-press `d` then swipe to a motion to
   issue `dw` without a second tap. Nice for experts; hard to discover.
9. **Haptics + key landing telemetry.** Vibrate on keydown; record actual
   landing coordinates on a real device and re-optimise zone positions using
   KALQ-style optimisation with KIRITSU's own command frequencies.

## 4. Current layout (default = side rail)

```
                                    ┌ SYS ──────────────┐
                                    │ Esc : / F1        │
                                    │ Ctrl Shift Bksp   │
                                    │ Enter Space       │
                                    ├ CNT 1 2 3 4 5 ────┤
                                    │ 6 7 8 9           │
                                    ├ SYM . , - = ` ────┤
                                    ├ MOVE ─────────────┤
                                    │ h j k l           │
                                    │ w b e 0           │
                                    ├ EDIT ─────────────┤
                                    │ d c y x           │
                                    │ p u r s           │
                                    ├ NAV ──────────────┤
                                    │ $ ^ g f           │
                                    │ t ; , %           │
                                    ├ INS ──────────────┤
                                    │ i a o v           │
                                    │ q z m n           │
                                    └───────────────────┘
```

- **All zones are on the right edge simultaneously**; no bottom keyboard bar and
  no page switching in the default layout. This keeps the full **430px height**
  for the game and puts the rail outside the terminal, so the player's attention
  stays in the buffer.
- The game viewport is narrowed from the right (`--mob-kb-right`, ~234px), never
  covered; the title, map and play screens reflow into the remaining width.
- SYS/CNT/SYM are at the top of the rail; the four command clusters use 4×2
  grids for one-thumb/edge reach. Every key is visible at once; Shift labels
  reveal uppercase/symbols and the count digits stay available.
- The panel header carries the keyboard/layout/refresh/close chips; it is inside
  the rail, not over the game.
- **INSERT/REPLACE** temporarily raises the compact QWERTY bar at the bottom
  (full typing needs a wider surface); Esc returns to the all-side Vim rail.

### Alternatives (grid dock chip cycles)

### Alternatives (grid dock chip cycles)

| layout | shape | height / footprint | notes |
|---|---|---|---|
| **side** | full-height right rack (SYS/CNT/SYM + four 4×2 command clusters) | ~230px wide, top to bottom | **default**; reserve right only; full game height |
| **minimal** | one row + thin rail | **73px** | alternate; page tabs/swipe; reserve bottom 75px |
| **edge** | SYS top, CNT/SYM bottom, side clusters | top≈31 / bottom≈27 / clusters≈57×220 | alternate; reserve top+bottom; corners overlay |
| **bar** | 3 rows + rail | 94px Vim / 123px QWERTY | alternate; all zones at once |

The choice and page are stored in `kiritsu.mobileLayout.v2` /
`kiritsu.mobilePage` so a phone keeps its preference.

## 5. Measurements (headless 900×430 landscape)

| thing | value |
|---|---|
| side rail | **~230 px wide, full 430px height**; game viewport ~666×430 |
| minimal split pad | **73 px** (~17% of 430) |
| compact bar (Vim) | **94 px** (~22%) |
| compact bar (QWERTY) | **123 px** (~29%) |
| previous one-strip keyboard | 124 px (4 rows); ~250 px when both layers were visible |
| edge layout | SYS ≈31 px top, CNT/SYM ≈27 px bottom, clusters 57×220 px |
| target sizes | command-row keys 24×~50; strip 17–18 px tall; dock 26–30 px; spacing exception under WCAG 2.5.8 |
| viewport | `#app` right reserve for side; bottom for minimal/bar; top+bottom for edge; insert uses QWERTY bar |

## 6. Implementation map

- `src/ui/mobile-controls.ts` — zone data, pages, edge/bar/minimal layouts,
  swipe/tabs, Shift labels, viewport reservation, refresh.
- `src/ui/play.ts` — emits `kiritsu:mode` from `updateStatus` (live insert
  only; ghost/menus excluded).
- `src/style.css` — `.mob-vk`, `.mob-vk.edge`, `.mob-vk.minimal`,
  `--mob-kb-*`, `#app` reservation.
- `public/sw.js` — cache version bumped when the keyboard shell changes.

## 7. Open questions

- The minimal split pad hides NAV/INS behind a page; first-time players need a
  visible hint. A one-shot coach mark (“swipe the header to switch pages”) is
  the next UX polish.
- Edge clusters overlay the play-area corners; keep the grid chip discoverable
  and consider making clusters resizable/foldable if playtesting shows text is
  hidden.
- Target height is below 24px on the shortest landscape screens; spacing is
  deliberate. A “large keys” mode could be a future accessibility option.
- Grammar-aware auto-pages need `op`/`pending` in the mode event; the engine
  already has the data.
- Telemetry/landing-point capture would let us re-optimise with KALQ-style
  optimisation on KIRITSU's own command distribution.
