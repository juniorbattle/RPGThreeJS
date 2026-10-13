import { VFX_SPRITE_SHEETS, NATIVE_SPRITE_SHEET_IDS, RESERVED_NATIVE_SHEET_IDS } from './VfxSpriteSheets';
import type { VfxSpriteSheetDefinition } from './VfxSpriteSheets';
import type { NativeVfxSpriteSheetId } from './VfxTypes';

export interface RuntimeManifestAsset {
  candidateId: string;
  sourceFilename: string;
  sourceRelativePath: string;
  sourceCollection: string;
  destinationFilename: string;
  expectedDimensions: string;
  expectedWidth: number;
  expectedHeight: number;
  rows: number;
  cols: number;
  frameCount: number;
  expectedCellWidth: number;
  expectedCellHeight: number;
  runtimeSheetId: string;
  pilotActions: readonly string[];
  reservationNote?: string;
}

export interface RuntimeManifest {
  title: string;
  description: string;
  generatedAt: string;
  sourceConvention: string;
  destinationRoot: string;
  assets: readonly RuntimeManifestAsset[];
  summary: {
    totalAssets: number;
    count4x4: number;
    count8x8: number;
    totalEstimatedMemoryMB: number;
    pilotActionsCovered: number;
  };
}

function urlFilename(url: string): string {
  const index = url.lastIndexOf('/');
  return index >= 0 ? url.slice(index + 1) : url;
}

/**
 * Validates that the selected runtime assets manifest and the native sprite
 * sheet definitions in VFX_SPRITE_SHEETS are exactly consistent.
 *
 * Checks per asset:
 *  - runtimeSheetId exists in VFX_SPRITE_SHEETS
 *  - candidateId matches sourceCandidateId
 *  - destinationFilename matches the URL filename
 *  - sheetWidthPx / sheetHeightPx / rows / cols / frameCount
 *  - nativeCellWidthPx / nativeCellHeightPx
 *  - assetGeneration === 'megapack-native'
 *
 * Checks across the manifest:
 *  - no duplicate candidateId
 *  - no duplicate runtimeSheetId
 *  - no duplicate destinationFilename
 *  - no MANUAL_REVIEW_REQUIRED source
 *  - all native sheets are accounted for (manifest or explicitly reserved)
 *  - reserved assets remain valid definitions
 */
export function validateRuntimeRegistryConsistency(manifest: RuntimeManifest): string[] {
  const errors: string[] = [];
  const seenCandidateIds = new Set<string>();
  const seenRuntimeSheetIds = new Set<string>();
  const seenDestinationFilenames = new Set<string>();
  const manifestSheetIds = new Set<string>();

  for (const asset of manifest.assets) {
    const sheetId = asset.runtimeSheetId as NativeVfxSpriteSheetId;
    const definition: VfxSpriteSheetDefinition | undefined = VFX_SPRITE_SHEETS[sheetId];

    if (seenCandidateIds.has(asset.candidateId)) {
      errors.push(`Duplicate candidateId: ${asset.candidateId}`);
    }
    seenCandidateIds.add(asset.candidateId);

    if (seenRuntimeSheetIds.has(asset.runtimeSheetId)) {
      errors.push(`Duplicate runtimeSheetId: ${asset.runtimeSheetId}`);
    }
    seenRuntimeSheetIds.add(asset.runtimeSheetId);
    manifestSheetIds.add(asset.runtimeSheetId);

    if (seenDestinationFilenames.has(asset.destinationFilename)) {
      errors.push(`Duplicate destinationFilename: ${asset.destinationFilename}`);
    }
    seenDestinationFilenames.add(asset.destinationFilename);

    if (asset.sourceRelativePath.includes('MANUAL_REVIEW_REQUIRED')) {
      errors.push(`MANUAL_REVIEW_REQUIRED source for ${asset.candidateId}: ${asset.sourceRelativePath}`);
    }

    if (!definition) {
      errors.push(`runtimeSheetId ${asset.runtimeSheetId} not found in VFX_SPRITE_SHEETS`);
      continue;
    }

    if (!NATIVE_SPRITE_SHEET_IDS.includes(sheetId)) {
      errors.push(`runtimeSheetId ${asset.runtimeSheetId} not in NATIVE_SPRITE_SHEET_IDS`);
    }

    if (definition.assetGeneration !== 'megapack-native') {
      errors.push(`assetGeneration for ${asset.runtimeSheetId} is ${definition.assetGeneration ?? 'undefined'}, expected megapack-native`);
    }

    if (definition.sourceCandidateId !== asset.candidateId) {
      errors.push(`candidateId mismatch for ${asset.runtimeSheetId}: manifest=${asset.candidateId}, registry=${definition.sourceCandidateId ?? 'undefined'}`);
    }

    const regFilename = urlFilename(definition.url);
    if (regFilename !== asset.destinationFilename) {
      errors.push(`destinationFilename mismatch for ${asset.runtimeSheetId}: manifest=${asset.destinationFilename}, registry=${regFilename}`);
    }

    if (definition.sheetWidthPx !== asset.expectedWidth) {
      errors.push(`sheetWidthPx mismatch for ${asset.runtimeSheetId}: manifest=${asset.expectedWidth}, registry=${definition.sheetWidthPx}`);
    }

    if (definition.sheetHeightPx !== asset.expectedHeight) {
      errors.push(`sheetHeightPx mismatch for ${asset.runtimeSheetId}: manifest=${asset.expectedHeight}, registry=${definition.sheetHeightPx}`);
    }

    if (definition.rows !== asset.rows) {
      errors.push(`rows mismatch for ${asset.runtimeSheetId}: manifest=${asset.rows}, registry=${definition.rows}`);
    }

    if (definition.cols !== asset.cols) {
      errors.push(`cols mismatch for ${asset.runtimeSheetId}: manifest=${asset.cols}, registry=${definition.cols}`);
    }

    if (definition.frameCount !== asset.frameCount) {
      errors.push(`frameCount mismatch for ${asset.runtimeSheetId}: manifest=${asset.frameCount}, registry=${definition.frameCount}`);
    }

    if (definition.nativeCellWidthPx !== asset.expectedCellWidth) {
      errors.push(`nativeCellWidthPx mismatch for ${asset.runtimeSheetId}: manifest=${asset.expectedCellWidth}, registry=${definition.nativeCellWidthPx ?? 'undefined'}`);
    }

    if (definition.nativeCellHeightPx !== asset.expectedCellHeight) {
      errors.push(`nativeCellHeightPx mismatch for ${asset.runtimeSheetId}: manifest=${asset.expectedCellHeight}, registry=${definition.nativeCellHeightPx ?? 'undefined'}`);
    }
  }

  for (const nativeId of NATIVE_SPRITE_SHEET_IDS) {
    if (!manifestSheetIds.has(nativeId) && !(RESERVED_NATIVE_SHEET_IDS as readonly string[]).includes(nativeId)) {
      errors.push(`Native sheet ${nativeId} not in manifest and not classified as reserved`);
    }
  }

  for (const reservedId of RESERVED_NATIVE_SHEET_IDS) {
    const def = VFX_SPRITE_SHEETS[reservedId as NativeVfxSpriteSheetId];
    if (!def) {
      errors.push(`Reserved native sheet ${reservedId} not found in VFX_SPRITE_SHEETS`);
      continue;
    }
    if (def.assetGeneration !== 'megapack-native') {
      errors.push(`Reserved sheet ${reservedId} assetGeneration is ${def.assetGeneration ?? 'undefined'}, expected megapack-native`);
    }
    if (!NATIVE_SPRITE_SHEET_IDS.includes(reservedId as NativeVfxSpriteSheetId)) {
      errors.push(`Reserved sheet ${reservedId} not in NATIVE_SPRITE_SHEET_IDS`);
    }
  }

  return errors;
}
