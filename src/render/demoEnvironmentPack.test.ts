import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './data/demo-environment-pack-v1.production.json';
import correction from './data/bois-clair-night-watch.correction.json';
import { demoEnvironmentContextIds, demoEnvironmentPackSummary, demoEnvironmentPlateForContext } from './demoEnvironmentPack';
import { createInitialState } from '../game/store';
import { resolveGameDialogue } from '../game/contextualDialogueContent';

describe('night watch environment correction', () => {
  it.each([{}, { missionSuccess: true }, { missionGreed: true }, { missionSuccess: true, missionGreed: true }])
    ('keeps the same neutral plate and all four authored steps for flags %j', flags => {
      const state = createInitialState();
      Object.assign(state.flags, flags);
      const before = JSON.stringify(state);
      const dialogue = resolveGameDialogue('ate_bois_clair_night_watch', state)!.sequence;
      expect(dialogue.steps.map(step => step.id)).toEqual(['1', '2', '3', '4']);
      expect(new Set(dialogue.steps.map(step => step.actorId)).size).toBe(4);
      expect(demoEnvironmentPlateForContext(correction.contextId).assetId).toBe(correction.assetId);
      expect(resolveGameDialogue('ate_bois_clair_night_watch', state)!.sequence).toEqual(dialogue);
      expect(JSON.stringify(state)).toBe(before);
    });

  it('loads the separate nocturnal asset with truthful dimensions and digest', () => {
    const plate = demoEnvironmentPlateForContext(correction.contextId, 'STATIC_TABLEAU');
    const bytes = readFileSync(`public${plate.publicUrl}`);
    expect(plate.assetId).toBe(correction.assetId);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(plate.sha256);
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([plate.width, plate.height]);
    expect(demoEnvironmentPlateForContext(correction.contextId)).toEqual(plate);
    expect(() => demoEnvironmentPlateForContext(correction.contextId, 'COMBAT_STAGE')).toThrow();
  });

  it('preserves every original mapping except the exact night tableau binding', () => {
    expect(demoEnvironmentContextIds()).toEqual(Object.keys(manifest.mappings));
    expect(demoEnvironmentPackSummary).toMatchObject(manifest.summary);
    expect(manifest.assets).toHaveLength(44);
    for (const [contextId, mapping] of Object.entries(manifest.mappings)) {
      for (const binding of mapping.plates) {
        if (contextId === correction.contextId && binding.surfaceRole === 'STATIC_TABLEAU') continue;
        const asset = manifest.assets.find(entry => entry.assetId === binding.assetId)!;
        expect(demoEnvironmentPlateForContext(contextId, binding.surfaceRole as Parameters<typeof demoEnvironmentPlateForContext>[1]))
          .toMatchObject({ contextId, assetId: asset.assetId, surfaceRole: binding.surfaceRole, publicUrl: asset.publicUrl,
            sha256: asset.sha256, width: asset.width, height: asset.height, visualFamily: mapping.visualFamily });
      }
    }
  });
});
