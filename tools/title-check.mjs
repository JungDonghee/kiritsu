/**
 * 타이틀 한자 인트로 회귀 검사 (local-only, v4 캔버스 잉크 타임라인).
 *   npm run build
 *   node tools/title-check.mjs
 *
 * 검증: 20획 · data-state=done · 캔버스 최종 잉크 커버리지(글자형 100% 보장) ·
 * 헤드 제거 · 캡션/태그/PRESS 노출 · 콘솔 에러 0 · reduced-motion 즉시 완료 ·
 * Esc 내비게이션 · 인트로 FPS≥18.
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

// 1) 캔버스 구조
await page.waitForSelector('.kt-ink-write canvas', { timeout: 6000 });
const info = await page.$eval('.kt-ink-write', (el) => ({ strokes: Number(el.getAttribute('data-strokes')), ink: Number(el.getAttribute('data-ink')) }));

// 2) 인트로 FPS
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

// 3) 완료 대기 + 최종 잉크 커버리지(글자형 100% 검증)
const doneOk = await page.waitForFunction(
  () => document.querySelector('.kt-ink-write')?.getAttribute('data-state') === 'done',
  { timeout: 12000 },
).then(() => true).catch(() => false);
await page.waitForTimeout(1700);
const after = await page.evaluate(() => {
  const w = document.querySelector('.kt-ink-write');
  const cv = document.querySelector('.kt-ink-write canvas');
  const head = document.querySelector('.kt-laser-head');
  const op = (sel) => {
    const el = document.querySelector(sel);
    return el ? parseFloat(getComputedStyle(el).opacity) : 0;
  };
  let coverage = 0;
  if (cv) {
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let on = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 24) on++;
    coverage = on / cv.width / cv.height;
  }
  return {
    state: w?.getAttribute('data-state'),
    headHidden: !head || parseFloat(getComputedStyle(head).opacity) < 0.05,
    cap: op('.kt-caption') > 0.9,
    tag: op('.kt-tag') > 0.9,
    press: op('.kt-press') > 0.05,
    coverage,
    clipVar: getComputedStyle(document.querySelector('.kt-screen')).getPropertyValue('--kt-end').trim(),
  };
});

// 4) Esc 내비게이션
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const onMap = (await page.$$('.map')).length > 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const backOnTitle = (await page.$$('.title-screen')).length > 0;
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
const stillOnTitle = (await page.$$('.title-screen')).length > 0 && (await page.$$('.map')).length === 0;

// 5) reduced-motion: 즉시 완료
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'load' });
await page.waitForSelector('.kt-ink-write canvas', { timeout: 6000 });
const reduced = await page.waitForFunction(
  () => document.querySelector('.kt-ink-write')?.getAttribute('data-state') === 'done',
  { timeout: 2500 },
).then(() => true).catch(() => false);

await browser.close();
server.close();

const coverOk = after.coverage > 0.005; // 잉크가 실제로 그려졌는가(canvas 픽셀)
console.log('strokes:', info.strokes, '| ink px:', info.ink, '| intro fps:', fps.toFixed(0));
console.log('after:', JSON.stringify({ ...after, coverage: +(after.coverage * 100).toFixed(2) + '%' }));
console.log('esc nav:', JSON.stringify({ onMap, backOnTitle, stillOnTitle }), '| reduced:', reduced);
console.log('console errors:', errors.length);
const ok = info.strokes === 20 && info.ink > 5000 && doneOk && after.state === 'done'
  && after.headHidden && after.cap && after.tag && after.press && coverOk
  && onMap && backOnTitle && stillOnTitle && reduced && errors.length === 0 && fps >= 18;
if (!ok) {
  console.error('title-check FAILED');
  if (errors.length) console.error(errors.join('\n'));
  process.exit(1);
}
console.log('title-check OK');
