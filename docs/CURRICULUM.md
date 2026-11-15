# CURRICULUM — the ten floors

The tower teaches Vim as a **language**: operators are verbs, motions and text
objects are nouns, counts are numbers, registers are containers. Each chapter
adds grammar, then immediately makes the player *speak*.

**Source material (all ten books are in `books-text/`, gitignored):**
Learning the vi and Vim Editors · Practical Vim · Pro Vim · Modern Vim ·
Vim 101 Hacks · Gourmet Vim · Vim Reference Guide · Use Vim Like A Pro ·
5 Years of Vim · Neovim for Beginners.

> **Provenance rule — read [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md)
> before changing any level.** The ten books are the syllabus authority; the
> order must be gradual, prerequisite-correct and nearly painless. The current
> chapters are theme-aligned, but **section-level book citations and a pacing
> audit are not complete yet**. Do not invent a plausible stage and call it
> book-derived. Engine support and curriculum coverage are separate: a command
> can be oracle-tested before it is taught.
>
> **Mastery is embodied, not merely understood.** The path must repeat each
> command through introduce → drill → transfer → spaced review; boring
> repetition is acceptable when it makes the hand faster, but it must be
> **varied** — different text, cursor positions, counts, operators and media,
> not the same sentence repeated. See `CURRICULUM_PROVENANCE.md` §4.

---

## 1. Awakening — movement, insertion, undo
`h j k l 0 $ x i a A o O u Esc`

| # | stage | insight |
|---|-------|---------|
| 1 | First Light | h j k l are directions, not letters |
| 2 | The Long Corridor | a count before a motion repeats it (`13l`) |
| 3 | Static | `x` cuts what is under you; `$` is the far wall |
| 4 | The Missing Letters | `i` before / `a` after; `Esc` is how you leave |
| 5 | The Nameplate | combine count + delete + insert + jump |

## 2. Words — word motion and single-char surgery
`w b e W B E r ~ f F t T ; ,`

| # | stage | insight |
|---|-------|---------|
| 1 | The Coin Field | `w` lands on word starts; `f$` + `;` is a laser |
| 2 | Backwards Through | `b`/`B` walk back; coins behind you |
| 3 | The Typo | `r` replaces without leaving normal mode |
| 4 | The Shouting King | count + `~` flips a whole line |
| 5 | CONFIG | hazards punish the wrong landing; `f`/`;` is precise (the `t` lesson is queued) |

## 3. Operators — the grammar of verbs
`d c y p P . dd yy cc D C`

| # | stage | insight |
|---|-------|---------|
| 1 | Pruning | `dw` = delete + motion; the operator waits for a noun |
| 2 | The Rot | `dd` removes whole lines; `3dd` removes three |
| 3 | Rename | `cw` changes a word and drops you into insert |
| 4 | The Copyist | `yy` + `p` duplicates; `P` puts above |
| 5 | The Repeat | `dw` then `.` fixes the same rot everywhere |

## 4. Text Objects — nouns with shapes
`iw aw i" a" i( a( it ip`

| # | stage | insight |
|---|-------|---------|
| 1 | Inside the Word | `ciw` ignores where in the word you stand |
| 2 | The Quarantine | `ci"` edits a string without touching its quotes |
| 3 | Arguments | `di(` clears a call's inside, brackets stay |
| 4 | Paragraphs | `dap` deletes a paragraph and its air |
| 5 | The Nest | `ci{` inside `ci"`, and `it` for tags |

## 5. Visual Mode — pointing at many things
`v V <C-v> o > < J gv`

| # | stage | insight |
|---|-------|---------|
| 1 | The Sweep | select first, operate second |
| 2 | The Block | `V` + `>` indents a wall of lines |
| 3 | Columns | `<C-v>` + `I` writes on many lines at once |
| 4 | Seams | `J` joins, `gJ` joins without a space |
| 5 | The Ledger | block edit + `~` + `>` on a table |

## 6. Search — the page as a map
`/ ? n N * # :s :%s`

| # | stage | insight |
|---|-------|---------|
| 1 | The Odd Word | `/` then `n` — stop reading, start landing |
| 2 | Under the Cursor | `*` searches the word you are standing on |
| 3 | One Line | `:s/old/new/` is a scalpel |
| 4 | Everywhere | `:%s/old/new/g` is a flood |
| 5 | The Chameleon | `:%s` + `n` + `*` to hunt a shapeshifter |

## 7. Registers & Macros — memory and automation
`"a q @ @@ :g :v`

| # | stage | insight |
|---|-------|---------|
| 1 | Drawers | `"ayy` stashes a line, `"ap` brings it back |
| 2 | The Automaton | `qa…q` records, `@a` replays |
| 3 | Chorus | `3@a` runs the ritual three times |
| 4 | Sieve | `:g/pattern/d` deletes by rule, not by hand |
| 5 | The Factory | record a fix, apply it to every marked line |

## 8. Marks & Jumps — the map in your head
`m ` ' % { } ( ) <C-o> <C-i>`

| # | stage | insight |
|---|-------|---------|
| 1 | Pins | `ma` … `'a` teleports |
| 2 | Brackets | `%` crosses a structure in one keystroke |
| 3 | Paragraphs | `{` `}` move by thought, not by line |
| 4 | The Trail | `<C-o>` walks back through your jumps |
| 5 | The Labyrinth | marks + `%` + `{` in one route |

## 9. Command Line — the operating table
`:1,3d :m :t :sort :normal`

| # | stage | insight |
|---|-------|---------|
| 1 | Ranges | line ranges are addresses |
| 2 | Reorder | `:m` and `:t` move/copy blocks |
| 3 | Order | `:sort` fixes a shuffled ledger |
| 4 | Batch | `:normal` applies keys to many lines |
| 5 | Surgery | ranges + `:normal` + `:s` on one document |

## 10. The Weave — formatting and mastery
`gq gJ gu gU` + everything

| # | stage | insight |
|---|-------|---------|
| 1 | Reflow | `gq` re-wraps prose to the width |
| 2 | Voice | `gU`/`gu` change case by range |
| 3 | Seams II | `gJ` vs `J` |
| 4 | The Chorus | macro + text object + dot in one breath |
| 5 | The Last Page | restore a whole corrupted document |

---

## After the tower

`Endless` mode generates drills from the same skill pool (see
`src/core/game/trials.ts`). Any new chapter automatically feeds it.


---

## 커리큘럼 척추 (구 CURRICULUM_SPINE)

### Decision

**Practical Vim is the playable spine. Modern Vim is the second book, after it,
and is deferred where the engine lacks the surface.** The other eight books are
supplements. The books are not read in parallel.

All **51/51** existing stages now have evidence-checked citations in
[`books-index/curriculum-map/STAGE_MAP.md`](../books-index/curriculum-map/STAGE_MAP.md);
the generated provenance is [`STAGE_PROVENANCE.md`](generated/STAGE_PROVENANCE.md).
Citations live in the build-time overlay, not in the runtime bundle.

### Why the stage order is not the literal tip order

Practical Vim opens with the dot command (Tip 1) and only introduces h/j/k/l at
Tip 47. A literal 1→123 level order would make a beginner play advanced
material before basic movement, and would invert the game's prerequisite gate.
The map records **19 global tip-order inversions** for exactly this reason.

The rule is therefore:

- **authority** = the book; every stage cites a real tip;
- **sequence** = prerequisite-first game pacing, with a starter supplement for
  basics Practical assumes (c01 from Learning the vi and Vim Editors);
- inversions are explicit in `STAGE_MAP.md`, not silently called "in order";
- a future strict "seminar mode" can replay tips 1→123 for readers, separate
  from the playable story. Do not destroy the game's progression for it.

### Phase 1 — Practical Vim (playable)

Existing chapters cover the six Practical parts through 51 stages:

| game | Practical authority | notes |
|---|---|---|
| c01 fundamentals | supplement + Tips 1–47 | starter basics Practical assumes |
| c02 words/precision | Tips 3, 47–51 | motions/search f/t |
| c03 operators | Tips 11–12, 60 | operator grammar |
| c04 objects | Tips 52–53 | iw/aw, delimiters |
| c05 visual | Tips 20–26 | v/V/Ctrl-V, block I/A |
| c06 search/substitute | Tips 51, 79–89 | `/`, `*`, `:s` |
| c07 registers/macros/`:g` | Tips 60–61, 65–68, 98 | named registers, macros, global |
| c08 marks/jumps | Tips 54–56 | marks, `%`, `C-o`, motions |
| c09 ex | Tips 27–30, 100–101 | ranges, `:m/:t`, `:sort`, `:normal` |
| c10 mastery | Tips 12, 53, 65 + supplement | final integration; `gq` from Vim 101 Hacks |

The per-stage table is generated in `STAGE_MAP.md`; the provenance report is
generated by `npm run provenance`.

### Phase 2 — Modern Vim (deferred, not faked)

Modern Vim's 28 tips are mostly **environment/editor-surface** material:
packages, fzf/projections, quickfix, terminal buffers, sessions, configuration.
The current single-buffer engine cannot host real levels for those. The plan is:

1. finish Practical correctness/mastery first;
2. extend the engine only through the documented `FUTURE_EDITOR.md` program;
3. then add a **MODERN** phase whose stages are verified against real Vim;
4. until then, Modern Vim is a reading/index track, clearly labeled deferred.

No plugin/terminal/buffer level may be simulated just to claim coverage.

### Mastery loop (game design law)

Every concept must pass through:

1. **Introduce** — one insight, one necessary command, visible goal.
2. **Drill** — short repeats with varied text/cursor/count/operator/nesting.
3. **Transfer** — same command in a new problem shape.
4. **Spaced review** — reappears after other concepts (TRIALS/weakness queue).
5. **VimGolf** — minimal-keystroke attempt with a verified optimal/par target;
   the player must choose an approach, not just execute.

Existing mechanisms already support this: par/3-star, F3 ghost, restart,
`bestKeys`, TRIALS (12 skills), weakness weighting, daily seed. The next
increment is a **GOLF/drill layer** that makes the player optimise and revisit,
not a new story chapter. Every generated challenge must be simulation-verified.

### Coverage gaps

The generated gap table is
[`../books-index/curriculum-map/GAPS.md`](../books-index/curriculum-map/GAPS.md):
48 of 123 Practical tips are represented by a current stage; 75 are a drill or
engine backlog, explicitly not claimed as levels. Deferred surfaces
(files/buffers/windows/quickfix/tags) are Modern-Vim/engine work, not fake
stories.

### Gap policy

Practical has 123 tips but the game has 51 stages; many tips are variations of
one insight. Gaps are filled by drills/GOLF and supplements, not by inventing a
new stage per tip. If a gap requires an unsupported command/surface, it is
recorded as deferred. The curriculum authority is the book, not an AI's
plausible lesson.


---

## 마스터리·VimGolf (구 MASTERY_VIM_GOLF)

> The goal is not "the player has seen every command". It is **the hand reaches
> for the right command without translation**, across new text, then optimises.

### The loop

1. **Introduce** — one insight, a stage whose puzzle makes the command necessary.
2. **Drill** — restart/retry the same insight with varied text/cursor/count.
3. **Transfer** — use it in a different problem shape (TRIALS / later stages).
4. **Spaced review** — TRIALS weakness/daily after other concepts intervene.
5. **Golf** — beat par; compare `bestKeys`; ghost shows the canonical path.

The game already ships par/3-star, `bestKeys`, retry, F3 ghost, the DRILL cue,
TRIALS with weakness/daily selection, and the coach. The results screen now
frames the key gap as **GOLF** (par / +N over par / best) instead of a generic
"keys" line. When the clear is over par, **GOLF RETRY is the primary action**
and the focused button: the next repetition is the obvious next step. This is deliberate: the score is the lesson, not decoration.

### Why this forces thought

- **Par is not the only solution.** Hints/ghost show one path; GOLF asks for a
  shorter one. The player must choose an operator/motion composition.
- **Varied repetition.** TRIALS generators vary text, cursor, count, operator,
  nesting and medium; repeating one sentence is explicitly forbidden.
- **No fake mastery.** A command seen once is not mastered; a 3-star clear is
  evidence, not a certificate. The review queue keeps returning weak skills.

### Next increments (source-backed)

1. A **drill queue** after a stage clears: three short variants, one transfer,
   one delayed review, each simulation-verified.
2. A **GOLF deck** of 5–10 source-cited challenges (Practical Vim tips) with
   verified `par`/optimal keys and local best, never unverified generated goals.
3. **Hint budget** experiments: hint use should be visible in results and
   should not silently grant mastery. Do not punish learning so hard that a
   beginner stalls.
4. **Book-tip review map**: each GOLF challenge cites a priority-book line; the
  provenance overlay is the source of truth.

### Invariants for any new challenge

- Runs through the real engine; goal verified; one insight.
- No command outside the stage's gate.
- If generated: `verify()` must win on the last key, and tests must cover it.
- No extra runtime dependency; bundle/performance measured.
- Unknown/deferred features stay deferred; no fake levels.


---

## 경쟁작 커버리지 (구 VIM_ADVENTURES_COVERAGE)

Audit of the command list a player meets in *Vim Adventures*, against this
engine. Status means **observable buffer/cursor behaviour on the current
tested surface**, not "a key exists".

- `exact` — implemented and covered by oracle/matrix/unit cases.
- `approx` — implemented with a documented simplification.
- `missing` — no implementation (or an explicit no-op message).
- `deferred` — intentionally outside the single-buffer slice; not rejected.

### Motions

| Command | Status | Notes |
|---|---|---|
| `h j k l` | exact | |
| `w W e E b B` | exact | |
| `0 ^ $` | exact | |
| `f F t T ; ,` | exact | |
| `%` | exact | bracket matching; `[count]%` percentage |
| `g`, `gg`, `G` | exact | `gg`/`G` plus the implemented `g` menu |
| `{ } ( )` | exact | paragraph/sentence motions |
| `[ {`, `] }`, `[ (`, `] )` | missing | bracket-block motions; bracket text objects work |
| `H M L` | approx | top/middle/bottom of the **buffer**, not the viewport |
| `z zt zz zb` | missing | explicit "viewport is the whole scroll" no-op |
| `+ -` | exact | |
| `n N` | exact | search repeat |
| `* #` | exact | word search |
| `|` | exact | column motion |

### Counts

Digits `1-9` are parsed globally. Counts before motions and operators are
covered by the matrix. Counts before simple commands were **not systematically
covered**; the following now have explicit cases: `i a I A o O`, `s S`, `Y`,
`u <C-r>`, `.`, `x X r ~ J gJ p P`. `C` and `D` deliberately ignore the count,
as Vim does. A count matrix over every normal command is still future work.

### Operators and edits

| Command | Status | Notes |
|---|---|---|
| `d dd D x X` | exact | |
| `r` | exact | count replaces N chars |
| `~` | exact | count toggles N chars |
| `c cc C s S` | exact | counts honoured for `s S`; `C` ignores count like Vim |
| `y yy Y` | exact | `Y` honours count |
| `p P` | exact | count-aware |
| `.` | exact | count repeats the change |
| `u`, `CTRL-R` | exact | count loops implemented |
| `g~ gu gU gq gw` | exact | |

### Insert

`i I a A o O` exact, including counts (`3i0` -> `000abc`, `3o0` -> three
lines). Insert-mode keys: text, space, `<CR>`, `<BS>`, `<Del>`, `<Tab>`,
`<C-w>`, `<C-u>`, `<C-r>{register}`, `<C-o>{one normal command}`, `<Esc>`.

### Registers, marks, macros

| Item | Status | Notes |
|---|---|---|
| `"` register prefix | exact | |
| `"" "- "_` | exact | unnamed, small-delete, black-hole |
| numbered `0-9` | exact | yank/delete history, shifts on delete |
| letter `a-z`, append `A-Z` | exact | |
| `:reg` | missing | registers work but there is no listing command |
| `m`, `'`, `` ` `` | exact | set/jump marks |
| `:marks`, `:delmarks` | missing | |
| `q @` macros | exact | record/run, counts |
| `+ -` (in challenge list) | exact | motions |

### Search, ex, files

| Item | Status | Notes |
|---|---|---|
| `/ ?` | exact | |
| `:s`, ranges, `g/`, `v/` | exact | |
| `:set nu/rnu` | exact | |
| `:rnu` as a command | missing | use `:set rnu`; direct `:rnu` is not wired |
| `:w`, `:q` | fake | echoes success; no file/exit |
| `:e` | missing | |
| `:b`, `:ls` | deferred | buffers intentionally outside the current slice |
| files (`:w/:e`) | deferred | same |
| buffers/splits/tabs | deferred | see `FUTURE_EDITOR.md` |
| folds, completion, `:!`, quickfix/LSP, Vimscript/Lua | deferred | explicit refused surface |

### Current evidence

See [`STATUS.md`](generated/STATUS.md) for generated oracle/matrix/count/state/build
numbers. The status table is not copied here on purpose; this file owns the
feature-by-feature verdicts, STATUS owns the measurements.
