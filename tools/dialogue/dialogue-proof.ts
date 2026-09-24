import '../../src/styles/app.css';
import '../../src/ui/dialogue-alignment.css';
import { createInitialState } from '../../src/game/store';
import type { DialogueSequence, DialogueStep } from '../../src/game/types';
import { createGenericNarrativeTableau } from '../../src/cinematics/NarrativeTableau';
import { NarrativeSceneSurface } from '../../src/cinematics/NarrativeSceneSurface';
import { DialogueView } from '../../src/ui/DialogueView';

const root = document.querySelector<HTMLElement>('#proof-root')!;
const media = document.querySelector<HTMLElement>('#proof-media')!;
const variant = new URLSearchParams(location.search).get('scenario') ?? 'standard';
const choice = variant === 'choices' || variant === 'many-choices';
const multi = variant === 'multi';
const cast = multi || choice
  ? [
      ['sage_seraphine', 'Séraphine'], ['maelor', 'Maelor'],
      ['alaric', 'Alaric'], ['alistair', 'Alistair'],
    ] as const
  : [['sage_seraphine', 'Séraphine'], ['maelor', 'Maelor'], ['alaric', 'Alaric']] as const;
const steps: DialogueStep[] = cast.map(([actorId, speaker], index) => ({
  id: `${index + 1}`,
  actorId,
  speaker,
  tag: index === 0 ? 'Conseil du Lion' : '',
  text: index === 0 ? 'Nous devons partir avant l’aube. Le refuge du Lion n’est plus très loin.' : 'La route reste ouverte.',
  portrait: '',
  expression: 'neutral',
  side: index % 2 ? 'right' : 'left',
  next: index < cast.length - 1 ? `${index + 2}` : null,
  effects: [],
  choices: choice && index === 0 ? [
    { text: 'Continuer la route', next: null, effects: [] },
    { text: 'Questionner le guide', next: null, effects: [] },
    { text: 'Ignorer le détour', next: null, effects: [] },
    ...(variant === 'many-choices' ? [
      { text: 'Observer le camp', next: null, effects: [] },
      { text: 'Chercher une autre piste', next: null, effects: [] },
    ] : []),
  ] : [],
}));
// A mapped presentation context is required by the production tableau factory.
const sequence: DialogueSequence = { id: 'acte_ouverture', title: 'Dialogue', steps };
const tableau = createGenericNarrativeTableau(sequence);
const surface = new NarrativeSceneSurface(media, tableau, { reducedMotion: true });
surface.mount('/assets/generated/lion-phase/dialogue/camp_departure.webp');
const view = new DialogueView({ root, getState: createInitialState, applyEffects: async () => undefined });
void view.play(sequence, {
  mode: 'narrative-stage',
  reducedMotion: true,
  stepPresentation: () => ({ mode: choice ? 'SPATIAL_CHOICE' : 'SPEAKER_CARD', showPortrait: false }),
  beforeStepChange: async (step) => {
    await surface.setPhase(tableau.phases![0]!.id, step.actorId);
  },
});
