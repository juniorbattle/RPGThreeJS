// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { listSkillFxRecipes } from '../combat/fx/fxSkills';
import { AudioListeningLab } from './AudioListeningLab';
import type { UiSoundPlayer } from './UiSoundPlayer';

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

function lab() {
  const player = {
    beginCombat: vi.fn(), endCombat: vi.fn(), playCombat: vi.fn(), prepareCues: vi.fn(async () => true), stop: vi.fn(),
    setMusicContext: vi.fn(), setMusicScene: vi.fn(), setMusicLevel: vi.fn(), seekMusic: vi.fn(),
  };
  const root = document.createElement('div'), opener = document.createElement('button');
  root.append(opener); document.body.append(root); opener.focus();
  const view = new AudioListeningLab(root, player as unknown as UiSoundPlayer);
  view.open();
  return { player, root, opener, view, dialog: root.querySelector('[role="dialog"]')! };
}
const press = (dialog: Element, act: string) => dialog.querySelector<HTMLButtonElement>(`[data-act="${act}"]`)!.click();

it('offers every track, bridge, level, ambience, skill and enemy attack', () => {
  const { dialog } = lab();
  expect(dialog.querySelectorAll('tr[data-row^="piste:"]')).toHaveLength(9);
  expect(dialog.querySelectorAll('[data-act^="section:"]')).toHaveLength(7);
  expect(dialog.querySelectorAll('[data-act="level:action"]')).toHaveLength(2);
  expect(dialog.querySelectorAll('tr[data-row^="ambiance:"]')).toHaveLength(11);
  // the post-demo plateaux's six biomes, in their own section
  for (const id of ['bear_mountains', 'dragon_peaks', 'scorpion_desert', 'tournament_arena', 'corrupted_capital', 'breach']) expect(dialog.querySelector(`[data-act="ambience:${id}"]`), id).not.toBeNull();
  expect(dialog.querySelectorAll('tr[data-row^="compétence:"]')).toHaveLength(listSkillFxRecipes().length);
  expect(dialog.querySelectorAll('tr[data-row^="attaque:"]')).toHaveLength(14);
});

it('starts nothing by itself, then plays what is asked through the parent owner', () => {
  const { player, dialog } = lab();
  expect(player.setMusicContext).not.toHaveBeenCalled(); expect(player.playCombat).not.toHaveBeenCalled();
  press(dialog, 'section:combat:bridge');
  expect(player.setMusicContext).toHaveBeenLastCalledWith('combat'); expect(player.seekMusic).toHaveBeenCalledWith('bridge');
  press(dialog, 'level:action'); expect(player.setMusicLevel).toHaveBeenLastCalledWith('listening-lab', 'action');
  press(dialog, 'ambience:refuge'); expect(player.setMusicScene).toHaveBeenLastCalledWith('refuge');
  press(dialog, 'ambience:breach'); expect(player.setMusicScene).toHaveBeenLastCalledWith('breach');
});

it('offers the plateaux\'s sketches apart, each part\'s six tracks and the scene tracks, through the parent owner', () => {
  const { player, dialog } = lab();
  expect(dialog.querySelectorAll('tr[data-row^="esquisse:"]')).toHaveLength(4 * 6 + 7);
  expect(player.setMusicContext).not.toHaveBeenCalled();
  press(dialog, 'sketch:bear:map:');
  expect(player.setMusicContext).toHaveBeenLastCalledWith('map', { part: 'bear', scene: null });
  press(dialog, 'sketchsection:dragon:combat::bridge');
  expect(player.setMusicContext).toHaveBeenLastCalledWith('combat', { part: 'dragon', scene: null }); expect(player.seekMusic).toHaveBeenLastCalledWith('bridge');
  press(dialog, 'sketchentry:bear:boss:bear_hall_terrace');
  expect(player.setMusicContext.mock.calls.slice(-2)).toEqual([[null], ['boss', { part: 'bear', scene: 'bear_hall_terrace' }]]);
  dialog.querySelector<HTMLButtonElement>('tr[data-row="esquisse:scorpion:combat"] [data-act="sketchlevel:action"]')!.click();
  expect(player.setMusicLevel).toHaveBeenLastCalledWith('listening-lab', 'action');
});

it('plays an action as the game does: launch, marks on the FX clock, then the result family', () => {
  vi.useFakeTimers();
  const { player, dialog } = lab();
  press(dialog, 'skill:l_long_thrust');
  vi.advanceTimersByTime(2000);
  expect(player.playCombat.mock.calls.map((call) => call[0])).toEqual(['thrust', 'fx.thrust.sky.l', 'physical-impact']);
  player.playCombat.mockClear();
  press(dialog, 'skill:w_lion_surge');
  vi.advanceTimersByTime(3000);
  expect(player.playCombat.mock.calls.map((call) => call[0])).toEqual(['sig.w_lion_surge.charge', 'sig.w_lion_surge.blow', 'physical-impact', 'sig.w_lion_surge.wave']);
});

it('sums up what was rated, in a form the operator can send back', () => {
  const { dialog } = lab();
  const row = dialog.querySelector('tr[data-row="piste:combat"]')!;
  const verdict = row.querySelector<HTMLSelectElement>('[data-verdict]')!, note = row.querySelector<HTMLInputElement>('[data-note]')!;
  verdict.value = 'à revoir'; verdict.dispatchEvent(new Event('change', { bubbles: true }));
  note.value = 'pont trop lent'; note.dispatchEvent(new Event('input', { bubbles: true }));
  expect(dialog.querySelector<HTMLTextAreaElement>('#audio-lab-summary')!.value).toBe('piste Combat : à revoir (pont trop lent)');
});

it('owns focus only while open and returns the music to the title', () => {
  const { player, root, opener, dialog } = lab();
  expect(opener.inert).toBe(true);
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  expect(root.querySelector('[role="dialog"]')).toBeNull(); expect(opener.inert).toBe(false); expect(document.activeElement).toBe(opener);
  expect(player.endCombat).toHaveBeenCalledWith('listening-lab'); expect(player.setMusicContext).toHaveBeenLastCalledWith('title');
});

it('is reachable only behind the dev flag, so a player build carries no second audio surface', () => {
  const app = readFileSync('src/game/GameApp.ts', 'utf8');
  expect(app).not.toMatch(/^import .*AudioListeningLab/m);
  expect(app).toMatch(/if \(import\.meta\.env\.DEV\) void import\('\.\.\/ui\/AudioListeningLab'\)/);
  expect(readFileSync('src/ui/AudioListeningLab.ts', 'utf8')).not.toContain('new AudioContext');
});
