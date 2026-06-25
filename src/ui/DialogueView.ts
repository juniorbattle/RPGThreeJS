import { applyScreenEnvironment } from '../render/screenBackgroundRegistry';
import type { DialogueChoice, DialogueSequence, DialogueStep, GameState, NarrativeEffect } from '../game/types';

interface DialogueViewOptions {
  root: HTMLElement;
  getState: () => GameState;
  applyEffects: (effects: NarrativeEffect[]) => Promise<void>;
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
    this.overlay.innerHTML = `
      <div class="dialogue__backdrop"></div>
      <div class="ui-environment-layer ui-environment-layer--fog" aria-hidden="true"></div>
      <div class="dialogue__portrait dialogue__portrait--left" aria-hidden="true"></div>
      <div class="dialogue__portrait dialogue__portrait--right" aria-hidden="true"></div>
      <div class="dialogue__choices"></div>
      <button class="dialogue__box ui-panel ui-panel--dialogue" type="button">
        <span class="dialogue__speaker"></span>
        <span class="dialogue__tag"></span>
        <span class="dialogue__text"></span>
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
    const speaker = this.overlay.querySelector<HTMLElement>('.dialogue__speaker');
    const tag = this.overlay.querySelector<HTMLElement>('.dialogue__tag');
    const text = this.overlay.querySelector<HTMLElement>('.dialogue__text');
    const choices = this.overlay.querySelector<HTMLElement>('.dialogue__choices');
    const continueLabel = this.overlay.querySelector<HTMLElement>('.dialogue__continue');
    if (!left || !right || !speaker || !tag || !text || !choices || !continueLabel) return;

    this.setPortrait(left, step.side === 'left' ? step.portrait : '');
    this.setPortrait(right, step.side === 'right' ? step.portrait : '');
    left.classList.toggle('is-visible', step.side === 'left');
    right.classList.toggle('is-visible', step.side === 'right');
    speaker.textContent = step.speaker;
    tag.textContent = step.tag;
    choices.replaceChildren();
    continueLabel.hidden = Boolean(step.choices?.length);
    this.typeText(text, step.text);

    if (step.effects.length) void this.options.applyEffects(step.effects);
    for (const choice of step.choices ?? []) {
      choices.append(this.createChoice(choice));
    }
  }

  private setPortrait(element: HTMLElement, portrait: string): void {
    const isImage = portrait.startsWith('/');
    element.textContent = isImage ? '' : portrait;
    element.style.backgroundImage = isImage ? `url("${portrait}")` : '';
    element.classList.toggle('has-image', isImage);
  }

  private createChoice(choice: DialogueChoice): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'dialogue-choice ui-panel ui-panel--dense';
    button.type = 'button';
    const state = this.options.getState();
    const blockedByGold = choice.requiresGold !== undefined && state.gold < choice.requiresGold;
    const blockedByFlag = choice.requiresFlag !== undefined && !state.flags[choice.requiresFlag];
    button.disabled = blockedByGold || blockedByFlag;
    button.textContent = blockedByGold ? `${choice.text} — Or insuffisant` : choice.text;
    button.addEventListener('click', async () => {
      await this.options.applyEffects(choice.effects);
      await this.advance(choice.next);
    });
    return button;
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = value;
      return;
    }
    let index = 0;
    element.textContent = '';
    this.typingTimer = window.setInterval(() => {
      index += 1;
      element.textContent = value.slice(0, index);
      if (index >= value.length) window.clearInterval(this.typingTimer);
    }, 15);
  }
}
