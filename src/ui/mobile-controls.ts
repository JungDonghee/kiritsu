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
  /** label shown while the Shift toggle is on (letters auto-uppercase) */
  shiftLabel?: string;
  tokens?: string[];
  action?: 'ctrl' | 'shift' | 'refresh' | 'close';
  wide?: number;
  mode?: boolean;
}

interface ZoneDef { label: string; tone: string; keys: KeyDef[] }
interface RowDef { strip?: boolean; zones: ZoneDef[] }

const k = (label: string, code: string, extra: Partial<KeyDef> = {}): KeyDef => ({ label, key: label, code, ...extra });
const digit = (d: string, sym: string): KeyDef => ({ label: d, key: d, code: `Digit${d === '0' ? 0 : d}`, shiftLabel: sym });

/** Normal/visual layer, arranged by Vim grammar:
 *  SYS | counts | symbols
 *  MOVE (left hand) | EDIT (right hand)
 *  NAV (find/line) | INS (modes/text objects)
 *  Duplicated uppercase letters are gone: Shift is a toggle.
 */
const VIM_ROWS: RowDef[] = [
  {
    strip: true,
    zones: [
      { label: 'SYS', tone: 'sys', keys: [
        { label: 'Esc', key: 'Escape', code: 'Escape', mode: true },
        k(':', 'Semicolon', { shift: true }),
        k('/', 'Slash'),
        k('F1', 'F1'),
        { label: 'Ctrl', action: 'ctrl', mode: true },
        { label: 'Shift', action: 'shift', mode: true },
        { label: 'Bksp', key: 'Backspace', code: 'Backspace' },
        { label: 'Enter', key: 'Enter', code: 'Enter' },
        { label: 'Space', key: ' ', code: 'Space', wide: 1.15 },
      ] },
      { label: 'CNT', tone: 'cnt', keys: [
        digit('1', '!'), digit('2', '@'), digit('3', '#'), digit('4', '$'),
        digit('5', '%'), digit('6', '^'), digit('7', '&'), digit('8', '*'),
        digit('9', '('),
      ] },
      { label: 'SYM', tone: 'sym', keys: [
        { label: '.', key: '.', code: 'Period', shiftLabel: '>' },
        { label: ',', key: ',', code: 'Comma', shiftLabel: '<' },
        { label: '-', key: '-', code: 'Minus', shiftLabel: '_' },
        { label: '=', key: '=', code: 'Equal', shiftLabel: '+' },
        { label: '`', key: '`', code: 'Backquote', shiftLabel: '~' },
      ] },
    ],
  },
  {
    zones: [
      { label: 'MOVE', tone: 'move', keys: [
        k('h', 'KeyH'), k('j', 'KeyJ'), k('k', 'KeyK'), k('l', 'KeyL'),
        k('w', 'KeyW'), k('b', 'KeyB'), k('e', 'KeyE'), k('0', 'Digit0'),
      ] },
      { label: 'EDIT', tone: 'edit', keys: [
        k('d', 'KeyD'), k('c', 'KeyC'), k('y', 'KeyY'), k('x', 'KeyX'),
        k('p', 'KeyP'), k('u', 'KeyU'), k('r', 'KeyR'), k('s', 'KeyS'),
      ] },
    ],
  },
  {
    zones: [
      { label: 'NAV', tone: 'nav', keys: [
        { label: '$', key: '$', code: 'Digit4', shiftLabel: '$' },
        { label: '^', key: '^', code: 'Digit6', shiftLabel: '^' },
        k('g', 'KeyG'), k('f', 'KeyF'), k('t', 'KeyT'),
        { label: ';', key: ';', code: 'Semicolon', shiftLabel: ':' },
        { label: ',', key: ',', code: 'Comma', shiftLabel: '<' },
        { label: '%', key: '%', code: 'Digit5', shiftLabel: '%' },
      ] },
      { label: 'INS', tone: 'ins', keys: [
        k('i', 'KeyI'), k('a', 'KeyA'), k('o', 'KeyO'), k('v', 'KeyV'),
        k('q', 'KeyQ'), k('z', 'KeyZ'), k('m', 'KeyM'), k('n', 'KeyN'),
      ] },
    ],
  },
];

/** INSERT/REPLACE layer: a compact QWERTY, still inside the same panel. */
const TEXT_ROWS: RowDef[] = [
  {
    strip: true,
    zones: [
      { label: 'SYS', tone: 'sys', keys: [
        { label: 'Esc', key: 'Escape', code: 'Escape', mode: true },
        { label: 'Bksp', key: 'Backspace', code: 'Backspace' },
      ] },
      { label: 'CNT', tone: 'cnt', keys: [
        digit('1', '!'), digit('2', '@'), digit('3', '#'), digit('4', '$'),
        digit('5', '%'), digit('6', '^'), digit('7', '&'), digit('8', '*'),
        digit('9', '('), digit('0', ')'),
      ] },
      { label: 'SYM', tone: 'sym', keys: [
        { label: '-', key: '-', code: 'Minus', shiftLabel: '_' },
        { label: '=', key: '=', code: 'Equal', shiftLabel: '+' },
      ] },
    ],
  },
  { zones: [{ label: 'TEXT', tone: 'text', keys: [
    k('q', 'KeyQ'), k('w', 'KeyW'), k('e', 'KeyE'), k('r', 'KeyR'), k('t', 'KeyT'),
    k('y', 'KeyY'), k('u', 'KeyU'), k('i', 'KeyI'), k('o', 'KeyO'), k('p', 'KeyP'),
    { label: '[', key: '[', code: 'BracketLeft', shiftLabel: '{' },
    { label: ']', key: ']', code: 'BracketRight', shiftLabel: '}' },
  ] }] },
  { zones: [{ label: 'TEXT', tone: 'text', keys: [
    k('a', 'KeyA'), k('s', 'KeyS'), k('d', 'KeyD'), k('f', 'KeyF'), k('g', 'KeyG'),
    k('h', 'KeyH'), k('j', 'KeyJ'), k('k', 'KeyK'), k('l', 'KeyL'),
    { label: ';', key: ';', code: 'Semicolon', shiftLabel: ':' },
    { label: "'", key: "'", code: 'Quote', shiftLabel: '"' },
    { label: 'Enter', key: 'Enter', code: 'Enter', wide: 1.2 },
  ] }] },
  { zones: [{ label: 'TEXT', tone: 'text', keys: [
    { label: 'Shift', action: 'shift', mode: true, wide: 1.2 },
    k('z', 'KeyZ'), k('x', 'KeyX'), k('c', 'KeyC'), k('v', 'KeyV'),
    k('b', 'KeyB'), k('n', 'KeyN'), k('m', 'KeyM'),
    { label: ',', key: ',', code: 'Comma', shiftLabel: '<' },
    { label: '.', key: '.', code: 'Period', shiftLabel: '>' },
    { label: '/', key: '/', code: 'Slash', shiftLabel: '?' },
    { label: 'Space', key: ' ', code: 'Space', wide: 1.6 },
  ] }] },
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
  let vimPage: 'move' | 'nav' = (() => {
    try { return localStorage.getItem('kiritsu.mobilePage') === 'nav' ? 'nav' : 'move'; } catch { return 'move'; }
  })();

  const panel = h('div', { class: 'mob-vk', role: 'group', 'aria-label': 'on-screen vim keys' });
  const note = h('span', { class: 'mob-vk-note' }, 'VIM · SHIFT = CAPS');
  const pageMove = h('button', { class: 'mob-page-tab on', type: 'button', title: 'MOVE / EDIT' }, 'MOVE·EDIT');
  const pageNav = h('button', { class: 'mob-page-tab', type: 'button', title: 'NAV / INS' }, 'NAV·INS');
  const pageTabs = h('div', { class: 'mob-page-tabs' }, pageMove, pageNav);
  const sideModeBtn = h('button', { class: 'mob-side-mode', type: 'button', title: 'side layout mode' }, 'ALL');
  const head = h('div', { class: 'mob-vk-head' },
    h('span', { class: 'mob-vk-title' }, 'KIRITSU KEYS'),
    note,
    pageTabs,
    sideModeBtn,
    h('button', { class: 'mob-vk-close', 'aria-label': 'close keys' }, '×'),
  );
  panel.append(head);

  const pressFeedback = (btn: HTMLButtonElement): void => {
    btn.classList.add('down');
    window.setTimeout(() => btn.classList.remove('down'), 110);
  };

  function syncShiftLabels(armed: boolean): void {
    for (const btn of panel.querySelectorAll<HTMLButtonElement>('.mob-vk-key[data-shift-label]')) {
      btn.textContent = armed ? (btn.dataset.shiftLabel ?? btn.dataset.label ?? '') : (btn.dataset.label ?? '');
    }
  }

  const resetModifiers = (): void => {
    if (ctrlArmed || shiftArmed) {
      ctrlArmed = false;
      shiftArmed = false;
      document.querySelectorAll('.mob-vk .mob-vk-key.on').forEach((n) => n.classList.remove('on'));
      syncShiftLabels(false);
    }
  };

  const activate = (def: KeyDef, btn: HTMLButtonElement): void => {
    pressFeedback(btn);
    if (def.action === 'ctrl') {
      ctrlArmed = !ctrlArmed; btn.classList.toggle('on', ctrlArmed); return;
    }
    if (def.action === 'shift') {
      shiftArmed = !shiftArmed;
      btn.classList.toggle('on', shiftArmed);
      syncShiftLabels(shiftArmed);
      return;
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
    const shiftLabel = def.shiftLabel
      ?? (def.key !== undefined && /^[a-z]$/.test(def.key) ? def.key.toUpperCase() : undefined);
    const btn = h('button', {
      class: 'mob-vk-key' + (def.mode ? ' mode' : '') + (def.wide ? ' wide' : ''),
      style: def.wide ? { 'flex-grow': String(def.wide) } : undefined,
      title: def.label,
    }, def.label) as HTMLButtonElement;
    if (shiftLabel) {
      btn.dataset.label = def.label;
      btn.dataset.shiftLabel = shiftLabel;
    }
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

  const buildRows = (rows: RowDef[]): HTMLElement => {
    const layerEl = h('div', { class: 'mob-vk-layer' });
    for (const row of rows) {
      const rowEl = h('div', { class: 'mob-vk-row' + (row.strip ? ' strip' : '') });
      for (const zone of row.zones) {
        const zoneEl = h('div', {
          class: `mob-vk-zone tone-${zone.tone}`,
          style: { 'flex-grow': String(zone.keys.length) },
        });
        zoneEl.append(h('span', { class: 'mob-vk-zone-label' }, zone.label));
        for (const def of zone.keys) zoneEl.append(bindButton(def));
        rowEl.append(zoneEl);
      }
      layerEl.append(rowEl);
    }
    return layerEl;
  };

  const vimLayer = buildRows(VIM_ROWS);
  vimLayer.classList.add('vim-layer', 'on');
  const textLayer = buildRows(TEXT_ROWS);
  textLayer.classList.add('text-layer');
  panel.append(vimLayer, textLayer);

  // Focus mode keeps the rail's geometry but shows one large zone at a time.
  // Focus pages are semantic groups, not the physical all-mode zones.
  const keyByLabel = new Map<string, KeyDef>();
  for (const row of VIM_ROWS) for (const zone of row.zones) for (const def of zone.keys) keyByLabel.set(def.label, def);
  keyByLabel.set('*', { label: '*', key: '*', code: 'Digit8', shift: true });
  keyByLabel.set('#', { label: '#', key: '#', code: 'Digit3', shift: true });
  const FOCUS_PAGES: { id: string; label: string; cols: number; labels: string[] }[] = [
    { id: 'move', label: 'MOVE', cols: 3, labels: ['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '*', '#'] },
    { id: 'edit', label: 'EDIT', cols: 3, labels: ['d', 'c', 'y', 'x', 'p', 'u', 'r', 's'] },
    { id: 'nav', label: 'NAV', cols: 3, labels: ['g', 'f', 't', ';', ',', '%', 'n'] },
    { id: 'ins', label: 'INS', cols: 3, labels: ['i', 'a', 'o', 'v', 'q', 'z', 'm', 'n'] },
    { id: 'cnt', label: 'CNT', cols: 3, labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    { id: 'sym', label: 'SYM', cols: 2, labels: ['.', ',', '-', '=', '`'] },
  ];
  const focusPages = h('div', { class: 'mob-focus-pages' });
  const focusPageEls = new Map<string, HTMLElement>();
  for (const page of FOCUS_PAGES) {
    const el = h('div', { class: `mob-focus-page cols-${page.cols}` });
    for (const label of page.labels) {
      const def = keyByLabel.get(label);
      if (def) el.append(bindButton(def));
    }
    focusPageEls.set(page.id, el);
    focusPages.append(el);
  }
  const focusTabs = h('div', { class: 'mob-focus-tabs' });
  const focusButtons = new Map<string, HTMLButtonElement>();
  for (const page of FOCUS_PAGES) {
    const b = h('button', { class: 'mob-focus-tab', type: 'button', title: page.label }, page.label) as HTMLButtonElement;
    b.addEventListener('click', () => { focusZone = page.id; storeSide(); applySideMode(); });
    focusButtons.set(page.id, b);
    focusTabs.append(b);
  }
  const focusPrev = h('button', { class: 'mob-focus-arrow', type: 'button', 'aria-label': 'previous zone' }, '‹') as HTMLButtonElement;
  const focusNext = h('button', { class: 'mob-focus-arrow', type: 'button', 'aria-label': 'next zone' }, '›') as HTMLButtonElement;
  const focusBar = h('div', { class: 'mob-focus-bar' }, focusPrev, focusTabs, focusNext);
  const focusFooter = h('div', { class: 'mob-focus-footer' });
  for (const label of ['Esc', 'Shift', 'Ctrl', 'Bksp', 'Enter', 'Space', ':', '/', 'F1']) {
    const def = keyByLabel.get(label);
    if (def) focusFooter.append(bindButton(def));
  }
  panel.append(focusPages, focusBar, focusFooter);

  let sideMode: 'all' | 'focus' = (() => {
    try { return localStorage.getItem('kiritsu.sideMode') === 'focus' ? 'focus' : 'all'; } catch { return 'all'; }
  })();
  let focusZone = (() => {
    try {
      const z = localStorage.getItem('kiritsu.sideFocus');
      return z && FOCUS_PAGES.some((p) => p.id === z) ? z : 'move';
    } catch { return 'move'; }
  })();
  const storeSide = (): void => {
    try {
      localStorage.setItem('kiritsu.sideMode', sideMode);
      localStorage.setItem('kiritsu.sideFocus', focusZone);
    } catch { /* ignore */ }
  };
  const cycleFocus = (dir: number): void => {
    const idx = FOCUS_PAGES.findIndex((p) => p.id === focusZone);
    focusZone = FOCUS_PAGES[(idx + dir + FOCUS_PAGES.length) % FOCUS_PAGES.length]!.id;
    storeSide();
    applySideMode();
  };
  focusPrev.addEventListener('click', () => cycleFocus(-1));
  focusNext.addEventListener('click', () => cycleFocus(1));
  sideModeBtn.addEventListener('click', () => {
    sideMode = sideMode === 'all' ? 'focus' : 'all';
    storeSide();
    applySideMode();
  });

  function applyVimPage(): void {
    panel.classList.toggle('page-nav', vimPage === 'nav');
    pageMove.classList.toggle('on', vimPage === 'move');
    pageNav.classList.toggle('on', vimPage === 'nav');
  }
  pageMove.addEventListener('click', () => {
    vimPage = 'move';
    try { localStorage.setItem('kiritsu.mobilePage', 'move'); } catch { /* ignore */ }
    applyVimPage();
  });
  pageNav.addEventListener('click', () => {
    vimPage = 'nav';
    try { localStorage.setItem('kiritsu.mobilePage', 'nav'); } catch { /* ignore */ }
    applyVimPage();
  });
  applyVimPage();

  const applySideMode = (): void => {
    const focus = isSide() && sideMode === 'focus';
    panel.classList.toggle('focus', focus);
    panel.dataset.focus = focusZone;
    sideModeBtn.textContent = sideMode === 'focus' ? 'FOCUS' : 'ALL';
    sideModeBtn.title = sideMode === 'focus' ? 'show all side keys' : 'focus one zone at a time';
    for (const page of FOCUS_PAGES) {
      focusButtons.get(page.id)?.classList.toggle('on', page.id === focusZone);
      focusPageEls.get(page.id)?.classList.toggle('on', page.id === focusZone);
    }
  };

  const setLayer = (next: Layer): void => {
    if (layer === next) return;
    layer = next;
    resetModifiers();
    vimLayer.classList.toggle('on', next === 'vim');
    textLayer.classList.toggle('on', next === 'text');
    note.textContent = next === 'vim' ? 'VIM · SHIFT = CAPS' : 'INSERT · TEXT · shift';
    applyLayout();
  };

  const dock = h('div', { class: 'mob-dock' },
    h('button', { class: 'mob-icon', 'aria-label': 'on-screen keys', title: 'screen keys' }),
    h('button', { class: 'mob-icon', 'aria-label': 'keyboard layout', title: 'edge clusters' }),
    h('button', { class: 'mob-icon', 'aria-label': 'hard refresh', title: 'hard refresh' }),
  ) as HTMLDivElement;
  const keyToggle = dock.children[0] as HTMLButtonElement;
  const layoutBtn = dock.children[1] as HTMLButtonElement;
  const refresh = dock.children[2] as HTMLButtonElement;
  keyToggle.innerHTML = '<svg viewBox="0 0 16 12" aria-hidden="true"><rect x="1.2" y="1.2" width="13.6" height="9.6" rx="1.2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3.2 4h1M5.6 4h1M8 4h1M10.4 4h1M12.8 4h.1M3.2 6.2h1M5.6 6.2h1M8 6.2h1M10.4 6.2h1M12.8 6.2h.1M5 8.6h6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>';
  layoutBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
  refresh.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.8 6.1A5.2 5.2 0 1 0 13 9.6" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M12.8 2.6v3.8H9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let open = false;
  let layout: 'minimal' | 'side' | 'edge' | 'bar' = (() => {
    try {
      const saved = localStorage.getItem('kiritsu.mobileLayout.v2');
      return saved === 'minimal' || saved === 'edge' || saved === 'bar' ? saved : 'side';
    } catch { return 'minimal'; }
  })();
  const isEdge = (): boolean => layout === 'edge' && layer === 'vim' && open;
  const isMinimal = (): boolean => layout === 'minimal' && layer === 'vim' && open;
  const isSide = (): boolean => layout === 'side' && layer === 'vim' && open;
  const placeDock = (): void => {
    const floating = !open || isEdge();
    if (!floating) {
      dock.style.right = '';
      dock.style.left = '';
      dock.style.transform = '';
      dock.style.bottom = '';
      return;
    }
    if (isEdge()) {
      dock.style.right = 'auto';
      dock.style.left = '50%';
      dock.style.transform = 'translateX(-50%)';
      dock.style.bottom = 'calc(40px + env(safe-area-inset-bottom))';
    } else {
      dock.style.right = '';
      dock.style.left = '';
      dock.style.transform = '';
      dock.style.bottom = '';
    }
  };
  const syncViewport = (): void => {
    const rootEl = document.documentElement;
    rootEl.style.removeProperty('--mob-kb-h');
    rootEl.style.removeProperty('--mob-kb-top');
    rootEl.style.removeProperty('--mob-kb-bottom');
    rootEl.style.removeProperty('--mob-kb-right');
    document.body.classList.remove('mob-kb-open', 'mob-kb-edge', 'mob-kb-side');
    if (!open) return;
    if (layout === 'edge' && layer === 'vim') {
      const vim = panel.querySelector('.vim-layer');
      const top = vim?.querySelector<HTMLElement>('.tone-sys')?.getBoundingClientRect();
      const bottom = vim?.querySelector<HTMLElement>('.tone-cnt')?.getBoundingClientRect();
      const topInset = top ? Math.ceil(top.bottom + 2) : 0;
      const bottomInset = bottom ? Math.ceil(window.innerHeight - bottom.top + 2) : 0;
      rootEl.style.setProperty('--mob-kb-top', `${topInset}px`);
      rootEl.style.setProperty('--mob-kb-bottom', `${bottomInset}px`);
      document.body.classList.add('mob-kb-open', 'mob-kb-edge');
    } else if (isSide()) {
      rootEl.style.setProperty('--mob-kb-right', `${Math.ceil(panel.getBoundingClientRect().width) + 4}px`);
      document.body.classList.add('mob-kb-open', 'mob-kb-side');
    } else {
      rootEl.style.setProperty('--mob-kb-h', `${Math.ceil(panel.offsetHeight) + 2}px`);
      document.body.classList.add('mob-kb-open');
    }
  };
  const applyLayout = (): void => {
    const edge = isEdge();
    panel.classList.toggle('edge', edge);
    panel.classList.toggle('minimal', isMinimal());
    panel.classList.toggle('side', isSide());
    layoutBtn.classList.toggle('on', layout !== 'minimal');
    layoutBtn.title = layout === 'side' ? 'edge clusters' : layout === 'edge' ? 'docked bar' : layout === 'bar' ? 'minimal split pad' : 'side rail';
    const floating = !open || edge;
    if (floating) {
      if (dock.parentElement !== document.body) document.body.append(dock);
      dock.classList.add('floating');
    } else {
      const closeBtn = head.querySelector('.mob-vk-close');
      if (dock.parentElement !== head) head.insertBefore(dock, closeBtn);
      dock.classList.remove('floating');
    }
    applySideMode();
    placeDock();
    syncViewport();
  };
  const setOpen = (next: boolean): void => {
    open = next;
    panel.classList.toggle('open', next);
    keyToggle.classList.toggle('on', next);
    try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch { /* ignore */ }
    applyLayout();
  };
  keyToggle.addEventListener('click', () => setOpen(!open));
  layoutBtn.addEventListener('click', () => {
    layout = layout === 'side' ? 'edge' : layout === 'edge' ? 'bar' : layout === 'bar' ? 'minimal' : 'side';
    try { localStorage.setItem('kiritsu.mobileLayout.v2', layout); } catch { /* ignore */ }
    applyLayout();
  });
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

  let swipeX = 0;
  let swipeY = 0;
  head.addEventListener('pointerdown', (e) => {
    if (!isMinimal()) return;
    if ((e.target as Element).closest('.mob-page-tab, .mob-vk-close')) return;
    swipeX = e.clientX; swipeY = e.clientY;
  }, true);
  head.addEventListener('pointerup', (e) => {
    if (!isMinimal()) return;
    const dx = e.clientX - swipeX;
    const dy = e.clientY - swipeY;
    if (Math.abs(dx) < 34 || Math.abs(dy) > 24) return;
    vimPage = dx < 0 ? 'nav' : 'move';
    try { localStorage.setItem('kiritsu.mobilePage', vimPage); } catch { /* ignore */ }
    applyVimPage();
  }, true);

  document.body.append(panel, dock);
  document.body.classList.add('mob-ready');
  const stored = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
  setOpen(stored !== '0');
  applyLayout();
  window.addEventListener('resize', () => { placeDock(); syncViewport(); });
  window.addEventListener('orientationchange', () => { placeDock(); syncViewport(); });
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
