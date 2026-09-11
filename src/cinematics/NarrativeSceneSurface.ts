import type { DialogueSequence } from '../game/types';
import { assets } from '../render/assetManifest';
import { createGenericNarrativeTableau, type NarrativeLayoutPlacement, type NarrativeStagedActorSpec, type NarrativeTableauSpec, type NarrativeVisualPhaseSpec } from './NarrativeTableau';

interface DialogueAssetProfile {
  full: string;
  dialogue: string;
}

function actorImage(actorId: string): string | undefined {
  const profiles = assets.characterProfiles as Record<string, DialogueAssetProfile | undefined>;
  const actors = assets.dialogueActors as Record<string, string | undefined>;
  return profiles[actorId]?.full ?? profiles[actorId]?.dialogue ?? actors[actorId];
}

type NarrativeStaticCastState = 'ACTIVE' | 'LISTENING' | 'BACKGROUND';

function castState(spec: NarrativeStagedActorSpec, speakerId?: string): NarrativeStaticCastState {
  if (spec.actorId === speakerId) return 'ACTIVE';
  return spec.narrativeRole === 'BACKGROUND' ? 'BACKGROUND' : 'LISTENING';
}

function applyActorState(actor: HTMLElement, spec: NarrativeStagedActorSpec, speakerId?: string): void {
  const state = castState(spec, speakerId);
  actor.dataset.screenPosition = spec.screenPosition;
  actor.dataset.narrativeRole = spec.actorId === speakerId ? 'CURRENT_SPEAKER' : spec.narrativeRole;
  actor.dataset.castState = state;
  actor.dataset.facing = spec.facing;
  actor.dataset.physicalScale = `${spec.scale}`;
  actor.classList.toggle('is-speaking', state === 'ACTIVE');
  actor.classList.toggle('is-listening', state === 'LISTENING');
  actor.classList.toggle('is-background', state === 'BACKGROUND');
  actor.style.setProperty('--narrative-actor-scale', `${spec.scale}`);
  actor.style.setProperty('--narrative-actor-depth', `${spec.depth}`);
}

function actorElement(spec: NarrativeStagedActorSpec, speakerId?: string): HTMLElement {
  const actor = document.createElement('figure');
  actor.className = 'narrative-cast__actor';
  actor.dataset.actorId = spec.actorId;
  applyActorState(actor, spec, speakerId);
  const image = actorImage(spec.actorId);
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = '';
    img.draggable = false;
    actor.append(img);
  }
  return actor;
}

export class NarrativeSceneSurface {
  readonly element = document.createElement('div');
  readonly environmentLayer = document.createElement('div');
  readonly castLayer = document.createElement('div');
  readonly atmosphereLayer = document.createElement('div');
  readonly focusLayer = document.createElement('div');
  private phases: readonly NarrativeVisualPhaseSpec[];
  private preparedImage: string | undefined;

  constructor(
    private readonly root: HTMLElement,
    private readonly tableau: NarrativeTableauSpec,
  ) {
    this.phases = tableau.phases ?? [];
    this.element.className = 'narrative-scene-surface narrative-media-surface narrative-media-surface--still';
    this.element.dataset.narrativeScene = tableau.id;
    this.element.dataset.dialogueSurfaceMode = 'STATIC_TABLEAU';
    if (tableau.tableauBackgroundId) this.element.dataset.tableauBackgroundId = tableau.tableauBackgroundId;
    this.environmentLayer.className = 'narrative-scene-surface__environment';
    this.castLayer.className = 'narrative-scene-surface__cast narrative-cast';
    this.castLayer.dataset.cropPolicy = 'BOTTOM_INTENTIONAL';
    this.castLayer.setAttribute('aria-hidden', 'true');
    this.atmosphereLayer.className = 'narrative-scene-surface__atmosphere';
    this.focusLayer.className = 'narrative-scene-surface__focus';
    this.element.append(this.environmentLayer, this.castLayer, this.atmosphereLayer, this.focusLayer);
  }

  bindDialogue(sequence: DialogueSequence): void {
    if (!this.phases.length) this.phases = createGenericNarrativeTableau(sequence).phases ?? [];
  }

  prepare(image?: string): void {
    const selected = image ?? this.tableau.stillImage;
    this.preparedImage = selected;
    if (selected) this.environmentLayer.style.backgroundImage = `url("${selected}")`;
    const first = this.phases[0];
    if (first) this.setPhase(first.id);
  }

  mount(image?: string): void {
    this.prepare(image);
    this.root.replaceChildren(this.element);
  }

  async whenRenderable(): Promise<void> {
    const sources = [
      this.preparedImage,
      ...Array.from(this.castLayer.querySelectorAll<HTMLImageElement>('img')).map((image) => image.src),
    ].filter((source): source is string => Boolean(source));
    await Promise.allSettled(sources.map(async (source) => {
      const image = new Image();
      image.src = source;
      if (typeof image.decode === 'function') await image.decode();
    }));
  }

  setPhase(phaseId: string, speakerId?: string, layoutPlacement?: NarrativeLayoutPlacement): void {
    const phase = this.phases.find((candidate) => candidate.id === phaseId);
    if (!phase) return;
    this.element.dataset.visualPhase = phase.id;
    this.element.dataset.layoutProfile = phase.layoutProfile;
    this.element.dataset.layoutPlacement = layoutPlacement ?? phase.layoutPlacement;
    this.element.dataset.negativeSpaceIntent = phase.negativeSpaceIntent;
    const existing = new Map(
      Array.from(this.castLayer.querySelectorAll<HTMLElement>('.narrative-cast__actor'))
        .map((actor) => [actor.dataset.actorId ?? '', actor]),
    );
    const actors = phase.staticCast.map((spec) => {
      const actor = existing.get(spec.actorId) ?? actorElement(spec, speakerId);
      applyActorState(actor, spec, speakerId);
      return actor;
    });
    this.castLayer.dataset.castCount = `${actors.length}`;
    this.castLayer.replaceChildren(...actors);
    this.focusLayer.dataset.speaker = speakerId ?? '';
    const stagedSpeaker = phase.staticCast.find((actor) => actor.actorId === speakerId);
    this.element.dataset.speakerPosition = stagedSpeaker?.screenPosition ?? '';
  }

  dispose(): void {
    this.castLayer.replaceChildren();
    this.element.remove();
  }
}
