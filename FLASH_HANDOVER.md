# FLASH HANDOVER — 다음 AI가 먼저 읽는 현재 인수인계서

> **대상**: 이 세션을 이어받는 새 AI. 이 문서 → [`docs/HANDOFF.md`](docs/HANDOFF.md)
> → [`AGENTS.md`](AGENTS.md) → [`docs/README.md`](docs/README.md) 순서로 읽는다.
> **인수인계 작성 시점**: 2026-11-17. 마지막 배포 커밋 `1f1debe`,
> 라이브 <https://jungdonghee.github.io/kiritsu/>, live `kiritsu.html` md5
> `f5d867cce2f4b6926a18999d7dfae71b`, 413,143 B. 문서 커밋 후에는 git hash가
> 바뀌므로 **직접 다시 확인**한다(§6).

## 0. 한 줄 상태

KIRITSU는 **green/배포 가능 상태**다. 현재 사용자의 활성 관심사는
**모바일(폰) Vim 키보드의 감각/배치**이고, 그 직전에 **타이틀 規律 획 애니메이션의
깜빡임과 레벨 선택창 뒤로가기**를 수정·배포했다. 엔진·스테이지·소설은 동결 상태다.

## 1. 사용자와 환경 (중요)

- 사용자는 **한국어**로 대화하며, **폰(Android Brave, Tailscale HTTPS)** 으로
  라이브 사이트를 본다. 설치형 PWA일 수 있으므로 새 빌드는 **⟳ 하드 리프레시**
  버튼으로 받는다(키보드 헤더/독에 있음).
- 사용자는 **디자인 감각과 디테일**을 중시하고, 스크린샷을 보내며 즉시
  피드백한다. 큰 구조 변경은 먼저 현재 상태를 확인하고 **요청 범위만** 고친다.
- 사용자는 창작(소설·영어판·게임 스토리)의 결정권자다. **AI가 임의로 소설/스토리/
  스테이지/엔진을 바꾸지 않는다.**
- 사용자는 "그냥 아이디어"를 자주 제안한다. 구현 전에 **요청인지 제안인지**
  구분하고, 제안이면 선택지/트레이드오프를 보여준 뒤 진행한다.

## 2. 지금 사용자가 볼 수 있는 것

| 영역 | 상태 |
|---|---|
| 게임/엔진 | 51 stages, oracle 373/373, 모든 gate green. **동결** |
| 소설 | `stories/kiritsu/` (사용자 한국어판 읽는 중). **동결** |
| 타이틀 規律 | v12 hand-traced 20획 데이터 + **v15 런타임** (아래 §4) |
| 모바일 키보드 | **side rail 기본**, ALL/FOCUS, CRT skin, COMPASS, viewport reflow (§3) |
| live | Pages 정상, 현재 dist md5는 §0 |

## 3. 현재 활성 작업 — 모바일 Vim 키보드

파일: [`src/ui/mobile-controls.ts`](src/ui/mobile-controls.ts),
[`src/style.css`](src/style.css)의 `.mob-*` 블록,
[`src/ui/play.ts`](src/ui/play.ts)의 `kiritsu:mode` 이벤트.

### 3.1 동작

- **터치 기기(또는 `?vk=1`)에서만** 마운트. 데스크톱 DOM은 건드리지 않는다.
- 기본 **side rail**: 오른쪽 full-height 레일. 게임 `#app`은 **오른쪽만**
  (`--mob-kb-right`) 줄고 **높이는 유지**되어 terminal을 가리지 않는다.
- 레일 헤더 칩:
  - `ALL` / `FOCUS` — 사이드 모드
  - grid 아이콘 — 레이아웃 순환: **side → edge → bar → minimal → side**
  - keyboard icon — 키보드 열기/닫기
  - ⟳ — service worker/cache 삭제 후 `?r=` 하드 리프레시
- **ALL**: SYS/CNT/SYM + MOVE/EDIT/NAV/INS 전부 표시.
- **FOCUS**: 한 페이지를 큰 키로 표시. 탭(`MOVE EDIT NAV INS CNT SYM`)과
  `‹ ›`로 전환. **COMMON footer 고정**: Esc, Shift, Ctrl, Bksp, Enter, Space,
  `:`, `/`, F1.
  - MOVE 페이지는 **h=j/k/l 사방 COMPASS** (`k` 위, `j` 아래, `h` 왼쪽,
    `l` 오른쪽) + `w b e 0 $ ^ * #`.
  - 키 글리프는 키 면적에 비례해 커진다(FOCUS 24–28px, COMMON 14px).
- **INSERT/REPLACE**: `PlayScreen.updateStatus`가 `kiritsu:mode`를 emit하면
  같은 패널이 **QWERTY 바**로 전환. Esc에서 Vim 레일 복귀. 시스템 키보드는
  띄우지 않는다.
- 선호 저장 키: `kiritsu.mobileLayout.v2`, `kiritsu.sideMode`,
  `kiritsu.sideFocus`, `kiritsu.mobilePage`, `kiritsu.mobileKeysOpen`.
- CRT skin: phosphor text bloom, red/cyan fringe, scanline, vignette.
  `body.crt-off`에서 제거. 디자인 근거는
  [`docs/MOBILE_KEYBOARD.md`](docs/MOBILE_KEYBOARD.md).

### 3.2 검증 방법 (수동 Playwright, 터치 landscape)

- viewport 900×430, `hasTouch:true`, `isMobile:true`.
- 타이틀에서 모바일 `h` → map, `Enter` → chapter, `Enter` → stage.
- `i`가 아직 unlock되지 않은 초반 스테이지에서는 `session.allowed.add('i')`로
  unlock한 뒤 FOCUS/INS에서 `i` → QWERTY 전환 확인.
- `#app` rect: side이면 width≈666, height430; bottom bar이면 height≈355.
- 데스크톱(터치 없음)에서 `.mob-vk`, `.mob-dock`이 **없어야** 한다.
- 자동 테스트는 아직 없음. 변경 시 위 절차로 회귀 확인.

### 3.3 남은 UX 후보 (사용자 확인 후)

- FOCUS 페이지를 **탭/화살표 외에 스와이프**로도 전환. 단, 키 pointerdown이
  즉시 입력되므로 **헤더/탭 영역에서만** 스와이프해야 오입력이 없다.
- 키 높이(현재 22–24px)가 짧은 화면에서 WCAG 24px 미만이 될 수 있음;
  간격 예외로 설계했지만 "large keys" 옵션은 열린 질문.
- FOCUS/ALL 기본값은 현재 **ALL**. 사용자가 FOCUS 기본을 원할 수 있다.
- 번들이 **413,143 B raw / 130,829 B gzip** (ceiling 420,000 / 140,000)로
  여유가 작다. 새 대형 기능을 넣기 전에 `npm run budget`을 확인한다.

## 4. 타이틀 規律 — 현재 v15

- 데이터: [`src/ui/title-stroke-paths.ts`](src/ui/title-stroke-paths.ts)
  (v12 hand-traced, 20 획, 30,002 B; **수작업 편집 금지**).
- 런타임: [`src/ui/kanji.ts`](src/ui/kanji.ts) **v15**.
  - **반평면 컷 제거** → 지나온 full disc + 접점 뒤쪽 반원의 **단조 증가 마스크**.
    모서리에서 이미 드러난 잉크가 한 프레임 사라지던 "획 깜빡임" 수정.
  - 작은 CRR/vector 십자 커서(화살표 없음) + 접점의 작은 원형 젖은 웅덩이.
  - 한자별 가속: 첫 획 신중(pace 1.20) → 마지막 0.58, 획 간격 감소,
    총 ≈5.2s, `--kt-end` 6.16s.
  - 완성 CRT: 글자 ink에만 clip된 스캔라인/빔 스윕. **v15에서 틴트 0.26→0.08,
    빔 0.58**로 줄여 글자 전체가 번쩍이지 않게 함.
- 프레임 계측: 애니메이션 중간 ink dip 0 (마지막 AA 감소만).
  `node tools/title-check.mjs` → 20획·done·headHidden·콘솔0·FPS40.
- **레벨(챕터) 선택창에서 Esc/h → 메인 타이틀 인트로**로 복귀하도록 수정됨
  (`src/ui/app.ts` chapter branch). floor map의 Esc/h→title은 기존과 동일.
- 자세한 이력/금지는 [`docs/TITLE_KANJI.md`](docs/TITLE_KANJI.md) §11–§14.
- 획 데이터 재생성: `kanji-trace/zones.py` (아래 §7), 절대 손으로 paths 편집 금지.

## 5. 첫 10분 체크리스트

```bash
cd /home/jung/ai_station/sandbox/kiritsu
git status --short                 # 문서 인수인계 커밋 후 clean
git log --oneline -3               # 최신 커밋 확인
npm run status:check               # current여야 함
npm run verify 2>&1 | tail -8      # green 확인 (시간 걸림)
npm run budget 2>&1 | tail -2      # 413k/130k 근처
```

1. 최신 live md5와 로컬 dist가 같은지 확인.
2. 사용자에게 "지금 폰에서 키보드/타이틀 중 어디를 볼지" 물어보거나,
   최근 요청(모바일 키보드 감각)의 후속 피드백을 기다린다.
3. 성급하게 새 디자인을 시작하지 말고, 스크린샷/증상을 받아 **한 가지씩** 고친다.

## 6. 검증·커밋·배포 (실제 사고 이력 포함)

```bash
npm run build
npm run status:write        # build 후 필수. status:check가 CI gate
npm run verify              # 전체 gate
git add -A && git commit -m "<설명>"
# GitHub token은 repo 밖 안전 저장소에 있다. 절대 출력/복사하지 말고,
# 기존 askpass/credential helper를 쓰거나 사용자에게 안전한 경로를 물어본다.
# (이 문서/저장소에는 토큰 값이나 사설 경로를 적지 않는다.)
GIT_ASKPASS=/path/to/existing-askpass.sh GIT_TERMINAL_PROMPT=0 git push origin main
```

- **PWA shell/`public/`·`src/ui` 변경 시** `public/sw.js` `VERSION` bump
  (현재 `kiritsu-v25`). 다음 변경 시 v26+.
- `status:write` 없이 코드 변경을 커밋하면 Pages가 `status:check`에서 실패한다.
- **Pages deploy artifact 중복 사고**: 실패한 run을 `rerun-failed-jobs`하면
  `github-pages` artifact가 2개가 되어 deploy가 또 실패한다. 이때는 **새
  workflow run**을 만든다:
  ```bash
  TOKEN="${GITHUB_TOKEN:?repo-external token required}"
  curl -s -X POST -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/JungDonghee/kiritsu/actions/workflows/pages.yml/dispatches \
    -d '{"ref":"main"}'
  ```
  또는 빈 커밋을 새로 push한다. deploy log에서 `Multiple artifacts named
  "github-pages"`가 보이면 이 케이스다.
- 배포 후:
  ```bash
  curl -s https://jungdonghee.github.io/kiritsu/kiritsu.html -o /tmp/live.html
  md5sum /tmp/live.html dist/kiritsu.html   # 같아야 함
  ```
- 사용자가 폰 PWA에서 안 보이면 ⟳ 리프레시를 안내한다.

## 7. 외부 작업 공간 · 트레이서 · 생성기

이 저장소 밖에 있지만 **타이틀 재작업에 필수**:

- **Harness Web GUI**: DSH 런타임 컨텍스트가 주는 GUI URL을 사용한다
  (사설 주소이므로 이 저장소에 하드코딩하지 않는다). DSH checkout은
  `/usr/local/lib/node_modules/@deepseek-ai/dsh/`.
- **트레이서 플러그인**: `@local/kanji-tracer`
  - 소스 `/home/jung/ai_station/sandbox/kanji-tracer-plugin/`
  - 프로필 `/home/jung/.dsh/profiles/web`에 link; 활성화됨.
  - 사이드바 **規律 boundary tracer** 아이콘 → 메인 패널.
  - 도구: `✂ 경계`(내부 경계선), `╱ 획 선`(획별 직선), `⌫ 지우개`, `✋ 이동`,
    pinch zoom, Save.
  - Save는 `/home/jung/ai_station/sandbox/kanji-trace/strokes.json` 및
    `archive/`에 cuts+lines 저장. host route `/api/kanji-tracer`.
  - 클라이언트 수정은 Harness 페이지 F5. host/index.js 수정 시 플러그인
    host 재적재가 필요할 수 있다(DSH 플러그인 관리 사용).
- **생성기**: `/home/jung/ai_station/sandbox/kanji-trace/zones.py`
  - 입력: `strokes.json`의 `cuts`(51) + `lines`(22; 6+7, 16+17은 한 획으로
    자동 병합).
  - 실행:
    ```bash
    cd /home/jung/ai_station/sandbox/kanji-trace
    PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 zones.py
    ```
  - 출력: `title-stroke-paths.candidate.ts`, `zones-report.json`,
    `zones-diff.png`. 후보를 `kiritsu/src/ui/title-stroke-paths.ts`에 복사한 뒤
    build/title-check/verify.
  - 현재 trace/생성기 백업:
    `/home/jung/ai_station/sandbox/kanji-trace/backup/` (2026-11-17).
  - 사용자가 그린 cuts/lines는 **자산**이다. 지우거나 재생성하지 말고,
    변경이 필요하면 사용자에게 다시 그리게 한다.
- 이 저장소의 `kanji-trace/*` JSON/PNG는 커밋 대상이 아니다(후보만 반영).

## 8. 절대 하지 말 것 / 함정

- 엔진 semantic·스테이지 solution/par/goal·novel 원고 변경 금지.
- 타이틀 자산 `public/kanji/ou-guilv-tight.svg` 교체 금지. Yuji Boku Light
  cut 단일 진실.
- v1–v8 자동 마스크/`gen-title-strokes.py` 재도입 금지. v12 데이터는
  수작업 자산이다.
- 번들 ceiling 420,000 B raw / 140,000 B gzip 상향 금지.
- 시크릿(API 키·GitHub token) 출력/커밋 금지.
- `docs/generated/*` 수기 편집 금지 → `status:write` 등.
- 모바일 DOM은 데스크톱에 생성하지 않는다. `isTouch()` 게이트 유지.
- 코드 변경 커밋은 `status:write` 결과를 포함한다.
- Pages deploy 실패 시 **rerun 금지**(artifact 중복), 새 run/commit으로.
- 사용자가 스크린샷 없이 "이상하다"고 하면, 정확한 화면/시점을 먼저 확인한다.

## 9. 문서 지도

- [`docs/HANDOFF.md`](docs/HANDOFF.md) — 프로젝트 현재 상태·아키텍처·게이트·배포 (상세)
- [`AGENTS.md`](AGENTS.md) — 영속 불변식/에이전트 규칙
- [`docs/README.md`](docs/README.md) — 문서 읽기 순서·canonical/generated/archive 규칙
- [`docs/TITLE_KANJI.md`](docs/TITLE_KANJI.md) — 타이틀 규격/이력/§14 v15
- [`docs/MOBILE_KEYBOARD.md`](docs/MOBILE_KEYBOARD.md) — 모바일 리서치/레이아웃/ALL·FOCUS/CRT
- [`docs/generated/STATUS.md`](docs/generated/STATUS.md) — **모든 수치의 정본**

이 문서는 2026-11-17 세션에서 **이전 FLASH/HANDOFF를 archive로 보내고 새로
통합**한 것이다. 이전 상세 기록이 필요하면
`docs/archive/FLASH_HANDOVER_2026-11-15.md`,
`docs/archive/HANDOFF_2026-11-15.md`를 본다(현재 수치/우선순위는 인용 금지).
