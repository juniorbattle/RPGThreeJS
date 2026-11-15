/**
 * OD-2026-11-15-C: finds the French text a player can see, from the TypeScript syntax tree of the sources (tests
 * excluded) and the two HTML pages. The French text is the translation key (A1), so each key is exactly what the DOM
 * shows: a plain literal, a template or concatenation with `{0}` holes, split at HTML tags, and the values of the
 * attributes a player can read (aria-label, title, alt, placeholder). Shared by the coverage test and `report.mjs`.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Development tools stay in French (M3): labs, validators, QA scenarios, audio sketches and the VFX lab. */
export const DEV_ONLY_SOURCES = [
  /^src\/(qa|dev|audio|i18n)\//,
  /^src\/combat\/vfx\//,
  /^src\/game\/__fixtures__\//,
  /AudioListeningLab\.ts$/,
  /narrativeCoherence\.ts$/,
  /JourneyQaScenarios\.ts$/,
  /NarrativePresentationDoctrine\.ts$/,
  /NarrativeStagingAudit\.ts$/,
  /arena\/arenaProps\.ts$/,
  /UnitMotionWorkbench\.ts$/,
  /reputationBounds\.ts$/,
  /RuntimeDialogueReachability\.ts$/,
  /render\/assetManifest\.ts$/,
];

/** Shown to the player but missed by the heuristics (short capitals, abbreviations). */
export const MANUAL_KEYS = Object.freeze([
  'DOS !', 'DOUBLE !', 'GARDE +', 'FURIE', 'ULTIME', 'CHARGE', 'K.O.', 'SIGNATURE', 'BOSS',
  'FOR', 'MAG', 'END', 'DEX', 'CHA', 'PV', 'PA', 'DÉPL',
  'BRI', 'ESS', 'FUR', 'ENT', 'BRU', 'POI', 'REG', 'RAL', 'AFF', 'BAR', 'MAL', 'AVE', 'MUT', 'PRO', 'GAR',
]);

const FR_WORDS = new Set(('le la les de des du un une et est vous votre vos pour sur dans au aux ne pas à qui que ' +
  'il elle ils elles nous son sa ses leur leurs ce cette ces se en par avec sans plus mais ou où tout tous toute ' +
  'mon ma mes ton ta tes je tu on lui y être avoir fait été sont était ici déjà encore jamais rien chaque très puis').split(' '));
const EN_WORDS = new Set(('the and of to is for with from not this that should must missing unknown invalid expected ' +
  'failed are was be by on in at as it its or an no has have unit units into when then than both while above below her his ' +
  'their they them without remain remains stays keep keeps can cannot will would only every after before over under through ' +
  'which who what where receives same each other one two any all may might never always stage stands left right wide card ' +
  'focus shot lower upper behind facing floor empty fork company scene').split(' '));
const englishMorphology = (word) => (word.length >= 6 && /(ed|ing)$/.test(word)) || /'s$/.test(word);
const ACCENT = /[àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŒÆ’]/;
const ID_PROPERTIES = new Set(['id', 'key', 'type', 'kind', 'className', 'class', 'icon', 'actorId', 'sceneArtId', 'combatId',
  'dialogueId', 'itemId', 'status', 'mode', 'side', 'expression', 'portrait', 'next', 'contentId', 'src', 'href', 'path',
  'url', 'color', 'col', 'sound', 'cue', 'flag', 'requiresFlag', 'excludesFlag', 'perspective', 'backdrop', 'music',
  'mood', 'weaponType', 'definitionId', 'unitId', 'nodeId', 'plateauId', 'sceneId', 'skillId', 'assetId', 'role',
  'layer', 'shape', 'target', 'cueId', 'theme', 'track', 'event', 'action', 'testId', 'anchor', 'pose', 'facing',
  'region', 'lane', 'clan', 'route', 'outcome', 'trialCause', 'presentationId', 'stillImage', 'image', 'background',
  'font', 'fontFamily', 'variant', 'tone', 'polarity', 'pulseProfile', 'indicatorAssetId', 'indicatorUrl', 'preset',
  'vfxPreset', 'sfx', 'damageType', 'lookAt', 'focus', 'speakerScreenPosition', 'speakerAssociation']);
const IGNORED_CALLEES = new Set(['require', 'querySelector', 'querySelectorAll', 'getElementById', 'closest', 'matches',
  'addEventListener', 'removeEventListener', 'getAttribute', 'hasAttribute', 'removeAttribute', 'toggleAttribute',
  'setProperty', 'getPropertyValue', 'removeProperty', 'createElement', 'startsWith', 'endsWith', 'includes', 'indexOf',
  'lastIndexOf', 'split', 'replace', 'replaceAll', 'match', 'matchAll', 'test', 'padStart', 'padEnd', 'getItem',
  'setItem', 'removeItem', 'postMessage', 'add', 'remove', 'toggle', 'contains', 'has', 'get', 'delete', 'Symbol',
  'fetch', 'dispatchEvent', 'CustomEvent', 'Event', 'mark', 'measure', 'warn', 'error', 'log', 'info', 'debug',
  'assertNever', 'parse', 'safeParse', 'literal', 'enum', 'describe', 'it', 'expect', 'play', 'playCue', 'load', 'get']);
const READABLE_ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder', 'aria-description', 'aria-roledescription', 'aria-valuetext'];
const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&hellip;': '…', '&laquo;': '«', '&raquo;': '»', '&mdash;': '—', '&ndash;': '–', '&middot;': '·', '&times;': '×' };

/** The runtime normalizes the same way before looking a text up. */
export function normalizeKey(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function decodeEntities(text) {
  return text.replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity);
}

/** Whether a normalized text (holes allowed) reads as French player text. */
export function isFrenchText(text) {
  const bare = text.replace(/\{\d+\}/g, ' ').replace(/\s+/g, ' ').trim();
  if (!bare || !/[A-Za-zÀ-ÿ]/.test(bare)) return false;
  if (/^(https?:|\/|\.\/|\.\.\/|#|data:|rgba?\(|var\(--|hsl|url\()/.test(bare)) return false;
  if (/\.(png|webp|jpe?g|svg|mp3|ogg|wav|json|css|m?js|ts|html)(\?|$)/i.test(bare)) return false;
  if (/^[\w$-]+(\.[\w$-]+)+$/.test(bare)) return false;
  if (/^(translate|scale|rotate|matrix|cubic-bezier|linear-gradient|radial-gradient|blur|drop-shadow|inset|calc|steps)\(/.test(bare)) return false;
  if (/(\d(px|rem|em|ms|s|deg|vh|vw|%))|;\s*[a-z-]+\s*:/.test(bare) && !/ [a-zà-ÿ]{4,} [a-zà-ÿ]{3,}/.test(bare)) return false;
  if (/\b(uniform|vec[234]|float|gl_FragColor|void main)\b/.test(bare)) return false;
  if (/\b(sans-serif|serif|monospace|system-ui)\b/.test(bare)) return false;
  if (/^[A-Z][a-z]+[A-Z][A-Za-z]*:?$/.test(bare)) return false;
  const words = bare.split(' ').filter((word) => /[A-Za-zÀ-ÿ]/.test(word));
  const lower = words.map((word) => word.toLowerCase().replace(/[^a-zà-ÿœæ’']/g, ''));
  const accent = ACCENT.test(bare);
  const frHits = lower.filter((word) => FR_WORDS.has(word) || /^(l|d|qu|n|s|j|c|m|t)[’']/.test(word)).length;
  const enHits = lower.filter((word) => EN_WORDS.has(word) || englishMorphology(word)).length;
  if (enHits > frHits && !accent) return false;
  if (enHits >= 2 && enHits > frHits) return false;
  if (words.length === 1) {
    const word = words[0];
    if (/^[A-Z0-9_]+$/.test(word.replace(/[^A-Za-z0-9_]/g, '')) && !accent) return false;
    if (/^[a-z][A-Za-z0-9]*[A-Z]/.test(word) || /[_]/.test(word)) return false;
    if (/^[A-ZÀ-Ý][a-zà-ÿ’'-]{2,}/.test(word)) return true;
    return accent && bare.length >= 3;
  }
  if (words.every((word) => /^[a-z0-9_-]+$/.test(word)) && words.some((word) => /[-_]/.test(word))) return false;
  if (accent || frHits > 0) return true;
  return /^[A-ZÀ-Ý]/.test(words[0]) && enHits === 0 && !words.every((word) => /^[A-Z0-9_-]+$/.test(word));
}

/** Splits a hole-bearing text at HTML tags into the texts and readable attribute values the DOM will hold. */
export function domPieces(text) {
  const pieces = [];
  if (!/<[a-zA-Z/!][^>]*>/.test(text)) return [text];
  for (const tag of text.matchAll(/<[a-zA-Z][^>]*>/g)) {
    for (const attribute of READABLE_ATTRIBUTES) {
      const match = tag[0].match(new RegExp(`\\s${attribute}="([^"]*)"`));
      if (match) pieces.push(match[1]);
    }
  }
  for (const segment of text.split(/<[^>]*>/g)) pieces.push(segment);
  return pieces;
}

/** Renumbers the holes of one piece from {0}. */
function renumber(piece) {
  const seen = new Map();
  return piece.replace(/\{(\d+)\}/g, (_match, index) => {
    if (!seen.has(index)) seen.set(index, seen.size);
    return `{${seen.get(index)}}`;
  });
}

function addKey(out, raw, file, line, kind) {
  for (const piece of domPieces(raw)) {
    const key = renumber(normalizeKey(decodeEntities(piece)));
    if (!isFrenchText(key)) continue;
    const bare = key.replace(/\{\d+\}/g, '').replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (bare.length < 2) continue;
    out.push({ key, file, line, kind });
  }
}

function calleeName(call) {
  const expression = call.expression;
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return '';
}

function isDevContext(node) {
  let child = node;
  let parent = node.parent;
  for (let depth = 0; parent && depth < 8; depth += 1, child = parent, parent = parent.parent) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isLiteralTypeNode(parent) || ts.isExternalModuleReference(parent)) return true;
    if (ts.isThrowStatement(parent)) return true;
    if (ts.isNewExpression(parent) && /Error$/.test(parent.expression.getText())) return true;
    if (ts.isCallExpression(parent)) {
      const callee = parent.expression.getText();
      if (/^console\./.test(callee)) return true;
      if (depth === 0 && IGNORED_CALLEES.has(calleeName(parent))) return true;
      if (depth === 0 && calleeName(parent) === 'setAttribute' && parent.arguments[0] === child) return true;
      if (depth === 0 && ts.isImportKeyword?.(parent.expression)) return true;
      if (parent.expression.kind === ts.SyntaxKind.ImportKeyword) return true;
    }
    if (ts.isPropertyAssignment(parent) && parent.name === child) return true;
    if (depth === 0 && ts.isPropertyAssignment(parent) && parent.initializer === child) {
      const name = parent.name.getText().replace(/['"]/g, '');
      if (ID_PROPERTIES.has(name)) return true;
    }
    if (ts.isElementAccessExpression(parent) && parent.argumentExpression === child) return true;
    if (ts.isCaseClause(parent) && parent.expression === child) return true;
    if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(parent.operatorToken.kind)) return true;
    if (depth === 0 && ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(parent.left) && /^(className|id|type|key|src|href|tagName)$/.test(parent.left.name.text)) return true;
    if (depth === 0 && ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(parent.left) && ts.isPropertyAccessExpression(parent.left.expression)
      && /^(dataset|style)$/.test(parent.left.expression.name.text)) return true;
  }
  return false;
}

/** Flattens a `+` chain into parts when one of them is text. */
function concatenationParts(node) {
  const parts = [];
  const walk = (expression) => {
    if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      walk(expression.left); walk(expression.right);
    } else if (ts.isParenthesizedExpression(expression) && ts.isBinaryExpression(expression.expression)
      && expression.expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      walk(expression.expression);
    } else parts.push(expression);
  };
  walk(node);
  return parts;
}

function templateText(node, holes) {
  if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) return node.text;
  let text = node.head.text;
  for (const span of node.templateSpans) {
    text += `{${holes.length}}`;
    holes.push(span.expression);
    text += span.literal.text;
  }
  return text;
}

/** Every French key of one source file, with its line. */
export function extractFromSource(file, sourceText) {
  const out = [];
  const kind = file.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, kind);
  const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const visit = (node) => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken
      && !(ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.PlusToken)) {
      const parts = concatenationParts(node);
      const textual = parts.some((part) => ts.isStringLiteral(part) || ts.isNoSubstitutionTemplateLiteral(part) || ts.isTemplateExpression(part));
      if (textual) {
        if (!isDevContext(node)) {
          const holes = [];
          let text = '';
          for (const part of parts) {
            if (ts.isStringLiteral(part) || ts.isNoSubstitutionTemplateLiteral(part) || ts.isTemplateExpression(part)) text += templateText(part, holes);
            else { text += `{${holes.length}}`; holes.push(part); }
          }
          addKey(out, text, file, lineOf(node), 'concat');
          for (const hole of holes) visit(hole);
        }
        return;
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isDevContext(node)) addKey(out, node.text, file, lineOf(node), 'literal');
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const holes = [];
      const text = templateText(node, holes);
      if (!isDevContext(node)) addKey(out, text, file, lineOf(node), 'template');
      for (const hole of holes) visit(hole);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

/** Every French key of an HTML page (scripts and styles removed). */
export function extractFromHtml(file, html) {
  const out = [];
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  let line = 1;
  for (const chunk of body.split(/(?=<)/)) {
    addKey(out, chunk, file, line, 'html');
    line += (chunk.match(/\n/g) ?? []).length;
  }
  return out;
}

export function isPlayerSource(relative) {
  if (relative === 'index.html' || relative === 'legacy-combat.html') return true;
  if (!/^src\/.*\.(ts|js|mjs)$/.test(relative)) return false;
  if (/\.(test|spec)\.|\.d\.ts$/.test(relative)) return false;
  return !DEV_ONLY_SOURCES.some((pattern) => pattern.test(relative));
}

export function listPlayerSources(root) {
  const files = ['index.html', 'legacy-combat.html'];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = `${directory}/${entry.name}`;
      if (entry.isDirectory()) walk(relative);
      else if (isPlayerSource(relative)) files.push(relative);
    }
  };
  walk('src');
  return files.sort();
}

/** The catalog zone a source's keys are written to; the runtime merges every zone. */
export function zoneOf(relative) {
  if (/^src\/campaign\/plateaux\/bear\//.test(relative)) return 'bear';
  if (/^src\/campaign\/plateaux\/dragon\//.test(relative)) return 'dragon';
  if (/^src\/campaign\/plateaux\/scorpion\//.test(relative)) return 'scorpion';
  if (/^src\/campaign\/plateaux\/finale\//.test(relative)) return 'finale';
  if (/^src\/campaign\/plateaux\/(heroMeetings|PlateauRegistry)\.ts$|^src\/game\/(refugeRecruitment|plateauFinale|chronicleEndWords|finalAct|reputationEventContent)\.ts$/.test(relative)) return 'chronicle';
  if (/^src\/game\/(content|r5NarrativeContent|lionFinale|contextualDialogueContent|campaignGrammarContent|prologue|challenges)\.ts$|^src\/campaign\/Lion/.test(relative)) return 'lion';
  if (/^src\/game\/(skills|skillFacts|catalog|reputation|management|OptionalEncounterConsequencePolicy)\.ts$/.test(relative)) return 'items';
  if (relative === 'legacy-combat.html' || /^src\/combat\//.test(relative)) return 'combat';
  return 'interface';
}

export const ZONES = ['interface', 'lion', 'chronicle', 'bear', 'dragon', 'scorpion', 'finale', 'items', 'combat'];

/** Map of key → { zone, sites } over the given player sources. */
export function extractAll(root, files = listPlayerSources(root)) {
  const keys = new Map();
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const found = file.endsWith('.html') ? extractFromHtml(file, text) : extractFromSource(file, text);
    for (const { key, line } of found) {
      const entry = keys.get(key) ?? { zone: zoneOf(file), sites: [] };
      entry.sites.push(`${file}:${line}`);
      keys.set(key, entry);
    }
  }
  for (const key of MANUAL_KEYS) if (!keys.has(key)) keys.set(key, { zone: 'combat', sites: ['MANUAL_KEYS'] });
  return keys;
}
