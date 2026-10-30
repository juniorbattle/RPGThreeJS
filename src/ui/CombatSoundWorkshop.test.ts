// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { CombatSoundWorkshop } from './CombatSoundWorkshop';
import { UiSoundPlayer } from './UiSoundPlayer';

afterEach(() => { document.body.replaceChildren(); localStorage.clear(); vi.restoreAllMocks(); });

it('lists the sixteen families; with effects off it explains and disables previews; a choice updates the summary only', () => {
  const player = new UiSoundPlayer({ music: null, synth: null });
  const preview = vi.spyOn(player, 'preview');
  const root = document.createElement('div'), opener = document.createElement('button');
  root.append(opener); document.body.append(root); opener.focus();
  new CombatSoundWorkshop(root, player).open();
  const dialog = root.querySelector('[role="dialog"]')!;
  expect(dialog.querySelectorAll('tr[data-family]')).toHaveLength(16);
  expect(dialog.querySelector('[data-workshop-status]')?.textContent).toContain('Activez les sons');
  expect([...dialog.querySelectorAll<HTMLButtonElement>('[data-preview]')].every(b => b.disabled)).toBe(true);
  const select = dialog.querySelector<HTMLSelectElement>('tr[data-family="miss"] select')!;
  select.value = 'synth'; select.dispatchEvent(new Event('change', { bubbles: true }));
  expect(player.combatSource('miss')).toBe('synth'); expect(preview).not.toHaveBeenCalled();
  expect(dialog.querySelector<HTMLTextAreaElement>('textarea')!.value).toContain('Synthèse : miss');
  dialog.querySelector<HTMLButtonElement>('[data-all="file"]')!.click();
  expect(player.combatSource('miss')).toBe('file');
  expect(dialog.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Fichier pour les 16 familles.');
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  expect(root.querySelector('[role="dialog"]')).toBeNull(); expect(opener.inert).toBe(false); expect(document.activeElement).toBe(opener);
  player.dispose();
});
