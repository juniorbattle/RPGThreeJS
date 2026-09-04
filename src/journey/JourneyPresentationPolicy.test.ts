import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isTravelForced,
  JOURNEY_SELECTOR_PARAM,
  readJourneySelector,
  resolveCampaignPresentation,
} from './JourneyPresentationPolicy';

describe('campaign presentation policy', () => {
  it('keeps TravelView as the default with no selector', () => {
    expect(resolveCampaignPresentation({ search: '', dev: true })).toBe('travel');
    expect(resolveCampaignPresentation({ search: '?', dev: true })).toBe('travel');
    expect(resolveCampaignPresentation({ search: '?qa=1', dev: true })).toBe('travel');
    expect(resolveCampaignPresentation({ search: '', dev: false })).toBe('travel');
  });

  it('forces TravelView for ?journey=travel', () => {
    expect(resolveCampaignPresentation({ search: '?journey=travel', dev: true })).toBe('travel');
    expect(resolveCampaignPresentation({ search: '?journey=travel', dev: false })).toBe('travel');
    expect(isTravelForced('?journey=travel')).toBe(true);
    expect(isTravelForced('?journey=cinematic')).toBe(false);
    expect(isTravelForced('')).toBe(false);
  });

  it('selects Journey only for DEV ?journey=cinematic', () => {
    expect(resolveCampaignPresentation({ search: '?journey=cinematic', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: 'journey=cinematic', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?qa=1&journey=cinematic', dev: true })).toBe('journey');
  });

  it('never exposes Journey outside a DEV build', () => {
    for (const search of ['?journey=cinematic', '?journey=CINEMATIC', '?journey=cinematic&qa=1']) {
      expect(resolveCampaignPresentation({ search, dev: false })).toBe('travel');
    }
  });

  it('treats any unknown selector value as TravelView', () => {
    for (const value of ['', 'CINEMATIC', 'Cinematic', 'video', '1', 'true', 'journey']) {
      expect(resolveCampaignPresentation({ search: `?journey=${value}`, dev: true })).toBe('travel');
    }
  });

  it('reads the selector without mutating the query string', () => {
    expect(JOURNEY_SELECTOR_PARAM).toBe('journey');
    expect(readJourneySelector('?journey=cinematic')).toBe('cinematic');
    expect(readJourneySelector('journey=travel')).toBe('travel');
    expect(readJourneySelector('?other=1')).toBeNull();
  });

  it('is the only policy GameApp consults, and only in DEV', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'game', 'GameApp.ts'), 'utf8');
    expect(source).toContain('resolveCampaignPresentation({');
    expect(source).toContain('dev: import.meta.env.DEV');
    // Journey may only be reached through the policy plus the failure latch.
    expect(source).toContain("this.campaignPresentation === 'journey' && !this.journeyUnavailable");
    expect(source.match(/resolveCampaignPresentation\(/g)).toHaveLength(1);
  });
});
