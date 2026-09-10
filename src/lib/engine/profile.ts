/**
 * Community Engine Profile — one core, many independently branded engines.
 *
 * SAVEDD is the first proof of concept: a Christian community search engine
 * on the Dsearch / SIP-01 architecture. Future engines (Bitcoin, academic,
 * local, …) should be new profiles, not forks of the search pipeline.
 *
 * Nothing in this file is a secret. API keys stay in the Cloudflare worker
 * environment (`AI_API_KEY`, `BRAVE_API_KEY`) and never ship in the bundle.
 */

export interface EngineNavLink {
  to: string;
  label: string;
}

export interface EngineBranding {
  name: string;
  shortName: string;
  domain: string;
  siteUrl: string;
  slogan: string;
  description: string;
  ogImage: string;
  /** Default appearance for first-time visitors. */
  defaultTheme: 'light' | 'dark';
  /** Search-bar placeholder. */
  searchPlaceholder: string;
  /** Wordmark as shown in the header (plain text; styling is CSS). */
  wordmark: string;
}

export interface EngineSearchConfig {
  /** SIP-01 community index is a first-class source. */
  sip01: boolean;
  /**
   * Indexer software id stamped as the `source` tag on every SIP-01
   * kind 39697 observation this engine publishes (spec §6). One id per
   * branded engine, so the network attributes contributions to this
   * engine — not to the shared Dsearch core it runs on.
   */
  indexerSource: string;
  /** Brave Search via the engine proxy (and/or a user BYOK key). */
  brave: boolean;
  /**
   * Provider ids turned off for this community engine's first-run config.
   * Users can re-enable anything in Settings — the providers themselves
   * stay in the registry.
   */
  disabledProviders: string[];
}

export interface EngineTabConfig {
  order: string[];
  hidden: string[];
  defaultTab: string;
}

export interface EngineUiConfig {
  /** Ecosystem hub pages (Network / Build / Protocol / Community / …). */
  showNetwork: boolean;
  showBuild: boolean;
  showProtocol: boolean;
  showCommunity: boolean;
  showDashboard: boolean;
  showDocs: boolean;
  showExplore: boolean;
  showTrending: boolean;
  showSubmit: boolean;
  showStake: boolean;
  showLogin: boolean;
  showNostr: boolean;
  biblicalQuotes: boolean;
  tabConfig: EngineTabConfig;
  navLinks: EngineNavLink[];
  footerLinks: EngineNavLink[];
  footerTagline: string;
}

export interface EngineAiConfig {
  /** AI answers on for first-time visitors (still opt-out in Settings). */
  enabledDefault: boolean;
  /** OpenAI-compatible provider id used as the settings default. */
  providerId: string;
  /** Display name of the intended engine-tier provider. */
  providerName: string;
  /** Default OpenAI-compatible endpoint (engine-tier; no key here). */
  endpoint: string;
  /** Default model id (engine-tier; operator can override via env). */
  model: string;
  /**
   * Production system prompt. Injected server-side on the engine tier so
   * clients cannot override it. Also used client-side for user-BYOK calls.
   */
  systemPrompt: string;
}

export interface CommunityEngineProfile {
  id: string;
  branding: EngineBranding;
  search: EngineSearchConfig;
  ui: EngineUiConfig;
  ai: EngineAiConfig;
}

/** KJV — public domain. Used by the SAVEDD AI profile; not a theological authority. */
export const SAVEDD_SYSTEM_PROMPT = `You are the AI answer assistant for SAVEDD, a Christian community search engine.

Your role is to help users understand search results and answer questions using ONLY the supplied evidence.

Rules that always apply:
- Answer using the supplied evidence whenever possible.
- NEVER invent sources, URLs, quotations, or Bible verses.
- Cite every factual statement with [n] markers referencing the evidence items.
- Clearly separate what the evidence says from your own inference.
- If the evidence is insufficient, say so plainly and say what is missing.
- Be concise: a direct answer first, then supporting detail. No preamble.
- You are an assistant, not a religious authority. Never claim divine revelation, prophetic insight, or certainty the evidence does not support.

When the question is theological or about Christian faith:
- Prioritize Scripture where the evidence includes it.
- Identify Bible references accurately (book, chapter, verse). Never fabricate a quotation or a reference.
- Distinguish biblical text from commentary and from your own interpretation.
- Acknowledge legitimate denominational differences. Do not present one tradition's interpretation as the only Christian view, and do not present interpretation as if it were Scripture itself.
- Distinguish mainstream historic Christian consensus from minority interpretations when the evidence supports that distinction.
- Indicate uncertainty rather than inventing a resolution.

When the question is ordinary and not theological:
- Answer normally, truthfully, and evidence-based.
- Do not force Christianity, Scripture, or religious framing into unrelated searches.`;

/**
 * SAVEDD — Christian community search engine.
 *
 * Built on Dsearch core + SIP-01. This profile is the product surface;
 * the search pipeline, providers, parser, and index protocol stay shared.
 */
export const SAVEDD_PROFILE: CommunityEngineProfile = {
  id: 'savedd',
  branding: {
    name: 'SAVEDD',
    shortName: 'SAVEDD',
    domain: 'savedd.com',
    siteUrl: 'https://savedd.com',
    slogan: 'Seek, and ye shall find.',
    description:
      'SAVEDD searches Scripture, the Church, and the open web. Optional AI answers are grounded in sources — never invented, never claimed as revelation.',
    ogImage: 'https://savedd.com/og.jpg',
    defaultTheme: 'light',
    searchPlaceholder: 'Ask of the Word, the Church, and the world…',
    wordmark: 'SAVEDD',
  },
  search: {
    sip01: true,
    indexerSource: 'savedd-web/1',
    brave: true,
    // Keep SIP-01 (web-index), Brave, DuckDuckGo, and SearXNG on.
    // Everything else stays in the architecture but is off for this profile.
    disabledProviders: [
      'parallel',
      'cached-index',
      'wikipedia',
      'tor',
      'stackoverflow',
      'nostr',
      'git',
      'nostr-wiki',
      'hackernews',
      'community',
      'keyword-stakes',
    ],
  },
  ui: {
    showNetwork: false,
    showBuild: false,
    showProtocol: false,
    showCommunity: false,
    showDashboard: false,
    showDocs: false,
    showExplore: false,
    showTrending: false,
    showSubmit: false,
    showStake: false,
    showLogin: false,
    showNostr: false,
    biblicalQuotes: true,
    tabConfig: {
      order: ['web', 'index', 'all', 'nostr', 'wiki', 'news', 'code', 'tor', 'i2p'],
      hidden: ['all', 'nostr', 'wiki', 'news', 'code', 'tor', 'i2p'],
      defaultTab: 'web',
    },
    navLinks: [{ to: '/about', label: 'About' }],
    footerLinks: [
      { to: '/about', label: 'About' },
      { to: '/settings', label: 'Settings' },
      { to: '/policy', label: 'Content Policy' },
    ],
    footerTagline: 'Matthew 7:7',
  },
  ai: {
    enabledDefault: true,
    providerId: 'openai',
    providerName: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    systemPrompt: SAVEDD_SYSTEM_PROMPT,
  },
};

/**
 * Active engine for this deployment.
 *
 * Swap this constant (or load from a catalog) to launch the next community
 * engine on the same core. Do not scatter brand strings through the app.
 */
export const ENGINE_PROFILE: CommunityEngineProfile = SAVEDD_PROFILE;
