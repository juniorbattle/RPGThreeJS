import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateShotSpec } from './cin4_shot_spec.mjs';
import { validateCinematicDialogueCastAudit } from './validate_cinematic_dialogue_cast_audit.mjs';
import { validateJourneyCinematicGrammar } from './validate_journey_cinematic_grammar.mjs';
import { validateCinematicContinuityBible } from './validate_cinematic_continuity_bible.mjs';

const root = process.cwd();
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const readSpec = (id) => readJson(`tools/cinematics/specs/cin6a/${id}.json`);
const sha256 = async (path) => createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');

const PRESERVED_MEDIA = Object.freeze({
  lion_judgement: '6ea5b12bb8c97deadbea2177725d7e3eb958ab7971361d34064729acf776e5f9',
  serpent_general_reveal: 'e8c918d292693e4bc7f612fc6f4fbcdb283c6d2f8095c805db287692e561a682',
  lion_champion_reveal: '2d581e76e5cc0a37d4633fd6d7166210780da55475f54abadfd90aedaf30b04c',
  forest_journey_tension: '385f5f9b99b22d9710ef1ef7a89fd21a8b59e392664a51a2480eab6167511fac',
  refugees_approach: '5f1d76f8686c2bf2f9775576da6d50649cb33e1c5157b46e6d3f9d5b719e5a28',
  first_refuge_arrival: '31b4a50f678d6d7431a855d7056bbcee66f44f8a623081be972b79986a55c56e',
  first_refuge_departure: 'a3078c6e149c02f78be58063d9f884004a7d3b0265ba29481506fe138d194425',
  bois_clair_arrival: 'a37d397665960f8f6749d8f1ece69eaf91c7160cec68fc581ed26ea78042a699',
  bois_clair_saved: 'a57d9ef8ff2fbb26084066b057f89948bdfe59de22dc7f7770d6576900223b1f',
  bois_clair_sacrificed: 'db07031a3105fb31280abe3aca026cb74e4612e2aa44f7023b5401847322f1a4',
  second_refuge_departure: 'a7d4210b8223a6ef3946fc63bdb138310ed61168f6d902bfc0eb4f74dbe9be3d',
  witnesses_encounter: 'de8f577bb18dc4ce30e0ec3d902fe7f27c4778154ade2e6e1a14eeec99ac4b98',
  ruins_approach_context: 'adf235b6d84889cf80059ae314e7472f2c07e9dcd2f7e9cf99cf7f936bebe525',
  shadow_signs: '141d5e04d3573a1827cff7dbdc9efacb024d8a3ecab32a985b700da75a56f4c2',
  final_refuge_dossier: 'fa821768883d1afd897216c60c81f979c998db0b1437e1c7eb74f098b58f5ca2',
  serpent_route_ending: 'f1de1f29ccc98ca66f97da94c21060d100687e4fef39b2d0378bcdea36db395c',
  lion_trial_route_ending: '34f023ac0313e622a82d53c955e63e1e56a62eb4bd3bfdef9580196fcff178b2',
});

describe('CIN-6.6 finalization contracts', () => {
  it('validates the deterministic dialogue/cast audit, Journey grammar and continuity bible', async () => {
    expect((await validateCinematicDialogueCastAudit(await readJson('tools/cinematics/specs/cinematic_dialogue_cast_audit.json'), { projectRoot: root })).errors).toEqual([]);
    expect(validateJourneyCinematicGrammar(await readJson('tools/cinematics/specs/journey_cinematic_grammar.json')).errors).toEqual([]);
    expect((await validateCinematicContinuityBible(await readJson('tools/cinematics/specs/cinematic_continuity_bible.json'), { projectRoot: root })).errors).toEqual([]);
  });

  it('locks all three authorized pilots to the integrated-keyframe doctrine', async () => {
    for (const id of ['alaric_audience_arrival', 'camp_departure', 'valmir_route_fork']) {
      const spec = await readSpec(id);
      expect(spec.productionDoctrine).toBe('INTEGRATED_KEYFRAME_V3');
      expect(spec.promptVersion).toContain('cin66-final');
      expect((await validateShotSpec(spec, { projectRoot: root })).errors).toEqual([]);
      for (const shot of spec.shots) {
        expect(shot.source.integration.method).toBe('OPENAI_BUILT_IN_IMAGE_GEN_EDIT');
        expect(shot.source.integration.qualityGates).toEqual(expect.arrayContaining(['NO_COLLAGE_LOOK', 'WORLD_INTEGRATION']));
        expect(shot.characters.every((character) => character.asset.startsWith('public/assets/characters/pixel/full/'))).toBe(true);
        expect(shot.characters.every((character) => character.scale && character.heightPx === undefined)).toBe(true);
      }
    }
  });

  it('derives Audience and Camp casts from dialogue truth', async () => {
    const audience = await readSpec('alaric_audience_arrival');
    expect(audience.cast.requiredSpeakers).toEqual(['alaric', 'alistair']);
    expect(audience.cast.playerFaction.representatives).toEqual(['sage_seraphine', 'maelor']);
    expect(new Set(audience.shots.flatMap((shot) => shot.characters.map((character) => character.id)))).toEqual(new Set(['sage_seraphine', 'maelor', 'alistair', 'alaric']));
    const camp = await readSpec('camp_departure');
    expect(camp.cast.requiredSpeakers).toEqual(['maelor', 'alistair', 'marian']);
    expect(new Set(camp.shots.flatMap((shot) => shot.characters.map((character) => character.id)))).toEqual(new Set(camp.cast.requiredSpeakers));
  });

  it('maps the real Valmir RunNode fork to left and right geography without adding truth', async () => {
    const spec = await readSpec('valmir_route_fork');
    expect(spec.cast.sourceNodeId).toBe('lion-valmir-road');
    expect(spec.cast.authoritativeRoutes).toEqual([
      { nodeId: 'lion-second-trial-event', geography: 'LEFT', label: 'Vieux sanctuaire' },
      { nodeId: 'lion-second-trial-combat', geography: 'RIGHT', label: 'Barrage renforcé' },
    ]);
    for (const shot of spec.shots) {
      expect(shot.leftRouteSafeZone.x + shot.leftRouteSafeZone.width).toBeLessThan(shot.centerGroupSafeZone.x);
      expect(shot.rightRouteSafeZone.x).toBeGreaterThan(shot.centerGroupSafeZone.x + shot.centerGroupSafeZone.width);
    }
  });

  it('keeps branch geography presentation-only and the single-route unit compact', async () => {
    const overlay = await readFile(resolve(root, 'src/cinematics/JourneyOverlay.ts'), 'utf8');
    const css = await readFile(resolve(root, 'src/styles/app.css'), 'utf8');
    expect(overlay).toContain("item.dataset.routeGeography = geography.toUpperCase()");
    expect(overlay).not.toContain('enterRunNode');
    expect(css).toContain('.journey-overlay--single { place-items:end end; }');
    expect(css).toContain('.journey-overlay--branch .journey-overlay__choices');
    expect(css).toContain('justify-content:space-between');
  });

  it('changes at most the three authorized production masters and adds no ID', async () => {
    for (const [id, expected] of Object.entries(PRESERVED_MEDIA)) expect(await sha256(`public/assets/cinematics/${id}.mp4`)).toBe(expected);
    const manifest = await readJson('public/assets/cinematics/manifest.json');
    expect(manifest.cinematics).toHaveLength(21);
    expect(new Set(manifest.cinematics.map((entry) => entry.id)).size).toBe(21);
    expect(manifest.cinematics.some((entry) => /^cin6[cp]-/u.test(entry.id))).toBe(false);
  });

  it('preserves the concurrent VFX registry without touching game-truth owners', async () => {
    expect(await sha256('src/combat/vfx/generated/published-vfx-presets.json')).toBe('4951b2d22f5fce42131bf46aad6d2422aa098b5881bbaccee33291c01eda1e3e');
    const diffTargets = ['src/game/runSystem.ts', 'src/game/types.ts', 'src/combat/stage/CombatStage.ts'];
    for (const path of diffTargets) expect((await readFile(resolve(root, path), 'utf8')).length).toBeGreaterThan(0);
  });
});
