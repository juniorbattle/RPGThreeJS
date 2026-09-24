/** Presentation-only campaign chrome. Icons and ornaments are static, authored SVG. */
export type CampaignIcon = 'gold' | 'reputation' | 'destination' | 'dialogue' | 'merchant';

const paths: Record<CampaignIcon, string> = {
  gold: '<circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="9"/><path d="M16 7.5 18.4 13.6 24.5 16 18.4 18.4 16 24.5 13.6 18.4 7.5 16 13.6 13.6Z"/><path d="M16 11v10M11 16h10"/>',
  reputation: '<path d="M5.5 5.5h21v10c0 7-5.3 11.3-10.5 14-5.2-2.7-10.5-7-10.5-14Z"/><path d="M8.5 8.5h15v7c0 4.8-3.3 8.2-7.5 10.6-4.2-2.4-7.5-5.8-7.5-10.6Z"/><path d="m16 10 1.7 3.2 3.6.5-2.6 2.5.6 3.6-3.3-1.7-3.3 1.7.6-3.6-2.6-2.5 3.6-.5Z"/>',
  destination: '<path d="M16 29s9-8.9 9-16a9 9 0 0 0-18 0c0 7.1 9 16 9 16Z"/><circle cx="16" cy="13" r="3.4"/>',
  dialogue: '<path d="M5 7.5h22v14H14l-6 5v-5H5Z"/><circle cx="11" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/><circle cx="21" cy="14.5" r="1"/>',
  merchant: '<path d="M5 13h22l-2-7H7Z"/><path d="M7 13v14h18V13M11 27v-9h10v9M5 13c0 3 4 4 5.5 1.5 1.5 2.5 4.5 2.5 5.5 0 1 2.5 4 2.5 5.5 0 1.5 2.5 5.5 1.5 5.5-1.5"/>',
};

export function createCampaignIcon(name: CampaignIcon): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = `campaign-ui-icon campaign-ui-icon--${name}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" focusable="false">${paths[name]}</svg>`;
  return icon;
}

export function decorateCampaignFrame(element: HTMLElement, density: 'compact' | 'standard' | 'hero'): void {
  element.classList.add('campaign-ui-frame', `campaign-ui-frame--${density}`);
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    const ornament = document.createElement('span');
    ornament.className = `campaign-ui-frame__corner campaign-ui-frame__corner--${corner}`;
    ornament.setAttribute('aria-hidden', 'true');
    element.append(ornament);
  }
}
