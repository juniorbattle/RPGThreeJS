#!/usr/bin/env node
/**
 * R1 Action Mapping Update Generator
 *
 * Reads the R0 proposed action mappings and replaces UNASSIGNED_PENDING_R1
 * placeholders with verified Mega Pack candidate IDs from the R1 inventory.
 *
 * Output: docs/reports/vfx-megapack-r1-action-mapping-update.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS';
const R0_PATH = join(REPO, 'docs/reports/vfx-megapack-r0-proposed-action-vfx-mappings.json');
const OUT_PATH = join(REPO, 'docs/reports/vfx-megapack-r1-action-mapping-update.json');

const r0 = JSON.parse(readFileSync(R0_PATH, 'utf8'));

// Candidate mappings: actionId → { candidateId, candidateFilename, candidateCollection, processingType, r2Notes }
const CANDIDATE_MAP = {
  // Warrior
  basic_greatsword_hit: { c: 'r1_1706', f: 'Impact_Cut_V3_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy cut impact, 512px cells, physical. Recolor to match greatsword palette.' },
  w_break_guard: { c: 'r1_1603', f: 'Blue Slash v1 - Flurry_A_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy flurry slash, 256px cells. Curse visual via dark tint overlay in R2.' },
  w_charge: { c: 'r1_2561', f: 'Dash_Wind_White_v3_spritesheet.png', col: 'Wind VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Directional dash, 256px cells, wind element. REDESIGN: replaces stationary hammer crush with forward dash impact.' },
  w_whirl: { c: 'r1_1700', f: 'Fire Slash v1 - Spin_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Circular spin slash, 512px cells, radial_outward. P0 replacement for wind_slash_swirl.' },
  w_lion_surge: { c: 'r1_1605', f: 'Blue Slash v1 - Flurry_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy flurry slash at 512px. P0 replacement for execution_slash. Line charge presentation via orientation metadata.' },
  // Paladin
  basic_holy_mace_hit: { c: 'r1_0583', f: 'Impact_Punch_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Punch impact, 256px cells. Recolor to holy/gold palette in R2.' },
  p_holy_strike: { c: 'r1_0587', f: 'Impact_Shine_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy holy shine impact, 512px cells. TUNE: lower anchor, reduce scale per R3G.' },
  p_interpose: { c: 'r1_0971', f: 'Shield_On_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Shield activation, 512px cells, holy. REDESIGN: replaces body slam with protective shield impact.' },
  p_oathwall: { c: 'r1_0971', f: 'Shield_On_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Shield_On for guard layer replacement. Shield ring retained with downscale (P0 NEEDS_NORMALIZATION).' },
  p_radiant_judgement: { c: 'r1_0572', f: 'Impact_Light_Lv3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy holy light impact, 512px cells. TUNE: scale up for ultimate presentation.' },
  // Dark Knight
  basic_scythe_hit: { c: 'r1_1706', f: 'Impact_Cut_V3_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy cut, 512px. Recolor to dark palette in R2.' },
  d_cursed_blade: { c: 'r1_1698', f: 'Fire Slash v1 - Flurry_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy flurry slash, 512px. Recolor from fire to dark/curse palette.' },
  d_void_step: { c: 'r1_0543', f: 'Impact_Darkness_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small dark implosion, 512px. TUNE: use as teleport departure/arrival effect.' },
  d_blood_pact: { c: 'r1_0524', f: 'Hex_Bursts_Center_V1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Arcane hex burst, 512px. KEEP current PASS runtime sheet; candidate available if replacement desired.' },
  d_devouring_eclipse: { c: 'r1_0545', f: 'Impact_Darkness_Lv3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy dark implosion, 512px. P0 replacement for void_singularity_implosion_ultimate.' },
  // Lancer
  basic_long_spear_hit: { c: 'r1_1717', f: 'Stab_V2_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium stab, 256px cells, physical. TUNE: adjust scale for base attack.' },
  l_long_thrust: { c: 'r1_1718', f: 'Stab_V3_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy stab, 256px. TUNE: add slow visual via tint/overlay.' },
  l_haft_recoil: { c: 'r1_1719', f: 'Stab_V4_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium stab variant, 256px. Different visual from l_long_thrust for differentiation.' },
  l_griffon_jump: { c: 'r1_0583', f: 'Impact_Punch_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Punch impact, 256px. TUNE: scale up for 4AP leap. Differentiate from p_interpose via scale and tint.' },
  l_firmament_lance: { c: 'r1_1718', f: 'Stab_V3_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy stab, 256px. TUNE: scale up for ultimate line-piercing presentation.' },
  // Black Mage
  basic_grimoire_hit: { c: 'r1_0550', f: 'Impact_Hit_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Small impact, 256px. Recolor to dark palette for grimoire bolt.' },
  n_dark_bolt: { c: 'r1_0544', f: 'Impact_Darkness_Lv2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium dark implosion, 512px. KEEP current PASS sheet; candidate for root crystallization visual.' },
  n_teleport: { c: 'r1_0543', f: 'Impact_Darkness_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small dark implosion, 512px. TUNE: use as teleport departure/arrival.' },
  n_flame_wave: { c: 'r1_0450', f: 'Flamethrower_001_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'CROP_OR_REFRAME', notes: 'Directional fire, 512px. REDESIGN: replaces local burst with directional wave. Crop to emphasize wave front.' },
  n_dark_meteor: { c: 'r1_0545', f: 'Impact_Darkness_Lv3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy dark implosion, 512px. P0 replacement. COMPOSITE_LAYER with Explosion_Bomb for meteor descent+impact.' },
  // White Mage
  basic_crosier_hit: { c: 'r1_0583', f: 'Impact_Punch_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Punch impact, 256px. Recolor to holy palette for crosier strike.' },
  w_salvation: { c: 'r1_0480', f: 'Healing_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy healing, 512px, holy. Direct replacement for heal_blessing_bloom.' },
  w_purify: { c: 'r1_0587', f: 'Impact_Shine_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy holy shine, 512px. Cleanse visual — distinct from heal bloom.' },
  w_sanctuary: { c: 'r1_0677', f: 'Positive_Buff_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'LOOP_CANDIDATE', notes: 'Heavy positive buff, 512px, loop. Area regen aura — loop playback for persistent effect.' },
  w_miracle: { c: 'r1_0480', f: 'Healing_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy healing, 512px. TUNE: scale up for ultimate revive presentation, apply to all targets.' },
  // Red Mage
  basic_rapier_hit: { c: 'r1_1705', f: 'Impact_Cut_V2_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Medium cut, 256px. Recolor to arcane palette for rapier crosscut.' },
  r_arcane_blade: { c: 'r1_1709', f: 'Impact_Cut_V6_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Medium cut, 512px. Recolor to arcane. TUNE: normalize per R3H NEEDS_NORMALIZATION.' },
  r_rune_step: { c: 'r1_0543', f: 'Impact_Darkness_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Small dark implosion, 512px. Recolor to arcane for rune step teleport.' },
  r_scarlet_circle: { c: 'r1_1714', f: 'Lightning Slash v1 - Spin_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Medium spin slash, 512px. Recolor to arcane/scarlet. TUNE: hybrid damage+heal area.' },
  r_perfect_duality: { c: 'r1_1364', f: 'Fire_Burst_v3_spritesheet.png', col: 'Fire VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy fire burst, 512px. Recolor to arcane dual light/shadow for ultimate vortex.' },
  // Enchanter
  basic_wand_hit: { c: 'r1_0550', f: 'Impact_Hit_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Small impact, 256px. Recolor to arcane for wand bolt.' },
  e_vigor_rune: { c: 'r1_0503', f: 'Heart_Buff_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy heart buff, 512px, loop. Recolor to arcane for vigor rune. TUNE: normalize per R3H.' },
  e_transpose: { c: 'r1_0543', f: 'Impact_Darkness_Lv1_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Small dark implosion, 512px. Recolor to arcane for swap teleport. Two-phase: source + destination.' },
  e_binding_seal: { c: 'r1_0525', f: 'Hex_Bursts_Center_V2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium hex burst, 512px, arcane. Binding/root visual — communicates root status.' },
  e_absolute_harmony: { c: 'r1_0677', f: 'Positive_Buff_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy positive buff, 512px, loop. Recolor to arcane for team harmony aura. TUNE: multi-buff ultimate.' },
  // Archer
  basic_longbow_hit: { c: 'r1_0551', f: 'Impact_Hit_Lv2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium impact, 256px. TUNE: arrow impact, compact base scale.' },
  a_precise_shot: { c: 'r1_0551', f: 'Impact_Hit_Lv2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium impact, 256px. TUNE: add blind visual via tint/overlay.' },
  a_hawk_leap: { c: 'r1_2600', f: 'Jump_Wind_White_v2_spritesheet.png', col: 'Wind VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium jump wind, 256px. TUNE: archer repositioning, differentiate from p_interpose/l_griffon_jump.' },
  a_arrow_rain: { c: 'r1_0552', f: 'Impact_Hit_Lv3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy impact, 256px. TUNE: multi-impact area, scale up for 4AP area effect.' },
  a_zenith_arrow: { c: 'r1_0555', f: 'Impact_Hit_V3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy impact, 256px. TUNE: scale up for ultimate piercing shot.' },
  // Ninja
  basic_shuriken_hit: { c: 'r1_1694', f: 'Claw Slash v1_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small claw slash, 256px. Shuriken cut impact, physical/shadow palette.' },
  ni_venom_blade: { c: 'r1_1705', f: 'Impact_Cut_V2_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Medium cut, 256px. Recolor to poison green for venom blade strike.' },
  ni_shadow_step: { c: 'r1_1712', f: 'Lightning Slash v1 - Flurry_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy flurry slash, 512px. Recolor to shadow for teleport-strike. P0: replaces execution_slash_heavy.' },
  ni_smoke_bomb: { c: 'r1_2509', f: 'Angry_Smoke_Burst_White_v2_A_spritesheet.png', col: 'Wind VFX Spritesheets', pt: 'LOOP_CANDIDATE', notes: 'Medium smoke burst, 512px, loop. TUNE: smoke screen area effect.' },
  ni_silent_assassin: { c: 'r1_1712', f: 'Lightning Slash v1 - Flurry_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Heavy flurry slash, 512px. Recolor to shadow. Two-phase: void departure + execution slash.' },
  // Rogue
  basic_dagger_hit: { c: 'r1_1704', f: 'Impact_Cut_V1_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small cut, 256px. Dagger crosscut impact, physical palette.' },
  ro_sneak_attack: { c: 'r1_1705', f: 'Impact_Cut_V2_spritesheet.png', col: 'Sword Slash VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium cut, 256px. Sneak attack/backstab — differentiate from basic_dagger_hit via scale/tint.' },
  ro_tumble: { c: 'r1_2599', f: 'Jump_Wind_White_v1_spritesheet.png', col: 'Wind VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small jump wind, 256px. TUNE: dodge roll, not body slam.' },
  ro_jaw_trap: { c: 'r1_0525', f: 'Hex_Bursts_Center_V2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'RECOLOR_CANDIDATE', notes: 'Medium hex burst, 512px. Recolor to physical for mechanical trap/root visual.' },
  ro_fault_breaker: { c: 'r1_0457', f: 'Glass Shatter_Cone_Gravity_V2_A_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium glass shatter cone, 512px, directional. Guard-breaking shatter at ultimate scale.' },
  // Artillerist
  basic_hand_cannon_hit: { c: 'r1_0534', f: 'Impact_Cartoon Hit_V2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium cartoon impact, 256px. TUNE: cannon bullet, differentiate from arrow impact.' },
  ar_calibrated_shot: { c: 'r1_0551', f: 'Impact_Hit_Lv2_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Medium impact, 256px. TUNE: calibrated shot, differentiate from archer arrow.' },
  ar_explosive_retreat: { c: 'r1_1362', f: 'Fire_Burst_v1_spritesheet.png', col: 'Fire VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Small fire burst, 256px. Tactical retreat explosion — secondary, not primary attack.' },
  ar_incendiary_grenade: { c: 'r1_1364', f: 'Fire_Burst_v3_spritesheet.png', col: 'Fire VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy fire burst, 512px. Thrown grenade explosion, fire palette.' },
  ar_artillery_barrage: { c: 'r1_0552', f: 'Impact_Hit_Lv3_spritesheet.png', col: 'Essentials VFX Spritesheets', pt: 'EXTRACT_AND_REPACK', notes: 'Heavy impact, 256px. TUNE: multi-impact cluster, 3 visual impacts for sustained barrage.' },
};

// Transform actions
const updatedActions = r0.actions.map(action => {
  const mapping = CANDIDATE_MAP[action.actionId];
  if (!mapping) {
    return { ...action, approvalStatus: 'R1_INDEXED_NO_CANDIDATE' };
  }

  const proposed = { ...action.proposedR0R5VfxPresentation };
  proposed.megaPackCandidateId = mapping.c;
  proposed.megaPackCategory = mapping.col;
  proposed.megaPackCandidateFilename = mapping.f;
  proposed.r2ProcessingType = mapping.pt;
  proposed.r2Notes = mapping.notes;

  return {
    ...action,
    proposedR0R5VfxPresentation: proposed,
    approvalStatus: 'R1_INDEXED',
  };
});

const output = {
  title: 'VFX Mega Pack R1 — Action Mapping Update',
  description: 'Updated action-to-VFX mappings with verified Mega Pack candidate IDs from the R1 inventory. All 60 hero actions now have candidate assignments replacing UNASSIGNED_PENDING_R1 placeholders. No runtime code, preset, mapping, UV, flipY, or frame-order changes. Source files remain external to the repository.',
  generatedAt: '2026-08-06',
  megaPackStatus: 'PURCHASED_AND_INDEXED',
  r1Blocked: false,
  r1Completed: true,
  totalCandidates: 2769,
  actions: updatedActions,
  summary: {
    totalActions: 60,
    indexedActions: 60,
    classificationCounts: r0.summary.classificationCounts,
    p0Sheets: r0.summary.p0Sheets,
    p0CandidatesAssigned: 6,
    semanticMismatches: r0.summary.semanticMismatches,
    semanticMismatchCandidatesAssigned: 3,
    recolorCandidates: Object.values(CANDIDATE_MAP).filter(m => m.pt === 'RECOLOR_CANDIDATE').length,
    extractAndRepackCandidates: Object.values(CANDIDATE_MAP).filter(m => m.pt === 'EXTRACT_AND_REPACK').length,
    loopCandidates: Object.values(CANDIDATE_MAP).filter(m => m.pt === 'LOOP_CANDIDATE').length,
    cropOrReframeCandidates: Object.values(CANDIDATE_MAP).filter(m => m.pt === 'CROP_OR_REFRAME').length,
    allMegaPackCandidatesAssigned: true,
  },
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
console.log(`Wrote ${updatedActions.length} action mappings to vfx-megapack-r1-action-mapping-update.json`);
console.log(`Recolor: ${output.summary.recolorCandidates}, Extract&Repack: ${output.summary.extractAndRepackCandidates}, Loop: ${output.summary.loopCandidates}, Crop: ${output.summary.cropOrReframeCandidates}`);
