// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';

const LION = { part: 'lion', scene: null };

function surface() {
  const uiSounds = { setMusicContext: vi.fn(), setMusicScene: vi.fn() };
  const app = { soundSettings: { close: vi.fn() }, uiSounds, statusHud: null };
  const setMode = (GameApp.prototype as unknown as { setMode: (mode: string, surface?: object) => void }).setMode.bind(app);
  return { uiSounds, setMode };
}

describe('music follows the surface (OD-2026-11-01-B)', () => {
  it('lets the scene choose its mood and keeps the refuge context for the rest', () => {
    const { uiSounds, setMode } = surface();
    setMode('NARRATIVE', { mood: 'drama' }); expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('drama', LION);
    setMode('NARRATIVE', { mood: 'tension' }); expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('tension', LION);
    setMode('NARRATIVE'); expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('refuge', LION);
    setMode('PROLOGUE'); expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('drama', LION);
  });

  it('names the part of the game from the presented dialogue id only (set 1.23.0)', () => {
    const { uiSounds, setMode } = surface();
    setMode('NARRATIVE', { mood: 'tension', musicId: 'bear_audience' });
    expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('tension', { part: 'bear', scene: null });
    setMode('NARRATIVE', { mood: 'drama', musicId: 'finale_betrayal' });
    expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('drama', { part: 'finale', scene: null });
    setMode('NARRATIVE', { mood: 'drama', musicId: 'lion_briefing' });
    expect(uiSounds.setMusicContext).toHaveBeenLastCalledWith('drama', LION);
  });

  it('plays the map ambience on the map, the refuge ambience on its hub only, and leaves combat to the bridge', () => {
    const { uiSounds, setMode } = surface();
    setMode('RESULT'); expect(uiSounds.setMusicScene).toHaveBeenLastCalledWith('map');
    setMode('TRAVEL'); expect(uiSounds.setMusicScene).toHaveBeenLastCalledWith('map');
    setMode('NARRATIVE', { ambience: 'refuge' }); expect(uiSounds.setMusicScene).toHaveBeenLastCalledWith('refuge');
    uiSounds.setMusicScene.mockClear();
    setMode('MANAGEMENT'); expect(uiSounds.setMusicScene).not.toHaveBeenCalled();
    setMode('NARRATIVE', { mood: 'refuge' }); expect(uiSounds.setMusicScene).toHaveBeenLastCalledWith(null);
    uiSounds.setMusicContext.mockClear(); uiSounds.setMusicScene.mockClear();
    setMode('COMBAT'); expect(uiSounds.setMusicContext).not.toHaveBeenCalled(); expect(uiSounds.setMusicScene).not.toHaveBeenCalled();
  });

  it('never lets a sound failure block the surface', () => {
    const { uiSounds, setMode } = surface();
    uiSounds.setMusicContext.mockImplementation(() => { throw Error('audio gone'); });
    expect(() => setMode('RESULT')).not.toThrow();
  });
});
