/** Rebuild the audit's asset inventory from approved production paths and MP4 headers. */
import { readFile, writeFile } from 'node:fs/promises';

const reportPath = 'docs/reports/traversal-remaining-legs-audit-1.json';
const manifest = JSON.parse(await readFile('src/render/data/demo-environment-pack-v1.production.json', 'utf8'));
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const assetsById = new Map(manifest.assets.map(asset => [asset.assetId, asset]));

const segments = [
  { leg: 'T1', segment: 'first-refuge departure', imageIds: ['first_refuge_tableau', 'first_refuge_travel'], videoIds: ['first_refuge_departure'] },
  { leg: 'T1', segment: 'reserve trail and Valmir road', imageIds: ['valmir_road_tableau', 'valmir_road_travel', 'old_shrine_tableau'], videoIds: ['valmir_route_fork', 'shrine_reveal_context', 'serpent_road_tension', 'troll_crossing_reveal', 'serpent_duelist_reveal'] },
  { leg: 'T1', segment: 'Bois-Clair approach and outcome', imageIds: ['bois_clair_tableau_burning', 'bois_clair_travel', 'bois_clair_tableau_aftermath_saved', 'bois_clair_tableau_aftermath_sacrificed', 'bois_clair_burning_strategic', 'bois_clair_burning_stage'], videoIds: ['bois_clair_arrival', 'bois_clair_saved', 'bois_clair_sacrificed'] },
  { leg: 'T3', segment: 'second-refuge departure', imageIds: ['second_refuge_night_tableau', 'second_refuge_morning_travel'], videoIds: ['second_refuge_departure'] },
  { leg: 'T3', segment: 'Garen and Witness road', imageIds: ['witness_road_tableau', 'witness_road_travel'], videoIds: ['garen_encounter', 'witnesses_encounter'] },
  { leg: 'T3', segment: 'final fork and Shadow Ruins', imageIds: ['dragon_roost_area', 'shadow_ruins_approach', 'shadow_ruins_tableau', 'lion_sanctum_strategic', 'lion_sanctum_stage'], videoIds: ['young_dragon_encounter', 'serpent_informant_encounter', 'shrine_reveal_context', 'ruins_approach_context', 'serpent_road_tension', 'shadow_signs'] },
  { leg: 'T4', segment: 'Shadow Ruins departure', imageIds: ['shadow_ruins_tableau', 'shadow_ruins_approach'] },
  { leg: 'T4', segment: 'final-refuge approach and destination', imageIds: ['final_refuge_travel', 'final_refuge_tableau'], videoIds: ['final_refuge_dossier'] },
];

function mp4Dimensions(buffer) {
  const typeIndex = buffer.indexOf(Buffer.from('tkhd'));
  if (typeIndex < 0) throw new Error('MP4 has no tkhd box');
  const version = buffer[typeIndex + 4];
  const offset = version === 0 ? 80 : version === 1 ? 92 : -1;
  if (offset < 0) throw new Error(`Unsupported tkhd version ${version}`);
  return { width: buffer.readUInt32BE(typeIndex + offset) / 65536,
    height: buffer.readUInt32BE(typeIndex + offset + 4) / 65536 };
}

const entries = [];
for (const segment of segments) {
  for (const id of segment.imageIds) {
    const asset = assetsById.get(id);
    if (!asset) throw new Error(`Approved asset missing: ${id}`);
    const isStage = asset.surfaceRole === 'STATIC_TABLEAU';
    const isTravel = asset.surfaceRole === 'TRAVEL';
    entries.push({ leg: segment.leg, segment: segment.segment, assetId: id,
      kind: 'production-environment-image', path: asset.productionPath,
      visualFamily: asset.visualFamily, surfaceRole: asset.surfaceRole,
      dimensions: `${asset.width}x${asset.height}`, cleanEnvironmentOnly: true,
      actorsBakedIn: false, usableAsTraversalLayer: false,
      usableAsNarrativeStageBackground: isStage ? 'yes' : isTravel ? 'candidate' : 'no',
      use: isStage ? 'NarrativeStage hold/tableau' : isTravel ? 'Journey travel still' : 'combat surface only',
      reasonNotTraversalLayer: 'Perspective vista, not a lateral Traversal world section',
    });
  }
  for (const id of segment.videoIds ?? []) {
    const path = `public/assets/cinematics/${id}.mp4`;
    const dimensions = mp4Dimensions(await readFile(path));
    entries.push({ leg: segment.leg, segment: segment.segment, assetId: id,
      kind: 'production-cinematic-video', path, visualFamily: null, surfaceRole: 'CINEMATIC',
      dimensions: `${dimensions.width}x${dimensions.height}`, cleanEnvironmentOnly: false,
      actorsBakedIn: 'fixed editorial composition; clip cast varies', usableAsTraversalLayer: false,
      usableAsNarrativeStageBackground: 'no', use: 'existing cinematic beat only',
      reasonNotTraversalLayer: 'Fixed timed shot with authored content, not reusable road scenery',
    });
  }
}

report.assetInventory = {
  sourceManifest: 'src/render/data/demo-environment-pack-v1.production.json',
  interpretation: 'Approved environment images have no baked actors. Vistas are not lateral Traversal sections. Video is a content-specific editorial shot.',
  entries,
  missingTraversalWorldSections: {
    T1: '4-6 side-on sections across refuge exit, Valmir road, fork branches, and Bois-Clair outskirts',
    T3: '5-7 side-on sections across warm refuge exit, Witness road, fork branches, and gradually ominous ruins',
    T4: '2-3 side-on sections from cool ruins to restrained warm final camp',
  },
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${entries.length} production asset entries to ${reportPath}`);
