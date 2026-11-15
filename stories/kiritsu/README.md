# KIRITSU — novel + KIRITSU(VIMLORE) game story-mode foundation

> **다음 AI는 먼저 [`HANDOVER.md`](HANDOVER.md)를 읽어라.** LOCKED CANON과 FREE 영역이 분리되어 있다.
> 원고 상태·검토 이력: [`NOVEL_STATUS.md`](NOVEL_STATUS.md). 게임 이식 매핑: [`STORY_TO_GAME.md`](STORY_TO_GAME.md).
> ⚠️ `vimlore/docs/STORY_BIBLE.md`의 기존 KIRITSU(네오도쿄 2091, 커서 07)와 **다른 캐논**이다. HANDOVER §3.7 참조.

## What this is

- AI 문명 사이버펑크 소설 (프롤로그 + 12장 + 장별 탈무드식 주석).
- **KIRITSU 게임(부제 VIMLORE) 스토리 모드의 서사 기반**. 세계와 게임이 모두 KIRITSU.
- 현재: 약 73,000자 / 13편 확정(work/ 정본) / 검토 27건 반영 완료 / 인쇄용 PDF 약 7MB.

## Files

| 파일 | 역할 |
|---|---|
| `work/*.md` | **정본 원고** — 프롤로그~12장 (13편). 이 파일들만 고친다 |
| `story-a/b/c.md` | 낡은 참고 초고 (빌드에 미사용, 참고용) |
| `story.md` | `concat.mjs`가 work/에서 생성 (빌드 입력) |
| `concat.mjs` | work/ 13편 결합 — 결합 전 규칙 검사 게이트 |
| `summary.md` | 설정·캐스트·이름 규칙 요약 |
| `HANDOVER.md` | **다음 AI 필독** — 캐논/자유/파일/함정/게임 연동 |
| `BEATS.md` | 장별 비트·추리 설계·수미상관 표 |
| `CHARACTERS.md` | 캐릭터·말투·아이콘 바이블 |
| `WRITING_BRIEF.md` | 집필 지시서 (FRAME) |
| `ART_HANDOVER.md` | **일러스트 생성 인수인계 단독 소스** (다른 AI가 생성) |
| `NOVEL_STATUS.md` | 분량·검토 27건 이력·열린 결정 |
| `STORY_TO_GAME.md` | 소설 → 게임 10층 매핑 설계 |
| `build.mjs` | story.md → book.html → KIRITSU.pdf (인쇄용) |
| `optimize-pdf.py` | pikepdf 최적화 (빌드가 자동 실행) |
| `illustrations.mjs` | CRT 벡터 삽화 (PDF 내) |
| `fixnames2.mjs` | 이름[한자]·은어 규칙 검사 (`--check`) |
| `KIRITSU.pdf` | 산출물 (인쇄용 ~7MB; 모바일 ≤5MB는 gs 환경에서 별도 생성) |

## Build

```bash
# 1) fonts (not tracked; place in fonts/)
#    NanumGothic-Regular.ttf, NanumGothic-Bold.ttf
#    NotoSansCJKkr-Regular.otf, NotoSansCJKkr-Bold.otf
# 2) 규칙 검사 게이트 + 결합
node concat.mjs          # fixnames2 --check 통과 시에만 story.md 생성
# 3) pdf
PLAYWRIGHT_BROWSERS_PATH=<playwright browsers> node build.mjs
```

## 보류 (사용자 지시)

- **영어판·리츠 1인칭 버전**: 사용자가 한국어판을 읽고 피드백한 **후** 진행.
- **이미지 교체**: `ART_HANDOVER.md` 대로 다른 AI가 생성 → `art/`에 같은 파일명으로 덮어씀.
