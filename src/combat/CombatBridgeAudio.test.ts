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
