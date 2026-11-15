import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { art, cast } from './illustrations.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(dir, '../../package.json'));
const { chromium } = require('playwright');

const raw = fs.readFileSync(path.join(dir, 'story.md'), 'utf8');
const parts = raw.split(/^# /m).map((s) => s.trim()).filter(Boolean);
const chapters = parts.map((p) => {
  const lines = p.split('\n');
  const title = lines[0].trim();
  const en = lines[1] && lines[1].startsWith('### ') ? lines[1].replace(/^### /, '').trim() : '';
  const body = lines.slice(en ? 2 : 1).join('\n').trim();
  const [main, ...comm] = body.split(/^## 주석/m);
  return { title, en, main: main.trim(), commentary: comm.join('## 주석').trim() };
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
const mainHtml = (body) => body.split(/\n{2,}/).map((p) => `<p>${md(p)}</p>`).join('');
const commHtml = (c) => {
  if (!c) return '';
  const lines = c.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, ''));
  return `<div class="commentary"><div class="comm-title">주석 · COMMENTARY</div>${lines.map((l) => `<p>${md(l)}</p>`).join('')}</div>`;
};

const css = `
@font-face{font-family:'NanumGothic';src:url('fonts/NanumGothic-Regular.ttf') format('truetype');font-weight:400}
@font-face{font-family:'NanumGothic';src:url('fonts/NanumGothic-Bold.ttf') format('truetype');font-weight:700}
@font-face{font-family:'NotoCJK';src:url('fonts/NotoSansCJKkr-Regular.otf') format('opentype');font-weight:400}
@font-face{font-family:'NotoCJK';src:url('fonts/NotoSansCJKkr-Bold.otf') format('opentype');font-weight:700}
@page{size:A4;margin:0}
html,body{margin:0;padding:0}
body{font-family:'NanumGothic','NotoCJK',sans-serif;color:#101c24;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
svg text{font-family:'NanumGothic','NotoCJK',sans-serif}
.cover{width:210mm;height:297mm;background:#070b0f;overflow:hidden;position:relative;page-break-after:always}
.cover svg{width:100%;height:auto;display:block}
.cover-foot{position:absolute;left:18mm;bottom:16mm;color:#5ff5e0;font-size:9pt;letter-spacing:6px}
.cast{width:210mm;height:297mm;background:#070b0f;overflow:hidden;page-break-after:always}
.cast svg{width:100%;height:auto;display:block}
.chapter{page-break-before:always;padding:18mm 17mm 16mm;min-height:297mm;box-sizing:border-box}
.ch-head{border-bottom:2px solid #101c24;padding-bottom:6mm;margin-bottom:6mm}
.ch-num{font-size:9pt;color:#0a8a7e;letter-spacing:5px}
.ch-head h1{font-size:25pt;margin:1mm 0 1mm;letter-spacing:-0.5px}
.ch-head .en{font-size:9pt;color:#5a7a86;letter-spacing:4px}
.art{margin:0 0 6mm}
.art svg{width:100%;height:auto;display:block}
.body p{font-size:11pt;line-height:1.95;margin:0 0 3.4mm;text-align:justify;word-break:keep-all}
.body strong{color:#0a6f66}
.commentary{margin-top:6mm;padding:4.5mm 5.5mm;background:#f2f7f6;border-left:3px solid #0a8a7e}
.comm-title{font-size:8pt;letter-spacing:3px;color:#0a8a7e;margin-bottom:2mm}
.commentary p{font-size:9.3pt;line-height:1.8;margin:0 0 1.2mm;color:#2a3d46;text-align:justify;word-break:keep-all}
.commentary strong{color:#0a6f66}
`;

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="cover">${art[0]}<div class="cover-foot">KIRITSU — A NOVEL</div></section>
<section class="cast">${cast()}</section>
${chapters.map((c, i) => {
  const pro = c.title.startsWith('프롤로그');
  const num = pro ? '00' : String(i).padStart(2, '0');
  const title = pro ? c.title.replace(/^프롤로그 — /, '') : c.title.replace(/^\d+장 — /, '');
  return `<section class="chapter">
  <div class="ch-head"><div class="ch-num">${num}</div><h1>${esc(title)}</h1><div class="en">${esc(c.en)}</div></div>
  <div class="art">${art[i + 1] || ''}</div>
  <div class="body">${mainHtml(c.main)}</div>
  ${commHtml(c.commentary)}
</section>`;
}).join('')}
</body></html>`;

const htmlPath = path.join(dir, 'book.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('html written:', htmlPath, 'chapters:', chapters.length);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(1500);
const out = path.join(dir, 'KIRITSU.pdf');
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('pdf written:', out, fs.statSync(out).size, 'bytes');
try {
  console.log(execFileSync('python3', [path.join(dir, 'optimize-pdf.py'), out], { cwd: dir, encoding: 'utf8' }).trim());
} catch (err) {
  console.warn('pdf optimize skipped:', String(err.message || err).slice(0, 160));
}
