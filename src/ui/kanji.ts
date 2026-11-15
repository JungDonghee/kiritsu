// Yuji Boku outlines (OFL 1.1). 規律 / 起立. Brush-regular, not Noto Serif.
// See docs/KANJI_ATTRIBUTION.md.
// ── 타이틀 規律 획쓰기 v3 ────────────────────────────────────────────────────
// v2 실수 기록(반복 금지 — docs/TITLE_KANJI.md 참조):
//  ① 다른 변형 글자 사용 ② 획이 opacity로 "팡" 나타남
//  ③ clipPath 안의 CSS dash 애니메이션이 실제로 갱신되지 않아, 얇은 레이저
//     선만 그려지다가 마지막에 settle 페이드로 글자 전체가 튀어나왔다.
// v3: 원본 path를 잉크로 쓰되, 획 스켈레톤을 글자 잉크에 스냅(centroid)해
//     실제 획 두께/중심을 따라가는 **테이퍼 붓 리본**을 만들고, 리본 clip을
//     rAF로 직접 갱신한다(CSS 클립 애니메이션 의존 제거). 마지막에 리본을
//     살짝 부풀려(잉크 번짐) 남은 가장자리를 채운 뒤 clip을 제거한다.
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

// 붓 압력 프로파일: 획 종류에 따라 시작/끝 두께가 달라진다.
// h=가로, v=세로, p=丿(끝이 뾰족), n=乀(끝이 완만)
const PROFILES: Array<'h' | 'v' | 'p' | 'n'> = [
  'h', 'h', 'p', 'n', 'h', 'v', 'h', 'h', 'v', 'p', 'n',
  'p', 'p', 'v', 'h', 'h', 'h', 'h', 'v', 'h',
];

// 폴리라인을 Catmull-Rom으로 곡선화해 촘촘히 샘플링한다 (직선 폴리라인 금지).
function curl(pts: number[][], perSeg = 8): { x: number; y: number }[] {
  const P = pts.map((p) => ({ x: p[0], y: p[1] }));
  const g = (i: number): { x: number; y: number } => P[Math.max(0, Math.min(P.length - 1, i))]!;
  const out: { x: number; y: number }[] = [];
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

// path d의 좌표를 viewBox 공간으로 사전 변환한다 (런타임 transform 제거).
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

interface Pt { x: number; y: number }
interface Geom {
  pts: Pt[];
  cum: number[];
  len: number;
  base: number;
  profile: 'h' | 'v' | 'p' | 'n';
  start: number;
  dur: number;
  full: string;
}

// 글자를 오프스크린 캔버스(600×300)에 채워 잉크 마스크를 만든다.
function inkMask(ds: string[]): { ink: Uint8Array; w: number; h: number } {
  const w = 600, h = 300;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const ink = new Uint8Array(w * h);
  if (!ctx) return { ink, w, h };
  ctx.fillStyle = '#fff';
  for (const d of ds) {
    try { ctx.fill(new Path2D(d), 'nonzero'); } catch { /* bad path: ignore */ }
  }
  const px = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) ink[i] = px[i * 4 + 3]! > 120 ? 1 : 0;
  return { ink, w, h };
}

// 스켈레톤 점을 잉크 무게중심으로 당겨 실제 획 중심에 정렬한다.
function snap(mask: { ink: Uint8Array; w: number; h: number }, p: Pt, r: number): Pt {
  const { ink, w, h } = mask;
  const x0 = Math.max(0, Math.floor(p.x - r)), x1 = Math.min(w - 1, Math.ceil(p.x + r));
  const y0 = Math.max(0, Math.floor(p.y - r)), y1 = Math.min(h - 1, Math.ceil(p.y + r));
  let n = 0, sx = 0, sy = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!ink[y * w + x]) continue;
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy > r * r) continue;
      n++; sx += x; sy += y;
    }
  }
  if (n < 4) return p;
  return { x: sx / n, y: sy / n };
}

// 획 중심에서 국소 잉크 면적으로 붓 두께를 추정한다.
function thickness(mask: { ink: Uint8Array; w: number; h: number }, p: Pt, r = 7): number {
  const { ink, w, h } = mask;
  let n = 0;
  for (let y = Math.max(0, Math.floor(p.y - r)); y <= Math.min(h - 1, Math.ceil(p.y + r)); y++) {
    for (let x = Math.max(0, Math.floor(p.x - r)); x <= Math.min(w - 1, Math.ceil(p.x + r)); x++) {
      if (!ink[y * w + x]) continue;
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy <= r * r) n++;
    }
  }
  return (n / (2 * r)) * 1.62;
}

function halfAt(base: number, s: number, profile: 'h' | 'v' | 'p' | 'n'): number {
  const t = Math.min(1, Math.max(0, s));
  let f: number;
  if (profile === 'p') f = 0.20 + 0.80 * Math.pow(1 - t, 0.55);
  else if (profile === 'n') f = 0.24 + 0.76 * Math.pow(1 - t, 0.5);
  else if (profile === 'v') f = 0.80 + 0.20 * Math.sin(Math.PI * t);
  else f = 0.86 + 0.14 * Math.sin(Math.PI * t);
  return (base / 2) * f;
}

const r1 = (v: number): string => (Math.round(v * 10) / 10).toString();

// 중심선 + 두께 프로파일 → 닫힌 붓 리본 path d.
// endLen을 주면 그 길이까지만(부분 쓰기) 그린다.
function ribbon(pts: Pt[], base: number, profile: 'h' | 'v' | 'p' | 'n', cum: number[], len: number, endLen?: number): string {
  const n = pts.length;
  const last = endLen === undefined ? n - 1 : Math.max(1, Math.min(n - 1, (() => {
    let k = 0;
    while (k < n - 1 && cum[k + 1]! <= endLen) k++;
    return k + 1;
  })()));
  const use: Pt[] = [];
  const half: number[] = [];
  for (let i = 0; i < last; i++) {
    use.push(pts[i]!);
    half.push(halfAt(base, cum[i]! / len, profile));
  }
  if (endLen !== undefined) {
    const a = pts[last - 1]!, b = pts[last]!;
    const seg = (cum[last]! - cum[last - 1]!) || 1;
    const f = Math.min(1, Math.max(0, (endLen - cum[last - 1]!) / seg));
    use.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
    half.push(halfAt(base, Math.min(1, endLen / len), profile));
  } else {
    use.push(pts[n - 1]!);
    half.push(halfAt(base, 1, profile));
  }
  const m = use.length;
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < m; i++) {
    const a = use[Math.max(0, i - 1)]!, b = use[Math.min(m - 1, i + 1)]!;
    const tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const h = half[i]!;
    L.push({ x: use[i]!.x + nx * h, y: use[i]!.y + ny * h });
    R.push({ x: use[i]!.x - nx * h, y: use[i]!.y - ny * h });
  }
  // 진행 방향 단위벡터
  const dir = (a: Pt, b: Pt): Pt => {
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  };
  const tEnd = dir(use[Math.max(0, m - 2)]!, use[m - 1]!);
  const tStart = dir(use[1] ?? use[0]!, use[0]!);
  const he = half[m - 1]!, hs = half[0]!;
  let d = `M${r1(L[0]!.x)},${r1(L[0]!.y)}`;
  for (let i = 1; i < m; i++) d += `L${r1(L[i]!.x)},${r1(L[i]!.y)}`;
  // 끝(붓 끝) 둥근 캡
  const tipE = { x: use[m - 1]!.x + tEnd.x * he * 0.95, y: use[m - 1]!.y + tEnd.y * he * 0.95 };
  d += `Q${r1(L[m - 1]!.x + tEnd.x * he * 0.5)},${r1(L[m - 1]!.y + tEnd.y * he * 0.5)} ${r1(tipE.x)},${r1(tipE.y)}`;
  d += `Q${r1(R[m - 1]!.x + tEnd.x * he * 0.5)},${r1(R[m - 1]!.y + tEnd.y * he * 0.5)} ${r1(R[m - 1]!.x)},${r1(R[m - 1]!.y)}`;
  for (let i = m - 2; i >= 0; i--) d += `L${r1(R[i]!.x)},${r1(R[i]!.y)}`;
  // 시작(붓 눌림) 둥근 캡
  const tipS = { x: use[0]!.x + tStart.x * hs * 0.9, y: use[0]!.y + tStart.y * hs * 0.9 };
  d += `Q${r1(R[0]!.x + tStart.x * hs * 0.5)},${r1(R[0]!.y + tStart.y * hs * 0.5)} ${r1(tipS.x)},${r1(tipS.y)}`;
  d += `Q${r1(L[0]!.x + tStart.x * hs * 0.5)},${r1(L[0]!.y + tStart.y * hs * 0.5)} ${r1(L[0]!.x)},${r1(L[0]!.y)}Z`;
  return d;
}

function centerline(pts: Pt[], cum: number[], endLen?: number): string {
  const n = pts.length;
  const last = endLen === undefined ? n - 1 : Math.max(1, Math.min(n - 1, (() => {
    let k = 0;
    while (k < n - 1 && cum[k + 1]! <= endLen) k++;
    return k + 1;
  })()));
  let d = `M${r1(pts[0]!.x)},${r1(pts[0]!.y)}`;
  for (let i = 1; i < last; i++) d += `L${r1(pts[i]!.x)},${r1(pts[i]!.y)}`;
  if (endLen !== undefined) {
    const a = pts[last - 1]!, b = pts[last]!;
    const seg = (cum[last]! - cum[last - 1]!) || 1;
    const f = Math.min(1, Math.max(0, (endLen - cum[last - 1]!) / seg));
    d += `L${r1(a.x + (b.x - a.x) * f)},${r1(a.y + (b.y - a.y) * f)}`;
  } else d += `L${r1(pts[n - 1]!.x)},${r1(pts[n - 1]!.y)}`;
  return d;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

interface Plan {
  geoms: Geom[];
  end: number;
  spread: number;
}

function buildGeoms(ds: string[], strokes: number[][][]): Plan {
  const mask = inkMask(ds);
  const geoms: Geom[] = [];
  const START = 0.62, GAP = 0.032, CHAR_PAUSE = 0.12;
  let t = START;
  for (let i = 0; i < strokes.length; i++) {
    const dense = curl(strokes[i]!);
    // 잉크 무게중심으로 다단계 스냅(점점 좁은 반경) + 이완 스무딩
    for (const r of [15, 11, 8]) {
      for (const p of dense) {
        const q = snap(mask, p, r);
        p.x = lerp(p.x, q.x, 0.8);
        p.y = lerp(p.y, q.y, 0.8);
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let k = 1; k < dense.length - 1; k++) {
        dense[k]!.x = (dense[k - 1]!.x + dense[k]!.x * 2 + dense[k + 1]!.x) / 4;
        dense[k]!.y = (dense[k - 1]!.y + dense[k]!.y * 2 + dense[k + 1]!.y) / 4;
      }
    }
    const cum: number[] = [0];
    for (let k = 1; k < dense.length; k++) {
      cum.push(cum[k - 1]! + Math.hypot(dense[k]!.x - dense[k - 1]!.x, dense[k]!.y - dense[k - 1]!.y));
    }
    const len = cum[cum.length - 1]! || 1;
    const profile = PROFILES[i] ?? 'h';
    // 두께: 내부 샘플의 국소 면적 추정치 중앙값
    const est: number[] = [];
    for (let k = 2; k < dense.length - 2; k += 2) est.push(thickness(mask, dense[k]!));
    est.sort((a, b) => a - b);
    const base = Math.min(42, Math.max(16, est.length ? est[Math.floor(est.length * 0.7)]! : 26));
    const dur = Math.min(0.185, Math.max(0.07, 0.055 + len / 1400));
    const geom: Geom = { pts: dense, cum, len, base, profile, start: t, dur, full: '' };
    geom.full = ribbon(dense, base, profile, cum, len);
    geoms.push(geom);
    t += dur + GAP;
    if (i === strokes.length - 2) t += CHAR_PAUSE; // 規 다음 숨 고르기
  }
  return { geoms, end: t, spread: 0.46 };
}

// 원본 SVG를 가져와 획쓰기 오버레이를 띄운다(실패 시 기존 정적 이미지 유지).
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
    const plan = buildGeoms(ds, KIRITSU_TITLE_STROKES);
    const { geoms, end, spread } = plan;
    const n = geoms.length;

    const el = document.createElement('div');
    el.className = 'kt-ink kt-ink-write';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      `<svg class="kts-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" data-strokes="${n}">` +
      `<defs><clipPath id="ktclip">${geoms.map((_, i) => `<path class="kts-rib r${i}" d="M-20,-20"/>`).join('')}<path class="kts-live" d="M-20,-20"/></clipPath></defs>` +
      `<g class="kts-ink" clip-path="url(#ktclip)">${ds.map((d) => `<path fill="${fill}" fill-rule="nonzero" d="${d}"/>`).join('')}</g>` +
      `<path class="kts-tip" d="" fill="none" stroke="#fff3df" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`;
    img.replaceWith(el);

    const svg = el.querySelector<SVGSVGElement>('.kts-svg');
    const inkG = el.querySelector<SVGGElement>('.kts-ink');
    const live = el.querySelector<SVGPathElement>('.kts-live');
    const tip = el.querySelector<SVGPathElement>('.kts-tip');
    const ribs = Array.from(el.querySelectorAll<SVGPathElement>('.kts-rib'));
    const head = root.querySelector<HTMLElement>('.kt-laser-head');
    if (!svg || !inkG || !live || !tip || !head || ribs.length !== n) return;

    // 캡션/블룸 타이밍을 정확한 쓰기 종료 시각에 맞춘다.
    const screen = root.querySelector<HTMLElement>('.kt-screen');
    (screen ?? root).style.setProperty('--kt-end', `${(end + 0.12).toFixed(2)}s`);
    el.dataset.state = 'writing';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      for (let i = 0; i < n; i++) ribs[i]!.setAttribute('d', geoms[i]!.full);
      inkG.removeAttribute('clip-path');
      tip.setAttribute('d', '');
      head.style.opacity = '0';
      el.dataset.state = 'done';
      root.querySelector<HTMLElement>('.kt-screen')?.classList.add('kt-idle');
      return;
    }

    let done = false, spreadStarted = false, lastActive = -1, spreadAt = 0;
    let chime = false;
    const pointAt = (g: Geom, s: number): Pt => {
      let k = 0;
      while (k < g.cum.length - 2 && g.cum[k + 1]! < s) k++;
      const a = g.pts[k]!, b = g.pts[k + 1]!;
      const seg = (g.cum[k + 1]! - g.cum[k]!) || 1;
      const f = clamp01((s - g.cum[k]!) / seg);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    };

    const startAt = performance.now();
    const frame = (now: number): void => {
      if (!document.contains(el)) return;
      const t = (now - startAt) / 1000;
      let active = -1;
      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (t < g.start) break;
        if (t >= g.start + g.dur) {
          if (!ribs[i]!.getAttribute('d') || ribs[i]!.getAttribute('d') === 'M-20,-20') {
            ribs[i]!.setAttribute('d', g.full);
            if (i === n - 1) { spreadStarted = true; spreadAt = t; }
          }
        } else {
          active = i;
          break;
        }
      }
      if (!spreadStarted) {
        // 방금 끝난 획은 잉크가 살짝 번지듯 두께가 자란다(획별 settle).
        for (let i = 0; i < n; i++) {
          const g = geoms[i]!;
          const since = t - (g.start + g.dur);
          if (since < 0 || since > 0.26 || (i === n - 1 && since >= 0)) continue;
          const ex = 1 + 0.85 * easeOut(clamp01(since / 0.26));
          ribs[i]!.setAttribute('d', ribbon(g.pts, g.base * ex, g.profile, g.cum, g.len));
        }
        if (active >= 0) {
          const g = geoms[active]!;
          const p = clamp01((t - g.start) / g.dur);
          const e = easeInOut(p);
          const s = e * g.len;
          live.setAttribute('d', ribbon(g.pts, g.base, g.profile, g.cum, g.len, s));
          tip.setAttribute('d', centerline(g.pts, g.cum, Math.max(s, 0.4)));
          tip.style.opacity = '0.5';
          const pt = pointAt(g, s);
          head.style.left = `${(pt.x / 600) * 100}%`;
          head.style.top = `${(pt.y / 300) * 100}%`;
          const w = halfAt(g.base, Math.min(1, s / g.len), g.profile);
          head.style.transform = `scale(${Math.max(0.55, Math.min(1.5, w / 11))})`;
          head.style.opacity = '1';
          if (lastActive !== active) {
            lastActive = active;
            sfx?.play('brush', (active % 5) * 0.03 - 0.06);
          }
        } else {
          head.style.opacity = '0';
          tip.style.opacity = '0';
        }
        requestAnimationFrame(frame);
        return;
      }
      // 마지막 획 완료 → 잉크 번짐(리본 확장)으로 남은 가장자리 채움
      const k = clamp01((t - spreadAt) / spread);
      const mult = 1.85 + 0.55 * easeOut(k);
      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (k >= 1) break;
        ribs[i]!.setAttribute('d', ribbon(g.pts, g.base * mult, g.profile, g.cum, g.len));
      }
      head.style.opacity = '0';
      tip.style.opacity = '0';
      live.setAttribute('d', 'M-20,-20');
      if (k >= 1 && !done) {
        done = true;
        inkG.removeAttribute('clip-path');
        tip.setAttribute('d', '');
        tip.style.opacity = '0';
        live.setAttribute('d', 'M-20,-20');
        head.style.opacity = '0';
        el.dataset.state = 'done';
        screen?.classList.add('kt-idle');
        if (!chime) { chime = true; sfx?.play('chime'); }
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } catch {
    /* 오프라인·파싱 실패 시 정적 이미지 유지 */
  }
}
