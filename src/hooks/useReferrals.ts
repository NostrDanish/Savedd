/**
 * Referral hooks + click tracking.
 *
 *  - useReferralCapture(): mount once at app root. Reads `?ref=` from the
 *    URL, stores first-touch attribution, and publishes the referral ping.
 *  - trackAffiliateClick(rawUrl, taggedUrl): call from result/citation
 *    click handlers; publishes one kind 6079 event when the URL actually
 *    got an affiliate tag AND this device arrived via a partner link.
 *  - useMyReferralStats(): the partner dashboard query — pings + clicks
 *    filtered by `#p: [my pubkey]` from the moderation relay pool.
 *
 * All events are signed by the per-device analytics key (see
 * src/lib/referrals.ts), publish fire-and-forget, and never block a click.
 */
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

import { publishToRelayPool, queryRelayPool } from '@/lib/searchRelays';
import { getModerationRelayUrls } from '@/lib/moderation';
import {
  REFERRAL_PING_KIND,
  AFFILIATE_CLICK_KIND,
  parseRefParam,
  getStoredReferrer,
  storeReferrer,
  buildReferralPing,
  buildAffiliateClick,
} from '@/lib/referrals';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/* ------------------------------------------------------------------ */
/* Capture (app root)                                                  */
/* ------------------------------------------------------------------ */

/**
 * First-touch capture: a valid `?ref=` with no stored referrer stores the
 * attribution and pings once. Later links never overwrite (partners can't
 * poach each other's users by getting them to click again).
 */
export function useReferralCapture(): void {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;
    const pubkey = parseRefParam(ref);
    if (!pubkey) return;
    if (getStoredReferrer()) return; // first-touch already set

    storeReferrer(pubkey);
    // Fire-and-forget — a lost ping only means an undercounted referral.
    void publishToRelayPool(getModerationRelayUrls(), buildReferralPing(pubkey), 5000).catch(() => {});
  }, []);
}

/* ------------------------------------------------------------------ */
/* Click tracking (result cards, AI citations)                         */
/* ------------------------------------------------------------------ */

/**
 * Credit an affiliate click to this device's stored referrer. No-op when
 * the URL wasn't actually tagged or there's no referrer. Never throws.
 */
export function trackAffiliateClick(rawUrl: string, taggedUrl: string): void {
  try {
    if (taggedUrl === rawUrl) return; // no rule matched → nothing to count
    const referrer = getStoredReferrer();
    if (!referrer) return;
    const host = new URL(taggedUrl).hostname.replace(/^www\./, '');
    void publishToRelayPool(
      getModerationRelayUrls(),
      buildAffiliateClick(referrer.pubkey, host),
      5000,
    ).catch(() => {});
  } catch {
    // Tracking must never break a click.
  }
}

/* ------------------------------------------------------------------ */
/* Partner dashboard                                                   */
/* ------------------------------------------------------------------ */

export interface ReferralStats {
  /** Distinct referred devices (addressable pings dedupe per device). */
  referrals: number;
  /** Total affiliate clicks from referred devices. */
  clicks: number;
  /** Clicks grouped by merchant host (e.g. amazon.ca → 12). */
  clicksByHost: { host: string; count: number }[];
  /** The raw recent activity, newest first (for the activity list). */
  recent: { kind: 'referral' | 'click'; at: number; host?: string }[];
  /** The partner's tracking link. */
  trackingLink: string;
}

export function useMyReferralStats(): { stats: ReferralStats | null; isLoading: boolean } {
  const { user } = useCurrentUser();
  const pubkey = user?.pubkey;

  const { data, isLoading } = useQuery({
    queryKey: ['referral-stats', pubkey ?? ''],
    enabled: !!pubkey,
    queryFn: async ({ signal }) => {
      const settled = await queryRelayPool(
        getModerationRelayUrls(),
        [{ kinds: [REFERRAL_PING_KIND, AFFILIATE_CLICK_KIND], '#p': [pubkey!], limit: 500 }],
        { signal, timeoutMs: 6000 },
      );

      const pings = new Set<string>();
      let clicks = 0;
      const byHost = new Map<string, number>();
      const recent: ReferralStats['recent'] = [];

      for (const value of settled) {
        for (const event of value) {
          if (!isValidRefEvent(event, pubkey!)) continue;
          if (event.kind === REFERRAL_PING_KIND) {
            pings.add(event.pubkey); // addressable: one per device anyway; belt + suspenders
            recent.push({ kind: 'referral', at: event.created_at });
          } else {
            clicks++;
            const host = event.tags.find(([n]) => n === 'host')?.[1] ?? 'unknown';
            byHost.set(host, (byHost.get(host) ?? 0) + 1);
            recent.push({ kind: 'click', at: event.created_at, host });
          }
        }
      }

      recent.sort((a, b) => b.at - a.at);

      return {
        referrals: pings.size,
        clicks,
        clicksByHost: [...byHost.entries()]
          .map(([host, count]) => ({ host, count }))
          .sort((a, b) => b.count - a.count),
        recent: recent.slice(0, 20),
        trackingLink: `https://savedd.com/?ref=${nip19.npubEncode(pubkey!)}`,
      } satisfies ReferralStats;
    },
    staleTime: 60_000,
    retry: 0,
  });

  return { stats: data ?? null, isLoading: !!pubkey && isLoading };
}

/** Only count well-formed events actually aimed at this partner. */
function isValidRefEvent(event: NostrEvent, partner: string): boolean {
  if (event.kind !== REFERRAL_PING_KIND && event.kind !== AFFILIATE_CLICK_KIND) return false;
  if (!event.tags.some(([n, v]) => n === 'p' && v === partner)) return false;
  if (event.kind === REFERRAL_PING_KIND) {
    // Addressable ping: d must equal the partner (prevents junk in the p-tag space).
    return event.tags.find(([n]) => n === 'd')?.[1] === partner;
  }
  return true;
}

/** Convenience for components: the current user's tracking link. */
export function useTrackingLink(): string | null {
  const { user } = useCurrentUser();
  return useMemo(
    () => (user ? `https://savedd.com/?ref=${nip19.npubEncode(user.pubkey)}` : null),
    [user],
  );
}
