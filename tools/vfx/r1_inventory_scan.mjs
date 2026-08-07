#!/usr/bin/env node
/**
 * R1 Inventory Scan — Mega Pack PNG Spritesheet Indexer
 *
 * Reads PNG IHDR headers from the external Mega Pack source directory,
 * detects grid layouts, classifies assets by filename patterns, and
 * correlates GIF previews. Outputs structured JSON to the external
 * 03_inventory_output/ directory and a summary to stdout.
 *
 * Constraints:
 * - No source files are modified.
 * - No commercial assets are copied into the repository.
 * - All visual output remains under the external Mega Pack directory.
 * - The repository receives only metadata, reports, and this script.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, relative, dirname } from 'node:path';

const MEGA_PACK_ROOT = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const EXTRACTED_DIR = join(MEGA_PACK_ROOT, '01_extracted');
const OUTPUT_DIR = join(MEGA_PACK_ROOT, '03_inventory_output');

const COLLECTIONS = [
  'Essentials VFX Spritesheets',
  'Fire VFX Spritesheets',
  'Lightning VFX Spritesheets',
  'Sword Slash VFX Spritesheets',
  'Water VFX Spritesheets',
  'Wind VFX Spritesheets',
];

const PREVIEW_DIRS = {
  'Essentials VFX Spritesheets': '(PREVIEW) GIFs - Essentials VFX',
  'Fire VFX Spritesheets': '(PREVIEW) GIFs - Fire VFX v2.0.0',
  'Lightning VFX Spritesheets': '(PREVIEW) GIFs - Lightning VFX v.2.0.0',
  'Sword Slash VFX Spritesheets': '(PREVIEW) GIFs - Sword Slash VFX',
  'Water VFX Spritesheets': null,
  'Wind VFX Spritesheets': 'Wind VFX GIFs',
};

// ─── PNG header reading ────────────────────────────────────────────

function readPngHeader(filePath) {
  const buf = readFileSync(filePath);
  if (buf.length < 26) throw new Error('File too small for PNG header');
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    throw new Error('Not a valid PNG file');
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
    fileSize: buf.length,
  };
}

const COLOR_MODES = { 0: 'grayscale', 2: 'rgb', 3: 'palette', 4: 'grayscale_alpha', 6: 'rgba' };

// ─── Grid detection ────────────────────────────────────────────────

function detectGrid(width, height) {
  const candidates = [];
  for (let cols = 1; cols <= 12; cols++) {
    for (let rows = 1; rows <= 12; rows++) {
      if (width % cols !== 0 || height % rows !== 0) continue;
      if (cols === 1 && rows === 1) continue;
      const cellW = width / cols;
      const cellH = height / rows;
      const frameCount = cols * rows;
      const isSquare = cellW === cellH;
      const commonSizes = [128, 192, 256, 384, 512, 1024];
      const isCommonSize = commonSizes.includes(cellW) || commonSizes.includes(cellH);
      const commonCounts = [4, 8, 9, 12, 15, 16, 20, 24, 25, 30, 32, 36, 40, 48, 49, 64, 72, 80, 81, 100];
      const isCommonCount = commonCounts.includes(frameCount);
      let confidence = 'LOW';
      if (isSquare && isCommonSize && isCommonCount) confidence = 'HIGH';
      else if (isSquare && (isCommonSize || isCommonCount)) confidence = 'MEDIUM';
      else if (!isSquare && isCommonCount) confidence = 'MEDIUM';
      candidates.push({ cols, rows, cellW, cellH, frameCount, isSquare, confidence });
    }
  }
  if (candidates.length === 0) {
    return { cols: 1, rows: 1, cellW: width, cellH: height, frameCount: 1, confidence: 'MANUAL_REVIEW_REQUIRED' };
  }
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  candidates.sort((a, b) => order[a.confidence] - order[b.confidence] || b.frameCount - a.frameCount);
  const best = candidates[0];
  return { cols: best.cols, rows: best.rows, cellW: best.cellW, cellH: best.cellH, frameCount: best.frameCount, confidence: best.confidence };
}

// ─── Asset classification ──────────────────────────────────────────

function classifyAsset(filename, collection) {
  const f = filename.toLowerCase();
  const c = collection.toLowerCase();

  let visualFamily = 'persistent_loop';
  let element = 'neutral';
  let processingType = 'EXTRACT_AND_REPACK';
  let classificationTier = 'DIRECT_CANDIDATE';
  let loopSuitability = 'one_shot';
  let supportVsOffensive = 'offensive';
  let intensity = 'medium';
  let direction = 'omnidirectional';
  let impactLocation = 'target_centered';
  let groundVsTarget = 'target_centered';

  // Collection defaults
  if (c.includes('fire')) element = 'fire';
  else if (c.includes('lightning')) element = 'lightning';
  else if (c.includes('sword slash')) element = 'physical';
  else if (c.includes('water')) element = 'neutral';
  else if (c.includes('wind')) element = 'wind';

  // ── Slash / Cut / Stab ──
  if (f.includes('slash') || f.includes('cut_v') || f.includes('stab_')) {
    visualFamily = 'slash';
    if (f.includes('spin')) { visualFamily = 'swirl'; direction = 'radial_outward'; }
    if (f.includes('flurry')) { visualFamily = 'slash'; intensity = 'heavy'; }
    if (f.includes('fire_slash')) element = 'fire';
    if (f.includes('lightning_slash')) element = 'lightning';
    if (f.includes('claw')) { visualFamily = 'slash'; intensity = 'small'; }
  }
  // ── Impact families ──
  else if (f.includes('impact_hit_v') || f.includes('impact_hit_lv')) { visualFamily = 'projectile_impact'; intensity = 'small'; }
  else if (f.includes('impact_cartoon')) { visualFamily = 'projectile_impact'; intensity = 'small'; }
  else if (f.includes('impact_fire')) { visualFamily = 'burn'; element = 'fire'; }
  else if (f.includes('impact_ice')) { visualFamily = 'freeze'; element = 'ice'; }
  else if (f.includes('impact_lightning')) { visualFamily = 'projectile_impact'; element = 'lightning'; }
  else if (f.includes('impact_water')) { visualFamily = 'projectile_impact'; element = 'water'; }
  else if (f.includes('impact_wind')) { visualFamily = 'swirl'; element = 'wind'; }
  else if (f.includes('impact_darkness')) { visualFamily = 'implosion'; element = 'dark'; }
  else if (f.includes('impact_light')) { visualFamily = 'buff'; element = 'holy'; }
  else if (f.includes('impact_poison')) { visualFamily = 'poison'; element = 'poison'; }
  else if (f.includes('impact_blood')) { visualFamily = 'projectile_impact'; element = 'physical'; }
  else if (f.includes('impact_shock') && !f.includes('shockwave')) { visualFamily = 'shockwave'; }
  else if (f.includes('impact_shockwave')) { visualFamily = 'shockwave'; }
  else if (f.includes('impact_shine') || f.includes('impact_star')) { visualFamily = 'buff'; element = 'holy'; }
  else if (f.includes('impact_punch')) { visualFamily = 'smash'; }
  else if (f.includes('impact_smoke')) { visualFamily = 'smoke'; }
  else if (f.includes('impact_sonar')) { visualFamily = 'shockwave'; }
  else if (f.includes('impact_spark')) { visualFamily = 'sparks'; }
  else if (f.includes('impact_muzzle')) { visualFamily = 'sparks'; intensity = 'small'; }
  // ── Explosions ──
  else if (f.includes('explosion')) { visualFamily = 'explosion'; intensity = 'heavy'; }
  // ── Fire family ──
  else if (f.includes('fireball')) { visualFamily = 'projectile_impact'; element = 'fire'; direction = 'directional_horizontal'; }
  else if (f.includes('fire_burst')) { visualFamily = 'explosion'; element = 'fire'; }
  else if (f.includes('fire_pillar')) { visualFamily = 'pillar'; element = 'fire'; direction = 'upward'; groundVsTarget = 'ground_based'; }
  else if (f.includes('fire_trail')) { visualFamily = 'burn'; element = 'fire'; direction = 'directional_horizontal'; loopSuitability = 'loop'; }
  else if (f.includes('bonfire') || f.includes('ground_fire')) { visualFamily = 'burn'; element = 'fire'; groundVsTarget = 'ground_based'; loopSuitability = 'loop'; }
  else if (f.includes('jet_fire')) { visualFamily = 'burn'; element = 'fire'; direction = 'directional_horizontal'; }
  else if (f.includes('tornado_fire')) { visualFamily = 'swirl'; element = 'fire'; direction = 'radial_outward'; loopSuitability = 'loop'; }
  else if (f.includes('aura_fire')) { visualFamily = 'aura'; element = 'fire'; loopSuitability = 'loop'; }
  else if (f.includes('flamethrower')) { visualFamily = 'burn'; element = 'fire'; direction = 'directional_horizontal'; }
  // ── Lightning family ──
  else if (f.includes('lightning_strike')) { visualFamily = 'projectile_impact'; element = 'lightning'; direction = 'downward'; }
  else if (f.includes('lightning_ball')) { visualFamily = 'projectile_impact'; element = 'lightning'; direction = 'directional_horizontal'; }
  else if (f.includes('lightning_wall')) { visualFamily = 'shockwave'; element = 'lightning'; }
  else if (f.includes('lightning_aura')) { visualFamily = 'aura'; element = 'lightning'; loopSuitability = 'loop'; }
  else if (f.includes('shock_burst')) { visualFamily = 'shockwave'; element = 'lightning'; }
  else if (f.includes('lightning_barrage')) { visualFamily = 'projectile_impact'; element = 'lightning'; intensity = 'heavy'; }
  // ── Healing / Support ──
  else if (f.includes('healing')) { visualFamily = 'heal'; element = 'holy'; supportVsOffensive = 'support'; }
  else if (f.includes('heart_buff')) { visualFamily = 'buff'; element = 'holy'; supportVsOffensive = 'support'; loopSuitability = 'loop'; }
  else if (f.includes('heart_burst')) { visualFamily = 'buff'; element = 'holy'; supportVsOffensive = 'support'; }
  else if (f.includes('positive_buff')) { visualFamily = 'buff'; element = 'holy'; supportVsOffensive = 'support'; loopSuitability = 'loop'; }
  else if (f.includes('negative_buff')) { visualFamily = 'debuff'; element = 'dark'; loopSuitability = 'loop'; }
  // ── Shield / Barrier ──
  else if (f.includes('shield_on') || f.includes('shield_off')) { visualFamily = 'shield'; element = 'holy'; supportVsOffensive = 'support'; groundVsTarget = 'ground_based'; }
  else if (f.includes('barrier')) { visualFamily = 'barrier'; supportVsOffensive = 'support'; groundVsTarget = 'ground_based'; }
  // ── Charge / Power ──
  else if (f.includes('charge_') || f.includes('chargeup')) { visualFamily = 'charge'; loopSuitability = 'loop_with_fadeout'; impactLocation = 'source_centered'; }
  else if (f.includes('power_up') || f.includes('power_burst')) { visualFamily = 'charge'; intensity = 'heavy'; impactLocation = 'source_centered'; }
  // ── Aura ──
  else if (f.includes('aura_v') && !f.includes('fire') && !f.includes('lightning')) { visualFamily = 'aura'; loopSuitability = 'loop'; impactLocation = 'source_centered'; }
  // ── Teleport / Void ──
  else if (f.includes('teleport') || f.includes('void_spiral') || f.includes('void_step')) { visualFamily = 'teleport'; element = 'void'; }
  // ── Smoke ──
  else if (f.includes('smoke')) { visualFamily = 'smoke'; loopSuitability = 'loop'; }
  // ── Poison ──
  else if (f.includes('poison_cloud') || f.includes('poison_maw')) { visualFamily = 'poison'; element = 'poison'; }
  // ── Stun ──
  else if (f.includes('stun')) { visualFamily = 'stun'; supportVsOffensive = 'offensive'; loopSuitability = 'loop'; }
  // ── Star / Tech / Hex ──
  else if (f.includes('star_explosion')) { visualFamily = 'explosion'; element = 'holy'; }
  else if (f.includes('star_burst')) { visualFamily = 'buff'; element = 'holy'; }
  else if (f.includes('star_buff') || f.includes('star_flash')) { visualFamily = 'buff'; element = 'holy'; }
  else if (f.includes('tech_')) { visualFamily = 'rune'; element = 'arcane'; }
  else if (f.includes('hex_')) { visualFamily = 'debuff'; element = 'arcane'; }
  // ── Wind family ──
  else if (f.includes('tornado')) { visualFamily = 'swirl'; direction = 'radial_outward'; loopSuitability = 'loop'; }
  else if (f.includes('wind_vortex') || f.includes('wind_current')) { visualFamily = 'swirl'; element = 'wind'; direction = 'radial_outward'; }
  else if (f.includes('dash_wind')) { visualFamily = 'charge'; element = 'wind'; direction = 'directional_horizontal'; impactLocation = 'source_to_target'; }
  else if (f.includes('wind_shout')) { visualFamily = 'shockwave'; element = 'wind'; }
  else if (f.includes('jump_wind')) { visualFamily = 'smoke'; element = 'wind'; intensity = 'small'; }
  else if (f.includes('burst_wind') || f.includes('burst_dust')) { visualFamily = 'smoke'; element = 'wind'; }
  // ── Water / Blood ──
  else if (f.includes('water_burst') || f.includes('water_blast') || f.includes('water_splash_burst')) { visualFamily = 'projectile_impact'; element = 'water'; }
  else if (f.includes('water_drip') || f.includes('water_trail')) { visualFamily = 'persistent_loop'; element = 'water'; loopSuitability = 'loop'; }
  else if (f.includes('water_gush') || f.includes('water_ground_splash')) { visualFamily = 'projectile_impact'; element = 'water'; }
  else if (f.includes('water_projectile')) { visualFamily = 'projectile_impact'; element = 'water'; direction = 'directional_horizontal'; }
  else if (f.includes('water_side_burst')) { visualFamily = 'projectile_impact'; element = 'water'; direction = 'directional_horizontal'; }
  else if (f.includes('foam_')) { visualFamily = 'persistent_loop'; element = 'water'; loopSuitability = 'loop'; }
  else if (f.includes('blood_')) { visualFamily = 'projectile_impact'; element = 'physical'; }
  // ── Projectiles ──
  else if (f.includes('projectile_darkness')) { visualFamily = 'projectile_impact'; element = 'dark'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_fire')) { visualFamily = 'projectile_impact'; element = 'fire'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_ice')) { visualFamily = 'projectile_impact'; element = 'ice'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_light')) { visualFamily = 'projectile_impact'; element = 'holy'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_lightning')) { visualFamily = 'projectile_impact'; element = 'lightning'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_poison')) { visualFamily = 'projectile_impact'; element = 'poison'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_water')) { visualFamily = 'projectile_impact'; element = 'water'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_wind')) { visualFamily = 'projectile_impact'; element = 'wind'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_energy') || f.includes('projectile_bullet') || f.includes('projectile_sonar')) { visualFamily = 'projectile_impact'; element = 'arcane'; direction = 'directional_horizontal'; }
  else if (f.includes('projectile_spinning')) { visualFamily = 'slash'; element = 'physical'; direction = 'directional_horizontal'; }
  // ── Misc ──
  else if (f.includes('radial_loop')) { visualFamily = 'persistent_loop'; loopSuitability = 'loop'; }
  else if (f.includes('confetti') || f.includes('fireworks')) { visualFamily = 'explosion'; }
  else if (f.includes('debris') || f.includes('glass_shatter')) { visualFamily = 'explosion'; }
  else if (f.includes('coins')) { visualFamily = 'buff'; supportVsOffensive = 'support'; }
  else if (f.includes('scream')) { visualFamily = 'shockwave'; }
  else if (f.includes('lens_flare')) { visualFamily = 'buff'; }
  else if (f.includes('bubbles')) { visualFamily = 'persistent_loop'; loopSuitability = 'loop'; }
  else if (f.includes('arrow_indicator')) { visualFamily = 'persistent_loop'; classificationTier = 'REFERENCE_ONLY'; processingType = 'REFERENCE_ONLY'; }
  else if (f.includes('cut_out') || f.includes('circle_cut') || f.includes('heart_cut') || f.includes('star_cut')) { visualFamily = 'persistent_loop'; classificationTier = 'REFERENCE_ONLY'; processingType = 'REFERENCE_ONLY'; }
  else if (f.includes('particles_basic')) { visualFamily = 'sparks'; }
  else if (f.includes('absorb_wind')) { visualFamily = 'implosion'; element = 'wind'; direction = 'radial_inward'; }
  else if (f.includes('angry_smoke')) { visualFamily = 'smoke'; loopSuitability = 'loop'; }
  else if (f.includes('smoke_rising')) { visualFamily = 'smoke'; direction = 'upward'; loopSuitability = 'loop'; }
  else if (f.includes('jet_smoke')) { visualFamily = 'smoke'; direction = 'directional_horizontal'; }
  else if (f.includes('jet_sparks')) { visualFamily = 'sparks'; direction = 'directional_horizontal'; }
  else if (f.includes('jet_water') || f.includes('jet_poison')) { visualFamily = 'burn'; direction = 'directional_horizontal'; }
  else if (f.includes('tornado_lightning')) { visualFamily = 'swirl'; element = 'lightning'; direction = 'radial_outward'; }
  else if (f.includes('wind_ground')) { visualFamily = 'smoke'; element = 'wind'; groundVsTarget = 'ground_based'; }
  else if (f.includes('lightning_big') || f.includes('lightning_small')) { visualFamily = 'projectile_impact'; element = 'lightning'; direction = 'downward'; }
  else if (f.includes('fire_candle') || f.includes('fire_fireplace')) { visualFamily = 'burn'; element = 'fire'; loopSuitability = 'loop'; groundVsTarget = 'ground_based'; }
  else if (f.includes('charge_wind_loop')) { visualFamily = 'charge'; element = 'wind'; loopSuitability = 'loop'; }

  // ── Intensity overrides ──
  if (f.includes('_lv1') || f.includes('_v1_') || f.includes('_v1.')) intensity = 'small';
  if (f.includes('_lv2') || f.includes('_v2_')) intensity = 'medium';
  if (f.includes('_lv3') || f.includes('_v3_')) intensity = 'heavy';
  if (f.includes('ultimate') || f.includes('mega') || f.includes('_v5.') || f.includes('_v6.') || f.includes('_v7.') || f.includes('_v8.') || f.includes('_v9.')) intensity = 'ultimate';
  if (f.includes('_heavy') || f.includes('_large')) intensity = 'heavy';
  if (f.includes('_small') || f.includes('_tiny')) intensity = 'small';

  // ── Loop overrides ──
  if (f.includes('_loop') || f.includes('loop_')) {
    loopSuitability = 'loop';
    processingType = 'LOOP_CANDIDATE';
  }

  // ── Element overrides ──
  if (f.includes('darkness') || f.includes('dark_')) element = 'dark';
  if (f.includes('void')) element = 'void';
  if (f.includes('holy') || f.includes('heal')) element = 'holy';
  if (f.includes('ice') || f.includes('frost')) element = 'ice';
  if (f.includes('poison') || f.includes('venom')) element = 'poison';
  if (f.includes('shadow')) element = 'shadow';
  if (f.includes('light') && !f.includes('lightning') && !f.includes('firelight')) element = 'holy';

  // ── Direction overrides ──
  if (f.includes('cone')) direction = 'directional_horizontal';
  if (f.includes('dash')) direction = 'directional_horizontal';
  if (f.includes('pillar')) direction = 'upward';
  if (f.includes('meteor')) direction = 'downward';
  if (f.includes('jet')) direction = 'directional_horizontal';
  if (f.includes('trail')) direction = 'directional_horizontal';
  if (f.includes('vortex') || f.includes('tornado') || f.includes('swirl')) direction = 'radial_outward';
  if (f.includes('implosion') || f.includes('absorb')) direction = 'radial_inward';
  if (f.includes('strike') && element === 'lightning') direction = 'downward';

  // ── Impact location overrides ──
  if (f.includes('ground') || f.includes('floor')) impactLocation = 'ground_centered';
  if (f.includes('dash') || f.includes('trail') || f.includes('projectile')) impactLocation = 'source_to_target';
  if (f.includes('aura') || f.includes('buff') || f.includes('charge')) impactLocation = 'source_centered';
  if (f.includes('explosion') || f.includes('bomb')) impactLocation = 'area_origin';

  // ── Ground vs target overrides ──
  if (f.includes('ground') || f.includes('floor') || f.includes('pillar') || f.includes('barrier') || f.includes('shield')) groundVsTarget = 'ground_based';
  if (f.includes('aura') || f.includes('buff')) groundVsTarget = 'target_centered';
  if (f.includes('meteor') || f.includes('strike')) groundVsTarget = 'airborne';

  // ── Support vs offensive overrides ──
  if (f.includes('heal') || f.includes('buff') || f.includes('shield') || f.includes('barrier') || f.includes('positive') || f.includes('heart')) supportVsOffensive = 'support';
  if (f.includes('explosion') || f.includes('fireball') || f.includes('strike') || f.includes('slash') || f.includes('impact_')) supportVsOffensive = 'offensive';

  return { visualFamily, element, processingType, classificationTier, loopSuitability, intensity, direction, impactLocation, groundVsTarget, supportVsOffensive };
}

// ─── File discovery ────────────────────────────────────────────────

function findPngs(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findPngs(full));
      else if (entry.name.toLowerCase().endsWith('.png')) results.push(full);
    }
  } catch (e) { /* directory not accessible */ }
  return results;
}

function findGifPreview(previewDir, spritesheetFilename) {
  if (!previewDir) return null;
  const baseName = spritesheetFilename.replace(/_spritesheet\.png$/i, '').replace(/\.png$/i, '');
  const gifPath = join(previewDir, baseName + '.gif');
  return existsSync(gifPath) ? baseName + '.gif' : null;
}

// ─── Main scan ─────────────────────────────────────────────────────

function main() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const allAssets = [];
  const collectionStats = {};
  const gridDistribution = {};
  const familyDistribution = {};
  const elementDistribution = {};

  for (const collName of COLLECTIONS) {
    const collDir = join(EXTRACTED_DIR, collName);
    const pngs = findPngs(collDir);
    const previewDir = PREVIEW_DIRS[collName] ? join(MEGA_PACK_ROOT, '02_previews', PREVIEW_DIRS[collName]) : null;

    collectionStats[collName] = { fileCount: pngs.length, previewAvailable: !!previewDir };

    for (const pngPath of pngs) {
      const filename = basename(pngPath);
      const relPath = relative(MEGA_PACK_ROOT, pngPath).replace(/\\/g, '/');

      try {
        const hdr = readPngHeader(pngPath);
        const grid = detectGrid(hdr.width, hdr.height);
        const cls = classifyAsset(filename, collName);
        const colorMode = COLOR_MODES[hdr.colorType] || 'unknown';
        const hasAlpha = hdr.colorType === 4 || hdr.colorType === 6 || (hdr.colorType === 3 && hdr.bitDepth <= 8);
        const gifPreview = findGifPreview(previewDir, filename);

        const asset = {
          candidateId: `r1_${String(allAssets.length + 1).padStart(4, '0')}`,
          sourceCollection: collName,
          sourcePath: relPath,
          sourceFilename: filename,
          pngDimensions: { width: hdr.width, height: hdr.height },
          fileSizeBytes: hdr.fileSize,
          colorMode,
          bitDepth: hdr.bitDepth,
          alphaAvailability: hasAlpha ? 'alpha' : 'no_alpha',
          detectedGrid: { cols: grid.cols, rows: grid.rows, cellWidth: grid.cellW, cellHeight: grid.cellH, frameCount: grid.frameCount, confidence: grid.confidence },
          gifPreview: gifPreview,
          ...cls,
          r1VerificationStatus: 'INSPECTED',
        };

        allAssets.push(asset);

        // Track distributions
        const gridKey = `${grid.cols}x${grid.rows}`;
        gridDistribution[gridKey] = (gridDistribution[gridKey] || 0) + 1;
        familyDistribution[cls.visualFamily] = (familyDistribution[cls.visualFamily] || 0) + 1;
        elementDistribution[cls.element] = (elementDistribution[cls.element] || 0) + 1;

      } catch (e) {
        allAssets.push({
          candidateId: `r1_${String(allAssets.length + 1).padStart(4, '0')}`,
          sourceCollection: collName,
          sourcePath: relPath,
          sourceFilename: filename,
          error: e.message,
          r1VerificationStatus: 'REJECTED',
        });
      }
    }
  }

  // Check bonus textures
  const bonusDir = join(MEGA_PACK_ROOT, 'bonus_textures_masks', 'Unity Textures and Masks');
  const bonusFolders = [];
  try {
    for (const entry of readdirSync(bonusDir, { withFileTypes: true })) {
      if (entry.isDirectory()) bonusFolders.push(entry.name);
    }
  } catch (e) { /* not accessible */ }

  // Check license
  const licensePath = join(MEGA_PACK_ROOT, '00_archives', 'Ultimate Cartoon VFX MEGA PACK - Spritesheets', 'License + More Info.txt');
  const licenseFound = existsSync(licensePath);

  const output = {
    title: 'VFX Mega Pack R1 — Source Inventory',
    generatedAt: new Date().toISOString().split('T')[0],
    megaPackRoot: MEGA_PACK_ROOT,
    totalAssets: allAssets.length,
    collectionStats,
    gridDistribution,
    familyDistribution,
    elementDistribution,
    bonusTextureFolders: bonusFolders,
    licenseFound,
    assets: allAssets,
  };

  // Write full inventory to external output directory
  const rawPath = join(OUTPUT_DIR, 'r1_inventory_raw.json');
  writeFileSync(rawPath, JSON.stringify(output, null, 2));

  // Print summary to stdout
  console.log(JSON.stringify({
    totalAssets: allAssets.length,
    collectionStats,
    gridDistribution,
    familyDistribution,
    elementDistribution,
    bonusTextureFolders: bonusFolders,
    licenseFound,
    rawOutputPath: rawPath,
  }, null, 2));
}

main();
