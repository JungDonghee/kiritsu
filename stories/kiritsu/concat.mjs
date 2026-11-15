// KIRITSU 원고 결합기 — work/의 정본(프롤로그+1~12장)을 story.md로 결합한다.
// 규칙: 결합 전 fixnames2.mjs --check가 통과해야 한다(위반 0건).
// build.mjs는 story.md를 읽어 book.html → KIRITSU.pdf를 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const order = ['프롤로그.md', ...Array.from({ length: 12 }, (_, i) => `${i + 1}장.md`)];

// 1) 규칙 검사 (위반 시 결합하지 않음)
try {
  execFileSync('node', ['fixnames2.mjs', '--check'], { cwd: dir, stdio: 'inherit' });
} catch {
  console.error('concat 중단: fixnames2.mjs --check 실패 (위반이 있으면 결합하지 않는다)');
  process.exit(1);
}

const parts = [];
for (const f of order) {
  const p = path.join(dir, 'work', f);
  if (!fs.existsSync(p)) {
    console.error('concat 중단: 없음 —', p);
    process.exit(1);
  }
  parts.push(fs.readFileSync(p, 'utf8').trim());
}
const out = parts.join('\n\n') + '\n';
fs.writeFileSync(path.join(dir, 'story.md'), out, 'utf8');
const total = [...out.replace(/\s/g, '')].length;
console.log(`story.md 결합 완료: ${order.length}개 단위, 공백 제외 약 ${total}자`);
