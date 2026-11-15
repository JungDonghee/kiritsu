# TITLE KANJI — 타이틀 한자(規律) 단독 규격서

> **이 파일을 먼저 읽지 않고 타이틀 한자를 만지지 마라.** v1에서 두 가지 실수가
> 있었고(다른 AI가 반복하지 않도록 이 문서로 체계화한다), v2가 바로잡았다.

## 1. 자산 출처 (단일 진실)

| 항목 | 값 |
|---|---|
| 글자형 원본 | **`public/kanji/ou-guilv-tight.svg`** — 구양순체(Yuji Boku, OFL 1.1) |
| viewBox | `0 0 600 300` |
| fill | `#f2d8c9` (크림색 — 타이틀 전용) |
| 글자 그룹 | 規 `translate(-0.22,31.78) scale(0.23454)` / 律 `translate(312.44,-1.80) scale(0.32230)` |

**금지(실수 사례 v1)**: `src/ui/kanji.ts`의 옛 `KANJI_KIRITSU_SVG`
(viewBox 218×109, 분홍 그라디언트 `#b41439`)는 **타이틀에 쓰면 안 된다** —
같은 Yuji Boku라도 변형·색·비율이 달라 "원본 글자형이 사라진다". 그 데이터는
v2에서 제거됨(히스토리에 보존). 타이틀 글자는 **오직 ou-guilv-tight.svg** 하나.

## 2. 애니메이션 원칙 (붓글씨·레이저 쓰기)

- **절대 금지**: 획이 "팡" 나타나는 페이드/팝(실수 사례 v1) — opacity만 바꾸는
  연출은 쓰기로 보이지 않는다.
- **필수 연출 (v2 구현)**: 각 획은
  1. **레이저 코어**(`.kts-core`, 밝은 선 #fff3df, w7)가 `stroke-dashoffset`
     애니메이션으로 **먼저 그어지고**(dur .21s),
  2. **잉크 밴드**(`.kts-band`, clipPath 내부, w70, dashoffset .3s)가 그 뒤를
     따라가며 **원본 글자 fill이 드러난다** — 선이 써져 가는 것처럼 보인다.
  3. **레이저 헤드**(`.kt-laser-head`)가 스켈레톤 위를 따라간다(rAF는 인트로
     동안만, 샘플 48개 사전 계산 — 프레임당 계산·할당 0).
  4. 마지막 획 후 **번짐(settle)** 레이어(`.kts-settle`, .32s)가 밴드가 못 닿은
     가장자리를 채워 **최종 글자형을 100% 보장**한다.
- 획 스켈레톤: `src/ui/kanji.ts`의 `KIRITSU_TITLE_STROKES` — 規 11획(夫4+見7),
  律 9획(彳3+聿6), viewBox 600×300 좌표, 붓 획순(위→아래, 왼→오른).
- 인트로 타이밍: 시작 .9s, 획당 .3s+.045s 간격(20획 ≈ 7.1s 종료), 캡션·플래시
  지연값은 `src/style.css`의 kt-rise/kt-flash에서 정렬(7.3~7.85s).
- 단일 파일 빌드: `tools/inline.mjs`가 `./kanji/ou-guilv-tight.svg` 문자열을
  data URI로 인라인한다 — **같은 경로 문자열을 코드에 중복해서 쓰지 말 것**
  (중복 인라인 → 번들 예산 초과. v2는 `img.getAttribute('src')`를 재사용).
- `prefers-reduced-motion`: 즉시 전체 표시. `crt-off`: 레이저 코어 색만 흰색.

## 3. 실수 방지 체크리스트 (타이틀 한자 변경 시 전부 통과)

1. 글자형은 ou-guilv-tight.svg에서만 (다른 파일·다른 변형 금지).
2. 획 연출은 dashoffset 그리기 (fade/opacity 팝 금지).
3. 스켈레톤을 고치면 커버리지 재측정: 밴드 반폭 35 기준 **90%+** (아래 명령).
4. `node tools/title-check.mjs` 통과 (20획·유령 2·settle·헤드·reduced-motion·
   콘솔 에러 0·FPS≥18).
5. `npm run budget` 그린 (단일 파일 420KB/140KB — 인라인 중복 주의).
6. `npm run verify` 그린.
7. 이 문서·HANDOFF §0k에 변경 기록.

커버리지 측정 (스켈레톤 수정 시):
```bash
node --experimental-strip-types - <<'EOF'
import { readFileSync } from 'node:fs';
import { KIRITSU_TITLE_STROKES } from './src/ui/kanji.ts';
// ou-guilv-tight.svg의 두 path d를 샘플링해 각 스켈레톤 세그먼트까지의 최소
// 거리를 재고, band 반폭 35 이내 비율을 출력한다 (90%+ 요구).
EOF
```
(측정 코드는 HANDOFF §0k의 실행 이력에 있음.)
