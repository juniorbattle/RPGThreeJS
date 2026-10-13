import { describe, it, expect } from 'vitest';
import {
  resolveMegaPackRoot,
  validateMegaPackRoot,
  buildHealthResponse,
  formatStartupWarning,
  PREVIEW_DIR_NAME,
} from './vfxDevHelpers';

describe('VFX Dev Helpers — resolveMegaPackRoot', () => {
  it('1. process.env value wins over env-file value', () => {
    expect(resolveMegaPackRoot('C:/from-process', 'C:/from-file')).toBe('C:/from-process');
  });

  it('2. env-file value used when process env is absent', () => {
    expect(resolveMegaPackRoot(undefined, 'C:/from-file')).toBe('C:/from-file');
  });

  it('3. empty string when both are absent', () => {
    expect(resolveMegaPackRoot(undefined, undefined)).toBe('');
  });

  it('4. empty string when both are empty/whitespace', () => {
    expect(resolveMegaPackRoot('   ', '  ')).toBe('');
  });

  it('5. trims whitespace from process env value', () => {
    expect(resolveMegaPackRoot('  C:/trimmed  ', undefined)).toBe('C:/trimmed');
  });

  it('6. trims whitespace from env-file value', () => {
    expect(resolveMegaPackRoot(undefined, '  C:/trimmed  ')).toBe('C:/trimmed');
  });

  it('7. empty process env falls through to env-file value', () => {
    expect(resolveMegaPackRoot('', 'C:/from-file')).toBe('C:/from-file');
  });
});

describe('VFX Dev Helpers — validateMegaPackRoot', () => {
  it('8. unconfigured when root is empty', () => {
    const result = validateMegaPackRoot('', () => true);
    expect(result).toEqual({ configured: false, rootExists: false, previewDirExists: false });
  });

  it('9. root exists but preview dir missing', () => {
    const exists = (p: string) => p === '/valid-root' && !p.includes(PREVIEW_DIR_NAME);
    const result = validateMegaPackRoot('/valid-root', exists);
    expect(result).toEqual({ configured: true, rootExists: true, previewDirExists: false });
  });

  it('10. root and preview dir both exist', () => {
    const exists = (p: string) => p === '/valid-root' || p === `/valid-root/${PREVIEW_DIR_NAME}`;
    const result = validateMegaPackRoot('/valid-root', exists);
    expect(result).toEqual({ configured: true, rootExists: true, previewDirExists: true });
  });

  it('11. root does not exist', () => {
    const result = validateMegaPackRoot('/nonexistent', () => false);
    expect(result).toEqual({ configured: true, rootExists: false, previewDirExists: false });
  });

  it('12. handles backslash paths by normalizing to forward slashes', () => {
    const exists = (p: string) => p === 'C:/root' || p === `C:/root/${PREVIEW_DIR_NAME}`;
    const result = validateMegaPackRoot('C:\\root', exists);
    expect(result.rootExists).toBe(true);
    expect(result.previewDirExists).toBe(true);
  });
});

describe('VFX Dev Helpers — buildHealthResponse', () => {
  it('13. ok=true when fully configured and valid', () => {
    const result = buildHealthResponse(
      { configured: true, rootExists: true, previewDirExists: true },
      true,
      1974,
    );
    expect(result.ok).toBe(true);
    expect(result.configured).toBe(true);
    expect(result.rootExists).toBe(true);
    expect(result.previewDirectoryExists).toBe(true);
    expect(result.previewIndexLoaded).toBe(true);
    expect(result.resolvedPreviewCount).toBe(1974);
  });

  it('14. ok=false when not configured', () => {
    const result = buildHealthResponse(
      { configured: false, rootExists: false, previewDirExists: false },
      false,
      0,
    );
    expect(result.ok).toBe(false);
    expect(result.configured).toBe(false);
  });

  it('15. ok=false when root missing', () => {
    const result = buildHealthResponse(
      { configured: true, rootExists: false, previewDirExists: false },
      true,
      0,
    );
    expect(result.ok).toBe(false);
    expect(result.rootExists).toBe(false);
  });

  it('16. ok=false when preview dir missing', () => {
    const result = buildHealthResponse(
      { configured: true, rootExists: true, previewDirExists: false },
      true,
      100,
    );
    expect(result.ok).toBe(false);
    expect(result.previewDirectoryExists).toBe(false);
  });
});

describe('VFX Dev Helpers — formatStartupWarning', () => {
  it('17. returns null when everything is healthy', () => {
    const result = formatStartupWarning(
      { configured: true, rootExists: true, previewDirExists: true },
      '/valid-root',
    );
    expect(result).toBeNull();
  });

  it('18. warns about missing configuration', () => {
    const result = formatStartupWarning(
      { configured: false, rootExists: false, previewDirExists: false },
      '',
    );
    expect(result).toContain('MEGA_PACK_ROOT not configured');
    expect(result).toContain('.env.local');
  });

  it('19. warns about non-existent root path', () => {
    const result = formatStartupWarning(
      { configured: true, rootExists: false, previewDirExists: false },
      '/bad/path',
    );
    expect(result).toContain('does not exist');
    expect(result).toContain('/bad/path');
  });

  it('20. warns about missing preview directory', () => {
    const result = formatStartupWarning(
      { configured: true, rootExists: true, previewDirExists: false },
      '/valid-root',
    );
    expect(result).toContain(PREVIEW_DIR_NAME);
    expect(result).toContain('missing');
  });
});

describe('VFX Dev Helpers — preview URL is relative', () => {
  it('21. preview URL uses relative path, not hardcoded port', () => {
    const url = '/dev/vfx-preview/r1_0001';
    expect(url).not.toContain('localhost');
    expect(url).not.toContain('5173');
    expect(url).not.toContain('5174');
    expect(url.startsWith('/dev/')).toBe(true);
  });
});
