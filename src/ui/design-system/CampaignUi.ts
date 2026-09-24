/** Presentation-only UI kit. No state, save, or gameplay authority lives here. */
export const CAMPAIGN_ICON_IDS = [
  'gold', 'reputation', 'destination', 'dialogue', 'merchant', 'danger',
  'combat', 'reward', 'rest', 'clan', 'inventory', 'upgrade',
] as const;
export type CampaignIcon = typeof CAMPAIGN_ICON_IDS[number];
export type CampaignFrame = 'compact' | 'standard' | 'hero';
export type CampaignButton = 'primary' | 'secondary' | 'disabled' | 'danger';
export type CampaignBadge = 'optional' | 'danger' | 'reputation' | 'new' | 'merchant';
export type CampaignDivider = 'horizontal' | 'horizontal-compact' | 'vertical' | 'diamond' | 'terminal';

/** Shared 32px grid and 1.5px stroke keep the family legible at 18–32px. */
const paths: Record<CampaignIcon, string> = {
  gold: '<ellipse cx="16" cy="9" rx="9" ry="3.5"/><path d="M7 9v5c0 2 4 3.5 9 3.5s9-1.5 9-3.5V9M7 14v5c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-5M7 19v5c0 2 4 3.5 9 3.5s9-1.5 9-3.5v-5"/><path d="M16 6.5v5"/>',
  reputation: '<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="8"/><path d="M16 3v5m0 16v5M3 16h5m16 0h5M16 10l1.8 4.2L22 16l-4.2 1.8L16 22l-1.8-4.2L10 16l4.2-1.8Z"/>',
  destination: '<circle cx="16" cy="16" r="12"/><path d="M16 3v26M3 16h26M16 7l2.4 6.6L25 16l-6.6 2.4L16 25l-2.4-6.6L7 16l6.6-2.4Z"/>',
  dialogue: '<path d="M5 7.5h22v14H14l-6 5v-5H5Z"/><circle cx="11" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/><circle cx="21" cy="14.5" r="1"/>',
  merchant: '<path d="M8 11h16l2 15H6Z M11 11V9a5 5 0 0 1 10 0v2 M11 18l5 4 5-4 M16 15v9"/><circle cx="24" cy="23" r="3"/>',
  danger: '<path d="M16 3 29 16 16 29 3 16Z"/><path d="M11 13a5 5 0 1 1 10 0c0 2-1 3-2 4v2h-6v-2c-1-1-2-2-2-4ZM13 22v3m3-3v3m3-3v3M11 19h10"/>',
  combat: '<path d="M5 5 23 23m-4 2 6-6M9 25l4-4M27 5 9 23m4 2-6-6M23 25l-4-4"/><path d="m4 4 6 2-4 4Zm24 0-6 2 4 4Z"/>',
  reward: '<path d="M8 7h16v9a8 8 0 0 1-16 0ZM8 10H4v3a5 5 0 0 0 5 5m15-8h4v3a5 5 0 0 1-5 5M16 24v4m-6 0h12"/><path d="m16 11 1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4Z"/>',
  rest: '<path d="M16 5c3 5-1 7 2 11 2-3 3-4 3-7 5 5 7 10 4 15-2 3-5 5-9 5s-7-2-9-5c-3-5 0-10 4-14 0 4 1 5 2 7 2-4 0-7 3-12Z"/><path d="M16 18c2 3 4 5 3 8-1 2-5 2-6 0-1-3 1-5 3-8Z"/>',
  clan: '<path d="M8 4h16v21l-8 4-8-4Z"/><path d="M11 8h10v13l-5 3-5-3Z M16 10v10m-5-5h10"/>',
  inventory: '<path d="M5 10h22v17H5Z M10 10V7a6 6 0 0 1 12 0v3 M5 15h22 M13 15v4h6v-4"/><path d="M10 24h12"/>',
  upgrade: '<path d="M5 24h22v3H5ZM8 24l2-11h12l2 11M10 13l3-5h6l3 5M16 4v8m-4-4h8"/>',
};

export function createCampaignIcon(name: CampaignIcon, label?: string): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = `campaign-ui-icon campaign-ui-icon--${name}`;
  if (label) { icon.setAttribute('role', 'img'); icon.setAttribute('aria-label', label); }
  else icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" focusable="false">${paths[name]}</svg>`;
  return icon;
}

export function decorateCampaignFrame(element: HTMLElement, density: CampaignFrame): void {
  element.classList.remove('campaign-ui-frame--compact', 'campaign-ui-frame--standard', 'campaign-ui-frame--hero');
  element.classList.add('campaign-ui-frame', `campaign-ui-frame--${density}`);
  element.querySelectorAll(':scope > .campaign-ui-frame__corner').forEach(corner => corner.remove());
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    const ornament = document.createElement('span');
    ornament.className = `campaign-ui-frame__corner campaign-ui-frame__corner--${corner}`;
    ornament.setAttribute('aria-hidden', 'true');
    element.append(ornament);
  }
}

export function decorateCampaignButton(button: HTMLButtonElement, variant: CampaignButton): HTMLButtonElement {
  button.classList.remove('campaign-ui-button--primary', 'campaign-ui-button--secondary', 'campaign-ui-button--disabled', 'campaign-ui-button--danger');
  button.classList.add('campaign-ui-button', `campaign-ui-button--${variant}`);
  button.disabled = variant === 'disabled';
  return button;
}

export function createCampaignBadge(label: string, variant: CampaignBadge, icon?: CampaignIcon): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = `campaign-ui-badge campaign-ui-badge--${variant}`;
  if (icon) badge.append(createCampaignIcon(icon));
  const text = document.createElement('span');
  text.textContent = label;
  badge.append(text);
  return badge;
}

export function createCampaignDivider(variant: CampaignDivider): HTMLSpanElement {
  const divider = document.createElement('span');
  divider.className = `campaign-ui-divider campaign-ui-divider--${variant}`;
  divider.setAttribute('aria-hidden', 'true');
  return divider;
}
