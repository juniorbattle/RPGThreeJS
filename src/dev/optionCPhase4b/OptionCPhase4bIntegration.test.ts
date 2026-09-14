import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { combatInitializeMessageSchema } from '../../combat/protocol';
import { toCombatant } from '../../game/catalog';
import { combatConfigs } from '../../game/content';
import { createInitialState } from '../../game/store';

interface RuntimeAssetEntry {
  source: string;
  runtimeDerivative: string;
  dimensions: [number, number];
  sha256: string;
  status: string;
  processing: string;
}

function bytes(path: string): Buffer {
  return readFileSync(resolve(process.cwd(), path));
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function pngDimensions(value: Buffer): [number, number] {
  return [value.readUInt32BE(16), value.readUInt32BE(20)];
}

describe('Option C Phase 4B runtime proof integration', () => {
  const manifest = JSON.parse(bytes('public/assets/dev/option-c/phase4b/runtime-assets.json').toString('utf8')) as {
    sourcePilot: string;
    assets: RuntimeAssetEntry[];
  };

  it('keeps all 36 runtime derivatives byte-identical to approved Phase 4A sources', () => {
    expect(manifest.sourcePilot).toBe('APPROVED_DEV_PILOT');
    expect(manifest.assets).toHaveLength(36);
    for (const asset of manifest.assets) {
      expect(asset.runtimeDerivative).toMatch(/^public\/assets\/dev\/option-c\/phase4b\//);
      expect(asset.status).toBe('RUNTIME_PROOF_CANDIDATE');
      expect(asset.processing).toBe('BYTE_IDENTICAL_COPY');
      expect(existsSync(resolve(process.cwd(), asset.source))).toBe(true);
      expect(existsSync(resolve(process.cwd(), asset.runtimeDerivative))).toBe(true);
      const source = bytes(asset.source);
      const derivative = bytes(asset.runtimeDerivative);
      expect(derivative.equals(source)).toBe(true);
      expect(sha256(derivative)).toBe(asset.sha256);
      expect(pngDimensions(derivative)).toEqual(asset.dimensions);
    }
  });

  it('preserves the canonical Kestrel identity asset outside the DEV namespace', () => {
    expect(existsSync(resolve(process.cwd(), 'public/assets/characters/pixel/full/kestrel.png'))).toBe(true);
    expect(manifest.assets.some((asset) => asset.runtimeDerivative.includes('/characters/pixel/full/'))).toBe(false);
  });

  it('gates the entry route behind the Vite DEV constant', () => {
    const main = bytes('src/main.ts').toString('utf8');
    expect(main).toMatch(/import\.meta\.env\.DEV\s*&&\s*new URLSearchParams\(window\.location\.search\)\.get\('devOptionC'\) === 'forest-road'/);
    expect(main).toContain("import('./dev/optionCPhase4b/OptionCPhase4bProof')");
  });

  it('defaults the combat proof extension off for normal sessions', () => {
    const state = createInitialState();
    const parsed = combatInitializeMessageSchema.parse({
      type: 'rpg-threejs:combat-initialize',
      config: combatConfigs.get('forest_patrol')!,
      clan: state.clan.members.map((unit) => toCombatant(unit)),
      inventory: state.inventory.consumables,
      preferredUnitIds: state.deployment.unitIds,
      reducedGraphics: false,
    });
    expect(parsed.devOptionCProof).toBe(false);
  });
});
