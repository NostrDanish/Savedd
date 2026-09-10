/**
 * REST-API deploy entry — thin wrapper around worker.ts.
 *
 * The canonical deployment is `wrangler deploy` (wrangler.jsonc carries the
 * non-secret `vars`). When the worker is deployed through the Cloudflare
 * REST API instead (single-module upload, no metadata attachment possible),
 * those same non-secret defaults are inlined here so behavior is identical.
 *
 * Secrets are NEVER inlined — they come from the Worker secret store:
 *   OPENAI_API_KEY (legacy alias AI_API_KEY), BRAVE_API_KEY.
 *
 * Keep DEFAULT_VARS in sync with wrangler.jsonc → vars.
 */
import worker from './worker';

type Env = Parameters<typeof worker.fetch>[1];

/** Non-secret operator config — mirror of wrangler.jsonc `vars`. */
const DEFAULT_VARS: Record<string, string> = {
  OWNER_PUBKEY: 'c45041618951bb6012ac23f5cdf3d740465f2d640be841fd9bb1d0733370cd3c',
  AI_PROVIDER_ENDPOINT: 'https://api.openai.com/v1',
  AI_MODEL: 'gpt-5.6-luna',
  AI_PROVIDER_NAME: 'OpenAI',
  AI_ENGINE_ENABLED: 'true',
};

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    // Real environment bindings (secrets, overrides) win over the defaults.
    return worker.fetch(request, { ...DEFAULT_VARS, ...env });
  },
};
