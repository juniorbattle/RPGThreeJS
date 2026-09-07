import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { probeMedia, sha256, technicalErrors } from './cin4_media.mjs';

const projectRoot = process.cwd();
const readJson = (path) => JSON.parse(readFileSync(resolve(projectRoot, path), 'utf8'));
const census = readJson('tools/cinematics/specs/campaign_cinematic_census.json');
const manifest = readJson('public/assets/cinematics/manifest.json');
const boisSpec = readJson('tools/cinematics/specs/cin6b/bois_clair_sacrificed.json');
const lionSpec = readJson('tools/cinematics/specs/cin6b/lion_trial_route_ending.json');

function pngDimensions(path) {
  const bytes = readFileSync(resolve(projectRoot, path));
  expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('CIN-6B P0 completion production contract', () => {
  it('matches the committed CIN-6B batch exactly', () => {
    const batch = census.productionBatches.find((entry) => entry.id === 'CIN-6B');
    expect(batch.targets).toEqual([
      { target: 'state:bois_clair:sacrificed', targetKind: 'STATE_VARIANT', action: 'PRODUCE' },
      { target: 'content:lion_chief:reveal', targetKind: 'APPROVED_EXISTING', action: 'VERIFY_ONLY' },
      { target: 'state:lion_trial:ending', targetKind: 'UNIQUE', action: 'PRODUCE' },
    ]);
    expect(batch.targets.filter((target) => target.action === 'PRODUCE')).toHaveLength(2);
    expect(batch.targets.filter((target) => target.action === 'VERIFY_ONLY')).toHaveLength(1);
  });

  it('ships exactly two new local production descriptors with no duplicate runtime ID', () => {
    const ids = manifest.cinematics.map((descriptor) => descriptor.id);
    expect(ids).toHaveLength(21);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('bois_clair_sacrificed');
    expect(ids).toContain('lion_trial_route_ending');
    expect(ids).not.toContain('bois_clair_sacrificed_placeholder');
    for (const descriptor of manifest.cinematics.slice(1)) {
      expect(descriptor.placeholderOnly).not.toBe(true);
      expect(descriptor.sources).toEqual([{ src: `/assets/cinematics/${descriptor.id}.mp4`, type: 'video/mp4' }]);
      expect(descriptor.sources[0].src).not.toMatch(/^https?:/i);
      expect(existsSync(resolve(projectRoot, 'public', descriptor.sources[0].src.replace(/^\//, '')))).toBe(true);
    }
  });

  it('preserves the five relevant approved continuity masters byte-for-byte', () => {
    for (const id of ['lion_judgement', 'serpent_general_reveal', 'lion_champion_reveal', 'serpent_route_ending', 'bois_clair_saved']) {
      execFileSync('git', ['diff', '--quiet', 'HEAD', '--', `public/assets/cinematics/${id}.mp4`], { cwd: projectRoot });
    }
  });

  it('uses authored physical ratios rather than canonical PNG canvas dimensions', () => {
    for (const asset of ['villageoise', 'maelor', 'alaric', 'lion_champion']) {
      expect(pngDimensions(`public/assets/characters/pixel/full/${asset}.png`)).toEqual({ width: 640, height: 768 });
    }

    const boisMedium = boisSpec.shots[1];
    expect(boisMedium.characters.map(({ id, heightPx, position }) => ({ id, heightPx, groundY: position.groundY }))).toEqual([
      { id: 'maelor', heightPx: 700, groundY: 0.98 },
      { id: 'villageoise', heightPx: 680, groundY: 0.98 },
    ]);
    expect(boisSpec.shots[2].characters.map((character) => character.heightPx)).toEqual([700, 680]);

    expect(lionSpec.shots[0].characters.map(({ id, heightPx, position }) => ({ id, heightPx, groundY: position.groundY }))).toEqual([
      { id: 'alaric', heightPx: 680, groundY: 0.97 },
      { id: 'lion_champion', heightPx: 620, groundY: 0.97 },
    ]);
    expect(lionSpec.shots[1].characters.map((character) => character.heightPx)).toEqual([820, 750]);
    expect(lionSpec.shots[2].characters.map((character) => character.heightPx)).toEqual([820, 750]);
    expect((680 / 620) / (820 / 750)).toBeCloseTo(1, 2);
  });

  it('keeps both specs inside their census shot and duration ranges', () => {
    expect(boisSpec.shots).toHaveLength(3);
    expect(boisSpec.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0)).toBe(18);
    expect(lionSpec.shots).toHaveLength(3);
    expect(lionSpec.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0)).toBe(20);
    expect(boisSpec.shots.map((shot) => shot.source.type)).toEqual(['ROOT_SOURCE', 'CUT_SOURCE', 'CHAIN_SOURCE']);
    expect(lionSpec.shots.map((shot) => shot.source.type)).toEqual(['ROOT_SOURCE', 'CUT_SOURCE', 'CHAIN_SOURCE']);
  });

  it('decodes every production master with its manifest duration', async () => {
    for (const descriptor of manifest.cinematics.slice(1)) {
      const path = resolve(projectRoot, 'public', descriptor.sources[0].src.replace(/^\//, ''));
      const report = await probeMedia(path, projectRoot);
      expect(technicalErrors(report, descriptor.durationMs / 1000, true), descriptor.id).toEqual([]);
    }
  }, 120_000);

  it('records stable hashes for the two promoted masters', async () => {
    expect(await sha256(resolve(projectRoot, 'public/assets/cinematics/bois_clair_sacrificed.mp4')))
      .toBe('db07031a3105fb31280abe3aca026cb74e4612e2aa44f7023b5401847322f1a4');
    expect(await sha256(resolve(projectRoot, 'public/assets/cinematics/lion_trial_route_ending.mp4')))
      .toBe('34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2');
  });
});
