// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JourneyOverlay } from './JourneyOverlay';
import type { JourneyCommit } from './JourneyTypes';

function createOverlay(
  presentation: ConstructorParameters<typeof JourneyOverlay>[0],
  options: ConstructorParameters<typeof JourneyOverlay>[2] = {},
) {
  const commits: JourneyCommit[] = [];
  const overlay = new JourneyOverlay(presentation, { onCommit: (commit) => commits.push(commit) }, options);
  overlay.mount();
  return { overlay, commits };
}

describe('journey overlay', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('renders a single continuation affordance when there are no choices', () => {
    const { overlay, commits } = createOverlay({ choices: [], continueLabel: 'Poursuivre' });
    const button = document.querySelector<HTMLButtonElement>('[data-journey-continue]');
    expect(button?.textContent).toBe('Poursuivre');
    expect(document.querySelectorAll('[data-journey-choice]')).toHaveLength(0);
    button?.click();
    expect(commits).toEqual([{ kind: 'continue', id: null }]);
    overlay.dispose();
  });

  it('renders route choices with their presentation metadata', () => {
    const { overlay, commits } = createOverlay({
      title: 'La route se divise',
      caption: 'Présentation seule',
      choices: [
        { id: 'plains', label: 'Plaines', category: 'Voyage', difficulty: 'Calme', hint: 'Direct', reward: 'Vivres' },
        { id: 'pass', label: 'Col', category: 'Embuscade', risk: 'Blessures' },
        { id: 'sealed', label: 'Scellé', disabled: true },
      ],
    });
    expect(document.querySelectorAll('[data-journey-choice]')).toHaveLength(3);
    expect(document.querySelector('.journey-overlay__title')?.textContent).toBe('La route se divise');
    expect(document.querySelector('.journey-overlay__caption')?.textContent).toBe('Présentation seule');
    const plains = document.querySelector<HTMLButtonElement>('[data-journey-choice="plains"]');
    expect(plains?.querySelector('.journey-overlay__meta')?.textContent).toBe('Voyage · Calme');
    expect(plains?.querySelector('.journey-overlay__hint')?.textContent).toBe('Direct');
    expect(plains?.querySelector('.journey-overlay__tag--reward')?.textContent).toBe('Vivres');
    expect(document.querySelector('[data-journey-choice="pass"] .journey-overlay__tag--risk')?.textContent).toBe('Blessures');
    expect(document.querySelector<HTMLButtonElement>('[data-journey-choice="sealed"]')?.disabled).toBe(true);
    expect(document.querySelectorAll('[data-journey-continue]')).toHaveLength(0);
    plains?.click();
    expect(commits).toEqual([{ kind: 'choice', id: 'plains' }]);
    overlay.dispose();
  });

  it('never commits a disabled choice', () => {
    const { overlay, commits } = createOverlay({ choices: [{ id: 'sealed', label: 'Scellé', disabled: true }] });
    document.querySelector<HTMLButtonElement>('[data-journey-choice="sealed"]')?.click();
    expect(commits).toEqual([]);
    expect(overlay.isCommitted).toBe(false);
    overlay.dispose();
  });

  it('commits at most once and latches every affordance', () => {
    const { overlay, commits } = createOverlay({
      choices: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      secondary: [{ id: 'MENU', label: 'Menu' }],
    });
    document.querySelector<HTMLButtonElement>('[data-journey-choice="a"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-journey-choice="b"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-journey-secondary="MENU"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-journey-choice="a"]')?.click();
    expect(commits).toEqual([{ kind: 'choice', id: 'a' }]);
    expect(overlay.isCommitted).toBe(true);
    expect([...document.querySelectorAll<HTMLButtonElement>('.journey-overlay button')].every((b) => b.disabled)).toBe(true);
    overlay.dispose();
  });

  it('commits secondary actions with their generic ID', () => {
    const { overlay, commits } = createOverlay({
      choices: [{ id: 'a', label: 'A' }],
      secondary: [{ id: 'COMPANY', label: 'Compagnie' }, { id: 'SAVE', label: 'Sauvegarder', disabled: true }],
    });
    expect(document.querySelectorAll('[data-journey-secondary]')).toHaveLength(2);
    expect(document.querySelector<HTMLButtonElement>('[data-journey-secondary="SAVE"]')?.disabled).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-journey-secondary="COMPANY"]')?.click();
    expect(commits).toEqual([{ kind: 'secondary', id: 'COMPANY' }]);
    overlay.dispose();
  });

  it('hides the secondary bar when no secondary action is offered', () => {
    const { overlay } = createOverlay({ choices: [{ id: 'a', label: 'A' }] });
    expect(document.querySelector<HTMLElement>('.journey-overlay__secondary')?.hidden).toBe(true);
    overlay.dispose();
  });

  it('focuses the first enabled affordance and restores focus on dispose', () => {
    const anchor = document.createElement('button');
    document.body.append(anchor);
    anchor.focus();
    const { overlay } = createOverlay({
      choices: [{ id: 'sealed', label: 'Scellé', disabled: true }, { id: 'open', label: 'Ouvert' }],
    });
    expect(document.activeElement).toBe(document.querySelector('[data-journey-choice="open"]'));
    overlay.dispose();
    expect(document.activeElement).toBe(anchor);
    expect(document.querySelector('.journey-overlay')).toBeNull();
  });

  it('is inert after disposal and disposes only once', () => {
    const { overlay, commits } = createOverlay({ choices: [{ id: 'a', label: 'A' }] });
    const button = document.querySelector<HTMLButtonElement>('[data-journey-choice="a"]');
    overlay.dispose();
    overlay.dispose();
    button?.click();
    expect(commits).toEqual([]);
    expect(document.querySelector('.journey-overlay')).toBeNull();
  });

  it('marks itself standalone only when no frozen surface sits behind it', () => {
    const standalone = createOverlay({ choices: [] }, { standalone: true });
    expect(document.querySelector('.journey-overlay--standalone')).not.toBeNull();
    standalone.overlay.dispose();
    const layered = createOverlay({ choices: [] });
    expect(document.querySelector('.journey-overlay--standalone')).toBeNull();
    expect(document.querySelector('.journey-overlay')).not.toBeNull();
    layered.overlay.dispose();
  });

  it('renders presentation labels as text, never as markup', () => {
    const { overlay } = createOverlay({
      title: '<script>bad</script>',
      choices: [{ id: 'a', label: '<img src=x>', hint: '<b>hint</b>' }],
    });
    expect(document.querySelector('.journey-overlay img')).toBeNull();
    expect(document.querySelector('.journey-overlay script')).toBeNull();
    expect(document.querySelector('[data-journey-choice="a"] b')?.textContent).toBe('<img src=x>');
    expect(document.querySelector('.journey-overlay__hint')?.textContent).toBe('<b>hint</b>');
    overlay.dispose();
  });

  it('mounts into a provided root', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const { overlay } = createOverlay({ choices: [] }, { root });
    expect(root.querySelector('.journey-overlay')).not.toBeNull();
    overlay.dispose();
    expect(root.querySelector('.journey-overlay')).toBeNull();
  });
});
