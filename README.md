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

## Production wiring

- **Frontend**: [savedd.com](https://savedd.com) is served by Vercel from this repo.
- **API signer**: the Cloudflare Worker (`savedd.savedd.workers.dev`) holds
  `OPENAI_API_KEY` / `BRAVE_API_KEY` server-side and serves `/api/ai/*` +
  `/api/search/brave/*`. Vercel rewrites `/api/*` to it (see `vercel.json`),
  so the browser only ever talks same-origin — no keys, no CORS surface.
- Canonical worker definition: `worker.ts` + `wrangler.jsonc`
  (`wrangler deploy`). `worker.api-entry.ts` is the thin wrapper used when
  deploying the same worker through the Cloudflare REST API (single-module
  upload can't carry `vars`, so the non-secret defaults are inlined there;
  secrets still come from the Worker secret store).

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:8080` and search.

---

## Native apps (Android APK / iOS)

SAVEDD wraps the same web app with [Capacitor](https://capacitorjs.com/). App id: `com.savedd.app`. Custom scheme: `savedd://`.

**Phase 0 (current):** the Android WebView loads [savedd.com](https://savedd.com) live. Search, AI, and `/api/*` work as on the web. Result taps open in Chrome Custom Tabs.

**Debug APK in this repo:** after CI runs, download [`releases/savedd-debug.apk`](https://github.com/NostrDanish/Savedd/raw/main/releases/savedd-debug.apk) on your phone and install (enable “Install unknown apps” for the browser). Unsigned debug build — sideload only.

This environment cannot compile a signed APK or IPA (needs Android Studio / Xcode + a Mac for iOS). On your machine:

```bash
npm install
npm run build

# First time only — generate the native projects
npx cap add android
npx cap add ios          # macOS only

npx cap sync
```

**Android APK (sideload / Play Store):**

```bash
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)** for a debug APK, or **Generate Signed Bundle / APK** for a release you can publish. The APK lands under `android/app/build/outputs/apk/`.

**iOS (TestFlight / App Store):**

```bash
npx cap open ios         # macOS + Xcode required
```

In Xcode: pick a simulator or a signed device, then **Product → Archive** for TestFlight / App Store. You need an Apple Developer account for a real device or store build.

After UI changes, always `npm run cap:sync` (or `npm run cap:android` / `npm run cap:ios`) so the native shells pick up the new `dist/`.

---

## Tech

React 19 · TypeScript · Vite · TailwindCSS 4 · shadcn/ui · Nostrify · TanStack Query · Capacitor (Android / iOS) · Cloudflare worker (AI + Brave proxies)

## License

MIT

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
