// ── 타이틀 規律 획쓰기 v9 — 20획 완전 붓 획 아웃라인 ─────────────────────
// 글자형은 Yuji Boku Light(OFL 1.1) 단일 소스(public/kanji/ou-guilv-tight.svg).
// 획 순서/중심선은 KanjiVG(CC BY-SA 3.0, Ulrich Apel, https://kanjivg.tagaini.net)
// 를 참고해 Yuji Boku 잉크에 정합시킨 뒤, 각 획을 **겹침/가려진 부분까지 포함한
// 닫힌 붓 획 외곽선**으로 작성했다. 20개를 획순대로 칠하면 글자와 동일해진다
// (union 래스터 diff < 0.1%, AA 가장자리 제외 — docs/TITLE_KANJI.md §8).
//
// 이전 실패 기록: v1 다른 글자형+페이드 / v2 CSS clipPath dash 미동작 / v3 리본
// 커버리지 80% / v4~v8 마스크·보로노이·튜브 분할은 "보이는 잉크 조각"이 되어
// 획이 끊기고 교차부가 파편화됐다(사용자 품질 거부). v9는 조각이 아니라 완전한
// 붓 획을 사용하고, 마지막에 글자를 덧그리지 않는다(팝 없음).
import type { Sfx } from './sfx.ts';
import {
  KIRITSU_TITLE_STROKE_PATHS,
  KIRITSU_TITLE_STROKE_RADII,
  KIRITSU_TITLE_MEDIANS,
  KIRITSU_TITLE_INK_PIXELS,
} from './title-stroke-paths.ts';

const VB_W = 600;
const VB_H = 300;
const OUT_SCALE = 1.6; // 최종 캔버스 960×480 — 표시(≈430px)에서도 선명
const INK = '#f2d8c9';

interface Pt { x: number; y: number }
interface StrokeGeom {
  pts: Pt[];
  cum: number[];
  len: number;
  /** 획 내 곡률/끝을 반영한 시간 가중치 누적(붓 속도 프로파일). */
  wcum: number[];
  wtotal: number;
  start: number;
  dur: number;
}
interface Plan {
  geoms: StrokeGeom[];
  end: number;
}

/** 폴리라인 → Catmull-Rom 곡선 샘플 (붓 머리 이동/타이밍용). */
function curl(pts: number[][], perSeg = 8): Pt[] {
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

const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/**
 * 획 데이터 계획: 획순/길이/곡률에서 시작·지속시간과 붓 속도 프로파일을 만든다.
 * 도형 자체는 title-stroke-paths.ts 의 완전한 획 외곽선을 그대로 쓴다.
 */
function planStrokes(): Plan {
  const geoms: StrokeGeom[] = [];
  const START = 0.62, GAP = 0.035, CHAR_PAUSE = 0.14;
  let t = START;
  for (let i = 0; i < KIRITSU_TITLE_MEDIANS.length; i++) {
    const dense = curl(KIRITSU_TITLE_MEDIANS[i]!, 8);
    const cum: number[] = [0];
    for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1]! + Math.hypot(dense[k]!.x - dense[k - 1]!.x, dense[k]!.y - dense[k - 1]!.y));
    const len = cum[cum.length - 1]! || 1;
    // 곡률/모서리와 획 끝에서 느려지는 속도 프로파일(붓 질감).
    const wts = dense.map((_, k) => {
      let wgt = 1;
      if (k > 0 && k < dense.length - 1) {
        const a = dense[k - 1]!, b = dense[k]!, c = dense[k + 1]!;
        const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
        const ang = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y));
        wgt = 1 + 2.8 * (ang / Math.PI);
      }
      return wgt;
    });
    wts[0] = wts[0]! * 1.4;
    wts[wts.length - 1] = wts[wts.length - 1]! * 1.6;
    const wcum: number[] = [wts[0]!];
    for (let k = 1; k < wts.length; k++) wcum.push(wcum[k - 1]! + wts[k]!);
    const wtotal = wcum[wcum.length - 1]! || 1;
    const dur = Math.min(0.34, Math.max(0.12, 0.10 + len / 1050));
    geoms.push({ pts: dense, cum, len, wcum, wtotal, start: t, dur });
    t += dur + GAP;
    if (i === KIRITSU_TITLE_MEDIANS.length - 2) t += CHAR_PAUSE;
  }
  return { geoms, end: t };
}

function pointAt(g: StrokeGeom, s: number): Pt {
  let k = 0;
  while (k < g.cum.length - 2 && g.cum[k + 1]! < s) k++;
  const a = g.pts[k]!, b = g.pts[k + 1] ?? a;
  const seg = (g.cum[k + 1]! - g.cum[k]!) || 1;
  const f = clamp01((s - g.cum[k]!) / seg);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

// 타이틀 재진입 시 계획/Path2D 재사용
let titleCache: { plan: Plan; paths: Path2D[] } | null = null;

/** 타이틀 SVG를 대체해 20획 붓글씨 인트로를 재생한다. */
export async function mountKtTitleWrite(root: HTMLElement, sfx?: Sfx): Promise<void> {
  const img = root.querySelector<HTMLImageElement>('.kt-ink img');
  if (!img) return;
  try {
    if (!titleCache) {
      titleCache = { plan: planStrokes(), paths: KIRITSU_TITLE_STROKE_PATHS.map((d) => new Path2D(d)) };
    }
    const { plan, paths } = titleCache;
    const { geoms, end } = plan;
    const n = geoms.length;
    if (paths.length !== n) return;

    const el = document.createElement('div');
    el.className = 'kt-ink kt-ink-write';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.strokes = String(n);
    el.dataset.ink = String(KIRITSU_TITLE_INK_PIXELS);
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
    const layer = document.createElement('canvas');
    layer.width = W; layer.height = H;
    const lctx = layer.getContext('2d');
    if (!lctx) return;
    const tip = document.createElement('canvas');
    tip.width = 64; tip.height = 64;
    const ttx = tip.getContext('2d');
    if (ttx) {
      const tg = ttx.createRadialGradient(32, 32, 0, 32, 32, 32);
      tg.addColorStop(0, 'rgba(255,255,255,.95)');
      tg.addColorStop(0.35, 'rgba(255,224,214,.65)');
      tg.addColorStop(0.7, 'rgba(255,120,150,.18)');
      tg.addColorStop(1, 'rgba(255,120,150,0)');
      ttx.fillStyle = tg; ttx.beginPath(); ttx.arc(32, 32, 32, 0, Math.PI * 2); ttx.fill();
    }
    if (head) {
      head.style.width = '16px';
      head.style.height = '16px';
      head.style.margin = '-8px 0 0 -8px';
      head.style.mixBlendMode = 'screen';
    }
    screen.style.setProperty('--kt-end', `${(end + 0.25).toFixed(2)}s`);
    el.dataset.state = 'writing';

    const arcForProgress = (g: StrokeGeom, p: number): number => {
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

    const completed = new Uint8Array(n);
    let doneCount = 0;

    const paint = (active: number, arc: number): void => {
      gl.setTransform(1, 0, 0, 1, 0, 0);
      gl.clearRect(0, 0, W, H);
      gl.setTransform(OUT_SCALE, 0, 0, OUT_SCALE, 0, 0);
      gl.fillStyle = INK;
      for (let i = 0; i < n; i++) {
        if (!completed[i] || i === active) continue;
        gl.fill(paths[i]!);
      }
      if (active < 0) return;

      const g = geoms[active]!;
      const pt = pointAt(g, arc);
      const ahead = pointAt(g, Math.min(g.len, arc + 2));
      const behind = pointAt(g, Math.max(0, arc - 2));
      let dx = ahead.x - behind.x, dy = ahead.y - behind.y;
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;

      // 진행 중 획: 호 클립 + 앞쪽 페더링(젖은 붓 끝).
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.clearRect(0, 0, W, H);
      lctx.setTransform(OUT_SCALE, 0, 0, OUT_SCALE, 0, 0);
      lctx.fillStyle = INK;
      lctx.save();
      lctx.beginPath();
      const feather = 12;
      const sweepTo = Math.min(g.len, arc + feather);
      const step = 2.5;
      for (let s = 0; s <= sweepTo + step; s += step) {
        const ss = Math.min(s, sweepTo);
        const q = pointAt(g, ss);
        const rr = KIRITSU_TITLE_STROKE_RADII[active]! + 2;
        lctx.moveTo(q.x + rr, q.y);
        lctx.arc(q.x, q.y, rr, 0, Math.PI * 2);
        if (ss >= sweepTo) break;
      }
      lctx.clip();
      lctx.fill(paths[active]!);
      lctx.restore();

      lctx.globalCompositeOperation = 'destination-in';
      const grad = lctx.createLinearGradient(
        pt.x - dx * feather, pt.y - dy * feather,
        pt.x + dx * feather, pt.y + dy * feather,
      );
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.52, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = grad;
      lctx.fillRect(-40, -40, VB_W + 80, VB_H + 80);
      lctx.globalCompositeOperation = 'source-over';

      gl.save();
      gl.setTransform(1, 0, 0, 1, 0, 0);
      // 젖은 잉크 번짐: 진행 중 획의 가장자리를 살짝 번지게 한 뒤 선명한 획을 올린다.
      gl.globalAlpha = 0.4;
      gl.filter = 'blur(2.2px)';
      gl.drawImage(layer, 0, 0);
      gl.filter = 'none';
      gl.globalAlpha = 1;
      gl.drawImage(layer, 0, 0);
      // 붓끝의 젖은 잔광(캔버스) — CSS 헤드와 별개로 항상 보이게.
      const rad = (KIRITSU_TITLE_STROKE_RADII[active]! * 1.35 + 4) * OUT_SCALE;
      gl.globalCompositeOperation = 'lighter';
      gl.globalAlpha = 0.55;
      gl.drawImage(tip, pt.x * OUT_SCALE - rad, pt.y * OUT_SCALE - rad, rad * 2, rad * 2);
      gl.globalAlpha = 1;
      gl.globalCompositeOperation = 'source-over';
      gl.restore();
      gl.setTransform(OUT_SCALE, 0, 0, OUT_SCALE, 0, 0);
    };

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      gl.setTransform(1, 0, 0, 1, 0, 0);
      gl.clearRect(0, 0, W, H);
      gl.setTransform(OUT_SCALE, 0, 0, OUT_SCALE, 0, 0);
      gl.fillStyle = INK;
      for (const p of paths) gl.fill(p);
      el.dataset.state = 'done';
      screen.classList.add('kt-idle');
      if (head) head.style.opacity = '0';
      return;
    }

    let allDoneAt = -1;
    let chime = false;
    let sounded = -1;
    const startAt = performance.now();
    const trail: Pt[] = [];

    const frame = (now: number): void => {
      if (!document.contains(el)) return;
      const t = (now - startAt) / 1000;
      let active = -1;
      let arc = 0;

      for (let i = 0; i < n; i++) {
        const g = geoms[i]!;
        if (t < g.start) break;
        if (t >= g.start + g.dur) {
          if (!completed[i]) { completed[i] = 1; doneCount++; }
        } else {
          active = i;
          const p = clamp01((t - g.start) / g.dur);
          arc = arcForProgress(g, easeInOut(p));
          break;
        }
      }

      paint(active, arc);

      if (active >= 0) {
        const g = geoms[active]!;
        const pt = pointAt(g, arc);
        const ahead = pointAt(g, Math.min(g.len, arc + 2));
        const behind = pointAt(g, Math.max(0, arc - 2));
        const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
        const hw = KIRITSU_TITLE_STROKE_RADII[active]!;
        setHead(pt, hw, true, angle);
        trail.push(pt);
        if (trail.length > 7) trail.shift();
        if (sounded !== active) { sounded = active; sfx?.play('brush', ((active % 5) * 0.03) - 0.06); }
      } else {
        setHead({ x: 0, y: 0 }, 1, false);
        trail.length = 0;
      }

      if (trail.length > 1) {
        gl.lineCap = 'round';
        gl.lineJoin = 'round';
        gl.strokeStyle = 'rgba(255,243,223,.12)';
        gl.lineWidth = 7;
        gl.beginPath();
        for (let j = 0; j < trail.length; j++) {
          const q = trail[j]!;
          if (j === 0) gl.moveTo(q.x, q.y);
          else gl.lineTo(q.x, q.y);
        }
        gl.stroke();
        gl.strokeStyle = 'rgba(255,243,223,.45)';
        gl.lineWidth = 1.7;
        gl.stroke();
      }

      if (doneCount >= n) {
        if (allDoneAt < 0) {
          allDoneAt = t;
          if (!chime) { chime = true; sfx?.play('chime'); }
        }
        if (t - allDoneAt >= 0.18) {
          paint(-1, 0);
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
    /* DOM/캔버스 예외 시 정적 이미지 유지 */
  }
}
