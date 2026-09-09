import type {
  JourneyAgencyPresentation,
  JourneyChoicePresentation,
  JourneyCommit,
  JourneyCommitKind,
  JourneySecondaryActionPresentation,
} from './JourneyTypes';

export interface JourneyOverlayCallbacks {
  onCommit: (commit: JourneyCommit) => void;
}

export interface JourneyOverlayOptions {
  /** True when no frozen cinematic surface sits behind the overlay, so it draws its own backdrop. */
  standalone?: boolean;
  root?: HTMLElement;
}

const DEFAULT_CONTINUE_LABEL = 'Continuer';
const DEFAULT_TITLE = 'La route se poursuit';

/**
 * Generic player-agency overlay for a frozen Journey presentation.
 *
 * It owns no campaign logic: it renders `JourneyChoicePresentation` objects and reports the single
 * committed affordance back. Once anything is committed the overlay latches, so a route or action
 * can never be committed twice.
 */
export class JourneyOverlay {
  readonly element = document.createElement('section');
  private readonly panel = document.createElement('div');
  private readonly header = document.createElement('header');
  private readonly choiceList = document.createElement('ul');
  private readonly secondaryBar = document.createElement('div');
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private readonly root: HTMLElement;
  private committed = false;
  private disposed = false;

  constructor(
    presentation: JourneyAgencyPresentation,
    private readonly callbacks: JourneyOverlayCallbacks,
    options: JourneyOverlayOptions = {},
  ) {
    this.root = options.root ?? document.body;
    const mode = presentation.mode ?? (presentation.choices.length ? 'branch' : 'single');
    this.element.className = `journey-overlay journey-overlay--${mode}${options.standalone ? ' journey-overlay--standalone' : ''}`;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', presentation.title ?? DEFAULT_TITLE);
    this.panel.className = 'journey-overlay__panel';
    this.header.className = 'journey-overlay__header';

    if (presentation.eyebrow) {
      const eyebrow = document.createElement('p');
      eyebrow.className = 'journey-overlay__eyebrow';
      eyebrow.textContent = presentation.eyebrow;
      this.header.append(eyebrow);
    }

    const title = document.createElement('h2');
    title.className = 'journey-overlay__title';
    title.textContent = presentation.title ?? DEFAULT_TITLE;
    this.header.append(title);
    if (presentation.caption) {
      const caption = document.createElement('p');
      caption.className = 'journey-overlay__caption';
      caption.textContent = presentation.caption;
      this.header.append(caption);
    }
    if (presentation.context) {
      const context = document.createElement('p');
      context.className = 'journey-overlay__context';
      context.textContent = presentation.context;
      this.header.append(context);
    }
    this.panel.append(this.header);

    this.choiceList.className = 'journey-overlay__choices';
    if (presentation.choices.length) {
      for (const [index, choice] of presentation.choices.entries()) {
        this.choiceList.append(this.buildChoice(choice, index, presentation.choices.length));
      }
    } else {
      this.choiceList.append(this.buildContinue(presentation.continueLabel ?? DEFAULT_CONTINUE_LABEL));
    }
    this.panel.append(this.choiceList);

    this.secondaryBar.className = 'journey-overlay__secondary';
    this.secondaryBar.hidden = !presentation.secondary?.length;
    for (const action of presentation.secondary ?? []) this.secondaryBar.append(this.buildSecondary(action));
    this.panel.append(this.secondaryBar);

    this.element.append(this.panel);
  }

  get isCommitted(): boolean {
    return this.committed;
  }

  mount(): void {
    this.root.append(this.element);
    this.panel.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.element.remove();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  private buildChoice(choice: JourneyChoicePresentation, index: number, choiceCount: number): HTMLLIElement {
    const item = document.createElement('li');
    if (choiceCount === 2) {
      const geography = index === 0 ? 'left' : 'right';
      item.className = `journey-overlay__route journey-overlay__route--${geography}`;
      item.dataset.routeGeography = geography.toUpperCase();
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `journey-overlay__choice${choiceCount === 2 ? ` journey-overlay__choice--route-${index === 0 ? 'left' : 'right'}` : ''}`;
    button.dataset.journeyChoice = choice.id;
    button.disabled = choice.disabled === true;

    const label = document.createElement('b');
    label.textContent = choice.label;
    button.append(label);

    const meta = [choice.category, choice.difficulty].filter((entry): entry is string => Boolean(entry));
    if (meta.length) {
      const metaEl = document.createElement('span');
      metaEl.className = 'journey-overlay__meta';
      metaEl.textContent = meta.join(' · ');
      button.append(metaEl);
    }
    if (choice.hint) {
      const hint = document.createElement('small');
      hint.className = 'journey-overlay__hint';
      hint.textContent = choice.hint;
      button.append(hint);
    }
    for (const [key, value] of [['risk', choice.risk], ['reward', choice.reward]] as const) {
      if (!value) continue;
      const tag = document.createElement('span');
      tag.className = `journey-overlay__tag journey-overlay__tag--${key}`;
      tag.textContent = value;
      button.append(tag);
    }

    button.addEventListener('click', () => this.commit('choice', choice.id));
    item.append(button);
    return item;
  }

  private buildContinue(label: string): HTMLLIElement {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'journey-overlay__choice journey-overlay__choice--continue';
    button.dataset.journeyContinue = 'true';
    button.textContent = label;
    button.addEventListener('click', () => this.commit('continue', null));
    item.append(button);
    return item;
  }

  private buildSecondary(action: JourneySecondaryActionPresentation): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'journey-overlay__secondary-action';
    button.dataset.journeySecondary = action.id;
    button.textContent = action.label;
    button.disabled = action.disabled === true;
    button.addEventListener('click', () => this.commit('secondary', action.id));
    return button;
  }

  private commit(kind: JourneyCommitKind, id: string | null): void {
    if (this.committed || this.disposed) return;
    this.committed = true;
    this.element.classList.add('journey-overlay--committed');
    for (const button of this.element.querySelectorAll('button')) button.disabled = true;
    this.callbacks.onCommit({ kind, id });
  }
}
