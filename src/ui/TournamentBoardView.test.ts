// @vitest-environment happy-dom
/**
 * Set 1.20.0 (UI_AND_ACCESSIBILITY "Post-demo surfaces"), post-demo Lot 4: the encounter board states each fight, its
 * order and its result in text, offers one native button for the step RunSystem names next, and decides nothing.
 */
import { describe, expect, it, vi } from 'vitest';
import { nextTournamentStep, tournamentBoard } from '../game/finalAct';
import { createInitialState } from '../game/store';
import { openTournamentBoard, renderTournamentBoard, tournamentStepLabel } from './TournamentBoardView';

describe('the Tournament encounter board (set 1.20.0, Lot 4)', () => {
  it('states every fight, its order, status and result in text, and marks its provisional image', () => {
    const state = createInitialState();
    Object.assign(state.flags, { finaleTournamentEntered: true, finaleRavenBoutWon: true, finaleRavenSpared: true });
    const html = renderTournamentBoard(tournamentBoard(state), nextTournamentStep(state), { mark: 'Brouillon · image provisoire' });
    const root = document.createElement('div');
    root.innerHTML = html;
    const rows = [...root.querySelectorAll('[data-board-entry]')].map((row) => row.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual([
      '1 Champion du Corbeau Terminé Victoire · champion relevé',
      '2 Champion du Loup Prochain combat À combattre',
      '3 Champion du Phénix À venir À venir',
      '4 Finale : champion du Serpent À venir À venir',
      '5 La brèche s’ouvre À venir À venir',
    ]);
    expect(root.querySelector('[aria-current="step"]')!.getAttribute('data-board-entry')).toBe('finale-bout-wolf');
    expect(root.querySelector('[data-provisional-art]')!.textContent).toBe('Brouillon · image provisoire');
  });

  it('shows the final act’s own arena with no provisional mark once its image is final (OD-2026-11-11-F, F1)', () => {
    const state = createInitialState();
    const root = document.createElement('div');
    root.innerHTML = renderTournamentBoard(tournamentBoard(state), nextTournamentStep(state),
      { backdrop: '/assets/generated/post-demo/finale/surfaces/tableau-des-rencontres-du-tournoi.webp', mark: null });
    expect(root.querySelector('[data-provisional-art]')).toBeNull();
    expect(root.querySelector('.tournament-board')!.getAttribute('style')).toContain('tableau-des-rencontres-du-tournoi.webp');
  });

  it('names the next step as RunSystem gives it, and wires native buttons with focus on it', () => {
    const state = createInitialState();
    expect(tournamentStepLabel(nextTournamentStep(state))).toBe('Combattre : Champion du Corbeau');
    state.flags.finaleRavenBoutWon = true;
    expect(tournamentStepLabel(nextTournamentStep(state))).toBe('Rendre le verdict : Champion du Corbeau');
    expect(tournamentStepLabel(null)).toBe('Quitter l’arène');
    const root = document.createElement('div');
    document.body.append(root);
    const handlers = { onNext: vi.fn(), onCompany: vi.fn(), onSave: vi.fn(), onSettings: vi.fn(), onMenu: vi.fn() };
    openTournamentBoard(root, tournamentBoard(state), nextTournamentStep(state), handlers, { mark: 'Image provisoire' });
    expect(document.activeElement?.getAttribute('data-board-action')).toBe('next');
    for (const action of ['next', 'company', 'save', 'settings', 'menu']) root.querySelector<HTMLButtonElement>(`[data-board-action="${action}"]`)!.click();
    expect(Object.values(handlers).every((handler) => handler.mock.calls.length === 1)).toBe(true);
    root.remove();
  });
});
