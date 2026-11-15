# VIM COVERAGE — what this engine actually implements

KIRITSU (subtitle VIMLORE) is being built as **the most comprehensive Vim training terminal ever
attempted** — no artificial cap on commands, tips, or advanced features. That is
a destination, not a current-completeness claim. The engine is a **subset chosen
for this slice**, kept honest by a differential oracle:
`tools/oracle-diff.ts` replays **373 keystroke cases** through a real
`vim -u NONE` and through the engine, and requires identical buffers and
cursors. If you implement something new, add a case there first.

The **surface audit** (`npm run surface -- --strict`, CI gate) proves the other
direction: every Grimoire command has oracle or unit evidence, every oracle case
maps to a command or an explicit engine-only feature, and there are no orphan
cases. The generated map is [`ENGINE_SURFACE.md`](generated/ENGINE_SURFACE.md).

This page is the answer to "does it support everything Vim does?" — **not yet.**
Below is the exact boundary, so nobody has to guess. Deferred domains (buffers,
files, splits, tabs, folds) are listed with the reason and, where designed, the
roadmap in [`FUTURE_EDITOR.md`](VIM_COVERAGE.md).

## Implemented

**Modes** normal · insert · replace · visual · visual-line · visual-block ·
command-line · search · operator-pending.

**Insert mode** printable text (including the space bar), `<CR>`, `<BS>`,
`<Del>`, `<Tab>`, `<C-w>`, `<C-u>`, `<C-r>{register}`, `<C-o>{one normal
command}`, `<Esc>`. Counts before `i a I A` repeat the typed text; counts
before `o O` open that many lines with the typed text.

**Motions** `h j k l 0 ^ $ |` · `w W b B e E ge gE` · `f F t T ; ,` · `gg G` ·
`{ } ( )` · `%` · `/ ? n N * # g* g#` · `'` and `` ` `` marks · `<C-d> <C-u> <C-f>
<C-b> <C-e> <C-y>` · `<C-o> <C-i>` jumplist · `+ - _ <CR> <Space> <BS>` ·
backward `(` built from real sentence starts (BOF, blank-run last line,
paragraph starts, `[.!?]` + whitespace).

**Operators** `d c y > <` · `g~ gu gU gq gw` · doubled forms `dd cc yy >> <<` ·
`x X s S D C Y` · `r` · `~` · `J gJ` · `p P` · `u <C-r>` · `.` with counts
(`s S Y u <C-r> i a I A o O` now honor them; `C D` ignore them as Vim does).

**Text objects** `iw aw iW aW` · `i" a" i' a' i\`` a\`` · `i( a( ib` ·
`i[ a[` · `i{ a{ iB aB` · `i< a<` · `it at` · `ip ap` · `is as`.

Multi-line bracket blocks whose brackets own their lines are **linewise**
(`di{` removes whole inner lines and keeps the braces on separate lines;
`ci{` opens an empty line); an empty pair (`f()`, `""`) is a no-op that
parks the cursor on the closing delimiter, and `ci(`/`ci"` insert before it.
Counted `iw` counts a run of spaces as one unit, skips line breaks, and keeps
an adjacent punctuation token in range; `iW` across lines is linewise.

**Visual** `v V <C-v>` · `o` · operators · block `I`/`A` · `gv`.

**Search** magic, `\v`, `\V`, `\c`, `\C`, smartcase, highlight · `gn`
(selects/operates the next match; counts, operator-pending `dgn`/`cgn`, visual
extension, dot repeat) · `g*` / `g#` (word under cursor without `\<...\>`
boundaries) · `\zs` / `\ze` match start/end offsets (also inside `:s`).

**Ex** `:s` (flags `g i &`), `:g`, `:v`, `:d`, `:m`, `:t`, `:sort` (`n u i !`),
`:normal`, `:set number/nonumber/relativenumber/nornu`, `:w :q :wq :x :noh`,
ranges `% . $ N 'a , ; + -`. Command-line editing has `<BS>`, `<C-w>`, `<C-u>`,
`<C-r>` and `↑`/`↓` history.


**Registers** unnamed, `0-9`, `a-z`, `A-Z` (append), `-`, `_`, `+`, `*`, `/`,
`:` — the last four are internal aliases, not the system clipboard.

**Marks** `a-z`, `<` `>`, `''`, and a real jump list with forward/back.

**Macros** `q{reg}`, `@{reg}`, `@@`, with counts.

**Numbers** `<C-a>` / `<C-x>` including Vim's default `nrformats=octal,hex`
(`007 + 1 → 010`, `0x1f + 1 → 0x20`).

**Undo** linear undo/redo (`u`, `<C-r>`) plus numeric `:earlier N` / `:later N`.

**Indentation** `>`/`<` shift by `shiftwidth`; `=` / `gg=G` / visual `=` do a
simple brace-depth C indent in spaces. No filetype `indentexpr`, and braces
inside strings/comments are not parsed.

## Not implemented yet (deferred)

Everything below is backlog/deferred, not a product rejection, unless the
`why` column names a product boundary. Deferred features are not in today's
taught surface; they enter it only with oracle proof.

| area | missing | why |
|---|---|---|
| windows | splits, tabs, buffers, `:vsp`, `<C-w>` | deferred editor program, design in `FUTURE_EDITOR.md`; every level is one buffer |
| folds | `zf zo zc za zR` | deferred with the viewport/editor phases |
| completion | `<C-n> <C-p> <C-x>`, digraphs, abbreviations | deferred; needs a file corpus and an editor phase |
| indentation | filetype-aware `=`/`indentexpr`, tab/expandtab policy | simple brace-depth `=` exists; no filetype rules |
| files | `:e :r :w file`, `:!cmd`, terminal, `:bd` | deferred editor program; the browser has no filesystem today |
| options | `:set` | `textwidth`/`shiftwidth` come from the level |
| undo tree | `g-`, `g+`, time units for `:earlier/:later`, persistent undo | linear undo + numeric `:earlier/:later` only |
| change list | `g;` `g,` | rare in teaching material |
| filters | `!{motion}`, `:!` | no shell |
| tooling | quickfix, `:vimgrep`, ctags, LSP, treesitter | outside the current surface; deferred until a tooling phase (not designed yet) |
| scripting | Vimscript/Lua, `:map`, autocmds, plugins | the game *is* the plugin |
| interactive substitute | `:s///c` with y/n/a/q/l, `g`+`c`, Esc abort | prompt/status integrated; oracle cannot automate the confirmation keys |
| misc | `zz/zt/zb`, `H/M/L` (currently a no-op — not implemented), `ZZ/ZQ`, mouse | deferred viewport/mouse phase; the canvas is one window today |

## If you need a missing feature

1. Add one or more cases to `tools/cases.ts` describing the keystrokes.
2. Run `node --experimental-strip-types tools/oracle-diff.ts` — it prints the
   exact divergence against real Vim.
3. Implement it in `src/core/vim/`, then `--emit` a new snapshot.
4. `npm test` and `npm run lint:levels` must stay green.
5. Update this table. Adding a row here is cheaper than a bug report later.


---

## 부록 A — 엔진 완성 프로그램 (구 ENGINE_PROGRAM)

> **Status: Phase A live (2026-11-11).** This document defines what "the
> engine is perfect" means for KIRITSU, how the engine is layered, and the
> gates that make the claim checkable. It supersedes "add more oracle cases
> until it feels done" as the engine roadmap.
>
> Read with [`MASTER_PLAN.md`](archive/MASTER_PLAN.md), [`VIM_COVERAGE.md`](VIM_COVERAGE.md),
> [`HANDOFF.md`](HANDOFF.md) and [`FUTURE_EDITOR.md`](VIM_COVERAGE.md).

### 0. Why this program exists

KIRITSU does **not** need to run Vim or Neovim. It needs to be **complete and
provably correct inside the surface it teaches**, and **explicitly closed
outside it**. That is a different, smaller and harder-to-cheat goal than "be
Vim".

The current engine is strong at the grammar and weak at the boundary:

| layer | current state |
|---|---|
| command grammar (count → register → operator → motion/object → mode) | present, compositional |
| effects (buffer, undo, registers, marks, jumps, insert) | present |
| **range normalization** (what a motion+operator actually selects) | scattered across `finishOpWithMotion`, `applyOp`, `deleteRange`, `caseRange`, `shiftRange` |
| **cursor policy** (where the cursor lands after an operation) | scattered, one branch per quirk |
| **surface manifest** (what is in scope, with evidence) | prose only (`VIM_COVERAGE.md`, fuzz alphabet) |
| **systematic matrix coverage** | missing; fuzz is random |
| **explicit refusal outside scope** | missing; unsupported input can half-work |
| oracle / fuzz / invariants | strong (373 cases; 12 of 12 fuzz seeds clean at n=1000) |

The last engine pass proved the point: `de`/`2dw` linewise conversion,
counted `$`, zero-range `^`/`h`, bracket linewise objects and visual-block
short lines were each a **range/cursor rule**, but each landed as a separate
patch in a different function. They are the "essence" of Vim editing, and they
deserve one home.

**Direction (2026-11-11):** engine fidelity is exact on the tested surface, so
the next leverage is verified content. [`DIVINE_MOVE.md`](archive/DIVINE_MOVE.md) defines
the observable-state oracle, corpus and level-compiler tracks. Engine features
freeze except failures those tracks expose.

### 1. Definitions

- **Surface**: every key, command, motion, text object, ex command and mode the
  game can encounter — levels, TRIALS, the Grimoire, gating, hazards, save.
- **In scope**: taught features (a stage or grimoire entry teaches them) plus
  engine-only features used by TRIALS/tests plus infrastructure (undo, registers,
  marks, jumps, gating, search state).
- **Deferred, not out of scope**: features that are on the product backlog but
  deliberately not in today's surface — buffers/files/windows/tabs
  (`FUTURE_EDITOR.md`), folds, completion, `:!`, quickfix/LSP, Vimscript/Lua,
  viewport motions. They are not rejected; their phases start only after the
  current fidelity stage, and until then the engine refuses them
  deterministically instead of half-editing.
- **Never (product boundary)**: embedding a real Vim/Neovim runtime, a server,
  or runtime dependencies. The game stays static and the engine is ours.
- **Out of scope today**: any input not in the current surface. A deferred
  feature enters the surface only when its phase starts and it ships with
  oracle proof.
- **Closed world**: for every current-surface input the result must match real
  Vim; for every non-surface input the engine must produce a deterministic
  refusal (bell + a capability event), never a silent half-edit.
- **Proof obligation**: the evidence a feature must ship with — oracle cases,
  matrix coverage, fuzz alphabet membership, invariants, a docs row, and a game
  usage tag.

### 2. Architecture — five layers, one normalization

```
grammar     count · register · operator/command · motion/object/prefix · mode
geometry    Pos · SelRange · inclusive/exclusive · linewise · virtual column
normalize   (op, motion, from, to, mode, ctx) -> effective range
cursor      (op, range, ctx) -> cursor position
effects     buffer / undo / registers / marks / jumps / insert
```

The first, second and fifth layers already exist. This program extracts the
third and fourth into `src/core/vim/normalize.ts` and `src/core/vim/cursor.ts`,
then rewrites the existing call sites to use them. **This is an extraction, not
a rewrite.** The oracle stays green at every commit.

#### 2.1 The quirk registry

Vim is a language plus thirty years of compatibility decisions. The quirks are
part of the semantics, so they are named, documented and oracle-linked instead
of living as anonymous `if`s. Known families (IDs are stable):

| id | rule | evidence |
|---|---|---|
| Q01 | `cw` behaves like `ce`; counts extend through words | oracle `cw on comma`, `2cw` |
| Q02 | a charwise `d` spanning lines to EOL from the indent is linewise (`2dw`, `de`); `c`/`y` stay charwise | pass-2 cases |
| Q03 | counted `$` is charwise; only `d` converts | `3c$`, `3y$` |
| Q04 | zero-range `0`/`^`/`h` at column 0 of a non-first line is linewise; line 1 toggles one character (`cursor.ts`) | `g~0`, `g~^`, `g~h` |
| Q05 | multi-line bracket objects are linewise when the brackets own their lines; empty pairs park on the closer | `di{`, `ci(`, `f()` |
| Q06 | visual-block geometry shrinks on short lines for `<` | block cases |
| Q07 | backward `(` uses real sentence starts (BOF, blank-run tail, paragraph, punctuation+space) | sentence cases |
| Q08 | counted `iw` counts a space run as a unit and skips line breaks; `iW` across lines is linewise | `2diw`, `3ciW` |
| Q09 | case-operator cursor: backward motion keeps its landing column; single-line uses min(col, fnb); text-object yanks start at column 0 (`cursor.ts`) | pass-1/2 cases |
| Q10 | backward column-0 ranges (`cB`/`dB`/`yB` from an empty line) are linewise on the lines above | `cB`, `dB` |
| Q11 | `ap` at the last paragraph takes the preceding blank; counted `ap` crosses separators | `2cip`, `2dap` |

A new quirk is a new row plus oracle cases, never a new branch in an operator.
`normalize.ts`/`cursor.ts` are allowed to grow only through this table.

### 3. The surface manifest

the generated human surface view [`ENGINE_SURFACE.md`](generated/ENGINE_SURFACE.md) and a
machine manifest (`src/core/vim/surface.ts` or `docs/surface.json`) describe
every entry:

```ts
type Scope = 'taught' | 'engine-only' | 'infrastructure' | 'out';

interface SurfaceEntry {
  id: string;              // 'operator.d', 'motion.w', 'object.iw', 'ex.s'
  keys: string[];
  scope: Scope;
  modes: Mode[];
  oracle: string[];        // case names in tools/cases.ts
  matrix?: string[];       // generated matrix groups
  game?: string[];         // stage ids / TRIALS skill ids
  docs?: string;           // VIM_COVERAGE.md row
  refusal?: string;        // required for scope: 'out'
}
```

`tools/surface-audit.ts` derives the initial manifest from `commands.ts`,
`CHAPTERS`, `tools/cases.ts`, `trials.ts` and the fuzz alphabet, then reports:

- taught entries with no oracle case (gap),
- entries with no mode coverage (operator only tested in normal mode),
- oracle cases that map to no entry (orphans),
- engine behaviour with no entry (accidental support),
- out-of-scope keys that currently do something (silent half-support).

The audit is a **CI gate**. Prose coverage stops being the source of truth.
**Phase A is live.** `npm run surface -- --strict` runs in CI. Current numbers:

- 88 of 88 Grimoire commands have engine evidence (78 oracle-touched + 8 unit-only:
  `q`, `@`, `:g`, `'`, `:d`, `:sort`, `:normal`, `gq` — ex/macro/mark/format
  commands the `normal!` oracle harness cannot drive);
- 9 engine-only features without a Grimoire row (`^`, `gg`, `G`, `(`, `)`,
  `<C-a>`, `<C-x>`, `g#`, `=`) each have oracle cases;
- 0 orphan oracle cases: every one of the 373 cases maps to a command or an
  engine-only feature;
- 15 grimoire-only commands and 12 commands no stage solution uses remain
  **curriculum** gaps, reported separately, not engine gaps.


### 4. Gates — what "perfect" means, numerically

| gate | rule |
|---|---|
| **surface** | 100% of in-scope entries have a pointer to oracle cases (≥1 per mode), a matrix group, and a docs row; 0 orphans; 0 accidental features |
| **matrix** | for the taught surface, generate motion/object × operator × mode × count and boundary conditions, diff against real Vim; **0 divergences**; coverage % ratchets up, never down |
| **compose-fuzz** | generate valid command trees from the manifest (not random ASCII keys) and diff; failures shrink to a readable command |
| **fuzz** | alphabet derived from the manifest; 12 seeds × n=1000 = 0 divergences |
| **invariants** | strict post-key state; no out-of-scope mutation; refusal is side-effect free |
| **oracle** | only grows; every case mapped; snapshot emitted |
| **CI** | native vim oracle + surface audit are live (`.github/workflows/ci.yml`); matrix/compose-fuzz still local-only |
| **performance** | key handling p99 budget; frame budget unchanged (engine < 1 ms/key on desktop) |

"Perfect within the covered set" is exactly: **surface 100%, matrix 0
divergences, compose-fuzz 0, fuzz 0, 0 silent half-support.** Out-of-scope is
allowed to be absent; it is not allowed to be mysterious.

### 5. Phases

#### Phase A — manifest and audit (done, first cut)
Built `tools/surface-audit.ts` + generated [`ENGINE_SURFACE.md`](generated/ENGINE_SURFACE.md);
`--strict` is a CI gate. Evidence went from 86/91 to **86 of 88 commands**, with 9
engine-only features and 0 orphan cases. Out-of-scope refusal (Phase D) is the
remaining half of the closed-world contract.

#### Phase B — essence extraction (normalize + cursor done)
`normalize.ts` owns `flatRange` and Q02/Q10; `cursor.ts` owns the Q04/Q09 cursor
policy (zero-range case motions and the linewise case-operator landing). The
engine keeps only effect dispatch and calls both modules; oracle 373/373 and
matrix 21,712/21,712 stayed green through the extraction. Remaining: Q03/Q06
(case/yank cursor details) if they earn a separate home. Acceptance is
unchanged: oracle green at every commit, every branch linked to a quirk ID.

#### Phase C — matrix and compose-fuzz (matrix done, CI gate)
`tools/matrix.ts` generates **21,712** valid command trees (8 texts, 2-3 cursor
positions, 20 motions, 20 objects, 8 operators, counts {none, 2}, normal +
visual/visual-line/visual-block + doubled) and diffs them with
`feedkeys('xt')` — user-observable final state, not `normal!` abort state.
Current run: **21,712 matched / 0 divergences**. The last families closed were
`b`/`B` backward ranges across lines (linewise at the first non-blank, charwise
otherwise), `d)` linewise ends, blank-line `w`/`W`/`$` conversion, and
visual-block `<` after a `G` motion. The matrix now runs in the CI `oracle` job,
so a grammar regression fails the build. `tools/compose-fuzz.ts` (random
command trees) is the remaining Phase C work.
Matrix is a CI gate (oracle job) now that it reaches 0.
`tools/compose-fuzz.ts` (random command trees) is still to come.

#### Phase D — closed world
`Vim.supports(key)` / capability events; out-of-scope input refuses
deterministically; the game shows a clear message instead of a half-edit.
Acceptance: no silent out-of-scope mutation; refusal covered by tests.

#### Phase E — performance and handoff
Measure key→render latency and allocations; optimize only what the profile
shows. Update `HANDOFF.md`, `MASTER_PLAN.md`, `AGENTS.md` and this file.

### 6. Non-goals

- No real Vim/Neovim runtime. (See "why" below.)
- No new stages or chapters in this program.
- No buffers/files/windows/tabs/folds/completion/terminal/scripting.
- No big-bang rewrite of `engine.ts`.
- No silent bundle-gate raise.
- No "teach everything Vim does" — only the surface, perfectly.

### 7. Why not embed real Vim/Neovim

It is now technically possible (Neovim's wasm/emscripten browser demo merged in
2026; `nvim-wasm` runs the real process in a worker), but for this product it
trades the wrong things:

- 7.8–8.4 MB wasm vs a 260 kB single file; startup and memory on the target
  phone; COOP/COEP on GitHub Pages or Asyncify overhead.
- Neovim is driven as a **process over msgpack-RPC**, not called as a library;
  the game's key gating, coins, hazards and par counting would straddle that
  boundary (macros and `:normal` replay inside Neovim and bypass a front-end
  gate).
- Level lint, TRIALS verification, deterministic replay and the native-Vim
  oracle would need a second harness on top.
- The engine is not the frame-time bottleneck; replacing it does not make the
  game smoother.

Real Neovim belongs in an optional free-play mode or a development oracle, not
in the campaign engine. This program is how the campaign engine earns the word
"complete" without it.

### 8. First three tasks

1. ~~`tools/surface-audit.ts` + report~~ — done, strict CI gate.
2. ~~CI native-Vim oracle job~~ — done (`oracle` job: 373 cases + fuzz smoke).
3. ~~Phase B pilot: delete normalization (Q02/Q10) into `normalize.ts`~~ — done;
   next is the cursor policy (Q04/Q09) and Q03/Q06 in the same module.
4. **Phase C next:** close the 263 matrix divergences by family (counted
   `iw`/`aw`, `,`, `)` edges, quote objects), one rule at a time, with a matrix
   case turning into an oracle case for each fix. Then extend the matrix
   comparison from buffer+cursor to registers/mode/undo — still
   user-observable state.

### 9. One sentence

**Define the surface, make every rule in it named and oracle-linked, prove the
composition systematically, refuse the rest explicitly — that is what "the
engine is the product" means.**


---

## 부록 B — 미래 에디터 프로그램 (구 FUTURE_EDITOR)

> **Status: design only, not implemented.** The current program is engine
> fidelity, advanced motions/operators and the 51 single-buffer stages. The human
> explicitly asked for `:ls`/`:b`/`:bn`/`:bp`/`:bd`/`:bufdo`, alternate and
> hidden buffers, `:e`/`:r`/`:w file`, splits, tabs and windows **later**, not in
> this slice. This document is the contract for that later work.
>
> Read `ARCHITECTURE.md` and `MASTER_PLAN.md` first. Nothing here may break the
> existing invariant: every stage is one buffer, and its solution must keep
> winning in exactly `par` keys.

### 1. Why this is a separate program

Today `Vim` owns exactly one `Buffer` (`this.buf`), `Session` owns one `Vim`, and
`PlayScreen` renders one view. Commands such as `:b`, `:e`, `:sp` therefore have
no state to operate on. Adding them as string parsing over the same `buf` would
create a fake feature and a tangle of special cases.

The future model is:

```
Editor                 global: registers, macros, search, jumps, command history
├── BufferList         buffers by id, current, alternate (#), hidden/modified
│   └── Buffer         text, version, undo/redo, cursor, marks, buffer-local opts
├── Tabpage[]          tab-local window layout
│   └── Window[]       bufferId, cursor, scrollX/scrollY, height, focus
└── Ex dispatcher      :b :e :r :w :sp :vsp :tabnew :bufdo …
```

`Vim` remains the input/state machine and becomes the editor façade. Motions,
operators and text objects keep operating on the **active** `Buffer`; they must
not learn about buffers/windows. Rendering receives a view model
(`buffer + window + gutter options`) instead of reading `vim.buf` directly.

### 2. Phased delivery (do not reorder without measuring value)

#### Phase A — buffer registry and switching (highest value)

- Buffer id: stable integer or short name; display name/path.
- `:ls` list with `%` current, `#` alternate, `a` active, `h` hidden,
  `+` modified, line count.
- `:b[uffer] N|name`, `:bn[ext]`, `:bp[revious]`, `:bd[elete]`,
  `:bufdo {cmd}`, `:bwipeout` (optional), `#` alternate.
- Buffer-local: cursor, undo/redo, marks, options (`number`,
  `relativenumber`), changedtick. Global: registers, macros, search, jumps.
- Hidden rule: switching away from a modified buffer must not discard it. A
  `:bd`/`:bw` of a modified buffer asks for confirmation; the game may choose
  “hidden by default” to match `set hidden`.
- Stage safety: `Session`/`PlayScreen` may expose only buffer 1. Any attempt to
  switch in a stage is rejected with a friendly message unless a future level
  explicitly teaches it.

#### Phase B — files in a virtual filesystem

The browser has no real filesystem. Use an in-memory VFS plus explicit
import/export; never a server.

- `:e[dit] file` — open into current buffer (error if modified and not hidden/
  forced), or create a new buffer.
- `:r[ead] file` — insert file below the cursor line.
- `:w[rite] [file]` — write to VFS; with no name, reuse the current name.
  Download/export is a UI action, not an Ex side effect.
- `:wq`, `:x`, `:q`, `:q!` — close/quit semantics with modified-buffer checks.
- VFS scope: session memory, optionally persisted with the save code (size
  budget!). Stage buffers are ephemeral and never appear in `:ls` unless the
  stage says so.
- No `:!`, no shell, no terminal.

#### Phase C — windows and splits

- `:sp[lit] [file]`, `:vsp[lit] [file]`, `:new`, `:close`, `:only`.
- `<C-w>h/j/k/l/w/W/t/b`, `<C-w>c/q`, `<C-w>s/v`, `<C-w>=`.
- Each `Window` owns viewport/cursor/highlight; one `Buffer` can appear in
  multiple windows.
- Renderer: one canvas can draw multiple window rectangles (split borders,
  per-window statuslines) or use one canvas per window; measure both. Do not
  regress the single-window 60fps budget or introduce per-frame DOM.
- Keyboard-only focus: only the active window owns the cursor; statusline shows
  the active buffer id and `[N/M]`.

#### Phase D — tabs

- `:tabnew`, `:tabclose`, `:tabnext`/`:tabprevious`/`:tabfirst`/`:tablast`,
  `gt`/`gT`, `{N}gt`.
- One tabpage = a window layout + active window. Tabline already exists as
  chrome; wire it to the real tab list.
- `:tabdo` last, after `:bufdo`/`:windo`.

#### Phase E — command families and polish

- `:windo`, `:tabdo`, `:argdo` (if args exist), `:cdo` no.
- `:ls` flags, `:b#`, `:sbuffer`, `:badd`, `:bunload`.
- Completion for buffer names in the command line; history already exists.
- Error messages must be useful (`E86: Buffer N does not exist`, `E37: No
  write since last change (add ! to override)`).

### 3. Invariants and tests

Every phase adds tests, not just commands:

1. **Oracle**: real Vim with a temp file/dir. Cases for `:w`, `:e`, `:r`,
   `:bnext`, `:bd`, hidden/alternate, split cursor movement. The oracle harness
   must clean its temp dir even on failure.
2. **Session**: stage solutions still pass `lint:levels` unchanged. A stage may
   not silently switch buffers; gating stays first-key based.
3. **Unit**: buffer-local undo/cursor/marks are independent; global registers/
   macros are shared; `#` holds the previous buffer; modified/hidden rules.
4. **UI**: Playwright keyboard-only: open two buffers, switch, split, move
   focus, close one window, quit with/without changes, no mouse.
5. **Docs**: update `VIM_COVERAGE.md`, `ARCHITECTURE.md`, `MASTER_PLAN.md`,
   `HANDOFF.md` in the same commit. Remove rows from “not implemented” only when
   the tests exist.

### 4. What not to do

- Don't implement `:b`/`:sp` by parsing strings and mutating `vim.buf`; it will
  corrupt undo, marks and the renderer's cached frame.
- Don't add a server, browser filesystem API assumptions, or real `:!`.
- Don't teach buffer/window keys in existing stages; stage solutions and `par`
  are frozen. New teaching content (if any) is a separate curriculum decision.
- Don't claim `:w` wrote a file until the VFS/download path is tested.
- Don't let the 51 stages depend on hidden buffers; a stage is always one
  buffer and one window in this program.

### 5. Priority

Current work (engine fidelity and advanced motions/operators) comes first.
After Tier 2 (`g;`/`g,`, `=` indent) and the performance/cursor backlog are
green, Phase A is the next editor program. Phase B follows; C/D only if the
human still wants them after A/B are measured.
