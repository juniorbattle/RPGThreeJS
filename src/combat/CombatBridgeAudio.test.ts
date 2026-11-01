// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { CombatBridge } from './CombatBridge';
import type { UiSoundPlayer } from '../ui/UiSoundPlayer';
import type { CombatConfig } from '../game/types';

let bridge: CombatBridge;
afterEach(() => { bridge?.dispose(); document.body.replaceChildren(); vi.restoreAllMocks(); });
it('accepts sounds only from its current iframe, origin and session; closes the same gesture scope', () => {
  vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(() => {});
  const detach = vi.fn(), player = { beginCombat: vi.fn(), endCombat: vi.fn(), playCombat: vi.fn(), observeGestures: vi.fn(() => detach) };
  const openSettings = vi.fn(), root = document.createElement('div'); document.body.append(root);
  bridge = new CombatBridge(root, { player: player as unknown as UiSoundPlayer, openSettings });
  const session = { config: { id: 'test', encounterLabel: 'Test' } as CombatConfig, clan: [], inventory: {}, preferredUnitIds: [], reducedGraphics: false };
  bridge.start(session); const iframe = root.querySelector('iframe')!;
  iframe.dispatchEvent(new Event('load')); expect(player.observeGestures).toHaveBeenCalledOnce();
  const sessionId = player.beginCombat.mock.calls[0]![0];
  const message = (data: unknown, origin = window.location.origin, source: MessageEventSource | null = iframe.contentWindow) => window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  const cue = { type: 'rpg-threejs:combat-sound', sessionId, id: 'thrust', eventId: 'a:launch' };
  message(cue, 'https://wrong.invalid'); message(cue, window.location.origin, window); message({ ...cue, sessionId: 'stale' });
  message({ ...cue, id: 'saved' }); expect(player.playCombat).not.toHaveBeenCalled();
  message(cue); expect(player.playCombat).toHaveBeenCalledWith('thrust', sessionId, 'a:launch');
  message({ type: 'rpg-threejs:combat-sound-settings', sessionId }); expect(openSettings).toHaveBeenCalledOnce();
  bridge.close(); expect(detach).toHaveBeenCalledOnce(); expect(player.endCombat).toHaveBeenCalledWith(sessionId);
  message(cue); expect(player.playCombat).toHaveBeenCalledOnce();
});

it('takes level and outcome only as strict messages from its frame, origin and session, with the result as fallback', () => {
  vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(() => {});
  const player = { beginCombat: vi.fn(), endCombat: vi.fn(), playCombat: vi.fn(), observeGestures: vi.fn(() => vi.fn()), setMusicLevel: vi.fn(), playMusicOutcome: vi.fn() };
  const root = document.createElement('div'); document.body.append(root);
  bridge = new CombatBridge(root, { player: player as unknown as UiSoundPlayer, openSettings: vi.fn() });
  const session = { config: { id: 'test', encounterLabel: 'Test' } as CombatConfig, clan: [], inventory: {}, preferredUnitIds: [], reducedGraphics: false };
  bridge.start(session); const iframe = root.querySelector('iframe')!, sessionId = player.beginCombat.mock.calls[0]![0];
  const message = (data: unknown, origin = window.location.origin, source: MessageEventSource | null = iframe.contentWindow) => window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  const level = { type: 'rpg-threejs:combat-music-level', sessionId, level: 'action' };
  const outcome = { type: 'rpg-threejs:combat-music-outcome', sessionId, outcome: 'victory' };
  for (const good of [level, outcome]) {
    message(good, 'https://wrong.invalid'); message(good, window.location.origin, window);
    message({ ...good, sessionId: 'stale' }); message({ ...good, unit: 'hero', damage: 12 });
  }
  message({ ...level, level: 'panic' }); message({ ...outcome, outcome: 'draw' });
  expect(player.setMusicLevel).not.toHaveBeenCalled(); expect(player.playMusicOutcome).not.toHaveBeenCalled();
  message(level); expect(player.setMusicLevel).toHaveBeenCalledWith(sessionId, 'action');
  message(outcome); expect(player.playMusicOutcome).toHaveBeenCalledWith(sessionId, 'victory');
  bridge.start(session); const next = root.querySelector('iframe')!, nextId = player.beginCombat.mock.calls[1]![0];
  message({ type: 'rpg-threejs:combat-result', victory: false, combatId: 'test', inventory: {}, participants: [], unitHealth: {} }, window.location.origin, next.contentWindow);
  expect(player.playMusicOutcome).toHaveBeenLastCalledWith(nextId, 'defeat');
  expect(player.endCombat).toHaveBeenLastCalledWith(nextId);
  expect(player.playMusicOutcome.mock.invocationCallOrder.at(-1)!).toBeLessThan(player.endCombat.mock.invocationCallOrder.at(-1)!);
});

it('optional crypto failure cannot prevent combat, and a late old load cannot detach the new gesture listener', () => {
  vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(() => {});
  vi.spyOn(crypto, 'randomUUID').mockImplementationOnce(() => { throw Error('unavailable'); });
  const detach = vi.fn(), player = { beginCombat: vi.fn(), endCombat: vi.fn(), playCombat: vi.fn(), observeGestures: vi.fn(() => detach) };
  const root = document.createElement('div'); document.body.append(root);
  bridge = new CombatBridge(root, { player: player as unknown as UiSoundPlayer, openSettings: vi.fn() });
  const session = { config: { id: 'test', encounterLabel: 'Test' } as CombatConfig, clan: [], inventory: {}, preferredUnitIds: [], reducedGraphics: false };
  expect(() => bridge.start(session)).not.toThrow();
  const first = root.querySelector('iframe')!; first.dispatchEvent(new Event('load'));
  bridge.start(session); const second = root.querySelector('iframe')!; second.dispatchEvent(new Event('load'));
  const count = detach.mock.calls.length; first.dispatchEvent(new Event('load'));
  expect(detach).toHaveBeenCalledTimes(count);
  expect(player.observeGestures).toHaveBeenCalledTimes(2);
  expect(player.beginCombat.mock.calls[0]![0]).not.toBe(player.beginCombat.mock.calls[1]![0]);
});

it('selects combat or boss music and the arena ambience from the hand-off only (OD-2026-10-29-B)', () => {
  vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(() => {});
  const player = { beginCombat: vi.fn(), endCombat: vi.fn(), playCombat: vi.fn(), observeGestures: vi.fn(() => vi.fn()), setMusicContext: vi.fn(), setMusicScene: vi.fn() };
  const root = document.createElement('div'); document.body.append(root);
  bridge = new CombatBridge(root, { player: player as unknown as UiSoundPlayer, openSettings: vi.fn() });
  const session = (rank: string, sceneId: string) => ({ config: { id: 'test', encounterLabel: 'Test', encounterRank: rank, sceneId } as CombatConfig, clan: [], inventory: {}, preferredUnitIds: [], reducedGraphics: false });
  bridge.start(session('normal', 'forest_route'));
  expect(player.setMusicContext).toHaveBeenLastCalledWith('combat'); expect(player.setMusicScene).toHaveBeenLastCalledWith('forest_route');
  bridge.start(session('boss', 'lion_sanctum'));
  expect(player.setMusicContext).toHaveBeenLastCalledWith('boss'); expect(player.setMusicScene).toHaveBeenLastCalledWith('lion_sanctum');
});
