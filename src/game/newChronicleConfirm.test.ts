// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, SaveRepository } from './store';
import { GameApp } from './GameApp';

const AUTO_KEY = 'rpg-threejs:autosave:v6:campaign';

afterEach(() => { localStorage.clear(); document.body.replaceChildren(); vi.restoreAllMocks(); });

function mountTitle() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = new GameApp(root, document.createElement('canvas'));
  const owner = app as unknown as { renderTitle(): void; startNewChronicle(): Promise<void> };
  const start = vi.spyOn(owner, 'startNewChronicle').mockResolvedValue();
  owner.renderTitle();
  return { app, root, start };
}

describe('Nouvelle chronique asks before erasing a chronicle in progress (final audit 2026-11-11, A3)', () => {
  it('starts at once when there is nothing to erase', () => {
    const { app, root, start } = mountTitle();
    root.querySelector<HTMLButtonElement>('[data-action="new"]')!.click();
    expect(start).toHaveBeenCalledOnce();
    expect(root.querySelector('.title-screen__confirm')).toBeNull();
    app.dispose();
  });

  it('keeps the chronicle by default, by button or by Escape, without touching the save', () => {
    new SaveRepository().saveAuto(createInitialState());
    const bytes = localStorage.getItem(AUTO_KEY);
    const { app, root, start } = mountTitle();
    root.querySelector<HTMLButtonElement>('[data-action="new"]')!.click();
    const panel = root.querySelector<HTMLElement>('.title-screen__confirm')!;
    expect(panel.getAttribute('role')).toBe('alertdialog');
    expect(panel.textContent).toContain('efface la chronique en cours');
    expect(document.activeElement).toBe(root.querySelector('[data-action="keep-chronicle"]'));
    root.querySelector<HTMLButtonElement>('[data-action="keep-chronicle"]')!.click();
    expect(root.querySelector('.title-screen__confirm')).toBeNull();
    expect(root.querySelector('[data-action="continue"]')).not.toBeNull();

    root.querySelector<HTMLButtonElement>('[data-action="new"]')!.click();
    root.querySelector('.title-screen__confirm')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(root.querySelector('.title-screen__confirm')).toBeNull();
    expect(start).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTO_KEY)).toBe(bytes);
    app.dispose();
  });

  it('erases and starts only after the explicit confirmation', () => {
    new SaveRepository().saveAuto(createInitialState());
    const { app, root, start } = mountTitle();
    root.querySelector<HTMLButtonElement>('[data-action="new"]')!.click();
    expect(start).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('[data-action="confirm-new"]')!.click();
    expect(start).toHaveBeenCalledOnce();
    app.dispose();
  });
});
