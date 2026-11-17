# KIRITSU — design notes (final title)

## Rule

**Kanji is the name.** `規律` is the only masthead. `kiritsu` is a code
identifier in the boot strip, not a corner label. Russian lettering was removed:
it did not belong to the CRT vector language.

## Title

- **Ouyang Xun brush**: real Ouyang-style scans of 規/律, cleaned, vectorised,
  then normalised into equal cells so the pair reads as one word. No red seal
  box, no hanko frame, no duplicate colour per glyph.
- **Vector-brush write**: bootlog types; a small CRT vector crosshair writes the
  strokes with a pale wet edge; a glyph-clipped scanline/beam finishes it; caption
  and press rise.
- **CRT vector display**: 80 px phosphor grid, scanlines, a slow beam sweep,
  monospace telemetry, phosphor green text, case/redaction accents.
- **Sakura**: petals only. The organic branch was removed because its curves
  fought the vector display.
- **Code-native name**: `CALL kiritsu` in the bottom assembly strip. The code
  is part of the design, not decoration in a corner.
- **Numbers**: `2006.06.23`, `판결 4,112`, `MOV EAX, 0x0623`.
- **Layout**: original KIRITSU vertical axis — bootlog, kanji, caption,
  tagline, press; metadata rails at top and bottom.

## Colours

| token | use |
|---|---|
| `#050b08` | CRT black |
| `#a9ffc5` / `#c9ffda` | phosphor / telemetry |
| `#f2d8c9` | Ouyang ink |
| `#ff5a72` | vector cursor, case, open line |
| sakura `#ff9fba` → `#ffe0e8` | falling petals |

## Responsive

- Desktop: centered 430 px kanji stage, bootlog, code strip.
- Short landscape: 300 px stage, one-line code strip, compressed bootlog.
- Portrait: landscape gate.
- Reduced motion: no beam, full ink, no petal animation.

## Asset pipeline

- Ouyang scans → component clean → Potrace → balanced cell SVG.
- Title SVG is inlined into `dist/kiritsu.html`; the hosted build loads it as a
  normal public asset.
- PWA icons remain the red seal `規律`; favicon is the K seal.

Attribution: [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md).


---

## UI 벡터·CRT (구 UI_VECTOR_CRT)

> P2. Do not start until P0/P1 are green; performance is non-negotiable.

### Feel

A **vector display inside a failing CRT terminal**, not a retro filter:
phosphor geometry, thin luminous rules, calibrated crosshairs, angular
instrument frames, a subtle grid that appears only where it helps reading.
Hacker-terminal, not cyberpunk neon.

### Shipped first increment

- Static instrument frame + exposed corner rules around the play buffer
  (`.board::after`), no JS and no per-frame work.
- Low-opacity vector grid in the buffer field (`.board::before`), static CSS.
  Browser QA ~57 FPS; audit 38 screens clean; bundle stayed under 278k. The
  frame/grid opacity and corner lengths were strengthened without adding bytes.

### Cheap, measurable ideas

- Vector corner brackets / a thin instrument frame around the play buffer,
  drawn with static CSS or the cached renderer layer (no per-frame allocations).
- A low-opacity coordinate grid or crosshair in empty buffer margins; it must
  never reduce text contrast.
- Statusline as an instrument readout: `NORMAL`, coordinates, GOLF par/best.
- CRT beam returned only if the frame budget survives; desktop beam currently
  off for performance.
- Motion is restrained: cursor tween, phosphor afterglow, no screen-shake spam.

### Hard constraints

- Mobile 390×844 must remain ≥50fps (current 57.5 desktop headless; measure).
- Desktop headless ≥50fps; no 144 claim without a 144Hz/GPU measurement.
- Zero runtime dependencies; bundle ceiling is a gate. Any raise needs a
  measured reason and a before/after FPS/profile.
- `body.crt-off` still looks intentional; no effect may bypass the CRT setting.
- Keyboard-first; no hover-only affordance.

### Order

1. Performance profile current play/map/results.
2. Static vector frame + HUD readout (cheapest).
3. Grid/reticle experiment, measured.
4. Only then animation/bloom changes.


---

## 한국어 문체 (구 KOREAN_STYLE)

All Korean user-facing copy uses **해라체 (plain/banmal)**. No honorifics, no
polite endings, no `-요`.

### Register

- **Narration:** present plain `-다`. “시스템이 법이다.” “로그가 곧 법이다.”
- **Instruction:** `-아라 / -어라` or a nominal command. “커서를 옮겨라.”
  “아무 키나 누른다.”
- **Dialogue:** banmal. “늦었군.” “묻지 마라.” “지금이다.”
- **UI labels:** short noun/plain form. “시작”, “재시작”, “나가기”.
- **ORACLE:** bracketed plain diagnostics. `[oracle] 삭제할 수 있다.`
- **REGISTRAR:** regulation prose in plain form, not polite service voice.

### Forbidden endings

`-습니다`, `-입니다`, `-합니다`, `-됩니다`, `-드립니다`, `-아닙니다`,
`-세요`, `-해요`, `-주세요`, `-십시오`, `-까요`, `-네요`, `-어요`, `-아요`,
`-시다`, and honorific `-시-` forms.

### Examples

| wrong | right |
|---|---|
| 아무 키나 누르세요 | 아무 키나 누른다 |
| 물리 키보드가 필요합니다 | 물리 키보드가 필요하다 |
| 이 작업은 되돌릴 수 없습니다 | 되돌릴 수 없다 |
| 영문 입력으로 바꿔 주세요 | 영문 입력으로 바꿔라 |
| 모든 진행을 지울까요? | 모든 진행을 지운다? |
| 챔버를 떠날까? | 챔버를 떠난다 |
| 마지막 줄을 만지지 마십시오 | 마지막 줄을 만지지 마라 |

### Enforcement

```bash
npm run korean:check
```

Scans `src/**/*.ts` and `public/pwa.js` (game-facing Korean UI text). CI runs
it after `doc-check`. The novel manuscript under `stories/kiritsu/` is
deliberately **not** scanned: its characters legitimately use mixed registers
(츠키[月] speaks 존댓말, 칸노[監能] is 격식체). When story text is ported into the
game, the integrated `Localized.ko` strings live in `src/` and are scanned.
The rule is lexical, not stylistic: if a forbidden ending appears, the gate
fails.
