import { UiSoundPlayer } from './UiSoundPlayer';
import './ui-sound.css';

/** Settings stay outside GameState; this dialog owns focus only while open. */
export class UiSoundSettings {
  private element: HTMLElement | null = null;
  private restore: (() => void) | null = null;
  constructor(private readonly root: HTMLElement, private readonly player: UiSoundPlayer) {}

  open(returnFocus?: () => void): void {
    if (this.element) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...this.root.children].map(child => ({ child: child as HTMLElement, inert: (child as HTMLElement).inert }));
    for (const { child } of siblings) child.inert = true;
    const element = document.createElement('div'); element.className = 'ui-sound-backdrop';
    element.innerHTML = `<section class="ui-sound-settings" role="dialog" aria-modal="true" aria-labelledby="ui-sound-title"><h2 id="ui-sound-title">Sons du jeu</h2><p>Sons des menus, de la campagne et des combats. Vous pouvez jouer entièrement sans son.</p><button type="button" data-sound-toggle aria-pressed="${this.player.enabled}"></button><label for="ui-sound-volume">Volume des sons <output id="ui-sound-value"></output></label><input id="ui-sound-volume" type="range" min="0" max="100" step="5" value="${Math.round(this.player.volume * 100)}"><button type="button" data-sound-close>Fermer</button></section>`;
    this.root.append(element); this.element = element;
    this.restore = () => {
      for (const { child, inert } of siblings) if (child.isConnected) child.inert = inert;
      if (returnFocus) returnFocus();
      else if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
    const toggle = element.querySelector<HTMLButtonElement>('[data-sound-toggle]')!;
    const refresh = () => {
      toggle.textContent = this.player.enabled ? 'Couper les sons' : 'Activer les sons';
      toggle.setAttribute('aria-pressed', String(this.player.enabled));
      element.querySelector('output')!.textContent = `${Math.round(this.player.volume * 100)} %`;
    };
    toggle.addEventListener('click', event => { this.player.setEnabled(!this.player.enabled, event); refresh(); });
    element.querySelector<HTMLInputElement>('input')!.addEventListener('input', event => { this.player.setVolume(Number((event.target as HTMLInputElement).value) / 100); refresh(); });
    element.querySelector('[data-sound-close]')!.addEventListener('click', () => { this.player.play('back'); this.close(); });
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.player.play('back'); this.close(); }
      if (event.key === 'Tab') {
        const controls = [...element.querySelectorAll<HTMLElement>('button,input')], first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    refresh(); toggle.focus();
  }

  close(): void { this.element?.remove(); this.element = null; this.restore?.(); this.restore = null; }
}
