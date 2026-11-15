import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = ['story-a.md', 'story-b.md', 'story-c.md'];
const key = { '키리츠': 'kiritsu', '리츠': 'ritsu', '츠키': 'tsuki', '레이': 'rei', '코우': 'kou', '칸노': 'kanno', '유이토': 'yuito' };
const other = /(키리츠|리츠|츠키|레이|코우|칸노|유이토)(?!\[)/g;
const shin = /(?<![\uAC00-\uD7A3])(신)(?!\[)(?=\[|들|은|는|이|가|을|를|의|에게|과|와|도|만|께|로|으로|[\s.,!?"'…—]|$)/g;

// `node fixnames2.mjs --check [파일...]` — 집필 중인 초고를 고치지 않고 검사만 한다.
// 인자가 없으면 work/ 아래의 모든 .md 파일을 검사한다. 위반이 있으면 exit 1.
if (process.argv[2] === '--check') {
  const targets = process.argv.slice(3);
  const list = targets.length
    ? targets
    : fs.readdirSync(path.join(dir, 'work'))
        .filter((f) => f.endsWith('.md') && !f.includes('-플랜'))
        .map((f) => path.join(dir, 'work', f));
  let bad = 0;
  for (const p of list) {
    const rel = p.startsWith(dir) ? p.slice(dir.length + 1) : p;
    const s = fs.readFileSync(p, 'utf8');
    const a = s.match(other) || [];
    const b = s.match(shin) || [];
    if (a.length || b.length) {
      bad++;
      console.log(rel, '| other:', a.length, [...new Set(a)], '| shin:', b.length, [...new Set(b)]);
      for (const line of s.split('\n')) {
        if (other.test(line) || shin.test(line)) console.log('  >', line.trim().slice(0, 120));
      }
    } else {
      console.log(rel, '| clean');
    }
  }
  process.exit(bad ? 1 : 0);
}

let state;
const reset = (ch) => {
  state = {
    ritsu: ch >= 9 ? '立' : '律',      // 9장 복제 활성·명명
    tsuki: ch >= 7 ? '憑' : '月',      // 7장 4,115 원본 삭제, 복제 활성
    rei: ch >= 11 ? '霊' : '零',       // 11장 유령
    kou: ch >= 10 ? '功' : '抗',       // 10장 면역 반전
    kiritsu: ch >= 12 ? '起立' : '規律', // 12장 첫 줄 덮어쓰기
    kanno: '監能', yuito: '唯人',
  };
};
let chapter = 0, fixed = 0;
for (const f of files) {
  const p = `${dir}/${f}`;
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const out = [];
  for (const line of lines) {
    const cm = line.match(/^# (\d+)장/);
    if (cm) { chapter = Number(cm[1]); reset(chapter); out.push(line); continue; }
    let replaced = line.replace(other, (m) => `${m}[${state[key[m]]}]`);
    replaced = replaced.replace(shin, '신[審]');
    fixed += (line.match(other) || []).length;
    out.push(replaced);
    if (chapter === 10 && line.includes('코우[功]')) state.kou = '功';
    if (chapter === 8 && line.includes('리츠[立]')) state.ritsu = '立';
    if (chapter === 7 && line.includes('츠키[憑]')) state.tsuki = '憑';
    if (chapter === 11 && line.includes('레이[霊]')) state.rei = '霊';
    if (chapter === 12 && line.includes('키리츠[起立]')) state.kiritsu = '起立';
  }
  fs.writeFileSync(p, out.join('\n'), 'utf8');
}
console.log('fixed other:', fixed);
for (const f of files) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8');
  const a = s.match(other) || [], b = s.match(shin) || [];
  console.log(f, '| other:', a.length, [...new Set(a)], '| shin:', b.length, [...new Set(b)]);
}
