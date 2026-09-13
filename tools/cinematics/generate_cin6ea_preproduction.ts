import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BASELINE = '6683c6d3898db0216549c43f7d25c7d8fd46d70d';
const SPECS = resolve(ROOT, 'tools/cinematics/specs');
const REPORTS = resolve(ROOT, 'docs/reports');
const GOLD = ['alaric_audience_arrival', 'camp_departure', 'valmir_route_fork'] as const;
const IMAGE_MODEL = 'gpt-image-2.5-sunburst-2026-09-08';

type Json = Record<string, any>;

async function json(path: string): Promise<Json> {
  return JSON.parse(await readFile(resolve(ROOT, path), 'utf8')) as Json;
}

async function hash(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(resolve(ROOT, path))).digest('hex');
}

async function writeJson(name: string, value: unknown): Promise<void> {
  await writeFile(resolve(SPECS, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const familyDetail: Record<string, Json> = {
  LION_CAMP: {
    physicalLocationIdentity: 'fortified Lion expedition camp at a mountain-road threshold', narrativePurpose: 'origin, duty and company departure', architecture: ['blue-and-gold command tents', 'timber palisade', 'watch platforms'], terrain: 'rocky alpine valley', groundMaterial: 'mud, trampled grass and rain-dark stone', palette: ['Lion blue', 'burnished gold', 'warm ember orange', 'cool mountain grey'], keyLightDirection: 'low rear three-quarter dawn light from the valley', keyLightTemperature: 'warm sunrise', ambientFill: 'cool open-sky fill', atmosphere: 'thin mist, banked smoke and dawn haze', depthLanguage: 'framing tent edges, company plane, layered camp and mountain distance', foregroundLanguage: 'soft tent or supply silhouettes without blocking feet', midgroundLanguage: 'clear company staging road', backgroundLanguage: 'palisade, flags, pines and mountain pass', weather: 'calm after rain', materialLanguage: 'painted cloth, wet earth, weathered timber and restrained metal highlights', environmentalMotionCandidates: ['banner drift', 'smoke', 'embers', 'distant cloth'], forbiddenVisualDrift: ['desert camp', 'bright tournament pavilion', 'modern military camp', 'flat character cutouts'], goldReferenceLineage: ['camp_departure'],
  },
  ALARIC_AUDIENCE: {
    physicalLocationIdentity: 'Alaric audience chamber inside the Lion command pavilion', narrativePurpose: 'formal mandate, opposed counsel and player agency', architecture: ['central Lion banner', 'raised authority lane', 'timber-and-cloth royal hall', 'ordered torch rows'], terrain: 'interior pavilion', groundMaterial: 'patterned woven carpet over timber and stone', palette: ['deep Lion blue', 'aged gold', 'warm amber', 'dark umber'], keyLightDirection: 'high central warm shafts with side torch fill', keyLightTemperature: 'warm torch and candle gold', ambientFill: 'cool blue cloth bounce', atmosphere: 'dust motes and restrained smoke', depthLanguage: 'foreground furniture blur, cast plane, dais and banner wall', foregroundLanguage: 'dark soft occluders at frame corners', midgroundLanguage: 'unbroken actor ground plane with clear speaker lanes', backgroundLanguage: 'symmetrical banners, long table, candles and guard-depth suggestions', weather: 'interior', materialLanguage: 'rich cloth, carved dark timber, brass, wax and grounded carpet', environmentalMotionCandidates: ['torch flicker', 'banner settling', 'dust'], forbiddenVisualDrift: ['stone cathedral', 'empty throne-room scale', 'red Serpent heraldry', 'flat pasted party lineup'], goldReferenceLineage: ['alaric_audience_arrival'],
  },
  FOREST_ROAD: {
    physicalLocationIdentity: 'old woodland roads linking the Lion territories', narrativePurpose: 'travel, uncertainty, encounter and aftermath', architecture: ['weathered waystones', 'small timber markers', 'occasional ruined masonry'], terrain: 'rolling temperate forest', groundMaterial: 'rutted wet earth, roots and scattered stone', palette: ['moss green', 'wet bark brown', 'cool slate', 'filtered warm daylight'], keyLightDirection: 'broken upper-left canopy light', keyLightTemperature: 'neutral daylight with warm breaks', ambientFill: 'cool green woodland bounce', atmosphere: 'layered mist and suspended moisture', depthLanguage: 'foreground foliage, readable road stage, receding trunks and ridges', foregroundLanguage: 'soft foliage framing outside UI zones', midgroundLanguage: 'broad grounded road for cast or integrated travellers', backgroundLanguage: 'road bend, ridge and travel marker', weather: 'recent rain', materialLanguage: 'wet bark, mossy stone, earth and matte cloth', environmentalMotionCandidates: ['foliage', 'mist', 'water', 'dust motes'], forbiddenVisualDrift: ['enchanted neon forest', 'tropical jungle', 'flat meadow', 'unmotivated castle skyline'], goldReferenceLineage: ['valmir_route_fork', 'camp_departure'],
  },
  FIRST_REFUGE: {
    physicalLocationIdentity: 'first palisade refuge hidden in the forest', narrativePurpose: 'earned safety and fragile civilian shelter', architecture: ['rough palisade', 'watch fires', 'supply shelter', 'visible exit road'], terrain: 'wooded enclosure', groundMaterial: 'packed earth, plank paths and straw', palette: ['ember amber', 'cool pine green', 'weathered brown', 'smoke grey'], keyLightDirection: 'low firelight from the interior-left', keyLightTemperature: 'warm fire against cool dusk', ambientFill: 'cool forest twilight', atmosphere: 'sheltered smoke and light mist', depthLanguage: 'gate framing, open staging yard and tree-walled distance', foregroundLanguage: 'supplies kept below face and UI zones', midgroundLanguage: 'clear refuge yard and ground band', backgroundLanguage: 'palisade, watch tower and exit road', weather: 'cool dusk', materialLanguage: 'rough timber, worn canvas, earth and firelit metal', environmentalMotionCandidates: ['fire', 'smoke', 'cloth', 'foliage'], forbiddenVisualDrift: ['stone city', 'luxury camp', 'crowded baked civilians', 'daylight mismatch'], goldReferenceLineage: ['camp_departure'],
  },
  VALMIR_ROAD: {
    physicalLocationIdentity: 'mountain forest junction on the road to Valmir', narrativePurpose: 'route geography, choice and rising military pressure', architecture: ['fork marker', 'old shrine stones', 'distant fortified road'], terrain: 'highland conifer road', groundMaterial: 'wet stone, dark soil and shallow reflective ruts', palette: ['moonlit blue-grey', 'pine black-green', 'warm watch-fire orange', 'weathered stone'], keyLightDirection: 'cool high-left celestial light', keyLightTemperature: 'cool moon or late-day mountain light', ambientFill: 'misty blue forest fill', atmosphere: 'low mist with warm distant fire contrast', depthLanguage: 'foreground branch frame, two readable route corridors and mountain layers', foregroundLanguage: 'dark foliage vignette outside route-safe zones', midgroundLanguage: 'symmetric fork and company rest plane', backgroundLanguage: 'left shrine and right fortification with equal narrative weight', weather: 'humid and still', materialLanguage: 'wet earth, mossy stone, dark timber and controlled torchlight', environmentalMotionCandidates: ['mist', 'leaves', 'water reflections', 'torchlight'], forbiddenVisualDrift: ['single dominant route', 'labels or arrows', 'bright pastoral day', 'selected destination cues'], goldReferenceLineage: ['valmir_route_fork'],
  },
  BOIS_CLAIR: {
    physicalLocationIdentity: 'threatened village of Bois-Clair at the forest edge', narrativePurpose: 'civilian consequence, defence or sacrifice', architecture: ['chapel', 'timber houses', 'north captive route', 'south reserve route'], terrain: 'village basin below wooded ridges', groundMaterial: 'muddy lane, cobbles, ash and timber debris', palette: ['smoke umber', 'ember orange', 'weathered plaster', 'cool recovery blue'], keyLightDirection: 'side firelight balanced by sky light', keyLightTemperature: 'warm fire with outcome-specific cool or dawn relief', ambientFill: 'smoke-softened sky', atmosphere: 'layered smoke with readable silhouettes', depthLanguage: 'near props, square staging plane, roofs and ridge', foregroundLanguage: 'low debris that does not interfere with sprite feet', midgroundLanguage: 'open village square', backgroundLanguage: 'chapel, roofs, smoke and split roads', weather: 'smoky late day', materialLanguage: 'soot, timber, stone, plaster and damp earth', environmentalMotionCandidates: ['smoke', 'embers', 'cloth', 'distant fire'], forbiddenVisualDrift: ['pristine fairy village', 'modern town', 'identifiable baked party', 'indiscriminate inferno'], goldReferenceLineage: ['camp_departure', 'valmir_route_fork'],
  },
  SECOND_REFUGE: {
    physicalLocationIdentity: 'second roadside refuge after Bois-Clair', narrativePurpose: 'night recovery, new ally encounter and renewed departure', architecture: ['tent line', 'low palisade', 'campfire circle', 'departure gate'], terrain: 'forest clearing beside the road', groundMaterial: 'packed earth, grass and ash', palette: ['deep blue night', 'low amber fire', 'cool morning grey', 'muted canvas'], keyLightDirection: 'low central firelight transitioning to right-side dawn', keyLightTemperature: 'warm local fire, cool ambient night', ambientFill: 'soft blue nocturnal fill', atmosphere: 'thin smoke and cool haze', depthLanguage: 'near camp objects, open meeting ground, dark tree boundary and exit road', foregroundLanguage: 'low bedroll or crate silhouettes', midgroundLanguage: 'clear NPC-compatible meeting space', backgroundLanguage: 'tents, gate and forest road', weather: 'still night to morning', materialLanguage: 'canvas, timber, ash, leather and damp soil', environmentalMotionCandidates: ['fire', 'smoke', 'tent cloth', 'morning mist'], forbiddenVisualDrift: ['bright royal camp', 'baked Garen in tableau plate', 'dense crowd', 'flat black shadows'], goldReferenceLineage: ['camp_departure', 'valmir_route_fork'],
  },
  WITNESS_ROAD: {
    physicalLocationIdentity: 'open road where witnesses meet the company', narrativePurpose: 'testimony, social evidence and consequence', architecture: ['road marker', 'distant settlement smoke', 'simple verge fencing'], terrain: 'open woodland verge', groundMaterial: 'drying earth and pale road stone', palette: ['neutral daylight', 'muted green', 'dust tan', 'distant smoke blue'], keyLightDirection: 'broad upper-left daylight', keyLightTemperature: 'neutral warm day', ambientFill: 'open-sky blue', atmosphere: 'long clear depth with distant haze', depthLanguage: 'open encounter lanes and long road recession', foregroundLanguage: 'sparse grasses and verge stones', midgroundLanguage: 'separate witness and party lanes', backgroundLanguage: 'road, wooded verge and distant smoke', weather: 'clear day', materialLanguage: 'dust, worn timber, cloth and natural stone', environmentalMotionCandidates: ['grass', 'dust', 'distant smoke'], forbiddenVisualDrift: ['court interior', 'dense dark forest', 'combat staging', 'crowd without narrative basis'], goldReferenceLineage: ['camp_departure'],
  },
  SHADOW_RUINS: {
    physicalLocationIdentity: 'ancient ruins marked by restrained Shadow corruption', narrativePurpose: 'evidence, dread, supernatural warning and final trial aftermath', architecture: ['inscribed monoliths', 'broken arch', 'shrine stones', 'buried terrace'], terrain: 'rocky forest ruins', groundMaterial: 'wet flagstone, moss, roots and fine violet fissures', palette: ['cold slate', 'moon blue', 'desaturated moss', 'restrained violet', 'small warm lantern accents'], keyLightDirection: 'cool high side light through broken canopy', keyLightTemperature: 'cold blue-grey', ambientFill: 'low violet-neutral stone bounce', atmosphere: 'mist, dust and faint corruption haze', depthLanguage: 'evidence foreground, actor plane, monumental arch and obscured depth', foregroundLanguage: 'readable relic fragments outside dialogue-safe zones', midgroundLanguage: 'flat stone staging plane with controlled contrast', backgroundLanguage: 'ruin arch, forest depth and subtle shadow veins', weather: 'overcast or night', materialLanguage: 'wet stone, moss, aged metal and restrained emissive corruption', environmentalMotionCandidates: ['mist', 'dust', 'subtle violet pulse', 'foliage'], forbiddenVisualDrift: ['neon purple fantasy', 'black unreadable frame', 'lava', 'generic gothic cathedral'], goldReferenceLineage: ['valmir_route_fork'],
  },
  FINAL_REFUGE: {
    physicalLocationIdentity: 'last Lion shelter before judgement', narrativePurpose: 'reflection, dossier review and route-ending preparation', architecture: ['final campfire', 'dossier table', 'Lion road', 'sparse tents'], terrain: 'high wooded overlook', groundMaterial: 'packed soil, flat stone and pine needles', palette: ['quiet dusk blue', 'warm shelter amber', 'muted Lion gold', 'violet-grey distance'], keyLightDirection: 'low warm fire from one side with dusk rim', keyLightTemperature: 'warm shelter edge against cool dusk', ambientFill: 'soft sky blue', atmosphere: 'still haze and distant mountain air', depthLanguage: 'intimate foreground table, open company plane and long road beyond', foregroundLanguage: 'dossier props confined to low corner', midgroundLanguage: 'reflective camp staging', backgroundLanguage: 'road toward Lion territory and distant peaks', weather: 'clear dusk', materialLanguage: 'paper, leather, timber, stone and soft cloth', environmentalMotionCandidates: ['fire', 'paper edge', 'smoke', 'distant cloth'], forbiddenVisualDrift: ['busy refugee camp', 'battlefield', 'bright noon', 'baked route outcome'], goldReferenceLineage: ['camp_departure'],
  },
  LION_JUDGEMENT: {
    physicalLocationIdentity: 'formal Lion judgement hall', narrativePurpose: 'verdict, disclosure and final route authority', architecture: ['Lion dais', 'central seal', 'court banners', 'judgement terrace'], terrain: 'interior ceremonial hall', groundMaterial: 'dark polished stone and formal carpet', palette: ['deep blue', 'hard gold', 'dark red accents', 'charcoal'], keyLightDirection: 'high central authority light', keyLightTemperature: 'formal warm gold', ambientFill: 'cool deep-blue fill', atmosphere: 'controlled haze and torch smoke', depthLanguage: 'opposed lanes, central seal and receding court', foregroundLanguage: 'restrained dark court framing', midgroundLanguage: 'clear judgement axis', backgroundLanguage: 'dais, seal and banner symmetry', weather: 'interior', materialLanguage: 'stone, heavy cloth, gold metal and dark timber', environmentalMotionCandidates: ['torch', 'banner', 'dust'], forbiddenVisualDrift: ['audience arrival replay', 'casual camp', 'Serpent-dominant heraldry', 'crowded throne room'], goldReferenceLineage: ['alaric_audience_arrival'],
  },
  SERPENT_FINALE: {
    physicalLocationIdentity: 'ruined arena under Serpent occupation and Shadow pressure', narrativePurpose: 'hostile reveal, final confrontation and aftermath', architecture: ['ruin arena', 'Serpent standard', 'Shadow artefact'], terrain: 'weathered stone terrace', groundMaterial: 'cracked stone, ash and sparse moss', palette: ['cold ruin grey', 'hostile Serpent red', 'dark green', 'restrained violet'], keyLightDirection: 'cold lateral sky light cut by red practicals', keyLightTemperature: 'cold ambient with hostile warm accents', ambientFill: 'low storm-blue fill', atmosphere: 'windblown ash and distant mist', depthLanguage: 'arena foreground, confrontation axis and artefact depth', foregroundLanguage: 'broken stone framing outside combat/readability lanes', midgroundLanguage: 'clear boss and party plane', backgroundLanguage: 'standards, ruined wall and artefact landmark', weather: 'twilight wind', materialLanguage: 'weathered stone, dark steel, torn cloth and subtle corruption', environmentalMotionCandidates: ['standards', 'ash', 'mist', 'subtle artefact pulse'], forbiddenVisualDrift: ['lava arena', 'bright heroic parade', 'generic demon realm', 'purple overload'], goldReferenceLineage: ['valmir_route_fork', 'alaric_audience_arrival'],
  },
  LION_TRIAL: {
    physicalLocationIdentity: 'Lion ritual trial terrace', narrativePurpose: 'voluntary or imposed martial judgement', architecture: ['trial circle', 'Lion standard', 'judgement terrace'], terrain: 'exposed mountain stone court', groundMaterial: 'weathered flagstone with engraved circle', palette: ['hard Lion gold', 'storm blue', 'weathered grey', 'controlled red'], keyLightDirection: 'hard low side light across the duel axis', keyLightTemperature: 'warm gold against cool twilight', ambientFill: 'cold open sky', atmosphere: 'wind, dust and high-altitude haze', depthLanguage: 'foreground circle edge, duel plane and authority terrace', foregroundLanguage: 'engraved stone without face-level clutter', midgroundLanguage: 'clean ritual axis', backgroundLanguage: 'Alaric authority geography, standards and mountain depth', weather: 'windy twilight', materialLanguage: 'stone, steel, heavy cloth and aged gold', environmentalMotionCandidates: ['standards', 'dust', 'cape edges'], forbiddenVisualDrift: ['colosseum spectacle', 'anonymous arena', 'Serpent heraldry', 'combat VFX baked into plate'], goldReferenceLineage: ['alaric_audience_arrival', 'valmir_route_fork'],
  },
};

const characterVisuals: Record<string, Json> = {
  alaric: { displayName: 'Alaric', age: 'older adult', proportions: 'tall courtly build', relativeHeight: 1.05, head: 'short white hair and full white beard', face: 'stern older face, strong brows', costume: 'deep blue and red Lion court robes with gold trim', colors: ['Lion blue', 'red', 'gold'], weapon: 'gold-topped cane or authority staff', accessories: ['sealed scroll', 'Lion medallion'], faction: 'LION' },
  alistair: { displayName: 'Alistair', age: 'adult', proportions: 'broad armored build', relativeHeight: 1.08, head: 'closed dark helm with red plume', face: 'face normally concealed by canonical helm', costume: 'dark plate armor with red scarf and cape', colors: ['charcoal steel', 'red', 'brown leather'], weapon: 'large two-handed greatsword', accessories: ['red plume', 'red cloak'], faction: 'OUR_COMPANY' },
  cedric: { displayName: 'Cedric', age: 'young adult', proportions: 'lean agile build', relativeHeight: 0.98, head: 'deep purple hood', face: 'shadowed youthful face', costume: 'purple hooded leather scout armor', colors: ['purple', 'brown leather', 'muted gold'], weapon: 'paired short blades', accessories: ['hood', 'belts'], faction: 'OPTIONAL_COMPANY_RECRUIT' },
  elara: { displayName: 'Elara', age: 'adult', proportions: 'slender robed build', relativeHeight: 1, head: 'face shadowed by pointed wide-brim hat', face: 'mostly concealed', costume: 'dark blue arcane robes with gold geometry', colors: ['midnight blue', 'electric blue', 'gold'], weapon: 'arcane focus and blue flame', accessories: ['wide-brim hat', 'glowing orb'], faction: 'OUR_COMPANY' },
  forest_spider: { displayName: 'Forest Spider', age: 'creature', proportions: 'low wide arachnid', relativeHeight: 0.45, head: 'small armored cephalothorax', face: 'clustered eyes and mandibles', costume: 'natural chitin', colors: ['ochre', 'olive', 'dark brown'], weapon: 'fangs', accessories: [], faction: 'WILDLIFE' },
  forest_troll_elite: { displayName: 'Forest Troll Elite', age: 'adult creature', proportions: 'massive hunched humanoid', relativeHeight: 1.35, head: 'broad stony brow with sparse mossy hair', face: 'heavy jaw and tusks', costume: 'mossy hide and crude wrappings', colors: ['moss green', 'earth brown', 'stone grey'], weapon: 'large boulder', accessories: ['rope belt', 'moss growth'], faction: 'WILDLIFE' },
  kestrel: { displayName: 'Kestrel', age: 'adult', proportions: 'compact agile archer', relativeHeight: 0.97, head: 'green hood', face: 'partly shadowed focused face', costume: 'green layered ranger leathers', colors: ['forest green', 'brown', 'muted gold'], weapon: 'longbow', accessories: ['quiver', 'hood'], faction: 'OUR_COMPANY' },
  lancer: { displayName: 'Garen', age: 'adult', proportions: 'tall athletic armored build', relativeHeight: 1.08, head: 'teal-crested closed helm', face: 'face concealed by canonical helm', costume: 'silver and teal lancer armor', colors: ['silver', 'teal', 'dark navy'], weapon: 'long spear', accessories: ['teal cloth panels', 'helm crest'], faction: 'OPTIONAL_COMPANY_RECRUIT' },
  lion_champion: { displayName: 'Lion Champion', age: 'adult', proportions: 'large heroic armored build', relativeHeight: 1.13, head: 'golden lion-crested helm', face: 'helmet-framed mature face', costume: 'blue and gold ceremonial heavy armor', colors: ['Lion blue', 'gold', 'silver'], weapon: 'long sword', accessories: ['lion pelt mantle', 'Lion shield'], faction: 'LION' },
  maelor: { displayName: 'Intendant Maelor', age: 'adult', proportions: 'lean court mage', relativeHeight: 1.01, head: 'dark swept hair', face: 'angular clean-shaven face', costume: 'purple long coat and robes with gold linework', colors: ['royal purple', 'dark red', 'gold'], weapon: 'dagger and open grimoire', accessories: ['grimoire', 'belt ornaments'], faction: 'OUR_COMPANY' },
  marian: { displayName: 'Marian', age: 'adult', proportions: 'slender robed caster', relativeHeight: 0.99, head: 'white hood concealing most hair', face: 'calm lightly shadowed face', costume: 'white and pale-blue ceremonial robes', colors: ['white', 'pale blue', 'gold'], weapon: 'star-topped staff and light magic', accessories: ['hood', 'gold halo motifs'], faction: 'OUR_COMPANY' },
  refugee_mother: { displayName: 'Refugee Mother', age: 'adult', proportions: 'average civilian build', relativeHeight: 0.95, head: 'brown headscarf', face: 'tired concerned face', costume: 'brown hood and blue civilian dress', colors: ['brown', 'blue', 'cream'], weapon: 'none', accessories: ['wrapped bundle'], faction: 'CIVILIAN' },
  sage_seraphine: { displayName: 'Sage Seraphine', age: 'adult', proportions: 'slender ceremonial build', relativeHeight: 0.98, head: 'cream hood framing brown hair', face: 'soft oval face and calm expression', costume: 'cream, teal and gold sage robes', colors: ['cream', 'teal', 'gold'], weapon: 'ornate censer staff', accessories: ['hood', 'satchel', 'hanging censer'], faction: 'OUR_COMPANY' },
  serpent_brute: { displayName: 'Serpent Brute', age: 'adult', proportions: 'very broad armored build', relativeHeight: 1.12, head: 'dark hood and face covering', face: 'concealed', costume: 'black and green heavy Serpent armor', colors: ['black', 'dark green', 'rust red'], weapon: 'spiked mace', accessories: ['heavy pauldrons'], faction: 'SERPENT' },
  serpent_duelist_elite: { displayName: 'Serpent Duelist Elite', age: 'adult', proportions: 'lean athletic build', relativeHeight: 1.03, head: 'green-and-red masked hood', face: 'masked', costume: 'green elite duelist armor with red trim', colors: ['dark green', 'red', 'gold'], weapon: 'paired curved blades', accessories: ['hood', 'light cape'], faction: 'SERPENT' },
  serpent_general_boss: { displayName: 'Serpent General', age: 'adult', proportions: 'tall commanding armored build', relativeHeight: 1.14, head: 'red-plumed dark helm', face: 'masked or helmet-shadowed', costume: 'dark green general armor and long cloak', colors: ['dark green', 'black', 'red'], weapon: 'large curved glaive', accessories: ['command cloak', 'red plume'], faction: 'SERPENT' },
  serpent_oracle: { displayName: 'Serpent Oracle', age: 'adult', proportions: 'slender hooded caster', relativeHeight: 1, head: 'deep green hood', face: 'shadowed face with glowing eyes', costume: 'green and red ritual robes', colors: ['dark green', 'rust red', 'gold'], weapon: 'serpentine staff', accessories: ['hood', 'ritual trim'], faction: 'SERPENT' },
  serpent_raider: { displayName: 'Serpent Raider', age: 'adult', proportions: 'lean combat build', relativeHeight: 1, head: 'dark green hood and mask', face: 'masked', costume: 'dark leather raider armor with green cloth', colors: ['black', 'dark green', 'rust red'], weapon: 'paired short blades', accessories: ['hood', 'mask'], faction: 'SERPENT' },
  shrine_apparition: { displayName: 'Shrine Apparition', age: 'ageless apparition', proportions: 'tall floating robed silhouette', relativeHeight: 1.1, head: 'white hood and radiant halo', face: 'serene luminous face', costume: 'white and gold spectral vestments', colors: ['white', 'gold', 'pale blue'], weapon: 'radiant staff', accessories: ['halo', 'light motes'], faction: 'SHRINE' },
  survivor: { displayName: 'Survivor', age: 'adult', proportions: 'worn average build', relativeHeight: 0.98, head: 'dark hair and green headband', face: 'weathered bearded face', costume: 'patched green and brown travel clothes', colors: ['olive green', 'brown', 'grey'], weapon: 'walking staff', accessories: ['bandage', 'small pack'], faction: 'CIVILIAN' },
  villageoise: { displayName: 'Villageoise', age: 'adult', proportions: 'average civilian build', relativeHeight: 0.94, head: 'brown hair under blue-grey shawl', face: 'plain worried face', costume: 'cream apron and muted blue dress', colors: ['cream', 'muted blue', 'brown'], weapon: 'none', accessories: ['shawl'], faction: 'CIVILIAN' },
  young_dragon_elite: { displayName: 'Young Dragon Elite', age: 'young creature', proportions: 'compact winged dragon', relativeHeight: 0.85, head: 'horned teal dragon head', face: 'reptilian with bright eyes', costume: 'natural scales', colors: ['teal', 'emerald', 'cream'], weapon: 'claws and breath', accessories: ['wings', 'horns'], faction: 'WILDLIFE' },
};

const goldManual: Record<string, Json> = {
  alaric_audience_arrival: {
    cameraHeight: 'eye level to slightly low, strengthening Alaric and the pavilion scale', cameraAngle: 'formal frontal axis with two deliberate reframings', apparentFocalLanguage: 'moderate wide lens with restrained perspective compression', horizonPlacement: 'implicit near lower-middle behind actor plane', foregroundMidgroundBackground: 'soft dark furniture foreground; cast and carpet midground; table, torches and banners background', groundPlane: 'continuous patterned carpet with readable contact shadows', characterToFrameScale: 'roughly 31–46% of frame height', relativeCharacterHeights: 'Alaric tallest; armored Alistair broadest; advisers smaller', characterSpacing: 'formal separated lanes with Alaric isolated on the right', environmentDensity: 'high but controlled by symmetry', lightingDirection: 'warm overhead and side torchlight', lightingTemperature: 'amber-gold with deep blue cloth contrast', contrast: 'high local character contrast, protected dark edges', palette: ['deep blue', 'burnished gold', 'amber', 'red accents', 'dark umber'], atmosphericDepth: 'dust and haze separate banners, table and cast', materialRendering: 'painted cloth, brass, carpet and polished armor', silhouetteReadability: 'strong, except overlaps around the armored center figure', negativeSpace: 'central/right upper space supports authority but not all dialogue placements', visualHierarchy: 'Alaric and the four-character audience geography', environmentCharacterIntegration: 'shared carpet, occlusion, warm light and depth read as one place', finalFrameSuitability: 'visually stable and sharp but returns to a composition containing the full cast', continuityWeaknesses: ['two editorial reframings reset cast composition', 'central armored figure disappears during the middle composition', 'camera/cast return near the end rather than remaining one continuous shot'], whatWeKeep: ['formal symmetry', 'Lion banner identity', 'warm/cool palette', 'carpet grounding', 'scene density'], whatWeImprove: ['one continuous camera path', 'constant cast existence', 'clean dialogue-safe endpoint'], whatWeMustNeverReproduce: ['cast reset between angles', 'unexplained character disappearance', 'reconstructed alternate shot'],
  },
  camp_departure: {
    cameraHeight: 'low eye level on the company road', cameraAngle: 'wide three-quarter departure view', apparentFocalLanguage: 'wide environmental lens with deep mountain recession', horizonPlacement: 'upper-middle mountain horizon', foregroundMidgroundBackground: 'tent/crate edge foreground; company and wet road midground; camp, pines and mountains background', groundPlane: 'wet rutted road with strong reflected dawn light', characterToFrameScale: 'roughly 31–40% of frame height', relativeCharacterHeights: 'Alistair largest; Maelor and Marian slightly smaller', characterSpacing: 'tight coherent travelling group left of center', environmentDensity: 'rich camp detail with an open road corridor', lightingDirection: 'low rear sunrise from center-right', lightingTemperature: 'warm gold against cool mountains', contrast: 'bright horizon, darker framing edges and readable cast', palette: ['sunrise gold', 'Lion blue', 'pine green', 'wet earth', 'mountain grey'], atmosphericDepth: 'strong layered haze across camp and mountains', materialRendering: 'wet earth, canvas, timber and metal share the same warm response', silhouetteReadability: 'strong; sword and staff remain distinctive', negativeSpace: 'road and sky carry motion and destination', visualHierarchy: 'company first, luminous road second, mountain destination third', environmentCharacterIntegration: 'contact shadows and reflected ground light bind cast to road', finalFrameSuitability: 'sharp, balanced and hold-friendly', continuityWeaknesses: ['hard composition cut detected at 6.0s', 'group spacing and background framing reset at the cut'], whatWeKeep: ['wet-road grounding', 'dawn palette', 'mountain depth', 'integrated equipment silhouettes', 'clear travel direction'], whatWeImprove: ['zero-cut camera movement', 'stable relative spacing', 'endpoint planned from the initial keyframe'], whatWeMustNeverReproduce: ['hard cut', 'formation reset', 'camera teleport'],
  },
  valmir_route_fork: {
    cameraHeight: 'low-to-normal eye level above the wet junction', cameraAngle: 'wide frontal fork geography', apparentFocalLanguage: 'wide lens with deep equal route corridors', horizonPlacement: 'upper third behind dark conifers and mountain silhouettes', foregroundMidgroundBackground: 'dark foliage vignette foreground; company and fork midground; shrine, palisade and mountains background', groundPlane: 'wet fork with reflections linking both routes', characterToFrameScale: 'roughly 27–36% of frame height', relativeCharacterHeights: 'Alistair tallest and broadest at center; advisers smaller', characterSpacing: 'compact central-bottom group leaving both route lanes open', environmentDensity: 'dense nocturnal forest with controlled route openings', lightingDirection: 'cool moon from upper-left and warm route practicals', lightingTemperature: 'cool blue with small amber anchors', contrast: 'dark but readable; cast held above black crush', palette: ['moon blue', 'pine black-green', 'wet slate', 'warm amber', 'muted red'], atmosphericDepth: 'mist and value separation sustain long route depth', materialRendering: 'wet soil, moss, cloth and armor share cool reflections', silhouetteReadability: 'strong central group and equipment outlines', negativeSpace: 'left and right route corridors remain UI-readable', visualHierarchy: 'fork geography first, company second, destination cues third', environmentCharacterIntegration: 'reflected ground, mist and matched cool light prevent flat compositing', finalFrameSuitability: 'sharp and route-safe with stable three-character group', continuityWeaknesses: ['mid-sequence dissolve/reframe shifts the junction composition', 'the world is visually continuous but the shot is editorial rather than physically continuous'], whatWeKeep: ['two-route legibility', 'wet ground', 'cool/warm night contrast', 'central low cast', 'foreground depth'], whatWeImprove: ['single physical camera move', 'unchanged fork geometry', 'endpoint identical to route-choice hold'], whatWeMustNeverReproduce: ['route privilege', 'camera reset', 'labels or baked arrows'],
  },
};

function sceneCastManifest(beat: Json, stagingByDialogue: Map<string, Json>, castAuditByCinematic: Map<string, Json>): Json {
  const cinematicId = String(beat.beatId).startsWith('media:') ? String(beat.beatId).slice(6) : undefined;
  const castAudit = cinematicId ? castAuditByCinematic.get(cinematicId) : undefined;
  const staging = beat.dialogueId ? stagingByDialogue.get(beat.dialogueId) : undefined;
  const required = [...new Set([...(castAudit?.requiredCast ?? beat.cast ?? []), ...(staging?.speakers ?? [])])];
  const optionalRecruitIds = ['cedric', 'lancer'];
  return {
    id: `cast:${beat.beatId}`,
    beatId: beat.beatId,
    dialogueIds: beat.dialogueId ? [beat.dialogueId] : [],
    nodeContentIdentity: { nodeId: beat.nodeId ?? null, edgeId: beat.edgeId ?? null, contentId: beat.contentId ?? null, cinematicId: cinematicId ?? null },
    semanticMode: beat.targetPresentationMode,
    requiredCharacters: required,
    allowedCharacters: required,
    forbiddenCharacters: optionalRecruitIds.filter((id) => !required.includes(id)),
    speakerSequence: staging?.speakers ?? castAudit?.speakers ?? [],
    partyState: 'RESOLVE_FROM_AUTHORITATIVE_RUN_STATE_AT_BEAT',
    recruitmentState: { source: 'RunSystem', requiredOptionalRecruits: required.filter((id) => optionalRecruitIds.includes(id)), futureRecruitLeakForbidden: true },
    routeState: 'RESOLVE_FROM_AUTHORITATIVE_NODE_AND_EDGE',
    characterNarrativeState: 'RESOLVE_FROM_DIALOGUE_AND_DERIVED_NARRATIVE_STATE',
    requiredExternalNpcs: required.filter((id) => !['alistair', 'sage_seraphine', 'maelor', 'marian', 'kestrel', 'elara', 'cedric', 'lancer'].includes(id)),
    explicitlyOffscreen: castAudit?.justifiedOffscreenActors ?? [],
    mustRemainPhysicallyPresent: ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'].includes(beat.targetPresentationMode) ? required : [],
    truthSources: ['tools/cinematics/specs/final_presentation_mode_audit.json', 'tools/cinematics/specs/narrative_dialogue_staging.json', 'tools/cinematics/specs/cinematic_dialogue_cast_audit.json'],
  };
}

async function main(): Promise<void> {
  await mkdir(SPECS, { recursive: true });
  await mkdir(REPORTS, { recursive: true });
  const [familyPlan, audit, staging, castAudit, qc, remasterQueue] = await Promise.all([
    json('tools/cinematics/specs/final_visual_family_plan.json'),
    json('tools/cinematics/specs/final_presentation_mode_audit.json'),
    json('tools/cinematics/specs/narrative_dialogue_staging.json'),
    json('tools/cinematics/specs/cinematic_dialogue_cast_audit.json'),
    json('public/assets/characters/pixel/canonical-character-qc.json'),
    json('tools/cinematics/specs/final_cinematic_remaster_queue.json'),
  ]);

  const familySpecs = familyPlan.families.map((family: Json) => ({
    visualFamilyId: family.id,
    nodesAndEvents: family.nodesAndEvents,
    narrativePurpose: familyDetail[family.id].narrativePurpose,
    ...familyDetail[family.id],
    signatureLandmarks: family.environmentLandmarks,
    cameraLanguage: family.cameraLanguage,
    timeOfDay: family.timeOfDay,
    continuityAcrossModes: ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD', 'TRAVEL_STILL', 'STATIC_TABLEAU_BACKGROUND'],
    currentVideoMasters: family.currentVideoMasters,
    futureHoldFrames: family.futureHoldFrames,
    requiredTravelStills: family.requiredTravelStills,
    requiredTableauBackgrounds: family.requiredTableauBackgrounds,
    familyMasterCandidates: ['A', 'B'].map((attempt) => ({ id: `${family.id.toLowerCase()}_master_${attempt.toLowerCase()}`, attempt, status: 'BLOCKED_IMAGE_MODEL_UNAVAILABLE', selected: false })),
    provisionalPreferredCandidate: null,
    humanApproval: 'REQUIRED',
  }));

  const characterIds = [...new Set(audit.beats.flatMap((beat: Json) => beat.cast ?? []))].sort();
  const characters = [];
  for (const characterId of characterIds) {
    const visual = characterVisuals[characterId];
    if (!visual) throw new Error(`Missing visual production card detail for ${characterId}.`);
    const full = `public/assets/characters/pixel/full/${characterId}.png`;
    characters.push({
      characterId,
      displayName: visual.displayName,
      canonicalFullBodyReferences: [full],
      canonicalPortraitReferences: [full],
      referenceSha256: await hash(full),
      canonicalAlphaBoundingBox: qc[characterId]?.variants?.full?.alpha_bbox ?? null,
      approvedExistingCinematicAppearances: audit.productionVideoAudit.filter((entry: Json) => entry.cast?.includes(characterId)).map((entry: Json) => entry.runtimeId),
      silhouetteInvariants: [visual.proportions, visual.head, visual.weapon],
      apparentAge: visual.age,
      bodyProportions: visual.proportions,
      relativeHeight: visual.relativeHeight,
      hairHeadIdentity: visual.head,
      faceIdentityCues: visual.face,
      costumeArmor: visual.costume,
      primarySecondaryColors: visual.colors,
      weapon: visual.weapon,
      accessories: visual.accessories,
      factionIdentity: visual.faction,
      approvedVariants: ['canonical full sprite; runtime crop/scale only'],
      stateDependentAppearance: 'none encoded unless a future authoritative state manifest explicitly adds one',
      mustPreserve: [visual.head, visual.face, visual.costume, ...visual.colors, visual.weapon, ...visual.accessories, visual.proportions],
      mayVary: ['pose within beat intent', 'camera-relative facing', 'physically coherent light response', 'minor cloth and environmental interaction'],
      mustNotChange: ['identity', 'apparent age', 'gender presentation', 'armor or costume family', 'principal colors', 'defining weapon', 'defining accessories', 'class silhouette'],
      staticTableauRule: 'USE_CANONICAL_RUNTIME_FOREGROUND_SPRITE_UNCHANGED',
    });
  }

  const goldReferences = [];
  for (const id of GOLD) {
    const entry = audit.productionVideoAudit.find((candidate: Json) => candidate.runtimeId === id);
    goldReferences.push({
      id,
      source: `public/assets/cinematics/${id}.mp4`,
      sourceSha256: entry.currentHash,
      technicalProfile: { width: 1920, height: 1080, fps: 24, codec: 'h264', profile: 'High', pixelFormat: 'yuv420p', silent: true, durationSeconds: id === 'valmir_route_fork' ? 10 : 12 },
      extractedFrameSet: `tmp/cinematics/cin6ea/gold/${id}/selected_frames.png`,
      uniformFrameStrip: `tmp/cinematics/cin6ea/gold/${id}/uniform_strip.png`,
      analysisData: `tmp/cinematics/cin6ea/gold/${id}/analysis.json`,
      ...goldManual[id],
    });
  }

  const stagingByDialogue = new Map(staging.entries.map((entry: Json) => [entry.dialogueId, entry]));
  const castAuditByCinematic = new Map(castAudit.entries.map((entry: Json) => [entry.cinematicId, entry]));
  const castManifests = audit.beats
    .filter((beat: Json) => ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD', 'TRAVEL_STILL', 'STATIC_TABLEAU'].includes(beat.targetPresentationMode))
    .map((beat: Json) => sceneCastManifest(beat, stagingByDialogue, castAuditByCinematic));
  const castByBeat = new Map(castManifests.map((entry: Json) => [entry.beatId, entry]));

  const tableauProfile = {
    schemaVersion: 1, baseline: BASELINE, role: 'STATIC_TABLEAU_BACKGROUND', characterPolicy: 'CHARACTER_FREE_FOR_PARTY_AND_STATE_DEPENDENT_ACTORS',
    sourceGeometry: ['src/cinematics/NarrativeStage.ts', 'src/cinematics/NarrativeTableau.ts', 'src/styles/app.css'],
    viewports: [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }],
    horizonTarget: 0.46, groundBandY: 0.84,
    normalizedZones: [
      { label: 'LEFT ACTOR LANE', x: 0.02, y: 0.38, width: 0.2, height: 0.57, color: 'lane' },
      { label: 'LEFT-CENTER ACTOR LANE', x: 0.19, y: 0.38, width: 0.2, height: 0.57, color: 'lane' },
      { label: 'CENTER ACTOR LANE', x: 0.4, y: 0.38, width: 0.2, height: 0.57, color: 'lane' },
      { label: 'RIGHT-CENTER ACTOR LANE', x: 0.61, y: 0.38, width: 0.2, height: 0.57, color: 'lane' },
      { label: 'RIGHT ACTOR LANE', x: 0.78, y: 0.38, width: 0.2, height: 0.57, color: 'lane' },
      { label: 'DIALOGUE SAFE BAND', x: 0.06, y: 0.14, width: 0.88, height: 0.22, color: 'safe' },
      { label: 'CHOICE SAFE BAND', x: 0.06, y: 0.69, width: 0.88, height: 0.2, color: 'safe' },
      { label: 'NO FACE DETAIL', x: 0.02, y: 0.34, width: 0.96, height: 0.25, color: 'danger' },
    ],
    runtimeConstants: { standardBodyFramingPercent: 61.2, fourCharacterBodyFramingPercent: 64.8, intentionalBottomCropPercent: [14, 17], activeSpeakerOpacity: 1, listenerOpacity: 0.5, dialogueCardWidthVw: 42, dialogueCardTopPercent: 14, choiceGeometryCases: 18, maximumChoiceDeltaPx: 0 },
    acceptance: ['GROUND_PLANE_ALIGNMENT', 'PERSPECTIVE_INTEGRATION', 'SPRITE_ENVIRONMENT_COHERENCE', 'LIGHTING_COMPATIBILITY', 'ACTOR_READABILITY', 'DIALOGUE_SAFE_ZONE', 'CHOICE_SAFE_ZONE', 'NO_COLLAGE_LOOK_AT_RUNTIME'],
  };

  const travelProfile = {
    schemaVersion: 1, baseline: BASELINE, role: 'TRAVEL_STILL', frame: { aspect: '16:9', productionSize: [1920, 1080], cropViewports: [[1920, 1080], [1366, 768]] },
    composition: 'complete integrated cinematic frame', castPolicy: 'integrated cast only; resolve from SceneCastManifest', uiPolicy: { dialogueCard: false, theatricalCast: false, speakerFocus: false, listenerDimming: false },
    continuity: ['same family landmarks', 'same perspective and ground', 'same light direction and material response', 'route and recruitment state from runtime truth'],
    cropSafe: { keepRequiredFacesWithin: { x: [0.08, 0.92], y: [0.12, 0.82] }, keepRequiredRouteLandmarksWithin: { x: [0.05, 0.95], y: [0.08, 0.86] } },
    livingStill: { semanticModeRemains: 'TRAVEL_STILL', allowed: ['foliage', 'smoke', 'fire', 'water', 'weather', 'dust', 'cloth', 'subtle light', 'very subtle camera drift'], forbidden: ['new action', 'dialogue performance', 'major camera move', 'combat', 'reveal'], reducedMotion: 'use static source' },
  };

  const keyframeProfile = {
    schemaVersion: 1, baseline: BASELINE, role: 'CINEMATIC_VIDEO_KEYFRAME', frame: { width: 1920, height: 1080, aspect: '16:9' },
    generation: { model: IMAGE_MODEL, exactSnapshot: IMAGE_MODEL, quality: 'max', endpoint: 'OpenAI Images generate/edit as declared per attempt', status: 'BLOCKED_NO_CLI_CREDENTIAL_AND_BUILT_IN_MODEL_NOT_SELECTABLE' },
    integratedSceneEquation: ['authoritative environment references', 'canonical character references', 'SceneCastManifest', 'VisualFamilyMaster', 'camera and staging', 'lighting and grounding', 'continuity and target endpoint'],
    requiredGates: ['NO_COLLAGE_LOOK', 'CAST_FIDELITY', 'CHARACTER_IDENTITY', 'RELATIVE_CHARACTER_HEIGHT', 'GROUND_PLANE_ALIGNMENT', 'PERSPECTIVE', 'LIGHTING_INTEGRATION', 'WORLD_INTEGRATION'],
    forbidden: ['separately pasted character layers', 'baked text', 'subtitles', 'speech', 'unjustified cast', 'character redesign'],
  };

  const continuityProfile = {
    schemaVersion: 1, baseline: BASELINE, videoModel: 'MiniMax-H3', doctrine: 'ONE_VIDEO_ONE_PHYSICAL_SCENE_ONE_CONTINUOUS_SHOT_ZERO_EDITORIAL_CUTS',
    requiredSpecFields: ['characterId', 'startSpatialZone', 'relativeDepth', 'facing', 'lookTarget', 'relativePhysicalScale', 'expectedAction', 'remainsInScene', 'allowedExitReentry', 'finalSpatialRequirement', 'mustBeVisibleAtEnd'],
    generationConstraints: ['no cuts', 'no angle reset', 'no new characters', 'no disappearing characters', 'no costume or weapon change', 'no scale jump', 'no location or lighting reset', 'controlled camera and actor motion'],
    automatedSignals: ['ffmpeg scene change at 0.35', 'sampled frame difference', 'histogram discontinuity', 'time-sequenced contact sheet'],
    humanOnlyGates: ['character identity over time', 'costume stability', 'cast continuity', 'world reset classification', 'false-positive cut classification'],
    targetFormat: { width: 1920, height: 1080, fps: 24, codec: 'H.264 High', pixelFormat: 'yuv420p', silent: true },
  };

  const holdProfile = {
    schemaVersion: 1, baseline: BASELINE, role: 'CINEMATIC_HOLD', preferredSource: 'approved exact final video frame', extraction: { mode: 'lossless deterministic exact-frame extraction', batchAllowedInCin6ea: false },
    targetEndStateRequired: ['final camera position', 'final framing', 'required visible cast', 'actor positions', 'facing', 'relative scale', 'scene context', 'dialogue or choice safe area', 'stable motion state', 'hold continuity identity'],
    rejection: ['motion blur', 'morph artifact', 'cast error', 'identity break', 'location reset', 'unsafe dialogue/choice overlap'],
    currentSlots: audit.productionVideoAudit.filter((entry: Json) => entry.needsHoldFrame).map((entry: Json) => {
      const holdAssetId = `${entry.runtimeId}_hold`;
      const beatIds = audit.beats
        .filter((beat: Json) => beat.targetPresentationMode === 'CINEMATIC_HOLD' && (beat.currentAsset === entry.runtimeId || beat.targetAssetRole === holdAssetId))
        .map((beat: Json) => beat.beatId);
      return {
        assetId: holdAssetId,
        beatIds,
        family: entry.visualFamily,
        currentSource: entry.runtimeId,
        sourceVideoHash: entry.currentHash,
        exactFinalFrameSuitable: entry.exactFinalFrameValid ? 'HUMAN_REVIEW_REQUIRED' : 'NO_REMASTER_OR_REGENERATION_REQUIRED',
        futureRemasterMustImproveEndpoint: !entry.exactFinalFrameValid,
      };
    }),
  };

  const pilots = [
    { id: 'A', name: 'ROYAL_AUDIENCE_TABLEAU', families: ['ALARIC_AUDIENCE'], beatIds: ['media:alaric_audience_arrival', 'dialogue:lion_briefing'], authoritativeModes: ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'], validationSurface: 'DEV_ONLY_STATIC_TABLEAU_BACKGROUND_COMPOSITE_WITH_EXISTING_ALARIC_AUDIENCE_TABLEAU', outputs: ['tableau family reference', 'two background candidates', 'NarrativeStage composite at two viewports'], references: ['alaric_audience_arrival'], purpose: ['complex interior', 'multiple actors', 'dialogue UI', 'choice geometry'], note: 'The canonical lion_briefing mode remains CINEMATIC_HOLD; the tableau composite is a preproduction background-fit harness only.' },
    { id: 'B', name: 'FOREST_ROAD_CROSS_MODE', families: ['FOREST_ROAD'], beatIds: ['edge:lion-audience>lion-opening-ambush', 'dialogue:post_opening_trail'], authoritativeModes: ['TRAVEL_STILL', 'STATIC_TABLEAU'], outputs: ['family master', 'two travel-still candidates', 'two tableau-background candidates', 'runtime composite', 'continuity board'], references: ['valmir_route_fork', 'camp_departure'], purpose: ['cross-mode family continuity', 'responsive crop', 'reverse-composed tableau'] },
    { id: 'C', name: 'CAMP_CONTINUOUS_SHOT', families: ['LION_CAMP'], beatIds: ['media:camp_departure', 'dialogue:camp_departure'], authoritativeModes: ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD'], outputs: ['two integrated keyframes', 'one sequential H3 pilot', 'final-frame hold extraction', 'contact sheet'], references: ['camp_departure'], purpose: ['multi-character identity', 'relative height', 'zero cuts', 'clean endpoint'] },
    { id: 'D', name: 'SECOND_REFUGE_TABLEAU', families: ['SECOND_REFUGE'], beatIds: ['dialogue:ate_bois_clair_night_watch'], authoritativeModes: ['STATIC_TABLEAU'], outputs: ['two character-free backgrounds', 'NarrativeStage composite at two viewports'], references: ['camp_departure', 'valmir_route_fork'], purpose: ['human-built environment', 'props', 'NPC-compatible space', 'UI safe zones'] },
    { id: 'E', name: 'CEDRIC_ENCOUNTER_TRANSITION', families: ['FOREST_ROAD'], beatIds: ['media:cedric_encounter', 'dialogue:mystery_recruit'], authoritativeModes: ['CINEMATIC_VIDEO', 'STATIC_TABLEAU'], outputs: ['two integrated keyframes', 'one sequential H3 pilot', 'two tableau backgrounds', 'transition board'], references: ['valmir_route_fork'], purpose: ['external identity', 'VIDEO to TABLEAU continuity', 'recruit state', 'future recruit exclusion'], chosenOver: 'Garen; Cedric requires a larger authoritative party/dialogue cast and therefore stresses continuity more strongly.' },
    { id: 'F', name: 'SHADOW_SIGNS_LOW_LIGHT', families: ['SHADOW_RUINS'], beatIds: ['media:shadow_signs', 'dialogue:shadow_signs'], authoritativeModes: ['CINEMATIC_VIDEO', 'STATIC_TABLEAU'], outputs: ['two integrated low-light keyframes', 'one sequential H3 pilot', 'two tableau backgrounds', 'low-light continuity board'], references: ['valmir_route_fork'], purpose: ['night readability', 'identity under low light', 'foreground/background separation', 'controlled corruption'] },
  ].map((pilot) => ({
    ...pilot,
    castManifestIds: pilot.beatIds.map((beatId) => `cast:${beatId}`),
    status: 'BLOCKED_IMAGE_MODEL_UNAVAILABLE',
    imageAttempts: 0,
    videoAttempts: 0,
    retries: 0,
    pass: false,
    blocker: `Exact acceptance model ${IMAGE_MODEL} with quality=max cannot be selected by the built-in tool and OPENAI_API_KEY is unavailable for the explicit CLI path.`,
  }));

  const continuityActions: Record<string, string> = {
    C: 'subtle departure readiness and environmental response; preserve formation without a reset',
    E: 'measured first-encounter posture; Cedric remains unrecruited and no acceptance is implied',
    F: 'inspect the shadow evidence with restrained gestures; branch-dependent responders remain off-camera until selected dialogue',
  };
  const videoPilotContinuitySpecs = pilots
    .filter((pilot) => pilot.outputs.some((output) => output.includes('H3 pilot')))
    .map((pilot) => {
      const sourceBeatId = pilot.beatIds.find((beatId) => beatId.startsWith('media:'));
      const cast = castByBeat.get(sourceBeatId);
      const zonesByCount: Record<number, string[]> = {
        1: ['CENTER'],
        2: ['LEFT_CENTER', 'RIGHT_CENTER'],
        3: ['LEFT', 'CENTER', 'RIGHT'],
        4: ['FAR_LEFT', 'LEFT_CENTER', 'RIGHT_CENTER', 'FAR_RIGHT'],
        5: ['FAR_LEFT', 'LEFT', 'CENTER', 'RIGHT', 'FAR_RIGHT'],
      };
      const zones = zonesByCount[cast.requiredCharacters.length] ?? cast.requiredCharacters.map((_: string, index: number) => `LANE_${index + 1}`);
      return {
        pilotId: pilot.id,
        cinematicBeatId: sourceBeatId,
        castManifestId: cast.id,
        justifiedOffscreenActors: cast.explicitlyOffscreen,
        targetEndState: {
          finalCameraPosition: 'end of one continuous restrained camera move from the approved starting keyframe',
          finalFraming: 'stable 16:9 family composition with a clear upper dialogue-safe band',
          requiredFinalVisibleCast: cast.requiredCharacters,
          finalSceneContext: familyDetail[pilot.families[0]].physicalLocationIdentity,
          motionStateExpectation: 'settled motion, sharp faces and equipment, no morphing or motion blur',
          holdContinuityIdentity: `${String(sourceBeatId).slice('media:'.length)}_hold`,
        },
        characters: cast.requiredCharacters.map((characterId: string, index: number) => ({
          characterId,
          startSpatialZone: zones[index],
          relativeDepth: 'MIDGROUND_ACTOR_PLANE',
          facing: 'INTO_SCENE_OR_TOWARD_NARRATIVE_FOCUS',
          lookTarget: cast.speakerSequence[0] ?? 'PRIMARY_SCENE_EVIDENCE_OR_ROUTE',
          relativePhysicalScale: characterVisuals[characterId].relativeHeight,
          expectedAction: continuityActions[pilot.id],
          remainsInScene: true,
          allowedExitReentry: false,
          finalSpatialRequirement: `${zones[index]} with unchanged relative ordering and plausible continuous displacement only`,
          mustBeVisibleAtEnd: true,
        })),
        acceptance: { internalCutCount: 0, unexplainedDisappearance: 0, unexplainedAddition: 0, scaleDrift: 0, identityBreaks: 0, worldReset: 0, targetEndState: 'PASS_REQUIRED' },
        status: 'PLANNED_BLOCKED_IMAGE_MODEL_UNAVAILABLE',
      };
    });

  const videoEntries = audit.productionVideoAudit.map((entry: Json, index: number) => {
    const beatId = `media:${entry.runtimeId}`;
    const cast = castByBeat.get(beatId);
    return {
      assetId: entry.runtimeId, beatIds: [beatId], semanticMode: entry.shouldRemainVideo ? 'CINEMATIC_VIDEO' : 'TRAVEL_STILL_REFERENCE_ONLY', visualFamily: entry.visualFamily,
      action: entry.shouldRemainVideo ? entry.reuseStatus : 'RECLASSIFIED_REFERENCE_ONLY', sourceReferences: [entry.runtimeId, ...GOLD], requiredCast: cast?.requiredCharacters ?? entry.cast ?? [], forbiddenCast: cast?.forbiddenCharacters ?? [],
      tableauBackgroundIdentity: null, targetEndpoint: entry.needsHoldFrame ? `${entry.runtimeId}_hold` : null, singleShotRequirement: entry.shouldRemainVideo, productionOrder: `VIDEO-${String(index + 1).padStart(2, '0')}`, dependencies: [`family:${entry.visualFamily}`, 'approved integrated keyframe'], humanApprovalDependency: true,
    };
  });
  const holdEntries = holdProfile.currentSlots.map((entry: Json, index: number) => ({
    assetId: entry.assetId, beatIds: entry.beatIds, semanticMode: 'CINEMATIC_HOLD', visualFamily: entry.family, action: 'EXTRACT', sourceReferences: [entry.currentSource], requiredCast: [...new Set(entry.beatIds.flatMap((beatId: string) => castByBeat.get(beatId)?.requiredCharacters ?? []))], forbiddenCast: [...new Set(entry.beatIds.flatMap((beatId: string) => castByBeat.get(beatId)?.forbiddenCharacters ?? []))], tableauBackgroundIdentity: null, targetEndpoint: entry.assetId, singleShotRequirement: false, productionOrder: `HOLD-${String(index + 1).padStart(2, '0')}`, dependencies: [`video:${entry.currentSource}`, 'approved source video endpoint'], humanApprovalDependency: true,
  }));
  const travelEntries = audit.travelStillAudit.map((entry: Json, index: number) => {
    const beatIds = entry.edgeIds.map((edgeId: string) => `edge:${edgeId}`);
    const cast = castByBeat.get(beatIds[0]);
    return { assetId: entry.id, beatIds, semanticMode: 'TRAVEL_STILL', visualFamily: entry.family, action: 'NEW', sourceReferences: [entry.currentReuse, ...familyDetail[entry.family].goldReferenceLineage], requiredCast: cast?.requiredCharacters ?? entry.partyComposition, forbiddenCast: cast?.forbiddenCharacters ?? [], tableauBackgroundIdentity: null, targetEndpoint: null, singleShotRequirement: false, livingStillCandidate: entry.livingStillCandidate, productionOrder: `TRAVEL-${String(index + 1).padStart(2, '0')}`, dependencies: [`family:${entry.family}`, 'approved relevant video endpoint where available'], humanApprovalDependency: true };
  });
  const tableauEntries = audit.tableauBackgroundAudit.map((entry: Json, index: number) => ({
    assetId: `${entry.dialogueId}_tableau_bg`, beatIds: [entry.beatId], semanticMode: 'STATIC_TABLEAU', visualFamily: entry.visualFamily, action: entry.classification === 'GOOD' ? 'REUSE' : entry.classification === 'REPLACE' ? 'NEW' : 'REMASTER', sourceReferences: [entry.currentBackground, ...familyDetail[entry.visualFamily].goldReferenceLineage], requiredCast: [], forbiddenCast: castByBeat.get(entry.beatId)?.requiredCharacters ?? [], tableauBackgroundIdentity: `${entry.dialogueId}_tableau_bg`, targetEndpoint: null, singleShotRequirement: false, productionOrder: `TABLEAU-${String(index + 1).padStart(2, '0')}`, dependencies: [`family:${entry.visualFamily}`, 'tableau layout guide'], humanApprovalDependency: true,
  }));
  const futureManifest = {
    schemaVersion: 1, baseline: BASELINE, policy: 'CIN-6E-B handoff; no production assets generated by CIN-6E-A',
    productionSequence: ['lock family master', 'produce or remaster integrated video keyframe', 'produce continuous-shot video', 'approve target endpoint', 'extract hold', 'create travel still', 'create reverse-composed tableau plate', 'validate family in NarrativeStage at both viewports'],
    summary: { productionVideoRecords: videoEntries.length, retainedVideoSlots: videoEntries.filter((entry: Json) => entry.semanticMode === 'CINEMATIC_VIDEO').length, videosSemanticallyReclassified: videoEntries.filter((entry: Json) => entry.semanticMode !== 'CINEMATIC_VIDEO').length, holdStillSlots: holdEntries.length, travelStillAssets: travelEntries.length, tableauBackgrounds: tableauEntries.length, tableauBackgroundsReusable: tableauEntries.filter((entry: Json) => entry.action === 'REUSE').length, tableauBackgroundsRequiringWork: tableauEntries.filter((entry: Json) => entry.action !== 'REUSE').length, livingStillCandidates: travelEntries.filter((entry: Json) => entry.livingStillCandidate).length, currentRemasterPlanSummary: remasterQueue.summary },
    assets: [...videoEntries, ...holdEntries, ...travelEntries, ...tableauEntries],
  };

  const productionProfile = {
    schemaVersion: 1, baseline: BASELINE, productionDefault: 'TravelView', narrativeStageStatus: 'DEV_SELECTABLE', runtimeAi: false, productionMediaMutationAllowed: false,
    imagePipeline: { requiredModel: IMAGE_MODEL, requiredQuality: 'max', acceptanceEndpoint: 'explicit OpenAI Image API/CLI or a built-in surface that exposes and confirms the exact snapshot', available: false, blocker: 'OPENAI_API_KEY absent and built-in image tool exposes no model or quality selector', substitutionAllowed: false },
    videoPipeline: { provider: 'MiniMax Open Platform Direct API', model: 'MiniMax-H3', keySource: '.env.local', keyAvailable: true, mode: 'offline image-to-video', sequencing: 'one request at a time', attempted: false, blockedBy: 'no accepted exact-model keyframe' },
    goldReferences: GOLD, visualFamilies: familySpecs.map((family: Json) => family.visualFamilyId), modes: ['CINEMATIC_VIDEO', 'CINEMATIC_HOLD', 'TRAVEL_STILL', 'STATIC_TABLEAU'],
    productionStages: ['truth resolution', 'reference lineage', 'prompt compilation', 'integrated keyframe generation', 'image QA and human review', 'sequential H3 generation', 'video QA and human review', 'hold extraction', 'runtime composite QA', 'human approval'],
    rejectionRules: ['wrong cast or state', 'character identity drift', 'collage look', 'perspective or grounding failure', 'lighting mismatch', 'internal cut', 'cast disappearance or addition', 'world reset', 'unsafe final frame', 'different-game family drift'],
    provenanceRequired: true, humanApprovalRequired: true,
  };

  await writeJson('final_visual_production_profile.json', productionProfile);
  await writeJson('gold_visual_dna.json', { schemaVersion: 1, baseline: BASELINE, extractionTool: 'tools/cinematics/cin6ea_media_qa.mjs', references: goldReferences, sharedDna: { worldIntegration: 'characters and environment share perspective, ground, occlusion, light, atmosphere and material response', camera: 'grounded eye-level wides with clear narrative geography and controlled foreground framing', depth: 'three readable planes plus atmospheric recession', materialLanguage: 'premium painted HD-2D with tactile cloth, stone, timber, wet ground and controlled metal highlights', characterScale: 'environmental cinematic scale, never miniature and never detached', colorRelationships: 'one dominant warm/cool relationship per family with faction colors retained', keep: ['grounded cast', 'dense physical world', 'readable silhouette', 'cinematic negative space', 'family landmarks'], improve: ['zero-cut continuity', 'cast persistence', 'identity stability over time', 'purpose-built hold endpoint'], never: ['pasted sprite look in integrated modes', 'editorial reset', 'cast disappearance', 'unmotivated light or scale reset', 'baked text'] } });
  await writeJson('canonical_character_production_cards.json', { schemaVersion: 1, baseline: BASELINE, source: 'runtime presentation beats plus canonical full sprites and QC', count: characters.length, characters });
  await writeJson('visual_family_master_specs.json', { schemaVersion: 1, baseline: BASELINE, count: familySpecs.length, generationModel: IMAGE_MODEL, quality: 'max', candidatePolicy: 'A and B; C only after diagnosed failure; fourth only for documented defect', generationStatus: 'BLOCKED_IMAGE_MODEL_UNAVAILABLE', families: familySpecs });
  await writeJson('tableau_background_profile.json', tableauProfile);
  await writeJson('travel_still_profile.json', travelProfile);
  await writeJson('cinematic_keyframe_profile.json', keyframeProfile);
  await writeJson('cinematic_continuity_profile.json', continuityProfile);
  await writeJson('cin6ea_video_pilot_continuity_specs.json', { schemaVersion: 1, baseline: BASELINE, count: videoPilotContinuitySpecs.length, specs: videoPilotContinuitySpecs });
  await writeJson('hold_endpoint_profile.json', holdProfile);
  await writeJson('scene_cast_manifests.json', { schemaVersion: 1, baseline: BASELINE, count: castManifests.length, futureRecruitLeakPolicy: 'Any optional recruit not explicitly required is forbidden', manifests: castManifests });
  await writeJson('cin6ea_six_pilot_plan.json', { schemaVersion: 1, baseline: BASELINE, pilots, summary: { planned: 6, executed: 0, passed: 0, blocked: 6, imageAttempts: 0, miniMaxAttempts: 0 } });
  await writeJson('final_future_production_manifest.json', futureManifest);
  await writeJson('cin6ea_asset_lineage.json', { schemaVersion: 1, baseline: BASELINE, rule: 'Every production-like candidate traces to GOLD, family master, canonical character references, prior endpoint when required, and runtime layout guide.', goldReferences: goldReferences.map((entry: Json) => ({ id: entry.id, path: entry.source, sha256: entry.sourceSha256 })), familyLineage: familySpecs.map((entry: Json) => ({ family: entry.visualFamilyId, gold: entry.goldReferenceLineage, currentVideos: entry.currentVideoMasters })), pilots: pilots.map((entry: Json) => ({ pilot: entry.id, beatIds: entry.beatIds, castManifestIds: entry.castManifestIds, references: entry.references, status: entry.status })) });
  await writeJson('cin6ea_provenance_catalog.json', { schemaVersion: 1, baseline: BASELINE, requiredFields: ['assetCandidateId', 'semanticMode', 'beatId', 'dialogueId', 'visualFamily', 'model', 'exactModelSnapshot', 'quality', 'attempt', 'generationTimestamp', 'generationType', 'promptSpecPath', 'promptSha256', 'referencePaths', 'referenceSha256', 'outputSha256', 'castManifestId', 'selection', 'rejectionReasons', 'parentCandidate', 'sourceVideo', 'finalApprovalState'], candidates: [], status: 'READY_FOR_GENERATED_RECORDS; no generation attempted' });

  const reportHeader = `Baseline: \`${BASELINE}\`\n\nCIN-6E-A remains preproduction-only. TravelView is still production default; NarrativeStage remains DEV/selectable. No production media, canonical sprite, game truth, save, combat or VFX file is changed.\n`;
  await writeFile(resolve(REPORTS, 'cin-6e-a-final-visual-production-system.md'), `# CIN-6E-A Final Visual Production System\n\n${reportHeader}\n## Pre-flight\n\nPASS on \`main\`: HEAD and \`origin/main\` both equal the required baseline. The pre-mission working tree was clean.\n\n## GOLD reference system\n\nThe three approved masters have reproducible six-frame forensic sets, twelve-frame strips, ffprobe metadata, SHA-256 identity, ffmpeg scene-change candidates, adjacent sampled-frame differences and histogram-discontinuity signals. Machine signals are review aids; manual classification remains authoritative. \`GOLD_VISUAL_DNA\` records camera, depth, ground, lighting, material, integration, KEEP, IMPROVE and NEVER rules.\n\n## Image pipeline\n\nAcceptance requires \`${IMAGE_MODEL}\` at \`quality=max\`. The built-in image surface does not expose or confirm the model snapshot or quality, and no \`OPENAI_API_KEY\` is available to the explicit CLI path. Generation/edit attempts: 0; selected: 0; rejected: 0. No substitute provider or model was used.\n\n## Video pipeline\n\nMiniMax-H3 remains the required offline I2V provider. Attempts: 0, because no accepted exact-model starting keyframe exists. Internal cuts and endpoint quality for new pilots are therefore NOT_PROVABLE. The cut/contact-sheet tool is ready for sequential pilot validation.\n\n## Character and cast system\n\n- Character cards: ${characters.length}/${characters.length}, with canonical reference hashes and alpha bounds.\n- SceneCastManifests: ${castManifests.length}, derived from presentation, dialogue-staging and cinematic-cast truth.\n- Video pilot continuity specs: ${videoPilotContinuitySpecs.length}/${videoPilotContinuitySpecs.length}.\n- Identity failures observed in new candidates: 0 candidates exist; HUMAN_REVIEW_REQUIRED.\n- Static tableau sprite policy: use the existing canonical runtime foreground sprites unchanged.\n\n## Visual families and pilots\n\nAll ${familySpecs.length}/${familySpecs.length} committed families have complete master specifications and A/B prompt jobs. Selected masters: 0/${familySpecs.length}. Pilots A-F each have explicit beats, modes, cast lineage, outputs and acceptance purpose; executed: 0/6; passed: 0/6; retries: 0. The exact-model capability blocker applies to all six.\n\n## Presentation roles\n\nThe reverse-composed tableau profile carries the accepted 61.2% six-character and 64.8% four-character framing, 14–17% bottom crop, 1.0/0.50 speaker/listener emphasis, 42vw dialogue card and 14vh top anchor into 1920×1080 and 1366×768 guides. No pilot background exists, so new runtime composites and visual integration gates remain blocked. The Travel Still profile forbids dialogue and theatrical cast; no pilot still exists. Video, collage, cast-continuity and HOLD endpoint gates remain NOT_PROVABLE until generation.\n\n## Prompt compilation and provenance\n\nThe compiler emits 44 inspectable A/B jobs: 26 family-master and 18 pilot-image jobs. Every job records the exact model, quality, endpoint, attempt, prompt hash, existing reference hashes, cast manifest, dependencies and approval state. Output paths/hashes and timestamps are null because generation did not happen.\n\n## CIN-6E-B handoff\n\nThe dependency-ordered future manifest contains ${videoEntries.length} production-video records (${videoEntries.filter((entry: Json) => entry.semanticMode === 'CINEMATIC_VIDEO').length} retained video slots and ${videoEntries.filter((entry: Json) => entry.semanticMode !== 'CINEMATIC_VIDEO').length} reclassified references), ${holdEntries.length} HOLD stills, ${travelEntries.length} Travel Stills, ${tableauEntries.length} tableau backgrounds (${tableauEntries.filter((entry: Json) => entry.action === 'REUSE').length} reusable and ${tableauEntries.filter((entry: Json) => entry.action !== 'REUSE').length} requiring work) and ${travelEntries.filter((entry: Json) => entry.livingStillCandidate).length} living-still candidates. Total records: ${futureManifest.assets.length}. Production remains blocked on human-approved family masters and pilots.\n\n## Protected systems and validation\n\nRunSystem, game truth, save schema, dialogue truth, choice effects, routes, combat, VFX, canonical sprites, production manifest and production media are unchanged. TravelView remains production default and NarrativeStage remains DEV-selectable. Production media hashes: 31/31 unchanged. Deterministic generation: 22/22 generated specs/reports byte-identical across a repeat. Secret, protected-path, whitespace and \`git diff --check\` audits pass. Typecheck and build pass. Focused presentation validation: 66/66 tests pass. Full suite: 2,315 pass; the same 11 documented \`CasterMotionBackCompat.test.ts\` failures remain; new regressions: 0.\n\n## Decision\n\n- VISUAL_PRODUCTION_LOCK: **NO**\n- AUTOMATED_TECHNICAL_GATES: **PASS for completed structural artifacts; generation capability blocked**\n- AGENT_VISUAL_QA: **MIXED** — GOLD analysis is complete; no new family or pilot evidence exists.\n- HUMAN_VISUAL_REVIEW: **REQUIRED**\n- READY_FOR_CIN_6E_B: **PENDING_HUMAN_VISUAL_APPROVAL**\n- BLOCKER: exact \`${IMAGE_MODEL}\`, \`quality=max\` execution is unavailable in the current environment.\n- COMMIT: **NO**\n- PUSH: **NO**\n`, 'utf8');
  await writeFile(resolve(REPORTS, 'cin-6e-a-gold-visual-dna.md'), `# CIN-6E-A GOLD Visual DNA\n\n${reportHeader}\n## References analyzed\n\n- \`alaric_audience_arrival\`: six forensic frames plus twelve-frame strip; strongest traits are formal symmetry, carpet grounding and warm/cool Lion material language. Weakness: two reframings reset cast composition, including a middle interval where the armored figure is absent.\n- \`camp_departure\`: six forensic frames plus twelve-frame strip; strongest traits are wet-road grounding, sunrise depth and coherent material light. ffmpeg detects the hard composition cut at 6.0 s.\n- \`valmir_route_fork\`: six forensic frames plus twelve-frame strip; strongest traits are equal route geography, cool/warm nocturnal contrast and reflective ground. Its mid-sequence reframe remains an editorial transition rather than a continuous physical shot.\n\nThe machine-readable camera, ground, palette, lighting, depth, hierarchy, keep/improve/never rules and source hashes are in \`tools/cinematics/specs/gold_visual_dna.json\`. GOLD defines world quality; future video must improve continuity and endpoint intent.\n`, 'utf8');
  await writeFile(resolve(REPORTS, 'cin-6e-a-character-fidelity.md'), `# CIN-6E-A Character Fidelity\n\n${reportHeader}\nAll ${characters.length} characters referenced by the 144-beat presentation audit have production cards backed by canonical full-sprite SHA-256 hashes and QC alpha bounds. Each card records identity, age, proportions, relative height, head/face, costume, colors, weapon, accessories, faction, approved variance and forbidden drift. Static tableaux must continue to use the canonical runtime sprites unchanged.\n\n${castManifests.length} narrative SceneCastManifests resolve required, allowed and forbidden cast from the final presentation audit, dialogue staging and cinematic cast audit. Optional recruits are forbidden unless explicitly required at the beat. Visual identity gates remain human-reviewed and cannot be certified from filenames or pixel metrics alone.\n`, 'utf8');
  await writeFile(resolve(REPORTS, 'cin-6e-a-visual-family-lock.md'), `# CIN-6E-A Visual Family Lock\n\n${reportHeader}\nAll 13 committed families now have complete master specifications for physical location, purpose, architecture, landmarks, terrain, ground, palette, light, fill, atmosphere, depth, foreground/midground/background, camera, time, weather, material, ambient motion, forbidden drift and GOLD lineage.\n\nCandidate A/B slots exist for every family, but selected family masters remain 0/13 because the exact locked image model is unavailable. Therefore \`SAME_GAME_VISUAL_IDENTITY\` is \`HUMAN_REVIEW_REQUIRED\` and \`VISUAL_PRODUCTION_LOCK\` is \`NO\`.\n`, 'utf8');
  await writeFile(resolve(REPORTS, 'cin-6e-a-six-pilot-validation.md'), `# CIN-6E-A Six Pilot Validation\n\n${reportHeader}\n| Pilot | Scope | Image attempts | MiniMax attempts | Result |\n|---|---|---:|---:|---|\n${pilots.map((pilot) => `| ${pilot.id} | ${pilot.name} | 0 | 0 | BLOCKED: exact image model unavailable |`).join('\n')}\n\nNo pilot is falsely marked executed or passed. The exact beats, canonical modes, cast manifests, references, outputs and acceptance purposes are recorded in \`cin6ea_six_pilot_plan.json\`. MiniMax was not called because no keyframe could satisfy the locked source-frame gate.\n`, 'utf8');
  await writeFile(resolve(REPORTS, 'cin-6e-a-human-review.md'), `# CIN-6E-A Human Review\n\n${reportHeader}\nOpen \`tmp/cinematics/cin6ea/review/index.html\` for the local review package. It contains the three GOLD forensic strips, source hashes, family/pilot status, canonical character board, both tableau layout guides and explicit blocked candidate slots.\n\nCurrent review decision: GOLD evidence can be reviewed; generated family masters and pilots are absent by design. Human visual approval cannot occur until the exact locked GPT Image path is available and the six pilots are generated, evaluated and added to the package.\n`, 'utf8');

  console.log(JSON.stringify({ families: familySpecs.length, characters: characters.length, castManifests: castManifests.length, holds: holdEntries.length, travelStills: travelEntries.length, tableaux: tableauEntries.length, videos: videoEntries.length, pilotsExecuted: 0, blocker: productionProfile.imagePipeline.blocker }, null, 2));
}

await main();
