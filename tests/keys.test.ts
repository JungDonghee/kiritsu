import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromKeyboardEvent, needsRemap, physicalKey, CODE_TO_KEY } from '../src/core/vim/keys.ts';

// ---------------------------------------------------------------------------
// Physical-key input: Vim keys are positions, not characters. A Korean IME
// rewrites h→ㅗ, j→ㅓ, k→ㅏ, l→ㅣ … — the game must recover the intended key
// from KeyboardEvent.code so it is playable without switching input methods.
// ---------------------------------------------------------------------------

test('Korean IME jamo are remapped to the physical Vim key', () => {
  // 두벌식 layout: ㅗ=h, ㅓ=j, ㅏ=k, ㅣ=l, ㅁ=a, ㅇ=d, ㅎ=g, ㅂ=q
  assert.equal(physicalKey('ㅗ', 'KeyH'), 'h');
  assert.equal(physicalKey('ㅓ', 'KeyJ'), 'j');
  assert.equal(physicalKey('ㅏ', 'KeyK'), 'k');
  assert.equal(physicalKey('ㅣ', 'KeyL'), 'l');
  assert.equal(physicalKey('ㅁ', 'KeyA'), 'a');
  assert.equal(physicalKey('ㅇ', 'KeyD'), 'd');
  assert.equal(physicalKey('ㅎ', 'KeyG'), 'g');
  assert.equal(physicalKey('ㅂ', 'KeyQ'), 'q');
  // Composed syllables resolve through the physical position too.
  assert.equal(physicalKey('가', 'KeyR'), 'r');
  assert.equal(physicalKey('나', 'KeyS'), 's');
  // Shift only lifts plain letters; punctuation stays positional.
  assert.equal(physicalKey('ㅗ', 'KeyH', true), 'H');
  assert.equal(physicalKey('ㅓ', 'KeyJ', true), 'J');
  assert.equal(physicalKey('1', 'Digit1', true), '1');
});

test('needsRemap flags IME input but never latin keys', () => {
  assert.ok(needsRemap('ㅗ'));
  assert.ok(needsRemap('가'));
  assert.ok(needsRemap('Process'));
  assert.ok(!needsRemap('h'));
  assert.ok(!needsRemap('x'));
  assert.ok(!needsRemap('$'));
  assert.ok(!needsRemap('5'));
  assert.ok(!needsRemap('Escape'));
});

test('fromKeyboardEvent feeds the physical key under a Korean IME', () => {
  const ev = (key: string, code: string, extra: Partial<{ ctrlKey: boolean; shiftKey: boolean; metaKey: boolean; altKey: boolean }> = {}) =>
    ({ key, code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...extra });
  assert.equal(fromKeyboardEvent(ev('ㅗ', 'KeyH')), 'h');
  assert.equal(fromKeyboardEvent(ev('ㅓ', 'KeyJ')), 'j');
  assert.equal(fromKeyboardEvent(ev('ㅏ', 'KeyK')), 'k');
  assert.equal(fromKeyboardEvent(ev('ㅣ', 'KeyL')), 'l');
  assert.equal(fromKeyboardEvent(ev('ㅗ', 'KeyH', { shiftKey: true })), 'H');
  // Ctrl-chords still work through the remap (ㅎ on G with ctrl = <C-g>).
  assert.equal(fromKeyboardEvent(ev('ㅎ', 'KeyG', { ctrlKey: true })), '<C-g>');
  // English input is untouched.
  assert.equal(fromKeyboardEvent(ev('h', 'KeyH')), 'h');
  assert.equal(fromKeyboardEvent(ev('x', 'KeyX')), 'x');
  // Digits and punctuation resolve by position as well.
  assert.equal(fromKeyboardEvent(ev('5', 'Digit5')), '5');
  assert.equal(fromKeyboardEvent(ev(';', 'Semicolon')), ';');
});

test('CODE_TO_KEY covers the full qwerty letter/digit/punct surface', () => {
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(97 + i);
    assert.equal(CODE_TO_KEY[`Key${letter.toUpperCase()}`], letter);
  }
  for (let i = 0; i < 10; i++) assert.equal(CODE_TO_KEY[`Digit${i}`], String(i));
  for (const [code, ch] of Object.entries({ Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Backquote: '`', Comma: ',', Period: '.', Slash: '/', Space: ' ' })) {
    assert.equal(CODE_TO_KEY[code], ch);
  }
});
