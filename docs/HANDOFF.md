# HANDOFF — KIRITSU current state (subtitle VIMLORE)

> **Last rewritten:** 2026-11-17 (title v15 + mobile keyboard session).
> This supersedes all earlier state snapshots. The previous long handoff is
> archived at [`archive/HANDOFF_2026-11-15.md`](archive/HANDOFF_2026-11-15.md)
> — do not quote numbers/priorities from it.
>
> **Read order for a new AI:** [`../FLASH_HANDOVER.md`](../FLASH_HANDOVER.md)
> (quick current task) → this file (project state) → [`../AGENTS.md`](../AGENTS.md)
> (invariants) → [`README.md`](README.md) (doc map). `one-sentence start`:
> run `npm run status:check`, read STATUS, do not change frozen engine/novel/
> levels without an explicit user request.

## 0. One-paragraph state

KIRITSU is a finished-looking, deployable Vim-teaching game (10 chapters, 51
stages, oracle 373/373, all gates green) with a Korean novel and a hand-made
title. The **engine, stages, curriculum and novel are frozen**. The current
active workstream is the **mobile (phone) Vim keyboard**; immediately before
this handoff, the title stroke animation was fixed for a corner-flicker bug and
the chapter screen's Esc/h was fixed to return to the title. Latest delivered
commit at handwriting time: `1f1debe`; live <https://jungdonghee.github.io/kiritsu/>;
live `kiritsu.html` md5 `f5d867cce2f4b6926a18999d7dfae71b` (413,143 B).
Verify these yourself after the docs/handoff commit.

## 1. Gate truth and numeric truth

- **Numbers are not copied here.** [`generated/STATUS.md`](generated/STATUS.md)
  is the single numeric source (oracle/matrix/state/stages/bundle raw).
  `npm run status:check` is a CI gate; regenerate with `npm run status:write`
  after `npm run build`.
- Current status at handoff: all local gates green; `npm run verify` passes;
  `title-check` green (20 strokes, done, headHidden, console 0, FPS 40,
  `--kt-end` 6.16s); bundle **413,143 raw / 130,829 gzip** (ceilings 420,000 /
  140,000). The bundle is close to the ceiling — do not add a large dependency
  or a second keyboard framework.
- Production deploys from `main` via the `pages` workflow. A failed deploy can
  be a **duplicate-artifact** failure after re-running a failed job; fix by
  dispatching a fresh `pages.yml` run or pushing a new commit. Details in
  [`../FLASH_HANDOVER.md`](../FLASH_HANDOVER.md) §6.

## 2. Current title 規律 (data v12, runtime v15)

- Data: [`../src/ui/title-stroke-paths.ts`](../src/ui/title-stroke-paths.ts)
  — 20 hand-traced territories, 30,002 B, union realMissing 0%.
  **Do not hand-edit.** It is generated from the user's cuts + stroke lines.
- Runtime: [`../src/ui/kanji.ts`](../src/ui/kanji.ts) v15.
  - **Monotonic swept mask**: full discs along the travelled path + a rear
    semicircle at the contact point, plus a full end disc at stroke end.
    This replaced the old infinite half-plane cut, which briefly ate already-
    revealed ink at sharp corners (the "stroke flicker" bug). No ink appears
    ahead of the brush.
  - A tiny vector plus-sign cursor and a small circular wet dab (destination-out,
    ~62% at centre) mark the contact. The old radial laser is gone.
  - Per-character acceleration: first stroke pace 1.20 → last 0.58, shrinking
    gaps, one character ≈5.2s, `--kt-end` 6.16s.
  - Finish: a glyph-clipped CRT scanline/beam sweep. v15 softened it (tint
    0.26→0.08, beam 0.85→0.58) so the glyph does not flash as a whole.
- Verification: `node tools/title-check.mjs`, plus frame-alpha sampling
  (mid-animation dips 0; only the final AA coverage drop).
- Navigation: chapter/level-select **Esc and h now go to the main title intro**;
  floor map Esc/h also goes to title; the chapter screen keeps a MAP chip.
- Full spec/history: [`TITLE_KANJI.md`](TITLE_KANJI.md) §11–§14.

### Retracing workflow (only if the user asks)

1. Open the DSH sidebar **規律 boundary tracer**.
2. `✂ 경계` = internal cut lines; `╱ 획 선` = one straight line per stroke in
   order. Cornered strokes are drawn as two touching lines (currently 6+7 and
   16+17); `zones.py` groups them to 20 strokes.
3. Save → `kanji-trace/strokes.json` (+ archive).
4. Run:
   ```bash
   cd /home/jung/ai_station/sandbox/kanji-trace
   PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 zones.py
   ```
   Copy `title-stroke-paths.candidate.ts` to `src/ui/title-stroke-paths.ts`;
   build, `title-check`, verify. Current trace/generator backup:
   `kanji-trace/backup/` (2026-11-17). Treat the user's cuts/lines as assets.

## 3. Current mobile keyboard (active workstream)

- Files: [`../src/ui/mobile-controls.ts`](../src/ui/mobile-controls.ts),
  `.mob-*` blocks in [`../src/style.css`](../src/style.css),
  `kiritsu:mode` event in [`../src/ui/play.ts`](../src/ui/play.ts).
- Mounts only when `(pointer: coarse)` or `navigator.maxTouchPoints > 0`, or
  with `?vk=1` for QA. Desktop has no mobile DOM.
- **Default side rail** on the right; `#app` gets a right inset
  (`--mob-kb-right`) and keeps full height. No Vim keyboard covers the play
  area. Other layouts (grid chip): **side → edge → bar → minimal**.
- **ALL / FOCUS** chip:
  - ALL: SYS/CNT/SYM + MOVE/EDIT/NAV/INS all visible.
  - FOCUS: one semantic page (MOVE/EDIT/NAV/INS/CNT/SYM), page tabs + arrows,
    large near-square keys, font scales with key area. The MOVE page is a
    four-direction compass: `k` north, `j` south, `h` west, `l` east around a
    crosshair, plus `w b e 0 $ ^ * #`.
  - COMMON keys are pinned in a separate footer in FOCUS: Esc, Shift, Ctrl,
    Bksp, Enter, Space, `:`, `/`, F1. In ALL/edge/bar/minimal, SYS carries them.
- INSERT/REPLACE switches the same panel to a compact QWERTY bar. The module
  listens to `PlayScreen.updateStatus`'s `kiritsu:mode` CustomEvent; Esc returns.
- Viewport: side = right inset; minimal/bar = bottom inset; edge = top+bottom.
  The dock lives in the panel header while open, so tools do not cover the game.
- Preferences: `kiritsu.mobileLayout.v2`, `kiritsu.sideMode`,
  `kiritsu.sideFocus`, `kiritsu.mobilePage`, `kiritsu.mobileKeysOpen`.
- CRT skin: phosphor bloom, red/cyan fringe, 1px scanlines, vignette;
  `body.crt-off` removes it. Research/citations and measurements:
  [`MOBILE_KEYBOARD.md`](MOBILE_KEYBOARD.md).
- Refresh chip: unregisters SW, deletes caches, reloads with `?r=`.
- Open items: FOCUS page switching is tabs/arrows only (minimal page has a
  header swipe); target heights (22–24px) are below WCAG 24px on some screens
  but spaced; a “large keys” option is not implemented; ALL is the default mode
  unless the player taps FOCUS.

## 4. Repo architecture (where to change what)

- `src/core/vim/` — diff-tested Vim engine. **Never change semantics without
  oracle/matrix justification.**
- `src/core/game/` — sessions/goals/curriculum runtime.
- `src/content/chapters/c01…c10.ts` — 51 frozen stages. No autonomous edits.
- `src/ui/app.ts` — screens: title → map → chapter → play; input and navigation.
- `src/ui/play.ts` — play screen; emits `kiritsu:mode` for mobile insert mode.
- `src/ui/kanji.ts` — title stroke animation (v15 runtime).
- `src/ui/mobile-controls.ts` — the current mobile keyboard.
- `src/ui/title-stroke-paths.ts` — v12 generated title data.
- `tools/` — oracle, level lint, title-check, status/docs generators, browser QA.
- `docs/` — documentation map; `docs/generated/` never hand-edited;
  `docs/archive/` is history only.
- `stories/kiritsu/` — novel canon; frozen for this workstream.

## 5. Verification and deployment

```bash
cd /home/jung/ai_station/sandbox/kiritsu
npm run status:check
npm run verify
npm run budget
node tools/title-check.mjs
```

Commit/push and live checks are documented in
[`../FLASH_HANDOVER.md`](../FLASH_HANDOVER.md) §6. Remember:
- run `npm run build` and `npm run status:write` before committing code;
- bump `public/sw.js` `VERSION` when shell/UI code changes (currently v25);
- never print tokens; use the askpass file;
- Pages deploy failures from duplicate artifacts need a **fresh** run;
- verify the live md5 equals `dist/kiritsu.html`.

## 6. What is frozen / forbidden

1. Vim engine semantics, stage solutions/par/goals, curriculum, first-clear
   determinism. Report issues; do not "fix" by changing levels.
2. Novel/story canon; no autonomous creative work on it.
3. Title asset `public/kanji/ou-guilv-tight.svg` (Yuji Boku Light cut) and
   v1–v8 automated mask generators. Do not reintroduce them.
4. Bundle ceilings 420,000 raw / 140,000 gzip; no new dependencies for a
   keyboard, no server.
5. Secrets (`/.secrets/*`); no output. No force-push/history rewrite.
6. `docs/generated/*` hand edits; no unregistered root docs.

## 7. Where to start next

- If the user is commenting on **keyboard feel/layout**: read
  [`MOBILE_KEYBOARD.md`](MOBILE_KEYBOARD.md), take a phone-landscape screenshot,
  and change one variable at a time (key size, font scale, CRT intensity,
  default mode, page switching). Do not redesign all layouts unprompted.
- If the user is commenting on **title strokes/flash/timing**: use
  `title-check` + frame-alpha sampling; read `TITLE_KANJI.md` §14; verify no
  ink dips before/after.
- If the user is commenting on **navigation/levels**: `src/ui/app.ts` screen
  branches; do not change engine/levels to fix UI navigation.
- If the user is commenting on **bundle/live staleness**: refresh via ⟳; verify
  Pages and md5; never assume a successful commit means the phone has it.

## 8. Doc map

[`README.md`](README.md) (docs/ map) → this → `AGENTS.md` → `NORTH_STAR.md` →
`ROADMAP.md` → `VIM_COVERAGE.md` → `generated/STATUS.md`.
Specific: `TITLE_KANJI.md` (title), `MOBILE_KEYBOARD.md` (mobile),
`ARCHITECTURE.md` (code), `CURRICULUM.md` (stages), `PWA.md` (install/offline),
`QA.md` (browser QA), `DEBT.md` (engine debt), `ONE_MESSAGE.md` (kickoff).
Old handoff: `archive/HANDOFF_2026-11-15.md`; old flash: 
`archive/FLASH_HANDOVER_2026-11-15.md`.
