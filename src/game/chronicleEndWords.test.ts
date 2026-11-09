import { describe, expect, it } from 'vitest';
import { loadLionEndForBearQa, loadEpilogueStartQa } from '../qa/postDemoQaSaves';
import { chronicleEndWords } from './chronicleEndWords';
import { createInitialState } from './store';

describe('chronicle end words (playtest defect of 2026-11-09)', () => {
  it('says that the route goes on after the Lion and continues into the Montagnes de la Résilience', async () => {
    for (const route of ['honour', 'force'] as const) {
      const state = await loadLionEndForBearQa(route);
      expect(chronicleEndWords(state, true)).toEqual({
        eyebrow: 'Fin de chapitre',
        title: 'La route continue',
        caption: 'Le Sceau du Lion est obtenu. Prochaine étape : les Montagnes de la Résilience.',
        continueLabel: 'Continuer : Les Montagnes de la Résilience',
      });
    }
  });

  it('names nothing away from a terminal boundary or on a run that has not ended', async () => {
    expect(chronicleEndWords(await loadLionEndForBearQa('honour'), false)).toBeNull();
    expect(chronicleEndWords(createInitialState(), true)).toBeNull();
  });

  it('keeps naming the ending once the campaign is closed, with the default return to the menu', async () => {
    const state = await loadEpilogueStartQa('respect');
    state.campaign!.ending = 'respect';
    state.campaign!.finalAct.stage = 'completed';
    const words = chronicleEndWords(state, true);
    expect(words?.eyebrow).toBe('Fin de la chronique');
    expect(words?.caption).toBe('Quatre Sceaux, la brèche refermée : la Voie des Sceaux s’achève ici.');
    expect(words?.continueLabel).toBeUndefined();
  });
});
