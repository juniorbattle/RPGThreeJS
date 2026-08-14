#!/usr/bin/env node
/**
 * Validates the published VFX preset registry.
 *
 * Usage: npm run vfx:validate-published
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REGISTRY_PATH = join(process.cwd(), 'src', 'combat', 'vfx', 'generated', 'published-vfx-presets.json');

const VALID_SIZES = new Set(['LOW', 'MID', 'BIG', 'GIGA']);
const VALID_TIMINGS = new Set(['QUICK', 'NORMAL', 'LONG']);
const VALID_PLACEMENTS = new Set(['AUTO', 'TARGET', 'CASTER', 'GROUND']);
const VALID_CHOREOGRAPHIES = new Set(['TOGETHER', 'SEQUENCE', 'PAIR_THEN_LAST']);
const VALID_POLISH = new Set(['AUTO', 'OFF', 'LIGHT', 'STRONG']);

function validateRegistry(registry) {
  const errors = [];
  if (typeof registry !== 'object' || registry === null) return { ok: false, errors: ['Registry is not an object.'] };
  if (registry.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (typeof registry.actions !== 'object' || registry.actions === null) { errors.push('actions must be an object.'); return { ok: false, errors }; }
  for (const actionKey of Object.keys(registry.actions)) {
    const e = registry.actions[actionKey];
    if (typeof e !== 'object' || e === null) { errors.push(`[${actionKey}] Entry is not an object.`); continue; }
    if (typeof e.actionKey !== 'string' || e.actionKey.length === 0) errors.push(`[${actionKey}] actionKey must be a non-empty string.`);
    else if (e.actionKey !== actionKey) errors.push(`[${actionKey}] actionKey mismatch.`);
    if (typeof e.presetId !== 'string' || !e.presetId.startsWith('published_')) errors.push(`[${actionKey}] presetId must start with "published_".`);
    if (typeof e.fingerprint !== 'string' || !/^[0-9a-f]{8}$/.test(e.fingerprint)) errors.push(`[${actionKey}] fingerprint must be 8-char hex.`);
    if (!VALID_CHOREOGRAPHIES.has(e.choreography)) errors.push(`[${actionKey}] choreography invalid: ${e.choreography}`);
    if (!VALID_POLISH.has(e.technicalPolish)) errors.push(`[${actionKey}] technicalPolish invalid: ${e.technicalPolish}`);
    if (!Array.isArray(e.visualSlots)) { errors.push(`[${actionKey}] visualSlots must be an array.`); continue; }
    if (e.visualSlots.length === 0) errors.push(`[${actionKey}] visualSlots must contain at least one slot.`);
    for (let i = 0; i < e.visualSlots.length; i++) {
      const s = e.visualSlots[i];
      if (typeof s !== 'object' || s === null) { errors.push(`[${actionKey}] Slot ${i} is not an object.`); continue; }
      if (typeof s.id !== 'string' || s.id.length === 0) errors.push(`[${actionKey}] Slot ${i}: id required.`);
      if (typeof s.candidateId !== 'string' || !/^r1_\d+$/.test(s.candidateId)) errors.push(`[${actionKey}] Slot ${i}: candidateId must match r1_xxxx.`);
      if (!VALID_SIZES.has(s.sizeProfile)) errors.push(`[${actionKey}] Slot ${i}: sizeProfile invalid.`);
      if (!VALID_TIMINGS.has(s.timingProfile)) errors.push(`[${actionKey}] Slot ${i}: timingProfile invalid.`);
      if (!VALID_PLACEMENTS.has(s.placementProfile)) errors.push(`[${actionKey}] Slot ${i}: placementProfile invalid.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

let raw;
try { raw = readFileSync(REGISTRY_PATH, 'utf-8'); } catch { console.error('FAIL: Cannot read registry file.'); process.exit(1); }
let registry;
try { registry = JSON.parse(raw); } catch { console.error('FAIL: Registry is not valid JSON.'); process.exit(1); }

const result = validateRegistry(registry);
if (result.ok) {
  const count = Object.keys(registry.actions).length;
  console.log(`=== Published VFX Registry Validator ===`);
  console.log(`Schema version: ${registry.schemaVersion}`);
  console.log(`Actions: ${count}`);
  if (count > 0) for (const [k, e] of Object.entries(registry.actions)) console.log(`  ${k}: ${e.presetId}, fp=${e.fingerprint}, slots=${e.visualSlots.length}`);
  console.log('PASS: Registry is valid.');
  process.exit(0);
} else {
  console.error('FAIL: Registry validation errors:');
  for (const err of result.errors) console.error(`  ${err}`);
  process.exit(1);
}
