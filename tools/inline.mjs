/**
 * Post-build: inline the JS + CSS into a single self-contained index.html so the
 * game can be emailed, opened from a USB stick, or hosted anywhere.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = 'dist';
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const assets = readdirSync(join(dist, 'assets'));
for (const name of assets) {
  const path = join(dist, 'assets', name);
  const body = readFileSync(path, 'utf8');
  if (extname(name) === '.js') {
    const tag = `<script type="module">${body.replace(/<\/script>/g, '<\\/script>')}</script>`;
    html = html.replace(new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`), () => tag);
  } else if (extname(name) === '.css') {
    const tag = `<style>${body}</style>`;
    html = html.replace(new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`), () => tag);
  }
}

// The title kanji is an external SVG in the normal build. Inline it here so
// the downloadable single HTML can open from a USB stick without sibling files.
const kanjiPath = join(dist, 'kanji', 'ou-guilv-tight.svg');
if (existsSync(kanjiPath)) {
  // 단일 파일 경량화: 좌표 소수점을 정수로 반올림(원본 글자형은 glyph 단위 그대로)하고
  // 태그 사이 공백을 줄인다. 원본 public/kanji/...svg 는 건드리지 않는다.
  let svg = readFileSync(kanjiPath, 'utf8');
  svg = svg
    .replace(/-?\d+\.\d+/g, (m) => String(Math.round(parseFloat(m))))
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const data = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  html = html.replaceAll('./kanji/ou-guilv-tight.svg', data);
}

// The downloadable single-file build stays self-contained: PWA shell tags
// point at sibling files that are not inlined and must be stripped.
html = html.replace(/<!-- pwa:start[\s\S]*?pwa:end -->\n?/g, '');
writeFileSync(join(dist, 'kiritsu.html'), html);
mkdirSync('dist/download', { recursive: true });
copyFileSync(join(dist, 'kiritsu.html'), 'dist/download/kiritsu.html');
console.log(`single file: dist/kiritsu.html (${(statSync(join(dist, 'kiritsu.html')).size / 1024).toFixed(1)} kB)`);
