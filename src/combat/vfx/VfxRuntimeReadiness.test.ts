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

function mockFetch(
  headOk: boolean,
  acquireOk: boolean,
  verifyOk: boolean,
): FetchFn {
  let headCalls = 0;
  let acquireCalls = 0;
  const fn: FetchFn = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'HEAD') {
      headCalls++;
      if (headCalls === 1) return { ok: headOk } as Response;
      return { ok: verifyOk } as Response;
    }
    if (init?.method === 'POST') {
      acquireCalls++;
      return { ok: true, json: async () => ({ ok: acquireOk }) } as unknown as Response;
    }
    return { ok: false } as Response;
  }) as unknown as FetchFn;
  return fn;
}

describe('VFX Runtime Readiness — ensureCandidateRuntimeReady', () => {
  beforeEach(() => { _clearInFlight(); });

  it('1. runtime PNG already exists → no acquisition POST', async () => {
    const fetchFn = mockFetch(true, true, true);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.acquired).toBe(false);
    // Only one HEAD call, no POST
    expect((fetchFn as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(1);
  });

  it('2. runtime PNG missing → acquisition POST issued', async () => {
    const fetchFn = mockFetch(false, true, true);
    const result = await ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.acquired).toBe(true);
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
    const fetchFn = mockFetch(false, true, true);
    const p1 = ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    const p2 = ensureCandidateRuntimeReady('r1_1709', { fetchFn });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.ready).toBe(true);
    expect(r2.ready).toBe(true);
    // Should share the same in-flight promise — only one set of calls
    const calls = (fetchFn as unknown as { mock: { calls: [string, RequestInit | undefined][] } }).mock.calls;
    const postCalls = calls.filter((c) => c[1]?.method === 'POST');
    expect(postCalls.length).toBe(1);
  });

  it('7. invalid candidate → not ready', async () => {
    const fetchFn = mockFetch(true, true, true);
    const result = await ensureCandidateRuntimeReady('invalid_candidate', { fetchFn });
    expect(result.ready).toBe(false);
    expect(result.error).toContain('not in inventory');
  });
});

describe('VFX Runtime Readiness — ensureDraftRuntimeReady', () => {
  beforeEach(() => { _clearInFlight(); });

  it('8. multiple unique candidates → all prepared', async () => {
    const fetchFn = mockFetch(true, true, true);
    const draft = baseDraft(['r1_1709', 'r1_0934']);
    const result = await ensureDraftRuntimeReady(draft, { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.failedCandidates).toHaveLength(0);
  });

  it('9. duplicate candidates in draft → deduplicated', async () => {
    const fetchFn = mockFetch(true, true, true);
    const draft = baseDraft(['r1_1709', 'r1_1709']);
    const result = await ensureDraftRuntimeReady(draft, { fetchFn });
    expect(result.ready).toBe(true);
    expect(result.candidates).toHaveLength(1);
  });

  it('10. one candidate fails → draft not ready, failure reported', async () => {
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        if (url.includes('r1_1709')) return { ok: true } as Response;
        return { ok: false } as Response;
      }
      if (init?.method === 'POST') {
        if (url.includes('acquire')) {
          const body = JSON.parse(init.body as string);
          if (body.candidateId === 'r1_1709') return { ok: true, json: async () => ({ ok: true }) } as unknown as Response;
          return { ok: false, json: async () => ({ ok: false }) } as unknown as Response;
        }
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
  it('11. replaceSlotCandidate changes candidateId', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    expect(draft.visualSlots[0]!.candidateId).toBe('r1_0934');
  });

  it('12. SIZE/TIMING/PLACEMENT profiles preserved after replacement', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = updateSlotProfile(draft, slotId, { sizeProfile: 'GIGA', timingProfile: 'LONG', placementProfile: 'TARGET' });
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    expect(draft.visualSlots[0]!.sizeProfile).toBe('GIGA');
    expect(draft.visualSlots[0]!.timingProfile).toBe('LONG');
    expect(draft.visualSlots[0]!.placementProfile).toBe('TARGET');
  });

  it('13. compileDraft after replacement uses NEW candidateId', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect(compiled.slots[0]!.candidateId).toBe('r1_0934');
  });

  it('14. GIGA survives replacement', () => {
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
  it('15. PLAY uses current draft after REPLACE + SIZE + TIMING + PLACEMENT', () => {
    let draft = baseDraft(['r1_1709']);
    const slotId = draft.visualSlots[0]!.id;
    // Simulate REPLACE → r1_0934
    draft = replaceSlotCandidate(draft, slotId, 'r1_0934');
    // SIZE → GIGA, TIMING → LONG, PLACEMENT → TARGET
    draft = updateSlotProfile(draft, slotId, { sizeProfile: 'GIGA', timingProfile: 'LONG', placementProfile: 'TARGET' });

    // Compile the draft that would be played
    const compiled = compileDraft(draft, { includeTechnical: false, getCadence: () => null });
    expect(compiled.slots[0]!.candidateId).toBe('r1_0934');
    expect(compiled.slots[0]!.candidateId).not.toBe('r1_1709');
    // GIGA target height
    expect(compiled.slots[0]!.scale).toBeCloseTo(5.50, 1);
    // TARGET placement
    expect(compiled.slots[0]!.anchor).toBe('target');
  });
});
