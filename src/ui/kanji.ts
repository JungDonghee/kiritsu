// Yuji Boku outlines (OFL 1.1). 規律 / 起立. Brush-regular, not Noto Serif.
// See docs/KANJI_ATTRIBUTION.md.
// ── 타이틀 規律 획쓰기 v2 — 원본 구양순체(public/kanji/ou-guilv-tight.svg) ────
// v1의 실수 기록(다른 AI도 반복 금지 — docs/TITLE_KANJI.md 참조):
//  ① 원본이 ou-guilv-tight.svg(구양순체, viewBox 600×300, fill #f2d8c9)인데
//    kanji.ts의 KANJI_KIRITSU_SVG(다른 변형, viewBox 218×109, 분홍 그라디언트)를
//    써서 글자형이 바뀌었다.
//  ② 획이 opacity 페이드로 "팡" 나타남 — 쓰기 연출이 아님.
// v2: ① 잉크는 원본 path를 그대로 채운다. ② 획 스켈레톤(아래 SKELETONS)을 따라
//     클립 밴드가 지나가며 잉크가 드러나고, 레이저 코어+헤드가 스켈레톤을 그린다.

export interface KtTitleChar { transform: string; full: string }

// 원본 SVG 텍스트에서 글자 그룹(transform + 전체 path d)을 추출한다.
export function parseTitleKanji(svgText: string): { chars: KtTitleChar[]; fill: string } {
  const fill = /fill="([^"]+)"/.exec(svgText)?.[1] ?? '#f2d8c9';
  const chars: KtTitleChar[] = [];
  const re = /<g transform="([^"]+)"[^>]*><path d="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(svgText)) !== null) chars.push({ transform: m[1], full: m[2] });
  return { chars, fill };
}

// 획 스켈레톤 (viewBox 600×300 좌표). 순서 = 붓 획순(위→아래, 왼→오른).
// 규(規)=11획(夫4+見7), 율(律)=9획(彳3+聿6). 폴리라인 좌표쌍.
export const KIRITSU_TITLE_STROKES: number[][][] = [
  // ── 規 ── 夫 (상단)
  [[62,58],[130,57],[200,60]],                                   // 1 가로
  [[50,104],[140,101],[232,108]],                                // 2 가로
  [[168,58],[120,112],[88,152],[64,194]],                        // 3 丿
  [[120,106],[176,150],[224,186],[236,188]],                     // 4 乀
  // ── 見 (하단)
  [[58,118],[140,120],[222,126]],                                // 5 目 상단 가로
  [[70,124],[73,180],[76,232]],                                  // 6 目 좌측 세로
  [[92,150],[150,152],[206,156]],                                // 7 내부 가로1
  [[92,188],[150,190],[206,194]],                                // 8 내부 가로2
  [[208,124],[211,180],[214,236],[188,244]],                     // 9 目 우측 세로(하단 좌굴)
  [[110,234],[92,250],[66,262]],                                 // 10 儿 좌측 다리
  [[148,232],[180,252],[210,264],[244,248],[258,238]],           // 11 儿 우측 다리
  // ── 律 ── 彳 (좌측)
  [[348,8],[344,50],[338,100],[334,126]],                        // 1 丿
  [[372,16],[366,70],[360,128]],                                 // 2 丿
  [[374,72],[384,140],[398,220],[394,232]],                      // 3 丨
  // ── 聿 (우측)
  [[400,30],[476,27],[552,26]],                                  // 4 가로1
  [[398,86],[478,84],[556,84]],                                  // 5 가로2
  [[398,142],[478,142],[556,142]],                               // 6 가로3
  [[394,200],[478,200],[560,200]],                               // 7 가로4(장)
  [[470,34],[478,140],[486,286]],                                // 8 세로
  [[400,280],[478,284],[556,288],[560,290]],                     // 9 하단 가로
];

// 획쓰기 SVG 문자열. 원본 글자를 잉크로 채우되, 획 스켈레톤을 따라 클립 밴드가
// 지나가며 잉크가 드러난다(레이저가 스켈레톤을 긋고 잉크가 뒤따른다).
// path d의 좌표를 viewBox 공간으로 사전 변환한다 (런타임 transform 제거 —
// v2 실수: 스켈레톤·클립이 글자 transform 내부에 중첩 적용돼 어긋남).
export function transformDToViewBox(d: string, tr: string): string {
  const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+)\)/.exec(tr);
  if (!m) return d;
  const tx = parseFloat(m[1]), ty = parseFloat(m[2]), k = parseFloat(m[3]);
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi, (num) => {
    const v = parseFloat(num);
    const r = i++ % 2 === 0 ? v * k + tx : v * k + ty;
    return String(Math.round(r * 10) / 10);
  });
}

// 폴리라인 스켈레톤을 Catmull-Rom 스무딩으로 곡선화 (기계적 직선 → 붓맛)
function smoothStroke(pts: number[][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function kiritsuTitleSvg(chars: KtTitleChar[], fill: string): string {
  const N = KIRITSU_TITLE_STROKES.length;
  const START = 0.9, DUR = 0.3, GAP = 0.045;      // 20획 ≈ 6.9s 인트로
  // 모든 좌표는 viewBox(600×300) 하나로 통일: 잉크 d를 사전 변환하고,
  // 글자 transform 그룹을 쓰지 않는다(중첩 transform 금지).
  const fullV = chars.map((c) => transformDToViewBox(c.full, c.transform));
  const strokes = KIRITSU_TITLE_STROKES.map((pts, i) => {
    const d = smoothStroke(pts);
    const delay = (START + i * (DUR + GAP)).toFixed(3);
    return { d, delay, char: strokeChar(i) };
  });
  const defs =
    `<clipPath id="kts-c0">${strokes.filter((s) => s.char === 0).map((s, i) => `<path class="kts-band b${i}" style="animation-delay:${s.delay}s" d="${s.d}" pathLength="1"/>`).join('')}</clipPath>` +
    `<clipPath id="kts-c1">${strokes.filter((s) => s.char === 1).map((s, i) => `<path class="kts-band b${11 + i}" style="animation-delay:${s.delay}s" d="${s.d}" pathLength="1"/>`).join('')}</clipPath>`;
  const body = fullV
    .map((d, ci) =>
      `<g clip-path="url(#kts-c${ci})"><path fill="${fill}" fill-rule="nonzero" d="${d}"/></g><g class="kts-laser-layer">${strokes.filter((s) => s.char === ci).map((s) => `<path class="kts-core" style="animation-delay:${s.delay}s" d="${s.d}" pathLength="1"/>`).join('')}</g>`)
    .join('');
  // 유령 레이어는 두지 않는다(사용자 지적: 쓰기 전에 완성형이 보이면 안 됨).
  const settle = fullV.map((d) => `<g class="kts-settle"><path fill="${fill}" fill-rule="nonzero" d="${d}"/></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><defs>${defs}</defs>${body}${settle}</svg>`;
}

// 획 i가 어느 글자(0=規, 1=律)에 속하는가
function strokeChar(i: number): number { return i < 11 ? 0 : 1; }
// 획 i가 속한 글자의 전체 잉크 path (획별 레이어는 전체 글자 fill을 밴드로 클립)
function fullFor(chars: KtTitleChar[], i: number): string { return chars[strokeChar(i)].full; }

// 레이저 헤드를 스켈레톤 위에서 움직인다(인트로 동안만, 종료 후 정지).
// 프레임당 계산·할당 0: 샘플을 미리 만든다.
export function runKtTitleLaser(root: HTMLElement): void {
  const wrap = root.querySelector<HTMLElement>('.kt-ink-wrap');
  const head = root.querySelector<HTMLElement>('.kt-laser-head');
  const svg = root.querySelector<SVGSVGElement>('.kt-ink svg');
  if (!wrap || !head || !svg) return;
  const meas = svg.querySelectorAll<SVGPathElement>('.kts-core');
  if (!meas.length) return;
  const START = 0.9, DUR = 0.3, GAP = 0.045;
  const SAMPLES = 48;
  const traces: DOMPoint[][] = [];
  meas.forEach((p) => {
    const len = p.getTotalLength();
    const pts: DOMPoint[] = [];
    for (let j = 0; j <= SAMPLES; j++) pts.push(p.getPointAtLength((j / SAMPLES) * len));
    traces.push(pts);
  });
  const startAt = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    if (!document.contains(svg)) return;
    const t = (now - startAt) / 1000;
    let active = -1;
    for (let i = 0; i < traces.length; i++) {
      const begin = START + i * (DUR + GAP);
      if (t >= begin && t <= begin + DUR + 0.05) { active = i; break; }
    }
    if (active < 0) {
      if (t < START + traces.length * (DUR + GAP) + 0.06) raf = requestAnimationFrame(frame);
      else head.style.opacity = '0';
      return;
    }
    const begin = START + active * (DUR + GAP);
    const p = Math.min(1, Math.max(0, (t - begin) / DUR));
    const pt = traces[active][Math.round(p * SAMPLES)];
    head.style.opacity = '1';
    head.style.left = `${(pt.x / 600) * 100}%`;
    head.style.top = `${(pt.y / 300) * 100}%`;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

// 원본 SVG를 가져와 획쓰기 오버레이를 띄운다(실패 시 기존 정적 이미지 유지).
export async function mountKtTitleWrite(root: HTMLElement): Promise<void> {
  const wrap = root.querySelector<HTMLElement>('.kt-ink-wrap');
  const img = root.querySelector<HTMLImageElement>('.kt-ink img');
  if (!wrap || !img) return;
  try {
    const src = img.getAttribute('src');
    if (!src) return;
    const res = await fetch(src);          // 단일 파일 빌드에서는 data URI로 인라인됨
    if (!res.ok) return;
    const text = await res.text();
    const { chars, fill } = parseTitleKanji(text);
    if (chars.length < 2) return;
    const el = document.createElement('div');
    el.className = 'kt-ink kt-ink-write';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = kiritsuTitleSvg(chars, fill);
    img.replaceWith(el);
    runKtTitleLaser(root);
  } catch {
    /* 오프라인·파싱 실패 시 정적 이미지 유지 */
  }
}
