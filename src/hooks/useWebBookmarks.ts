/**
 * Web bookmarks — NIP-B0 (kind 39701), tied to the logged-in Nostr account.
 *
 * Model: one addressable event per bookmark. The `d` tag is the URI with
 * the scheme omitted when it's https (so `https://example.com/a` →
 * `example.com/a`), `title` carries the page title, `published_at` the
 * first-save timestamp, and `content` a short description. Removal is a
 * NIP-09 deletion request (kind 5) against the `a` coordinate.
 *
 * Trust model: queries always filter by `authors: [user.pubkey]` — a
 * bookmark list is user-owned state, never public UGC. Reads go through
 * the app's relay pool (which follows the user's NIP-65 relay list after
 * login), so bookmarks sync across devices and other NIP-B0 clients.
 */
import { useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { sanitizeUrl } from '@/lib/sanitizeUrl';

/** NIP-B0 web bookmark kind. */
export const WEB_BOOKMARK_KIND = 39701;

export interface WebBookmark {
  /** The `d` tag — bookmark identity (URI, https scheme omitted). */
  d: string;
  /** Full https URL (scheme restored from the `d` tag). */
  url: string;
  title: string;
  /** The event content — a short description/snippet. */
  description: string;
  /** First-saved timestamp (published_at tag, falling back to created_at). */
  publishedAt: number;
  /** Id of the latest event carrying this bookmark (for NIP-09 deletion). */
  eventId: string;
  /** Topic tags. */
  topics: string[];
}

/**
 * NIP-B0 `d` tag for a URL: everything before the hostname is omitted when
 * the scheme is https. Non-http(s) URLs are not bookmarkable (returns null).
 */
export function bookmarkDForUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:') return url.slice('https://'.length);
    if (u.protocol === 'http:') return url;
    return null;
  } catch {
    return null;
  }
}

/** Restore a full URL from a `d` tag (https when no scheme is present). */
function urlForBookmarkD(d: string): string | null {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(d) ? d : `https://${d}`;
  return sanitizeUrl(candidate);
}

/** Validate + map a raw event. Addressable → callers dedupe by `d`. */
function toBookmark(event: NostrEvent): WebBookmark | null {
  if (event.kind !== WEB_BOOKMARK_KIND) return null;
  const d = event.tags.find(([n]) => n === 'd')?.[1];
  if (!d) return null;
  const url = urlForBookmarkD(d);
  if (!url) return null;
  const title = event.tags.find(([n]) => n === 'title')?.[1]?.trim() || url;
  const publishedRaw = event.tags.find(([n]) => n === 'published_at')?.[1];
  const publishedNum = publishedRaw ? Number(publishedRaw) : NaN;
  return {
    d,
    url,
    title,
    description: event.content.trim(),
    publishedAt: Number.isFinite(publishedNum) ? publishedNum : event.created_at,
    eventId: event.id,
    topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v).filter(Boolean),
  };
}

export interface UseWebBookmarksResult {
  bookmarks: WebBookmark[];
  isLoading: boolean;
  /** Whether the account layer is available (logged in). */
  canUse: boolean;
  isBookmarked: (url: string) => boolean;
  addBookmark: (input: { url: string; title: string; snippet?: string }) => void;
  removeBookmark: (d: string) => void;
  /** True while an add/remove publish is in flight. */
  isMutating: boolean;
}

export function useWebBookmarks(): UseWebBookmarksResult {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish, isPending } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pubkey = user?.pubkey;
  // Stable identity — used as a useCallback dependency below.
  const queryKey = useMemo(() => ['web-bookmarks', pubkey ?? ''], [pubkey]);

  const { data, isLoading } = useQuery<WebBookmark[]>({
    queryKey,
    queryFn: async ({ signal }) => {
      if (!pubkey) return [];
      const events = await nostr.query(
        [{ kinds: [WEB_BOOKMARK_KIND], authors: [pubkey], limit: 500 }],
        { signal },
      );
      // Addressable: keep only the latest event per `d`.
      const latest = new Map<string, WebBookmark & { createdAt: number }>();
      const rawByD = new Map<string, number>();
      for (const event of events) {
        const bookmark = toBookmark(event);
        if (!bookmark) continue;
        if ((rawByD.get(bookmark.d) ?? 0) > event.created_at) continue;
        rawByD.set(bookmark.d, event.created_at);
        latest.set(bookmark.d, { ...bookmark, createdAt: event.created_at });
      }
      return [...latest.values()].sort((a, b) => b.publishedAt - a.publishedAt);
    },
    enabled: !!pubkey,
    staleTime: 60_000,
    retry: 0,
  });

  const bookmarks = useMemo(() => data ?? [], [data]);
  const byD = useMemo(() => new Map(bookmarks.map((b) => [b.d, b])), [bookmarks]);

  const isBookmarked = useCallback(
    (url: string): boolean => {
      const d = bookmarkDForUrl(url);
      return d !== null && byD.has(d);
    },
    [byD],
  );

  const addBookmark = useCallback(
    (input: { url: string; title: string; snippet?: string }) => {
      if (!user) {
        toast({ title: 'Log in to save bookmarks', description: 'Bookmarks are stored on your Nostr account.' });
        return;
      }
      const url = sanitizeUrl(input.url);
      if (!url) return;
      const d = bookmarkDForUrl(url);
      if (!d || byD.has(d)) return;

      const now = Math.floor(Date.now() / 1000);
      const optimistic: WebBookmark = {
        d,
        url,
        title: input.title.trim().slice(0, 200) || url,
        description: (input.snippet ?? '').trim().slice(0, 500),
        publishedAt: now,
        eventId: '',
        topics: [],
      };

      // Optimistic: the check feels instant; the relay round-trip lands later.
      queryClient.setQueryData<WebBookmark[]>(queryKey, (old) => [optimistic, ...(old ?? [])]);

      publish({
        kind: WEB_BOOKMARK_KIND,
        content: optimistic.description,
        tags: [
          ['d', d],
          ['title', optimistic.title],
          ['published_at', String(now)],
          ['alt', 'Web bookmark (NIP-B0)'],
        ],
        created_at: now,
      }).catch(() => {
        queryClient.setQueryData<WebBookmark[]>(queryKey, (old) => (old ?? []).filter((b) => b.d !== d));
        toast({ title: 'Bookmark failed', description: 'The bookmark could not be published to your relays.' });
      });
    },
    [user, byD, publish, queryClient, queryKey, toast],
  );

  const removeBookmark = useCallback(
    (d: string) => {
      if (!user || !pubkey) return;
      const existing = byD.get(d);
      if (!existing) return;

      queryClient.setQueryData<WebBookmark[]>(queryKey, (old) => (old ?? []).filter((b) => b.d !== d));

      // NIP-09 deletion request against the addressable coordinate (+ the
      // known event id for relays that key on `e`).
      const tags: string[][] = [
        ['a', `${WEB_BOOKMARK_KIND}:${pubkey}:${d}`],
        ['k', String(WEB_BOOKMARK_KIND)],
      ];
      if (existing.eventId) tags.push(['e', existing.eventId]);

      publish({ kind: 5, content: 'Deleted web bookmark', tags }).catch(() => {
        queryClient.setQueryData<WebBookmark[]>(queryKey, (old) =>
          [...(old ?? []), existing].sort((a, b) => b.publishedAt - a.publishedAt),
        );
        toast({ title: 'Remove failed', description: 'The deletion request could not be published.' });
      });
    },
    [user, pubkey, byD, publish, queryClient, queryKey, toast],
  );

  return {
    bookmarks,
    isLoading: !!pubkey && isLoading,
    canUse: !!user,
    isBookmarked,
    addBookmark,
    removeBookmark,
    isMutating: isPending,
  };
}
