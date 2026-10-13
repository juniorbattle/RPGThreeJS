// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { createUnitInstance } from '../game/catalog';
import { createInitialState } from '../game/store';
import { ManagementView } from './ManagementView';
import { TravelView } from './TravelView';

function fullPlayableParty() {
  const state = createInitialState();
  state.clan.members.push(createUnitInstance('rogue', true), createUnitInstance('lancer', true));
  return state;
}

describe('Character System V2 non-combat UI integration', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('uses a runtime upper-body crop for all six playable roster thumbnails', () => {
    const state = fullPlayableParty();
    const view = new ManagementView({
      root: document.body,
      getState: () => state,
      onChange: () => undefined,
    });
    void view.open('clan');

    const portraits = [...document.querySelectorAll<HTMLElement>('.roster-card__portrait')];
    expect(portraits).toHaveLength(6);
    expect(portraits.every((portrait) => portrait.dataset.uiCrop === 'upper-body')).toBe(true);
    expect(portraits.map((portrait) => portrait.querySelector('img')?.getAttribute('src'))).toEqual([
      '/assets/characters/pixel/masters/alistair.png',
      '/assets/characters/pixel/masters/white_mage.png',
      '/assets/characters/pixel/masters/dark_mage.png',
      '/assets/characters/pixel/masters/archer.png',
      '/assets/characters/pixel/masters/rogue.png',
      '/assets/characters/pixel/masters/lancer.png',
    ]);
  });

  it('keeps TravelView on Master full-body ownership for heroes and advisors', () => {
    const state = fullPlayableParty();
    const view = new TravelView({
      root: document.body,
      getState: () => state,
      onSelect: async () => undefined,
      onOpenClan: () => undefined,
      onSave: () => undefined,
      onOpenMenu: () => undefined,
    });
    view.open();

    const actors = [...document.querySelectorAll<HTMLElement>('.travel-hero')];
    expect(document.querySelector('.travel-party')?.getAttribute('data-presentation-scale')).toBe('ENLARGED_COMPANY_LINEUP');
    expect(actors).toHaveLength(8);
    expect(actors.every((actor) => actor.dataset.assetOwnership === 'MASTER_FULL_BODY')).toBe(true);
    expect(actors.map((actor) => actor.dataset.characterId)).toEqual([
      'alistair', 'marian', 'elara', 'kestrel', 'cedric', 'lancer', 'sage_seraphine', 'maelor',
    ]);
    expect(actors.every((actor) => actor.querySelector('img')?.getAttribute('src')?.includes('/pixel/masters/'))).toBe(true);
  });

  it('marks the featured unit as a full-body Master showcase while preserving roster crops', () => {
    const state = fullPlayableParty();
    const view = new ManagementView({
      root: document.body,
      getState: () => state,
      onChange: () => undefined,
    });
    void view.open('clan');

    const stage = document.querySelector<HTMLElement>('.unit-stage');
    const figure = document.querySelector<HTMLElement>('.unit-stage__figure');
    expect(stage?.dataset.featurePresentation).toBe('MASTER_SHOWCASE');
    expect(figure?.dataset.assetOwnership).toBe('MASTER_FULL_BODY');
    expect(figure?.querySelector('img')?.getAttribute('src')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(document.querySelectorAll('[data-ui-crop="upper-body"]')).toHaveLength(6);
  });
});
