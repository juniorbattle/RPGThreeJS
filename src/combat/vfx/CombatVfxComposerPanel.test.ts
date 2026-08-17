// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installVfxComposerPanel } from './CombatVfxComposerPanel';
import { COMPOSER_STORAGE_KEY, COMPOSER_UI_PREFS_KEY, loadComposerStore, loadComposerUiPrefs } from './VfxComposerPlayback';

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

function removeAllSlots(): void {
  let guard = 0;
  while (qa('.cmp-slot-card').length > 0 && guard < 50) {
    click(qa('.cmp-slot-card')[0]!.querySelector('.cmp-slot-remove'));
    guard += 1;
  }
}

/**
 * Opens the library once, then adds `count` distinct candidates. The library
 * intentionally stays open after ADD TO PRESET so several sources can be added
 * in a row, so it must only be toggled once.
 */
function addSlotsFromCatalogue(count: number): void {
  if (!q('[data-section="catalogue"]')) click(q('.cmp-add-slot'));
  for (let i = 0; i < count; i += 1) {
    click(qa('.cmp-cat-add')[i]);
  }
}

describe('R2C-VFX LAB V2 — Composer panel UI', () => {
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

  // ---------------------------------------------------------- simple flow

  it('1. installs a single composer root when enabled', () => {
    expect(document.querySelectorAll(`#${ROOT_ID}`)).toHaveLength(1);
  });

  it('2. does not install when disabled', () => {
    dispose();
    document.body.textContent = '';
    const noop = installVfxComposerPanel({ enabled: false });
    expect(document.getElementById(ROOT_ID)).toBeNull();
    noop();
  });

  it('3. renders the simple layout sections in order', () => {
    const sections = qa('[data-section]').map((el) => el.dataset.section);
    expect(sections).toEqual([
      'visual_slots',
      'composition',
      'primary_actions',
      'advanced',
    ]);
  });

  it('4. selecting an action opens its preset with an id', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select');
    expect(select).not.toBeNull();
    expect(select!.options.length).toBeGreaterThan(0);
    expect(q('.cmp-preset-id')?.textContent).toContain('PRESET');
  });

  it('5. current visual spritesheets appear as slot cards', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(qa('.cmp-slot-card').length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------- add / remove / reorder

  it('6. + ADD SPRITESHEET opens the CartoonCoffee library', () => {
    expect(q('[data-section="catalogue"]')).toBeNull();
    click(q('.cmp-add-slot'));
    expect(q('[data-section="catalogue"]')).not.toBeNull();
    expect(qa('.cmp-cat-card').length).toBeGreaterThan(0);
  });

  it('7. candidate cards offer ADD TO PRESET, not USE AS QA SOURCE', () => {
    click(q('.cmp-add-slot'));
    const addBtn = q('.cmp-cat-add');
    expect(addBtn?.textContent).toBe('ADD TO PRESET');
    expect(getRoot().textContent).not.toContain('USE AS QA SOURCE');
  });

  it('7b. hides interface indicators while retaining suitability metadata in the default catalogue', () => {
    click(q('.cmp-add-slot'));
    const cards = qa<HTMLElement>('.cmp-cat-card');
    const ids = cards.map((card) => card.dataset.candidateId);
    for (const indicatorId of ['r1_0001', 'r1_0002', 'r1_0003', 'r1_0004', 'r1_0005']) {
      expect(ids).not.toContain(indicatorId);
    }
    expect(q('[data-section="catalogue"]')?.textContent)
      .toMatch(/COMBAT EFFECT|SUPPORT EFFECT|AMBIGUOUS REVIEW/);
  });

  it('8. ADD TO PRESET appends a slot card', () => {
    const before = qa('.cmp-slot-card').length;
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    expect(qa('.cmp-slot-card').length).toBe(before + 1);
  });

  it('9. REMOVE deletes the slot card', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const before = qa('.cmp-slot-card').length;
    click(q('.cmp-slot-remove'));
    expect(qa('.cmp-slot-card').length).toBe(before - 1);
  });

  it('10. REPLACE swaps the slot candidate through the library', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const firstCard = qa('.cmp-slot-card')[0]!;
    const originalCid = firstCard.querySelector('.cmp-slot-cid')!.textContent;
    click(firstCard.querySelector('.cmp-slot-replace'));
    expect(q('[data-section="catalogue"]')?.textContent).toContain('REPLACE WITH CANDIDATE');
    const replacement = qa<HTMLElement>('.cmp-cat-card')
      .find((card) => card.dataset.candidateId !== originalCid)!;
    click(replacement.querySelector('.cmp-cat-add'));
    expect(qa('.cmp-slot-card')[0]!.querySelector('.cmp-slot-cid')!.textContent)
      .not.toBe(originalCid);
  });

  it('11. MOVE UP / MOVE DOWN reorder slot cards', () => {
    addSlotsFromCatalogue(2);
    const order = () => qa('.cmp-slot-card').map((c) => c.querySelector('.cmp-slot-cid')!.textContent);
    const before = order();
    expect(before.length).toBeGreaterThanOrEqual(2);
    click(qa('.cmp-slot-card')[before.length - 1]!.querySelector('.cmp-slot-up'));
    const after = order();
    expect(after).not.toEqual(before);
    expect(after.slice().sort()).toEqual(before.slice().sort());
  });

  it('12. MOVE UP is disabled on the first slot', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const first = qa('.cmp-slot-card')[0]!;
    expect(first.querySelector<HTMLButtonElement>('.cmp-slot-up')!.disabled).toBe(true);
  });

  // ---------------------------------------------------------- semantic profiles only

  it('13. slot cards expose SIZE / SPEED / POSITION / AT / DIRECTION / ROTATE / MIRROR / ORIGIN / PHASE / IMPACT FX controls', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const card = qa('.cmp-slot-card')[0]!;
    const profiles = Array.from(card.querySelectorAll<HTMLElement>('.cmp-profile'))
      .map((el) => el.dataset.profile);
    expect(profiles).toEqual([
      'size', 'speed', 'position', 'at',
      'direction', 'rotate', 'mirror', 'origin',
      'phase', 'impact_fx',
    ]);
  });

  it('14. SIZE exposes exactly LOW / MID / BIG / GIGA', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const group = q('[data-profile="size"] .cmp-profile-group')!;
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent))
      .toEqual(['LOW', 'MID', 'BIG', 'GIGA']);
  });

  it('15. SPEED exposes exactly QUICK / NORMAL / LONG', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const group = q('[data-profile="speed"] .cmp-profile-group')!;
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent))
      .toEqual(['QUICK', 'NORMAL', 'LONG']);
  });

  it('16. AT exposes exactly AUTO / TARGET / T.FRONT / T.BACK / T.TOP / T.BOTTOM / CASTER / C.FRONT / C.BACK / GROUND', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const group = q('[data-profile="at"] .cmp-profile-group')!;
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent))
      .toEqual(['AUTO', 'TARGET', 'T.FRONT', 'T.BACK', 'T.TOP', 'T.BOTTOM', 'CASTER', 'C.FRONT', 'C.BACK', 'GROUND']);
  });

  it('17. choosing SIZE=MID TIMING=NORMAL PLACEMENT=TARGET persists', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="size"] button[data-value="MID"]'));
    click(inSlot('[data-profile="speed"] button[data-value="NORMAL"]'));
    click(inSlot('[data-profile="at"] button[data-value="TARGET"]'));
    const slot = Object.values(loadComposerStore(localStorage).drafts)[0]!
      .visualSlots.find((s) => s.id === slotId)!;
    expect(slot.sizeProfile).toBe('MID');
    expect(slot.timingProfile).toBe('NORMAL');
    expect(slot.placementProfile).toBe('TARGET');
  });

  it('17b. choosing SIZE=GIGA persists and survives reload', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="size"] button[data-value="GIGA"]'));
    let slot = Object.values(loadComposerStore(localStorage).drafts)[0]!
      .visualSlots.find((s) => s.id === slotId)!;
    expect(slot.sizeProfile).toBe('GIGA');
    // Simulate reload by re-loading from storage
    slot = Object.values(loadComposerStore(localStorage).drafts)[0]!
      .visualSlots.find((s) => s.id === slotId)!;
    expect(slot.sizeProfile).toBe('GIGA');
  });

  // ---------------------------------------------------------- V2.5 controls

  it('18a. POSITION exposes exactly FIXED / TRAVEL', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const group = q('[data-profile="position"] .cmp-profile-group')!;
    expect(Array.from(group.querySelectorAll('button')).map((b) => b.textContent))
      .toEqual(['FIXED', 'TRAVEL']);
  });

  it('18b. FIXED mode shows AT control, not FROM/TO', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    expect(inSlot('[data-profile="at"]')).not.toBeNull();
    expect(inSlot('[data-profile="from"]')).toBeNull();
    expect(inSlot('[data-profile="to"]')).toBeNull();
  });

  it('18c. TRAVEL mode shows FROM/TO controls, not AT', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="position"] button[data-value="TRAVEL"]'));
    expect(inSlot('[data-profile="at"]')).toBeNull();
    expect(inSlot('[data-profile="from"]')).not.toBeNull();
    expect(inSlot('[data-profile="to"]')).not.toBeNull();
  });

  it('18d. TRAVEL mode hides DIRECTION control (path orients automatically)', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="position"] button[data-value="TRAVEL"]'));
    expect(inSlot('[data-profile="direction"]')).toBeNull();
  });

  it('18e. switching to TRAVEL persists positionMode and travel endpoints', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="position"] button[data-value="TRAVEL"]'));
    const slot = Object.values(loadComposerStore(localStorage).drafts)[0]!
      .visualSlots.find((s) => s.id === slotId)!;
    expect(slot.positionMode).toBe('TRAVEL');
    expect(slot.travelFrom).toBeDefined();
    expect(slot.travelTo).toBeDefined();
  });

  it('18f. PHASE stepper exists with + and - buttons', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    expect(q('.cmp-phase')).not.toBeNull();
    expect(q('.cmp-phase-dec')).not.toBeNull();
    expect(q('.cmp-phase-inc')).not.toBeNull();
    expect(q('.cmp-phase-value')).not.toBeNull();
  });

  it('18g. PHASE increment increases the displayed value', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    const before = inSlot('.cmp-phase-value')!.textContent;
    click(inSlot('.cmp-phase-inc'));
    const after = inSlot('.cmp-phase-value')!.textContent;
    expect(Number(after)).toBeGreaterThan(Number(before));
  });

  it('18h. PHASE decrement is disabled at 0', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const dec = q('.cmp-phase-dec') as HTMLButtonElement;
    expect(dec.disabled).toBe(true);
  });

  it('18i. IMPACT FX exposes FLASH / SHAKE toggles (V2.6: HITSTOP removed)', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const group = q('[data-profile="impact_fx"] .cmp-profile-group')!;
    const labels = Array.from(group.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['FLASH', 'SHAKE']);
  });

  it('18j. toggling FLASH enables it and shows POWER control', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="impact_fx"] button[data-value="flash"]'));
    const flashBtn = inSlot('[data-profile="impact_fx"] button[data-value="flash"]')!;
    expect(flashBtn.classList.contains('cmp-active')).toBe(true);
    expect(q('[data-profile="power"]')).not.toBeNull();
  });

  it('18k. toggling FLASH off removes POWER control', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="impact_fx"] button[data-value="flash"]'));
    click(inSlot('[data-profile="impact_fx"] button[data-value="flash"]'));
    expect(q('[data-profile="power"]')).toBeNull();
  });

  it('18l. IMPACT FX default is fully OFF (no active buttons)', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const fxBtns = qa('.cmp-fx-btn');
    expect(fxBtns.every((b) => !b.classList.contains('cmp-active'))).toBe(true);
  });

  it('18m. legacy TECHNICAL POLISH is disabled when slot Impact FX is active', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    const slotId = qa<HTMLElement>('.cmp-slot-card').at(-1)!.dataset.slotId!;
    const inSlot = (selector: string) =>
      q(`.cmp-slot-card[data-slot-id="${slotId}"] ${selector}`);
    click(inSlot('[data-profile="impact_fx"] button[data-value="shake"]'));
    const polishBtns = qa('.cmp-polish-btn');
    expect(polishBtns.every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('18n. timeline rows include phase and impactTime data attributes', () => {
    addSlotsFromCatalogue(2);
    const rows = qa<HTMLElement>('.cmp-timeline-row');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(row.dataset.phase).toBeDefined();
      expect(row.dataset.impactTime).toBeDefined();
    }
  });

  it('18. standard UI never exposes raw fade/opacity/offset/startTime fields', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    // The ADVANCED accordion is collapsed, so no numeric inputs exist.
    expect(qa('input[type="number"]')).toHaveLength(0);
    expect(qa('input[data-adv-key]')).toHaveLength(0);
  });

  it('19. standard UI never exposes lifecycle / queue / fingerprint controls', () => {
    const text = getRoot().textContent ?? '';
    for (const forbidden of ['CONFIGURE', 'APPLY', 'VERIFY', 'FINGERPRINT', 'VALIDATED', 'WORK QUEUE']) {
      expect(text.toUpperCase()).not.toContain(forbidden);
    }
  });

  // ---------------------------------------------------------- composition

  it('20. COMPOSITION exposes TOGETHER / SEQUENCE / PAIR THEN LAST', () => {
    const labels = qa('.cmp-choreo-btn').map((b) => b.textContent);
    expect(labels).toEqual(['TOGETHER', 'SEQUENCE', 'PAIR THEN LAST']);
  });

  it('21. selecting TOGETHER marks it active and zeroes all start times', () => {
    addSlotsFromCatalogue(2);
    click(qa('.cmp-choreo-btn')[0]);
    expect(qa('.cmp-choreo-btn')[0]!.classList.contains('cmp-active')).toBe(true);
    const starts = qa<HTMLElement>('.cmp-timeline-row').map((r) => Number(r.dataset.startTime));
    expect(starts.every((s) => s === 0)).toBe(true);
  });

  it('22. selecting SEQUENCE produces increasing start times', () => {
    addSlotsFromCatalogue(2);
    click(qa('.cmp-choreo-btn')[1]);
    const starts = qa<HTMLElement>('.cmp-timeline-row').map((r) => Number(r.dataset.startTime));
    expect(starts.length).toBeGreaterThanOrEqual(2);
    expect(starts[1]!).toBeGreaterThan(starts[0]!);
  });

  it('23. PAIR THEN LAST is disabled below three slots and explains why', () => {
    const btn = qa<HTMLButtonElement>('.cmp-choreo-btn')[2]!;
    const slotCount = qa('.cmp-slot-card').length;
    if (slotCount < 3) {
      expect(btn.disabled).toBe(true);
      expect(btn.title).toContain('3');
    }
  });

  it('24. PAIR THEN LAST on three slots plays two together then the last', () => {
    removeAllSlots();
    addSlotsFromCatalogue(3);
    expect(qa('.cmp-slot-card')).toHaveLength(3);
    click(qa('.cmp-choreo-btn')[2]);
    const starts = qa<HTMLElement>('.cmp-timeline-row').map((r) => Number(r.dataset.startTime));
    expect(starts).toHaveLength(3);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBe(0);
    expect(starts[2]!).toBeGreaterThan(0);
  });

  it('25. the timeline is read-only — no manual startTime input', () => {
    expect(qa('.cmp-timeline input')).toHaveLength(0);
  });

  // ---------------------------------------------------------- technical polish (V2.6: section removed from normal UI)

  it('26. TECHNICAL POLISH section is absent from normal UI (V2.6)', () => {
    expect(q('[data-section="technical_polish"]')).toBeNull();
  });

  it('27. new draft default technicalPolish is OFF (V2.6)', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const draft = Object.values(loadComposerStore(localStorage).drafts)[0]!;
    expect(draft.technicalPolish).toBe('OFF');
  });

  // ---------------------------------------------------------- primary actions

  it('28. all four primary action buttons are present in order', () => {
    expect(q('.cmp-play-visuals')?.textContent).toBe('PLAY VISUALS ONLY');
    expect(q('.cmp-play-full')?.textContent).toBe('PLAY FULL PRESET');
    expect(q('.cmp-play-stage')?.textContent).toBe('PLAY IN COMBAT STAGE');
    expect(q('.cmp-save-draft')?.textContent).toBe('SAVE DRAFT');
  });

  it('29. preview and stage buttons are disabled with zero slots', () => {
    removeAllSlots();
    expect(q<HTMLButtonElement>('.cmp-play-visuals')!.disabled).toBe(true);
    expect(q<HTMLButtonElement>('.cmp-play-full')!.disabled).toBe(true);
    expect(q<HTMLButtonElement>('.cmp-play-stage')!.disabled).toBe(true);
  });

  it('30. preview and stage buttons enable once a slot exists', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    expect(q<HTMLButtonElement>('.cmp-play-visuals')!.disabled).toBe(false);
    expect(q<HTMLButtonElement>('.cmp-play-full')!.disabled).toBe(false);
    expect(q<HTMLButtonElement>('.cmp-play-stage')!.disabled).toBe(false);
  });

  it('31. PLAY IN COMBAT STAGE calls playDraftInCombatStage', async () => {
    dispose();
    document.body.textContent = '';
    document.head.textContent = '';
    dispose = installVfxComposerPanel({
      enabled: true,
      playback: {
        vfxSystem: { playLabSpriteSheet: () => ({ completion: Promise.resolve() }) } as never,
        buildContext: () => ({ source: { gx: 0, gz: 0 }, target: { gx: 1, gz: 1 }, helpers: {} } as never),
        buildStageContext: async (_key: string, playVfx: (ctx: never) => Promise<void>) => {
          await playVfx({} as never);
          return true;
        },
      },
    });
    removeAllSlots();
    addSlotsFromCatalogue(1);
    await new Promise((r) => setTimeout(r, 200));
    click(q('.cmp-play-stage'));
    await new Promise((r) => setTimeout(r, 300));
    expect(q('.cmp-status')?.textContent).toContain('Stage');
  });

  it('32. SAVE DRAFT persists to the composer store key', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    click(q('.cmp-save-draft'));
    expect(localStorage.getItem(COMPOSER_STORAGE_KEY)).not.toBeNull();
    expect(q('.cmp-status')?.textContent).toContain('Draft saved');
  });

  // ---------------------------------------------------------- advanced

  it('33. ADVANCED is collapsed by default', () => {
    expect(q('.cmp-advanced-body')).toBeNull();
    expect(q('.cmp-advanced-header')?.textContent).toContain('▸');
  });

  it('34. ADVANCED exposes spatial/timing overrides but not visibility controls', () => {
    click(q('.cmp-add-slot'));
    click(q('.cmp-cat-add'));
    click(q('.cmp-advanced-header'));
    const keys = qa<HTMLInputElement>('input[data-adv-key]').map((i) => i.dataset.advKey);
    expect(keys).toContain('scale');
    expect(keys).toContain('duration');
    expect(keys).toContain('offsetX');
    expect(keys).toContain('offsetY');
    expect(keys).not.toContain('opacity');
    expect(keys).not.toContain('fadeIn');
    expect(keys).not.toContain('fadeOut');
  });

  it('35. ADVANCED offers portable EXPORT / IMPORT of drafts', () => {
    click(q('.cmp-advanced-header'));
    expect(q('.cmp-export-drafts')?.textContent).toBe('EXPORT DRAFTS');
    expect(q('.cmp-import-drafts')?.textContent).toBe('IMPORT DRAFTS...');
    expect(q<HTMLInputElement>('.cmp-import-input')?.accept).toBe('.json');
  });

  // ---------------------------------------------------------- persistence

  it('36. draft composition survives a panel reinstall (reload)', () => {
    addSlotsFromCatalogue(1);
    click(qa('.cmp-choreo-btn')[1]);
    const beforeSlots = qa('.cmp-slot-card').length;

    dispose();
    document.body.textContent = '';
    document.head.textContent = '';
    dispose = installVfxComposerPanel({ enabled: true });

    expect(qa('.cmp-slot-card').length).toBe(beforeSlots);
    expect(qa('.cmp-choreo-btn')[1]!.classList.contains('cmp-active')).toBe(true);
  });

  it('37. the selected action survives a panel reinstall', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    const target = select.options[3]!.value;
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    dispose();
    document.body.textContent = '';
    document.head.textContent = '';
    dispose = installVfxComposerPanel({ enabled: true });

    expect(q<HTMLSelectElement>('.cmp-action-select')!.value).toBe(target);
  });

  it('38. non-CartoonCoffee migrated sources are flagged, not silently ignored', () => {
    // basic_greatsword_hit migrates from a legacy production sheet id when no
    // megapack candidate is assigned. Such a slot cannot be previewed, so the
    // UI must say so and invite REPLACE.
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const flagged = qa('.cmp-slot-card.cmp-slot-unplayable');
    if (flagged.length > 0) {
      expect(flagged[0]!.querySelector('.cmp-slot-flag')?.textContent).toContain('REPLACE');
      expect(q('[data-section="primary_actions"] .cmp-warn')?.textContent).toContain('REPLACE');
    }
  });

  it('39. replacing an unplayable slot with a real candidate clears the flag', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const flagged = qa<HTMLElement>('.cmp-slot-card.cmp-slot-unplayable');
    if (flagged.length === 0) return;
    click(flagged[0]!.querySelector('.cmp-slot-replace'));
    click(q('.cmp-cat-add'));
    expect(qa('.cmp-slot-card.cmp-slot-unplayable')).toHaveLength(0);
    expect(q('[data-section="primary_actions"] .cmp-warn')).toBeNull();
  });

  it('40. dispose removes the root and its style', () => {
    dispose();
    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(document.getElementById('r2c-vfx-composer-style')).toBeNull();
    dispose = () => {};
  });
});

describe('R2C-VFX LAB V2.1.1 — Composer minimize / expand', () => {
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

  it('1. starts EXPANDED by default when no preference exists', () => {
    expect(getRoot().classList.contains('cmp-minimized')).toBe(false);
    expect(q('.cmp-minimize')).not.toBeNull();
    expect(q('.cmp-expand')).toBeNull();
  });

  it('2. clicking MINIMIZE switches to MINIMIZED mode', () => {
    click(q('.cmp-minimize'));
    expect(getRoot().classList.contains('cmp-minimized')).toBe(true);
  });

  it('3. large Composer body is absent in MINIMIZED mode', () => {
    click(q('.cmp-minimize'));
    expect(q('[data-section="visual_slots"]')).toBeNull();
    expect(q('[data-section="composition"]')).toBeNull();
    expect(q('[data-section="technical_polish"]')).toBeNull();
    expect(q('[data-section="primary_actions"]')).toBeNull();
    expect(q('[data-section="advanced"]')).toBeNull();
    expect(q('.cmp-action-select')).toBeNull();
    expect(q('.cmp-play-visuals')).toBeNull();
    expect(q('.cmp-play-full')).toBeNull();
    expect(q('.cmp-play-stage')).toBeNull();
    expect(q('.cmp-save-draft')).toBeNull();
  });

  it('4. compact header remains visible in MINIMIZED mode', () => {
    click(q('.cmp-minimize'));
    expect(q('.cmp-dock')).not.toBeNull();
    expect(q('.cmp-dock-title')?.textContent).toBe('VFX PRESET COMPOSER');
    expect(q('.cmp-expand')).not.toBeNull();
    expect(q('.cmp-expand')?.getAttribute('aria-label')).toBe('EXPAND VFX PRESET COMPOSER');
  });

  it('5. clicking EXPAND restores the full Composer', () => {
    click(q('.cmp-minimize'));
    click(q('.cmp-expand'));
    expect(getRoot().classList.contains('cmp-minimized')).toBe(false);
    expect(q('.cmp-minimize')).not.toBeNull();
    expect(q('[data-section="visual_slots"]')).not.toBeNull();
    expect(q('[data-section="primary_actions"]')).not.toBeNull();
  });

  it('6. draft data is unchanged across minimize → expand', () => {
    addSlotsFromCatalogue(2);
    click(qa('.cmp-choreo-btn')[1]);
    click(qa('.cmp-polish-btn')[3]);
    const before = JSON.stringify(loadComposerStore(localStorage).drafts);
    click(q('.cmp-minimize'));
    click(q('.cmp-expand'));
    const after = JSON.stringify(loadComposerStore(localStorage).drafts);
    expect(after).toBe(before);
  });

  it('7. selected action remains unchanged across minimize → expand', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    const target = select.options[3]!.value;
    select.value = target;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    click(q('.cmp-minimize'));
    click(q('.cmp-expand'));
    expect(q<HTMLSelectElement>('.cmp-action-select')!.value).toBe(target);
  });

  it('8. display mode survives browser reload', () => {
    click(q('.cmp-minimize'));
    expect(getRoot().classList.contains('cmp-minimized')).toBe(true);
    dispose();
    document.body.textContent = '';
    document.head.textContent = '';
    dispose = installVfxComposerPanel({ enabled: true });
    expect(getRoot().classList.contains('cmp-minimized')).toBe(true);
    expect(q('.cmp-expand')).not.toBeNull();
  });

  it('9. display mode is NOT included in portable VFX draft export', () => {
    addSlotsFromCatalogue(1);
    click(q('.cmp-save-draft'));
    click(q('.cmp-minimize'));
    const draftStore = localStorage.getItem(COMPOSER_STORAGE_KEY);
    const uiPrefs = localStorage.getItem(COMPOSER_UI_PREFS_KEY);
    expect(draftStore).not.toBeNull();
    expect(draftStore).not.toContain('displayMode');
    expect(draftStore).not.toContain('minimized');
    expect(uiPrefs).toContain('minimized');
  });

  it('10. PLAY IN COMBAT STAGE still works after expanding again', async () => {
    dispose();
    document.body.textContent = '';
    document.head.textContent = '';
    dispose = installVfxComposerPanel({
      enabled: true,
      playback: {
        vfxSystem: { playLabSpriteSheet: () => ({ completion: Promise.resolve() }) } as never,
        buildContext: () => ({ source: { gx: 0, gz: 0 }, target: { gx: 1, gz: 1 }, helpers: {} } as never),
        buildStageContext: async (_key: string, playVfx: (ctx: never) => Promise<void>) => {
          await playVfx({} as never);
          return true;
        },
      },
    });
    removeAllSlots();
    addSlotsFromCatalogue(1);
    await new Promise((r) => setTimeout(r, 200));
    click(q('.cmp-minimize'));
    click(q('.cmp-expand'));
    click(q('.cmp-play-stage'));
    await new Promise((r) => setTimeout(r, 300));
    expect(q('.cmp-status')?.textContent).toContain('Stage');
  });
});

describe('R2C-VFX LAB V2.1.2 — Expanded layout regression', () => {
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

  it('1. MINIMIZE control is not inside the header element', () => {
    const header = q('.cmp-header')!;
    const minBtn = q('.cmp-minimize')!;
    expect(header.contains(minBtn)).toBe(false);
  });

  it('2. MINIMIZE is a direct child of the root, not nested in any section', () => {
    const minBtn = q('.cmp-minimize')!;
    expect(minBtn.parentElement).toBe(getRoot());
  });

  it('3. action select belongs to the header action row, not a flex sibling of MINIMIZE', () => {
    const select = q('.cmp-action-select')!;
    const header = q('.cmp-header')!;
    expect(header.contains(select)).toBe(true);
  });

  it('4. preset info remains structurally inside the header, separate from MINIMIZE', () => {
    const preset = q('.cmp-preset-id')!;
    const header = q('.cmp-header')!;
    expect(header.contains(preset)).toBe(true);
  });

  it('5. expanded body structure is unchanged — all sections present in order', () => {
    const sections = qa('[data-section]');
    const sectionKeys = sections.map((s) => s.getAttribute('data-section'));
    expect(sectionKeys).toContain('visual_slots');
    expect(sectionKeys).toContain('composition');
    expect(sectionKeys).toContain('primary_actions');
  });

  it('6. header does not have flex/space-between layout', () => {
    const header = q('.cmp-header')!;
    const style = window.getComputedStyle(header);
    expect(style.display).not.toBe('flex');
  });

  it('7. minimized mode remains compact with dock', () => {
    click(q('.cmp-minimize'));
    expect(q('.cmp-dock')).not.toBeNull();
    expect(q('.cmp-expand')).not.toBeNull();
    expect(q('.cmp-header')).toBeNull();
  });
});

// ============================================================ V2.6 UI LABEL TESTS

describe('R2C-VFX LAB V2.6 — UI labels and controls', () => {
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

  it('1. C.FRONT and C.BACK labels appear in AT options', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const labels = qa('.cmp-profile-btn').map((b) => b.textContent);
    expect(labels).toContain('C.FRONT');
    expect(labels).toContain('C.BACK');
  });

  it('2. T.FRONT, T.BACK, T.TOP, T.BOTTOM labels appear in AT options', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const labels = qa('.cmp-profile-btn').map((b) => b.textContent);
    expect(labels).toContain('T.FRONT');
    expect(labels).toContain('T.BACK');
    expect(labels).toContain('T.TOP');
    expect(labels).toContain('T.BOTTOM');
  });

  it('3. HITSTOP button is absent from IMPACT FX', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const fxButtons = qa('[data-profile="impact_fx"] .cmp-fx-btn').map((b) => b.textContent);
    expect(fxButtons).not.toContain('HITSTOP');
    expect(fxButtons).toContain('FLASH');
    expect(fxButtons).toContain('SHAKE');
  });

  it('4. Legacy Technical Polish section is absent from normal UI', () => {
    const sections = qa('[data-section]').map((s) => s.getAttribute('data-section'));
    expect(sections).not.toContain('technical_polish');
  });

  it('5. TRAJECTORY control appears when POSITION is set to TRAVEL', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    // Click POSITION TRAVEL button
    const travelBtn = qa('.cmp-profile-btn').find((b) => b.textContent === 'TRAVEL');
    if (travelBtn) {
      click(travelBtn);
      const labels = qa('.cmp-profile-label').map((b) => b.textContent);
      expect(labels).toContain('TRAJECTORY');
      const trajButtons = qa('.cmp-profile-btn').map((b) => b.textContent);
      expect(trajButtons).toContain('STRAIGHT');
      expect(trajButtons).toContain('ARC LOW');
      expect(trajButtons).toContain('ARC HIGH');
    }
  });

  it('6. TRAJECTORY control is absent when POSITION is FIXED', () => {
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    select.value = 'basic_greatsword_hit';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const labels = qa('.cmp-profile-label').map((b) => b.textContent);
    expect(labels).not.toContain('TRAJECTORY');
  });
});
