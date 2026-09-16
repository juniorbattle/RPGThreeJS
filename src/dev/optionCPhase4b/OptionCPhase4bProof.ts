import { CombatBridge } from '../../combat/CombatBridge';
import { applyFinalDialoguePresentationPlan } from '../../cinematics/DialoguePresentationSegments';
import { NarrativeSceneSurface } from '../../cinematics/NarrativeSceneSurface';
import type { NarrativeTableauSpec, NarrativeVisualPhaseSpec } from '../../cinematics/NarrativeTableau';
import { toCombatant } from '../../game/catalog';
import { combatConfigs, dialogues } from '../../game/content';
import { createInitialState } from '../../game/store';
import type { DialogueSequence, DialogueStep, GameState } from '../../game/types';
import { SpriteFrameAnimationController } from '../../render/SpriteFrameAnimation';
import { DialogueView } from '../../ui/DialogueView';
import { TravelView } from '../../ui/TravelView';
import {
  isOptionCAnimationState,
  isOptionCProofCharacter,
  isOptionCProofSurface,
  isOptionCTableauState,
  OPTION_C_ALISTAIR_ASSETS,
  OPTION_C_PHASE4B_ASSETS,
  optionCAnimationDefinitionsFor,
  optionCRequiredImageUrlsFor,
  type OptionCAnimationState,
  type OptionCProofCharacter,
  type OptionCProofSurface,
  type OptionCTableauState,
} from './OptionCPhase4bAssets';
import {
  loadOptionCEnvironmentCatalog,
  type OptionCEnvironmentCatalog,
  type ResolvedOptionCEnvironment,
} from './OptionCEnvironmentRuntime';

const SURFACES: readonly { id: OptionCProofSurface; label: string }[] = [
  { id: 'travel', label: 'TRAVEL' },
  { id: 'tableau', label: 'TABLEAU' },
  { id: 'strategic', label: 'STRATEGIC' },
  { id: 'combat-stage', label: 'COMBAT STAGE' },
];

const ANIMATIONS: readonly { id: OptionCAnimationState; label: string }[] = [
  { id: 'idle', label: 'IDLE' },
  { id: 'dash', label: 'DASH' },
  { id: 'attack', label: 'ATTACK' },
  { id: 'skill', label: 'CAST / SKILL' },
];

const TABLEAU_STATES: readonly { id: OptionCTableauState; label: string }[] = [
  { id: 'active', label: 'KESTREL SPEAKS' },
  { id: 'listening', label: 'KESTREL LISTENS' },
  { id: 'mirrored', label: 'MIRRORED' },
  { id: 'center', label: 'CENTER POSITION' },
  { id: 'right', label: 'RIGHT POSITION' },
];

export const OPTION_C_TABLEAU_PROOF_CASES = Object.freeze({
  '1-actor': Object.freeze({ dialogueId: 'lion_finale_judgement', expectedCastCount: 1 }),
  '2-actors': Object.freeze({ dialogueId: 'ate_alaric_reports', expectedCastCount: 2 }),
  '3-actors': Object.freeze({ dialogueId: 'post_opening_trail', expectedCastCount: 3 }),
  '4-actors': Object.freeze({ dialogueId: 'lion_briefing', expectedCastCount: 4 }),
} as const);

export type OptionCTableauProofCase = keyof typeof OPTION_C_TABLEAU_PROOF_CASES;

function isOptionCTableauProofCase(value: string | null): value is OptionCTableauProofCase {
  return Boolean(value && value in OPTION_C_TABLEAU_PROOF_CASES);
}

/**
 * Places the DEV proof state on the real source node named by an authored
 * travel edge. TravelView then derives its heading and route card from the
 * production graph exactly as it does during play.
 */
export function configureTravelProofState(state: GameState, contextId: string): {
  currentNodeId: string;
  destinationNodeIds: readonly string[];
} {
  const match = /^edge:([^>]+)>([^>]+)$/.exec(contextId);
  if (!match) throw new Error(`Travel proof context is not an edge: ${contextId}`);
  const [, sourceId, destinationId] = match;
  const nodesById = new Map(state.run.graph.nodes.map((node) => [node.id, node]));
  const source = nodesById.get(sourceId!);
  const destination = nodesById.get(destinationId!);
  if (!source || !destination || !source.links.includes(destination.id)) {
    throw new Error(`Travel proof edge is absent from the production run graph: ${contextId}`);
  }

  const start = state.run.graph.nodes.find((node) => node.depth === 0);
  if (!start) throw new Error('Travel proof run graph has no start node.');
  const queue: string[][] = [[start.id]];
  const visited = new Set<string>();
  let path: string[] | undefined;
  while (queue.length > 0) {
    const candidate = queue.shift()!;
    const tail = candidate[candidate.length - 1]!;
    if (visited.has(tail)) continue;
    visited.add(tail);
    if (tail === source.id) {
      path = candidate;
      break;
    }
    const node = nodesById.get(tail);
    for (const next of node?.links ?? []) queue.push([...candidate, next]);
  }
  if (!path) throw new Error(`Travel proof source is unreachable in the production run graph: ${source.id}`);

  state.run.currentNodeId = source.id;
  state.run.checkpointNodeId = source.id;
  state.run.visitedNodeIds = [...path];
  state.run.revealedNodeIds = [...new Set([...path, ...source.links])];
  state.resolvedNodeIds = path.slice(0, -1);
  return { currentNodeId: source.id, destinationNodeIds: [...source.links] };
}

function tableauPhaseForStep(spec: NarrativeTableauSpec, step: DialogueStep): NarrativeVisualPhaseSpec {
  const phase = spec.phases?.find((candidate) => candidate.stepIds.includes(step.id));
  if (!phase) throw new Error(`No authored tableau phase for ${spec.id}:${step.id}.`);
  return phase;
}

function tableauLayout(state: OptionCTableauState, proofCharacter: OptionCProofCharacter = 'kestrel') {
  const alistairMirrored = proofCharacter === 'alistair' && state === 'mirrored';
  const kestrelSpeaking = state !== 'listening' && !alistairMirrored;
  const kestrelPosition = alistairMirrored
    ? 'RIGHT' as const
    : state === 'center' ? 'CENTER' as const : state === 'right' ? 'RIGHT' as const : 'LEFT' as const;
  const alistairPosition = alistairMirrored
    ? 'LEFT' as const
    : state === 'center' ? 'FAR_RIGHT' as const : state === 'right' ? 'LEFT' as const : 'RIGHT' as const;
  const kestrelFacing = state === 'mirrored' || state === 'right' ? 'LEFT' as const : 'RIGHT' as const;
  const alistairFacing = alistairMirrored || state === 'right' ? 'RIGHT' as const : 'LEFT' as const;
  const dialoguePlacement = state === 'active' || state === 'mirrored' ? 'RIGHT' as const : 'LEFT' as const;
  return {
    kestrelSpeaking,
    kestrelPosition,
    alistairPosition,
    kestrelFacing,
    alistairFacing,
    dialoguePlacement,
  };
}

function tableauSpec(
  state: OptionCTableauState,
  proofCharacter: OptionCProofCharacter,
  environment: ResolvedOptionCEnvironment,
): NarrativeTableauSpec {
  const layout = tableauLayout(state, proofCharacter);
  const { kestrelSpeaking } = layout;
  return {
    id: `option-c-${proofCharacter}-${environment.assetId}-${state}`,
    tableauBackgroundId: environment.assetId,
    grammar: 'THREAT',
    media: [],
    cast: {
      visualActors: ['kestrel', 'alistair'],
      eventActors: ['kestrel', 'alistair'],
      playerRepresentatives: ['alistair'],
      optionalActors: [],
      justifiedOffscreen: [],
    },
    anchors: [],
    beats: [],
    phases: [{
      id: 'forest-road-tableau-proof',
      stepIds: ['proof-line'],
      surfaceMode: 'STATIC_TABLEAU',
      layoutProfile: 'DIALOGUE_SPEAKER_FOCUS',
      layoutPlacement: layout.dialoguePlacement,
      staticCast: [
        {
          actorId: 'kestrel',
          screenPosition: layout.kestrelPosition,
          scale: 0.92,
          facing: layout.kestrelFacing,
          lookTarget: 'alistair',
          entryEffect: 'FADE_IN',
          group: 'PLAYER_COMPANY',
          dramaticSide: 'LEFT',
          depth: 5,
          narrativeRole: kestrelSpeaking ? 'CURRENT_SPEAKER' : 'LISTENER',
        },
        {
          actorId: 'alistair',
          screenPosition: layout.alistairPosition,
          scale: 0.86,
          facing: layout.alistairFacing,
          lookTarget: 'kestrel',
          entryEffect: 'FADE_IN',
          group: 'PLAYER_COMPANY',
          dramaticSide: 'RIGHT',
          depth: 4,
          narrativeRole: kestrelSpeaking ? 'LISTENER' : 'CURRENT_SPEAKER',
        },
      ],
      mediaSubjects: [],
      actorRegions: state === 'center'
        ? [
            { x: 0.34, y: 0.12, width: 0.32, height: 0.78 },
            { x: 0.72, y: 0.12, width: 0.24, height: 0.78 },
          ]
        : state === 'right' || (proofCharacter === 'alistair' && state === 'mirrored')
          ? [
              { x: 0.6, y: 0.12, width: 0.35, height: 0.78 },
              { x: 0.05, y: 0.12, width: 0.33, height: 0.78 },
            ]
          : [
              { x: 0.05, y: 0.12, width: 0.37, height: 0.78 },
              { x: 0.6, y: 0.12, width: 0.35, height: 0.78 },
            ],
      dialogueSafeZone: layout.dialoguePlacement === 'RIGHT'
        ? { x: 0.63, y: 0.55, width: 0.33, height: 0.38 }
        : { x: 0.04, y: 0.55, width: state === 'center' ? 0.28 : 0.33, height: 0.38 },
      choiceSafeZones: [],
      criticalVisualRegions: [{ x: 0.05, y: 0.12, width: 0.9, height: 0.78 }],
      negativeSpaceIntent: 'Dialogue card opposite the active speaker.',
      cameraIntent: 'Locked character-free Forest Road tableau plate.',
      stepDirections: [{
        stepId: 'proof-line',
        speakerId: kestrelSpeaking ? 'kestrel' : 'alistair',
        addressedTo: kestrelSpeaking ? 'alistair' : 'kestrel',
        lookTarget: kestrelSpeaking ? 'alistair' : 'kestrel',
        facing: kestrelSpeaking ? layout.kestrelFacing : layout.alistairFacing,
        resolution: 'EXPLICIT_ADDRESSEE',
      }],
    }],
    family: 'EVENT',
    stillImage: environment.url,
    exit: 'DIALOGUE_SEQUENCE_COMPLETE',
    next: 'RESOLVED_CAMPAIGN_TABLEAU',
  };
}

function tableauDialogue(state: OptionCTableauState, proofCharacter: OptionCProofCharacter): DialogueSequence {
  const kestrelSpeaking = tableauLayout(state, proofCharacter).kestrelSpeaking;
  return {
    id: `option-c-phase4b-tableau-${state}`,
    title: 'Route forestière',
    steps: [{
      id: 'proof-line',
      speaker: kestrelSpeaking ? 'Kestrel' : 'Alistair',
      actorId: kestrelSpeaking ? 'kestrel' : 'alistair',
      expression: 'neutral',
      portrait: '',
      tag: kestrelSpeaking ? 'Éclaireuse' : 'Chef de compagnie',
      text: kestrelSpeaking
        ? 'La piste se resserre. Les traces sont fraîches — gardons la route et avançons sans rompre la formation.'
        : 'Reste en observation, Kestrel. Nous suivons ton cap et gardons les lames prêtes.',
      side: kestrelSpeaking ? 'left' : 'right',
      next: null,
      effects: [],
      choices: [],
    }],
  };
}

async function preloadRequiredImages(urls: readonly string[]): Promise<void> {
  await Promise.all(urls.map((url) => new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Required Phase 4B asset failed to load: ${url}`));
    image.src = url;
  })));
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

export class OptionCPhase4bProof {
  private readonly state: GameState = createInitialState();
  private readonly travel: TravelView;
  private readonly dialogue: DialogueView;
  private readonly combat: CombatBridge;
  private readonly proofCharacter: OptionCProofCharacter;
  private readonly animation: SpriteFrameAnimationController<OptionCAnimationState>;
  private catalog: OptionCEnvironmentCatalog | null = null;
  private environment: ResolvedOptionCEnvironment | null = null;
  private readonly contextBySurface = new Map<OptionCProofSurface, string>();
  private readonly loadedEnvironmentUrls = new Set<string>();
  private environmentRequestCount = 0;
  private environmentCacheHits = 0;
  private environmentFailureCount = 0;
  private surface: OptionCProofSurface = 'travel';
  private animationState: OptionCAnimationState = 'idle';
  private tableauState: OptionCTableauState = 'active';
  private tableauProofCase: OptionCTableauProofCase | null = null;
  private sceneSurface: NarrativeSceneSurface | null = null;
  private frameRequest = 0;
  private combatMounted = false;
  private combatContextId = '';

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    const requestedCharacter = new URLSearchParams(window.location.search).get('character');
    this.proofCharacter = isOptionCProofCharacter(requestedCharacter) ? requestedCharacter : 'kestrel';
    this.animation = new SpriteFrameAnimationController(
      optionCAnimationDefinitionsFor(this.proofCharacter),
      'idle',
      performance.now(),
    );
    this.travel = new TravelView({
      root,
      getState: () => this.state,
      onSelect: async () => undefined,
      onOpenClan: () => undefined,
      onSave: () => undefined,
      onOpenMenu: () => undefined,
    });
    this.dialogue = new DialogueView({
      root,
      getState: () => this.state,
      applyEffects: async () => undefined,
    });
    this.combat = new CombatBridge(root);
  }

  async start(): Promise<void> {
    document.body.classList.add('option-c-phase4b');
    document.body.dataset.optionCProofCharacter = this.proofCharacter;
    this.canvas.hidden = true;
    window.addEventListener('message', this.onMessage);
    try {
      this.catalog = await loadOptionCEnvironmentCatalog();
      const required = this.proofCharacter === 'alistair'
        ? optionCRequiredImageUrlsFor('alistair')
        : Object.values(OPTION_C_PHASE4B_ASSETS.animations).flat();
      await preloadRequiredImages(required);
    } catch (error) {
      this.showFailure(error instanceof Error ? error.message : String(error));
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const surface = params.get('surface');
    const animation = params.get('animation');
    const tableauState = params.get('tableauState');
    const tableauProofCase = params.get('tableauCase');
    this.surface = isOptionCProofSurface(surface) ? surface : 'travel';
    this.animationState = isOptionCAnimationState(animation) ? animation : 'idle';
    this.tableauState = isOptionCTableauState(tableauState) ? tableauState : 'active';
    this.tableauProofCase = isOptionCTableauProofCase(tableauProofCase) ? tableauProofCase : null;
    const catalog = this.requireCatalog();
    const requestedContext = params.get('context');
    const validContext = requestedContext
      && catalog.contextsFor(this.surface).some((entry) => entry.contextId === requestedContext)
      ? requestedContext
      : undefined;
    document.body.dataset.optionCEnvironmentTotalContexts = `${catalog.totalContexts}`;
    document.body.dataset.optionCEnvironmentMappedContexts = `${catalog.mappedContexts}`;
    document.body.dataset.optionCEnvironmentUnmappedContexts = `${catalog.unmappedContexts}`;
    document.body.dataset.optionCEnvironmentFallbackContexts = `${catalog.fallbackContexts}`;
    document.body.dataset.optionCEnvironmentManifestAssets = `${catalog.manifestAssetCount}`;
    document.body.dataset.optionCEnvironmentVisualFamilies = `${catalog.visualFamilies.length}`;
    document.body.dataset.optionCEnvironmentGlobalPreload = 'false';
    this.syncEnvironmentMetrics();
    try {
      await this.showSurface(this.surface, validContext);
    } catch (error) {
      this.showFailure(error instanceof Error ? error.message : String(error));
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest);
    window.removeEventListener('message', this.onMessage);
    this.travel.close();
    this.dialogue.close();
    this.sceneSurface?.dispose();
    this.combat.dispose();
    document.body.classList.remove('option-c-phase4b');
    delete document.body.dataset.optionCProofCharacter;
  }

  private async showSurface(surface: OptionCProofSurface, contextId?: string): Promise<void> {
    const catalog = this.requireCatalog();
    const oldSurface = this.surface;
    const requestedContext = contextId ?? this.contextBySurface.get(surface);
    const environment = requestedContext
      ? catalog.resolve(surface, requestedContext)
      : catalog.defaultFor(surface);
    const remainedInCombat = this.combatMounted
      && (oldSurface === 'strategic' || oldSurface === 'combat-stage')
      && (surface === 'strategic' || surface === 'combat-stage')
      && this.combatContextId === environment.contextId;
    this.surface = surface;
    this.environment = environment;
    this.contextBySurface.set(surface, environment.contextId);
    this.applyEnvironmentDataset(environment, false);
    this.syncUrl();
    if (remainedInCombat) {
      this.registerEnvironmentRequest(environment);
      this.combat.sendDevOptionCProofCommand(surface, this.animationState, environment);
      this.renderControls();
      document.body.dataset.optionCProofSurface = surface;
      return;
    }
    this.clearSurface();
    if (surface === 'travel') await this.renderTravel(environment);
    else if (surface === 'tableau') await this.renderTableau(environment);
    else await this.renderCombat(surface, environment);
    this.renderControls();
    document.body.dataset.optionCProofReady = 'true';
    document.body.dataset.optionCProofSurface = surface;
  }

  private clearSurface(): void {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = 0;
    this.travel.close();
    this.dialogue.close();
    this.sceneSurface?.dispose();
    this.sceneSurface = null;
    this.combat.close();
    this.combatMounted = false;
    this.combatContextId = '';
    this.root.replaceChildren();
  }

  private async renderTravel(environment: ResolvedOptionCEnvironment): Promise<void> {
    await this.preloadEnvironment(environment);
    const travelContext = configureTravelProofState(this.state, environment.contextId);
    this.travel.open();
    const element = this.root.querySelector<HTMLElement>('.travel-view');
    if (!element) throw new Error('TravelView did not mount its production surface.');
    element.classList.add('option-c-phase4b__travel');
    element.style.setProperty('--travel-sky', `url('${environment.url}')`);
    element.style.setProperty('--screen-bg-image', `url('${environment.url}')`);
    element.dataset.optionCProofComponent = 'TravelView';
    element.dataset.optionCEnvironmentContext = environment.contextId;
    element.dataset.optionCEnvironmentAsset = environment.assetId;
    element.dataset.optionCTravelCurrentNode = travelContext.currentNodeId;
    element.dataset.optionCTravelDestinations = travelContext.destinationNodeIds.join(',');
    document.body.dataset.optionCTravelCurrentNode = travelContext.currentNodeId;
    document.body.dataset.optionCTravelDestinations = travelContext.destinationNodeIds.join(',');
    this.applyEnvironmentDataset(environment, true);
  }

  private async renderTableau(environment: ResolvedOptionCEnvironment): Promise<void> {
    await this.preloadEnvironment(environment);
    if (this.tableauProofCase) {
      await this.renderAuthoredTableauProof(environment, this.tableauProofCase);
      return;
    }
    const stageRoot = document.createElement('div');
    stageRoot.className = 'option-c-phase4b__tableau-root';
    this.root.append(stageRoot);
    const spec = tableauSpec(this.tableauState, this.proofCharacter, environment);
    const frames = this.proofCharacter === 'alistair'
      ? OPTION_C_ALISTAIR_ASSETS.animations[this.animationState]
      : OPTION_C_PHASE4B_ASSETS.animations[this.animationState];
    const actorImages: Readonly<Record<string, string>> = this.proofCharacter === 'alistair'
      ? { alistair: frames[0]! }
      : { kestrel: frames[0]! };
    this.sceneSurface = new NarrativeSceneSurface(stageRoot, spec, {
      actorImages,
    });
    this.sceneSurface.mount();
    const layout = tableauLayout(this.tableauState, this.proofCharacter);
    const addressedActor = layout.kestrelSpeaking ? 'alistair' : 'kestrel';
    await this.sceneSurface.setPhase(
      'forest-road-tableau-proof',
      layout.kestrelSpeaking ? 'kestrel' : 'alistair',
      layout.dialoguePlacement,
      layout.kestrelSpeaking ? layout.kestrelFacing : layout.alistairFacing,
      addressedActor,
      addressedActor,
      'EXPLICIT_ADDRESSEE',
    );
    await this.sceneSurface.whenRenderable();
    this.applyEnvironmentDataset(environment, true);
    void this.dialogue.play(tableauDialogue(this.tableauState, this.proofCharacter), {
      mode: 'narrative-stage',
      root: this.root,
      stepPresentation: () => ({
        mode: 'HELD_DIALOGUE',
        showPortrait: false,
        dialogueSurfaceMode: 'STATIC_TABLEAU',
        layoutProfile: 'DIALOGUE_SPEAKER_FOCUS',
        layoutPlacement: layout.dialoguePlacement,
        speakerScreenPosition: layout.kestrelSpeaking ? layout.kestrelPosition : layout.alistairPosition,
        presentationStrategy: 'IN_SCENE',
        phaseId: 'forest-road-tableau-proof',
        castOwnership: 'STAGE_OWNS_CAST',
      }),
    });
    this.startTableauAnimation();
  }

  private async renderAuthoredTableauProof(
    environment: ResolvedOptionCEnvironment,
    proofCase: OptionCTableauProofCase,
  ): Promise<void> {
    const definition = OPTION_C_TABLEAU_PROOF_CASES[proofCase];
    const sequence = dialogues.get(definition.dialogueId);
    if (!sequence) throw new Error(`Missing production dialogue '${definition.dialogueId}'.`);
    const authored = applyFinalDialoguePresentationPlan(sequence);
    const spec: NarrativeTableauSpec = {
      ...authored,
      id: `option-c-tableau-proof-${proofCase}`,
      tableauBackgroundId: environment.assetId,
      stillImage: environment.url,
    };
    const firstStep = sequence.steps[0];
    if (!firstStep) throw new Error(`Production dialogue '${sequence.id}' has no steps.`);
    const firstPhase = tableauPhaseForStep(spec, firstStep);
    if (firstPhase.staticCast.length !== definition.expectedCastCount) {
      throw new Error(
        `Authored ${proofCase} proof resolved ${firstPhase.staticCast.length} actors; expected ${definition.expectedCastCount}.`,
      );
    }

    const stageRoot = document.createElement('div');
    stageRoot.className = 'option-c-phase4b__tableau-root';
    this.root.append(stageRoot);
    this.sceneSurface = new NarrativeSceneSurface(stageRoot, spec, { reducedMotion: true });
    this.sceneSurface.mount(undefined, firstPhase.id);

    const applyStep = async (step: DialogueStep): Promise<void> => {
      const phase = tableauPhaseForStep(spec, step);
      const direction = phase.stepDirections?.find((candidate) => candidate.stepId === step.id);
      const stagedSpeaker = phase.staticCast.find((actor) => actor.actorId === step.actorId);
      await this.sceneSurface?.setPhase(
        phase.id,
        step.actorId,
        phase.layoutPlacement,
        direction?.facing ?? stagedSpeaker?.facing,
        direction?.lookTarget ?? stagedSpeaker?.lookTarget,
        direction?.addressedTo,
        direction?.resolution,
      );
    };
    await applyStep(firstStep);
    await this.sceneSurface.whenRenderable();
    this.applyEnvironmentDataset(environment, true);
    document.body.dataset.optionCTableauProofCase = proofCase;
    document.body.dataset.optionCTableauDialogue = sequence.id;
    document.body.dataset.optionCTableauCastCount = `${firstPhase.staticCast.length}`;
    document.body.dataset.optionCTableauActors = firstPhase.staticCast.map((actor) => actor.actorId).join(',');

    void this.dialogue.play(sequence, {
      mode: 'narrative-stage',
      root: this.root,
      beforeStepChange: async (step) => applyStep(step),
      stepPresentation: (step) => {
        const phase = tableauPhaseForStep(spec, step);
        const stagedSpeaker = phase.staticCast.find((actor) => actor.actorId === step.actorId);
        return {
          mode: 'HELD_DIALOGUE',
          showPortrait: false,
          dialogueSurfaceMode: 'STATIC_TABLEAU',
          layoutProfile: phase.layoutProfile,
          layoutPlacement: phase.layoutPlacement,
          speakerScreenPosition: stagedSpeaker?.screenPosition,
          presentationStrategy: phase.staticCast.length === 1 ? 'SPEAKER_FOCUS' : 'GROUP_SCENE',
          phaseId: phase.id,
          castOwnership: 'STAGE_OWNS_CAST',
        };
      },
    });
  }

  private async renderCombat(
    surface: 'strategic' | 'combat-stage',
    environment: ResolvedOptionCEnvironment,
  ): Promise<void> {
    const combatId = environment.contextId.startsWith('combat:')
      ? environment.contextId.slice('combat:'.length)
      : '';
    const config = combatConfigs.get(combatId);
    if (!config) throw new Error(`Missing real combat config '${combatId}' for ${environment.contextId}.`);
    const clan = this.state.clan.members.map((unit) => {
      const payload = toCombatant(unit, { qaUnlockAllSkills: true });
      if (this.proofCharacter === 'alistair' && unit.definitionId === 'warrior') {
        payload.portrait = OPTION_C_ALISTAIR_ASSETS.animations.idle[0]!;
      } else if (this.proofCharacter === 'kestrel' && unit.definitionId === 'archer') {
        payload.portrait = OPTION_C_PHASE4B_ASSETS.animations.idle[0]!;
      }
      return payload;
    });
    const session = this.combat.start({
      config,
      clan,
      inventory: { ...this.state.inventory.consumables },
      preferredUnitIds: this.proofCharacter === 'alistair'
        ? ['warrior', 'archer', 'white_mage', 'dark_mage']
        : ['archer', 'warrior', 'white_mage', 'dark_mage'],
      reducedGraphics: false,
      devQa: false,
      qaFullAp: true,
      devOptionCProof: true,
      devOptionCProofCharacter: this.proofCharacter,
    });
    this.combatMounted = true;
    this.combatContextId = environment.contextId;
    await session.ready;
    this.registerEnvironmentRequest(environment);
    this.combat.sendDevOptionCProofCommand(surface, this.animationState, environment);
  }

  private startTableauAnimation(): void {
    this.animation.play(this.animationState, performance.now());
    const tick = (now: number) => {
      const image = this.root.querySelector<HTMLImageElement>(`.narrative-cast__actor[data-actor-id="${this.proofCharacter}"] img`);
      if (image) {
        const sample = this.animation.sample(now);
        if (!image.src.endsWith(sample.frameUrl)) image.src = sample.frameUrl;
        document.body.dataset.optionCAnimationState = sample.state;
        document.body.dataset.optionCAnimationFrame = String(sample.frameIndex + 1);
      }
      this.frameRequest = requestAnimationFrame(tick);
    };
    this.frameRequest = requestAnimationFrame(tick);
  }

  private setAnimation(state: OptionCAnimationState): void {
    this.animationState = state;
    this.animation.play(state, performance.now());
    this.syncUrl();
    if ((this.surface === 'strategic' || this.surface === 'combat-stage') && this.environment) {
      this.combat.sendDevOptionCProofCommand(this.surface, state, this.environment);
    }
    this.renderControls();
  }

  private setTableauState(state: OptionCTableauState): void {
    this.tableauState = state;
    this.syncUrl();
    if (this.surface === 'tableau') this.requestSurface('tableau', this.environment?.contextId);
  }

  private renderControls(): void {
    const catalog = this.requireCatalog();
    const environment = this.environment ?? catalog.defaultFor(this.surface);
    const contexts = catalog.contextsFor(this.surface);
    const contextIndex = Math.max(0, contexts.findIndex((entry) => entry.contextId === environment.contextId));
    this.root.querySelector('.option-c-phase4b__controls')?.remove();
    const controls = document.createElement('aside');
    controls.className = 'option-c-phase4b__controls';
    controls.setAttribute('aria-label', 'Option C Phase 4B DEV controls');
    controls.innerHTML = `
      <header><span>DEV ONLY</span><b>OPTION C · ${escapeHtml(environment.visualFamily.replaceAll('_', ' '))} · ${this.proofCharacter.toUpperCase()}</b><small>${escapeHtml(environment.assetId)} · ${contextIndex + 1}/${contexts.length}</small></header>
      <div class="option-c-phase4b__control-row" data-control="surface">
        ${SURFACES.map((entry) => `<button type="button" data-surface="${entry.id}" class="${entry.id === this.surface ? 'is-active' : ''}">${entry.label}</button>`).join('')}
      </div>
      <div class="option-c-phase4b__control-row option-c-phase4b__control-row--environment" data-control="environment">
        <button type="button" data-environment-step="-1" aria-label="Previous environment context">◀</button>
        <select data-environment-context aria-label="Approved environment context">
          ${contexts.map((entry) => `<option value="${escapeHtml(entry.contextId)}" ${entry.contextId === environment.contextId ? 'selected' : ''}>${escapeHtml(entry.contextId)} · ${escapeHtml(entry.assetId)}</option>`).join('')}
        </select>
        <button type="button" data-environment-step="1" aria-label="Next environment context">▶</button>
      </div>
      <div class="option-c-phase4b__control-row" data-control="animation">
        ${ANIMATIONS.map((entry) => `<button type="button" data-animation="${entry.id}" class="${entry.id === this.animationState ? 'is-active' : ''}">${entry.label}</button>`).join('')}
      </div>
      ${this.surface === 'tableau' ? `<div class="option-c-phase4b__control-row" data-control="tableau">
        ${TABLEAU_STATES.map((entry) => `<button type="button" data-tableau-state="${entry.id}" class="${entry.id === this.tableauState ? 'is-active' : ''}">${entry.label}</button>`).join('')}
      </div>` : ''}
    `;
    controls.querySelectorAll<HTMLButtonElement>('[data-surface]').forEach((button) => {
      button.addEventListener('click', () => {
        const surface = button.dataset.surface ?? null;
        if (!isOptionCProofSurface(surface)) return;
        const currentContext = this.environment?.contextId;
        const sharedContext = currentContext
          && catalog.contextsFor(surface).some((entry) => entry.contextId === currentContext)
          ? currentContext
          : undefined;
        this.requestSurface(surface, sharedContext);
      });
    });
    controls.querySelector<HTMLSelectElement>('[data-environment-context]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      this.requestSurface(this.surface, target.value);
    });
    controls.querySelectorAll<HTMLButtonElement>('[data-environment-step]').forEach((button) => {
      button.addEventListener('click', () => {
        const step = Number(button.dataset.environmentStep ?? 0);
        const nextIndex = (contextIndex + step + contexts.length) % contexts.length;
        const next = contexts[nextIndex];
        if (next) this.requestSurface(this.surface, next.contextId);
      });
    });
    controls.querySelectorAll<HTMLButtonElement>('[data-animation]').forEach((button) => {
      button.addEventListener('click', () => {
        const state = button.dataset.animation ?? null;
        if (isOptionCAnimationState(state)) this.setAnimation(state);
      });
    });
    controls.querySelectorAll<HTMLButtonElement>('[data-tableau-state]').forEach((button) => {
      button.addEventListener('click', () => {
        const state = button.dataset.tableauState ?? null;
        if (isOptionCTableauState(state)) this.setTableauState(state);
      });
    });
    this.root.append(controls);
  }

  private syncUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('devOptionC', 'forest-road');
    url.searchParams.set('character', this.proofCharacter);
    url.searchParams.set('surface', this.surface);
    if (this.environment) url.searchParams.set('context', this.environment.contextId);
    url.searchParams.set('animation', this.animationState);
    url.searchParams.set('tableauState', this.tableauState);
    if (this.tableauProofCase) url.searchParams.set('tableauCase', this.tableauProofCase);
    else url.searchParams.delete('tableauCase');
    history.replaceState(null, '', url);
  }

  private requestSurface(surface: OptionCProofSurface, contextId?: string): void {
    void this.showSurface(surface, contextId).catch((error) => {
      this.showFailure(error instanceof Error ? error.message : String(error));
    });
  }

  private requireCatalog(): OptionCEnvironmentCatalog {
    if (!this.catalog) throw new Error('Option C environment catalog is not loaded.');
    return this.catalog;
  }

  private registerEnvironmentRequest(environment: ResolvedOptionCEnvironment): boolean {
    if (this.loadedEnvironmentUrls.has(environment.url)) {
      this.environmentCacheHits += 1;
      this.syncEnvironmentMetrics();
      return false;
    }
    this.environmentRequestCount += 1;
    this.syncEnvironmentMetrics();
    return true;
  }

  private async preloadEnvironment(environment: ResolvedOptionCEnvironment): Promise<void> {
    if (!this.registerEnvironmentRequest(environment)) {
      this.applyEnvironmentDataset(environment, true);
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Approved Option C environment failed to load: ${environment.url}`));
        image.src = environment.url;
      });
      this.loadedEnvironmentUrls.add(environment.url);
    } catch (error) {
      this.environmentFailureCount += 1;
      this.syncEnvironmentMetrics();
      throw error;
    }
  }

  private applyEnvironmentDataset(environment: ResolvedOptionCEnvironment, ready: boolean): void {
    document.body.dataset.optionCEnvironmentContext = environment.contextId;
    document.body.dataset.optionCEnvironmentAsset = environment.assetId;
    document.body.dataset.optionCEnvironmentFamily = environment.visualFamily;
    document.body.dataset.optionCEnvironmentRole = environment.surfaceRole;
    document.body.dataset.optionCEnvironmentUrl = environment.url;
    document.body.dataset.optionCEnvironmentDimensions = `${environment.width}x${environment.height}`;
    document.body.dataset.optionCEnvironmentReady = ready ? 'true' : 'false';
  }

  private syncEnvironmentMetrics(): void {
    document.body.dataset.optionCEnvironmentRequests = `${this.environmentRequestCount}`;
    document.body.dataset.optionCEnvironmentCacheHits = `${this.environmentCacheHits}`;
    document.body.dataset.optionCEnvironmentDuplicateLoads = '0';
    document.body.dataset.optionCEnvironmentFailures = `${this.environmentFailureCount}`;
  }

  private showFailure(message: string): void {
    this.root.innerHTML = `<section class="option-c-phase4b__failure" role="alert"><b>OPTION C PHASE 4B — ASSET FAILURE</b><p></p></section>`;
    const copy = this.root.querySelector('p');
    if (copy) copy.textContent = message;
    document.body.dataset.optionCProofFailure = message;
  }

  private onMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'rpg-threejs:option-c-environment-ready') {
      const environment = this.environment;
      if (environment && event.data.contextId === environment.contextId && event.data.assetId === environment.assetId) {
        this.loadedEnvironmentUrls.add(environment.url);
        this.applyEnvironmentDataset(environment, true);
      }
      return;
    }
    if (event.data?.type !== 'rpg-threejs:option-c-proof-error') return;
    this.environmentFailureCount += 1;
    this.syncEnvironmentMetrics();
    this.showFailure(`Combat runtime failed to load required asset: ${String(event.data.asset ?? 'unknown')}`);
  };
}
