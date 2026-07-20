import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import { assets } from '../render/assetManifest';
import type { Contest, DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../game/types';
import { resolveContestOutcome } from '../game/contestResolution';

interface DialogueViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  applyEffects: (effects: NarrativeEffect[]) => Promise<void>;
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

function dialogueBackdrop(sequence: DialogueSequence): string {
  if (sequence.sceneArtId) {
    const dialogueScenes = assets.dialogueScenes as Record<string, string>;
    const scene = dialogueScenes[sequence.sceneArtId];
    if (scene) return scene;
  }
  if (sequence.backdrop) return sequence.backdrop;
  const context = '';
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
  private typingTimer = 0;

  constructor(private readonly options: DialogueViewOptions) {}

  play(sequence: DialogueSequence): Promise<void> {
    this.close();
    this.sequence = sequence;
    this.overlay = document.createElement('section');
    this.overlay.className = 'dialogue ui-screen';
    applyScreenEnvironment(this.overlay, 'dialogue');
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.style.setProperty('--dialogue-bg-image', `url("${dialogueBackdrop(sequence)}")`);
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
        <span class="dialogue__text"></span>
        <span class="dialogue__outcomes" aria-label="Conséquences"></span>
        <span class="dialogue__continue">Continuer ◆</span>
      </button>
    `;
    this.options.root.append(this.overlay);
    this.overlay.querySelector<HTMLButtonElement>('.dialogue__box')?.addEventListener('click', () => {
      if (!this.current?.choices?.length) void this.advance(this.current?.next ?? null);
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
    const left = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--left');
    const right = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--right');
    const center = this.overlay.querySelector<HTMLElement>('.dialogue__portrait--center');
    const speaker = this.overlay.querySelector<HTMLElement>('.dialogue__speaker');
    const tag = this.overlay.querySelector<HTMLElement>('.dialogue__tag');
    const text = this.overlay.querySelector<HTMLElement>('.dialogue__text');
    const outcomes = this.overlay.querySelector<HTMLElement>('.dialogue__outcomes');
    const choices = this.overlay.querySelector<HTMLElement>('.dialogue__choices');
    const continueLabel = this.overlay.querySelector<HTMLElement>('.dialogue__continue');
    if (!left || !right || !center || !speaker || !tag || !text || !outcomes || !choices || !continueLabel) return;

    const portrait = dialoguePortrait(step);
    const profile = dialogueActorProfile(step);
    this.overlay.dataset.speakerSide = step.side;
    this.overlay.classList.toggle('dialogue--has-choices', Boolean(step.choices?.length));
    this.setPortrait(left, step.side === 'left' ? portrait : '', step.expression, step.side === 'left' ? profile : undefined);
    this.setPortrait(right, step.side === 'right' ? portrait : '', step.expression, step.side === 'right' ? profile : undefined);
    this.setPortrait(center, step.side === 'center' ? portrait : '', step.expression, step.side === 'center' ? profile : undefined);
    left.classList.toggle('is-visible', step.side === 'left');
    right.classList.toggle('is-visible', step.side === 'right');
    center.classList.toggle('is-visible', step.side === 'center');
    speaker.textContent = step.speaker;
    tag.textContent = step.tag;
    tag.hidden = !step.tag;
    choices.replaceChildren();
    outcomes.replaceChildren(...this.createOutcomeBadges(this.describeEffects(step.effects)));
    outcomes.hidden = outcomes.childElementCount === 0;
    continueLabel.hidden = Boolean(step.choices?.length);
    this.typeText(text, step.text);

    if (step.effects.length) void this.options.applyEffects(step.effects);
    for (const choice of step.choices ?? []) {
      choices.append(this.createChoice(choice));
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
      meta.append(...this.createOutcomeBadges(this.contestBadges(choice.contest!, state)));
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
      const outcome = resolveContestOutcome(choice, this.options.getState());
      if (outcome.type === 'blocked') return;
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

  private contestBadges(contest: Contest, state: GameState): OutcomeDescriptor[] {
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
    if (state.flags['liedToAlaric']) {
      badges.push({ icon: '◇', label: 'Vos mensonges précédents pèsent contre vous', tone: 'loss' });
    } else if (state.flags['alaricDoubt']) {
      badges.push({ icon: '◇', label: 'Alaric semble méfiant', tone: 'loss' });
    } else if (contest.hint) {
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

  private typeText(element: HTMLElement, value: string): void {
    window.clearInterval(this.typingTimer);
    let index = 0;
    element.textContent = '';
    this.typingTimer = window.setInterval(() => {
      index += 1;
      element.textContent = value.slice(0, index);
      if (index >= value.length) window.clearInterval(this.typingTimer);
    }, 15);
  }
}
