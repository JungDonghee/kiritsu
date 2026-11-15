// Yuji Boku outlines (OFL 1.1). 規律 / 起立. Brush-regular, not Noto Serif.
// See docs/KANJI_ATTRIBUTION.md.
// ── 타이틀 規律 획쓰기 v4 — 캔버스 잉크 타임라인 ────────────────────────────
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
  // ── 規 ── 夫 (상단)
  [[62, 58], [130, 57], [200, 60]], // 1 가로
  [[50, 104], [140, 101], [232, 108]], // 2 가로
  [[168, 58], [120, 112], [88, 152], [64, 194]], // 3 丿
  [[120, 106], [176, 150], [224, 186], [236, 188]], // 4 乀
  // ── 見 (하단)
  [[58, 118], [140, 120], [222, 126]], // 5 目 상단 가로
  [[70, 124], [73, 180], [76, 232]], // 6 目 좌측 세로
  [[92, 150], [150, 152], [206, 156]], // 7 내부 가로1
  [[92, 188], [150, 190], [206, 194]], // 8 내부 가로2
  [[208, 124], [211, 180], [214, 236], [188, 244]], // 9 目 우측 세로(하단 좌굴)
  [[110, 234], [92, 250], [66, 262]], // 10 儿 좌측 다리
  [[148, 232], [180, 252], [210, 264], [244, 248], [258, 238]], // 11 儿 우측 다리
  // ── 律 ── 彳 (좌측)
  [[348, 8], [344, 50], [338, 100], [334, 126]], // 1 丿
  [[372, 16], [366, 70], [360, 128]], // 2 丿
  [[374, 72], [384, 140], [398, 220], [394, 232]], // 3 丨
  // ── 聿 (우측)
  [[400, 30], [476, 27], [552, 26]], // 4 가로1
  [[398, 86], [478, 84], [556, 84]], // 5 가로2
  [[398, 142], [478, 142], [556, 142]], // 6 가로3
  [[394, 200], [478, 200], [560, 200]], // 7 가로4(장)
  [[470, 34], [478, 140], [486, 286]], // 8 세로
  [[400, 280], [478, 284], [556, 288], [560, 290]], // 9 하단 가로
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
  /** 점별 붓 반폭(viewBox 단위) — 그 점이 덮어야 하는 잉크 거리에서 계산. */
  half: number[];
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
 * 획 데이터 계획. 각 잉크 픽셀을 가장 가까운 (획, 점)에 배정한 뒤, 그 점이
 * 덮어야 하는 최대 거리를 점별 반폭으로 저장한다 → 획 하나가 끝나면 그 획의
 * 잉크는 100% 마스크에 덮인다(마지막 전체 팝 방지의 핵심).
 */
function planStrokes(ds: string[]): Plan {
  const { ink, edt, w, h, inkPixels } = analyzeInk(ds);
  const geoms: StrokeGeom[] = [];
  const START = 0.62, GAP = 0.032, CHAR_PAUSE = 0.12;

  // 1) 곡선화 + 평행이동 보정
  for (const stroke of KIRITSU_TITLE_STROKES) {
    const dense = curl(stroke, 10);
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 1; k < dense.length - 1; k++) {
        dense[k] = {
          x: (dense[k - 1]!.x + dense[k]!.x * 2 + dense[k + 1]!.x) / 4,
          y: (dense[k - 1]!.y + dense[k]!.y * 2 + dense[k + 1]!.y) / 4,
        };
      }
    }
    const off = offsetSearch(edt, w, h, dense);
    for (const p of dense) { p.x += off.x; p.y += off.y; }
    const cum: number[] = [0];
    for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1]! + Math.hypot(dense[k]!.x - dense[k - 1]!.x, dense[k]!.y - dense[k - 1]!.y));
    geoms.push({ pts: dense, cum, len: cum[cum.length - 1]! || 1, half: dense.map(() => 0), start: 0, dur: 0 });
  }

  // 2) 잉크 픽셀 → 가장 가까운 (획, 점) 배정 + 최대 거리
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

  // 3) 점별 반폭: 필요거리 + 여유(획 내부는 alpha 1 plateau에 들어오게)
  let t = START;
  for (let i = 0; i < geoms.length; i++) {
    const g = geoms[i]!;
    const raw = Array.from(need[i]!, (d) => Math.min(26, Math.max(2.6, d * 1.12 + 3.2)));
    let half = raw.slice();
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 1; k < half.length - 1; k++) half[k] = (half[k - 1]! + half[k]! * 2 + half[k + 1]!) / 4;
    }
    for (let k = 0; k < half.length; k++) half[k] = Math.max(raw[k]!, half[k]!);
    g.half = half;
    g.dur = Math.min(0.19, Math.max(0.075, 0.06 + g.len / 1400));
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
function stampArc(mctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, g: StrokeGeom, from: number, to: number, widthMul = 1): void {
  const pts = g.pts, cum = g.cum, half = g.half;
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

function halfAt(g: StrokeGeom, s: number): number {
  let k = 0;
  while (k < g.cum.length - 2 && g.cum[k + 1]! < s) k++;
  const seg = (g.cum[k + 1]! - g.cum[k]!) || 1;
  const f = clamp01((s - g.cum[k]!) / seg);
  return g.half[k]! + ((g.half[k + 1] ?? g.half[k]!) - g.half[k]!) * f;
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
    const startAt = performance.now();
    const drawn = new Float32Array(n); // 획별 현재까지 칠한 호 길이
    const settle = new Map<number, number>(); // 획 index → settle 시작 시각(초)
    let spreadAt = -1;
    let chime = false;
    let sounded = -1;
    const trail: Pt[] = [];

    const frame = (now: number): void => {
      if (!document.contains(el)) return;
      const t = (now - startAt) / 1000;

      // 1) 진행 중 획 칠하기 / 완료 획 settle
      let active = -1;
      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (t < g.start) break;
        if (t >= g.start + g.dur) {
          if (drawn[i]! < g.len) {
            stampArc(mctx, sprite, g, drawn[i]!, g.len);
            drawn[i] = g.len;
            settle.set(i, t);
          }
        } else {
          active = i;
          const p = clamp01((t - g.start) / g.dur);
          const s = easeInOut(p) * g.len;
          if (s > drawn[i]!) stampArc(mctx, sprite, g, drawn[i]!, s);
          drawn[i] = Math.max(drawn[i]!, s);
          break;
        }
      }
      // 완료 획의 잉크 번짐: 0.24s 동안 반폭을 1.16배까지 (가장자리 안전)
      for (const [i, at] of settle) {
        const g = geoms[i]!;
        const k = clamp01((t - at) / 0.24);
        if (k >= 1) { settle.delete(i); continue; }
        stampArc(mctx, sprite, g, 0, g.len, 1 + 0.16 * easeOut(k) * 0.5);
      }

      // 2) 마지막 획 이후 전체 잉크 정착 → 클립 없음(그대로 글자)
      if (spreadAt < 0 && t >= end) {
        spreadAt = t;
        if (!chime) { chime = true; sfx?.play('chime'); }
      }
      if (spreadAt >= 0) {
        const k = clamp01((t - spreadAt) / 0.55);
        for (const g of geoms) stampArc(mctx, sprite, g, 0, g.len, 1.16 + 0.55 * easeOut(k));
        if (k >= 1 && !done) {
          done = true;
          // 최종 프레임은 원본 글자를 그대로 그린다(글자형 100%, 팝 없음:
          // 이미 마스크가 모든 잉크를 덮고 있어 차이는 서브픽셀 AA뿐).
          gl.globalCompositeOperation = 'source-over';
          gl.clearRect(0, 0, out.width, out.height);
          gl.drawImage(glyph, 0, 0);
          if (head) head.style.opacity = '0';
          el.dataset.state = 'done';
          screen.classList.add('kt-idle');
          return;
        }
      }

      // 3) 화면 합성 + 헤드/잔광
      if (active >= 0) {
        const g = geoms[active]!;
        const s = drawn[active]!;
        const p = pointAt(g, s);
        const hw = halfAt(g, s);
        setHead(p, hw, true);
        trail.push(p);
        if (trail.length > 7) trail.shift();
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
