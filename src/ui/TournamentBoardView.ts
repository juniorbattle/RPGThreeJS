/**
 * Set 1.20.0 (UI_AND_ACCESSIBILITY "Post-demo surfaces"), post-demo Lot 4: the Tournament's encounter board.
 *
 * Presentation only. It shows the board RunSystem derives from saved facts (`tournamentBoard`): each fight, its order
 * and its result stated in text, never by colour alone, and one button for the step RunSystem names next. It is not a
 * POI map and not a second navigation mode. Native buttons carry keyboard and gamepad focus; the layout stacks at phone
 * width. The backdrop is a provisional image, marked as such.
 */
import type { TournamentBoard, TournamentStep } from '../game/finalAct';

export interface TournamentBoardHandlers {
  onNext: () => void;
  onCompany: () => void;
  onSave: () => void;
  onSettings: () => void;
  onMenu: () => void;
}

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

const STATUS_LABELS = Object.freeze({ done: 'Terminé', next: 'Prochain combat', after: 'Verdict à rendre', locked: 'À venir' });

/** The button's words for the step RunSystem names next. */
export function tournamentStepLabel(step: TournamentStep | null): string {
  if (!step) return 'Quitter l’arène';
  if (step.action === 'after') return step.entry.kind === 'bout' ? `Rendre le verdict : ${step.entry.label}` : 'Continuer';
  if (step.action === 'opening') return step.entry.label;
  return step.entry.kind === 'final' ? 'Disputer la finale' : `Combattre : ${step.entry.label}`;
}

export function renderTournamentBoard(board: TournamentBoard, step: TournamentStep | null, options: { backdrop?: string; mark: string }): string {
  const rows = board.entries.map((entry, index) => `<li class="tournament-board__entry tournament-board__entry--${entry.status}" data-board-entry="${escape(entry.nodeId)}" data-board-status="${entry.status}"${entry.status === 'next' || entry.status === 'after' ? ' aria-current="step"' : ''}>
      <span class="tournament-board__order" aria-hidden="true">${index + 1}</span>
      <span class="tournament-board__label">${escape(entry.label)}</span>
      <span class="tournament-board__status">${STATUS_LABELS[entry.status]}</span>
      <span class="tournament-board__result">${escape(entry.result)}</span>
    </li>`).join('');
  return `<section class="tournament-board ui-screen" aria-labelledby="tournament-board-title"${options.backdrop ? ` style="--tournament-board-backdrop:url('${escape(options.backdrop)}')"` : ''}>
    <p class="tournament-board__mark" data-provisional-art>${escape(options.mark)}</p>
    <header class="tournament-board__header">
      <p class="tournament-board__eyebrow">Tournoi des Grands</p>
      <h1 id="tournament-board-title">L’Arène des Destins</h1>
      <p class="tournament-board__lead">Le tableau des rencontres. Chaque combat se dispute dans l’ordre ; son résultat reste inscrit.</p>
    </header>
    <ol class="tournament-board__entries" aria-label="Tableau des rencontres">${rows}</ol>
    <div class="tournament-board__actions">
      <button type="button" class="tournament-board__next" data-board-action="next">${escape(tournamentStepLabel(step))}</button>
      <button type="button" data-board-action="company">Compagnie</button>
      <button type="button" data-board-action="save">Sauvegarder</button>
      <button type="button" data-board-action="settings">Réglages</button>
      <button type="button" data-board-action="menu">Écran titre</button>
    </div>
  </section>`;
}

/** Renders the board in a container and wires its buttons; focus goes to the next step. */
export function openTournamentBoard(container: HTMLElement, board: TournamentBoard, step: TournamentStep | null,
  handlers: TournamentBoardHandlers, options: { backdrop?: string; mark: string }): void {
  container.innerHTML = renderTournamentBoard(board, step, options);
  const actions: Record<string, () => void> = {
    next: handlers.onNext, company: handlers.onCompany, save: handlers.onSave, settings: handlers.onSettings, menu: handlers.onMenu,
  };
  container.querySelectorAll<HTMLButtonElement>('[data-board-action]').forEach((button) => {
    button.addEventListener('click', () => actions[button.dataset.boardAction ?? '']?.());
  });
  container.querySelector<HTMLButtonElement>('[data-board-action="next"]')?.focus();
}
