import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSave, encodeSave, sanitizeProgress } from '../src/core/game/stats.ts';
import { emptyProgress } from '../src/core/game/types.ts';

test('sanitizeProgress repairs corrupt saves instead of crashing', () => {
  const p = sanitizeProgress({ stages: {}, stats: null, profile: null, activity: null, lineNumbers: 'weird' });
  assert.equal(p.version, 2);
  assert.deepEqual(p.stats, {});
  assert.equal(p.profile.name, 'operator');
  assert.deepEqual(p.activity, {});
  assert.equal(p.lineNumbers, 'rel');
});

test('sanitizeProgress keeps valid fields and clamps bad values', () => {
  const p = sanitizeProgress({
    version: 2,
    currentChapter: 3,
    totalKeys: 120,
    lang: 'ko',
    lineNumbers: 'abs',
    profile: { name: 'rin', since: 123 },
    stages: { c01s1: { cleared: true, bestKeys: 9, stars: 3 }, bad: null },
    stats: { hjkl: { attempts: 2, clears: 1, restarts: 0, keys: 12, par: 9 } },
    saved: [{ seed: 7, skill: 'delete-word', at: 1 }, { weird: true }],
    activity: { '2026-11-15': 4, bad: -2 },
    trialsCleared: 5,
  });
  assert.equal(p.currentChapter, 3);
  assert.equal(p.lang, 'ko');
  assert.equal(p.lineNumbers, 'abs');
  assert.equal(p.stages['c01s1']?.stars, 3);
  assert.equal(p.stats['hjkl']?.par, 9);
  assert.equal(p.saved.length, 1);
  assert.equal(p.activity['2026-11-15'], 4);
  assert.equal(p.activity['bad'], undefined);
});

test('decodeSave rejects garbage but sanitizes a decodable object', () => {
  assert.equal(decodeSave('%%%not-base64%%%'), null);
  const code = btoa(JSON.stringify({ stages: {}, stats: null, profile: null }));
  const p = decodeSave(code);
  assert.ok(p);
  assert.deepEqual(p?.stats, {});
});

test('encodeSave/decodeSave roundtrip keeps progress', () => {
  const p = emptyProgress();
  p.totalKeys = 42;
  p.stages['c01s1'] = { cleared: true, bestKeys: 9, stars: 3 };
  const back = decodeSave(encodeSave(p));
  assert.equal(back?.totalKeys, 42);
  assert.equal(back?.stages['c01s1']?.stars, 3);
});
