// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UiSoundPlayer } from './UiSoundPlayer';
import { UiSoundSettings } from './UiSoundSettings';
import { readMotionPreference, writeMotionPreference } from './MotionPreference';
import { combatGraphicsMessageSchema } from '../combat/protocol';

// OD-2026-11-05-B: one settings menu for sound, display and controls; reduced motion is the player's choice on this device.
let player: UiSoundPlayer;
let root: HTMLElement;

function mediaQuery(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: globalThis.matchMedia });
}

beforeEach(() => {
  localStorage.clear();
  mediaQuery(false);
  player = new UiSoundPlayer({ music: null });
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  player.dispose();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('single settings menu', () => {
  it('gathers sound, music, display and controls in one dialog that still opens on the sound toggle and ends on Fermer', () => {
    let reduced = false;
    const set = vi.fn((value: boolean) => { reduced = value; });
    new UiSoundSettings(root, player, { motion: { get: () => reduced, set } }).open();
    const dialog = root.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('h2')?.textContent).toBe('Réglages');
    const tabs = [...dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs.map(tab => tab.textContent)).toEqual(['Son', 'Affichage', 'Commandes']);
    expect(tabs.map(tab => tab.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(document.activeElement?.textContent).toBe('Couper les sons');
    const controls = [...dialog.querySelectorAll<HTMLElement>('button,input')];
    expect(controls.at(-1)?.textContent).toBe('Fermer');
    expect(dialog.querySelector<HTMLElement>('#ui-settings-panel-controls')!.hidden).toBe(true);

    // Arrow keys move between tabs and show their panel, as a controller's D-pad does.
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(tabs[2]);
    expect(dialog.querySelector<HTMLElement>('#ui-settings-panel-controls')!.hidden).toBe(false);
    expect(dialog.querySelector<HTMLElement>('#ui-settings-panel-sound')!.hidden).toBe(true);
    expect(dialog.querySelector('.ui-settings__controls')?.textContent).toContain('A ou Croix pour valider');
    tabs[1]!.click();
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(dialog.querySelector<HTMLElement>('#ui-settings-panel-display')!.hidden).toBe(false);

    const motion = dialog.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
    expect(motion.textContent).toBe('Mouvement réduit : désactivé');
    expect(motion.getAttribute('aria-pressed')).toBe('false');
    motion.click();
    expect(set).toHaveBeenCalledWith(true);
    expect(motion.textContent).toBe('Mouvement réduit : activé');
    expect(motion.getAttribute('aria-pressed')).toBe('true');
    expect(dialog.querySelector('[data-motion-system]')).toBeNull();
  });

  it('no longer mentions the system preference, which no longer reduces motion (set 1.22.0), and hides the display part without a motion owner', () => {
    mediaQuery(true);
    new UiSoundSettings(root, player, { motion: { get: () => false, set: vi.fn() } }).open();
    expect(root.querySelector('[data-motion-system]')).toBeNull();
    expect(root.querySelector('[data-motion-toggle]')?.getAttribute('aria-pressed')).toBe('false');
    root.replaceChildren();
    new UiSoundSettings(root, player).open();
    expect(root.querySelector('[data-motion-toggle]')).toBeNull();
    expect([...root.querySelectorAll('[role="tab"]')].map(tab => tab.textContent)).toEqual(['Son', 'Commandes']);
    expect(root.querySelector('[data-motion-system]')).toBeNull();
  });
});

describe('reduced motion preference', () => {
  it('stays unset until chosen, survives a reload and ignores a damaged value', () => {
    expect(readMotionPreference()).toBeNull();
    writeMotionPreference(true);
    expect(readMotionPreference()).toBe(true);
    writeMotionPreference(false);
    expect(readMotionPreference()).toBe(false);
    localStorage.setItem('rpg-threejs:motion-preference:v1', '{broken');
    expect(readMotionPreference()).toBeNull();
    localStorage.setItem('rpg-threejs:motion-preference:v1', JSON.stringify({ reduced: 'yes' }));
    expect(readMotionPreference()).toBeNull();
  });

  it('reaches a running fight through a strict presentation message', () => {
    expect(combatGraphicsMessageSchema.safeParse({ type: 'rpg-threejs:combat-graphics', reducedGraphics: true }).success).toBe(true);
    expect(combatGraphicsMessageSchema.safeParse({ type: 'rpg-threejs:combat-graphics', reducedGraphics: true, gold: 5 }).success).toBe(false);
    expect(combatGraphicsMessageSchema.safeParse({ type: 'rpg-threejs:combat-graphics' }).success).toBe(false);
  });
});

describe('closing the menu', () => {
  it('restores once even when the restore redraws the screen and closes the menu again', () => {
    const settings: UiSoundSettings = new UiSoundSettings(root, player);
    const restore = vi.fn(() => settings.close());
    settings.open(restore);
    expect(() => settings.close()).not.toThrow();
    expect(restore).toHaveBeenCalledTimes(1);
    expect(root.querySelector('[role="dialog"]')).toBeNull();
  });
});
