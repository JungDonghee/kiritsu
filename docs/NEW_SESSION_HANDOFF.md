# KIRITSU — new session handoff (2026-11-15, flash 인계판)

> **저비용 모델(v4.1 flash)이 이어받는 경우 [`FLASH_HANDOVER.md`](../FLASH_HANDOVER.md)를
> 먼저 읽어라** — 해도 되는 일/하면 안 되는 일/게이트/푸시 절차가 전부 그 파일에 있다.
> 이 파일은 "처음 오는 AI가 읽을 순서"만 안내한다.

## Read first

1. `../FLASH_HANDOVER.md` — **flash 모델이라면 이것부터** (유지보수 전용 인수인계)
2. `AGENTS.md`
3. `stories/kiritsu/HANDOVER.md` — LOCKED CANON (필독)
4. `stories/kiritsu/NOVEL_STATUS.md` — 원고 상태·검토 27건·열린 결정
5. `stories/kiritsu/STORY_TO_GAME.md` — 게임 이식 매핑
6. `stories/kiritsu/ART_HANDOVER.md` — 일러스트 생성(다른 AI 담당)
7. `docs/STATUS.md`
8. `docs/DESIGN.md`
9. `README.md`

## Locked state

- Repository: `/home/jung/ai_station/sandbox/kiritsu` (GitHub `JungDonghee/kiritsu`)
- Live: https://jungdonghee.github.io/kiritsu/
- Design is **locked**: kanji-first `規律`, `CALL kiritsu` code strip, no Russian
  lettering, no sakura branch, laser reveal, centered KIRITSU layout.
- Do not redesign the title. Do not touch campaign first-clear solutions, par,
  gates, or level solutions.
- Engine baseline: state-matrix/document debt는 `docs/STATUS.md` 기준.
- **스토리 원고는 확정 상태다**: `stories/kiritsu/work/` 13편, 약 73,000자,
  검토 27건 반영, 규칙 검사 0건. 재집필하지 말 것.
- **미착수 항목**: 게임 이식(스토리 브리프/코덱스), 영어판·리츠 1인칭(사용자
  한국어판 독서 후 — 보류), 이미지 교체(다른 AI).

## Today's job (확정분 요약)

- 한국어판은 **사용자 독서·피드백 대기**. 피드백 도착 전에는 구조 변경 금지.
- 다음 단계 순서(피드백 반영 후): 영어판 → 리츠 1인칭 → 게임 이식
  (STORY_TO_GAME.md의 F0+F4 수직 슬라이스부터).
- 규칙: `stories/kiritsu/HANDOVER.md` §3.7(이름[한자]·은어 표기·PDF 요구),
  §3.8(여섯 가지 모호성 — 설명 금지) 절대 준수.
