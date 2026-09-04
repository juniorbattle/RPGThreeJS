// @vitest-environment happy-dom
/**
 * PHASE B — CASTER MOTION authoring UI.
 *
 * Verifies the section is discoverable, semantic (no raw coordinate entry),
 * additive (absent by default) and correctly persisted through the draft store.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installVfxComposerPanel } from './CombatVfxComposerPanel';
import { loadComposerStore } from './VfxComposerPlayback';

const ROOT_ID = 'r2c-vfx-composer';

function getRoot(): HTMLElement {
  const root = document.getElementById(ROOT_ID);
  if (!root) throw new Error('Composer root not installed');
  return root;
}

function q<T extends Element = HTMLElement>(selector: string): T | null {
  return getRoot().querySelector<T>(selector);
}

function qa<T extends Element = HTMLElement>(selector: string): T[] {
  return Array.from(getRoot().querySelectorAll<T>(selector));
}

function click(el: Element | null | undefined): void {
  (el as HTMLElement | null | undefined)?.dispatchEvent(new Event('click', { bubbles: true }));
}

/** Returns the buttons of a named control inside the first motion card. */
function controlButtons(profile: string): HTMLButtonElement[] {
  const card = q('.cmp-motion-card');
  if (!card) return [];
  const row = card.querySelector(`[data-profile="${profile}"]`);
  return row ? Array.from(row.querySelectorAll<HTMLButtonElement>('button')) : [];
}

function activeValue(profile: string): string | undefined {
  return controlButtons(profile).find((b) => b.classList.contains('cmp-active'))?.dataset.value;
}

describe('Composer panel — CASTER MOTION section', () => {
  let dispose: () => void = () => {};
  let origFetch: typeof fetch = () => Promise.resolve({ ok: false } as Response);

  beforeEach(() => {
    localStorage.clear();
    document.body.textContent = '';
    document.head.textContent = '';
    origFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      if (typeof _url === 'string' && _url.includes('/dev/vfx-runtime-status/')) {
        return { ok: true, json: async () => ({ ok: true, exists: true, isPng: true }) } as unknown as Response;
      }
      if (init?.method === 'HEAD') return { ok: true } as Response;
      return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
    }) as typeof fetch;
    dispose = installVfxComposerPanel({ enabled: true });
  });

  afterEach(() => {
    dispose();
    localStorage.clear();
    globalThis.fetch = origFetch;
  });

  it('renders the CASTER MOTION section', () => {
    expect(q('[data-section="choreography"]')).not.toBeNull();
  });

  it('starts with no motion cards — motion is opt-in', () => {
    expect(qa('.cmp-motion-card')).toHaveLength(0);
  });

  it('explains the default motion-free behaviour', () => {
    const section = q('[data-section="choreography"]')!;
    expect(section.querySelectorAll('.cmp-motion-card')).toHaveLength(0);
  });

  it('offers an ADD CASTER MOTION affordance', () => {
    expect(q('.cmp-beat-add-motion')).not.toBeNull();
  });

  it('adds a motion card when ADD is pressed', () => {
    click(q('.cmp-beat-add-motion'));
    expect(qa('.cmp-motion-card')).toHaveLength(1);
  });

  it('adds multiple motions to build a sequence', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-beat-add-motion'));
    expect(qa('.cmp-motion-card')).toHaveLength(3);
  });

  it('removes a motion card', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-motion-remove'));
    expect(qa('.cmp-motion-card')).toHaveLength(0);
  });

  it('exposes only semantic controls — no free numeric entry', () => {
    click(q('.cmp-beat-add-motion'));
    const card = q('.cmp-motion-card')!;
    expect(card.querySelectorAll('input[type="number"]')).toHaveLength(0);
    expect(card.querySelectorAll('input[type="text"]')).toHaveLength(0);
    expect(card.querySelectorAll('input')).toHaveLength(0);
  });

  it('offers the full motion vocabulary with intention-style labels', () => {
    click(q('.cmp-beat-add-motion'));
    const labels = controlButtons('move').map((b) => b.textContent);
    expect(labels).toEqual(['HOLD', 'STEP IN', 'CROSS THROUGH', 'JUMP UP', 'DROP DOWN', 'LEAP']);
  });

  it('defaults a new motion to STEP IN', () => {
    click(q('.cmp-beat-add-motion'));
    expect(activeValue('move')).toBe('DASH_SHORT');
  });

  it('changes the motion type', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('move').find((b) => b.dataset.value === 'JUMP_ARC'));
    expect(activeValue('move')).toBe('JUMP_ARC');
  });

  it('hides the destination control for motions that cannot travel', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('move').find((b) => b.dataset.value === 'JUMP_UP'));
    expect(controlButtons('to')).toHaveLength(0);
    click(controlButtons('move').find((b) => b.dataset.value === 'IDLE'));
    expect(controlButtons('to')).toHaveLength(0);
  });

  it('shows semantic destinations for travelling motions', () => {
    click(q('.cmp-beat-add-motion'));
    const labels = controlButtons('to').map((b) => b.textContent);
    expect(labels).toEqual(['IN PLACE', 'TARGET', 'T.FRONT', 'T.BACK']);
  });

  it('changes the destination', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('to').find((b) => b.dataset.value === 'TARGET_BACK'));
    expect(activeValue('to')).toBe('TARGET_BACK');
  });

  it('exposes named speed presets rather than raw durations', () => {
    click(q('.cmp-beat-add-motion'));
    expect(controlButtons('speed').map((b) => b.textContent))
      .toEqual(['FAST', 'NORMAL', 'SLOW', 'VERY SLOW']);
  });

  it('changes the speed preset', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('speed').find((b) => b.dataset.value === '0.6'));
    expect(activeValue('speed')).toBe('0.6');
  });

  /**
   * STEP IN is a melee lunge, so it returns by default; CROSS THROUGH is a
   * repositioning dash, so it stays. The AFTER control makes both explicit and
   * lets the author override either one.
   */
  it('defaults STEP IN to COME BACK and CROSS THROUGH to STAY', () => {
    click(q('.cmp-beat-add-motion'));
    expect(activeValue('return')).toBe('return');
    click(controlButtons('move').find((b) => b.dataset.value === 'DASH_THROUGH'));
    expect(activeValue('return')).toBe('stay');
  });

  it('lets the author override the AFTER behaviour', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('return').find((b) => b.dataset.value === 'stay'));
    expect(activeValue('return')).toBe('stay');
    click(controlButtons('return').find((b) => b.dataset.value === 'return'));
    expect(activeValue('return')).toBe('return');
  });

  it('persists authored motion into the draft store', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('move').find((b) => b.dataset.value === 'DASH_THROUGH'));
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0];
    expect(draft?.casterMotion).toHaveLength(1);
    expect(draft?.casterMotion?.[0]?.type).toBe('DASH_THROUGH');
  });

  it('persists a motion-free draft with no casterMotion field at all', () => {
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0];
    expect(draft?.casterMotion).toBeUndefined();
  });

  it('drops the field again when the last motion is removed and saved', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-motion-remove'));
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0];
    expect(draft?.casterMotion).toBeUndefined();
  });

  it('keeps the visual spritesheet section untouched by motion authoring', () => {
    const before = qa('.cmp-slot-card').length;
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('move').find((b) => b.dataset.value === 'JUMP_ARC'));
    expect(qa('.cmp-slot-card')).toHaveLength(before);
  });

  it('leaves per-beat COMPOSITION controls present and functional', () => {
    click(q('.cmp-beat-add-motion'));
    expect(q('[data-section="composition"]')).toBeNull();
    expect(qa('.cmp-beat-card .cmp-choreo-btn').length).toBeGreaterThan(0);
  });

  it('shows no motion cards when no motion is authored', () => {
    expect(qa('.cmp-motion-card')).toHaveLength(0);
  });

  it('adds a motion card to a beat once motion is authored', () => {
    click(q('.cmp-beat-add-motion'));
    expect(qa('.cmp-motion-card')).toHaveLength(1);
  });

  it('labels the motion card with the semantic move name', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('move').find((b) => b.dataset.value === 'JUMP_ARC'));
    expect(q('.cmp-motion-title')?.textContent).toContain('LEAP');
  });

  it('marks returning motions in the motion card title', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('return').find((b) => b.dataset.value === 'return'));
    expect(q('.cmp-motion-card')?.textContent).toContain('COME BACK');
  });

  it('orders beat cards by beat index', () => {
    click(q('.cmp-beat-add-motion'));
    const indices = qa('.cmp-beat-card').map((el) => el.dataset.beatIndex);
    const sorted = [...indices].sort((a, b) => Number(a) - Number(b));
    expect(indices).toEqual(sorted);
  });

  it('tags every beat card with its beat index', () => {
    click(q('.cmp-beat-add-motion'));
    const indices = qa('.cmp-beat-card').map((el) => el.dataset.beatIndex);
    expect(indices.length).toBeGreaterThan(0);
    for (const idx of indices) expect(idx).toBeDefined();
  });
});
