# ONE-MESSAGE KICKOFF — paste this into another AI

> This is the shortest self-contained message that starts an autonomous KIRITSU
> session with filesystem + shell access. It does **not** contain the GitHub
> token; the token stays outside the repo. Current as of 2026-11-15.
>
> `npm run kickoff` prints this block with the current HEAD/date filled in.
> Document map and rules: [`README.md`](README.md). Priority authority:
> [`ROADMAP.md`](ROADMAP.md). Numbers: [`generated/STATUS.md`](generated/STATUS.md).

---

```text
You are taking over KIRITSU — the world and the game (subtitle VIMLORE: vim
taught as lore) — a real-Vim teaching game and novel at
/home/jung/ai_station/sandbox/kiritsu (GitHub JungDonghee/kiritsu, live
https://jungdonghee.github.io/kiritsu/). Base HEAD 0bc0111.

Work autonomously until you have a safe, verified stopping point. Do not ask me
to choose between routine implementation options; only stop and report if a
hard blocker (missing repo/tool access, missing token, or a gate you cannot
make green) actually prevents progress.

FIRST, before editing:
1. Read docs/README.md (5-minute doc map), AGENTS.md, docs/HANDOFF.md,
   docs/NORTH_STAR.md, docs/ROADMAP.md, docs/generated/STATUS.md.
2. Run: git status && git log --oneline -5
   npm run doctor
   npm test
   npm run lint:levels
   npx tsc --noEmit
   npm run doc-check
   npm run invariants
   npm run build
   npm run budget
   node --experimental-strip-types tools/oracle-diff.ts
3. Trust the gate output, not this message. If the checkout differs from the
   base HEAD above, re-baseline before trusting old numbers.

NON-NEGOTIABLE:
- Real `vim -u NONE` is the only oracle. Add an oracle case before changing Vim
  semantics; never change a level to fit a bug.
- Do not add stages or chapters. The existing 51 stages are frozen.
- Do not fake buffers/files/windows/tabs on the single Vim.buf; that program is
  deferred (docs/VIM_COVERAGE.md appendix B).
- The ten books in books-text/ are the syllabus; never invent a plausible
  lesson or a citation. Stage provenance is 51/51 cited.
- Keyboard-only, zero runtime dependencies, no server, no accounts, no secrets.
- Never print or commit the GitHub token (../.secrets/github_token). Scrub the
  remote URL after every push.
- Never commit red gates. A red CI job leaves the live Pages deploy untouched.
- Documentation: numbers live only in docs/generated/STATUS.md; canonical vs
  generated vs archive is enforced by `npm run doc-check`; a new doc must be
  registered in docs/README.md and tools/doc-check.ts.
- Current top task: manual 20-stroke tracing of the title 規律
  (docs/TITLE_KANJI.md). The novel is awaiting user feedback — do not rewrite it.

PRIORITY (full detail in docs/ROADMAP.md):
1. Title 規律 20-stroke manual tracing → build, title-check, verify,
   status:write, commit/push, verify Pages.
2. Novel: only after the user's Korean-read feedback; then English edition,
   1st-person Ritsu, game integration (STORY_TO_GAME.md F0+F4 vertical slice).
3. Game: story vertical slice → LIVE CIRCUIT / puzzle devices → integrated
   story → PV-FULL (every Practical Vim tip bucket) → Modern Vim.

DEFINITION OF DONE: oracle all green · tests · lint 51 · tsc · doc-check ·
levels:check · surface:check · invariants 0 errors · build · budget PASS ·
affected fuzz seeds clean · docs and HANDOFF updated in the same commit ·
git tree clean · pushed · CI and Pages green · live asset hash checked.

REPORT AT THE END: HEAD, CI/Pages, oracle/tests/lint/invariants, fuzz seeds +
divergences, build bytes + gzip, perf before/after, files changed, bugs fixed,
open repros, NOT VERIFIED list, and the next three tasks.
```

---

## How to use it

1. Open the host checkout on the machine where the next AI runs.
2. Paste the block above as the entire first message.
3. If the next AI cannot access the path, give it the repository:
   <https://github.com/JungDonghee/kiritsu> — it still needs the books for
   curriculum work, and the token only for pushing.
4. For a freshly generated message (current HEAD + date), run `npm run kickoff`
   and copy its output.

The message is deliberately explicit about **not trusting prose** and **not
starting a second workstream**. That is what makes one message enough to start;
it is not a guarantee that a remote chat service will run unattended for hours.
