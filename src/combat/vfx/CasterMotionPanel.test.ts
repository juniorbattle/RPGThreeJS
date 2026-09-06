// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installVfxComposerPanel } from './CombatVfxComposerPanel';
import { COMPOSER_STORAGE_KEY, loadComposerStore } from './VfxComposerPlayback';

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

function card(index = 0): HTMLElement | null {
  return qa<HTMLElement>('.cmp-motion-card')[index] ?? null;
}

function controlButtons(profile: string, cardIndex = 0): HTMLButtonElement[] {
  const row = card(cardIndex)?.querySelector(`[data-profile="${profile}"]`);
  return row ? Array.from(row.querySelectorAll<HTMLButtonElement>('button')) : [];
}

function activeValue(profile: string, cardIndex = 0): string | undefined {
  return controlButtons(profile, cardIndex).find((button) => button.classList.contains('cmp-active'))?.dataset.value;
}

describe('Composer panel — linked UNIT MOTION + POSE', () => {
  let dispose: () => void = () => {};
  let originalFetch: typeof fetch = () => Promise.resolve({ ok: false } as Response);

  beforeEach(() => {
    localStorage.clear();
    document.body.textContent = '';
    document.head.textContent = '';
    originalFetch = globalThis.fetch;
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
    globalThis.fetch = originalFetch;
  });

  it('renders one authoritative choreography section', () => {
    expect(q('[data-section="choreography"]')).not.toBeNull();
    expect(q('[data-section="composition"]')).toBeNull();
  });

  it('starts with no linked cards and offers the linked add affordance', () => {
    expect(qa('.cmp-motion-card')).toHaveLength(0);
    expect(q('.cmp-beat-add-motion')?.textContent).toContain('UNIT MOTION + POSE');
  });

  it('creates a safe CASTER + PREPARE + HOLD card', () => {
    click(q('.cmp-beat-add-motion'));
    expect(qa('.cmp-motion-card')).toHaveLength(1);
    expect(activeValue('unit')).toBe('CASTER');
    expect(activeValue('pose')).toBe('prepare');
    expect(activeValue('motion')).toBe('HOLD');
    expect(q('.cmp-motion-title')?.textContent).toBe('CASTER — PREPARE — HOLD');
  });

  it('offers CASTER and TARGET in the UNIT selector', () => {
    click(q('.cmp-beat-add-motion'));
    expect(controlButtons('unit').map((button) => button.dataset.value)).toEqual(['CASTER', 'TARGET']);
  });

  it('persists an actor change', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('unit').find((button) => button.dataset.value === 'TARGET'));
    expect(activeValue('unit')).toBe('TARGET');
    click(q('.cmp-save-draft'));
    expect(Object.values(loadComposerStore(localStorage).drafts)[0]?.casterMotion?.[0]?.actor).toBe('TARGET');
  });

  it('offers and persists all four Phase A semantic poses', () => {
    click(q('.cmp-beat-add-motion'));
    expect(controlButtons('pose').map((button) => button.dataset.value)).toEqual(['prepare', 'dash', 'attack', 'cast']);
    click(controlButtons('pose').find((button) => button.dataset.value === 'cast'));
    expect(activeValue('pose')).toBe('cast');
    click(q('.cmp-save-draft'));
    expect(Object.values(loadComposerStore(localStorage).drafts)[0]?.casterMotion?.[0]?.pose).toBe('cast');
  });

  it('offers the canonical motion vocabulary and never exposes IDLE', () => {
    click(q('.cmp-beat-add-motion'));
    const values = controlButtons('motion').map((button) => button.dataset.value);
    expect(values).toEqual(['HOLD', 'DASH_SHORT', 'DASH_THROUGH', 'JUMP_UP', 'JUMP_DOWN', 'JUMP_ARC']);
    expect(values).not.toContain('IDLE');
  });

  it('HOLD hides every irrelevant spatial control', () => {
    click(q('.cmp-beat-add-motion'));
    expect(activeValue('motion')).toBe('HOLD');
    for (const profile of ['destination', 'distance', 'height', 'duration', 'easing', 'return']) {
      expect(controlButtons(profile), profile).toHaveLength(0);
    }
  });

  it('changing motion persists independently from pose', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('pose').find((button) => button.dataset.value === 'attack'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_THROUGH'));
    expect(activeValue('pose')).toBe('attack');
    expect(activeValue('motion')).toBe('DASH_THROUGH');
    click(q('.cmp-save-draft'));
    expect(Object.values(loadComposerStore(localStorage).drafts)[0]?.casterMotion?.[0]).toMatchObject({
      actor: 'CASTER', pose: 'attack', type: 'DASH_THROUGH',
    });
  });

  it('travelling CASTER motion exposes actor-valid destinations', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_SHORT'));
    expect(controlButtons('destination').map((button) => button.dataset.value))
      .toEqual(['ORIGIN', 'TARGET', 'TARGET_FRONT', 'TARGET_BACK']);
  });

  it('travelling TARGET motion exposes counterpart CASTER destinations', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('unit').find((button) => button.dataset.value === 'TARGET'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'JUMP_ARC'));
    expect(controlButtons('destination').map((button) => button.dataset.value))
      .toEqual(['ORIGIN', 'CASTER', 'CASTER_FRONT', 'CASTER_BACK']);
  });

  it('shows semantic distance, duration, easing and return controls for travel', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_SHORT'));
    expect(controlButtons('distance')).toHaveLength(4);
    expect(controlButtons('duration').map((button) => button.textContent)).toEqual(['FAST', 'NORMAL', 'SLOW', 'VERY SLOW']);
    expect(controlButtons('easing')).toHaveLength(4);
    expect(controlButtons('return').map((button) => button.dataset.value)).toEqual(['stay', 'return']);
  });

  it('shows HEIGHT only for jump archetypes', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_SHORT'));
    expect(controlButtons('height')).toHaveLength(0);
    click(controlButtons('motion').find((button) => button.dataset.value === 'JUMP_ARC'));
    expect(controlButtons('height')).toHaveLength(4);
  });

  it('persists destination, distance, duration, easing and return', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_SHORT'));
    click(controlButtons('destination').find((button) => button.dataset.value === 'TARGET_BACK'));
    click(controlButtons('distance').find((button) => button.dataset.value === '0.8'));
    click(controlButtons('duration').find((button) => button.dataset.value === '0.6'));
    click(controlButtons('easing').find((button) => button.dataset.value === 'LINEAR'));
    click(controlButtons('return').find((button) => button.dataset.value === 'stay'));
    click(q('.cmp-save-draft'));
    expect(Object.values(loadComposerStore(localStorage).drafts)[0]?.casterMotion?.[0]).toMatchObject({
      destination: 'TARGET_BACK', distance: 0.8, duration: 0.6, easing: 'LINEAR', returnToOrigin: false,
    });
  });

  it('allows one CASTER and one TARGET step in the same Beat', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-beat-add-motion'));
    expect(qa('.cmp-motion-card')).toHaveLength(2);
    expect(activeValue('unit', 0)).toBe('CASTER');
    expect(activeValue('unit', 1)).toBe('TARGET');
  });

  it('disables a third linked step in the same Beat', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-beat-add-motion'));
    const add = q<HTMLButtonElement>('.cmp-beat-add-motion');
    expect(add?.disabled).toBe(true);
    click(add);
    expect(qa('.cmp-motion-card')).toHaveLength(2);
  });

  it('removes linked cards without touching VFX cards', () => {
    const before = qa('.cmp-slot-card').length;
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-motion-remove'));
    expect(qa('.cmp-motion-card')).toHaveLength(0);
    expect(qa('.cmp-slot-card')).toHaveLength(before);
  });

  it('uses semantic buttons only and no numeric/text inputs', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'JUMP_ARC'));
    expect(card()?.querySelectorAll('input')).toHaveLength(0);
  });

  it('summarizes actor + pose + motion + destination on the Beat card', () => {
    click(q('.cmp-beat-add-motion'));
    click(controlButtons('pose').find((button) => button.dataset.value === 'dash'));
    click(controlButtons('motion').find((button) => button.dataset.value === 'DASH_SHORT'));
    expect(q('.cmp-motion-title')?.textContent).toContain('CASTER — DASH — DASH SHORT → TARGET');
  });

  it('opens legacy no-pose/IDLE data as clearly marked INHERIT without exposing IDLE', () => {
    click(q('.cmp-beat-add-motion'));
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    const storedDraft = Object.values(store.drafts)[0]!;
    storedDraft.casterMotion![0] = { id: storedDraft.casterMotion![0]!.id, type: 'IDLE' };
    localStorage.setItem(COMPOSER_STORAGE_KEY, JSON.stringify(store));
    dispose();
    dispose = installVfxComposerPanel({ enabled: true });
    expect(q('.cmp-motion-title')?.textContent).toContain('INHERIT (LEGACY) — HOLD');
    expect(q('.cmp-motion-legacy')).not.toBeNull();
    expect(controlButtons('motion').some((button) => button.dataset.value === 'IDLE')).toBe(false);
    expect(q<HTMLButtonElement>('.cmp-publish')?.disabled).toBe(true);
  });

  it('persists motion-free drafts without adding the compatibility field', () => {
    click(q('.cmp-save-draft'));
    expect(Object.values(loadComposerStore(localStorage).drafts)[0]?.casterMotion).toBeUndefined();
  });

  it('keeps Beat order and indexes stable', () => {
    click(q('.cmp-beat-add-motion'));
    const indices = qa('.cmp-beat-card').map((element) => element.dataset.beatIndex);
    expect(indices).toEqual([...indices].sort((a, b) => Number(a) - Number(b)));
    for (const index of indices) expect(index).toBeDefined();
  });
});
