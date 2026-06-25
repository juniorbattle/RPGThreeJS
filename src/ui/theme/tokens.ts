export const uiClass = {
  button: 'ui-button',
  iconButton: 'ui-icon-button',
  panel: 'ui-panel',
  hud: 'ui-hud',
  eyebrow: 'ui-eyebrow',
  sectionTitle: 'ui-section-title',
  tab: 'ui-tab',
  stat: 'ui-stat',
  chip: 'ui-chip',
  routeCard: 'ui-route-card',
} as const;

export type UiClassName = typeof uiClass[keyof typeof uiClass];
