<p align="center">
  <img src="public/brand/logo.svg" alt="SAVEDD — Seek, and ye shall find." width="480">
</p>

# SAVEDD

**Seek, and ye shall find.**

SAVEDD searches Scripture, the Church, and the open web — the first proof that the Dsearch / SIP-01 stack can power independently branded community engines without duplicating the search infrastructure.

**Target:** [savedd.com](https://savedd.com)

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2FSavedd.git)

---

## What this is

```
Dsearch Core  +  SIP-01 shared index  +  Community Engine Profile
        =  SAVEDD (this deployment)
```

The next community engine should be another profile, not another fork of the pipeline.

The SAVEDD profile lives in [`src/lib/engine/profile.ts`](src/lib/engine/profile.ts): branding, enabled providers, UI flags, the SIP-01 indexer source id (`savedd-web/1`), and the Christian AI system prompt.

---

## Search

- **SIP-01** community web index (first-class)
- **Brave Search** via a same-origin worker proxy (`BRAVE_API_KEY` never reaches the browser)
- DuckDuckGo / SearXNG remain available
- Structured queries (`"phrase"`, `AND`/`OR`/`NOT`, `site:`, `lang:`, `after:`, …) inherited from Dsearch / SIP-02 groundwork
- Privacy-aware provider skipping (calculator, URLs, Nostr identifiers)

## AI answers

Optional, evidence-grounded, ephemeral (never indexed).

Credential order: your own OpenAI-compatible key → engine-provided proxy (`/api/ai`, operator `OPENAI_API_KEY`) → built-in free tier → unavailable.

On the engine tier the SAVEDD system prompt is injected **server-side**. Clients cannot override it.

---

## Operator secrets

Never put keys in Vite `VITE_*` variables or the frontend bundle.

```bash
wrangler secret put OPENAI_API_KEY   # OpenAI or compatible (legacy alias: AI_API_KEY)
wrangler secret put BRAVE_API_KEY    # Brave Search
```

Non-secret defaults are in `wrangler.jsonc` (`AI_PROVIDER_ENDPOINT`, `AI_MODEL`, `AI_PROVIDER_NAME`).

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:8080` and search.

---

## Tech

React 19 · TypeScript · Vite · TailwindCSS 4 · shadcn/ui · Nostrify · TanStack Query · Cloudflare worker (AI + Brave proxies)

## License

MIT

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
