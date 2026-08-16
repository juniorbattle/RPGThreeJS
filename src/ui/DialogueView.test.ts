// @vitest-environment happy-dom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dialogues } from '../game/content';
import { createInitialState } from '../game/store';
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
});
