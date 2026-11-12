// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { RefugeHireView } from '../ui/RefugeHireView';
import { hireAtRefuge, refugeHireOffers } from './refugeRecruitment';
import { createInitialState } from './store';

const metBoth = () => {
  const state = createInitialState();
  state.resolvedNodeIds.push('lion-nomad-crossroads', 'lion-lancer-recruit');
  state.gold = 500;
  state.reputation = 60;
  return state;
};

describe('a second chance at the refuge for heroes met but not recruited (OD-2026-11-11-F, F2)', () => {
  it('offers only the heroes met on the map and not yet in the company', () => {
    expect(refugeHireOffers(createInitialState())).toEqual([]);
    const offers = refugeHireOffers(metBoth());
    expect(offers.map((offer) => [offer.unitId, offer.name, offer.price, offer.blocked])).toEqual([
      ['rogue', 'Cedric', 80, null], ['lancer', 'Garen', 60, null]]);
    expect(offers.every((offer) => offer.reputationMin > 0)).toBe(true);
  });

  it('keeps the meeting’s reputation condition and asks for more gold than the meeting did', () => {
    const state = metBoth();
    state.reputation = 5;
    const cedric = refugeHireOffers(state).find((offer) => offer.unitId === 'rogue')!;
    expect(cedric.blocked).toBe(`Réputation insuffisante : ${cedric.reputationMin} demandés.`);
    state.reputation = 60; state.gold = 70;
    expect(refugeHireOffers(state).find((offer) => offer.unitId === 'rogue')!.blocked).toBe('Or insuffisant : 80 demandés.');
    expect(hireAtRefuge(state, 'rogue')).toBe(false);
    expect(state.gold).toBe(70);
  });

  it('engages a hero once: gold paid, the hero joins, the offer disappears', () => {
    const state = metBoth();
    const before = state.clan.members.length;
    expect(hireAtRefuge(state, 'lancer')).toBe(true);
    expect(state.gold).toBe(440);
    expect(state.clan.members).toHaveLength(before + 1);
    expect(state.clan.members.at(-1)!.definitionId).toBe('lancer');
    expect(refugeHireOffers(state).map((offer) => offer.unitId)).toEqual(['rogue']);
    expect(hireAtRefuge(state, 'lancer')).toBe(false);
  });

  it('lists the offers in an accessible panel that returns the choice, and Escape returns to the refuge', async () => {
    const root = document.createElement('div'); document.body.append(root);
    const view = new RefugeHireView(root);
    const offers = refugeHireOffers(metBoth());
    let choice = view.open(offers, 500);
    const panel = root.querySelector<HTMLElement>('.refuge-hire')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(document.activeElement?.getAttribute('data-hire')).toBe('rogue');
    root.querySelector<HTMLButtonElement>('[data-hire="lancer"]')!.click();
    await expect(choice).resolves.toBe('lancer');
    choice = view.open(offers, 500);
    root.querySelector('.refuge-hire')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await expect(choice).resolves.toBeNull();
    expect(root.querySelector('.refuge-hire')).toBeNull();
    root.remove();
  });
});
