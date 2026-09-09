import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import { assets } from '../render/assetManifest';
import type { Contest, DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../game/types';
import { resolveContestOutcome } from '../game/contestResolution';
import type { NarrativeDialogueResolver, NarrativeDialogueStepPresentation } from '../cinematics/NarrativeDialogueAdapter';

interface DialogueViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  applyEffects: (effects: NarrativeEffect[]) => Promise<void>;
}

export type DialoguePresentationMode = 'default' | 'cinematic-overlay' | 'narrative-stage';

export interface DialoguePlayOptions {
  mode?: DialoguePresentationMode;
  root?: HTMLElement;
  stepPresentation?: NarrativeDialogueResolver;
  onStepChange?: (step: DialogueStep, presentation: NarrativeDialogueStepPresentation) => void;
  reducedMotion?: boolean;
}

type OutcomeTone = 'gain' | 'loss' | 'risk' | 'help' | 'neutral';

interface CharacterAssetProfile {
  dialogue: string;
  dialogueScale: number;
  dialogueSideOffset: string;
}

interface OutcomeDescriptor {
  icon: string;
  label: string;
  tone: OutcomeTone;
}

function signedAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

function formatItemId(itemId: string): string {
  return itemId.replace(/[-_]/g, ' ');
}

export function resolveDialogueBackdrop(sequence: DialogueSequence): string {
  if (sequence.sceneArtId) {
    const dialogueScenes = assets.dialogueScenes as Record<string, string>;
    const scene = dialogueScenes[sequence.sceneArtId];
    if (scene) return scene;
  }
  if (sequence.backdrop) return sequence.backdrop;
  const context = `${sequence.id} ${sequence.title ?? ''} ${sequence.sceneArtId ?? ''}`.toLowerCase();
  if (/bois-clair|valmir|village|marchand|coffre|réserve|reserve|cedric|recrut/.test(context)) return assets.screens.travel.backdrops.city;
  if (/chef|alaric|serment|sceau|jugement|finale|épilogue|epilogue|chroniqueur|lion/.test(context)) return assets.screens.travel.backdrops.castle;
  return assets.screens.travel.backdrops.default;
}

function dialoguePortrait(step: DialogueStep): string {
  const profile = dialogueActorProfile(step);
  if (profile) return profile.dialogue;
  if (step.actorId) {
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    const actor = dialogueActors[step.actorId];
    if (actor) return actor;
  }
  return step.portrait;
}

function dialogueActorProfile(step: DialogueStep): CharacterAssetProfile | undefined {
  if (!step.actorId) return undefined;
  const profiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
  return profiles[step.actorId];
}

export class DialogueView {
  private overlay: HTMLElement | null = null;
  private sequence: DialogueSequence | null = null;
  private current: DialogueStep | null = null;
  private resolvePlay: (() => void) | null = null;
  private playOptions: DialoguePlayOptions = {};
  private readonly appliedStepIds = new Set<string>();
  private choiceLocked = false;
  private typingTimer = 0;
  private displaySegments: readonly string[] = [];
  private displaySegmentIndex = 0;

  constructor(private readonly options: DialogueViewOptions) {}

  play(sequence: DialogueSequence, options: DialoguePlayOptions = {}): Promise<void> {
    this.close();
    this.sequence = sequence;
    this.playOptions = options;
    this.appliedStepIds.clear();
    this.choiceLocked = false;
    this.overlay = document.createElement('section');
    const cinematicOverlay = options.mode === 'cinematic-overlay' || options.mode === 'narrative-stage';
    const narrativeStage = options.mode === 'narrative-stage';
    this.overlay.className = `dialogue ui-screen${cinematicOverlay ? ' dialogue--cinematic' : ''}${narrativeStage ? ' dialogue--narrative' : ''}`;
    this.overlay.dataset.dialogueSequence = sequence.id;
    if (!cinematicOverlay) applyScreenEnvironment(this.overlay, 'dialogue');
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', sequence.title ?? 'Dialogue narratif');
    if (!cinematicOverlay) {
      this.overlay.style.setProperty('--dialogue-bg-image', `url("${resolveDialogueBackdrop(sequence)}")`);
    }
    const brandText = sequence.title ?? "Chroniques d'Élyndra";
    const brandClass = sequence.title ? 'dialogue__brand dialogue__brand--ate' : 'dialogue__brand';
    this.overlay.innerHTML = `
      <div class="dialogue__painted" aria-hidden="true"></div>
      <div class="dialogue__backdrop" aria-hidden="true"></div>
      <div class="ui-environment-layer ui-environment-layer--fog" aria-hidden="true"></div>
      <div class="${brandClass}" aria-hidden="true"><span>${brandText}</span></div>
      <div class="dialogue__stage" aria-hidden="true">
        <div class="dialogue__portrait dialogue__portrait--left"></div>
        <div class="dialogue__portrait dialogue__portrait--right"></div>
        <div class="dialogue__portrait dialogue__portrait--center"></div>
      </div>
      <div class="dialogue__choices" aria-label="Choix de dialogue"></div>
      <button class="dialogue__box ui-panel ui-panel--dialogue" type="button">
        <span class="dialogue__speaker-block">
          <span class="dialogue__speaker"></span>
          <span class="dialogue__tag"></span>
        </span>
        <span class="dialogue__divider" aria-hidden="true"></span>
        <span class="dialogue__text"><span class="dialogue__text-reveal"></span></span>
        <span class="dialogue__outcomes" aria-label="Conséquences"></span>
        <span class="dialogue__continue">Continuer ◆</span>
      </button>
    `;
    (options.root ?? this.options.root).append(this.overlay);
    this.overlay.querySelector<HTMLButtonElement>('.dialogue__box')?.addEventListener('click', () => {
      void this.advancePresentation();
    });
    this.showStep(sequence.steps[0]!.id);
    return new Promise<void>((resolve) => {
      this.resolvePlay = resolve;
    });
  }

  close(): void {
    window.clearInterval(this.typingTimer);
    this.overlay?.remove();
    this.overlay = null;
    this.sequence = null;
    this.current = null;
    this.playOptions = {};
    this.appliedStepIds.clear();
    this.choiceLocked = false;
    this.displaySegments = [];
    this.displaySegmentIndex = 0;
    this.resolvePlay?.();
    this.resolvePlay = null;
  }

  private showStep(id: string): void {
    const step = this.sequence?.steps.find((candidate) => candidate.id === id);
    if (!step || !this.overlay) {
      this.close();
      return;
    }
    this.current = step;
    this.choiceLocked = false;
    const left = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--left');
    const right = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--right');
    const center = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--center');
    const speaker = this.overlay.querySelector<HTMLElement>('.dialogue__speaker');
    const tag = this.overlay.querySelector<HTMLElement>('.dialogue__tag');
    const text = this.overlay.querySelector<HTMLElement>('.dialogue__text');
    const outcomes = this.overlay.querySelector<HTMLElement>('.dialogue__outcomes');
    const choices = this.overlay.querySelector<HTMLElement>('.dialogue__choices');
    const continueLabel = this.overlay.querySelector<HTMLElement>('.dialogue__continue');
    const box = this.overlay.querySelector<HTMLButtonElement>('.dialogue__box');
    if (!left || !right || !center || !speaker || !tag || !text || !outcomes || !choices || !continueLabel || !box) return;

    const cinematicOverlay = this.overlay.classList.contains('dialogue--cinematic');
    const narrativeStage = this.overlay.classList.contains('dialogue--narrative');
    const presentation = this.playOptions.stepPresentation?.(step) ?? {
      mode: 'HELD_DIALOGUE',
      showPortrait: !cinematicOverlay,
    };
    const portrait = presentation.showPortrait ? dialoguePortrait(step) : '';
    const profile = presentation.showPortrait ? dialogueActorProfile(step) : undefined;
    this.overlay.dataset.speakerSide = step.side;
    this.overlay.dataset.dialogueMode = presentation.mode;
    this.overlay.dataset.dialogueStep = step.id;
    this.overlay.dataset.dialogueActor = step.actorId ?? '';
    this.overlay.dataset.narrativeLayout = presentation.layoutProfile ?? '';
    this.overlay.dataset.narrativePlacement = presentation.layoutPlacement ?? '';
    this.overlay.dataset.narrativeStrategy = presentation.presentationStrategy ?? '';
    this.overlay.dataset.narrativePhase = presentation.phaseId ?? '';
    this.overlay.dataset.narrativeCastOwnership = presentation.castOwnership ?? '';
    if (presentation.anchorId) this.overlay.dataset.narrativeAnchor = presentation.anchorId;
    else delete this.overlay.dataset.narrativeAnchor;
    for (const mode of ['SPEAKER_CARD', 'CINEMATIC_SUBTITLE', 'HELD_DIALOGUE', 'SPATIAL_CHOICE'] as const) {
      this.overlay.classList.toggle(`dialogue--${mode.toLowerCase().replace('_', '-')}`, narrativeStage && presentation.mode === mode);
    }
    this.overlay.classList.toggle('dialogue--has-choices', Boolean(step.choices?.length));
    this.overlay.classList.remove('dialogue--choice-active');
    this.overlay.dataset.narrativeAgencyState = step.choices?.length ? 'SETUP' : 'NONE';
    this.overlay.dataset.narrativeSpeakerCardPolicy = presentation.speakerCardPolicy ?? 'VISIBLE';
    box.hidden = false;
    this.overlay.classList.toggle('dialogue--portrait-beat', narrativeStage && presentation.showPortrait);
    this.setPortrait(left, step.side === 'left' ? portrait : '', step.expression, step.side === 'left' ? profile : undefined);
    this.setPortrait(right, step.side === 'right' ? portrait : '', step.expression, step.side === 'right' ? profile : undefined);
    this.setPortrait(center, step.side === 'center' ? portrait : '', step.expression, step.side === 'center' ? profile : undefined);
    left.classList.toggle('is-visible', presentation.showPortrait && step.side === 'left');
    right.classList.toggle('is-visible', presentation.showPortrait && step.side === 'right');
    center.classList.toggle('is-visible', presentation.showPortrait && step.side === 'center');
    speaker.textContent = step.speaker;
    tag.textContent = step.tag;
    tag.hidden = !step.tag;
    choices.replaceChildren();
    outcomes.replaceChildren(...this.createOutcomeBadges(this.describeEffects(step.effects)));
    outcomes.hidden = outcomes.childElementCount === 0;
    this.displaySegments = presentation.displaySegments?.length
      ? presentation.displaySegments
      : [presentation.displayText ?? step.text];
    this.displaySegmentIndex = 0;
    this.overlay.dataset.dialogueSegment = `1/${this.displaySegments.length}`;
    const stagedChoiceSequence = narrativeStage && Boolean(step.choices?.length);
    continueLabel.hidden = Boolean(step.choices?.length) && !stagedChoiceSequence;
    continueLabel.textContent = this.displaySegments.length > 1
      ? 'Lire la suite ◆'
      : stagedChoiceSequence
        ? 'Choisir ◆'
        : 'Continuer ◆';
    this.typeText(text, this.displaySegments[0]!);
    this.playOptions.onStepChange?.(step, presentation);

    if (step.effects.length && !this.appliedStepIds.has(step.id)) {
      this.appliedStepIds.add(step.id);
      void this.options.applyEffects(step.effects);
    }
    if (!stagedChoiceSequence) {
      choices.replaceChildren(...(step.choices ?? []).map((choice) => this.createChoice(choice)));
    }
    if (cinematicOverlay) {
      const target = choices.querySelector<HTMLButtonElement>('button:not([disabled])') ?? box;
      target.focus();
    }
  }

  private setPortrait(element: HTMLElement, portrait: string, expression = 'neutral', profile?: CharacterAssetProfile): void {
    const isImage = portrait.startsWith('/');
    element.dataset.expression = expression;
    element.textContent = isImage ? '' : portrait;
    element.style.backgroundImage = isImage ? `url("${portrait}")` : '';
    element.style.setProperty('--dialogue-actor-height', `${Math.round((profile?.dialogueScale ?? 1) * 84)}%`);
    element.style.setProperty('--dialogue-actor-offset-x', profile?.dialogueSideOffset ?? '0px');
    element.classList.toggle('has-image', isImage);
  }

  private createChoice(choice: DialogueChoice): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'dialogue-choice ui-panel ui-panel--dense';
    button.classList.add(this.choiceToneClass(choice));
    button.type = 'button';
    const state = this.options.getState();
    const availableGold = state.gold + state.run.temporaryLoot.gold;
    const blockedByGold = choice.requiresGold !== undefined && availableGold < choice.requiresGold;
    const blockedByFlag = choice.requiresFlag !== undefined && !state.flags[choice.requiresFlag];
    const blockedByExcludesFlag = choice.excludesFlag !== undefined && !!state.flags[choice.excludesFlag];
    const blockedByReputationMin = choice.requiresReputationMin !== undefined && state.reputation < choice.requiresReputationMin;
    const blockedByReputationMax = choice.requiresReputationMax !== undefined && state.reputation > choice.requiresReputationMax;
    const isBlocked = blockedByGold || blockedByFlag || blockedByExcludesFlag || blockedByReputationMin || blockedByReputationMax;
    const isContestable = !!choice.contest;
    button.disabled = isBlocked && !isContestable;
    button.classList.toggle('is-blocked', button.disabled);
    button.classList.toggle('dialogue-choice--contest', isContestable);

    const icon = document.createElement('span');
    icon.className = 'dialogue-choice__icon';
    icon.textContent = this.choiceIcon(choice);

    const body = document.createElement('span');
    body.className = 'dialogue-choice__body';

    const label = document.createElement('strong');
    label.textContent = choice.text;
    body.append(label);

    const meta = document.createElement('span');
    meta.className = 'dialogue-choice__meta';

    if (isContestable) {
      meta.append(...this.createOutcomeBadges(this.contestBadges(choice.contest!)));
    } else {
      const preview = choice.outcomePreview;
      const mode = preview?.mode ?? 'exact';

      if (mode === 'soft') {
        const hintDescriptors = (preview?.hints ?? []).map((h) => ({ icon: '◇', label: h, tone: 'neutral' as const }));
        meta.append(...this.createOutcomeBadges(hintDescriptors));
        this.appendRequirementBadges(meta, choice, availableGold, blockedByGold, blockedByFlag, blockedByExcludesFlag, blockedByReputationMin, blockedByReputationMax);
      } else if (mode === 'hidden') {
        this.appendRequirementBadges(meta, choice, availableGold, blockedByGold, blockedByFlag, blockedByExcludesFlag, blockedByReputationMin, blockedByReputationMax);
      } else {
        const descriptors = this.describeEffects(choice.effects, choice.requiresGold);
        if (choice.requiresGold !== undefined) descriptors.unshift({ icon: '●', label: `${availableGold} or disponible`, tone: blockedByGold ? 'loss' : 'neutral' });
        if (choice.requiresFlag !== undefined && blockedByFlag) descriptors.unshift({ icon: '◇', label: 'Condition requise', tone: 'loss' });
        if (choice.requiresReputationMin !== undefined) descriptors.unshift({ icon: '♜', label: `Réputation ≥ ${choice.requiresReputationMin}`, tone: blockedByReputationMin ? 'loss' : 'neutral' });
        if (choice.requiresReputationMax !== undefined) descriptors.unshift({ icon: '♜', label: `Réputation ≤ ${choice.requiresReputationMax}`, tone: blockedByReputationMax ? 'loss' : 'neutral' });
        meta.append(...this.createOutcomeBadges(descriptors));
        if (blockedByGold) meta.append(this.createOutcomeBadge({ icon: '!', label: 'Or insuffisant', tone: 'loss' }));
        if (blockedByFlag && choice.blockedText) {
          meta.append(this.createOutcomeBadge({ icon: '!', label: choice.blockedText, tone: 'loss' }));
        }
        if (blockedByExcludesFlag && choice.blockedText) {
          meta.append(this.createOutcomeBadge({ icon: '!', label: choice.blockedText, tone: 'loss' }));
        }
      }
    }
    if (meta.childElementCount > 0) body.append(meta);

    button.append(icon, body);
    button.addEventListener('click', async () => {
      if (this.choiceLocked) return;
      const outcome = resolveContestOutcome(choice, this.options.getState());
      if (outcome.type === 'blocked') return;
      this.choiceLocked = true;
      for (const candidate of this.overlay?.querySelectorAll<HTMLButtonElement>('.dialogue-choice') ?? []) candidate.disabled = true;
      await this.options.applyEffects(outcome.effects);
      await this.advance(outcome.next);
    });
    return button;
  }

  private appendRequirementBadges(
    meta: HTMLElement,
    choice: DialogueChoice,
    availableGold: number,
    blockedByGold: boolean,
    blockedByFlag: boolean,
    blockedByExcludesFlag: boolean,
    blockedByReputationMin: boolean,
    blockedByReputationMax: boolean,
  ): void {
    if (choice.requiresGold !== undefined) {
      meta.append(this.createOutcomeBadge({ icon: '●', label: `${availableGold} or disponible`, tone: blockedByGold ? 'loss' : 'neutral' }));
    }
    if (choice.requiresFlag !== undefined && blockedByFlag) {
      meta.append(this.createOutcomeBadge({ icon: '◇', label: 'Condition requise', tone: 'loss' }));
    }
    if (blockedByGold) meta.append(this.createOutcomeBadge({ icon: '!', label: 'Or insuffisant', tone: 'loss' }));
    if (blockedByFlag && choice.blockedText) {
      meta.append(this.createOutcomeBadge({ icon: '!', label: choice.blockedText, tone: 'loss' }));
    }
    if (blockedByExcludesFlag && choice.blockedText) {
      meta.append(this.createOutcomeBadge({ icon: '!', label: choice.blockedText, tone: 'loss' }));
    }
  }

  private contestBadges(contest: Contest): OutcomeDescriptor[] {
    const badges: OutcomeDescriptor[] = [];
    const riskLabels: Record<string, string> = {
      low: 'Risque : faible',
      moderate: 'Risque : modéré',
      high: 'Risque : élevé',
      extreme: 'Risque : extrême',
    };
    badges.push({ icon: '⚠', label: riskLabels[contest.risk] ?? 'Risque : modéré', tone: 'risk' });
    if (contest.gainHint) {
      const gainLabels: Record<string, string> = {
        minor: 'Gain possible : mineur',
        moderate: 'Gain possible : modéré',
        important: 'Gain possible : important',
      };
      const gainLabel = gainLabels[contest.gainHint];
      if (gainLabel) badges.push({ icon: '◆', label: gainLabel, tone: 'gain' });
    }
    if (contest.hint) {
      badges.push({ icon: '◇', label: contest.hint, tone: 'loss' });
    }
    return badges;
  }

  private choiceIcon(choice: DialogueChoice): string {
    if (choice.effects.some((effect) => effect.type === 'startCombat')) return '⚔';
    if (choice.effects.some((effect) => effect.type === 'recruitUnit')) return '♙';
    if (choice.effects.some((effect) => effect.type === 'addGold' && effect.amount > 0)) return '◆';
    if (choice.effects.some((effect) => effect.type === 'addReputation' && effect.amount > 0)) return '♜';
    if (choice.effects.some((effect) => effect.type === 'addReputation' && effect.amount < 0)) return '⚖';
    return '◇';
  }

  private choiceToneClass(choice: DialogueChoice): string {
    if (choice.effects.some((effect) => effect.type === 'startCombat')) return 'dialogue-choice--risk';
    if (choice.effects.some((effect) => effect.type === 'addGold' && effect.amount > 0) || choice.effects.some((effect) => effect.type === 'addItem')) return 'dialogue-choice--reward';
    if (choice.effects.some((effect) => effect.type === 'addReputation' || effect.type === 'setFlag' || effect.type === 'recruitUnit')) return 'dialogue-choice--moral';
    if (choice.requiresGold !== undefined) return 'dialogue-choice--cost';
    return 'dialogue-choice--neutral';
  }

  private describeEffects(effects: readonly NarrativeEffect[], requiresGold?: number): OutcomeDescriptor[] {
    const descriptors: OutcomeDescriptor[] = [];
    for (const effect of effects) {
      switch (effect.type) {
        case 'addReputation':
          descriptors.push({ icon: '♜', label: `Réputation ${signedAmount(effect.amount)}`, tone: effect.amount >= 0 ? 'gain' : 'loss' });
          break;
        case 'addGold':
          if (requiresGold !== undefined && effect.amount === -requiresGold) break;
          descriptors.push({ icon: '●', label: `Or ${signedAmount(effect.amount)}`, tone: effect.amount >= 0 ? 'gain' : 'loss' });
          break;
        case 'addItem':
          descriptors.push({ icon: '▣', label: `Butin ${formatItemId(effect.itemId)} ×${effect.quantity}`, tone: 'gain' });
          break;
        case 'recruitUnit':
          descriptors.push({ icon: '♙', label: `Secours ${formatItemId(effect.unitId)}`, tone: 'help' });
          break;
        case 'startCombat':
          descriptors.push({ icon: '⚔', label: 'Risque combat', tone: 'risk' });
          break;
        case 'finishChapter':
          descriptors.push({ icon: '◇', label: 'Chapitre conclu', tone: 'neutral' });
          break;
      }
    }
    return descriptors;
  }

  private createOutcomeBadges(descriptors: readonly OutcomeDescriptor[]): HTMLElement[] {
    return descriptors.map((descriptor) => this.createOutcomeBadge(descriptor));
  }

  private createOutcomeBadge(descriptor: OutcomeDescriptor): HTMLElement {
    const badge = document.createElement('span');
    badge.className = `dialogue-outcome dialogue-outcome--${descriptor.tone}`;
    const icon = document.createElement('b');
    icon.textContent = descriptor.icon;
    const label = document.createElement('span');
    label.textContent = descriptor.label;
    badge.append(icon, label);
    return badge;
  }

  private async advance(next: string | null): Promise<void> {
    if (!next) {
      this.close();
      return;
    }
    this.showStep(next);
  }

  private async advancePresentation(): Promise<void> {
    if (!this.current || !this.overlay) return;
    if (this.displaySegmentIndex < this.displaySegments.length - 1) {
      this.displaySegmentIndex += 1;
      const text = this.overlay.querySelector<HTMLElement>('.dialogue__text');
      const choices = this.overlay.querySelector<HTMLElement>('.dialogue__choices');
      const continueLabel = this.overlay.querySelector<HTMLElement>('.dialogue__continue');
      if (!text || !choices || !continueLabel) return;
      this.typeText(text, this.displaySegments[this.displaySegmentIndex]!);
      const finalSegment = this.displaySegmentIndex === this.displaySegments.length - 1;
      this.overlay.dataset.dialogueSegment = `${this.displaySegmentIndex + 1}/${this.displaySegments.length}`;
      continueLabel.hidden = false;
      continueLabel.textContent = finalSegment
        ? this.current.choices?.length ? 'Choisir ◆' : 'Continuer ◆'
        : 'Lire la suite ◆';
      return;
    }
    if (this.current.choices?.length) {
      if (!this.overlay.classList.contains('dialogue--narrative')) return;
      this.activateChoices();
      return;
    }
    await this.advance(this.current.next ?? null);
  }

  private activateChoices(): void {
    if (!this.current?.choices?.length || !this.overlay) return;
    const choices = this.overlay.querySelector<HTMLElement>('.dialogue__choices');
    const box = this.overlay.querySelector<HTMLButtonElement>('.dialogue__box');
    if (!choices || !box) return;
    choices.replaceChildren(...this.current.choices.map((choice) => this.createChoice(choice)));
    box.hidden = true;
    this.overlay.classList.add('dialogue--choice-active');
    this.overlay.dataset.narrativeAgencyState = 'ACTIVE';
    choices.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
  }

  private typeText(element: HTMLElement, value: string): void {
    window.clearInterval(this.typingTimer);
    const reveal = element.querySelector<HTMLElement>('.dialogue__text-reveal');
    if (!reveal) return;
    element.dataset.finalText = value;
    const reducedMotion = this.playOptions.reducedMotion
      ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ?? false;
    if (reducedMotion) {
      reveal.textContent = value;
      return;
    }
    let index = 0;
    reveal.textContent = '';
    this.typingTimer = window.setInterval(() => {
      index += 1;
      reveal.textContent = value.slice(0, index);
      if (index >= value.length) window.clearInterval(this.typingTimer);
    }, 15);
  }
}
