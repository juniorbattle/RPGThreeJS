/**
 * R2C-LAB V1B — Browser-side DEV acquisition client.
 *
 * Provides the browser-to-dev bridge for on-demand candidate acquisition.
 * Only active when vfxlab=1 is present in the URL.
 *
 * The browser sends only a candidateId to the DEV endpoint. The server
 * derives everything else from trusted inventory/config. Arbitrary
 * filesystem paths cannot be injected.
 */

export interface AcquireResult {
  ok: boolean;
  candidateId?: string;
  url?: string;
  width?: number;
  height?: number;
  copied?: boolean;
  error?: string;
}

const ACQUIRE_ENDPOINT = '/dev/vfx-acquire';

export async function acquireCandidate(candidateId: string): Promise<AcquireResult> {
  try {
    const response = await fetch(ACQUIRE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });
    const data = await response.json() as AcquireResult;
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error during acquisition',
    };
  }
}
