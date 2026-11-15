/**
 * Key notation.
 *
 * The engine consumes a stream of *keys*, where a key is either a single
 * character ("a", "3", "✧") or a special token ("<Esc>", "<CR>", "<C-w>").
 * Level solutions are written as readable strings and tokenized here.
 */

export const ESC = '<Esc>';
export const CR = '<CR>';
export const BS = '<BS>';
export const TAB = '<Tab>';
export const SPACE = '<Space>';
export const CTRL_W = '<C-w>';
export const CTRL_R = '<C-r>';
export const CTRL_U = '<C-u>';

const SPECIAL = new Set([
  'Esc', 'CR', 'BS', 'Tab', 'Space', 'NL', 'lt', 'Bar', 'Del', 'Up', 'Down', 'Left', 'Right', 'Home', 'End', 'BS',
]);

/** Tokenize a key string such as "ci\"new<Esc>" or "<C-w>w". */
export function tokenize(keys: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < keys.length) {
    const ch = keys[i];
    if (ch === '<') {
      const close = keys.indexOf('>', i + 1);
      if (close > i + 1) {
        const body = keys.slice(i + 1, close);
        if (SPECIAL.has(body) || /^[CSAM]-[A-Za-z0-9<>-]$/.test(body) || body === 'C-[' || body === 'C-]' || body === 'C-^' || body === 'C-\\') {
          out.push('<' + body + '>');
          i = close + 1;
          continue;
        }
      }
    }
    out.push(ch);
    i++;
  }
  return out;
}

export function isSpecialKey(key: string): boolean {
  return key.length > 1 && key.startsWith('<') && key.endsWith('>');
}

/** Human-readable label for the HUD, e.g. <C-w> -> ^W */
export function keyLabel(key: string): string {
  if (!isSpecialKey(key)) return key === ' ' ? '␣' : key;
  return key.replace(/^<C-(.)>$/, '^$1').replace(/^<(.+)>$/, '⟨$1⟩');
}

/**
 * QWERTY physical position → key character. Vim keys are physical positions,
 * not characters: `h` means "the key left of j", whatever the OS writes there.
 * A Korean IME rewrites those letters (h→ㅗ, j→ㅓ, k→ㅏ, l→ㅣ …), so the game
 * must recover the intended key from `KeyboardEvent.code`, which is immune to
 * IME and layout switching.
 */
export const CODE_TO_KEY: Record<string, string> = {
  KeyA: 'a', KeyB: 'b', KeyC: 'c', KeyD: 'd', KeyE: 'e', KeyF: 'f', KeyG: 'g',
  KeyH: 'h', KeyI: 'i', KeyJ: 'j', KeyK: 'k', KeyL: 'l', KeyM: 'm', KeyN: 'n',
  KeyO: 'o', KeyP: 'p', KeyQ: 'q', KeyR: 'r', KeyS: 's', KeyT: 't', KeyU: 'u',
  KeyV: 'v', KeyW: 'w', KeyX: 'x', KeyY: 'y', KeyZ: 'z',
  Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
  Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
  Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Semicolon: ';', Quote: "'", Backquote: '`', Comma: ',', Period: '.', Slash: '/',
  Space: ' ',
};

const HANGUL_JAMO = /^[\u3131-\u318e]$/;
const HANGUL_SYLLABLE = /^[\uac00-\ud7af]$/;

/** True when a key event should be re-read from the physical position:
 *  Korean jamo/syllables and the IME's composing marker. */
export function needsRemap(key: string): boolean {
  return HANGUL_JAMO.test(key) || HANGUL_SYLLABLE.test(key) || key === 'Process' || key === 'Dead';
}

/** Recover the Vim key from the physical position, falling back to `key`. */
export function physicalKey(key: string, code: string | undefined, shiftKey = false): string {
  if (!code) return key;
  const c = CODE_TO_KEY[code];
  if (c === undefined) return key;
  return shiftKey && /^[a-z]$/.test(c) ? c.toUpperCase() : c;
}

export function normalizeKey(key: string): string {
  switch (key) {
    case 'Escape':
      return ESC;
    case 'Enter':
      return CR;
    case 'Backspace':
      return BS;
    case 'Tab':
      return TAB;
    case ' ':
      return SPACE;
    default:
      return key.length === 1 ? key : key;
  }
}

/** Map a DOM KeyboardEvent to an engine key token (or null if ignored). */
export function fromKeyboardEvent(e: { key: string; code?: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey?: boolean }): string | null {
  if (e.metaKey) return null;
  let k = e.key;
  if (needsRemap(k)) k = physicalKey(k, e.code, e.shiftKey);
  if (e.ctrlKey && !e.altKey) {
    if (k.length === 1 && /[a-zA-Z@\[\\\]^_]/.test(k)) {
      const c = k.toUpperCase();
      if (c === '[') return ESC;
      return `<C-${c.toLowerCase()}>`;
    }
    if (k === '[') return ESC;
    return null;
  }
  if (k === 'Escape') return ESC;
  if (k === 'Enter') return CR;
  if (k === 'Backspace') return BS;
  if (k === 'Tab') return TAB;
  if (k === 'Delete') return '<Del>';
  if (k.length === 1) return k === ' ' ? SPACE : k;
  return null;
}
