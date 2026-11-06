// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { GameApp } from './GameApp';
import { createInitialState } from './store';
import { dialogues } from './content';
import { getEquippedWeaponTier, isSkillUnlockedForHero } from './catalog';
import type { NarrativeEffect } from './types';

// OD-2026-11-05-D: Garen joins after the last refuge, so he brings his own T2 spear; Cedric still starts as a novice.
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

function recruitEffects(dialogueId: string, unitId: string): NarrativeEffect[] {
  for (const step of dialogues.get(dialogueId)!.steps) {
    for (const choice of step.choices ?? []) {
      if (choice.effects.some((effect) => effect.type === 'recruitUnit' && effect.unitId === unitId)) return choice.effects;
    }
  }
  throw new Error(`No recruitment of ${unitId} in ${dialogueId}`);
}

function harness() {
  const state = createInitialState();
  const app = Object.assign(Object.create(GameApp.prototype), { state, mode: 'NARRATIVE', saves: { saveAuto: vi.fn() } }) as unknown as { applyEffects(effects: NarrativeEffect[]): Promise<void> };
  return { app, state };
}

it('recruits Garen through his authored choice with the Lance du Griffon and his 3 AP skill', async () => {
  const { app, state } = harness();
  await app.applyEffects(recruitEffects('mystery_lancer_recruit', 'lancer'));
  const garen = state.clan.members.find((unit) => unit.definitionId === 'lancer')!;
  expect(garen.equipment.weaponIds).toEqual(['griffon_spear']);
  expect(getEquippedWeaponTier(garen)).toBe(2);
  expect(isSkillUnlockedForHero(garen, 'l_haft_recoil')).toBe(true);
  expect(state.inventory.weapons.griffon_spear ?? 0).toBe(0);
});

it('recruits Cedric with his novice dagger, to be improved at the refuges', async () => {
  const { app, state } = harness();
  await app.applyEffects(recruitEffects('mystery_recruit', 'rogue'));
  const cedric = state.clan.members.find((unit) => unit.definitionId === 'rogue')!;
  expect(cedric.equipment.weaponIds).toEqual(['novice_dagger']);
});
