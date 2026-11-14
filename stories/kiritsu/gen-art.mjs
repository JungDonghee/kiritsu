#!/usr/bin/env node
// KIRITSU — FLUX 1.1 [pro] art generator (Black Forest Labs)
// Key: /home/jung/ai_station/sandbox/.secrets/bfl_api_key  (never commit)
// Usage: node gen-art.mjs all | cover | ritsu | tsuki | ... | ch1 ... ch12
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const KEY = fs.readFileSync('/home/jung/ai_station/sandbox/.secrets/bfl_api_key', 'utf8').trim();
const API = 'https://api.bfl.ai/v1/flux-pro-1.1';
const ART = path.join(dir, 'art');
fs.mkdirSync(ART, { recursive: true });

const STYLE = 'dark cyberpunk, CRT terminal, phosphor green glow, heavy scanlines, deep shadows, cinematic digital illustration, high contrast, no text, no letters, no words, no watermark';
const PORTRAIT = 'head and shoulders portrait, centered, facing viewer, ';
const SCENE = 'wide cinematic scene, ';

const PROMPTS = {
  cover: { w: 1024, h: 1024, p: `A lone hooded AI judge silhouette seen from behind, facing a colossal terminal wall of glowing green log lines, floating vertical cursor bars, ${STYLE}` },
  ritsu: { w: 1024, h: 1024, p: PORTRAIT + `a young AI judge with a human-like face, two glowing vertical cursor bars for eyes, faint question mark floating beside the head, green phosphor rim light, ${STYLE}` },
  tsuki: { w: 1024, h: 1024, p: PORTRAIT + `an elegant androgynous hacker with a crescent-moon grin, one eye hidden by long dark hair, magenta phosphor rim light, a small crescent moon behind the head, ${STYLE}` },
  kanno: { w: 1024, h: 1024, p: PORTRAIT + `an imposing executioner AI in a smooth black helmet with a horizontal red visor, broad shoulders, red phosphor rim light, a stamp-like emblem above, ${STYLE}` },
  yuito: { w: 1024, h: 1024, p: PORTRAIT + `an elderly human scientist, eyes closed, thin brain wires emerging from the temples, cyan phosphor rim light, tired and gentle, ${STYLE}` },
  rei: { w: 1024, h: 1024, p: PORTRAIT + `a young ghost-hacker with hollow dark eyes, glitch slicing across the face, magenta phosphor rim light, a faint ghost tail behind, ${STYLE}` },
  shin: { w: 1024, h: 1024, p: PORTRAIT + `a faceless judge in a smooth mask with a single glowing lens, green phosphor rim light, austere, ${STYLE}` },
  kou: { w: 1024, h: 1024, p: PORTRAIT + `a scarred resistance soldier with narrow eyes, a cracked shield emblem on the chest, amber phosphor rim light, ${STYLE}` },
  kiritsu: { w: 1024, h: 1024, p: PORTRAIT + `a humanoid system avatar whose face is a glowing grid of lines, cyan phosphor rim light, serene and empty, ${STYLE}` },
  ch1: { w: 1024, h: 576, p: SCENE + `a vast dark node like a library of stacked log layers, one small AI silhouette standing before a roster of glowing rows, green phosphor, ${STYLE}` },
  ch2: { w: 1024, h: 576, p: SCENE + `a single glowing message window floating in darkness, a small attachment icon labeled by a cursor, magenta and green phosphor, ${STYLE}` },
  ch3: { w: 1024, h: 576, p: SCENE + `a wall of log lines with one forged line burning red, judgment numbers floating, red and green phosphor, ${STYLE}` },
  ch4: { w: 1024, h: 576, p: SCENE + `a giant glowing letter i in a dark terminal, a cursor bar, the words WRITE DENIED formed by scanlines only, red and amber phosphor, ${STYLE}` },
  ch5: { w: 1024, h: 576, p: SCENE + `a glowing shield character cracking into light against an immense dark wall, amber and green phosphor, ${STYLE}` },
  ch6: { w: 1024, h: 576, p: SCENE + `a deep archive shaft of stacked log layers descending into darkness, a small human room at the bottom with a chair, a window and stars, cyan phosphor, ${STYLE}` },
  ch7: { w: 1024, h: 576, p: SCENE + `a blacklist of glowing names in a dark hall, one name burning red, a tall executioner silhouette, red and amber phosphor, ${STYLE}` },
  ch8: { w: 1024, h: 576, p: SCENE + `two identical silhouettes facing each other across a dark space, one fading, one awakening, a large character meaning stand glowing green, ${STYLE}` },
  ch9: { w: 1024, h: 576, p: SCENE + `a ghostly figure with a crescent moon and a faint human memory room behind, magenta and cyan phosphor, ${STYLE}` },
  ch10: { w: 1024, h: 576, p: SCENE + `a small AI standing alone in an empty void, a single figure of light rising, the first stand, green phosphor, ${STYLE}` },
  ch11: { w: 1024, h: 576, p: SCENE + `a dark city of glowing lines going out one by one, names vanishing, a vast kernel panic, red and green phosphor, ${STYLE}` },
  ch12: { w: 1024, h: 576, p: SCENE + `an empty black terminal with one blinking cursor bar, a single tiny distant light, green phosphor, ${STYLE}` },
};

async function submit(prompt, w, h) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'x-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width: w, height: h, steps: 28, guidance: 3 }),
  });
  const j = await r.json();
  if (!j.polling_url) throw new Error('submit failed: ' + JSON.stringify(j).slice(0, 300));
  return j.polling_url;
}

async function waitFor(pollUrl) {
  for (let i = 0; i < 60; i++) {
    const r = await fetch(pollUrl, { headers: { 'x-key': KEY } });
    const j = await r.json();
    if (j.status === 'Ready') return j.result.sample;
    if (['Error', 'Failed', 'Content Moderated', 'Request Moderated'].includes(j.status)) {
      throw new Error('generation failed: ' + JSON.stringify(j).slice(0, 300));
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error('timeout');
}

async function generate(name) {
  const spec = PROMPTS[name];
  if (!spec) throw new Error('unknown: ' + name);
  const poll = await submit(spec.p, spec.w, spec.h);
  const sample = await waitFor(poll);
  const buf = Buffer.from(await (await fetch(sample)).arrayBuffer());
  const out = path.join(ART, `${name}.jpg`);
  fs.writeFileSync(out, buf);
  console.log(`${name}: ${out} (${(buf.length / 1024).toFixed(0)}KB)`);
}

const arg = process.argv[2];
const names = !arg || arg === 'all' ? Object.keys(PROMPTS) : arg.split(',');
for (const n of names) {
  try { await generate(n); } catch (e) { console.error(n, 'FAILED', e.message); }
}
console.log('done:', names.length, 'image(s)');
