/** Dev-only rendered contract board. This module is never imported by the game. */
import { CampaignStatusHud } from '../src/ui/CampaignStatusHud';
import { JourneyOverlay } from '../src/cinematics/JourneyOverlay';
import {
  CAMPAIGN_ICON_IDS, createCampaignBadge, createCampaignDivider, createCampaignIcon,
  decorateCampaignButton, decorateCampaignFrame,
  type CampaignBadge, type CampaignFrame,
} from '../src/ui/design-system/CampaignUi';

const byId = (id: string) => document.getElementById(id)!;
const panel = (density: CampaignFrame, content: string) => {
  const element = document.createElement('div');
  element.innerHTML = content;
  decorateCampaignFrame(element, density);
  return element;
};
for (const id of ['kit-type', 'kit-icons', 'kit-buttons', 'kit-badges', 'kit-ornaments']) {
  decorateCampaignFrame(byId(id), 'compact');
}

const type = byId('kit-type');
type.classList.add('kit-type-grid');
for (const [label, value, variant] of [
  ['Titre / lieu', 'Vers Refuge du Lion', 'display'],
  ['Titre de panneau', 'Marchande itinérante', 'title'],
  ['Titre compact', 'Prochain arrêt', 'compact-title'],
  ['Label', 'OR · RÉPUTATION', 'eyebrow'],
  ['Valeur', '150 · 30 · ~ 3.6 km', 'value'],
  ['Texte descriptif', 'Chaque pas vous rapproche de votre destinée.', 'body'],
  ['Métadonnée', '+40 route · Méfiant', 'metadata'],
  ['Bouton', 'Prendre la route', 'button'],
]) {
  const name = document.createElement('span');
  name.textContent = label;
  const sample = document.createElement('p');
  sample.className = `campaign-ui-type--${variant}`;
  sample.textContent = value;
  type.append(name, sample);
}

for (const density of ['compact', 'standard', 'hero'] as const) {
  const sample = document.createElement('div');
  sample.className = 'kit-frame-example';
  const frame = panel(density, `<span class="campaign-ui-type--eyebrow">FRAME_${density.toUpperCase()}</span><h3 class="campaign-ui-type--compact-title">Titre du panneau</h3><p class="campaign-ui-type--metadata">Même langage, détails dosés.</p>`);
  frame.classList.add('kit-frame');
  sample.append(frame);
  byId('kit-frames').append(sample);
}
for (const id of CAMPAIGN_ICON_IDS) {
  const cell = document.createElement('div');
  cell.className = 'kit-icon-cell';
  cell.append(createCampaignIcon(id));
  const label = document.createElement('span');
  label.textContent = id;
  cell.append(label);
  byId('kit-icons').append(cell);
}
for (const [label, variant] of [
  ['PRENDRE LA ROUTE', 'primary'], ['RENCONTRER', 'secondary'],
  ['INDISPONIBLE', 'disabled'], ['ATTAQUER', 'danger'],
] as const) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  decorateCampaignButton(button, variant);
  byId('kit-buttons').append(button);
}
for (const proof of ['hover', 'focus'] as const) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = proof === 'hover' ? 'SURVOL' : 'FOCUS';
  decorateCampaignButton(button, 'primary');
  button.classList.add(`campaign-ui-button--${proof}-proof`);
  byId('kit-buttons').append(button);
}
for (const [label, variant, icon] of [
  ['OPTIONNEL', 'optional', 'destination'], ['DANGER', 'danger', 'danger'],
  ['RÉPUTATION -2', 'reputation', 'reputation'], ['NOUVEAU', 'new', 'reward'],
  ['MARCHAND', 'merchant', 'merchant'],
] as const) byId('kit-badges').append(createCampaignBadge(label, variant satisfies CampaignBadge, icon));
for (const variant of ['horizontal', 'horizontal-compact', 'vertical', 'diamond', 'terminal'] as const) {
  byId('kit-ornaments').append(createCampaignDivider(variant));
}
for (const density of ['compact', 'standard', 'hero'] as const) {
  const corner = document.createElement('span');
  corner.className = `campaign-ui-frame__corner campaign-ui-frame__corner--tl campaign-ui-frame__corner--${density}`;
  corner.setAttribute('aria-hidden', 'true');
  byId('kit-ornaments').append(corner);
}

const example = (title: string, element: HTMLElement) => {
  const wrapper = document.createElement('section');
  wrapper.className = 'kit-example';
  const heading = document.createElement('h3');
  heading.textContent = title;
  wrapper.append(heading, element);
  byId('kit-examples').append(wrapper);
};
const hud = new CampaignStatusHud(() => ({ gold: 150, routeGold: 40, reputation: 30, reputationLabel: 'Méfiant' }));
hud.refresh();
example('7.1 CampaignStatusHud (compact)', hud.element);

const next = panel('compact', '<div class="traversal-hud__destination-icon"></div><div class="traversal-hud__destination-copy"><p class="campaign-ui-type--eyebrow">Prochain arrêt</p><strong class="campaign-ui-type--compact-title" data-traversal-next>Piste des Bêtes</strong><span class="campaign-ui-type--metadata" data-traversal-distance>~ 3.6 km</span></div><div class="traversal-route-rail"></div>');
next.classList.add('traversal-hud', 'traversal-hud--progress');
next.querySelector('.traversal-hud__destination-icon')!.append(createCampaignIcon('destination'));
example('7.2 Prochain arrêt', next);

const departure = new JourneyOverlay(
  { mode: 'single', eyebrow: 'Départ', title: 'Vers Refuge du Lion', continueLabel: 'Prendre la route', choices: [] },
  { onCommit: () => undefined },
);
example('7.3 Départ', departure.element);

const merchant = panel('standard', '<span class="traversal-event-panel__marker"></span><div><small class="campaign-ui-type--eyebrow">Rencontre facultative</small><strong class="campaign-ui-type--title">Marchande itinérante</strong><p class="campaign-ui-type--body">Une marchande a installé son étal à l’abri des arbres.</p><div class="traversal-event-panel__actions"></div></div>');
merchant.classList.add('traversal-event-panel');
merchant.querySelector('.traversal-event-panel__marker')!.append(createCampaignIcon('merchant'));
for (const [label, variant] of [['Rencontrer', 'primary'], ['Ignorer', 'secondary']] as const) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (variant === 'secondary') button.dataset.traversalSkip = 'true';
  merchant.querySelector('.traversal-event-panel__actions')!.append(decorateCampaignButton(button, variant));
}
example('7.4 Marchande itinérante', merchant);
document.documentElement.dataset.kitReady = 'true';
