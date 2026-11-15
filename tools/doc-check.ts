/**
 * `npm run doc-check` — document integrity gate (CI).
 *
 * Enforces the docs system described in `docs/README.md`:
 *
 *   1. **Structure.** `docs/` top level may only contain the registered
 *      canonical documents; `docs/generated/` only the registered generated
 *      files; `docs/archive/` is free-form history. A new loose document is a
 *      build failure until it is registered here and in `docs/README.md`.
 *   2. **Truth.** Every "N/N" oracle count and "N keystroke cases" in
 *      README.md / AGENTS.md / canonical docs must equal `CASES.length`.
 *   3. **Links.** Every relative link in README.md, AGENTS.md, docs/README.md
 *      and the canonical docs must resolve to a real file (no dangling
 *      docs, images, or story links).
 *   4. **Onboarding hygiene.** README.md / AGENTS.md / docs/README.md /
 *      index.html may not re-introduce retired or stale phrases (old state
 *      counts, old bundle ceilings, retired product framing, dead live markers).
 *
 * Generated-file freshness is enforced by `levels:check` / `surface:check` /
 * `count-matrix --check-docs` / `status:check`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { CASES } from './cases.ts';

const n = CASES.length;
const ROOT = '.';

const CANONICAL = [
  'README.md',
  'HANDOFF.md',
  'NORTH_STAR.md',
  'ARCHITECTURE.md',
  'VIM_COVERAGE.md',
  'CURRICULUM.md',
  'CURRICULUM_PROVENANCE.md',
  'LEVEL_FORMAT.md',
  'STORY_BIBLE.md',
  'DESIGN.md',
  'TITLE_KANJI.md',
  'KANJI_ATTRIBUTION.md',
  'PWA.md',
  'QA.md',
  'DEBT.md',
  'ROADMAP.md',
  'COMPLETION.md',
  'COMPARISON.md',
  'REPO_PRESENTATION.md',
  'PROMPT_SYSTEM.md',
  'BOOKS.md',
  'ONE_MESSAGE.md',
] as const;

const GENERATED = [
  'STATUS.md',
  'LEVELS.md',
  'ENGINE_SURFACE.md',
  'COMMAND_MANIFEST.md',
  'MATRIX_REPORT.md',
  'STATE_REPORT.md',
  'STAGE_PROVENANCE.md',
  'BOOKS_INDEX.md',
  'GAME_USED_STATE.md',
] as const;

let bad = 0;
const fail = (msg: string): void => {
  bad++;
  console.log('FAIL  ' + msg);
};

// ---- 1. structure -----------------------------------------------------------
for (const name of CANONICAL) {
  if (!existsSync(join(ROOT, 'docs', name))) fail(`missing canonical doc docs/${name}`);
}
for (const name of GENERATED) {
  if (!existsSync(join(ROOT, 'docs', 'generated', name))) fail(`missing generated doc docs/generated/${name}`);
}
const canonicalSet = new Set<string>(CANONICAL);
for (const entry of readdirSync(join(ROOT, 'docs'), { withFileTypes: true })) {
  if (entry.isDirectory()) {
    if (!['generated', 'archive', 'browser'].includes(entry.name)) {
      fail(`unknown docs/ subdirectory "${entry.name}" (only generated/, archive/, browser/)`);
    }
    continue;
  }
  if (entry.name.endsWith('.md') && !canonicalSet.has(entry.name)) {
    fail(`unregistered doc docs/${entry.name} — register it in docs/README.md + CANONICAL or archive it`);
  }
}
const generatedSet = new Set<string>(GENERATED);
if (existsSync(join(ROOT, 'docs', 'generated'))) {
  for (const entry of readdirSync(join(ROOT, 'docs', 'generated'), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md') && !generatedSet.has(entry.name)) {
      fail(`unregistered generated doc docs/generated/${entry.name}`);
    }
  }
}

// ---- 2. oracle counts in human docs ----------------------------------------
const scanned = [
  'README.md',
  'AGENTS.md',
  join('docs', 'README.md'),
  ...CANONICAL.map((f) => join('docs', f)),
];

for (const f of scanned) {
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\b(\d+)\/(\d+)\b/g)) {
    if (m[1] !== m[2]) continue;
    const ctx = t.slice(Math.max(0, m.index - 50), m.index + 60);
    if (!/oracle|matching|identical|keystroke|must pass/i.test(ctx)) continue;
    if (Number(m[1]) !== n) fail(`${f}: "${m[0]}" should be ${n}/${n}`);
  }
  for (const m of t.matchAll(/\b(\d+)\s+keystroke\s+cases?\b/gi)) {
    if (Number(m[1]) !== n) fail(`${f}: "${m[0]}" should say ${n} keystroke cases`);
  }
}

// ---- 3. relative links resolve --------------------------------------------
const linkRe = /\]\(\s*([^)\s]+?)(?:\s+"[^"]*")?\s*\)/g;
for (const f of scanned) {
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(linkRe)) {
    let target = m[1].trim();
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) continue; // http:, mailto:, ...
    if (target.startsWith('//') || target.startsWith('#')) continue;
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    const resolved = normalize(join(dirname(f), target));
    if (!existsSync(resolved)) fail(`${f}: dangling link ${target}`);
  }
}

// ---- 4. onboarding hygiene -------------------------------------------------
const banned: [RegExp, string][] = [
  [/memory heist/i, 'retired "memory heist" framing'],
  [/\b356\s+cases?\b/i, 'stale oracle count (should be 373)'],
  [/\b119\s+(?:open|full-state)/i, 'stale state-debt count (should be 104)'],
  [/gate\s+300k\/95k/i, 'stale bundle ceiling (should be 420k/140k)'],
  [/kts-band/i, 'dead live marker'],
  [/docs\/(?:STATUS|LEVELS|ENGINE_SURFACE|COMMAND_MANIFEST|MATRIX_REPORT|STATE_REPORT|STAGE_PROVENANCE|BOOKS_INDEX|GAME_USED_STATE)\.md/, 'old pre-generated/ doc path'],
];
for (const f of ['README.md', 'AGENTS.md', join('docs', 'README.md'), 'index.html']) {
  if (!existsSync(f)) continue;
  const t = readFileSync(f, 'utf8');
  for (const [re, why] of banned) {
    const m = re.exec(t);
    if (m) fail(`${f}: ${why} ("${m[0]}")`);
  }
}

// ---- 5. docs/README registers every canonical doc -------------------------
const index = existsSync(join(ROOT, 'docs', 'README.md')) ? readFileSync(join(ROOT, 'docs', 'README.md'), 'utf8') : '';
for (const name of CANONICAL) {
  if (!index.includes(name)) fail(`docs/README.md does not mention canonical doc ${name}`);
}

console.log(`oracle cases: ${n} | canonical docs: ${CANONICAL.length} | generated docs: ${GENERATED.length} | archive: ${existsSync('docs/archive') ? readdirSync('docs/archive').filter((f) => f.endsWith('.md')).length : 0}`);
if (bad) {
  console.log(`\n${bad} doc check(s) failed — fix the docs or register the change.`);
  process.exit(1);
}
console.log('doc check OK');
