import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { GameState, RunNode } from '../game/types';
import { selectTraversalBranch } from '../game/runSystem';
import type { CampaignStatusHud } from '../ui/CampaignStatusHud';
import { createCampaignIcon, decorateCampaignButton, decorateCampaignFrame } from '../ui/design-system/CampaignUi';
import { classifyTraversalInteraction } from './TraversalInteractionGrammar';
import { ROAD_SPACE, beatWorldX, beatPassedProgress, roadCameraX, roadWorldToScreen } from './TraversalRoadSpace';
import { createTraversalSprite } from './TraversalSprite';
import { TraversalWorldRenderer } from './TraversalWorldRenderer';
import { buildTraversalCaravan, caravanWheelAngle, TRAVERSAL_CARAVAN } from './TraversalCaravan';
import { setTraversalDepth, TraversalForegroundRenderer } from './TraversalDepth';
import { T0_ROAD_AUTHORING } from './TraversalT0Authoring';
import { traversalLocation } from './TraversalT0World';
import { resolveCharacterVisualProfile, resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import {
  resolveTraversalBeatCrossing,
  type TraversalBeatCrossing,
  type TraversalRouteBeat,
  type TraversalT0Route,
} from './TraversalT0Route';
import { TraversalRunController } from './TraversalRunController';
import { TRAVERSAL_RHYTHM, transitionEase } from './TraversalTransition';
import { traversalContactProgress } from './TraversalT0Route';
import { traversalRouteProgressBounds } from './TraversalRouteModel';
import { auditTraversalRouteAuthoring } from './TraversalCheckpointRoute';
import type { TraversalLane, TraversalRunSession } from './TraversalRunRuntime';
import { advanceRouteRun, createRouteRun, forecastRouteDistance, resetRouteSpeed,
  routeSpeedRecovery01, setRouteLane, type TraversalRouteRunState } from './TraversalRouteRun';
import type { T0RouteSegment } from './TraversalT0CheckpointRoute';
import { TraversalRouteRenderer } from './TraversalRouteRenderer';
import { createRouteRisk, resolveRouteRisk, type TraversalRouteRiskState } from './TraversalRouteRisk';
import { TraversalRouteRiskRenderer } from './TraversalRouteRiskRenderer';
import { resolveTraversalRiskEnabled } from './TraversalRiskPresentationPolicy';
import { createRouteReward, resolveRouteReward, type TraversalRouteRewardState } from './TraversalRouteReward';
import { TraversalRouteRewardRenderer } from './TraversalRouteRewardRenderer';
import { resolveTraversalRewardEnabled } from './TraversalRewardPresentationPolicy';
import { createRoutePursuit, pursuerLaneAt, resolveRoutePursuit,
  type TraversalRoutePursuitState, type TraversalRoutePursuitOutcome } from './TraversalRoutePursuit';
import { TraversalRoutePursuitRenderer } from './TraversalRoutePursuitRenderer';
import { resolveTraversalPursuitEnabled } from './TraversalPursuitPresentationPolicy';

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
  readonly statusHud?: CampaignStatusHud;
  readonly onRouteRewardPickup?: (reward: { readonly id: string; readonly gold: number }) => boolean;
  readonly onOptionalIgnore?: (nodeId: string) => { accepted: boolean; feedback?: string };
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
    case 'fork': return '↗';
  }
}

function markerLabel(beat: TraversalRouteBeat): string {
  switch (beat.marker) {
    case 'danger': return 'Danger';
    case 'speech': return 'Rencontre';
    case 'fork': return 'Carrefour';
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
  private readonly worldRenderer = new TraversalWorldRenderer(T0_ROAD_AUTHORING.world);
  private readonly routeRenderer = new TraversalRouteRenderer();
  private readonly riskEnabled = resolveTraversalRiskEnabled({
    dev: import.meta.env.DEV, search: window.location.search,
  });
  private readonly riskQa = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('qa') === '1';
  private readonly riskRenderer = this.riskEnabled ? new TraversalRouteRiskRenderer() : null;
  private readonly rewardEnabled = resolveTraversalRewardEnabled({
    dev: import.meta.env.DEV, search: window.location.search,
  });
  private readonly rewardRenderer = this.rewardEnabled ? new TraversalRouteRewardRenderer() : null;
  private readonly pursuitEnabled = resolveTraversalPursuitEnabled({
    dev: import.meta.env.DEV, search: window.location.search,
  });
  private readonly pursuitRenderer = this.pursuitEnabled ? new TraversalRoutePursuitRenderer() : null;
  private readonly pursuitQaEvents: TraversalRoutePursuitOutcome[] = [];
  private readonly foregroundRenderer = new TraversalForegroundRenderer(T0_ROAD_AUTHORING.occluders);
  private readonly stageBeats: readonly TraversalRouteBeat[];
  private frameId: number | null = null;
  private previousFrameMs = 0;
  private opened = false;
  private arrivalRequested = false;
  private arrivalElapsed = 0;
  private arrivalVisualSpeed = 0;
  private arrivalExitDistance = 0;
  private confirming = false;
  private assistedUntil = 0;
  private readonly declinedBeats = new Set<string>();
  private speed = 0;
  private focusStartSpeed = 0;
  private approachElapsed: number | null = null;
  private departure: { kind: 'return' | 'fork'; elapsed: number; distance: number;
    midpoint: () => void | Promise<void> } | null = null;
  private transition: { kind: string; elapsed: number; midpoint?: () => void | Promise<void>;
    reveal: boolean; waitingForReady: boolean; blackHoldRemaining: number } | null = null;
  private presentedBranch = 'main';
  private inAnimationFrame = false;
  private frameRenderPending = false;
  private hudVisible = false;
  private routeIndex = 0;
  private routeSegment: T0RouteSegment = T0_ROAD_AUTHORING.resolveSegment(0);
  private routeRun: TraversalRouteRunState = createRouteRun(this.routeSegment, 0);
  private routeRisk: TraversalRouteRiskState = createRouteRisk(this.routeSegment.id);
  private routeReward: TraversalRouteRewardState = createRouteReward(this.routeSegment.id);
  private routePursuit: TraversalRoutePursuitState = createRoutePursuit(this.routeSegment.id);
  private lastRiskSpeedBefore: number | null = null;
  private lastRiskSpeedAfter: number | null = null;
  private lastPursuitSpeedBefore: number | null = null;
  private lastPursuitSpeedAfter: number | null = null;
  private lastPursuitCatchElapsed: number | null = null;
  private lastPursuitCatchProgress: number | null = null;
  private viewMode: 'ROUTE' | 'CHECKPOINT' = 'ROUTE';
  private checkpointBeat: TraversalRouteBeat | null = null;
  private checkpointElapsed = 0;
  private checkpointEntries = 0;
  private checkpointExits = 0;

  constructor(private readonly options: TraversalT0SceneOptions) {
    if (options.leg.id !== 'T0') throw new Error('TraversalT0Scene only accepts the canonical T0 leg.');
    const state = options.getState();
    this.route = T0_ROAD_AUTHORING.resolveRoute(options.leg, state);
    const routeIssues = auditTraversalRouteAuthoring(options.leg, this.route, T0_ROAD_AUTHORING.routeSegments,
      new Set(T0_ROAD_AUTHORING.world.checkpointSections.map(section => section.id)));
    if (routeIssues.length) throw new Error(routeIssues.map(issue => issue.detail).join('\n'));
    this.stageBeats = this.route.beats.filter((beat) => beat.campaignNodeIds.length > 0 && !beat.branchNodeId);
    this.controller = new TraversalRunController({
      leg: options.leg,
      getAvailableNodes: options.getAvailableNodes,
      onBranchSelect: nodeId => new Promise<boolean>(resolve => {
        this.beginCheckpointDeparture('fork', () => {
          if (!selectTraversalBranch(options.getState().run, options.leg.id, nodeId)) { resolve(false); return; }
          const current = options.getState();
          this.route = T0_ROAD_AUTHORING.resolveRoute(options.leg, current);
          const entities = this.element.querySelector<HTMLElement>('.traversal-world__entities')!;
          for (const beat of this.route.beats.filter(candidate => candidate.branchNodeId)) {
            this.entityElements.get(beat.id)?.remove();
            this.markerElements.get(beat.id)?.remove();
            this.buildEntity(entities, beat);
          }
          this.presentedBranch = current.run.traversalBranches![options.leg.id]!;
          this.checkpointExits++;
          this.startRoute(this.options.leg.stages.length);
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
    this.element.dataset.traversalLeg = options.leg.id;
    this.element.dataset.singleRoad = 'false';
    this.element.dataset.view = 'route';
    this.element.dataset.routeSegment = 'route-1';
    this.element.dataset.routeWorld = 'shared';
    this.element.dataset.laneCount = '2';
    if (this.riskQa) this.element.dataset.riskEnabled = this.riskEnabled ? 'dev' : 'off';
    if (this.rewardEnabled && this.riskQa) this.element.dataset.rewardEnabled = 'dev';
    if (this.pursuitEnabled && this.riskQa) this.element.dataset.pursuitEnabled = 'dev';
    this.element.setAttribute('aria-label', `Traversée de ${this.route.originLabel} vers ${this.route.destinationLabel}`);
    this.build();
    this.worldRenderer.setDirections(state.run.graph.nodes.filter(node =>
      options.leg.stages.find(stage => stage.mode === 'IN_TRAVERSAL_FORK')?.nodeIds.includes(node.id)));
  }

  get session(): TraversalRunSession { return this.controller.session; }
  get activeNodeId(): string | null { return this.controller.session.activeNodeId; }

  private get nextStage(): TraversalRouteBeat | undefined {
    const stage = this.stageBeats[this.session.stageIndex];
    const branch = this.options.getState().run.traversalBranches?.[this.options.leg.id];
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
    // GameApp already covers the return from canonical content. Mount the next Route
    // under that cover so its reveal is the only return transition.
    this.transition = null;
    delete this.element.dataset.transition;
    this.element.style.setProperty('--transition-opacity', '0');
    this.startRoute(this.controller.session.stageIndex === this.options.leg.stages.length
      ? 5 : this.controller.session.stageIndex);
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
        <div class="traversal-route-rail" aria-label="Étapes de Traversal">${['Départ', ...T0_ROAD_AUTHORING.routeSegments.map(route => route.railLabel)].map((label, index) => `<span class="traversal-route-rail__stop" data-rail-stop="${index}" data-kind="${T0_ROAD_AUTHORING.routeSegments[index - 1]?.checkpointKind === 'FORK' ? 'fork' : 'checkpoint'}" title="${label}"><span>${T0_ROAD_AUTHORING.routeSegments[index - 1]?.checkpointKind === 'FORK' ? '◇' : T0_ROAD_AUTHORING.routeSegments[index - 1]?.checkpointKind === 'ARRIVAL' ? '◎' : '•'}</span></span>`).join('')}</div>
        <div class="traversal-hud__destination-icon"></div><div class="traversal-hud__destination-copy"><p class="campaign-ui-type--eyebrow">Prochain arrêt</p><strong class="campaign-ui-type--compact-title" data-traversal-next>${escapeHtml(this.route.destinationLabel)}</strong><span class="campaign-ui-type--metadata" data-traversal-distance>${this.route.distanceKm.toFixed(1)} km</span></div>
      </aside>
      <nav class="traversal-lanes" aria-label="Changer de trajectoire">
        ${([0, 1] as const).map((lane) => `<button type="button" data-traversal-lane="${lane}" aria-label="${lane === 0 ? 'Monter' : 'Descendre'}"><span aria-hidden="true">${lane === 0 ? '▲' : '▼'}</span></button>`).join('')}
      </nav>
      <div class="traversal-toast" role="status" aria-live="polite"></div>
    `;
    const destination = this.element.querySelector<HTMLElement>('.traversal-hud--progress')!;
    destination.querySelector('.traversal-hud__destination-icon')!.append(createCampaignIcon('destination'));
    decorateCampaignFrame(destination, 'compact');
    const eventPanel = this.element.querySelector<HTMLElement>('[data-traversal-event-panel]')!;
    decorateCampaignFrame(eventPanel, 'standard');
    decorateCampaignButton(eventPanel.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!, 'primary');
    decorateCampaignButton(eventPanel.querySelector<HTMLButtonElement>('[data-traversal-skip]')!, 'secondary');
    this.element.querySelector('.traversal-world__road')!.append(this.worldRenderer.element);
    this.element.querySelector('.traversal-world__road')!.append(this.worldRenderer.routeElement);
    this.element.querySelector('.traversal-world__road')!.append(this.routeRenderer.element);
    if (this.riskRenderer) this.element.querySelector('.traversal-world__actors')!.append(this.riskRenderer.element);
    if (this.rewardRenderer) this.element.querySelector('.traversal-world__actors')!.append(this.rewardRenderer.element);
    if (this.pursuitRenderer) this.element.querySelector('.traversal-world__actors')!.append(this.pursuitRenderer.element);
    this.element.querySelector('.traversal-world')!.append(this.foregroundRenderer.element);
    for (const [selector, plane] of [
      ['.traversal-world__road', 'road-world'], ['.traversal-world__actors', 'road-actors'],
      ['.traversal-world__foreground', 'foreground-extreme'], ['.traversal-world__markers', 'markers'],
      ['.traversal-hud,.traversal-lanes,.traversal-event-panel,.traversal-toast', 'ui'],
    ] as const) this.element.querySelectorAll<HTMLElement>(selector).forEach(element => setTraversalDepth(element, plane));
    this.element.style.setProperty('--traversal-foreground-image', `url("${T0_ROAD_AUTHORING.foregroundLayerAsset}")`);
    const vehicle = this.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    buildTraversalCaravan(vehicle);
    this.riskRenderer?.bindVehicle(vehicle);
    this.riskRenderer?.reset(T0_ROAD_AUTHORING.hazards(this.routeSegment.id));
    this.rewardRenderer?.reset(T0_ROAD_AUTHORING.pickups(this.routeSegment.id));
    this.pursuitRenderer?.reset();
    const entities = this.element.querySelector<HTMLElement>('.traversal-world__entities')!;
    for (const beat of this.route.beats) this.buildEntity(entities, beat);
  }

  private buildEntity(entities: HTMLElement, beat: TraversalRouteBeat): void {
    const entity = document.createElement('article');
    entity.className = `traversal-actor-anchor traversal-entity traversal-entity--${beat.type}`;
    entity.dataset.traversalBeat = beat.id;
    entity.dataset.marker = beat.marker;
    entity.dataset.category = beat.category;
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
    if (beat.type === 'fork') {
      // Its sign belongs to the persistent junction; only the interaction marker is a beat.
      body.classList.add('traversal-entity__body--location');
    } else if (beat.visualAsset) {
      const image = createTraversalSprite(beat.visualAsset, 'traversal-entity__subject', beat.mirrorX);
      image.dataset.facing = 'left';
      image.classList.toggle('is-mirrored', Boolean(beat.mirrorX));
      body.append(image);
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
    const wasArriving = this.controller.session.phase === 'ARRIVING';
    if (this.transition && !document.hidden) this.advanceTransition(deltaSeconds);
    else if (this.departure && !document.hidden) this.advanceCheckpointDeparture(deltaSeconds);
    else if (this.controller.session.phase === 'RUNNING' && !document.hidden) this.advance(deltaSeconds);
    if (wasArriving && !document.hidden) this.advanceArrival(deltaSeconds);
    this.inAnimationFrame = false;
    if (this.frameRenderPending) {
      this.frameRenderPending = false;
      this.renderRuntimeState();
    } else this.updateWorldTransforms();
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  private startTransition(kind: string, midpoint?: () => void | Promise<void>, reveal = false): void {
    if (kind === 'focus') this.focusStartSpeed = this.speed;
    if (kind === 'focus') this.riskRenderer?.clearImpact();
    this.transition = { kind, midpoint, elapsed: 0, reveal, waitingForReady: false, blackHoldRemaining: 0 };
    if (kind === 'entry') this.element.style.setProperty('--vehicle-entry-x', '-600px');
    this.element.dataset.transition = kind;
    this.element.style.setProperty('--transition-opacity', reveal ? '1' : '0');
    this.renderRuntimeState();
    if (reveal && this.viewMode === 'ROUTE') {
      const transition = this.transition;
      transition.waitingForReady = true;
      void Promise.all([this.routeRenderer.ready, this.worldRenderer.readyRouteVisible(),
        this.foregroundRenderer.readyVisible()]).then(() => {
        if (this.transition === transition) transition.waitingForReady = false;
      }, error => {
        console.error('[Traversal] Shared route art did not decode.', error);
        if (this.transition === transition) transition.waitingForReady = false;
      });
    }
  }

  private advanceTransition(seconds: number): void {
    const transition = this.transition;
    if (!transition) return;
    if (transition.kind === 'focus' && this.viewMode === 'ROUTE') {
      const braking = 1 - transitionEase(transition.elapsed / TRAVERSAL_RHYTHM.fade);
      const visualSpeed = this.focusStartSpeed * braking;
      const visibleSeconds = Math.max(0, Math.min(seconds, TRAVERSAL_RHYTHM.fade - transition.elapsed));
      this.routeRenderer.advance(visibleSeconds * 1000, visualSpeed);
      this.speed = visualSpeed;
      this.element.style.setProperty('--route-rush-opacity', String(Math.max(0,
        (this.routeRun.progress01 - .55) * 1.2 * braking)));
      this.element.dataset.motion = 'decelerating';
    }
    if (this.departure && this.viewMode === 'CHECKPOINT') {
      const visibleSeconds = Math.max(0, Math.min(seconds,
        TRAVERSAL_RHYTHM.hold + TRAVERSAL_RHYTHM.fade - transition.elapsed));
      this.advanceDepartureMotion(visibleSeconds);
    }
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
      if (this.departure) this.finishCheckpointDeparture();
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
      if (this.session.phase !== 'ARRIVING') this.speed = 0;
    }
  }

  private advance(deltaSeconds: number): void {
    // Both the pure route clock and the authored checkpoint approach clamp their own bounds.
    // Present one state per animation frame, even after a throttled browser frame.
    const alreadyInFrame = this.inAnimationFrame;
    this.inAnimationFrame = true;
    try {
      if (deltaSeconds > 0 && this.departure && !this.transition) this.advanceCheckpointDeparture(deltaSeconds);
      else if (deltaSeconds > 0 && this.session.phase === 'RUNNING' && !this.transition) this.advanceRoadStep(deltaSeconds);
    } finally {
      this.inAnimationFrame = alreadyInFrame;
      if (!alreadyInFrame && this.frameRenderPending) {
        this.frameRenderPending = false;
        this.renderRuntimeState();
      } else if (!alreadyInFrame) this.updateWorldTransforms();
    }
  }

  private advanceRoadStep(deltaSeconds: number): void {
    if (this.session.phase !== 'RUNNING' || this.transition) return;
    if (this.approachElapsed !== null) { this.advanceRouteApproach(deltaSeconds); return; }
    if (this.viewMode === 'CHECKPOINT') { this.advanceCheckpointStep(deltaSeconds); return; }
    const previous = this.routeRun;
    this.routeRun = advanceRouteRun(previous, this.routeSegment, deltaSeconds * 1000);
    if (this.routeRun === previous) return;
    const restart = transitionEase(this.routeRun.elapsedMs / (TRAVERSAL_RHYTHM.restart * 1000));
    this.routeRenderer.advance(this.routeRun.elapsedMs - previous.elapsedMs,
      (previous.speed + this.routeRun.speed) / 2 * restart);
    const activeDriving = !this.routeRun.complete && !this.departure
      && !document.body.classList.contains('scene-transition--locked');
    if (this.rewardEnabled) {
      const resolved = resolveRouteReward(this.routeReward, T0_ROAD_AUTHORING.pickups(this.routeSegment.id),
        previous.progress01, this.routeRun.progress01, this.routeRun.lane, activeDriving);
      this.routeReward = resolved.state;
      for (const outcome of resolved.outcomes) {
        if (outcome.result !== 'COLLECTED') continue;
        if (this.options.onRouteRewardPickup?.({ id: outcome.pickup.id, gold: outcome.pickup.gold })) {
          this.rewardRenderer?.collect(outcome.pickup, this.routeRun.elapsedMs);
        }
      }
    }
    let collisionsThisStep = 0;
    if (this.riskEnabled) {
      const resolved = resolveRouteRisk(this.routeRisk, T0_ROAD_AUTHORING.hazards(this.routeSegment.id),
        previous.progress01, this.routeRun.progress01, this.routeRun.lane, activeDriving);
      this.routeRisk = resolved.state;
      for (const outcome of resolved.outcomes) {
        if (outcome.result !== 'COLLISION') continue;
        collisionsThisStep++;
        this.lastRiskSpeedBefore = this.routeRun.speed;
        this.routeRun = resetRouteSpeed(this.routeRun, this.routeSegment);
        this.lastRiskSpeedAfter = this.routeRun.speed;
        this.riskRenderer?.impact(outcome.hazard, this.routeRun.elapsedMs);
        this.riskRenderer?.reforecastUnseen(this.routeRenderer.distance, this.element.clientWidth || ROAD_SPACE.referenceWidth);
        this.rewardRenderer?.reforecastUnseen(this.routeRenderer.distance, this.element.clientWidth || ROAD_SPACE.referenceWidth);
      }
    }
    if (this.pursuitEnabled) {
      const window = T0_ROAD_AUTHORING.pursuitWindow(this.routeSegment.id);
      const resolved = resolveRoutePursuit(this.routePursuit, window,
        previous.progress01, this.routeRun.progress01, this.routeRun.lane,
        this.routeRun.elapsedMs - previous.elapsedMs, collisionsThisStep, activeDriving);
      this.routePursuit = resolved.state;
      for (const outcome of resolved.outcomes) {
        if (this.riskQa) this.pursuitQaEvents.push(outcome);
        if (outcome.result === 'CAUGHT') {
          const lane = window ? pursuerLaneAt(window, this.routeRun.progress01) : this.routeRun.lane;
          this.lastPursuitSpeedBefore = collisionsThisStep ? this.lastRiskSpeedBefore : this.routeRun.speed;
          if (!collisionsThisStep) {
            this.routeRun = resetRouteSpeed(this.routeRun, this.routeSegment);
            this.riskRenderer?.reforecastUnseen(this.routeRenderer.distance, this.element.clientWidth || ROAD_SPACE.referenceWidth);
            this.rewardRenderer?.reforecastUnseen(this.routeRenderer.distance, this.element.clientWidth || ROAD_SPACE.referenceWidth);
          }
          this.lastPursuitSpeedAfter = this.routeRun.speed;
          this.lastPursuitCatchElapsed = this.routeRun.elapsedMs;
          this.lastPursuitCatchProgress = this.routeRun.progress01;
          this.pursuitRenderer?.caught(lane, this.routeRun.elapsedMs);
        } else if (outcome.result === 'ESCAPED' && window) {
          this.pursuitRenderer?.escaped(pursuerLaneAt(window, window.endProgress01),
            outcome.pressure01, this.routeRun.elapsedMs);
        }
      }
    }
    this.speed = this.routeRun.speed * restart;
    this.element.dataset.motion = this.routeRun.progress01 > .8 ? 'rushing' : 'cruising';
    this.element.style.setProperty('--route-rush-opacity', String(Math.max(0, (this.routeRun.progress01 - .55) * 1.2)));
    const { start, end } = traversalRouteProgressBounds(this.route, this.routeIndex);
    this.controller.advanceTo(start + (end - start) * this.routeRun.progress01);
    if (!this.routeRun.complete) return;
    if (this.routeSegment.checkpointKind === 'ARRIVAL') {
      if (!this.arrivalRequested) {
        this.riskRenderer?.clearImpact();
        this.arrivalRequested = true;
        this.arrivalVisualSpeed = this.speed;
        this.arrivalElapsed = 0;
        this.arrivalExitDistance = 0;
        this.controller.beginArrival(1);
      }
      return;
    }
    const checkpointId = this.routeSegment.nextCheckpointId;
    const beat = this.routeSegment.checkpointKind === 'FORK' ? this.stageBeats.find(candidate => candidate.type === 'fork')
      : this.route.beats.find(candidate => candidate.campaignNodeIds.includes(checkpointId ?? '')
        && (this.routeSegment.checkpointKind !== 'BRANCH' || candidate.branchNodeId === checkpointId));
    if (!beat) throw new Error(`T0 checkpoint beat missing: ${checkpointId}`);
    this.checkpointBeat = beat;
    this.approachElapsed = 0;
    this.element.dataset.presentation = 'checkpoint-approach';
    this.renderRuntimeState();
  }

  private advanceRouteApproach(seconds: number): void {
    const elapsed = this.approachElapsed;
    if (elapsed === null) return;
    const duration = .28;
    const next = Math.min(duration, elapsed + seconds);
    const speed = this.routeRun.speed * (1 - .42 * transitionEase(next / duration));
    this.routeRenderer.advance((next - elapsed) * 1000, (this.speed + speed) / 2);
    this.speed = speed;
    this.approachElapsed = next;
    this.element.dataset.motion = 'decelerating';
    this.element.style.setProperty('--route-rush-opacity', String(Math.max(0,
      (this.routeRun.progress01 - .55) * 1.2 * (speed / this.routeRun.speed))));
    if (next < duration) return;
    this.approachElapsed = null;
    delete this.element.dataset.presentation;
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

  private beginCheckpointDeparture(kind: 'return' | 'fork', midpoint: () => void | Promise<void>): void {
    if (this.departure) return;
    this.transition = null;
    delete this.element.dataset.transition;
    this.element.style.setProperty('--transition-opacity', '0');
    this.departure = { kind, midpoint, elapsed: 0, distance: 0 };
    this.element.dataset.departure = kind;
    this.element.dataset.presentation = 'checkpoint-departure';
    this.element.dataset.motion = 'departing';
    this.speed = this.routeSegment.vMin * .48;
    this.renderRuntimeState();
  }

  private advanceDepartureMotion(seconds: number): void {
    const departure = this.departure;
    if (!departure || seconds <= 0) return;
    const previousSpeed = this.speed;
    departure.elapsed += seconds;
    this.speed = this.routeSegment.vMin * (.48 + .75 * transitionEase(departure.elapsed / .55));
    departure.distance += (previousSpeed + this.speed) / 2 * seconds * 1000 * .28;
  }

  private advanceCheckpointDeparture(seconds: number): void {
    const departure = this.departure;
    if (!departure) return;
    const visible = Math.min(seconds, Math.max(0, .28 - departure.elapsed));
    this.advanceDepartureMotion(visible);
    if (departure.elapsed < .28) return;
    this.startTransition(departure.kind, departure.midpoint);
  }

  private finishCheckpointDeparture(): void {
    this.departure = null;
    delete this.element.dataset.departure;
    delete this.element.dataset.presentation;
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
    this.routeSegment = T0_ROAD_AUTHORING.resolveSegment(index,
      this.options.getState().run.traversalBranches?.[this.options.leg.id]);
    this.routeRun = createRouteRun(this.routeSegment, index, this.session.currentLane);
    this.routeRisk = createRouteRisk(this.routeSegment.id);
    this.routeReward = createRouteReward(this.routeSegment.id);
    this.routePursuit = createRoutePursuit(this.routeSegment.id);
    this.lastRiskSpeedBefore = null;
    this.lastRiskSpeedAfter = null;
    this.lastPursuitSpeedBefore = null;
    this.lastPursuitSpeedAfter = null;
    this.lastPursuitCatchElapsed = null;
    this.lastPursuitCatchProgress = null;
    this.riskRenderer?.reset(T0_ROAD_AUTHORING.hazards(this.routeSegment.id));
    this.rewardRenderer?.reset(T0_ROAD_AUTHORING.pickups(this.routeSegment.id));
    this.pursuitRenderer?.reset();
    if (this.pursuitEnabled && this.riskQa) {
      this.element.dataset.pursuitWindow = '';
      this.element.dataset.pursuitPressure = '0';
      this.element.dataset.pursuitLane = '';
      this.element.dataset.pursuitCaughtCount = '0';
      this.element.dataset.pursuitResolved = '[]';
    }
    this.viewMode = 'ROUTE';
    this.element.dataset.view = 'route';
    this.element.dataset.routeSegment = this.routeSegment.id;
    this.element.dataset.routeWorld = 'shared';
    this.element.dataset.routeProgress = '0';
    this.element.style.setProperty('--route-rush-opacity', '0');
    this.checkpointBeat = null;
    this.checkpointElapsed = 0;
    this.speed = 0;
  }

  private advanceArrival(deltaSeconds: number): void {
    const prior = this.arrivalElapsed;
    this.arrivalElapsed += deltaSeconds;
    const coast = (time: number): number => time <= .35 ? 1 - .06 * transitionEase(time / .35)
      : time < 2.05 ? .94 * (1 - transitionEase((time - .35) / 1.7)) : 0;
    const nextSpeed = this.arrivalVisualSpeed * coast(this.arrivalElapsed);
    this.routeRenderer.advance(deltaSeconds * 1000, this.arrivalVisualSpeed *
      (coast(prior) + coast(this.arrivalElapsed)) / 2);
    this.speed = nextSpeed;
    this.arrivalExitDistance += deltaSeconds * 1000 * this.arrivalVisualSpeed *
      (coast(prior) + coast(this.arrivalElapsed)) / 2 * .28 * 1.15;
    this.element.dataset.presentation = 'final-arrival-coast';
    this.element.style.setProperty('--arrival-fade', String(transitionEase((this.arrivalElapsed - 2.4) / TRAVERSAL_RHYTHM.fade)));
    if (this.arrivalElapsed >= 2.4 + TRAVERSAL_RHYTHM.fade + TRAVERSAL_RHYTHM.hold && this.arrivalRequested) {
      this.arrivalRequested = false;
      void this.options.onArrival(this.route.destinationNodeId);
    }
  }

  private confirmDecision(): void {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.confirming || this.transition || this.departure) return;
    if (!beat.campaignNodeIds.length) throw new Error(`T0 beat has no campaign node: ${beat.id}`);
    this.confirming = true;
    this.renderEventPanel();
    try {
      this.controller.releaseDecision();
      if (beat.branchNodeId) this.controller.enterSelectedBranch(beat.branchNodeId);
      else this.controller.approachNextStage(beat.progress01);
    } finally {
      this.confirming = false;
      this.renderRuntimeState();
    }
  }

  private skipDecision(): void {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.session.phase !== 'DECISION' || beat.interactionPolicy !== 'OPTIONAL_CONFIRM'
      || !beat.campaignNodeIds.includes('lion-refugees') || this.confirming) return;
    if (this.transition || this.departure) return;
    // The existing GameApp/RunSystem bypass authority accepts only an active road session.
    this.controller.releaseDecision();
    this.bypassCanonical(beat);
    this.controller.bypassBeat(beat.id);
    this.checkpointExits++;
    this.beginCheckpointDeparture('return', () => { this.startRoute(this.options.leg.stages.length - 1); this.updateWorldTransforms(); });
    this.renderRuntimeState();
  }

  private moveToLane(lane: TraversalLane): void {
    if (this.transition || this.departure || this.approachElapsed !== null
      || document.body.classList.contains('scene-transition--locked') || this.viewMode !== 'ROUTE'
      || this.session.phase !== 'RUNNING' || this.routeRun.complete) return;
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
      button.disabled = Boolean(this.transition || this.departure || this.approachElapsed !== null)
        || session.phase !== 'RUNNING' || this.viewMode !== 'ROUTE';
    });
    const nextStage = this.nextStage;
    const next = this.element.querySelector<HTMLElement>('[data-traversal-next]');
    const distance = this.element.querySelector<HTMLElement>('[data-traversal-distance]');
    const nextLabel = this.routeSegment.checkpointKind === 'FORK' ? 'Choix d’itinéraire'
      : this.routeSegment.checkpointKind === 'ARRIVAL' ? this.route.destinationLabel
      : nextStage?.label ?? this.routeSegment.railLabel;
    const distanceLabel = `Route ${this.routeIndex + 1}/${T0_ROAD_AUTHORING.routeSegments.length} · ${Math.ceil((this.routeSegment.durationMs - this.routeRun.elapsedMs) / 1000)} s`;
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
    panel.hidden = !beat || session.phase !== 'DECISION'
      || this.transition?.kind === 'focus' || Boolean(this.departure);
    if (!beat) return;
    const mandatory = beat.interactionPolicy === 'MANDATORY_CONFIRM';
    const actions = panel.querySelector<HTMLElement>('.traversal-event-panel__actions')!;
    actions.hidden = false;
    const confirm = panel.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!;
    const skip = panel.querySelector<HTMLButtonElement>('[data-traversal-skip]')!;
    confirm.textContent = beat.campaignNodeIds.includes('lion-refugees') ? 'Aider' : mandatory ? 'Continuer'
      : beat.category === 'OPTIONAL_COMBAT' ? 'Combattre' : 'Rencontrer';
    skip.textContent = beat.campaignNodeIds.includes('lion-refugees') ? 'Passer' : beat.category === 'OPTIONAL_COMBAT' ? 'Fuir' : 'Ignorer';
    confirm.disabled = this.confirming || Boolean(this.transition || this.departure);
    skip.hidden = mandatory;
    skip.disabled = this.confirming || Boolean(this.transition || this.departure);
    panel.dataset.interactionPolicy = beat.interactionPolicy;
    panel.dataset.category = beat.category;
    panel.dataset.grammar = classifyTraversalInteraction(beat);
    panel.dataset.placement = beat.placement.toLowerCase();
    panel.querySelector<HTMLElement>('[data-traversal-event-kind]')!.textContent = beat.type === 'fork' ? 'Choix d’itinéraire' : beat.interactionPolicy === 'MANDATORY_CONFIRM'
      ? 'Événement obligatoire'
      : beat.category === 'OPTIONAL_COMBAT' ? `Ennemis · ${laneLabel(beat.lane!).toLowerCase()}`
      : 'Rencontre facultative';
    panel.querySelector<HTMLElement>('[data-traversal-event-title]')!.textContent = beat.label;
    panel.querySelector<HTMLElement>('[data-traversal-event-hint]')!.textContent = mandatory
      ? 'Le passage est bloqué · continuez vers la rencontre.'
        : beat.category === 'OPTIONAL_COMBAT' ? 'Des ennemis occupent votre voie.'
        : beat.campaignNodeIds.includes('lion-refugees') ? 'Une mère et son enfant cherchent de l’aide sur la route.'
        : 'Faire halte auprès de ces voyageurs ou poursuivre la route.';
    const marker = panel.querySelector<HTMLElement>('[data-traversal-event-marker]')!;
    marker.textContent = markerGlyph(beat);
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
    if (this.viewMode === 'ROUTE') {
      this.worldRenderer.updateRoute(this.worldRenderer.routeCamera(this.routeRenderer.distance), width);
    }
    if (this.riskRenderer) {
      const hazards = T0_ROAD_AUTHORING.hazards(this.routeSegment.id);
      const active = this.viewMode === 'ROUTE' && this.session.phase === 'RUNNING'
        && !this.transition && !this.departure && this.approachElapsed === null
        && !this.routeRun.complete && !document.body.classList.contains('scene-transition--locked');
      this.riskRenderer.update(hazards, this.routeRisk, this.routeRun.progress01,
        this.routeRun.elapsedMs, this.routeSegment.durationMs, this.routeRenderer.distance,
        width, active, progress => forecastRouteDistance(this.routeRun, this.routeSegment, progress));
      if (this.riskQa) {
        this.element.dataset.riskSegment = this.routeRisk.segmentId;
        this.element.dataset.riskProgress = String(this.routeRun.progress01);
        this.element.dataset.riskLane = String(this.routeRun.lane);
        this.element.dataset.riskActiveHazards = JSON.stringify([...this.riskRenderer.element
          .querySelectorAll<HTMLElement>('[data-risk-hazard]:not([hidden])')].map(mark => mark.dataset.riskHazard));
        this.element.dataset.riskHazards = JSON.stringify(hazards.map(hazard => ({
          id: hazard.id, lane: hazard.lane, progress01: hazard.progress01 })));
        this.element.dataset.riskResolvedHazards = JSON.stringify(this.routeRisk.resolvedHazardIds);
        this.element.dataset.riskCollisionCount = String(this.routeRisk.collisionCount);
        this.element.dataset.riskLastCollisionId = this.routeRisk.lastCollisionId ?? '';
        this.element.dataset.riskSpeedBefore = String(this.lastRiskSpeedBefore ?? '');
        this.element.dataset.riskSpeedAfter = String(this.lastRiskSpeedAfter ?? '');
        this.element.dataset.riskRecoveryProgress = String(routeSpeedRecovery01(this.routeRun, this.routeSegment));
      }
    }
    if (this.rewardRenderer) {
      const active = this.viewMode === 'ROUTE' && session.phase === 'RUNNING'
        && !this.transition && !this.departure && this.approachElapsed === null
        && !this.routeRun.complete && !document.body.classList.contains('scene-transition--locked');
      const pickups = T0_ROAD_AUTHORING.pickups(this.routeSegment.id);
      this.rewardRenderer.update(pickups, this.routeReward, this.routeRun.progress01,
        this.routeRun.elapsedMs, this.routeSegment.durationMs, this.routeRenderer.distance,
        width, active, progress => forecastRouteDistance(this.routeRun, this.routeSegment, progress));
      if (this.riskQa) {
        this.element.dataset.rewardResolved = JSON.stringify(this.routeReward.resolvedPickupIds);
        this.element.dataset.rewardCollected = JSON.stringify(this.routeReward.collectedPickupIds);
        this.element.dataset.rewardGold = String(this.routeReward.collectedGold);
      }
    }
    if (this.pursuitRenderer) {
      const active = this.viewMode === 'ROUTE' && session.phase === 'RUNNING'
        && !this.transition && !this.departure && this.approachElapsed === null
        && !this.routeRun.complete && !document.body.classList.contains('scene-transition--locked');
      const vehicleHeight = Math.min(height * .24, width * (width <= 1000 ? .16 : .14));
      const window = T0_ROAD_AUTHORING.pursuitWindow(this.routeSegment.id);
      this.pursuitRenderer.update(window, this.routePursuit, this.routeRun.progress01,
        this.routeRun.elapsedMs, width, vehicleHeight, active);
      if (this.riskQa) {
        this.element.dataset.pursuitWindow = this.routePursuit.activeWindowId ?? '';
        this.element.dataset.pursuitPressure = String(this.routePursuit.pressure01);
        this.element.dataset.pursuitLane = this.routePursuit.activeWindowId && window
          ? String(pursuerLaneAt(window, this.routeRun.progress01)) : '';
        this.element.dataset.pursuitCaughtCount = String(this.routePursuit.caughtCount);
        this.element.dataset.pursuitResolved = JSON.stringify(this.routePursuit.resolvedWindowIds);
        this.element.dataset.pursuitEvents = JSON.stringify(this.pursuitQaEvents);
        this.element.dataset.pursuitSpeedBefore = String(this.lastPursuitSpeedBefore ?? '');
        this.element.dataset.pursuitSpeedAfter = String(this.lastPursuitSpeedAfter ?? '');
        this.element.dataset.pursuitCatchElapsed = String(this.lastPursuitCatchElapsed ?? '');
        this.element.dataset.pursuitCatchProgress = String(this.lastPursuitCatchProgress ?? '');
      }
    }
    const vehicle = this.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    const exitDistance = session.phase === 'ARRIVING' ? this.arrivalExitDistance : 0;
    const departureDistance = this.departure?.distance ?? 0;
    const checkpointCamera = this.checkpointBeat
      ? roadCameraX(this.checkpointBeat.progress01) - 650 * (1 - this.checkpointElapsed / 1.15)
      : roadCameraX(session.routeProgress01);
    const camera = checkpointCamera + departureDistance;
    if (this.viewMode === 'CHECKPOINT' || forceWorld) {
      const resolvedLocations = new Set(this.stageBeats.slice(0, session.stageIndex)
        .flatMap(beat => beat.locationId ? [beat.locationId] : []));
      this.worldRenderer.update(camera, width, this.presentedBranch, resolvedLocations);
      this.foregroundRenderer.update(camera, width);
      this.element.querySelector<HTMLElement>('.traversal-world__foreground')!.style.setProperty('--foreground-offset',
        `${roadWorldToScreen(0, camera, width) * ROAD_SPACE.foregroundFactor}px`);
    } else {
      const routeCamera = this.worldRenderer.routeCamera(this.routeRenderer.distance);
      this.foregroundRenderer.update(routeCamera, width);
      this.element.querySelector<HTMLElement>('.traversal-world__foreground')!.style.setProperty('--foreground-offset',
        `${roadWorldToScreen(0, routeCamera, width) * ROAD_SPACE.foregroundFactor}px`);
    }
    const entryDistance = 600 + Number.parseFloat(this.element.style.getPropertyValue('--vehicle-entry-x') || '0');
    const drivenDistance = (this.viewMode === 'ROUTE' ? this.routeRenderer.distance : camera)
      + exitDistance + departureDistance * .24 + entryDistance * ROAD_SPACE.referenceWidth / width;
    // Mirrors --vehicle-height without forcing layout of the composite wheel subtree.
    const vehicleHeight = Math.min(height * .24, width * (width <= 1000 ? .16 : .14));
    vehicle.style.setProperty('--wheel-angle', `${caravanWheelAngle(drivenDistance, vehicleHeight, width)}rad`);
    const suspensionSpeed = Math.min(1, this.speed / this.routeSegment.vMax);
    vehicle.style.setProperty('--suspension-y', `${Math.sin(drivenDistance / TRAVERSAL_CARAVAN.suspension.wavelength) * TRAVERSAL_CARAVAN.suspension.amplitude * suspensionSpeed}px`);
    const dustPhase = (drivenDistance % 130) / 130;
    vehicle.style.setProperty('--dust-phase', String(dustPhase));
    vehicle.style.setProperty('--dust-opacity', String(Math.max(0,
      (.5 - dustPhase * .5) * Math.min(1, this.speed / this.routeSegment.vMin))));
    const vehicleOffset = (exitDistance + departureDistance * .24) * width / ROAD_SPACE.referenceWidth;
    vehicle.style.setProperty('--vehicle-exit-x', `${vehicleOffset}px`);
    this.element.dataset.visualSpeed = String(this.speed);
    this.element.dataset.visualWorldDistance = String(this.routeRenderer.distance);
    this.element.dataset.vehicleOffset = String(vehicleOffset);
    this.element.dataset.visualMoving = this.speed > .12 ? 'true' : 'false';
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
      const bypassed = session.bypassedBeatIds.includes(beat.id);
      const stageIndex = this.stageBeats.findIndex((candidate) => candidate.id === beat.id);
      const stageConsumed = (stageIndex >= 0 && stageIndex < session.stageIndex)
        || Boolean(beat.branchNodeId && session.stageIndex >= this.stageBeats.length);
      const branchUnavailable = beat.branchNodeId
        && this.options.getState().run.traversalBranches?.[this.options.leg.id] !== beat.branchNodeId;
      const previousRoad = this.presentedBranch !== 'main'
        && beat.progress01 <= this.stageBeats.find(stage => stage.type === 'fork')!.progress01;
      entity.classList.toggle('is-consumed', !bypassed && (ambientConsumed || stageConsumed));
      entity.style.opacity = '1';
      entity.classList.toggle('is-near', Math.abs(beat.progress01 - session.routeProgress01) < 0.035);
      entity.hidden = session.phase === 'ARRIVING' || previousRoad || Boolean(branchUnavailable) || screenX < -width * .24 || screenX > width * 1.24
        || (!bypassed && (ambientConsumed || stageConsumed));
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

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.opened || event.defaultPrevented) return;
    if ((this.transition || this.departure || this.approachElapsed !== null
      || document.body.classList.contains('scene-transition--locked')) && event.key !== 'Escape') {
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
