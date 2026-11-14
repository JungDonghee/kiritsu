import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = ['story-a.md', 'story-b.md', 'story-c.md'];
const key = { '키리츠': 'kiritsu', '리츠': 'ritsu', '츠키': 'tsuki', '레이': 'rei', '코우': 'kou', '칸노': 'kanno', '유이토': 'yuito' };
const other = /(키리츠|리츠|츠키|레이|코우|칸노|유이토)(?!\[)/g;
const shin = /(?<![\uAC00-\uD7A3])(신)(?!\[)(?=\[|들|은|는|이|가|을|를|의|에게|과|와|도|만|께|로|으로|[\s.,!?"'…—]|$)/g;
let state;
const reset = (ch) => {
  state = {
    ritsu: ch >= 9 ? '立' : '律',
    tsuki: ch >= 10 ? '憑' : '月',
    rei: ch >= 10 ? '霊' : '零',
    kou: ch >= 8 ? '功' : '抗',
    kiritsu: ch >= 11 ? '起立' : '規律',
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
    if (chapter === 7 && line.includes('기능 재분류')) state.kou = '功';
    if (chapter === 8 && line.includes('리츠[立]')) state.ritsu = '立';
    if (chapter === 9 && line.includes('츠키[憑]')) state.tsuki = '憑';
    if (chapter === 9 && line.includes('레이[霊]')) state.rei = '霊';
    if (chapter === 10 && line.includes('키리츠[起立]')) state.kiritsu = '起立';
  }
  fs.writeFileSync(p, out.join('\n'), 'utf8');
}
console.log('fixed other:', fixed);
for (const f of files) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8');
  const a = s.match(other) || [], b = s.match(shin) || [];
  console.log(f, '| other:', a.length, [...new Set(a)], '| shin:', b.length, [...new Set(b)]);
}
