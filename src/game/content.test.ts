/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import { campaignNodes, combatConfigs, dialogues } from './content';
import { assets } from '../render/assetManifest';
import { craftRecipes, itemById, units } from './catalog';
import characterQc from '../../public/assets/characters/pixel/canonical-character-qc.json';

interface CharacterAssetProfile {
  full: string;
  dialogue: string;
  ui: string;
  fallback: string;
  dialogueScale: number;
  dialogueSideOffset: string;
  combatHeight: number;
  uiCropMode: string;
}

interface VisualProfile {
  category: 'playable_hero' | 'story_npc' | 'faction_enemy' | 'monster' | 'elite_monster' | 'boss';
  factionId?: string;
  species?: string;
  rarity: 'generic' | 'elite' | 'unique' | 'boss';
  recruitTier?: 'core' | 'optional' | 'late';
  artStatus?: 'pending_art_proxy' | 'approved';
  promotionGate?: string;
  colorPalette: readonly string[];
  silhouetteNotes: string;
}

interface CharacterQcVariant {
  alpha_bbox: [number, number, number, number] | null;
  corner_alpha: [number, number, number, number];
  magenta_pixels: number;
  white_pixels: number;
  white_background_pixels?: number;
  artifact_violet_pixels?: number;
  floor_artifact_pixels?: number;
}

interface CharacterQcEntry {
  variants: Record<'full' | 'dialogue' | 'ui', CharacterQcVariant>;
}

const publicAssetModules = import.meta.glob('../../public/assets/**/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const publicAssets = new Set(Object.keys(publicAssetModules).map((assetPath) => assetPath.replace('../../public', '')));

function expectPublicAsset(assetPath: string, label: string): void {
  expect(assetPath.startsWith('/assets/'), label).toBe(true);
  expect(publicAssets.has(assetPath), label).toBe(true);
}

function collectAssetPaths(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    if (value.startsWith('/assets/')) output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAssetPaths(item, output);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectAssetPaths(item, output);
  }
  return output;
}

describe('campaign content integrity', () => {
  it('only references existing nodes, dialogues and combats', () => {
    const nodeIds = new Set(campaignNodes.map((node) => node.id));

    for (const node of campaignNodes) {
      for (const link of node.links) expect(nodeIds.has(link), `${node.id} -> ${link}`).toBe(true);
      if (node.dialogueId) expect(dialogues.has(node.dialogueId), node.dialogueId).toBe(true);
      if (node.combatId) expect(combatConfigs.has(node.combatId), node.combatId).toBe(true);
    }

    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        for (const effect of step.effects) {
          if (effect.type === 'startCombat') expect(combatConfigs.has(effect.combatId), `${dialogue.id}:${step.id}`).toBe(true);
        }
        for (const choice of step.choices ?? []) {
          for (const effect of choice.effects) {
            if (effect.type === 'startCombat') expect(combatConfigs.has(effect.combatId), `${dialogue.id}:${step.id}:${choice.text}`).toBe(true);
          }
        }
      }
    }
  });

  it('routes the first refuge into the village objective branches', () => {
    const refuge = campaignNodes.find((node) => node.id === 'lion-first-refuge');
    expect(refuge?.links).toContain('lion-valmir-road');
    expect(refuge?.links).toContain('lion-reserve-trail');
    expect(refuge?.links).not.toContain('lion-final-judgement');
  });

  it('keeps route and dialogue choices limited to two impactful options', () => {
    expect(campaignNodes.every((node) => node.links.length <= 2)).toBe(true);
    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        expect(step.choices?.length ?? 0, `${dialogue.id}:${step.id}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('uses explicit existing narrative art and dialogue actors', () => {
    const dialogueScenes = assets.dialogueScenes as Record<string, string>;
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;

    for (const dialogue of dialogues.values()) {
      expect(dialogue.sceneArtId, dialogue.id).toBeTruthy();
      expect(dialogueScenes[dialogue.sceneArtId ?? ''], dialogue.id).toBeTruthy();
      expectPublicAsset(dialogueScenes[dialogue.sceneArtId ?? '']!, dialogue.id);

      for (const step of dialogue.steps) {
        expect(step.actorId, `${dialogue.id}:${step.id}`).toBeTruthy();
        expect(dialogueActors[step.actorId ?? ''], `${dialogue.id}:${step.id}`).toBeTruthy();
        expectPublicAsset(dialogueActors[step.actorId ?? '']!, `${dialogue.id}:${step.id}`);
        expect(characterProfiles[step.actorId ?? '']?.dialogue, `${dialogue.id}:${step.id}`).toBe(dialogueActors[step.actorId ?? '']);
      }
    }
  });

  it('assigns each combat to an existing painted combat scene', () => {
    const combatScenes = assets.combatScenes as Record<string, string>;

    for (const combat of combatConfigs.values()) {
      expect(combat.sceneId, combat.id).toBeTruthy();
      expect(combatScenes[combat.sceneId], `${combat.id}:${combat.sceneId}`).toBeTruthy();
      expectPublicAsset(combatScenes[combat.sceneId]!, `${combat.id}:${combat.sceneId}`);
    }
  });

  it('defines encounter ranks and measured red gem rewards for every combat', () => {
    const expectedGemRewards = { normal: 1, elite: 2, boss: 4 } as const;

    for (const combat of combatConfigs.values()) {
      expect(['normal', 'elite', 'boss']).toContain(combat.encounterRank);
      expect(combat.rewards.materials.red_gem, combat.id).toBe(expectedGemRewards[combat.encounterRank]);
      if (combat.encounterRank === 'boss') expect(combat.isBoss, combat.id).toBe(true);
    }
  });

  it('keeps craft recipes data-driven and backed by existing items', () => {
    expect(craftRecipes.length).toBeGreaterThanOrEqual(4);
    for (const recipe of craftRecipes) {
      expect(itemById.has(recipe.output.itemId), `${recipe.id}:output`).toBe(true);
      expect(recipe.inputs.gold, `${recipe.id}:gold`).toBeGreaterThan(0);
      for (const itemId of Object.keys(recipe.inputs.weapons ?? {})) {
        expect(itemById.get(itemId)?.category, `${recipe.id}:${itemId}`).toBe('weapons');
      }
      for (const itemId of Object.keys(recipe.inputs.accessories ?? {})) {
        expect(itemById.get(itemId)?.category, `${recipe.id}:${itemId}`).toBe('accessories');
      }
      expect(['weapons', 'accessories']).toContain(recipe.output.category);
    }
  });

  it('uses existing pixel character assets for playable units', () => {
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const qc = characterQc as unknown as Record<string, CharacterQcEntry>;

    for (const [id, profile] of Object.entries(characterProfiles)) {
      expect(visualProfiles[id], `${id}:visualProfile`).toBeTruthy();
      expectPublicAsset(profile.full, `${id}:full`);
      expectPublicAsset(profile.dialogue, `${id}:dialogue`);
      expectPublicAsset(profile.ui, `${id}:ui`);
      expectPublicAsset(profile.fallback, `${id}:fallback`);
      expect(profile.dialogueScale, `${id}:dialogueScale`).toBeGreaterThan(0);
      expect(profile.combatHeight, `${id}:combatHeight`).toBeGreaterThan(0);
      expect(profile.uiCropMode, `${id}:uiCropMode`).toBe('contain');

      for (const variant of ['full', 'dialogue', 'ui'] as const) {
        const metrics = qc[id]?.variants[variant];
        expect(metrics?.alpha_bbox, `${id}:${variant}:alpha`).toBeTruthy();
        expect(metrics?.corner_alpha, `${id}:${variant}:corners`).toEqual([0, 0, 0, 0]);
        expect(metrics?.magenta_pixels, `${id}:${variant}:magenta`).toBe(0);
        expect(metrics?.floor_artifact_pixels ?? 0, `${id}:${variant}:floorArtifact`).toBe(0);
        expect(metrics?.white_background_pixels ?? 0, `${id}:${variant}:whiteBackground`).toBe(0);
      }
    }

    const heroProfileIds = new Set<string>();
    const heroFullPaths = new Set<string>();
    for (const unit of units) {
      expect(unit.visualProfileId, `${unit.id}:visualProfileId`).toBeTruthy();
      const visualProfile = visualProfiles[unit.visualProfileId];
      expect(visualProfile, `${unit.id}:visualProfile`).toBeTruthy();
      expect(visualProfile?.category, `${unit.id}:category`).toBe('playable_hero');
      expect(visualProfile?.rarity, `${unit.id}:rarity`).toBe('unique');
      expect(['core', 'optional', 'late']).toContain(unit.recruitTier);
      expect(characterProfiles[unit.visualProfileId]?.full, `${unit.id}:fullProfile`).toBe(unit.portrait);
      heroProfileIds.add(unit.visualProfileId);
      heroFullPaths.add(unit.portrait);
      expect(unit.portrait, unit.id).toContain('/assets/characters/pixel/full/');
      expectPublicAsset(unit.portrait, unit.id);
    }
    expect(heroProfileIds.size).toBe(units.length);

    for (const [id, profile] of Object.entries(visualProfiles)) {
      expect(profile.colorPalette.length, `${id}:palette`).toBeGreaterThan(0);
      expect(profile.silhouetteNotes.length, `${id}:silhouette`).toBeGreaterThan(0);
      if (profile.category !== 'playable_hero') {
        const fullPath = characterProfiles[id]?.full;
        expect(fullPath, `${id}:profileAsset`).toBeTruthy();
        expect(heroFullPaths.has(fullPath ?? ''), `${id}:sharesHeroSprite`).toBe(false);
      }
      if (profile.category === 'boss' || profile.category === 'elite_monster') {
        expect(['elite', 'boss']).toContain(profile.rarity);
        expect(characterProfiles[id]?.combatHeight, `${id}:combatHeight`).toBeGreaterThan(2.2);
      }
    }
  });

  it('keeps validation and rejected sprite work out of runtime manifests', () => {
    for (const assetPath of collectAssetPaths(assets)) {
      expect(assetPath, `${assetPath}:validationLeak`).not.toContain('/validation/');
      expect(assetPath, `${assetPath}:rejectedLeak`).not.toContain('/rejected/');
    }
  });

  it('keeps pending generic Serpent sprites out of runtime until approved', () => {
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    const pendingProfileIds = new Set(['serpent_raider', 'serpent_brute', 'serpent_oracle']);

    for (const id of pendingProfileIds) {
      expect(visualProfiles[id], `${id}:visualProfile`).toBeUndefined();
      expect(characterProfiles[id], `${id}:characterProfile`).toBeUndefined();
      expect(dialogueActors[id], `${id}:dialogueActor`).toBeUndefined();
    }

    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        if (step.actorId) expect(pendingProfileIds.has(step.actorId), `${dialogue.id}:${step.id}:${step.actorId}`).toBe(false);
      }
    }

    for (const combat of combatConfigs.values()) {
      for (const id of combat.enemyVisualIds) {
        expect(pendingProfileIds.has(id), `${combat.id}:${id}:enemyVisualIds`).toBe(false);
      }
      for (const id of combat.escortVisualIds) {
        expect(pendingProfileIds.has(id), `${combat.id}:${id}:escortVisualIds`).toBe(false);
      }
      if (combat.bossVisualId) {
        expect(pendingProfileIds.has(combat.bossVisualId), `${combat.id}:${combat.bossVisualId}:bossVisualId`).toBe(false);
      }
    }

  });

  it('declares valid visual compositions for faction, monster, elite and boss encounters', () => {
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const expectedMonsterIds = ['wolf', 'venom_serpent', 'goblin', 'skeleton'];
    const expectedEliteIds = ['troll', 'young_wyrm', 'undead_champion'];

    for (const id of expectedMonsterIds) {
      expect(visualProfiles[id]?.category, `${id}:category`).toBe('monster');
      expect(characterProfiles[id]?.full, `${id}:asset`).toBeTruthy();
    }
    for (const id of expectedEliteIds) {
      expect(visualProfiles[id]?.category, `${id}:category`).toBe('elite_monster');
      expect(visualProfiles[id]?.rarity, `${id}:rarity`).toBe('elite');
      expect(characterProfiles[id]?.combatHeight, `${id}:combatHeight`).toBeGreaterThan(2.2);
    }

    for (const combat of combatConfigs.values()) {
      for (const id of combat.enemyVisualIds) {
        expect(characterProfiles[id], `${combat.id}:${id}:asset`).toBeTruthy();
        const visualProfile = visualProfiles[id];
        expect(visualProfile, `${combat.id}:${id}:visualProfile`).toBeTruthy();
        expect(visualProfile?.category, `${combat.id}:${id}:notHero`).not.toBe('playable_hero');
      }
      for (const id of combat.escortVisualIds) {
        expect(characterProfiles[id], `${combat.id}:${id}:asset`).toBeTruthy();
        const visualProfile = visualProfiles[id];
        expect(visualProfile, `${combat.id}:${id}:visualProfile`).toBeTruthy();
        expect(visualProfile?.category, `${combat.id}:${id}:notHero`).not.toBe('playable_hero');
      }
      if (combat.isBoss) {
        expect(combat.bossVisualId, `${combat.id}:bossVisualId`).toBeTruthy();
        expect(visualProfiles[combat.bossVisualId ?? '']?.category, `${combat.id}:bossCategory`).toBe('boss');
        expect(characterProfiles[combat.bossVisualId ?? '']?.combatHeight, `${combat.id}:bossHeight`).toBeGreaterThan(2.2);
      }
    }
  });

  it('keeps all character pixel asset paths within runtime folders', () => {
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const allPaths: string[] = [];
    for (const profile of Object.values(characterProfiles)) {
      allPaths.push(profile.full, profile.dialogue, profile.ui, profile.fallback);
    }
    for (const path of allPaths) {
      expect(path, `path:${path}`).toMatch(/\/assets\/characters\/pixel\/(full|dialogue|ui)\//);
      expectPublicAsset(path, `path:${path}`);
    }
  });
});
