import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const auditPath = 'docs/reports/dialogue-static-tableau-v2-review/composition-audit.json';
const baselineRef = process.argv[2] ?? '350e26b701ce211c72c182fe35f3027a1b0bfd31';
const before = JSON.parse(execFileSync('git', ['show', `${baselineRef}:${auditPath}`], { maxBuffer: 64 * 1024 * 1024 }).toString());
const after = JSON.parse(await readFile(resolve(process.cwd(), auditPath), 'utf8'));
assert.ok(after.metrics.length >= before.metrics.length, 'audited state count shrank');

const intendedScale = { forest_troll_elite: 1.18, young_dragon_elite: 1.16, shrine_apparition: .82 };
let unchangedActors = 0;
let tunedActors = 0;
let maxUnchangedActorDelta = 0;
let maxCardDelta = 0;
const rectKeys = ['x', 'y', 'width', 'height'];
const actorKeys = ['anchorX', 'figureY', 'figureHeight', 'visualScale', 'centerX', 'visibleHeadY', 'visibleBodyHeight', 'visibleBodyWidth'];
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
    const ratio = intendedScale[oldActor.actorId];
    if (ratio) {
      assert.ok(Math.abs(newActor.visualScale / oldActor.visualScale - ratio) <= .0001, `${label}:${oldActor.actorId}: unexpected scale`);
      assert.ok(Math.abs(newActor.anchorX - oldActor.anchorX) <= .01, `${label}:${oldActor.actorId}: anchor moved`);
      assert.ok(Math.abs((newActor.figureY + newActor.figureHeight) - (oldActor.figureY + oldActor.figureHeight)) <= .1,
        `${label}:${oldActor.actorId}: theatrical baseline moved`);
      tunedActors += 1;
      continue;
    }
    for (const key of actorKeys) {
      const delta = Math.abs(newActor[key] - oldActor[key]);
      maxUnchangedActorDelta = Math.max(maxUnchangedActorDelta, delta);
      assert.ok(delta <= .01, `${label}:${oldActor.actorId}: ${key} moved by ${delta}px`);
    }
    unchangedActors += 1;
  }
}
process.stdout.write(`PASS baseline ${baselineRef}: ${before.metrics.length} matched states, ${unchangedActors} unchanged actors, ${tunedActors} intentional silhouette instances; max unchanged actor delta ${maxUnchangedActorDelta}px, max card delta ${maxCardDelta}px\n`);
