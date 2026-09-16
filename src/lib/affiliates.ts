/**
 * Affiliate link tagging — owner-managed domain → affiliate-code rules.
 *
 * Model: the owner (or an owner-listed admin) publishes ONE addressable
 * NIP-78 event (kind 30078, d-tag `savedd:affiliate-rules`) whose content
 * is a JSON rule list:
 *
 *   { "version": 1, "rules": [{ "host": "amazon.ca", "param": "tag", "value": "savedd-21" }] }
 *
 * Every client reads that event — author-filtered to the owner + the
 * owner-signed admin role list (the trust boundary, same as the moderation
 * lists; last-write-wins across the team) — and rewrites matching outbound
 * result URLs: `https://www.amazon.ca/item/…` becomes
 * `https://www.amazon.ca/item/…?tag=savedd-21`.
 *
 * Nothing here is secret by design — affiliate codes are visible in the
 * final tagged URL no matter what. Keeping the config as a signed public
 * event means: no server storage, no new endpoints, works identically on
 * the web app and the Capacitor shell, and every change is auditable.
 *
 * First matching rule wins. An existing affiliate parameter on the URL is
 * REPLACED (that is the point — our code should win over a scraped one).
 */
import type { NostrEvent } from '@nostrify/nostrify';

/** NIP-78 app-specific data kind (already used for submissions/stakes). */
export const AFFILIATES_KIND = 30078;

/** Addressable d-tag of the owner-signed affiliate rule list. */
export const AFFILIATES_D_TAG = 'savedd:affiliate-rules';

/** Topic tag for relay-level filtering / discoverability. */
export const AFFILIATES_T_TAG = 'savedd-affiliate-rules';

export interface AffiliateRule {
  /** Bare host to match, e.g. `amazon.ca` (also matches `www.amazon.ca` etc.). */
  host: string;
  /** Query parameter name, e.g. `tag`. */
  param: string;
  /** Affiliate code value, e.g. `savedd-21`. */
  value: string;
}

const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/;
const PARAM_RE = /^[A-Za-z0-9_-]{1,32}$/;
// Affiliate codes are token-like; reject anything that could break a URL.
const VALUE_RE = /^[A-Za-z0-9_.~-]{1,64}$/;

export function isValidAffiliateRule(rule: AffiliateRule): boolean {
  return (
    HOST_RE.test(rule.host)
    && PARAM_RE.test(rule.param)
    && VALUE_RE.test(rule.value)
  );
}

/**
 * Parse an affiliate-config event into a validated rule list.
 * The author filter is the trust boundary — callers must only pass events
 * whose pubkey is the owner or an owner-listed admin (`trustedAuthors`);
 * the membership check here is defense-in-depth.
 */
export function parseAffiliateRules(event: NostrEvent, trustedAuthors: Set<string>): AffiliateRule[] {
  if (event.kind !== AFFILIATES_KIND) return [];
  if (!trustedAuthors.has(event.pubkey)) return [];
  if (event.tags.find(([n]) => n === 'd')?.[1] !== AFFILIATES_D_TAG) return [];

  try {
    const parsed = JSON.parse(event.content) as unknown;
    if (!parsed || typeof parsed !== 'object') return [];
    const rules = (parsed as Record<string, unknown>).rules;
    if (!Array.isArray(rules)) return [];

    const valid: AffiliateRule[] = [];
    for (const r of rules) {
      if (!r || typeof r !== 'object') continue;
      const { host, param, value } = r as Record<string, unknown>;
      if (typeof host !== 'string' || typeof param !== 'string' || typeof value !== 'string') continue;
      const rule: AffiliateRule = {
        host: host.trim().toLowerCase().replace(/\.$/, ''),
        param: param.trim(),
        value: value.trim(),
      };
      if (isValidAffiliateRule(rule)) valid.push(rule);
    }
    return valid;
  } catch {
    return [];
  }
}

/** Build the owner-signed config event template (NIP-31 alt tag included). */
export function buildAffiliateRulesEvent(rules: AffiliateRule[]): {
  kind: number;
  content: string;
  tags: string[][];
} {
  return {
    kind: AFFILIATES_KIND,
    content: JSON.stringify({ version: 1, rules }),
    tags: [
      ['d', AFFILIATES_D_TAG],
      ['t', AFFILIATES_T_TAG],
      ['alt', 'SAVEDD affiliate link rules (owner-managed domain → code map)'],
    ],
  };
}

/**
 * Apply the first matching rule to a URL. Returns the input unchanged when
 * nothing matches or the URL isn't http(s). Values go through
 * URLSearchParams, so encoding is always safe.
 */
export function applyAffiliateRules(url: string, rules: AffiliateRule[]): string {
  if (rules.length === 0) return url;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url;

  const hostname = u.hostname.toLowerCase().replace(/\.$/, '');
  for (const rule of rules) {
    if (hostname === rule.host || hostname.endsWith(`.${rule.host}`)) {
      u.searchParams.set(rule.param, rule.value);
      return u.toString();
    }
  }
  return url;
}
