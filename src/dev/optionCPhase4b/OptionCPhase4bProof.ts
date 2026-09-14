import { CombatBridge } from '../../combat/CombatBridge';
import { NarrativeSceneSurface } from '../../cinematics/NarrativeSceneSurface';
import type { NarrativeTableauSpec } from '../../cinematics/NarrativeTableau';
import { toCombatant } from '../../game/catalog';
import { combatConfigs } from '../../game/content';
import { createInitialState } from '../../game/store';
import type { DialogueSequence, GameState } from '../../game/types';
import { SpriteFrameAnimationController } from '../../render/SpriteFrameAnimation';
import { DialogueView } from '../../ui/DialogueView';
import { TravelView } from '../../ui/TravelView';
import {
  isOptionCAnimationState,
  isOptionCProofSurface,
  isOptionCTableauState,
  OPTION_C_ANIMATION_DEFINITIONS,
  OPTION_C_PHASE4B_ASSETS,
  OPTION_C_REQUIRED_IMAGE_URLS,
  type OptionCAnimationState,
  type OptionCProofSurface,
  type OptionCTableauState,
} from './OptionCPhase4bAssets';

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

function tableauLayout(state: OptionCTableauState) {
  const kestrelSpeaking = state !== 'listening';
  const kestrelPosition = state === 'center' ? 'CENTER' as const : state === 'right' ? 'RIGHT' as const : 'LEFT' as const;
  const alistairPosition = state === 'center' ? 'FAR_RIGHT' as const : state === 'right' ? 'LEFT' as const : 'RIGHT' as const;
  const kestrelFacing = state === 'mirrored' || state === 'right' ? 'LEFT' as const : 'RIGHT' as const;
  const alistairFacing = state === 'right' ? 'RIGHT' as const : 'LEFT' as const;
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

function tableauSpec(state: OptionCTableauState): NarrativeTableauSpec {
  const layout = tableauLayout(state);
  const { kestrelSpeaking } = layout;
  return {
    id: `option-c-phase4b-forest-road-${state}`,
    tableauBackgroundId: 'option-c-phase4b-forest-road-tableau',
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
        : state === 'right'
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
    stillImage: OPTION_C_PHASE4B_ASSETS.environments.tableau,
    exit: 'DIALOGUE_SEQUENCE_COMPLETE',
    next: 'RESOLVED_CAMPAIGN_TABLEAU',
  };
}

function tableauDialogue(state: OptionCTableauState): DialogueSequence {
  const kestrelSpeaking = state !== 'listening';
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

export class OptionCPhase4bProof {
  private readonly state: GameState = createInitialState();
  private readonly travel: TravelView;
  private readonly dialogue: DialogueView;
  private readonly combat: CombatBridge;
  private readonly animation = new SpriteFrameAnimationController(OPTION_C_ANIMATION_DEFINITIONS, 'idle', performance.now());
  private surface: OptionCProofSurface = 'travel';
  private animationState: OptionCAnimationState = 'idle';
  private tableauState: OptionCTableauState = 'active';
  private sceneSurface: NarrativeSceneSurface | null = null;
  private frameRequest = 0;
  private combatMounted = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
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
    this.canvas.hidden = true;
    window.addEventListener('message', this.onMessage);
    try {
      await preloadRequiredImages(OPTION_C_REQUIRED_IMAGE_URLS);
    } catch (error) {
      this.showFailure(error instanceof Error ? error.message : String(error));
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const surface = params.get('surface');
    const animation = params.get('animation');
    const tableauState = params.get('tableauState');
    this.surface = isOptionCProofSurface(surface) ? surface : 'travel';
    this.animationState = isOptionCAnimationState(animation) ? animation : 'idle';
    this.tableauState = isOptionCTableauState(tableauState) ? tableauState : 'active';
    await this.showSurface(this.surface);
  }

  dispose(): void {
    cancelAnimationFrame(this.frameRequest);
    window.removeEventListener('message', this.onMessage);
    this.travel.close();
    this.dialogue.close();
    this.sceneSurface?.dispose();
    this.combat.dispose();
    document.body.classList.remove('option-c-phase4b');
  }

  private async showSurface(surface: OptionCProofSurface): Promise<void> {
    const oldSurface = this.surface;
    const remainedInCombat = this.combatMounted
      && (oldSurface === 'strategic' || oldSurface === 'combat-stage')
      && (surface === 'strategic' || surface === 'combat-stage');
    this.surface = surface;
    this.syncUrl();
    if (remainedInCombat) {
      this.combat.sendDevOptionCProofCommand(surface, this.animationState);
      this.renderControls();
      document.body.dataset.optionCProofSurface = surface;
      return;
    }
    this.clearSurface();
    if (surface === 'travel') this.renderTravel();
    else if (surface === 'tableau') await this.renderTableau();
    else await this.renderCombat(surface);
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
    this.root.replaceChildren();
  }

  private renderTravel(): void {
    this.travel.open();
    const element = this.root.querySelector<HTMLElement>('.travel-view');
    if (!element) throw new Error('TravelView did not mount its production surface.');
    element.classList.add('option-c-phase4b__travel');
    element.style.setProperty('--travel-sky', `url('${OPTION_C_PHASE4B_ASSETS.environments.travel}')`);
    element.style.setProperty('--screen-bg-image', `url('${OPTION_C_PHASE4B_ASSETS.environments.travel}')`);
    element.dataset.optionCProofComponent = 'TravelView';
  }

  private async renderTableau(): Promise<void> {
    const stageRoot = document.createElement('div');
    stageRoot.className = 'option-c-phase4b__tableau-root';
    this.root.append(stageRoot);
    const spec = tableauSpec(this.tableauState);
    this.sceneSurface = new NarrativeSceneSurface(stageRoot, spec, {
      actorImages: { kestrel: OPTION_C_PHASE4B_ASSETS.animations[this.animationState][0]! },
    });
    this.sceneSurface.mount();
    const layout = tableauLayout(this.tableauState);
    await this.sceneSurface.setPhase(
      'forest-road-tableau-proof',
      layout.kestrelSpeaking ? 'kestrel' : 'alistair',
      layout.dialoguePlacement,
      layout.kestrelSpeaking ? layout.kestrelFacing : layout.alistairFacing,
      this.tableauState === 'listening' ? 'kestrel' : 'alistair',
      this.tableauState === 'listening' ? 'kestrel' : 'alistair',
      'EXPLICIT_ADDRESSEE',
    );
    await this.sceneSurface.whenRenderable();
    void this.dialogue.play(tableauDialogue(this.tableauState), {
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

  private async renderCombat(surface: 'strategic' | 'combat-stage'): Promise<void> {
    const config = combatConfigs.get('forest_patrol');
    if (!config) throw new Error("Missing real combat config 'forest_patrol'.");
    const clan = this.state.clan.members.map((unit) => {
      const payload = toCombatant(unit, { qaUnlockAllSkills: true });
      if (unit.definitionId === 'archer') payload.portrait = OPTION_C_PHASE4B_ASSETS.animations.idle[0]!;
      return payload;
    });
    const session = this.combat.start({
      config,
      clan,
      inventory: { ...this.state.inventory.consumables },
      preferredUnitIds: ['archer', 'warrior', 'white_mage', 'dark_mage'],
      reducedGraphics: false,
      devQa: false,
      qaFullAp: true,
      devOptionCProof: true,
    });
    this.combatMounted = true;
    await session.ready;
    this.combat.sendDevOptionCProofCommand(surface, this.animationState);
  }

  private startTableauAnimation(): void {
    this.animation.play(this.animationState, performance.now());
    const tick = (now: number) => {
      const image = this.root.querySelector<HTMLImageElement>('.narrative-cast__actor[data-actor-id="kestrel"] img');
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
    if (this.surface === 'strategic' || this.surface === 'combat-stage') {
      this.combat.sendDevOptionCProofCommand(this.surface, state);
    }
    this.renderControls();
  }

  private setTableauState(state: OptionCTableauState): void {
    this.tableauState = state;
    this.syncUrl();
    if (this.surface === 'tableau') void this.showSurface('tableau');
  }

  private renderControls(): void {
    this.root.querySelector('.option-c-phase4b__controls')?.remove();
    const controls = document.createElement('aside');
    controls.className = 'option-c-phase4b__controls';
    controls.setAttribute('aria-label', 'Option C Phase 4B DEV controls');
    controls.innerHTML = `
      <header><span>DEV ONLY</span><b>OPTION C · FOREST ROAD</b><small>Real runtime production proof</small></header>
      <div class="option-c-phase4b__control-row" data-control="surface">
        ${SURFACES.map((entry) => `<button type="button" data-surface="${entry.id}" class="${entry.id === this.surface ? 'is-active' : ''}">${entry.label}</button>`).join('')}
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
        if (isOptionCProofSurface(surface)) void this.showSurface(surface);
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
    url.searchParams.set('surface', this.surface);
    url.searchParams.set('animation', this.animationState);
    url.searchParams.set('tableauState', this.tableauState);
    history.replaceState(null, '', url);
  }

  private showFailure(message: string): void {
    this.root.innerHTML = `<section class="option-c-phase4b__failure" role="alert"><b>OPTION C PHASE 4B — ASSET FAILURE</b><p></p></section>`;
    const copy = this.root.querySelector('p');
    if (copy) copy.textContent = message;
    document.body.dataset.optionCProofFailure = message;
  }

  private onMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin || event.data?.type !== 'rpg-threejs:option-c-proof-error') return;
    this.showFailure(`Combat runtime failed to load required asset: ${String(event.data.asset ?? 'unknown')}`);
  };
}
