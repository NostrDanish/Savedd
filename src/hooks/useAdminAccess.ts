/**
 * Access control hook — resolves the current user's SAVEDD role.
 *
 *   1. pubkey === OWNER_PUBKEY                    → 'owner'
 *   2. in owner-signed admin role list            → 'admin'
 *   3. in owner-signed moderator role list        → 'moderator'
 *   4. otherwise                                  → 'user'
 *
 * Role lists are owner-signed kind 30078 addressable events. Canonical
 * d-tags are savedd:admin-roles / savedd:mod-roles; the legacy
 * presearchstr:* lists are still READ (owner-signed only) so existing team
 * members keep access until the owner migrates (Admin → Roles). Resolution
 * rules live in src/lib/saveddProtocol.ts (resolveRoleEvents) — canonical
 * supersedes legacy per list once it exists.
 *
 * Permissions come from the central PERMISSIONS matrix — no scattered
 * isAdmin/isOwner variants with different definitions.
 */
import { useQuery } from '@tanstack/react-query';

import { queryRelayPool } from '@/lib/searchRelays';
import {
  OWNER_PUBKEY,
  ROLES_KIND,
  ROLE_LIST_D_TAGS,
  PERMISSIONS,
  resolveRoleEvents,
  roleForPubkey,
  type SaveddRole,
  type ResolvedRoles,
} from '@/lib/saveddProtocol';
import { getModerationRelayUrls } from '@/lib/moderation';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * Fetch the owner-signed role lists (canonical + legacy) and resolve the
 * effective team. Cached — they change rarely. Only runs when someone is
 * logged in (roles are meaningless logged out, and the query would hit
 * ~15 relays for every visitor).
 */
export function useRoleLists(): ResolvedRoles & { isLoading: boolean } {
  const { user } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    enabled: !!user,
    queryFn: async ({ signal }) => {
      const settled = await queryRelayPool(
        getModerationRelayUrls(),
        [{
          kinds: [ROLES_KIND],
          authors: [OWNER_PUBKEY], // trust boundary: owner-signed only
          '#d': [...ROLE_LIST_D_TAGS],
          limit: ROLE_LIST_D_TAGS.length,
        }],
        { signal },
      );

      const events = [];
      for (const value of settled) {
        for (const ev of value) events.push(ev);
      }
      return resolveRoleEvents(events);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    admins: data?.admins ?? [],
    mods: data?.mods ?? [],
    hasCanonicalAdmins: data?.hasCanonicalAdmins ?? false,
    hasCanonicalMods: data?.hasCanonicalMods ?? false,
    hasLegacyRoles: data?.hasLegacyRoles ?? false,
    isLoading,
  };
}

/** The set of pubkeys trusted to moderate (owner + admins + mods). */
export function useTrustedModerators(): Set<string> {
  const { admins, mods } = useRoleLists();
  return new Set([OWNER_PUBKEY, ...admins, ...mods]);
}

export function useAdminAccess() {
  const { user } = useCurrentUser();
  const { admins, mods, isLoading, hasLegacyRoles, hasCanonicalAdmins, hasCanonicalMods } = useRoleLists();

  const pubkey = user?.pubkey ?? '';
  const role: SaveddRole = roleForPubkey(pubkey, admins, mods);

  return {
    role,
    isOwner: role === 'owner',
    /** Admin = owner or admin list. */
    isAdmin: role === 'owner' || role === 'admin',
    /** Mod = any team member (owner, admin, moderator). */
    isMod: role === 'owner' || role === 'admin' || role === 'moderator',
    /** Roles tab (add/remove team members) — owner only. */
    canManageRoles: PERMISSIONS.canManageRoles(role),
    /** Affiliate rule management — owner + admins. */
    canManageAffiliates: PERMISSIONS.canManageAffiliates(role),
    /** Reports + moderation — the whole team. */
    canModerate: PERMISSIONS.canModerate(role),
    canViewReports: PERMISSIONS.canViewReports(role),
    /** Legacy role lists still in effect (drives the owner migration card). */
    hasLegacyRoles,
    hasCanonicalAdmins,
    hasCanonicalMods,
    isLoading,
    adminList: admins,
    modList: mods,
  };
}

export type { SaveddRole };
