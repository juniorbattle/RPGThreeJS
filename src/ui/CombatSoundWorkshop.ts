import { COMBAT_SOUND_IDS, type CombatSoundId } from './GameSoundCatalog';
import type { CombatSoundSource, UiSoundPlayer } from './UiSoundPlayer';
import './ui-sound.css';

/** French names of the sixteen approved combat families. */
export const COMBAT_SOUND_LABELS: Readonly<Record<CombatSoundId, string>> = {
  step: 'Pas', 'light-blade': 'Lame légère', 'heavy-weapon': 'Arme lourde', thrust: 'Estoc', 'bow-release': 'Tir à l’arc',
  'magic-cast': 'Incantation', 'magic-impact': 'Impact magique', 'physical-impact': 'Impact physique', miss: 'Coup manqué',
  critical: 'Critique', 'status-negative': 'Altération', support: 'Soutien', knockout: 'K.O.', 'player-turn': 'Tour du joueur',
  victory: 'Victoire', defeat: 'Défaite',
};

/**
 * Comparison workshop (OD-2026-10-29-B): the operator listens to each family from its file candidate and from its
 * synthesized alternative, and chooses the source. Previews play only on an explicit click; choosing a source never
 * plays anything. Preferences stay outside GameState; this dialog owns focus only while open.
 */
export class CombatSoundWorkshop {
  private element: HTMLElement | null = null;
  private restore: (() => void) | null = null;
  constructor(private readonly root: HTMLElement, private readonly player: UiSoundPlayer) {}

  open(): void {
    if (this.element) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...this.root.children].map(child => ({ child: child as HTMLElement, inert: (child as HTMLElement).inert }));
    for (const { child } of siblings) child.inert = true;
    const element = document.createElement('div'); element.className = 'ui-sound-backdrop';
    const rows = COMBAT_SOUND_IDS.map(id => `<tr data-family="${id}"><th scope="row">${COMBAT_SOUND_LABELS[id]}</th>`
      + `<td><button type="button" data-preview="file" aria-label="Écouter le fichier : ${COMBAT_SOUND_LABELS[id]}">Fichier ▶</button></td>`
      + `<td><button type="button" data-preview="synth" aria-label="Écouter la synthèse : ${COMBAT_SOUND_LABELS[id]}">Synthèse ▶</button></td>`
      + `<td><select data-source aria-label="Source retenue : ${COMBAT_SOUND_LABELS[id]}"><option value="file">Fichier</option><option value="synth">Synthèse</option></select></td></tr>`).join('');
    element.innerHTML = `<section class="ui-sound-settings combat-sound-workshop" role="dialog" aria-modal="true" aria-labelledby="combat-sound-workshop-title"><h2 id="combat-sound-workshop-title">Comparer les sons de combat</h2><p data-workshop-status role="status"></p><div class="combat-sound-workshop__table"><table><thead><tr><th scope="col">Famille</th><th scope="col">Fichier</th><th scope="col">Synthèse</th><th scope="col">Retenu</th></tr></thead><tbody>${rows}</tbody></table></div><div class="combat-sound-workshop__all"><button type="button" data-all="file">Tout en fichier</button><button type="button" data-all="synth">Tout en synthèse</button></div><label for="combat-sound-summary">Choix à me transmettre</label><textarea id="combat-sound-summary" readonly rows="3"></textarea><button type="button" data-workshop-close>Fermer</button></section>`;
    this.root.append(element); this.element = element;
    this.restore = () => {
      for (const { child, inert } of siblings) if (child.isConnected) child.inert = inert;
      if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
    const status = element.querySelector<HTMLElement>('[data-workshop-status]')!;
    const summary = element.querySelector<HTMLTextAreaElement>('#combat-sound-summary')!;
    const refresh = () => {
      for (const row of element.querySelectorAll<HTMLTableRowElement>('tr[data-family]')) {
        const id = row.dataset.family as CombatSoundId;
        row.querySelector<HTMLSelectElement>('[data-source]')!.value = this.player.combatSource(id);
        for (const button of row.querySelectorAll<HTMLButtonElement>('[data-preview]')) {
          button.disabled = !this.player.enabled || !this.player.comparisonReady(id, button.dataset.preview as CombatSoundSource);
        }
      }
      const synth = COMBAT_SOUND_IDS.filter(id => this.player.combatSource(id) === 'synth');
      summary.value = synth.length
        ? `Synthèse : ${synth.join(', ')}. Fichier : ${COMBAT_SOUND_IDS.filter(id => !synth.includes(id)).join(', ') || 'aucune'}.`
        : 'Fichier pour les 16 familles.';
    };
    if (!this.player.enabled) status.textContent = 'Activez les sons dans « Sons » pour écouter les deux versions.';
    else {
      status.textContent = 'Préparation des deux versions…';
      void this.player.prepareCombatComparison().then(ready => {
        if (!this.element) return;
        status.textContent = ready ? 'Écoutez chaque famille dans les deux versions, puis choisissez celle à garder.' : 'Le son n’est pas disponible : cliquez dans la page puis rouvrez l’atelier.';
        refresh();
      });
    }
    element.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const preview = target.closest<HTMLButtonElement>('[data-preview]');
      if (preview) {
        const id = preview.closest<HTMLTableRowElement>('tr')!.dataset.family as CombatSoundId;
        this.player.preview(id, preview.dataset.preview as CombatSoundSource);
        return;
      }
      const all = target.closest<HTMLButtonElement>('[data-all]');
      if (all) { for (const id of COMBAT_SOUND_IDS) this.player.setCombatSource(id, all.dataset.all as CombatSoundSource); refresh(); return; }
      if (target.closest('[data-workshop-close]')) this.close();
    });
    element.addEventListener('change', event => {
      const select = (event.target as HTMLElement).closest<HTMLSelectElement>('[data-source]');
      if (!select) return;
      this.player.setCombatSource(select.closest<HTMLTableRowElement>('tr')!.dataset.family as CombatSoundId, select.value as CombatSoundSource);
      refresh();
    });
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); }
      if (event.key === 'Tab') {
        const controls = [...element.querySelectorAll<HTMLElement>('button:not(:disabled),select,textarea')], first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    refresh();
    element.querySelector<HTMLElement>('select[data-source]')?.focus();
  }

  close(): void { this.element?.remove(); this.element = null; this.restore?.(); this.restore = null; }
}
