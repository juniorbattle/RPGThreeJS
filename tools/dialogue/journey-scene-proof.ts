import '../../src/styles/app.css';
import '../../src/ui/dialogue-alignment.css';
import { CinematicPlayer } from '../../src/cinematics/CinematicPlayer';
import { CinematicRegistry } from '../../src/cinematics/CinematicRegistry';
import { NarrativeStage } from '../../src/cinematics/NarrativeStage';
import { AUDIENCE_ROAD_DEPARTURE_TABLEAU, CAMP_DEPARTURE_TABLEAU, VALMIR_FORK_TABLEAU, createGenericBoundaryTableau } from '../../src/cinematics/NarrativeTableau';
import type { JourneyAgencyPresentation } from '../../src/cinematics/JourneyTypes';
import { CampaignStatusHud, selectCampaignStatus } from '../../src/ui/CampaignStatusHud';
import { createInitialState } from '../../src/game/store';
import { planJourneyBoundary } from '../../src/journey/JourneyRunNodeAdapter';

const root = document.querySelector<HTMLElement>('#proof-root')!;
const tableaux = [CAMP_DEPARTURE_TABLEAU, AUDIENCE_ROAD_DEPARTURE_TABLEAU, VALMIR_FORK_TABLEAU, createGenericBoundaryTableau('proof:road', 'single')];
let stage: NarrativeStage | undefined;
const state = createInitialState();
const node = (id: string) => {
  const result = state.run.graph.nodes.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Missing canonical node ${id}`);
  return result;
};

const presentation = (id: string, kind: 'next' | 'departure' | 'branch'): JourneyAgencyPresentation => {
  if (kind === 'departure') return {
    mode: 'single', eyebrow: 'Départ', title: `Vers ${node('lion-opening-ambush').label}`,
    choices: [], continueLabel: 'Prendre la route',
  };
  if (kind === 'branch') return planJourneyBoundary([
    node('lion-second-trial-event'), node('lion-second-trial-combat'),
  ], { currentLabel: node('lion-valmir-road').label }).presentation;
  const from = id === 'CAMP_DEPARTURE_TABLEAU' ? 'lion-camp'
    : id === 'AUDIENCE_ROAD_DEPARTURE_TABLEAU' ? 'lion-audience' : 'lion-valmir-road';
  const to = from === 'lion-camp' ? 'lion-audience'
    : from === 'lion-audience' ? 'lion-opening-ambush' : 'lion-second-trial-event';
  return planJourneyBoundary([node(to)], { currentLabel: node(from).label }).presentation;
};

async function show(id: string, kind: 'next' | 'departure' | 'branch' = 'next'): Promise<void> {
  stage?.dispose();
  root.replaceChildren();
  const tableau = tableaux.find((item) => item.id === id);
  if (!tableau) throw new Error(`Unknown journey tableau ${id}`);
  const registry = new CinematicRegistry();
  stage = new NarrativeStage({
    root,
    registry,
    player: new CinematicPlayer(registry),
    statusHud: new CampaignStatusHud(() => selectCampaignStatus(state)),
    reducedMotion: true,
    transitionRevealMs: 0,
    loadingIndicatorDelayMs: 0,
  });
  stage.setTableau(tableau);
  await stage.presentStill(tableau.stillImage, `proof:${id}`);
  await stage.awaitMediaVisibleReady();
  void stage.requestAgency(presentation(id, kind));
  await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
}

(window as Window & { journeyProof?: { catalog: string[]; show: typeof show } }).journeyProof = {
  catalog: tableaux.map((tableau) => tableau.id), show,
};
