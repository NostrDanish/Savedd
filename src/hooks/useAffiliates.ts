/**
 * Affiliate rules — read (everyone) + write (owner only).
 *
 * Read: the owner-signed kind 30078 config event (d-tag
 * `savedd:affiliate-rules`) from the moderation relay pool. Public by
 * design — affiliate codes are visible in tagged URLs anyway — so this
 * runs for anonymous visitors too. One small author-filtered query.
 *
 * Write: the owner publishes a replacement config event (addressable →
 * latest wins) onto the moderation relays, same transport as role lists.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { queryRelayPool, publishToRelayPool } from '@/lib/searchRelays';
import {
  AFFILIATES_KIND,
  AFFILIATES_D_TAG,
  parseAffiliateRules,
  buildAffiliateRulesEvent,
  type AffiliateRule,
} from '@/lib/affiliates';
import { OWNER_PUBKEY, getModerationRelayUrls } from '@/lib/moderation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function useAffiliateRules(): { rules: AffiliateRule[]; isLoading: boolean } {
  const { data, isLoading } = useQuery<AffiliateRule[]>({
    queryKey: ['affiliate-rules'],
    queryFn: async ({ signal }) => {
      const settled = await queryRelayPool(
        getModerationRelayUrls(),
        [{
          kinds: [AFFILIATES_KIND],
          authors: [OWNER_PUBKEY], // trust boundary: owner-signed only
          '#d': [AFFILIATES_D_TAG],
          limit: 1,
        }],
        { signal, timeoutMs: 5000 },
      );

      // Addressable: latest version wins.
      let latest: NostrEvent | null = null;
      for (const value of settled) {
        for (const event of value) {
          if (!latest || event.created_at > latest.created_at) latest = event;
        }
      }
      return latest ? parseAffiliateRules(latest) : [];
    },
    staleTime: 5 * 60_000,
    retry: 0,
  });

  return { rules: data ?? [], isLoading };
}

/** Owner-only rule management (whole-list replace; addressable event). */
export function useAffiliateActions() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const isOwner = user?.pubkey === OWNER_PUBKEY;

  const updateRules = useCallback(async (rules: AffiliateRule[]) => {
    if (!user || !isOwner) throw new Error('Only the owner can manage affiliate rules');

    const template = buildAffiliateRulesEvent(rules);
    const event = await user.signer.signEvent({
      kind: template.kind,
      content: template.content,
      tags: template.tags,
      created_at: Math.floor(Date.now() / 1000),
    });

    const accepted = await publishToRelayPool(getModerationRelayUrls(), event, 6000);
    if (accepted === 0) throw new Error('No relay accepted the event');

    setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['affiliate-rules'] });
    }, 2000);
  }, [user, isOwner, queryClient]);

  return { isOwner, updateRules };
}
