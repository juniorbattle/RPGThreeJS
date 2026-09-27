import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { GameState, RunNode } from '../game/types';
import { selectTraversalBranch } from '../game/runSystem';
import type { CampaignStatusHud } from '../ui/CampaignStatusHud';
import { createCampaignIcon, decorateCampaignButton, decorateCampaignFrame } from '../ui/design-system/CampaignUi';
import { classifyTraversalInteraction } from './TraversalInteractionGrammar';
import { ROAD_SPACE, beatWorldX, beatPassedProgress, roadCameraX, roadWorldToScreen } from './TraversalRoadSpace';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import { createTraversalSprite } from './TraversalSprite';
import { TraversalWorldRenderer } from './TraversalWorldRenderer';
import { buildTraversalCaravan, caravanWheelAngle, TRAVERSAL_CARAVAN } from './TraversalCaravan';
import { setTraversalDepth, TraversalForegroundRenderer } from './TraversalDepth';
import { traversalLocation } from './TraversalT0World';
import { resolveCharacterVisualProfile, resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import {
  resolveTraversalBeatCrossing,
  resolveTraversalT0Route,
  type TraversalBeatCrossing,
  type TraversalRouteBeat,
  type TraversalT0Route,
} from './TraversalT0Route';
import { TraversalRunController } from './TraversalRunController';
import { TRAVERSAL_RHYTHM, transitionEase } from './TraversalTransition';
import { traversalContactProgress } from './TraversalT0Route';
import type { TraversalLane, TraversalRunSession } from './TraversalRunRuntime';
import { advanceRouteRun, createRouteRun, setRouteLane, type TraversalRouteRunState } from './TraversalRouteRun';
import { resolveT0RouteSegment, T0_ROUTE_SEGMENTS, type T0RouteSegment } from './TraversalT0CheckpointRoute';
import { TraversalRouteRenderer } from './TraversalRouteRenderer';

const LANE_TOP_PERCENT: Record<TraversalLane, number> = { 0: 65, 1: 81 };
const MANDATORY_TOP_PERCENT = 73;
// The beat coordinate is its engagement time, not the truck's center. Leave stopping room.
const TRAVEL_SPEED_PER_SECOND = 0.012;

export interface TraversalT0SceneOptions {
  readonly root: HTMLElement;
  readonly leg: LionTraversalLeg;
  readonly getState: () => GameState;
  readonly getAvailableNodes: () => readonly RunNode[];
  readonly onNodeHandoff: (node: RunNode, session: TraversalRunSession) => void | Promise<void>;
  readonly onArrival: (destinationNodeId: string) => void | Promise<void>;
  readonly onRoadCombat?: (combatId: string) => Promise<boolean>;
  readonly statusHud?: CampaignStatusHud;
  readonly onOptionalIgnore?: (nodeId: string) => { accepted: boolean; feedback?: string };
  readonly onLocalNarrative?: (beatId: string) => Promise<void>;
  readonly onMenu: () => void;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[char] ?? char);
}

function markerGlyph(beat: TraversalRouteBeat): string {
  switch (beat.marker) {
    case 'danger': return '!';
    case 'speech': return '•••';
    case 'loot': return '✦';
    case 'booster': return '◆';
    case 'fork': return '↗';
    case 'obstacle': return '!';
  }
}

function markerLabel(beat: TraversalRouteBeat): string {
  switch (beat.marker) {
    case 'danger': return 'Danger';
    case 'speech': return 'Rencontre';
    case 'loot': return 'Butin';
    case 'booster': return 'Renfort';
    case 'fork': return 'Carrefour';
    case 'obstacle': return 'Obstacle';
  }
}

function laneLabel(lane: TraversalLane): string {
  return lane === 0 ? 'Voie haute' : 'Voie basse';
}

function beatPlacementLabel(beat: TraversalRouteBeat): string {
  return beat.placement === 'CENTERED' ? 'centré sur les deux voies' : laneLabel(beat.lane!);
}

export class TraversalT0Scene {
  readonly element = document.createElement('section');
  route: TraversalT0Route;

  private readonly controller: TraversalRunController;
  private readonly entityElements = new Map<string, HTMLElement>();
  private readonly markerElements = new Map<string, HTMLElement>();
  private readonly worldRenderer = new TraversalWorldRenderer();
  private readonly routeRenderer = new TraversalRouteRenderer();
  private readonly foregroundRenderer = new TraversalForegroundRenderer();
  private readonly stageBeats: readonly TraversalRouteBeat[];
  private frameId: number | null = null;
  private previousFrameMs = 0;
  private opened = false;
  private arrivalRequested = false;
  private arrivalElapsed = 0;
  private confirming = false;
  private assistedUntil = 0;
  private readonly declinedBeats = new Set<string>();
  private readonly collectedAt = new Map<string, number>();
  private speed = 0;
  private transition: { kind: string; elapsed: number; midpoint?: () => void | Promise<void>;
    reveal: boolean; waitingForReady: boolean; blackHoldRemaining: number } | null = null;
  private presentedBranch = 'main';
  private inAnimationFrame = false;
  private frameRenderPending = false;
  private hudVisible = false;
  private routeIndex = 0;
  private routeSegment: T0RouteSegment = resolveT0RouteSegment(0);
  private routeRun: TraversalRouteRunState = createRouteRun(this.routeSegment, 0);
  private viewMode: 'ROUTE' | 'CHECKPOINT' = 'ROUTE';
  private checkpointBeat: TraversalRouteBeat | null = null;
  private checkpointElapsed = 0;
  private checkpointEntries = 0;
  private checkpointExits = 0;

  constructor(private readonly options: TraversalT0SceneOptions) {
    if (options.leg.id !== 'T0') throw new Error('TraversalT0Scene only accepts the canonical T0 leg.');
    const state = options.getState();
    this.route = resolveTraversalT0Route(
      options.leg,
      state.run.graph.nodes,
      state.clan.members.map((member) => member.definitionId),
      state.run.seed,
    );
    this.stageBeats = this.route.beats.filter((beat) => beat.campaignNodeIds.length > 0 && !beat.branchNodeId);
    this.controller = new TraversalRunController({
      leg: options.leg,
      getAvailableNodes: options.getAvailableNodes,
      onBranchSelect: nodeId => new Promise<boolean>(resolve => {
        this.startTransition('fork', () => {
          if (!selectTraversalBranch(options.getState().run, 'T0', nodeId)) { resolve(false); return; }
          const current = options.getState();
          this.route = resolveTraversalT0Route(options.leg, current.run.graph.nodes,
            current.clan.members.map(member => member.definitionId), current.run.seed);
          const entities = this.element.querySelector<HTMLElement>('.traversal-world__entities')!;
          for (const beat of this.route.beats.filter(candidate => candidate.branchNodeId)) {
            this.entityElements.get(beat.id)?.remove();
            this.markerElements.get(beat.id)?.remove();
            this.buildEntity(entities, beat);
          }
          this.presentedBranch = current.run.traversalBranches!.T0!;
          this.checkpointExits++;
          this.startRoute(4);
          // Mount the selected lateral road while the transition is fully opaque.
          this.updateWorldTransforms(true);
          resolve(true);
        });
      }),
      overlayRoot: this.element,
      onNodeHandoff: (node, session) => {
        this.startTransition('event', () => { void options.onNodeHandoff(node, session); });
      },
      onSessionChange: () => {
        if (this.inAnimationFrame) this.frameRenderPending = true;
        else this.renderRuntimeState();
      },
    });
    this.element.className = 'traversal-t0';
    this.element.dataset.traversalLeg = 'T0';
    this.element.dataset.singleRoad = 'false';
    this.element.dataset.view = 'route';
    this.element.dataset.routeSegment = 'route-1';
    this.element.dataset.laneCount = '2';
    this.element.setAttribute('aria-label', `Traversée de ${this.route.originLabel} vers ${this.route.destinationLabel}`);
    this.build();
    this.worldRenderer.setDirections(state.run.graph.nodes.filter(node =>
      options.leg.stages.find(stage => stage.mode === 'IN_TRAVERSAL_FORK')?.nodeIds.includes(node.id)));
  }

  get session(): TraversalRunSession { return this.controller.session; }
  get activeNodeId(): string | null { return this.controller.session.activeNodeId; }

  private get nextStage(): TraversalRouteBeat | undefined {
    const stage = this.stageBeats[this.session.stageIndex];
    const branch = this.options.getState().run.traversalBranches?.T0;
    return stage?.type === 'fork' && branch
      ? this.route.beats.find(beat => beat.branchNodeId === branch) : stage;
  }

  private bypassCanonical(beat: TraversalRouteBeat): void {
    if (!beat.campaignNodeIds.length) return;
    const outcome = this.options.onOptionalIgnore?.(beat.campaignNodeIds[0]!);
    if (!outcome?.accepted) {
      throw new Error(`RunSystem refused optional bypass: ${beat.id}`);
    }
    this.controller.skipStage();
    if (outcome.feedback) {
      const toast = this.element.querySelector<HTMLElement>('.traversal-toast')!;
      toast.textContent = outcome.feedback;
      toast.classList.remove('is-visible');
      void toast.offsetWidth;
      toast.classList.add('is-visible');
    }
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.options.root.append(this.element);
    window.addEventListener('keydown', this.onKeyDown);
    this.element.querySelectorAll<HTMLButtonElement>('[data-traversal-lane]').forEach((button) => {
      button.addEventListener('click', () => this.moveToLane(Number(button.dataset.traversalLane) as TraversalLane));
    });
    this.element.querySelector('[data-traversal-confirm]')!.addEventListener('click', () => { void this.confirmDecision(); });
    this.element.querySelector('[data-traversal-skip]')!.addEventListener('click', () => this.skipDecision());
    this.renderRuntimeState();
    this.startTransition('entry', undefined, true);
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  beginNodeResolution(nodeId: string): void {
    this.controller.beginNodeResolution(nodeId);
    this.element.classList.add('traversal-t0--interrupted');
    this.element.dataset.interruption = nodeId;
    this.renderRuntimeState();
  }

  canResumeNode(nodeId: string): boolean {
    return this.controller.session.phase === 'NODE_RESOLUTION' && this.controller.session.activeNodeId === nodeId;
  }

  resumeNode(nodeId: string): void {
    if (!this.canResumeNode(nodeId)) throw new Error(`Traversal cannot resume from unrelated node "${nodeId}".`);
    this.controller.finishNodeResolution(nodeId);
    this.element.classList.remove('traversal-t0--interrupted');
    delete this.element.dataset.interruption;
    this.checkpointExits++;
    this.startRoute(this.controller.session.stageIndex === this.options.leg.stages.length ? 5 : this.controller.session.stageIndex);
    this.startTransition('return', undefined, true);
    this.renderRuntimeState();
  }

  completeArrival(): void {
    this.controller.completeArrival();
    this.renderRuntimeState();
  }

  dispose(): void {
    this.options.statusHud?.hide(this.element);
    if (!this.opened && !this.element.isConnected) return;
    this.opened = false;
    this.transition = null;
    if (this.frameId !== null) window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    window.removeEventListener('keydown', this.onKeyDown);
    this.controller.dispose();
    this.element.remove();
  }

  private build(): void {
    this.element.innerHTML = `
      <div class="traversal-world" aria-label="Route jouable unique à deux voies">
        <div class="traversal-world__road" aria-hidden="true"></div>
        <div class="traversal-world__lane-glow" aria-hidden="true"></div>
        <div class="traversal-world__actors">
        <div class="traversal-world__entities"></div>
        <figure class="traversal-vehicle" aria-label="Caravane mécanique fermée de la compagnie" data-enclosed-cabin="true" data-visible-wheels="4">
          <span class="traversal-vehicle__shadow" aria-hidden="true"></span>
          <span class="traversal-vehicle__dust traversal-vehicle__dust--one" aria-hidden="true"></span>
          <span class="traversal-vehicle__dust traversal-vehicle__dust--two" aria-hidden="true"></span>
        </figure>
        </div>
        <div class="traversal-world__foreground" aria-hidden="true"></div>
        <div class="traversal-world__markers" aria-hidden="true"></div>
      </div>
      <div class="traversal-transition" aria-hidden="true"></div>
      <header class="traversal-hud traversal-hud--context">
        <span class="traversal-hud__sigil" aria-hidden="true">♜</span>
        <div><p>Route du Lion</p><h1>Vers ${escapeHtml(this.route.destinationLabel)}</h1><span>Départ : ${escapeHtml(this.route.originLabel)}</span></div>
      </header>
      <section class="traversal-event-panel" data-traversal-event-panel aria-live="polite">
        <figure><img data-traversal-event-portrait alt=""></figure>
        <span class="traversal-event-panel__marker" data-traversal-event-marker>•••</span>
        <div><small class="campaign-ui-type--eyebrow" data-traversal-event-kind>Route ouverte</small><strong class="campaign-ui-type--title" data-traversal-event-title>En route</strong><p class="campaign-ui-type--body" data-traversal-event-hint>Surveillez la route.</p>
          <div class="traversal-event-panel__actions" hidden><button type="button" data-traversal-confirm>Confirmer</button><button type="button" data-traversal-skip>Passer</button></div>
        </div>
      </section>
      <aside class="traversal-hud traversal-hud--progress" aria-label="Progression de route">
        <div class="traversal-route-rail" aria-label="Étapes de Traversal">${['Départ', ...T0_ROUTE_SEGMENTS.map(route => route.railLabel)].map((label, index) => `<span class="traversal-route-rail__stop" data-rail-stop="${index}" data-kind="${index === 4 ? 'fork' : 'checkpoint'}" title="${label}"><span>${index === 4 ? '◇' : index === 6 ? '◎' : '•'}</span></span>`).join('')}</div>
        <div class="traversal-hud__destination-icon"></div><div class="traversal-hud__destination-copy"><p class="campaign-ui-type--eyebrow">Prochain arrêt</p><strong class="campaign-ui-type--compact-title" data-traversal-next>${escapeHtml(this.route.destinationLabel)}</strong><span class="campaign-ui-type--metadata" data-traversal-distance>${this.route.distanceKm.toFixed(1)} km</span></div>
      </aside>
      <nav class="traversal-lanes" aria-label="Changer de trajectoire">
        ${([0, 1] as const).map((lane) => `<button type="button" data-traversal-lane="${lane}" aria-label="${lane === 0 ? 'Monter' : 'Descendre'}"><span aria-hidden="true">${lane === 0 ? '▲' : '▼'}</span></button>`).join('')}
      </nav>
      <div class="traversal-toast" role="status" aria-live="polite"></div>
      <div class="traversal-pickup-feedback" role="status" aria-live="polite"></div>
    `;
    const destination = this.element.querySelector<HTMLElement>('.traversal-hud--progress')!;
    destination.querySelector('.traversal-hud__destination-icon')!.append(createCampaignIcon('destination'));
    decorateCampaignFrame(destination, 'compact');
    const eventPanel = this.element.querySelector<HTMLElement>('[data-traversal-event-panel]')!;
    decorateCampaignFrame(eventPanel, 'standard');
    decorateCampaignButton(eventPanel.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!, 'primary');
    decorateCampaignButton(eventPanel.querySelector<HTMLButtonElement>('[data-traversal-skip]')!, 'secondary');
    this.element.querySelector('.traversal-world__road')!.append(this.worldRenderer.element);
    this.element.querySelector('.traversal-world__road')!.append(this.routeRenderer.element);
    this.element.querySelector('.traversal-world')!.append(this.foregroundRenderer.element);
    for (const [selector, plane] of [
      ['.traversal-world__road', 'road-world'], ['.traversal-world__actors', 'road-actors'],
      ['.traversal-world__foreground', 'foreground-extreme'], ['.traversal-world__markers', 'markers'],
      ['.traversal-hud,.traversal-lanes,.traversal-event-panel,.traversal-toast,.traversal-pickup-feedback', 'ui'],
    ] as const) this.element.querySelectorAll<HTMLElement>(selector).forEach(element => setTraversalDepth(element, plane));
    this.element.style.setProperty('--traversal-foreground-image', `url("${TRAVERSAL_T0_ASSETS.foregroundLayer}")`);
    const vehicle = this.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    buildTraversalCaravan(vehicle);
    const entities = this.element.querySelector<HTMLElement>('.traversal-world__entities')!;
    for (const beat of this.route.beats) this.buildEntity(entities, beat);
  }

  private buildEntity(entities: HTMLElement, beat: TraversalRouteBeat): void {
    const entity = document.createElement('article');
    entity.className = `traversal-actor-anchor traversal-entity traversal-entity--${beat.type}`;
    entity.dataset.traversalBeat = beat.id;
    entity.dataset.marker = beat.marker;
    entity.dataset.category = beat.category;
    if (beat.pickup) entity.dataset.pickup = beat.pickup;
    entity.dataset.placement = beat.placement.toLowerCase();
    entity.dataset.interactionPolicy = beat.interactionPolicy;
    if (beat.formation) entity.dataset.formation = 'true';
    const location = beat.locationId ? traversalLocation(beat.locationId) : undefined;
    if (location) entity.dataset.location = location.id;
    if (location?.kind === 'ENVIRONMENT' && beat.lane === 0) entity.dataset.roadside = 'true';
    if (beat.lane !== null) entity.dataset.routeLane = String(beat.lane);
    entity.setAttribute('aria-label', `${markerLabel(beat)} : ${beat.label}, ${beatPlacementLabel(beat)}`);
    const family = resolveCharacterVisualProfile(beat.characterId ?? beat.visualAsset)?.scaleFamily;
    entity.dataset.scale = family === 'SMALL_CREATURE' ? 'creature' : family === 'LARGE_ELITE_BOSS' ? 'elite'
      : family ? 'human' : beat.type;
    const marker = document.createElement('span');
    marker.className = 'traversal-entity__marker';
    marker.dataset.glyph = markerGlyph(beat);
    const body = document.createElement('span');
    body.className = 'traversal-entity__body';
    if (beat.pickup === 'gold') {
      const cluster = document.createElement('span');
      cluster.className = 'traversal-gold-cluster';
      for (let index = 0; index < 3; index++) {
        const coin = document.createElement('span');
        coin.className = 'traversal-gold';
        coin.textContent = '✦';
        cluster.append(coin);
      }
      body.append(cluster);
    } else if (beat.type === 'fork') {
      // Its sign belongs to the persistent junction; only the interaction marker is a beat.
      body.classList.add('traversal-entity__body--location');
    } else if (beat.visualAsset) {
      const image = createTraversalSprite(beat.visualAsset, 'traversal-entity__subject', beat.mirrorX);
      image.dataset.facing = 'left';
      image.classList.toggle('is-mirrored', Boolean(beat.mirrorX));
      body.append(image);
      if (beat.pickup === 'chest') {
        // Shared source canvas/scale keeps the box grounded while its actual painted lid opens.
        const opened = image.cloneNode(true) as HTMLElement;
        opened.classList.add('traversal-chest-open');
        opened.querySelector('img')!.src = TRAVERSAL_T0_ASSETS.chestOpen;
        body.append(opened);
      }
      for (const [index, characterId] of (beat.formation?.slice(1) ?? []).entries()) {
        const asset = resolveCharacterAsset(characterId, 'full');
        if (!asset) throw new Error(`Missing canonical formation sprite: ${characterId}`);
        const companion = createTraversalSprite(asset, 'traversal-formation-member', true);
        companion.style.setProperty('--formation-index', String(index));
        body.append(companion);
      }
    } else {
      const prop = document.createElement('i');
      prop.className = `traversal-entity__prop traversal-entity__prop--${beat.type}`;
      prop.setAttribute('aria-hidden', 'true');
      body.append(prop);
    }
    const label = document.createElement('strong');
    label.textContent = beat.label;
    entity.append(body, label);
    const markerAnchor = document.createElement('div');
    markerAnchor.className = 'traversal-actor-anchor traversal-marker-anchor';
    markerAnchor.dataset.markerFor = beat.id;
    for (const key of ['scale', 'category', 'marker', 'formation', 'placement']) {
      if (entity.dataset[key]) markerAnchor.dataset[key] = entity.dataset[key];
    }
    markerAnchor.append(marker);
    this.element.querySelector('.traversal-world__markers')!.append(markerAnchor);
    this.markerElements.set(beat.id, markerAnchor);
    entities.append(entity);
    this.entityElements.set(beat.id, entity);
  }

  private readonly tick = (timeMs: number): void => {
    if (!this.opened) return;
    const deltaSeconds = this.previousFrameMs > 0
      ? Math.min(1, Math.max(0, (timeMs - this.previousFrameMs) / 1000))
      : 0;
    this.previousFrameMs = timeMs;
    // Physics may take several bounded steps; present their final state once per frame.
    this.inAnimationFrame = true;
    if (this.transition && !document.hidden) this.advanceTransition(deltaSeconds);
    else if (this.controller.session.phase === 'RUNNING' && !document.hidden) this.advance(deltaSeconds);
    if (this.controller.session.phase === 'ARRIVING' && !document.hidden) this.advanceArrival(deltaSeconds);
    this.inAnimationFrame = false;
    if (this.frameRenderPending) {
      this.frameRenderPending = false;
      this.renderRuntimeState();
    } else this.updateWorldTransforms();
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  private startTransition(kind: string, midpoint?: () => void | Promise<void>, reveal = false): void {
    this.transition = { kind, midpoint, elapsed: 0, reveal, waitingForReady: false, blackHoldRemaining: 0 };
    if (kind === 'entry') this.element.style.setProperty('--vehicle-entry-x', '-600px');
    this.element.dataset.transition = kind;
    this.element.style.setProperty('--transition-opacity', reveal ? '1' : '0');
    this.renderRuntimeState();
  }

  private advanceTransition(seconds: number): void {
    const transition = this.transition;
    if (!transition) return;
    if (transition.waitingForReady || (transition.reveal && this.viewMode === 'ROUTE' && !this.routeRenderer.isReady)) {
      this.element.style.setProperty('--transition-opacity', '1');
      return;
    }
    if (transition.blackHoldRemaining > 0) {
      const held = Math.min(seconds, transition.blackHoldRemaining);
      transition.blackHoldRemaining -= held;
      seconds -= held;
      this.element.style.setProperty('--transition-opacity', '1');
      if (seconds <= 0) return;
    }
    transition.elapsed += seconds;
    const half = TRAVERSAL_RHYTHM.fade;
    const time = Math.max(0, transition.elapsed - TRAVERSAL_RHYTHM.hold);
    if (!transition.reveal && time >= half && transition.midpoint) {
      this.element.style.setProperty('--transition-opacity', '1');
      const midpoint = transition.midpoint;
      transition.midpoint = undefined;
      const readiness = midpoint();
      // A synchronous node result may already have started its return transition.
      if (this.transition !== transition) return;
      transition.elapsed = TRAVERSAL_RHYTHM.hold + half;
      transition.blackHoldRemaining = TRAVERSAL_RHYTHM.hold;
      if (readiness) {
        transition.waitingForReady = true;
        void readiness.then(() => {
          if (this.transition !== transition) return;
          transition.waitingForReady = false;
          transition.elapsed = TRAVERSAL_RHYTHM.hold + half;
        }, error => {
          console.error('[Traversal] Checkpoint art did not decode.', error);
          if (this.transition !== transition) return;
          transition.waitingForReady = false;
          transition.elapsed = TRAVERSAL_RHYTHM.hold + half;
        });
      }
      // Preserve a fully covered paint before the reveal, including long browser frames.
      return;
    }
    const opacity = transition.reveal ? 1 - transitionEase(time / half)
      : time < half ? transitionEase(time / half) : 1 - transitionEase((time - half) / half);
    this.element.style.setProperty('--transition-opacity', String(Math.max(0, Math.min(1, opacity))));
    if (transition.kind === 'entry') {
      this.element.style.setProperty('--vehicle-entry-x', `${-600 * (1 - transitionEase(time / (half + TRAVERSAL_RHYTHM.restart)))}px`);
    }
    const duration = transition.kind === 'entry' ? half + TRAVERSAL_RHYTHM.restart
      : half * (transition.reveal ? 1 : 2);
    if (time >= duration) {
      this.transition = null;
      delete this.element.dataset.transition;
      this.renderRuntimeState();
      this.speed = 0;
    }
  }

  private advance(deltaSeconds: number): void {
    // Both the pure route clock and the authored checkpoint approach clamp their own bounds.
    // Present one state per animation frame, even after a throttled browser frame.
    const alreadyInFrame = this.inAnimationFrame;
    this.inAnimationFrame = true;
    try {
      if (deltaSeconds > 0 && this.session.phase === 'RUNNING' && !this.transition) this.advanceRoadStep(deltaSeconds);
    } finally {
      this.inAnimationFrame = alreadyInFrame;
      if (!alreadyInFrame && this.frameRenderPending) {
        this.frameRenderPending = false;
        this.renderRuntimeState();
      }
    }
  }

  private advanceRoadStep(deltaSeconds: number): void {
    if (this.session.phase !== 'RUNNING' || this.transition) return;
    if (this.viewMode === 'CHECKPOINT') { this.advanceCheckpointStep(deltaSeconds); return; }
    const previous = this.routeRun;
    this.routeRun = advanceRouteRun(previous, this.routeSegment, deltaSeconds * 1000);
    if (this.routeRun === previous) return;
    this.routeRenderer.advance(this.routeRun.elapsedMs - previous.elapsedMs,
      (previous.speed + this.routeRun.speed) / 2);
    this.speed = this.routeRun.speed;
    this.element.dataset.motion = this.routeRun.progress01 > .8 ? 'rushing' : 'cruising';
    this.element.style.setProperty('--route-rush-opacity', String(Math.max(0, (this.routeRun.progress01 - .55) * 1.2)));
    const start = this.routeIndex === 0 ? 0 : this.routeIndex === 5 ? .91
      : this.routeIndex === 4 ? .8 : this.stageBeats[this.routeIndex - 1]!.progress01;
    const end = this.routeIndex === 5 ? 1 : this.routeIndex === 4 ? .91
      : this.stageBeats[this.routeIndex]!.progress01;
    this.controller.advanceTo(start + (end - start) * this.routeRun.progress01);
    if (!this.routeRun.complete) return;
    if (this.routeSegment.checkpointKind === 'ARRIVAL') {
      if (!this.arrivalRequested) { this.arrivalRequested = true; this.controller.beginArrival(1); }
      return;
    }
    const checkpointId = this.routeSegment.nextCheckpointId;
    const beat = this.routeSegment.checkpointKind === 'FORK' ? this.stageBeats[3]
      : this.route.beats.find(candidate => candidate.campaignNodeIds.includes(checkpointId ?? '')
        && (this.routeSegment.checkpointKind !== 'BRANCH' || candidate.branchNodeId === checkpointId));
    if (!beat) throw new Error(`T0 checkpoint beat missing: ${checkpointId}`);
    this.checkpointBeat = beat;
    this.startTransition('focus', () => {
      this.viewMode = 'CHECKPOINT';
      this.element.dataset.view = 'checkpoint';
      this.checkpointElapsed = 0;
      this.checkpointEntries++;
      this.element.dataset.checkpointEntries = String(this.checkpointEntries);
      this.updateWorldTransforms();
      return Promise.all([this.worldRenderer.readyVisible(), this.foregroundRenderer.readyVisible()]).then(() => undefined);
    });
  }

  private advanceCheckpointStep(deltaSeconds: number): void {
    const beat = this.checkpointBeat;
    if (!beat) return;
    this.checkpointElapsed = Math.min(1.15, this.checkpointElapsed + deltaSeconds);
    this.speed = this.routeSegment.vMin * (1 - this.checkpointElapsed / 1.15);
    this.element.dataset.motion = 'decelerating';
    if (this.checkpointElapsed < 1.15) return;
    this.checkpointBeat = null;
    this.speed = 0;
    if (this.routeSegment.checkpointKind === 'FORK') {
      this.controller.approachNextStage(beat.progress01);
    } else if (this.routeSegment.checkpointKind === 'BRANCH') {
      this.controller.enterSelectedBranch(beat.branchNodeId!);
    } else if (beat.interactionPolicy === 'OPTIONAL_CONFIRM') {
      this.controller.pauseForDecision(beat.id);
      this.element.querySelector<HTMLButtonElement>('[data-traversal-confirm]')?.focus({ preventScroll: true });
    } else {
      this.controller.approachNextStage(beat.progress01);
    }
  }

  private startRoute(index: number): void {
    this.routeIndex = index;
    this.routeSegment = resolveT0RouteSegment(index, this.options.getState().run.traversalBranches?.T0);
    this.routeRun = createRouteRun(this.routeSegment, index, this.session.currentLane);
    this.viewMode = 'ROUTE';
    this.element.dataset.view = 'route';
    this.element.dataset.routeSegment = this.routeSegment.id;
    this.element.dataset.routeProgress = '0';
    this.element.style.setProperty('--route-rush-opacity', '0');
    this.checkpointBeat = null;
    this.checkpointElapsed = 0;
  }

  private advanceArrival(deltaSeconds: number): void {
    this.arrivalElapsed += deltaSeconds;
    this.element.style.setProperty('--arrival-fade', String(transitionEase((this.arrivalElapsed - 2.4) / TRAVERSAL_RHYTHM.fade)));
    if (this.arrivalElapsed >= 2.4 + TRAVERSAL_RHYTHM.fade + TRAVERSAL_RHYTHM.hold && this.arrivalRequested) {
      this.arrivalRequested = false;
      void this.options.onArrival(this.route.destinationNodeId);
    }
  }

  private async confirmDecision(): Promise<void> {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.confirming || this.transition) return;
    this.confirming = true;
    this.renderEventPanel();
    try {
      if (beat.campaignNodeIds.length) {
        this.controller.releaseDecision();
        if (beat.branchNodeId) this.controller.enterSelectedBranch(beat.branchNodeId);
        else this.controller.approachNextStage(beat.progress01);
      } else {
        if (classifyTraversalInteraction(beat) === 'LOCAL_MICRO_NARRATIVE' && this.options.onLocalNarrative) {
          this.controller.beginLocalInteraction();
          try {
            await new Promise<void>((resolve, reject) => {
              this.startTransition('event', () => {
                this.element.classList.add('traversal-t0--interrupted');
                this.renderRuntimeState();
                this.options.onLocalNarrative!(beat.id).then(resolve, reject);
              });
            });
            if (!this.opened) return;
            this.controller.consumeBeat(beat.id);
            this.controller.releaseDecision();
          } finally {
            this.element.classList.remove('traversal-t0--interrupted');
            if (this.opened) this.startTransition('return', undefined, true);
          }
        } else if (beat.roadCombatId && this.options.onRoadCombat) {
          this.controller.beginLocalInteraction();
          try {
            const victory = await new Promise<boolean>((resolve, reject) => {
              this.startTransition('event', () => {
                this.element.classList.add('traversal-t0--interrupted');
                this.options.onRoadCombat!(beat.roadCombatId!).then(resolve, reject);
              });
            });
            if (!this.opened) return;
            this.controller.consumeBeat(beat.id);
            this.controller.releaseDecision();
            const toast = this.element.querySelector<HTMLElement>('.traversal-toast');
            if (toast) { toast.textContent = victory ? 'La voie est libre · en route.' : 'La compagnie se replie et reprend la route.'; toast.classList.add('is-visible'); }
          } finally {
            this.element.classList.remove('traversal-t0--interrupted');
            if (this.opened) this.startTransition('return', undefined, true);
          }
        } else if (this.session.phase === 'LOCAL_INTERACTION') {
          this.startTransition('return', () => {
            this.controller.consumeBeat(beat.id);
            this.controller.releaseDecision();
          });
        } else {
          this.startTransition('event', () => this.controller.beginLocalInteraction());
        }
      }
    } finally {
      this.confirming = false;
      this.renderRuntimeState();
    }
  }

  private skipDecision(): void {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.session.phase !== 'DECISION' || beat.interactionPolicy !== 'OPTIONAL_CONFIRM'
      || !beat.campaignNodeIds.includes('lion-refugees') || this.confirming) return;
    if (this.transition) return;
    // The existing GameApp/RunSystem bypass authority accepts only an active road session.
    this.controller.releaseDecision();
    this.bypassCanonical(beat);
    this.controller.bypassBeat(beat.id);
    this.speed = 0;
    this.checkpointExits++;
    this.startTransition('return', () => { this.startRoute(3); this.updateWorldTransforms(); });
    this.renderRuntimeState();
  }

  private moveToLane(lane: TraversalLane): void {
    if (this.transition || this.viewMode !== 'ROUTE') return;
    const current = this.controller.session.currentLane;
    if (lane === current) return;
    this.controller.moveLane(lane < current ? -1 : 1);
    this.routeRun = setRouteLane(this.routeRun, lane);
    this.renderRuntimeState();
  }

  private renderRuntimeState(): void {
    if (this.inAnimationFrame) { this.frameRenderPending = true; return; }
    const session = this.controller.session;
    const hudVisible = this.opened && !this.element.classList.contains('traversal-t0--interrupted')
      && !['NODE_HANDOFF', 'NODE_RESOLUTION', 'COMPLETE'].includes(session.phase);
    if (hudVisible !== this.hudVisible) {
      this.hudVisible = hudVisible;
      if (hudVisible) this.options.statusHud?.show(this.element, 'traversal');
      else this.options.statusHud?.hide(this.element);
    }
    const forkIds = session.phase === 'FORK_OVERLAY' ? session.forkOptionIds
      : this.nextStage?.category === 'ROUTE_CHOICE' ? this.nextStage.campaignNodeIds : [];
    if (forkIds.length) this.worldRenderer.setDirections(this.options.getAvailableNodes()
      .filter(node => forkIds.includes(node.id)));
    this.element.style.setProperty('--traversal-lane-y', `${LANE_TOP_PERCENT[session.currentLane]}%`);
    this.element.querySelectorAll<HTMLElement>('[data-rail-stop]').forEach(stop => {
      const stopIndex = Number(stop.dataset.railStop);
      stop.dataset.complete = String(stopIndex <= this.routeIndex);
      stop.dataset.current = String(stopIndex === this.routeIndex + 1);
    });
    this.element.dataset.phase = session.phase;
    this.element.dataset.lane = String(session.currentLane);
    this.element.dataset.consumedBeats = String(session.consumedBeatIds.length);
    this.element.dataset.progress = String(session.routeProgress01);
    this.element.dataset.routeProgress = String(this.routeRun.progress01);
    this.element.dataset.routeSpeed = String(this.routeRun.speed);
    this.element.dataset.checkpointExits = String(this.checkpointExits);
    this.element.querySelectorAll<HTMLButtonElement>('[data-traversal-lane]').forEach((button) => {
      const active = Number(button.dataset.traversalLane) === session.currentLane;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.disabled = Boolean(this.transition) || session.phase !== 'RUNNING' || this.viewMode !== 'ROUTE';
    });
    const nextStage = this.nextStage;
    const next = this.element.querySelector<HTMLElement>('[data-traversal-next]');
    const distance = this.element.querySelector<HTMLElement>('[data-traversal-distance]');
    const nextLabel = this.routeSegment.checkpointKind === 'FORK' ? 'Choix d’itinéraire'
      : this.routeSegment.checkpointKind === 'ARRIVAL' ? this.route.destinationLabel
      : nextStage?.label ?? this.routeSegment.railLabel;
    const distanceLabel = `Route ${this.routeIndex + 1}/6 · ${Math.ceil((this.routeSegment.durationMs - this.routeRun.elapsedMs) / 1000)} s`;
    if (next && next.textContent !== nextLabel) next.textContent = nextLabel;
    if (distance && distance.textContent !== distanceLabel) distance.textContent = distanceLabel;
    this.renderEventPanel();
    this.updateWorldTransforms();
  }

  private renderEventPanel(): void {
    const session = this.controller.session;
    const beat = this.route.beats.find((candidate) => candidate.id === session.pendingBeatId);
    const panel = this.element.querySelector<HTMLElement>('[data-traversal-event-panel]');
    if (!panel) return;
    panel.hidden = !beat || !['DECISION', 'LOCAL_INTERACTION'].includes(session.phase)
      || this.transition?.kind === 'focus';
    if (!beat) return;
    const local = session.phase === 'LOCAL_INTERACTION';
    const paused = session.phase === 'DECISION' || local;
    const mandatory = beat.interactionPolicy === 'MANDATORY_CONFIRM';
    const actions = panel.querySelector<HTMLElement>('.traversal-event-panel__actions')!;
    actions.hidden = !paused;
    const confirm = panel.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!;
    const skip = panel.querySelector<HTMLButtonElement>('[data-traversal-skip]')!;
    confirm.textContent = beat.campaignNodeIds.includes('lion-refugees') ? 'Aider' : local ? 'Reprendre la route' : mandatory ? 'Continuer'
      : beat.category === 'OPTIONAL_COMBAT' ? 'Combattre' : 'Rencontrer';
    skip.textContent = beat.campaignNodeIds.includes('lion-refugees') ? 'Passer' : beat.category === 'OPTIONAL_COMBAT' ? 'Fuir' : 'Ignorer';
    confirm.disabled = this.confirming || Boolean(this.transition);
    skip.hidden = mandatory || local;
    skip.disabled = this.confirming || Boolean(this.transition);
    panel.dataset.interactionPolicy = beat.interactionPolicy;
    panel.dataset.category = beat.category;
    panel.dataset.grammar = classifyTraversalInteraction(beat);
    panel.dataset.placement = beat.placement.toLowerCase();
    panel.querySelector<HTMLElement>('[data-traversal-event-kind]')!.textContent = beat.type === 'fork' ? 'Choix d’itinéraire' : beat.interactionPolicy === 'MANDATORY_CONFIRM'
      ? 'Événement obligatoire'
      : beat.category === 'OPTIONAL_COMBAT' ? `Ennemis · ${laneLabel(beat.lane!).toLowerCase()}`
      : 'Rencontre facultative';
    panel.querySelector<HTMLElement>('[data-traversal-event-title]')!.textContent = beat.label;
    const localDescriptions: Partial<Record<TraversalRouteBeat['type'], string>> = {
      npc: 'Vous faites halte près de l’étal et examinez les provisions de la marchande.',
      enemy: 'Vous observez la meute depuis le véhicule. Les loups finissent par s’éloigner.',
      loot: 'Vous inspectez le coffre laissé au bord du chemin.',
      obstacle: 'Vous examinez le chariot brisé et repérez un passage autour des débris.',
      booster: 'Vous faites une courte halte près de la borne avant de repartir.',
    };
    panel.querySelector<HTMLElement>('[data-traversal-event-hint]')!.textContent = local
      ? localDescriptions[beat.type] ?? '' : paused
      ? mandatory ? 'Le passage est bloqué · continuez vers la rencontre.'
        : beat.category === 'OPTIONAL_COMBAT' ? 'Des ennemis occupent votre voie.'
        : beat.campaignNodeIds.includes('lion-refugees') ? 'Une mère et son enfant cherchent de l’aide sur la route.'
        : 'Faire halte auprès de ces voyageurs ou poursuivre la route.'
      : mandatory ? 'Passage obligé · arrêt avant la rencontre.' : 'Restez sur cette voie pour vous arrêter, ou changez de voie pour passer.';
    const marker = panel.querySelector<HTMLElement>('[data-traversal-event-marker]')!;
    if (beat.type === 'npc') marker.replaceChildren(createCampaignIcon('merchant'));
    else marker.textContent = markerGlyph(beat);
    const portrait = panel.querySelector<HTMLImageElement>('[data-traversal-event-portrait]')!;
    portrait.hidden = !beat.visualAsset;
    portrait.src = beat.visualAsset ?? '';
    portrait.classList.toggle('is-mirrored', Boolean(beat.mirrorX));
  }

  private updateWorldTransforms(forceWorld = false): void {
    const session = this.controller.session;
    const width = this.element.clientWidth || ROAD_SPACE.referenceWidth;
    // Read both viewport dimensions before any style writes to avoid forced layout.
    const height = this.element.clientHeight || 823;
    if (this.viewMode === 'ROUTE') this.routeRenderer.render();
    const vehicle = this.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    const exit = session.phase === 'ARRIVING' ? this.arrivalElapsed : 0;
    const exitDistance = exit * 160 + exit * exit * 150;
    const checkpointCamera = this.checkpointBeat
      ? roadCameraX(this.checkpointBeat.progress01) - 650 * (1 - this.checkpointElapsed / 1.15)
      : roadCameraX(session.routeProgress01);
    const camera = checkpointCamera + exitDistance * .25;
    if (this.viewMode === 'CHECKPOINT' || forceWorld) {
      const resolvedLocations = new Set(this.stageBeats.slice(0, session.stageIndex)
        .flatMap(beat => beat.locationId ? [beat.locationId] : []));
      this.worldRenderer.update(camera, width, this.presentedBranch, resolvedLocations);
      this.foregroundRenderer.update(camera, width);
      this.element.querySelector<HTMLElement>('.traversal-world__foreground')!.style.setProperty('--foreground-offset',
        `${roadWorldToScreen(0, camera, width) * ROAD_SPACE.foregroundFactor}px`);
    }
    const entryDistance = 600 + Number.parseFloat(this.element.style.getPropertyValue('--vehicle-entry-x') || '0');
    const drivenDistance = (this.viewMode === 'ROUTE' ? this.routeRenderer.distance : camera)
      + exitDistance + entryDistance * ROAD_SPACE.referenceWidth / width;
    // Mirrors --vehicle-height without forcing layout of the composite wheel subtree.
    const vehicleHeight = Math.min(height * .24, width * (width <= 1000 ? .16 : .14));
    vehicle.style.setProperty('--wheel-angle', `${caravanWheelAngle(drivenDistance, vehicleHeight, width)}rad`);
    const suspensionSpeed = session.phase === 'ARRIVING' ? 1
      : session.phase === 'RUNNING' ? Math.min(1, this.speed / this.routeSegment.vMax) : 0;
    vehicle.style.setProperty('--suspension-y', `${Math.sin(drivenDistance / TRAVERSAL_CARAVAN.suspension.wavelength) * TRAVERSAL_CARAVAN.suspension.amplitude * suspensionSpeed}px`);
    vehicle.style.setProperty('--dust-phase', String((drivenDistance % 130) / 130));
    vehicle.style.setProperty('--vehicle-exit-x', `${exitDistance * width / ROAD_SPACE.referenceWidth}px`);
    this.element.dataset.routeVariant = this.presentedBranch;
    this.element.dataset.assistedBypass = 'false';
    if (this.viewMode === 'CHECKPOINT' || forceWorld) this.route.beats.forEach((beat) => {
      const entity = this.entityElements.get(beat.id);
      if (!entity) return;
      const screenX = roadWorldToScreen(beatWorldX(beat.progress01), camera, width);
      entity.style.left = `${screenX}px`;
      entity.style.top = `${beat.type === 'fork' ? 57 : entity.dataset.roadside ? 61 : beat.placement === 'CENTERED' ? MANDATORY_TOP_PERCENT : LANE_TOP_PERCENT[beat.lane!]}%`;
      entity.style.zIndex = String(beat.placement === 'CENTERED' ? 20 : 14 + beat.lane! * 12);
      const ambientConsumed = session.consumedBeatIds.includes(beat.id);
      const collectionProgress = this.collectedAt.get(beat.id);
      const reacting = collectionProgress !== undefined && session.routeProgress01 - collectionProgress < .009;
      entity.classList.toggle('is-collected', reacting && beat.category === 'PICKUP');
      const bypassed = session.bypassedBeatIds.includes(beat.id);
      const stageIndex = this.stageBeats.findIndex((candidate) => candidate.id === beat.id);
      const stageConsumed = (stageIndex >= 0 && stageIndex < session.stageIndex)
        || Boolean(beat.branchNodeId && session.stageIndex >= this.stageBeats.length);
      const branchUnavailable = beat.branchNodeId && this.options.getState().run.traversalBranches?.T0 !== beat.branchNodeId;
      const previousRoad = this.presentedBranch !== 'main'
        && beat.progress01 <= this.stageBeats.find(stage => stage.type === 'fork')!.progress01;
      entity.classList.toggle('is-consumed', !bypassed && (ambientConsumed || stageConsumed));
      entity.style.opacity = '1';
      entity.classList.toggle('is-near', Math.abs(beat.progress01 - session.routeProgress01) < 0.035);
      entity.hidden = session.phase === 'ARRIVING' || previousRoad || Boolean(branchUnavailable) || screenX < -width * .24 || screenX > width * 1.24
        || (!reacting && !bypassed && (ambientConsumed || stageConsumed));
      const marker = this.markerElements.get(beat.id)!;
      marker.style.left = entity.style.left;
      marker.style.top = entity.style.top;
      marker.hidden = entity.hidden;
    });
  }

  private showContactToast(beat: TraversalRouteBeat, outcome: TraversalBeatCrossing): void {
    // Passing scenery needs no narration. The visible manoeuvre is the feedback.
    if (outcome === 'BYPASSED') return;
    const toast = this.element.querySelector<HTMLElement>('.traversal-toast');
    if (!toast) return;
    toast.textContent = outcome === 'TRIGGERED'
      ? `${beat.label} · interaction facultative déclenchée`
      : `${beat.label} · vous poursuivez votre route`;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
  }

  private showPickupFeedback(beat: TraversalRouteBeat): void {
    const feedback = this.element.querySelector<HTMLElement>('.traversal-pickup-feedback')!;
    const icon = document.createElement('span');
    icon.className = `traversal-pickup-feedback__icon traversal-pickup-feedback__icon--${beat.pickup}`;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = beat.pickup === 'gold' ? '✦' : beat.pickup === 'chest' ? '▣' : '◆';
    const amount = document.createElement('strong');
    amount.textContent = beat.pickup === 'gold' ? '+5' : '+1';
    const label = document.createElement('span');
    label.textContent = beat.pickup === 'gold' ? 'pièces' : beat.pickup === 'chest' ? 'provision' : 'garde';
    feedback.replaceChildren(icon, amount, label);
    feedback.dataset.pickup = beat.pickup;
    feedback.classList.remove('is-visible');
    void feedback.offsetWidth;
    feedback.classList.add('is-visible');
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.opened || event.defaultPrevented) return;
    if (this.transition && event.key !== 'Escape') {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(event.key)) event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      event.preventDefault();
      this.moveToLane(0);
      return;
    }
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.moveToLane(1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.options.onMenu();
    }
  };
}
