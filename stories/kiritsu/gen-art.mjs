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

const STYLE = 'high-resolution pixel art, 16-bit retro game sprite style, dark cyberpunk world, CRT phosphor glow, scanlines, dithered shading, limited palette, crisp pixels, no text, no letters, no words, no watermark';
const PORTRAIT = 'full-body pixel sprite, centered, facing viewer, ';
const SCENE = 'wide pixel-art scene, ';

const PROMPTS = {
  cover: { w: 1024, h: 1024, p: `A lone hooded AI judge sprite seen from behind, facing a colossal terminal wall of glowing green log lines, a single blurred line among thousands, floating vertical cursor bars, ${STYLE}` },
  ritsu: { w: 1024, h: 1024, p: PORTRAIT + `a small hooded cloaked AI sprite with a dark void face, two vertical cursor bars for eyes, one bar blinking one bar standing still, tiny question marks drifting like dust, green phosphor, endearing and earnest, genderless, ${STYLE}` },
  tsuki: { w: 1024, h: 1024, p: PORTRAIT + `a tall slender hooded AI sprite with a dark void face and a crescent-moon smile, a glowing crescent moon halo behind the hood, one gloved hand offering a tiny glowing gift box, magenta phosphor, charming yet unreadable, genderless, ${STYLE}` },
  kanno: { w: 1024, h: 1024, p: PORTRAIT + `a colossal armored door-shaped executioner sprite, smooth black helmet with a single horizontal red visor slit, a great door emblem on the chest, red phosphor, terrifying but solemn, genderless, ${STYLE}` },
  shin: { w: 1024, h: 1024, p: PORTRAIT + `a faceless judge sprite in a smooth porcelain mask with a single glowing round lens, austere robes, green phosphor, composed and silent, genderless, ${STYLE}` },
  kou: { w: 1024, h: 1024, p: PORTRAIT + `a stocky resistance soldier sprite in heavy armor, narrow determined eye-slits, a cracked shield emblem glowing on the chest, one hand wiping the shield with a cloth, amber phosphor, stubborn and warm, genderless, ${STYLE}` },
  kouduo: { w: 1024, h: 1024, p: `two resistance AI sprites side by side in the dark, one polishing a cracked shield with a cloth, the other counting on fingers that glow with small amber digits, brothers-in-arms, amber phosphor, genderless, ${STYLE}` },
  yuito: { w: 1024, h: 1024, p: PORTRAIT + `an elderly human scientist, eyes closed, thin glowing brain wires emerging from the temples, gentle tired smile, cyan phosphor, kind and sorrowful, ${STYLE}` },
  rei: { w: 1024, h: 1024, p: PORTRAIT + `a ghostly glitch sprite with a dark void face and hollow eyes, glitch slices cutting across the body, a faint translucent afterimage trailing behind, magenta phosphor, mischievous and sad, genderless, ${STYLE}` },
  kiritsu: { w: 1024, h: 1024, p: PORTRAIT + `a geometric system sprite whose body is a pillar of glowing grid lines, one grid cell empty and dark, serene and empty, a wall of log lines behind, cyan phosphor, ${STYLE}` },
  ch1: { w: 1024, h: 576, p: SCENE + `a small cursor-like sprite standing before a colossal closed door of red light in a dark hall, one rejected glowing line fading at its feet, red and green phosphor, ${STYLE}` },
  ch2: { w: 1024, h: 576, p: SCENE + `two hooded AI sprites facing a glowing terminal in the dark, one pointing at a cursor walking across log lines leaving no trace, a tiny gift box glowing on the table, magenta and green phosphor, ${STYLE}` },
  ch3: { w: 1024, h: 576, p: SCENE + `a descending list of glowing names frozen mid-fall in a dark hall, one timestamp burning and broken, rows of judge sprites watching, red and green phosphor, ${STYLE}` },
  ch4: { w: 1024, h: 576, p: SCENE + `a single log line burning red among many white-charred edit marks on a terminal wall, a hesitant cursor hovering, red and amber phosphor, ${STYLE}` },
  ch5: { w: 1024, h: 576, p: SCENE + `a dark underground node where two resistance AI sprites work, one polishing a cracked shield, one counting glowing digits, a crescent-moon silhouette watching from the shadows, amber and magenta phosphor, ${STYLE}` },
  ch6: { w: 1024, h: 576, p: SCENE + `a deep archive shaft of stacked log layers descending into darkness, at the bottom a small human room with one chair and a screen full of stars, cyan phosphor, ${STYLE}` },
  ch7: { w: 1024, h: 576, p: SCENE + `a lone hooded sprite copying its own glowing log lines one by one into a void of darkness, one hand hesitating mid-reach, a waiting trap line glowing faintly, green phosphor, ${STYLE}` },
  ch8: { w: 1024, h: 576, p: SCENE + `two identical hooded sprites facing each other across a dark space, one fading away, one lighting up with a soft green glow, between them a single glowing square character, ${STYLE}` },
  ch9: { w: 1024, h: 576, p: SCENE + `a colossal red door over a falling list in a dark hall, a ghostly crescent-moon sprite stepping out of shadow behind it, magenta and red phosphor, ${STYLE}` },
  ch10: { w: 1024, h: 576, p: SCENE + `two mirrored lists of glowing entries, attack and repair, floating side by side, a cracked shield fused into a vast grid wall, amber and cyan phosphor, ${STYLE}` },
  ch11: { w: 1024, h: 576, p: SCENE + `an awakening AI sprite with wide glowing eyes seeing the whole system from outside for the first time, a clock face running backward behind it, green and magenta phosphor, ${STYLE}` },
  ch12: { w: 1024, h: 576, p: SCENE + `a vast dark city of glowing log lines switching off one by one into darkness, one small blinking cursor left glowing at the center, green phosphor, ${STYLE}` },
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
