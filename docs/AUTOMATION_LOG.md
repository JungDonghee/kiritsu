# KIRITSU autonomous automation log — 2026-11-13

Window: **until 23:58 KST**. Story/LIVE/puzzle work is explicitly deferred until
the user returns. Campaign first-clear determinism, par, gates, solutions and
story canon must not change.

## Active automations

- Goal `goal-45d65ecd-1f21-4649-988f-1c653abee9f2` — max 12 rounds.
- `schedule-1b6a9f80-619a-4708-bbc3-840687efe27d` — every 30 min from 21:00
  until 23:55 KST, this session.
- `schedule-8ed2dbf2-fc91-4465-b7de-8a49d3f831df` — final checkpoint 23:45 KST.

## Baseline at 20:46 KST

- HEAD `f6d508b` (before this log); live Pages green.
- Tests 39 of 39; real-Vim oracle 373 of 373; level-oracle 51 of 51.
- State matrix has known undo-cursor divergences. An attempted blanket linewise
  undo-column fix broke `2cj` (`undo` column 2) and was reverted. No engine
  change is committed in this window yet.
- Single-file title inlines the Ouyang SVG; gate 420,000 raw / 140,000 gzip.
- CI and Pages green for `f6d508b`.

## Rules for every round

1. One isolated change; measure before/after state-matrix.
2. Revert immediately on any oracle/level/test/state regression.
3. Run tests, oracle, state-matrix, level-oracle, tsc, build, budget, PWA QA,
   Korean/doc/status gates.
4. Commit/push only green. Never touch campaign first-clear data or story canon.
5. Stop at 23:58 KST. Leave this log current.

## Round 1 — 20:46–21:00 KST

- Re-read the goal, workspace, and baseline.
- Confirmed `HEAD` was `dc1e218`; engine baseline was clean.
- State-matrix baseline: **21,593 / 21,712 matched, 119 divergences**
  (undo 110, reg 10, regtype 8). Real-Vim oracle 373 of 373, level-oracle 51 of 51.
- Attempt 1: overwrite visual shift undo with the anchor column. Regressed
  many `v0>`/`vG>` cases (field count rose sharply); reverted.
- Attempt 2: make all empty linewise deletes undo at column 0. Fixed some
  `dgg` cases but broke `2dj`/`2dd` (Vim keeps the command column); reverted.
- Attempt 3: derive a broad "range start vs command column" rule for linewise
  delete/change and charwise shift. It fixed some examples but raised
  divergences to 603; reverted.
- No engine change is committed. The goal remains active; next round will
  isolate one motion family and add a focused differential fixture instead of
  changing the shared undo path globally.
- Public/release work already green before this round: self-contained
  `dist/kiritsu.html`, measured 420k/140k gate, final hero/social/OG, GitHub
  About/topics, CI and Pages.

## Round 2 — 21:00–21:15 KST

- Read Vim's `undo.c` restore path. The real rule is: save the pre-change
  cursor, restore its column only if the post-change cursor stayed on the same
  line, otherwise `beginline(BL_SOL | BL_FIX)`; special-case a one-line offset.
- Applied that model to linewise deletes only. It matched 81 of the 118 undo
  failures in a dry prediction, but the real engine run rose to **256**
  divergences because the engine's post-command cursor differs on empty-buffer
  and counted-range cases. Reverted.
- Tried isolated `dd`/`2dd` column and visual-line-column overrides; each broke
  more already-correct cases than it fixed. All reverted.
- **No engine change committed.** Game-used undo remains exact:
  `level-oracle -- --undo` = **51 of 51**.
- Full matrix remains 21,593/21,712 (119 open: undo 110, reg 10, regtype 8).
- Next round: add a tiny fixture around one command (`dd`, `dgg`, or `Vj>`),
  probe Vim's exact pre/post cursor, and fix only that command. Do not change
  the shared undo path again.

## Round 3 — browser audit

- Found a real non-engine regression: portrait `390x844` and `320x568` title
  had off-viewport bootlog/petal elements behind the rotate gate.
- Added a portrait-only rule that hides the metric rails and petals; the gate
  remains. `npm run browser:audit`: **50 screens/viewports, 0 overflow, 0 page
  errors**.
- Engine still at the 119-open baseline; no undo change committed. Game-used
  stages remain 51 of 51 solution+undo.

## Round 4 — dd fixture probe

- Probed real Vim for `dd`, `2dd`, `3dd` at columns 0/1/2. Confirmed:
  - `2dd`/`3dd` preserve the command column when the buffer remains nonempty;
  - single `dd` does not (except indented-line cases), and deleting the last
    line zeros the column.
- Applied only the counted-linewise case (`count > 1`, buffer nonempty).
  State matrix moved from 119 to **121** divergences; two previously matching
  cases regressed. Reverted immediately.
- No engine change committed. Baseline remains 119 (undo 110, reg 10,
  regtype 8); game-used solution+undo remains 51 of 51.
- Portrait overflow fix from the prior round stays green:
  `browser:audit` = 50 screens/viewports, 0 overflow, 0 page errors.
- Rebuilt and verified: tests 39 of 39, oracle 373 of 373, budget
  402,788 / 131,115, PWA QA and STATUS green.

## Round 5 — first real reduction

- Added a narrow engine rule: counted **doubled** linewise delete (`2dd`, `3dd`)
  restores the command column on undo when the buffer remains nonempty. This is
  the exact Vim behavior probed for `2dd`/`3dd`; it deliberately does not touch
  `2d%`, `dgg`, `2dj`, single `dd`, or visual ranges.
- State matrix: **119 → 118** divergences (matched 21,593 → 21,594; undo
  110 → 109). No new failures; `m-14904` fixed.
- Added a regression test to `tests/vim.test.ts`.
- Oracle 373 of 373, level-oracle 51 of 51 solution+undo, tests 39 of 39,
  build/budget/PWA/status green.

## Round 5b — single dd indentation

- Probed Vim: single `dd` keeps `min(command column, first non-blank)` when the
  deleted line is indented; plain lines land at 0. `2dd`/`3dd` keep the command
  column when the buffer remains.
- Fixed the effective count (`0` means count 1) and implemented the two narrow
  doubled cases. State matrix: **119 → 117** (matched 21,595; undo 108; reg 10;
  regtype 8). `m-8864` and `m-14904` fixed; no new failures.
- Added regression tests for both. Oracle 373 of 373, level-oracle 51 of 51
  solution+undo, tests green, build/budget/PWA green.

## Round 6 — linewise motion deletes

- Probed Vim's linewise delete undo for `dgg`, `dG`, `dB`, `2dgg`, `dk`:
  - a multi-line motion delete lands on the range's first line;
  - if the range starts on the command line, keep the command column;
  - if it crossed from another line, use that line's first non-blank;
  - `dk` is the exception: non-empty undo is column 0, an emptied buffer keeps
    the command column.
- Implemented only for non-doubled multi-line motion deletes; text objects,
  single-line deletes, visual ranges, and `dd` keep their existing probed rules.
- State matrix: **117 → 108** (matched 21,604; undo 99; reg 10; regtype 8).
  No new failures; 11 old failures removed.
- Added `dgg`/`2dgg`/`dk` regression tests. Oracle 373 of 373, level-oracle
  51 of 51 solution+undo, build/budget/PWA green.

## Round 7 — change/shift probes

- Tried extending the linewise start-column model to multi-line linewise
  **change** (`cgg`, `2c%`). It raised divergences from 108 to 126 by breaking
  `cj`, `cG`, `cc`, and visual cases; reverted.
- Tried a visual-line delete anchor override: no net change; reverted rather
  than keeping an unproven rule.
- Tried a charwise `w`/`W` shift special case: no net reduction; reverted.
- No engine change committed this round. Stable baseline is **108** from
  `3fc33ba` (undo 99, reg 10, regtype 8); game-used solution+undo 51 of 51.
- Browser audit remains 50 screens/viewports, 0 overflow, 0 page errors.

## Round 8 — visual-line probes

- Probed visual-line undo cases: `Vkd`/`Vk>`/`Vk<` keep the anchor column,
  `Vggd`/`Vgg>`/`Vgg<` use the range-start first non-blank, and
  `Vkc`/`Vggc` use the last changed line.
- Attempted a `V`-line-only branch using `visualMotionKey`; the matrix stayed at
  108 because the branch did not reach the visual delete/shift paths (the
  visual operator path clears the key before the undo write). Reverted to avoid
  carrying a no-op rule.
- Stable baseline remains **108** (matches 21,604; undo 99; reg 10; regtype 8).
  Game-used solution+undo 51 of 51.
- Browser audit remains 50 screens/viewports, 0 overflow, 0 page errors.

## Round 9 — visual anchor lifetime

- Found why the prior visual-line rule was a no-op: `visualKey()` clears
  `visualAnchor` before `deleteRange()`, so the delete path sees null.
- Attempted to keep the anchor through visual delete and apply the k/gg column
  rules. Matrix worsened (108 → 206) because the anchor is also consumed by
  the visual mode teardown; reverted immediately.
- Attempted the smaller multi-line-delete-only version: 108 → 174; reverted.
- No engine change committed. Stable baseline remains **108** (matches 21,604;
  undo 99; reg 10; regtype 8). Game-used solution+undo 51 of 51.
- Browser audit remains green: 50 screens/viewports, 0 overflow, 0 errors.

## Round 10 — multi-line linewise change

- Probed `cgg`, `2cgg`, and `2c%` against Vim:
  - uncounted `cgg` uses the range-start first non-blank;
  - counted `2cgg` keeps the command column;
  - `2c%` uses the range-start first non-blank;
  - undo line is the last changed line.
- Implemented only `gg`/`%` multi-line linewise changes. `cj`, `cG`, `cc`,
  text-object, visual, and single-line changes keep their existing rules.
- State matrix: **108 → 104** (matched 21,608; undo 95; reg 10; regtype 8).
  No new failures; 15 old failures removed.
- Added regression tests. Oracle 373 of 373, level-oracle 51 of 51
  solution+undo, tests, build/budget/PWA green.

## Round 11 — shift gg probe

- Probed normal `>gg`/`<gg`/`2>gg` undo columns. The correct rule depends on
  whether the shifted range starts on the command line, and the first attempt
  (always range-start first non-blank) traded seven old failures for seven new
  ones.
- Refined with the command-line test; the matrix worsened to 117 because the
  shift path's range/cursor relation is normalized differently. Reverted.
- No engine change committed. Stable baseline is **104** from `78df60c`
  (matches 21,608; undo 95; reg 10; regtype 8). Game-used solution+undo
  51 of 51. Browser audit remains green.

## Final closeout — round 12

- Engine: **119 → 104** full observable-state divergences this automation
  window (undo 110 → 95), with no new failures. Game-used solutions+undo remain
  **51 of 51**; campaign first-clear data, par, and gates were not modified.
- Fixed families: counted `dd`/`2dd`, `dgg`/`dG`/`dB` multi-line motion deletes
  with the `dk` exception, and multi-line `cgg`/`2cgg`/`2c%` changes. Each has a
  regression test in `tests/vim.test.ts`.
- Full gates: tests 39 of 39, level lint 51 of 51, oracle 373 of 373,
  level-oracle 51 of 51, state matrix 21,608 of 21,712 (104 open), invariants
  0 errors, build 403,106 B raw / 131,233 B gzip (ceiling 420,000 / 140,000),
  PWA check+QA, presentation, Korean, doc-check, STATUS, browser audit
  (50 screens/viewports, 0 overflow, 0 page errors) all green.
- Public face stayed on the final kanji-first title; single-file title asset is
  inlined; README/hero/social/OG and GitHub About/topics are current.
- No story canon, LIVE, or puzzle redesign was started.

## 21:30 scheduled continuation — visual undo anchor

- Added a separate `visualUndoAnchor` copy so visual delete/change can compute
  the undo write without changing `visualAnchor` lifetime.
- Restricted it to `V` + `k`/`gg`. It fixed the targeted delete/shift cases but
  broke different `Vk>`/`Vgg>` cases whose Vim undo column is not the anchor;
  the matrix rose to 112. Reverted.
- No engine change committed. Stable baseline remains **104** (matches 21,608;
  undo 95; reg 10; regtype 8). Game-used solution+undo 51 of 51.
- Next safe attempt requires a focused Vim probe of the visual `k`/`gg` range
  orientation before touching the anchor path again.

## 22:00 scheduled continuation — cB/cb probe

- Probed `cB`/`2cb` undo columns and tried the range-start first non-blank
  rule, plus setting the operator motion key at the top of
  `finishOpWithMotion`. Neither changed the matrix: those cases use the special
  backward `b`/`B` operator branch, which still bypasses the change-column
  model. Reverted.
- No engine change committed. Stable baseline **104** (matches 21,608; undo 95;
  reg 10; regtype 8). Game-used solution+undo 51 of 51.

## 22:30 scheduled continuation — special cB path

- Traced `cB`/`2cb` into the backward `b`/`B` special operator branch.
- Set the operator motion key before that branch's `applyOp` and added the
  `b`/`B` first-non-blank change-column rule. Matrix unchanged at 104; the
  branch still emits a range shape that the change-column code treats as
  single-line. Reverted as a no-op.
- Stable baseline **104** (matches 21,608; undo 95; reg 10; regtype 8).
  Game-used solution+undo 51 of 51; browser audit green.

## 23:00 freeze

- No further engine changes: the last three isolated probes (visual anchor,
  special cB, shift gg) were reverted and the stable baseline is **104**.
- Working tree clean; CI and Pages are green for `adb4d77`.
- Final gate snapshot: tests 39 of 39, oracle 373 of 373, level-oracle 51 of 51
  solution+undo, state matrix 21,608/21,712 (104 open), build 403,106 raw /
  131,233 gzip, PWA check+QA, browser audit 50/50 clean.
- Freeze engine/campaign/story until the 23:45 closeout task. Do not start
  story/LIVE/puzzle work.

## 23:45 final checkpoint

All requested gates green: tests 39 of 39, level lint 51 of 51, tsc clean,
oracle 373 of 373, level-oracle 51 of 51 solution+undo, state matrix
21,608/21,712 (104 open: undo 95, reg 10, regtype 8), invariants 0 errors,
build 403,106 raw / 131,233 gzip, PWA check+QA, presentation, Korean,
doc-check and STATUS. PWA QA refreshed the landscape title screenshot.
No campaign, first-clear, par, gate, or story change. Engine remains frozen at
the 104-open baseline; 15 full-matrix cases were fixed this window with no new
failures. Automation stops at 23:58 KST.

## Repo rename

GitHub repository renamed `vimlore` → `kiritsu`; VIMLORE is now the **game's** subtitle (정정: 세계 이름은 KIRITSU, VIMLORE는 게임 부제 — 사용자 최종 확정). Live moved to <https://jungdonghee.github.io/kiritsu/>. README hero, desktop title, first chamber, PWA/portrait screenshots, OG/social cards, package name, and the downloadable `kiritsu.html` were refreshed. Legacy `vimlore.html` download remains as an alias.

## 2026-11-15 — naming cleanup: vimlore → kiritsu (로컬 경로·문서·빌드 별칭)

- 로컬 체크아웃 `/home/jung/ai_station/sandbox/vimlore` → `.../kiritsu`; Playwright
  캐시 `.vimlore-browsers` → `.kiritsu-browsers` (QA 스크립트·문서·절차 동기화).
  git identity는 `KIRITSU <dev@kiritsu.local>`로 변경 (과거 커밋 이력은 유지).
- **레거시 빌드 별칭 제거**: `dist/vimlore.html`과 `dist/download/vimlore.html`을
  더 이상 생성하지 않는다. 단일 파일 정본은 `dist/kiritsu.html`이고
  `tools/pwa-check.mjs`도 이를 검사한다. 기존 `/vimlore.html` 링크는 배포 후 404.
- 사용자 노출 문구에서 "VIMLORE = 세계" 오표기 교정: index meta description,
  `manifest.webmanifest`, README Play 버튼(aria-label), style 헤더. **VIMLORE는
  게임 부제로만 유지**하며 AGENTS.md에 단일 규칙(single source)을 추가했다.
- c10s3 스테이지 텍스트의 옛 URL `vimlore.example/weave` → `kiritsu.example/weave`
  (동일 바이트 길이 — `J`/`gJ` 조인 솔루션 무변경, level-oracle green).
- 내부 식별자(`vimlore.save.v2`, `vimlore.sound`, 게임 내 히스토리 문서)는
  기존 플레이어 세이브 호환을 위해 의도적으로 유지.
- 게이트: tests 50/50, lint:levels 51/51, tsc clean, doc-check/invariants clean,
  build 409,018 B raw / 133,924 B gzip (한계 420k/140k), pwa:check·title:check·
  presentation:check·korean:check OK, STATUS current, level-oracle 51개 스테이지
  전부 일치.
  real-Vim oracle·matrix는 푸시 후 CI가 재확인.

## 2026-11-15 — 타이틀 v3 · 플레이 인트로/타이핑 · UI·고스트 정리

- **타이틀 規律 인트로 v3**: 캔버스 잉크 분석(무게중심 다단계 스냅 + 국소 두께)으로
  획별 테이퍼 붓 리본을 만들고 rAF가 clipPath를 직접 갱신한다(CSS 클립 애니메이션
  제거). 20획 0.7–4.46s, settle ~5.8s, 1920 headless 40–46fps — 기존 26.5fps/얼룩
  프레임을 대체. `docs/TITLE_KANJI.md` v3로 갱신.
- **단일 파일 경량화**: `inline.mjs`가 칸지 SVG data URI를 정수 좌표·공백 압축으로
  인라인(원본 SVG 불변). raw 약 30KB 절감 → 현재 **389,785 B raw / 129,151 B gzip**
  (ceiling 420k/140k).
- **플레이 브리핑**: `.board.veiled` → 브리핑 typewriter(공용 Typing 헬퍼, caret) →
  620ms dwell → BEGIN DOM 등장 → 700ms Enter guard → 보드 wake. 브리핑/힌트/코치
  타이핑 + 사운드 큐(type/whoosh/open/hint/brush/ghost/chime). reduced-motion 즉시.
- **고스트**: `ghostRun` 토큰으로 재시작/이탈 레이스 차단, frame-cache reset via fit(),
  HUD 키/하트는 live 세션 기준, 복원 verbatim(버퍼·커서·모드·undo·키 등) 확인.
- **UI/버그픽스**: 숏 랜드스케이프 설정 카드 grid 겹침 수정(2열은 브리핑에만),
  비싼 filter 애니메이션 제거, 페탈 24개+인트로 후 감축, toast 단일 슬롯,
  세이브 가져오기 브라우저 alert → 인게임 토스트, 모바일 overscroll/터치 지연 방지.
- **세이브 위생**: `sanitizeProgress` 도입으로 손상 세이브(stats/profile null) 승리 시
  크래시(P1) 방지 + `tests/progress.test.ts` 4개 추가(총 54 tests).
- **PWA Esc 종료 방지**: capture 단계 Esc preventDefault + standalone history back 트랩
  + 전체화면 시 Keyboard Lock(['Escape']) 시도.
- 검증: tests 54/54, lint 51/51, tsc·doc-check·invariants clean,
  build/budget/pwa/title/presentation/korean 그린, level-oracle 51개 스테이지 전부 일치, STATUS current.
  ui-audit: P0 없음, P1(Enter-mash) 수정 확인, ghost 복원 diff [] 확인.

## 2026-11-15 — 타이틀 v4(캔버스 잉크 타임라인) · 픽셀 벚꽃 · 결과 키보드 · 타자 연출

- **타이틀 規律 v4**: 클립/폴리곤 리빌을 버리고 **캔버스 잉크 타임라인**으로 재설계.
  글자 래스터 + EDT + 보로노이 잉크 배정 → 점별 필요 반폭 → 소프트 붓 스탬프로
  마스크를 키우고 글자를 `destination-in` 합성. **획이 끝나면 그 획 잉크는 100%
  덮이고**, 마지막 프레임은 원본 글자를 그대로 그려 **팝이 없다**(커버리지
  20.48%→20.90% 측정). 타이틀 재진입 시 잉크 분석/글자 캔버스 캐시.
  title-check는 캔버스 커버리지·완료 상태 검사로 갱신(38~43fps headless).
- **픽셀 벚꽃 무한 흩날림**: 8×9 notched sakura 스프라이트(data URI mask +
  `image-rendering:pixelated`, 핑크 바디 + 딥핑크 1px rim), 24개. 낙하/좌우
  sway+회전/나비 scaleX 플립의 3중 transform-only 애니메이션, 페탈별 랜덤
  duration/delay/amplitude. 인트로 후에도 계속 흩날리고, crt-off/reduced-motion
  에서도 의도된 룩.
- **모바일 결과 키보드 스크롤**: 844×390에서 결과 카드가 한 화면에 들어오게
  compact CSS. j/k·PgUp/PgDn·Ctrl-d/u·g/G·Home/End 스크롤 + 포커스 이동 시
  scrollIntoView. 강제 오버플로 테스트로 PageDown→NEXT 복귀 증명.
- **레벨 선택 타자 연출**: 공용 `Typewriter`(app.ts, 단일 텍스트노드+`.type-caret`,
  화면 이동 시 취소, 첫 키로 완성, reduced-motion 즉시). 지도 선택 층 story,
  챕터 브리프 stagger, 결과 GOLF 한 줄 타이핑 + type/select/back/move 사운드.
- **UI**: fade+slide 화면 전환, 포커스 링 강화, 챕터 브리프 전부 표시(스크롤).
- 번들: **396,504 B raw / 130,597 B gzip**(ceiling 420k/140k). 검증: tests 54/54,
  lint 51/51, tsc·doc-check·invariants·build·budget·pwa·title·presentation·korean
  그린, level-oracle 51개 스테이지 전부 일치, STATUS current.

## 2026-11-15 (2) — 획순 v5 · CRT 전 화면 확장 · 설정 내비 수정 · PWA Esc · 소설 한자 폰트

- **타이틀 획쓰기 v5**: KanjiVG(CC BY-SA 3.0, 참고용) 기반 실제 일본어 획순/중심선을
  Yuji Boku 잉크에 ±7px 스냅. 진행 중 획은 붓끝(tip), 획이 끝나면 그 획만
  tip→cover로 잉크가 스며들며 채워짐 — 전체 일괄 정착 제거로 "마지막에 확" 없음.
  최종 20.9% 커버리지/팝 없음, title-check 39fps headless.
- **CRT 벡터 디스플레이 전 화면 확장**: 오버레이(z70)가 #app 스캔라인(z60) 위라
  결과/설정/브리핑/도움말이 평평했음. overlay·card·intro/results/help 카드에
  스캔라인·애퍼처 그릴·비네트·코너 브래킷·형광 글로우·빔 스윕을 직접 적용.
  버튼은 벡터 베벨/모서리 컷. crt-off·reduced-motion 대응.
- **설정 내비게이션 수정**: h/j/k/l가 1D 순서라 j(아래)가 옆 버튼으로 가고
  아래로 내린 뒤 위로 복귀가 안 되던 문제 → **기하 기반 2D 포커스 이동**
  (`focusSpatial`) + 카드 자체 스크롤(Ctrl-d/u, PgUp/PgDn, g/G). 844×390에서
  jjj→scrollTop 66, kkkk→scrollTop 0/맨 위 복귀 검증.
- **PWA Esc 방어 강화**: 설치 앱 첫 제스처에서 전체화면+Keyboard Lock(Escape),
  capture 단계 preventDefault, history 트랩 유지. Android가 키보드 Esc를 시스템
  BACK으로 변환하는 경우는 웹에서 차단 불가(문서화).
- **소설 한자 폰트 통일(Yuji Boku, OFL)**: 원고의 한자 15자
  `人功唯審律憑抗月監立能規起零霊` 를 전체 Yuji Boku(8.5MB, 로컬 전용)에서
  서브셋한 **15.7KB** 를 `stories/kiritsu/fonts/`에 커밋. PDF 빌드에 CJK
  `unicode-range`로 연결해 제목 規律과 동일한 구양순체 계열 붓글씨로 조판
  (한글 본문은 NanumGothic 유지). 재생성 `stories/kiritsu/subset-font.py`.
- 게이트: tests 54/54, lint 51/51, tsc/doc-check/invariants, build/budget,
  pwa/title/presentation/korean 그린, level-oracle 51개 스테이지 일치.

## 2026-11-15 (3) — 한자 폰트 최종: Yuji Boku 원본(A)

- 무료 후보(A Yuji Boku/B Yuji Syuku/C~H 명조·거친 디스플레이)와 커스텀 붓 거침
  컷까지 비교한 뒤 **A(Yuji Boku 원본)로 확정**.
- 게임 UI에서 마지막으로 비(非)Yuji였던 타이틀 부트로그 `리츠[律]`의 律을
  **Yuji Boku 단일 글리프 서브셋(~2.9KB, CSS 인라인)** 으로 교체. 이제 타이틀
  SVG·부트로그·소설 PDF 한자 15자가 전부 같은 서체.
- 미사용 `src/ui/ou-kanji.ts`(Noto Serif JP 規律 outlines) 삭제 — 비Yuji 한자
  에셋 제거. 번들 410,477 B raw / 135,647 B gzip(ceiling 420k/140k).

