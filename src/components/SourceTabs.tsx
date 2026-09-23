import { cn } from '@/lib/utils';
import { Layers, Zap, Globe, Shield, Network, BookOpen, Newspaper, Code, Database, Map as MapIcon, Video as VideoIcon, ExternalLink } from 'lucide-react';
import type { SearchSource } from '@/lib/providers/types';
import { useAppContext } from '@/hooks/useAppContext';
import type { MapsProvider } from '@/contexts/AppContext';

export type SourceTabValue = SearchSource | 'all' | 'index' | 'i2p' | 'maps' | 'videos' | 'news-ext';

interface SourceTabsProps {
  value: SourceTabValue;
  onChange: (source: SourceTabValue) => void;
  className?: string;
  /** Optional result counts to show in badges. */
  counts?: Partial<Record<SourceTabValue, number>>;
}

export interface SourceTabMeta {
  id: SourceTabValue;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  /**
   * When set, the tab is an external shortcut: clicking it opens this URL
   * (built from the current query) in a new browser tab instead of
   * filtering results. External tabs never become the active source.
   */
  externalUrl?: (query: string) => string;
}

/** All known tabs — display metadata. Order/visibility come from tabConfig. */
export const ALL_SOURCE_TABS: SourceTabMeta[] = [
  {
    id: 'web',
    label: 'Web',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'index',
    label: 'Index',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'all',
    label: 'All',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'nostr',
    label: 'Nostr',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'wiki',
    label: 'Wiki',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'news',
    label: 'News',
    icon: <Newspaper className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: <MapIcon className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
    externalUrl: (q) => getMapsUrl(q, 'google'),
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: <VideoIcon className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
    externalUrl: (q) => q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com',
  },
  {
    id: 'news-ext',
    label: 'News ↗',
    icon: <Newspaper className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
    externalUrl: (q) => `https://freespoke.com/search/news?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'tor',
    label: 'Tor',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
  {
    id: 'i2p',
    label: 'I2P',
    icon: <Network className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/70 hover:text-foreground',
    activeColor: 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
  },
];

const TAB_BY_ID = new Map(ALL_SOURCE_TABS.map((t) => [t.id, t]));

/** True for tabs that open an external engine in a new tab (Maps, Videos, News ↗). */
export function isExternalTab(id: string): boolean {
  return TAB_BY_ID.get(id as SourceTabValue)?.externalUrl !== undefined;
}

/** Build the external destination URL for a tab + query (site homepage when empty). */
export function getExternalTabUrl(id: SourceTabValue, query: string): string | undefined {
  return TAB_BY_ID.get(id)?.externalUrl?.(query.trim());
}

/**
 * Maps tab destination — provider chosen in Settings → Search Tabs
 * (Google Maps or OpenStreetMap). Homepage when the query is empty.
 */
export function getMapsUrl(query: string, provider: MapsProvider = 'google'): string {
  const q = query.trim();
  if (provider === 'osm') {
    return q ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}` : 'https://www.openstreetmap.org';
  }
  return q ? `https://www.google.com/maps/search/${encodeURIComponent(q)}` : 'https://www.google.com/maps';
}

/**
 * Out-of-the-box tab configuration: Web first (community index + clearnet
 * search). Wiki and Code tabs stay on thanks to the Nostr-native providers
 * (NIP-54 wiki pool, NIP-34 git pool); the clearnet engines behind them
 * (Wikipedia, Stack Overflow) stay off until enabled. Dark-net tabs stay
 * off — all restorable in Settings → Search Tabs.
 */
export const DEFAULT_TAB_CONFIG = {
  order: ALL_SOURCE_TABS.map((t) => t.id) as string[],
  hidden: ['tor', 'i2p'],
  defaultTab: 'web',
};

/**
 * The tab bar. Renders the user's configured tabs (order + visibility from
 * Settings → Search Tabs; defaults hide Tor/I2P and start on Web).
 */
export function SourceTabs({ value, onChange, className, counts }: SourceTabsProps) {
  const { config } = useAppContext();
  const { order, hidden } = config.tabConfig;

  // Configured order, visible only, metadata-resolved. Unknown ids are skipped;
  // known tabs missing from a stored (older) order append at the end.
  const visible = [
    ...order.filter((id) => !hidden.includes(id)),
    ...ALL_SOURCE_TABS.map((t) => t.id as string).filter((id) => !order.includes(id) && !hidden.includes(id)),
  ]
    .map((id) => TAB_BY_ID.get(id as SourceTabValue))
    .filter((t): t is SourceTabMeta => t !== undefined);

  // Safety: if a stored config hid everything, fall back to the full default set.
  const sources = visible.length > 0
    ? [...visible]
    : ALL_SOURCE_TABS.filter((t) => t.id === 'web' || t.id === 'all');

  // Deep links win: if the active tab is hidden, still render it (highlighted).
  if (!sources.some((s) => s.id === value)) {
    const active = TAB_BY_ID.get(value);
    if (active) sources.push(active);
  }

  return (
    // These are filter buttons, not ARIA tabs (there are no tabpanels), so
    // they keep honest group/toggle-button semantics: every button stays in
    // the tab order and announces its pressed state.
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)} role="group" aria-label="Search source">
      {sources.map((source) => {
        const isExternal = source.externalUrl !== undefined;
        const isActive = !isExternal && value === source.id;
        const count = counts?.[source.id];
        return (
          <button
            key={source.id}
            type="button"
            aria-pressed={isExternal ? undefined : isActive}
            title={isExternal ? `${source.label.replace(' ↗', '')} — opens in a new tab` : undefined}
            onClick={() => onChange(source.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-transparent transition-all duration-150',
              isActive ? source.activeColor : cn('text-muted-foreground', source.color),
              !isActive && 'hover:bg-accent',
            )}
          >
            {source.icon}
            {source.label}
            {isExternal && <ExternalLink className="w-3 h-3 opacity-60" />}
            {count !== undefined && count > 0 && (
              <span className={cn(
                'text-[10px] font-mono ml-0.5 opacity-70',
                isActive ? '' : 'text-muted-foreground',
              )}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
