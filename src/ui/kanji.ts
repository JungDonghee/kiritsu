// Yuji Boku outlines (OFL 1.1). 規律 / 起立. Brush-regular, not Noto Serif.
// See docs/KANJI_ATTRIBUTION.md.
// ── 타이틀 規律 획쓰기 v5 — 실제 일본어 획순 + 캔버스 잉크 타임라인 ─────────
// 획 순서/중심선은 KanjiVG(CC BY-SA 3.0, Ulrich Apel, https://kanjivg.tagaini.net)
// 를 참고해 추출한 좌표이며, 타이틀 글자형 자체는 아래 규격대로
// public/kanji/ou-guilv-tight.svg 만 사용한다(글자형은 교체하지 않음).
// v4까지는 손으로 찍은 스켈레톤이라 실제 일본어 획순/획형과 어긋났고, 마무리에
// 전체 획을 한 번에 부풀리는 단계가 있어 "마지막에 확"으로 보였다.
// v5: 정확한 획순/중심선 + 획별 (얇은 붓끝 → 획 완료 시 잉크가 스며들며 두께
// 채움) 2단계 리빌. 전체 일괄 정착 단계 제거.
// v1: 다른 변형 + 페이드(실수). v2: clipPath 안 CSS dash 애니메이션이 클립을
// 갱신하지 못해 얇은 선만 그려지고 끝에 통째로 나타남. v3: clipPath 리본을
// rAF로 갱신했지만 리본 폴리곤이 자잘하게 어긋나 커버리지 ~80% → 여전히
// "듬성듬성 쓰다가 마지막에 확" 문제.
// v4(현재): **글자 래스터 + 획별 잉크 배정(보로노이) + 점별 필요 반폭**으로
// "언제 · 어디를 · 얼마나 넓게" 칠할지를 데이터로 만든 뒤, 캔버스에 붓 스탬프를
// 찍어 마스크를 키우고 글자를 그 마스크로 합성한다. 클립/폴리곤/필 모드 문제가
// 없고, 각 획이 끝날 때 그 획의 잉크가 100% 덮이도록 반폭을 계산하므로 마지막
// 클립 제거(팝)가 없다. 최종 프레임은 원본 글자를 그대로 그려 글자형 100%.
import type { Sfx } from './sfx.ts';

export interface KtTitleChar {
  transform: string;
  full: string;
}

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
// 규(規)=11획(夫4+見7), 율(律)=9획(彳3+聿6).
export const KIRITSU_TITLE_STROKES: number[][][] = [
  [[14.2,89.5], [24.1,90.0], [34.1,89.5], [44.0,88.5], [53.9,87.4], [63.8,86.2], [73.7,85.0], [83.6,83.7], [93.5,82.2], [103.3,80.8], [113.3,80.5]],
  [[4.0,139.3], [15.7,139.7], [27.4,138.7], [39.1,137.6], [50.8,136.4], [62.5,135.1], [74.2,133.8], [85.9,132.6], [97.5,131.3], [109.3,130.5], [121.0,130.9]],
  [[64.7,36.0], [69.8,57.7], [69.3,80.1], [68.2,102.5], [66.0,124.9], [62.2,147.0], [56.4,168.6], [47.8,189.3], [36.1,208.3], [21.4,225.3], [4.5,240.0]],
  [[71.3,166.4], [75.8,169.8], [80.1,173.4], [84.3,177.2], [88.3,181.2], [92.1,185.4], [95.7,189.7], [99.1,194.2], [102.3,198.8], [105.2,203.6], [107.9,208.6]],
  [[150.7,40.6], [155.7,52.7], [155.8,66.0], [155.8,79.3], [155.8,92.5], [155.8,105.8], [155.8,119.1], [155.8,132.4], [155.8,145.6], [155.8,158.9], [155.8,172.2]],
  [[158.6,46.7], [181.1,44.3], [203.6,41.9], [226.1,39.6], [248.3,39.9], [260.4,54.4], [260.3,77.1], [260.1,99.7], [260.1,122.3], [259.9,145.0], [259.9,167.6]],
  [[159.3,84.9], [168.9,83.8], [178.6,82.9], [188.2,82.0], [197.9,81.1], [207.6,80.4], [217.2,79.6], [226.9,78.9], [236.6,78.2], [246.2,77.5], [255.9,77.0]],
  [[159.2,123.3], [168.9,122.6], [178.5,121.8], [188.1,121.0], [197.8,120.1], [207.4,119.4], [217.1,118.6], [226.7,117.9], [236.4,117.2], [246.0,116.6], [255.7,116.1]],
  [[159.1,164.5], [168.8,163.6], [178.5,162.7], [188.3,161.9], [198.0,161.0], [207.7,160.2], [217.5,159.4], [227.2,158.6], [236.9,157.8], [246.7,157.1], [256.4,156.5]],
  [[179.6,180.0], [177.7,190.4], [172.8,199.9], [166.7,208.7], [160.0,217.0], [152.8,224.9], [145.1,232.3], [137.0,239.3], [128.5,245.8], [119.6,251.8], [110.4,257.2]],
  [[208.1,170.0], [213.0,187.4], [213.1,205.8], [213.1,224.1], [213.7,242.3], [221.7,257.3], [238.7,263.1], [257.0,264.0], [275.3,263.3], [291.5,256.4], [296.0,239.8]],
  [[373.9,9.0], [371.8,17.7], [367.1,25.4], [362.0,32.7], [356.5,39.8], [350.8,46.8], [344.8,53.5], [338.6,60.0], [332.1,66.2], [325.3,72.1], [318.2,77.6]],
  [[375.5,80.1], [373.0,91.1], [368.3,101.5], [363.2,111.7], [357.8,121.6], [351.9,131.3], [345.7,140.8], [339.3,150.2], [332.6,159.4], [325.7,168.4], [318.5,177.2]],
  [[356.9,136.2], [360.3,151.2], [360.3,166.6], [360.3,182.1], [360.3,197.5], [360.3,213.0], [360.3,228.4], [360.3,243.9], [360.2,259.3], [360.2,274.8], [360.1,290.2]],
  [[416.9,50.9], [435.8,51.2], [454.5,48.4], [473.3,45.3], [492.0,42.4], [510.8,40.3], [523.7,48.3], [523.8,66.8], [520.8,85.5], [517.9,104.3], [514.9,123.0]],
  [[399.2,96.7], [415.9,97.0], [432.6,95.3], [449.2,93.1], [465.8,91.0], [482.4,88.8], [499.1,86.8], [515.7,85.0], [532.4,83.4], [549.1,82.0], [565.8,82.8]],
  [[416.4,136.8], [426.9,137.6], [437.3,136.1], [447.7,134.4], [458.1,132.8], [468.6,131.4], [479.1,130.1], [489.5,128.8], [500.0,127.4], [510.5,126.2], [521.0,126.2]],
  [[411.2,183.3], [423.0,184.8], [434.9,183.3], [446.7,181.2], [458.5,179.3], [470.3,177.5], [482.2,175.7], [494.0,174.2], [505.9,172.7], [517.8,171.4], [529.7,172.3]],
  [[388.1,229.5], [404.8,230.5], [421.5,228.4], [438.2,226.1], [454.9,223.9], [471.5,221.7], [488.2,219.8], [505.0,218.0], [521.7,216.4], [538.5,215.2], [555.2,216.6]],
  [[463.8,4], [468.3,32.8], [468.3,62.1], [468.2,91.3], [468.2,120.5], [468.2,149.8], [468.1,179.0], [468.1,208.3], [468.0,237.5], [468.0,266.8], [468,296.0]],
];

const VB_W = 600;
const VB_H = 300;
const OUT_SCALE = 1.6; // 최종 캔버스 960×480 — 표시(≈430px)에서도 선명
const MASK_W = VB_W;
const MASK_H = VB_H;

interface Pt { x: number; y: number }
interface StrokeGeom {
  pts: Pt[];
  cum: number[];
  len: number;
  /** 붓끝 반폭 — 획을 긋는 동안 보이는 얇은 팁. */
  tip: number[];
  /** 잉크가 스며든 뒤의 반폭 — 획 완료 시 그 획의 잉크를 100% 덮는다. */
  cover: number[];
  start: number;
  dur: number;
}
interface Plan {
  geoms: StrokeGeom[];
  end: number;
  inkPixels: number;
}

// 폴리라인 → Catmull-Rom 곡선 샘플
function curl(pts: number[][], perSeg = 10): Pt[] {
  const P = pts.map((p) => ({ x: p[0]!, y: p[1]! }));
  const g = (i: number): Pt => P[Math.max(0, Math.min(P.length - 1, i))]!;
  const out: Pt[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push({ ...P[P.length - 1]! });
  return out;
}

export function transformDToViewBox(d: string, tr: string): string {
  const m = /translate\(([-\d.]+),([-\d.]+)\) scale\(([-\d.]+)\)/.exec(tr);
  if (!m) return d;
  const tx = parseFloat(m[1]!), ty = parseFloat(m[2]!), k = parseFloat(m[3]!);
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi, (num) => {
    const v = parseFloat(num);
    const r = i++ % 2 === 0 ? v * k + tx : v * k + ty;
    return String(Math.round(r * 10) / 10);
  });
}

function rasterGlyph(ds: string[], fill: string, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(VB_W * scale);
  c.height = Math.round(VB_H * scale);
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = fill;
  for (const d of ds) {
    try { ctx.fill(new Path2D(d), 'nonzero'); } catch { /* ignore */ }
  }
  return c;
}

/** 잉크 마스크 + 거리변환(EDT, viewBox 단위). */
function analyzeInk(ds: string[]): { ink: Uint8Array; edt: Float32Array; w: number; h: number; inkPixels: number } {
  const c = document.createElement('canvas');
  c.width = MASK_W; c.height = MASK_H;
  const ctx = c.getContext('2d');
  const ink = new Uint8Array(MASK_W * MASK_H);
  const edt = new Float32Array(MASK_W * MASK_H);
  if (!ctx) return { ink, edt, w: MASK_W, h: MASK_H, inkPixels: 0 };
  ctx.fillStyle = '#fff';
  for (const d of ds) {
    try { ctx.fill(new Path2D(d), 'nonzero'); } catch { /* ignore */ }
  }
  const px = ctx.getImageData(0, 0, MASK_W, MASK_H).data;
  const INF = 1e9;
  let inkPixels = 0;
  for (let i = 0; i < MASK_W * MASK_H; i++) {
    ink[i] = px[i * 4 + 3]! > 120 ? 1 : 0;
    if (ink[i]) inkPixels++;
    edt[i] = ink[i] ? INF : 0;
  }
  const A = 1, B = Math.SQRT2;
  const w = MASK_W, h = MASK_H;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!edt[i]) continue;
    let m = edt[i]!;
    if (x > 0) m = Math.min(m, edt[i - 1]! + A);
    if (y > 0) m = Math.min(m, edt[i - w]! + A);
    if (x > 0 && y > 0) m = Math.min(m, edt[i - w - 1]! + B);
    if (x < w - 1 && y > 0) m = Math.min(m, edt[i - w + 1]! + B);
    edt[i] = m;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (!edt[i]) continue;
    let m = edt[i]!;
    if (x < w - 1) m = Math.min(m, edt[i + 1]! + A);
    if (y < h - 1) m = Math.min(m, edt[i + w]! + A);
    if (x < w - 1 && y < h - 1) m = Math.min(m, edt[i + w + 1]! + B);
    if (x > 0 && y < h - 1) m = Math.min(m, edt[i + w - 1]! + B);
    edt[i] = m;
  }
  return { ink, edt, w, h, inkPixels };
}

// 타이틀 재진입 시 잉크 분석(EDT/보로노이)과 글자 래스터를 재사용한다.
let titleCache: { key: string; plan: Plan; glyph: HTMLCanvasElement; glow: HTMLCanvasElement } | null = null;

const edtAt = (edt: Float32Array, w: number, h: number, x: number, y: number): number => {
  const px = Math.round(x), py = Math.round(y);
  if (px < 0 || py < 0 || px >= w || py >= h) return 0;
  return edt[py * w + px]!;
};

// 스켈레톤 전체를 EDT 합이 최대가 되는 (dx,dy)로 평행이동(손좌표 오차 보정).
function offsetSearch(edt: Float32Array, w: number, h: number, pts: Pt[]): Pt {
  let best = -1, bx = 0, by = 0;
  for (let dy = -10; dy <= 10; dy += 2) for (let dx = -10; dx <= 10; dx += 2) {
    let sum = 0;
    for (const p of pts) sum += edtAt(edt, w, h, p.x + dx, p.y + dy);
    if (sum > best) { best = sum; bx = dx; by = dy; }
  }
  for (let dy = by - 1; dy <= by + 1; dy++) for (let dx = bx - 1; dx <= bx + 1; dx++) {
    let sum = 0;
    for (const p of pts) sum += edtAt(edt, w, h, p.x + dx, p.y + dy);
    if (sum > best) { best = sum; bx = dx; by = dy; }
  }
  return { x: bx, y: by };
}

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/**
 * 획 데이터 계획. KanjiVG에서 뽑은 실제 획순/중심선을 Yuji Boku 잉크에 맞춰
 * 미세 보정하고, 각 점의 (a) 붓끝 반폭(tip, EDT)과 (b) 완료 시 덮어야 할
 * 반폭(cover, 잉크 배정 거리)을 따로 계산한다. 획이 끝나면 cover로 그 획의
 * 잉크를 100% 덮으므로 마지막 전체 팝이 없다.
 */
function planStrokes(ds: string[]): Plan {
  const { ink, edt, w, h, inkPixels } = analyzeInk(ds);
  const geoms: StrokeGeom[] = [];
  const START = 0.62, GAP = 0.035, CHAR_PAUSE = 0.14;

  // 1) 곡선화 + 잉크 능선 미세 정렬. (KanjiVG 좌표가 이미 획형에 가까워
  //    offsetSearch는 ±10 안에서 작은 보정만 한다.)
  for (const stroke of KIRITSU_TITLE_STROKES) {
    const dense = curl(stroke, 8);
    for (let pass = 0; pass < 1; pass++) {
      for (let k = 1; k < dense.length - 1; k++) {
        dense[k] = {
          x: (dense[k - 1]!.x + dense[k]!.x * 2 + dense[k + 1]!.x) / 4,
          y: (dense[k - 1]!.y + dense[k]!.y * 2 + dense[k + 1]!.y) / 4,
        };
      }
    }
    const off = offsetSearch(edt, w, h, dense);
    for (const p of dense) { p.x += off.x; p.y += off.y; }
    // KanjiVG는 일본 표준 글자형이라 Yuji Boku(구양순체 계열)와 미세하게 다르다.
    // 실제 잉크의 거리변환 능선으로 각 점을 ±7 안에서 당겨, 애니메이션이 화면의
    // 글자를 정확히 따라가게 한다(끝점은 시작/끝 방향 보존을 위해 고정).
    for (let k = 1; k < dense.length - 1; k++) {
      const o = dense[k]!;
      let best = edtAt(edt, w, h, o.x, o.y), bx = o.x, by = o.y;
      for (let dy = -7; dy <= 7; dy++) for (let dx = -7; dx <= 7; dx++) {
        const e = edtAt(edt, w, h, o.x + dx, o.y + dy);
        if (e > best + 0.01) { best = e; bx = o.x + dx; by = o.y + dy; }
      }
      if (Math.hypot(bx - o.x, by - o.y) <= 9) { dense[k] = { x: bx, y: by }; }
    }
    for (let pass = 0; pass < 1; pass++) {
      for (let k = 1; k < dense.length - 1; k++) {
        dense[k] = {
          x: (dense[k - 1]!.x + dense[k]!.x * 2 + dense[k + 1]!.x) / 4,
          y: (dense[k - 1]!.y + dense[k]!.y * 2 + dense[k + 1]!.y) / 4,
        };
      }
    }
    const cum: number[] = [0];
    for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1]! + Math.hypot(dense[k]!.x - dense[k - 1]!.x, dense[k]!.y - dense[k - 1]!.y));
    geoms.push({ pts: dense, cum, len: cum[cum.length - 1]! || 1, tip: dense.map(() => 2.4), cover: dense.map(() => 2.4), start: 0, dur: 0 });
  }

  // 2) 잉크 픽셀 → 가장 가까운 (획, 점) 배정 + 최대 거리(cover)
  const need: Float32Array[] = geoms.map((g) => new Float32Array(g.pts.length));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!ink[y * w + x]) continue;
    let best = Infinity, bi = 0, bk = 0;
    for (let s = 0; s < geoms.length; s++) {
      const pts = geoms[s]!.pts;
      for (let k = 0; k < pts.length; k++) {
        const dx = pts[k]!.x - x, dy = pts[k]!.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; bi = s; bk = k; }
      }
    }
    const dist = Math.sqrt(best);
    if (dist > need[bi]![bk]!) need[bi]![bk] = dist;
  }

  // 3) tip(얇은 붓끝) / cover(완료 시 잉크 커버) 폭 + 타이밍
  let t = START;
  for (let i = 0; i < geoms.length; i++) {
    const g = geoms[i]!;
    const tip = g.pts.map((p2) => Math.min(13, Math.max(2.2, edtAt(edt, w, h, p2.x, p2.y) * 1.02 + 0.9)));
    const rawCov = Array.from(need[i]!, (d) => Math.min(26, Math.max(2.6, d * 1.06 + 2.6)));
    const cover = rawCov.slice();
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 1; k < cover.length - 1; k++) cover[k] = (cover[k - 1]! + cover[k]! * 2 + cover[k + 1]!) / 4;
    }
    for (let k = 0; k < cover.length; k++) cover[k] = Math.max(rawCov[k]!, cover[k]!);
    g.tip = tip;
    g.cover = cover;
    g.dur = Math.min(0.21, Math.max(0.08, 0.07 + g.len / 1300));
    g.start = t;
    t += g.dur + GAP;
    if (i === geoms.length - 2) t += CHAR_PAUSE;
  }
  return { geoms, end: t, inkPixels };
}

// 붓 스탬프(부드러운 원) 스프라이트 — 매 프레임 gradient 생성 비용 제거.
function stampSprite(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.78, 'rgba(255,255,255,1)');
    g.addColorStop(0.94, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// 스탬프로 마스크에 획 구간 [from, to] (호 길이)을 칠한다.
function stampArc(mctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, g: StrokeGeom, widths: number[], from: number, to: number, widthMul = 1): void {
  const pts = g.pts, cum = g.cum, half = widths;
  let k = 0;
  while (k < cum.length - 2 && cum[k + 1]! <= from) k++;
  const start = Math.max(0, from);
  const end = Math.max(start, to);
  let s = start;
  while (s <= end) {
    while (k < cum.length - 2 && cum[k + 1]! < s) k++;
    const a = pts[k]!, b = pts[k + 1] ?? a;
    const seg = (cum[k + 1]! - cum[k]!) || 1;
    const f = clamp01((s - cum[k]!) / seg);
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    const hw = (half[k]! + ((half[k + 1] ?? half[k]!) - half[k]!) * f) * widthMul;
    mctx.drawImage(sprite, x - hw, y - hw, hw * 2, hw * 2);
    s += Math.max(1.6, hw * 0.55);
  }
  // 마지막 지점 보정
  const last = Math.min(end, cum[cum.length - 1]!);
  let kk = k;
  while (kk < cum.length - 2 && cum[kk + 1]! < last) kk++;
  const a = pts[kk]!, b = pts[kk + 1] ?? a;
  const seg = (cum[kk + 1]! - cum[kk]!) || 1;
  const f = clamp01((last - cum[kk]!) / seg);
  const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
  const hw = (half[kk]! + ((half[kk + 1] ?? half[kk]!) - half[kk]!) * f) * widthMul;
  mctx.drawImage(sprite, x - hw, y - hw, hw * 2, hw * 2);
}

function pointAt(g: StrokeGeom, s: number): Pt {
  let k = 0;
  while (k < g.cum.length - 2 && g.cum[k + 1]! < s) k++;
  const a = g.pts[k]!, b = g.pts[k + 1] ?? a;
  const seg = (g.cum[k + 1]! - g.cum[k]!) || 1;
  const f = clamp01((s - g.cum[k]!) / seg);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

function widthAt(g: StrokeGeom, widths: number[], s: number): number {
  let k = 0;
  while (k < g.cum.length - 2 && g.cum[k + 1]! < s) k++;
  const seg = (g.cum[k + 1]! - g.cum[k]!) || 1;
  const f = clamp01((s - g.cum[k]!) / seg);
  return widths[k]! + ((widths[k + 1] ?? widths[k]!) - widths[k]!) * f;
}

/** 원본 SVG를 받아 캔버스 기반 획쓰기 인트로를 띄운다. */
export async function mountKtTitleWrite(root: HTMLElement, sfx?: Sfx): Promise<void> {
  const img = root.querySelector<HTMLImageElement>('.kt-ink img');
  if (!img) return;
  try {
    const src = img.getAttribute('src');
    if (!src) return;
    const res = await fetch(src);
    if (!res.ok) return;
    const text = await res.text();
    const { chars, fill } = parseTitleKanji(text);
    if (chars.length < 2) return;
    const ds = chars.map((c) => transformDToViewBox(c.full, c.transform));
    const key = `${ds.length}:${ds[0]!.length}:${ds[1]?.length ?? 0}:${fill}`;
    if (!titleCache || titleCache.key !== key) {
      const glyph = rasterGlyph(ds, fill, OUT_SCALE);
      // 잉크 번짐: 글자를 살짝 블러한 레이어(마스크와 함께 합성 → 젖은 가장자리)
      const glow = document.createElement('canvas');
      glow.width = glyph.width; glow.height = glyph.height;
      const gctx = glow.getContext('2d');
      if (gctx) {
        gctx.filter = 'blur(3.2px)';
        gctx.drawImage(glyph, 0, 0);
        gctx.filter = 'none';
      }
      titleCache = { key, plan: planStrokes(ds), glyph, glow };
    }
    const plan = titleCache.plan;
    const glyph = titleCache.glyph;
    const glyphGlow = titleCache.glow;
    const { geoms, end, inkPixels } = plan;
    const n = geoms.length;

    // 렌더 캔버스(960×480) + 글자 원본 + 마스크(600×300) + 스탬프 스프라이트
    const el = document.createElement('div');
    el.className = 'kt-ink kt-ink-write';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.strokes = String(n);
    el.dataset.ink = String(inkPixels);
    const out = document.createElement('canvas');
    out.className = 'kts-canvas';
    out.width = Math.round(VB_W * OUT_SCALE);
    out.height = Math.round(VB_H * OUT_SCALE);
    out.style.cssText = 'display:block;width:100%;height:100%';
    el.append(out);
    img.replaceWith(el);

    const gl = out.getContext('2d');
    const mask = document.createElement('canvas');
    mask.width = MASK_W; mask.height = MASK_H;
    const mctx = mask.getContext('2d');
    const sprite = stampSprite();
    const head = root.querySelector<HTMLElement>('.kt-laser-head');
    const screen = root.querySelector<HTMLElement>('.kt-screen');
    if (!gl || !mctx || !screen) return;
    if (head) {
      head.style.width = '16px';
      head.style.height = '16px';
      head.style.margin = '-8px 0 0 -8px';
      head.style.mixBlendMode = 'screen';
    }
    screen.style.setProperty('--kt-end', `${(end + 0.12).toFixed(2)}s`);
    el.dataset.state = 'writing';

    // 프레임 합성: 마스크 안쪽의 글자 잉크만 그린다.
    const compose = (trail: Pt[]): void => {
      gl.globalCompositeOperation = 'source-over';
      gl.clearRect(0, 0, out.width, out.height);
      gl.globalAlpha = 0.38;
      gl.drawImage(glyphGlow, 0, 0);
      gl.globalAlpha = 1;
      gl.drawImage(glyph, 0, 0);
      gl.globalCompositeOperation = 'destination-in';
      gl.imageSmoothingEnabled = true;
      gl.drawImage(mask, 0, 0, out.width, out.height);
      gl.globalCompositeOperation = 'source-over';
      // 붓 끝의 젖은 궤적(짧은 잔광) — 마지막 6점만, 마스크 밖에서도 보이게.
      if (trail.length > 1) {
        gl.lineCap = 'round';
        gl.lineJoin = 'round';
        gl.strokeStyle = 'rgba(255,243,223,.12)';
        gl.lineWidth = 7;
        gl.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const p = trail[i]!;
          if (i === 0) gl.moveTo(p.x * OUT_SCALE, p.y * OUT_SCALE);
          else gl.lineTo(p.x * OUT_SCALE, p.y * OUT_SCALE);
        }
        gl.stroke();
        gl.strokeStyle = 'rgba(255,243,223,.5)';
        gl.lineWidth = 1.8;
        gl.stroke();
      }
    };
    const setHead = (p: Pt, hw: number, on: boolean): void => {
      if (!head) return;
      head.style.left = `${(p.x / VB_W) * 100}%`;
      head.style.top = `${(p.y / VB_H) * 100}%`;
      head.style.transform = `scale(${Math.max(0.5, Math.min(1.6, hw / 11))})`;
      head.style.opacity = on ? '0.9' : '0';
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      mctx.fillStyle = '#fff'; // 전체 마스크 → 글자 그대로
      mctx.fillRect(0, 0, MASK_W, MASK_H);
      compose([]);
      el.dataset.state = 'done';
      (screen).classList.add('kt-idle');
      if (head) head.style.opacity = '0';
      return;
    }

    let done = false;
    let finishing = false;
    let finishAt = 0;
    let settled = 0;
    let chime = false;
    let sounded = -1;
    const startAt = performance.now();
    const drawn = new Float32Array(n); // 획별 현재까지 칠한 호 길이
    const completed = new Uint8Array(n);
    const settle = new Map<number, number>(); // 획 index → 잉크 스며들기 시작 시각
    const trail: Pt[] = [];

    const frame = (now: number): void => {
      if (!document.contains(el)) return;
      const t = (now - startAt) / 1000;

      // 1) 진행 중 획: **얇은 붓끝(tip)** 으로 중심선을 따라 칠한다.
      let active = -1;
      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (t < g.start) break;
        if (t >= g.start + g.dur) {
          if (!completed[i]) {
            if (drawn[i]! < g.len) stampArc(mctx, sprite, g, g.tip, drawn[i]!, g.len);
            drawn[i] = g.len;
            completed[i] = 1;
            settle.set(i, t);
          }
        } else {
          active = i;
          const p = clamp01((t - g.start) / g.dur);
          const arc = easeInOut(p) * g.len;
          if (arc > drawn[i]!) stampArc(mctx, sprite, g, g.tip, drawn[i]!, arc);
          drawn[i] = Math.max(drawn[i]!, arc);
          break;
        }
      }

      // 2) 방금 끝난 획: 0.2s 동안 tip → cover 로 잉크가 스며들며 두께가 채워진다.
      //    (획별로 완결되므로 "마지막에 전체가 확" 하는 단계가 없다.)
      if (settle.size) {
        for (const [i, at] of settle) {
          const g = geoms[i]!;
          const k = clamp01((t - at) / 0.2);
          if (k >= 1) { settle.delete(i); settled++; continue; }
          const e = easeOut(k);
          const widths = g.tip.map((v, j) => v + (g.cover[j]! * 1.06 - v) * e);
          stampArc(mctx, sprite, g, widths, 0, g.len);
        }
      }

      // 3) 모든 획이 잉크로 채워졌으면 원본 글자로 짧게 크로스페이드(팝 없음).
      if (!finishing && settled >= n) {
        finishing = true;
        finishAt = t;
        if (!chime) { chime = true; sfx?.play('chime'); }
      }
      if (finishing) {
        if (head) head.style.opacity = '0';
        trail.length = 0;
        compose(trail);
        const k = clamp01((t - finishAt) / 0.24);
        gl.globalCompositeOperation = 'source-over';
        gl.globalAlpha = k;
        gl.drawImage(glyph, 0, 0);
        gl.globalAlpha = 1;
        if (k >= 1 && !done) {
          done = true;
          gl.clearRect(0, 0, out.width, out.height);
          gl.drawImage(glyph, 0, 0);
          el.dataset.state = 'done';
          screen.classList.add('kt-idle');
          return;
        }
        requestAnimationFrame(frame);
        return;
      }

      // 4) 헤드/잔광 + 합성
      if (active >= 0) {
        const g = geoms[active]!;
        const arc = drawn[active]!;
        const pt = pointAt(g, arc);
        const hw = widthAt(g, g.tip, arc);
        setHead(pt, hw, true);
        trail.push(pt);
        if (trail.length > 6) trail.shift();
        if (sounded !== active) { sounded = active; sfx?.play('brush', ((active % 5) * 0.03) - 0.06); }
      } else {
        setHead({ x: 0, y: 0 }, 1, false);
        trail.length = 0;
      }
      compose(trail);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch {
    /* 오프라인·파싱 실패 시 정적 이미지 유지 */
  }
}
