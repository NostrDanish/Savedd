import { useEffect, useState } from 'react';
import { Plus, X, Wifi, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppContext } from '@/hooks/useAppContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useNostr } from '@nostrify/react';

interface Relay {
  url: string;
  read: boolean;
  write: boolean;
}

/* ------------------------------------------------------------------ */
/* Shared editor UI (presentational — no storage, no publishing)       */
/* ------------------------------------------------------------------ */

function RelayListEditor({ relays, onSave }: { relays: Relay[]; onSave: (relays: Relay[]) => void }) {
  const { toast } = useToast();
  const [newRelayUrl, setNewRelayUrl] = useState('');

  const normalizeRelayUrl = (url: string): string => {
    url = url.trim();
    try {
      return new URL(url).toString();
    } catch {
      try {
        return new URL(`wss://${url}`).toString();
      } catch {
        return url;
      }
    }
  };

  const isValidRelayUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;

    const normalized = normalizeRelayUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddRelay = () => {
    if (!isValidRelayUrl(newRelayUrl)) {
      toast({
        title: 'Invalid relay URL',
        description: 'Please enter a valid relay URL (e.g., wss://relay.example.com)',
        variant: 'destructive',
      });
      return;
    }

    const normalized = normalizeRelayUrl(newRelayUrl);

    if (relays.some(r => r.url === normalized)) {
      toast({
        title: 'Relay already exists',
        description: 'This relay is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    onSave([...relays, { url: normalized, read: true, write: true }]);
    setNewRelayUrl('');
  };

  const handleRemoveRelay = (url: string) => {
    onSave(relays.filter(r => r.url !== url));
  };

  const handleToggleRead = (url: string) => {
    onSave(relays.map(r => r.url === url ? { ...r, read: !r.read } : r));
  };

  const handleToggleWrite = (url: string) => {
    onSave(relays.map(r => r.url === url ? { ...r, write: !r.write } : r));
  };

  const renderRelayUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'wss:') {
        if (parsed.pathname === '/') {
          return parsed.host;
        } else {
          return parsed.host + parsed.pathname;
        }
      } else {
        return parsed.href;
      }
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      {/* Relay List */}
      <div className="space-y-2">
        {relays.map((relay) => (
          <div
            key={relay.url}
            className="flex items-center gap-3 p-3 rounded-md border bg-muted/20"
          >
            <Wifi className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm flex-1 truncate" title={relay.url}>
              {renderRelayUrl(relay.url)}
            </span>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`read-${relay.url}`} className="text-sm cursor-pointer">
                      Read
                    </Label>
                    <Switch
                      id={`read-${relay.url}`}
                      checked={relay.read}
                      onCheckedChange={() => handleToggleRead(relay.url)}
                      className="data-[state=checked]:bg-green-500 scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`write-${relay.url}`} className="text-sm cursor-pointer">
                      Write
                    </Label>
                    <Switch
                      id={`write-${relay.url}`}
                      checked={relay.write}
                      onCheckedChange={() => handleToggleWrite(relay.url)}
                      className="data-[state=checked]:bg-blue-500 scale-75"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveRelay(relay.url)}
              className="size-5 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
              disabled={relays.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Relay Form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="new-relay-url" className="sr-only">
            Relay URL
          </Label>
          <Input
            id="new-relay-url"
            placeholder="Enter relay URL (e.g., wss://relay.example.com)"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddRelay();
              }
            }}
          />
        </div>
        <Button
          onClick={handleAddRelay}
          disabled={!newRelayUrl.trim()}
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App Relays — device-local app pool (what the app needs to run)      */
/* ------------------------------------------------------------------ */

/**
 * The APP relay list — the pool this app uses on this device. Device-local
 * configuration only: editing it is NEVER published as the user's public
 * NIP-65 relay list. (That's the point of the split — an app's relay needs
 * are not the user's relay identity.)
 */
export function RelayListManager() {
  const { config, updateConfig } = useAppContext();

  const save = (newRelays: Relay[]) => {
    // Only called from event handlers, not during render, so Date.now() is safe.
    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);
    updateConfig((current) => ({
      ...current,
      relayMetadata: {
        relays: newRelays,
        updatedAt: now,
      },
    }));
  };

  return <RelayListEditor relays={config.relayMetadata.relays} onSave={save} />;
}

/* ------------------------------------------------------------------ */
/* Your Relays — the user's own NIP-65 list (logged-in users)          */
/* ------------------------------------------------------------------ */

/**
 * The user's public NIP-65 relay list (kind 10002): synced from Nostr on
 * login, published on edit. Logged-in users only.
 *
 * Clobber guard: if the local copy was never synced from the user's own
 * kind 10002 (updatedAt === 0), we verify against Nostr BEFORE publishing.
 * An existing remote list is adopted and the publish is skipped; only a
 * verified-absent list gets created. A failed verification blocks the
 * publish — an old Nostr user's relay list is never overwritten by a guess.
 */
export function UserRelayListManager() {
  const { config, updateConfig } = useAppContext();
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: publishEvent } = useNostrPublish();
  const { toast } = useToast();

  const [relays, setRelays] = useState<Relay[]>(config.userRelayMetadata.relays);

  // Mirror the authoritative config (e.g. the login sync landing).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelays(config.userRelayMetadata.relays);
  }, [config.userRelayMetadata.relays]);

  const publishRelayListEvent = (relayList: Relay[]) => {
    const tags = relayList.map(relay => {
      if (relay.read && relay.write) {
        return ['r', relay.url];
      } else if (relay.read) {
        return ['r', relay.url, 'read'];
      } else if (relay.write) {
        return ['r', relay.url, 'write'];
      }
      return null;
    }).filter((tag): tag is string[] => tag !== null);

    publishEvent(
      {
        kind: 10002,
        content: '',
        tags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Relay list published',
            description: 'Your relay list has been published to Nostr.',
          });
        },
        onError: (error) => {
          console.error('Failed to publish relay list:', error);
          toast({
            title: 'Failed to publish relay list',
            description: 'There was an error publishing your relay list to Nostr.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const publishWithGuard = async (relayList: Relay[]) => {
    if (user && config.userRelayMetadata.updatedAt === 0) {
      let remote;
      try {
        remote = await nostr.query(
          [{ kinds: [10002], authors: [user.pubkey], limit: 1 }],
          { signal: AbortSignal.timeout(8000) },
        );
      } catch {
        remote = null; // query failed — unknown whether a list exists
      }

      if (remote === null) {
        toast({
          title: 'Relay list not published',
          description: 'Could not verify whether you already have a relay list on Nostr. Nothing was overwritten — check your connection and try again.',
          variant: 'destructive',
        });
        return;
      }

      if (remote.length > 0) {
        const event = remote[0];
        const fetchedRelays = event.tags
          .filter(([name]) => name === 'r')
          .map(([, url, marker]) => ({
            url,
            read: !marker || marker === 'read',
            write: !marker || marker === 'write',
          }));

        if (fetchedRelays.length > 0) {
          setRelays(fetchedRelays);
          updateConfig((current) => ({
            ...current,
            userRelayMetadata: { relays: fetchedRelays, updatedAt: event.created_at },
          }));
          toast({
            title: 'Your existing relay list was loaded',
            description: 'You already had a NIP-65 relay list on Nostr — it was kept instead of being overwritten. Re-apply your change on top of it.',
          });
          return;
        }
      }
      // Verified: no existing list. Publishing creates this user's first one.
    }

    publishRelayListEvent(relayList);
  };

  const save = (newRelays: Relay[]) => {
    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);

    updateConfig((current) => ({
      ...current,
      userRelayMetadata: {
        relays: newRelays,
        updatedAt: now,
      },
    }));

    // Publish to Nostr (logged-in only — this component is only rendered then)
    if (user) {
      void publishWithGuard(newRelays);
    }
  };

  return <RelayListEditor relays={relays} onSave={save} />;
}
