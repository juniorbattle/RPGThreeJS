export class NarrativeUtilityDock {
  private element: HTMLElement | null = null;

  constructor(private readonly root: HTMLElement) {}

  mount(element: HTMLElement): void {
    this.dispose();
    this.element = element;
    this.element.classList.add('narrative-utility-dock');
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'Utilitaires de la chronique');
    this.element.hidden = false;
    this.root.append(this.element);
  }

  dispose(): void {
    if (!this.element) return;
    this.element.remove();
    this.element.classList.remove('narrative-utility-dock');
    this.element.removeAttribute('role');
    this.element.removeAttribute('aria-label');
    this.element = null;
  }
}
