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
  /** 완료 시 그 획의 잉크를 덮는 반폭(보로노이 잉크 거리). */
  cover: number[];
  /** 획 내 곡률/끝을 반영한 시간 가중치 누적(붓 속도 프로파일). */
  wcum: number[];
  wtotal: number;
  start: number;
  dur: number;
}
interface Plan {
  geoms: StrokeGeom[];
  end: number;
  inkPixels: number;
  /** 잉크 픽셀별 소유 획 id (0..n-1) — 획별 잉크 레이어 마스크용. */
  owner: Uint8Array;
  /** 글자 알파가 있는 모든 픽셀(AA 가장자리 포함). */
  cov: Uint8Array;
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
function analyzeInk(ds: string[]): { ink: Uint8Array; cov: Uint8Array; edt: Float32Array; w: number; h: number; inkPixels: number } {
  const c = document.createElement('canvas');
  c.width = MASK_W; c.height = MASK_H;
  const ctx = c.getContext('2d');
  const ink = new Uint8Array(MASK_W * MASK_H);
  const cov = new Uint8Array(MASK_W * MASK_H);
  const edt = new Float32Array(MASK_W * MASK_H);
  if (!ctx) return { ink, cov, edt, w: MASK_W, h: MASK_H, inkPixels: 0 };
  ctx.fillStyle = '#fff';
  for (const d of ds) {
    try { ctx.fill(new Path2D(d), 'nonzero'); } catch { /* ignore */ }
  }
  const px = ctx.getImageData(0, 0, MASK_W, MASK_H).data;
  const INF = 1e9;
  let inkPixels = 0;
  for (let i = 0; i < MASK_W * MASK_H; i++) {
    const a = px[i * 4 + 3]!;
    cov[i] = a > 0 ? 1 : 0;
    ink[i] = a > 120 ? 1 : 0;
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
  return { ink, cov, edt, w, h, inkPixels };
}

// 타이틀 재진입 시 잉크 분석(EDT/보로노이)과 글자 래스터를 재사용한다.
let titleCache: { key: string; plan: Plan; glyph: HTMLCanvasElement } | null = null;

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
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/**
 * 획 데이터 계획. KanjiVG의 실제 일본어 획순/중심선을 Yuji Boku 잉크에 맞춘 뒤,
 * (1) 잉크 픽셀을 가장 가까운 (획, 점)에 배정해 **획별 소유권(owner)** 을 만들고
 * (2) 획별 커버 반폭과 (3) 붓 속도 프로파일(곡률/끝에서 느리게)을 계산한다.
 * 애니메이션은 이 소유권으로 "그 획의 잉크만" 순서대로 드러낸다.
 */
function planStrokes(ds: string[]): Plan {
  const { ink, cov, edt, w, h, inkPixels } = analyzeInk(ds);
  const owner = new Uint8Array(w * h);
  const geoms: StrokeGeom[] = [];
  const START = 0.62, GAP = 0.035, CHAR_PAUSE = 0.14;

  // 1) 곡선화 + 실제 잉크 능선 정렬 (끝점은 방향 보존을 위해 고정)
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
    geoms.push({ pts: dense, cum, len: cum[cum.length - 1]! || 1, cover: dense.map(() => 2.4), wcum: [], wtotal: 1, start: 0, dur: 0 });
  }

  // 2) 잉크 픽셀 → 가장 가까운 (획, 점) 배정 + 커버 거리
  const need: Float32Array[] = geoms.map((g) => new Float32Array(g.pts.length));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = y * w + x;
    if (!cov[px]) continue; // AA 가장자리까지 소유권을 배정해야 미완성 획의 잔상이 없다
    let best = Infinity, bi = 0, bk = 0;
    for (let si = 0; si < geoms.length; si++) {
      const pts = geoms[si]!.pts;
      for (let k = 0; k < pts.length; k++) {
        const dx = pts[k]!.x - x, dy = pts[k]!.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; bi = si; bk = k; }
      }
    }
    owner[px] = bi;
    if (!ink[px]) continue;
    const dist = Math.sqrt(best);
    if (dist > need[bi]![bk]!) need[bi]![bk] = dist;
  }

  // 3) 커버 반폭 + 붓 속도 프로파일(곡률 큰 곳·획 끝에서 느리게)
  let t = START;
  for (let i = 0; i < geoms.length; i++) {
    const g = geoms[i]!;
    const raw = Array.from(need[i]!, (d) => Math.min(26, Math.max(2.6, d * 1.04 + 2.6)));
    const cover = raw.slice();
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 1; k < cover.length - 1; k++) cover[k] = (cover[k - 1]! + cover[k]! * 2 + cover[k + 1]!) / 4;
    }
    for (let k = 0; k < cover.length; k++) cover[k] = Math.max(raw[k]!, cover[k]!);
    g.cover = cover;

    const wts = g.pts.map((_, k) => {
      let wgt = 1;
      if (k > 0 && k < g.pts.length - 1) {
        const a = g.pts[k - 1]!, b = g.pts[k]!, c = g.pts[k + 1]!;
        const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
        const ang = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y));
        wgt = 1 + 2.8 * (ang / Math.PI); // 모서리/곡선에서 느려짐
      }
      return wgt;
    });
    wts[0] *= 1.4;
    wts[wts.length - 1] *= 1.6; // 붓을 내리고/들 때 잠깐 느리게
    const wcum: number[] = [wts[0]!];
    for (let k = 1; k < wts.length; k++) wcum.push(wcum[k - 1]! + wts[k]!);
    g.wcum = wcum;
    g.wtotal = wcum[wcum.length - 1]! || 1;

    g.dur = Math.min(0.34, Math.max(0.12, 0.10 + g.len / 1050));
    g.start = t;
    t += g.dur + GAP;
    if (i === geoms.length - 2) t += CHAR_PAUSE;
  }
  return { geoms, end: t, inkPixels, owner, cov };
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
      titleCache = { key, plan: planStrokes(ds), glyph: rasterGlyph(ds, fill, OUT_SCALE) };
    }
    const plan = titleCache.plan;
    const glyph = titleCache.glyph;
    const { geoms, end, inkPixels, owner, cov } = plan;
    const n = geoms.length;

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
    const head = root.querySelector<HTMLElement>('.kt-laser-head');
    const screen = root.querySelector<HTMLElement>('.kt-screen');
    if (!gl || !screen) return;
    const W = out.width, H = out.height;
    const mk = (): HTMLCanvasElement => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const revealed = mk(), rctx = revealed.getContext('2d');
    const temp = mk(), tctx = temp.getContext('2d');
    const partial = mk(), pctx = partial.getContext('2d');
    const mask = mk(), mctx = mask.getContext('2d');
    const ownCanvas = document.createElement('canvas');
    ownCanvas.width = MASK_W; ownCanvas.height = MASK_H;
    const ownCtx = ownCanvas.getContext('2d');
    if (!rctx || !tctx || !pctx || !mctx || !ownCtx) return;
    const ownImg = ownCtx.createImageData(MASK_W, MASK_H);
    let maskFor = -1;

    if (head) {
      head.style.width = '16px';
      head.style.height = '16px';
      head.style.margin = '-8px 0 0 -8px';
      head.style.mixBlendMode = 'screen';
    }
    screen.style.setProperty('--kt-end', `${(end + 0.25).toFixed(2)}s`);
    el.dataset.state = 'writing';

    /** 획 i 가 소유한 glyph 잉크만 담은 마스크를 만든다(960×480). */
    const buildMask = (i: number): void => {
      const d = ownImg.data;
      for (let px = 0; px < owner.length; px++) {
        const j = px * 4;
        if (owner[px] === i && cov[px]) { d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = 255; }
        else d[j + 3] = 0;
      }
      ownCtx.putImageData(ownImg, 0, 0);
      mctx.globalCompositeOperation = 'source-over';
      mctx.clearRect(0, 0, W, H);
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(ownCanvas, 0, 0, W, H);
      mctx.imageSmoothingEnabled = true;
      mctx.globalCompositeOperation = 'destination-in';
      mctx.drawImage(glyph, 0, 0);
      mctx.globalCompositeOperation = 'source-over';
      maskFor = i;
    };

    /** 완료된 획: 그 획의 실제 잉크를 revealed 캔버스에 crisp하게 누적. */
    const drawCompleted = (i: number): void => {
      if (maskFor !== i) buildMask(i);
      tctx.clearRect(0, 0, W, H);
      tctx.drawImage(glyph, 0, 0);
      tctx.globalCompositeOperation = 'destination-in';
      tctx.drawImage(mask, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
      rctx.drawImage(temp, 0, 0);
    };

    const arcForProgress = (g: (typeof geoms)[number], p: number): number => {
      const target = p * g.wtotal;
      let k = 0;
      while (k < g.wcum.length - 2 && g.wcum[k + 1]! < target) k++;
      const span = (g.wcum[k + 1] ?? g.wcum[k]!) - g.wcum[k]! || 1;
      const f = clamp01((target - g.wcum[k]!) / span);
      return g.cum[k]! + ((g.cum[k + 1] ?? g.cum[k]!) - g.cum[k]!) * f;
    };

    const setHead = (p: Pt, hw: number, on: boolean, angle = 0): void => {
      if (!head) return;
      head.style.left = `${(p.x / VB_W) * 100}%`;
      head.style.top = `${(p.y / VB_H) * 100}%`;
      head.style.transform = `rotate(${angle}deg) scale(${Math.max(0.45, Math.min(1.5, hw / 12))})`;
      head.style.opacity = on ? '0.9' : '0';
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gl.clearRect(0, 0, W, H);
      gl.drawImage(glyph, 0, 0);
      el.dataset.state = 'done';
      screen.classList.add('kt-idle');
      if (head) head.style.opacity = '0';
      return;
    }

    const completed = new Uint8Array(n);
    let doneCount = 0;
    let allDoneAt = -1;
    let chime = false;
    let sounded = -1;
    const startAt = performance.now();
    const trail: Pt[] = [];

    const frame = (now: number): void => {
      if (!document.contains(el)) return;
      const t = (now - startAt) / 1000;
      let active = -1;

      // 1) 완료된 획은 crisp 잉크로 누적, 진행 중 획만 실시간 부분 노출
      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (t < g.start) break;
        if (t >= g.start + g.dur) {
          if (!completed[i]) { drawCompleted(i); completed[i] = 1; doneCount++; }
        } else {
          active = i;
          const p = clamp01((t - g.start) / g.dur);
          const arc = arcForProgress(g, easeInOut(p));

          if (maskFor !== i) buildMask(i);
          const g2 = geoms[i]!;
          pctx.clearRect(0, 0, W, H);
          pctx.save();
          pctx.beginPath();
          const step = 3.2;
          for (let s = 0; s <= arc + step; s += step) {
            const ss = Math.min(s, arc);
            const pt = pointAt(g2, ss);
            const rr = (widthAt(g2, g2.cover, ss) * 1.5 + 3) * OUT_SCALE;
            const cx = pt.x * OUT_SCALE, cy = pt.y * OUT_SCALE;
            pctx.moveTo(cx + rr, cy);
            pctx.arc(cx, cy, rr, 0, Math.PI * 2);
            if (ss >= arc) break;
          }
          pctx.clip();
          pctx.drawImage(mask, 0, 0);
          pctx.restore();

          tctx.clearRect(0, 0, W, H);
          tctx.drawImage(glyph, 0, 0);
          tctx.globalCompositeOperation = 'destination-in';
          tctx.drawImage(partial, 0, 0);
          tctx.globalCompositeOperation = 'source-over';

          gl.clearRect(0, 0, W, H);
          gl.drawImage(revealed, 0, 0);
          gl.drawImage(temp, 0, 0);

          const pt = pointAt(g2, arc);
          const ahead = pointAt(g2, Math.min(g2.len, arc + 2));
          const behind = pointAt(g2, Math.max(0, arc - 2));
          const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
          const hw = widthAt(g2, g2.cover, arc);
          setHead(pt, hw, true, angle);
          trail.push(pt);
          if (trail.length > 7) trail.shift();
          if (trail.length > 1) {
            gl.lineCap = 'round';
            gl.lineJoin = 'round';
            gl.strokeStyle = 'rgba(255,243,223,.12)';
            gl.lineWidth = 7;
            gl.beginPath();
            for (let j = 0; j < trail.length; j++) {
              const q = trail[j]!;
              if (j === 0) gl.moveTo(q.x * OUT_SCALE, q.y * OUT_SCALE);
              else gl.lineTo(q.x * OUT_SCALE, q.y * OUT_SCALE);
            }
            gl.stroke();
            gl.strokeStyle = 'rgba(255,243,223,.45)';
            gl.lineWidth = 1.7;
            gl.stroke();
          }
          if (sounded !== i) { sounded = i; sfx?.play('brush', ((i % 5) * 0.03) - 0.06); }
          break;
        }
      }

      if (active < 0) {
        gl.clearRect(0, 0, W, H);
        gl.drawImage(revealed, 0, 0);
        setHead({ x: 0, y: 0 }, 1, false);
        trail.length = 0;
      }

      // 2) 20획이 전부 들어오면 잠깐 머금고 완료(원본 글자로 교체하지 않음 → 팝 없음)
      if (doneCount >= n) {
        if (allDoneAt < 0) {
          allDoneAt = t;
          if (!chime) { chime = true; sfx?.play('chime'); }
        }
        if (t - allDoneAt >= 0.18) {
          gl.clearRect(0, 0, W, H);
          gl.drawImage(revealed, 0, 0);
          if (head) head.style.opacity = '0';
          el.dataset.state = 'done';
          screen.classList.add('kt-idle');
          return;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch {
    /* 오프라인·파싱 실패 시 정적 이미지 유지 */
  }
}
