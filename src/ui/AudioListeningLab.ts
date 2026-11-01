import { soundWeight } from '../audio/cueTable';
import { sectionSeconds, THEMES, type MusicContextId } from '../audio/music/themes';
import { combatLaunchSound } from '../combat/CombatAudio';
import { enemyAttackFxRecipe, listEnemyAttackWeapons, listSkillFxRecipes, skillFxRecipe } from '../combat/fx/fxSkills';
import { markCue } from '../combat/fx/fxSounds';
import type { FxRecipe } from '../combat/fx/fxRecipes';
import { ENEMY_SKILL_PRESENTATION, SKILL_PRESENTATION } from '../combat/skillPresentation';
import { skillById } from '../game/skills';
import type { TacticalSoundId } from './GameSoundCatalog';
import type { UiSoundPlayer } from './UiSoundPlayer';
import './ui-sound.css';

const TRACKS: ReadonlyArray<{ id: MusicContextId; label: string }> = [
  { id: 'title', label: 'Titre' }, { id: 'map', label: 'Carte' }, { id: 'refuge', label: 'Refuge' }, { id: 'tension', label: 'Tension' }, { id: 'drama', label: 'Drame' },
  { id: 'combat', label: 'Combat' }, { id: 'boss', label: 'Boss' }, { id: 'victory', label: 'Fanfare de victoire' }, { id: 'defeat', label: 'Fanfare de défaite' },
];
const AMBIENCES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'forest_route', label: 'Route forestière' }, { id: 'bois_clair_burning', label: 'Bois-Clair en feu' }, { id: 'lion_sanctum', label: 'Sanctuaire du Lion' },
  { id: 'map', label: 'Carte' }, { id: 'refuge', label: 'Refuge' },
];
const LAB_SCOPE = 'listening-lab';
const FLIGHT = 0.5;

interface Row { key: string; label: string; buttons: ReadonlyArray<{ act: string; text: string }> }

const skillLabel = (id: string) => (skillById.get(id) as { name?: string } | undefined)?.name ?? id;

/** Every action's sound, in the order the player hears it. */
function actionSounds(recipe: FxRecipe, skill: string | null): Array<{ at: number; id: string }> {
  const spec = skill ? skillById.get(skill) as { ap?: number; type?: string; support?: boolean; heal?: boolean; revive?: boolean; cure?: boolean } | undefined : undefined;
  const presentation = skill ? (SKILL_PRESENTATION as Record<string, { motionPreset?: string }>)[skill] ?? (ENEMY_SKILL_PRESENTATION as Record<string, { motionPreset?: string }>)[skill] : undefined;
  const weight = soundWeight(spec?.ap ?? 1);
  const sounds: Array<{ at: number; id: string }> = [];
  const marks = recipe.marks ?? [];
  const signature = marks.some((mark) => mark.cue);
  const launch = skill ? combatLaunchSound({ key: skill, ...spec }, presentation?.motionPreset) : null;
  if (launch && !signature) sounds.push({ at: 0, id: launch });
  const lead = launch && !signature ? 0.28 : 0;
  for (const mark of marks) {
    const cue = markCue(mark, weight);
    if (cue) sounds.push({ at: lead + mark.at + (mark.afterHit ? FLIGHT : 0), id: cue });
  }
  const impact = lead + recipe.impactAt + (recipe.projectile ? FLIGHT : 0);
  if (spec?.type === 'phys' || spec?.type === 'mag' || !skill) sounds.push({ at: impact, id: spec?.type === 'mag' ? 'magic-impact' : 'physical-impact' });
  return sounds;
}

/**
 * Listening lab (OD-2026-11-01-B), dev builds only: every track, level, bridge, ambience and skill on demand, through
 * the parent owner, with a summary to send back. It starts nothing by itself and proves nothing: only the operator's
 * ear accepts. Preferences and game state stay untouched; this dialog owns focus only while open.
 */
export class AudioListeningLab {
  private element: HTMLElement | null = null;
  private restore: (() => void) | null = null;
  private timers: number[] = [];
  private serial = 0;
  private readonly notes = new Map<string, { label: string; verdict: string; note: string }>();
  constructor(private readonly root: HTMLElement, private readonly player: UiSoundPlayer) {}

  open(): void {
    if (this.element) return;
    const previous = document.activeElement as HTMLElement | null;
    const siblings = [...this.root.children].map(child => ({ child: child as HTMLElement, inert: (child as HTMLElement).inert }));
    for (const { child } of siblings) child.inert = true;
    const element = document.createElement('div'); element.className = 'ui-sound-backdrop';
    const trackRows: Row[] = TRACKS.map(({ id, label }) => {
      const theme = THEMES[id];
      const buttons = [{ act: `track:${id}`, text: theme.once ? 'Jouer' : 'Début' }];
      if (!theme.once) buttons.push({ act: `section:${id}:bridge`, text: 'Pont' });
      if (id === 'boss') buttons.push({ act: 'entry', text: 'Entrée' });
      if (id === 'combat' || id === 'boss') buttons.push({ act: 'level:reflection', text: 'Réflexion' }, { act: 'level:action', text: 'Action' });
      return { key: `piste:${id}`, label, buttons };
    });
    const ambienceRows: Row[] = AMBIENCES.map(({ id, label }) => ({ key: `ambiance:${id}`, label, buttons: [{ act: `ambience:${id}`, text: 'Jouer' }] }));
    const skillRows: Row[] = listSkillFxRecipes().map(id => ({ key: `compétence:${id}`, label: skillLabel(id), buttons: [{ act: `skill:${id}`, text: 'Jouer' }] }));
    const attackRows: Row[] = listEnemyAttackWeapons().map(name => ({ key: `attaque:${name}`, label: name, buttons: [{ act: `attack:${name}`, text: 'Jouer' }] }));
    const table = (title: string, rows: readonly Row[]) => `<h3 class="ui-sound-settings__group">${title}</h3><div class="audio-lab__table"><table><tbody>${rows.map(row => `<tr data-row="${row.key}" data-label="${row.label}"><th scope="row">${row.label}</th><td>${row.buttons.map(button => `<button type="button" data-act="${button.act}" aria-label="${button.text} : ${row.label}">${button.text}</button>`).join(' ')}</td><td><select data-verdict aria-label="Avis : ${row.label}"><option value="">—</option><option value="bien">Bien</option><option value="à revoir">À revoir</option></select></td><td><input data-note type="text" aria-label="Note : ${row.label}"></td></tr>`).join('')}</tbody></table></div>`;
    element.innerHTML = `<section class="ui-sound-settings audio-lab" role="dialog" aria-modal="true" aria-labelledby="audio-lab-title"><h2 id="audio-lab-title">Laboratoire d'écoute</h2><p data-lab-status role="status"></p><p><button type="button" data-act="stop">Arrêter tout</button></p>${table('Musiques', trackRows)}${table('Ambiances', ambienceRows)}${table('Compétences', skillRows)}${table('Attaques ennemies', attackRows)}<label for="audio-lab-summary">Avis à me transmettre</label><textarea id="audio-lab-summary" readonly rows="5"></textarea><button type="button" data-lab-close>Fermer</button></section>`;
    this.root.append(element); this.element = element;
    this.restore = () => {
      for (const { child, inert } of siblings) if (child.isConnected) child.inert = inert;
      if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    };
    const status = element.querySelector<HTMLElement>('[data-lab-status]')!;
    status.textContent = 'Préparation des sons…';
    this.player.beginCombat(LAB_SCOPE);
    void this.player.prepareCues().then(ready => {
      if (this.element) status.textContent = ready ? 'Tout est prêt. Écoutez, notez, puis copiez l’avis.' : 'Le son n’est pas disponible : cliquez dans la page puis rouvrez le laboratoire.';
    });
    element.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
      if (button) { this.act(button.dataset.act!, status); return; }
      if ((event.target as HTMLElement).closest('[data-lab-close]')) this.close();
    });
    const summarize = (event: Event) => {
      const row = (event.target as HTMLElement).closest<HTMLTableRowElement>('tr[data-row]');
      if (!row) return;
      const verdict = row.querySelector<HTMLSelectElement>('[data-verdict]')!.value, note = row.querySelector<HTMLInputElement>('[data-note]')!.value.trim();
      if (verdict || note) this.notes.set(row.dataset.row!, { label: row.dataset.label!, verdict, note });
      else this.notes.delete(row.dataset.row!);
      element.querySelector<HTMLTextAreaElement>('#audio-lab-summary')!.value = this.summary();
    };
    element.addEventListener('change', summarize);
    element.addEventListener('input', summarize);
    element.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(); }
      if (event.key === 'Tab') {
        const controls = [...element.querySelectorAll<HTMLElement>('button,select,input,textarea')], first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    element.querySelector<HTMLElement>('[data-act]')?.focus();
  }

  /** What the operator sends back: only the rows they rated. */
  summary(): string {
    return [...this.notes.entries()].map(([key, { label, verdict, note }]) => `${key.split(':')[0]} ${label} : ${verdict || 'sans avis'}${note ? ` (${note})` : ''}`).join('\n');
  }

  private act(act: string, status: HTMLElement): void {
    const [kind, value, extra] = act.split(':');
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
    if (kind === 'stop') { this.player.setMusicContext(null); this.player.setMusicScene(null); this.player.stop(); status.textContent = 'Arrêté.'; return; }
    if (kind === 'track') { this.player.setMusicContext(value as MusicContextId); status.textContent = `Piste : ${value}.`; return; }
    if (kind === 'section') {
      this.player.setMusicContext(value as MusicContextId);
      this.player.seekMusic(extra!);
      const section = THEMES[value as MusicContextId].sections.find(candidate => candidate.name === extra);
      status.textContent = `Pont de ${value} : ${section ? `${section.bpm} à la noire, ${section.beatsPerBar} temps, ${Math.round(sectionSeconds(section))} s` : ''}. Il commence à la prochaine partie.`;
      return;
    }
    if (kind === 'entry') { this.player.setMusicContext(null); this.player.setMusicContext('boss'); status.textContent = 'Entrée de boss, puis la piste.'; return; }
    if (kind === 'level') { this.player.setMusicLevel(LAB_SCOPE, value as 'reflection' | 'action'); status.textContent = value === 'action' ? 'Niveau Action.' : 'Niveau Réflexion.'; return; }
    if (kind === 'ambience') { this.player.setMusicScene(value!); status.textContent = `Ambiance : ${value}.`; return; }
    const recipe = kind === 'skill' ? skillFxRecipe(value!) : kind === 'attack' ? enemyAttackFxRecipe(value) : null;
    if (!recipe) return;
    for (const { at, id } of actionSounds(recipe, kind === 'skill' ? value! : null)) {
      this.timers.push(window.setTimeout(() => this.player.playCombat(id as TacticalSoundId, LAB_SCOPE, `lab:${++this.serial}`), at * 1000));
    }
    status.textContent = `Son de ${kind === 'skill' ? skillLabel(value!) : value}.`;
  }

  close(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
    this.player.endCombat(LAB_SCOPE);
    this.player.setMusicScene(null);
    this.player.setMusicContext('title');
    this.element?.remove(); this.element = null; this.restore?.(); this.restore = null;
  }
}
