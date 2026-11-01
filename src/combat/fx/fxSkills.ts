import type { FxElement } from './fxPalettes';
import type { FxAnchor, FxProjectile, FxRecipe, FxStep, FxStepKind } from './fxRecipes';
import { withMoveSound, withSoundMarks } from './fxSounds';

/**
 * Every hero skill and every enemy skill in use has its own signature, written
 * by hand and played exactly as written (see FxRecipe.authored). A hero class
 * owns a colour and a shape:
 *
 *   Warrior       gold and steel    wide claws, dust, a charge along the ground
 *   Paladin       holy white-gold   vertical light falling, clean domes
 *   Dark Knight   violet and blood  everything is pulled inward
 *   Lancer        azure             thin straight lines that pierce
 *   Dark Mage     shadow and fire   bolts, flames, the meteor
 *   White Mage    soft green        slow rising light, no violence, no shake
 *   Red Mage      scarlet and white twin elements that cross
 *   Enchanter     arcane violet     runes in orbit, links between allies
 *   Archer        mint              needle arrows, feathers
 *   Ninja         venom and black   fast thin cuts, smoke, almost no light
 *   Rogue         amber and steel   short jabs, traps, cracks in the floor
 *   Gunner        fire and smoke    muzzle flashes, shells, debris
 *
 * Two rules keep the field readable. A rune seal belongs to spells only, and
 * it is gone by the blow. A shock ring appears once, on the blow itself:
 * nothing circular ever fires after the impact.
 */
type Steps = FxStep[];

const s = (at: number, kind: FxStepKind, anchor?: FxAnchor, p?: FxStep['p'], extra: Partial<FxStep> = {}): FxStep => ({ at, kind, anchor, p, ...extra });

const skill = (id: string, element: FxElement, impactAt: number, duration: number, steps: Steps, extra: Partial<FxRecipe> = {}): FxRecipe => ({
  id, element, impactAt, duration, steps, authored: true, magic: steps.some((step) => step.kind === 'circle'), ...extra,
});

const ultimate = (id: string, element: FxElement, impactAt: number, duration: number, steps: Steps, extra: Partial<FxRecipe> = {}): FxRecipe =>
  skill(id, element, impactAt, duration, steps, { cinematic: true, ...extra });

const shake = (at: number, magnitude: number, duration: number, extra: Partial<FxStep> = {}): FxStep => s(at, 'shake', undefined, { magnitude, duration }, extra);
const lit = (at: number, element: FxElement, intensity: number, duration: number, anchor: FxAnchor = 'targetChest', extra: Partial<FxStep> = {}): FxStep =>
  s(at, 'light', anchor, { intensity, duration }, { element, ...extra });

// ------------------------------------------------------------ warrior

const warrior: Record<string, () => FxRecipe> = {
  // one downward blow, then the guard flies apart
  w_break_guard: () => skill('w_break_guard', 'gold', 0.1, 0.7, [
    s(0, 'slash', 'targetChest', { size: 3.2, angle: 0.15, thickness: 1, duration: 0.26 }, { element: 'steel' }),
    s(0.08, 'star', 'targetChest', { size: 1.5 }, { element: 'gold' }),
    s(0.1, 'burst', 'targetChest', { count: 18, speed: 4.6, up: 2.2, gravity: 9, size: 0.14, life: 0.6 }, { element: 'steel' }),
    lit(0.1, 'gold', 12, 0.35),
    shake(0.1, 0.26, 0.16),
  ]),
  // the blow lands where the charge ends: gold cut, dust thrown forward
  w_whirl: () => {
    const steps: Steps = [];
    for (let i = 0; i < 4; i++) steps.push(s(0.02 + i * 0.06, 'slash', 'sourceChest', { size: 4.2, angle: i * 1.57, flip: i % 2 === 1, thickness: 0.9, duration: 0.26 }, { element: i % 2 ? 'gold' : 'steel' }));
    steps.push(
      s(0.08, 'burst', 'sourceGround', { count: 22, speed: 3.8, up: 0.5, gravity: 4, size: 0.15, soft: true }, { element: 'earth' }),
      s(0.14, 'burst', 'targetGround', { count: 8, speed: 2, up: 2, gravity: 8, size: 0.12, stagger: 0.03 }, { cells: true, element: 'earth' }),
      s(0.26, 'star', 'targetChest', { size: 1.5 }, { element: 'steel', each: true }),
      lit(0.2, 'gold', 16, 0.5, 'sourceChest'),
      shake(0.26, 0.3, 0.22),
    );
    return skill('w_whirl', 'gold', 0.26, 0.95, steps);
  },
  // roar, charge along the line, three claw marks and a gold wake
  w_lion_surge: () => ultimate('w_lion_surge', 'gold', 0.95, 2.0, [
    s(0.02, 'burst', 'sourceGround', { count: 30, speed: 3, up: 0.7, gravity: 3, size: 0.15, soft: true }, { element: 'earth' }),
    s(0.06, 'motes', 'source', { count: 28, radius: 0.6, rise: 3.4 }, { element: 'gold' }),
    s(0.1, 'speedLines', undefined, { duration: 0.85 }, { element: 'gold' }),
    s(0.32, 'ring', 'sourceChest', { radius: 1.7, duration: 0.34, ground: false, from: 0.25 }, { element: 'gold' }),
    shake(0.32, 0.16, 0.2),
    s(0.68, 'streak', 'sourceChest', { width: 1.1, duration: 0.36 }, { to: 'farChest', element: 'gold' }),
    s(0.7, 'burst', 'targetGround', { count: 14, speed: 2.6, up: 2.2, gravity: 8, size: 0.15, stagger: 0.04 }, { cells: true, element: 'earth' }),
    s(0.8, 'slash', 'targetChest', { size: 4, angle: 0.5, ox: -0.75, thickness: 0.7, duration: 0.3 }, { element: 'gold' }),
    s(0.85, 'slash', 'targetChest', { size: 4.3, angle: 0.5, thickness: 0.7, duration: 0.3 }, { element: 'steel' }),
    s(0.9, 'slash', 'targetChest', { size: 4, angle: 0.5, ox: 0.75, thickness: 0.7, duration: 0.3 }, { element: 'gold' }),
    s(0.93, 'streak', 'sourceChest', { width: 1.3, duration: 0.5 }, { to: 'farChest', element: 'gold' }),
    s(0.95, 'star', 'targetChest', { size: 3.2, duration: 0.4 }, { element: 'gold' }),
    s(0.95, 'slowmo', undefined, { scale: 0.3, duration: 0.28 }),
    s(0.95, 'punch', 'targetChest', { duration: 0.5 }),
    s(0.95, 'flash', undefined, { opacity: 0.2 }, { element: 'gold' }),
    shake(0.95, 0.62, 0.42),
    lit(0.95, 'gold', 48, 0.9),
    s(0.97, 'burst', 'targetChest', { count: 34, speed: 6, up: 2.4, gravity: 7, size: 0.15, cone: 0.7, spray: 'through' }, { element: 'gold' }),
    s(1.0, 'burst', 'targetGround', { count: 26, speed: 2.4, up: 4.4, gravity: 7, size: 0.18, soft: true, stagger: 0.05 }, { cells: true, element: 'gold' }),
    s(1.02, 'slash', 'targetGround', { size: 3.6, angle: 0, oy: 0.5, thickness: 1.1, duration: 0.34, stagger: 0.04 }, { cells: true, element: 'gold' }),
    s(1.02, 'decal', 'targetGround', { radius: 0.62 }, { cells: true, element: 'gold' }),
    s(1.05, 'smoke', 'targetGround', { count: 6, spread: 0.4, size: 0.7, stagger: 0.04 }, { cells: true }),
  ], { flashElement: 'gold' }),
};

// ------------------------------------------------------------ paladin

const paladin: Record<string, () => FxRecipe> = {
  // the mace strikes, a blade of light answers, the barrier closes on the caster
  p_holy_strike: () => skill('p_holy_strike', 'holy', 0.1, 0.95, [
    s(0, 'slash', 'targetChest', { size: 2.6, angle: -0.1, thickness: 1, duration: 0.22 }, { element: 'holy' }),
    s(0.06, 'pillar', 'targetGround', { radius: 0.34, height: 5, duration: 0.42 }, { element: 'holy' }),
    s(0.1, 'star', 'targetChest', { size: 1.3 }, { element: 'holy' }),
    s(0.1, 'burst', 'targetChest', { count: 14, speed: 3, size: 0.1 }, { element: 'holy' }),
    lit(0.1, 'holy', 12, 0.4),
    shake(0.1, 0.18, 0.14),
    s(0.22, 'dome', 'sourceGround', { radius: 1.05, duration: 0.7 }, { element: 'holy' }),
  ]),
  // landing: one clean ring, then the barrier rises over every ally in reach
  p_interpose: () => skill('p_interpose', 'holy', 0.2, 1.05, [
    s(0.04, 'dome', 'targetGround', { radius: 1, duration: 0.95 }, { element: 'holy', each: true }),
    s(0.1, 'motes', 'target', { count: 14, radius: 0.6, rise: 2 }, { element: 'holy', each: true }),
    lit(0.1, 'holy', 12, 0.6, 'sourceChest'),
  ]),
  // a wall of light blades rises around the caster, domes close over the allies
  p_oathwall: () => skill('p_oathwall', 'holy', 0.3, 1.25, [
    s(0.02, 'shards', 'sourceGround', { count: 12, radius: 1.7, height: 1.7, duration: 1.15 }, { element: 'holy' }),
    s(0.18, 'dome', 'targetGround', { radius: 1.05, duration: 1.05 }, { element: 'holy', each: true }),
    s(0.2, 'dome', 'sourceGround', { radius: 1.25, duration: 1.05 }, { element: 'gold' }),
    s(0.3, 'motes', 'source', { count: 20, radius: 1.2, rise: 2 }, { element: 'gold' }),
    lit(0.2, 'holy', 16, 0.9, 'sourceChest'),
    shake(0.08, 0.12, 0.14),
  ]),
  // the sky opens over the zone, one column of judgement falls, smaller ones answer on every cell
  p_radiant_judgement: () => ultimate('p_radiant_judgement', 'holy', 1.05, 2.15, [
    s(0, 'pillar', 'source', { radius: 0.34, height: 7, duration: 0.95 }, { element: 'holy' }),
    s(0.05, 'orbit', 'source', { count: 14, radius: 0.9, duration: 0.95, rise: 2.4, spin: 3 }, { element: 'holy' }),
    s(0.1, 'circle', 'point', { radius: 2.8, duration: 1.05, spin: 0.7 }, { element: 'holy' }),
    s(0.3, 'glow', 'pointSky', { size: 4, duration: 0.8 }, { element: 'holy' }),
    s(0.45, 'burst', 'pointSky', { count: 40, speed: 0.6, up: -2, gravity: 4, size: 0.1, spread: 1.8, life: 1, soft: true }, { element: 'holy' }),
    s(0.92, 'pillar', 'point', { radius: 1.5, height: 15, duration: 1.15 }, { element: 'holy' }),
    s(1.05, 'pillar', 'targetGround', { radius: 0.34, height: 7, duration: 0.62, stagger: 0.07, origin: 'point' }, { cells: true, element: 'gold' }),
    s(1.05, 'star', 'targetChest', { size: 2.4 }, { element: 'holy', each: true }),
    s(1.05, 'ring', 'point', { radius: 3.4, duration: 0.6 }, { element: 'gold' }),
    s(1.05, 'slowmo', undefined, { scale: 0.42, duration: 0.3 }),
    s(1.05, 'punch', 'point', { duration: 0.5 }),
    s(1.05, 'flash', undefined, { opacity: 0.24 }, { element: 'holy' }),
    shake(1.05, 0.48, 0.34),
    lit(1.05, 'holy', 56, 1.1, 'point'),
    s(1.12, 'motes', 'point', { count: 36, radius: 2.2, rise: 3 }, { element: 'gold' }),
  ], { flashElement: 'holy' }),
};

// ------------------------------------------------------------ dark knight

const darkKnight: Record<string, () => FxRecipe> = {
  // the blade drags a void behind it and the curse sinks into the wound
  d_cursed_blade: () => skill('d_cursed_blade', 'shadow', 0.1, 0.85, [
    s(0, 'slash', 'targetChest', { size: 3, angle: 0.65, thickness: 0.75, duration: 0.26 }, { element: 'shadow' }),
    s(0.08, 'orb', 'targetChest', { radius: 0.75, duration: 0.42, implode: true, dark: true }, { element: 'shadow' }),
    s(0.1, 'star', 'targetChest', { size: 1 }, { element: 'shadow' }),
    s(0.14, 'motes', 'target', { count: 14, radius: 0.5, sink: true }, { element: 'shadow' }),
    lit(0.1, 'shadow', 10, 0.4),
    shake(0.1, 0.18, 0.14),
  ]),
  // blood drawn out of the air into the knight's chest
  d_blood_pact: () => skill('d_blood_pact', 'blood', 0.5, 1.25, [
    s(0, 'converge', 'source', { count: 40, radius: 2.8, duration: 0.55, height: 2.2, size: 0.12 }, { element: 'blood' }),
    s(0.1, 'orb', 'sourceChest', { radius: 1.1, duration: 0.42, implode: true, dark: true }, { element: 'blood' }),
    s(0.48, 'star', 'sourceChest', { size: 1.5 }, { element: 'blood' }),
    s(0.5, 'glow', 'sourceChest', { size: 1.4, duration: 0.6 }, { element: 'blood' }),
    s(0.54, 'motes', 'source', { count: 18, radius: 0.5, rise: 2.4 }, { element: 'blood' }),
    lit(0.5, 'blood', 14, 0.6, 'sourceChest'),
  ]),
  // a black sun rises, swallows the light, and what it takes flows back to the knight
  d_devouring_eclipse: () => ultimate('d_devouring_eclipse', 'shadow', 1.25, 2.5, [
    s(0, 'converge', 'source', { count: 36, radius: 2, duration: 1, height: 2.4 }, { element: 'shadow' }),
    s(0.1, 'circle', 'point', { radius: 2.8, duration: 1.2, spin: -1.6 }, { element: 'shadow' }),
    s(0.25, 'orb', 'pointSky', { radius: 2.6, duration: 1.1, dark: true }, { element: 'shadow' }),
    s(0.3, 'converge', 'point', { count: 70, radius: 4.6, duration: 0.95, height: 3.4, size: 0.12 }, { element: 'shadow' }),
    s(0.7, 'ring', 'point', { radius: 5, duration: 0.55, inward: true, from: 0.04 }, { element: 'shadow' }),
    s(1.0, 'bolt', 'targetChest', { duration: 0.32, width: 0.09 }, { to: 'pointSky', element: 'shadow', each: true }),
    s(1.12, 'orb', 'point', { radius: 3.2, duration: 0.3, implode: true, dark: true }, { element: 'shadow' }),
    s(1.25, 'flash', undefined, { opacity: 0.28, dark: true }),
    s(1.25, 'orb', 'targetChest', { radius: 1.3, duration: 0.42, dark: true }, { element: 'shadow', each: true }),
    s(1.25, 'star', 'targetChest', { size: 2.2 }, { element: 'shadow', each: true }),
    s(1.25, 'slowmo', undefined, { scale: 0.3, duration: 0.34 }),
    s(1.25, 'punch', 'point', { duration: 0.5 }),
    shake(1.25, 0.56, 0.4),
    lit(1.25, 'shadow', 40, 0.9, 'point'),
    s(1.3, 'decal', 'targetGround', { radius: 0.6 }, { cells: true, element: 'shadow' }),
    // the drain: life flows from each victim back to the knight
    ...[0, 0.12, 0.24].map((delay) => s(1.42 + delay, 'shot', 'targetChest', { size: 0.34, duration: 0.42, arc: 1, jitter: 0.5 }, { to: 'sourceChest', element: 'blood', each: true })),
    s(1.85, 'glow', 'sourceChest', { size: 2.2, duration: 0.5 }, { element: 'blood' }),
  ], { flashElement: 'shadow' }),
};

// ------------------------------------------------------------ lancer

const lancer: Record<string, () => FxRecipe> = {
  // a needle of azure that goes through the target
  l_long_thrust: () => skill('l_long_thrust', 'sky', 0.08, 0.6, [
    s(0.01, 'streak', 'sourceChest', { width: 0.3, duration: 0.2 }, { to: 'targetChest', element: 'sky' }),
    s(0.08, 'star', 'targetChest', { size: 1 }, { element: 'sky' }),
    s(0.08, 'burst', 'targetChest', { count: 16, speed: 6, up: 0.6, gravity: 2, size: 0.09, cone: 0.35, spray: 'through' }, { element: 'sky' }),
    lit(0.08, 'sky', 9, 0.3),
    shake(0.08, 0.16, 0.12),
  ]),
  // the butt of the spear: a short dull knock, not a thrust
  l_haft_recoil: () => skill('l_haft_recoil', 'sky', 0.06, 0.5, [
    s(0, 'slash', 'targetChest', { size: 1.7, angle: 1.45, thickness: 1.1, duration: 0.14 }, { element: 'sky' }),
    s(0.06, 'star', 'targetChest', { size: 0.95 }, { element: 'steel' }),
    s(0.06, 'burst', 'targetChest', { count: 10, speed: 2.6, up: 1, gravity: 6, size: 0.1 }, { element: 'steel' }),
    shake(0.06, 0.2, 0.12),
  ]),
  // the griffon's dive: straight down from the sky, then feathers of light
  l_griffon_jump: () => skill('l_griffon_jump', 'sky', 0.08, 0.95, [
    s(0, 'streak', 'sourceSky', { width: 0.55, duration: 0.16 }, { to: 'sourceGround', element: 'sky' }),
    s(0.06, 'ring', 'sourceGround', { radius: 2.9, duration: 0.42 }, { element: 'sky' }),
    s(0.08, 'burst', 'targetGround', { count: 10, speed: 2.4, up: 2.6, gravity: 8, size: 0.13 }, { cells: true, element: 'earth' }),
    s(0.08, 'star', 'targetChest', { size: 1.4 }, { element: 'sky', each: true }),
    s(0.1, 'burst', 'sourceChest', { count: 20, speed: 1.4, up: 3, gravity: 1, size: 0.12, life: 0.9, soft: true }, { element: 'sky' }),
    lit(0.08, 'sky', 16, 0.45, 'sourceChest'),
    shake(0.08, 0.38, 0.22),
  ]),
  // one line, perfectly straight: the thrust pierces every cell in turn and leaves lightning behind
  l_firmament_lance: () => ultimate('l_firmament_lance', 'sky', 1.0, 1.9, [
    s(0, 'pillar', 'source', { radius: 0.16, height: 12, duration: 0.82 }, { element: 'sky' }),
    s(0.05, 'orbit', 'source', { count: 10, radius: 0.5, duration: 0.8, rise: 3.2, spin: 7 }, { element: 'sky' }),
    s(0.78, 'star', 'sourceChest', { size: 1.8, duration: 0.2 }, { element: 'sky' }),
    s(0.84, 'streak', 'sourceChest', { width: 0.34, duration: 0.5 }, { to: 'farChest', element: 'sky' }),
    s(0.88, 'streak', 'sourceChest', { width: 1.1, duration: 0.6 }, { to: 'farChest', element: 'sky' }),
    s(0.9, 'star', 'targetGround', { size: 1.6, duration: 0.26, oy: 1.1, stagger: 0.022 }, { cells: true, element: 'sky' }),
    s(0.92, 'burst', 'targetGround', { count: 20, speed: 6.4, up: 1, gravity: 2, size: 0.11, cone: 0.32, spray: 'through', oy: 1.1, stagger: 0.022 }, { cells: true, element: 'sky' }),
    s(1.0, 'star', 'targetChest', { size: 2.6, duration: 0.36 }, { element: 'sky', each: true }),
    s(1.0, 'slowmo', undefined, { scale: 0.22, duration: 0.2 }),
    s(1.0, 'punch', 'targetChest', { duration: 0.42 }),
    s(1.0, 'flash', undefined, { opacity: 0.22 }, { element: 'sky' }),
    shake(1.0, 0.42, 0.26),
    lit(1.0, 'sky', 44, 0.7),
    s(1.08, 'bolt', 'targetGround', { duration: 0.5, width: 0.07, oy: 1.1, stagger: 0.03 }, { to: 'sourceChest', cells: true, element: 'sky' }),
  ], { flashElement: 'sky' }),
};

// ------------------------------------------------------------ dark mage

const darkMage: Record<string, () => FxRecipe> = {
  // a black bolt thrown from the hand, the target frozen by spikes of night
  n_dark_bolt: () => skill('n_dark_bolt', 'shadow', 0.24, 0.85, [
    s(0, 'glow', 'sourceChest', { size: 1.2, duration: 0.3 }, { element: 'shadow' }),
    s(0.18, 'bolt', 'targetChest', { duration: 0.28, width: 0.07 }, { to: 'sourceChest', element: 'shadow' }),
    s(0.24, 'star', 'targetChest', { size: 1.25 }, { element: 'shadow' }),
    s(0.24, 'shards', 'targetGround', { count: 5, radius: 0.55, height: 0.95, duration: 0.7 }, { element: 'shadow' }),
    lit(0.24, 'shadow', 12, 0.4),
    shake(0.24, 0.16, 0.14),
  ]),
  // the flames run out of the hand and light the cone cell by cell
  n_flame_wave: () => {
    const steps: Steps = [s(0, 'glow', 'sourceChest', { size: 1.6, duration: 0.4 }, { element: 'fire' })];
    for (let i = 0; i < 5; i++) steps.push(s(0.05 + i * 0.07, 'burst', 'sourceChest', { count: 22, speed: 9, cone: 0.55, life: 0.5, size: 0.16, spray: 'point' }, { element: 'fire' }));
    steps.push(
      s(0.2, 'flame', 'targetGround', { width: 1.02, height: 2.1, duration: 0.85, stagger: 0.06 }, { cells: true }),
      s(0.34, 'star', 'targetChest', { size: 1.2 }, { element: 'fire', each: true }),
      s(0.5, 'smoke', 'far', { count: 12, spread: 1 }),
      lit(0.3, 'fire', 26, 0.8, 'point'),
      shake(0.34, 0.24, 0.26),
    );
    return skill('n_flame_wave', 'fire', 0.34, 1.2, steps);
  },
  // a seal under the zone, a burning rock, one blast. Then only smoke and embers.
  n_dark_meteor: () => ultimate('n_dark_meteor', 'fire', 0.02, 1.9, [
    s(0.05, 'orbit', 'source', { count: 22, radius: 1, duration: 1.1, rise: 2.8, spin: 3.4 }, { element: 'shadow' }),
    s(0.05, 'orbit', 'source', { count: 12, radius: 0.55, duration: 1.1, rise: 2, spin: -5 }, { element: 'fire' }),
    s(0.2, 'circle', 'point', { radius: 2.7, duration: 1.3, spin: -1.1 }, { element: 'fire' }),
    s(0.3, 'orb', 'sky', { radius: 1.8, duration: 0.7 }, { element: 'fire' }),
    s(0, 'flash', undefined, { opacity: 0.26 }, { element: 'fire', afterHit: true }),
    s(0, 'slowmo', undefined, { scale: 0.32, duration: 0.3 }, { afterHit: true }),
    s(0, 'punch', 'point', { duration: 0.55 }, { afterHit: true }),
    s(0, 'orb', 'point', { radius: 3.2, duration: 0.55, oy: 0.9 }, { element: 'fire', afterHit: true }),
    s(0, 'star', 'point', { size: 4.6, duration: 0.42, oy: 0.9 }, { element: 'fire', afterHit: true }),
    s(0, 'ring', 'point', { radius: 5.2, duration: 0.62, from: 0.08 }, { element: 'fire', afterHit: true }),
    s(0, 'decal', 'point', { radius: 2.8, duration: 2.6 }, { element: 'fire', afterHit: true }),
    shake(0, 0.78, 0.5, { afterHit: true }),
    lit(0, 'fire', 60, 1.1, 'point', { afterHit: true }),
    s(0.02, 'burst', 'point', { count: 46, speed: 6.4, up: 5, gravity: 11, size: 0.2, spread: 0.7, oy: 0.3 }, { element: 'earth', afterHit: true }),
    s(0.05, 'flame', 'targetGround', { width: 1.05, height: 2.6, duration: 1.05, stagger: 0.05, origin: 'point' }, { cells: true, afterHit: true }),
    s(0.12, 'smoke', 'point', { count: 40, spread: 1.8, size: 1.1, life: 1.6, oy: 0.6 }, { afterHit: true }),
    s(0.34, 'burst', 'point', { count: 26, speed: 0.8, up: 2.6, gravity: -0.3, size: 0.09, life: 1.2, spread: 1.8, soft: true }, { element: 'fire', afterHit: true }),
  ], { projectile: { at: 0.85, from: 'sky', to: 'point', element: 'fire', speed: 16, size: 2.4, arc: 0, smoke: true } satisfies FxProjectile, flashElement: 'fire' }),
};

// ------------------------------------------------------------ white mage

const whiteMage: Record<string, () => FxRecipe> = {
  // a thread of soft light settling on one ally
  w_salvation: () => skill('w_salvation', 'heal', 0.3, 1.2, [
    s(0.02, 'pillar', 'targetGround', { radius: 0.3, height: 6, duration: 0.95 }, { element: 'heal' }),
    s(0.1, 'glow', 'targetChest', { size: 2.1, duration: 0.85 }, { element: 'heal' }),
    s(0.14, 'motes', 'target', { count: 24, radius: 0.5, rise: 2.5 }, { element: 'heal' }),
    lit(0.28, 'heal', 11, 0.8),
  ]),
  // the sickness is thrown out as dark smoke, then a clear white wash
  w_purify: () => skill('w_purify', 'ice', 0.3, 1.1, [
    s(0.06, 'burst', 'targetChest', { count: 20, speed: 1.8, up: 2.8, gravity: -0.5, size: 0.17, life: 0.75, soft: true, additive: false }, { element: 'shadow' }),
    s(0.28, 'ring', 'targetChest', { radius: 1.5, duration: 0.42, ground: false, from: 0.2 }, { element: 'ice' }),
    s(0.3, 'star', 'targetChest', { size: 1.2 }, { element: 'ice' }),
    s(0.32, 'motes', 'target', { count: 20, radius: 0.5, rise: 2.2 }, { element: 'ice' }),
    lit(0.3, 'ice', 11, 0.6),
  ]),
  // a garden under the zone: green seal, life growing out of each cell
  w_sanctuary: () => skill('w_sanctuary', 'nature', 0.34, 1.45, [
    s(0, 'circle', 'point', { radius: 2.2, duration: 1.35, spin: 0.55 }, { element: 'nature' }),
    s(0.14, 'burst', 'targetGround', { count: 7, speed: 0.5, up: 2.2, gravity: -0.2, size: 0.12, life: 1, soft: true, stagger: 0.06, origin: 'point' }, { cells: true, element: 'nature' }),
    s(0.3, 'glow', 'targetChest', { size: 1.7, duration: 0.85 }, { element: 'heal', each: true }),
    s(0.34, 'motes', 'target', { count: 12, radius: 0.5, rise: 2 }, { element: 'heal', each: true }),
    lit(0.3, 'nature', 16, 1, 'point'),
  ]),
  // the gentlest ultimate: no shake, no slow motion. Light rains down and everything rises.
  w_miracle: () => ultimate('w_miracle', 'heal', 1.0, 2.2, [
    s(0.1, 'burst', 'pointSky', { count: 56, speed: 0.4, up: -1.4, gravity: 2, size: 0.11, life: 1.7, spread: 2.2, soft: true }, { element: 'heal' }),
    s(0.25, 'circle', 'point', { radius: 2, duration: 1, spin: 0.45 }, { element: 'heal' }),
    s(0.62, 'pillar', 'targetGround', { radius: 0.62, height: 13, duration: 1.45 }, { element: 'heal', each: true }),
    s(0.7, 'orbit', 'target', { count: 16, radius: 0.85, duration: 1.3, rise: 3.2, spin: 2.6, soft: true, size: 0.13 }, { element: 'heal', each: true }),
    s(0.82, 'glow', 'targetChest', { size: 2.8, duration: 1.1 }, { element: 'holy', each: true }),
    s(1.0, 'flash', undefined, { opacity: 0.12 }, { element: 'heal' }),
    s(1.0, 'punch', 'targetChest', { duration: 0.5, hold: true }),
    lit(1.0, 'heal', 40, 1.2),
    s(1.05, 'motes', 'target', { count: 26, radius: 0.8, rise: 3 }, { element: 'heal', each: true }),
  ], { flashElement: 'heal' }),
};

// ------------------------------------------------------------ red mage

const redMage: Record<string, () => FxRecipe> = {
  // two crossed cuts, scarlet then arcane
  r_arcane_blade: () => skill('r_arcane_blade', 'blood', 0.1, 0.7, [
    s(0, 'slash', 'targetChest', { size: 2.6, angle: -0.75, thickness: 0.7, duration: 0.2 }, { element: 'blood' }),
    s(0.06, 'slash', 'targetChest', { size: 2.6, angle: 0.75, flip: true, thickness: 0.7, duration: 0.2 }, { element: 'arcane' }),
    s(0.1, 'star', 'targetChest', { size: 1.1 }, { element: 'arcane' }),
    s(0.1, 'burst', 'targetChest', { count: 14, speed: 3.2, size: 0.1 }, { element: 'blood' }),
    shake(0.1, 0.16, 0.12),
  ]),
  // the rune step leaves the caster wrapped in scarlet glyphs
  r_rune_step: () => skill('r_rune_step', 'blood', 0.12, 0.95, [
    s(0, 'orbit', 'source', { count: 10, radius: 0.7, duration: 0.85, rise: 1.9 }, { element: 'blood' }),
    s(0.06, 'glow', 'sourceChest', { size: 1.6, duration: 0.6 }, { element: 'arcane' }),
  ]),
  // scarlet seal, each foe burns from inside, allies receive a little of it
  r_scarlet_circle: () => skill('r_scarlet_circle', 'blood', 0.36, 1.2, [
    s(0, 'circle', 'point', { radius: 2, duration: 0.82, spin: 1.5 }, { element: 'blood' }),
    s(0.3, 'orb', 'targetChest', { radius: 0.85, duration: 0.42 }, { element: 'blood', each: true }),
    s(0.36, 'star', 'targetChest', { size: 1.25 }, { element: 'blood', each: true }),
    s(0.36, 'ring', 'point', { radius: 2.5, duration: 0.45 }, { element: 'blood' }),
    s(0.42, 'motes', 'target', { count: 12, radius: 0.5, rise: 2 }, { element: 'arcane', each: true }),
    lit(0.36, 'blood', 22, 0.6, 'point'),
    shake(0.36, 0.22, 0.2),
  ]),
  // two orbs, scarlet and white, leave the caster apart and collide: every cell answers in turn
  r_perfect_duality: () => ultimate('r_perfect_duality', 'blood', 0.95, 2.0, [
    s(0.08, 'circle', 'point', { radius: 3, duration: 0.92, spin: 1.1 }, { element: 'arcane' }),
    s(0.3, 'orb', 'sourceChest', { radius: 0.5, duration: 0.42, ox: -0.9, oy: 0.8 }, { element: 'blood' }),
    s(0.3, 'orb', 'sourceChest', { radius: 0.5, duration: 0.42, ox: 0.9, oy: 0.8 }, { element: 'ice' }),
    s(0.56, 'shot', 'sourceChest', { size: 0.9, duration: 0.39, arc: 2.6, ox: -0.9, oy: 0.8 }, { to: 'point', element: 'blood' }),
    s(0.56, 'shot', 'sourceChest', { size: 0.9, duration: 0.39, arc: -2.6, ox: 0.9, oy: 0.8 }, { to: 'point', element: 'ice' }),
    s(0.9, 'slash', 'point', { size: 5, angle: -0.8, oy: 1, duration: 0.34, thickness: 0.6 }, { element: 'blood' }),
    s(0.93, 'slash', 'point', { size: 5, angle: 0.8, flip: true, oy: 1, duration: 0.34, thickness: 0.6 }, { element: 'ice' }),
    s(0.95, 'star', 'point', { size: 3.4, duration: 0.36, oy: 1 }, { element: 'arcane' }),
    s(0.95, 'ring', 'point', { radius: 4.2, duration: 0.62 }, { element: 'blood' }),
    s(0.95, 'slowmo', undefined, { scale: 0.34, duration: 0.28 }),
    s(0.95, 'punch', 'point', { duration: 0.5 }),
    s(0.95, 'flash', undefined, { opacity: 0.2 }, { element: 'arcane' }),
    shake(0.95, 0.46, 0.34),
    lit(0.95, 'arcane', 46, 0.9, 'point'),
    s(1.02, 'orb', 'targetGround', { radius: 0.62, duration: 0.4, oy: 0.8, stagger: 0.07, origin: 'point' }, { cells: true, alternate: ['blood', 'ice'] }),
    s(1.08, 'burst', 'targetGround', { count: 8, speed: 2.2, up: 2, size: 0.1, oy: 0.6, stagger: 0.07, origin: 'point' }, { cells: true, alternate: ['ice', 'blood'] }),
  ], { flashElement: 'arcane' }),
};

// ------------------------------------------------------------ enchanter

const enchanter: Record<string, () => FxRecipe> = {
  // a rune flies to the ally and settles into orbit
  e_vigor_rune: () => skill('e_vigor_rune', 'arcane', 0.34, 1.15, [
    s(0.02, 'shot', 'sourceChest', { size: 0.42, duration: 0.3, arc: 1 }, { to: 'targetChest', element: 'arcane' }),
    s(0.32, 'orbit', 'target', { count: 12, radius: 0.72, duration: 0.82, rise: 1.9 }, { element: 'arcane' }),
    s(0.34, 'glow', 'targetChest', { size: 1.7, duration: 0.6 }, { element: 'gold' }),
    lit(0.34, 'arcane', 10, 0.5),
  ]),
  // chains of light from the seal lock each foe in place
  e_binding_seal: () => skill('e_binding_seal', 'arcane', 0.36, 1.2, [
    s(0, 'circle', 'point', { radius: 2, duration: 0.85, spin: -1.3 }, { element: 'arcane' }),
    s(0.24, 'bolt', 'targetChest', { duration: 0.3, width: 0.05 }, { to: 'point', element: 'arcane', each: true }),
    s(0.34, 'shards', 'targetGround', { count: 7, radius: 0.62, height: 1, duration: 0.8 }, { element: 'arcane', each: true }),
    s(0.36, 'star', 'targetChest', { size: 1 }, { element: 'arcane', each: true }),
    lit(0.36, 'arcane', 14, 0.5, 'point'),
    shake(0.36, 0.1, 0.12),
  ]),
  // no blow at all: a slow seal, a thread of light to each ally, rune orbits and domes
  e_absolute_harmony: () => ultimate('e_absolute_harmony', 'arcane', 0.9, 2.05, [
    s(0.05, 'orbit', 'source', { count: 24, radius: 1, duration: 0.85, rise: 2, spin: 3 }, { element: 'arcane' }),
    s(0.15, 'circle', 'point', { radius: 3.3, duration: 1.6, spin: 0.5 }, { element: 'arcane' }),
    s(0.55, 'shot', 'sourceChest', { size: 0.34, duration: 0.3, arc: 0.8 }, { to: 'targetChest', element: 'gold', each: true }),
    s(0.85, 'dome', 'targetGround', { radius: 1.2, duration: 1.15 }, { element: 'arcane', each: true }),
    s(0.88, 'orbit', 'target', { count: 14, radius: 1, duration: 1.1, rise: 2.4, spin: 3.6 }, { element: 'gold', each: true }),
    s(0.9, 'motes', 'target', { count: 16, radius: 0.7, rise: 2.2 }, { element: 'heal', each: true }),
    s(0.9, 'flash', undefined, { opacity: 0.12 }, { element: 'arcane' }),
    s(0.9, 'punch', 'point', { duration: 0.5, hold: true }),
    lit(0.9, 'arcane', 34, 1.1, 'point'),
  ], { flashElement: 'arcane' }),
};

// ------------------------------------------------------------ archer

const archer: Record<string, () => FxRecipe> = {
  // a glint on the bow, a needle of mint
  a_precise_shot: () => skill('a_precise_shot', 'wind', 0.02, 0.7, [
    s(0, 'star', 'sourceChest', { size: 0.7, duration: 0.16 }, { element: 'wind' }),
    s(0, 'star', 'targetChest', { size: 1 }, { element: 'wind', afterHit: true }),
    s(0, 'burst', 'targetChest', { count: 12, speed: 3.6, size: 0.08, cone: 0.5, spray: 'through' }, { element: 'wind', afterHit: true }),
    shake(0, 0.12, 0.1, { afterHit: true }),
  ], { projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element: 'wind', speed: 30, size: 1, arc: 0.12, streak: true } }),
  // the bowstring sings, the wind fills the hawk's wings
  a_hawk_leap: () => skill('a_hawk_leap', 'wind', 0.1, 0.8, [
    s(0, 'orbit', 'source', { count: 8, radius: 0.6, duration: 0.7, rise: 1.8, spin: 6 }, { element: 'wind' }),
    s(0.05, 'glow', 'sourceChest', { size: 1.3, duration: 0.45 }, { element: 'wind' }),
  ]),
  // three arrows go up, the volley falls on every cell of the zone
  a_arrow_rain: () => skill('a_arrow_rain', 'wind', 0.5, 1.1, [
    ...[0, 0.06, 0.12].map((at, i) => s(at, 'streak', 'sourceChest', { width: 0.12, duration: 0.2, ox: (i - 1) * 0.4 }, { to: 'sourceSky', element: 'wind' })),
    s(0.34, 'rain', 'targetGround', { count: 3, gap: 0.07, width: 0.1, stagger: 0.03, origin: 'point' }, { cells: true, element: 'wind' }),
    s(0.5, 'star', 'targetChest', { size: 0.9, duration: 0.2 }, { element: 'wind', each: true }),
    shake(0.5, 0.16, 0.2),
  ]),
  // one arrow into the sky. Silence. A star high up. It comes back, alone.
  a_zenith_arrow: () => ultimate('a_zenith_arrow', 'wind', 1.05, 1.9, [
    s(0, 'converge', 'sourceChest', { count: 26, radius: 1.5, duration: 0.5, height: 0.8 }, { element: 'wind' }),
    s(0.5, 'star', 'sourceChest', { size: 1.5, duration: 0.2 }, { element: 'wind' }),
    s(0.52, 'streak', 'sourceChest', { width: 0.2, duration: 0.24 }, { to: 'sourceSky', element: 'wind' }),
    s(0.54, 'burst', 'sourceGround', { count: 14, speed: 2.2, up: 0.5, gravity: 3, size: 0.12, soft: true }, { element: 'earth' }),
    s(0.84, 'star', 'targetSky', { size: 2.2, duration: 0.2, oy: -3 }, { element: 'wind' }),
    s(0.97, 'streak', 'targetSky', { width: 0.42, duration: 0.2 }, { to: 'targetChest', element: 'wind' }),
    s(1.05, 'star', 'targetChest', { size: 3, duration: 0.34 }, { element: 'wind' }),
    s(1.05, 'ring', 'targetGround', { radius: 2.1, duration: 0.4 }, { element: 'wind' }),
    s(1.05, 'slowmo', undefined, { scale: 0.25, duration: 0.24 }),
    s(1.05, 'punch', 'targetChest', { duration: 0.42, hold: true }),
    s(1.05, 'flash', undefined, { opacity: 0.16 }, { element: 'wind' }),
    shake(1.05, 0.44, 0.28),
    lit(1.05, 'wind', 34, 0.7),
    s(1.06, 'burst', 'targetGround', { count: 26, speed: 3, up: 3, gravity: 9, size: 0.15 }, { element: 'earth' }),
    s(1.08, 'decal', 'targetGround', { radius: 1.1 }, { element: 'earth' }),
    s(1.12, 'rain', 'targetGround', { count: 7, gap: 0.035, width: 0.08, spread: 1.15 }, { element: 'wind' }),
  ]),
};

// ------------------------------------------------------------ ninja

const ninja: Record<string, () => FxRecipe> = {
  // two tiny cuts and a green drip that stays on the wound
  ni_venom_blade: () => skill('ni_venom_blade', 'poison', 0.1, 0.85, [
    s(0, 'slash', 'targetChest', { size: 2, angle: -0.95, thickness: 0.5, duration: 0.14 }, { element: 'poison' }),
    s(0.05, 'slash', 'targetChest', { size: 2, angle: 0.95, flip: true, thickness: 0.5, duration: 0.14 }, { element: 'poison' }),
    s(0.1, 'star', 'targetChest', { size: 0.8, duration: 0.18 }, { element: 'poison' }),
    s(0.12, 'burst', 'targetChest', { count: 16, speed: 1, up: 1.4, gravity: -0.5, size: 0.13, life: 0.85, soft: true }, { element: 'poison' }),
    s(0.14, 'burst', 'targetChest', { count: 10, speed: 0.8, up: 0.3, gravity: 6, size: 0.08, life: 0.6 }, { element: 'poison' }),
    shake(0.1, 0.12, 0.1),
  ]),
  // cut from behind, thin and dark, gone at once
  ni_shadow_step: () => skill('ni_shadow_step', 'shadow', 0.12, 0.65, [
    s(0.02, 'slash', 'targetChest', { size: 3, angle: 1.1, thickness: 0.4, duration: 0.14 }, { element: 'shadow' }),
    s(0.07, 'slash', 'targetChest', { size: 2.6, angle: -1, flip: true, thickness: 0.4, duration: 0.14 }, { element: 'blood' }),
    s(0.12, 'star', 'targetChest', { size: 0.85, duration: 0.18 }, { element: 'blood' }),
    shake(0.12, 0.18, 0.1),
  ]),
  // a lobbed flask, then smoke fills the zone cell by cell
  ni_smoke_bomb: () => skill('ni_smoke_bomb', 'smoke', 0.3, 1.35, [
    s(0, 'smoke', 'targetGround', { count: 10, spread: 0.5, size: 1, life: 1.3, stagger: 0.04, origin: 'point' }, { cells: true, afterHit: true }),
    s(0, 'burst', 'point', { count: 12, speed: 2.4, up: 1.4, gravity: 5, size: 0.09 }, { element: 'poison', afterHit: true }),
    s(0.06, 'motes', 'target', { count: 12, radius: 0.6, sink: true }, { element: 'shadow', each: true, afterHit: true }),
    shake(0, 0.12, 0.14, { afterHit: true }),
  ], { projectile: { at: 0.02, from: 'sourceChest', to: 'point', element: 'smoke', speed: 10, size: 0.4, arc: 1.2 } }),
  // the world goes dark, six cuts nobody sees land, then one blinding thin line
  ni_silent_assassin: () => {
    const steps: Steps = [
      s(0, 'smoke', 'source', { count: 16, spread: 0.5, size: 0.7 }),
      s(0.05, 'orb', 'sourceChest', { radius: 1, duration: 0.5, implode: true, dark: true }, { element: 'shadow' }),
      s(0.52, 'flash', undefined, { opacity: 0.28, dark: true }),
    ];
    for (let i = 0; i < 6; i++) steps.push(s(0.56 + i * 0.065, 'slash', 'targetChest', { size: 2.8, angle: (i * 1.31) % 3.1 - 1.5, flip: i % 2 === 1, thickness: 0.32, duration: 0.13 }, { element: i % 2 ? 'blood' : 'shadow' }));
    steps.push(
      s(1.0, 'slash', 'targetChest', { size: 5.4, angle: 1.45, thickness: 0.22, duration: 0.2 }, { element: 'blood' }),
      s(1.05, 'slowmo', undefined, { scale: 0.14, duration: 0.36 }),
      s(1.05, 'punch', 'targetChest', { duration: 0.46, hold: true }),
      shake(1.05, 0.34, 0.2),
      s(1.08, 'burst', 'targetChest', { count: 30, speed: 4.2, up: 1.2, gravity: 8, size: 0.11, life: 0.7 }, { element: 'blood' }),
      s(1.1, 'burst', 'targetChest', { count: 18, speed: 1, up: 1.2, gravity: -0.4, size: 0.14, life: 1, soft: true }, { element: 'poison' }),
      s(1.1, 'smoke', 'target', { count: 12, spread: 0.5, size: 0.7 }),
    );
    return ultimate('ni_silent_assassin', 'shadow', 1.05, 1.85, steps);
  },
};

// ------------------------------------------------------------ rogue

const rogue: Record<string, () => FxRecipe> = {
  // a single jab at the vital point: one small bright stab
  ro_sneak_attack: () => skill('ro_sneak_attack', 'steel', 0.06, 0.55, [
    s(0, 'slash', 'targetChest', { size: 1.5, angle: -1.25, thickness: 0.45, duration: 0.12 }, { element: 'steel' }),
    s(0.05, 'star', 'targetChest', { size: 0.95, duration: 0.2 }, { element: 'blood' }),
    s(0.06, 'burst', 'targetChest', { count: 12, speed: 3.4, size: 0.08 }, { element: 'blood' }),
    shake(0.06, 0.14, 0.1),
  ]),
  // a thrown trap: steel teeth snap shut on the target
  ro_jaw_trap: () => skill('ro_jaw_trap', 'steel', 0.24, 0.9, [
    s(0, 'shot', 'sourceChest', { size: 0.32, duration: 0.16, arc: 1 }, { to: 'targetGround', element: 'steel' }),
    s(0.16, 'slash', 'target', { size: 2.3, angle: 0, oy: 1, thickness: 0.9, duration: 0.12 }, { element: 'steel' }),
    s(0.16, 'slash', 'target', { size: 2.3, angle: 3.14, oy: 0.1, thickness: 0.9, duration: 0.12 }, { element: 'steel' }),
    s(0.24, 'star', 'targetChest', { size: 1.1, duration: 0.2 }, { element: 'steel' }),
    s(0.24, 'shards', 'targetGround', { count: 8, radius: 0.5, height: 0.8, duration: 0.65 }, { element: 'steel' }),
    s(0.25, 'burst', 'targetGround', { count: 12, speed: 2, up: 2.4, gravity: 8, size: 0.1 }, { element: 'earth' }),
    shake(0.24, 0.22, 0.14),
  ]),
  // one hammering blow: the floor gives way in amber cracks and everything on the target shatters
  ro_fault_breaker: () => ultimate('ro_fault_breaker', 'earth', 0.95, 1.9, [
    s(0.02, 'burst', 'sourceGround', { count: 26, speed: 2.8, up: 0.6, gravity: 3, size: 0.14, soft: true }, { element: 'earth' }),
    s(0.3, 'burst', 'sourceChest', { count: 18, speed: 1.2, up: 2.4, gravity: 3, size: 0.1 }, { element: 'gold' }),
    s(0.82, 'slash', 'targetChest', { size: 4.2, angle: 0, thickness: 1.2, duration: 0.2 }, { element: 'earth' }),
    s(0.95, 'fissure', 'targetGround', { radius: 4.4, duration: 1.8 }, { element: 'gold' }),
    s(0.95, 'star', 'targetChest', { size: 3, duration: 0.34 }, { element: 'gold' }),
    s(0.95, 'slowmo', undefined, { scale: 0.26, duration: 0.26 }),
    s(0.95, 'punch', 'targetChest', { duration: 0.46, hold: true }),
    shake(0.95, 0.74, 0.44),
    lit(0.95, 'gold', 36, 0.8),
    s(0.96, 'shards', 'targetGround', { count: 10, radius: 1.25, height: 1.8, duration: 0.9 }, { element: 'earth' }),
    s(0.97, 'burst', 'targetChest', { count: 44, speed: 5.4, up: 3, gravity: 10, size: 0.17 }, { element: 'earth' }),
    s(0.99, 'burst', 'targetChest', { count: 24, speed: 4, up: 2, gravity: 4, size: 0.1 }, { element: 'gold' }),
    s(1.02, 'smoke', 'targetGround', { count: 14, spread: 0.9, size: 0.8 }),
  ]),
};

// ------------------------------------------------------------ gunner

const gunner: Record<string, () => FxRecipe> = {
  // muzzle flash, a bright slug, a spark on the hit
  ar_calibrated_shot: () => skill('ar_calibrated_shot', 'fire', 0.02, 0.65, [
    s(0, 'star', 'sourceChest', { size: 1, duration: 0.14 }, { element: 'fire' }),
    s(0.02, 'smoke', 'sourceChest', { count: 7, spread: 0.2, size: 0.4, life: 0.7 }),
    s(0, 'star', 'targetChest', { size: 0.95, duration: 0.2 }, { element: 'steel', afterHit: true }),
    s(0, 'burst', 'targetChest', { count: 12, speed: 3.8, size: 0.08, gravity: 8 }, { element: 'fire', afterHit: true }),
    shake(0, 0.14, 0.1, { afterHit: true }),
  ], { projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element: 'fire', speed: 36, size: 0.42, arc: 0.03, streak: true } }),
  // the charge left behind goes off on the empty cell
  ar_explosive_retreat: () => skill('ar_explosive_retreat', 'fire', 0.08, 1, [
    s(0.06, 'orb', 'point', { radius: 1.25, duration: 0.42, oy: 0.7 }, { element: 'fire' }),
    s(0.06, 'star', 'point', { size: 2, oy: 0.7 }, { element: 'fire' }),
    s(0.06, 'ring', 'point', { radius: 2.4, duration: 0.42 }, { element: 'fire' }),
    s(0.08, 'burst', 'point', { count: 30, speed: 4.4, up: 3.4, gravity: 9, size: 0.14, oy: 0.3 }, { element: 'earth' }),
    s(0.1, 'smoke', 'point', { count: 16, spread: 0.7, size: 0.8, oy: 0.5 }),
    s(0.1, 'decal', 'point', { radius: 1 }, { element: 'fire' }),
    lit(0.08, 'fire', 24, 0.55, 'point'),
    shake(0.08, 0.32, 0.24),
  ]),
  // a lobbed grenade, a dry blast, the fire spreads on the cells
  ar_incendiary_grenade: () => skill('ar_incendiary_grenade', 'fire', 0.02, 1.25, [
    s(0, 'orb', 'point', { radius: 0.95, duration: 0.34, oy: 0.6 }, { element: 'fire', afterHit: true }),
    s(0, 'star', 'point', { size: 1.5, oy: 0.6 }, { element: 'fire', afterHit: true }),
    s(0.02, 'burst', 'point', { count: 18, speed: 3.4, up: 2.6, gravity: 9, size: 0.11, oy: 0.3 }, { element: 'fire', afterHit: true }),
    s(0.06, 'flame', 'targetGround', { width: 1, height: 1.7, duration: 0.95, stagger: 0.08, origin: 'point' }, { cells: true, afterHit: true }),
    s(0.1, 'smoke', 'point', { count: 12, spread: 0.9, oy: 0.4 }, { afterHit: true }),
    lit(0, 'fire', 20, 0.8, 'point', { afterHit: true }),
    shake(0, 0.24, 0.2, { afterHit: true }),
  ], { projectile: { at: 0.05, from: 'sourceChest', to: 'point', element: 'fire', speed: 11, size: 0.42, arc: 1.5 } }),
  // three shots, three muzzle flashes, three shells falling apart from each other
  ar_artillery_barrage: () => {
    const steps: Steps = [
      s(0.02, 'burst', 'sourceGround', { count: 18, speed: 2, up: 0.5, gravity: 3, size: 0.13, soft: true }, { element: 'earth' }),
    ];
    [0.14, 0.5, 0.86].forEach((pick, i) => {
      const fired = 0.38 + i * 0.17, landed = fired + 0.42;
      steps.push(
        s(fired, 'star', 'sourceChest', { size: 1.5, duration: 0.15 }, { element: 'fire' }),
        s(fired, 'smoke', 'sourceChest', { count: 9, spread: 0.25, size: 0.5, life: 0.8 }),
        shake(fired, 0.14, 0.1),
        s(fired, 'shot', 'sourceChest', { size: 0.5, duration: 0.42, arc: 2.2, smoke: true, pickTo: pick }, { to: 'cell', element: 'fire' }),
        s(landed, 'orb', 'cell', { radius: 1.2, duration: 0.42, oy: 0.8, pick }, { element: 'fire' }),
        s(landed, 'star', 'cell', { size: 3, oy: 0.8, pick }, { element: 'fire' }),
        s(landed, 'burst', 'cell', { count: 30, speed: 4.6, up: 3.8, gravity: 10, size: 0.15, oy: 0.3, pick }, { element: 'earth' }),
        s(landed + 0.04, 'smoke', 'cell', { count: 16, spread: 0.7, size: 0.85, life: 1.2, oy: 0.5, pick }),
        s(landed, 'decal', 'cell', { radius: 1.05, pick }, { element: 'fire' }),
        lit(landed, 'fire', 34, 0.5, 'cell', { p: { intensity: 34, duration: 0.5, pick } }),
        shake(landed, 0.44, 0.24),
      );
    });
    steps.push(
      s(1.0, 'slowmo', undefined, { scale: 0.5, duration: 0.2 }),
      s(1.0, 'punch', 'point', { duration: 0.42 }),
      s(1.22, 'flash', undefined, { opacity: 0.16 }, { element: 'fire' }),
      s(1.3, 'flame', 'targetGround', { width: 0.95, height: 1.5, duration: 0.7, stagger: 0.05, origin: 'point' }, { cells: true }),
    );
    return ultimate('ar_artillery_barrage', 'fire', 1.0, 2.15, steps, { flashElement: 'fire' });
  },
};

// ------------------------------------------------------------ enemies

/** Two fangs closing on the target, one from above and one from below. */
const fangs = (at: number, element: FxElement, size: number): Steps => [
  s(at, 'slash', 'targetChest', { size, angle: 0, oy: 0.25, thickness: 1, duration: 0.12 }, { element }),
  s(at, 'slash', 'targetChest', { size, angle: 3.14, oy: -0.25, thickness: 1, duration: 0.12 }, { element }),
];

const enemies: Record<string, () => FxRecipe> = {
  // a club coming straight down: thick, slow, the dust jumps off the floor
  enemy_heavy_strike: () => skill('enemy_heavy_strike', 'blunt', 0.12, 0.75, [
    s(0, 'slash', 'targetChest', { size: 3.4, angle: 0, thickness: 1.3, duration: 0.18 }, { element: 'blunt' }),
    s(0.12, 'star', 'targetChest', { size: 1.3 }, { element: 'blunt' }),
    s(0.12, 'ring', 'targetGround', { radius: 1.7, duration: 0.34 }, { element: 'blunt' }),
    s(0.13, 'burst', 'targetGround', { count: 18, speed: 2.6, up: 2.2, gravity: 9, size: 0.13 }, { element: 'earth' }),
    shake(0.12, 0.3, 0.18),
  ]),
  // both fists on the floor: the ground cracks around the brute
  enemy_crush: () => skill('enemy_crush', 'earth', 0.2, 1, [
    s(0, 'burst', 'sourceChest', { count: 10, speed: 1, up: 3, gravity: 7, size: 0.12 }, { element: 'earth' }),
    s(0.18, 'fissure', 'sourceGround', { radius: 2.7, duration: 1.1 }, { element: 'blunt' }),
    s(0.18, 'ring', 'sourceGround', { radius: 2.7, duration: 0.38 }, { element: 'earth' }),
    s(0.2, 'burst', 'targetGround', { count: 12, speed: 2.2, up: 2.6, gravity: 9, size: 0.13, stagger: 0.02 }, { cells: true, element: 'earth' }),
    s(0.2, 'star', 'targetChest', { size: 1.2 }, { element: 'blunt', each: true }),
    s(0.24, 'smoke', 'sourceGround', { count: 12, spread: 0.8 }),
    shake(0.2, 0.38, 0.24),
  ]),
  // a slow ball of night that trails smoke, nothing like the Dark Mage's straight bolt
  enemy_dark_bolt: () => skill('enemy_dark_bolt', 'shadow', 0.02, 0.85, [
    s(0, 'glow', 'sourceChest', { size: 1, duration: 0.24 }, { element: 'shadow' }),
    s(0, 'orb', 'targetChest', { radius: 0.75, duration: 0.34, dark: true }, { element: 'shadow', afterHit: true }),
    s(0, 'star', 'targetChest', { size: 1.05 }, { element: 'shadow', afterHit: true }),
    s(0.02, 'burst', 'targetChest', { count: 14, speed: 2.8, size: 0.09 }, { element: 'shadow', afterHit: true }),
    shake(0, 0.14, 0.12, { afterHit: true }),
  ], { projectile: { at: 0.1, from: 'sourceChest', to: 'targetChest', element: 'shadow', speed: 13, size: 0.7, arc: 0.5, smoke: true } }),
  // no blow: a small seal, a red thread winding down, the curse sinks in
  enemy_hex: () => skill('enemy_hex', 'shadow', 0.36, 1.1, [
    s(0, 'circle', 'targetGround', { radius: 0.95, duration: 0.62, spin: -2.4 }, { element: 'shadow' }),
    s(0.04, 'orbit', 'target', { count: 10, radius: 0.62, duration: 0.62, rise: 1.7, spin: -6 }, { element: 'blood' }),
    s(0.34, 'orb', 'targetChest', { radius: 0.7, duration: 0.34, implode: true, dark: true }, { element: 'blood' }),
    s(0.38, 'motes', 'target', { count: 12, radius: 0.5, sink: true }, { element: 'shadow' }),
  ]),
  // fangs that close, then a green cloud on the wound
  enemy_venom_strike: () => skill('enemy_venom_strike', 'poison', 0.1, 0.95, [
    ...fangs(0, 'poison', 1.9),
    s(0.1, 'star', 'targetChest', { size: 0.85, duration: 0.18 }, { element: 'poison' }),
    s(0.12, 'burst', 'targetChest', { count: 22, speed: 0.9, up: 1.2, gravity: -0.5, size: 0.16, life: 0.9, soft: true }, { element: 'poison' }),
    s(0.16, 'motes', 'target', { count: 10, radius: 0.45, rise: 1.6 }, { element: 'poison' }),
    shake(0.1, 0.12, 0.1),
  ]),
  // weighted cords: they fly in and wind around the legs
  enemy_binding_shot: () => skill('enemy_binding_shot', 'steel', 0.02, 0.85, [
    s(0, 'orbit', 'target', { count: 14, radius: 0.55, duration: 0.6, rise: 0.7, spin: 10, size: 0.09 }, { element: 'steel', afterHit: true }),
    s(0, 'star', 'targetChest', { size: 0.8, duration: 0.16 }, { element: 'steel', afterHit: true }),
    s(0.02, 'burst', 'targetGround', { count: 8, speed: 1.6, up: 1.2, gravity: 8, size: 0.09 }, { element: 'earth', afterHit: true }),
  ], { projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element: 'steel', speed: 20, size: 0.34, arc: 0.5 } }),
  // a long roar of fire: the stream is thicker and hotter than any mage's flames
  enemy_dragon_breath: () => {
    const steps: Steps = [s(0, 'glow', 'sourceMouth', { size: 1.5, duration: 0.3 }, { element: 'fire' })];
    for (let i = 0; i < 7; i++) steps.push(s(0.04 + i * 0.06, 'burst', 'sourceMouth', { count: 26, cone: 0.45, life: 0.4, size: 0.2, up: 0, reach: true, spray: 'target' }, { element: 'fire' }));
    steps.push(
      s(0.22, 'flame', 'targetGround', { width: 1.04, height: 2.5, duration: 0.95, stagger: 0.05 }, { cells: true }),
      s(0.36, 'star', 'targetChest', { size: 1.4 }, { element: 'fire', each: true }),
      s(0.5, 'burst', 'point', { count: 22, speed: 0.8, up: 2.4, gravity: -0.3, size: 0.09, life: 0.9, spread: 1.2, soft: true }, { element: 'gold' }),
      s(0.55, 'smoke', 'far', { count: 16, spread: 1.1, size: 0.8 }),
      lit(0.3, 'fire', 34, 0.9, 'point'),
      shake(0.36, 0.3, 0.3),
    );
    return skill('enemy_dragon_breath', 'fire', 0.36, 1.3, steps);
  },

  // the raised weapon comes down: cracks, one ring, debris on the zone
  boss_slam: () => ultimate('boss_slam', 'earth', 0.6, 1.7, [
    s(0.02, 'burst', 'sourceGround', { count: 24, speed: 2.4, up: 0.7, gravity: 3, size: 0.15, soft: true }, { element: 'earth' }),
    s(0.05, 'converge', 'source', { count: 26, radius: 2, duration: 0.5, height: 0.6, size: 0.13 }, { element: 'earth' }),
    s(0.46, 'slash', 'point', { size: 4.6, angle: 0, oy: 1.2, thickness: 1.4, duration: 0.16 }, { element: 'blunt' }),
    s(0.6, 'fissure', 'point', { radius: 3.8, duration: 1.2 }, { element: 'blunt' }),
    s(0.6, 'ring', 'point', { radius: 3.2, duration: 0.42 }, { element: 'blunt' }),
    s(0.6, 'slowmo', undefined, { scale: 0.4, duration: 0.2 }),
    s(0.6, 'punch', 'point', { duration: 0.45 }),
    s(0.6, 'flash', undefined, { opacity: 0.14 }, { element: 'blunt' }),
    shake(0.6, 0.62, 0.36),
    lit(0.6, 'blunt', 30, 0.6, 'point'),
    s(0.62, 'burst', 'targetGround', { count: 14, speed: 2.6, up: 3.2, gravity: 10, size: 0.15, stagger: 0.04, origin: 'point' }, { cells: true, element: 'earth' }),
    s(0.66, 'smoke', 'point', { count: 18, spread: 1.4, size: 0.8 }),
  ], { flashElement: 'blunt' }),
  // the shock runs along the floor from the boss to one victim, then the curse takes hold
  boss_quake: () => ultimate('boss_quake', 'shadow', 0.75, 1.6, [
    s(0.02, 'burst', 'sourceGround', { count: 18, speed: 2, up: 0.6, gravity: 3, size: 0.14, soft: true }, { element: 'earth' }),
    s(0.1, 'slash', 'sourceChest', { size: 3.4, angle: 0, oy: -0.5, thickness: 1.2, duration: 0.14 }, { element: 'earth' }),
    s(0.22, 'fissure', 'sourceGround', { radius: 2.2, duration: 1 }, { element: 'shadow' }),
    s(0.25, 'shot', 'sourceGround', { size: 1.1, duration: 0.5, arc: 0, smoke: true }, { to: 'targetGround', element: 'earth' }),
    shake(0.25, 0.2, 0.46),
    s(0.75, 'shards', 'targetGround', { count: 7, radius: 0.7, height: 1.3, duration: 0.75 }, { element: 'earth' }),
    s(0.75, 'star', 'targetChest', { size: 2.1 }, { element: 'shadow' }),
    s(0.75, 'orb', 'targetChest', { radius: 1, duration: 0.42, dark: true }, { element: 'shadow' }),
    s(0.75, 'punch', 'targetChest', { duration: 0.42, hold: true }),
    shake(0.75, 0.46, 0.26),
    lit(0.75, 'shadow', 22, 0.6),
    s(0.82, 'motes', 'target', { count: 16, radius: 0.55, sink: true }, { element: 'shadow' }),
  ]),
  // the heaviest blow in the game: rock spears tear through every cell of the zone
  boss_titan_slam: () => ultimate('boss_titan_slam', 'earth', 0.85, 2.15, [
    s(0.02, 'burst', 'sourceGround', { count: 34, speed: 3, up: 0.8, gravity: 3, size: 0.17, soft: true }, { element: 'earth' }),
    s(0.05, 'converge', 'source', { count: 44, radius: 3.4, duration: 0.72, height: 1.4, size: 0.15 }, { element: 'earth' }),
    s(0.1, 'speedLines', undefined, { duration: 0.75 }, { element: 'earth' }),
    s(0.72, 'slash', 'point', { size: 6, angle: 0, oy: 1.6, thickness: 1.5, duration: 0.16 }, { element: 'blunt' }),
    s(0.85, 'fissure', 'point', { radius: 6, duration: 1.5 }, { element: 'gold' }),
    s(0.85, 'ring', 'point', { radius: 5.6, duration: 0.55 }, { element: 'earth' }),
    s(0.85, 'slowmo', undefined, { scale: 0.3, duration: 0.3 }),
    s(0.85, 'punch', 'point', { duration: 0.5 }),
    s(0.85, 'flash', undefined, { opacity: 0.2 }, { element: 'earth' }),
    shake(0.85, 0.78, 0.5),
    lit(0.85, 'gold', 44, 0.9, 'point'),
    s(0.88, 'shards', 'targetGround', { count: 4, radius: 0.45, height: 1.8, duration: 0.95, stagger: 0.06, origin: 'point' }, { cells: true, element: 'earth' }),
    s(0.9, 'burst', 'targetGround', { count: 12, speed: 2.8, up: 3.6, gravity: 10, size: 0.16, stagger: 0.06, origin: 'point' }, { cells: true, element: 'earth' }),
    s(1, 'smoke', 'targetGround', { count: 6, spread: 0.45, size: 0.8, stagger: 0.06, origin: 'point' }, { cells: true }),
  ], { flashElement: 'earth' }),
  // three blasts of voice before the blow; every foe caught sags, drained of red
  boss_roar: () => ultimate('boss_roar', 'blood', 0.62, 1.45, [
    s(0.1, 'speedLines', undefined, { duration: 0.6 }, { element: 'blood' }),
    shake(0.1, 0.22, 0.5),
    ...[0.12, 0.3, 0.46].map((at, i) => s(at, 'ring', 'sourceChest', { radius: 1.8 + i * 0.7, duration: 0.3, ground: false, from: 0.2 }, { element: 'blood' })),
    s(0.62, 'orb', 'targetChest', { radius: 0.75, duration: 0.34, implode: true, dark: true }, { element: 'blood', each: true }),
    s(0.62, 'punch', 'sourceChest', { duration: 0.42 }),
    s(0.62, 'flash', undefined, { opacity: 0.12 }, { element: 'blood' }),
    s(0.66, 'motes', 'target', { count: 14, radius: 0.5, sink: true }, { element: 'blood', each: true }),
  ]),
  // a wall of black blades rises round the boss and a dark dome shuts over it
  boss_guard: () => skill('boss_guard', 'shadow', 0.3, 1.25, [
    s(0, 'converge', 'source', { count: 26, radius: 2.2, duration: 0.3, height: 2 }, { element: 'shadow' }),
    s(0.1, 'shards', 'sourceGround', { count: 10, radius: 1.5, height: 1.6, duration: 1.05 }, { element: 'shadow' }),
    s(0.2, 'dome', 'sourceGround', { radius: 1.4, duration: 1 }, { element: 'shadow' }),
    lit(0.3, 'shadow', 14, 0.8, 'sourceChest'),
    shake(0.1, 0.1, 0.12),
  ]),
  // living green drawn out of the ground into the wounds
  boss_regen: () => skill('boss_regen', 'nature', 0.4, 1.3, [
    s(0, 'converge', 'source', { count: 36, radius: 2.6, duration: 0.45, height: 0.5, size: 0.12 }, { element: 'nature' }),
    s(0.32, 'orbit', 'source', { count: 14, radius: 0.9, duration: 0.9, rise: 2.4, spin: 3, soft: true }, { element: 'nature' }),
    s(0.4, 'glow', 'sourceChest', { size: 1.5, duration: 0.7 }, { element: 'nature' }),
    lit(0.4, 'nature', 14, 0.8, 'sourceChest'),
  ]),
  // red power climbing up the body, gold sparks round it
  boss_fortify: () => skill('boss_fortify', 'blood', 0.35, 1.2, [
    s(0, 'converge', 'source', { count: 30, radius: 2, duration: 0.36, height: 1.4 }, { element: 'gold' }),
    s(0.25, 'pillar', 'source', { radius: 0.28, height: 5, duration: 0.6 }, { element: 'blood' }),
    s(0.3, 'orbit', 'source', { count: 12, radius: 0.75, duration: 0.85, rise: 2, spin: 6 }, { element: 'gold' }),
    s(0.35, 'star', 'sourceChest', { size: 1.1, duration: 0.22 }, { element: 'blood' }),
    lit(0.35, 'blood', 14, 0.6, 'sourceChest'),
  ]),
  // a lance of ice, and frost crystals growing around the victim
  boss_freeze: () => skill('boss_freeze', 'ice', 0.4, 1.2, [
    s(0, 'glow', 'sourceMouth', { size: 1.1, duration: 0.3 }, { element: 'ice' }),
    s(0.04, 'shot', 'sourceMouth', { size: 0.6, duration: 0.36, arc: 0.4, streak: true }, { to: 'targetChest', element: 'ice' }),
    s(0.38, 'shards', 'targetGround', { count: 9, radius: 0.8, height: 1.7, duration: 0.8 }, { element: 'ice' }),
    s(0.4, 'star', 'targetChest', { size: 1.4 }, { element: 'ice' }),
    s(0.42, 'burst', 'targetChest', { count: 18, speed: 3, gravity: 8, size: 0.1 }, { element: 'ice' }),
    s(0.46, 'motes', 'target', { count: 12, radius: 0.7, rise: 0.8 }, { element: 'ice' }),
    lit(0.4, 'ice', 14, 0.5),
    shake(0.4, 0.2, 0.16),
  ]),
  // two thrown blades nail the target to the spot
  boss_pin: () => skill('boss_pin', 'steel', 0.26, 0.9, [
    s(0, 'shot', 'sourceChest', { size: 0.8, duration: 0.2, arc: 0.1, streak: true, ox: -0.2 }, { to: 'targetChest', element: 'steel' }),
    s(0.06, 'shot', 'sourceChest', { size: 0.8, duration: 0.2, arc: 0.1, streak: true, ox: 0.2 }, { to: 'targetChest', element: 'steel' }),
    s(0.24, 'shards', 'targetGround', { count: 4, radius: 0.35, height: 1, duration: 0.6 }, { element: 'steel' }),
    s(0.26, 'star', 'targetChest', { size: 1 }, { element: 'blood' }),
    s(0.27, 'burst', 'targetChest', { count: 12, speed: 3, size: 0.09 }, { element: 'blood' }),
    shake(0.26, 0.22, 0.14),
  ]),
  // the light drops, the blade rises, then a single cut from top to bottom
  boss_execution: () => ultimate('boss_execution', 'blood', 0.9, 1.7, [
    s(0.05, 'converge', 'source', { count: 34, radius: 2.4, duration: 0.7, height: 2.4 }, { element: 'blood' }),
    s(0.5, 'flash', undefined, { opacity: 0.22, dark: true }),
    s(0.78, 'slash', 'targetChest', { size: 6, angle: 0.02, thickness: 0.9, duration: 0.2 }, { element: 'blood' }),
    s(0.9, 'star', 'targetChest', { size: 2.8, duration: 0.34 }, { element: 'blood' }),
    s(0.9, 'slowmo', undefined, { scale: 0.2, duration: 0.3 }),
    s(0.9, 'punch', 'targetChest', { duration: 0.46, hold: true }),
    shake(0.9, 0.6, 0.3),
    lit(0.9, 'blood', 30, 0.7),
    s(0.92, 'burst', 'targetChest', { count: 34, speed: 4.4, up: 1.2, gravity: 8, size: 0.12 }, { element: 'blood' }),
    s(0.96, 'motes', 'target', { count: 16, radius: 0.5, sink: true }, { element: 'shadow' }),
  ]),
  // a stream of thrown blades, each one sparking on the target
  boss_flurry: () => {
    const steps: Steps = [s(0.02, 'burst', 'sourceGround', { count: 16, speed: 2, up: 0.5, gravity: 3, size: 0.13, soft: true }, { element: 'earth' })];
    for (let i = 0; i < 6; i++) {
      const at = 0.42 + i * 0.07;
      steps.push(
        s(at, 'shot', 'sourceChest', { size: 0.8, duration: 0.14, arc: 0.1 * (i % 3 - 1), streak: true, oy: (i % 3 - 1) * 0.3 }, { to: 'targetChest', element: 'steel' }),
        s(at + 0.14, 'star', 'targetChest', { size: 1.1, duration: 0.16, jitter: 0.5 }, { element: 'gold' }),
        shake(at + 0.14, 0.14, 0.06),
      );
    }
    steps.push(
      s(0.92, 'star', 'targetChest', { size: 2.2, duration: 0.3 }, { element: 'steel' }),
      s(0.92, 'slowmo', undefined, { scale: 0.35, duration: 0.18 }),
      s(0.92, 'punch', 'targetChest', { duration: 0.42, hold: true }),
      lit(0.92, 'gold', 22, 0.5),
      s(0.94, 'burst', 'targetChest', { count: 26, speed: 4.6, size: 0.1, gravity: 8 }, { element: 'gold' }),
    );
    return ultimate('boss_flurry', 'steel', 0.92, 1.55, steps);
  },
  // fire from below: the seal cracks open and a column of flame takes the zone
  boss_inferno: () => ultimate('boss_inferno', 'fire', 0.85, 2.05, [
    s(0.05, 'converge', 'source', { count: 32, radius: 2.2, duration: 0.7, height: 2 }, { element: 'fire' }),
    s(0.1, 'circle', 'point', { radius: 2.9, duration: 0.85, spin: 2 }, { element: 'fire' }),
    s(0.7, 'burst', 'point', { count: 26, speed: 1.4, up: 3.4, gravity: -0.2, size: 0.11, life: 0.8, spread: 1.6, soft: true }, { element: 'fire' }),
    s(0.8, 'pillar', 'point', { radius: 1.25, height: 13, duration: 0.95 }, { element: 'fire' }),
    s(0.85, 'flame', 'targetGround', { width: 1.05, height: 3, duration: 1.05, stagger: 0.05, origin: 'point' }, { cells: true }),
    s(0.85, 'ring', 'point', { radius: 3.8, duration: 0.5 }, { element: 'fire' }),
    s(0.85, 'star', 'targetChest', { size: 2.2 }, { element: 'fire', each: true }),
    s(0.85, 'slowmo', undefined, { scale: 0.36, duration: 0.26 }),
    s(0.85, 'punch', 'point', { duration: 0.5 }),
    s(0.85, 'flash', undefined, { opacity: 0.22 }, { element: 'fire' }),
    shake(0.85, 0.56, 0.4),
    lit(0.85, 'fire', 50, 1.1, 'point'),
    s(1.05, 'smoke', 'point', { count: 26, spread: 1.6, size: 1 }),
  ], { flashElement: 'fire' }),
  // the sky turns red and falls on the whole battlefield
  boss_apocalypse: () => ultimate('boss_apocalypse', 'blood', 1.1, 2.4, [
    s(0.05, 'converge', 'source', { count: 40, radius: 3, duration: 0.9, height: 3 }, { element: 'blood' }),
    lit(0.2, 'blood', 40, 0.9, 'pointSky'),
    s(0.25, 'burst', 'pointSky', { count: 70, speed: 0.6, up: 0, gravity: 1.6, size: 0.17, life: 1, spread: 5, soft: true }, { element: 'blood' }),
    s(0.55, 'flash', undefined, { opacity: 0.2, dark: true }),
    s(0.8, 'rain', 'targetGround', { count: 2, gap: 0.12, width: 0.24, spread: 0.4, duration: 0.22, stagger: 0.03, origin: 'point', every: 2 }, { cells: true, element: 'fire' }),
    s(1.1, 'ring', 'point', { radius: 5.6, duration: 0.6 }, { element: 'blood' }),
    s(1.1, 'flash', undefined, { opacity: 0.26 }, { element: 'blood' }),
    s(1.1, 'slowmo', undefined, { scale: 0.32, duration: 0.3 }),
    s(1.1, 'punch', 'point', { duration: 0.55 }),
    shake(1.1, 0.72, 0.5),
    lit(1.1, 'blood', 44, 1.1, 'point'),
    s(1.1, 'star', 'targetChest', { size: 2.2 }, { element: 'blood', each: true }),
    s(1.14, 'flame', 'targetGround', { width: 1.02, height: 2.2, duration: 0.95, stagger: 0.04, origin: 'point', every: 2 }, { cells: true }),
    s(1.3, 'smoke', 'point', { count: 30, spread: 2.4, size: 1.1, life: 1.2 }),
  ], { flashElement: 'blood' }),
};

const bite = (id: string, element: FxElement, size: number): FxRecipe => skill(id, element, 0.08, 0.6, [
  ...fangs(0, element, size),
  s(0.08, 'star', 'targetChest', { size: 0.75, duration: 0.16 }, { element }),
  s(0.09, 'burst', 'targetChest', { count: 10, speed: 2.6, size: 0.08, gravity: 8 }, { element: 'blood' }),
  shake(0.08, 0.1, 0.1),
]);
const thrown = (id: string, element: FxElement, size: number, speed: number, arc: number, streak: boolean): FxRecipe => skill(id, element, 0.02, 0.6, [
  s(0, 'star', 'targetChest', { size: 0.8, duration: 0.16 }, { element, afterHit: true }),
  s(0.01, 'burst', 'targetChest', { count: 10, speed: 2.4, up: 1.2, gravity: 9, size: 0.09 }, { element, afterHit: true }),
  shake(0, 0.1, 0.1, { afterHit: true }),
], { projectile: { at: 0.02, from: 'sourceChest', to: 'targetChest', element, speed, size, arc, streak } });
// a breath leaves the mouth and lands on the target, whatever the distance
const puff = (id: string, element: FxElement): FxRecipe => skill(id, element, 0.34, 0.85, [
  s(0, 'glow', 'sourceMouth', { size: 0.9, duration: 0.24 }, { element }),
  ...[0, 0.05, 0.1, 0.15].map((at) => s(at, 'burst', 'sourceMouth', { count: 20, cone: 0.32, life: 0.34, size: 0.17, up: 0, reach: true, spray: 'target' }, { element })),
  s(0.34, 'star', 'targetChest', { size: 1.05, duration: 0.18 }, { element }),
  s(0.36, 'burst', 'targetChest', { count: 10, speed: 1.6, up: 1.8, gravity: 0, size: 0.1, life: 0.5, soft: true }, { element }),
  shake(0.34, 0.12, 0.1),
]);

/** Basic attacks that are no weapon at all: teeth, claws, breath, stones. Keyed by weapon name. */
const ENEMY_ATTACKS: Readonly<Record<string, () => FxRecipe>> = {
  Morsure: () => bite('attack_bite', 'steel', 1.5),
  Mandibules: () => bite('attack_mandibles', 'earth', 1.7),
  Crochets: () => bite('attack_fangs', 'poison', 1.4),
  Griffes: () => skill('attack_claws', 'blood', 0.1, 0.6, [
    ...[-0.34, 0, 0.34].map((ox, i) => s(0.02 * i, 'slash', 'targetChest', { size: 1.9, angle: 0.5, ox, thickness: 0.5, duration: 0.14 }, { element: 'blood' })),
    s(0.1, 'burst', 'targetChest', { count: 10, speed: 2.8, size: 0.08, gravity: 8 }, { element: 'blood' }),
    shake(0.1, 0.12, 0.1),
  ]),
  'Langue lourde': () => skill('attack_tongue', 'poison', 0.12, 0.6, [
    s(0, 'streak', 'sourceChest', { width: 0.34, duration: 0.2 }, { to: 'targetChest', element: 'poison' }),
    s(0.12, 'star', 'targetChest', { size: 0.95, duration: 0.16 }, { element: 'nature' }),
    s(0.13, 'burst', 'targetChest', { count: 12, speed: 1.8, up: 0.6, gravity: 7, size: 0.1 }, { element: 'poison' }),
    shake(0.12, 0.14, 0.1),
  ]),
  Charge: () => skill('attack_ram', 'earth', 0.08, 0.65, [
    s(0, 'burst', 'targetGround', { count: 16, speed: 2.6, up: 0.9, gravity: 4, size: 0.14, soft: true }, { element: 'earth' }),
    s(0.08, 'star', 'targetChest', { size: 1.2 }, { element: 'blunt' }),
    s(0.09, 'burst', 'targetChest', { count: 12, speed: 3.4, up: 1, gravity: 8, size: 0.1 }, { element: 'blunt' }),
    shake(0.08, 0.24, 0.14),
  ]),
  'Jet de pierre': () => thrown('attack_rock', 'earth', 0.7, 13, 1, false),
  Fronde: () => thrown('attack_sling', 'blunt', 0.26, 24, 0.4, false),
  'Lames volantes': () => thrown('attack_thrown_blades', 'steel', 0.42, 26, 0.12, true),
  'Lames de jet': () => thrown('attack_thrown_blades', 'steel', 0.42, 26, 0.12, true),
  'Souffle court': () => puff('attack_breath', 'fire'),
  'Souffle emeraude': () => puff('attack_emerald_breath', 'nature'),
  'Onde froide': () => puff('attack_cold_wave', 'ice'),
  Sceau: () => skill('attack_seal', 'arcane', 0.24, 0.75, [
    s(0, 'orbit', 'target', { count: 8, radius: 0.55, duration: 0.3, rise: 1.3, spin: 9 }, { element: 'arcane' }),
    s(0.22, 'star', 'targetChest', { size: 1 }, { element: 'arcane' }),
    s(0.24, 'burst', 'targetChest', { count: 12, speed: 2.6, size: 0.09 }, { element: 'arcane' }),
    shake(0.24, 0.1, 0.1),
  ]),
};

const SKILL_RECIPES: Readonly<Record<string, () => FxRecipe>> = {
  ...warrior, ...paladin, ...darkKnight, ...lancer, ...darkMage, ...whiteMage, ...redMage, ...enchanter, ...archer, ...ninja, ...rogue, ...gunner, ...enemies,
};

// ------------------------------------------------------------ movement

export type FxMovePhase = 'depart' | 'arrive';

const move = (id: string, element: FxElement, steps: Steps): FxRecipe => skill(id, element, 0.06, 0.8, steps);
const dust = (at: number, count = 16, anchor: FxAnchor = 'sourceGround'): FxStep => s(at, 'burst', anchor, { count, speed: 2, up: 0.8, gravity: 4, size: 0.14, soft: true }, { element: 'earth' });

/** Departure and arrival of the skills that move a unit; both play on the unit itself. */
const MOVE_RECIPES: Readonly<Record<string, Partial<Record<FxMovePhase, () => FxRecipe>>>> = {
  w_charge: {
    depart: () => move('w_charge_depart', 'gold', [dust(0, 22), s(0, 'ring', 'sourceChest', { radius: 1.5, duration: 0.24, ground: false, from: 0.3 }, { element: 'gold' })]),
    arrive: () => move('w_charge_arrive', 'gold', [
      s(0, 'slash', 'sourceChest', { size: 3.4, angle: -0.35, ox: 0.5, thickness: 1, duration: 0.24 }, { element: 'gold' }),
      s(0.04, 'star', 'sourceChest', { size: 1.5, ox: 0.5 }, { element: 'steel' }),
      dust(0.02, 24), lit(0.04, 'gold', 14, 0.35, 'sourceChest'),
    ]),
  },
  p_interpose: {
    depart: () => move('p_interpose_depart', 'holy', [dust(0, 12), s(0, 'glow', 'sourceChest', { size: 1.3, duration: 0.3 }, { element: 'holy' })]),
    arrive: () => move('p_interpose_arrive', 'holy', [s(0, 'ring', 'sourceGround', { radius: 2, duration: 0.42 }, { element: 'holy' }), dust(0, 16), s(0.02, 'pillar', 'sourceGround', { radius: 0.4, height: 5, duration: 0.36 }, { element: 'holy' })]),
  },
  d_void_step: {
    depart: () => move('d_void_step_depart', 'shadow', [s(0, 'orb', 'sourceChest', { radius: 1.3, duration: 0.3, implode: true, dark: true }, { element: 'shadow' }), s(0, 'converge', 'source', { count: 22, radius: 1.5, duration: 0.3 }, { element: 'shadow' })]),
    arrive: () => move('d_void_step_arrive', 'shadow', [s(0, 'orb', 'sourceChest', { radius: 1.1, duration: 0.34, dark: true }, { element: 'shadow' }), s(0.02, 'burst', 'sourceChest', { count: 20, speed: 3.2, size: 0.1 }, { element: 'shadow' }), s(0.06, 'motes', 'source', { count: 12, radius: 0.5, sink: true }, { element: 'shadow' })]),
  },
  l_griffon_jump: {
    depart: () => move('l_griffon_jump_depart', 'sky', [dust(0, 16), s(0, 'streak', 'sourceGround', { width: 0.34, duration: 0.2 }, { to: 'sourceSky', element: 'sky' })]),
  },
  l_haft_recoil: { arrive: () => move('l_haft_recoil_arrive', 'sky', [dust(0, 12)]) },
  n_teleport: {
    depart: () => move('n_teleport_depart', 'fire', [s(0, 'burst', 'sourceChest', { count: 22, speed: 2.4, up: 1.8, gravity: 1, size: 0.1, soft: true }, { element: 'fire' }), s(0, 'smoke', 'sourceChest', { count: 8, spread: 0.3 })]),
    arrive: () => move('n_teleport_arrive', 'fire', [s(0, 'flame', 'sourceGround', { width: 0.95, height: 1.5, duration: 0.5 }), s(0.02, 'burst', 'sourceChest', { count: 14, speed: 2.4, size: 0.09 }, { element: 'shadow' })]),
  },
  r_rune_step: {
    depart: () => move('r_rune_step_depart', 'blood', [s(0, 'circle', 'sourceGround', { radius: 1, duration: 0.32, spin: 4 }, { element: 'blood' }), s(0, 'burst', 'sourceChest', { count: 14, speed: 2, up: 1.6, size: 0.09 }, { element: 'blood' })]),
    arrive: () => move('r_rune_step_arrive', 'blood', [s(0, 'circle', 'sourceGround', { radius: 1, duration: 0.4, spin: -4 }, { element: 'blood' }), s(0, 'burst', 'sourceChest', { count: 14, speed: 2.4, size: 0.09 }, { element: 'arcane' })]),
  },
  e_transpose: {
    depart: () => move('e_transpose_depart', 'arcane', [s(0, 'orb', 'sourceChest', { radius: 0.85, duration: 0.2, implode: true }, { element: 'arcane' }), s(0, 'orbit', 'source', { count: 8, radius: 0.6, duration: 0.3, rise: 1.6, spin: 9 }, { element: 'arcane' })]),
    arrive: () => move('e_transpose_arrive', 'arcane', [s(0, 'star', 'sourceChest', { size: 1.1, duration: 0.22 }, { element: 'arcane' }), s(0, 'orbit', 'source', { count: 8, radius: 0.7, duration: 0.5, rise: 1.8, spin: -7 }, { element: 'gold' })]),
  },
  a_hawk_leap: {
    depart: () => move('a_hawk_leap_depart', 'wind', [s(0, 'burst', 'sourceChest', { count: 18, speed: 2, up: 2.4, gravity: 0.6, size: 0.12, life: 0.8, soft: true }, { element: 'wind' })]),
    arrive: () => move('a_hawk_leap_arrive', 'wind', [dust(0, 8), s(0.02, 'burst', 'sourceChest', { count: 12, speed: 1.4, up: 1.4, gravity: 0.8, size: 0.11, life: 0.7, soft: true }, { element: 'wind' })]),
  },
  ni_shadow_step: {
    depart: () => move('ni_shadow_step_depart', 'shadow', [s(0, 'smoke', 'source', { count: 16, spread: 0.45, size: 0.65 })]),
    arrive: () => move('ni_shadow_step_arrive', 'shadow', [s(0, 'smoke', 'source', { count: 8, spread: 0.3, size: 0.5 })]),
  },
  ni_smoke_bomb: {},
  ni_silent_assassin: {
    depart: () => move('ni_silent_assassin_depart', 'shadow', [s(0, 'smoke', 'source', { count: 22, spread: 0.5, size: 0.7 })]),
    arrive: () => move('ni_silent_assassin_arrive', 'shadow', [s(0, 'smoke', 'source', { count: 10, spread: 0.35, size: 0.5 })]),
  },
  ro_tumble: {
    depart: () => move('ro_tumble_depart', 'earth', [dust(0, 14)]),
    arrive: () => move('ro_tumble_arrive', 'earth', [dust(0, 10)]),
  },
  ar_explosive_retreat: { arrive: () => move('ar_explosive_retreat_arrive', 'earth', [dust(0, 12)]) },
};

export function skillFxRecipe(skillId: string): FxRecipe | null {
  const recipe = SKILL_RECIPES[skillId]?.();
  return recipe ? withSoundMarks(recipe) : null;
}

export function skillMoveFxRecipe(skillId: string, phase: FxMovePhase): FxRecipe | null {
  const recipe = MOVE_RECIPES[skillId]?.[phase]?.();
  return recipe ? withMoveSound(recipe, phase) : null;
}

/** The basic attack of an enemy that fights with teeth, claws, breath or stones. */
export function enemyAttackFxRecipe(weaponName: string | undefined): FxRecipe | null {
  const recipe = weaponName ? ENEMY_ATTACKS[weaponName]?.() : null;
  return recipe ? withSoundMarks(recipe) : null;
}

export function listEnemyAttackWeapons(): string[] {
  return Object.keys(ENEMY_ATTACKS);
}

/** True when a moving skill plays its own departure and arrival, not a shared preset. */
export function hasSkillMoveFx(skillId: string): boolean {
  return skillId in MOVE_RECIPES;
}

export function listSkillFxRecipes(): string[] {
  return Object.keys(SKILL_RECIPES);
}
