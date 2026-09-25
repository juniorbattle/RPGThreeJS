import type { DialogueSequence } from '../game/types';
import { assets } from '../render/assetManifest';
import { resolveCharacterAsset } from '../render/CharacterVisualRegistry';
import { createGenericNarrativeTableau, type NarrativeActorEntryEffect, type NarrativeActorExitEffect, type NarrativeAddressResolution, type NarrativeLayoutPlacement, type NarrativeStagedActorSpec, type NarrativeTableauSpec, type NarrativeVisualPhaseSpec } from './NarrativeTableau';
import { resolveStaticTableauActorTuning, resolveStaticTableauComposition, type StaticTableauCompositionProfile } from './StaticTableauComposition';

interface DialogueAssetProfile {
  full: string;
  dialogue: string;
}

function actorImage(actorId: string): string | undefined {
  const profiles = assets.characterProfiles as Record<string, DialogueAssetProfile | undefined>;
  const actors = assets.dialogueActors as Record<string, string | undefined>;
  return resolveCharacterAsset(actorId, 'full') ?? profiles[actorId]?.full ?? profiles[actorId]?.dialogue ?? actors[actorId];
}

type NarrativeStaticCastState = 'ACTIVE' | 'LISTENING' | 'BACKGROUND';

/** One approved foreground stature regardless of the number of speakers on stage. */
export const THEATRICAL_ACTOR_BASE_SCALE = 1.14;

/** Journey actors retain each road's authored perspective while reading clearly against the environment. */
export const SCENE_INTEGRATED_ACTOR_BASE_SCALE = 1.4;

function castState(spec: NarrativeStagedActorSpec, speakerId?: string): NarrativeStaticCastState {
  if (spec.actorId === speakerId) return 'ACTIVE';
  return spec.narrativeRole === 'BACKGROUND' ? 'BACKGROUND' : 'LISTENING';
}

function applyActorState(
  actor: HTMLElement,
  spec: NarrativeStagedActorSpec,
  speakerId?: string,
  direction?: { facing?: 'LEFT' | 'RIGHT' | 'FORWARD'; lookTarget?: string | null },
  compositionProfile: StaticTableauCompositionProfile = 'COMPANY_EXCHANGE',
  scenePlacement?: Readonly<{ xPercent: number; bottomVh: number; scale: number }>,
): void {
  const state = castState(spec, speakerId);
  const activeDirection = spec.actorId === speakerId ? direction : undefined;
  actor.dataset.screenPosition = spec.screenPosition;
  actor.dataset.narrativeRole = spec.actorId === speakerId ? 'CURRENT_SPEAKER' : spec.narrativeRole;
  actor.dataset.castState = state;
  actor.dataset.facing = activeDirection?.facing ?? spec.facing;
  actor.dataset.lookTarget = activeDirection?.lookTarget ?? spec.lookTarget ?? '';
  actor.dataset.actorGroup = spec.group ?? 'NEUTRAL';
  actor.dataset.dramaticSide = spec.dramaticSide ?? 'CENTER';
  actor.dataset.entryEffect = spec.entryEffect ?? 'NONE';
  actor.dataset.physicalScale = `${spec.scale}`;
  actor.classList.toggle('is-speaking', state === 'ACTIVE');
  actor.classList.toggle('is-listening', state === 'LISTENING');
  actor.classList.toggle('is-background', state === 'BACKGROUND');
  if (scenePlacement) {
    actor.dataset.castPlacementMode = 'SCENE_INTEGRATED';
    delete actor.dataset.compositionProfile;
    actor.style.left = `${scenePlacement.xPercent}%`;
    actor.style.setProperty('--tableau-baseline', `${scenePlacement.bottomVh}vh`);
    actor.style.setProperty('--narrative-actor-scale', `${spec.scale * scenePlacement.scale * SCENE_INTEGRATED_ACTOR_BASE_SCALE}`);
  } else {
    const tuning = resolveStaticTableauActorTuning(compositionProfile, spec);
    actor.dataset.castPlacementMode = 'THEATRICAL_FOREGROUND';
    actor.dataset.compositionProfile = compositionProfile;
    actor.style.left = `${tuning.xPercent}%`;
    actor.style.setProperty('--tableau-baseline', `${tuning.baselineVh}vh`);
    actor.style.setProperty('--narrative-actor-scale', `${spec.scale * THEATRICAL_ACTOR_BASE_SCALE * tuning.scale}`);
  }
  actor.style.setProperty('--narrative-actor-depth', `${spec.depth}`);
}

function actorElement(
  spec: NarrativeStagedActorSpec,
  speakerId?: string,
  actorImages: Readonly<Record<string, string>> = {},
  compositionProfile: StaticTableauCompositionProfile = 'COMPANY_EXCHANGE',
  scenePlacement?: Readonly<{ xPercent: number; bottomVh: number; scale: number }>,
): HTMLElement {
  const actor = document.createElement('figure');
  actor.className = 'narrative-cast__actor';
  actor.dataset.actorId = spec.actorId;
  applyActorState(actor, spec, speakerId, undefined, compositionProfile, scenePlacement);
  const image = actorImages[spec.actorId] ?? actorImage(spec.actorId);
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
  private activePhaseId: string | undefined;
  private phasePreparation: Promise<void> = Promise.resolve();
  private readonly reducedMotion: boolean;
  private readonly actorImages: Readonly<Record<string, string>>;

  constructor(
    private readonly root: HTMLElement,
    private readonly tableau: NarrativeTableauSpec,
    options: { reducedMotion?: boolean; actorImages?: Readonly<Record<string, string>> } = {},
  ) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.actorImages = options.actorImages ?? {};
    this.phases = tableau.phases ?? [];
    this.element.className = 'narrative-scene-surface narrative-media-surface narrative-media-surface--still';
    this.element.dataset.narrativeScene = tableau.id;
    if (tableau.castPlacementMode !== 'SCENE_INTEGRATED') this.element.dataset.dialogueSurfaceMode = 'STATIC_TABLEAU';
    this.element.dataset.castPlacementMode = tableau.castPlacementMode ?? 'THEATRICAL_FOREGROUND';
    this.element.dataset.tableauFamily = tableau.family ?? 'FALLBACK';
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

  prepare(image?: string, phaseId?: string): void {
    const selected = image ?? this.tableau.stillImage;
    this.preparedImage = selected;
    if (selected) this.environmentLayer.style.backgroundImage = `url("${selected}")`;
    const first = phaseId ? this.phases.find((phase) => phase.id === phaseId) : this.phases[0];
    if (first) this.phasePreparation = this.setPhase(first.id);
  }

  mount(image?: string, phaseId?: string): void {
    this.prepare(image, phaseId);
    this.root.replaceChildren(this.element);
  }

  async whenRenderable(): Promise<void> {
    await this.phasePreparation;
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

  async setPhase(
    phaseId: string,
    speakerId?: string,
    layoutPlacement?: NarrativeLayoutPlacement,
    speakerFacing?: 'LEFT' | 'RIGHT' | 'FORWARD',
    speakerLookTarget?: string | null,
    addressedTo?: string | null,
    addressResolution?: NarrativeAddressResolution,
  ): Promise<void> {
    const phase = this.phases.find((candidate) => candidate.id === phaseId);
    if (!phase) return;
    this.element.dataset.visualPhase = phase.id;
    this.element.dataset.layoutProfile = phase.layoutProfile;
    this.element.dataset.layoutPlacement = layoutPlacement ?? phase.layoutPlacement;
    this.element.dataset.negativeSpaceIntent = phase.negativeSpaceIntent;
    this.element.dataset.addressedTo = addressedTo ?? '';
    this.element.dataset.lookTarget = speakerLookTarget ?? '';
    this.element.dataset.addressResolution = addressResolution ?? 'SCENE_DEFAULT';
    const existing = new Map(
      Array.from(this.castLayer.querySelectorAll<HTMLElement>('.narrative-cast__actor'))
        .map((actor) => [actor.dataset.actorId ?? '', actor]),
    );
    const previousPhase = this.phases.find((candidate) => candidate.id === this.activePhaseId);
    const nextIds = new Set(phase.staticCast.map((actor) => actor.actorId));
    const sceneIntegrated = this.tableau.castPlacementMode === 'SCENE_INTEGRATED';
    const compositionProfile = resolveStaticTableauComposition(this.tableau, phase);
    if (sceneIntegrated) delete this.element.dataset.compositionProfile;
    else this.element.dataset.compositionProfile = compositionProfile;
    const exiting = [...existing.values()].filter((actor) => !nextIds.has(actor.dataset.actorId ?? ''));
    const exitByActor = new Map((previousPhase?.exits ?? []).map((exit) => [exit.actorId, exit]));
    for (const actor of exiting) {
      const exit = exitByActor.get(actor.dataset.actorId ?? '');
      const effect = this.reducedMotion ? reducedExitEffect(exit?.effect) : exit?.effect ?? 'FADE_OUT';
      actor.dataset.exitEffect = effect;
      actor.dataset.exitKind = exit?.kind ?? 'STAGE_OUT';
      actor.classList.add('is-exiting');
    }
    const actors = phase.staticCast.map((spec) => {
      const scenePlacement = sceneIntegrated ? this.tableau.sceneCastPlacement?.[spec.actorId] : undefined;
      if (sceneIntegrated && !scenePlacement) throw new Error(`Missing scene placement for ${this.tableau.id}:${spec.actorId}`);
      const alreadyStaged = existing.get(spec.actorId);
      const actor = alreadyStaged ?? actorElement(spec, speakerId, this.actorImages, compositionProfile, scenePlacement);
      applyActorState(actor, spec, speakerId, { facing: speakerFacing, lookTarget: speakerLookTarget }, compositionProfile, scenePlacement);
      const effect = this.reducedMotion ? reducedEntryEffect(spec.entryEffect) : spec.entryEffect ?? 'NONE';
      actor.dataset.entryEffect = alreadyStaged ? 'NONE' : effect;
      actor.classList.toggle('is-entering', !alreadyStaged && effect !== 'NONE');
      return actor;
    });
    this.castLayer.dataset.castCount = `${actors.length}`;
    this.castLayer.replaceChildren(...actors, ...exiting);
    this.focusLayer.dataset.speaker = speakerId ?? '';
    const stagedSpeaker = phase.staticCast.find((actor) => actor.actorId === speakerId);
    this.element.dataset.speakerPosition = stagedSpeaker?.screenPosition ?? '';
    this.activePhaseId = phase.id;
    const newImages = actors
      .filter((actor) => actor.classList.contains('is-entering'))
      .flatMap((actor) => Array.from(actor.querySelectorAll<HTMLImageElement>('img')));
    await Promise.allSettled(newImages.map(async (image) => {
      if (typeof image.decode === 'function') await image.decode();
    }));
    const hasTransition = exiting.length > 0 || actors.some((actor) => actor.classList.contains('is-entering'));
    if (hasTransition && !this.reducedMotion) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 180));
    }
    for (const actor of actors) actor.classList.remove('is-entering');
    this.castLayer.replaceChildren(...actors);
  }

  dispose(): void {
    this.castLayer.replaceChildren();
    this.element.remove();
  }
}

function reducedEntryEffect(effect: NarrativeActorEntryEffect | undefined): NarrativeActorEntryEffect {
  return effect === 'NONE' || !effect ? 'NONE' : 'FADE_IN';
}

function reducedExitEffect(effect: NarrativeActorExitEffect | undefined): NarrativeActorExitEffect {
  return effect === 'NONE' || !effect ? 'NONE' : 'FADE_OUT';
}
