// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState, SaveRepository } from '../game/store';
import type { DialogueSequence, DialogueStep, NarrativeEffect } from '../game/types';
import { CREDITS_LINES, hasCredits } from './credits';
import { DialogueView } from './DialogueView';
import { hasReadLine, resetReadLinesCache } from './ReadLines';

afterEach(() => { localStorage.clear(); resetReadLinesCache(); document.body.replaceChildren(); vi.restoreAllMocks(); });

const line = (id: string, next: string | null, extra: Partial<DialogueStep> = {}): DialogueStep => ({
  id, speaker: 'Kestrel', actorId: 'kestrel', text: `Réplique ${id}.`, tag: '', portrait: '', expression: 'neutral', side: 'left',
  next, effects: [], choices: [], ...extra,
});

describe('final audit comfort (OD-2026-11-11-E, B9)', () => {
  it('continues from the most recent save, automatic or manual', () => {
    const saves = new SaveRepository();
    const auto = createInitialState(); auto.gold = 11;
    const manual = createInitialState(); manual.gold = 22;
    saves.saveAuto(auto);
    saves.saveManual(manual);
    expect(saves.loadLatest()?.gold).toBe(22);
    saves.saveAuto(auto);
    expect(saves.loadLatest()?.gold).toBe(11);
    expect(saves.loadRecovery(auto)?.gold).toBe(11);
    saves.clear();
    expect(saves.loadLatest()).toBeNull();
  });

  it('keeps the automatic save first when no time was recorded (older saves)', () => {
    const saves = new SaveRepository();
    const auto = createInitialState(); auto.gold = 11;
    const manual = createInitialState(); manual.gold = 22;
    saves.saveManual(manual);
    saves.saveAuto(auto);
    localStorage.removeItem('rpg-threejs:save-times:v1');
    expect(saves.loadLatest()?.gold).toBe(11);
  });

  it('fast-forwards the lines already read, stops at a choice, and still applies every skipped line\'s effects', async () => {
    const root = document.createElement('div'); document.body.append(root);
    const applied: NarrativeEffect[][] = [];
    const view = new DialogueView({ root, getState: createInitialState, applyEffects: async (effects) => { applied.push([...effects]); } });
    const effect: NarrativeEffect = { type: 'setFlag', key: 'readAgain', value: true };
    const sequence: DialogueSequence = { id: 'fast-forward-proof', steps: [
      line('1', '2'), line('2', '3', { effects: [effect] }),
      line('3', null, { choices: [{ text: 'Choisir.', next: null, effects: [] }] }),
    ] };
    // First reading: no fast-forward offered.
    let done = view.play(sequence, { reducedMotion: true });
    await vi.waitFor(() => expect(root.querySelector('.dialogue__box')).not.toBeNull());
    expect(root.querySelector<HTMLButtonElement>('.dialogue__skip')!.hidden).toBe(true);
    root.querySelector<HTMLButtonElement>('.dialogue__box')!.click();
    await vi.waitFor(() => expect(root.querySelector('.dialogue')?.getAttribute('data-dialogue-step')).toBe('2'));
    root.querySelector<HTMLButtonElement>('.dialogue__box')!.click();
    await vi.waitFor(() => expect(root.querySelector('.dialogue')?.getAttribute('data-dialogue-step')).toBe('3'));
    view.close(); await done;
    expect(hasReadLine('fast-forward-proof', '2')).toBe(true);

    // Replay: the read lines can be skipped up to the choice, and line 2's effect still applies.
    applied.length = 0;
    done = view.play(sequence, { reducedMotion: true });
    await vi.waitFor(() => expect(root.querySelector('.dialogue__box')).not.toBeNull());
    const skip = root.querySelector<HTMLButtonElement>('.dialogue__skip')!;
    expect(skip.hidden).toBe(false);
    skip.click();
    await vi.waitFor(() => expect(root.querySelector('.dialogue')?.getAttribute('data-dialogue-step')).toBe('3'));
    expect(applied).toContainEqual([effect]);
    expect(root.querySelector<HTMLButtonElement>('.dialogue__skip')!.hidden).toBe(true);
    view.close(); await done;
  });

  it('lets a fight be abandoned as a defeat after a second confirmation', () => {
    const runtime = readFileSync(join(process.cwd(), 'src', 'combat', 'legacyCombatRuntime.js'), 'utf8');
    expect(runtime).toContain('data-s="abandon"');
    expect(runtime).toContain('data-s="abandon-confirm"');
    expect(runtime).toContain("function abandonCombat(){ abandonArmed=false; toggleSettings(false); if(G.over||G.busy)return; logMsg('La compagnie abandonne le combat.'); endGame(false); }");
  });

  it('shows no credits until the operator provides their text', () => {
    expect(CREDITS_LINES).toEqual([]);
    expect(hasCredits()).toBe(false);
  });
});
