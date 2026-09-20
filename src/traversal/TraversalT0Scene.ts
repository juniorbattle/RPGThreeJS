import type { LionTraversalLeg } from '../campaign/LionCampaignTravelRelations';
import type { GameState, RunNode } from '../game/types';
import { TRAVERSAL_T0_ASSETS } from './TraversalT0Assets';
import { createTraversalSprite } from './TraversalSprite';
import { resolveCharacterVisualProfile } from '../render/CharacterVisualRegistry';
import {
  resolveTraversalBeatCrossing,
  resolveTraversalT0Route,
  type TraversalBeatCrossing,
  type TraversalRouteBeat,
  type TraversalT0Route,
} from './TraversalT0Route';
import { TraversalRunController } from './TraversalRunController';
import type { TraversalLane, TraversalRunSession } from './TraversalRunRuntime';

const LANE_TOP_PERCENT: Record<TraversalLane, number> = { 0: 63, 1: 81 };
const MANDATORY_TOP_PERCENT = 72;
// The beat coordinate is its engagement time, not the truck's center. Leave stopping room.
const ENGAGEMENT_LINE_PERCENT = 56;
const ENTITY_PROGRESS_TO_SCREEN_PERCENT = 620;
const TRAVEL_SPEED_PER_SECOND = 0.012;
const PREVIEW_DISTANCE = 0.045;

export interface TraversalT0SceneOptions {
  readonly root: HTMLElement;
  readonly leg: LionTraversalLeg;
  readonly getState: () => GameState;
  readonly getAvailableNodes: () => readonly RunNode[];
  readonly onNodeHandoff: (node: RunNode, session: TraversalRunSession) => void | Promise<void>;
  readonly onArrival: (destinationNodeId: string) => void | Promise<void>;
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
  readonly route: TraversalT0Route;

  private readonly controller: TraversalRunController;
  private readonly entityElements = new Map<string, HTMLElement>();
  private readonly stageBeats: readonly TraversalRouteBeat[];
  private frameId: number | null = null;
  private previousFrameMs = 0;
  private opened = false;
  private arrivalRequested = false;
  private confirming = false;

  constructor(private readonly options: TraversalT0SceneOptions) {
    if (options.leg.id !== 'T0') throw new Error('TraversalT0Scene only accepts the canonical T0 leg.');
    const state = options.getState();
    this.route = resolveTraversalT0Route(
      options.leg,
      state.run.graph.nodes,
      state.clan.members.map((member) => member.definitionId),
    );
    this.stageBeats = this.route.beats.filter((beat) => beat.campaignNodeIds.length > 0);
    this.controller = new TraversalRunController({
      leg: options.leg,
      getAvailableNodes: options.getAvailableNodes,
      overlayRoot: this.element,
      onNodeHandoff: (node, session) => { void options.onNodeHandoff(node, session); },
      onSessionChange: () => this.renderRuntimeState(),
    });
    this.element.className = 'traversal-t0';
    this.element.dataset.traversalLeg = 'T0';
    this.element.dataset.singleRoad = 'true';
    this.element.dataset.laneCount = '2';
    this.element.setAttribute('aria-label', `Traversée de ${this.route.originLabel} vers ${this.route.destinationLabel}`);
    this.build();
  }

  get session(): TraversalRunSession { return this.controller.session; }
  get activeNodeId(): string | null { return this.controller.session.activeNodeId; }

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
    this.renderRuntimeState();
  }

  completeArrival(): void {
    this.controller.completeArrival();
    this.renderRuntimeState();
  }

  dispose(): void {
    if (!this.opened && !this.element.isConnected) return;
    this.opened = false;
    if (this.frameId !== null) window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    window.removeEventListener('keydown', this.onKeyDown);
    this.controller.dispose();
    this.element.remove();
  }

  private build(): void {
    this.element.innerHTML = `
      <div class="traversal-world" aria-label="Route jouable unique à deux voies">
        <div class="traversal-world__far" aria-hidden="true"></div>
        <div class="traversal-world__haze" aria-hidden="true"></div>
        <div class="traversal-world__midground" aria-hidden="true"></div>
        <div class="traversal-world__road" aria-hidden="true"></div>
        <div class="traversal-world__lane-glow" aria-hidden="true"></div>
        <div class="traversal-world__entities"></div>
        <figure class="traversal-vehicle" aria-label="Véhicule 4x4 en bois de la compagnie" data-empty-cabin="true" data-visible-wheels="4">
          <span class="traversal-vehicle__shadow" aria-hidden="true"></span>
          <span class="traversal-vehicle__dust traversal-vehicle__dust--one" aria-hidden="true"></span>
          <span class="traversal-vehicle__dust traversal-vehicle__dust--two" aria-hidden="true"></span>
          <span class="traversal-vehicle__wheel traversal-vehicle__wheel--rear" aria-hidden="true"></span>
          <span class="traversal-vehicle__wheel traversal-vehicle__wheel--front" aria-hidden="true"></span>
        </figure>
        <div class="traversal-world__foreground" aria-hidden="true"></div>
      </div>
      <header class="traversal-hud traversal-hud--context">
        <span class="traversal-hud__sigil" aria-hidden="true">♜</span>
        <div><p>Traversal T0 · Route du Lion</p><h1>Vers ${escapeHtml(this.route.destinationLabel)}</h1><span>Départ : ${escapeHtml(this.route.originLabel)}</span></div>
      </header>
      <section class="traversal-event-panel" data-traversal-event-panel aria-live="polite">
        <figure><img data-traversal-event-portrait alt=""></figure>
        <span class="traversal-event-panel__marker" data-traversal-event-marker>•••</span>
        <div><small data-traversal-event-kind>Route ouverte</small><strong data-traversal-event-title>En route</strong><p data-traversal-event-hint>Surveillez les deux voies.</p>
          <div class="traversal-event-panel__actions" hidden><button type="button" data-traversal-confirm>Confirmer</button><button type="button" data-traversal-skip>Passer</button></div>
        </div>
      </section>
      <aside class="traversal-hud traversal-hud--progress" aria-label="Progression de route">
        <div class="traversal-route-rail" aria-hidden="true"><i></i><span></span><span></span><span></span><span></span><b></b></div>
        <p>Prochain arrêt</p><strong data-traversal-next>${escapeHtml(this.route.destinationLabel)}</strong><span data-traversal-distance>${this.route.distanceKm.toFixed(1)} km</span>
      </aside>
      <nav class="traversal-lanes" aria-label="Voie actuelle">
        ${([0, 1] as const).map((lane) => `<button type="button" data-traversal-lane="${lane}">${laneLabel(lane)}</button>`).join('')}
      </nav>
      <div class="traversal-toast" role="status" aria-live="polite"></div>
    `;
    this.element.style.setProperty('--traversal-far-image', `url("${TRAVERSAL_T0_ASSETS.farBackground}")`);
    this.element.style.setProperty('--traversal-road-image', `url("${TRAVERSAL_T0_ASSETS.road}")`);
    const vehicle = this.element.querySelector<HTMLElement>('.traversal-vehicle')!;
    const vehicleArt = createTraversalSprite(TRAVERSAL_T0_ASSETS.vehicle, 'traversal-vehicle__art');
    vehicle.style.aspectRatio = vehicleArt.style.aspectRatio;
    vehicle.append(vehicleArt);
    const foreground = this.element.querySelector('.traversal-world__foreground')!;
    for (let index = 0; index < 4; index++) {
      const prop = createTraversalSprite(TRAVERSAL_T0_ASSETS.foreground, 'traversal-foreground-prop');
      prop.style.left = `${index * 41}%`;
      foreground.append(prop);
    }
    const midground = this.element.querySelector('.traversal-world__midground')!;
    for (let index = 0; index < 4; index++) {
      const prop = createTraversalSprite(TRAVERSAL_T0_ASSETS.foreground, 'traversal-midground-prop');
      prop.style.left = `${index * 37}%`;
      midground.append(prop);
    }
    const entities = this.element.querySelector<HTMLElement>('.traversal-world__entities')!;
    for (const beat of this.route.beats) this.buildEntity(entities, beat);
  }

  private buildEntity(entities: HTMLElement, beat: TraversalRouteBeat): void {
    const entity = document.createElement('article');
    entity.className = `traversal-entity traversal-entity--${beat.type}`;
    entity.dataset.traversalBeat = beat.id;
    entity.dataset.marker = beat.marker;
    entity.dataset.placement = beat.placement.toLowerCase();
    entity.dataset.interactionPolicy = beat.interactionPolicy;
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
    if (beat.backdropAsset) {
      body.append(createTraversalSprite(beat.backdropAsset, 'traversal-entity__backdrop'));
    }
    if (beat.visualAsset) {
      const image = createTraversalSprite(beat.visualAsset, 'traversal-entity__subject', beat.mirrorX);
      image.dataset.facing = 'left';
      image.classList.toggle('is-mirrored', Boolean(beat.mirrorX));
      body.append(image);
    } else {
      const prop = document.createElement('i');
      prop.className = `traversal-entity__prop traversal-entity__prop--${beat.type}`;
      prop.setAttribute('aria-hidden', 'true');
      body.append(prop);
    }
    const label = document.createElement('strong');
    label.textContent = beat.label;
    entity.append(marker, body, label);
    if (beat.placement === 'CENTERED') {
      const blockade = document.createElement('span');
      blockade.className = 'traversal-entity__roadblock';
      blockade.setAttribute('aria-hidden', 'true');
      for (const side of ['upper', 'lower']) {
        const barrier = createTraversalSprite(TRAVERSAL_T0_ASSETS.barricade, `traversal-barrier traversal-barrier--${side}`);
        blockade.append(barrier);
      }
      entity.prepend(blockade);
    }
    entities.append(entity);
    this.entityElements.set(beat.id, entity);
  }

  private readonly tick = (timeMs: number): void => {
    if (!this.opened) return;
    const deltaSeconds = this.previousFrameMs > 0
      ? Math.min(1, Math.max(0, (timeMs - this.previousFrameMs) / 1000))
      : 0;
    this.previousFrameMs = timeMs;
    if (this.controller.session.phase === 'RUNNING' && !document.hidden) this.advance(deltaSeconds);
    this.updateWorldTransforms();
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  private advance(deltaSeconds: number): void {
    const session = this.controller.session;
    if (session.phase !== 'RUNNING') return;
    const previousProgress = session.routeProgress01;
    const nextStage = this.stageBeats[session.stageIndex];
    const nextProgress = Math.min(1, previousProgress + deltaSeconds * TRAVEL_SPEED_PER_SECOND);
    // Resolve crossings in spatial order, including large frame deltas. Never step past a hold.
    for (const beat of this.route.beats) {
      if (session.consumedBeatIds.includes(beat.id)) continue;
      if (beat.campaignNodeIds.length && beat.id !== nextStage?.id) continue;
      const outcome = resolveTraversalBeatCrossing(beat, previousProgress, nextProgress, session.currentLane);
      if (outcome === 'NONE') continue;
      if (outcome === 'BYPASSED') {
        this.controller.bypassBeat(beat.id);
        this.showContactToast(beat, outcome);
      } else {
        this.controller.advanceTo(beat.progress01);
        this.controller.pauseForDecision(beat.id);
        this.element.querySelector<HTMLButtonElement>('[data-traversal-confirm]:not(:disabled), [data-traversal-skip]:not([hidden])')?.focus({ preventScroll: true });
        return;
      }
    }
    if (nextProgress !== previousProgress) this.controller.advanceTo(nextProgress);
    if (!nextStage && nextProgress >= 1 && !this.arrivalRequested) {
      this.arrivalRequested = true;
      this.controller.beginArrival(1);
      void this.options.onArrival(this.route.destinationNodeId);
    }
  }

  private async confirmDecision(): Promise<void> {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.confirming) return;
    this.confirming = true;
    this.renderEventPanel();
    try {
      if (beat.campaignNodeIds.length) {
        this.controller.releaseDecision();
        this.controller.approachNextStage(beat.progress01);
      } else {
        if (this.session.phase === 'LOCAL_INTERACTION') {
          this.controller.consumeBeat(beat.id);
          this.controller.releaseDecision();
        } else this.controller.beginLocalInteraction();
      }
    } finally {
      this.confirming = false;
      this.renderRuntimeState();
    }
  }

  private skipDecision(): void {
    const beat = this.route.beats.find((candidate) => candidate.id === this.session.pendingBeatId);
    if (!beat || this.session.phase !== 'DECISION' || beat.interactionPolicy !== 'OPTIONAL_CONFIRM' || this.confirming) return;
    this.controller.bypassBeat(beat.id);
    this.controller.releaseDecision();
    this.showContactToast(beat, 'BYPASSED');
  }

  private moveToLane(lane: TraversalLane): void {
    const current = this.controller.session.currentLane;
    if (lane === current) return;
    this.controller.moveLane(lane < current ? -1 : 1);
    this.renderRuntimeState();
  }

  private renderRuntimeState(): void {
    const session = this.controller.session;
    this.element.style.setProperty('--traversal-lane-y', `${LANE_TOP_PERCENT[session.currentLane]}%`);
    this.element.style.setProperty('--route-progress', String(session.routeProgress01));
    this.element.dataset.phase = session.phase;
    this.element.dataset.lane = String(session.currentLane);
    this.element.dataset.consumedBeats = String(session.consumedBeatIds.length);
    this.element.dataset.progress = String(session.routeProgress01);
    this.element.querySelectorAll<HTMLButtonElement>('[data-traversal-lane]').forEach((button) => {
      const active = Number(button.dataset.traversalLane) === session.currentLane;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.disabled = session.phase !== 'RUNNING';
    });
    const nextStage = this.stageBeats[session.stageIndex];
    const next = this.element.querySelector<HTMLElement>('[data-traversal-next]');
    const distance = this.element.querySelector<HTMLElement>('[data-traversal-distance]');
    if (next) next.textContent = nextStage?.label ?? this.route.destinationLabel;
    if (distance) distance.textContent = `~ ${Math.max(0, (1 - session.routeProgress01) * this.route.distanceKm).toFixed(1)} km`;
    this.renderEventPanel();
    this.updateWorldTransforms();
  }

  private renderEventPanel(): void {
    const session = this.controller.session;
    const beat = this.route.beats.find((candidate) => candidate.id === session.pendingBeatId) ?? this.route.beats.find((candidate) => {
      if (session.consumedBeatIds.includes(candidate.id)) return false;
      if (candidate.progress01 - session.routeProgress01 > PREVIEW_DISTANCE || candidate.progress01 < session.routeProgress01) return false;
      const stageIndex = this.stageBeats.findIndex((stage) => stage.id === candidate.id);
      return stageIndex < 0 || stageIndex >= session.stageIndex;
    });
    const panel = this.element.querySelector<HTMLElement>('[data-traversal-event-panel]');
    if (!panel) return;
    panel.hidden = !beat || !['RUNNING', 'DECISION', 'LOCAL_INTERACTION'].includes(session.phase);
    if (!beat) return;
    const local = session.phase === 'LOCAL_INTERACTION';
    const paused = session.phase === 'DECISION' || local;
    const mandatory = beat.interactionPolicy === 'MANDATORY_CONFIRM';
    const actions = panel.querySelector<HTMLElement>('.traversal-event-panel__actions')!;
    actions.hidden = !paused;
    const confirm = panel.querySelector<HTMLButtonElement>('[data-traversal-confirm]')!;
    const skip = panel.querySelector<HTMLButtonElement>('[data-traversal-skip]')!;
    confirm.textContent = local ? 'Reprendre la route' : mandatory ? 'Continuer' : 'Confirmer';
    confirm.disabled = this.confirming;
    skip.hidden = mandatory || local;
    skip.disabled = this.confirming;
    panel.dataset.interactionPolicy = beat.interactionPolicy;
    panel.dataset.placement = beat.placement.toLowerCase();
    panel.querySelector<HTMLElement>('[data-traversal-event-kind]')!.textContent = beat.interactionPolicy === 'MANDATORY_CONFIRM'
      ? 'Événement obligatoire'
      : `Rencontre facultative · ${laneLabel(beat.lane!).toLowerCase()}`;
    panel.querySelector<HTMLElement>('[data-traversal-event-title]')!.textContent = beat.label;
    const localDescriptions: Partial<Record<TraversalRouteBeat['type'], string>> = {
      npc: 'Vous faites halte près de l’étal et examinez les provisions du marchand.',
      enemy: 'Vous observez la meute depuis le véhicule. Les loups finissent par s’éloigner.',
      loot: 'Vous inspectez le coffre laissé au bord du chemin.',
      obstacle: 'Vous examinez le chariot brisé et repérez un passage autour des débris.',
      booster: 'Vous faites une courte halte près de la borne avant de repartir.',
    };
    panel.querySelector<HTMLElement>('[data-traversal-event-hint]')!.textContent = local
      ? `${localDescriptions[beat.type] ?? ''} Aperçu local · aucun gain permanent.` : paused
      ? mandatory ? 'Route arrêtée · confirmez pour poursuivre.'
        : 'Route arrêtée · entrer ou passer.'
      : mandatory ? 'Passage obligé · arrêt avant la rencontre.' : 'Restez sur cette voie pour vous arrêter, ou changez de voie pour passer.';
    panel.querySelector<HTMLElement>('[data-traversal-event-marker]')!.textContent = markerGlyph(beat);
    const portrait = panel.querySelector<HTMLImageElement>('[data-traversal-event-portrait]')!;
    portrait.hidden = !beat.visualAsset;
    portrait.src = beat.visualAsset ?? '';
    portrait.classList.toggle('is-mirrored', Boolean(beat.mirrorX));
  }

  private updateWorldTransforms(): void {
    const session = this.controller.session;
    this.element.style.setProperty('--far-offset', `${-session.routeProgress01 * 12}px`);
    this.element.style.setProperty('--road-offset', `${-session.routeProgress01 * 5800}px`);
    this.element.style.setProperty('--foreground-offset', `${-session.routeProgress01 * 7200}px`);
    this.element.querySelectorAll<HTMLElement>('.traversal-foreground-prop').forEach((prop, index) => {
      prop.style.left = `${((index * 41 - session.routeProgress01 * 340) % 164 + 164) % 164 - 32}%`;
    });
    this.element.querySelectorAll<HTMLElement>('.traversal-midground-prop').forEach((prop, index) => {
      prop.style.left = `${((index * 37 - session.routeProgress01 * 100) % 148 + 148) % 148 - 18}%`;
    });
    this.route.beats.forEach((beat) => {
      const entity = this.entityElements.get(beat.id);
      if (!entity) return;
      const screenX = ENGAGEMENT_LINE_PERCENT + (beat.progress01 - session.routeProgress01) * ENTITY_PROGRESS_TO_SCREEN_PERCENT;
      entity.style.left = `${screenX}%`;
      entity.style.top = `${beat.placement === 'CENTERED' ? MANDATORY_TOP_PERCENT : LANE_TOP_PERCENT[beat.lane!]}%`;
      entity.style.zIndex = String(beat.placement === 'CENTERED' ? 20 : 14 + beat.lane! * 12);
      const ambientConsumed = session.consumedBeatIds.includes(beat.id);
      const bypassed = session.bypassedBeatIds.includes(beat.id);
      const stageIndex = this.stageBeats.findIndex((candidate) => candidate.id === beat.id);
      const stageConsumed = stageIndex >= 0 && stageIndex < session.stageIndex;
      entity.classList.toggle('is-consumed', (ambientConsumed && !bypassed) || stageConsumed);
      entity.style.opacity = bypassed ? String(Math.max(0, Math.min(1, (screenX - 38) / 12))) : '1';
      entity.classList.toggle('is-near', Math.abs(beat.progress01 - session.routeProgress01) < 0.035);
      entity.hidden = screenX < -24 || screenX > 124 || (bypassed && screenX < 38) || (ambientConsumed && !bypassed) || stageConsumed;
    });
  }

  private showContactToast(beat: TraversalRouteBeat, outcome: TraversalBeatCrossing): void {
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
