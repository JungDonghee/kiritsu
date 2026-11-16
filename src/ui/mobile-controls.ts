/**
 * KIRITSU mobile controls: a floating, Vim-shaped on-screen keyboard plus a
 * quiet hard-refresh button for installed PWAs.
 *
 * Native phone keyboards are QWERTY and hide h/j/k/l behind modifiers, so the
 * normal layer is laid out around what the game asks for: motions first,
 * operators next, then modes/objects/counts. While Vim is in INSERT/REPLACE
 * mode the same panel switches to a compact QWERTY layer for arbitrary text,
 * and switches straight back to Vim keys on Esc. Everything is dispatched as
 * ordinary KeyboardEvents, so every existing screen keeps working unchanged.
 */
import { h } from './dom.ts';

interface KeyDef {
  label: string;
  key?: string;
  code?: string;
  shift?: boolean;
  tokens?: string[];
  action?: 'ctrl' | 'shift' | 'refresh' | 'close';
  wide?: number;
  mode?: boolean;
}

/** Game keys (normal/visual/operator land). */
const VIM_ROWS: KeyDef[][] = [
  [
    { label: 'Esc', key: 'Escape', code: 'Escape', mode: true },
    { label: ':', key: ':', code: 'Semicolon', shift: true },
    { label: '/', key: '/', code: 'Slash' },
    { label: 'F1', key: 'F1', code: 'F1' },
    { label: 'Ctrl', action: 'ctrl', mode: true },
    { label: 'Shift', action: 'shift', mode: true },
    { label: 'Bksp', key: 'Backspace', code: 'Backspace' },
    { label: 'Enter', key: 'Enter', code: 'Enter', wide: 1.25 },
    { label: 'Space', key: ' ', code: 'Space' },
    { label: 'h', key: 'h', code: 'KeyH' }, { label: 'j', key: 'j', code: 'KeyJ' },
    { label: 'k', key: 'k', code: 'KeyK' }, { label: 'l', key: 'l', code: 'KeyL' },
    { label: 'w', key: 'w', code: 'KeyW' }, { label: 'b', key: 'b', code: 'KeyB' },
  ],
  [
    { label: 'e', key: 'e', code: 'KeyE' }, { label: '0', key: '0', code: 'Digit0' },
    { label: '^', key: '^', code: 'Digit6', shift: true },
    { label: '$', key: '$', code: 'Digit4', shift: true },
    { label: 'g', key: 'g', code: 'KeyG' },
    { label: 'd', key: 'd', code: 'KeyD' }, { label: 'c', key: 'c', code: 'KeyC' },
    { label: 'y', key: 'y', code: 'KeyY' }, { label: 'x', key: 'x', code: 'KeyX' },
    { label: 'p', key: 'p', code: 'KeyP' }, { label: 'u', key: 'u', code: 'KeyU' },
    { label: 'r', key: 'r', code: 'KeyR' }, { label: 's', key: 's', code: 'KeyS' },
    { label: 'J', key: 'J', code: 'KeyJ', shift: true },
  ],
  [
    { label: '~', key: '~', code: 'Backquote', shift: true },
    { label: '.', key: '.', code: 'Period' },
    { label: '_', key: '_', code: 'Minus', shift: true },
    { label: '+', key: '+', code: 'Equal', shift: true },
    { label: '-', key: '-', code: 'Minus' },
    { label: '%', key: '%', code: 'Digit5', shift: true },
    { label: 'f', key: 'f', code: 'KeyF' }, { label: 't', key: 't', code: 'KeyT' },
    { label: ';', key: ';', code: 'Semicolon' }, { label: ',', key: ',', code: 'Comma' },
    { label: 'n', key: 'n', code: 'KeyN' },
    { label: 'i', key: 'i', code: 'KeyI' }, { label: 'a', key: 'a', code: 'KeyA' },
    { label: 'o', key: 'o', code: 'KeyO' }, { label: 'v', key: 'v', code: 'KeyV' },
  ],
  [
    { label: 'q', key: 'q', code: 'KeyQ' }, { label: 'z', key: 'z', code: 'KeyZ' },
    { label: 'm', key: 'm', code: 'KeyM' },
    { label: '>', key: '>', code: 'Period', shift: true },
    { label: '<', key: '<', code: 'Comma', shift: true },
    { label: '*', key: '*', code: 'Digit8', shift: true },
    { label: '#', key: '#', code: 'Digit3', shift: true },
    { label: '?', key: '?', code: 'Slash', shift: true },
    { label: '1', key: '1', code: 'Digit1' }, { label: '2', key: '2', code: 'Digit2' },
    { label: '3', key: '3', code: 'Digit3' }, { label: '4', key: '4', code: 'Digit4' },
    { label: '5', key: '5', code: 'Digit5' }, { label: '6', key: '6', code: 'Digit6' },
    { label: '7', key: '7', code: 'Digit7' }, { label: '8', key: '8', code: 'Digit8' },
    { label: '9', key: '9', code: 'Digit9' },
  ],
];

/** Insert/replace mode: a normal small QWERTY, same panel styling. */
const TEXT_ROWS: KeyDef[][] = [
  [
    { label: 'Esc', key: 'Escape', code: 'Escape', mode: true },
    { label: '1', key: '1', code: 'Digit1' }, { label: '2', key: '2', code: 'Digit2' },
    { label: '3', key: '3', code: 'Digit3' }, { label: '4', key: '4', code: 'Digit4' },
    { label: '5', key: '5', code: 'Digit5' }, { label: '6', key: '6', code: 'Digit6' },
    { label: '7', key: '7', code: 'Digit7' }, { label: '8', key: '8', code: 'Digit8' },
    { label: '9', key: '9', code: 'Digit9' }, { label: '0', key: '0', code: 'Digit0' },
    { label: '-', key: '-', code: 'Minus' }, { label: '=', key: '=', code: 'Equal' },
    { label: 'Bksp', key: 'Backspace', code: 'Backspace' },
  ],
  [
    { label: 'q', key: 'q', code: 'KeyQ' }, { label: 'w', key: 'w', code: 'KeyW' },
    { label: 'e', key: 'e', code: 'KeyE' }, { label: 'r', key: 'r', code: 'KeyR' },
    { label: 't', key: 't', code: 'KeyT' }, { label: 'y', key: 'y', code: 'KeyY' },
    { label: 'u', key: 'u', code: 'KeyU' }, { label: 'i', key: 'i', code: 'KeyI' },
    { label: 'o', key: 'o', code: 'KeyO' }, { label: 'p', key: 'p', code: 'KeyP' },
    { label: '[', key: '[', code: 'BracketLeft' }, { label: ']', key: ']', code: 'BracketRight' },
  ],
  [
    { label: 'a', key: 'a', code: 'KeyA' }, { label: 's', key: 's', code: 'KeyS' },
    { label: 'd', key: 'd', code: 'KeyD' }, { label: 'f', key: 'f', code: 'KeyF' },
    { label: 'g', key: 'g', code: 'KeyG' }, { label: 'h', key: 'h', code: 'KeyH' },
    { label: 'j', key: 'j', code: 'KeyJ' }, { label: 'k', key: 'k', code: 'KeyK' },
    { label: 'l', key: 'l', code: 'KeyL' }, { label: ';', key: ';', code: 'Semicolon' },
    { label: "'", key: "'", code: 'Quote' },
    { label: 'Enter', key: 'Enter', code: 'Enter', wide: 1.25 },
  ],
  [
    { label: 'Shift', action: 'shift', mode: true, wide: 1.2 },
    { label: 'z', key: 'z', code: 'KeyZ' }, { label: 'x', key: 'x', code: 'KeyX' },
    { label: 'c', key: 'c', code: 'KeyC' }, { label: 'v', key: 'v', code: 'KeyV' },
    { label: 'b', key: 'b', code: 'KeyB' }, { label: 'n', key: 'n', code: 'KeyN' },
    { label: 'm', key: 'm', code: 'KeyM' }, { label: ',', key: ',', code: 'Comma' },
    { label: '.', key: '.', code: 'Period' }, { label: '/', key: '/', code: 'Slash' },
    { label: 'Space', key: ' ', code: 'Space', wide: 1.6 },
  ],
];

/** Shifted characters on the QWERTY layer. */
const TEXT_SHIFT: Record<string, string> = {
  '1': '!', '2': '@', '3': '#', '4': '$', '5': '%', '6': '^', '7': '&', '8': '*',
  '9': '(', '0': ')', '-': '_', '=': '+', '[': '{', ']': '}', ';': ':', "'": '"',
  ',': '<', '.': '>', '/': '?',
};

const isTouchDevice = (): boolean => window.matchMedia('(pointer: coarse)').matches
  || (navigator.maxTouchPoints ?? 0) > 0;

type Layer = 'vim' | 'text';

/** Dispatch one synthetic key; prompt inputs get editable text directly. */
function sendKey(key: string, code: string, opts: { ctrl?: boolean; shift?: boolean } = {}): void {
  const input = document.querySelector<HTMLInputElement>('.prompt-overlay input.text-input');
  if (input && !opts.ctrl) {
    if (key === 'Enter' || key === 'Escape') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }));
      return;
    }
    if (key === 'Backspace' || key.length === 1) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      if (key === 'Backspace') {
        if (start !== end) input.setRangeText('', start, end, 'end');
        else if (start > 0) input.setRangeText('', start - 1, start, 'end');
      } else {
        input.setRangeText(key, start, end, 'end');
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      return;
    }
  }
  window.dispatchEvent(new KeyboardEvent('keydown', {
    key, code, bubbles: true, cancelable: true,
    ctrlKey: opts.ctrl === true, shiftKey: opts.shift === true,
  }));
  window.dispatchEvent(new KeyboardEvent('keyup', {
    key, code, bubbles: true, cancelable: true,
    ctrlKey: opts.ctrl === true, shiftKey: opts.shift === true,
  }));
}

export function mountMobileControls(): void {
  const force = new URLSearchParams(location.search).has('vk');
  if (!force && !isTouchDevice()) return;
  if (document.querySelector('.mob-dock')) return;

  const storageKey = 'kiritsu.mobileKeysOpen';
  let ctrlArmed = false;
  let shiftArmed = false;
  let layer: Layer = 'vim';
  let insertActive = false;

  const panel = h('div', { class: 'mob-vk', role: 'group', 'aria-label': 'on-screen vim keys' });
  const note = h('span', { class: 'mob-vk-note' }, 'VIM · SHIFT = CAPS');
  const head = h('div', { class: 'mob-vk-head' },
    h('span', { class: 'mob-vk-title' }, 'KIRITSU KEYS'),
    note,
    h('button', { class: 'mob-vk-close', 'aria-label': 'close keys' }, '×'),
  );
  panel.append(head);

  const pressFeedback = (btn: HTMLButtonElement): void => {
    btn.classList.add('down');
    window.setTimeout(() => btn.classList.remove('down'), 110);
  };

  const resetModifiers = (): void => {
    ctrlArmed = false;
    shiftArmed = false;
    document.querySelectorAll('.mob-vk .mob-vk-key.on').forEach((n) => n.classList.remove('on'));
  };

  const activate = (def: KeyDef, btn: HTMLButtonElement): void => {
    pressFeedback(btn);
    if (def.action === 'ctrl') {
      ctrlArmed = !ctrlArmed; btn.classList.toggle('on', ctrlArmed); return;
    }
    if (def.action === 'shift') {
      shiftArmed = !shiftArmed; btn.classList.toggle('on', shiftArmed); return;
    }
    if (def.action === 'close') { setOpen(false); return; }
    if (def.action === 'refresh') { void hardRefresh(); return; }
    if (def.tokens) {
      for (const token of def.tokens) sendKey(token, '', { shift: def.shift || shiftArmed });
      if (shiftArmed) resetModifiers();
      return;
    }
    if (def.key === undefined) return;
    let key = def.key;
    const ctrl = ctrlArmed;
    const shift = def.shift === true || shiftArmed;
    if (shiftArmed && TEXT_SHIFT[key]) key = TEXT_SHIFT[key];
    else if (shiftArmed && /^[a-z]$/.test(key)) key = key.toUpperCase();
    if (ctrlArmed || shiftArmed) resetModifiers();
    sendKey(key, def.code ?? '', { shift, ctrl });
  };

  const bindButton = (def: KeyDef): HTMLButtonElement => {
    const btn = h('button', {
      class: 'mob-vk-key' + (def.mode ? ' mode' : '') + (def.wide ? ' wide' : ''),
      style: def.wide ? { flexGrow: String(def.wide) } : undefined,
      title: def.label,
    }, def.label) as HTMLButtonElement;
    let repeatDelay = 0;
    let repeatEvery = 0;
    const stopRepeat = (): void => {
      window.clearTimeout(repeatDelay); window.clearInterval(repeatEvery);
      repeatDelay = 0; repeatEvery = 0;
    };
    const isRepeatable = def.action === undefined && (def.key !== undefined || def.tokens !== undefined);
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      activate(def, btn);
      if (isRepeatable) {
        repeatDelay = window.setTimeout(() => {
          repeatEvery = window.setInterval(() => activate(def, btn), 105);
        }, 430);
      }
    });
    const end = (e: Event): void => {
      if (e.type === 'pointerup' || e.type === 'pointercancel') {
        try { btn.releasePointerCapture((e as PointerEvent).pointerId); } catch { /* ignore */ }
      }
      stopRepeat();
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('pointerleave', () => stopRepeat());
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return btn;
  };

  const vimLayer = h('div', { class: 'mob-vk-layer on' });
  for (const row of VIM_ROWS) {
    const rowEl = h('div', { class: 'mob-vk-row' });
    for (const def of row) rowEl.append(bindButton(def));
    vimLayer.append(rowEl);
  }
  const textLayer = h('div', { class: 'mob-vk-layer' });
  for (const row of TEXT_ROWS) {
    const rowEl = h('div', { class: 'mob-vk-row' });
    for (const def of row) rowEl.append(bindButton(def));
    textLayer.append(rowEl);
  }
  panel.append(vimLayer, textLayer);

  const setLayer = (next: Layer): void => {
    if (layer === next) return;
    layer = next;
    resetModifiers();
    vimLayer.classList.toggle('on', next === 'vim');
    textLayer.classList.toggle('on', next === 'text');
    note.textContent = next === 'vim' ? 'VIM · SHIFT = CAPS' : 'INSERT · TEXT · shift';
  };

  const dock = h('div', { class: 'mob-dock' },
    h('button', { class: 'mob-icon', 'aria-label': 'on-screen keys', title: 'screen keys' }),
    h('button', { class: 'mob-icon', 'aria-label': 'hard refresh', title: 'hard refresh' }),
  ) as HTMLDivElement;
  const keyToggle = dock.children[0] as HTMLButtonElement;
  const refresh = dock.children[1] as HTMLButtonElement;
  keyToggle.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><rect x="1.2" y="1.2" width="13.6" height="9.6" rx="1.2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3.2 4h1M5.6 4h1M8 4h1M10.4 4h1M12.8 4h.1M3.2 6.2h1M5.6 6.2h1M8 6.2h1M10.4 6.2h1M12.8 6.2h.1M5 8.6h6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>';
  refresh.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.8 6.1A5.2 5.2 0 1 0 13 9.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M12.8 2.6v3.8H9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let open = false;
  const placeDock = (): void => {
    dock.style.bottom = open ? `${panel.offsetHeight + 12}px` : '';
  };
  const setOpen = (next: boolean): void => {
    open = next;
    panel.classList.toggle('open', next);
    keyToggle.classList.toggle('on', next);
    try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* ignore */ }
    placeDock();
  };
  keyToggle.addEventListener('click', () => setOpen(!open));
  refresh.addEventListener('click', () => void hardRefresh());
  panel.querySelector('.mob-vk-close')?.addEventListener('click', () => setOpen(false));

  // Insert/replace mode: same panel, QWERTY layer; Esc brings the Vim layer back.
  window.addEventListener('kiritsu:mode', (ev) => {
    const d = (ev as CustomEvent<{ insert?: boolean; ghosting?: boolean; state?: string }>).detail ?? {};
    const insert = d.insert === true && d.ghosting !== true && d.state === 'playing';
    insertActive = insert;
    setLayer(insert ? 'text' : 'vim');
  });
  // A visible in-app text prompt (settings/import) needs the text layer too.
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof Element && e.target.closest('.text-input')) setLayer('text');
  });
  document.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!document.querySelector('.text-input:focus')) setLayer(insertActive ? 'text' : 'vim');
    }, 0);
  });

  document.body.append(panel, dock);
  document.body.classList.add('mob-ready');
  const stored = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
  setOpen(stored !== '0');
  window.addEventListener('resize', placeDock);
  window.addEventListener('orientationchange', placeDock);
  (window as unknown as { __kiritsuMobile?: { setOpen: (v: boolean) => void; setLayer: (v: Layer) => void } }).__kiritsuMobile = { setOpen, setLayer };
}

/** Unregister the service worker, drop caches, then reload with a fresh URL. */
async function hardRefresh(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch { /* ignore */ }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* ignore */ }
  const url = new URL(location.href);
  url.searchParams.set('r', Date.now().toString(36));
  location.replace(url.href);
}

export const MOBILE_KEY_ROWS = VIM_ROWS;
export const MOBILE_TEXT_ROWS = TEXT_ROWS;
