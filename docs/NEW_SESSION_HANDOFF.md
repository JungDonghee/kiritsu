# KIRITSU — new session handoff (2026-11-14)

## Read first

1. `AGENTS.md`
2. `docs/STORY_BIBLE.md`
3. `docs/stories/kiritsu/HANDOVER.md`
4. `docs/stories/kiritsu/story-a.md`
5. `docs/AUTOMATION_LOG.md`
6. `docs/STATUS.md`
7. `docs/DESIGN.md`
8. `README.md`

## Locked state

- Repository: `/home/jung/ai_station/sandbox/vimlore` (GitHub `JungDonghee/kiritsu`)
- Latest automation commit: `1b41b65` (repo renamed to `kiritsu`; **KIRITSU is the world and the game, VIMLORE is the subtitle**)
- Live: https://jungdonghee.github.io/kiritsu/
- Design is **locked**: kanji-first `規律`, `CALL kiritsu` code strip, no Russian
  lettering, no sakura branch, laser reveal, centered VIMLORE layout.
- Do not redesign the title. Do not touch campaign first-clear solutions, par,
  gates, or level solutions.
- Engine baseline: 104 full-editor state-matrix edges open; game-used
  solution+undo is 51 of 51. This is documented debt, not a game blocker.
- Story/LIVE/puzzle implementation was deliberately not started.

## Today's job

Story only. Start with a short decision pass, then one vertical slice.
The canon is **locked** in [`stories/kiritsu/HANDOVER.md`](stories/kiritsu/HANDOVER.md);
the novel rewrite mandate is [`stories/kiritsu/WRITING_BRIEF.md`](stories/kiritsu/WRITING_BRIEF.md).

Decisions to confirm with the user before porting the novel into the game:

1. How do the novel's 12 chapters + prologue map to the game's 10 floors?
2. What is the player's relationship to 리츠[律] — identical, replay, or the
   copy that becomes 리츠[立]?
3. Do 선택지 (신고/묵인, 수정/방치) branch the game, or does the game play the
   canon path with Vim skill as the only variation?
4. Which single ending is canon, and how do the 도달 방식 differ?
5. Does 칸노[監能]'s execution appear as a timer/interrogation, or as ex-mode
   verdicts?
6. Is the final 제1조 collapse a playable edit or a cutscene?

Deliverable after decisions:

- one c01 vertical slice: title → prologue beat → first Vim task → diegetic
  consequence → save/persistence;
- no new engine commands unless a story beat requires them;
- no LIVE or puzzle redesign yet;
- Korean UI copy plain/banmal only.

## Rules

- Run `npm run korean:check`, `doc-check`, tests, `status:check` before commit.
- Commit/push only when green.
- Do not claim the 104 state edges are zero.
- Do not restore Russian or the branch.
- Keep the page installable/offline and the single-file build self-contained.

## Suggested first message for the new session

> KIRITSU 스토리 작업 시작. 먼저 AGENTS.md, docs/STORY_BIBLE.md,
> docs/stories/kiritsu/HANDOVER.md, docs/stories/kiritsu/story-a.md,
> docs/AUTOMATION_LOG.md, docs/DESIGN.md를 읽어라. 디자인과 엔진은 동결됐고
> 캠페인/스토리 캐논은 네가 임의로 바꾸지 마라. 오늘은 스토리 결정 6개를
> 나랑 확정한 뒤 c01 수직 슬라이스 하나만 구현한다. 한국어는 반말로.
