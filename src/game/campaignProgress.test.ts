// @vitest-environment happy-dom
/**
 * Set 1.20.0, post-demo Lot 0: the campaign record's migration and resume from a demo save.
 *
 * The three fixtures are genuine demo V6 saves: they were written by the `origin/dev` demo code itself (store and
 * RunSystem at 25ccd2f2), at the witnesses of a mid-Lion honour run and at the end of an honour and a force chronicle.
 */
import { afterEach, describe, expect, it } from 'vitest';
import midLion from './__fixtures__/demo-v6-mid-lion.json';
import lionHonourComplete from './__fixtures__/demo-v6-lion-honour-complete.json';
import lionForceComplete from './__fixtures__/demo-v6-lion-force-complete.json';
import { CAMPAIGN_CLAN_IDS } from '../campaign/plateaux/PlateauRegistry';
import {
  campaignProgressSchema,
  createCampaignProgress,
  deriveCampaignProgress,
  migrateCampaignProgress,
} from './campaignProgress';
import {
  enterPoi,
  getClanRelation,
  isClanMet,
  recordPlateauOutcome,
  selectPoiMap,
  setClanRelation,
} from './runSystem';
import { createInitialState, migrateState, SaveRepository } from './store';
import { gameStateSchema, type GameState } from './types';

const DEMO_AUTO_KEY = 'rpg-threejs:autosave:v6';
const CAMPAIGN_AUTO_KEY = 'rpg-threejs:autosave:v6:campaign';
const fixtures = { midLion, lionHonourComplete, lionForceComplete } as const;
const demoSchema = gameStateSchema.omit({ campaign: true }).strict();

afterEach(() => localStorage.clear());

function withoutCampaign(state: GameState): Omit<GameState, 'campaign'> {
  const { campaign: _campaign, ...rest } = state;
  return rest;
}

describe('campaign record migration from a demo V6 save (set 1.20.0, Lot 0)', () => {
  it.each(Object.entries(fixtures))('the %s fixture is a genuine demo V6 save with no campaign record', (_name, fixture) => {
    expect(demoSchema.safeParse(fixture).success).toBe(true);
    expect('campaign' in fixture).toBe(false);
    expect(fixture.version).toBe(6);
  });

  it.each(Object.entries(fixtures))('migrating %s changes no Lion fact and only adds the derived record', (_name, fixture) => {
    const loaded = migrateState(structuredClone(fixture));
    expect(withoutCampaign(loaded)).toEqual(fixture);
    expect(campaignProgressSchema.safeParse(loaded.campaign).success).toBe(true);
    expect(migrateState(structuredClone(loaded))).toEqual(loaded);
  });

  it('resumes a mid-Lion demo save at its saved point, the Lion current and every clan neutral until met', () => {
    const loaded = migrateState(structuredClone(midLion));
    expect(loaded.campaign).toEqual(createCampaignProgress());
    expect(loaded.currentNodeId).toBe(midLion.currentNodeId);
    for (const clan of CAMPAIGN_CLAN_IDS) {
      expect(isClanMet(loaded, clan)).toBe(false);
      expect(getClanRelation(loaded, clan)).toBe('neutral');
    }
    const map = selectPoiMap(loaded);
    expect(map.currentNodeId).toBe(midLion.currentNodeId);
    const next = map.nodes.find((node) => node.canMove && node.status === 'available');
    expect(next).toBeDefined();
    expect(enterPoi(loaded, next!.id)?.node.id).toBe(next!.id);
  });

  it('derives a completed Lion and its outcome from the demo chronicle, without meeting any clan', () => {
    const honour = migrateState(structuredClone(lionHonourComplete));
    expect(honour.campaign?.chapters.lion).toEqual({ status: 'completed', outcome: 'honour' });
    expect(honour.campaign?.currentChapterId).toBe('lion');
    expect(honour.campaign?.chapters.bear).toEqual({ status: 'locked' });
    expect(honour.campaign?.clanRelations).toEqual({});
    const force = migrateState(structuredClone(lionForceComplete));
    expect(force.campaign?.chapters.lion).toEqual({ status: 'completed', outcome: 'force' });
    expect(force.reputation).toBe(lionForceComplete.reputation);
  });

  it('loads a demo save from the demo key, writes the record to its own slot and reloads it unchanged', () => {
    const demoBytes = JSON.stringify(midLion);
    localStorage.setItem(DEMO_AUTO_KEY, demoBytes);
    const saves = new SaveRepository();
    const loaded = saves.loadAuto()!;
    expect(withoutCampaign(loaded)).toEqual(midLion);
    saves.saveAuto(loaded);
    const stored = JSON.parse(localStorage.getItem(CAMPAIGN_AUTO_KEY)!);
    expect(stored.campaign.version).toBe(1);
    expect(saves.loadAuto()).toEqual(loaded);
    // Final audit 2026-11-11 (A7): the frozen demo's own slot is never rewritten by this build.
    expect(localStorage.getItem(DEMO_AUTO_KEY)).toBe(demoBytes);
  });

  it('keeps a post-demo chronicle when the frozen demo later writes its shared slot on the same origin', () => {
    const saves = new SaveRepository();
    const chronicle = createInitialState();
    recordPlateauOutcome(chronicle, 'lion', 'honour');
    saves.saveAuto(chronicle);
    localStorage.setItem(DEMO_AUTO_KEY, JSON.stringify(midLion));
    expect(saves.loadAuto()?.campaign?.chapters.lion.outcome).toBe('honour');
    saves.clear();
    expect(saves.hasSave()).toBe(false);
  });

  it('keeps relations and outcomes across a save and a load', () => {
    const state = createInitialState();
    setClanRelation(state, 'lion', 'ally', 'lion.outcome.honour');
    setClanRelation(state, 'serpent', 'enemy', 'lion.outcome.honour');
    recordPlateauOutcome(state, 'lion', 'honour');
    const saves = new SaveRepository();
    saves.saveAuto(state);
    const loaded = saves.loadAuto()!;
    expect(loaded.campaign?.clanRelations).toEqual({
      lion: { stance: 'ally', causeIds: ['lion.outcome.honour'] },
      serpent: { stance: 'enemy', causeIds: ['lion.outcome.honour'] },
    });
    expect(loaded.campaign?.chapters.lion.outcome).toBe('honour');
  });

  it('migrates an older V5 save through to a derived record', () => {
    const v5 = { ...withoutCampaign(migrateState(structuredClone(midLion))), version: 5 } as Record<string, unknown>;
    v5.clan = { ...(v5.clan as object), members: (midLion.clan.members as { currentHealth?: number; skillUpgrades?: object }[])
      .map(({ currentHealth: _h, skillUpgrades: _s, ...unit }) => unit) };
    const loaded = migrateState(v5);
    expect(loaded.version).toBe(6);
    expect(loaded.campaign).toEqual(createCampaignProgress());
    expect(loaded.flags).toEqual(midLion.flags);
  });

  it('refuses a malformed or unknown campaign record instead of silently rewriting it', () => {
    expect(() => migrateCampaignProgress({ ...(midLion as unknown as GameState), campaign: { version: 2 } })).toThrow();
    localStorage.setItem(DEMO_AUTO_KEY, JSON.stringify({ ...midLion, campaign: { version: 2 } }));
    const warn = console.warn;
    console.warn = () => undefined;
    try {
      expect(new SaveRepository().loadAuto()).toBeNull();
    } finally {
      console.warn = warn;
    }
  });

  it('saves durable facts only: waves, phases, supports and visual state have no field in the record', () => {
    const record = createCampaignProgress();
    expect(Object.keys(record).sort()).toEqual(['chapters', 'clanRelations', 'currentChapterId', 'ending', 'finalAct', 'version']);
    for (const transient of ['usedSupports', 'supports', 'wave', 'bossPhase', 'camera', 'animation']) {
      expect(campaignProgressSchema.safeParse({ ...record, [transient]: [] }).success).toBe(false);
    }
    expect(campaignProgressSchema.safeParse({ ...record, finalAct: { ...record.finalAct, phase: 1 } }).success).toBe(false);
  });

  it('lets a frozen demo build read a post-demo save: the demo schema ignores the record', () => {
    const postDemo = createInitialState();
    setClanRelation(postDemo, 'lion', 'ally', 'lion.outcome.honour');
    const demoRead = gameStateSchema.omit({ campaign: true }).safeParse(JSON.parse(JSON.stringify(postDemo)));
    expect(demoRead.success).toBe(true);
    expect(demoRead.success && 'campaign' in demoRead.data).toBe(false);
  });

  it('derives the same record from a fresh game as a new game creates', () => {
    expect(deriveCampaignProgress(createInitialState())).toEqual(createInitialState().campaign);
  });
});
