# TITLE KANJI — 타이틀 한자(規律) 단독 규격서

> **이 파일을 먼저 읽지 않고 타이틀 한자를 만지지 마라.** v1·v2의 실수를
> 이 문서로 체계화한다. **현재 구현은 v13(2026-11-15): v12의 사용자 구역+획 선
> 합성 데이터(20획 territory) + 젖은 붓끝/가속 붓질 런타임** — 붓이 **현재 닿는
> 끝부분 6 unit만** 연하게 드러나고, 지나간 잉크는 바로 원래 먹색으로 마른다.
> 레이저 헤드는 제거하고 획마다 초반 느림→후반 가속으로 사람 붓질을 흉내
> 낸다(§11·§12).

## 1. 자산 출처 (단일 진실)

| 항목 | 값 |
|---|---|
| 글자형 원본 | **`public/kanji/ou-guilv-tight.svg`** — 구양순체(Yuji Boku, OFL 1.1) |
| viewBox | `0 0 600 300` |
| fill | `#f2d8c9` (크림색 — 타이틀 전용) |
| 글자 그룹 | 두 글자 모두 `translate(0,0) scale(1)` (이미 viewBox 600×300 좌표) |

**금지**: `kanji.ts`의 옛 `KANJI_KIRITSU_SVG`(viewBox 218×109, 분홍 그라디언트)는
타이틀에 쓰지 않는다 — 같은 Yuji Boku라도 변형·색·비율이 달라 원본 글자형이
사라진다. 타이틀 글자는 **오직 `ou-guilv-tight.svg` 하나**.

## 2. 애니메이션 원칙 (v14 = 글자별 가속 붓질 + 글자 클립 CRT 스윕)

- **절대 금지**: 획이 "팡" 나타나는 페이드/팝. opacity만 바꾸는 연출 금지.
- **v1 실수**: 다른 변형 글자 + 페이드. **v2 실수**: clipPath 안 CSS
  `stroke-dashoffset` 애니메이션이 실제로 클립을 갱신하지 않아 얇은 레이저 선만
  그려지다 마지막 settle 페이드로 글자 전체가 튀어나왔다. **v3 실수**: rAF로
  clipPath 리본을 갱신했지만 리본 폴리곤이 획과 어긋나 커버리지 ~80% —
  "듬성듬성 쓰다가 마지막에 확" 문제가 남았다.
- **v4~v8 실수**: 잉크 픽셀을 보로노이로 소유시키고 튜브/마스크로 재구성하면
  union은 글자와 맞아도 **각 획이 "보이는 잉크 조각"**이 되어 교차부가 끊기고
  파편이 보인다(사용자 품질 거부).
- **v9 데이터(유지) + v10 런타임(현재, `src/ui/kanji.ts`)**:
  KanjiVG 획순/중심선(規 11, 律 9)을 Yuji Boku Light 잉크에 정합한 뒤, 획별
  가변 폭 프로파일과 붓 캡으로 **겹침·가려진 부분까지 포함한 닫힌 완전 획
  외곽선 20개**를 데이터로 고정한다(§8). 글자형과의 불리언 교집합 + 잔여 잉크
  패치로 **20획 union == 글자**(래스터 diff <0.1%)가 되고, 획순대로 칠하면
  나중 획이 앞 획을 덮는다. 따라서 **마지막에 글자를 덧그리거나
  크로스페이드하지 않는다(팝 없음)**. 데이터는 정적(생성기 런타임 호출 없음).
  - v10은 **데이터를 바꾸지 않고 런타임만** 교체했다(§9): 한지에 붓촉이
    지나가는 듯한 **선명한 마스크 스윕**(페더/블러/글로우/잔상 제거) +
    **압력 램프**(진행 중 획의 앞쪽 55%→100% 폭) + **Hanzi Writer식 긴 타이밍**
    (획당 0.22~0.55s, 총 ≈7.55s). v9의 넓고 흐린 페더+블러+글로우가
    "획이 뭉쳐 나타나는" 느낌을 만들었다.
  - 검증: union 색상 오버레이(획별 완전 붓 모양), `tools/title-check.mjs`.
  - 속도: 획 곡률이 큰 모서리에서 느려지고, 획 시작/끝에서 감속(ease +
    곡률 가중 시간 테이블). 시작 0.55s, 획당 0.22~0.55s(길이 비례),
    획 간 0.08s, 規 뒤 0.18s, 총 쓰기 ≈7.55s. 캡션/태그/PRESS는 JS가
    `--kt-end` 변수(7.80s)로 실제 종료 시각에 맞춘다.
  - 붓 끝: `.kt-laser-head`를 작게(12px, opacity .55)만 남긴다. 획 사이에는
    숨는다(펜 리프트). 캔버스 글로우/궤적은 v10에서 제거.
- **단일 파일 빌드**: `tools/inline.mjs`가 `./kanji/ou-guilv-tight.svg`를 data
  URI로 인라인하며 좌표 정수 반올림/공백 압축으로 약 30KB raw를 절감한다
  (원본 SVG 파일 불변).
- `prefers-reduced-motion`: 전체 잉크 즉시 표시. `crt-off`: 헤드 색만 흰색.

## 3. 실수 방지 체크리스트

1. 글자형은 `ou-guilv-tight.svg`에서만 (다른 파일·다른 변형 금지).
2. 획 연출은 실제 잉크가 드러나는 그리기여야 한다(fade/opacity 팝 금지).
3. **clipPath/폴리곤 리빌로 되돌아가지 말 것** — v2(클립 미동작)·v3(폴리곤
   커버리지 ~80%)의 함정. 리빌은 캔버스 마스크(붓 스탬프)로 한다. 잉크 커버리지는
   획 완료 시 100%가 되도록 점별 반폭을 잉크에서 직접 계산한다.
4. `node tools/title-check.mjs` 통과: 20 리본 · `data-state=done` · clip 제거 ·
   tip/헤드 제거 · 캡션/태그/PRESS 노출 · Esc 내비 · reduced-motion 즉시 완료 ·
   콘솔 에러 0 · 인트로 FPS ≥18.
5. `npm run budget` 그린(단일 파일 420KB/140KB — 인라인 중복 주의).
6. `npm run verify` 그린.
7. **Esc**: 타이틀에서 무시, 지도에서 타이틀 복귀. 전역에서 Esc는
   `preventDefault`(PWA 앱 종료 방지 — 사용자 지적). 건드리지 말 것.
8. 이 문서·HANDOFF §0k에 변경 기록.

## 4. 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1 | 2026-11-14 | 다른 변형 글자 + 페이드(실수) |
| v2 | 2026-11-15 | 원본 유지 + 스켈레톤 밴드 클립 + 레이저 (클립 미동작 → 얇은 선 + 끝 페이드) |
| v3 | 2026-11-15 | 잉크 분석 기반 획별 붓 리본 + rAF 클립 + 획별/전체 잉크 번짐. CSS 클립 애니메이션 제거. 단일 파일 칸지 경량화 |
| v4 | 2026-11-15 | 캔버스 잉크 타임라인: 보로노이 잉크 배정→점별 반폭→소프트 붓 스탬프 마스크 합성 |
| v5 | 2026-11-15 | 실제 일본어 획순/획형: KanjiVG 중심선을 Yuji Boku 잉크에 스냅, 획별 tip→cover 채움 |
| v6 | 2026-11-15 | 획별 잉크 소유권 + 호 클립 스윕(마스크 기반) |
| v7 | 2026-11-15 | 획별 벡터 패스 사전 분할(pathops tube) |
| v8 | 2026-11-15 | **래스터 Voronoi 소유 + 전체 붓 획 재구성**: 잉크 픽셀 단일 소유로 교차 제거, 중심선 가변 튜브로 획 연속성 복원, union=글자. contourpy/pathops. `tools/gen-title-strokes.py` (사용자 품질 거부) |
| **v9** | 2026-11-15 | **20획 완전 붓 획 아웃라인**: KanjiVG 중심선을 Yuji Boku 잉크에 정합 → 획별 가변 폭·붓 캡 닫힌 외곽선 → 글자 clip + 잔여 패치. union==글자(<0.1%), 획 파편 없음, 팝 없음. 데이터 `src/ui/title-stroke-paths.ts`, 런타임 단순화(번들 감소) |
| **v10** | 2026-11-15 | **v9 데이터 + 한지 붓촉 스윕**: 페더/블러/글로우/궤적 제거, 진행 중 획 앞쪽 폭 55%→100% 압력 램프, Hanzi Writer식 길이 비례 타이밍(획당 0.22~0.55s, 총 ≈7.55s). 사용자 "확 쓰는" 피드백 반영. 데이터 불변·title-check green(§9) |
| **v11** | 2026-11-15 | **사용자 내부 경계 기반 20획 territory**: 폰 트레이서 `✂ 경계`로 그린 49개 cuts → 56개 잉크 region → 12개 공유 교차 상자. `kanji-trace/cuts.py`가 union==글자를 검증하고 데이터 생성(46,499 B). 런타임은 v10 그대로. title-check green(§10) |
| **v12** | 2026-11-15 | **구역 + 획 선 합성**: 사용자 저장본 cuts 51 + 직선 22개. 꺾인 획은 직선 2개(6+7, 16+17)로 그렸고 `zones.py`가 자동으로 한 획으로 묶어 **20획** 생성. 선이 지나는 구역 합집합이 획, 여러 선이 지나는 구역은 공유. 데이터 30,002 B(감소), union realMissing 0%. runtime v10 그대로(§11) |
| **v13** | 2026-11-15 | **CRT 벡터 커서 + 젖은 붓끝 + 가속 붓질**: 방사형 레이저를 **작은 십자 크로스헤어**(24px, 화살표 없음, 녹색 형광)로 교체, 접점 앞쪽 잉크를 반평면으로 잘라 **먹이 붓보다 앞서지 않게** 함. 접점에 획 두께 원형 젖은 웅덩이(destination-out radial, 중심 62%), 지나간 잉크는 즉시 원색. 완료 후 방사형 섬광 → **CRT 스캔라인/빔 스윕**(§12) |
| **v14** | 2026-11-17 | **글자별 가속 붓질 + 글자 클립 CRT**: 획 내부는 natural easeInOut, **한자마다 첫 획 1.20→마지막 0.58 pace**로 감속/가속, 획 간격 0.10→0.03. 첫 글자 0.5s 시작, 規/律 사이 0.16s. 총 쓰기 ≈5.2s(`--kt-end` 6.16s). 완성 후 **글자 잉크에만 클립된** phosphor 틴트+스캔라인+빔 스윕(0.65s), 사각 bloom 제거(§13) |


---

## 수작업 트레이싱 지시서 (구 STROKE_HANDOVER, 2026-11-15) — v9로 완료, 기록용

> 이 문서는 **다음 AI가 이어받을 단일 작업 지시서**다. 배경·현재 상태·실패한
> 접근·수작업 절차·검증 기준·파일 위치를 모두 담았다. 작업 전에
> [`TITLE_KANJI.md`](TITLE_KANJI.md)와 [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md)도 읽는다.

### 0. 한 줄

타이틀 `規律` 인트로의 **획쓰기 애니메이션을 20개의 "완전한 붓 획(full-stroke)
SVG path"로 수작업 트레이싱**해서, HW(Hanzi Writer)처럼 각 획이 겹침·가려진
부분까지 완전하게 그려지고 최종 합집합이 Yuji Boku Light 글자와 정확히
일치하도록 만든다. **자동 분할 알고리즘을 더 개선하는 작업이 아니다.**

### 1. 확정된 제약 (사용자 지시)

- **한자 폰트는 Yuji Boku Light cut으로 고정** (2026-11-15): Regular를 8 font
  unit 안쪽 침식한 OFL 파생. 타이틀 SVG·소설 PDF·부트로그 모두 이 폰트.
- **타이틀 글자형 단일 소스**: `public/kanji/ou-guilv-tight.svg`
  (`tools/gen-title-svg.py`가 Light 서브셋에서 생성).
- **획 순서**: KanjiVG 일본어 순서 (規 11획, 律 9획).
- **사용자 판정**: 현재 v8(자동 재구성)은 "여전히 부정확하고 발전이 없다".
  **수작업 트레이싱으로 간다** — 자동 파티션/마스크/Voronoi/tube를 더
  다듬는 것으로 대체하지 말 것.

### 2. 왜 v8이 부족한가 (반복 금지)

- v8은 (a) 모든 잉크 픽셀을 최근접 획에 단일 소유(Voronoi)시키고
  (b) 각 획에 중심선 가변 반폭 튜브를 더해 `glyph ∩ (owned ∪ tube)`를 만든다.
  union은 글자와 맞지만, 결과 path는 **보이는 잉크에 묶인 조각**이 되기 쉽다.
- 진짜 HW 품질은 **폰트 제작 단계의 per-stroke filled outline**에서 나온다.
  획은 서로 겹치고, 가려진 부분까지 완전한 붓 모양으로 존재하며, 애니메이션은
  그 획의 median을 따라 끝까지 그린 뒤 나중 획이 앞 획을 덮는다.
- Yuji Boku에는 per-stroke 데이터가 없다. 자동 추출로는 "보이는 잉크" 이상이
  되지 못한다. **20획을 직접 그리는 것만이 답이다.**

### 3. 현재 코드/자산 상태 (v8, 라이브 배포됨)

| 항목 | 상태 |
|---|---|
| 라이브 | https://jungdonghee.github.io/kiritsu/ (commit `3d8ead7` 기준 v8) |
| 런타임 | `src/ui/kanji.ts` — 20개 `Path2D`를 순서대로 채우고, 진행 중 획만 호 클립 스윕 + 페더/붓끝 글로우. 최종 프레임은 20 path union |
| 데이터 | `src/ui/title-stroke-paths.ts` — v8 자동 생성 path 20개 (현재 63.7KB) |
| 생성기 | `tools/gen-title-strokes.py` (Voronoi+tube), `tools/render-title-mask.mjs`, `tools/title-plan.json` (중심선/폭 snapshot) |
| 검사 | `tools/title-check.mjs` — 20획, done, 캔버스 커버리지, 헤드/캡션, Esc, reduced-motion, 콘솔 0, FPS≥18 |
| 타이틀 자산 | `public/kanji/ou-guilv-tight.svg` (Yuji Boku Light, `tools/gen-title-svg.py`) |
| 폰트 | `stories/kiritsu/fonts/YujiBoku-KIRITSU-subset.ttf` (Light 서브셋, 22.6KB); full font 로컬 전용(gitignored) |
| 문서 | `docs/TITLE_KANJI.md`, `docs/KANJI_ATTRIBUTION.md`, `docs/generated/STATUS.md` |

**중요**: v8 생성물은 자동 재생성 가능하지만, 다음 단계는 **그 위에 수작업
path를 덮어쓰는 것**이다. 자동 생성기를 다시 돌려 v8을 재배포하지 말 것.

### 4. 다음 작업: 20획 수작업 트레이싱 (권장 순서)

#### 4.1 준비

```bash
cd /home/jung/ai_station/sandbox/kiritsu
git status --short          # clean 확인
npm run build               # dist/ 생성
node tools/title-check.mjs  # 현재 green 확인
```

- 기준 이미지: 타이틀 SVG를 **2400×1200**(viewBox 600×300의 4배)로 렌더해
  격자(5 view unit)와 20개 중심선/번호를 오버레이한다. `tools/title-plan.json`의
  `geoms[].pts`가 중심선, `geoms[].cover`가 대략 반폭이다.
- 획 순서: `docs/TITLE_KANJI.md`/`src/ui/kanji.ts`의 `KIRITSU_TITLE_STROKES`와
  동일(KanjiVG). 規=1..11, 律=1..9.

#### 4.2 작성 형식 (권장)

각 획을 **닫힌 SVG path 하나**로 작성한다. `d`는 viewBox(600×300) 좌표.
중요한 것:

1. **보이는 잉크 전체를 포함**한다.
2. 이웃 획에 가려지는 부분은 그 이웃 쪽으로 **겹쳐서 연장**한다(나중 획이 덮음).
3. 획 표면은 붓 모양(가변 폭, 둥근/뾰족한 끝)으로 그린다.
4. 20 path의 **union이 글자와 일치**해야 한다. path가 글자 밖으로 나가면
   **최종 렌더에서 `glyph ∩ path`로 클립**해도 된다(겹침은 유지, 바깥만 제거).
5. `src/ui/kanji.ts`는 path를 채우기만 하므로 fill-rule은 nonzero가 기본.
   path 방향/구멍은 `pathops`로 `simplify`해서 정리한다.

작성 파일은 새 파일 `src/ui/title-stroke-paths.ts`를 직접 대체하거나,
`src/ui/title-stroke-paths.manual.ts`를 만들어 import를 바꾼다. 권장:

```ts
export const KIRITSU_TITLE_STROKE_PATHS: string[] = [ /* 20개 */ ];
export const KIRITSU_TITLE_STROKE_RADII: number[] = [ /* 20개, 호 클립 반경 */ ];
export const KIRITSU_TITLE_INK_PIXELS = 34489;
```

#### 4.3 검증 루프 (필수)

1. **geometry 검증** (Python, `.pdfdeps`의 pathops/fontTools 사용):
   - title SVG 두 glyph path를 하나의 glyph path로 union.
   - 각 수작업 path를 `glyph ∩ path`로 클립.
   - 20개 union == glyph 인지 **pathops area 차이**와 **래스터 픽셀 차이**로 확인.
   - 수용 기준: area diff < 0.1 view unit², raster gap < 0.1% (AA 가장자리 제외).
2. **획 검증** (색상 오버레이): 20 path를 서로 다른 색으로 칠해 1200×600 PNG로
   렌더. 각 색이 **그 획의 붓 모양 전체**로 보이는지 눈으로 확인. 다른 획 잉크가
   섞이면 그 획 path를 수정.
3. **애니메이션 검증**:
   - `npm run build`
   - `node tools/title-check.mjs` green
   - 1280×800에서 1.8/2.8/3.8/4.8s 프레임과 final 캡처. 각 프레임에서 활성 획이
     **끊기지 않고** 자라며, 완료 획이 **자기 전체 모양**으로 보이는지 확인.
   - FPS ≥18, 콘솔 에러 0.
4. **게이트**: `npm run verify`, `npm run level-oracle`, `npm run status:write`,
   `npm run status:check`. (`npm run verify`는 tests/lint/tsc/docs/invariants/build/
   budget/pwa/title/presentation/korean 포함.)
5. 커밋·푸시·배포 절차는 `FLASH_HANDOVER.md` §6~7.

### 5. 기존 리서치 요약 (재조사 금지)

전체 보고서(추적): [`STROKE_RESEARCH.md`](archive/STROKE_RESEARCH.md) (2026-11-15; 원본 /tmp 보고서를 리포에 보존).
핵심:

- **Hanzi Writer / Make Me a Hanzi**: 規/律 per-stroke filled outline + median
  데이터가 존재. 좌표계는 1024×1024, **y-up**이고
  `<g transform="scale(1,-1) translate(0,-900)">`로 렌더한다(0.4). 하지만
  글리프는 **Arphic Kai**이고 획순은 **중국(PRC)식**이며 데이터 라이선스는
  **Arphic Public License 1999 (copyleft, 수정 데이터 APL 유지 의무)**.
  Yuji Boku 형상 소스로 쓰지 말 것. (형상이 아닌 "획순 사실" 참고는 무관.)
- **KanjiVG**: 획별 **중심선**만 제공. 일본어 획순, CC BY-SA 3.0.
  `src/ui/kanji.ts`에 출처 표기, `docs/KANJI_ATTRIBUTION.md`에 CC BY-SA 명시.
- **Python 3.14 (.pdfdeps)**: contourpy 1.4.0, numpy 2.5.4, pillow, fontTools,
  skia-pathops 0.9.2 사용 가능. `tools/gen-title-strokes.py`가 이 조합 사용.
- **실패한 접근**: v1 다른 글자형/페이드, v2 CSS clipPath dash 미동작, v3 리본
  커버리지 80%, v4/v5/v6/v7/v8 마스크·Voronoi·조각 분할은 "보이는 잉크" 한계.
  HW 데이터 리타게팅(Arphic affine warp)은 정렬 왜곡으로 폐기.
- **결론**: Yuji Boku에 per-stroke 데이터가 없으므로 **수작업 20획 트레이싱**만이
  HW 품질을 만족한다.

### 6. 파일/명령 빠른 참조

```bash
# 타이틀 폰트 자산 재생성(참고; 폰트 고정이므로 보통 불필요)
python3 tools/gen-title-svg.py
# v8 자동 path 재생성(참고; 다음 단계는 수작업 path로 교체)
PYTHONPATH=/home/jung/ai_station/sandbox/.pdfdeps python3 tools/gen-title-strokes.py
# 타이틀 검사
node tools/title-check.mjs
```

- 런타임: `src/ui/kanji.ts`
- path 데이터: `src/ui/title-stroke-paths.ts`
- title SVG: `public/kanji/ou-guilv-tight.svg`
- 중심선 snapshot: `tools/title-plan.json`
- 테스트/게이트: `package.json` scripts, `tools/title-check.mjs`
- 배포: `FLASH_HANDOVER.md` §6~7 (토큰은 repo 밖 `.secrets/github_token`)

### 7. 수용 기준 (Definition of Done)

- [ ] 20개 획이 각각 닫힌 full-stroke SVG path이고, KanjiVG 일본어 순서.
- [ ] 각 획이 자기 붓 모양 전체를 포함(겹침/가려진 부분 연장 포함).
- [ ] 20 path union == Yuji Boku Light 글자 (area diff <0.1, raster gap <0.1%).
- [ ] 색상 오버레이에서 다른 획 잉크가 섞이지 않음.
- [ ] 타이틀 인트로 프레임에서 획이 조각/잔상/갑작스런 전체 등장 없이 자연스럽게
      이어짐. FPS ≥18(headless), 콘솔 0.
- [ ] `npm run verify`, `npm run level-oracle`, `status:write/check` green.
- [ ] 문서(`TITLE_KANJI.md`, `FLASH_HANDOVER.md`, `AUTOMATION_LOG.md`) 갱신 후
      커밋·푸시·Pages 배포 확인.


## 8. v9 구현 — 20획 완전 붓 획 아웃라인 (2026-11-15)

> **v10의 데이터 기반(v9).** v10은 이 데이터를 그대로 쓰고 런타임만 교체했다(§9).
> §아래의 "수작업 트레이싱 지시서"는 v9로 완료되어 기록으로만 남긴다.

### 8.1 방식
1. **획순/중심선**: KanjiVG(CC BY-SA 3.0)의 規 11획·律 9획 중심선을 Yuji Boku
   Light 잉크에 아핀 정합(bbox 스케일 + 블러 마스크 점수로 미세 보정).
2. **폭 측정**: 각 중심선 표본에서 잉크 경계까지 수직 거리(좌/우)를 재고,
   교차부/끝단을 보정한 뒤 스무딩해 획별 가변 폭 프로파일을 만든다.
3. **완전 획 외곽선**: 중심선 + 폭 프로파일 + 붓 캡으로 닫힌 리본을 만들고,
   글자형과 불리언 교집합(clip)한다. 각 획은 **겹침·가려진 부분을 포함한
   전체 붓 모양**이며, 획순대로 칠하면 나중 획이 앞 획을 덮는다.
4. **잔여 잉크 패치**: 20획 union과 글자의 차이(얇은 이음새)를 가장 가까운
   획에 귀속시켜 union == 글자가 되도록 한다.
5. 결과 데이터: `src/ui/title-stroke-paths.ts`
   (`KIRITSU_TITLE_STROKE_PATHS` 20개, `KIRITSU_TITLE_STROKE_RADII`,
   `KIRITSU_TITLE_MEDIANS`, `KIRITSU_TITLE_INK_PIXELS`).
6. 런타임(v9 당시): `src/ui/kanji.ts` — 획순대로 완료 획을 채우고, 진행 중
   획은 중심선 호 클립 + 앞쪽 페더링으로 붓끝이 젖어 나가듯 그린다. 마지막에
   글자를 덧그리지 않는다(팝 없음). **현재 런타임은 v10(§9)** — 페더/블러/
   글로우를 제거하고 압력 램프·느린 타이밍으로 교체.

### 8.2 검증 (2026-11-15)
- 20획 union vs `public/kanji/ou-guilv-tight.svg` 래스터(2400×1200):
  **missing 0.085% / extra 0.005%** (1px 팽창·침식 후 내부 기준, AA 가장자리 제외).
- 색상 오버레이: 각 획이 자기 붓 모양 전체로 표시됨(파편/구멍 없음).
- `node tools/title-check.mjs`: 20획 · ink 34489 · `data-state=done` ·
  콘솔 에러 0 · 인트로 FPS 40 · reduced-motion 즉시 완료 · Esc 내비 정상.
- `npm run build && npm run budget`: 단일 파일 raw/gzip 감소(구 v8 대비
  경로 데이터 64KB→49KB, 런타임 분석 코드 제거).
- KanjiVG 중심선만 사용했고 Arphic/Hanzi Writer 형상 데이터는 쓰지 않았다.

## 9. v10 구현 — 한지 붓촉 스윕 + 느린 타이밍 (2026-11-15)

> **현재 라이브 구현.** v9 데이터는 그대로 두고 `src/ui/kanji.ts` 런타임만 바꿨다.

### 9.1 조사한 기존 구현/연구

| 계열 | 사례 | 방식 | 우리가 채택/버린 것 |
|---|---|---|---|
| 데이터 + 클립 스윕 | [Hanzi Writer](https://github.com/chanind/hanzi-writer)(MIT 코드, 데이터는 [Make Me a Hanzi](https://github.com/skishore/makemeahanzi)/Arphic) | 획별 **채워진 외곽선**을 두고, 중심선을 따른 **두꺼운 둥근 캡 선분**(stroke-width 200/1024)을 `stroke-dasharray`/`dashoffset`으로 전진시켜 클립 | 타이밍 공식 `(len+600)/3 ms`와 "선명한 둥근 캡 전진"을 참고. **Arphic 데이터는 라이선스(APL copyleft·PRC 획순) 때문에 형상 소스로 쓰지 않음** |
| 중심선 애니메이션 | [kanjivg-2-animation](https://github.com/ZacharyRead/kanjivg-2-animation), [KvgAnimatedView](https://github.com/bebop-001/KvgAnimatedView) | KanjiVG 중심선에 `stroke-dashoffset`+둥근 캡 | 중심선만으로는 획의 실제 붓끝/겹침을 못 살린다 → v9 데이터 유지 |
| 자동 획 추출 | [Progressive calligraphy stroke extraction](https://dl.acm.org/doi/10.1145/3548608.3559239)(ACM 2022), [hard-pen skeleton extraction](https://onlinelibrary.wiley.com/doi/10.1049/ipr2.13044)(IET), [Stroke-based character completion](https://ieeexplore.ieee.org/document/6395107)(SITIS 2012) | 골격화 + 폭 변환 + 교차/모호영역 검출 + 가려진 획 완성 | v8(Voronoi/튜브)의 교훈과 일치: 자동 추출은 "보이는 잉크"에 갇히기 쉽다 → v9의 완전 획 데이터 유지 |
| 붓 시뮬레이션 | [Animating the Brush-writing Process of Chinese Calligraphy Characters](https://ieeexplore.ieee.org/document/5222933)(IEEE 2009) | 붓 궤적 + 붓털/잉크 확산 모델 | 타이틀 인트로에는 과함. **압력 램프(앞쪽 얇게)** 정도만 단순화해 차용 |

라이선스 원칙: 형상 소스는 **Yuji Boku(OFL)** + KanjiVG 중심선(CC BY-SA, 출처 표기)
그대로. Hanzi Writer/Arphic 형상은 쓰지 않는다(§8.3 검증 문구와 동일).

### 9.2 v10 변경점 (런타임만)

1. **선명한 마스크 스윕**: 진행 중 획의 마스크를 중심선 위 원들의 합집합으로 만들고
   획 path로 클립. v9의 12-unit 페더 그라디언트·`blur(2.2px)`·캔버스 글로우·
   잔상 궤적을 제거 → 한지에 먹이 닿는 선명한 경계.
2. **압력 램프**: 마스크 원 반지름을 진행 중 획의 뒤쪽은 100%, 맨 앞 18 unit은
   55%까지 줄여 붓촉이 얇게 들어갔다가 지나가며 넓어지는 느낌.
3. **Hanzi Writer식 타이밍**: `dur = (len·1024/600 + 600)/3000`초(0.22~0.55s),
   획 간 0.08s, 規/律 사이 0.18s, 시작 0.55s → 총 ≈7.55s(`--kt-end` 7.80s).
   v9는 획당 0.12~0.34s·총 ≈5.74s로, 20획이 빠르게 지나가 "확" 나타나는
   느낌을 줬다.
4. **CSS 헤드 축소**: 12px·opacity .55로 줄여 과한 붓끝 글로우 제거.
5. 데이터·DOM 계약·검증 훅(`data-strokes`, `data-ink`, `data-state`,
   `--kt-end`)은 불변.

### 9.3 검증 (2026-11-15)

- `node tools/title-check.mjs`: 20획 · ink 34489 · `data-state=done` ·
  캡션/태그/PRESS 노출 · 콘솔 에러 0 · FPS 40 · Esc 내비 정상 ·
  reduced-motion 즉시 완료 · `--kt-end` 7.80s. **통과.**
- `npm run build` + `npm run budget`: 388,408 B raw / 125,090 B gzip
  (ceiling 420,000 / 140,000) — v9와 동일 데이터, 런타임 코드는 오히려 감소.
- 프레임 비교: v9 대비 2.1s 시점에 規 미완성(v10), 5.3s에 律 작성 중 →
  실제로 느려졌고, 페더/글로우 없이 선명한 전진 확인.
- 한계: 실제 모션 품질(손맛)은 정지 프레임으로 완전히 증명할 수 없다 —
  사용자 육안 확인 후 피드백 반영.

## 10. v11 구현 — 사용자 내부 경계 기반 분할 (2026-11-15, 배포)

> **현재 라이브 구현.** v9의 자동 완전 획 데이터를 사용자가 그린 내부 경계로
> 다시 분할한 데이터로 교체했다. 런타임(`src/ui/kanji.ts`)은 v10 그대로다.

### 10.1 문제와 사용자 입력
사용자 피드백: "한 획을 그릴 때 그 획 부분이 다 제대로 안 그려지고 다른 획의
부분도 같이 그려진다." v10은 재구성한 **완전 붓 획**을 칠하므로 이웃 획의 보이는
잉크가 앞서 드러날 수 있었다. 사용자는 폰 트레이서의 `✂ 경계` 모드로 **내부
경계선 49개**를 그렸고, "네모(교차 상자) 부분은 두 획 모두에 포함"이라고 지정했다.

### 10.2 변환 (`kanji-trace/cuts.py`, 저장소 비반영 도구)
1. cuts를 래스터 장벽으로 만들고 글자 잉크를 **connected region 56개**로 분할.
2. 각 region 내부는 median 최근접(+앞선 획 0.35-unit 바이어스)으로 픽셀 배정.
3. **공유 교차 상자 12개** 탐지: cuts로 둘러싸인 작은 region(경계 ≤32×32 unit,
   bbox 면적 ≤900 unit²) 중 현재 v9 획 path가 50% 이상 덮는 획이 2개 이상이면
   그 region을 모든 접촉 획에 **중복 소유**시킨다(같은 먹색이라 최종 글자에는
   영향 없음). 사용자 "네모는 두 획 모두" 규칙.
4. 경계 픽셀은 최근접 소유로 채우고, RDP(ε0.35)로 contour를 단순화한 뒤
   territory path 20개를 생성한다. union==글자를 래스터로 검증.
5. sweep radius는 territory의 median 최대 거리로 보정(완료 시 팝 없음).
결과: `src/ui/title-stroke-paths.ts` 46,499 B(이전 44,082 B), path 20개,
radii/medians 갱신.

### 10.3 검증 (2026-11-15)
- `kanji-trace/cuts-report.json`: cuts 49 · regions 56 · shared boxes 12 ·
  **missing 0.081%(AA 가장자리), realMissing 0%** · starved strokes 0.
- `npm run build` + `npm run budget`: 단일 파일 **390,837 B raw / 124,447 B gzip**
  (ceiling 420,000 / 140,000), title-check **FPS 41**, `data-state=done`,
  콘솔 0, `--kt-end` 7.80s, Esc/reduced-motion 정상.
- 시각 프레임: 영역 분할 애니메이션은 획이 territory 단위로 드러나며, 교차
  상자는 이전 획이 먼저 포함한다. 실제 모션 품질은 사용자 판정 대기.
- 한계: cuts가 부족한 곳은 region이 커져 territory가 거칠 수 있다. 사용자가
  경계선을 추가/수정하면 `cuts.py` 재실행 → 데이터 재생성 후 재검증한다.


## 11. v12 구현 — 구역 + 획 선 합성 (2026-11-15, 배포)

> **현재 라이브 구현.** 사용자가 폰 트레이서에서 그린 **경계선 51개**와
> **직선 획 선 22개**를 `kanji-trace/zones.py`로 합성했다.

### 11.1 사용자 입력
- `✂ 경계`: 글자 잉크를 구역(zones)으로 나누는 내부 경계선 51개.
- `╱ 획 선`: 획 순서대로 그린 **직선 22개**. 꺾인 획 2개는 직선 2개로 이어
  그렸다: **6+7**과 **16+17**(둘 다 ㇕ 계열). 이 둘을 합치면 정확히 **20획**.
- 사용자 규칙: “선이 지나는 구역들을 하나로 합치면 그게 획. 여러 선이 지나는
  구역은 두 획 모두에 포함(겹침)되어도 된다. 선은 직선.”

### 11.2 변환 (`kanji-trace/zones.py`)
1. cuts로 글자 잉크를 **57개 zone**으로 분할.
2. 연속한 직선이 `끝→시작 거리 ≤35 unit` + `방향 꺾임 45~135°`이면 **한 획
   세그먼트로 자동 병합**. 22개 선 → **20획** (병합: 6+7, 16+17).
3. 각 획 = 그 획의 선이 지나는 모든 zone의 합집합. 여러 선이 지나는 zone은
   여러 획에 중복 소유(같은 먹색이라 최종 글자에는 영향 없음).
4. 어떤 선도 지나지 않는 zone은 가장 가까운 선의 획에 귀속.
5. 경계 seam은 소량 dilation으로 채우고, RDP(ε0.35)로 단순화한 뒤 union==글자를
   래스터로 검증. sweep radius는 획 territory의 median 최대 거리로 보정.

### 11.3 검증 (2026-11-15)
- `zones-report.json`: cuts 51 · zones 57 · lines 22 → **strokes 20** (merged 6+7,
  16+17) · **missing 0.1%(AA 가장자리), realMissing 0%** · `zones-diff.png`.
- 데이터 `src/ui/title-stroke-paths.ts` **30,002 B**(v11 46,499 B에서 감소).
- `npm run build` + `npm run budget`: **374,347 B raw / 121,451 B gzip**
  (ceiling 420,000 / 140,000). `title-check`: FPS 39, done, 콘솔 0,
  `--kt-end` 7.80s, Esc/reduced-motion 정상.
- 런타임은 v10 그대로(선명한 마스크 스윕, 획당 0.22~0.55s, 총 ≈7.55s).
- 시각 프레임: 획들이 territory 단위로 자연스럽게 드러나고, 꺾인 획(㇕)은
  두 직선 구역이 합쳐져 하나의 붓 획으로 그려진다.
- 한계: 사용자가 선을 추가/수정하면 `zones.py` 재실행 → 데이터 재생성 후 재검증.
  선이 20획보다 많고 자동 병합이 안 되면(꺾임/거리 조건 미충족) 경고 후
  부족한 획은 v9 데이터로 대체된다.

## 12. v13 런타임 — 젖은 먹 + 가속 붓질 (2026-11-15, 배포)

> **현재 라이브 구현.** v12 데이터(사용자 구역+획 선 합성, 20획)는 그대로 두고
> `src/ui/kanji.ts`의 쓰기 연출만 바꿨다.

### 12.1 변경
1. **CRT 벡터 커서**: 기존 `.kt-laser-head`의 방사형 글로우 대신 **작은 십자
   크로스헤어**(24px, 화살촉·중심점 없이 두 선만)를 붓 접점에 붙였다.
   `mix-blend-mode: screen` + 약한 형광 글로우로 벡터 디스플레이 느낌을 내고,
   회전은 획 진행 방향을 따른다(스케일 0.7~1.1).
2. **붓보다 앞선 잉크 제거**: 활성 획 마스크에 붓 접점을 지나는 **반평면 클립**을
   적용해, 붓이 지나간 뒤쪽만 드러나게 했다. 이제 먹이 붓보다 먼저 그려지지
   않는다(획 끝에서는 반평면이 획 전체를 덮으므로 팝 없음).
3. **젖은 붓끝(원형 웅덩이)**: 활성 획의 마스크를 칠한 뒤, **붓이 현재 닿는
   지점**에 반경 = 그 위치 획의 반폭(≈3.5~18 unit)인 `destination-out` 원형
   그라디언트(중심 최대 62% 제거)를 적용한다. 즉 붓이 닿은 작은 원만 순간적으로
   연하고, 지나간 잉크는 바로 원래 먹색(`#f2d8c9`)이다. 완료 획은 항상 원색.
4. **가속 붓질 + 전체 속도 상향**: 획 진행을 `0.12t + 0.88t^2.4`로 매핑해
   초반은 천천히, 뒤로 갈수록 빠르게. `START .5s · GAP .06s · CHAR_PAUSE .14s ·
   SPEED_DIV 3600 · 획당 .18~.48s`로 총 쓰기 **≈6.2s**(`--kt-end` 6.44s).
   기존 곡률 가중은 유지하되 **끝 감속(×1.6) 제거**.
5. **CRT 완료 연출**: 한자 완성 후의 방사형 섬광을 제거하고, **수평 스캔라인
   텍스처 + 위→아래로 지나가는 얇은 형광 빔**의 짧은 V-sync 스윕(0.48s)으로
   교체했다. `mix-blend-mode: screen`, 녹색 형광.
6. 데이터·stroke 수·검증 훅 불변. reduced-motion은 즉시 원색 완성.

### 12.2 검증 (2026-11-15)
- `title-check`: 20획 · `data-state=done` · `headHidden=true` · 콘솔 0 ·
  FPS 40 · `--kt-end` **6.44s** · Esc/reduced-motion 정상. **통과.**
- `npm run build && npm run budget`: 단일 파일 367.4 kB,
  **약 376 kB raw / 122 kB gzip** (ceiling 420,000 / 140,000 — STATUS 참조).
- 프레임 확인: 완료된 획과 이미 지나간 부분은 원색, **붓이 닿는 선두
  14 unit만** 연하게 보인다. 레이저/궤적 없음.
- 사용자 육안 판정 대기(가속 강도·젖은 먹 투명도는 상수 조정 가능).

## 13. v14 런타임 — 글자별 가속 붓질 + 글자 클립 CRT (2026-11-17, 배포)

> **현재 라이브 구현.** 데이터(v12)는 그대로, `src/ui/kanji.ts` 런타임만 조정했다.

### 13.1 붓질 페이싱 (사람이 한자를 쓰는 느낌)
- **획 내부**: `easeInOut`(자연스러운 가감속) — 이전 `0.12t+0.88t^2.4`의
  과한 가속을 제거해 "속도가 어색한" 느낌을 줄였다.
- **한자 단위 가속** (規 1–11, 律 12–20 각각 리셋):
  - 획 지속시간 배율 `pace = 1.20 → 0.58` (첫 획은 신중, 뒤로 갈수록 빠름)
  - 획 간 간격 `0.10 → 0.03` (다음 획으로 넘어가는 속도도 가속)
  - 첫 글자 시작 0.50s, 規/律 사이 pause 0.16s, base `(len·1024/600+600)/4200`
  - 결과: **총 쓰기 ≈5.2s**, `--kt-end` 6.16s (CRT 효과 뒤 캡션).
- 6번/15번 ㇕처럼 꺾인 획은 v12 데이터에서 이미 한 획으로 합성되어 있다.

### 13.2 완성 연출 — 글자 잉크에만 클립
- 사각형 `.kt-bloom` 섬광은 CSS에서 `display:none`으로 제거.
- 완성 후 0.18s 뒤, 0.65s 동안 **캔버스에서 글자 path union으로 clip**한
  CRT 효과를 그린다:
  1. 글자 잉크에만 **녹색 phosphor 틴트**(additive, `lighter`)
  2. 3px 간격 **스캔라인** shimmer
  3. 위→아래로 지나가는 **형광 빔**(얇은 벡터 라인)
- 배경/글자 바깥에는 아무 효과도 칠하지 않는다(정교한 글자 클립).

### 13.3 검증
- `title-check`: 20획 · `data-state=done` · headHidden · 콘솔 0 · FPS 40 ·
  `--kt-end` 6.16s · Esc/reduced-motion 정상. **통과**
- 단일 파일 ≈367.8 kB. (정확한 raw/gzip은 `docs/generated/STATUS.md`)
- 프레임 검증: 완성 직후 글자 ink만 녹색 CRT 스윕, 배경/사각형 없음.
- 사용자 육안 판정 대기(가속 강도/CRT 강도는 상수 조정 가능).
