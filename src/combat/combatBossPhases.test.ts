import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

/**
 * Set 1.20.0 (COMBAT_AND_VFX "Boss phases"), post-demo Lot 4: the real runtime functions, run on a stub battlefield.
 * The breach's second phase enters by the wave's non-result path: no result, nothing restored, the round goes on, and
 * its boss is chosen by the fight and its phase. Mechanical proof only; the browser check covers the native fight.
 */
const runtime = readFileSync('src/combat/legacyCombatRuntime.js', 'utf8');
const between = (start: string, end: string) => {
  const from = runtime.indexOf(start), to = runtime.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`missing ${start}`);
  return runtime.slice(from, to);
};
const source = [
  between('function checkEnd(){', '\n'),
  between('function freeWaveCell(gx,gz,size=1){', '\nfunction enterCampaignWave(){'),
  between('function enterCampaignPhase(){', '\nfunction freeNear(gx,gz){'),
].join('\n');

interface Unit { name: string; team: 'player' | 'foe'; alive: boolean; gx: number; gz: number; hp: number; size?: number; boss?: boolean }
const BOSSES = [
  { name: 'Maelor', combatIds: ['finale_breach'], phase: 1, hp: 500 },
  { name: 'Entité de la brèche', combatIds: ['finale_breach'], phase: 2, hp: 620 },
];

function battle(phases: { label: string; bossVisualId: string; escortVisualIds: string[] }[], campaign = true) {
  const cells = new Map<string, { gx: number; gz: number; walkable: boolean; occupant: Unit | null }>();
  for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 5; gz++) cells.set(`${gx},${gz}`, { gx, gz, walkable: true, occupant: null });
  const hero: Unit = { name: 'Alistair', team: 'player', alive: true, gx: 1, gz: 1, hp: 31 };
  const G = { units: [hero, { name: 'Maelor', team: 'foe' as const, alive: false, gx: 6, gz: 1, hp: 0, size: 2, boss: true }] as Unit[], wave: 1, phase: 1, round: 6, over: false };
  const createUnit = vi.fn((def: Unit) => { const unit = { ...def, alive: true }; G.units.push(unit); cells.get(`${def.gx},${def.gz}`)!.occupant = unit; return unit; });
  const winWave = vi.fn(), endGame = vi.fn(), setHint = vi.fn(), logMsg = vi.fn(), refreshTurnbar = vi.fn();
  const status = { textContent: '' };
  const templates: Record<string, Unit> = { breach_demon: { name: 'Démon de la brèche', team: 'foe', alive: true, gx: 0, gz: 0, hp: 112 } };
  const api = new Function('G', 'CAMPAIGN_MODE', 'COMBAT_WAVES', 'COMBAT_PHASES', 'COMBAT_ID', 'BOSS_DEFS', 'VISUAL_UNIT_TEMPLATES', 'ESCORT_VISUAL_POSITIONS',
    'unitDefFromVisual', 'createUnit', 'cellAt', 'aliveUnits', 'winWave', 'endGame', 'enterCampaignWave', 'setHint', 'logMsg', 'byId', 'refreshTurnbar',
    `${source}\nreturn { checkEnd };`)(
    G, campaign, 1, phases, 'finale_breach', BOSSES, templates, [[5, 0], [5, 3], [4, 1]],
    (id: string, index: number, positions: number[][]) => templates[id] ? { ...templates[id], gx: positions[index]![0], gz: positions[index]![1] } : null,
    createUnit, (gx: number, gz: number) => cells.get(`${gx},${gz}`),
    (team: string) => G.units.filter((unit) => unit.team === team && unit.alive), winWave, endGame, () => { throw new Error('no wave'); },
    setHint, logMsg, () => status, refreshTurnbar,
  ) as { checkEnd: () => boolean };
  return { api, G, hero, createUnit, winWave, setHint, status };
}

const PHASE = [{ label: 'L’entité de la brèche', bossVisualId: 'breach_entity', escortVisualIds: ['breach_demon', 'breach_demon'] }];

describe('the breach in two phases in the tactical runtime (set 1.20.0, Lot 4)', () => {
  it('brings in the entity when Maelor falls, with no result and nothing restored, then wins after the last phase', () => {
    const { api, G, hero, createUnit, winWave, setHint, status } = battle(PHASE);
    expect(api.checkEnd()).toBe(false);
    expect(winWave).not.toHaveBeenCalled();
    expect([G.phase, G.round, hero.hp, G.over]).toEqual([2, 6, 31, false]);
    const spawned = createUnit.mock.calls.map((call) => call[0]);
    expect(spawned[0]).toMatchObject({ name: 'Entité de la brèche', boss: true, size: 2 });
    // Never on Maelor's fallen body: the entity takes the nearest free cells.
    expect([spawned[0]!.gx, spawned[0]!.gz]).not.toEqual([6, 1]);
    expect(spawned.slice(1).map((unit) => unit.name)).toEqual(['Démon de la brèche', 'Démon de la brèche']);
    expect(setHint).toHaveBeenCalledWith('Phase 2 / 2 — L’entité de la brèche');
    expect(status.textContent).toBe('Phase 2 / 2 — L’entité de la brèche');
    for (const unit of G.units) if (unit.team === 'foe') unit.alive = false;
    expect(api.checkEnd()).toBe(true);
    expect(winWave).toHaveBeenCalledTimes(1);
  });

  it('keeps one phase for every other fight and outside the campaign', () => {
    for (const [phases, campaign] of [[[], true], [PHASE, false]] as const) {
      const { api, winWave, createUnit } = battle([...phases], campaign);
      expect(api.checkEnd()).toBe(true);
      expect(winWave).toHaveBeenCalledTimes(1);
      expect(createUnit).not.toHaveBeenCalled();
    }
  });

  it('declares phases on the breach only, and states the supports and phases at deployment', () => {
    expect(runtime).toContain("'<p class=\"deploy-challenge\"><b>'+(COMBAT_PHASES.length+1)+' phases</b>");
    expect(runtime).toContain("'<p class=\"deploy-challenge\"><b>Soutiens</b> · '");
    // A support never touches the bag, the item counters or a challenge.
    expect(between('function openSupportMenu(){', '\nfunction openItemMenu(){')).not.toMatch(/G\.inv|itemsUsed/);
  });
});
