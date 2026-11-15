/**
 * 타이틀 한자 인트로 회귀 검사 (local-only, v3 리본 리빌).
 *   npm run build
 *   node tools/title-check.mjs
 *
 * 검증: 20획 리본 · 정확한 완료 상태(data-state=done) · clip 제거 · 레이저/팁 제거 ·
 * 캡션 노출 · 콘솔 에러 0 · reduced-motion 즉시 완료 · Esc 내비게이션 · FPS≥18.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const browserRoot = resolve(root, '..', '.kiritsu-browsers');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= browserRoot;

if (!existsSync(dist)) {
  console.error('dist/ missing: run npm run build first');
  process.exit(2);
}
const { chromium } = await import('playwright');

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = join(dist, url === '/' ? 'index.html' : url);
  if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });

// 1) 구조
await page.waitForSelector('.kt-ink-write svg', { timeout: 6000 });
const strokes = await page.$$eval('.kts-rib', (els) => els.length);
const dataStrokes = await page.$eval('.kts-svg', (el) => Number(el.getAttribute('data-strokes')));

// 2) 인트로 FPS 측정 (쓰기 구간)
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const loop = (now) => {
    frames++;
    if (now - t0 >= 4200) { resolve((frames * 1000) / (now - t0)); return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}));

// 3) 완료 대기 (v3는 data-state=done)
const t0 = Date.now();
const doneOk = await page.waitForFunction(
  () => document.querySelector('.kt-ink-write')?.getAttribute('data-state') === 'done',
  { timeout: 12000 },
).then(() => true).catch(() => false);
const doneMs = Date.now() - t0;
await page.waitForTimeout(2400); // 캡션/프레스 등장 대기
const after = await page.evaluate(() => {
  const w = document.querySelector('.kt-ink-write');
  const g = document.querySelector('.kts-ink');
  const tip = document.querySelector('.kts-tip');
  const head = document.querySelector('.kt-laser-head');
  const op = (sel) => {
    const el = document.querySelector(sel);
    return el ? parseFloat(getComputedStyle(el).opacity) : 0;
  };
  return {
    state: w?.getAttribute('data-state'),
    clipRemoved: !g?.getAttribute('clip-path'),
    tipEmpty: !tip?.getAttribute('d'),
    headHidden: !head || parseFloat(getComputedStyle(head).opacity) < 0.05,
    cap: op('.kt-caption') > 0.9,
    tag: op('.kt-tag') > 0.9,
    press: op('.kt-press') > 0.05, // kt-blink 저점(0.1)에서도 통과
    clipVar: getComputedStyle(document.querySelector('.kt-screen')).getPropertyValue('--kt-end').trim(),
  };
});
console.log('strokes:', strokes, '| data-strokes:', dataStrokes, '| intro fps:', fps.toFixed(0), '| done ms:', doneMs);
console.log('after:', JSON.stringify(after));

// 4) Esc 내비게이션: Enter→지도, Esc→타이틀, 재입력 Esc 튕김 없음
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const onMap = (await page.$$('.map')).length > 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const backOnTitle = (await page.$$('.title-screen')).length > 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const stillOnTitle = (await page.$$('.title-screen')).length > 0 && (await page.$$('.map')).length === 0;
console.log('esc nav:', JSON.stringify({ onMap, backOnTitle, stillOnTitle }));

// 5) reduced-motion: 즉시 완료
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.kt-ink-write', { timeout: 6000 });
const reduced = await page.waitForFunction(
  () => document.querySelector('.kt-ink-write')?.getAttribute('data-state') === 'done',
  { timeout: 2500 },
).then(() => true).catch(() => false);
console.log('reduced-motion instant done:', reduced);

await browser.close();
server.close();

const ok = strokes === 20 && dataStrokes === 20 && doneOk && after.clipRemoved && after.tipEmpty && after.headHidden
  && after.cap && after.tag && after.press && reduced && errors.length === 0 && fps >= 18
  && onMap && backOnTitle && stillOnTitle;
console.log('console errors:', errors.length);
if (!ok) {
  console.error('title-check FAILED');
  if (errors.length) console.error(errors.join('\n'));
  process.exit(1);
}
console.log('title-check OK');
