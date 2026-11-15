# BOOKS — corpus, quality, audit workflow, priorities

> 10권 코퍼스의 추출·품질·감사·우선순위 파이프라인. 전문은 커밋하지 않는다(저작권). 인덱스는 [`generated/BOOKS_INDEX.md`](generated/BOOKS_INDEX.md).

> **통합 문서.** 원본은 아래 부록으로 병합됐다(과거 기록은 git 이력에 남는다).


---

## 책 파이프라인 (구 BOOKS_PIPELINE)

The ten source books live in `books-text/` (gitignored). Full text is **never
committed**; only derived metadata, headings and short citations are.

### Build

```bash
npm run books:build
```

Deterministic `tools/books/build_corpus.py` produces:

| artifact | committed? | purpose |
|---|---|---|
| `books-clean/<slug>.txt` | no | normalized text; 1:1 line mapping |
| `books-index/books.json` | yes | title/author, counts, checksum, review flag |
| `books-index/quality.json` | yes | extraction diagnostics |
| `books-index/chunks.jsonl` | no | 120-line AI chunks (12-line overlap) |
| `books-index/index.sqlite` | no | SQLite FTS5 search |
| `books-index/INDEX.md` | yes | human/AI heading index with exact line ranges |
| `books-index/parts.json` | yes | 6000-line audit work units for subagents |
| `books-index/agent-parts/*.json` | yes | subagent headings/problems/summaries |
| `books-index/agent-audit.json` | yes | validated merge of the audit |

**Coverage guarantee:** normalization never adds/drops lines. Every source
line maps to exactly one clean line; line endings/BOM/Unicode spaces/control
characters are normalized, tabs become spaces, trailing whitespace is stripped.
It does **not** rewrite prose or silently "fix" typos. `quality.json` flags
replacement characters, control characters, long lines, repeated page
headers/footers and hyphenated line endings for review. A clean extraction is
not a guarantee that the publisher's prose has no typos; that requires an
authoritative edition.

### Read/search (what an AI should use)

```bash
npm run books:stats
npm run books:search -- "text object"
npm run books:search -- "registers" --book practical-vim
npm run books:read -- practical-vim 1200 1240
npm run books:toc -- practical-vim
```

`books:search` returns exact `book:start-end` citations; `books:read` prints
the exact numbered lines. This is deliberately cheaper and more accurate than
pasting whole books into a model prompt. Use FTS terms (AND semantics); the
reader falls back to a literal search if the FTS query is malformed.

### Subagent audit

`books-index/parts.json` splits every book into ~6000-line units. Each audit
agent reads only its exact line range, emits headings with **exact evidence
lines**, and flags extraction defects (`missing`, `duplicated`, `garbled`,
`order`, `truncated`) with exact line numbers. It must write its JSON to
`books-index/agent-parts/<id>.json`; it must not rewrite prose.

`tools/books/merge_audit.py` validates every cited line against the clean text
and rejects a heading/problem whose evidence does not match. Run the audit
through the workflow tool (19 parts at current book sizes); then merge and
regenerate `INDEX.md`/`agent-audit.json`.

### Source-completeness warning

Line coverage proves that the extractor kept every line it was given; it does
**not** prove the source file is the complete book. The builder also checks
numbered chapter labels for gaps:

- **`neovim-for-beginners` is partial**: it starts at `c0`, jumps to `c119`, and
  has large label gaps. Do not use it as a complete syllabus until a complete
  source is supplied. The audit flags exact missing/order evidence.
- Other books show no numbered-chapter gap, but publisher ToCs must still be
  checked; the subagent audit is a triage, not a publisher proof.

The requirement "no missing book content" can only be met with complete
authoritative source files. The pipeline refuses to invent the missing text.

### Quality policy

- No silent spelling corrections: technical Vim terms and code would be damaged.
- No chunk gaps: chunks overlap but their union covers every line.
- Agent headings are candidates; publisher ToCs remain authoritative.
- Full text/book chunks/sqlite are local-only; do not commit them.


---

## 소스 품질 (구 BOOK_SOURCE_QUALITY)

Generated from `books-index/quality.json`, `coverage.json`, `agent-audit.json`
and `spellcheck.json`. This is a **triage report, not a correction log**.

### Hard numbers

- 10 books, **78,502 source lines**
- clean text line mapping: **78,502 / 78,502** (1:1, no dropped lines)
- chunk coverage: **78,502 / 78,502**
- audit-part coverage: **78,502 / 78,502** (19 parts)
- evidence-validated subagent headings: **2,554**
- extraction defects flagged: **129** — 92 garbled, 18 missing, 12 duplicated,
  5 order, 2 truncation
- subagent evidence mismatches rejected: **0** (the merge checks every cited
  line against the clean text)
- partial source: **`neovim-for-beginners`** (chapter-label gaps: c0→c9→…→c119;
  only the later material is present)

### What is guaranteed

- No line was silently dropped by normalization; BOM/CRLF/Unicode-space/control
  normalization is recorded.
- Chunks and audit parts cover every clean line.
- Every committed audit heading/problem cites an exact line that was verified.

### Priority two-book audit

Practical Vim + Modern Vim had a second, chapter-level audit (28 agents):
417 command citations, 336 concepts, 175 defect candidates, **0 rejected
evidence mismatches**. The deeper pass found 56 typo candidates and formatting
defects that the coarse 19-part audit missed. Neither book has a numbered-
chapter gap, but the source still contains flattened tables, glued tip headings
and typographic quotes in code. See `books-index/priority/ERRATA.md`. Nothing
was silently corrected.

### What is not guaranteed

- The source files are not publisher-authoritative scans/editions. The audit
  found 129 extraction defects, and `neovim-for-beginners` is materially
  incomplete. These cannot be repaired without a complete, authoritative source.
- **Typo-free prose cannot be claimed.** `books-index/spellcheck.json` contains
  hunspell candidates (technical terms are heavily over-represented); it is a
  review queue, not an autocorrect list. The pipeline never changes book prose.
- A heading is a candidate, not a publisher ToC entry.

### Spellcheck candidate counts

| book | candidates | book | candidates |
|---|---:|---|---:|
| 5 Years of Vim | 228 | Gourmet Vim | 424 |
| Learning vi/Vim | 4,037 | Modern Vim | 1,780 |
| Neovim for Beginners | 500 | Practical Vim | 1,900 |
| Pro Vim | 2,802 | Use Vim Like A Pro | 174 |
| Vim 101 Hacks | 524 | Vim Reference Guide | 771 |

To meet "no missing content" for all ten books, supply complete source editions
for at least the flagged files. Do not let an AI fill gaps from memory.


---

## 감사 워크플로 (구 BOOK_AUDIT_WORKFLOW)

This is the automation contract for auditing the ten Vim books without
hallucinating content. It runs **same-model subagents** in waves (the active
child limit is 8 here); each agent reads only its assigned 6000 lines.

### Inputs

- `books-index/parts.json`: 19 units, each `{id, book, start, end, sha256}`.
- `books-clean/<slug>.txt`: local full text (gitignored).
- Output: `books-index/agent-parts/<id>.json`.

### Rules for each agent

- Read **only** the assigned 1-based line range (`sed -n 'start,endp'` in
  ~1000-line chunks).
- Never use memory of the book, never rewrite prose.
- Heading: `line`, exact `title`, exact `evidence` line. Omit if uncertain.
- Problem kinds only: `missing`, `duplicated`, `garbled`, `order`, `truncation`;
  exact evidence line.
- Summary is explicitly a summary (1–2 sentences); concepts are short tags.
- Write the JSON file; final response only `{id, ok, note}`.
- Do not edit other files.

JSON shape:

```json
{"id":"book-audit-01","book":"slug","start":1,"end":6000,
 "headings":[{"line":1,"title":"...","evidence":"..."}],
 "problems":[{"line":1,"kind":"garbled","evidence":"..."}],
 "summary":"...","concepts":["..."]}
```

### Waves

Run at most **8** agents at once, with 6000-line parts, sequentially in waves.
A workflow script should construct parts from `books-index/parts.json` (or the
same 6000-line rule), call `agent()` with the schema and prompt above, and
write outputs to `books-index/agent-parts/`.

### Validation / merge

```bash
npm run books:merge
```

`tools/books/merge_audit.py` rejects any heading/problem whose evidence does
not exactly match the cited clean line; duplicates across overlapping units are
deduped. `books:audit` data is never accepted as book text or as publisher
proof.

### After merge

- Regenerate `docs/generated/STATUS.md` (`npm run status:write`).
- Regenerate `docs/BOOKS.md`/`INDEX.md` if headings changed.
- Commit `books-index/agent-parts/`, `agent-audit.json` and metadata; never
  commit `books-clean/`, `chunks.jsonl`, or `index.sqlite`.


---

## 우선순위 책 (구 PRIORITY_BOOKS)

`Practical Vim` (2nd ed.) and `Modern Vim` are the curriculum's primary pillars.
They are indexed with real Part/Chapter/Tip boundaries in
`books-index/priority/`; full text remains local-only.

### Structure

```bash
npm run books:priority
```

- `practical-vim`: 21 chapters, **123 body tips** (the early `Tip N.` lines are
  the table of contents and are excluded by the parser), 6 parts.
- `modern-vim`: 7 chapters, **28 body tips**.
- `books-index/priority/PRIORITY.md` lists every chapter/tip with exact line
  ranges. The chapter audit adds summaries, commands and concepts.

### Deep audit (2026-11-12)

```bash
npm run books:priority:merge
```

Same-model subagents read one chapter each (28 chapters total). Every
command/concept/defect had to cite an exact evidence line; the merge rejected
**0** mismatches. Results: `books-index/priority/audit.json` and
`PRIORITY_AUDIT.md`.

- Practical Vim: 21 chapters, **123 body tips**
- Modern Vim: 7 chapters, **28 body tips**
- **417 commands, 336 concepts, 175 defect candidates**
- Defect kinds: 80 garbled, **56 typo candidates**, 27 missing, 5 duplicated,
  4 order, 3 truncation
- The 56 “typos” include genuine prose errors (`exectuables`, `quiting`,
  `programatically`) and extraction artifacts (glued `Tip 7Finding`, curly
  quotes in code). They are **not auto-corrected**; see
  `books-index/priority/ERRATA.md`.
- These two sources have no numbered-chapter gap, but they are not
  publisher-authoritative: typographic-quote/code and flattened-table defects
  remain visible.

### Reading shortcuts

```bash
npm run books:priority:read -- toc practical-vim
npm run books:priority:read -- tip practical-vim 9
npm run books:priority:read -- chapter modern-vim 5
```

`CURRICULUM_MAP.md` is a **key-overlap** report, not semantic coverage: the
same key can mean different things in a different mode/context. Verify the
book meaning and stage before using it as curriculum evidence.

### Why these two first

- Practical Vim supplies the editing grammar (dot formula, motions, text
  objects, registers, macros, patterns, substitutions, quickfix).
- Modern Vim supplies the environment layer (packages, fzf, projections,
  terminals, sessions, configuration) that the later chapters touch.
- Other eight books remain secondary/supporting material.

This is an index/audit, not permission to copy the books. Do not commit
`books-clean/` or paste long passages into the game.
