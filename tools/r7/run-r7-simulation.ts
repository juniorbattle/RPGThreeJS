import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildR7FastRegressionSnapshot,
  compactR7Snapshot,
  runFullR7Audit,
} from '../../src/qa/r7LionSimulation';

const mode = process.argv.includes('--fast-snapshot') ? 'fast-snapshot' : 'full';

if (mode === 'fast-snapshot') {
  process.stdout.write(`${JSON.stringify(buildR7FastRegressionSnapshot(), null, 2)}\n`);
} else {
  const audit = runFullR7Audit();
  const snapshot = compactR7Snapshot(audit);
  if (process.argv.includes('--write-snapshot')) {
    const snapshotPath = resolve(process.cwd(), 'docs/reports/demo-1h-r7-distribution-snapshot.json');
    writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    process.stderr.write(`R7 snapshot written: ${snapshotPath}\n`);
  }
  process.stdout.write(`${JSON.stringify({
    performanceMs: audit.performanceMs,
    snapshot,
  }, null, 2)}\n`);
  if (
    audit.gates.invariantFailureCount > 0
    || audit.gates.reloadMismatchCount > 0
    || audit.gates.r4InvariantFailureCount > 0
  ) process.exitCode = 1;
}
