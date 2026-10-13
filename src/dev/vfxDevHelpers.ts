/**
 * VFX Dev Helpers — Pure functions for resolving and validating the
 * CartoonCoffee Mega Pack root directory.
 *
 * These helpers are used by vite.config.ts to load the MEGA_PACK_ROOT
 * from either the process environment or a .env.local file, validate it
 * at startup, and build health-endpoint responses.
 *
 * All functions are pure (or accept injected dependencies) so they can
 * be unit-tested without touching the real filesystem.
 */

/** Preview directory name inside the Mega Pack root. */
export const PREVIEW_DIR_NAME = '02_previews';

/** Result of validating a Mega Pack root path. */
export interface MegaPackRootValidation {
  configured: boolean;
  rootExists: boolean;
  previewDirExists: boolean;
}

/** Health response returned by the /dev/vfx-preview-health endpoint. */
export interface VfxPreviewHealthResponse {
  ok: boolean;
  configured: boolean;
  rootExists: boolean;
  previewDirectoryExists: boolean;
  previewIndexLoaded: boolean;
  resolvedPreviewCount: number;
}

/**
 * Resolves the Mega Pack root with priority:
 *   1. Explicit process environment value (highest priority)
 *   2. .env.local value (loaded by Vite's loadEnv)
 *   3. Empty string (unconfigured)
 *
 * Both inputs are trimmed before use.
 */
export function resolveMegaPackRoot(
  processEnvValue: string | undefined,
  envFileValue: string | undefined,
): string {
  const fromProcess = processEnvValue?.trim();
  if (fromProcess) return fromProcess;

  const fromFile = envFileValue?.trim();
  if (fromFile) return fromFile;

  return '';
}

/**
 * Validates that a configured Mega Pack root exists and contains the
 * expected preview subdirectory.
 *
 * Accepts an injected `existsSync` function for testability.
 */
export function validateMegaPackRoot(
  root: string,
  existsSync: (path: string) => boolean,
): MegaPackRootValidation {
  const configured = root.length > 0;
  if (!configured) {
    return { configured: false, rootExists: false, previewDirExists: false };
  }

  const normalizedRoot = root.replace(/\\/g, '/');
  const rootExists = existsSync(normalizedRoot);
  if (!rootExists) {
    return { configured: true, rootExists: false, previewDirExists: false };
  }

  const previewDirExists = existsSync(`${normalizedRoot}/${PREVIEW_DIR_NAME}`);

  return { configured: true, rootExists: true, previewDirExists };
}

/**
 * Builds the health response object from validation results and preview
 * index state.
 */
export function buildHealthResponse(
  validation: MegaPackRootValidation,
  previewIndexLoaded: boolean,
  resolvedPreviewCount: number,
): VfxPreviewHealthResponse {
  const ok = validation.configured && validation.rootExists && validation.previewDirExists;
  return {
    ok,
    configured: validation.configured,
    rootExists: validation.rootExists,
    previewDirectoryExists: validation.previewDirExists,
    previewIndexLoaded,
    resolvedPreviewCount,
  };
}

/**
 * Formats a startup log message for the VFX preview bridge.
 * Returns null when everything is healthy (no warning needed).
 */
export function formatStartupWarning(
  validation: MegaPackRootValidation,
  resolvedRoot: string,
): string | null {
  if (validation.configured && validation.rootExists && validation.previewDirExists) {
    return null;
  }

  if (!validation.configured) {
    return [
      '[VFX Preview] MEGA_PACK_ROOT not configured.',
      'Create .env.local using .env.example.',
      'GIF previews will be unavailable until configured.',
    ].join(' ');
  }

  if (!validation.rootExists) {
    return [
      '[VFX Preview] MEGA_PACK_ROOT path does not exist:',
      resolvedRoot,
      'GIF previews will be unavailable.',
    ].join(' ');
  }

  return [
    '[VFX Preview] MEGA_PACK_ROOT exists but preview directory',
    `'${PREVIEW_DIR_NAME}' is missing.`,
    'GIF previews will be unavailable.',
  ].join(' ');
}
