// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../game/store';
import { getAvailableRunNodes } from '../game/runSystem';
import { TraversalForkOverlay } from './TraversalForkOverlay';

describe('TraversalForkOverlay', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders RunSystem fork choices in a right-side traversal rail', () => {
    const state = createInitialState();
    state.run.currentNodeId = 'lion-refugees';
    state.currentNodeId = 'lion-refugees';
    const available = getAvailableRunNodes(state);
    const selected: string[] = [];

    const overlay = new TraversalForkOverlay(available, { onSelect: (id) => selected.push(id) });
    overlay.mount();

    expect(document.querySelector('.traversal-fork-overlay__rail')).not.toBeNull();
    expect(document.querySelector('.traversal-fork-overlay')?.getAttribute('aria-modal')).toBe('false');
    expect(document.querySelector('.traversal-fork-overlay')?.getAttribute('data-traversal-world-preserved')).toBe('true');
    expect(document.querySelectorAll('[data-traversal-fork-choice]')).toHaveLength(2);
    expect(document.querySelector('[data-traversal-fork-choice="lion-first-trial-event"] strong')?.textContent)
      .toBe(available[0]!.label);

    document.querySelector<HTMLButtonElement>('[data-traversal-fork-choice="lion-first-trial-combat"]')?.click();
    expect(selected).toEqual(['lion-first-trial-combat']);
    expect(overlay.isCommitted).toBe(true);
    overlay.dispose();
  });

  it('commits at most once and disables the whole choice rail', () => {
    const state = createInitialState();
    state.run.currentNodeId = 'lion-refugees';
    state.currentNodeId = 'lion-refugees';
    const available = getAvailableRunNodes(state);
    const onSelect = vi.fn();
    const overlay = new TraversalForkOverlay(available, { onSelect });
    overlay.mount();

    const first = document.querySelector<HTMLButtonElement>('[data-traversal-fork-choice="lion-first-trial-event"]');
    const second = document.querySelector<HTMLButtonElement>('[data-traversal-fork-choice="lion-first-trial-combat"]');
    first?.click();
    second?.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect([...document.querySelectorAll<HTMLButtonElement>('.traversal-fork-overlay button')]
      .every((button) => button.disabled)).toBe(true);
    overlay.dispose();
  });

  it('renders all labels as text and never injects route markup', () => {
    const state = createInitialState();
    state.run.currentNodeId = 'lion-refugees';
    state.currentNodeId = 'lion-refugees';
    const [source] = getAvailableRunNodes(state);
    const unsafe = { ...source!, label: '<img src=x onerror=bad>' };
    const overlay = new TraversalForkOverlay([unsafe], { onSelect: () => undefined });
    overlay.mount();

    expect(document.querySelector('.traversal-fork-overlay img')).toBeNull();
    expect(document.querySelector('[data-traversal-fork-choice] strong')?.textContent)
      .toBe('<img src=x onerror=bad>');
    overlay.dispose();
  });
});
