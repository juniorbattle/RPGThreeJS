import { describe, expect, it } from 'vitest';
import { APPROVED_PRODUCTION_VIDEO_IDS } from './ApprovedProductionVideos';
import {
  CINEMATIC_PLACEMENTS,
  CINEMATIC_REQUIREMENTS,
  CINEMATIC_TIERS,
  COMBAT_OUTCOMES,
  DOCTRINE_INVARIANTS,
  getConditionalCombatBeats,
  getCinematicRequiredBeats,
  getMainEventBeats,
  getNarrativePresentationDefinition,
  NARRATIVE_PRESENTATION_DOCTRINE,
  narrativePresentationDefinitionSchema,
  PRIMARY_INTERACTIVE_MODES,
  validateNarrativePresentationDoctrine,
} from './NarrativePresentationDoctrine';

describe('NarrativePresentationDoctrine', () => {
  describe('vocabulary', () => {
    it('exposes the locked primary interactive modes (excludes CINEMATIC_VIDEO)', () => {
      expect(PRIMARY_INTERACTIVE_MODES).toEqual(['STATIC_TABLEAU', 'TRAVEL_STILL', 'NONE']);
      expect(PRIMARY_INTERACTIVE_MODES).not.toContain('CINEMATIC_VIDEO');
    });

    it('exposes the locked cinematic requirements', () => {
      expect(CINEMATIC_REQUIREMENTS).toEqual(['NONE', 'OPTIONAL', 'REQUIRED']);
    });

    it('exposes the locked cinematic tiers (QUICK is a subtype, not a surface)', () => {
      expect(CINEMATIC_TIERS).toEqual(['NONE', 'QUICK', 'MAJOR', 'TBD']);
    });

    it('exposes the locked cinematic placements (TBD is valid)', () => {
      expect(CINEMATIC_PLACEMENTS).toEqual(['TBD', 'BEFORE', 'AFTER', 'BOTH']);
    });

    it('exposes the locked combat outcomes', () => {
      expect(COMBAT_OUTCOMES).toEqual(['NONE', 'CONDITIONAL', 'REQUIRED']);
    });
  });

  describe('invariants', () => {
    it('locks the absolute interaction invariants', () => {
      expect(DOCTRINE_INVARIANTS).toEqual({
        DIALOGUE_STEPS_ON_VIDEO: 0,
        DIALOGUE_STEPS_ON_HOLD: 0,
        CHOICE_STEPS_ON_HOLD: 0,
      });
    });
  });

  describe('schema validation', () => {
    it('validates every doctrine entry against the zod schema', () => {
      for (const def of NARRATIVE_PRESENTATION_DOCTRINE) {
        const result = narrativePresentationDefinitionSchema.safeParse(def);
        expect(result.success, `beatId=${def.beatId}`).toBe(true);
      }
    });
  });

  describe('doctrine validation rules', () => {
    const result = validateNarrativePresentationDoctrine();

    it('passes validation with zero errors', () => {
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('keeps main-event status independent from video requirements', () => {
      const mainEvents = getMainEventBeats();
      expect(mainEvents.length).toBeGreaterThan(0);
      expect(mainEvents.find((def) => def.beatId === 'combat:serpent_captain')?.cinematicRequirement).toBe('NONE');
    });

    it('allows a main event without video', () => {
      const accepted = [
        ...NARRATIVE_PRESENTATION_DOCTRINE,
        { beatId: 'test:main_event_none', primaryInteractiveMode: 'STATIC_TABLEAU' as const, mainEvent: true, cinematicRequirement: 'NONE' as const, cinematicTier: 'NONE' as const, cinematicPlacement: 'TBD' as const, combatOutcome: 'NONE' as const },
      ];
      expect(validateNarrativePresentationDoctrine(accepted).valid).toBe(true);
    });

    it('rejects unapproved optional video even for a main event', () => {
      const invalid = [
        ...NARRATIVE_PRESENTATION_DOCTRINE,
        { beatId: 'test:main_event_optional', primaryInteractiveMode: 'STATIC_TABLEAU' as const, mainEvent: true, cinematicRequirement: 'OPTIONAL' as const, cinematicTier: 'TBD' as const, cinematicPlacement: 'TBD' as const, combatOutcome: 'NONE' as const },
      ];
      const result = validateNarrativePresentationDoctrine(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('test:main_event_optional: production cinematic classification must be NONE/NONE');
    });

    it('enforces PROLOGUE → cinematicRequirement = REQUIRED', () => {
      const prologue = getNarrativePresentationDefinition('media:camp_departure');
      expect(prologue).toBeDefined();
      expect(prologue!.cinematicRequirement).toBe('REQUIRED');
      expect(prologue!.mainEvent).toBe(true);
    });

    it('uses the approved ending videos rather than an independent epilogue video', () => {
      const epilogue = getNarrativePresentationDefinition('dialogue:epilogue');
      expect(epilogue).toBeDefined();
      expect(epilogue!.cinematicRequirement).toBe('NONE');
      expect(epilogue!.mainEvent).toBe(true);
    });

    it('never uses CINEMATIC_VIDEO as primaryInteractiveMode', () => {
      for (const def of NARRATIVE_PRESENTATION_DOCTRINE) {
        expect(def.primaryInteractiveMode, def.beatId).not.toBe('CINEMATIC_VIDEO');
      }
    });

    it('allows TBD cinematic placement as a valid state', () => {
      const tbdBeats = NARRATIVE_PRESENTATION_DOCTRINE.filter((d) => d.cinematicPlacement === 'TBD');
      expect(tbdBeats.length).toBeGreaterThan(0);
    });

    it('has no QUICK production videos', () => {
      const quickBeats = NARRATIVE_PRESENTATION_DOCTRINE.filter((d) => d.cinematicTier === 'QUICK');
      expect(quickBeats).toEqual([]);
    });
  });

  describe('combat outcome model', () => {
    it('classifies REQUIRED combat beats', () => {
      const required = NARRATIVE_PRESENTATION_DOCTRINE.filter((d) => d.combatOutcome === 'REQUIRED');
      expect(required.length).toBeGreaterThan(0);
      for (const def of required) {
        expect(def.beatId).toMatch(/^combat:/);
      }
    });

    it('classifies CONDITIONAL combat beats with combat triggers', () => {
      const conditional = getConditionalCombatBeats();
      expect(conditional.length).toBeGreaterThan(0);
      for (const def of conditional) {
        expect(def.combatTrigger, def.beatId).toBeDefined();
      }
    });

    it('does not imply CONDITIONAL combat always occurs', () => {
      const conditional = getConditionalCombatBeats();
      for (const def of conditional) {
        expect(def.combatOutcome, def.beatId).toBe('CONDITIONAL');
      }
    });
  });

  describe('cinematic requirement distribution', () => {
    it('identifies all REQUIRED cinematic beats', () => {
      const required = getCinematicRequiredBeats();
      expect(required.map((def) => def.beatId).sort()).toEqual(
        APPROVED_PRODUCTION_VIDEO_IDS.map((id) => `media:${id}`).sort(),
      );
      for (const def of required) {
        expect(def.cinematicRequirement).toBe('REQUIRED');
      }
    });

    it('ensures all MAJOR tier beats have REQUIRED cinematic', () => {
      const major = NARRATIVE_PRESENTATION_DOCTRINE.filter((d) => d.cinematicTier === 'MAJOR');
      expect(major.length).toBeGreaterThan(0);
      for (const def of major) {
        expect(def.cinematicRequirement, def.beatId).toBe('REQUIRED');
      }
    });
  });

  describe('no duplicate beatIds', () => {
    it('has no duplicate doctrine definitions', () => {
      const ids = NARRATIVE_PRESENTATION_DOCTRINE.map((d) => d.beatId);
      const unique = new Set(ids);
      expect(ids.length).toBe(unique.size);
    });
  });
});
