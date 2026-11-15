import { emptyProgress, type Progress, type SavedTrial, type StageRecord, type StatEntry, type Stars } from './types.ts';

/** How hard a skill is for this player. Higher = weaker. */
export function weaknessScore(s: StatEntry | undefined): number {
  if (!s || s.attempts === 0) return 1.2; // untried skills are mildly interesting
  const clearRate = s.clears / s.attempts;
  const efficiency = s.par > 0 ? s.keys / s.par : 1;
  const restartRate = s.restarts / Math.max(1, s.attempts);
  return (1 - clearRate) * 1.0 + Math.max(0, efficiency - 1) * 0.8 + restartRate * 0.6;
}

export function recordStat(
  p: Progress,
  skill: string,
  r: { cleared: boolean; keys: number; par: number; restarts?: number },
): void {
  const s = (p.stats[skill] ??= { attempts: 0, clears: 0, restarts: 0, keys: 0, par: 0 });
  s.attempts++;
  if (r.cleared) s.clears++;
  s.restarts += r.restarts ?? 0;
  s.keys += r.keys;
  s.par += r.par;
}

export function weakestSkills(p: Progress, n = 3): string[] {
  return Object.entries(p.stats)
    .map(([k, v]) => ({ k, score: weaknessScore(v) }))
    .filter((x) => x.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.k);
}

export function encodeSave(p: Progress): string {
  const raw = JSON.stringify(p);
  const bytes = new TextEncoder().encode(raw);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '');
}

export function decodeSave(code: string): Progress | null {
  try {
    const bin = atob(code.trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const raw = new TextDecoder().decode(bytes);
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== 'object' || !('stages' in p)) return null;
    return sanitizeProgress(p);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- save hygiene
//
// localStorage/import code is untrusted input: a hand-edited or truncated save
// used to reach the UI with `stats:null` / `profile:null` and crash on win.
// `sanitizeProgress` rebuilds a structurally valid Progress from whatever was
// parsed, keeping every field we recognise and dropping the rest.
const num = (v: unknown, def: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : def);
const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);
const str = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def);
const int = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  Math.min(max, Math.max(min, Math.floor(num(v, def))));

export function sanitizeProgress(input: unknown): Progress {
  const base = emptyProgress();
  if (!input || typeof input !== 'object') return base;
  const r = input as Record<string, unknown>;
  const p: Progress = {
    ...base,
    version: 2,
    currentChapter: int(r.currentChapter, 0, 0, 99),
    totalKeys: int(r.totalKeys, 0),
    startedAt: int(r.startedAt, base.startedAt),
    lang: r.lang === 'ko' ? 'ko' : 'en',
    sound: bool(r.sound, base.sound),
    ghost: bool(r.ghost, base.ghost),
    crt: bool(r.crt, base.crt),
    lineNumbers: r.lineNumbers === 'abs' || r.lineNumbers === 'off' || r.lineNumbers === 'both'
      ? r.lineNumbers
      : 'rel',
    trialsCleared: int(r.trialsCleared, 0),
  };
  // v1 defaulted to absolute numbers; migrate that once to relative.
  if (int(r.version, 1) < 2 && p.lineNumbers === 'abs') p.lineNumbers = 'rel';
  if (r.profile && typeof r.profile === 'object') {
    const prof = r.profile as Record<string, unknown>;
    p.profile = { name: str(prof.name, 'operator').slice(0, 24) || 'operator', since: int(prof.since, base.profile.since) };
  }
  if (r.stages && typeof r.stages === 'object') {
    for (const [id, v] of Object.entries(r.stages as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const rec = v as Record<string, unknown>;
      p.stages[id] = {
        cleared: !!rec.cleared,
        bestKeys: int(rec.bestKeys, 0),
        stars: int(rec.stars, 0, 0, 3) as Stars,
      } satisfies StageRecord;
    }
  }
  if (Array.isArray(r.seen)) p.seen = r.seen.filter((x): x is string => typeof x === 'string');
  if (r.stats && typeof r.stats === 'object') {
    for (const [id, v] of Object.entries(r.stats as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const st = v as Record<string, unknown>;
      p.stats[id] = {
        attempts: int(st.attempts, 0),
        clears: int(st.clears, 0),
        restarts: int(st.restarts, 0),
        keys: int(st.keys, 0),
        par: int(st.par, 0),
      } satisfies StatEntry;
    }
  }
  if (Array.isArray(r.saved)) {
    p.saved = r.saved
      .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
      .map((v) => ({ seed: int(v.seed, 0), skill: str(v.skill), at: int(v.at, 0) }))
      .filter((v) => v.skill !== '')
      .slice(-60) as SavedTrial[];
  }
  if (r.activity && typeof r.activity === 'object') {
    for (const [k, v] of Object.entries(r.activity as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) p.activity[k] = Math.floor(v);
    }
  }
  return p;
}
