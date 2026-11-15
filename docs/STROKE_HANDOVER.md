# 타이틀 規律 획 애니메이션 — 수작업 트레이싱 인수인계 (2026-11-15)

> 이 문서는 **다음 AI가 이어받을 단일 작업 지시서**다. 배경·현재 상태·실패한
> 접근·수작업 절차·검증 기준·파일 위치를 모두 담았다. 작업 전에
> [`TITLE_KANJI.md`](TITLE_KANJI.md)와 [`KANJI_ATTRIBUTION.md`](KANJI_ATTRIBUTION.md)도 읽는다.

## 0. 한 줄

타이틀 `規律` 인트로의 **획쓰기 애니메이션을 20개의 "완전한 붓 획(full-stroke)
SVG path"로 수작업 트레이싱**해서, HW(Hanzi Writer)처럼 각 획이 겹침·가려진
부분까지 완전하게 그려지고 최종 합집합이 Yuji Boku Light 글자와 정확히
일치하도록 만든다. **자동 분할 알고리즘을 더 개선하는 작업이 아니다.**

## 1. 확정된 제약 (사용자 지시)

- **한자 폰트는 Yuji Boku Light cut으로 고정** (2026-11-15): Regular를 8 font
  unit 안쪽 침식한 OFL 파생. 타이틀 SVG·소설 PDF·부트로그 모두 이 폰트.
- **타이틀 글자형 단일 소스**: `public/kanji/ou-guilv-tight.svg`
  (`tools/gen-title-svg.py`가 Light 서브셋에서 생성).
- **획 순서**: KanjiVG 일본어 순서 (規 11획, 律 9획).
- **사용자 판정**: 현재 v8(자동 재구성)은 "여전히 부정확하고 발전이 없다".
  **수작업 트레이싱으로 간다** — 자동 파티션/마스크/Voronoi/tube를 더
  다듬는 것으로 대체하지 말 것.

## 2. 왜 v8이 부족한가 (반복 금지)

- v8은 (a) 모든 잉크 픽셀을 최근접 획에 단일 소유(Voronoi)시키고
  (b) 각 획에 중심선 가변 반폭 튜브를 더해 `glyph ∩ (owned ∪ tube)`를 만든다.
  union은 글자와 맞지만, 결과 path는 **보이는 잉크에 묶인 조각**이 되기 쉽다.
- 진짜 HW 품질은 **폰트 제작 단계의 per-stroke filled outline**에서 나온다.
  획은 서로 겹치고, 가려진 부분까지 완전한 붓 모양으로 존재하며, 애니메이션은
  그 획의 median을 따라 끝까지 그린 뒤 나중 획이 앞 획을 덮는다.
- Yuji Boku에는 per-stroke 데이터가 없다. 자동 추출로는 "보이는 잉크" 이상이
  되지 못한다. **20획을 직접 그리는 것만이 답이다.**

## 3. 현재 코드/자산 상태 (v8, 라이브 배포됨)

| 항목 | 상태 |
|---|---|
| 라이브 | https://jungdonghee.github.io/kiritsu/ (commit `3d8ead7` 기준 v8) |
| 런타임 | `src/ui/kanji.ts` — 20개 `Path2D`를 순서대로 채우고, 진행 중 획만 호 클립 스윕 + 페더/붓끝 글로우. 최종 프레임은 20 path union |
| 데이터 | `src/ui/title-stroke-paths.ts` — v8 자동 생성 path 20개 (현재 63.7KB) |
| 생성기 | `tools/gen-title-strokes.py` (Voronoi+tube), `tools/render-title-mask.mjs`, `tools/title-plan.json` (중심선/폭 snapshot) |
| 검사 | `tools/title-check.mjs` — 20획, done, 캔버스 커버리지, 헤드/캡션, Esc, reduced-motion, 콘솔 0, FPS≥18 |
| 타이틀 자산 | `public/kanji/ou-guilv-tight.svg` (Yuji Boku Light, `tools/gen-title-svg.py`) |
| 폰트 | `stories/kiritsu/fonts/YujiBoku-KIRITSU-subset.ttf` (Light 서브셋, 22.6KB); full font 로컬 전용(gitignored) |
| 문서 | `docs/TITLE_KANJI.md`, `docs/KANJI_ATTRIBUTION.md`, `docs/STATUS.md` |

**중요**: v8 생성물은 자동 재생성 가능하지만, 다음 단계는 **그 위에 수작업
path를 덮어쓰는 것**이다. 자동 생성기를 다시 돌려 v8을 재배포하지 말 것.

## 4. 다음 작업: 20획 수작업 트레이싱 (권장 순서)

### 4.1 준비

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

### 4.2 작성 형식 (권장)

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

### 4.3 검증 루프 (필수)

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

## 5. 기존 리서치 요약 (재조사 금지)

전체 보고서(추적): [`STROKE_RESEARCH.md`](STROKE_RESEARCH.md) (2026-11-15; 원본 /tmp 보고서를 리포에 보존).
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

## 6. 파일/명령 빠른 참조

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

## 7. 수용 기준 (Definition of Done)

- [ ] 20개 획이 각각 닫힌 full-stroke SVG path이고, KanjiVG 일본어 순서.
- [ ] 각 획이 자기 붓 모양 전체를 포함(겹침/가려진 부분 연장 포함).
- [ ] 20 path union == Yuji Boku Light 글자 (area diff <0.1, raster gap <0.1%).
- [ ] 색상 오버레이에서 다른 획 잉크가 섞이지 않음.
- [ ] 타이틀 인트로 프레임에서 획이 조각/잔상/갑작스런 전체 등장 없이 자연스럽게
      이어짐. FPS ≥18(headless), 콘솔 0.
- [ ] `npm run verify`, `npm run level-oracle`, `status:write/check` green.
- [ ] 문서(`TITLE_KANJI.md`, `FLASH_HANDOVER.md`, `AUTOMATION_LOG.md`) 갱신 후
      커밋·푸시·Pages 배포 확인.
