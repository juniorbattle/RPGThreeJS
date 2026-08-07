#!/usr/bin/env node
/**
 * R1 Deliverable Generator — transforms raw scan data into the 5 R1 deliverables.
 *
 * Inputs:  03_inventory_output/r1_inventory_raw.json (external)
 * Outputs: docs/reports/vfx-megapack-r1-inventory.json (repo)
 *
 * The markdown and action-mapping deliverables are authored separately.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MEGA_PACK_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const RAW_PATH = join(MEGA_PACK_ROOT, '03_inventory_output', 'r1_inventory_raw.json');
const REPO_REPORTS = 'c:\\Users\\miche\\Documents\\Projects\\RPGThreeJS\\docs\\reports';

const raw = JSON.parse(readFileSync(RAW_PATH, 'utf8'));

// Transform raw assets to VfxAssetCandidate schema
const candidates = raw.assets.map(a => {
  if (a.error) {
    return {
      candidateId: a.candidateId,
      sourceCollection: a.sourceCollection,
      sourcePath: a.sourcePath,
      sourceFilename: a.sourceFilename,
      frameCount: 0,
      frameDimensions: { width: 0, height: 0 },
      alphaAvailability: 'PENDING_SOURCE_INSPECTION',
      animationDuration: 0,
      loopSuitability: 'PENDING_SOURCE_INSPECTION',
      visualFamily: 'UNASSIGNED_PENDING_R1',
      element: 'UNASSIGNED_PENDING_R1',
      palette: 'PENDING_SOURCE_INSPECTION',
      direction: 'PENDING_SOURCE_INSPECTION',
      impactLocation: 'PENDING_SOURCE_INSPECTION',
      targetShape: 'PENDING_SOURCE_INSPECTION',
      intensity: 'PENDING_SOURCE_INSPECTION',
      playbackMode: 'PENDING_SOURCE_INSPECTION',
      supportVsOffensive: 'PENDING_SOURCE_INSPECTION',
      groundVsTarget: 'PENDING_SOURCE_INSPECTION',
      cameraCompatibility: 'PENDING_SOURCE_INSPECTION',
      classificationTier: 'REJECT',
      estimatedRPGThreeJSUsage: 'UNASSIGNED_PENDING_R1',
      processingType: 'REJECT',
      r1VerificationStatus: 'REJECTED',
      notes: a.error,
    };
  }

  const grid = a.detectedGrid;
  const fps = 25;
  const duration = grid.frameCount / fps;

  // Palette inference
  let palette = 'neutral';
  const el = a.element;
  if (el === 'fire' || el === 'holy') palette = 'warm';
  else if (el === 'ice' || el === 'water' || el === 'arcane') palette = 'cool';
  else if (el === 'dark' || el === 'void' || el === 'shadow') palette = 'dark';
  else if (el === 'holy') palette = 'light';
  else if (el === 'physical') palette = 'monochrome';

  // Target shape inference
  let targetShape = 'single';
  if (a.impactLocation === 'area_origin') targetShape = 'radius_medium';
  if (a.impactLocation === 'ground_centered') targetShape = 'radius_small';
  if (a.impactLocation === 'source_centered') targetShape = 'self';
  if (a.direction === 'directional_horizontal') targetShape = 'line';
  if (a.sourceFilename.toLowerCase().includes('cone')) targetShape = 'cone';
  if (a.intensity === 'ultimate') targetShape = 'radius_ultimate';
  if (a.intensity === 'heavy') targetShape = 'radius_large';

  // Playback mode
  let playbackMode = 'once';
  if (a.loopSuitability === 'loop') playbackMode = 'loop';

  // Camera compatibility
  let cameraCompatibility = 'billboard';
  if (a.groundVsTarget === 'ground_based') cameraCompatibility = 'top_down';

  // Estimated usage
  let estimatedUsage = 'skill_impact';
  if (a.intensity === 'small' && a.visualFamily === 'projectile_impact') estimatedUsage = 'basic_attack';
  if (a.intensity === 'ultimate') estimatedUsage = 'ultimate_impact';
  if (a.loopSuitability === 'loop' || a.loopSuitability === 'loop_with_fadeout') {
    if (a.visualFamily === 'buff' || a.visualFamily === 'aura') estimatedUsage = 'buff_aura';
    if (a.visualFamily === 'debuff') estimatedUsage = 'debuff_aura';
    if (a.visualFamily === 'smoke' || a.visualFamily === 'persistent_loop') estimatedUsage = 'environmental';
  }
  if (a.visualFamily === 'charge' || a.direction === 'directional_horizontal') estimatedUsage = 'movement_effect';
  if (a.visualFamily === 'heal') estimatedUsage = 'skill_impact';
  if (a.visualFamily === 'stun' || a.visualFamily === 'poison') estimatedUsage = 'status_effect';

  return {
    candidateId: a.candidateId,
    sourceCollection: a.sourceCollection,
    sourcePath: a.sourcePath,
    sourceFilename: a.sourceFilename,
    frameCount: grid.frameCount,
    frameDimensions: { width: grid.cellWidth, height: grid.cellHeight },
    alphaAvailability: a.alphaAvailability,
    animationDuration: parseFloat(duration.toFixed(2)),
    loopSuitability: a.loopSuitability,
    visualFamily: a.visualFamily,
    element: a.element,
    palette: palette,
    direction: a.direction,
    impactLocation: a.impactLocation,
    targetShape: targetShape,
    intensity: a.intensity,
    playbackMode: playbackMode,
    supportVsOffensive: a.supportVsOffensive,
    groundVsTarget: a.groundVsTarget,
    cameraCompatibility: cameraCompatibility,
    classificationTier: a.classificationTier,
    estimatedRPGThreeJSUsage: estimatedUsage,
    processingType: a.processingType,
    r1VerificationStatus: a.r1VerificationStatus,
    notes: a.gifPreview ? `GIF preview available: ${a.gifPreview}` : undefined,
  };
});

// Filter out undefined notes
candidates.forEach(c => { if (c.notes === undefined) delete c.notes; });

const inventory = {
  title: 'VFX Mega Pack R1 — Source Inventory',
  description: 'Indexed candidate database for all 2769 Mega Pack PNG spritesheets. Each entry follows the VfxAssetCandidate schema from vfx-megapack-r0-asset-taxonomy.schema.json. Source files remain external to the repository. All assets use 8x8 grids (64 frames) and require R2 pipeline resampling to 5x5 (25 frames) at 256x256 per cell.',
  generatedAt: '2026-08-06',
  megaPackRoot: '<MEGA_PACK_ROOT>',
  megaPackStatus: 'PURCHASED_AND_INDEXED',
  totalCandidates: candidates.length,
  gridFormat: { sourceGrid: '8x8', sourceFrames: 64, targetGrid: '5x5', targetFrames: 25, targetCellSize: 256, targetSheetSize: 1280 },
  dimensionDistribution: raw.dimensionDistribution || { '4096x4096': 2456, '2048x2048': 309, '1536x1536': 3, '8192x8192': 1 },
  collectionStats: raw.collectionStats,
  gridDistribution: raw.gridDistribution,
  familyDistribution: raw.familyDistribution,
  elementDistribution: raw.elementDistribution,
  bonusTextureFolders: raw.bonusTextureFolders,
  licenseFound: raw.licenseFound,
  candidates: candidates,
};

writeFileSync(join(REPO_REPORTS, 'vfx-megapack-r1-inventory.json'), JSON.stringify(inventory, null, 2));
console.log(`Wrote ${candidates.length} candidates to vfx-megapack-r1-inventory.json`);
