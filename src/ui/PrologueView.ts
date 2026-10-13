import { prologuePanels } from '../game/prologue';
import { assets } from '../render/assetManifest';

export class PrologueView {
  private element: HTMLElement | null = null;
  private index = 0;
  private resolveOpen: (() => void) | null = null;

  constructor(private readonly root: HTMLElement) {}

  open(): Promise<void> {
    this.close();
    this.index = 0;
    this.element = document.createElement('section');
    this.element.className = 'prologue-view';
    this.element.setAttribute('aria-label', 'Prologue');
    this.element.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);
    this.root.append(this.element);
    this.render();

    return new Promise((resolve) => {
      this.resolveOpen = resolve;
    });
  }

  close(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.handleClick);
      this.element.remove();
      this.element = null;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.resolveOpen) {
      const resolve = this.resolveOpen;
      this.resolveOpen = null;
      resolve();
    }
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-prologue-skip]')) {
      this.finish();
      return;
    }
    this.next();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.element) return;
    if (event.key === 'Escape') {
      this.finish();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.next();
    }
  };

  private next(): void {
    if (this.index >= prologuePanels.length - 1) {
      this.finish();
      return;
    }
    this.index += 1;
    this.render();
  }

  private finish(): void {
    this.close();
  }

  private render(): void {
    if (!this.element) return;
    const panel = prologuePanels[this.index];
    if (!panel) return;
    const scenePath = (assets.prologueScenes as Record<string, string>)[panel.id];
    this.element.style.setProperty('--prologue-bg-image', `url("${scenePath}")`);
    this.element.dataset.panel = panel.id;
    this.element.innerHTML = `
      <div class="prologue-view__painted" aria-hidden="true"></div>
      <div class="prologue-view__mist" aria-hidden="true"></div>
      <button class="prologue-view__skip" type="button" data-prologue-skip>Passer</button>
      <article class="prologue-view__card" aria-live="polite">
        <p class="prologue-view__eyebrow">${panel.eyebrow}</p>
        <h1>${panel.title}</h1>
        <p>${panel.body}</p>
        <footer>
          <span>${this.index + 1} / ${prologuePanels.length}</span>
          <span>Cliquer ou Entrée pour avancer</span>
        </footer>
      </article>
    `;
  }
}
