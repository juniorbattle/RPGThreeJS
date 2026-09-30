// Read-only baseline inventory for PROJECT-CONTINUITY-AUDIT-1.
// Usage: node tools/project-continuity-audit-1.mjs > docs/audits/project-continuity-audit-1.json
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { posix as path } from 'node:path';

const baseline = '6ff5f4c78b9bacb945b9c20d5ce39d6222b68aa0';
if (process.argv.includes('--check-links')) {
  const docs = [
    'docs/README.md',
    'docs/project/CURRENT_STATUS.md', 'docs/project/DEMO_ROADMAP.md',
    'docs/project/POST_DEMO_ROADMAP.md', 'docs/project/ENGINEERING_RULES.md',
    'docs/traversal/README.md', 'docs/traversal/ARCHITECTURE.md',
    'docs/traversal/AUTHORING_GUIDE.md', 'docs/traversal/QA_GUIDE.md',
    'docs/traversal/T0_PRODUCTION_CONTRACT.md', 'docs/traversal/LEGS_ROADMAP.md',
    'docs/content/README.md', 'docs/content/DEMO_CONTENT_MAP.md',
    'docs/content/AUTHORING_GUIDE.md',
    'docs/reports/README.md', 'docs/reports/INDEX.md',
    'docs/audits/project-continuity-audit-1.md',
  ];
  const brokenLinks = [];
  let checkedLinks = 0;
  for (const file of docs) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const rawTarget = match[1].split('#')[0].split('?')[0];
      if (!rawTarget || /^(?:https?:|mailto:|data:)/.test(rawTarget)) continue;
      const target = path.normalize(path.join(path.dirname(file), decodeURIComponent(rawTarget)));
      checkedLinks++;
      if (!existsSync(target)) brokenLinks.push({ file, target });
    }
  }
  const sourceChecks = {
    t0Enabled: /enabled: true/.test(readFileSync('src/traversal/TraversalFeaturePolicy.ts', 'utf8')),
    t0OnlyRollout: /rolloutLegIds: Object\.freeze\(\['T0'\]/.test(readFileSync('src/traversal/TraversalFeaturePolicy.ts', 'utf8')),
    t0OnlySelector: /candidate\.id === 'T0'/.test(readFileSync('src/game/GameApp.ts', 'utf8')),
    noRoadEncounter: !existsSync('src/traversal/TraversalRoadEncounter.ts'),
    noLocalInteraction: !/LOCAL_INTERACTION/.test(readFileSync('src/traversal/TraversalRunRuntime.ts', 'utf8')),
    productionPolicies: ['Risk', 'Reward', 'Pursuit'].every(name =>
      /dev && new URLSearchParams\(search\)\.get\('traversal(?:Risk|Reward|Pursuit)'\) === '0'/.test(
        readFileSync(`src/traversal/Traversal${name}PresentationPolicy.ts`, 'utf8'))),
    goldenEvidence: existsSync('docs/reports/traversal-t0-production-loop-final-1-browser/production/browser-qa.json'),
  };
  const result = { checkedCanonicalDocs: docs.length, checkedLocalLinks: checkedLinks,
    brokenLinks, sourceChecks, passed: brokenLinks.length === 0 && Object.values(sourceChecks).every(Boolean) };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.passed) process.exitCode = 1;
} else {
const raw = execFileSync('git', ['ls-tree', '-r', '-l', '-z', baseline]);
const tracked = raw.toString('utf8').split('\0').filter(Boolean).map(line => {
  const [meta, file] = line.split('\t');
  const [, , , size] = meta.trim().split(/\s+/);
  return { path: file, bytes: Number(size) };
});
const relevant = file => file.path.startsWith('src/traversal/')
  || file.path.startsWith('tools/traversal')
  || file.path.startsWith('public/assets/generated/lion-phase/traversal/')
  || file.path.startsWith('docs/');
const candidates = tracked.filter(relevant);
const byPath = new Map(candidates.map(file => [file.path, file]));
const proposedPrefixes = [
  'docs/reports/traversal-t0-route-risk-1-browser/',
  'docs/reports/traversal-t0-route-risk-production-1-browser/',
  'docs/reports/traversal-t0-route-reward-1-browser/',
  'docs/reports/traversal-t0-route-reward-production-1-browser/',
  'docs/reports/traversal-t0-pursuit-1-browser/',
  'docs/reports/traversal-t0-pursuit-production-1-browser/',
];
const refs = new Map(candidates.map(file => [file.path, new Set()]));
const externalPrefixRefs = new Map(proposedPrefixes.map(prefix => [prefix, new Set()]));
const textExt = /\.(?:md|json|html|css|ts|tsx|js|mjs|py|txt|svg|ya?ml)$/i;
const linkPattern = /(?:\]\(|\b(?:href|src)=["'])([^"'\s)#?]+)(?:["']|\))/g;
const traversalNamePattern = /\b(?:Traversal[A-Za-z0-9_]+|traversal-[A-Za-z0-9_-]+)(?:\.(?:ts|mjs|py|md|json))?\b/g;
const nameMap = new Map();
for (const file of candidates.filter(x => x.path.startsWith('src/traversal/') || x.path.startsWith('tools/traversal'))) {
  const name = path.basename(file.path).replace(/\.[^.]+$/, '');
  if (!nameMap.has(name)) nameMap.set(name, []);
  nameMap.get(name).push(file.path);
}
function addRef(target, from) {
  if (target !== from && refs.has(target)) refs.get(target).add(from);
}
for (const file of tracked) {
  if (!textExt.test(file.path) || file.bytes > 2_000_000) continue;
  let content;
  try { content = readFileSync(file.path, 'utf8'); } catch { continue; }
  for (const prefix of proposedPrefixes) {
    const directoryName = path.basename(prefix.slice(0, -1));
    if (!file.path.startsWith(prefix) && content.includes(directoryName)) externalPrefixRefs.get(prefix).add(file.path);
  }
  for (const match of content.matchAll(linkPattern)) {
    const rawTarget = decodeURIComponent(match[1]).replaceAll('\\', '/');
    if (/^(?:https?:|mailto:|data:|#)/.test(rawTarget)) continue;
    const target = rawTarget.startsWith('/') ? rawTarget.slice(1)
      : path.normalize(path.join(path.dirname(file.path), rawTarget));
    addRef(target, file.path);
  }
  for (const match of content.matchAll(traversalNamePattern)) {
    const name = match[0].replace(/\.[^.]+$/, '');
    for (const target of nameMap.get(name) ?? []) addRef(target, file.path);
  }
  for (const target of candidates.filter(x => x.path.startsWith('public/assets/generated/lion-phase/traversal/'))) {
    const publicUrl = target.path.replace(/^public\//, '/');
    if (content.includes(target.path) || content.includes(publicUrl)) addRef(target.path, file.path);
  }
}
function classification(file) {
  const p = file.path;
  if (p.startsWith('src/traversal/')) return p.includes('.test.') ? 'ACTIVE_QA_TOOL' : 'RUNTIME_AUTHORITY';
  if (p.startsWith('public/assets/generated/lion-phase/traversal/'))
    return p.endsWith('.md') ? 'CANONICAL_DOC' : 'RUNTIME_AUTHORITY';
  if (p.startsWith('tools/traversal'))
    return /tools\/traversal-t0-(browser|pursuit|reward)-qa\.mjs$/.test(p) ? 'ACTIVE_QA_TOOL' : 'SUPERSEDED_TOOL';
  if (p === 'docs/TRAVERSAL_T0_FINAL_CONVERGENCE.md') return 'SUPERSEDED_REPORT';
  if (p.startsWith('docs/reports/traversal-t0-production-loop-final-1-browser/')) return 'CURRENT_GOLDEN_EVIDENCE';
  if (p.startsWith('docs/reports/traversal-') && p.includes('-browser/')) return 'SUPERSEDED_EVIDENCE';
  if (p.startsWith('docs/reports/traversal-'))
    return /traversal-remaining-legs-audit-1/.test(p) ? 'SUPERSEDED_REPORT' : 'HISTORICAL_REPORT';
  if (p.startsWith('docs/reports/')) return p.endsWith('.md') ? 'HISTORICAL_REPORT' : 'UNKNOWN_REVIEW';
  return 'UNKNOWN_REVIEW';
}
function action(category, p) {
  if (category === 'RUNTIME_AUTHORITY' || category === 'ACTIVE_QA_TOOL' || category === 'CANONICAL_DOC' || category === 'CURRENT_GOLDEN_EVIDENCE') return 'KEEP_CURRENT';
  if (category === 'HISTORICAL_REPORT') return 'KEEP_HISTORICAL';
  if (proposedPrefixes.some(prefix => p.startsWith(prefix))) return 'REMOVE_AFTER_LINK_REPAIR';
  if (category === 'UNKNOWN_REVIEW') return 'MANUAL_REVIEW';
  if (category === 'SUPERSEDED_TOOL') return 'MANUAL_REVIEW';
  if (category === 'SUPERSEDED_REPORT') return 'KEEP_HISTORICAL';
  return 'MANUAL_REVIEW';
}
function reason(category) {
  return ({
    RUNTIME_AUTHORITY: 'Production source or current Traversal asset; preserve.',
    ACTIVE_QA_TOOL: 'Current source test or retained QA driver; preserve.',
    CANONICAL_DOC: 'Current asset authoring note; preserve.',
    CURRENT_GOLDEN_EVIDENCE: 'Integrated T0 production loop proof; preserve.',
    HISTORICAL_REPORT: 'Task record; keep with historical status.',
    SUPERSEDED_REPORT: 'Earlier claims conflict with current baseline; label historical, preserve record.',
    SUPERSEDED_EVIDENCE: 'Earlier task evidence; review uniqueness and repair links before any removal.',
    SUPERSEDED_TOOL: 'Task-specific utility; review regeneration and report links before retirement.',
    UNKNOWN_REVIEW: 'Authority or uniqueness has not been established; never auto-delete.',
  })[category];
}
function dynamicRuntimeReferences(p) {
  if (!p.startsWith('public/assets/generated/lion-phase/traversal/') || !p.endsWith('.png')) return [];
  if (p.includes('/world-v1/')) return ['src/traversal/TraversalT0World.ts'];
  if (p.includes('/foreground/')) return ['src/traversal/TraversalDepth.ts', 'src/traversal/TraversalT0Assets.ts'];
  if (p.includes('/vehicle/')) return ['src/traversal/TraversalCaravan.ts'];
  if (p.includes('/props/')) return ['src/traversal/TraversalT0Assets.ts'];
  if (p.includes('/risk/')) return ['src/traversal/TraversalRouteRiskVisual.ts'];
  if (p.includes('/reward/')) return ['src/traversal/TraversalRouteRewardRenderer.ts'];
  if (p.includes('/pursuit/')) return ['src/traversal/TraversalRoutePursuitRenderer.ts'];
  return [];
}
function group(prefix) {
  const files = tracked.filter(x => x.path.startsWith(prefix));
  return { path: prefix, fileCount: files.length, bytes: files.reduce((n, x) => n + x.bytes, 0) };
}
const entry = file => {
  const category = classification(file);
  const all = [...refs.get(file.path)].sort();
  const select = predicate => all.filter(predicate);
  const runtimeReferences = [...new Set([...select(p => p.startsWith('src/') && !p.includes('.test.')),
    ...dynamicRuntimeReferences(file.path)])].sort();
  return {
    ...file,
    category,
    historicalCanonicalStatus: category,
    recommendedAction: action(category, file.path),
    reason: reason(category),
    currentReferences: [...new Set([...select(p => p.startsWith('src/') || p.startsWith('tools/')),
      ...runtimeReferences])].sort(),
    runtimeReferences,
    referenceBasis: dynamicRuntimeReferences(file.path).length ? 'direct scan plus verified dynamic asset root' : 'direct scan',
    toolReferences: select(p => p.startsWith('tools/') || (p.startsWith('src/') && p.includes('.test.'))),
    reportReferences: select(p => p.startsWith('docs/reports/')),
    otherDocReferences: select(p => p.startsWith('docs/') && !p.startsWith('docs/reports/')),
  };
};
const sum = files => files.reduce((n, x) => n + x.bytes, 0);
const reportFiles = tracked.filter(x => x.path.startsWith('docs/reports/'));
const traversalReportFiles = reportFiles.filter(x => x.path.startsWith('docs/reports/traversal-'));
const proposedDeletions = proposedPrefixes.map(prefix => ({
  ...group(prefix),
  candidateGroup: 'REMOVE_AFTER_LINK_REPAIR',
  reason: 'Earlier focused/activation browser evidence is covered for current T0 behavior by the integrated production loop. Retire only after operator approval and a file-level unique-proof check.',
  replacementCurrentAuthority: 'docs/traversal/T0_PRODUCTION_CONTRACT.md; docs/reports/traversal-t0-production-loop-final-1.md; docs/reports/traversal-t0-production-loop-final-1-browser/',
  linkDependencies: [...externalPrefixRefs.get(prefix)].sort(),
  riskLevel: 'MEDIUM',
}));
const proposedFileCount = proposedDeletions.reduce((n, x) => n + x.fileCount, 0);
const proposedBytes = proposedDeletions.reduce((n, x) => n + x.bytes, 0);
const prefixes = [
  'src/traversal/', 'tools/traversal', 'public/assets/generated/lion-phase/traversal/',
  'docs/', 'docs/reports/',
  ...[...new Set(traversalReportFiles.map(x => {
    const rest = x.path.slice('docs/reports/'.length);
    return `docs/reports/${rest.split('/')[0]}${rest.includes('/') ? '/' : ''}`;
  }))].sort(),
];
const result = {
  task: 'PROJECT-CONTINUITY-AUDIT-1', baseline,
  measurement: 'Git tree blob sizes at baseline; tracked files only. Reference scan reads current text files <= 2 MB, parses local Markdown/HTML links and Traversal names; dynamic roots require source review. Missing references are not proof of safe removal.',
  totals: { trackedFileCount: tracked.length, trackedBytes: sum(tracked),
    docsReportsFileCount: reportFiles.length, docsReportsBytes: sum(reportFiles),
    traversalReportEvidenceFileCount: traversalReportFiles.length,
    traversalReportEvidenceBytes: sum(traversalReportFiles),
    candidateFileCount: candidates.length, candidateBytes: sum(candidates) },
  cleanupPlan: {
    SAFE_TO_REMOVE: [],
    REMOVE_AFTER_LINK_REPAIR: proposedDeletions,
    KEEP_HISTORICAL: [
      'docs/reports/traversal-t0-route-checkpoints-1-shared-world-full-browser/',
      'docs/reports/traversal-t0-motion-handoff-polish-1-browser/',
      'docs/reports/traversal-t0-route-risk-art-1-browser/',
      'docs/reports/traversal-t0-route-reward-art-1-browser/',
      'docs/reports/traversal-t0-pursuit-art-1-browser/',
    ],
    KEEP_CURRENT: [
      'src/traversal/', 'public/assets/generated/lion-phase/traversal/',
      'tools/traversal-t0-browser-qa.mjs', 'tools/traversal-t0-pursuit-qa.mjs',
      'tools/traversal-t0-reward-qa.mjs',
      'docs/reports/traversal-t0-production-loop-final-1-browser/',
    ],
    MANUAL_REVIEW: [
      'docs/reports/traversal-remaining-legs-audit-1-browser/',
      'docs/reports/traversal-t0-cleanup-1-browser/',
      'docs/reports/traversal-t0-pursuit-art-1-production/',
      'tools/traversal-remaining-legs-audit-1-*.mjs',
      'tools/traversal-t0-cleanup-inventory.py',
      'all other UNKNOWN_REVIEW files',
    ],
    projectedActiveTreeReduction: { fileCount: proposedFileCount, bytes: proposedBytes,
      percentOfBaselineTrackedBytes: Number((100 * proposedBytes / sum(tracked)).toFixed(2)) },
    executionStatus: 'PLAN_ONLY_NO_DELETION',
  },
  groups: prefixes.map(group),
  files: candidates.map(entry),
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
