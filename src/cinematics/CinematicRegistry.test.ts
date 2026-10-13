import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CinematicRegistry, parseVideoCinematicManifest } from './CinematicRegistry';
import { resolveVideoCinematicTrigger, VIDEO_CINEMATIC_TRIGGERS } from './CinematicTriggers';
import { APPROVED_PRODUCTION_VIDEO_IDS } from './ApprovedProductionVideos';

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
    expect(fetcher).toHaveBeenCalledWith('/manifest.json', { cache: 'no-cache' });
    expect(registry.get('opening')?.sources[0]?.type).toBe('video/webm');
  });

  it('exposes only approved video slots from the production manifest URL', async () => {
    const productionManifest = {
      version: 1,
      cinematics: [
        { id: 'camp_departure', title: 'Camp', sources: [{ src: '/camp.mp4', type: 'video/mp4' }] },
        { id: 'serpent_general_reveal', title: 'Reveal', sources: [{ src: '/reveal.mp4', type: 'video/mp4' }] },
        { id: 'qa-placeholder', title: 'QA', sources: [], placeholderOnly: true },
      ],
    };
    const registry = new CinematicRegistry();
    await registry.load(undefined, async () => new Response(JSON.stringify(productionManifest), { status: 200 }));
    expect(registry.values().map((entry) => entry.id)).toEqual(['camp_departure', 'qa-placeholder']);
    expect(registry.get('serpent_general_reveal')).toBeUndefined();
  });

  it('loads exactly eight playable videos from the current production manifest', async () => {
    const raw = readFileSync(join(process.cwd(), 'public/assets/cinematics/manifest.json'), 'utf8');
    const registry = new CinematicRegistry();
    await registry.load(undefined, async () => new Response(raw, { status: 200 }));
    const playable = registry.values().filter((entry) => entry.sources.length > 0).map((entry) => entry.id);
    expect(new Set(playable)).toEqual(new Set(APPROVED_PRODUCTION_VIDEO_IDS));
    expect(playable).toHaveLength(8);
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

  it('ships only the approved judgement video lifecycle trigger', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue).toEqual({
      lion_finale_judgement: 'lion_judgement',
    });
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.afterCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.chapterBeat).toEqual({});
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'lion_chief' })).toBeUndefined();
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_judgement' })).toBe('lion_judgement');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_ambush' })).toBeUndefined();
    expect(Object.isFrozen(VIDEO_CINEMATIC_TRIGGERS)).toBe(true);
    expect(Object.values(VIDEO_CINEMATIC_TRIGGERS).every(Object.isFrozen)).toBe(true);
    expect(Reflect.set(VIDEO_CINEMATIC_TRIGGERS.beforeCombat, 'extra', 'not-allowed')).toBe(false);
  });

  it('ships the QA placeholder and exactly eight approved production videos', () => {
    const raw = readFileSync(join(process.cwd(), 'public', 'assets', 'cinematics', 'manifest.json'), 'utf-8');
    const parsed = parseVideoCinematicManifest(JSON.parse(raw));
    expect(parsed?.cinematics.map((descriptor) => descriptor.id)).toEqual([
      'qa-placeholder',
      'lion_judgement',
      'camp_departure',
      'alaric_audience_arrival',
      'bois_clair_arrival',
      'bois_clair_saved',
      'bois_clair_sacrificed',
      'serpent_route_ending',
      'lion_trial_route_ending',
    ]);
    expect(parsed?.cinematics[0]?.placeholderOnly).toBe(true);
    const real = parsed?.cinematics.slice(1) ?? [];
    expect(real).toHaveLength(8);
    for (const descriptor of real) {
      expect(descriptor.placeholderOnly).not.toBe(true);
      expect(descriptor.sources).toEqual([{ src: `/assets/cinematics/${descriptor.id}.mp4`, type: 'video/mp4' }]);
      const mediaPath = join(process.cwd(), 'public', descriptor.sources[0]!.src);
      expect(statSync(mediaPath).size).toBeGreaterThan(0);
    }
  });
});
