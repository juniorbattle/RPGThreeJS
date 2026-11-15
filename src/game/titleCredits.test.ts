// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

// The credits text belongs to the operator; this test only lends the screen two neutral lines to check its behaviour.
vi.mock('../ui/credits', () => ({ CREDITS_LINES: ['Ligne A', '', 'Ligne B'], hasCredits: () => true }));
const { GameApp } = await import('./GameApp');

afterEach(() => { localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('title credits (title screen pass 2026-11-15)', () => {
  it('opens on the same backdrop and gives focus back to « Crédits » by Retour or Escape', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const app = new GameApp(root, document.createElement('canvas'));
    (app as unknown as { renderTitle(): void }).renderTitle();
    root.querySelector<HTMLButtonElement>('[data-action="credits"]')!.click();
    const credits = root.querySelector<HTMLElement>('.title-screen--credits')!;
    expect(credits.classList.contains('ui-screen')).toBe(false);
    expect(document.activeElement?.textContent).toBe('Retour');
    (document.activeElement as HTMLButtonElement).click();
    expect(document.activeElement).toBe(root.querySelector('[data-action="credits"]'));

    root.querySelector<HTMLButtonElement>('[data-action="credits"]')!.click();
    root.querySelector('.title-screen--credits')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(root.querySelector('.title-screen--credits')).toBeNull();
    expect(document.activeElement).toBe(root.querySelector('[data-action="credits"]'));
    app.dispose();
  });
});
