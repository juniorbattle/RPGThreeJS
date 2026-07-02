/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import { campaignNodes, combatConfigs, dialogues } from './content';
import { assets } from '../render/assetManifest';
import { units } from './catalog';
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

  it('uses existing pixel character assets for playable units', () => {
    const characterProfiles = assets.characterProfiles as Record<string, CharacterAssetProfile>;
    const qc = characterQc as unknown as Record<string, CharacterQcEntry>;

    for (const [id, profile] of Object.entries(characterProfiles)) {
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

    for (const unit of units) {
      expect(unit.portrait, unit.id).toContain('/assets/characters/pixel/full/');
      expectPublicAsset(unit.portrait, unit.id);
    }
  });
});
