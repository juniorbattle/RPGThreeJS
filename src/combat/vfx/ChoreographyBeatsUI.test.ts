// @vitest-environment happy-dom
/**
 * V2.7 CHOREOGRAPHY BEATS — Composer UI acceptance tests.
 *
 * Tests the required UI scenarios:
 *   1.  Legacy derived-beat display
 *   2.  First edit materializing explicit beats
 *   3.  Add VFX to beat
 *   4.  Add motion to beat
 *   5.  Move VFX between beats
 *   6.  Move motion between beats
 *   7.  DELETE removes slot from beat and draft
 *   8.  Remove beat (disabled when non-empty)
 *   9.  Empty beat behavior (beats persist when emptied)
 *   10. COMPOSITION is per-beat inside CHOREOGRAPHY
 *   11. Computed timing display
 *   12. DEMO SCOPE / UPCOMING remaining functional
 *   13. Catalogue picker assigns to active beat
 *   14. Legacy preset backward compatibility
 *   15. Single authoritative temporal UI (no second timeline)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installVfxComposerPanel } from './CombatVfxComposerPanel';
import { loadComposerStore, COMPOSER_STORAGE_KEY } from './VfxComposerPlayback';

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

function addSlotsFromCatalogue(count: number): void {
  // If no beats exist, create one first
  if (qa('.cmp-beat-card').length === 0) {
    click(q('.cmp-add-beat'));
  }
  for (let i = 0; i < count; i += 1) {
    // Open catalogue via the first beat's + ADD VFX button
    click(qa('.cmp-beat-card')[0]!.querySelector('.cmp-beat-add-vfx'));
    click(q('.cmp-cat-add'));
  }
}

function removeAllSlots(): void {
  let guard = 0;
  while (qa('.cmp-slot-card').length > 0 && guard < 50) {
    click(qa('.cmp-slot-card')[0]!.querySelector('.cmp-slot-remove'));
    guard += 1;
  }
}

function ensureExplicitBeats(): void {
  click(q('.cmp-add-beat'));
}

function selectActionWithSlots(actionKey: string): void {
  const select = q<HTMLSelectElement>('.cmp-action-select')!;
  select.value = actionKey;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('V2.7 CHOREOGRAPHY BEATS — Composer UI', () => {
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

  // 1. Legacy derived-beat display
  it('1. displays derived beats from phases when no explicit beats exist', () => {
    selectActionWithSlots('basic_greatsword_hit');
    const beatCards = qa('.cmp-beat-card');
    expect(beatCards.length).toBeGreaterThanOrEqual(1);
    // + ADD BEAT should be visible
    expect(q('.cmp-add-beat')).not.toBeNull();
    // No REMOVE BEAT button on derived beats
    expect(q('.cmp-beat-remove')).toBeNull();
  });

  // 2. First edit materializing explicit beats
  it('2. first choreography edit materializes explicit beats from current state', () => {
    selectActionWithSlots('basic_greatsword_hit');
    // Before edit: no explicit beats
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0]!;
    expect(draft.beats).toBeUndefined();
    // Perform first choreography edit: add a beat
    click(q('.cmp-add-beat'));
    const store2 = loadComposerStore(localStorage);
    const draft2 = Object.values(store2.drafts)[0]!;
    expect(draft2.beats).toBeDefined();
    expect(draft2.beats!.length).toBeGreaterThanOrEqual(2);
    // All existing slots should be in beats
    const allSlotIds = new Set(draft2.beats!.flatMap((b) => b.vfxSlotIds));
    expect(allSlotIds.size).toBe(draft2.visualSlots.length);
  });

  // 3. Add VFX to beat
  it('3. + ADD VFX on a beat opens catalogue and assigns to that beat', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    // Now click + ADD VFX on the second beat
    const beatCards = qa('.cmp-beat-card');
    expect(beatCards.length).toBeGreaterThanOrEqual(2);
    const addVfxBtn = beatCards[1]!.querySelector('.cmp-beat-add-vfx');
    click(addVfxBtn);
    expect(q('[data-section="catalogue"]')).not.toBeNull();
    // Add a candidate
    click(q('.cmp-cat-add'));
    // The new slot should be in beat 1
    const beat1Slots = qa('.cmp-beat-card')[1]!.querySelectorAll('.cmp-slot-card');
    expect(beat1Slots.length).toBeGreaterThanOrEqual(1);
  });

  // 4. Add motion to beat
  it('4. + ADD CASTER MOTION on a beat creates motion assigned to that beat', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    const beatCards = qa('.cmp-beat-card');
    const addMotionBtn = beatCards[0]!.querySelector('.cmp-beat-add-motion');
    click(addMotionBtn);
    // Re-query after re-render
    const beat0Motions = qa('.cmp-beat-card')[0]!.querySelectorAll('.cmp-motion-card');
    expect(beat0Motions.length).toBe(1);
  });

  // 5. Move VFX between beats
  it('5. ◀ / ▶ moves VFX slot between beats', () => {
    addSlotsFromCatalogue(2);
    click(q('.cmp-add-beat'));
    const beatCards = qa('.cmp-beat-card');
    expect(beatCards.length).toBeGreaterThanOrEqual(2);
    const beat0SlotsBefore = beatCards[0]!.querySelectorAll('.cmp-slot-card').length;
    // Move first slot in beat 0 to beat 1
    const moveRight = beatCards[0]!.querySelector('.cmp-beat-move-right') as HTMLButtonElement;
    expect(moveRight).not.toBeNull();
    click(moveRight);
    const beat0SlotsAfter = qa('.cmp-beat-card')[0]!.querySelectorAll('.cmp-slot-card').length;
    const beat1SlotsAfter = qa('.cmp-beat-card')[1]!.querySelectorAll('.cmp-slot-card').length;
    expect(beat0SlotsAfter).toBe(beat0SlotsBefore - 1);
    expect(beat1SlotsAfter).toBeGreaterThanOrEqual(1);
  });

  // 6. Move motion between beats
  it('6. ◀ / ▶ moves caster motion between beats', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    // Add motion to beat 0
    const beatCards = qa('.cmp-beat-card');
    click(beatCards[0]!.querySelector('.cmp-beat-add-motion'));
    // Re-query after re-render
    const beat0MotionsBefore = qa('.cmp-beat-card')[0]!.querySelectorAll('.cmp-motion-card').length;
    expect(beat0MotionsBefore).toBe(1);
    // Move motion to beat 1 — target the motion card's move button
    const motionMoveRight = qa('.cmp-beat-card')[0]!.querySelector('.cmp-motion-card .cmp-beat-move-right') as HTMLButtonElement;
    click(motionMoveRight);
    // Re-query after re-render
    const beat0MotionsAfter = qa('.cmp-beat-card')[0]!.querySelectorAll('.cmp-motion-card').length;
    const beat1MotionsAfter = qa('.cmp-beat-card')[1]!.querySelectorAll('.cmp-motion-card').length;
    expect(beat0MotionsAfter).toBe(0);
    expect(beat1MotionsAfter).toBe(1);
  });

  // 7. DELETE removes the slot entirely from the draft and beat
  it('7. DELETE removes the slot entirely from the draft and beat', () => {
    addSlotsFromCatalogue(2);
    click(q('.cmp-add-beat'));
    const totalSlotsBefore = qa('.cmp-slot-card').length;
    // Delete first slot from beat 0
    const deleteBtn = qa('.cmp-beat-card')[0]!.querySelector('.cmp-slot-remove');
    click(deleteBtn);
    // Slot should be gone entirely
    const totalSlotsAfter = qa('.cmp-slot-card').length;
    expect(totalSlotsAfter).toBe(totalSlotsBefore - 1);
    // No unassigned pool
    expect(q('[data-section="unassigned"]')).toBeNull();
  });

  // 8. Remove beat (disabled when non-empty)
  it('8. REMOVE BEAT removes an empty beat but is disabled when non-empty', () => {
    addSlotsFromCatalogue(2);
    click(q('.cmp-add-beat'));
    const beatCountBefore = qa('.cmp-beat-card').length;
    // The first beat has slots — REMOVE BEAT should be disabled
    const firstBeatRemove = qa('.cmp-beat-card')[0]!.querySelector<HTMLButtonElement>('.cmp-beat-remove');
    expect(firstBeatRemove).not.toBeNull();
    expect(firstBeatRemove!.disabled).toBe(true);
    // The last (empty) beat — REMOVE BEAT should work
    const lastBeat = qa('.cmp-beat-card').at(-1)!;
    const removeBeatBtn = lastBeat.querySelector<HTMLButtonElement>('.cmp-beat-remove');
    expect(removeBeatBtn).not.toBeNull();
    expect(removeBeatBtn!.disabled).toBe(false);
    click(removeBeatBtn);
    const beatCountAfter = qa('.cmp-beat-card').length;
    expect(beatCountAfter).toBe(beatCountBefore - 1);
  });

  // 9. Empty beat behavior — beats persist when emptied (no auto-remove)
  it('9. deleting the last participant from a beat leaves the beat empty but present', () => {
    addSlotsFromCatalogue(2);
    click(q('.cmp-add-beat'));
    // Move one slot to beat 1 so beat 1 has exactly 1 slot
    const beatCards = qa('.cmp-beat-card');
    click(beatCards[0]!.querySelector('.cmp-beat-move-right'));
    const beatCountBefore = qa('.cmp-beat-card').length;
    // Now delete that slot from beat 1
    const beat1Delete = qa('.cmp-beat-card')[1]!.querySelector('.cmp-slot-remove');
    click(beat1Delete);
    // Beat 1 should still exist (now empty, no auto-remove)
    const beatCountAfter = qa('.cmp-beat-card').length;
    expect(beatCountAfter).toBe(beatCountBefore);
    // Beat 1 should show empty indicator
    const beat1 = qa('.cmp-beat-card')[1]!;
    expect(beat1.querySelector('.cmp-beat-empty')).not.toBeNull();
    // No unassigned pool
    expect(q('[data-section="unassigned"]')).toBeNull();
  });

  // 10. COMPOSITION is per-beat inside CHOREOGRAPHY (no separate section)
  it('10. COMPOSITION is per-beat inside CHOREOGRAPHY section', () => {
    addSlotsFromCatalogue(2);
    const choreography = q('[data-section="choreography"]');
    expect(choreography).not.toBeNull();
    // No separate composition section
    expect(q('[data-section="composition"]')).toBeNull();
    // CHOREOGRAPHY has beat cards
    expect(choreography!.querySelectorAll('.cmp-beat-card').length).toBeGreaterThan(0);
    // Each beat has its own COMPOSITION control with choreography buttons
    const firstBeat = qa('.cmp-beat-card')[0]!;
    expect(firstBeat.querySelectorAll('.cmp-choreo-btn').length).toBeGreaterThan(0);
  });

  // 11. Computed timing display
  it('11. each beat shows computed start delay, absolute start, duration, and end', () => {
    addSlotsFromCatalogue(2);
    const timings = qa('.cmp-beat-timing');
    expect(timings.length).toBeGreaterThanOrEqual(1);
    for (const t of timings) {
      expect(t.textContent).toMatch(/START\s\+[\d.]+s/);
      expect(t.textContent).toMatch(/TIME\s+[\d.]+s/);
      expect(t.textContent).toMatch(/DURATION\s+[\d.]+s/);
      expect(t.textContent).toMatch(/END\s+[\d.]+s/);
    }
    // Total should also be displayed
    expect(q('.cmp-beat-total')?.textContent).toMatch(/TOTAL\s+[\d.]+s/);
  });

  // 12. DEMO SCOPE / UPCOMING remaining functional
  it('12. DEMO SCOPE and À VENIR scope buttons remain functional', () => {
    const scopeBtns = qa('.cmp-scope-row button');
    expect(scopeBtns.length).toBeGreaterThanOrEqual(2);
    const labels = scopeBtns.map((b) => b.textContent ?? '');
    expect(labels.some((l) => l.includes('DEMO'))).toBe(true);
    expect(labels.some((l) => l.includes('À VENIR'))).toBe(true);
  });

  // 13. Catalogue picker assigns to active beat
  it('13. catalogue picker assigns VFX to the beat that opened it', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    const beatCards = qa('.cmp-beat-card');
    const beat1SlotCountBefore = beatCards[1]!.querySelectorAll('.cmp-slot-card').length;
    click(beatCards[1]!.querySelector('.cmp-beat-add-vfx'));
    click(q('.cmp-cat-add'));
    const beat1SlotCountAfter = qa('.cmp-beat-card')[1]!.querySelectorAll('.cmp-slot-card').length;
    expect(beat1SlotCountAfter).toBe(beat1SlotCountBefore + 1);
  });

  // 14. Legacy preset backward compatibility
  it('14. legacy preset without beats field displays derived beats and is backward compatible', () => {
    // Select an action that has existing slots
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    // Should display beat cards
    const beatCards = qa('.cmp-beat-card');
    expect(beatCards.length).toBeGreaterThanOrEqual(1);
    // The draft should not have explicit beats
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0];
    if (draft && draft.visualSlots.length > 0) {
      expect(draft.beats).toBeUndefined();
    }
  });

  // 15. Single authoritative temporal UI (no second timeline)
  it('15. no separate timeline exists — beat cards are the single temporal UI', () => {
    addSlotsFromCatalogue(2);
    // No timeline section or timeline rows
    expect(q('.cmp-timeline')).toBeNull();
    expect(qa('.cmp-timeline-row')).toHaveLength(0);
    expect(qa('.cmp-timeline-total')).toHaveLength(0);
    // Beat total is the single source of total duration
    expect(q('.cmp-beat-total')).not.toBeNull();
  });

  // Additional: SAVE DRAFT / PUBLISH / PUBLISH ALL / RESET ALL preserved
  it('16. SAVE DRAFT, PUBLISH, PUBLISH ALL SAVED, RESET ALL remain present', () => {
    expect(q('.cmp-save-draft')?.textContent).toBe('SAVE DRAFT');
    expect(q('.cmp-publish')?.textContent).toContain('PUBLISH');
    // PUBLISH ALL SAVED and RESET ALL are in primary actions / advanced section
    expect(q('.cmp-publish-all')?.textContent).toContain('PUBLISH ALL');
    click(q('.cmp-advanced-header'));
    expect(q('.cmp-reset-all-btn')?.textContent).toBe('RESET ALL PRESETS');
  });

  // Additional: Beat timing is read-only
  it('17. beat timing is read-only — no manual time input', () => {
    addSlotsFromCatalogue(2);
    const choreography = q('[data-section="choreography"]')!;
    expect(choreography.querySelectorAll('input[type="number"]')).toHaveLength(0);
    expect(choreography.querySelectorAll('input')).toHaveLength(0);
  });

  // Additional: MOVE LEFT disabled on first beat
  it('18. MOVE LEFT is disabled on the first beat', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    const firstBeat = qa('.cmp-beat-card')[0]!;
    const moveLeft = firstBeat.querySelector<HTMLButtonElement>('.cmp-beat-move-left');
    expect(moveLeft).not.toBeNull();
    expect(moveLeft!.disabled).toBe(true);
  });

  // Additional: MOVE RIGHT disabled on last beat
  it('19. MOVE RIGHT is disabled on the last beat', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-add-beat'));
    // Move the slot to the last beat so it has a slot with move buttons
    const beatCards = qa('.cmp-beat-card');
    click(beatCards[0]!.querySelector('.cmp-beat-move-right'));
    const lastBeat = qa('.cmp-beat-card').at(-1)!;
    const moveRight = lastBeat.querySelector<HTMLButtonElement>('.cmp-beat-move-right');
    expect(moveRight).not.toBeNull();
    expect(moveRight!.disabled).toBe(true);
  });

  // Additional: DELETE removes the slot entirely
  it('20. DELETE removes the slot entirely from the draft', () => {
    addSlotsFromCatalogue(2);
    const totalBefore = qa('.cmp-slot-card').length;
    const deleteBtn = qa('.cmp-slot-card')[0]!.querySelector('.cmp-slot-remove');
    click(deleteBtn);
    const totalAfter = qa('.cmp-slot-card').length;
    expect(totalAfter).toBe(totalBefore - 1);
  });

  // Additional: Fingerprints of presets without explicit beats are unchanged
  it('21. presets without explicit beats do not have beats field in stored draft', () => {
    selectActionWithSlots('basic_greatsword_hit');
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    const draft = Object.values(store.drafts)[0]!;
    expect(draft.beats).toBeUndefined();
  });
});
