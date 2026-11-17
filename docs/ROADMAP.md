# ROADMAP — upgrade program, next steps, puzzle devices

> 제품 우선순위의 정본. **2026-11-17 현재 활성 작업은 모바일 Vim 키보드
> (side rail/ALL·FOCUS/CRT)와 타이틀 애니메이션 피드백 반영**이며, 아래 장기
> 순서(스토리 캐논 → story vertical slice → LIVE/PUZZLE → 통합 → PV-FULL →
> Modern Vim)는 그대로 유효하다. 캠페인 결정론·par는 동결.

> **통합 문서.** 원본은 아래 부록으로 병합됐다(과거 기록은 git 이력에 남는다).


---

## 업그레이드 마스터 플랜 (구 UPGRADE_MASTER_PLAN)

> Status: design contract, written **before** implementation (2026-11-13).
> The current green state (51 of 51 stages, oracle 373, PWA) is frozen while
> this plan is executed. Do not mix a new gameplay system with campaign gates
> in one unverified change.
>
> Ordering decision: **story canon → story vertical slice → LIVE/puzzle
> systems → integrated story → full Practical Vim engine**. The story direction
> and first scene are validated before feature work; the game systems are then
> built against it, not as a skin. The engine comes after the game is worth
> playing.

### 0. One-screen decision

| question | decision |
|---|---|
| Do dynamic bugs/walls/health go into the 51 campaign stages now? | **No.** Campaign stays deterministic and oracle-clean. |
| Where does the dynamic system live first? | A separate **LIVE CIRCUIT** arcade mode using the same Vim engine and a generated arena. |
| What is "Practical Vim full"? | A written **PV-FULL** contract: every one of 123 tips is playable, a verified drill, or an explicitly environment-deferred row with a feature backlog. No unknown gaps. |
| What is the story? | An AI-only cyberpunk noir: humanity is extinct and the system **KIRITSU[規律]** is the law. The judge **리츠[律]** receives **vim** — a tool the system does not know — and reports it at once; the verdict *근거 부적합* and the 판결 4,112→4,115 chain(+4,116: 12장 준비 후 근거 부적합) follow, ending in the 제1조 collapse. See [`STORY_BIBLE.md`](STORY_BIBLE.md) and [`stories/kiritsu/HANDOVER.md`](../stories/kiritsu/HANDOVER.md). The novel is the story-mode source; the game is played from 리츠[律]'s point of view. |
| What is the first shippable slice? | One LIVE arena: moving bugs, red walls, corruption, health, timer, score, pause/accessibility, no campaign changes. Then one puzzle room with one-shot floors/plates/effect locks. |
| What is explicitly not first? | Buffers/windows/files engine, full Modern Vim, multiplayer, accounts, servers. |

### 1. Non-negotiables

1. Existing campaign gates stay green: **51 of 51** solution+undo, oracle 373,
   level lint, matrix/count, docs/status, PWA/offline.
2. A dynamic hazard must **never make a generated arena unavoidable** or a
   campaign solution nondeterministic.
3. Every new system has a seeded replay/QA path; no "random feels fair".
4. No fake story text, no copied Drew Neil prose, no fake Modern Vim levels.
5. Performance: arena FX must be allocation-light; existing desktop/mobile FPS
   gates and bundle budget are measured, not waived.
6. Accessibility: pause, reduced motion, slower bugs, color+shape legend,
   keyboard-only.

### 2. Current baseline (freeze point)

- Campaign: 10 chapters / 51 stages; **51 of 51** game-used solution+undo.
- Oracle 373 of 373; grammar 21,712; count 162; 88 Grimoire commands.
- Full-state debt 119 (undo/register) and fuzz debt 3 (visual edges).
- Practical Vim: 48 of 123 tips represented; 75 gaps = 39 drill candidates,
  28 deferred surfaces, 8 review.
- Modern Vim: 28 tips, 0 playable (deferred).
- Bundle: near the 420,000 raw / 140,000 gzip ceiling; exact current bytes are in
  [`generated/STATUS.md`](generated/STATUS.md). Any real feature requires a
  deliberate budget decision.
- PWA installability 0 errors; offline; landscape gate; 50-screen audit clean.

### 3. Workstreams and ownership boundaries

#### W1 — LIVE gameplay system (first)
A game-layer director around the existing `Session`/`Vim`, not a fork of the
engine.

#### W2 — Narrative system (parallel with W1, integrated after W1 loop works)
Story data + delivery surfaces; no engine changes.

#### W3 — PV-FULL engine (after W1/W2 vertical slices)
Editor program + per-tip oracle/drill coverage.

#### W4 — Modern Vim (after W3)
Only after buffers/windows/quickfix/terminal/plugin surfaces exist.

#### W5 — Presentation/polish (continuous)
Visual language, audio, onboarding, accessibility, GitHub/README.

### 4. LIVE CIRCUIT — architecture

#### 4.1 Why a separate mode

The 51 campaign stages are a **sealed deterministic simulation**. Their value
is that a solution is provably the same every run and can be diff-tested against
Vim. Moving hazards add time and randomness; mixing them into first clears would
break fair par, level-oracle reproducibility and the "learn one command"
contract.

LIVE CIRCUIT is an **arcade layer with the same real Vim engine**:
- arena text is a Vim buffer;
- the player still moves with real Vim commands;
- hazards live in a **meta layer** (cells outside the text semantics);
- health/timer/score are game state, not Vim state;
- a generated arena is seeded and re-playable.

After the arcade is proven, campaign **post-clear modifiers** can opt into the
same director without changing first-clear gates or par.

#### 4.2 Components

```
LiveArena (seed)
├── buffer text + collectibles + corrupt chars
├── LiveSpec { walls[], bugs[], coins, timeLimit, hearts }
├── HazardDirector
│   ├── seeded RNG
│   ├── tick scheduling
│   ├── bug AI (patrol-row / patrol-col / random / later stalker)
│   ├── collision + invulnerability
│   └── phases (calm → pulse → swarm)
└── WallGuard (game layer, not engine)
```

#### 4.3 Walls and corruption (distinct)

| object | visual | rule | player response |
|---|---|---|---|
| **red wall** | solid red block with hatch | immutable; cannot be entered; cannot be edited | route around it with motions/search |
| **corrupt text** | red/amber glyph `X` | damages signal on contact; can be deleted/overwritten with Vim | use the lesson's edit command |
| **bug** | moving amber/red sprite with trail | contact damages once per invulnerability window | move, delete, wait, use a wall |
| **coin / memory shard** | white/cyan glyph | collect by landing on it | all collected = circuit stable |
| **exit / repair cell** | green gate | optional mission objective | reach after collection |

WallGuard:
- record cursor and buffer version before a normal/visual key;
- if the resulting cursor is on a wall **and the buffer version is unchanged**,
  restore the cursor and emit `WALL` feedback (no damage);
- if an operator changed the buffer, do not roll back the edit; the wall stays
  visually and physically (it is meta, not a character);
- never touch engine internals from the guard.

#### 4.4 Bug AI (v1)

| type | motion | constraints |
|---|---|---|
| `patrol-row` | one cell left/right, reverse at bounds/wall | no wall entry; 700–950 ms step |
| `patrol-col` | one cell up/down, reverse | same |
| `random` | one of 4 directions, seeded | avoid walls; short memory to avoid jitter |
| `stalker` (later) | greedy one step toward cursor | capped speed, not before phase 2 |

Rules:
- no spawn within 2 cells of start, coins, or the current cursor;
- no two bugs on the same cell;
- pause while intro/results/help/exit overlay is open;
- pause while `document.visibilityState !== 'visible'`;
- telegraph the next move for 220 ms (direction pulse) before committing;
- after a hit: 1.2 s invulnerability, bug respawns away from the player;
- arena connectivity/reachability is verified before shipping.

#### 4.5 Health, timer, score

- **Signal** (hearts): 5 in LIVE v1. Bug or corrupt text = 1; walls = block,
  no damage. 0 = derez/lost.
- **Timer**: 75 s in v1; HUD counts down; collectibles can add +5 s (later).
- **Score**: coins × time bonus × no-hit bonus; separate from campaign par and
  stars. Never write live damage into campaign records.
- **Checkpoint**: one mid-arena signal checkpoint after 50% coins (v1.1).
- Campaign hearts remain exactly as they are today; no silent retune.

#### 4.6 Difficulty and fairness

- Seed is shown; DAILY uses a fixed seed; retry uses the same seed by default.
- No unavoidable spawn/damage. The arena generator validates:
  - start and all coins reachable ignoring bugs but respecting walls;
  - walls do not seal the arena;
  - bugs spawn at safe distance;
  - a straight-line solution exists for verification (not necessarily optimal).
- A colorblind legend uses **shape + pattern + label**, not hue alone.
- Reduced-motion mode disables trails/shake but keeps telegraphs.
- Bugs can be frozen by a "hold" key? Later; v1 has pause (`P`/Esc overlay).

#### 4.7 Performance

- Bug sprites preallocated; draw in the FX pass, not the cached glyph layer.
- No per-frame DOM; HUD updates only on state change (heart/coin/second).
- Cap bugs at 12; arena ≤ 40×18 cells; one RAF loop shared with PlayScreen.
- Budget: dynamic slice must stay ≥50 FPS mobile, ≥50 desktop headless and
  add no more than a measured fixed bytes ceiling (see §8).

### 5. Visual/feel language

Semantic palette (also used in campaign hazards where safe):

| meaning | color | shape |
|---|---|---|
| player/cursor | cyan-white block | solid cursor |
| valid/neutral | phosphor green | grid/frame |
| **corruption / damage** | **red** | `X`/hatch |
| **wall / redaction** | **deep red** | solid block + diagonal hatch |
| **ROT bug** | amber-red | moving glyph/sprite with trail |
| memory/coin | white-cyan | diamond/shard |
| goal/exit | green | outlined gate |

Typography:
- one monospace family for terminal data; no decorative "AI cyber" gradients;
- micro-labels tracked; red reserved for danger, never decoration;
- animations: 120–200 ms telegraphs, 80 ms hit flash, no constant shaking.

Characters (visual):
- **CURSOR**: the player, a block with a thin wake;
- **ERRATA** (bugs): six-legged bracket shapes, each type distinct;
- **칸노[監能]**: a blind vertical eye / diagnostic column;
- **ROT / REDACTOR**: red editorial marks, never a generic monster;
- **신[審]**: an unregistered child in the lower market; the reason refusal is not enough.

Onboarding:
- first LIVE run shows a 4-line legend overlay: MOVE, COLLECT, AVOID, WALL;
- a one-key `?` legend during play;
- no new command vocabulary required in v1 (hjkl/w/b/f/t/search all work).

### 6. Narrative system

See [`STORY_BIBLE.md`](STORY_BIBLE.md) (AI-only canon) and the novel manuscript
[`stories/kiritsu/work/`](../stories/kiritsu/work/) 13편. The story is **not
a skin**: the system is a Vim buffer, Vim edits are law, insert leaves a trace
and normal leaves none, registers are evidence drawers, macros are ghosts,
marks are graves, and the final boss is one order line — the first line of the
law. Delivery contract:

| surface | content | frequency |
|---|---|---|
| title / prologue | one scene, skippable, replayable | first boot + archive |
| chapter epigraph | 2–4 lines, chapter voice | chapter select |
| chapter interlude | 250–600 words | after all chapter stages cleared |
| codex | author notes, character fragments, definitions | unlocked progressively |
| LIVE transmissions | ROT/칸노[監能] lines, no plot-critical info | between waves |
| ending | the canon ending; how it is reached varies | after c10 |

Rules:
- no copied book prose; Drew Neil books are curriculum metadata, not story text;
- localize to Korean and English in `Localized`;
- story cannot block gameplay; every overlay is skippable;
- unlock with progress, not with a server/account;
- codex entries are readable offline;
- no spoilers in README/store copy.

### 7. PV-FULL — Practical Vim complete boundary

PV-FULL is a **contract**, not "implement every Vim feature".

#### 7.1 Coverage rule

Every Practical Vim tip (1–123) must end in exactly one bucket:

1. **STAGE** — a deterministic campaign stage (existing 48 tips + new ones).
2. **DRILL/GOLF** — simulation-verified challenge citing the tip line.
3. **LIVE MODIFIER** — a verified live arena mechanic that exercises the tip.
4. **ENV-DEFERRED** — blocked by a named environment feature; the feature has a
   design entry and an oracle plan. Explicitly approved, never "forgotten".

The build must refuse an **UNKNOWN** bucket.

#### 7.2 Feature groups and order

| group | tips (examples) | required surface | complexity |
|---|---|---|---|
| A core drills | 4,7,13–18,31–36,62,64,69–87,90–100 | insert registers/digraphs, ex history, advanced regex, substitute, macro edit | M |
| B files/buffers | 37–46,57–59 | VFS, buffer registry, argument list, splits/tabs, marks | L |
| C quickfix/tools | 102–111 | quickfix, ctags adapter, compile/grep adapters | L |
| D completion/spell | 112–123 | completion sources, spell dictionary | M |
| E environment boundary | shell-specific tips | browser VFS only; no real `:!` | deferred |

Order: A → B → C/D, each with oracle cases first. Modern Vim remains W4.

#### 7.3 PV-FULL acceptance

- `PV-COVERAGE.md` generated from the 123 tips: 0 UNKNOWN, counts per bucket.
- every STAGE passes level-oracle; every DRILL passes simulation and has a
  citation; every LIVE modifier has a deterministic test; every ENV-DEFERRED
  has a named feature and approval.
- No campaign par changes unless a deliberate content migration is approved.
- The engine score can then move from ~55 to ~80+; it is not claimed at 100
  because Modern Vim and full editor features remain separate.

### 8. Bundle/performance budget decision

The current bundle has ~121 B raw headroom, so this plan cannot be implemented
inside 300,000 B.

- **Phase 1 (LIVE slice)** estimate: +8–14 kB raw (director, sprites, HUD,
  wall guard, tests).
- **Phase 2 (story vertical slice)** estimate: +8–12 kB bilingual (prologue,
  one interlude, codex, transmissions).
- Full story (10 chapters/endings): +20–35 kB raw.
- Target after measurement: **≤ 420,000 raw / ≤ 140,000 gzip** (single-file title asset included), with a
  deliberate budget commit; if the slice exceeds it, cut content, do not waive
  the ceiling silently.
- Story text may be lazy-loaded as a cached `story.json` if initial bundle
  growth hurts first paint; decide only after measuring the vertical slice.
- FPS gates unchanged; a dynamic feature that drops mobile below 50 FPS is a
  failure, not a tradeoff.

### 9. Delivery phases and exit criteria

#### P0 — Plan, story canon and freeze (this document)
- `STORY_BIBLE.md` v2 and `stories/kiritsu/work/` 원고 확정(NOVEL_STATUS.md);
- gameplay/puzzle/engine boundaries fixed;
- current gates green; no feature code mixed in.
Exit: canon, scope, budget and vertical-slice acceptance approved.

#### P2 — LIVE vertical slice (no campaign/story changes required)
- one arena, 3 bug types, 2 walls types, corrupt text, 5 hearts, 75 s timer;
- HUD + legend + pause/accessibility;
- seeded arena verifier + fairness tests + browser QA;
- campaign gates unchanged.
Exit: 100 seeded arenas validated, no unavoidable spawn, campaign 51/51,
mobile ≥50 FPS, budget measured and deliberately raised.

#### P2.5 — Puzzle-device vertical slice

The requested one-shot floors, reactive paths and command locks are specified in
[`PUZZLE_DEVICES.md`](ROADMAP.md). Build them on the same meta-grid as
LIVE, but **turn-based**:

- `collapse` one-shot floors + reset semantics;
- `plate` and `lock` with **observable effect predicates**, not raw key scripts;
- one puzzle room with a verified solution and a solver that rejects soft-locks;
- no campaign changes, no real-time pressure.

Exit: solver proves solvability; retry restores devices; Vim `u` does not
resurrect meta-cells by design; browser QA and gates green.

#### P1 — Story vertical slice
- prologue (리츠[律] receives vim from 츠키[月], reports it at once, and hears
  *근거 부적합* — a tool the system does not know cannot be evidence), c01
  epigraph/interlude, 6 codex entries, 2 신[審] transmissions;
- 리츠[律] / 츠키[月] / 칸노[監能] / 신[審] voice tests; no reveal of the 코우[抗]
  immune twist, the 얀크 메커니즘, or the 제1조 collapse;
- skippable, localized, no book text; archive reachable from codex;
- story state persisted locally, no server.
Exit: a new player can explain who they are, who 츠키[月] is, what 판결 4,112
is, what happens if they refuse, and why editing is the only way to learn the
truth; no story blocks controls; link/doc/localization checks green.

#### P3 — Campaign + story integration
- chapter interludes for all 10 floors;
- post-clear LIVE modifiers; first-clear deterministic;
- character/corruption visual pass across campaign.
Exit: all campaign gates unchanged; story pacing reviewed; live modifiers optional.

#### P4 — PV-FULL engine
- group A → B → C/D; oracle-first;
- generated PV coverage; no UNKNOWN.
Exit: PV-FULL coverage report, 51/51 or approved migration, docs.

#### P5 — Modern Vim
Only after PV-FULL and editor surfaces; deferred otherwise.

#### P6 — Polish
Art/audio, endings, accessibility, release presentation.

### 10. QA and metric gates

Existing:
- tsc, tests, level lint, doc-check, invariants, surface strict;
- oracle, level-oracle solution+undo, matrix, count;
- build, budget, status, PWA check, presentation check;
- browser QA/audit, PWA QA.

New:
- `npm run live:verify` — 100 seeds: reachability, wall connectivity, spawn
  fairness, bug movement invariants, no duplicate cells, time/health bounds.
- `npm run live:qa` — deterministic replay + pause + reduced motion + FPS.
- story check — every chapter has epigraph/interlude/codex; localization keys;
  no empty text; no copied snippets (manual review).
- campaign regression on every P1/P3 change.

### 11. Risks and mitigations

| risk | mitigation |
|---|---|
| dynamic hazards ruin Vim learning | separate LIVE mode first; campaign untouched until post-clear opt-in |
| randomness feels unfair | seeded arenas, telegraphs, invulnerability, verified reachability, pause |
| bundle/FPS regression | measured budget decision; FX-only sprites; cap entities; mobile gate |
| story becomes exposition dump | short epigraphs/interludes, environmental/codex delivery, skip, novel bible |
| scope creep into full Vim | PV-FULL contract with UNKNOWN=0 and feature order |
| "AI slop" visuals | semantic palette, custom shapes, design notes, no stock gradients |
| overtime red state | one phase per branch, gate before commit; revert if gates worsen |

### 12. Immediate next actions (after approval)

1. Implement `LiveSpec` types + `LiveArena` generator + verifier (no UI yet).
2. Add `HazardDirector` + WallGuard behind a `live` host flag; no campaign path.
3. Add LIVE HUD/legend + red wall/corrupt/bug rendering + pause/reduced motion.
4. Add TRIALS entry `4 · LIVE CIRCUIT` and one story transmission (no spoilers).
5. Measure bundle/FPS; commit a deliberate budget raise with evidence.
6. Only then start the story vertical slice; only after that touch PV-FULL.

Do **not** start with a full engine rewrite, a new server, or a campaign-wide
hazard retrofit. Those are the three fastest ways to lose the green state.


---

## 다음 단계 (구 NEXT_STEPS)

> **Current order changed on 2026-11-13:** build the game's dynamic feel and
> story **before** expanding the engine. The engine work below stays queued.
> Master plan: [`UPGRADE_MASTER_PLAN.md`](ROADMAP.md) · narrative:
> [`STORY_BIBLE.md`](STORY_BIBLE.md).

### 0. New P0 — story vertical slice

- Prologue + c01 epigraph/interlude + 6 codex fragments + 2 transmissions.
- Skippable, localized, archive, no campaign gates touched.

### 0a. LIVE + puzzle systems

- `LiveArena` generator (seeded, reachable walls/coins, safe bug spawns).
- `HazardDirector`: patrol-row/patrol-col/random bugs, red immutable walls,
  corrupt text, signal hearts, 75s timer, pause/reduced motion.
- WallGuard at the game layer, never inside the Vim engine.
- Entry from TRIALS (`4 · LIVE CIRCUIT`); campaign first-clears untouched.
- Exit: 100 seeds validated, mobile ≥50 FPS, bundle measured and deliberately
  raised, campaign 51 of 51 still green.

### 0a. LIVE gameplay + puzzle-device slices

- One-shot collapsing floors, plates, effect-based command locks, search/register
  puzzles (`PUZZLE_DEVICES.md`).
- Turn-based, reset restores devices, Vim `u` does not; solver rejects soft-locks.
- Build after the LIVE meta-grid, before campaign integration.

### 0b. Story integration for all chapters

- Prologue, c01 epigraph/interlude, six codex fragments, ROT transmissions.
- Skippable, localized, no copied book prose.
- Exit: coherent read-through, story never blocks controls, archive offline.

### 0c. Then integrate

- All 10 chapter interludes; post-clear LIVE modifiers; character/corruption
  visual pass. First-clear determinism and par stay frozen.

### 0d. Then PV-FULL

### 1. Engine: visual fuzz debt (after the gameplay/story slices)

`FUZZ_DEBT.md` has 3 exact repros from seed 42/n=2000:

1. `V)B><Esc>i!<Esc>` — linewise visual range after `)`/`B`.
2. `<C-v>)hy<Esc>i!<Esc>` — block yank final cursor.
3. `<C-v>)F"d<Esc>i!<Esc>` — block curswant/delete range.

Required:
- add each repro to `tools/cases.ts` / oracle, fix with a **curswant model**, not
  one-off stage changes;
- keep `level-oracle` 51 of 51 solution+undo and all stage lint green;
- run `npm run fuzz -- --n=2000 --seed=42` until 0 divergences, then raise the
  CI smoke count/seed.

### 2. Full state matrix 119 → 0

`STATE_DEBT.md` tracks 119 edge cases (undo 110, reg 10, regtype 8). The
game-used surface is already 51 of 51. Work from the report, add minimized oracle
cases per fix, and never change a level to hide an engine difference.

### 3. Curriculum breadth

Practical Vim has 123 tips; current stages represent 48. `GAPS.md` lists 75.
- classify each as supported / deferred surface / Modern Vim phase;
- add **verified drill/GOLF** challenges for supported gaps, with par/optimal
  keys proven by Session simulation and a book citation;
- Modern Vim stays deferred until the documented engine surface
  (buffers/windows/quickfix/terminal/plugins) exists.

### 4. Mastery / GOLF

Current: par/3-star, bestKeys, ghost, retry, DRILL cue, GOLF result/retry,
TRIALS weakness/daily. Next: a drill queue and a source-cited GOLF deck;
every generated challenge must be simulation-verified. See `MASTERY_VIM_GOLF.md`.

### 5. UI / optimisation

Shipped: static vector frame/corners/grid. Next: instrument HUD readouts,
stronger vector language, and only if bundle/FPS remain inside budget.
- mobile 390×844 ≥50 FPS, desktop headless ≥50;
- 144fps only with a 144Hz/GPU measurement, never a claim;
- zero runtime deps; bundle gate 420k/140k unless a measured raise is approved.

### Gates for every future change

```bash
npm test && npm run lint:levels && npm run doc-check && npm run invariants
npm run surface -- --strict
node --experimental-strip-types tools/oracle-diff.ts
npm run level-oracle && npm run level-oracle -- --undo
npm run matrix && npm run count-matrix
npm run build && npm run budget && npm run status:check
npm run browser:qa && npm run browser:audit
```

Do not push a red state. Update HANDOFF/STATUS/STATE_DEBT/FUZZ_DEBT when a
metric or debt changes.


---

## 퍼즐 장치 계약 (구 PUZZLE_DEVICES)

> Design contract for turn-based puzzle devices. This is the layer that makes
> KIRITSU a *game* rather than a sequence of edit prompts. It is deliberately
> separate from the real-time LIVE bugs.

### 1. Verdict

The device idea is strong and should be the **next gameplay layer after the
LIVE vertical slice**. It turns Vim commands into spatial consequences:

- step once → the floor vanishes forever in that run;
- edit the right region → a bridge appears;
- yank into a register → a door opens;
- sort lines → a sequence of plates aligns;
- search for the right word → a hidden path is revealed.

But it must be **turn-based, deterministic and simulation-verified**, not a
random action minigame. A puzzle can be lost by a bad route, but it must be
resettable and solvable by reasoning.

### 2. Core rule: game state is a meta-grid, not the Vim buffer

The Vim buffer stays honest text. Floors, walls, plates and bridges are
meta-cells rendered over it.

```
Vim buffer        real text, motions/operators semantics
Meta-grid         walkable | wall | void | plate | door | bridge | collapse
DeviceDirector    triggers and effects, evaluated after accepted keys
PuzzleState       deterministic, resettable, no random hazards
```

Consequences:

- an edit can delete a **word** but never delete an **immutable wall**;
- a wall is not a character, so `x`/`dw` cannot bypass it;
- a meta-cell transition does not change Vim's undo stack;
- reset (F2 / retry) resets the whole run, including one-shot devices;
- a campaign level remains one buffer and one deterministic route.

### 3. Device taxonomy (v1)

#### 3.1 One-shot collapsing floor (`collapse`)
- First entry marks the cell **consumed**.
- It disappears when the cursor leaves it (never under the player).
- It cannot be entered again in that run.
- Reset restores it.
- Visual: dashed green tile that flickers once, then a hollow red void.

#### 3.2 Pressure plate (`plate`)
- Entering/landing triggers exactly once (or toggles if configured).
- Can open a door, extend a bridge, spawn a coin/bug, or reveal a hint.
- Visual: hex/circuit node; pressed state persists.

#### 3.3 Command/effect lock (`lock`)
- Trigger is **observable effect**, not a raw key script:
  - a quoted word changed but quotes intact;
  - a region became empty;
  - a line was yanked into register `a`;
  - lines became sorted;
  - a search pattern found MOTH;
  - N lines were changed by a macro/dot repeat.
- This survives macros, dot-repeat, `:normal`, counted operations and remaps.
- If an exact command is required for teaching, the UI may *display* it, but the
  validator should still assert the resulting state, not a keystroke string.
- Visual: bracket glyph with a key/verb shape; opens with a scanline.

#### 3.4 Conditional barrier (`barrier`)
- Opens only when a predicate is true:
  - visited all plates in order;
  - register contains a line;
  - no `ROT` tokens remain;
  - count/line range condition;
  - cursor passed through a mark/jump.
- Re-closes only if configured; default is one-way open (avoid soft-lock).

#### 3.5 Spawner / constructor (`spawn`)
- Creates bridge tiles, coins, a bug, a wall segment, a shortcut.
- Always has a **budget** (max cells/entities) and a **telegraph** animation.
- Cannot spawn on the cursor, on a coin, or inside a wall.

#### 3.6 Sequence / state machine (`sequence`)
- Ordered plates, a lever network, or a small AND/OR/NOT circuit.
- Wrong order resets only that sequence (not the run) unless marked deadly.
- Visual: numbered glyphs, lit path; no hidden order without a readable clue.

#### 3.7 Time/visit device (later, LIVE only)
- Real-time doors in LIVE CIRCUIT, never in the deterministic campaign.
- Telegraph and pause rules from the LIVE plan apply.

### 4. Trigger model

A device is data, not bespoke code:

```ts
type Trigger =
  | { kind: 'enter'; cells: Cell[]; once?: boolean }
  | { kind: 'effect'; id: string; args?: Record<string, unknown> }
  | { kind: 'predicate'; all?: Trigger[]; any?: Trigger[]; not?: Trigger[] }
  | { kind: 'sequence'; devices: string[]; ordered: boolean };

type Action =
  | { kind: 'removeFloor'; cells: Cell[] }
  | { kind: 'addFloor'; cells: Cell[] }
  | { kind: 'openDoor'; id: string }
  | { kind: 'closeDoor'; id: string }
  | { kind: 'spawn'; entity: 'coin' | 'bug' | 'bridge' | 'hint'; cells: Cell[] }
  | { kind: 'damage'; amount: number }
  | { kind: 'message'; text: Localized }
  | { kind: 'teleport'; cell: Cell }
  | { kind: 'checkpoint'; id: string };
```

Effects are evaluated **after an accepted key**, plus once at level start.
There is no polling in campaign puzzles.

#### Effect predicates (initial set)

| effect id | observable state |
|---|---|
| `quote-content-changed` | inside `"..."`, text changed, delimiters unchanged |
| `word-removed` | a specific token disappeared without touching its neighbours |
| `register-has` | register name contains exact text |
| `lines-sorted` | marked range is sorted |
| `no-token` | token absent from buffer |
| `search-found` | last search pattern matches target |
| `macro-applied` | buffer changed on N marked lines in one undo block |
| `case-flipped` | target region's case changed |
| `count-satisfied` | a numeric/count condition met |

These are checked against the real Vim buffer/cursor/registers, so a macro or
dot-repeat can satisfy them.

### 5. Fairness and reset rules

1. **No unavoidable one-shot trap.** A verified solution exists; the solver
   resets the run rather than soft-locking.
2. **Reset restores everything** (collapse tiles, plates, doors, spawned cells).
3. **Vim `u` does not resurrect a consumed meta-cell.** The HUD states this;
   `u` is for text, retry is for the room. This avoids treating engine undo as
   a puzzle cheat or a hidden second state machine.
4. **One-way opens by default.** A door may close only with a visible timer and
   a reset path.
5. **No hidden triggers.** A plate/lock has a readable shape, hover/line label,
   and codex entry. Hints can reveal the predicate.
6. **Stuck detector.** If reachable coins/exit drop to zero, offer RETRY rather
   than silently trapping the player.
7. **Turn-based campaign.** No bug-time pressure in a puzzle stage; LIVE bugs
   remain a separate mode.

### 6. Puzzle examples (verified, not implemented yet)

#### A. The Causeway
A one-cell bridge across a void. Cross it and the tile behind collapses. The
only return is a loop through a lower path. Teaches: one-shot floors, route
planning, `F2` reset.
Devices: `collapse` × 6, `plate` × 1.
Vim skill: `w`/`b`/`f` routing, no text edit required.

#### B. The Wordlock
Three `ROT` tokens are welded into a sealed door. Delete all three **without
touching the two KEEP words**. A bridge extends one cell per removed ROT.
Vim skill: `*`, `n`, `daw`, dot repeat.
Effect: `no-token` ROT + `word-removed` constraints; deleting KEEP spawns an
errata/damage.

#### C. Quote Gate
A door opens when the string literal is changed but its quotes remain. `ci"`
works; `di"` removes the content but also fails the quote-intact predicate;
`x` on a quote fails. Teaches text objects and effect-based locks.

#### D. Register Vault
A plate checks that register `a` contains the line `MOTH`. The player must yank
it, not retype it. Opens a bridge and records a codex fragment.
Vim skill: `"ayy`, `"ap`, register inspection.

#### E. Sort the Procession
Three plates are numbered by the sorted order of three marked lines. `:sort`
or `Vj:sort` aligns the bridge. Teaches ex ranges and order as state.

#### F. Search for the Unwritten
A hidden bridge is revealed only when the player searches for `MOTH`; `*` on a
different word does not count. The bridge is temporary unless a plate is
pressed. Teaches `/`, `n`, `*`, and intentional search.

#### G. One-Way Cathedral
A vertical shaft of collapsing floors. The player must descend using `}`/`G`/
search, not wander. Wrong route can strand; reset is one key. This is the
"head-scratching" spatial puzzle.

### 7. Story integration

Devices are the **author's revision machinery**, not arbitrary video-game props:

- collapsing floor = a sentence the city can only read once;
- wall = a redaction the author made permanent;
- plate = a memory that responds to being stepped on;
- command lock = a revision that requires the right *kind* of edit;
- bridge = a sentence restored between two deleted ones;
- sequence = the order of a paragraph, which the city remembers;
- hidden search path = MOTH exists only while searched.

The Redactor uses red barriers and one-shot redactions; ORACLE explains the
predicate; MOTH leaves hints; JANITOR's route is a sequence clue.

### 8. Architecture and tests

New modules:
- `src/core/game/puzzle.ts` — DeviceSpec, PuzzleState, trigger evaluation;
- `src/core/game/puzzle-solver.ts` — BFS/DFS over cursor×device state for
  authored levels; validates solvability and no soft-lock;
- renderer: meta-cell layer (walls/floors/plates/doors) + FX for transitions;
- UI: legend, device inspector, reset/stuck prompts;
- level lint: replay authored solution with devices, assert par/gates;
- tests: each effect predicate, one-shot reset, undo does not resurrect meta,
  wall guard, solver rejects unavoidable traps.

Budget: device layer is small (~10–14 kB raw together with meta-grid and
render hooks), but it depends on the LIVE framework; measure before raising.

### 9. Delivery order

1. Build with **one device type** (`collapse`) in one puzzle arena.
2. Add `plate` + `lock` with effect predicates.
3. Add sequence/register/search puzzles.
4. Only then consider campaign **post-clear** versions; first clears stay frozen.
5. Add story/visual pass and hints.

### 10. Anti-goals

- no real-time pressure in deterministic puzzles;
- no exact-key triggers that macros/dot/`:normal` can bypass or that punish
  legitimate equivalent edits;
- no invisible/undiscoverable triggers;
- no one-shot device that makes a stage unwinnable without reset warning;
- no campaign par rewrite to accommodate a new device;
- no fake "puzzle" that is just a hidden wall.

### 11. Open decisions for the human

1. **One-shot rule:** should a consumed floor disappear immediately under the
   player (with a teleport/fall) or only after leaving it? Recommendation:
   after leaving, never under the player.
2. **Vim undo:** should `u` undo device state? Recommendation: **no**; retry
   resets the room. Otherwise devices and undo create two conflicting state
   machines.
3. **Exact commands:** should a lock ever require the literal `ci"` rather than
   the observable "quoted content changed"? Recommendation: effect predicate
   for fairness; display the intended command as a hint.
4. **Campaign timing:** new devices only in post-clear/remix or a new chapter?
   Recommendation: post-clear first; new chapter later.
