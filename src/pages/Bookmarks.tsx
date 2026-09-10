/**
 * Bookmarks page — the logged-in user's NIP-B0 web bookmarks (kind 39701).
 *
 * Bookmarks are signed events on the user's own Nostr relays: saved here,
 * readable by any NIP-B0 client, on any device. Removal issues a NIP-09
 * deletion request. Everything is keyed to the account — log out and the
 * page explains instead of pretending the list is empty.
 */
import { useMemo, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Bookmark, ExternalLink, Trash2, SearchX } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWebBookmarks, type WebBookmark } from '@/hooks/useWebBookmarks';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import { ENGINE_PROFILE } from '@/lib/engine/profile';

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function BookmarkCard({ bookmark, onRemove }: { bookmark: WebBookmark; onRemove: (d: string) => void }) {
  const href = sanitizeUrl(bookmark.url);
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-card hover:bg-card/80 transition-all duration-200 group">
      <div className="flex items-center gap-2 mb-1.5">
        <Bookmark className="w-3.5 h-3.5 shrink-0 text-primary fill-current" />
        <span className="text-xs text-muted-foreground font-mono truncate">
          {domainOf(bookmark.url)}
        </span>
        <span className="text-xs text-muted-foreground/50 ml-auto shrink-0">
          {formatDate(bookmark.publishedAt)}
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-1 line-clamp-2 text-sm">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            {bookmark.title}
            <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
          </a>
        ) : (
          bookmark.title
        )}
      </h3>

      {bookmark.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {bookmark.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2">
        {bookmark.topics.length > 0 && (
          <span className="text-xs text-primary/60 font-mono truncate">
            {bookmark.topics.map((t) => `#${t}`).join(' ')}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(bookmark.d)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
          aria-label={`Remove bookmark: ${bookmark.title}`}
          title="Delete bookmark (NIP-09 deletion request)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}

const Bookmarks = () => {
  const { user } = useCurrentUser();
  const { bookmarks, isLoading, removeBookmark } = useWebBookmarks();
  const [filter, setFilter] = useState('');

  useSeoMeta({
    title: `Bookmarks - ${ENGINE_PROFILE.branding.name}`,
    description: 'Your web bookmarks, saved to your Nostr account (NIP-B0).',
  });

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q)
        || b.url.toLowerCase().includes(q)
        || b.description.toLowerCase().includes(q)
        || b.topics.some((t) => t.toLowerCase().includes(q)),
    );
  }, [bookmarks, filter]);

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold tracking-[0.08em] flex items-center gap-3">
              <Bookmark className="w-6 h-6 text-primary" />
              Bookmarks
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Web bookmarks saved to your Nostr account (NIP-B0) — signed by your key,
              stored on your relays, readable by any compatible client. Bookmarking is
              public curation: your bookmarks are also readable as NIP-B0 community
              links by other clients.
            </p>
          </div>

          {!user ? (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <Bookmark className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground max-w-sm mx-auto mb-5">
                  Log in with your Nostr account to save bookmarks from search results
                  and find them here — synced across devices.
                </p>
                <LoginArea className="max-w-60 mx-auto" />
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border/50">
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <Bookmark className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground max-w-sm mx-auto">
                  No bookmarks yet. Search the web and tap the bookmark icon on any
                  result to save it to your Nostr account.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4">
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter bookmarks…"
                  aria-label="Filter bookmarks"
                  className="max-w-xs"
                />
              </div>

              {visible.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 px-8 text-center">
                    <SearchX className="w-7 h-7 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      No bookmarks match &ldquo;{filter}&rdquo;.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visible.map((bookmark) => (
                    <BookmarkCard key={bookmark.d} bookmark={bookmark} onRemove={removeBookmark} />
                  ))}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/50 mt-6 text-center">
                {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} · kind 39701 on your relays
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookmarks;
