import { UiSoundPlayer } from './UiSoundPlayer';
import './ui-sound.css';

/** Reduced motion as the settings menu sees it; the game owns the value (OD-2026-11-05-B). */
export interface MotionSettingAccess {
  get(): boolean;
  set(reduced: boolean): void;
}

export interface SettingsMenuOptions {
  motion?: MotionSettingAccess;
}


/**
 * The game's single settings menu (OD-2026-11-05-B): sound, display and controls in one dialog, opened from the title,
 * the map and the combat gear. Settings stay outside GameState; this dialog owns focus only while open.
 */
export class UiSoundSettings {
  private element: HTMLElement | null = null;
  private restore: (() => void) | null = null;
  constructor(private readonly root: HTMLElement, private readonly player: UiSoundPlayer, private readonly options: SettingsMenuOptions = {}) {}

  open(returnFocus?: () => void): void {
    if (this.element) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...this.root.children].map(child => ({ child: child as HTMLElement, inert: (child as HTMLElement).inert }));
    for (const { child } of siblings) child.inert = true;
    const motion = this.options.motion;
    const element = document.createElement('div'); element.className = 'ui-sound-backdrop';
    const tabs: ReadonlyArray<readonly [string, string]> = [['sound', 'Son'], ...(motion ? [['display', 'Affichage'] as const] : []), ['controls', 'Commandes']];
    const panel = (id: string, body: string) => `<div class="ui-settings__panel" role="tabpanel" id="ui-settings-panel-${id}" aria-labelledby="ui-settings-tab-${id}"${id === 'sound' ? '' : ' hidden'}>${body}</div>`;
    element.innerHTML = `<section class="ui-sound-settings ui-settings" role="dialog" aria-modal="true" aria-labelledby="ui-sound-title">`
      + `<h2 id="ui-sound-title">Réglages</h2>`
      + `<div class="ui-settings__tabs" role="tablist" aria-label="Rubriques des réglages">${tabs.map(([id, label]) => `<button type="button" role="tab" id="ui-settings-tab-${id}" data-settings-tab="${id}" aria-controls="ui-settings-panel-${id}" aria-selected="${id === 'sound'}" tabindex="${id === 'sound' ? 0 : -1}">${label}</button>`).join('')}</div>`
      + panel('sound', `<h3 class="ui-sound-settings__group">Effets sonores</h3><p>Sons des menus, de la campagne et des combats. Ils sont actifs et démarrent à votre première action. Vous pouvez jouer entièrement sans son.</p><button type="button" data-sound-toggle aria-pressed="${this.player.enabled}"></button><label for="ui-sound-volume">Volume des sons <output id="ui-sound-value"></output></label><input id="ui-sound-volume" type="range" min="0" max="100" step="5" value="${Math.round(this.player.volume * 100)}">`
        + `<h3 class="ui-sound-settings__group">Musique</h3><p>Musique générée par le jeu. Elle ne démarre qu'après votre première action.</p><button type="button" data-music-toggle aria-pressed="${this.player.musicEnabled}"></button><label for="ui-music-volume">Volume de la musique <output id="ui-music-value"></output></label><input id="ui-music-volume" type="range" min="0" max="100" step="5" value="${Math.round(this.player.musicVolume * 100)}">`)
      + (motion ? panel('display', `<p>Le mouvement réduit garde une caméra fixe, remplace les déplacements par des fondus et allège les effets des combats. Il s’applique aussi au combat en cours.</p><button type="button" data-motion-toggle aria-pressed="${motion.get()}"></button>`) : '')
      + panel('controls', `<dl class="ui-settings__controls">`
        + `<dt>Clavier</dt><dd>Flèches ou Tabulation pour se déplacer, Entrée pour valider, Échap pour revenir.</dd>`
        + `<dt>Manette</dt><dd>Croix ou stick gauche pour se déplacer, A ou Croix pour valider, B ou Rond pour revenir, LB/RB ou L1/R1 pour la commande voisine, Start ou Options pour le menu de la carte.</dd>`
        + `<dt>Clavier en combat</dt><dd>M pour se déplacer, A pour attaquer, U pour annuler le déplacement ; l’aide du combat détaille le reste.</dd></dl>`)
      + `<button type="button" data-sound-close>Fermer</button></section>`;
    this.root.append(element); this.element = element;
    this.restore = () => {
      for (const { child, inert } of siblings) if (child.isConnected) child.inert = inert;
      if (returnFocus) returnFocus();
      else if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
    const toggle = element.querySelector<HTMLButtonElement>('[data-sound-toggle]')!;
    const musicToggle = element.querySelector<HTMLButtonElement>('[data-music-toggle]')!;
    const motionToggle = element.querySelector<HTMLButtonElement>('[data-motion-toggle]');
    const refresh = () => {
      toggle.textContent = this.player.enabled ? 'Couper les sons' : 'Activer les sons';
      toggle.setAttribute('aria-pressed', String(this.player.enabled));
      element.querySelector('#ui-sound-value')!.textContent = `${Math.round(this.player.volume * 100)} %`;
      musicToggle.textContent = this.player.musicEnabled ? 'Couper la musique' : 'Activer la musique';
      musicToggle.setAttribute('aria-pressed', String(this.player.musicEnabled));
      element.querySelector('#ui-music-value')!.textContent = `${Math.round(this.player.musicVolume * 100)} %`;
      if (motionToggle && motion) {
        const reduced = motion.get();
        motionToggle.textContent = reduced ? 'Mouvement réduit : activé' : 'Mouvement réduit : désactivé';
        motionToggle.setAttribute('aria-pressed', String(reduced));
      }
    };
    toggle.addEventListener('click', event => { this.player.setEnabled(!this.player.enabled, event); refresh(); });
    element.querySelector<HTMLInputElement>('#ui-sound-volume')!.addEventListener('input', event => { this.player.setVolume(Number((event.target as HTMLInputElement).value) / 100); refresh(); });
    musicToggle.addEventListener('click', event => { this.player.setMusicEnabled(!this.player.musicEnabled, event); refresh(); });
    element.querySelector<HTMLInputElement>('#ui-music-volume')!.addEventListener('input', event => { this.player.setMusicVolume(Number((event.target as HTMLInputElement).value) / 100); refresh(); });
    motionToggle?.addEventListener('click', () => { if (!motion) return; motion.set(!motion.get()); this.player.play('confirm'); refresh(); });
    const tabButtons = [...element.querySelectorAll<HTMLButtonElement>('[data-settings-tab]')];
    const select = (tab: HTMLButtonElement, focus = true) => {
      for (const button of tabButtons) {
        const selected = button === tab;
        button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
        element.querySelector<HTMLElement>(`#${button.getAttribute('aria-controls')}`)!.hidden = !selected;
      }
      if (focus) tab.focus();
    };
    for (const tab of tabButtons) {
      tab.addEventListener('click', () => { if (tab.getAttribute('aria-selected') !== 'true') this.player.play('navigate'); select(tab); });
      tab.addEventListener('keydown', event => {
        const index = tabButtons.indexOf(tab);
        const next = event.key === 'ArrowRight' ? tabButtons[(index + 1) % tabButtons.length] : event.key === 'ArrowLeft' ? tabButtons[(index - 1 + tabButtons.length) % tabButtons.length]
          : event.key === 'Home' ? tabButtons[0] : event.key === 'End' ? tabButtons.at(-1) : undefined;
        if (!next) return;
        event.preventDefault();
        if (next !== tab) this.player.play('navigate');
        select(next);
      });
    }
    element.querySelector('[data-sound-close]')!.addEventListener('click', () => { this.player.play('back'); this.close(); });
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.player.play('back'); this.close(); }
      if (event.key === 'Tab') {
        const controls = [...element.querySelectorAll<HTMLElement>('button,input')].filter(control => control.tabIndex >= 0 && !control.closest('[hidden]')), first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    refresh(); toggle.focus();
  }

  /** Restoring may redraw the screen behind, which closes this menu again: the restore runs once, after the menu is gone. */
  close(): void { const restore = this.restore; this.restore = null; this.element?.remove(); this.element = null; restore?.(); }
}
