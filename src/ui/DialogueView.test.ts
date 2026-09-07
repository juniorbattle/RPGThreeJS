// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
import type { DialogueSequence, NarrativeEffect } from '../game/types';
import { DialogueView } from './DialogueView';

describe('DialogueView narrative boundaries', () => {
  it('renders the local contest hint without interpreting Lion campaign flags', () => {
    const state = createInitialState();
    state.reputation = 50;
    state.flags.alaricDoubt = true;
    state.flags.lionMandateAdvance = true;
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async () => {},
    });

    view.play(dialogues.get('mystery_lancer_recruit')!);

    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span'))
      .map((element) => element.textContent ?? '');
    expect(badgeTexts).toContain('Garen pèse votre conduite avant de se lier.');
    expect(badgeTexts).not.toContain('Alaric semble méfiant');
    view.close();
  });

  it('contains no hard-coded interpretation of Lion-specific flags', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/ui/DialogueView.ts'), 'utf8');
    const forbiddenStoryFacts = [
      'alaricDoubt',
      'liedToAlaric',
      'lionMandateHonour',
      'lionMandateAdvance',
      'helpedRefugees',
      'exploitedRefugees',
      'missionSuccess',
      'missionGreed',
      'protectedWitnesses',
      'silencedWitnesses',
      'shadowEvidence',
      'shadowFragments',
      'shadowRevealed',
      'shadowConcealed',
    ];

    for (const flag of forbiddenStoryFacts) {
      expect(source, `DialogueView must not interpret ${flag}`).not.toContain(flag);
    }
  });

  it('keeps the default painted presentation unchanged', () => {
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: createInitialState,
      applyEffects: async () => {},
    });
    void view.play(dialogues.get('lion_briefing')!);
    const overlay = root.querySelector<HTMLElement>('.dialogue');
    expect(overlay?.className).toBe('dialogue ui-screen');
    expect(overlay?.dataset.screenEnv).toBeDefined();
    expect(overlay?.style.getPropertyValue('--dialogue-bg-image')).not.toBe('');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    view.close();
  });

  it('renders cinematic dialogue as the sole modal without a second backdrop or portrait', async () => {
    const state = createInitialState();
    const applied: NarrativeEffect[][] = [];
    const root = document.createElement('div');
    document.body.append(root);
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async (effects) => { applied.push(effects); },
    });
    const sequence: DialogueSequence = {
      id: 'cin65-effects',
      title: 'Held dialogue',
      steps: [{
        id: 'choice',
        speaker: 'Alaric',
        tag: 'Roi-Lion',
        text: 'Choisissez.',
        actorId: 'alaric',
        expression: 'stern',
        portrait: '/portrait.png',
        side: 'right',
        effects: [
          { type: 'setFlag', key: 'cin65Step', value: true },
          { type: 'addReputation', amount: 1 },
        ],
        choices: [{
          text: 'Combattre puis conclure',
          next: null,
          effects: [
            { type: 'startCombat', combatId: 'village_defense' },
            { type: 'finishChapter', endingId: 'cin65-test' },
          ],
        }],
      }],
    };

    const completion = view.play(sequence, { mode: 'cinematic-overlay' });
    const overlay = root.querySelector<HTMLElement>('.dialogue--cinematic');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelectorAll('[aria-modal="true"]')).toHaveLength(1);
    expect(overlay?.dataset.screenEnv).toBeUndefined();
    expect(overlay?.style.getPropertyValue('--dialogue-bg-image')).toBe('');
    expect(root.querySelector<HTMLElement>('.dialogue__portrait--right')?.style.backgroundImage).toBe('');
    const choice = root.querySelector<HTMLButtonElement>('.dialogue-choice');
    expect(document.activeElement).toBe(choice);
    choice?.click();
    await completion;

    expect(applied).toEqual([
      [
        { type: 'setFlag', key: 'cin65Step', value: true },
        { type: 'addReputation', amount: 1 },
      ],
      [
        { type: 'startCombat', combatId: 'village_defense' },
        { type: 'finishChapter', endingId: 'cin65-test' },
      ],
    ]);
    expect(root.querySelector('.dialogue')).toBeNull();
  });
});
