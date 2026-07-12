/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import { campaignNodes, combatConfigs, dialogues } from './content';
import { assets } from '../render/assetManifest';
import { craftRecipes, itemById, units } from './catalog';
import { prologuePanels } from './prologue';
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

function collectTextStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTextStrings(item, output);
    return output;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectTextStrings(item, output);
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

  it('defines a short cinematic prologue backed by existing painted scenes', () => {
    const prologueScenes = assets.prologueScenes as Record<string, string>;
    expect(prologuePanels).toHaveLength(5);

    for (const panel of prologuePanels) {
      expect(panel.eyebrow.length, `${panel.id}:eyebrow`).toBeGreaterThan(0);
      expect(panel.title.length, `${panel.id}:title`).toBeGreaterThan(0);
      expect(panel.body.length, `${panel.id}:body`).toBeGreaterThan(80);
      expect(prologueScenes[panel.id], panel.id).toBeTruthy();
      expectPublicAsset(prologueScenes[panel.id]!, panel.id);
    }
  });

  it('keeps touched narrative content free of mojibake markers', () => {
    const text = collectTextStrings({
      campaignNodes,
      combatConfigs: Array.from(combatConfigs.values()),
      dialogues: Array.from(dialogues.values()),
      prologuePanels,
    }).join('\n');
    for (const marker of ['Ã', 'â€', 'ðŸ', '�']) {
      expect(text, `mojibake:${marker}`).not.toContain(marker);
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
    const minGemRewards = { normal: 1, elite: 2, boss: 5 } as const;

    for (const combat of combatConfigs.values()) {
      expect(['normal', 'elite', 'boss']).toContain(combat.encounterRank);
      expect(combat.rewards.materials.red_gem, combat.id).toBeGreaterThanOrEqual(minGemRewards[combat.encounterRank]);
      if (combat.encounterRank === 'boss') expect(combat.isBoss, combat.id).toBe(true);
    }
  });

  it('keeps bosses and elite opponents unique within every encounter', () => {
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;

    for (const combat of combatConfigs.values()) {
      const visualIds = [
        ...combat.enemyVisualIds,
        ...combat.escortVisualIds,
        ...(combat.bossVisualId ? [combat.bossVisualId] : []),
      ];
      const majorOpponents = visualIds.filter((id) => {
        const profile = visualProfiles[id];
        return profile?.rarity === 'elite' || profile?.rarity === 'boss';
      });

      expect(majorOpponents.length, `${combat.id}:multipleMajorOpponents`).toBeLessThanOrEqual(1);
      if (combat.isBoss) expect(majorOpponents, `${combat.id}:missingBoss`).toHaveLength(1);
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
      expect(assetPath, `${assetPath}:rawLeak`).not.toContain('/raw/');
      expect(assetPath, `${assetPath}:processedLeak`).not.toContain('/processed/');
      expect(assetPath, `${assetPath}:rejectedLeak`).not.toContain('/rejected/');
    }
  });

  it('declares approved generic Serpent sprites as runtime faction enemies', () => {
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const dialogueActors = assets.dialogueActors as Record<string, string>;
    const approvedProfileIds = ['serpent_raider', 'serpent_brute', 'serpent_oracle'];

    for (const id of approvedProfileIds) {
      expect(visualProfiles[id]?.category, `${id}:category`).toBe('faction_enemy');
      expect(visualProfiles[id]?.rarity, `${id}:rarity`).toBe('generic');
      expect(visualProfiles[id]?.artStatus, `${id}:artStatus`).toBe('approved');
      expect(characterProfiles[id]?.full, `${id}:full`).toBe(`/assets/characters/pixel/full/${id}.png`);
      expect(characterProfiles[id]?.dialogue, `${id}:dialogue`).toBe(`/assets/characters/pixel/dialogue/${id}.png`);
      expect(characterProfiles[id]?.ui, `${id}:ui`).toBe(`/assets/characters/pixel/ui/${id}.png`);
      expect(dialogueActors[id], `${id}:dialogueActor`).toBe(`/assets/characters/pixel/dialogue/${id}.png`);
    }

    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        if (step.actorId && approvedProfileIds.includes(step.actorId)) {
          expect(dialogueActors[step.actorId], `${dialogue.id}:${step.id}:${step.actorId}`).toBeTruthy();
        }
      }
    }

    for (const combat of combatConfigs.values()) {
      for (const id of combat.enemyVisualIds) {
        if (approvedProfileIds.includes(id)) expect(characterProfiles[id], `${combat.id}:${id}:enemyVisualIds`).toBeTruthy();
      }
      for (const id of combat.escortVisualIds) {
        if (approvedProfileIds.includes(id)) expect(characterProfiles[id], `${combat.id}:${id}:escortVisualIds`).toBeTruthy();
      }
      if (combat.bossVisualId) {
        expect(approvedProfileIds.includes(combat.bossVisualId), `${combat.id}:${combat.bossVisualId}:bossVisualId`).toBe(false);
      }
    }
  });

  it('promotes validated elite sprites into runtime profiles and demo encounters', () => {
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const expectedRuntimeIds = ['serpent_general_boss', 'serpent_duelist_elite', 'forest_troll_elite', 'young_dragon_elite'];

    for (const id of expectedRuntimeIds) {
      expect(characterProfiles[id], `${id}:profile`).toBeTruthy();
      expect(characterProfiles[id]?.full, `${id}:full`).toBe(`/assets/characters/pixel/full/${id}.png`);
      expect(characterProfiles[id]?.dialogue, `${id}:dialogue`).toBe(`/assets/characters/pixel/dialogue/${id}.png`);
      expect(characterProfiles[id]?.ui, `${id}:ui`).toBe(`/assets/characters/pixel/ui/${id}.png`);
      expectPublicAsset(characterProfiles[id]!.full, `${id}:full`);
      expectPublicAsset(characterProfiles[id]!.dialogue, `${id}:dialogue`);
      expectPublicAsset(characterProfiles[id]!.ui, `${id}:ui`);
      expect(visualProfiles[id]?.artStatus, `${id}:approved`).toBe('approved');
    }

    expect(visualProfiles.serpent_general_boss?.category).toBe('boss');
    expect(combatConfigs.get('serpent_captain')?.bossVisualId).toBe('serpent_general_boss');
    expect(combatConfigs.get('serpent_captain')?.encounterRank).toBe('boss');
    expect(combatConfigs.get('serpent_duelist_trial')?.enemyVisualIds).toContain('serpent_duelist_elite');
    expect(combatConfigs.get('troll_crossing')?.enemyVisualIds).toContain('forest_troll_elite');
    expect(combatConfigs.get('young_dragon_roost')?.enemyVisualIds).toContain('young_dragon_elite');
  });

  it('declares valid visual compositions for faction, monster, elite and boss encounters', () => {
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const visualProfiles = assets.visualProfiles as unknown as Record<string, VisualProfile>;
    const expectedMonsterIds = ['wolf', 'venom_serpent', 'forest_spider', 'forest_badger', 'marsh_toad', 'cave_rat', 'wild_boar', 'goblin', 'skeleton'];
    const expectedEliteIds = ['troll', 'young_wyrm', 'undead_champion', 'forest_troll_elite', 'young_dragon_elite'];

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
