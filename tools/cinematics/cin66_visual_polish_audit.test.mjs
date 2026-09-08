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
    expect(result.entryCount).toBe(20);
    expect(input.entries.every((entry) => entry.criteriaScores.length === VISUAL_POLISH_CRITERIA.length)).toBe(true);
  });

  it('keeps the two authorized remasters promoted and starts no P1 production', () => {
    expect(input.entries.find((entry) => entry.runtimeId === 'camp_departure')?.classification).toBe('KEEP');
    expect(input.entries.find((entry) => entry.runtimeId === 'alaric_audience_arrival')?.classification).toBe('KEEP');
    expect(input.entries.map((entry) => entry.runtimeId)).not.toContain('bois_clair_road_tension');
    expect(input.summary.totalProductionMasters).toBe(20);
  });

  it('requires exact media defects for the future remaster queue', () => {
    const remasters = input.entries.filter((entry) => entry.classification === 'REMASTER_MEDIA');
    expect(remasters.map((entry) => entry.runtimeId)).toEqual(['lion_judgement', 'forest_journey_tension', 'lion_trial_route_ending']);
    expect(remasters.every((entry) => entry.issues.length > 0 && entry.criteriaScores.includes('FAIL'))).toBe(true);
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
