import { tokenize, fromKeyboardEvent, keyLabel, needsRemap } from '../core/vim/keys.ts';
import { Session, type SessionEvent } from '../core/game/session.ts';
import { goalLabel } from '../core/game/goals.ts';
import type { Chapter, Goal, Localized, Stage, Stars } from '../core/game/types.ts';
import { COMMAND_BY_ID } from '../content/commands.ts';
import { Renderer } from './render.ts';
import { Sfx } from './sfx.ts';
import { h, mount, focusGroup, focusStep, focusActivate, focusIndex, type FocusGroup } from './dom.ts';

export interface PlayHost {
  sfx: Sfx;
  lang: 'ko' | 'en';
  chapter: Chapter;
  stage: Stage;
  stageIndex: number;
  stageCount: number;
  allowed: Set<string>;
  bestStars: Stars;
  bestKeys: number | null;
  crt: boolean;
  lineNumbers: 'off' | 'abs' | 'rel' | 'both';
  /** First-ever session: show the NORMAL/INSERT primer in the briefing. */
  firstTime?: boolean;
  onHelp?: () => void;
  canSave?: boolean;
  onSave?: () => void;
  onWin(stars: Stars, keys: number, par: number): void;
  onNext(): void;
  onPrev?(): void;
  canPrev?: boolean;
  onExit(): void;
  chapterForKey(key: string): number | null;
}

const KO = (s: Localized, lang: 'ko' | 'en'): string => (lang === 'ko' ? s.ko : s.en);

/**
 * Keys typed during the briefing may skip the typing, but a mashed Enter must
 * not skip it and start the chamber in the same motion. Enter is ignored for
 * this long after the BEGIN prompt becomes available.
 */
const INTRO_READY_GUARD = 700;
/** Minimum time the briefing card is on screen, even when a key skips it. */
const INTRO_MIN_DWELL = 620;

interface TypingOpts {
  /** ms per character baseline; derived from text length when omitted. */
  base?: number;
  /** Play a tick every Nth visible character (0/undefined disables). */
  tickEvery?: number;
  onTick?: () => void;
  onDone?: () => void;
  /** Wait before the first character (the card needs to land first). */
  startDelay?: number;
}

/**
 * Typewriter reveal for a reserved block. The caller writes the final text into
 * an invisible sibling, so the card never reflows while typing; this class only
 * grows the visible layer and owns its timer. finish() completes once, cancel()
 * discards without side effects — a replaced hint or a destroyed screen can
 * never keep writing into a detached node.
 */
class Typing {
  private node = document.createTextNode('');
  private caret: HTMLElement;
  private timer = 0;
  private index = 0;
  private seen = 0;
  private state: 'typing' | 'done' | 'cancelled' = 'typing';

  constructor(
    layer: HTMLElement,
    private text: string,
    private opts: TypingOpts = {},
  ) {
    this.caret = h('span', { class: 'type-caret' });
    layer.append(this.node, this.caret);
    this.timer = window.setTimeout(this.step, this.opts.startDelay ?? 90);
  }

  private step = (): void => {
    if (this.state !== 'typing') return;
    if (this.index >= this.text.length) {
      this.complete();
      return;
    }
    const ch = this.text[this.index++];
    this.node.data = this.text.slice(0, this.index);
    if (ch !== ' ' && ch !== '\n' && this.opts.tickEvery) {
      this.seen++;
      if (this.seen % this.opts.tickEvery === 0) this.opts.onTick?.();
    }
    this.timer = window.setTimeout(this.step, this.delay(ch));
  };

  private delay(ch: string): number {
    const len = Math.max(1, this.text.length);
    const base = this.opts.base ?? Math.min(24, Math.max(8, 2200 / len));
    let d = base + (this.index % 5 === 0 ? 9 : 0);
    if (ch === '\n') d += 55;
    else if ('.!?…'.includes(ch)) d += 70;
    else if (',;:—'.includes(ch)) d += 28;
    return d;
  }

  private complete(): void {
    this.state = 'done';
    this.index = this.text.length;
    this.node.data = this.text;
    this.caret.remove();
    this.opts.onDone?.();
  }

  /** Any key: show the whole text now (onDone runs exactly once). */
  finish(): void {
    if (this.state !== 'typing') return;
    window.clearTimeout(this.timer);
    this.complete();
  }

  /** Discard the animation without running onDone (the element is going away). */
  cancel(): void {
    if (this.state === 'typing') window.clearTimeout(this.timer);
    this.state = 'cancelled';
    this.caret.remove();
  }

  get done(): boolean {
    return this.state === 'done';
  }
}

/** One sentence that says exactly what clears the chamber, in player words. */
function clearLabel(goal: Goal, lang: 'ko' | 'en'): string {
  const ko = lang === 'ko';
  switch (goal.type) {
    case 'reach':
      return ko ? `커서를 ${goal.char} 위에 올려라` : `Land the cursor on ${goal.char}`;
    case 'exact':
      return ko ? '버퍼를 목표 문서와 똑같이 만들어라' : 'Make the buffer match the target exactly';
    case 'lines':
      return ko ? `${goal.from}번째 줄을 고쳐라` : `Repair line ${goal.from}`;
    case 'none':
      return ko ? `${goal.chars} 를 하나도 남기지 마라` : `Leave no ${goal.chars} behind`;
    case 'collect':
      return ko ? `모든 ${goal.char} 위를 지나가라` : `Walk over every ${goal.char}`;
    case 'cursor':
      return ko ? '커서를 표시 지점에 놓아라' : 'Park the cursor on the mark';
    case 'all':
      return goal.of.map((g) => clearLabel(g, lang)).join(ko ? ' + ' : ' + ');
    default:
      return '';
  }
}

export class PlayScreen {
  private host: PlayHost;
  private root: HTMLElement;
  private session: Session;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;
  private board: HTMLElement;
  private echo: HTMLElement;
  private hudKeys: HTMLElement;
  private hearts: HTMLElement;
  private hintBox: HTMLElement | null = null;
  private state: 'intro' | 'playing' | 'won' | 'lost' = 'intro';
  private raf = 0;
  private lastT = 0;
  private flash = 0;
  private shake = 0;
  private hintLevel = 0;
  private ghosting = false;
  private ghostSkip = false;
  private ghostTicker: HTMLElement | null = null;
  private ghostProgress: HTMLElement | null = null;
  private ghostTween: { from: { line: number; col: number }; to: { line: number; col: number }; start: number } | null = null;
  private matches: { line: number; col: number; len: number }[] = [];
  private ro: ResizeObserver | null = null;
  private destroyed = false;
  private overlay: HTMLElement | null = null;
  private dirty = true;
  private lastBlink = -1;
  private modeEl: HTMLElement | null = null;
  private posEl: HTMLElement | null = null;
  private repeatKey: string | null = null;
  private repeating = false;
  private repeatDelay = 0;
  private repeatTimer = 0;
  private actions: FocusGroup | null = null;
  private exitPrompt: HTMLElement | null = null;
  private exitActions: FocusGroup | null = null;
  private coachEl: HTMLElement | null = null;
  private lastInputAt = 0;
  private coachStep = 0;
  private coachType: Typing | null = null;
  private hintType: Typing | null = null;
  private hintTimer = 0;
  /** True when the user asked the OS to reduce motion: skip typewriter/animation. */
  private reduced = false;
  // Briefing reveal: the card lands, the brief types, then BEGIN becomes live.
  private introActions: HTMLElement | null = null;
  private introPrimary: HTMLElement | null = null;
  private introCard: HTMLElement | null = null;
  private introPart: { shell: HTMLElement; layer: HTMLElement } | null = null;
  private introText = '';
  private introType: Typing | null = null;
  private introPending = 0;
  private introRevealTimer = 0;
  private introShownAt = 0;
  private introTyped = false;
  private introReady = false;
  private introReadyAt = 0;
  // Ghost run id: every start/cancel invalidates an in-flight ghost loop.
  private ghostRun = 0;
  private ghostLive: Session | null = null;
  private starTimers: number[] = [];
  // Results overlay: a keyboard-scrollable card with a typed drill line.
  private resultsCard: HTMLElement | null = null;
  private resultsType: Typing | null = null;

  constructor(root: HTMLElement, host: PlayHost) {
    this.host = host;
    this.root = root;
    this.reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.session = new Session({ stage: host.stage, chapterIndex: host.chapter.index - 1, allowed: host.allowed, onEvent: (e) => this.onEvent(e) });
    this.session.chapterForKey = host.chapterForKey;
    this.canvas = h('canvas');
    // The buffer is part of the fiction the briefing introduces: it stays
    // veiled until the player presses BEGIN, then wakes with a fade.
    this.board = h('div', { class: 'board veiled' }, this.canvas);
    this.echo = h('div', { class: 'echo' });
    this.hudKeys = h('span', { class: 'keys' });
    this.hearts = h('span', { class: 'hearts' });
    this.renderer = new Renderer(this.canvas);
    this.renderer.setHue(122 + ((host.chapter.index * 7) % 3) * 6);
    this.renderer.bloom = host.crt;
    this.session.vim.number = host.lineNumbers === 'abs' || host.lineNumbers === 'both';
    this.session.vim.relativenumber = host.lineNumbers === 'rel' || host.lineNumbers === 'both';
  }

  mount(): void {
    const { chapter, stage, lang } = this.host;
    const slug = (t: string): string =>
      t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    this.modeEl = h('span', { class: 'mode normal' }, '-- NORMAL --');
    this.posEl = h('span', { class: 'pos' }, '1,1');
    const tabline = h(
      'div',
      { class: 'tabline' },
      h('span', { class: 'path' }, `kiritsu://${String(chapter.index).padStart(2, '0')}-${slug(chapter.title.en)}/${String(this.host.stageIndex + 1).padStart(2, '0')}-${slug(stage.name.en)}`),
      h(
        'span',
        { class: 'flags' },
        h('span', { class: 'mod' }, '[+]'),
        ` ${this.host.stageIndex + 1}/${this.host.stageCount}`,
        this.host.canPrev
          ? h('button', { class: 'tabclose', title: 'previous chamber (F9)', onclick: () => this.host.onPrev?.() }, '‹')
          : null,
        h('button', { class: 'tabclose', title: 'close buffer (F10)', onclick: () => this.openExit() }, '×'),
      ),
    );
    const statusline = h(
      'div',
      { class: 'statusline' },
      this.modeEl,
      this.posEl,
      h('span', { class: 'spacer' }),
      h('span', { class: 'meta' }, this.t('par', '기준')),
      this.hudKeys,
      this.hearts,
    );
    const lessonKeys = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.keys)
      .filter(Boolean)
      .slice(0, 4)
      .join(' ');
    const lessonName = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.name)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => KO(n!, lang))
      .join(' · ');
    const objective = h(
      'div',
      { class: 'objective' },
      lessonKeys ? h('span', { class: 'lesson-chip', title: lessonName }, `${this.t('LEARN', '학습')} ${lessonKeys}`) : null,
      h('span', { class: 'goal' }, goalLabel(stage.goal, lang)),
      h('span', { class: 'spacer' }),
      this.host.onHelp ? h('button', { class: 'chip help', onclick: () => this.host.onHelp?.() }, lang === 'ko' ? 'F1 도움' : 'F1 HELP') : null,
      h('button', { class: 'chip', onclick: () => this.showHint() }, lang === 'ko' ? 'TAB 힌트' : 'TAB HINT'),
      h('button', { class: 'chip', onclick: () => this.restart() }, lang === 'ko' ? 'F2 재시작' : 'F2 RETRY'),
      h('button', { class: 'chip', onclick: () => void this.playGhost() }, lang === 'ko' ? 'F3 고스트' : 'F3 GHOST'),
    );
    mount(
      this.root,
      h('div', { class: 'screen play' }, tabline, this.board, statusline, objective, h('div', { class: 'cmdline' }, this.echo)),
    );

    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(this.board);
    this.host.sfx.unlock();
    this.updateHud();
    this.fit();
    this.showIntro();
    this.loop(0);
  }

  private t(en: string, ko: string): string {
    return this.host.lang === 'ko' ? ko : en;
  }

  private fit(): void {
    this.dirty = true;
    const r = this.board.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    this.renderer.resize(r.width, r.height, this.session.vim.buf.lines);
    this.updateMatches();
  }

  private updateHud(): void {
    // 고스트 재생 중에는 데모 세션이 화면을 소유하지만, HUD의 키/하트는
    // 플레이어의 실제 세션(live)을 보여준다. 예전엔 2/9 → 0/9 로 롤백돼 보였다.
    const s = this.ghosting && this.ghostLive ? this.ghostLive : this.session;
    const max = s.maxHearts;
    this.hearts.textContent = '';
    for (let i = 0; i < max; i++) {
      this.hearts.append(h('span', { class: i < s.hearts ? '' : 'dead' }, '♥'));
    }
    const over = s.keys > this.host.stage.par;
    this.hudKeys.className = `keys${over ? ' over' : ''}`;
    this.hudKeys.textContent = '';
    this.hudKeys.append(h('b', {}, String(s.keys)), ` / ${this.host.stage.par}`);
    this.updateStatus();
  }

  /** Classic Vim statusline: mode · position, refreshed on every keystroke. */
  private updateStatus(): void {
    if (!this.modeEl || !this.posEl) return;
    const vim = this.session.vim;
    const m = vim.mode;
    const label =
      vim.confirming ? '-- CONFIRM --'
      : m === 'insert' ? '-- INSERT --'
      : m === 'replace' ? '-- REPLACE --'
      : m === 'visual' ? '-- VISUAL --'
      : m === 'visual-line' ? '-- V-LINE --'
      : m === 'visual-block' ? '-- V-BLOCK --'
      : m === 'cmdline' ? ':'
      : m === 'search' ? '/'
      : '-- NORMAL --';
    const kind = vim.confirming ? 'visual' : m === 'insert' || m === 'replace' ? 'insert' : m === 'normal' ? 'normal' : 'visual';
    this.modeEl.textContent = label;
    this.modeEl.className = `mode ${kind}`;
    this.posEl.textContent = `${vim.cursor.line + 1},${vim.cursor.col + 1}`;
  }

  // ------------------------------------------------------------- key repeat
  //
  // OS auto-repeat is not reliable across platforms (macOS press-and-hold,
  // focus quirks, kiosk browsers), so the game runs its own repeat loop and
  // ignores `e.repeat`. 300 ms delay, then 45 ms per step — Vim-ish.

  private startRepeat(key: string): void {
    this.stopRepeat();
    if (!/^.$/u.test(key)) return;
    this.repeatKey = key;
    this.repeatDelay = window.setTimeout(() => {
      this.repeatTimer = window.setInterval(() => {
        if (this.repeatKey === null || this.state !== 'playing' || this.ghosting) {
          this.stopRepeat();
          return;
        }
        this.repeating = true;
        const ok = this.session.feed(this.repeatKey);
        this.repeating = false;
        if (!ok) {
          this.stopRepeat();
          return;
        }
        this.dirty = true;
        this.updateHud();
      }, 50);
    }, 320);
  }

  /** Called on blur / visibility change: a held key must never stick. */
  stopRepeatNow(): void {
    this.stopRepeat();
  }

  private stopRepeat(): void {
    this.repeatKey = null;
    if (this.repeatDelay) window.clearTimeout(this.repeatDelay);
    if (this.repeatTimer) window.clearInterval(this.repeatTimer);
    this.repeatDelay = 0;
    this.repeatTimer = 0;
  }

  handleKeyUp(e: KeyboardEvent): void {
    const key = fromKeyboardEvent(e);
    if (key && key === this.repeatKey) this.stopRepeat();
  }

  private updateMatches(): void {
    if (!this.session.vim.lastSearch) {
      this.matches = [];
      return;
    }
    const ms = this.session.vim.searchMatches();
    if (!ms.length) {
      this.matches = [];
      return;
    }
    this.matches = ms.slice(0, 200).map((m) => {
      const p = this.session.vim.buf.pos(m.start);
      return { line: p.line, col: p.col, len: m.end - m.start };
    });
  }

  // ------------------------------------------------------------------ events

  private onEvent(e: SessionEvent): void {
    if (this.destroyed) return;
    switch (e.type) {
      case 'key':
        if (!this.repeating) this.host.sfx.tick(this.session.vim.cursor.line);
        break;
      case 'vim':
        this.onVimEvent(e.event);
        break;
      case 'damage':
        this.flash = 1;
        this.shake = 9;
        this.host.sfx.play('hurt');
        this.updateHud();
        this.coachStep = Math.max(this.coachStep, 1);
        this.showCoach(this.coachText(0));
        break;
      case 'lost':
        this.state = 'lost';
        this.hideCoach();
        this.showLost();
        break;
      case 'locked': {
        const ch = this.host.chapterForKey(e.key);
        const msg =
          this.host.lang === 'ko'
            ? `“${keyLabel(e.key)}” 은(는) ${ch ? `챕터 ${ch}에서` : '아직'} 열린다`
            : `“${keyLabel(e.key)}” unlocks${ch ? ` in chapter ${ch}` : ' later'}`;
        this.toast(msg, true);
        this.host.sfx.play('locked');
        this.coachStep = Math.max(this.coachStep, 1);
        this.showCoach(`${msg} · ${this.t('TAB for a hint', 'TAB 힌트')}`);
        break;
      }
      case 'message':
        break;
      case 'win':
        this.state = 'won';
        this.host.sfx.play('win');
        this.showResults(e.stars, e.keys, e.par);
        break;
    }
  }

  private onVimEvent(ev: { type: string; [k: string]: unknown }): void {
    this.dirty = true;
    if (ev.type === 'ex') {
      const cmd = String(ev.command ?? '').trim().toLowerCase();
      if (/^(q|q!|wq|wq!|x|x!|qa|qa!)$/.test(cmd)) {
        this.host.onExit();
        return;
      }
    }
    if (ev.type === 'change') {
      const before = String(ev.before ?? '');
      const after = String(ev.after ?? '');
      const b = before.split('\n');
      const a = after.split('\n');
      let line = 0;
      for (let i = 0; i < Math.max(b.length, a.length); i++) {
        if ((b[i] ?? '') !== (a[i] ?? '')) {
          line = i;
          break;
        }
      }
      const oldLine = b[line] ?? '';
      const newLine = a[line] ?? '';
      let col = 0;
      while (col < Math.min(oldLine.length, newLine.length) && oldLine[col] === newLine[col]) col++;
      const kind = String(ev.kind ?? '');
      const color = kind === 'delete' || kind === 'change' ? '#ef8f6a' : kind === 'put' || kind === 'insert' ? '#7ee0b4' : '#f2c14e';
      this.renderer.burst(line, Math.min(col, Math.max(0, newLine.length - 1)), 10, color);
      if (kind === 'delete' || kind === 'change') this.host.sfx.play('del');
      else if (kind === 'put' || kind === 'insert') this.host.sfx.play('ins');
      this.updateMatches();
      this.updateHud();
    }
    if (ev.type === 'yank') {
      this.host.sfx.play('yank');
      this.renderer.burst(this.session.vim.cursor.line, this.session.vim.cursor.col, 8, '#8fd0ff');
    }
    if (ev.type === 'search') {
      this.updateMatches();
      this.host.sfx.play('open');
    }
    if (ev.type === 'bell') this.host.sfx.play('locked');
  }

  // ------------------------------------------------------------------- input

  handleKey(e: KeyboardEvent): boolean {
    this.dirty = true;
    if (this.state === 'playing') {
      this.lastInputAt = performance.now();
      this.coachStep = 0;
      this.hideCoach();
    }
    if (e.repeat) {
      // Results is a scrolling list: a held j/PgDn must keep scrolling even
      // though the gameplay path swallows repeat events.
      if ((this.state === 'won' || this.state === 'lost') && this.scrollResults(e)) return true;
      return true; // our own repeat loop handles held keys
    }
    if (this.state === 'intro') {
      // The briefing is modal: any key first finishes the typing. Only once the
      // BEGIN prompt is live can a key start the chamber, and a short Enter
      // lock swallows the key that raced the reveal.
      if (!this.introReady) {
        if (!this.introTyped) {
          this.skipIntroTyping();
          return true;
        }
        // The brief is fully revealed but the prompt is still settling: Esc is
        // already the way out, everything else waits for BEGIN to appear.
        if (e.key === 'Escape') {
          this.host.onExit();
        }
        return true;
      }
      if (e.key === 'Enter' && performance.now() - this.introReadyAt < INTRO_READY_GUARD) return true;
      const fwd = e.key === 'j' || e.key === 'l' || e.key === 'ArrowDown' || e.key === 'ArrowRight';
      if (fwd || e.key === 'k' || e.key === 'h' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (this.actions) focusStep(this.actions, fwd ? 1 : -1);
        this.host.sfx.play(fwd ? 'move' : 'back');
        return true;
      }
      if (e.key === 'Enter') {
        if (this.actions && focusActivate(this.actions)) return true;
        this.begin();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      return true;
    }
    if (this.state === 'won' || this.state === 'lost') {
      // First key completes the short typed result line; it never blocks.
      this.resultsType?.finish();
      this.resultsType = null;
      // Scrolling keys drive the card (keyboard-only, no touch drag needed).
      if (this.scrollResults(e)) return true;
      // Focus lives on the actions: h/l or Tab move it, Enter activates.
      if (e.key === 'l' || e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        if (this.actions) focusStep(this.actions, 1);
        this.host.sfx.play('move');
        return true;
      }
      if (e.key === 'h' || e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        if (this.actions) focusStep(this.actions, -1);
        this.host.sfx.play('back');
        return true;
      }
      if (e.key === 'j' && this.state === 'lost') {
        if (this.actions) focusStep(this.actions, 1);
        return true;
      }
      if (e.key === 'k' && this.state === 'lost') {
        if (this.actions) focusStep(this.actions, -1);
        return true;
      }
      if (e.key === 'Enter') {
        if (this.actions && focusActivate(this.actions)) return true;
        if (this.state === 'won') this.host.onNext();
        else this.restart();
        return true;
      }
      if (e.key === 'Escape') {
        this.host.onExit();
        return true;
      }
      if (this.state === 'lost' && (e.key === 'r' || e.key === 'R')) {
        this.restart();
        return true;
      }
      return true;
    }
    if (this.exitPrompt) {
      if (e.key === 'Escape') {
        this.closeExit();
      } else if (e.key === 'h' || e.key === 'ArrowLeft') {
        if (this.exitActions) focusStep(this.exitActions, -1);
      } else if (e.key === 'l' || e.key === 'ArrowRight') {
        if (this.exitActions) focusStep(this.exitActions, 1);
      } else if (e.key === 'Enter') {
        if (this.exitActions) focusActivate(this.exitActions);
      }
      return true;
    }
    if (this.ghosting) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') this.ghostSkip = true;
      return true;
    }
    if (e.key === 'Tab') {
      // In insert/replace mode Tab is text, not the hint key. The engine
      // expands it to spaces up to the next tabstop (4).
      const mode = this.session.vim.mode;
      if (mode !== 'insert' && mode !== 'replace') {
        // First Tab completes a still-typing hint; only a finished hint page
        // advances to the next one.
        if (this.hintType && !this.hintType.done) this.hintType.finish();
        else this.showHint();
        return true;
      }
    }
    if (e.key === 'F2') {
      this.restart();
      return true;
    }
    if (e.key === 'F10') {
      this.openExit();
      return true;
    }
    if (e.key === 'F9' && this.host.canPrev) {
      this.host.onPrev?.();
      return true;
    }
    if (e.key === 'F3') {
      void this.playGhost();
      return true;
    }
    const key = fromKeyboardEvent(e);
    if (!key) return false;
    // Korean IME input is normally remapped to the physical Vim key in
    // fromKeyboardEvent (h←ㅗ, j←ㅓ …). This fallback only fires when the
    // browser reports a Hangul character without a mappable physical code.
    if (needsRemap(key)) {
      this.toast(this.host.lang === 'ko' ? '한/영 키로 영문 입력으로 바꿔라' : 'Switch your input to English', true);
      return true;
    }
    // A key first completes the hint's typing; the next one dismisses it.
    if (this.hintType && !this.hintType.done) this.hintType.finish();
    else this.hideHint();
    const accepted = this.session.feed(key);
    this.updateHud();
    this.showEcho(key);
    if (accepted) this.startRepeat(key);
    return true;
  }

  private showEcho(key: string): void {
    const vim = this.session.vim;
    if (vim.confirming && vim.confirmPrompt) {
      this.echo.textContent = vim.confirmPrompt;
      this.echo.classList.add('on');
      return;
    }
    if (vim.mode === 'insert' || vim.mode === 'replace') {
      // The statusline already says INSERT; do not echo the whole insert text.
      this.echo.classList.remove('on');
      return;
    }
    if (vim.mode === 'cmdline' || vim.mode === 'search') {
      const kind = vim.cmdKind ?? (vim.mode === 'search' ? '/' : ':');
      this.echo.textContent = `${kind}${vim.cmdline}`;
      this.echo.classList.add('on');
      return;
    }
    const pending = vim.awaitingKey ? vim.pendingCommand : '';
    const label = pending ? keyLabel(pending) : '';
    if (pending && pending.length > 0) {
      this.echo.textContent = label;
      this.echo.classList.add('on');
    } else {
      this.echo.classList.remove('on');
    }
  }

  private begin(): void {
    if (this.state !== 'intro' || !this.introReady) return;
    this.stopRepeat();
    this.state = 'playing';
    if (this.introPending) {
      window.clearTimeout(this.introPending);
      this.introPending = 0;
    }
    if (this.introRevealTimer) {
      window.clearTimeout(this.introRevealTimer);
      this.introRevealTimer = 0;
    }
    this.introType?.cancel();
    this.introType = null;
    // The briefing card and the buffer crossfade into each other: the board
    // wakes from the veil while the overlay fades away.
    this.dismissOverlay(200);
    this.board.classList.remove('veiled');
    this.board.classList.add('wake');
    this.actions = null;
    this.introActions = null;
    this.introPrimary = null;
    this.introCard = null;
    this.introPart = null;
    this.echo.classList.remove('on');
    this.hideCoach();
    this.lastInputAt = performance.now();
    this.coachStep = 0;
    this.host.sfx.play('whoosh');
    window.setTimeout(() => {
      if (!this.destroyed && this.state === 'playing') this.host.sfx.play('open');
    }, 90);
    this.updateHud();
    this.dirty = true;
  }

  private dismissOverlay(ms: number): void {
    const ov = this.overlay;
    this.overlay = null;
    if (!ov) return;
    ov.style.pointerEvents = 'none';
    if (this.reduced) {
      ov.remove();
      return;
    }
    ov.style.transition = 'opacity .18s ease';
    ov.style.opacity = '0';
    window.setTimeout(() => ov.remove(), ms);
  }

  restart(): void {
    if (this.ghosting) this.cancelGhost();
    this.stopRepeat();
    this.hideHint();
    this.session = this.session.restart();
    // Re-apply the gutter setting: restart() builds a fresh Vim with defaults.
    this.session.vim.number = this.host.lineNumbers === 'abs' || this.host.lineNumbers === 'both';
    this.session.vim.relativenumber = this.host.lineNumbers === 'rel' || this.host.lineNumbers === 'both';
    this.state = 'playing';
    this.resultsType?.cancel();
    this.resultsType = null;
    this.resultsCard = null;
    this.overlay?.remove();
    this.overlay = null;
    this.echo.classList.remove('on');
    this.hintLevel = 0;
    this.flash = 0;
    this.shake = 0;
    this.ghostTween = null;
    this.matches = [];
    this.hideCoach();
    this.lastInputAt = performance.now();
    this.coachStep = 0;
    this.host.sfx.play('undo');
    this.fit();
    this.updateHud();
  }

  // -------------------------------------------------------------------- loop

  private loop = (t: number): void => {
    if (this.destroyed) return;
    const dt = Math.min(64, t - this.lastT || 16);
    this.lastT = t;
    this.flash = Math.max(0, this.flash - dt / 320);
    this.shake = Math.max(0, this.shake - dt / 40);
    if (this.state === 'playing' && !this.ghosting) this.tickCoach(t);
    // Idle frames cost nothing: no keys, no particles, no flash => no draw.
    const blink = Math.floor(t / 530) % 2;
    const tweening = !!this.ghostTween && t < this.ghostTween.start + 180;
    const busy = this.dirty || this.ghosting || this.flash > 0 || this.shake > 0 || this.renderer.busy || tweening || blink !== this.lastBlink;
    if (!busy) {
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    this.dirty = false;
    this.lastBlink = blink;
    const vim = this.session.vim;
    const sel = vim.selection();
    let cursorDraw = undefined;
    if (this.ghostTween) {
      const p = Math.min(1, Math.max(0, (t - this.ghostTween.start) / 180));
      const e = p * p * (3 - 2 * p);
      cursorDraw = {
        line: this.ghostTween.from.line + (this.ghostTween.to.line - this.ghostTween.from.line) * e,
        col: this.ghostTween.from.col + (this.ghostTween.to.col - this.ghostTween.from.col) * e,
      };
      if (p >= 1) this.ghostTween = null;
    }
    this.renderer.render(
      {
        version: vim.buf.version,
        lines: vim.buf.lines,
        cursor: vim.cursor,
        cursorDraw,
        mode: vim.mode,
        sel: sel ? { start: sel.start, end: sel.end, linewise: !!sel.linewise, block: sel.block } : null,
        matches: this.matches,
        collected: this.session.collected,
        goalChar: '*',
        coinChar: '$',
        hazard: this.session.hazardChars,
        ghost: !this.ghosting && this.hintLevel >= 3 && this.host.stage.solution ? this.ghostHint() : null,
        flash: this.flash,
        shake: this.shake,
        numbers: this.numberMode(),
      },
      t,
    );
    this.raf = requestAnimationFrame(this.loop);
  };

  private numberMode(): 'off' | 'abs' | 'rel' | 'both' {
    const vim = this.session.vim;
    if (!vim.number && !vim.relativenumber) return 'off';
    if (vim.number && vim.relativenumber) return 'both';
    return vim.relativenumber ? 'rel' : 'abs';
  }

  private ghostHint(): { line: number; col: number; len: number } | null {
    const sol = this.host.stage.solution;
    if (!sol) return null;
    const keys = tokenize(sol);
    const n = Math.min(this.hintLevel - 3, keys.length - 1);
    if (n < 0) return null;
    return { line: this.session.vim.cursor.line, col: this.session.vim.cursor.col, len: Math.max(1, keys.length - n) };
  }

  // ----------------------------------------------------------------- overlays

  private showIntro(): void {
    const { stage, chapter, lang, stageIndex, stageCount } = this.host;
    const taught = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .slice(0, 4);
    const why = stage.whisper
      ? KO(stage.whisper, lang)
      : taught[0]
        ? KO(taught[0].desc, lang)
        : lang === 'ko'
          ? '이 챔버를 정화하면 다음 섹터가 열린다.'
          : 'Clear this chamber to open the next sector.';
    const lesson = h(
      'div',
      { class: 'lesson' },
      h('div', { class: 'kicker' }, lang === 'ko' ? '배우는 것' : 'LEARN'),
      taught.length
        ? h(
            'div',
            {},
            ...taught.map((c) =>
              h(
                'div',
                { class: 'lesson-row' },
                h('code', {}, c.keys),
                h('span', { class: 'name' }, KO(c.name, lang)),
                h('span', { class: 'desc' }, KO(c.desc, lang)),
              ),
            ),
          )
        : h(
            'div',
            { class: 'lesson-row' },
            h('code', {}, '—'),
            h('span', { class: 'name' }, lang === 'ko' ? '섹터 복구' : 'SECTOR REPAIR'),
            h('span', { class: 'desc' }, goalLabel(stage.goal, lang)),
          ),
      h('div', { class: 'why' }, why),
    );
    const brief = KO(stage.brief, lang);
    const typed = this.typed(brief);
    this.introPart = typed;
    this.introText = brief;
    // The action row is reserved but empty until the brief finishes typing: no
    // BEGIN button exists to focus, click or accidentally Enter through while
    // the card is still animating.
    this.introActions = h('div', {
      class: 'actions',
      style: { minHeight: '36px', opacity: '0', pointerEvents: 'none', transition: 'opacity .18s ease' },
    });
    const card = h(
      'div',
      { class: 'card intro-card' },
      h('div', { class: 'sigil-ghost' }, chapter.sigil),
      h('div', { class: 'eyebrow' }, `${lang === 'ko' ? '층' : 'FLOOR'} ${String(chapter.index).padStart(2, '0')} · ${KO(chapter.title, lang)} · ${stageIndex + 1}/${stageCount}`),
      h('h2', {}, KO(stage.name, lang)),
      h('div', { class: 'brief ko' }, typed.shell),
      this.host.firstTime
        ? h(
            'div',
            { class: 'firsttime' },
            h('b', {}, this.t('NEW TO VIM?', 'VIM이 처음인가요?')),
            this.t(
              'You are in NORMAL mode. h j k l move, i types, Esc comes back. Enter starts.',
              '지금은 NORMAL 모드다. h j k l로 움직이고, i로 입력하고, Esc로 돌아온다. Enter로 시작한다.',
            ),
          )
        : null,
      lesson,
      h(
        'div',
        { class: 'facts' },
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '목표' : 'GOAL'), h('div', { class: 'v' }, goalLabel(stage.goal, lang))),
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '클리어' : 'CLEAR'), h('div', { class: 'v' }, clearLabel(stage.goal, lang))),
        h('div', { class: 'fact' }, h('div', { class: 'k' }, lang === 'ko' ? '3별 기준' : 'PAR'), h('div', { class: 'v' }, `${stage.par} ${lang === 'ko' ? '키' : 'keys'}`)),
      ),
      this.introActions,
    );
    const overlay = h('div', { class: 'overlay' }, card);
    // A tap/click anywhere on the briefing skips the typing, never starts it.
    overlay.addEventListener('pointerdown', () => this.skipIntroTyping());
    this.overlay = overlay;
    this.introCard = card;
    this.root.append(overlay);
    this.armIntroTyping();
  }

  /** Build a block that reserves its final text while a prefix types in. */
  private typed(text: string): { shell: HTMLElement; layer: HTMLElement } {
    const layer = h('span', { class: 'type-layer', style: { position: 'absolute', inset: '0', display: 'block' } });
    const shell = h(
      'div',
      { class: 'type-shell', style: { position: 'relative' } },
      h('span', { style: { visibility: 'hidden' } }, text),
      layer,
    );
    return { shell, layer };
  }

  /**
   * Reserve the block's final size from the invisible measuring span, then
   * empty it so the DOM only ever contains the typed prefix (an audit or a
   * screen reader must never see the full text twice).
   */
  private reserveTyped(part: { shell: HTMLElement; layer: HTMLElement }): void {
    const hidden = part.shell.firstElementChild as HTMLElement | null;
    const r = part.shell.getBoundingClientRect();
    if (r.width > 0) part.shell.style.width = `${Math.ceil(r.width)}px`;
    if (r.height > 0) part.shell.style.minHeight = `${Math.ceil(r.height)}px`;
    if (hidden) hidden.textContent = '';
  }

  private startTyped(part: { shell: HTMLElement; layer: HTMLElement }, text: string, opts: TypingOpts): Typing | null {
    this.reserveTyped(part);
    if (this.reduced) {
      part.layer.textContent = text;
      opts.onDone?.();
      return null;
    }
    return new Typing(part.layer, text, opts);
  }

  private armIntroTyping(): void {
    this.introShownAt = performance.now();
    if (this.reduced) {
      if (this.introPart) {
        this.reserveTyped(this.introPart);
        this.introPart.layer.textContent = this.introText;
      }
      this.markIntroReady();
      return;
    }
    // Let the card land (intro-pop) before the keyboard starts.
    this.introPending = window.setTimeout(() => {
      this.introPending = 0;
      if (this.destroyed || this.state !== 'intro') return;
      const part = this.introPart;
      if (!part) return;
      this.reserveTyped(part);
      this.introType = new Typing(part.layer, this.introText, {
        startDelay: 0,
        tickEvery: 4,
        onTick: () => this.host.sfx.play('type'),
        onDone: () => this.armIntroReveal(),
      });
    }, 300);
  }

  /**
   * Reveal BEGIN once the brief is complete, with a short settle beat. A key
   * that skips the typing must not also start the chamber in the same motion:
   * the minimum dwell swallows a mashed Enter before the prompt even exists.
   */
  private armIntroReveal(): void {
    if (this.introRevealTimer || this.introReady || this.state !== 'intro') return;
    this.introTyped = true;
    const elapsed = performance.now() - this.introShownAt;
    const wait = Math.max(120, INTRO_MIN_DWELL - elapsed);
    this.introRevealTimer = window.setTimeout(() => {
      this.introRevealTimer = 0;
      this.markIntroReady();
    }, wait);
  }

  /** Any key or tap: reveal the full brief and arm the BEGIN prompt. */
  private skipIntroTyping(): void {
    if (this.state !== 'intro' || this.introReady) return;
    if (this.introPending) {
      window.clearTimeout(this.introPending);
      this.introPending = 0;
    }
    if (this.introType) {
      const typing = this.introType;
      this.introType = null;
      typing.finish(); // onDone -> armIntroReveal
      return;
    }
    if (this.introPart) {
      this.reserveTyped(this.introPart);
      this.introPart.layer.textContent = this.introText;
    }
    this.armIntroReveal();
  }

  private markIntroReady(): void {
    if (this.introReady || this.state !== 'intro') return;
    this.introReady = true;
    this.introReadyAt = performance.now();
    const card = this.introCard;
    const actions = this.introActions;
    if (actions && card) {
      const lang = this.host.lang;
      actions.append(
        h('button', { class: 'btn primary', onclick: () => this.begin() }, lang === 'ko' ? '시작' : 'BEGIN', h('kbd', {}, '↵')),
        h('button', { class: 'btn', onclick: () => this.host.onExit() }, lang === 'ko' ? '나가기' : 'LEAVE'),
      );
      this.actions = focusGroup(card);
      focusIndex(this.actions, 0);
      this.introPrimary = actions.firstElementChild as HTMLElement | null;
      actions.style.opacity = '1';
      actions.style.pointerEvents = 'auto';
      const primary = this.introPrimary;
      primary?.classList.add('primed');
      if (!this.reduced) window.setTimeout(() => primary?.classList.remove('primed'), 3200);
    }
    this.host.sfx.play('select');
  }

  /**
   * Results overlay is a keyboard scroller: j/k, Ctrl-d/u, PgUp/PgDn, g/G,
   * Home/End move the card. Returns false when the key is not a scroll key.
   */
  private scrollResults(e: KeyboardEvent): boolean {
    const card = this.resultsCard;
    if (!card) return false;
    const page = Math.max(140, Math.round(card.clientHeight * 0.85));
    let delta: number | null = null;
    if (e.key === 'j' || e.key === 'ArrowDown') delta = 64;
    else if (e.key === 'k' || e.key === 'ArrowUp') delta = -64;
    else if (e.key === 'PageDown' || e.key === ' ' || (e.key === 'd' && e.ctrlKey) || (e.key === 'D' && e.ctrlKey)) delta = page;
    else if (e.key === 'PageUp' || (e.key === 'u' && e.ctrlKey) || (e.key === 'U' && e.ctrlKey)) delta = -page;
    else if (e.key === 'g' || e.key === 'Home') { card.scrollTop = 0; this.host.sfx.play('move'); return true; }
    else if (e.key === 'G' || e.key === 'End') { card.scrollTop = card.scrollHeight; this.host.sfx.play('move'); return true; }
    if (delta === null) return false;
    card.scrollTop += delta;
    this.host.sfx.play('move');
    return true;
  }

  private showResults(stars: Stars, keys: number, par: number): void {
    this.hideCoach();
    this.hideHint();
    const { stage, lang, chapter } = this.host;
    const starEls = [0, 1, 2].map((i) => h('span', { class: i < stars ? 'on' : '' }, '★'));
    const learned = (stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id))
      .filter(Boolean)
      .slice(0, 4);
    const drillText = keys <= par
      ? this.t('GOLF — par. DRILL it once more; the hand remembers what the head forgets.', 'GOLF — par. 한 번 더 반복하라. 머리가 잊은 것을 손이 기억한다.')
      : this.t(`GOLF — +${keys - par} key${keys - par === 1 ? '' : 's'} over par. RETRY and close the gap.`, `GOLF — par보다 ${keys - par}키 많음. RETRY로 격차를 좁혀라.`);
    const drill = this.typed(drillText);
    const card = h(
      'div',
      { class: 'card results-card' },
      h('div', { class: 'res-head' }, h('div', { class: 'eyebrow' }, lang === 'ko' ? '챔버 정화 완료' : 'CHAMBER CLEARED')),
      h('div', { class: 'stars-big' }, ...starEls),
      h(
        'div',
        { class: 'res-keys' },
        h('b', {}, String(keys)),
        lang === 'ko' ? ` 키  ·  3별 기준 ${par}` : ` keys  ·  par ${par}`,
        this.host.bestKeys !== null ? (lang === 'ko' ? `  ·  최고 ${this.host.bestKeys}` : `  ·  best ${this.host.bestKeys}`) : '',
      ),
      h('div', { class: 'res-drill' }, drill.shell),
      learned.length
        ? h(
            'div',
            { class: 'learned' },
            h('div', { class: 'kicker', style: { marginBottom: '4px' } }, 'SKILL UNLOCKED'),
            ...learned.map((c) =>
              h('div', { class: 'item' }, h('code', {}, c!.keys), h('span', {}, lang === 'ko' ? c!.name.ko : c!.name.en), h('span', { style: { marginLeft: 'auto', opacity: '0.6' } }, lang === 'ko' ? c!.desc.ko : c!.desc.en)),
            ),
          )
        : null,
      h('div', { class: 'rule' }),
      h(
        'div',
        { class: 'actions' },
        // Over-par clears put GOLF/RETRY first: the next repetition should be
        // the obvious action, not a victory lap.
        keys > par
          ? h('button', { class: 'btn primary', onclick: () => this.restart() }, lang === 'ko' ? 'GOLF RETRY' : 'GOLF RETRY')
          : h('button', { class: 'btn primary', onclick: () => this.host.onNext() }, lang === 'ko' ? '다음' : 'NEXT', h('kbd', {}, '↵')),
        keys > par
          ? h('button', { class: 'btn', onclick: () => this.host.onNext() }, lang === 'ko' ? '다음' : 'NEXT', h('kbd', {}, '↵'))
          : h('button', { class: 'btn', onclick: () => this.restart() }, lang === 'ko' ? '다시' : 'RETRY'),
        this.host.canPrev ? h('button', { class: 'btn', onclick: () => this.host.onPrev?.() }, lang === 'ko' ? '이전' : 'PREV') : null,
        this.host.canSave ? h('button', { class: 'btn', onclick: () => { this.host.onSave?.(); this.host.sfx.play('yank'); } }, lang === 'ko' ? '저장' : 'SAVE') : null,
        h('button', { class: 'btn', onclick: () => this.host.onExit() }, `${lang === 'ko' ? '챕터' : 'CHAPTER'} ${String(chapter.index).padStart(2, '0')}`),
      ),
      h('div', { class: 'res-hint' }, this.t('J/K · PgUp/PgDn scroll · H/L move · Enter choose', 'J/K · PgUp/PgDn 스크롤 · H/L 이동 · Enter 선택')),
    );
    this.resultsType?.cancel();
    this.resultsType = null;
    this.overlay?.remove();
    this.overlay = h('div', { class: 'overlay' }, card);
    this.root.append(this.overlay);
    this.resultsCard = card;
    this.resultsType = this.startTyped(drill, drillText, { base: 13, tickEvery: 9, startDelay: 140 });
    this.actions = focusGroup(card);
    focusIndex(this.actions, 0);
    this.host.onWin(stars, keys, par);
    // Remember the staggered star cue so a fast NEXT/RETRY does not leak it
    // into the next chamber.
    for (let i = 0; i < stars; i++) {
      this.starTimers.push(window.setTimeout(() => this.host.sfx.play('star', i * 0.08), 260 + i * 220));
    }
  }

  private showLost(): void {
    this.hideCoach();
    this.hideHint();
    const { lang } = this.host;
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'eyebrow' }, lang === 'ko' ? '정전기에 삼켜졌다' : 'THE STATIC TOOK YOU'),
      h('h2', {}, lang === 'ko' ? '다시, 천천히' : 'Again, slower'),
      h('div', { class: 'brief ko' }, lang === 'ko' ? '정전기는 밟으면 아프다. t는 문자 앞에서 멈추고, f는 그 위에 착지한다.' : 'Static bites when you land on it. t stops before a character; f lands on it.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => this.restart() }, lang === 'ko' ? '재시작' : 'RETRY', h('kbd', {}, '↵'))),
    );
    this.resultsCard = null;
    this.resultsType = null;
    this.overlay?.remove();
    this.overlay = h('div', { class: 'overlay' }, card);
    this.root.append(this.overlay);
    this.actions = focusGroup(card);
    focusIndex(this.actions, 0);
  }

  private lessonKeys(): string {
    return (this.host.stage.teaches ?? [])
      .map((id) => COMMAND_BY_ID.get(id)?.keys)
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
  }

  /** Help that arrives without being asked, because a beginner is stuck. */
  private coachText(level: number): string {
    const { stage, lang } = this.host;
    const hints = stage.hints ?? [];
    if (level === 0) {
      if (hints[0]) return KO(hints[0], lang);
      const keys = this.lessonKeys();
      return keys
        ? this.t(`Try ${keys} — that is the lesson of this chamber.`, `${keys} 를 써 봐. 이 챔버의 교훈이야.`)
        : this.t('Press TAB for a hint, or F1 for the 60-second primer.', 'TAB으로 힌트를, F1으로 60초 입문을 봐.');
    }
    if (level === 1) {
      if (hints[1]) return KO(hints[1], lang);
      const keys = this.lessonKeys();
      return keys
        ? this.t(`The intended keys are ${keys}.`, `의도된 키는 ${keys} 이야.`)
        : this.t('Read the goal again, then try one small motion.', '목표를 다시 읽고, 작은 모션 하나부터 해 봐.');
    }
    return this.t(
      'Still stuck? TAB for another hint · F3 to watch the ghost · F1 for the primer.',
      '아직 막혔어? TAB으로 다음 힌트 · F3로 고스트 · F1으로 입문.',
    );
  }

  private tickCoach(t: number): void {
    if (!this.lastInputAt) return;
    // Auto-repeat feeds the session directly, so a held key must also count as
    // activity or the coach would pop up while the player is moving.
    if (this.repeating) this.lastInputAt = t;
    const idle = t - this.lastInputAt;
    const first = !!this.host.firstTime;
    if (this.coachStep === 0 && idle > (first ? 6000 : 9000)) {
      this.showCoach(this.coachText(0));
      this.coachStep = 1;
    } else if (this.coachStep === 1 && idle > (first ? 15000 : 24000)) {
      this.showCoach(this.coachText(1));
      this.coachStep = 2;
    } else if (this.coachStep === 2 && idle > (first ? 30000 : 45000)) {
      this.showCoach(this.coachText(2));
      this.coachStep = 3;
    }
  }

  private showCoach(text: string): void {
    if (this.state !== 'playing' || this.ghosting) return;
    this.hideCoach();
    // One help widget at a time: a coach that arrives while a hint is open
    // replaces it instead of stacking two floating panels over the buffer.
    this.hideHint();
    const typed = this.typed(text);
    this.coachEl = h(
      'div',
      { class: 'coach' },
      h('div', { class: 'coach-k' }, this.t('COACH', '코치')),
      h('div', { class: 'coach-t' }, typed.shell),
      h('div', { class: 'coach-h' }, this.t('TAB more · F1 help', 'TAB 더 · F1 도움')),
    );
    this.root.append(this.coachEl);
    this.host.sfx.play('brush');
    this.coachType = this.startTyped(typed, text, { base: 15 });
  }

  private hideCoach(): void {
    this.coachType?.cancel();
    this.coachType = null;
    this.coachEl?.remove();
    this.coachEl = null;
  }

  private openExit(): void {
    if (this.exitPrompt) return;
    if (this.ghosting) this.cancelGhost();
    this.hideHint();
    const lang = this.host.lang;
    const card = h(
      'div',
      { class: 'card' },
      h('div', { class: 'eyebrow' }, 'LEAVE'),
      h('h2', {}, lang === 'ko' ? '챔버를 떠난다' : 'Leave this chamber?'),
      h('div', { class: 'brief ko' }, lang === 'ko' ? '진행은 저장된다. 나가려면 LEAVE를 선택해라.' : 'Your progress is saved. Choose LEAVE to exit.'),
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => this.closeExit() }, lang === 'ko' ? '취소' : 'CANCEL', h('kbd', {}, 'Esc')),
        h('button', { class: 'btn', onclick: () => { this.closeExit(); this.host.onExit(); } }, lang === 'ko' ? '나가기' : 'LEAVE'),
      ),
    );
    this.exitPrompt = h('div', { class: 'overlay' }, card);
    this.root.append(this.exitPrompt);
    this.exitActions = focusGroup(card);
    focusIndex(this.exitActions, 0);
  }

  private closeExit(): void {
    this.exitPrompt?.remove();
    this.exitPrompt = null;
    this.exitActions = null;
    this.host.sfx.play('back');
  }

  private showHint(): void {
    if (this.state !== 'playing' || this.ghosting) return;
    this.lastInputAt = performance.now();
    this.coachStep = Math.max(this.coachStep, 1);
    this.hideCoach();
    const { stage, lang } = this.host;
    const hints = stage.hints ?? [];
    const text =
      this.hintLevel < hints.length
        ? KO(hints[this.hintLevel], lang)
        : this.hintLevel === hints.length
          ? lang === 'ko'
            ? '고스트를 보려면 F3. 정답의 손놀림을 처음부터 보여준다.'
            : 'Press F3 to watch the ghost replay the intended keys.'
          : lang === 'ko'
            ? '이미 모든 힌트를 봤다. F3으로 고스트를 봐.'
            : 'No more hints. F3 plays the ghost.';
    this.hintLevel++;
    this.hideHint();
    const typed = this.typed(text);
    // The default `.hint-pop` sits over the objective bar; lift it above the
    // statusline/objective/cmdline stack so the goal text stays readable.
    const box = h('div', { class: 'hint-pop ko', style: { bottom: '104px' } }, typed.shell);
    this.hintBox = box;
    this.root.append(box);
    this.host.sfx.play('hint');
    const startHide = (): void => {
      // A replaced hint (new Tab) must not be removed by the old timer.
      if (this.hintBox !== box) return;
      if (this.hintTimer) window.clearTimeout(this.hintTimer);
      this.hintTimer = window.setTimeout(() => {
        this.hintTimer = 0;
        if (this.hintBox === box) this.hideHint();
      }, 7000);
    };
    this.hintType = this.startTyped(typed, text, { base: 16, onDone: startHide });
  }

  private hideHint(): void {
    this.hintType?.cancel();
    this.hintType = null;
    if (this.hintTimer) {
      window.clearTimeout(this.hintTimer);
      this.hintTimer = 0;
    }
    this.hintBox?.remove();
    this.hintBox = null;
  }

  async playGhost(): Promise<void> {
    if (this.ghosting || this.destroyed || this.state !== 'playing') return;
    const sol = this.host.stage.solution;
    if (!sol) return;
    // Replay on a fresh session seeded from the stage's initial text, never
    // from the player's edited buffer. The live session object is kept aside
    // untouched and put back verbatim afterwards.
    const live = this.session;
    const demo = new Session({
      stage: this.host.stage,
      chapterIndex: this.host.chapter.index - 1,
      allowed: this.host.allowed,
    });
    demo.demo = true;
    demo.chapterForKey = this.host.chapterForKey;
    demo.vim.number = this.host.lineNumbers === 'abs' || this.host.lineNumbers === 'both';
    demo.vim.relativenumber = this.host.lineNumbers === 'rel' || this.host.lineNumbers === 'both';
    // Every start/cancel gets its own id; an older loop can never restore or
    // touch the session after a restart/skip/exit raced it.
    const run = ++this.ghostRun;
    this.ghostLive = live;
    this.stopRepeat();
    this.hideHint();
    this.hideCoach();
    this.ghosting = true;
    this.ghostSkip = false;
    this.session = demo;
    this.echo.classList.remove('on');
    // The demo's version counter starts in the same numeric range as the live
    // buffer's, so a composite frame baked for the live session could be
    // reused for a different buffer (the cache is keyed by version). resize()
    // resets that cache and forces a fresh paint.
    this.fit();
    this.ghostTicker = h('span', { class: 'ghost-ticker' }, '');
    this.ghostProgress = h('span', { class: 'ghost-progress' }, '');
    this.overlay = h(
      'div',
      { class: 'overlay ghost-overlay', style: { background: 'transparent', pointerEvents: 'none' } },
      h(
        'div',
        { class: 'ghost-hud' },
        h('span', { class: 'eyebrow' }, 'GHOST'),
        this.ghostTicker,
        this.ghostProgress,
        h('button', { class: 'chip', style: { pointerEvents: 'auto' }, onclick: () => { this.ghostSkip = true; } }, this.t('SKIP · Esc', '스킵 · Esc')),
      ),
    );
    this.root.append(this.overlay);
    this.host.sfx.play('ghost');
    const keys = tokenize(sol);
    for (let i = 0; i < keys.length; i++) {
      if (this.destroyed || run !== this.ghostRun) return;
      if (this.ghostSkip) {
        // Skip the animation but still reach the final state: the player wants
        // to see the clear result, not a half-played buffer.
        for (let j = i; j < keys.length; j++) {
          this.session.feed(keys[j]);
          this.updateMatches();
          this.updateHud();
          this.dirty = true;
        }
        break;
      }
      const from = { ...this.session.vim.cursor };
      this.session.feed(keys[i]);
      const to = { ...this.session.vim.cursor };
      this.ghostTween = { from, to, start: performance.now() };
      this.updateMatches();
      this.updateHud();
      this.dirty = true;
      if (this.ghostTicker) {
        const next = keys.slice(i + 1, i + 7).map((k) => keyLabel(k)).join(' ');
        this.ghostTicker.textContent = next || '…';
      }
      if (this.ghostProgress) this.ghostProgress.textContent = `${i + 1}/${keys.length}`;
      await new Promise((r) => setTimeout(r, 180));
    }
    if (this.destroyed || run !== this.ghostRun) return;
    // Hold the actual final state on screen. This is the result preview the
    // player asked for: the solution's target, not just prose.
    this.ghostSkip = false;
    this.ghostTween = null;
    if (this.ghostTicker) {
      this.ghostTicker.textContent = this.host.lang === 'ko' ? '이것이 클리어 상태다' : 'This is the cleared state';
    }
    if (this.ghostProgress) this.ghostProgress.textContent = 'CLEAR';
    this.host.sfx.play('chime');
    for (let waited = 0; waited < 1400 && !this.ghostSkip && !this.destroyed && run === this.ghostRun; waited += 50) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (this.destroyed || run !== this.ghostRun) return;
    this.restoreLive();
    this.toast(this.host.lang === 'ko' ? '이제 네 차례' : 'Now you', false);
  }

  /** Abort an in-flight ghost and put the live session back at once. */
  private cancelGhost(): void {
    this.ghostRun++;
    if (this.ghosting || this.ghostLive) this.restoreLive();
  }

  /**
   * Put the untouched live session back and clean every trace of the demo:
   * overlay, HUD references, tween, coach timer, echo and renderer cache.
   */
  private restoreLive(): void {
    const live = this.ghostLive;
    this.ghostLive = null;
    this.ghosting = false;
    this.ghostSkip = false;
    this.ghostTween = null;
    this.ghostTicker = null;
    this.ghostProgress = null;
    this.overlay?.remove();
    this.overlay = null;
    if (live) this.session = live;
    // Force a fresh composite frame: the last demo frame is cached under a
    // version number the live session may share.
    this.fit();
    this.updateHud();
    this.showEcho('');
    this.hideCoach();
    this.lastInputAt = performance.now();
    this.coachStep = 0;
    this.dirty = true;
  }

  private toast(msg: string, bad: boolean): void {
    // Toasts are a single slot: a new cue replaces the old one instead of
    // stacking two absolutely positioned boxes on the same pixel.
    for (const old of Array.from(this.root.querySelectorAll('.toast'))) old.remove();
    const t = h('div', { class: `toast${bad ? ' locked' : ''}` }, msg);
    this.root.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  destroy(): void {
    this.stopRepeat();
    this.destroyed = true;
    this.ghostRun++;
    if (this.introPending) window.clearTimeout(this.introPending);
    if (this.introRevealTimer) window.clearTimeout(this.introRevealTimer);
    this.introType?.cancel();
    this.introType = null;
    this.resultsType?.cancel();
    this.resultsType = null;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.overlay?.remove();
    this.exitPrompt?.remove();
    this.hideCoach();
    this.hideHint();
    for (const id of this.starTimers) window.clearTimeout(id);
    this.starTimers = [];
  }
}
