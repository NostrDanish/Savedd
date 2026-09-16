/**
 * Affiliate link tagging — owner-managed domain → affiliate-code rules.
 *
 * Model: the owner (or an owner-listed admin) publishes ONE addressable
 * NIP-78 event (kind 30078, d-tag `savedd:affiliate-rules`) whose content
 * is a JSON rule list:
 *
 *   { "version": 1, "rules": [
 *       { "host": "amazon.ca", "mode": "param", "param": "tag", "value": "savedd-21" },
 *       { "host": "ppq.ai", "mode": "redirect", "target": "https://ppq.ai/invite/949880ca" }
 *   ] }
 *
 * Two tagging modes, because affiliate programs come in two shapes:
 *   - `param`    — query-param tagging (Amazon `?tag=`): matched result URLs
 *                  keep their page and gain/replace the parameter.
 *   - `redirect` — referral-link services (PPQ `/invite/<code>`, nano-gpt
 *                  `/r/<code>`): matched result URLs are replaced by the
 *                  referral link itself, since the referral page sets the
 *                  tracking cookie. `{url}` in the target is substituted
 *                  with the (encoded) original link for prefix-style programs.
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
  /** Bare host to match, e.g. `amazon.ca` or `ppq.ai` (also matches subdomains). */
  host: string;
  /**
   * Tagging mode:
   *  - `param`    — append/replace a query parameter (Amazon: ?tag=code)
   *  - `redirect` — replace the whole URL with a referral link
   *                 (PPQ: https://ppq.ai/invite/<code>, nano-gpt: /r/<code>).
   *                 The literal token `{url}` in target is substituted with
   *                 the URL-encoded original link.
   * Rules without `mode` but with param+value parse as `param` (back-compat).
   */
  mode: 'param' | 'redirect';
  /** `param` mode: query parameter name, e.g. `tag`. */
  param?: string;
  /** `param` mode: affiliate code value, e.g. `savedd-21`. */
  value?: string;
  /** `redirect` mode: referral URL, e.g. `https://ppq.ai/invite/949880ca`. */
  target?: string;
}

const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/;
const PARAM_RE = /^[A-Za-z0-9_-]{1,32}$/;
// Affiliate codes are token-like; reject anything that could break a URL.
const VALUE_RE = /^[A-Za-z0-9_.~-]{1,64}$/;
const URL_PLACEHOLDER = '{url}';

/** A redirect target: https URL, optionally containing one {url} placeholder. */
export function isValidRedirectTarget(target: string): boolean {
  const withoutPlaceholder = target.split(URL_PLACEHOLDER).join('https://example.com/x');
  try {
    const u = new URL(withoutPlaceholder);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidAffiliateRule(rule: AffiliateRule): boolean {
  if (!HOST_RE.test(rule.host)) return false;
  if (rule.mode === 'param') {
    return !!rule.param && PARAM_RE.test(rule.param) && !!rule.value && VALUE_RE.test(rule.value);
  }
  if (rule.mode === 'redirect') {
    return !!rule.target && isValidRedirectTarget(rule.target);
  }
  return false;
}

/**
 * Normalize whatever a user pastes into the host field down to a bare
 * hostname: full URLs (https://ppq.ai/invite/x → ppq.ai), www prefixes,
 * paths, ports, trailing dots. Forgiving input beats cryptic errors.
 */
export function normalizeHostInput(input: string): string {
  let v = input.trim().toLowerCase();
  if (v.includes('://')) {
    try {
      v = new URL(v).hostname;
    } catch {
      // Keep going — the path/port stripping below still helps.
    }
  }
  return v.split('/')[0].split(':')[0].replace(/^www\./, '').replace(/\.$/, '');
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
      const raw = r as Record<string, unknown>;
      if (typeof raw.host !== 'string') continue;

      // Back-compat: rules saved before `mode` existed are param-mode.
      const mode: AffiliateRule['mode'] = raw.mode === 'redirect' ? 'redirect' : 'param';

      const rule: AffiliateRule = {
        host: raw.host.trim().toLowerCase().replace(/\.$/, ''),
        mode,
        param: typeof raw.param === 'string' ? raw.param.trim() : undefined,
        value: typeof raw.value === 'string' ? raw.value.trim() : undefined,
        target: typeof raw.target === 'string' ? raw.target.trim() : undefined,
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
 * nothing matches or the URL isn't http(s). Param values go through
 * URLSearchParams, so encoding is always safe; redirect targets are
 * validated https URLs (with optional {url} substitution).
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
    if (hostname !== rule.host && !hostname.endsWith(`.${rule.host}`)) continue;

    if (rule.mode === 'redirect') {
      // Replace the destination with the referral link — that's how
      // cookie-based programs (PPQ invite, nano-gpt /r/) attribute.
      return rule.target!.split(URL_PLACEHOLDER).join(encodeURIComponent(url));
    }

    u.searchParams.set(rule.param!, rule.value!);
    return u.toString();
  }
  return url;
}
