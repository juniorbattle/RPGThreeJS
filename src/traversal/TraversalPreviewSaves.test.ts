// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest';
import { createInitialState } from '../game/store';
import { TraversalPreviewSaves } from './TraversalPreviewSaves';

it('keeps preview checkpoints isolated from player saves, including load and clear', () => {
  const read = vi.spyOn(Storage.prototype, 'getItem');
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const remove = vi.spyOn(Storage.prototype, 'removeItem');
  const saves = new TraversalPreviewSaves();
  const state = createInitialState();
  saves.saveAuto(state);
  saves.saveManual(state);
  expect(saves.hasSave()).toBe(true);
  const checkpoint = saves.loadAuto()!;
  checkpoint.gold += 100;
  expect(saves.loadAuto()!.gold).toBe(state.gold);
  expect(saves.loadManual()).toEqual(state);
  saves.clear();
  expect(saves.hasSave()).toBe(false);
  expect(saves.loadAuto()).toBeNull();
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
