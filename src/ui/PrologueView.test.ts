// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assets } from '../render/assetManifest';
import { PrologueView } from './PrologueView';

function view() {
  const root = document.createElement('div');
  document.body.append(root);
  return { root, prologue: new PrologueView(root) };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('PrologueView', () => {
  it('walks the five panels and closes on the last one', async () => {
    const { root, prologue } = view();
    const done = prologue.open();
    for (let i = 0; i < 4; i += 1) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(root.querySelector<HTMLElement>('.prologue-view')?.dataset.panel).toBe('prologue_departure');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await done;
    expect(root.querySelector('.prologue-view')).toBeNull();
  });

  it('keeps the text and the way out when a panel has no image', async () => {
    const scenes = assets.prologueScenes as Record<string, string | undefined>;
    const original = scenes.prologue_fall;
    scenes.prologue_fall = undefined;
    try {
      const { root, prologue } = view();
      const done = prologue.open();
      const element = root.querySelector<HTMLElement>('.prologue-view')!;
      expect(element.style.getPropertyValue('--prologue-bg-image')).toBe('');
      expect(element.querySelector('h1')?.textContent).toBe('Le clan déchu');
      element.querySelector<HTMLElement>('[data-prologue-skip]')!.click();
      await done;
    } finally {
      scenes.prologue_fall = original;
    }
  });

  it('asks for the reduced alternative from the game setting or the system', async () => {
    const { root, prologue } = view();
    void prologue.open();
    expect(root.querySelector<HTMLElement>('.prologue-view')?.dataset.reducedMotion).toBe('false');
    void prologue.open({ reducedMotion: true });
    expect(root.querySelector<HTMLElement>('.prologue-view')?.dataset.reducedMotion).toBe('true');
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    void prologue.open({ reducedMotion: false });
    expect(root.querySelector<HTMLElement>('.prologue-view')?.dataset.reducedMotion).toBe('true');
    prologue.close();
  });

  it('stops the mist under both reductions', () => {
    const css = readFileSync('src/styles/app.css', 'utf8');
    expect(css).toContain('.prologue-view[data-reduced-motion="true"] .prologue-view__mist');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.prologue-view__painted, \.prologue-view__mist, \.prologue-view__card \{ animation: none; \}/);
    expect(css).toContain('var(--prologue-bg-image, none)');
  });
});
