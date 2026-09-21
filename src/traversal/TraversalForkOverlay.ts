import type { RunNode } from '../game/types';

export interface TraversalForkOverlayCallbacks {
  onSelect: (nodeId: string) => void;
}

export interface TraversalForkOverlayOptions {
  root?: HTMLElement;
  eyebrow?: string;
  title?: string;
}

export class TraversalForkOverlay {
  readonly element = document.createElement('section');
  private readonly rail = document.createElement('div');
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private readonly root: HTMLElement;
  private committed = false;
  private disposed = false;

  constructor(
    choices: readonly RunNode[],
    private readonly callbacks: TraversalForkOverlayCallbacks,
    options: TraversalForkOverlayOptions = {},
  ) {
    this.root = options.root ?? document.body;
    this.element.className = 'traversal-fork-overlay';
    this.element.dataset.traversalWorldPreserved = 'true';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'false');
    this.element.setAttribute('aria-label', options.title ?? 'Choisir la route');

    const edgeShade = document.createElement('div');
    edgeShade.className = 'traversal-fork-overlay__edge-shade';
    edgeShade.setAttribute('aria-hidden', 'true');
    this.element.append(edgeShade);

    this.rail.className = 'traversal-fork-overlay__rail';

    const header = document.createElement('header');
    header.className = 'traversal-fork-overlay__header';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'traversal-fork-overlay__eyebrow';
    eyebrow.textContent = options.eyebrow ?? 'Route';
    const title = document.createElement('h2');
    title.className = 'traversal-fork-overlay__title';
    title.textContent = options.title ?? 'Choisir la route';
    header.append(eyebrow, title);
    this.rail.append(header);

    const list = document.createElement('div');
    list.className = 'traversal-fork-overlay__choices';
    for (const [index, choice] of choices.entries()) list.append(this.buildChoice(choice, index));
    this.rail.append(list);
    this.element.append(this.rail);
  }

  get isCommitted(): boolean {
    return this.committed;
  }

  mount(): void {
    this.root.append(this.element);
    this.rail.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.element.remove();
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  private buildChoice(node: RunNode, index: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'traversal-fork-overlay__choice';
    button.dataset.traversalForkChoice = node.id;

    const label = document.createElement('strong');
    label.dataset.direction = index === 0 ? '↖' : '→';
    label.textContent = node.label;
    const category = document.createElement('span');
    category.className = 'traversal-fork-overlay__meta';
    category.textContent = node.type === 'combat' ? 'Piste occupée' : 'Halte en clairière';

    button.append(label, category);
    button.addEventListener('click', () => this.commit(node.id));
    return button;
  }

  private commit(nodeId: string): void {
    if (this.committed || this.disposed) return;
    this.committed = true;
    this.element.classList.add('traversal-fork-overlay--committed');
    for (const button of this.element.querySelectorAll<HTMLButtonElement>('button')) {
      button.disabled = true;
      button.classList.toggle('is-selected', button.dataset.traversalForkChoice === nodeId);
    }
    this.callbacks.onSelect(nodeId);
  }
}
