// @vitest-environment happy-dom
/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import { campaignNodes, combatConfigs, dialogues } from './content';
import { dialogueChoiceSchema } from './types';
import { assets } from '../render/assetManifest';
import { craftRecipes, itemById, units } from './catalog';
import { prologuePanels } from './prologue';
import characterQc from '../../public/assets/characters/pixel/canonical-character-qc.json';
import { DialogueView } from '../ui/DialogueView';
import { createInitialState } from './store';

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

  it('defines the 20-node braid and routes each trial back into the shared story', () => {
    const refuge = campaignNodes.find((node) => node.id === 'lion-first-refuge');
    expect(campaignNodes).toHaveLength(20);
    expect(refuge?.links).toEqual(['lion-reserve-trail']);

    for (const nodeId of ['lion-refugees', 'lion-valmir-road', 'lion-witnesses']) {
      const node = campaignNodes.find((candidate) => candidate.id === nodeId)!;
      const choices = node.links.map((id) => campaignNodes.find((candidate) => candidate.id === id)!);
      expect(choices.map((choice) => choice.type).sort()).toEqual(['mystery', 'random-combat']);
      expect(new Set(choices.flatMap((choice) => choice.links)).size).toBe(1);
    }
  });

  it('keeps route and dialogue choices limited to two impactful options', () => {
    expect(campaignNodes.every((node) => node.links.length <= 2)).toBe(true);
    for (const dialogue of dialogues.values()) {
      for (const step of dialogue.steps) {
        expect(step.choices?.length ?? 0, `${dialogue.id}:${step.id}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('stages village_choice with Villageoise, Serpent, Séraphine, and Maelor', () => {
    const dialogue = dialogues.get('village_choice')!;
    const speakers = new Set(dialogue.steps.map((step) => step.actorId));
    expect(speakers.has('villageoise')).toBe(true);
    expect(speakers.has('serpent_raider')).toBe(true);
    expect(speakers.has('sage_seraphine')).toBe(true);
    expect(speakers.has('maelor')).toBe(true);
  });

  it('preserves village_defense and village_raid combat references in village_choice', () => {
    const dialogue = dialogues.get('village_choice')!;
    const combatIds = new Set<string>();
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'startCombat') combatIds.add(effect.combatId);
        }
      }
    }
    expect(combatIds.has('village_defense')).toBe(true);
    expect(combatIds.has('village_raid')).toBe(true);
  });

  it('stages lion_finale_judgement with Alaric, Champion, Maelor, and Séraphine', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    const speakers = new Set(dialogue.steps.map((step) => step.actorId));
    expect(speakers.has('alaric')).toBe(true);
    expect(speakers.has('lion_champion')).toBe(true);
    expect(speakers.has('maelor')).toBe(true);
    expect(speakers.has('sage_seraphine')).toBe(true);
  });

  it('preserves serpent_captain and lion_chief combat references in lion_finale_judgement', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    const combatIds = new Set<string>();
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'startCombat') combatIds.add(effect.combatId);
        }
      }
    }
    expect(combatIds.has('serpent_captain')).toBe(true);
    expect(combatIds.has('lion_chief')).toBe(true);
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
    expect(craftRecipes.length).toBeGreaterThanOrEqual(11);
    for (const recipe of craftRecipes) {
      expect(itemById.has(recipe.output.itemId), `${recipe.id}:output`).toBe(true);
      expect(recipe.inputs.gold, `${recipe.id}:gold`).toBeGreaterThan(0);
      for (const itemId of Object.keys(recipe.inputs.weapons ?? {})) {
        expect(itemById.get(itemId)?.category, `${recipe.id}:${itemId}`).toBe('weapons');
      }
      for (const itemId of Object.keys(recipe.inputs.accessories ?? {})) {
        expect(itemById.get(itemId)?.category, `${recipe.id}:${itemId}`).toBe('accessories');
      }
      for (const itemId of Object.keys(recipe.inputs.materials ?? {})) {
        expect(itemById.get(itemId)?.category, `${recipe.id}:${itemId}`).toBe('materials');
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

      for (const variant of ['full'] as const) {
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
      expect(characterProfiles[id]?.dialogue, `${id}:dialogue`).toBe(`/assets/characters/pixel/full/${id}.png`);
      expect(characterProfiles[id]?.ui, `${id}:ui`).toBe(`/assets/characters/pixel/full/${id}.png`);
      expect(dialogueActors[id], `${id}:dialogueActor`).toBe(`/assets/characters/pixel/full/${id}.png`);
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
      expect(characterProfiles[id]?.dialogue, `${id}:dialogue`).toBe(`/assets/characters/pixel/full/${id}.png`);
      expect(characterProfiles[id]?.ui, `${id}:ui`).toBe(`/assets/characters/pixel/full/${id}.png`);
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
    const expectedEliteIds = ['troll', 'undead_champion', 'forest_troll_elite', 'young_dragon_elite'];

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
      expect(path, `path:${path}`).toMatch(/\/assets\/characters\/pixel\/full\//);
      expectPublicAsset(path, `path:${path}`);
    }
  });

  it('validates contestable choice schema', () => {
    const contestable = {
      text: 'Test claim',
      next: 'success',
      requiresFlag: 'testFlag',
      effects: [],
      contest: {
        kind: 'lie' as const,
        risk: 'high' as const,
        truthState: 'known' as const,
        hint: 'Test hint',
        success: { next: 'success', effects: [] },
        failure: { next: 'failure', effects: [{ type: 'addReputation' as const, amount: -5 }] },
      },
    };
    expect(() => dialogueChoiceSchema.parse(contestable)).not.toThrow();
  });

  it('validates normal choice without contest field', () => {
    const normal = { text: 'Test', next: 'next', effects: [] };
    expect(() => dialogueChoiceSchema.parse(normal)).not.toThrow();
  });

  it('uses contestable branches in lion_finale_judgement', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    const contestChoices = dialogue.steps.flatMap((step) => step.choices ?? []).filter((choice) => choice.contest);
    expect(contestChoices.length, 'contest choices').toBeGreaterThanOrEqual(3);
    for (const choice of contestChoices) {
      expect(choice.contest!.success.next, `${choice.text}:success.next`).toBeTruthy();
      expect(choice.contest!.failure.next, `${choice.text}:failure.next`).toBeTruthy();
    }
  });

  it('validates all dialogue next targets point to existing step ids', () => {
    for (const dialogue of dialogues.values()) {
      const stepIds = new Set(dialogue.steps.map((s) => s.id));
      for (const step of dialogue.steps) {
        if (step.next) expect(stepIds.has(step.next), `${dialogue.id}:${step.id}:next`).toBe(true);
        for (const choice of step.choices ?? []) {
          if (choice.next) expect(stepIds.has(choice.next), `${dialogue.id}:${step.id}:choice.next`).toBe(true);
          if (choice.contest) {
            expect(stepIds.has(choice.contest.success.next), `${dialogue.id}:${step.id}:contest.success`).toBe(true);
            expect(stepIds.has(choice.contest.failure.next), `${dialogue.id}:${step.id}:contest.failure`).toBe(true);
            for (const effect of choice.contest.failure.effects) {
              if (effect.type === 'startCombat') expect(combatConfigs.has(effect.combatId), `${dialogue.id}:${step.id}:contest.failure.combat`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('lion_finale_judgement has no non-contestable requiresReputationMin/Max choices', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        if (choice.requiresReputationMin !== undefined || choice.requiresReputationMax !== undefined) {
          expect(choice.contest, `${step.id}:${choice.text}:must-be-contestable`).toBeDefined();
        }
      }
    }
  });

  it('lion_finale_judgement mandate segment has no mutually blocked lionMandateHonour choices', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    const mandateSteps = dialogue.steps.filter((s) => ['4', '4h', '4n'].includes(s.id));
    for (const step of mandateSteps) {
      for (const choice of step.choices ?? []) {
        expect(choice.requiresFlag, `${step.id}:${choice.text}:no-requiresFlag-lionMandateHonour`).not.toBe('lionMandateHonour');
        expect(choice.excludesFlag, `${step.id}:${choice.text}:no-excludesFlag-lionMandateHonour`).not.toBe('lionMandateHonour');
      }
    }
  });

  it('lion_finale_judgement still preserves serpent_captain and lion_chief combat paths', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    const combatIds = new Set<string>();
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'startCombat') combatIds.add(effect.combatId);
        }
        if (choice.contest) {
          for (const effect of choice.contest.success.effects) {
            if (effect.type === 'startCombat') combatIds.add(effect.combatId);
          }
          for (const effect of choice.contest.failure.effects) {
            if (effect.type === 'startCombat') combatIds.add(effect.combatId);
          }
        }
      }
    }
    expect(combatIds.has('serpent_captain'), 'serpent_captain path preserved').toBe(true);
    expect(combatIds.has('lion_chief'), 'lion_chief path preserved').toBe(true);
  });

  it('lionSealAcknowledged is set only on step 6 contest success path', () => {
    const dialogue = dialogues.get('lion_finale_judgement')!;
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        const topLevelAck = choice.effects.some((e) => e.type === 'setFlag' && e.key === 'lionSealAcknowledged');
        const successAck = choice.contest?.success.effects.some((e) => e.type === 'setFlag' && e.key === 'lionSealAcknowledged') ?? false;
        const failureAck = choice.contest?.failure.effects.some((e) => e.type === 'setFlag' && e.key === 'lionSealAcknowledged') ?? false;
        if (topLevelAck || successAck) {
          expect(step.id, `lionSealAcknowledged only on step 6, found on ${step.id}`).toBe('6');
        }
        expect(failureAck, `${step.id}:failure must not set lionSealAcknowledged`).toBe(false);
      }
    }
  });

  it('witnesses_on_road protectedWitnesses choice has contest', () => {
    const dialogue = dialogues.get('witnesses_on_road')!;
    const step = dialogue.steps.find((s) => s.id === '1')!;
    const protectChoice = step.choices?.find((c) => c.text.includes('Protéger'));
    expect(protectChoice, 'protect choice exists').toBeDefined();
    expect(protectChoice!.contest, 'protect choice has contest').toBeDefined();
  });

  it('witnesses_on_road protectedWitnesses choice keeps requiresReputationMin', () => {
    const dialogue = dialogues.get('witnesses_on_road')!;
    const step = dialogue.steps.find((s) => s.id === '1')!;
    const protectChoice = step.choices?.find((c) => c.text.includes('Protéger'));
    expect(protectChoice!.requiresReputationMin, 'keeps requiresReputationMin 45').toBe(45);
  });

  it('witnesses_on_road has no non-contestable requiresReputationMin/Max choices', () => {
    const dialogue = dialogues.get('witnesses_on_road')!;
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        if (choice.requiresReputationMin !== undefined || choice.requiresReputationMax !== undefined) {
          expect(choice.contest, `${step.id}:${choice.text}:must-be-contestable`).toBeDefined();
        }
      }
    }
  });

  it('witnesses_on_road preserves protectedWitnesses and silencedWitnesses flag paths', () => {
    const dialogue = dialogues.get('witnesses_on_road')!;
    const allEffects: string[] = [];
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'setFlag') allEffects.push(effect.key);
        }
        if (choice.contest) {
          for (const effect of choice.contest.success.effects) {
            if (effect.type === 'setFlag') allEffects.push(effect.key);
          }
        }
      }
    }
    expect(allEffects.includes('protectedWitnesses'), 'protectedWitnesses path exists').toBe(true);
    expect(allEffects.includes('silencedWitnesses'), 'silencedWitnesses path exists').toBe(true);
  });

  it('witnesses_on_road contest failure step exists and next targets are valid', () => {
    const dialogue = dialogues.get('witnesses_on_road')!;
    const stepIds = new Set(dialogue.steps.map((s) => s.id));
    const protectChoice = dialogue.steps.find((s) => s.id === '1')!.choices!.find((c) => c.text.includes('Protéger'))!;
    const failureNext = protectChoice.contest!.failure.next;
    expect(stepIds.has(failureNext), `failure next '${failureNext}' is a valid step`).toBe(true);
    const failureStep = dialogue.steps.find((s) => s.id === failureNext)!;
    expect(failureStep, 'failure step exists').toBeDefined();
    const failureSetsProtected = failureStep.effects.some((e) => e.type === 'setFlag' && e.key === 'protectedWitnesses');
    expect(failureSetsProtected, 'failure step must not set protectedWitnesses').toBe(false);
  });

  it('contestable choices never render exact effect descriptors in DialogueView', () => {
    const state = { ...createInitialState(), flags: { helpedRefugees: true }, reputation: 50 };
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async () => {},
    });
    const sequence = {
      id: 'test',
      sceneArtId: undefined,
      steps: [{
        id: '1',
        speaker: 'Test',
        actorId: undefined,
        expression: 'neutral' as const,
        tag: '',
        text: 'Test',
        portrait: '',
        side: 'right' as const,
        next: null,
        effects: [],
        choices: [{
          text: 'Claim',
          next: null,
          requiresFlag: 'helpedRefugees',
          effects: [{ type: 'addReputation' as const, amount: 5 }],
          contest: {
            kind: 'lie' as const,
            risk: 'high' as const,
            truthState: 'known' as const,
            hint: 'Test hint',
            success: { next: '1', effects: [] },
            failure: { next: '1', effects: [{ type: 'addReputation' as const, amount: -5 }] },
          },
        }],
      }],
    } as any;
    view.play(sequence);
    const choiceBtn = root.querySelector('.dialogue-choice') as HTMLButtonElement;
    expect(choiceBtn).toBeTruthy();
    expect(choiceBtn.classList.contains('dialogue-choice--contest'), 'contestable choice has contest class').toBe(true);
    expect(choiceBtn.disabled, 'contestable choice is not disabled when requirements met').toBe(false);
    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span')).map((el) => el.textContent);
    const hasExactRep = badgeTexts.some((t) => t?.includes('Réputation +') || t?.includes('Réputation -'));
    expect(hasExactRep, 'contestable choice must not show exact reputation values').toBe(false);
    view.close();
  });

  it('blocked non-contestable choices remain blocked in DialogueView', () => {
    const state = { ...createInitialState(), flags: {}, reputation: 10 };
    const root = document.createElement('div');
    const view = new DialogueView({
      root,
      getState: () => state,
      applyEffects: async () => {},
    });
    const sequence = {
      id: 'test',
      sceneArtId: undefined,
      steps: [{
        id: '1',
        speaker: 'Test',
        actorId: undefined,
        expression: 'neutral' as const,
        tag: '',
        text: 'Test',
        portrait: '',
        side: 'right' as const,
        next: null,
        effects: [],
        choices: [{
          text: 'Blocked choice',
          next: '1',
          requiresFlag: 'missingFlag',
          effects: [],
        }],
      }],
    } as any;
    view.play(sequence);
    const choiceBtn = root.querySelector('.dialogue-choice') as HTMLButtonElement;
    expect(choiceBtn).toBeTruthy();
    expect(choiceBtn.disabled, 'non-contestable blocked choice is disabled').toBe(true);
    expect(choiceBtn.classList.contains('is-blocked'), 'non-contestable blocked choice has is-blocked class').toBe(true);
    view.close();
  });

  it('default choice without outcomePreview still renders exact effects', () => {
    const state = createInitialState();
    const root = document.createElement('div');
    const view = new DialogueView({ root, getState: () => state, applyEffects: async () => {} });
    const sequence = {
      id: 'test', sceneArtId: undefined,
      steps: [{
        id: '1', speaker: 'Test', actorId: undefined, expression: 'neutral' as const,
        tag: '', text: 'Test', portrait: '', side: 'right' as const, next: null, effects: [],
        choices: [{ text: 'Exact', next: null, effects: [{ type: 'addReputation' as const, amount: 5 }] }],
      }],
    } as any;
    view.play(sequence);
    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span')).map((el) => el.textContent);
    expect(badgeTexts.some((t) => t?.includes('Réputation +5')), 'exact rep value shown').toBe(true);
    view.close();
  });

  it('outcomePreview soft mode renders hints and hides exact effect values', () => {
    const state = createInitialState();
    const root = document.createElement('div');
    const view = new DialogueView({ root, getState: () => state, applyEffects: async () => {} });
    const sequence = {
      id: 'test', sceneArtId: undefined,
      steps: [{
        id: '1', speaker: 'Test', actorId: undefined, expression: 'neutral' as const,
        tag: '', text: 'Test', portrait: '', side: 'right' as const, next: null, effects: [],
        choices: [{
          text: 'Soft', next: null,
          effects: [{ type: 'addReputation' as const, amount: 10 }, { type: 'addGold' as const, amount: 200 }],
          outcomePreview: { mode: 'soft' as const, hints: ['Le village s\u2019en souviendra', 'Gain matériel important'] },
        }],
      }],
    } as any;
    view.play(sequence);
    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span')).map((el) => el.textContent);
    expect(badgeTexts.some((t) => t === 'Le village s\u2019en souviendra'), 'hint shown').toBe(true);
    expect(badgeTexts.some((t) => t === 'Gain matériel important'), 'hint shown').toBe(true);
    expect(badgeTexts.some((t) => t?.includes('Réputation')), 'exact rep hidden').toBe(false);
    expect(badgeTexts.some((t) => t?.includes('Or +')), 'exact gold hidden').toBe(false);
    view.close();
  });

  it('outcomePreview hidden mode renders no effect preview', () => {
    const state = createInitialState();
    const root = document.createElement('div');
    const view = new DialogueView({ root, getState: () => state, applyEffects: async () => {} });
    const sequence = {
      id: 'test', sceneArtId: undefined,
      steps: [{
        id: '1', speaker: 'Test', actorId: undefined, expression: 'neutral' as const,
        tag: '', text: 'Test', portrait: '', side: 'right' as const, next: null, effects: [],
        choices: [{
          text: 'Hidden', next: null,
          effects: [{ type: 'addReputation' as const, amount: 5 }],
          outcomePreview: { mode: 'hidden' as const, hints: [] },
        }],
      }],
    } as any;
    view.play(sequence);
    const badges = root.querySelectorAll('.dialogue-outcome');
    expect(badges.length, 'no effect badges in hidden mode').toBe(0);
    view.close();
  });

  it('contestable choices ignore outcomePreview and keep contest badges', () => {
    const state = { ...createInitialState(), flags: { helpedRefugees: true }, reputation: 50 };
    const root = document.createElement('div');
    const view = new DialogueView({ root, getState: () => state, applyEffects: async () => {} });
    const sequence = {
      id: 'test', sceneArtId: undefined,
      steps: [{
        id: '1', speaker: 'Test', actorId: undefined, expression: 'neutral' as const,
        tag: '', text: 'Test', portrait: '', side: 'right' as const, next: null, effects: [],
        choices: [{
          text: 'Contest', next: null,
          effects: [{ type: 'addReputation' as const, amount: 5 }],
          contest: { kind: 'lie' as const, risk: 'high' as const, truthState: 'known' as const, hint: 'Test', success: { next: '1', effects: [] }, failure: { next: '1', effects: [] } },
          outcomePreview: { mode: 'soft' as const, hints: ['Should not appear'] },
        }],
      }],
    } as any;
    view.play(sequence);
    const badgeTexts = Array.from(root.querySelectorAll('.dialogue-outcome span')).map((el) => el.textContent);
    expect(badgeTexts.some((t) => t?.includes('Risque')), 'contest badge shown').toBe(true);
    expect(badgeTexts.some((t) => t === 'Should not appear'), 'outcomePreview hint ignored').toBe(false);
    view.close();
  });

  it('V5B converted choices keep original effects unchanged', () => {
    const dialogueIds = ['refugee_trial', 'village_choice', 'serpent_informant', 'shadow_signs'];
    for (const dialogueId of dialogueIds) {
      const dialogue = dialogues.get(dialogueId)!;
      for (const step of dialogue.steps) {
        for (const choice of step.choices ?? []) {
          if (choice.outcomePreview?.mode === 'soft') {
            expect(choice.effects.length > 0, `${dialogueId}:${step.id} soft choice has effects`).toBe(true);
            expect(choice.outcomePreview.hints.length > 0, `${dialogueId}:${step.id} soft choice has hints`).toBe(true);
          }
        }
      }
    }
  });

  it('V5B converted choices preserve flags, combats and next targets', () => {
    const expectedFlags: Record<string, string[]> = {
      refugee_trial: ['helpedRefugees', 'exploitedRefugees'],
      village_choice: ['missionSuccess', 'missionGreed'],
      serpent_informant: ['protectedInformant', 'betrayedInformant'],
      shadow_signs: ['shadowEvidence', 'shadowFragments'],
    };
    for (const [dialogueId, expectedFlagKeys] of Object.entries(expectedFlags)) {
      const dialogue = dialogues.get(dialogueId)!;
      const allFlagKeys: string[] = [];
      for (const step of dialogue.steps) {
        for (const choice of step.choices ?? []) {
          for (const effect of choice.effects) {
            if (effect.type === 'setFlag') allFlagKeys.push(effect.key);
          }
        }
      }
      for (const expectedKey of expectedFlagKeys) {
        expect(allFlagKeys.includes(expectedKey), `${dialogueId} preserves flag ${expectedKey}`).toBe(true);
      }
    }
    const villageDialogue = dialogues.get('village_choice')!;
    const hasVillageDefense = villageDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'startCombat' && e.combatId === 'village_defense')));
    const hasVillageRaid = villageDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'startCombat' && e.combatId === 'village_raid')));
    expect(hasVillageDefense, 'village_choice preserves village_defense combat').toBe(true);
    expect(hasVillageRaid, 'village_choice preserves village_raid combat').toBe(true);
    const informantDialogue = dialogues.get('serpent_informant')!;
    const hasHunters = informantDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'startCombat' && e.combatId === 'serpent_hunters')));
    expect(hasHunters, 'serpent_informant preserves serpent_hunters combat').toBe(true);
  });

  it('V5.1 converted choices have outcomePreview.mode === soft', () => {
    const dialogueIds = ['reserve_trail', 'old_shrine_event', 'mystery_treasure', 'mystery_shrine'];
    for (const dialogueId of dialogueIds) {
      const dialogue = dialogues.get(dialogueId)!;
      const softChoices = dialogue.steps
        .flatMap((s) => s.choices ?? [])
        .filter((c) => c.outcomePreview?.mode === 'soft');
      expect(softChoices.length, `${dialogueId} has 2 soft choices`).toBe(2);
    }
  });

  it('V5.1 converted choices each have at least one hint', () => {
    const dialogueIds = ['reserve_trail', 'old_shrine_event', 'mystery_treasure', 'mystery_shrine'];
    for (const dialogueId of dialogueIds) {
      const dialogue = dialogues.get(dialogueId)!;
      for (const choice of dialogue.steps.flatMap((s) => s.choices ?? [])) {
        if (choice.outcomePreview?.mode === 'soft') {
          expect(choice.outcomePreview.hints.length > 0, `${dialogueId} soft choice has hints`).toBe(true);
        }
      }
    }
  });

  it('V5.1 converted choices preserve flags, items, gold/reputation effects and next targets', () => {
    const expectedFlags: Record<string, string[]> = {
      reserve_trail: ['prioritizedLoot', 'prioritizedVillage'],
      old_shrine_event: ['shrineRested', 'shrineLooted'],
      mystery_treasure: ['returnedLostTreasure', 'claimedLostTreasure'],
      mystery_shrine: ['preservedShrine', 'desecratedShrine'],
    };
    for (const [dialogueId, expectedFlagKeys] of Object.entries(expectedFlags)) {
      const dialogue = dialogues.get(dialogueId)!;
      const allFlagKeys: string[] = [];
      for (const step of dialogue.steps) {
        for (const choice of step.choices ?? []) {
          for (const effect of choice.effects) {
            if (effect.type === 'setFlag') allFlagKeys.push(effect.key);
          }
        }
      }
      for (const expectedKey of expectedFlagKeys) {
        expect(allFlagKeys.includes(expectedKey), `${dialogueId} preserves flag ${expectedKey}`).toBe(true);
      }
    }
    const treasureDialogue = dialogues.get('mystery_treasure')!;
    const hasItemEffect = treasureDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'addItem' && e.itemId === 'potion')));
    expect(hasItemEffect, 'mystery_treasure preserves potion item reward').toBe(true);
    const reserveDialogue = dialogues.get('reserve_trail')!;
    const hasGoldEffect = reserveDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'addGold' && e.amount === 120)));
    expect(hasGoldEffect, 'reserve_trail preserves gold 120 effect').toBe(true);
    const shrineDialogue = dialogues.get('mystery_shrine')!;
    const hasNextTargets = shrineDialogue.steps.some((s) => s.choices?.some((c) => c.next === '2')) && shrineDialogue.steps.some((s) => s.choices?.some((c) => c.next === '3'));
    expect(hasNextTargets, 'mystery_shrine preserves next targets 2 and 3').toBe(true);
  });

  it('V5B converted choices remain converted', () => {
    const v5bDialogues = ['refugee_trial', 'village_choice', 'serpent_informant', 'shadow_signs'];
    for (const dialogueId of v5bDialogues) {
      const dialogue = dialogues.get(dialogueId)!;
      const softChoices = dialogue.steps
        .flatMap((s) => s.choices ?? [])
        .filter((c) => c.outcomePreview?.mode === 'soft');
      expect(softChoices.length, `${dialogueId} V5B soft choices still present`).toBe(2);
    }
  });

  it('V5.2 converted choices have outcomePreview.mode === soft', () => {
    const dialogueIds = ['lion_briefing', 'village_defense_aftermath', 'village_raid_aftermath'];
    for (const dialogueId of dialogueIds) {
      const dialogue = dialogues.get(dialogueId)!;
      const softChoices = dialogue.steps
        .flatMap((s) => s.choices ?? [])
        .filter((c) => c.outcomePreview?.mode === 'soft');
      expect(softChoices.length, `${dialogueId} has 2 soft choices`).toBe(2);
    }
  });

  it('V5.2 converted choices each have at least one hint', () => {
    const dialogueIds = ['lion_briefing', 'village_defense_aftermath', 'village_raid_aftermath'];
    for (const dialogueId of dialogueIds) {
      const dialogue = dialogues.get(dialogueId)!;
      for (const choice of dialogue.steps.flatMap((s) => s.choices ?? [])) {
        if (choice.outcomePreview?.mode === 'soft') {
          expect(choice.outcomePreview.hints.length > 0, `${dialogueId} soft choice has hints`).toBe(true);
        }
      }
    }
  });

  it('lion_briefing keeps lionMandateHonour and lionMandateAdvance effects unchanged', () => {
    const dialogue = dialogues.get('lion_briefing')!;
    const allFlagKeys: string[] = [];
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        for (const effect of choice.effects) {
          if (effect.type === 'setFlag') allFlagKeys.push(effect.key);
        }
      }
    }
    expect(allFlagKeys.includes('lionMandateHonour'), 'lion_briefing preserves lionMandateHonour').toBe(true);
    expect(allFlagKeys.includes('lionMandateAdvance'), 'lion_briefing preserves lionMandateAdvance').toBe(true);
    expect(allFlagKeys.includes('lionMissionAccepted'), 'lion_briefing preserves lionMissionAccepted').toBe(true);
  });

  it('V5.2 converted choices preserve flags, items, gold/reputation effects and next targets', () => {
    const expectedFlags: Record<string, string[]> = {
      village_defense_aftermath: ['protectedWitnesses'],
      village_raid_aftermath: ['silencedWitnesses'],
    };
    for (const [dialogueId, expectedFlagKeys] of Object.entries(expectedFlags)) {
      const dialogue = dialogues.get(dialogueId)!;
      const allFlagKeys: string[] = [];
      for (const step of dialogue.steps) {
        for (const choice of step.choices ?? []) {
          for (const effect of choice.effects) {
            if (effect.type === 'setFlag') allFlagKeys.push(effect.key);
          }
        }
      }
      for (const expectedKey of expectedFlagKeys) {
        expect(allFlagKeys.includes(expectedKey), `${dialogueId} preserves flag ${expectedKey}`).toBe(true);
      }
    }
    const defenseDialogue = dialogues.get('village_defense_aftermath')!;
    const hasItemEffect = defenseDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'addItem' && e.itemId === 'potion')));
    expect(hasItemEffect, 'village_defense_aftermath preserves potion item reward').toBe(true);
    const raidDialogue = dialogues.get('village_raid_aftermath')!;
    const hasGoldEffect = raidDialogue.steps.some((s) => s.choices?.some((c) => c.effects.some((e) => e.type === 'addGold' && e.amount === -40)));
    expect(hasGoldEffect, 'village_raid_aftermath preserves gold -40 effect').toBe(true);
    const briefingDialogue = dialogues.get('lion_briefing')!;
    const hasNext4 = briefingDialogue.steps.some((s) => s.choices?.some((c) => c.next === '4'));
    const hasNext5 = briefingDialogue.steps.some((s) => s.choices?.some((c) => c.next === '5'));
    expect(hasNext4, 'lion_briefing preserves next target 4').toBe(true);
    expect(hasNext5, 'lion_briefing preserves next target 5').toBe(true);
  });

  it('V5.1 converted choices remain converted', () => {
    const v51Dialogues = ['reserve_trail', 'old_shrine_event', 'mystery_treasure', 'mystery_shrine'];
    for (const dialogueId of v51Dialogues) {
      const dialogue = dialogues.get(dialogueId)!;
      const softChoices = dialogue.steps
        .flatMap((s) => s.choices ?? [])
        .filter((c) => c.outcomePreview?.mode === 'soft');
      expect(softChoices.length, `${dialogueId} V5.1 soft choices still present`).toBe(2);
    }
  });

  it('V6 mystery_lancer_recruit has neutral opening text not assuming Bois-Clair was saved', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step1 = dialogue.steps.find((s) => s.id === '1')!;
    expect(step1.text.includes('défendu'), 'opening must not contain "défendu"').toBe(false);
    expect(step1.text.includes('sauvés'), 'opening must not contain "sauvés"').toBe(false);
  });

  it('V6 mystery_lancer_recruit recruit choice has requiresReputationMin and contest', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step1 = dialogue.steps.find((s) => s.id === '1')!;
    const recruitChoice = step1.choices!.find((c) => c.text.includes('Accueillir'))!;
    expect(recruitChoice.requiresReputationMin, 'requiresReputationMin: 15').toBe(15);
    expect(recruitChoice.blockedText, 'has blockedText').toBeTruthy();
    expect(recruitChoice.contest?.kind, 'contest.kind: persuade').toBe('persuade');
    expect(recruitChoice.contest?.risk, 'contest.risk: moderate').toBe('moderate');
  });

  it('V6 mystery_lancer_recruit top-level recruit effects include recruitUnit and recruitedLancer', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step1 = dialogue.steps.find((s) => s.id === '1')!;
    const recruitChoice = step1.choices!.find((c) => c.text.includes('Accueillir'))!;
    const effectTypes = recruitChoice.effects.map((e) => e.type);
    expect(effectTypes.includes('recruitUnit'), 'top-level effects include recruitUnit').toBe(true);
    const recruitEffect = recruitChoice.effects.find((e) => e.type === 'recruitUnit')!;
    expect(recruitEffect.unitId, 'recruitUnit unitId: lancer').toBe('lancer');
    const flagEffect = recruitChoice.effects.find((e) => e.type === 'setFlag')!;
    expect(flagEffect.key, 'setFlag key: recruitedLancer').toBe('recruitedLancer');
  });

  it('V6 mystery_lancer_recruit contest.success mirrors recruitUnit and recruitedLancer', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step1 = dialogue.steps.find((s) => s.id === '1')!;
    const recruitChoice = step1.choices!.find((c) => c.text.includes('Accueillir'))!;
    const successEffects = recruitChoice.contest!.success.effects;
    expect(successEffects.some((e) => e.type === 'recruitUnit' && e.unitId === 'lancer'), 'success mirrors recruitUnit').toBe(true);
    expect(successEffects.some((e) => e.type === 'setFlag' && e.key === 'recruitedLancer'), 'success mirrors recruitedLancer').toBe(true);
  });

  it('V6 mystery_lancer_recruit contest.failure routes to step 4 with empty effects', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step1 = dialogue.steps.find((s) => s.id === '1')!;
    const recruitChoice = step1.choices!.find((c) => c.text.includes('Accueillir'))!;
    expect(recruitChoice.contest!.failure.next, 'failure.next: 4').toBe('4');
    expect(recruitChoice.contest!.failure.effects, 'failure effects empty').toHaveLength(0);
  });

  it('V6 mystery_lancer_recruit has step 4 for contest failure', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const step4 = dialogue.steps.find((s) => s.id === '4');
    expect(step4, 'step 4 exists').toBeTruthy();
    expect(step4!.effects, 'step 4 has no recruitUnit').not.toContainEqual(expect.objectContaining({ type: 'recruitUnit' }));
    expect(step4!.effects, 'step 4 has no recruitedLancer flag').not.toContainEqual(expect.objectContaining({ type: 'setFlag', key: 'recruitedLancer' }));
  });

  it('V6 mystery_lancer_recruit all next targets resolve to existing steps', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    const stepIds = new Set(dialogue.steps.map((s) => s.id));
    for (const step of dialogue.steps) {
      for (const choice of step.choices ?? []) {
        if (choice.next) expect(stepIds.has(choice.next), `${step.id}:choice.next ${choice.next}`).toBe(true);
        if (choice.contest) {
          expect(stepIds.has(choice.contest.success.next), `${step.id}:contest.success`).toBe(true);
          expect(stepIds.has(choice.contest.failure.next), `${step.id}:contest.failure`).toBe(true);
        }
      }
    }
  });

  it('V6 mystery_lancer_recruit has at most 2 choices per step', () => {
    const dialogue = dialogues.get('mystery_lancer_recruit')!;
    for (const step of dialogue.steps) {
      expect((step.choices ?? []).length, `${step.id} choices <= 2`).toBeLessThanOrEqual(2);
    }
  });
});

describe('V10B economy and content consistency', () => {
  it('mystery_treasure dialogue exists', () => {
    expect(dialogues.has('mystery_treasure')).toBe(true);
  });

  it('mystery_shrine dialogue exists', () => {
    expect(dialogues.has('mystery_shrine')).toBe(true);
  });

  it('all runSystem adaptive content IDs have matching dialogues or combats', () => {
    const routeContentIds = [
      'mystery_treasure', 'mystery_shrine', 'mystery_help', 'mystery_dragon_roost',
      'mystery_lancer_recruit', 'mystery_recruit',
      'refugee_trial', 'reserve_trail', 'old_shrine_event', 'village_choice',
      'witnesses_on_road', 'shadow_signs',
      'lion_finale_judgement', 'final_refuge',
      'serpent_informant',
    ];
    for (const id of routeContentIds) {
      expect(dialogues.has(id) || combatConfigs.has(id), `route contentId ${id}`).toBe(true);
    }
  });

  it('at least some normal combat rewards include iron_ore', () => {
    const normalCombats = [...combatConfigs.values()].filter((c) => c.encounterRank === 'normal');
    const withIronOre = normalCombats.filter((c) => (c.rewards.materials.iron_ore ?? 0) > 0);
    expect(withIronOre.length, 'normal combats with iron_ore').toBeGreaterThan(0);
  });

  it('all elite combat rewards include iron_ore', () => {
    const eliteCombats = [...combatConfigs.values()].filter((c) => c.encounterRank === 'elite');
    for (const combat of eliteCombats) {
      expect(combat.rewards.materials.iron_ore ?? 0, `${combat.id}:iron_ore`).toBeGreaterThan(0);
    }
  });

  it('no combat reward has negative materials', () => {
    for (const combat of combatConfigs.values()) {
      for (const [key, value] of Object.entries(combat.rewards.materials)) {
        expect(value, `${combat.id}:${key}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('all dialogue addItem effects reference valid item IDs', () => {
    for (const [dialogueId, sequence] of dialogues) {
      for (const step of sequence.steps) {
        for (const effect of step.effects) {
          if (effect.type === 'addItem') {
            expect(itemById.has(effect.itemId), `${dialogueId}:${step.id}:addItem:${effect.itemId}`).toBe(true);
          }
        }
        for (const choice of step.choices ?? []) {
          for (const effect of choice.effects) {
            if (effect.type === 'addItem') {
              expect(itemById.has(effect.itemId), `${dialogueId}:${step.id}:choice:addItem:${effect.itemId}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('route graph structure remains 20 nodes with max depth 16', () => {
    expect(campaignNodes).toHaveLength(20);
    expect(Math.max(...campaignNodes.map((n) => n.x))).toBeLessThanOrEqual(10);
  });
});
