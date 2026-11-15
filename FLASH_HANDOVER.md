# FLASH HANDOVER — v4.1 flash 모델용 인수인계서

> **대상 독자**: 이 프로젝트를 이어받을 저비용 모델(v4.1 flash). 이 문서 하나로
> 유지보수 라운드를 돌 수 있어야 한다. **판단이 필요한 일은 하지 말고 사용자에게
> 묻거나 멈춘다.** 무리한 판단이 이 프로젝트의 캐논·게이트를 깨는 것보다 낫다.
> 마지막 갱신: 2026-11-15 (v4 pro 인계). **타이틀 規律 획 애니메이션 v10 배포 완료** — [`docs/TITLE_KANJI.md`](docs/TITLE_KANJI.md) §9 참조(사용자 육안 확인 대기).
> 문서 지도·읽기 순서·문서 규칙은 [`docs/README.md`](docs/README.md)가 소유한다.

## 0. 한 줄 요약

KIRITSU = 소설 + vim 교육 게임(부제 VIMLORE). 저장소
`/home/jung/ai_station/sandbox/kiritsu` (GitHub `JungDonghee/kiritsu`, main,
라이브 https://jungdonghee.github.io/kiritsu/). **소설은 사용자가 읽는 중 —
원고를 건드리지 않는다. 게임은 전부 그린 — 함부로 손대지 않는다.**

## 0-b. 타이틀 20획 — v10 완료 (2026-11-15)

사용자가 거부했던 자동 분할(v1~v8)을 폐기하고, **20획 완전 붓 획 아웃라인**을
`src/ui/title-stroke-paths.ts`에 고정했다. 각 획은 겹침/가려진 부분까지 포함한
닫힌 외곽선이고, 획순(規 11 + 律 9)대로 칠하면 글자와 일치한다(union 래스터
diff <0.1%). 런타임 `src/ui/kanji.ts`는 v10에서 **선명한 붓촉 마스크 스윕**으로
바뀌었다(페더/블러/글로우/궤적 제거, 진행 중 획 앞쪽 55%→100% 압력 램프,
Hanzi Writer식 길이 비례 타이밍·총 ≈7.55s). **마지막에 글자를 덧그리지
않는다(팝 없음).** 데이터는 v9 그대로다.

- 검증: `node tools/title-check.mjs`(20획·done·콘솔0·FPS≥18), `npm run verify`,
  union 색상 오버레이 — `docs/TITLE_KANJI.md` §8.
- 금지: v8 생성기(`tools/gen-title-strokes.py`) 재실행으로 자동 path 재배포,
  HW/Arphic 데이터를 형상 소스로 쓰기(PRC 획순·APL), 글자형 교체.
  폰트는 Yuji Boku Light cut 고정.

## 1. 현재 상태 (2026-11-15)

| 항목 | 상태 |
|---|---|
| 소설 | `stories/kiritsu/work/` 13편 확정(~73,000자, 검토 27건 반영, 규칙 0건). **사용자 한국어판 독서·피드백 대기** |
| 소설 PDF | `stories/kiritsu/KIRITSU.pdf` (인쇄용, 72페이지) |
| 게임 | 모든 게이트 그린(테스트·오라클 373/373·번들·PWA·타이틀 검사), 라이브 배포 정상 |
| 타이틀 인트로 | **v10 배포 완료(2026-11-15).** 20획 완전 붓 획(v9 데이터) + 선명한 붓촉 스윕·느린 타이밍, 팝 없음, title-check green(FPS 40, `--kt-end` 7.80s). 사용자 육안 확인 대기. [`docs/TITLE_KANJI.md`](docs/TITLE_KANJI.md) §9 |
| 보류(사용자 지시) | 영어판·리츠 1인칭(피드백 후), 게임 스토리 슬라이스(원고 확정 후), LIVE 모드(승인 전), 이미지(다른 AI 생성) |
| 자동화 | v4 pro의 매시간 라운드는 **인계 시점에 일시정지됨** — flash 세션에서 새로 만들 것(아래 §5) |

## 2. Flash가 해도 되는 일 (절차가 전부 정해져 있음)

1. **그린 확인 라운드** (가장 흔한 작업):
   ```bash
   cd /home/jung/ai_station/sandbox/kiritsu
   git status --short            # 변경 없어야 정상
   npm run status:check          # "current"여야 함
   npm run verify 2>&1 | tail -5 # 전부 통과여야 함
   cd stories/kiritsu && node fixnames2.mjs --check 2>&1 | tail -2  # 13편 clean
   curl -s -o /dev/null -w "%{http_code}\n" https://jungdonghee.github.io/kiritsu/  # 200
   ```
   하나라도 빨간 게 있으면 **고치지 말고** §4대로 보고만 한다.
2. **사용자 피드백 반영**: 사용자가 지적한 것 중 **명확한 것**만 — 예: 타이틀
   획 속도(현재 0.3s/획)·레이저 밝기(코어 opacity .8, w6)·인트로 길이 조정.
   이 경우만: `src/ui/kanji.ts`의 `START/DUR/GAP` 상수, `src/style.css`의
   `.kts-core` 값을 바꾸고 → `npm run build` → `node tools/title-check.mjs` →
   `npm run verify` → `npm run status:write` → 커밋·푸시(§6) → 배포 확인(§7).
   **타이틀 한자 작업 전에 `docs/TITLE_KANJI.md`를 반드시 읽는다.**
3. **PDF 최신화**: 소설 work/나 문서가 바뀐 커밋이 있으면
   `cd stories/kiritsu && node concat.mjs && PLAYWRIGHT_BROWSERS_PATH=/home/jung/ai_station/sandbox/.kiritsu-browsers node build.mjs`
   (빌드가 optimize-pdf.py까지 자동 실행). art/에 새 이미지가 도착해도 동일.
4. **문서 낡은 곳 갱신**: NOVEL_STATUS.md·HANDOFF.md의 날짜/수치가 실제와
   다르면 숫자만 고친다(생성 파일 STATUS.md는 절대 수기 편집 금지 —
   `npm run status:write`).
5. **배포 확인**: §7의 폴링 스크립트 실행.

## 3. Flash가 하면 안 되는 일 (판단·창작 경계 — 사용자나 상위 모델에 맡긴다)

1. **소설 원고(work/)의 구조·줄거리·장면 변경** — 캐논(HANDOVER §3)과
   §3.8(여섯 가지 모호성)은 절대 설명하거나 깨지 않는다. 오타·표기만 수정
   가능하며, 그때도 `node fixnames2.mjs --check` 0건 유지.
2. **영어판·리츠 1인칭·게임 스토리 슬라이스 착수** — 전부 사용자 피드백
   이후의 창작 작업이다. 사용자가 "시작해"라고 해도 **이 모델로 하지 말고**
   "창작 작업이라 상위 모델로 진행하겠다"고 말할 것.
3. **게임 캠페인(스테이지 솔루션·par·게이트·첫 클리어 결정성) 변경 금지.**
4. **엔진(vim 에뮬레이터) 시맨틱 변경 금지** — 오라클 373/373이 유일한 증거.
   "레벨이 안 풀린다"면 레벨을 고치지 말고 보고.
5. **번들 예산(420KB/140KB) 상향 금지.** 초과하면 코드를 줄이지 말고 보고.
6. **타이틀 한자 원본 교체·변형 금지** — `public/kanji/ou-guilv-tight.svg`
   단일 진실(TITLE_KANJI.md). 유령 레이어·페이드 팝 연출 재도입 금지.
7. **LIVE 모드·새 서버·PWA 구조 변경 금지.**
8. **자동화 스케줄(이 세션의 태스크) 수정 금지** — flash 세션에서 자신의
   태스크만 만든다(§5).
9. **토큰·시크릿 출력 금지** (푸시 절차 §6 참조).

## 4. 이상 발견 시 보고 양식

문제를 발견하면 고치려 들지 말고 이 형식으로 남긴다:
```
[장애 보고] <게이트 이름> 실패: <출력 마지막 줄> / <재현 명령>
시도한 것: 없음(수정 금지) / 필요해 보이는 것: <짧게>
```
사용자가 "고쳐봐"라고 명시할 때만, **최소 수정** 후 전 게이트 재검증.

## 5. Flash 세션에서 자동화 라운드 만들기 (인계 후 1회만)

flash 세션에서 사용자에게 다음 등록을 요청한다(스케줄 도구):
- rrule: `DTSTART;TZID=Asia/Seoul:20261116T000000` + `RRULE:FREQ=HOURLY`
- target: this_session(flash 세션)
- 제목: "KIRITSU 유지보수 라운드 (flash)"
- prompt: §2의 1·3·4·5만 수행하라는 요약 + §3의 금지 목록 1~9 + §4 보고 양식.
v4 pro의 기존 태스크는 인계 시점에 일시정지해 둠(재개하지 말 것).

## 6. 커밋·푸시 절차 (토큰 절대 출력 금지)

```bash
cd /home/jung/ai_station/sandbox/kiritsu
git add -A && git commit -m "<짧은 설명>"
TOKEN=$(cat /home/jung/ai_station/sandbox/.secrets/github_token)
git push "https://x-access-token:$TOKEN@github.com/JungDonghee/kiritsu.git" main:main
git remote set-url origin https://github.com/JungDonghee/kiritsu.git   # 스크럽
```
주의: **코드 변경 커밋에는 같은 커밋에 `npm run status:write` 결과가 있어야
한다** — 없으면 Pages 배포가 status:check에서 막힌다(실제 사고 있었음).
PWA 셸(public/·src/ui) 변경 시 `public/sw.js`의 `VERSION`도 bump.
문서만 바꾼 커밋은 `npm run doc-check && npm run levels:check && npm run surface:check`까지 확인한다.

## 7. 배포 확인

```bash
for i in $(seq 1 12); do sleep 120; R=$(curl -s "https://api.github.com/repos/JungDonghee/kiritsu/actions/runs?per_page=1" | python3 -c "import json,sys; r=json.load(sys.stdin)['workflow_runs'][0]; print(r['head_sha'][:7], r['status'], r['conclusion'])"); echo "poll $i: $R"; case "$R" in *"completed"*) break;; esac; done
# success면 라이브 마커 확인 (번들은 축소돼 문자열이 쪼개짐 — 조각으로 grep):
curl -s https://jungdonghee.github.io/kiritsu/kiritsu.html | grep -c "DAY FILE"   # ≥1
```
실패(failure)면 §4 보고만 한다.

## 8. 필독 문서 (작업 전 최소한 이 3개)

1. `docs/README.md` — 문서 지도·5분 읽기 순서 (여기서 시작)
2. `AGENTS.md` — 영속 불변식 (특히 Design laws·Performance budget·Shipping)
3. `docs/TITLE_KANJI.md` — 타이틀 한자 규격 + 수작업 트레이싱 지시서(작업 시)
4. `stories/kiritsu/HANDOVER.md` §3 — 소설 캐논(소설 작업 시에만)
