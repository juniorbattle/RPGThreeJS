// @vitest-environment happy-dom
/**
 * R2C-VFX Composer V2.6.3 — DEMO scope UI + publication invariants.
 *
 * The central guarantee under test: SCOPE is authoring metadata only. It filters
 * the ACTION list and drives the workload dashboard, and it must never gate
 * drafting, saving, publishing or resetting an action.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { installVfxComposerPanel } from './CombatVfxComposerPanel';
import {
  COMPOSER_UI_PREFS_KEY,
  loadComposerUiPrefs,
  saveComposerUiPrefs,
  loadComposerStore,
} from './VfxComposerPlayback';
import {
  getActionsInScope,
  getVfxActionScope,
  getGroupedActionsInScope,
  getScopeCensus,
  VFX_ACTION_GROUP_LABELS,
} from './DemoVfxActionScope';

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

function selectAction(actionKey: string): void {
  const select = q<HTMLSelectElement>('.cmp-action-select')!;
  select.value = actionKey;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function optionKeys(): string[] {
  return qa<HTMLOptionElement>('.cmp-action-select option').map((o) => o.value);
}

const DEMO_KEY = getActionsInScope('DEMO')[0]!.actionKey;
const UPCOMING_KEY = getActionsInScope('UPCOMING')[0]!.actionKey;

describe('V2.6.3 — DEMO scope UI', () => {
  let dispose: () => void = () => {};
  let origFetch: typeof fetch = () => Promise.resolve({ ok: false } as Response);

  beforeEach(() => {
    localStorage.clear();
    document.body.textContent = '';
    document.head.textContent = '';
    origFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/dev/vfx-runtime-status/')) {
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

  // ---------------------------------------------------------- scope selector

  it('1. renders both scope buttons with DEMO active by default', () => {
    expect(q('.cmp-scope-demo')).not.toBeNull();
    expect(q('.cmp-scope-upcoming')).not.toBeNull();
    expect(q('.cmp-scope-demo')!.classList.contains('is-active')).toBe(true);
    expect(q('.cmp-scope-upcoming')!.classList.contains('is-active')).toBe(false);
  });

  it('2. lists only DEMO actions in DEMO scope, in group order', () => {
    const grouped = getGroupedActionsInScope('DEMO').flatMap((b) => b.actions.map((a) => a.actionKey));
    expect(optionKeys()).toEqual(grouped);
    expect(new Set(optionKeys())).toEqual(new Set(getActionsInScope('DEMO').map((a) => a.actionKey)));
  });

  it('3. lists only UPCOMING actions after switching scope', () => {
    click(q('.cmp-scope-upcoming'));
    const grouped = getGroupedActionsInScope('UPCOMING').flatMap((b) => b.actions.map((a) => a.actionKey));
    expect(optionKeys()).toEqual(grouped);
    expect(new Set(optionKeys())).toEqual(new Set(getActionsInScope('UPCOMING').map((a) => a.actionKey)));
  });

  it('4. marks the active scope button and clears the other', () => {
    click(q('.cmp-scope-upcoming'));
    expect(q('.cmp-scope-upcoming')!.classList.contains('is-active')).toBe(true);
    expect(q('.cmp-scope-demo')!.classList.contains('is-active')).toBe(false);
  });

  it('5. groups actions under labelled optgroups in declared order', () => {
    const labels = qa<HTMLOptGroupElement>('.cmp-action-select optgroup').map((g) => g.label);
    const expected = getGroupedActionsInScope('DEMO').map((b) => b.label);
    expect(labels).toEqual(expected);
    for (const label of labels) {
      expect(Object.values(VFX_ACTION_GROUP_LABELS)).toContain(label);
    }
  });

  it('6. moves selection into the new scope when the current action leaves it', () => {
    selectAction(DEMO_KEY);
    click(q('.cmp-scope-upcoming'));
    const select = q<HTMLSelectElement>('.cmp-action-select')!;
    expect(getVfxActionScope(select.value)).toBe('UPCOMING');
  });

  it('7. persists the scope choice in UI prefs only', () => {
    click(q('.cmp-scope-upcoming'));
    expect(loadComposerUiPrefs(localStorage).authoringScope).toBe('UPCOMING');
    const raw = JSON.parse(localStorage.getItem(COMPOSER_UI_PREFS_KEY)!) as Record<string, unknown>;
    expect(Object.keys(raw).sort()).toEqual(['authoringScope', 'displayMode']);
  });

  it('8. defaults to DEMO scope when no preference is stored', () => {
    expect(loadComposerUiPrefs(localStorage).authoringScope).toBe('DEMO');
  });

  it('9. restores the scope that owns the persisted action, not the stored scope', () => {
    // Operator was last working on an UPCOMING action.
    selectAction(DEMO_KEY);
    click(q('.cmp-scope-upcoming'));
    selectAction(UPCOMING_KEY);
    dispose();
    document.body.textContent = '';

    // Corrupt the stored scope: the action must still win.
    saveComposerUiPrefs(localStorage, { displayMode: 'expanded', authoringScope: 'DEMO' });
    dispose = installVfxComposerPanel({ enabled: true });

    expect(q('.cmp-scope-upcoming')!.classList.contains('is-active')).toBe(true);
    expect(q<HTMLSelectElement>('.cmp-action-select')!.value).toBe(UPCOMING_KEY);
  });

  it('10. keeps the selected action when switching to a scope that already owns it', () => {
    selectAction(DEMO_KEY);
    click(q('.cmp-scope-demo'));
    expect(q<HTMLSelectElement>('.cmp-action-select')!.value).toBe(DEMO_KEY);
  });

  // ---------------------------------------------------------- workload dashboard

  it('11. shows the workload dashboard in DEMO scope', () => {
    expect(q('[data-section="demo_workload"]')).not.toBeNull();
  });

  it('12. hides the workload dashboard in UPCOMING scope', () => {
    click(q('.cmp-scope-upcoming'));
    expect(q('[data-section="demo_workload"]')).toBeNull();
  });

  it('13. renders all five workload counters', () => {
    const counters = qa('.cmp-workload-cell').map((c) => c.dataset.counter);
    expect(counters).toEqual(['total', 'published', 'ready', 'progress', 'remaining']);
  });

  it('14. reports the DEMO action total from the classifier', () => {
    const totalCell = q('.cmp-workload-cell[data-counter="total"] .cmp-workload-value');
    expect(totalCell!.textContent).toBe(String(getScopeCensus().demo));
  });

  it('15. renders one row per non-empty DEMO group', () => {
    const rows = qa('.cmp-workload-group').map((r) => r.dataset.group);
    expect(rows).toEqual(getGroupedActionsInScope('DEMO').map((b) => b.group));
  });

  it('16. shows the published ratio in the dashboard heading', () => {
    const heading = q('[data-section="demo_workload"] .cmp-section-heading');
    expect(heading!.textContent).toMatch(/DEMO WORKLOAD \(\d+\/\d+ PUBLISHED\)/);
  });

  // ---------------------------------------------------------- authoring parity

  it('17. exposes the same authoring controls in both scopes', () => {
    const demoControls = ['.cmp-add-slot', '.cmp-save-draft'].map((s) => Boolean(q(s)));
    click(q('.cmp-scope-upcoming'));
    const upcomingControls = ['.cmp-add-slot', '.cmp-save-draft'].map((s) => Boolean(q(s)));
    expect(upcomingControls).toEqual(demoControls);
  });

  it('18. never disables SAVE DRAFT because of scope', () => {
    click(q('.cmp-scope-upcoming'));
    const save = q<HTMLButtonElement>('.cmp-save-draft');
    expect(save).not.toBeNull();
    expect(save!.disabled).toBe(false);
  });

  it('19. lets an UPCOMING action be drafted and saved', () => {
    click(q('.cmp-scope-upcoming'));
    selectAction(UPCOMING_KEY);
    click(q('.cmp-save-draft'));
    const store = loadComposerStore(localStorage);
    expect(store.savedFingerprints?.[UPCOMING_KEY]).toBeTruthy();
  });

  it('20. keeps a draft intact across a scope round-trip', () => {
    selectAction(DEMO_KEY);
    click(q('.cmp-save-draft'));
    const before = loadComposerStore(localStorage).savedFingerprints?.[DEMO_KEY];

    click(q('.cmp-scope-upcoming'));
    click(q('.cmp-scope-demo'));

    const after = loadComposerStore(localStorage).savedFingerprints?.[DEMO_KEY];
    expect(after).toBe(before);
  });

  it('21. does not mutate drafts when the scope changes', () => {
    selectAction(DEMO_KEY);
    click(q('.cmp-save-draft'));
    const before = JSON.stringify(loadComposerStore(localStorage).drafts);
    click(q('.cmp-scope-upcoming'));
    expect(JSON.stringify(loadComposerStore(localStorage).drafts)).toBe(before);
  });

  it('22. keeps the selected action persisted across scope switches', () => {
    click(q('.cmp-scope-upcoming'));
    selectAction(UPCOMING_KEY);
    expect(loadComposerStore(localStorage).selectedActionKey).toBe(UPCOMING_KEY);
  });
});
