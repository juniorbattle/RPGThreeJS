// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultLabState, setDisplayMode, getDisplayMode } from './CombatVfxLab';
import { installCombatVfxLabWorkbench } from './CombatVfxLabWorkbench';
import type { LabState } from './CombatVfxLab';

const ROOT_ID = 'r2c-vfx-lab';
const LAB_STORAGE_KEY = 'r2c-combat-vfx-lab-state';

function getRoot(): HTMLElement {
  return document.getElementById(ROOT_ID)!;
}

function flushRender(): void {
  vi.advanceTimersByTime(100);
}

describe('R2C-LAB V1E.2.1 — True Compact Floating Test Dock', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    localStorage.clear();
  });

  function setupWorkbench(state?: LabState): () => void {
    const s = state ?? createDefaultLabState();
    localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(s));
    return installCombatVfxLabWorkbench({ enabled: true });
  }

  it('1. minimized dock has dedicated compact class on root', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    expect(getRoot().classList.contains('lab-minimized')).toBe(true);
  });

  it('2. dock is fixed/floating (root has position:fixed)', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const style = window.getComputedStyle(getRoot());
    expect(style.position).toBe('fixed');
  });

  it('3. dock does not use full-width stretching', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const root = getRoot();
    // The compact class must be present (overrides width)
    expect(root.classList.contains('lab-minimized')).toBe(true);
    // Check that the style element contains the compact width rule
    const styleEl = document.getElementById('r2c-vfx-lab-style');
    expect(styleEl).toBeTruthy();
    const css = styleEl!.textContent ?? '';
    // Must contain clamp-based width for the minimized root
    expect(css).toContain('clamp(340px,24vw,430px)');
    // The minimized root rule must not use width:100%
    const minimizedRule = css.match(new RegExp(`#${ROOT_ID}\\.lab-minimized\\{[^}]*\\}`))?.[0] ?? '';
    expect(minimizedRule).not.toContain('width:100%');
    expect(minimizedRule).toContain('clamp');
  });

  it('4. OPEN LAB preserved in minimized dock', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const openBtn = getRoot().querySelector('.lab-dock-open-btn');
    expect(openBtn).toBeTruthy();
    expect((openBtn as HTMLElement).textContent).toContain('OPEN LAB');
  });

  it('5. QA Stage button preserved with compact label', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const buttons = getRoot().querySelectorAll('.lab-dock-play-btn');
    const qaBtn = Array.from(buttons).find(b => b.textContent?.includes('QA'));
    expect(qaBtn).toBeTruthy();
    // Compact label should contain "STAGE" or "REQUIRED"
    expect(qaBtn!.textContent).toMatch(/STAGE|REQUIRED/);
    // Should have tooltip with full description
    expect((qaBtn as HTMLElement).title).toContain('Combat Stage');
  });

  it('6. Validated Stage button preserved with compact label', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const buttons = getRoot().querySelectorAll('.lab-dock-play-btn');
    const valBtn = Array.from(buttons).find(b => b.textContent?.includes('VALIDATED'));
    expect(valBtn).toBeTruthy();
    expect((valBtn as HTMLElement).title).toContain('Combat Stage');
  });

  it('7. Production Stage button preserved with compact label', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const buttons = getRoot().querySelectorAll('.lab-dock-play-btn');
    const prodBtn = Array.from(buttons).find(b =>
      b.textContent?.includes('PRODUCTION') || b.textContent?.includes('APPLY VALIDATED')
    );
    expect(prodBtn).toBeTruthy();
    if (prodBtn!.textContent?.includes('PRODUCTION')) {
      expect((prodBtn as HTMLElement).title).toContain('Combat Stage');
    }
  });

  it('8. PREV/NEXT preserved in minimized dock', () => {
    const state = setDisplayMode(createDefaultLabState(), 'MINIMIZED');
    setupWorkbench(state);
    flushRender();
    const nav = getRoot().querySelector('.lab-dock-nav');
    expect(nav).toBeTruthy();
    const prevBtn = nav!.querySelector('.lab-nav-btn');
    expect(prevBtn).toBeTruthy();
    expect(prevBtn!.textContent).toContain('PREV');
    const nextBtn = nav!.querySelector('.lab-nav-next');
    expect(nextBtn).toBeTruthy();
    expect(nextBtn!.textContent).toContain('NEXT');
  });

  it('9. expanded workbench unchanged — no lab-minimized class', () => {
    setupWorkbench();
    flushRender();
    const root = getRoot();
    expect(root.classList.contains('lab-minimized')).toBe(false);
    const workbench = root.querySelector('.lab-workbench') as HTMLElement;
    expect(workbench).toBeTruthy();
    expect(workbench.style.display).not.toBe('none');
  });

  it('10. lifecycle/playback state unchanged — displayMode toggles correctly', () => {
    let state = createDefaultLabState();
    expect(getDisplayMode(state)).toBe('EXPANDED');
    state = setDisplayMode(state, 'MINIMIZED');
    expect(getDisplayMode(state)).toBe('MINIMIZED');
    state = setDisplayMode(state, 'EXPANDED');
    expect(getDisplayMode(state)).toBe('EXPANDED');
  });
});
