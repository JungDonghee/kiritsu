# QA — browser, debugging, UX audit

> 브라우저 QA·디버깅·UX 감사 절차와 결과. 브라우저/설치/오프라인 실측은 여기서 소유한다.

> **통합 문서.** 원본은 아래 부록으로 병합됐다(과거 기록은 git 이력에 남는다).


---

## 브라우저 QA (구 BROWSER_QA)

KIRITSU (VIMLORE) is checked in a real browser locally. **Playwright is a dev-only tool**;
the shipped bundle still has zero runtime dependencies.

### One-time setup

```bash
npm install                 # installs the playwright dev dependency
npm run browser:setup       # downloads Chromium to ../.kiritsu-browsers
```

The persistent browser cache is outside the repo at
`/home/jung/ai_station/sandbox/.kiritsu-browsers` (~862 MB). It survives a
reboot; `browser:setup` is only needed on a fresh machine. If the cache is
missing, `browser:qa` prints the launch error and the setup command.

### Run

```bash
npm run build
npm run browser:qa          # 1920x1080 desktop tube (default)
npm run browser:qa -- --mobile  # 390x844 phone
```

It starts an ephemeral static server for `dist/`, drives
title → map → chapter → intro → play → ghost, writes screenshots to `docs/browser/`,
and measures the ghost:

```
ghost perf (desktop): {"frames":118,"spanMs":2050,"rafFps":57.6,"drawFps":57.6}
ghost perf (mobile):  {"frames":113,"spanMs":1866,"rafFps":60.5,"drawFps":60.5}
```

`browser:qa` fails if requestAnimationFrame or canvas draw FPS is below 50, or
if the page logs an error. It is intentionally **not** in CI: GitHub's headless
runner has no GPU and the browser binary is large. Run it on the Fedora machine
before shipping UI changes.

### What it already caught

- ghost HUD overlapped the statusline on 390×844
- the ghost result was not held long enough to be visible
- fractional cursor tween values corrupted the relative line-number gutter
  (fixed with an FX-only `cursorDraw`; gutter/highlight use the real cursor)
- ghost redraw previously waited for the 530 ms cursor blink

### Limitations

- Headless Chromium on CPU; not a phone GPU, not a full visual review.
- Default viewport is 1920×1080 (desktop); `--mobile` uses 390×844. DPR 1.
- Mobile screenshots are `docs/browser/mobile-*.jpg`; desktop `desktop-*.jpg`.
- No automated screenshot diff yet; screenshots are artifacts for a human or
  vision-capable reviewer.


---

## 디버깅 (구 DEBUGGING)

When `oracle`, `matrix` or `state-matrix` reports a mismatch, find where the
divergence is **born** instead of staring at the final state.

### Prefix trace

```bash
npm run trace -- --case=m-5728
npm run trace -- --case=m-5728 --all
npm run trace -- --text="foo bar" --cursor=1,2 --keys="d2w"
```

`trace` runs the sequence through real Vim and the engine, capturing buffer,
cursor, unnamed register and register type after **every token prefix**. The
first prefix with a different observable state is printed.

Example (`c)` on a blank-separated buffer):

```
prefix 1 "c"  ok
FIRST DIVERGENCE at prefix 2 "c)" fields=reg,regtype
  vim {"reg":"a\n","cursor":[1,0],"lines":["","","b","","c"],"regtype":"linewise"}
  eng {"lines":["","","b","","c"],"cursor":["..."] ,"reg":"a","regtype":"charwise"}
```

That immediately says the bug is in the **linewise conversion of a sentence
change**, not in the insert or undo tail.

`--case` uses the same generated cases as `state-matrix`/`matrix`; otherwise
pass `--text`, optional `--cursor=line,col`, and `--keys`.

### What it does not cover yet

- Mode is not compared (`vim -es` reports `c` for `mode()`); the state matrix
  documents this limitation.
- The per-prefix trace compares buffer/cursor/register, not the state after
  `u`. Use `state-matrix` for final undo divergences.
- A shrinker is not built yet: once the first divergent prefix is known, trim
  keys/text by hand or with a future `tools/shrink.ts`.

The tool is local-only; it never enters the runtime bundle.


---

## UX 감사 (구 UX_AUDIT)

Automated with `npm run browser:audit` (Playwright + Chromium 131, local-only),
then reviewed screenshots. Viewports: **1920×1080 (desktop, default)**,
390×844 (phone), 320×568 (small phone). Screens: title, map, chapter picker,
intro, play, hint, exit prompt, ghost HUD/result, results, trials, codex,
progress, settings.

### Result

```
audited 38 screen/viewports; 0 with overflow; 0 page errors
```

The phone/desktop screenshots are in `docs/browser/audit/` and
`docs/browser/desktop-*.jpg`; raw findings are in `docs/generated/UX_AUDIT.json`.

### Fixed in this pass

- desktop play was a tiny canvas in the top-left of a 1920 window → the CRT is
  now a centered **1150×720 tube**; scanlines/vignette stay, the moving beam is
  disabled on desktop only for frame budget
- chapter/stage picker added: cleared stages replayable, future stages sealed
- 320px map footer chips and topbar meta overflowed → wrapping/ellipsis rules
- ghost HUD collided with the statusline → sits above it
- ghost result needed a visible hold → final cleared state is held 1.4s
- fractional ghost tween polluted relative gutter numbers → FX-only
  `cursorDraw`; gutter/highlight use the real Vim cursor

### Frame budget

`npm run browser:qa` on the **1920×1080 desktop tube**: ghost **56 rAF / 56
draw FPS** (headless CPU Chromium; real GPU should be higher). The gate fails
below 50. A 1200×760 tube was borderline (50.5), so 1150×720 was chosen for
margin; the backing canvas is also capped at 700k pixels.

### Remaining honest limits

- Headless CPU Chromium, not a phone GPU or a human visual pass.
- No screenshot-diff regression yet; screenshots are artifacts.
- The audit checks horizontal overflow, page errors and FPS, not subjective
  contrast/readability.
