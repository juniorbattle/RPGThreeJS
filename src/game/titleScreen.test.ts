// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, SaveRepository } from './store';
import { GameApp } from './GameApp';

afterEach(() => { localStorage.clear(); document.body.replaceChildren(); });

function mountTitle() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = new GameApp(root, document.createElement('canvas'));
  (app as unknown as { renderTitle(): void }).renderTitle();
  const entries = [...root.querySelectorAll<HTMLButtonElement>('.title-screen__actions button')].map((button) => button.dataset.action);
  return { app, root, entries };
}

describe('title screen (OD-2026-11-15-D)', () => {
  it('shows no dead « Continuer » without a save and leads with « Nouvelle chronique »', () => {
    const { app, root, entries } = mountTitle();
    expect(entries).toEqual(['new', 'settings']);
    expect(root.querySelector('[data-action="new"]')!.classList.contains('is-primary')).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('[data-action="new"]'));
    app.dispose();
  });

  it('leads with « Continuer » when a chronicle exists', () => {
    new SaveRepository().saveAuto(createInitialState());
    const { app, root, entries } = mountTitle();
    expect(entries).toEqual(['continue', 'new', 'settings']);
    expect(root.querySelector('[data-action="continue"]')!.classList.contains('is-primary')).toBe(true);
    expect(root.querySelector('[data-action="new"]')!.classList.contains('is-primary')).toBe(false);
    expect(document.activeElement).toBe(root.querySelector('[data-action="continue"]'));
    app.dispose();
  });

  it('carries the operator’s tagline and the brass lockup instead of the star glyph', () => {
    const { app, root } = mountTitle();
    expect(root.querySelector('.title-screen__lead')!.textContent).toBe('Honneur ou force : chaque Sceau se gagne à votre façon.');
    expect(root.querySelector('.title-screen__sigil')).toBeNull();
    expect(root.querySelector('.title-screen')!.textContent).not.toContain('✦');
    app.dispose();
  });
});
