# DEBT — known engine debt

> 엔진 부채 원장. 게임 사용 표면은 0이고, 아래는 게임 밖(전체 에디터) 부채다. 숫자의 정본은 [`generated/STATUS.md`](generated/STATUS.md).

> **통합 문서.** 원본은 아래 부록으로 병합됐다(과거 기록은 git 이력에 남는다).


---

## 상태 매트릭스 부채 (구 STATE_DEBT)

> Game-used correctness is not the same as full-editor perfection. Keep both
> numbers visible; never call the engine perfect while this file is non-zero.

### Current

- Differential fuzz debt: **3 visual edge cases** in [`FUZZ_DEBT.md`](DEBT.md).
- Full observable-state matrix: **21,608 / 21,712 matched, 104 open**
  (`undo 95`, `reg 10`, `regtype 8`). Local-only; report regenerated with
  `npm run state-matrix -- --write`.
- Shipped stage solutions: **51 / 51** match real Vim (`npm run level-oracle`).
- Game-used solution + undo: **51 / 51** (`npm run level-oracle -- --undo`).
  c10s5 was fixed by reordering the level's own commands (not an engine hack);
  the last change is now the case operation, and its undo cursor is Vim-exact.
- All 51 stages have evidence-checked book citations; the citations are a
  build-time overlay and do not affect bundle/state.

### What the 104 mean

Most are **undo cursor** after edge-motion operators (counted/backward
linewise ops, visual ranges, `2>B`, `dgg`, etc.) and a few register/regtype
cases for count+text-object yanks. `dd`/`2dd`/`3dd`, multi-line motion deletes, and multi-line linewise
changes now follow probed Vim start-column rules; 95 undo cases remain. They are real Vim differences, not test noise and
are not silently waived.

### Priorities

1. Keep the **game-used** surface at zero: solutions and undo are 51/51
   (`GAME_USED_STATE.md`). A filtered command matrix can still be added if it
   remains exact.
2. Shrink full-matrix **undo** cases with a Vim-faithful cursor model, not
   stage-specific hacks. Do not touch a level to hide an engine difference.
3. Then register/regtype edge cases.
4. Never trade a green stage/level oracle for a full-matrix number.

### Non-goals

- Claiming 144fps without a 144Hz/GPU measurement.
- Faking Modern Vim levels before the documented engine surface exists.
- Adding runtime book citations; use the overlay.


---

## fuzz 부채 (구 FUZZ_DEBT)

A 2,000-case seeded differential fuzz (`npm run fuzz -- --n=2000 --seed=42`)
found three real Vim divergences that the current stage/state gates do not
exercise. They are recorded, not waived. CI's fuzz smoke is 500 cases/seed 7;
do not claim a globally perfect engine while this is non-empty.

Repro list (local): `/tmp/kiritsu-fuzz-failures-42.txt`

| id | text | cursor | keys | Vim | engine |
|---|---|---|---|---|---|
| fuzz-1069 | `a\nb\nc\nd` | 2,0 | `V)B><Esc>i!<Esc>` | `a`, `  b`, `  c`, `  d` | last line `d` not shifted |
| fuzz-1391 | `[1, 2, 3]` | 1,8 | `<C-v>)hy<Esc>i!<Esc>` | cursor col 8 | cursor col 7 |
| fuzz-1527 | `"hello world"` | 1,1 | `<C-v>)F"d<Esc>i!<Esc>` | `"` remains | `ello world"` remains |

Both are visual-mode range/curswant semantics, not shipped stage solutions:
`level-oracle` is 51 of 51 solution+undo and the 12 state classes in
`GAME_USED_STATE.md` are green. Treat these as the next engine task after the
deadline, with new oracle cases and a state-matrix shrinker.

### Rule

- Never change a stage to hide one of these.
- Add each repro to `tools/cases.ts` when fixed; keep the fuzz seed in CI.
- Prefer a Vim-curswant model for block Visual over per-motion patches.
