import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve(process.cwd(), 'docs/reports/dialogue-static-tableau-v2-review/composition-audit.json');
const audit = JSON.parse(await readFile(path, 'utf8'));
const byPhase = new Map();
for (const state of audit.metrics) {
  const key = `${state.viewport.width}x${state.viewport.height}:${state.dialogueId}:${state.phaseId}`;
  const values = byPhase.get(key) ?? [];
  values.push(state); byPhase.set(key, values);
}
const ranges = (values) => ({ min: Math.min(...values), max: Math.max(...values) });
const findings = [];
const presenceByCast = new Map();
const profiles = new Map();
for (const state of audit.metrics) {
  profiles.set(state.compositionProfile, (profiles.get(state.compositionProfile) ?? 0) + 1);
  if (state.pageOverflow) findings.push({ type: 'page-overflow', dialogueId: state.dialogueId, stepId: state.stepId });
  if (state.cardContentOverflow) findings.push({ type: 'card-overflow', dialogueId: state.dialogueId, stepId: state.stepId });
  if (!state.activeSpeakerVisible) findings.push({ type: 'invisible-speaker', dialogueId: state.dialogueId, stepId: state.stepId });
  if (state.state === 'speech' && state.viewport.height - state.card.bottom > 45)
    findings.push({ type: 'speech-card-not-lower', dialogueId: state.dialogueId, stepId: state.stepId, viewport: state.viewport });
  if (state.state === 'choice' && (!state.choicePanel || state.choicePanel.y < -1 || state.choicePanel.bottom > state.viewport.height + 1))
    findings.push({ type: 'choice-panel-outside-viewport', dialogueId: state.dialogueId, stepId: state.stepId, viewport: state.viewport });
  if (state.state === 'choice' && state.choicePanel && state.card.bottom > state.choicePanel.y + 1)
    findings.push({ type: 'card-choice-overlap', dialogueId: state.dialogueId, stepId: state.stepId, viewport: state.viewport });
  for (const actor of state.actors) {
    const size = state.actors.length;
    const presenceKey = `${state.viewport.width}x${state.viewport.height}:${size}`;
    const values = presenceByCast.get(presenceKey) ?? [];
    values.push(actor.visibleBodyRatio); presenceByCast.set(presenceKey, values);
    if (!actor.imageReady) findings.push({ type: 'missing-image', dialogueId: state.dialogueId, stepId: state.stepId, actorId: actor.actorId });
    if (actor.visibleHeadY < -2) findings.push({ type: 'head-clipped', dialogueId: state.dialogueId, stepId: state.stepId, actorId: actor.actorId, y: actor.visibleHeadY });
    if (actor.faceObstruction > .01) findings.push({ type: 'face-obstructed', dialogueId: state.dialogueId, stepId: state.stepId, actorId: actor.actorId, ratio: actor.faceObstruction });
    if (actor.visibleBodyRatio < (size <= 2 ? .36 : size <= 4 ? .3 : .25)) findings.push({ type: 'weak-presence', dialogueId: state.dialogueId, stepId: state.stepId, actorId: actor.actorId, ratio: actor.visibleBodyRatio });
    if (actor.cropBottomRatio > .5) findings.push({ type: 'excessive-bottom-crop', dialogueId: state.dialogueId, stepId: state.stepId, actorId: actor.actorId, ratio: actor.cropBottomRatio });
  }
  for (const overlap of state.actorOverlaps) if (overlap.ratio > .68) {
    findings.push({ type: 'heavy-overlap', dialogueId: state.dialogueId, stepId: state.stepId, actors: overlap.actors, ratio: overlap.ratio });
  }
}
for (const [key, phaseStates] of byPhase) {
  const states = phaseStates.filter((state) => state.state === 'speech');
  if (states.length < 2) continue;
  const actorIds = new Set(states.flatMap((state) => state.actors.map((actor) => actor.actorId)));
  for (const actorId of actorIds) {
    const appearances = states.map((state) => state.actors.find((actor) => actor.actorId === actorId)).filter(Boolean);
    if (appearances.length < 2) continue;
    const x = ranges(appearances.map((actor) => actor.anchorX));
    const height = ranges(appearances.map((actor) => actor.figureHeight));
    const head = ranges(appearances.map((actor) => actor.figureY));
    if (x.max - x.min > 1 || height.max - height.min > 1 || head.max - head.min > 1) {
      findings.push({ type: 'geometry-jump', phase: key, actorId, deltaX: x.max - x.min, deltaHeight: height.max - height.min, deltaHeadY: head.max - head.min });
    }
  }
}
const countByType = Object.fromEntries([...new Set(findings.map((item) => item.type))].sort().map((type) => [type, findings.filter((item) => item.type === type).length]));
const summary = {
  ...audit.summary,
  profiles: Object.fromEntries(profiles),
  presenceByCast: Object.fromEntries([...presenceByCast].map(([size, values]) => [size, ranges(values)])),
  findings: countByType,
};
await writeFile(resolve(process.cwd(), 'docs/reports/dialogue-static-tableau-v2-review/review-findings.json'), `${JSON.stringify({ summary, findings }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${findings.slice(0, 35).map((item) => JSON.stringify(item)).join('\n')}\n`);
