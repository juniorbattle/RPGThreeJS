import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CinematicRegistry, parseVideoCinematicManifest } from './CinematicRegistry';
import { resolveVideoCinematicTrigger, VIDEO_CINEMATIC_TRIGGERS } from './CinematicTriggers';

const manifest = {
  version: 1 as const,
  cinematics: [{
    id: 'opening',
    title: 'Opening',
    sources: [{ src: '/opening.webm', type: 'video/webm' as const }],
  }],
};

describe('cinematic registry', () => {
  it('validates video and placeholder descriptors', () => {
    expect(parseVideoCinematicManifest(manifest)).toEqual(manifest);
    expect(parseVideoCinematicManifest({
      version: 1,
      cinematics: [{ id: 'qa', title: 'QA', sources: [], placeholderOnly: true }],
    })?.cinematics[0]?.id).toBe('qa');
    expect(parseVideoCinematicManifest({
      version: 1,
      cinematics: [{ id: 'invalid', title: 'Invalid', sources: [] }],
    })).toBeNull();
  });

  it('loads once and resolves registered IDs', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(manifest), { status: 200 }));
    const registry = new CinematicRegistry();
    await Promise.all([registry.load('/manifest.json', fetcher), registry.load('/manifest.json', fetcher)]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(registry.get('opening')?.sources[0]?.type).toBe('video/webm');
  });

  it('falls back to an empty registry for missing or invalid manifests', async () => {
    const registry = new CinematicRegistry(manifest);
    await registry.load('/missing.json', async () => new Response('', { status: 404 }));
    expect(registry.size).toBe(0);
  });

  it('keeps lifecycle mappings separate and missing entries as no-ops', () => {
    const triggers = {
      beforeDialogue: { intro: 'opening' },
      beforeCombat: { boss: 'boss-intro' },
      afterCombat: { 'boss:victory': 'boss-win' },
      chapterBeat: { finale: 'ending' },
    };
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'intro' }, triggers)).toBe('opening');
    expect(resolveVideoCinematicTrigger({ hook: 'afterCombat', combatId: 'boss', outcome: 'victory' }, triggers)).toBe('boss-win');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'missing' }, triggers)).toBeUndefined();
  });

  it('ships no production trigger mappings yet', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.afterCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.chapterBeat).toEqual({});
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_judgement' })).toBeUndefined();
  });

  it('ships a production manifest that still holds only the QA placeholder', () => {
    const raw = readFileSync(join(process.cwd(), 'public', 'assets', 'cinematics', 'manifest.json'), 'utf-8');
    const parsed = parseVideoCinematicManifest(JSON.parse(raw));
    expect(parsed?.cinematics.map((descriptor) => descriptor.id)).toEqual(['qa-placeholder']);
    expect(parsed?.cinematics.every((descriptor) => descriptor.placeholderOnly === true)).toBe(true);
  });
});
