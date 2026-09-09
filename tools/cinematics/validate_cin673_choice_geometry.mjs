import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const BASELINE = '54c6b6a345b8d05c4760a6c654ea5085e9dc06b7';
const root = process.cwd();
const beforeRoot = resolve(root, 'tmp/cinematics/cin673/before');
const afterRoot = resolve(root, 'tmp/cinematics/cin673/after');
const stillAfter = JSON.parse(readFileSync(resolve(afterRoot, 'stills/results.json'), 'utf8'));
const videoBefore = JSON.parse(readFileSync(resolve(beforeRoot, 'video/results.json'), 'utf8'));
const videoAfter = JSON.parse(readFileSync(resolve(afterRoot, 'video/results.json'), 'utf8'));
const TOLERANCE = 0.01;
const HOVER_TRANSLATION = 6;

function near(a, b, tolerance = TOLERANCE) {
  return Math.abs(a - b) <= tolerance;
}

function compareRect(before, after, label, allowHoverTranslation = false) {
  const widthBefore = before.right - before.left;
  const widthAfter = after.right - after.left;
  const heightBefore = before.bottom - before.top;
  const heightAfter = after.bottom - after.top;
  const leftDelta = after.left - before.left;
  const rightDelta = after.right - before.right;
  const maxHorizontalDelta = Math.max(Math.abs(leftDelta), Math.abs(rightDelta));
  const horizontalStable = allowHoverTranslation
    ? near(leftDelta, rightDelta) && maxHorizontalDelta <= HOVER_TRANSLATION + TOLERANCE
    : maxHorizontalDelta <= TOLERANCE;
  const pass = near(widthBefore, widthAfter)
    && near(heightBefore, heightAfter)
    && near(before.top, after.top)
    && near(before.bottom, after.bottom)
    && horizontalStable;
  return { label, pass, widthBefore, widthAfter, heightBefore, heightAfter, leftDelta, rightDelta, maxHorizontalDelta };
}

const comparisons = [];
for (const after of stillAfter) {
  const viewport = `${after.viewport.width}x${after.viewport.height}`;
  const before = JSON.parse(readFileSync(resolve(beforeRoot, `stills/results-${viewport}.json`), 'utf8'))[0];
  const states = [
    ['audience-two-path', before.campaign.audience.choiceMetrics.choices, after.campaign.audience.choiceMetrics.choices],
    ['event-two-path', before.events.multiSpeakerMetrics.choices, after.events.multiSpeakerMetrics.choices],
    ['refugee-two-path', before.events.refugeeMetrics.choices, after.events.refugeeMetrics.choices],
  ];
  for (const [state, beforeRects, afterRects] of states) {
    if (beforeRects.length !== 2 || afterRects.length !== 2) throw new Error(`${viewport}:${state}: expected two choices.`);
    beforeRects.forEach((rect, index) => comparisons.push(compareRect(rect, afterRects[index], `${viewport}:${state}:${index}`, true)));
  }
}

for (const after of videoAfter) {
  const before = videoBefore.find((entry) => entry.viewport.width === after.viewport.width && entry.viewport.height === after.viewport.height);
  const viewport = `${after.viewport.width}x${after.viewport.height}`;
  if (!before) throw new Error(`${viewport}: missing video baseline.`);
  comparisons.push(compareRect(
    before.campaign.metrics.singleRoute.buttons[0],
    after.campaign.metrics.singleRoute.buttons[0],
    `${viewport}:single-route`,
  ));
  for (let index = 0; index < 2; index += 1) {
    comparisons.push(compareRect(
      before.valmir.metrics.buttons[index],
      after.valmir.metrics.buttons[index],
      `${viewport}:route-fork:${index}`,
    ));
  }
}

const cssDiff = execFileSync('git', ['diff', '--unified=0', BASELINE, '--', 'src/styles/app.css'], { cwd: root, encoding: 'utf8' });
const changedChoiceGeometryDeclarations = cssDiff.split(/\r?\n/u)
  .filter((line) => /^[+-](?![+-])/u.test(line))
  .filter((line) => /dialogue__choices|\.dialogue-choice(?:\s|\{|:|\.)/u.test(line));
const failures = comparisons.filter((comparison) => !comparison.pass);
const result = {
  baseline: BASELINE,
  choiceGeometryChanged: failures.length > 0 || changedChoiceGeometryDeclarations.length > 0,
  comparisonCount: comparisons.length,
  failedComparisons: failures,
  maxObservedHorizontalDelta: Math.max(...comparisons.map((comparison) => comparison.maxHorizontalDelta)),
  allowedExistingHoverTranslation: HOVER_TRANSLATION,
  changedChoiceGeometryDeclarations,
  comparisons,
};

const outputPath = resolve(afterRoot, 'choice-geometry.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
if (result.choiceGeometryChanged) process.exitCode = 1;
