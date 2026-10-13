import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isTravelForced,
  JOURNEY_SELECTOR_PARAM,
  PRESENTATION_SELECTOR_PARAM,
  readJourneySelector,
  readPresentationSelector,
  resolveCampaignPresentation,
} from './JourneyPresentationPolicy';

describe('campaign presentation policy', () => {
  it('defaults to Journey without a selector in DEV and production', () => {
    for (const dev of [true, false]) {
      for (const search of ['', '?', '?qa=1']) {
        expect(resolveCampaignPresentation({ search, dev })).toBe('journey');
      }
    }
  });

  it('allows explicit TravelView overrides only in DEV, with precedence over Journey aliases', () => {
    for (const search of ['?journey=travel', '?presentation=travel', '?journey=cinematic&presentation=travel', '?journey=travel&presentation=narrative']) {
      expect(resolveCampaignPresentation({ search, dev: true })).toBe('travel');
      expect(resolveCampaignPresentation({ search, dev: false })).toBe('journey');
    }
    expect(isTravelForced('?journey=travel')).toBe(true);
    expect(isTravelForced('?journey=cinematic')).toBe(false);
    expect(isTravelForced('?presentation=travel')).toBe(true);
    expect(isTravelForced('')).toBe(false);
  });

  it('preserves the DEV cinematic selector', () => {
    expect(resolveCampaignPresentation({ search: '?journey=cinematic', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: 'journey=cinematic', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?qa=1&journey=cinematic', dev: true })).toBe('journey');
  });

  it('accepts the backward-compatible DEV NarrativeStage alias', () => {
    expect(resolveCampaignPresentation({ search: '?presentation=narrative', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?qa=1&presentation=narrative', dev: true })).toBe('journey');
    expect(resolveCampaignPresentation({ search: '?presentation=narrative', dev: false })).toBe('journey');
    expect(readPresentationSelector('?presentation=narrative')).toBe('narrative');
    expect(PRESENTATION_SELECTOR_PARAM).toBe('presentation');
  });

  it('keeps production on Journey regardless of selectors', () => {
    for (const search of ['?journey=cinematic', '?journey=CINEMATIC', '?journey=cinematic&qa=1', '?presentation=narrative']) {
      expect(resolveCampaignPresentation({ search, dev: false })).toBe('journey');
    }
  });

  it('leaves the Journey default intact for unknown values without adding aliases', () => {
    for (const value of ['', 'CINEMATIC', 'Cinematic', 'video', '1', 'true', 'journey']) {
      expect(resolveCampaignPresentation({ search: `?journey=${value}`, dev: true })).toBe('journey');
    }
  });

  it('reads the selector without mutating the query string', () => {
    expect(JOURNEY_SELECTOR_PARAM).toBe('journey');
    expect(readJourneySelector('?journey=cinematic')).toBe('cinematic');
    expect(readJourneySelector('journey=travel')).toBe('travel');
    expect(readJourneySelector('?other=1')).toBeNull();
  });

  it('is the only presentation policy GameApp consults, with a separate failure latch', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'game', 'GameApp.ts'), 'utf8');
    expect(source).toContain('resolveCampaignPresentation({');
    expect(source).toContain('dev: import.meta.env.DEV');
    // Journey may only be reached through the policy plus the failure latch.
    expect(source).toContain("this.campaignPresentation === 'journey' && !this.journeyUnavailable");
    expect(source.match(/resolveCampaignPresentation\(/g)).toHaveLength(1);
  });
});
