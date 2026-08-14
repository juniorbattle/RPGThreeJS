// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ensureCandidateRuntimeReady,
  ensureDraftRuntimeReady,
  _clearInFlight,
  type FetchFn,
} from './VfxRuntimeReadiness';
import { createVisualSlot, setChoreography, updateSlotProfile, replaceSlotCandidate, compileDraft } from './VfxPresetComposer';
import type { VfxPresetDraft } from './VfxPresetComposer';

function baseDraft(candidateIds: string[] = ['r1_1709']): VfxPresetDraft {
  return {
    actionKey: 'basic_greatsword_hit',
    presetId: 'composer_basic_greatsword_hit',
    visualSlots: candidateIds.map((id) => createVisualSlot(id)),
    choreography: 'TOGETHER',
    technicalPolish: 'AUTO',
    autoPlacement: 'TARGET',
    tier: 1,
  };
}

/**
 * Mock fetch for the authoritative /dev/vfx-runtime-status endpoint.
 * - exists=true → returns { ok: true, exists: true, isPng: true }
 * - exists=false → returns { ok: true, exists: false }
 * - acquireOk=true → POST /dev/vfx-acquire returns { ok: true }
 */
function mockFetch(exists: boolean, acquireOk: boolean, verifyExists?: boolean): FetchFn {
  const verify = verifyExists ?? exists;
  let statusCalls = 0;
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/dev/vfx-runtime-status/')) {
      statusCalls++;
      const isFirst = statusCalls === 1;
      return { ok: true, json: async () => ({ ok: true, exists: isFirst ? exists : verify, isPng: true }) } as unknown as Response;
    }
    if (init?.method === 'POST' && url.includes('/dev/vfx-acquire')) {
      return { ok: acquireOk, json: async () => ({ ok: acquireOk }) } as unknown as Response;
    }
    return { ok: false } as Response;
  }) as unknown as FetchFn;
}

/**
 * Mock fetch that tracks call count for dedup testing.
 */
function mockFetchWithTracking(exists: boolean, acquireOk: boolean, verifyExists?: boolean): FetchFn & { callCount: () => number; postCount: () => number } {
  let calls: [string, RequestInit | undefined][] = [];
  const verify = verifyExists ?? exists;
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push([url, init]);
    if (typeof url === 'string' && url.includes('/dev/vfx-runtime-status/')) {
      const isVerify = calls.filter(c => c[0].includes('/dev/vfx-runtime-status/')).length > 1;
      return { ok: true, json: async () => ({ ok: true, exists: isVerify ? verify : exists, isPng: true }) } as unknown as Response;
    }
    if (init?.method === 'POST' && url.includes('/dev/vfx-acquire')) {
      return { ok: acquireOk, json: async () => ({ ok: acquireOk }) } as unknown as Response;
    }
    return { ok: false } as Response;
  }) as unknown as FetchFn & { callCount: () => number; postCount: () => number };
  fn.callCount = () => calls.length;
  fn.postCount = () => calls.filter(c => c[1]?.method === 'POST').length;
  return fn;
}

describe('VFX Runtime Readiness — ensureCandidateRuntimeReady', () => {
  beforeEach(() => { _clearInFlight(); });

  it('1. runtime PNG already exists → no acquisition POST', async () => {
    const fetchFn = mockFetchWithTracking(true, true, true);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.acquired).toBe(false);
    expect(fetchFn.postCount()).toBe(0);
  });

  it('2. runtime PNG missing → acquisition POST issued', async () => {
    const fetchFn = mockFetchWithTracking(false, true, true);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.acquired).toBe(true);
    expect(fetchFn.postCount()).toBe(1);
  });

  it('3. acquisition succeeds → ready', async () => {
    const fetchFn = mockFetch(false, true, true);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(true);
  });

  it('4. acquisition fails → explicit failure', async () => {
    const fetchFn = mockFetch(false, false, false);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('5. verification after acquisition fails → explicit failure', async () => {
    const fetchFn = mockFetch(false, true, false);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(false);
    expect(result.acquired).toBe(true);
    expect(result.error).toContain('not found');
  });

  it('6. same candidate requested concurrently → one acquisition request', async () => {
    const fetchFn = mockFetchWithTracking(false, true, true);
    const p1 = ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    const p2 = ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ready).toBe(true);
    expect(r2.ready).toBe(true);
    expect(fetchFn.postCount()).toBe(1);
  });

  it('7. invalid candidate → not ready', async () => {
    const fetchFn = mockFetch(true, true, true);
    const result = await ensureCandidateRuntimeReady('invalid_candidate', { fetchFn });
    expect(result.ready).toBe(false);
    expect(result.error).toContain('not in inventory');
  });

  it('8. HEAD-based check would false-positive on Vite SPA fallback — runtime-status does NOT', async () => {
    // Simulate Vite SPA fallback: a HEAD request to the PNG URL returns 200 text/html
    // but the runtime-status endpoint correctly reports exists:false (first check),
    // then exists:true after acquisition (verify check)
    let statusCalls = 0;
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') return { ok: true, headers: { get: () => 'text/html' } } as unknown as Response;
      if (url.includes('/dev/vfx-runtime-status/')) {
        statusCalls++;
        return { ok: true, json: async () => ({ ok: true, exists: statusCalls > 1, isPng: statusCalls > 1 }) } as unknown as Response;
      }
      if (init?.method === 'POST') {
        return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
      }
      return { ok: false } as Response;
    }) as unknown as FetchFn;
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    // The runtime-status endpoint correctly reports not-exists, so acquisition should happen
    expect(result.ready).toBe(true);
    expect(result.acquired).toBe(true);
  });
});

describe('VFX Runtime Readiness — ensureDraftRuntimeReady', () => {
  beforeEach(() => { _clearInFlight(); });

  it('9. multiple unique candidates → all prepared', async () => {
    const fetchFn = mockFetch(true, true, true);
    const draft = baseDraft(['r1_1709', 'r1_0934']);
    const result = await ensureDraftRuntimeReady(draft, { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.failedCandidates).toHaveLength(0);
  });

  it('10. duplicate candidates in draft → deduplicated', async () => {
    const fetchFn = mockFetch(true, true, true);
    const draft = baseDraft(['r1_1709', 'r1_1709']);
    const result = await ensureDraftRuntimeReady(draft, { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.candidates).toHaveLength(1);
  });

  it('11. one candidate fails → draft not ready, failure reported', async () => {
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/dev/vfx-runtime-status/')) {
        if (url.includes('r1_1709')) return { ok: true, json: async () => ({ ok: true, exists: true, isPng: true }) } as unknown as Response;
        return { ok: true, json: async () => ({ ok: true, exists: false }) } as unknown as Response;
      }
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        if (body.candidateId === 'r1_1709') return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
        return { ok: false, json: async () => ({ ok: false }) } as unknown as Response;
      }
      return { ok: false } as Response;
    }) as unknown as FetchFn;
    const draft = baseDraft(['r1_1709', 'r1_0934']);
    const result = await ensureDraftRuntimeReady(draft, { fetchFn });
    expect(result.ready).toBe(false);
    expect(result.failedCandidates).toContain('r1_0934');
  });
});

describe('VFX Replacement — semantic profiles preserved', () => {
  it('12. replaceSlotCandidate changes candidateId', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    expect(draft.visualSlots[0]!.candidateId).toBe('r1_0934');
  });

  it('13. SIZE/TIMING/PLACEMENT profiles preserved after replacement', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = updateSlotProfile(draft, slotId, { sizeProfile: 'GIGA', timingProfile: 'LONG', placementProfile: 'TARGET' });
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    expect(draft.visualSlots[0]!.sizeProfile).toBe('GIGA');
    expect(draft.visualSlots[0]!.timingProfile).toBe('LONG');
    expect(draft.visualSlots[0]!.placementProfile).toBe('TARGET');
  });

  it('14. compileDraft after replacement uses NEW candidateId', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect(compiled.slots[0]!.candidateId).toBe('r1_0934');
  });

  it('15. GIGA survives replacement', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = updateSlotProfile(draft, slotId, { sizeProfile: 'GIGA' });
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    expect(draft.visualSlots[0]!.sizeProfile).toBe('GIGA');
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect(compiled.slots[0]!.scale).toBeCloseTo(5.50, 1);
  });
});

describe('VFX Play Latest Draft — snapshot correctness', () => {
  it('16. PLAY uses current draft after REPLACE + SIZE + TIMING + PLACEMENT', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    draft = updateSlotProfile(draft, slotId, { sizeProfile: 'GIGA', timingProfile: 'LONG', placementProfile: 'TARGET' });
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect(compiled.slots[0]!.candidateId).toBe('r1_0934');
    expect(compiled.slots[0]!.candidateId).not.toBe('r1_1709');
    expect(compiled.slots[0]!.scale).toBeCloseTo(5.50, 1);
    expect(compiled.slots[0]!.anchor).toBe('target');
  });
});
