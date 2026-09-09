import { describe, it, expect } from 'vitest';

import { ENGINE_PROFILE, SAVEDD_PROFILE, SAVEDD_SYSTEM_PROMPT } from './profile';
import { SCRIPTURE_VERSES, verseForDate, dayOfYear } from './scripture';

describe('community engine profile', () => {
  it('SAVEDD is the active deployment profile', () => {
    expect(ENGINE_PROFILE.id).toBe('savedd');
    expect(ENGINE_PROFILE).toBe(SAVEDD_PROFILE);
  });

  it('does not embed API secrets', () => {
    const json = JSON.stringify(ENGINE_PROFILE);
    expect(json).not.toMatch(/sk-/);
    expect(json).not.toMatch(/BRAVE_API_KEY/);
    expect(json).not.toMatch(/AI_API_KEY/);
  });

  it('keeps SIP-01 and Brave as first-class search sources', () => {
    expect(ENGINE_PROFILE.search.sip01).toBe(true);
    expect(ENGINE_PROFILE.search.brave).toBe(true);
    expect(ENGINE_PROFILE.search.disabledProviders).not.toContain('web-index');
    expect(ENGINE_PROFILE.search.disabledProviders).not.toContain('brave');
    expect(ENGINE_PROFILE.search.disabledProviders).not.toContain('searxng');
    expect(ENGINE_PROFILE.search.disabledProviders).not.toContain('duckduckgo');
  });

  it('hides Dsearch hub UI without deleting those routes from the app', () => {
    expect(ENGINE_PROFILE.ui.showNetwork).toBe(false);
    expect(ENGINE_PROFILE.ui.showBuild).toBe(false);
    expect(ENGINE_PROFILE.ui.showProtocol).toBe(false);
    expect(ENGINE_PROFILE.ui.showCommunity).toBe(false);
    expect(ENGINE_PROFILE.ui.showTrending).toBe(false);
    expect(ENGINE_PROFILE.ui.showNostr).toBe(false);
    expect(ENGINE_PROFILE.ui.biblicalQuotes).toBe(true);
  });

  it('uses savedd.com as the public site identity', () => {
    expect(ENGINE_PROFILE.branding.siteUrl).toBe('https://savedd.com');
    expect(ENGINE_PROFILE.branding.domain).toBe('savedd.com');
    expect(ENGINE_PROFILE.branding.name).toBe('SAVEDD');
    expect(ENGINE_PROFILE.branding.slogan).toBe('Seek, and ye shall find.');
    expect(ENGINE_PROFILE.branding.ogImage.startsWith('https://')).toBe(true);
  });

  it('ships a Christian AI profile that forbids fabricated Scripture', () => {
    expect(ENGINE_PROFILE.ai.systemPrompt).toBe(SAVEDD_SYSTEM_PROMPT);
    expect(SAVEDD_SYSTEM_PROMPT).toMatch(/NEVER invent/);
    expect(SAVEDD_SYSTEM_PROMPT).toMatch(/not a religious authority/i);
    expect(SAVEDD_SYSTEM_PROMPT).toMatch(/Do not force Christianity/);
  });
});

describe('scripture rotation', () => {
  it('every verse has verified-shape fields and a KJV translation tag', () => {
    expect(SCRIPTURE_VERSES.length).toBeGreaterThanOrEqual(12);
    for (const v of SCRIPTURE_VERSES) {
      expect(v.text.length).toBeGreaterThan(10);
      expect(v.reference).toMatch(/^[1-3]?\s?[A-Za-z]+ \d+:\d+/);
      expect(v.translation).toBe('KJV');
    }
  });

  it('is deterministic for a given calendar day', () => {
    const a = verseForDate(new Date(2026, 8, 10));
    const b = verseForDate(new Date(2026, 8, 10, 23, 59));
    expect(a).toEqual(b);
  });

  it('rotates across the year', () => {
    const jan = verseForDate(new Date(2026, 0, 1));
    const mid = verseForDate(new Date(2026, 6, 1));
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    // Different days of year should usually pick different verses given 26 entries.
    expect(jan.reference === mid.reference && jan.text === mid.text).toBe(false);
  });
});
