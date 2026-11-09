import { getPlateau } from '../campaign/plateaux/PlateauRegistry';
import { ENDING_LABELS } from '../campaign/plateaux/finale/finaleEpilogues';
import { nextPlayablePlateau, runPlateauId } from './plateauProgression';
import type { GameState } from './types';

/** The words of a chronicle's end panel, for the Journey terminal boundary. Presentation only. */
export interface ChronicleEndWords {
  eyebrow: string;
  title: string;
  caption: string;
  /** The panel's main action. Absent: the default return to the menu. */
  continueLabel?: string;
}

const SEAL_OF: Readonly<Record<string, string>> = Object.freeze({
  lion: 'Le Sceau du Lion',
  bear: 'Le Sceau de l’Ours',
  dragon: 'Le Sceau du Dragon',
  scorpion: 'Le Sceau du Scorpion',
});

function lowerArticle(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * Reads RunSystem's recorded facts only.
 * - A closed campaign names its ending (post-demo Lot 5).
 * - At a terminal boundary whose next plateau is built, the panel says that the route goes on and its main action
 *   continues the campaign; a chronicle that ends there keeps the default words and the return to the menu.
 */
export function chronicleEndWords(state: GameState, terminal: boolean): ChronicleEndWords | null {
  const progress = state.campaign;
  if (progress?.ending && progress.finalAct.stage === 'completed') {
    return { eyebrow: 'Fin de la chronique', title: ENDING_LABELS[progress.ending],
      caption: 'Quatre Sceaux, la brèche refermée : la Voie des Sceaux s’achève ici.' };
  }
  if (!terminal) return null;
  const next = nextPlayablePlateau(state);
  if (!next) return null;
  const plateau = getPlateau(next);
  const draft = plateau.status === 'draft' ? ' (brouillon)' : '';
  const seal = SEAL_OF[runPlateauId(state)];
  const step = `Prochaine étape : ${lowerArticle(plateau.label)}.`;
  return {
    eyebrow: 'Fin de chapitre',
    title: 'La route continue',
    caption: seal ? `${seal} est obtenu. ${step}` : step,
    continueLabel: `Continuer : ${plateau.label}${draft}`,
  };
}
