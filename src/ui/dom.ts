/** Minimal DOM helpers — no framework, no virtual DOM, no dependencies. */

type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'text') el.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v as Record<string, string | number>)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
        else el.style.setProperty(sk, String(sv));
      }
    }
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T | null => root.querySelector(sel);

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function mount(root: HTMLElement, ...nodes: (Node | null)[]): void {
  clear(root);
  for (const n of nodes) if (n) root.append(n);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const isTouch = (): boolean => window.matchMedia('(pointer: coarse)').matches;

/** A group of buttons navigated with Vim keys (h/l or j/k + Enter). */
export interface FocusGroup {
  els: HTMLButtonElement[];
  index: number;
}

export function focusGroup(container: HTMLElement, sel = '.btn'): FocusGroup {
  return { els: Array.from(container.querySelectorAll<HTMLButtonElement>(sel)), index: 0 };
}

export function focusIndex(g: FocusGroup, i: number): void {
  const n = g.els.length;
  if (!n) return;
  g.index = ((i % n) + n) % n;
  g.els.forEach((el, idx) => el.classList.toggle('focused', idx === g.index));
  // Keyboard-only: a focused control must be visible even in a scrolling card.
  g.els[g.index]?.scrollIntoView({ block: 'nearest' });
}

export function focusStep(g: FocusGroup, d: 1 | -1): void {
  focusIndex(g, g.index + d);
}

export type Dir4 = 'up' | 'down' | 'left' | 'right';

/** The nearest scrollable ancestor of an element (not the window). */
export function scrollParent(el: HTMLElement): HTMLElement | null {
  let p = el.parentElement;
  while (p) {
    const st = getComputedStyle(p);
    if (/(auto|scroll)/.test(st.overflowY) && p.scrollHeight > p.clientHeight + 1) return p;
    p = p.parentElement;
  }
  return null;
}

/**
 * 2D focus move for wrapped button grids (settings). Uses element geometry so
 * j/k always move down/up and h/l left/right, even when a row has 3–4 buttons.
 * At an edge it scrolls the containing card instead (so k at the top row still
 * returns a scrolled-down settings card to the top).
 */
export function focusSpatial(g: FocusGroup, dir: Dir4): boolean {
  const cur = g.els[g.index];
  if (!cur) return false;
  const cr = cur.getBoundingClientRect();
  const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
  let best = -1, bestScore = Infinity;
  g.els.forEach((el, i) => {
    if (el === cur) return;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const dx = x - cx, dy = y - cy;
    const primary = dir === 'down' ? dy : dir === 'up' ? -dy : dir === 'right' ? dx : -dx;
    if (primary < 8) return; // must be genuinely in that direction
    const cross = dir === 'down' || dir === 'up' ? Math.abs(dx) : Math.abs(dy);
    const score = primary + cross * 0.6;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  if (best >= 0) { focusIndex(g, best); return true; }
  // Edge: scroll the settings card in the requested direction.
  const sp = scrollParent(cur);
  if (sp) {
    const before = sp.scrollTop;
    sp.scrollTop += dir === 'down' ? 72 : dir === 'up' ? -72 : 0;
    if (dir === 'left' || dir === 'right' || sp.scrollTop === before) return false;
    return true;
  }
  return false;
}

export function focusActivate(g: FocusGroup): boolean {
  const el = g.els[g.index];
  if (!el) return false;
  el.click();
  return true;
}
