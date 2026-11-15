/**
 * Dev helper: render the canonical title SVG to a high-res mask PNG used by
 * tools/gen-title-strokes.py (Voronoi segmentation). Not part of the game build.
 *   node tools/render-title-mask.mjs [out.png] [scale]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(root, '..', '.kiritsu-browsers');
const { chromium } = await import('playwright');
const out = process.argv[2] || '/tmp/kiritsu-title-mask.png';
const scale = Number(process.argv[3] || 2);
const svg = readFileSync(resolve(root, 'public/kanji/ou-guilv-tight.svg'), 'utf8')
  .replace(/<svg([^>]*)>/, `<svg$1 width="${600 * scale}" height="${300 * scale}">`)
  .replace(/fill="#f2d8c9"/, 'fill="#ffffff"');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600 * scale, height: 300 * scale } });
await page.setContent(`<!doctype html><html><body style="margin:0;background:#000">${svg}</body></html>`);
await page.waitForTimeout(200);
await page.screenshot({ path: out, omitBackground: false });
await browser.close();
console.log(out);
