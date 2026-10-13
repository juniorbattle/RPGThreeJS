// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_ICON_IDS, createCampaignBadge, createCampaignDivider, createCampaignIcon,
  decorateCampaignButton, decorateCampaignFrame,
} from './CampaignUi';

describe('campaign UI kit primitives', () => {
  it('resolves every canonical icon as decorative SVG unless given an accessible label', () => {
    expect(CAMPAIGN_ICON_IDS).toHaveLength(12);
    for (const id of CAMPAIGN_ICON_IDS) {
      const icon = createCampaignIcon(id);
      expect(icon.querySelector('svg path, svg circle, svg ellipse')).not.toBeNull();
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.classList.contains(`campaign-ui-icon--${id}`)).toBe(true);
    }
    const labeled = createCampaignIcon('danger', 'Danger');
    expect(labeled.getAttribute('role')).toBe('img');
    expect(labeled.getAttribute('aria-label')).toBe('Danger');
  });

  it('resolves all frame densities and keeps one shared set of corners on refresh', () => {
    const element = document.createElement('section');
    for (const density of ['compact', 'standard', 'hero'] as const) {
      decorateCampaignFrame(element, density);
      decorateCampaignFrame(element, density);
      expect(element.classList.contains(`campaign-ui-frame--${density}`)).toBe(true);
      expect(element.querySelectorAll(':scope > .campaign-ui-frame__corner')).toHaveLength(4);
    }
    expect(element.classList.contains('campaign-ui-frame--compact')).toBe(false);
  });

  it('exposes typed button variants and actual disabled state', () => {
    const button = document.createElement('button');
    for (const variant of ['primary', 'secondary', 'danger', 'disabled'] as const) {
      decorateCampaignButton(button, variant);
      expect(button.classList.contains(`campaign-ui-button--${variant}`)).toBe(true);
      expect(button.disabled).toBe(variant === 'disabled');
    }
    decorateCampaignButton(button, 'primary');
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('campaign-ui-button--disabled')).toBe(false);
  });

  it('renders semantic badges and decorative dividers without injecting accessible icon names', () => {
    for (const variant of ['optional', 'danger', 'reputation', 'new', 'merchant'] as const) {
      const badge = createCampaignBadge('Label', variant, 'reward');
      expect(badge.classList.contains(`campaign-ui-badge--${variant}`)).toBe(true);
      expect(badge.textContent).toBe('Label');
      expect(badge.querySelector('.campaign-ui-icon')?.getAttribute('aria-hidden')).toBe('true');
    }
    for (const variant of ['horizontal', 'horizontal-compact', 'vertical', 'diamond', 'terminal'] as const) {
      expect(createCampaignDivider(variant).getAttribute('aria-hidden')).toBe('true');
    }
  });
});
