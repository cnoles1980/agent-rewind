# Deployment preflight — October 3, 2026

**Result: local checks pass; hosted judge access and real sandbox execution remain blocked by missing external configuration.** Do not present this preflight as a live hosted acceptance result.

## Checked

- `render.yaml` validates against Render's published [JSON Schema](https://render.com/schema/render.yaml.json). The [Blueprint reference](https://render.com/docs/blueprint-spec) documents this validation. No service or billing commitment was created.
- The blueprint uses one API worker, a persistent disk, HTTPS-only session cookies, separately supplied secrets, and paid workflows disabled initially. A frozen-lock frontend production build passes locally.
- Local HTTPS test-client verification passes for a judge invitation: judge role, Secure/HttpOnly/SameSite=strict cookie, seven-day lifetime, cross-origin login rejection, unauthenticated job rejection, authenticated job listing, and logout revocation. This checks application behavior, not a real TLS endpoint or Render's proxy.
- Production-bundle browser checks pass for public examples, invited sharing, anonymous clip access, and revocation. Tutorial navigation/reopening/dismissal makes no mutation request.
- Local configuration has a dedicated Nebius key and enabled analysis. It does **not** have a sandbox project, Python image, verified execution pricing, or live execution enabled. Its configured origin is loopback, not hosted HTTPS.
- Nebius's [official sandbox overview](https://docs.tokenfactory.nebius.com/sandboxes/overview) still identifies sandbox access as beta-gated. The missing project/image prevents a valid execution request; no image identifier was guessed and no new paid request was made.

## What Corey needs to provide

1. **Render:** connect the public Agent Rewind repository to a new Blueprint, review the paid service/disk checkout against the $30 hosting allocation, and supply the final HTTPS URL. Use `render.yaml`. Do not accept an added workspace subscription or spend above the agreed ceiling without revisiting the budget.
2. **Hosted secrets:** set `REWIND_ORIGIN` to that exact HTTPS origin; add the dedicated `NEBIUS_API_KEY` privately in Render. Generate new production tester/judge codes and store only their hashes in Render. Keep judge codes in private testing instructions. Follow [deployment](deployment.md) and [analysis setup](analysis.md) for the enablement flags and verified reservation.
3. **Sandbox:** request/confirm Nebius beta access, then add `NEBIUS_PROJECT_ID` and a verified `NEBIUS_SANDBOX_IMAGE` to the ignored local `.env`. Confirm `/usr/local/bin/python -I -` and actual execution prices. Never paste keys in chat.

## Acceptance run after configuration

Use a fresh browser against the hosted URL. Confirm public examples; anonymous paid-route denial; judge sign-in without an API key; secure cookie flags; one explicitly reviewed synthetic analysis; cross-session job denial; clip publication/revocation; and persisted data after restart.

For the sandbox, verify a disposable fixture operation with no network or inherited environment; independent $50 acceptance tests; cancellation; the hard deadline; cleanup; and recovery after interruption. Only then enable fresh coding runs and test both policy variants. Record actual outcomes, operation cleanup, token usage, and reservations in `verification.md`.

If Nebius cannot be provisioned or is over budget, make the agreed E2B fallback decision explicitly. Saved playback is not a substitute for successful live execution.
