/**
 * 타이틀 한자 인트로 회귀 검사 (local-only).
 *   npm run build
 *   node tools/title-check.mjs
 *
 * 검증: 8획(kt-stroke) 존재 · 유령 레이어 존재 · 인트로 종료 후 모든 획
 * opacity 1 + 레이저 헤드 숨김 · 콘솔 에러 0 · reduced-motion에서 즉시 표시.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const browserRoot = resolve(root, '..', '.vimlore-browsers');
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

// 1) 초기 구조
await page.waitForSelector('.kt-ink svg', { timeout: 5000 });
const strokes = await page.$$eval('.kt-stroke', (els) => els.length);
const ghosts = await page.$$eval('.kt-ghost', (els) => els.length);
console.log('strokes:', strokes, '| ghosts:', ghosts);

// 1-2) 인트로 구간 FPS 증거 (북스타 #6: 측정 우선)
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const loop = (now) => {
    frames++;
    if (now - t0 >= 3400) {
      resolve((frames * 1000) / (now - t0));
      return;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}));
console.log('intro fps:', fps.toFixed(0));

// 2) 인트로 종료 후 상태 (8획 × 0.33s + 시작 0.85s ≈ 3.5s → 4.3s 대기)
await page.waitForTimeout(900);
const done = await page.evaluate(() => {
  const strokes = [...document.querySelectorAll('.kt-stroke')];
  const head = document.querySelector('.kt-laser-head');
  const allVisible = strokes.every((el) => getComputedStyle(el).opacity === '1');
  const headHidden = !head || getComputedStyle(head).opacity === '0';
  const ghostInfo = [...document.querySelectorAll('.kt-ghost')].map((el) => {
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, anim: cs.animationName, delay: cs.animationDelay, dur: cs.animationDuration, state: cs.animationPlayState };
  });
  const ghostGone = ghostInfo.every((g) => parseFloat(g.opacity) < 0.02);
  return { allVisible, headHidden, ghostGone, ghostInfo };
});
console.log('after intro:', JSON.stringify(done));

// 3) reduced-motion: 즉시 표시
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(300);
const reduced = await page.evaluate(() => {
  const strokes = [...document.querySelectorAll('.kt-stroke')];
  return strokes.every((el) => getComputedStyle(el).opacity === '1');
});
console.log('reduced-motion all visible:', reduced);

await browser.close();
server.close();

// FPS 게이트: 재해 감지용(≥18). 헤드리스 소프트웨어 렌더링은 기존 타이틀
// 이펙트 스택(꽃잎·스캔·스윕) 때문에 ~23fps가 환경 상한 — 실기 GPU 합성 대상 아님.
// 지속 게임플레이 60fps 증거는 browser:qa(57fps)가 담당한다.
const ok = strokes === 8 && ghosts === 2 && done.allVisible && done.headHidden && done.ghostGone && reduced && errors.length === 0 && fps >= 18;
console.log('console errors:', errors.length);
if (!ok) {
  console.error('title-check FAILED');
  if (errors.length) console.error(errors.join('\n'));
  process.exit(1);
}
console.log('title-check OK');
