import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const IMAGE_GATE_PATH = 'tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json';
const APPROVAL_PATH = 'tools/cinematics/specs/cin6ea3_operator_approval.json';
const SPEC_PATH = 'tools/cinematics/specs/cin6ea3/pilot_e_cedric_continuous.json';
const SOURCE_PATH = 'tmp/cinematics/cin4/cin6ea3_pilot_e_cedric_continuous/shot_01/source.png';
const EXPECTED_SOURCE_SHA = 'd2943e0349c22ea7045f1b8e0a5b0571e1a8c0bacdb8496a3799fce70ad0317a';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const imageGateAbsolute = resolve(ROOT, IMAGE_GATE_PATH);
const imageGate = JSON.parse(await readFile(imageGateAbsolute, 'utf8'));
if (imageGate.candidate.id !== 'pilot_e_cinematic_keyframe_c') throw new Error('Unexpected Pilot E source candidate.');
if (imageGate.candidate.sha256 !== EXPECTED_SOURCE_SHA) throw new Error('Pilot E-C image-gate hash is not the approved hash.');
if (imageGate.gates.length !== 13 || imageGate.gates.some((gate) => gate.status !== 'PASS')) {
  throw new Error('Pilot E-C must pass all thirteen image-fidelity gates before H3 preparation.');
}

const sourceCandidateAbsolute = resolve(ROOT, imageGate.candidate.path);
const sourceBytes = await readFile(sourceCandidateAbsolute);
if (sha256(sourceBytes) !== EXPECTED_SOURCE_SHA) throw new Error('Pilot E-C bytes changed after operator approval.');

const sourceAbsolute = resolve(ROOT, SOURCE_PATH);
await mkdir(dirname(sourceAbsolute), { recursive: true });
try {
  const existingBytes = await readFile(sourceAbsolute);
  if (sha256(existingBytes) !== EXPECTED_SOURCE_SHA) throw new Error('Existing CIN-6E-A.3 H3 source differs from approved E-C.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
  await copyFile(sourceCandidateAbsolute, sourceAbsolute);
}
if (sha256(await readFile(sourceAbsolute)) !== EXPECTED_SOURCE_SHA) throw new Error('H3 source copy is not byte-identical to E-C.');

const approval = {
  schemaVersion: 1,
  mission: 'CIN-6E-A.3',
  approvedOn: '2026-09-12',
  operatorDecision: 'E-C_OPERATOR_APPROVED',
  approvedCandidateId: 'pilot_e_cinematic_keyframe_c',
  approvedSourcePath: imageGate.candidate.path,
  approvedSourceSha256: EXPECTED_SOURCE_SHA,
  externalUploadAuthorization: {
    authorized: true,
    service: 'MiniMax H3 I2V',
    authorizedPayload: [imageGate.candidate.path],
    purpose: 'One non-production Pilot E dynamic video regate only',
    pilotsCAndFExcluded: true,
  },
  constraints: {
    productionUse: false,
    modifyPilotsCOrF: false,
    modifyProductionMedia: false,
    commit: false,
    push: false,
  },
};
await mkdir(dirname(resolve(ROOT, APPROVAL_PATH)), { recursive: true });
await writeFile(resolve(ROOT, APPROVAL_PATH), `${JSON.stringify(approval, null, 2)}\n`, 'utf8');

imageGate.agentImageVerdict = 'OPERATOR_APPROVED';
imageGate.operatorApproval = {
  status: 'APPROVED',
  approvedOn: approval.approvedOn,
  approvalRecord: APPROVAL_PATH,
  approvedSourceSha256: EXPECTED_SOURCE_SHA,
};
imageGate.h3Submission = 'AUTHORIZED_FOR_E_ONLY_DYNAMIC_REGATE';
await writeFile(imageGateAbsolute, `${JSON.stringify(imageGate, null, 2)}\n`, 'utf8');

const spec = {
  schemaVersion: 1,
  sequenceId: 'cin6ea3_pilot_e_cedric_continuous',
  cinematicId: 'cin6ea3_pilot_e_cedric_continuous',
  tier: 'MICRO',
  canonicalFacing: 'SCREEN_RIGHT',
  promptVersion: 'cin6ea-3-e-c-regate-v1',
  resolution: '2K',
  frame: { width: 1920, height: 1080 },
  artDirection: 'CIN-6E-A.3 non-production E-only dynamic regate. Animate only the operator-approved E-C keyframe. Cedric and Kestrel masks are immutable identity features.',
  shots: [{
    shotId: 'shot_01',
    purpose: 'Validate continuous Cedric and Kestrel identity, masks, weapons, cast and Forest Road continuity from approved E-C.',
    framing: 'WIDE_FOREST_TWO_SHOT',
    environment: 'public/assets/generated/lion-phase/dialogue/mystery_recruit.webp',
    source: { type: 'ROOT_SOURCE', output: SOURCE_PATH },
    characters: [
      { id: 'cedric', asset: 'public/assets/characters/pixel/full/cedric.png', position: { x: 0.36, groundY: 0.91 }, scale: { framing: 'WIDE', perspective: 1.1 }, facing: 'SCREEN_RIGHT', lookTarget: 'CHARACTER:kestrel', depth: 20, role: 'PRIMARY', action: 'SHIFT_STANCE', mirrorPolicy: 'ALLOW' },
      { id: 'kestrel', asset: 'public/assets/characters/pixel/full/kestrel.png', position: { x: 0.63, groundY: 0.89 }, scale: { framing: 'WIDE', perspective: 1.0 }, facing: 'SCREEN_LEFT', lookTarget: 'CHARACTER:cedric', depth: 10, role: 'SECONDARY', action: 'OBSERVE', mirrorPolicy: 'ALLOW' },
    ],
    camera: { mode: 'STATIC' },
    durationSeconds: 5,
    continuityOut: 'END',
    endIntent: 'CEDRIC_ENCOUNTER_HOLD_UNRESOLVED',
    promptIntent: 'ONE PHYSICAL SCENE, ONE CONTINUOUS SHOT, ZERO CUTS. Start from the exact operator-approved E-C frame. Keep the camera locked and preserve the precise character sides, poses, relative scale, ground contact, lighting, road, shrine, mountain, trees, signpost and every Forest Road landmark. Cedric makes only a restrained weight-settling breath. His deep-purple hood and CLOSED DARK METALLIC FACE MASK remain intact in every frame; no nose, mouth, jaw, chin or other human facial anatomy may appear. Kestrel keeps the drawn longbow stable with only restrained breathing. Her green hood and opaque GREEN CLOTH FACE MASK remain intact in every frame and conceal the nose, mouth, jaw, chin, cheeks and all lower-face skin; only the eyes may remain visible in hood shadow. Preserve Cedric paired curved blades, Kestrel longbow, drawn arrow and quiver without mutation. Animate only subtle breathing, tiny cloth response, leaves and thin mist. No new person, disappearance, cast addition, face exposure, mask morph, weapon mutation, hand mutation, arrow release, attack, teleport, camera move, scene reset, world reset, hidden transition, hard cut or editorial cut. End sharp in the same guarded tableau with both masks, both characters, all weapons and the environment fully readable and HOLD-safe.',
  }],
};
await mkdir(dirname(resolve(ROOT, SPEC_PATH)), { recursive: true });
await writeFile(resolve(ROOT, SPEC_PATH), `${JSON.stringify(spec, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  status: 'READY_FOR_H3_E_ONLY',
  approvalPath: APPROVAL_PATH,
  specPath: SPEC_PATH,
  sourcePath: SOURCE_PATH,
  sourceSha256: sha256(await readFile(sourceAbsolute)),
  excludedPilots: ['C', 'F'],
}, null, 2));
