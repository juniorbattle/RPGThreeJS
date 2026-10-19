// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { UiSoundPlayer } from './UiSoundPlayer';
import { UiSoundSettings } from './UiSoundSettings';

const trusted = { isTrusted: true } as Event;
let now = 0;
let player: UiSoundPlayer;
class Context {
  state = 'running';
  destination = {};
  gain = { gain: { value: 0 }, connect: vi.fn() };
  sources: Array<{ buffer: unknown; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }> = [];
  createGain() { return this.gain; }
  createBufferSource() { const source = { buffer: null as unknown, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }; this.sources.push(source); return source; }
  decodeAudioData = vi.fn(async () => ({ duration: 0.2 }));
  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  close = vi.fn(async () => { this.state = 'closed'; });
}
let contexts: Context[];
beforeEach(() => {
  localStorage.clear(); contexts = []; now = 0;
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('AudioContext', class extends Context { constructor() { super(); contexts.push(this); } });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(2) })));
});
afterEach(() => { player?.dispose(); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function enable() { player.setEnabled(true, trusted); await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(8)); await Promise.resolve(); }

it('starts silent, requires a trusted enable, and never writes gameplay saves', async () => {
  localStorage.setItem('rpg-threejs:autosave:v6', 'unchanged');
  player = new UiSoundPlayer(); player.play('confirm');
  player.setEnabled(true, new Event('click'));
  expect(contexts).toHaveLength(0); expect(player.enabled).toBe(false);
  await enable(); expect(contexts[0]!.sources).toHaveLength(0);
  player.play('confirm'); expect(contexts[0]!.sources[0]!.start).toHaveBeenCalledOnce();
  expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe('unchanged');
});
it('restores consent and volume without constructing audio or replaying a cue', () => {
  localStorage.setItem('rpg-threejs:ui-audio:v1', JSON.stringify({ enabled: true, volume: 0.3 }));
  player = new UiSoundPlayer(); player.play('saved'); window.dispatchEvent(new Event('keydown'));
  expect(player.enabled).toBe(true); expect(player.volume).toBe(0.3); expect(contexts).toHaveLength(0);
});
it('bounds repeated cues and overlapping voices, then mute stops everything', async () => {
  player = new UiSoundPlayer(); await enable();
  player.play('navigate'); player.play('confirm'); expect(contexts[0]!.sources).toHaveLength(1);
  now += 60; player.play('confirm'); now += 60; player.play('reward');
  expect(contexts[0]!.sources[0]!.stop).toHaveBeenCalledOnce();
  player.setEnabled(false, trusted); now += 100; player.play('saved');
  expect(contexts[0]!.sources).toHaveLength(3); expect(contexts[0]!.sources.every(s => s.stop.mock.calls.length > 0)).toBe(true);
});
it('volume zero silences and stops playback; clamping never changes the game save', async () => {
  player = new UiSoundPlayer(); await enable(); player.play('confirm'); player.setVolume(0);
  expect(contexts[0]!.sources[0]!.stop).toHaveBeenCalled(); now += 100; player.play('recover');
  expect(contexts[0]!.sources).toHaveLength(1); player.setVolume(4); expect(player.volume).toBe(1);
  player.setVolume(NaN); expect(player.volume).toBe(1); expect(contexts[0]!.gain.gain.value).toBe(1);
});
it('unavailable or corrupt audio and denied preference storage never escape the action', async () => {
  vi.stubGlobal('AudioContext', undefined); player = new UiSoundPlayer();
  const denied = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('denied'); });
  expect(() => { player.setEnabled(true, trusted); player.setVolume(0.2); player.play('refused'); }).not.toThrow();
  denied.mockRestore(); player.dispose();
  vi.stubGlobal('AudioContext', class extends Context { constructor() { super(); contexts.push(this); this.decodeAudioData.mockRejectedValue(Error('bad media')); } });
  player = new UiSoundPlayer(); await enable(); expect(() => player.play('saved')).not.toThrow(); expect(contexts[0]!.sources).toHaveLength(0);
});
it('hidden/disposed state stops playback and discards late audio work', async () => {
  player = new UiSoundPlayer(); await enable(); player.play('confirm');
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
  expect(contexts[0]!.suspend).toHaveBeenCalled(); now += 100; player.play('reward'); expect(contexts[0]!.sources).toHaveLength(1);
  player.dispose(); expect(contexts[0]!.close).toHaveBeenCalledOnce(); player.play('confirm'); expect(contexts[0]!.sources).toHaveLength(1);
});
it('does not queue a sound while decoding, including across mute', async () => {
  const finishes: Array<(value: { duration: number }) => void> = [];
  vi.stubGlobal('AudioContext', class extends Context { constructor() { super(); contexts.push(this); this.decodeAudioData.mockImplementation(() => new Promise(resolve => { finishes.push(resolve); })); } });
  player = new UiSoundPlayer(); player.setEnabled(true, trusted);
  await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(8));
  player.play('confirm'); player.setEnabled(false, trusted); finishes.forEach(finish => finish({ duration: 0.2 })); await Promise.resolve();
  expect(contexts[0]!.sources).toHaveLength(0);
});
it('settings contain focus, support Escape, and restore prior inert/focus state', () => {
  player = new UiSoundPlayer(); const root = document.createElement('div'), opener = document.createElement('button');
  root.append(opener); document.body.append(root); opener.focus();
  const panel = new UiSoundSettings(root, player); panel.open();
  expect(opener.inert).toBe(true); expect(document.activeElement?.textContent).toBe('Activer les sons');
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  expect(document.activeElement?.textContent).toBe('Fermer');
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  expect(root.querySelector('[role="dialog"]')).toBeNull(); expect(opener.inert).toBe(false); expect(document.activeElement).toBe(opener);
});
