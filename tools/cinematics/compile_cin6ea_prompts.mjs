#!/usr/bin/env node
/** Compile deterministic, inspectable CIN-6E-A image jobs without calling a provider. */

import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SPECS = resolve(ROOT, 'tools/cinematics/specs');
const PROMPTS = resolve(ROOT, 'tmp/cinematics/cin6ea/prompts');
const BASELINE = '6683c6d3898db0216549c43f7d25c7d8fd46d70d';
const MODEL = 'gpt-image-2.5-sunburst-2026-09-08';
const QUALITY = 'max';

const json = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const sha256Text = (value) => createHash('sha256').update(value).digest('hex');
const posix = (value) => value.replaceAll('\\', '/');

async function fileSha256(path) {
  const absolute = resolve(ROOT, path.replace(/^\//, 'public/'));
  await stat(absolute);
  return createHash('sha256').update(await readFile(absolute)).digest('hex');
}

function orderedUnique(values) {
  return [...new Set(values.filter(Boolean))];
}

function referenceRole(path, index) {
  const image = `Image ${index + 1}`;
  if (path.includes('/gold/')) return `${image}: approved GOLD reference for world integration, rendering language, perspective, grounding, atmosphere and material response; do not reproduce its cast or editorial-cut defects.`;
  if (/\/characters\/pixel\/(?:masters|full|archive\/non-demo)\//u.test(path)) {
    const characterId = path.split('/').at(-1).replace(/\.png$/u, '');
    return `${image}: canonical full-body identity reference for ${characterId}; preserve identity, silhouette, costume, principal colors, weapon and defining accessories.`;
  }
  if (path.includes('/layout-guides/')) return `${image}: runtime geometry guide only; obey its actor and UI safe zones but do not render its colored overlays, labels, lines or borders into the candidate.`;
  return `${image}: supporting visual reference; use only for the role stated in the structured prompt.`;
}

function prose(value) {
  return Array.isArray(value) ? value.join(', ') : value;
}

function familyPrompt(family, attempt) {
  const composition = attempt === 'A'
    ? 'Use the strongest canonical establishing composition with clear three-plane depth and a grounded narrative path.'
    : 'Use an alternate but fully compatible eye-level composition with different foreground framing and the same physical identity.';
  return [
    'Create a 1920x1080 preproduction visual-family master for RPGThreeJS.',
    'Premium hand-painted HD-2D cinematic rendering; the result must belong to one coherent game world.',
    `Visual family: ${family.visualFamilyId}. Physical location: ${family.physicalLocationIdentity}.`,
    `Narrative purpose: ${family.narrativePurpose}. Architecture: ${prose(family.architecture)}. Signature landmarks: ${prose(family.signatureLandmarks)}.`,
    `Terrain and ground: ${family.terrain}; ${family.groundMaterial}. Palette: ${prose(family.palette)}.`,
    `Light: ${family.keyLightDirection}; ${family.keyLightTemperature}; ambient fill ${family.ambientFill}.`,
    `Atmosphere and depth: ${family.atmosphere}; ${family.depthLanguage}.`,
    `Foreground: ${family.foregroundLanguage}. Midground: ${family.midgroundLanguage}. Background: ${family.backgroundLanguage}.`,
    `Camera: ${family.cameraLanguage}. Time and weather: ${family.timeOfDay}; ${family.weather}. Materials: ${family.materialLanguage}.`,
    composition,
    'Environment-only family master. No canonical characters, party members, route-dependent actors, text, logos, subtitles, dialogue UI, choice UI, frames, borders, or watermarks.',
    `Never introduce: ${prose(family.forbiddenVisualDrift)}. Preserve the reference lineage without copying its editorial continuity defects.`,
  ].join('\n');
}

function scenePrompt({ family, pilot, assetType, attempt, cast, characterCards }) {
  const integrated = assetType === 'TRAVEL_STILL' || assetType === 'CINEMATIC_KEYFRAME';
  const composition = attempt === 'A'
    ? 'Use the strongest direct narrative composition.'
    : 'Use a compatible alternate camera treatment while preserving the same location, cast, scale, light, ground and story truth.';
  const castText = integrated
    ? `Required cast, each physically present and identity-faithful: ${cast.requiredCharacters.join(', ')}. Forbidden cast: ${cast.forbiddenCharacters.join(', ') || 'none'}. Speaker sequence context: ${cast.speakerSequence.join(', ') || 'none'}.`
    : `Character-free reverse-composed environment plate. Do not paint any canonical character, party member, named NPC, route-dependent actor or recruit. The runtime owns all foreground actors.`;
  const cardText = integrated
    ? characterCards.map((card) => `${card.characterId}: face visibility ${card.faceVisibility ?? 'AS_SHOWN_IN_CANONICAL_REFERENCE'}; preserve ${prose(card.mustPreserve)}`).join(' | ')
    : 'No character-card content is baked into this plate.';
  const roleText = assetType === 'STATIC_TABLEAU_BACKGROUND'
    ? 'Reserve clean actor lanes and dialogue/choice safe areas from the supplied layout guide. Keep the ground plane readable behind canonical full sprites.'
    : assetType === 'TRAVEL_STILL'
      ? 'Produce one complete integrated 16:9 travel frame. No dialogue card and no separate theatrical sprite cast will appear.'
      : 'Produce one integrated starting keyframe for a silent, zero-cut MiniMax-H3 shot whose cast remains physically continuous and whose final state can become a clean hold.';
  return [
    `Create a 1920x1080 CIN-6E-A ${assetType} pilot candidate for RPGThreeJS.`,
    `Pilot ${pilot.id}: ${pilot.name}. Beat truth: ${pilot.beatIds.join(', ')}.`,
    `Visual family ${family.visualFamilyId}: ${family.physicalLocationIdentity}. Purpose: ${family.narrativePurpose}.`,
    `Camera and world: ${family.cameraLanguage}; ${family.depthLanguage}; ground ${family.groundMaterial}.`,
    `Lighting and palette: ${family.keyLightDirection}; ${family.keyLightTemperature}; ${prose(family.palette)}; atmosphere ${family.atmosphere}.`,
    roleText,
    castText,
    integrated ? `Canonical identity constraints: ${cardText}` : cardText,
    integrated ? 'Treat every uploaded canonical full-body character image as immutable design authority. Match face visibility or concealment, helmet, mask, hood, hat, hair, silhouette, proportions, palette, costume or armor family, weapons, accessories and distinctive shapes character by character. Do not invent, remove, expose, cover, recolor, transfer or redesign any of these identity features.' : 'The runtime will supply unchanged canonical full sprites; keep the generated plate character-free.',
    composition,
    'Characters and environment must share perspective, ground plane, contact, occlusion, light temperature, atmosphere, depth, scale and material response. NO_COLLAGE_LOOK is mandatory.',
    'No baked text, subtitles, speech, dialogue UI, choice UI, watermarks, editorial cuts, alternate-shot reset, unrequested VFX or character redesign.',
  ].join('\n');
}

async function main() {
  const [familyData, castData, cardsData, goldData, pilotData, provenance] = await Promise.all([
    json('tools/cinematics/specs/visual_family_master_specs.json'),
    json('tools/cinematics/specs/scene_cast_manifests.json'),
    json('tools/cinematics/specs/canonical_character_production_cards.json'),
    json('tools/cinematics/specs/gold_visual_dna.json'),
    json('tools/cinematics/specs/cin6ea_six_pilot_plan.json'),
    json('tools/cinematics/specs/cin6ea_provenance_catalog.json'),
  ]);
  const familyById = new Map(familyData.families.map((entry) => [entry.visualFamilyId, entry]));
  const castById = new Map(castData.manifests.map((entry) => [entry.id, entry]));
  const cardById = new Map(cardsData.characters.map((entry) => [entry.characterId, entry]));
  const goldFrameById = new Map();
  for (const gold of goldData.references) {
    const analysis = await json(gold.analysisData);
    goldFrameById.set(gold.id, analysis.selectedFrames.find((frame) => frame.label === 'integration')?.path ?? analysis.selectedFrames[0].path);
  }
  const layoutGuide = 'tmp/cinematics/cin6ea/review/layout-guides/tableau-layout-1920x1080.png';
  const jobs = [];

  async function addJob({ candidateId, semanticMode, beatId, family, attempt, assetType, prompt, referencePaths, castManifestId = null, dependencies = [] }) {
    const refs = orderedUnique(referencePaths);
    const executionPrompt = `${prompt}\n\nInput reference roles, in upload order:\n${refs.map(referenceRole).join('\n')}`;
    const referenceSha256 = {};
    for (const path of refs) referenceSha256[path] = await fileSha256(path);
    const promptSha256 = sha256Text(executionPrompt);
    const promptSpecPath = posix(relative(ROOT, resolve(PROMPTS, `${candidateId}.json`)));
    const record = {
      assetCandidateId: candidateId,
      semanticMode,
      assetType,
      beatId,
      dialogueId: beatId?.startsWith('dialogue:') ? beatId.slice('dialogue:'.length) : null,
      visualFamily: family.visualFamilyId,
      model: MODEL,
      exactModelSnapshot: MODEL,
      quality: QUALITY,
      attempt,
      generationTimestamp: null,
      generationType: 'edit',
      endpoint: '/v1/images/edits',
      promptSpecPath,
      prompt: executionPrompt,
      promptSha256,
      referencePaths: refs,
      referenceSha256,
      outputPath: null,
      outputSha256: null,
      castManifestId,
      dependencies,
      selection: 'NOT_GENERATED',
      rejectionReasons: [],
      parentCandidate: null,
      sourceVideo: null,
      finalApprovalState: 'BLOCKED_MODEL_UNAVAILABLE',
      executionStatus: 'BLOCKED_NO_CLI_CREDENTIAL_AND_BUILT_IN_MODEL_NOT_SELECTABLE',
    };
    await mkdir(dirname(resolve(ROOT, promptSpecPath)), { recursive: true });
    await writeFile(resolve(ROOT, promptSpecPath), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    jobs.push(record);
  }

  for (const family of familyData.families) {
    const goldFrames = family.goldReferenceLineage.map((id) => goldFrameById.get(id));
    for (const candidate of family.familyMasterCandidates) {
      await addJob({
        candidateId: candidate.id,
        semanticMode: 'VISUAL_FAMILY_MASTER',
        beatId: null,
        family,
        attempt: candidate.attempt,
        assetType: 'FAMILY_MASTER',
        prompt: familyPrompt(family, candidate.attempt),
        referencePaths: goldFrames,
        dependencies: family.goldReferenceLineage.map((id) => `gold:${id}`),
      });
    }
  }

  const pilotAssets = {
    A: [{ type: 'STATIC_TABLEAU_BACKGROUND', beat: 'dialogue:lion_briefing', cast: 'cast:dialogue:lion_briefing' }],
    B: [
      { type: 'TRAVEL_STILL', beat: 'edge:lion-audience>lion-opening-ambush', cast: 'cast:edge:lion-audience>lion-opening-ambush' },
      { type: 'STATIC_TABLEAU_BACKGROUND', beat: 'dialogue:post_opening_trail', cast: 'cast:dialogue:post_opening_trail' },
    ],
    C: [{ type: 'CINEMATIC_KEYFRAME', beat: 'media:camp_departure', cast: 'cast:media:camp_departure' }],
    D: [{ type: 'STATIC_TABLEAU_BACKGROUND', beat: 'dialogue:ate_bois_clair_night_watch', cast: 'cast:dialogue:ate_bois_clair_night_watch' }],
    E: [
      { type: 'CINEMATIC_KEYFRAME', beat: 'media:cedric_encounter', cast: 'cast:media:cedric_encounter' },
      { type: 'STATIC_TABLEAU_BACKGROUND', beat: 'dialogue:mystery_recruit', cast: 'cast:dialogue:mystery_recruit' },
    ],
    F: [
      { type: 'CINEMATIC_KEYFRAME', beat: 'media:shadow_signs', cast: 'cast:media:shadow_signs' },
      { type: 'STATIC_TABLEAU_BACKGROUND', beat: 'dialogue:shadow_signs', cast: 'cast:dialogue:shadow_signs' },
    ],
  };
  for (const pilot of pilotData.pilots) {
    const family = familyById.get(pilot.families[0]);
    const goldFrames = family.goldReferenceLineage.map((id) => goldFrameById.get(id));
    for (const asset of pilotAssets[pilot.id]) {
      const cast = castById.get(asset.cast);
      const integrated = asset.type !== 'STATIC_TABLEAU_BACKGROUND';
      const characterCards = integrated ? cast.requiredCharacters.map((id) => cardById.get(id)) : [];
      const canonicalReferences = characterCards.flatMap((card) => card.canonicalFullBodyReferences);
      const referencePaths = [...goldFrames, ...canonicalReferences, ...(asset.type === 'STATIC_TABLEAU_BACKGROUND' ? [layoutGuide] : [])];
      for (const attempt of ['A', 'B']) {
        const candidateId = `pilot_${pilot.id.toLowerCase()}_${asset.type.toLowerCase()}_${attempt.toLowerCase()}`;
        await addJob({
          candidateId,
          semanticMode: asset.type === 'CINEMATIC_KEYFRAME' ? 'CINEMATIC_VIDEO' : asset.type,
          beatId: asset.beat,
          family,
          attempt,
          assetType: asset.type,
          prompt: scenePrompt({ family, pilot, assetType: asset.type, attempt, cast, characterCards }),
          referencePaths,
          castManifestId: asset.cast,
          dependencies: [`family-master:${family.visualFamilyId}`, asset.cast],
        });
      }
    }
  }

  jobs.sort((a, b) => a.assetCandidateId.localeCompare(b.assetCandidateId));
  const manifest = {
    schemaVersion: 1,
    baseline: BASELINE,
    model: MODEL,
    exactModelSnapshot: MODEL,
    quality: QUALITY,
    executionStatus: 'BLOCKED_NO_CLI_CREDENTIAL_AND_BUILT_IN_MODEL_NOT_SELECTABLE',
    generatedOutputs: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0,
    summary: {
      totalJobs: jobs.length,
      familyMasterJobs: jobs.filter((job) => job.assetType === 'FAMILY_MASTER').length,
      pilotJobs: jobs.filter((job) => job.assetType !== 'FAMILY_MASTER').length,
      jobsWithCompleteReferenceHashes: jobs.filter((job) => Object.keys(job.referenceSha256).length === job.referencePaths.length).length,
    },
    jobs,
  };
  await writeFile(resolve(SPECS, 'cin6ea_compiled_prompt_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const provenanceCatalog = {
    ...provenance,
    candidates: jobs.map(({ prompt, ...record }) => record),
    status: '44 COMPILED RECORDS; execution blocked by exact-model capability',
  };
  await writeFile(resolve(SPECS, 'cin6ea_provenance_catalog.json'), `${JSON.stringify(provenanceCatalog, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(manifest.summary, null, 2));
}

await main();
