import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const MODEL = 'gpt-image-2.5-sunburst-2026-09-08';
const CANDIDATE_ID = 'pilot_e_cinematic_keyframe_c';
const PROMPT_SPEC_PATH = 'tmp/cinematics/cin6ea/prompts/pilot_e_cinematic_keyframe_c.json';
const MANIFEST_PATH = 'tools/cinematics/specs/cin6ea_compiled_prompt_manifest.json';
const REFERENCE_PATHS = [
  'tmp/cinematics/cin6ea/execution/images/pilot_e_cinematic_keyframe_a/pilot_e_cinematic_keyframe_a.png',
  'public/assets/characters/pixel/masters/rogue.png',
  'public/assets/characters/pixel/masters/archer.png',
];

const prompt = `Precision edit for RPGThreeJS CIN-6E-A.3. Edit Image 1 only and preserve its approved Pilot E-A Forest Road composition.

Image 1 is the edit target. Keep its camera, framing, character positions and scale, action poses, forest-road environment, road and ground plane, depth, lighting, palette, atmosphere, foreground foliage, distant architecture, material response, and integrated cinematic appearance unchanged wherever possible.

Make one targeted identity correction: restore Kestrel's canonical opaque GREEN CLOTH FACE MASK exactly as shown in Image 3. The green cloth must cover and conceal Kestrel's nose, mouth, jaw, chin, cheeks, and every other piece of lower-face skin. Only the eyes may remain visible within deep green hood shadow. No human nose, lips, mouth, jaw, chin, beard, or exposed lower-face anatomy may be visible.

Preserve Cedric exactly as staged in Image 1 and as defined by Image 2: deep-purple hood, closed dark metallic face mask, fully concealed human face, agile armored silhouette, canonical purple and brown palette, and paired curved blades. Do not expose any Cedric facial anatomy.

Preserve Kestrel's green hood, green and brown palette, longbow, drawn arrow, quiver, compact ranger silhouette, pose, scale, and grounding. The cloth mask belongs under the hood and must read clearly as green fabric rather than skin, metal, beard, or shadow alone.

Required result: both characters physically integrated into the existing environment with shared perspective, ground contact, occlusion, lighting, atmosphere, and depth. No collage look. No redesign, extra character, removed character, changed weapon, changed costume, changed pose, changed environment, text, UI, logo, watermark, or editorial framing.

Input roles in upload order:
Image 1: exact E-A edit target and composition authority.
Image 2: immutable canonical full-body identity authority for Cedric.
Image 3: immutable canonical full-body identity authority for Kestrel, especially the green cloth face mask.`;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const referenceSha256 = {};
for (const path of REFERENCE_PATHS) {
  referenceSha256[path] = sha256(await readFile(resolve(ROOT, path)));
}

const promptSha256 = sha256(Buffer.from(prompt, 'utf8'));
const job = {
  assetCandidateId: CANDIDATE_ID,
  mission: 'CIN-6E-A.3',
  semanticMode: 'CINEMATIC_VIDEO',
  assetType: 'CINEMATIC_KEYFRAME',
  beatId: 'media:cedric_encounter',
  dialogueId: null,
  visualFamily: 'FOREST_ROAD',
  model: MODEL,
  exactModelSnapshot: MODEL,
  quality: 'max',
  attempt: 'C',
  generationTimestamp: null,
  generationType: 'edit',
  endpoint: '/v1/images/edits',
  promptSpecPath: PROMPT_SPEC_PATH,
  prompt,
  promptSha256,
  referencePaths: REFERENCE_PATHS,
  referenceSha256,
  outputPath: null,
  outputSha256: null,
  castManifestId: 'cast:media:cedric_encounter',
  dependencies: ['pilot_e_cinematic_keyframe_a', 'canonical:cedric', 'canonical:kestrel'],
  selection: 'NOT_GENERATED',
  rejectionReasons: [],
  parentCandidate: 'pilot_e_cinematic_keyframe_a',
  repairTarget: 'Restore Kestrel canonical green cloth face mask while preserving the E-A composition.',
  sourceVideo: null,
  finalApprovalState: 'PENDING_IMAGE_FIDELITY_GATE',
  executionStatus: 'READY_FOR_EXACT_MODEL_EXECUTION',
};

const promptSpecAbsolute = resolve(ROOT, PROMPT_SPEC_PATH);
await mkdir(dirname(promptSpecAbsolute), { recursive: true });
await writeFile(promptSpecAbsolute, `${JSON.stringify(job, null, 2)}\n`, 'utf8');

const manifestAbsolute = resolve(ROOT, MANIFEST_PATH);
const manifest = JSON.parse(await readFile(manifestAbsolute, 'utf8'));
manifest.jobs = manifest.jobs.filter((entry) => entry.assetCandidateId !== CANDIDATE_ID);
manifest.jobs.push(job);
manifest.summary = {
  ...manifest.summary,
  totalJobs: manifest.jobs.length,
  cin6ea3RepairJobs: 1,
};
await writeFile(manifestAbsolute, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  status: 'READY',
  candidateId: CANDIDATE_ID,
  model: MODEL,
  quality: 'max',
  promptSpecPath: PROMPT_SPEC_PATH,
  promptSha256,
  referenceSha256,
}, null, 2));
