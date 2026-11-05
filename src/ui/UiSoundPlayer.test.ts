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
  createDynamicsCompressor() { return { threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect: vi.fn(), disconnect: vi.fn() }; }
  createWaveShaper() { return { curve: null, oversample: 'none', connect: vi.fn(), disconnect: vi.fn() }; }
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
const stored = () => JSON.parse(localStorage.getItem('rpg-threejs:ui-audio:v2') ?? 'null');

it('is on by default but silent until a real gesture, and never writes gameplay saves', async () => {
  localStorage.setItem('rpg-threejs:autosave:v6', 'unchanged');
  player = new UiSoundPlayer({ music: null }); player.play('confirm');
  player.setEnabled(false, new Event('click')); window.dispatchEvent(new Event('pointerdown'));
  expect(contexts).toHaveLength(0); expect(player.enabled).toBe(true);
  (player as unknown as { gesture: (event: Event) => void }).gesture(trusted);
  await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(8)); await Promise.resolve();
  expect(contexts[0]!.sources).toHaveLength(0);
  player.play('confirm'); expect(contexts[0]!.sources[0]!.start).toHaveBeenCalledOnce();
  expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe('unchanged');
});
it('honours a stored choice to turn effects off, and a volume change alone never turns them off', () => {
  player = new UiSoundPlayer({ music: null }); player.setVolume(0.2);
  expect(stored()).toEqual({ volume: 0.2 }); player.dispose();
  player = new UiSoundPlayer({ music: null }); expect(player.enabled).toBe(true); expect(player.volume).toBe(0.2);
  player.setEnabled(false, trusted); expect(stored()).toEqual({ enabled: false, volume: 0.2 });
  player.setVolume(0.3); expect(stored()).toEqual({ enabled: false, volume: 0.3 }); player.dispose();
  player = new UiSoundPlayer({ music: null }); expect(player.enabled).toBe(false);
  (player as unknown as { gesture: (event: Event) => void }).gesture(trusted); expect(contexts).toHaveLength(0);
});
it('reads a value stored under the former default as no choice, and keeps its volume', () => {
  localStorage.setItem('rpg-threejs:ui-audio:v1', JSON.stringify({ enabled: false, volume: 0.35 }));
  player = new UiSoundPlayer({ music: null });
  expect(player.enabled).toBe(true); expect(player.volume).toBe(0.35); expect(contexts).toHaveLength(0);
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
  expect(opener.inert).toBe(true); expect(document.activeElement?.textContent).toBe('Couper les sons');
  expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true');
  // OD-2026-11-05-B: the sound controls now sit under the « Son » tab, the first stop of the trap.
  root.querySelector<HTMLButtonElement>('[data-settings-tab="sound"]')!.focus();
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
    const host = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), setLevel: vi.fn(), attenuate: vi.fn(), dispose: vi.fn() };
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
    expect((factory.mock.calls as unknown[][])[0]![0]).toBe(contexts[0]); expect(host.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('unlocking for music keeps a stored effects choice and plays no cue', async () => {
    localStorage.setItem('rpg-threejs:ui-audio:v2', JSON.stringify({ enabled: false, volume: 0.5 }));
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
    player = new UiSoundPlayer({ music: factory }); player.setMusicContext('refuge'); gesture(player);
    await vi.waitFor(() => expect(host.setContext).toHaveBeenCalledWith('refuge'));
    player.setMusicVolume(0); expect(host.setVolume).toHaveBeenLastCalledWith(0); expect(host.setContext).toHaveBeenLastCalledWith(null);
    player.setMusicVolume(0.5); expect(host.setContext).toHaveBeenLastCalledWith('refuge');
    expect(JSON.parse(localStorage.getItem('rpg-threejs:music:v1')!)).toEqual({ enabled: true, volume: 0.5 });
    expect(localStorage.getItem('rpg-threejs:autosave:v6')).toBe('unchanged');
    player.dispose(); expect(host.dispose).toHaveBeenCalledOnce();
  });

  it('a muted music preference and effects off create no audio on a real gesture', () => {
    localStorage.setItem('rpg-threejs:music:v1', JSON.stringify({ enabled: false }));
    localStorage.setItem('rpg-threejs:ui-audio:v2', JSON.stringify({ enabled: false }));
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

describe('combat level and outcome (OD-2026-11-01-B)', () => {
  const gesture = (target: UiSoundPlayer) => (target as unknown as { gesture: (event: Event) => void }).gesture(trusted);
  async function started() {
    const host = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), setLevel: vi.fn(), attenuate: vi.fn(), dispose: vi.fn() };
    player = new UiSoundPlayer({ music: () => host }); player.beginCombat('one'); gesture(player);
    await vi.waitFor(() => expect(host.setVolume).toHaveBeenCalled());
    host.setLevel.mockClear();
    return host;
  }
  afterEach(() => vi.useRealTimers());

  it('ignores a repeat, applies one change per 500 ms and lets the latest win inside the window', async () => {
    const host = await started();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    player.setMusicLevel('foreign', 'action'); expect(host.setLevel).not.toHaveBeenCalled();
    player.setMusicLevel('one', 'reflection'); expect(host.setLevel).not.toHaveBeenCalled();
    player.setMusicLevel('one', 'action'); expect(host.setLevel).toHaveBeenCalledTimes(1);
    player.setMusicLevel('one', 'action'); expect(host.setLevel).toHaveBeenCalledTimes(1);
    now += 100; player.setMusicLevel('one', 'reflection'); now += 100; vi.advanceTimersByTime(100); player.setMusicLevel('one', 'action'); now += 100; vi.advanceTimersByTime(100); player.setMusicLevel('one', 'reflection');
    expect(host.setLevel).toHaveBeenCalledTimes(1);
    now += 200; vi.advanceTimersByTime(200);
    expect(host.setLevel).toHaveBeenCalledTimes(2); expect(host.setLevel).toHaveBeenLastCalledWith('reflection');
  });

  it('returns to reflection after 15 seconds without an end, at session close and on a hidden page', async () => {
    const host = await started();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    player.setMusicLevel('one', 'action'); expect(host.setLevel).toHaveBeenLastCalledWith('action');
    now += 14_999; vi.advanceTimersByTime(14_999); expect(host.setLevel).toHaveBeenCalledTimes(1);
    now += 1; vi.advanceTimersByTime(1); expect(host.setLevel).toHaveBeenLastCalledWith('reflection');
    now += 600; player.setMusicLevel('one', 'action'); now += 600;
    player.endCombat('one'); expect(host.setLevel).toHaveBeenLastCalledWith('reflection');
    player.beginCombat('two'); now += 600; player.setMusicLevel('two', 'action'); now += 600;
    Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
    expect(host.setLevel).toHaveBeenLastCalledWith('reflection');
  });

  it('a level before the first gesture starts nothing and reaches the music when it starts', async () => {
    const host = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), setLevel: vi.fn(), attenuate: vi.fn(), dispose: vi.fn() };
    const factory = vi.fn(() => host);
    player = new UiSoundPlayer({ music: factory }); player.beginCombat('one'); player.setMusicLevel('one', 'action');
    expect(contexts).toHaveLength(0); expect(factory).not.toHaveBeenCalled();
    gesture(player); await vi.waitFor(() => expect(host.setLevel).toHaveBeenCalledWith('action'));
  });

  it('plays one outcome per session, ignores a foreign one, and a session close never cuts the fanfare', async () => {
    const host = await started();
    player.playMusicOutcome('foreign', 'victory'); expect(host.setContext).not.toHaveBeenCalledWith('victory');
    player.playMusicOutcome('one', 'victory'); expect(host.setContext).toHaveBeenLastCalledWith('victory');
    player.playMusicOutcome('one', 'defeat'); expect(host.setContext).toHaveBeenLastCalledWith('victory');
    const calls = host.setContext.mock.calls.length;
    player.endCombat('one'); expect(host.setContext).toHaveBeenCalledTimes(calls);
    player.playMusicOutcome('one', 'defeat'); expect(host.setContext).toHaveBeenCalledTimes(calls);
  });

  it('resuming after mute never replays a fanfare', async () => {
    const host = await started();
    player.playMusicOutcome('one', 'defeat'); player.setMusicEnabled(false, trusted); host.setContext.mockClear();
    player.setMusicEnabled(true, trusted); expect(host.setContext).not.toHaveBeenCalled();
  });
});

describe('the cue table on the parent owner (OD-2026-11-01-B)', () => {
  const composed = 'fx.thrust.sky.l', charge = 'sig.w_lion_surge.charge', blow = 'sig.w_lion_surge.blow', wave = 'sig.w_lion_surge.wave';
  function table(ready: readonly string[], duration = 0.3) {
    return vi.fn(async (id: string) => (ready.includes(id) ? { duration, length: 1000, cue: id } as unknown as AudioBuffer : null));
  }
  async function fight(renderer: ReturnType<typeof table>, music?: { attenuate: ReturnType<typeof vi.fn> } & Record<string, unknown>) {
    player = new UiSoundPlayer({ music: music ? () => music as never : null, synth: renderer }); await enable(); player.beginCombat('one');
    await vi.waitFor(() => expect(contexts[0]?.decodeAudioData).toHaveBeenCalledTimes(24));
    await vi.waitFor(() => expect(renderer.mock.calls.length).toBeGreaterThanOrEqual(158), { timeout: 8000 });
  }

  it('renders the whole table once, in the background, and plays nothing by itself', async () => {
    const renderer = table([composed]);
    await fight(renderer);
    expect(renderer).toHaveBeenCalledTimes(158);
    expect(contexts[0]!.sources).toHaveLength(0);
    player.beginCombat('two'); await Promise.resolve();
    expect(renderer).toHaveBeenCalledTimes(158);
  });

  it('plays a rendered cue, the file of its family before, and silence without either', async () => {
    const renderer = table([composed]);
    await fight(renderer);
    player.playCombat(composed, 'one', 'a'); expect(contexts[0]!.sources[0]!.buffer).toMatchObject({ cue: composed });
    now += 100; player.playCombat('fx.blade.steel.l', 'one', 'b'); expect(contexts[0]!.sources[1]!.buffer).toEqual({ duration: 0.2 });
    now += 100; player.playCombat('thrust', 'one', 'c'); expect(contexts[0]!.sources[2]!.buffer).toEqual({ duration: 0.2 });
    now += 100; player.playCombat('fx.not.in.table', 'one', 'd'); expect(contexts[0]!.sources).toHaveLength(3);
  });

  it('plays the marks of two recipes of one action, and each only once', async () => {
    const renderer = table([composed, 'fx.land.earth.l']);
    await fight(renderer);
    player.playCombat(composed, 'one', 'action-1:mark0.a_hawk_leap_depart:'); now += 100;
    player.playCombat('fx.land.earth.l', 'one', 'action-1:mark0.a_hawk_leap_arrive:'); now += 100;
    player.playCombat('fx.land.earth.l', 'one', 'action-1:mark0.a_hawk_leap_arrive:');
    expect(contexts[0]!.sources).toHaveLength(2);
  });

  it('rejects a render over its limit and keeps a signature cue up to 2.5 seconds', async () => {
    const renderer = table([composed, charge], 1.4);
    await fight(renderer);
    player.playCombat(composed, 'one', 'a'); expect(contexts[0]!.sources[0]!.buffer).toEqual({ duration: 0.2 });
    now += 100; player.playCombat(charge, 'one', 'b'); expect(contexts[0]!.sources[1]!.buffer).toMatchObject({ cue: charge });
  });

  it('keeps the table inside its 32 MB budget', async () => {
    const renderer = vi.fn(async (id: string) => ({ duration: 1, length: 1024 * 1024 * 2, cue: id }) as unknown as AudioBuffer);
    await fight(renderer);
    expect(player.musicSnapshot().cues.bytes).toBeLessThanOrEqual(32 * 1024 * 1024);
    expect(player.musicSnapshot().cues.rendered).toBe(4);
  });

  it('keeps at most two signature voices and never takes the voice of a result', async () => {
    const renderer = table([charge, blow, wave], 1);
    await fight(renderer);
    player.playCombat(charge, 'one', 'a'); now += 100; player.playCombat(blow, 'one', 'b');
    now += 100; player.playCombat(wave, 'one', 'c');
    expect(player.musicSnapshot().cues.voices).toEqual([blow, wave]);
    player.playCombat('physical-impact', 'one', 'd'); player.playCombat('miss', 'one', 'e');
    expect(player.musicSnapshot().cues.voices).toEqual([blow, wave, 'physical-impact', 'miss']);
    now += 100; player.playCombat(charge, 'one', 'f');
    expect(player.musicSnapshot().cues.voices).toEqual([wave, 'physical-impact', 'miss', charge]);
  });

  it('drops a signature cue rather than evict a result when every other voice is taken', async () => {
    const renderer = table([charge], 1);
    await fight(renderer);
    for (const [i, id] of ['physical-impact', 'magic-impact', 'miss', 'critical'].entries()) { player.playCombat(id, 'one', `r${i}`); now += 50; }
    player.playCombat(charge, 'one', 's');
    expect(player.musicSnapshot().cues.voices).toEqual(['physical-impact', 'magic-impact', 'miss', 'critical']);
  });

  it('lowers the music on a signature cue only, holds it to the last one and lets go when the voices stop', async () => {
    const music = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), setLevel: vi.fn(), attenuate: vi.fn(), dispose: vi.fn() };
    const renderer = table([composed, charge], 1.5);
    await fight(renderer, music);
    (contexts[0] as unknown as { currentTime: number }).currentTime = 10;
    player.playCombat(composed, 'one', 'a'); expect(music.attenuate).not.toHaveBeenCalled();
    now += 100; player.playCombat(charge, 'one', 'b'); expect(music.attenuate).toHaveBeenLastCalledWith(11.5);
    player.endCombat('one'); expect(music.attenuate).toHaveBeenLastCalledWith(10);
  });

  it('lets the music back on time when a signature voice is taken by a result', async () => {
    const music = { setContext: vi.fn(), setAmbience: vi.fn(), setVolume: vi.fn(), setLevel: vi.fn(), attenuate: vi.fn(), dispose: vi.fn() };
    const renderer = table([charge, blow], 1.5);
    await fight(renderer, music);
    (contexts[0] as unknown as { currentTime: number }).currentTime = 10;
    player.playCombat(charge, 'one', 'a'); now += 100; player.playCombat(blow, 'one', 'b');
    for (const [i, id] of ['knockout', 'critical'].entries()) { now += 50; player.playCombat(id, 'one', `r${i}`); }
    now += 50; player.playCombat('defeat', 'one', 'd');
    expect(player.musicSnapshot().cues.voices).toEqual([blow, 'knockout', 'critical', 'defeat']);
    music.attenuate.mockClear();
    now += 50; player.playCombat('victory', 'one', 'v');
    expect(player.musicSnapshot().cues.voices).toEqual(['knockout', 'critical', 'defeat', 'victory']);
    expect(music.attenuate).toHaveBeenLastCalledWith(10);
  });
});
