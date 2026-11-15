# docs/ — 문서 지도 (READ THIS FIRST)

> 이 폴더는 KIRITSU의 문서 체계다. **여기서 시작하면 5분 안에 프로젝트를 파악할 수 있어야 한다.** 문서를 새로 만들기 전에 이 파일과 맨 아래 규칙을 읽어라.

## 1. 5분 읽기 순서

| 순서 | 문서 | 무엇을 얻나 |
|---:|---|---|
| 1 | [`../README.md`](../README.md) | 공개 소개·플레이 방법·현재 수치 한눈에 |
| 2 | [`HANDOFF.md`](HANDOFF.md) | 지금 상태·열린 작업·함정·AI 세션 규약 |
| 3 | [`NORTH_STAR.md`](NORTH_STAR.md) | 제품의 한 문장·불변식(트레이드오프 판단 기준) |
| 4 | [`ROADMAP.md`](ROADMAP.md) | 다음 우선순위(story → LIVE → PV-FULL)와 동결 규칙 |
| 5 | [`VIM_COVERAGE.md`](VIM_COVERAGE.md) | 엔진이 실제로 지원/미지원하는 범위 |
| 6 | [`generated/STATUS.md`](generated/STATUS.md) | 모든 수치의 단일 정본(oracle·매트릭스·스테이지·번들) |

역할별:
- **새 AI/기여자**: 1→2→3→4→5→6, 이후 작업 종류에 따라 `ARCHITECTURE`(코드), `CURRICULUM`(콘텐츠), `BOOKS`(책 파이프라인), `DEBT`(부채).
- **유지보수(저비용 모델)**: [`../FLASH_HANDOVER.md`](../FLASH_HANDOVER.md) → `HANDOFF.md` → `generated/STATUS.md`. 판단이 필요한 일은 멈추고 사용자에게 묻는다.
- **공개/배포 담당**: `../README.md`, `REPO_PRESENTATION.md`, `COMPLETION.md`, `COMPARISON.md`, `PWA.md`.
- **소설 담당**: `STORY_BIBLE.md` → [`../stories/kiritsu/HANDOVER.md`](../stories/kiritsu/HANDOVER.md)(캐논) → `../stories/kiritsu/NOVEL_STATUS.md`.

## 2. 정본(canonical) 문서 — 22개

| 문서 | 소유하는 것 | 갱신 규칙 |
|---|---|---|
| [`README.md`](README.md) | 이 지도·읽기 순서·문서 규칙 | 구조 변경 시 같은 커밋 |
| [`HANDOFF.md`](HANDOFF.md) | 현재 상태·열린 작업·함정·새 세션 시작 순서 | 상태가 바뀌면 갱신. 숫자는 STATUS 참조 |
| [`NORTH_STAR.md`](NORTH_STAR.md) | 한 문장·불변식·현재 게이트 진실 | 결정이 바뀔 때만 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | 레이어·파일 책임·빌드/배포 구조 | 코드 구조 변경 시 |
| [`VIM_COVERAGE.md`](VIM_COVERAGE.md) | 엔진 지원/미지원 경계 + 엔진 프로그램 부록 | 엔진 표면 변경 시 |
| [`CURRICULUM.md`](CURRICULUM.md) | 10층 커리큘럼·척추·마스터리·경쟁작 커버리지 | 스테이지/커리큘럼 변경 시 |
| [`CURRICULUM_PROVENANCE.md`](CURRICULUM_PROVENANCE.md) | 책 인용·근거 규칙·STAGE_MAP | 인용 규칙 변경 시 |
| [`LEVEL_FORMAT.md`](LEVEL_FORMAT.md) | 스테이지 저작 형식 | 포맷 변경 시 |
| [`BOOKS.md`](BOOKS.md) | 책 코퍼스·품질·감사·우선순위 | 파이프라인 변경 시 |
| [`STORY_BIBLE.md`](STORY_BIBLE.md) | 소설 캐논 포인터·게임 매핑 | 캐논 변경 시(캐논 자체는 stories/) |
| [`DESIGN.md`](DESIGN.md) | 시각 언어·CRT·한국어 문체 | 디자인 변경 시 |
| [`TITLE_KANJI.md`](TITLE_KANJI.md) | 타이틀 規律 규격 + 수작업 트레이싱 지시서 | 타이틀 작업 시 |
| [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md) | 폰트/한자 라이선스 | 자산 변경 시 |
| [`PWA.md`](PWA.md) | 설치·오프라인·landscape | PWA 변경 시 |
| [`QA.md`](QA.md) | 브라우저 QA·디버깅·UX 감사 | QA 절차/결과 변경 시 |
| [`DEBT.md`](DEBT.md) | state/fuzz 부채 원장 | 수치 변경 시 STATUS·STATE_REPORT 기준 |
| [`ROADMAP.md`](ROADMAP.md) | 업그레이드 프로그램·다음 단계·퍼즐 계약 | 우선순위 변경 시 |
| [`COMPLETION.md`](COMPLETION.md) | 완성도 판단 모델(가중치·근거) | 메트릭/단계 변경 시 |
| [`COMPARISON.md`](COMPARISON.md) | 경쟁작 비교·포지셔닝 | 분기별/릴리스 시 |
| [`REPO_PRESENTATION.md`](REPO_PRESENTATION.md) | GitHub 메타데이터·이미지 체크리스트 | 공개 메타 변경 시 |
| [`PROMPT_SYSTEM.md`](PROMPT_SYSTEM.md) | AI 작업 패킷·증거·핸드오프 스키마 | 프로세스 변경 시 |
| [`ONE_MESSAGE.md`](ONE_MESSAGE.md) | 새 세션에 붙여넣는 kickoff 메시지 | `npm run kickoff`로 최신화 |

## 3. 생성물(generated) — 손으로 고치지 않는다

`docs/generated/`의 파일은 도구가 만든다. 문서에서 수치를 인용할 때 **항상 이 파일을 참조**하고, 숫자를 손으로 복제하지 않는다.

| 파일 | 생성 명령 | CI 검사 |
|---|---|---|
| [`generated/STATUS.md`](generated/STATUS.md) | `npm run status:write` (build 후) | `npm run status:check` |
| [`generated/LEVELS.md`](generated/LEVELS.md) | `node --experimental-strip-types tools/gen-docs.ts` | `npm run levels:check` |
| [`generated/ENGINE_SURFACE.md`](generated/ENGINE_SURFACE.md) | `npm run surface:write` | `npm run surface:check` |
| [`generated/COMMAND_MANIFEST.md`](generated/COMMAND_MANIFEST.md) | `npm run count-matrix -- --write` | `npm run count-matrix -- --check-docs` |
| [`generated/MATRIX_REPORT.md`](generated/MATRIX_REPORT.md) | `npm run matrix` (real vim) | CI oracle job |
| [`generated/STATE_REPORT.md`](generated/STATE_REPORT.md) | `npm run state-matrix -- --write` | 로컬 전용(CI 불가) |
| [`generated/STAGE_PROVENANCE.md`](generated/STAGE_PROVENANCE.md) | `npm run provenance` | — |
| [`generated/BOOKS_INDEX.md`](generated/BOOKS_INDEX.md) | `npm run books:index` (로컬 책 필요) | — |
| [`generated/GAME_USED_STATE.md`](generated/GAME_USED_STATE.md) | `npm run level-oracle -- --write` (real vim) | CI oracle job에서 재생 |
| `generated/UX_AUDIT.json` | `npm run browser:audit` | — |

## 4. 기록(archive) — 역사 기록, 정본 아님

`docs/archive/`는 과거 스프린트/감사/폐기 계획의 스냅샷이다. **현재 수치나 우선순위를 여기서 인용하지 마라.** 새 역사 문서는 여기에만 추가하고, 루트 docs/에는 추가하지 않는다.

- `AUTOMATION_LOG.md` — 자동화 라운드 로그
- `SPRINT_2026-11-12.md`, `FINAL_REPORT.md`, `FINAL_CHECKPOINT.md` — 2026-11-12 스프린트 마감 기록
- `MASTER_PLAN.md`, `NEXT_PROMPT.md`, `EVALUATION.md`, `DIVINE_MOVE.md` — 폐기/대체된 계획
- `STROKE_RESEARCH.md` — 타이틀 획 리서치(현재 지시서는 `TITLE_KANJI.md`)

## 5. 문서 규칙 — CI가 강제한다

1. **수치는 `generated/STATUS.md`가 유일한 정본.** 새 숫자를 문서에 복제하지 말고 링크하라. (번들/게이트/스테이지/oracle 등)
2. **생성물은 수정 금지.** `docs/generated/`는 도구만 쓴다. stale이면 `npm run status:write` 등으로 재생성한다.
3. **루트 `docs/`는 정본만.** 새 문서는 (a) 이 표에 등록하고, (b) `tools/doc-check.ts`의 `CANONICAL` 목록에 추가해야 통과한다. 서브디렉터리(`generated/`, `archive/`)에만 파일을 추가하는 것은 자유다.
4. **병합 우선.** 같은 주제의 문서는 하나로 합치고, 과거 기록만 `archive/`로 보낸다. 새 "FINAL_*"/"SPRINT_*" 문서를 루트에 만들지 않는다.
5. **링크는 항상 살아 있어야 한다.** `npm run doc-check`가 README/AGENTS/정본 문서의 모든 상대 링크를 검사한다.
6. **onboarding 표면의 낡은 문구 금지.** `README.md`·`AGENTS.md`·`docs/README.md`·`index.html`은 금지 패턴 목록(구 제품 프레이밍, 낡은 state/oracle/번들 수치, 죽은 라이브 마커, 이동 전 생성물 경로)을 `npm run doc-check`가 검사한다.
7. **AGENTS.md·README.md·FLASH_HANDOVER.md는 루트 소유**이며, 이 지도는 그들과 모순되면 안 된다.

검증: `npm run doc-check && npm run levels:check && npm run surface:check && npm run status:check`

## 6. 파일 위치 요약

```
docs/
├─ README.md            ← 이 지도
├─ (정본 22개)          ← 위 §2
├─ generated/           ← 도구 생성(§3)
├─ archive/             ← 과거 기록(§4)
├─ browser/             ← 스크린샷 증거 (docs/browser/**)
├─ hero.jpg, play.svg, social-preview.png, fonts-OFL.txt …
└─ (그 외 이미지)
```
