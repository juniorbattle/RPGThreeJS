import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateCinematicVisualPolishAudit, VISUAL_POLISH_AUDIT_PATH, VISUAL_POLISH_CRITERIA } from './validate_cinematic_visual_polish_audit.mjs';

const projectRoot = process.cwd();
const input = JSON.parse(await readFile(resolve(projectRoot, VISUAL_POLISH_AUDIT_PATH), 'utf8'));

describe('CIN-6.6 production visual polish audit', () => {
  it('covers every current production master with every required criterion', async () => {
    const result = await validateCinematicVisualPolishAudit(input, { projectRoot });
    expect(result.errors).toEqual([]);
    expect(result.entryCount).toBe(31);
    expect(input.entries.every((entry) => entry.criteriaScores.length === VISUAL_POLISH_CRITERIA.length)).toBe(true);
  });

  it('keeps the three V3 pilots and the eleven approved CIN-6C P1 masters', () => {
    expect(input.entries.find((entry) => entry.runtimeId === 'camp_departure')?.classification).toBe('KEEP');
    expect(input.entries.find((entry) => entry.runtimeId === 'alaric_audience_arrival')?.classification).toBe('KEEP');
    expect(input.entries.find((entry) => entry.runtimeId === 'valmir_route_fork')?.classification).toBe('KEEP');
    expect(input.entries.filter((entry) => entry.classification === 'KEEP').map((entry) => entry.runtimeId)).toEqual([
      'camp_departure', 'alaric_audience_arrival', 'valmir_route_fork',
      'cedric_encounter', 'garen_encounter', 'serpent_road_tension', 'shrine_reveal_context',
      'injured_merchant_encounter', 'abandoned_cart_reveal', 'spider_nest_reveal',
      'troll_crossing_reveal', 'serpent_duelist_reveal', 'young_dragon_encounter',
      'serpent_informant_encounter',
    ]);
    expect(input.entries.map((entry) => entry.runtimeId)).not.toContain('bois_clair_road_tension');
    expect(input.summary.totalProductionMasters).toBe(31);
  });

  it('requires exact media defects for the future remaster and family queues', () => {
    const queued = input.entries.filter((entry) => ['REMASTER', 'REPLACE_WITH_FAMILY'].includes(entry.classification));
    expect(queued).toHaveLength(17);
    expect(queued.every((entry) => entry.issues.length > 0 && entry.criteriaScores.includes('FAIL'))).toBe(true);
    expect(input.summary).toMatchObject({ keep: 14, runtimePolish: 0, remaster: 12, replaceWithFamily: 5 });
    expect(input.summary.cin6cBlockers).toBe(0);
  });

  it('rejects summary drift and duplicate coverage', async () => {
    const changed = structuredClone(input);
    changed.summary.keep += 1;
    changed.entries[1].runtimeId = changed.entries[0].runtimeId;
    const result = await validateCinematicVisualPolishAudit(changed, { projectRoot });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('duplicates'))).toBe(true);
    expect(result.errors.some((error) => error.includes('summary'))).toBe(true);
  });
});
