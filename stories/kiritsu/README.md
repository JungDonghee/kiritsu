# KIRITSU — novel + vimlore story-mode foundation

> **다음 AI는 먼저 [`HANDOVER.md`](HANDOVER.md)를 읽어라.** LOCKED CANON과 FREE 영역이 분리되어 있다.
> ⚠️ `vimlore/docs/STORY_BIBLE.md`의 기존 KIRITSU(네오도쿄 2091, 커서 07)와 **다른 캐논**이다. HANDOVER 7.5 참조.

## What this is

- AI 문명 사이버펑크 소설 (프롤로그 + 12장 + 장별 탈무드식 주석).
- vimlore 스토리 모드의 **서사 기반**.
- 현재: 42,927자 / 13 chapters / 12 주석 / PDF 7.0MB.

## Files

| 파일 | 역할 |
|---|---|
| `story-a.md` | 프롤로그 + 1~4장 |
| `story-b.md` | 5~8장 |
| `story-c.md` | 9~12장 |
| `story.md` | 3개 연결 (빌드 입력) |
| `summary.md` | 설정·캐스트·이름 규칙 요약 |
| `HANDOVER.md` | **다음 AI 필독** — 캐논/자유/파일/함정/게임 연동 |
| `build.mjs` | story.md → book.html → KIRITSU.pdf |
| `illustrations.mjs` | CRT 벡터 삽화 + 8인 초상 + 12장 아트 |
| `fixnames2.mjs` | 이름 표기 자동 보정 + 검사 |
| `KIRITSU.pdf` | 산출물 |

## Build

```bash
# 1) fonts (not tracked; place these 4 files in fonts/)
#    NanumGothic-Regular.ttf, NanumGothic-Bold.ttf
#    NotoSansCJKkr-Regular.otf, NotoSansCJKkr-Bold.otf
# 2) name check
node fixnames2.mjs
# 3) concat (the printf is required — without it chapters 5/9 headings merge)
{ cat story-a.md; printf '\n\n'; cat story-b.md; printf '\n\n'; cat story-c.md; } > story.md
# 4) pdf
PLAYWRIGHT_BROWSERS_PATH=<playwright browsers> node build.mjs
```

`build.mjs` resolves paths relative to itself; the Playwright package comes from the vimlore root (`../../package.json`).

## Art

- Current: CRT vector (bezels, scanlines, phosphor green, 8 portraits, 12 chapter scenes).
- Planned: FLUX 1.1 [pro] via `FAL_KEY` (fal.ai) — 21 images; text (Korean/Hanja) stays in HTML/SVG overlay, never baked into the image.

## Handover rule

`HANDOVER.md`가 단일 진실 소스다. 캐논이 바뀌면 HANDOVER를 먼저 고치고, 그다음 원고를 고친다.
