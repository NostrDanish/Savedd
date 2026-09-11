import { Capacitor } from '@capacitor/core';

/**
 * Open an http(s) URL.
 *
 * On native: Chrome Custom Tabs / SFSafariViewController via @capacitor/browser
 * so the user stays in SAVEDD instead of bouncing to an external browser.
 * On web: a normal new tab.
 *
 * Returns true if the URL was handed off (caller should preventDefault).
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) return false;

  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, windowName: '_blank' });
    return true;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * True when this href should leave the app (external http(s), not our origin).
 * In-app routes, hash links, and non-http schemes are left alone.
 */
export function isExternalHttpUrl(href: string, origin = typeof location !== 'undefined' ? location.origin : ''): boolean {
  if (!href || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  try {
    const u = new URL(href, origin || 'https://savedd.com');
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (origin && u.origin === origin) return false;
    return true;
  } catch {
    return false;
  }
}
