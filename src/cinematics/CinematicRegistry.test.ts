import { readFileSync, statSync } from 'node:fs';
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
    expect(fetcher).toHaveBeenCalledWith('/manifest.json', { cache: 'no-cache' });
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

  it('ships exactly the three CIN-3 production trigger mappings', () => {
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeDialogue).toEqual({
      lion_finale_judgement: 'lion_judgement',
    });
    expect(VIDEO_CINEMATIC_TRIGGERS.beforeCombat).toEqual({
      serpent_captain: 'serpent_general_reveal',
      lion_chief: 'lion_champion_reveal',
    });
    expect(VIDEO_CINEMATIC_TRIGGERS.afterCombat).toEqual({});
    expect(VIDEO_CINEMATIC_TRIGGERS.chapterBeat).toEqual({});
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_captain' })).toBe('serpent_general_reveal');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'lion_chief' })).toBe('lion_champion_reveal');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeDialogue', dialogueId: 'lion_finale_judgement' })).toBe('lion_judgement');
    expect(resolveVideoCinematicTrigger({ hook: 'beforeCombat', combatId: 'serpent_ambush' })).toBeUndefined();
    expect(Object.isFrozen(VIDEO_CINEMATIC_TRIGGERS)).toBe(true);
    expect(Object.values(VIDEO_CINEMATIC_TRIGGERS).every(Object.isFrozen)).toBe(true);
    expect(Reflect.set(VIDEO_CINEMATIC_TRIGGERS.beforeCombat, 'extra', 'not-allowed')).toBe(false);
  });

  it('ships the QA placeholder, three preserved CIN-3 videos and fifteen CIN-6A videos', () => {
    const raw = readFileSync(join(process.cwd(), 'public', 'assets', 'cinematics', 'manifest.json'), 'utf-8');
    const parsed = parseVideoCinematicManifest(JSON.parse(raw));
    expect(parsed?.cinematics.map((descriptor) => descriptor.id)).toEqual([
      'qa-placeholder',
      'lion_judgement',
      'serpent_general_reveal',
      'lion_champion_reveal',
      'forest_journey_tension',
      'camp_departure',
      'alaric_audience_arrival',
      'refugees_approach',
      'first_refuge_arrival',
      'first_refuge_departure',
      'valmir_route_fork',
      'bois_clair_arrival',
      'bois_clair_saved',
      'second_refuge_departure',
      'witnesses_encounter',
      'ruins_approach_context',
      'shadow_signs',
      'final_refuge_dossier',
      'serpent_route_ending',
    ]);
    expect(parsed?.cinematics[0]?.placeholderOnly).toBe(true);
    const real = parsed?.cinematics.slice(1) ?? [];
    expect(real).toHaveLength(18);
    for (const descriptor of real) {
      expect(descriptor.placeholderOnly).not.toBe(true);
      expect(descriptor.sources).toEqual([{ src: `/assets/cinematics/${descriptor.id}.mp4`, type: 'video/mp4' }]);
      const mediaPath = join(process.cwd(), 'public', descriptor.sources[0]!.src);
      expect(statSync(mediaPath).size).toBeGreaterThan(0);
    }
  });
});
