import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { combatConfigs } from '../game/content';
import { LOT_E_ELITES } from '../campaign/LionPoiAuthoring';

/**
 * Set 1.19.0 (OD-2026-11-07-G): the real runtime functions, run on a stub battlefield. Mechanical proof only; the browser
 * check covers the native fight.
 */
const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
const between = (start: string, end: string) => {
  const from = runtime.indexOf(start), to = runtime.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`missing ${start}`);
  return runtime.slice(from, to);
};
const source = [
  between('function encounterFoeDefs(){', '\nfunction spawnUnits(){'),
  between('function checkEnd(){', '\n'),
  between('function freeWaveCell(gx,gz,size=1){', '\nfunction freeNear(gx,gz){'),
].join('\n');

interface Unit { name: string; team: 'player' | 'foe'; alive: boolean; gx: number; gz: number; hp: number; str?: number }
function battle(waves: number, campaign = true) {
  const formation = [{ name: 'Brute', team: 'foe' as const, gx: 5, gz: 1, hp: 90, str: 14 }, { name: 'Pillard', team: 'foe' as const, gx: 6, gz: 2, hp: 70, str: 11 }];
  const cells = new Map<string, { gx: number; gz: number; walkable: boolean; occupant: Unit | null }>();
  for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 5; gz++) cells.set(`${gx},${gz}`, { gx, gz, walkable: true, occupant: null });
  const hero: Unit = { name: 'Alistair', team: 'player', alive: true, gx: 1, gz: 1, hp: 31 };
  const G = { units: [hero, ...formation.map(def => ({ ...def, alive: false }))] as Unit[], wave: 1, round: 4, over: false };
  const createUnit = vi.fn((def: Unit) => { const unit = { ...def, alive: true }; G.units.push(unit); cells.get(`${def.gx},${def.gz}`)!.occupant = unit; return unit; });
  const winWave = vi.fn(), endGame = vi.fn(), setHint = vi.fn(), logMsg = vi.fn(), refreshTurnbar = vi.fn();
  const status = { textContent: '' };
  const api = new Function('G', 'CAMPAIGN_MODE', 'COMBAT_WAVES', 'ENCOUNTER_ENEMY_VISUAL_IDS', 'VISUAL_UNIT_TEMPLATES', 'DEFS', 'unitDefFromVisual',
    'ESCORT_VISUAL_POSITIONS', 'createUnit', 'cellAt', 'aliveUnits', 'winWave', 'endGame', 'setHint', 'logMsg', 'byId', 'refreshTurnbar',
    `${source}\nreturn { checkEnd };`)(
    G, campaign, waves, [], {}, formation, () => null, [], createUnit, (gx: number, gz: number) => cells.get(`${gx},${gz}`),
    (team: string) => G.units.filter(unit => unit.team === team && unit.alive), winWave, endGame, setHint, logMsg, () => status, refreshTurnbar,
  ) as { checkEnd: () => boolean };
  return { api, G, hero, formation, createUnit, winWave, setHint, status, refreshTurnbar };
}

describe('guardian waves in the tactical runtime (set 1.19.0)', () => {
  it('declares two waves on the two guardian configs only', () => {
    for (const elite of LOT_E_ELITES) expect(combatConfigs.get(elite.combat.id)!.waves).toBe(2);
    const others = [...combatConfigs.values()].filter(config => !LOT_E_ELITES.some(elite => elite.combat.id === config.id));
    expect(others.every(config => config.waves === undefined)).toBe(true);
  });

  it('brings in the same formation again when the first wave falls, with no result and nothing restored', () => {
    const { api, G, hero, formation, createUnit, winWave, setHint, status } = battle(2);
    expect(api.checkEnd()).toBe(false);
    expect(winWave).not.toHaveBeenCalled();expect(G.over).toBe(false);
    expect(G.wave).toBe(2);expect(G.round).toBe(4);expect(hero.hp).toBe(31);
    expect(createUnit).toHaveBeenCalledTimes(2);
    // Same stats; never on a fallen body, so each enemy takes the nearest free cell instead.
    for (const [index, def] of formation.entries()) {
      const placed = createUnit.mock.calls[index]![0];
      expect({ ...placed, gx: def.gx, gz: def.gz }).toEqual(def);
      expect([placed.gx, placed.gz]).not.toEqual([def.gx, def.gz]);
    }
    expect(setHint).toHaveBeenCalledWith('Vague 2 / 2 — des renforts entrent sur le terrain');
    expect(status.textContent).toBe('Vague 2 / 2 — des renforts entrent sur le terrain');
    // The fight is won only when the second wave falls.
    for (const unit of G.units.filter(unit => unit.team === 'foe')) unit.alive = false;
    expect(api.checkEnd()).toBe(true);expect(winWave).toHaveBeenCalledOnce();expect(createUnit).toHaveBeenCalledTimes(2);
  });

  it('keeps a single wave for every other fight and outside the campaign', () => {
    for (const [waves, campaign] of [[1, true], [2, false]] as const) {
      const { api, winWave, createUnit } = battle(waves, campaign);
      expect(api.checkEnd()).toBe(true);expect(winWave).toHaveBeenCalledOnce();expect(createUnit).not.toHaveBeenCalled();
    }
  });

  it('never fights a second wave once the company has fallen', () => {
    const { api, G, hero, winWave, createUnit } = battle(2);
    hero.alive = false;
    api.checkEnd();
    expect(createUnit).not.toHaveBeenCalled();expect(G.wave).toBe(1);expect(winWave).toHaveBeenCalledOnce();
  });

  it('keeps the facts of the whole fight and follows the existing defeat rules during the second wave', () => {
    const { api, G, hero, winWave } = battle(2);
    (G as typeof G & { itemsUsedTotal: number }).itemsUsedTotal = 3;
    expect(api.checkEnd()).toBe(false);
    expect(G.round).toBe(4);expect((G as typeof G & { itemsUsedTotal: number }).itemsUsedTotal).toBe(3);
    hero.alive = false;
    const endGame = vi.fn();
    const rerun = new Function('G', 'CAMPAIGN_MODE', 'COMBAT_WAVES', 'aliveUnits', 'winWave', 'endGame', 'enterCampaignWave',
      `${between('function checkEnd(){', '\n')}\nreturn checkEnd;`)(G, true, 2, (team: string) => G.units.filter(unit => unit.team === team && unit.alive), winWave, endGame, vi.fn()) as () => boolean;
    expect(rerun()).toBe(true);expect(endGame).toHaveBeenCalledWith(false);expect(winWave).not.toHaveBeenCalled();
  });

  it('places a large enemy only where its whole footprint is free, inside the grid and off every fallen body', () => {
    const cells = new Map<string, { gx: number; gz: number; walkable: boolean; occupant: unknown }>();
    for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 5; gz++) cells.set(`${gx},${gz}`, { gx, gz, walkable: true, occupant: null });
    const hero = { team: 'player', alive: true, gx: 5, gz: 3 };
    cells.get('5,3')!.occupant = hero;
    const G = { units: [hero, { team: 'foe', alive: false, gx: 6, gz: 1, size: 2 }] };
    const free = new Function('G', 'cellAt', `${between('function freeWaveCell(gx,gz,size=1){', '\nfunction enterCampaignWave(){')}\nreturn freeWaveCell;`)(
      G, (gx: number, gz: number) => cells.get(`${gx},${gz}`)) as (gx: number, gz: number, size?: number) => { gx: number; gz: number } | null;
    const cell = free(6, 1, 2)!;
    const footprint = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [cell.gx + dx!, cell.gz + dz!]);
    for (const [gx, gz] of footprint) {
      expect(cells.has(`${gx},${gz}`)).toBe(true);
      expect([gx, gz]).not.toEqual([5, 3]);
      expect(gx! >= 6 && gx! <= 7 && gz! >= 1 && gz! <= 2).toBe(false);
    }
    expect([cell.gx, cell.gz]).toEqual([4, 1]);
    // A small enemy still takes the nearest single free cell.
    expect(free(5, 1)).toEqual(cells.get('5,1'));
  });

  it('states the waves at deployment and the current wave in the objective', () => {
    expect(runtime).toContain("(CAMPAIGN_MODE&&COMBAT_WAVES>1?' · Vague '+G.wave+' / '+COMBAT_WAVES:'')");
    expect(runtime).toContain("vagues</b> · la seconde entre dès que la première tombe, sans soin entre les deux</p>");
    expect(runtime).toContain('COMBAT_WAVES=Math.max(1,Math.min(2,Number(message.config.waves)||1));');
  });

  it('enters the wave by a path that is not the skirmish transition and reports the outcome only from winWave', () => {
    const wave = between('function enterCampaignWave(){', '\nfunction freeNear(gx,gz){');
    for (const forbidden of ['startNextWave', 'spawnWave', 'notifyCampaignResult', 'showCombatResult', "combatCue('victory')", 'reviveUnit', 'maxhp', 'G.round=0'])
      expect(wave).not.toContain(forbidden);
  });
});
