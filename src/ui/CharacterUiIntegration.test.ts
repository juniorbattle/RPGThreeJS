// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { createUnitInstance } from '../game/catalog';
import { createInitialState } from '../game/store';
import { resolveDialoguePortrait } from './DialoguePortrait';
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

  // Operator, 2026-11-13 (« Oui, les deux »): off combat, the recruitable heroes show their rest pose in the register and
  // as the speaker's portrait, at the company's stature and crop, instead of their action master.
  const RECRUITS: Record<string, string> = { aldric: 'paladin', morvan: 'dark_knight', lyra: 'red_mage', eldwin: 'enchanter', talon: 'ninja', gunnar: 'artillerist' };

  it('shows each recruitable hero’s rest pose in the register, with the company’s upper-body thumbnail', () => {
    const state = createInitialState();
    state.clan.members.push(...Object.values(RECRUITS).map((unitId) => createUnitInstance(unitId, true)));
    const view = new ManagementView({ root: document.body, getState: () => state, onChange: () => undefined });
    void view.open('clan');

    for (const [hero, unitId] of Object.entries(RECRUITS)) {
      const member = state.clan.members.find((unit) => unit.definitionId === unitId)!;
      document.querySelector<HTMLButtonElement>(`.roster-card[data-unit="${member.id}"]`)!.click();
      const card = document.querySelector<HTMLElement>(`.roster-card[data-unit="${member.id}"] .roster-card__portrait`)!;
      const figure = document.querySelector<HTMLElement>('.unit-stage__figure')!;
      expect(figure.querySelector('img')?.getAttribute('src'), hero).toBe(`/assets/characters/pixel/tableau/${hero}.png`);
      expect(figure.dataset.assetOwnership, hero).toBe('REST_POSE_FULL_BODY');
      expect(card.querySelector('img')?.getAttribute('src'), hero).toBe(`/assets/characters/pixel/tableau/${hero}.png`);
      expect(card.dataset.uiCrop, hero).toBe('upper-body');
    }
    const alistair = state.clan.members[0]!;
    document.querySelector<HTMLButtonElement>(`.roster-card[data-unit="${alistair.id}"]`)!.click();
    expect(document.querySelector('.unit-stage__figure img')?.getAttribute('src')).toBe('/assets/characters/pixel/masters/alistair.png');
    expect(document.querySelector<HTMLElement>('.unit-stage__figure')?.dataset.assetOwnership).toBe('MASTER_FULL_BODY');
  });

  it('gives each recruitable hero its rest pose as the speaker’s portrait, and the company its masters', () => {
    for (const hero of Object.keys(RECRUITS)) {
      expect(resolveDialoguePortrait(hero)?.src, hero).toBe(`/assets/characters/pixel/tableau/${hero}.png`);
      expect(resolveDialoguePortrait(hero)?.cropY, hero).toBe('88%');
    }
    expect(resolveDialoguePortrait('alistair')?.src).toBe('/assets/characters/pixel/masters/alistair.png');
  });
});
