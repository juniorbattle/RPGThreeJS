// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UiSoundPlayer } from './UiSoundPlayer';
import { UiSoundSettings } from './UiSoundSettings';

const trusted = { isTrusted: true } as Event;
let now = 0;
let player: UiSoundPlayer;
class Context {
  state = 'running';
  destination = {};
  gain = { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
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
  player = new UiSoundPlayer({ music: null }); player.play('confirm');
  player.setEnabled(true, new Event('click'));
  expect(contexts).toHaveLength(0); expect(player.enabled).toBe(false);
  await enable(); expect(contexts[0]!.sources).toHaveLength(0);
  player.play('confirm'); expect(contexts[0]!.sources[0]!.start).toHaveBeenCalledOnce();
  expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe('unchanged');
});
it('restores consent and volume without constructing audio or replaying a cue', () => {
  localStorage.setItem('rpg-threejs:ui-audio:v1', JSON.stringify({ enabled: true, volume: 0.3 }));
  player = new UiSoundPlayer({ music: null }); player.play('saved'); window.dispatchEvent(new Event('keydown'));
  expect(player.enabled).toBe(true); expect(player.volume).toBe(0.3); expect(contexts).toHaveLength(0);
});
it('bounds repeated cues and overlapping voices, then mute stops everything', async () => {
  player = new UiSoundPlayer({ music: null }); await enable();
  player.play('navigate'); player.play('confirm'); expect(contexts[0]!.sources).toHaveLength(1);
  now += 60; player.play('confirm'); now += 60; player.play('reward');
  expect(contexts[0]!.sources[0]!.stop).toHaveBeenCalledOnce();
  player.setEnabled(false, trusted); now += 100; player.play('saved');
  expect(contexts[0]!.sources).toHaveLength(3); expect(contexts[0]!.sources.every(s => s.stop.mock.calls.length > 0)).toBe(true);
});
it('volume zero silences and stops playback; clamping never changes the game save', async () => {
  player = new UiSoundPlayer({ music: null }); await enable(); player.play('confirm'); player.setVolume(0);
  expect(contexts[0]!.sources[0]!.stop).toHaveBeenCalled(); now += 100; player.play('recover');
  expect(contexts[0]!.sources).toHaveLength(1); player.setVolume(4); expect(player.volume).toBe(1);
  player.setVolume(NaN); expect(player.volume).toBe(1); expect(contexts[0]!.gain.gain.value).toBe(1);
});
it('unavailable or corrupt audio and denied preference storage never escape the action', async () => {
  vi.stubGlobal('AudioContext', undefined); player = new UiSoundPlayer({ music: null });
  const denied = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('denied'); });
  expect(() => { player.setEnabled(true, trusted); player.setVolume(0.2); player.play('refused'); }).not.toThrow();
  denied.mockRestore(); player.dispose();
  vi.stubGlobal('AudioContext', class extends Context { constructor() { super(); contexts.push(this); this.decodeAudioData.mockRejectedValue(Error('bad media')); } });
  player = new UiSoundPlayer({ music: null }); await enable(); expect(() => player.play('saved')).not.toThrow(); expect(contexts[0]!.sources).toHaveLength(0);
});
it('hidden/disposed state stops playback and discards late audio work', async () => {
  player = new UiSoundPlayer({ music: null }); await enable(); player.play('confirm');
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
  expect(contexts[0]!.suspend).toHaveBeenCalled(); now += 100; player.play('reward'); expect(contexts[0]!.sources).toHaveLength(1);
  player.dispose(); expect(contexts[0]!.close).toHaveBeenCalledOnce(); player.play('confirm'); expect(contexts[0]!.sources).toHaveLength(1);
});
it('does not queue a sound while decoding, including across mute', async () => {
  const finishes: Array<(value: { duration: number }) => void> = [];
  vi.stubGlobal('AudioContext', class extends Context { constructor() { super(); contexts.push(this); this.decodeAudioData.mockImplementation(() => new Promise(resolve => { finishes.push(resolve); })); } });
  player = new UiSoundPlayer({ music: null }); player.setEnabled(true, trusted);
  await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(8));
  player.play('confirm'); player.setEnabled(false, trusted); finishes.forEach(finish => finish({ duration: 0.2 })); await Promise.resolve();
  expect(contexts[0]!.sources).toHaveLength(0);
});
it('settings contain focus, support Escape, and restore prior inert/focus state', () => {
  player = new UiSoundPlayer({ music: null }); const root = document.createElement('div'), opener = document.createElement('button');
  root.append(opener); document.body.append(root); opener.focus();
  const panel = new UiSoundSettings(root, player); panel.open();
  expect(opener.inert).toBe(true); expect(document.activeElement?.textContent).toBe('Activer les sons');
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  expect(document.activeElement?.textContent).toBe('Fermer');
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  expect(root.querySelector('[role="dialog"]')).toBeNull(); expect(opener.inert).toBe(false); expect(document.activeElement).toBe(opener);
});

it('combat uses the same consent but no automatic playback or context on mount', async () => {
  player = new UiSoundPlayer({ music: null }); player.beginCombat('one'); player.playCombat('thrust', 'one', 'a:launch');
  expect(contexts).toHaveLength(0);
  player.setEnabled(true, trusted);
  await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(24));
  expect(contexts[0]!.sources).toHaveLength(0);
  player.playCombat('thrust', 'old', 'b:launch'); expect(contexts[0]!.sources).toHaveLength(0);
  player.playCombat('thrust', 'one', 'b:launch'); expect(contexts[0]!.sources).toHaveLength(1);
  now += 100; player.playCombat('thrust', 'one', 'b:launch'); expect(contexts[0]!.sources).toHaveLength(1);
  player.endCombat('one'); expect(contexts[0]!.sources[0]!.stop).toHaveBeenCalled();
  player.playCombat('critical', 'one', 'c'); expect(contexts[0]!.sources).toHaveLength(1);
});

it('combat has independent cue cadence and bounded priority voices without a delayed queue', async () => {
  player = new UiSoundPlayer({ music: null }); await enable(); player.beginCombat('one');
  await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(24));
  player.playCombat('light-blade', 'one', 'a'); player.playCombat('physical-impact', 'one', 'b');
  player.playCombat('step', 'one', 'c'); player.playCombat('magic-cast', 'one', 'd');
  expect(contexts[0]!.sources).toHaveLength(4);
  player.playCombat('victory', 'one', 'e'); expect(contexts[0]!.sources).toHaveLength(5);
  expect(contexts[0]!.sources[2]!.stop).toHaveBeenCalledOnce();
  player.playCombat('step', 'one', 'f'); expect(contexts[0]!.sources).toHaveLength(5);
  now += 100; player.playCombat('step', 'one', 'g'); expect(contexts[0]!.sources).toHaveLength(5);
  player.setVolume(0); now += 200; player.playCombat('critical', 'one', 'h');
  expect(contexts[0]!.sources).toHaveLength(5);
});

it('iframe gesture observation attaches and detaches real DOM listeners; synthetic input is silent', () => {
  localStorage.setItem('rpg-threejs:ui-audio:v1', JSON.stringify({ enabled: true }));
  player = new UiSoundPlayer({ music: null }); const owner = document.implementation.createHTMLDocument();
  const add = vi.spyOn(owner, 'addEventListener'), remove = vi.spyOn(owner, 'removeEventListener');
  const detach = player.observeGestures(owner);
  owner.dispatchEvent(new Event('pointerdown')); expect(contexts).toHaveLength(0);
  expect(add.mock.calls.map(c => c[0])).toEqual(['pointerdown', 'keydown']);
  detach(); expect(remove.mock.calls.map(c => c[0])).toEqual(['pointerdown', 'keydown']);
});

it('settings restore an explicit nested focus owner after releasing the parent inert state', () => {
  player = new UiSoundPlayer({ music: null }); const root = document.createElement('div'), owner = document.createElement('div');
  root.append(owner); document.body.append(root);
  const returnFocus = vi.fn(() => expect(owner.inert).toBe(false));
  const settings = new UiSoundSettings(root, player); settings.open(returnFocus);
  expect(owner.inert).toBe(true); settings.close(); expect(returnFocus).toHaveBeenCalledOnce();
  settings.close(); expect(returnFocus).toHaveBeenCalledOnce();
});

describe('code-generated music (OD-2026-10-29-B)', () => {
  const gesture = (target: UiSoundPlayer) => (target as unknown as { gesture: (event: Event) => void }).gesture(trusted);
  function fakeMusic() {
    const host = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), dispose: vi.fn() };
    return { host, factory: vi.fn(() => host) };
  }

  it('is armed by default but silent until a real gesture, even with a restored preference', async () => {
    localStorage.setItem('rpg-threejs:music:v1', JSON.stringify({ enabled: true, volume: 0.4 }));
    const { host, factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); player.setMusicContext('title');
    window.dispatchEvent(new Event('keydown')); window.dispatchEvent(new Event('pointerdown'));
    expect(contexts).toHaveLength(0); expect(factory).not.toHaveBeenCalled();
    gesture(player);
    await vi.waitFor(() => expect(host.setContext).toHaveBeenCalledWith('title'));
    expect(factory).toHaveBeenCalledWith(contexts[0]); expect(host.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('unlocking for music leaves effects off and plays no cue', async () => {
    const { host, factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); gesture(player);
    await vi.waitFor(() => expect(factory).toHaveBeenCalledOnce());
    player.play('confirm');
    expect(player.enabled).toBe(false); expect(contexts[0]!.decodeAudioData).not.toHaveBeenCalled(); expect(contexts[0]!.sources).toHaveLength(0);
    expect(host.setContext).toHaveBeenCalledWith(null);
  });

  it('follows the hand-off; muting stops music and ambience, un-muting resumes the current context', async () => {
    const { host, factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); player.setMusicContext('map'); gesture(player);
    await vi.waitFor(() => expect(host.setContext).toHaveBeenCalledWith('map'));
    player.setMusicContext('boss'); player.setMusicScene('lion_sanctum');
    expect(host.setContext).toHaveBeenLastCalledWith('boss'); expect(host.setAmbience).toHaveBeenLastCalledWith('lion_sanctum');
    player.setMusicEnabled(false, new Event('click')); expect(player.musicEnabled).toBe(true);
    player.setMusicEnabled(false, trusted);
    expect(host.setContext).toHaveBeenLastCalledWith(null); expect(host.setAmbience).toHaveBeenLastCalledWith(null);
    player.setMusicContext('combat'); expect(host.setContext).toHaveBeenLastCalledWith(null);
    player.setMusicEnabled(true, trusted);
    expect(host.setContext).toHaveBeenLastCalledWith('combat'); expect(host.setAmbience).toHaveBeenLastCalledWith('lion_sanctum');
  });

  it('volume zero is silence; preferences stay outside gameplay saves; dispose stops the music', async () => {
    localStorage.setItem('rpg-threejs:autosave:v6', 'unchanged');
    const { host, factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); player.setMusicContext('dialogue'); gesture(player);
    await vi.waitFor(() => expect(host.setContext).toHaveBeenCalledWith('dialogue'));
    player.setMusicVolume(0); expect(host.setVolume).toHaveBeenLastCalledWith(0); expect(host.setContext).toHaveBeenLastCalledWith(null);
    player.setMusicVolume(0.5); expect(host.setContext).toHaveBeenLastCalledWith('dialogue');
    expect(JSON.parse(localStorage.getItem('rpg-threejs:music:v1')!)).toEqual({ enabled: true, volume: 0.5 });
    expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe('unchanged');
    player.dispose(); expect(host.dispose).toHaveBeenCalledOnce();
  });

  it('a muted music preference and effects off create no audio on a real gesture', () => {
    localStorage.setItem('rpg-threejs:music:v1', JSON.stringify({ enabled: false }));
    const { factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); gesture(player);
    expect(contexts).toHaveLength(0); expect(factory).not.toHaveBeenCalled();
  });

  it('settings expose labelled music controls that keep focus inside the dialog', () => {
    const { factory } = fakeMusic();
    player = new UiSoundPlayer({ music: factory }); const root = document.createElement('div'); document.body.append(root);
    new UiSoundSettings(root, player).open();
    const toggle = root.querySelector<HTMLButtonElement>('[data-music-toggle]')!;
    expect(toggle.textContent).toBe('Couper la musique'); expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('label[for="ui-music-volume"]')?.textContent).toContain('Volume de la musique');
    expect(root.querySelector<HTMLInputElement>('#ui-music-volume')!.value).toBe('60');
    const controls = [...root.querySelectorAll<HTMLElement>('button,input')]; expect(controls.at(-1)?.textContent).toBe('Fermer');
  });
});
