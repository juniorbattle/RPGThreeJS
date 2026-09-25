import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const auditPath = 'docs/reports/dialogue-static-tableau-v2-review/composition-audit.json';
const baselineRef = process.argv[2] ?? '4c093e75cf107eb77cabec2d1ef0f6931feb4523';
const before = JSON.parse(execFileSync('git', ['show', `${baselineRef}:${auditPath}`], { maxBuffer: 64 * 1024 * 1024 }).toString());
const after = JSON.parse(await readFile(resolve(process.cwd(), auditPath), 'utf8'));
assert.ok(after.metrics.length >= before.metrics.length, 'audited state count shrank');

const previousDensityScale = { 1: 1.28, 2: 1.18, 3: 1.14, 4: 1.1 };
let measuredActors = 0;
let maxAnchorDelta = 0;
let maxDesktopBaselineDelta = 0;
let maxMobileBaselineDelta = 0;
let maxCardDelta = 0;
const rectKeys = ['x', 'y', 'width', 'height'];
for (let index = 0; index < before.metrics.length; index += 1) {
  const prior = before.metrics[index];
  const current = after.metrics[index];
  const label = `${prior.viewport.width}x${prior.viewport.height}:${prior.dialogueId}:${prior.stepId}:${prior.state}`;
  assert.equal(`${current.viewport.width}x${current.viewport.height}:${current.dialogueId}:${current.stepId}:${current.state}`, label);
  assert.deepEqual(current.actors.map(({ actorId }) => actorId), prior.actors.map(({ actorId }) => actorId), `${label}: cast changed`);
  for (const key of rectKeys) {
    const delta = Math.abs(current.card[key] - prior.card[key]);
    maxCardDelta = Math.max(maxCardDelta, delta);
    assert.ok(delta <= .1, `${label}: card ${key} moved by ${delta}px`);
  }
  for (let actorIndex = 0; actorIndex < prior.actors.length; actorIndex += 1) {
    const oldActor = prior.actors[actorIndex];
    const newActor = current.actors[actorIndex];
    const density = previousDensityScale[prior.actors.length] ?? 1;
    const expectedRatio = 1.14 / density;
    assert.ok(Math.abs(newActor.visualScale / oldActor.visualScale - expectedRatio) <= .0001,
      `${label}:${oldActor.actorId}: scale differs from the single approved base`);
    const anchorDelta = Math.abs(newActor.anchorX - oldActor.anchorX);
    maxAnchorDelta = Math.max(maxAnchorDelta, anchorDelta);
    assert.ok(anchorDelta <= 1, `${label}:${oldActor.actorId}: X anchor moved by ${anchorDelta}px`);
    const baselineDelta = Math.abs((newActor.figureY + newActor.figureHeight) - (oldActor.figureY + oldActor.figureHeight));
    if (prior.viewport.width >= 1000) {
      maxDesktopBaselineDelta = Math.max(maxDesktopBaselineDelta, baselineDelta);
      assert.ok(baselineDelta <= 1, `${label}:${oldActor.actorId}: desktop baseline moved by ${baselineDelta}px`);
    } else {
      maxMobileBaselineDelta = Math.max(maxMobileBaselineDelta, baselineDelta);
    }
    measuredActors += 1;
  }
}
process.stdout.write(`PASS baseline ${baselineRef}: ${before.metrics.length} matched states, ${measuredActors} actors at one cast-independent scale; max X anchor delta ${maxAnchorDelta}px, desktop baseline delta ${maxDesktopBaselineDelta}px, responsive baseline delta ${maxMobileBaselineDelta}px, card delta ${maxCardDelta}px\n`);
