# Cloudflare hosted adapter

Serves the Vite player, invitation sessions, reviewed Nemotron analysis, and unlisted clips on a `workers.dev` address. No custom domain, Render account, container, or sandbox is needed for these features.

**Live coding execution is deliberately unavailable here.** Nebius beta approval, runner integration, cancellation/recovery checks, and a real end-to-end coding run remain required. The Python runner is retained in `src/agent_rewind`; it has not been silently replaced by example playback.

## Build and verify

From the repository root, with Python/uv and Node installed:

```text
uv sync --frozen
npm --prefix web ci
npm --prefix web run build
uv run python scripts/generate_cloudflare_contract.py
cd web
node scripts/generate-analysis-validator.mjs
cd ../cloudflare
npm ci
npm run types
npm run check
npm run build
npm test
```

The Python models and prompt are the source of the hosted analysis contract. Regenerate after editing them. Both adapters use the same browser tape validator and redactor. Tests use real local Cloudflare storage/runtime with a synthetic inference provider; they never need real keys.

## Deploy your own instance

1. Run `npx wrangler login` in this directory. Choose your own account; update `name` and `vars.ORIGIN` in `wrangler.jsonc` to your final HTTPS `workers.dev` address. No account ID or provider key is committed.
2. Create a private, ignored JSON secrets file, for example `../.local/cloudflare-secrets.json`, with these **string** fields:
   - `NEBIUS_API_KEY`: your dedicated inference key.
   - `TESTER_CODE_HASH` and `JUDGE_CODE_HASH`: SHA-256 hex hashes of separate cryptographically random invitation codes. Keep the actual codes in private testing instructions. Do not reuse development invitations.
   - `OWNER_CODE_HASH`: SHA-256 hex hash of a separate owner invitation. Only this login can read private feedback and create/revoke individual study invitations. See [tester access](../docs/tester-access.md). Never distribute the owner code to testers.
   - `INITIAL_TESTER_CENTS` and `INITIAL_JUDGE_CENTS`: previous reserved spending for this project, or `"0"` for a genuinely new project. These seed the persistent ledger once; changing them later does not reset or adjust that ledger.
3. Build and verify, then deploy with inference off:

   ```text
   npx wrangler deploy --secrets-file ../.local/cloudflare-secrets.json
   ```

4. Check the public examples, invitation login, clip publication/revocation, exact-origin protection, and persistence after redeploy. Secrets must not appear in browser assets or API responses.
5. Verify the model price and your account's billing. Each analysis reserves **25 cents**, including failed/ambiguous requests, against the $20 tester/$30 judge allowances. This is a conservative reservation, not an invoice amount. A further $30 remains reserved for hosting/other commitments, with the $100 total ceiling enforced. Never reset the ledger to admit more requests. Stop paid calls on the old local instance before switching to this ledger; two independent servers do not share accounting.
6. Enable analysis only after those checks:

   ```text
   npx wrangler deploy --var ANALYSIS_ENABLED:true --var ANALYSIS_PRICES_VERIFIED:true
   ```

   Repeat both flags on subsequent deployments to keep analysis enabled. A plain `npm run deploy` uses the safer committed defaults and disables it. Existing hosted secrets are retained unless explicitly replaced.

Public visitors cannot use your inference key. People cloning this repository bring their own server-side key; there is no browser API-key entry form. Send judges the hosted URL and only the judge invitation privately. Sessions expire after seven days and can be renewed with the code.

## Storage and recovery

- `AccessState`: one SQLite-backed object per session or hashed login IP, with expiring sessions and rate limits.
- `BudgetLedger`: one coordination object for this project's cash reservations and clip quotas. No excerpt, generated analysis, session secret, or clip body is persisted in it. Inference runs outside this object; stale in-flight reservations become interrupted after 90 seconds and remain charged against the allowance.
- `ClipStore`: one object per unguessable share token. Reviewed clip data is chunked, and revocation deletes the content. A small management-hash tombstone supports safe retry after an ambiguous revocation.
- Successful/failed analysis metadata records counts and usage only. Worker invocation logging is disabled to avoid logging clip URLs. Application logs contain generic event names and roles, never evidence or provider bodies.
- DO storage survives deployment and supports Cloudflare point-in-time recovery. Do not delete the namespace or change the ledger name/migration class to work around a quota. Restore storage through Cloudflare's recovery tools; do not recover deleted private clips casually.
- To stop paid requests, deploy without the enable flags. Existing local imports/examples/clips remain usable. To rotate invitations, update hashes using `wrangler secret put`; existing sessions expire normally within seven days. For an urgent compromise, disable analysis while revoking affected sessions through a reviewed maintenance migration.
- Monitor actual Cloudflare/Nebius billing. Application inference reservations do not impose a supplier-wide billing cap or cover arbitrary traffic to other applications in the account. This deployment does not change your Cloudflare subscription or automatically increase spending.

Cloudflare's [SQLite Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) supports Free and Paid plans. Free-tier exhaustion causes service errors; it is not an availability guarantee. The submitted site needs an owner to maintain access and billing through December 15.
