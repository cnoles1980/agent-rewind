# Publish the source without publishing your Nebius key

Agent Rewind has three access paths:

| Audience | What they can use | Whose inference key pays for new runs? |
|---|---|---|
| Public visitors | Recorded examples, their own browser-local imports, notes, comparisons, local reports/exports, and links to published clips | None of these features calls a model |
| Invited judges/testers on your hosted demo | The same tools, plus reviewed Nemotron analysis, allowlisted fresh coding runs and reviewed clip publication | Your dedicated server-side Nebius key, behind invitations and shared budget admission |
| People cloning the public GitHub repository | Run the player/API locally; optionally configure analysis or their own live runner | Their own Nebius account/key for analysis; sandbox project/image additionally required for coding runs |

Public source does not mean public access to your paid inference. Forks do not inherit your Cloudflare Worker secrets (or alternative Render settings). Do not provide the judge invitation in the public README, demo video, screenshots, repository issues, or source. The active [Cloudflare deployment](../cloudflare/README.md) supports invited analysis and clips; fresh coding runs remain disabled pending sandbox approval and integration.

Evidence analysis has its own enable/pricing flags and does not need sandbox provisioning. Follow [analysis setup](analysis.md). Judges can enter their invitation directly in the Debug report analysis panel. Verify anonymous `POST /api/analyses` is denied as well as anonymous execution. All inference shares the project budget.

## Corey: when ready to publish

1. Create a **dedicated Rewind Nebius key** in the provider dashboard. Keep it separate from Agent Bridge. Do not paste it into chat or code.
2. For local development, place it in the ignored root `.env` as `NEBIUS_API_KEY`. The committed `.env.example` contains empty placeholders. Never use a `VITE_` variable for credentials: those values can be bundled into browser JavaScript.
3. Before the first GitHub push, review the staged files **and Git history**, not only `.gitignore`. Exclude `.env`, private recordings, `.local`, runtime databases, logs, backups, and invitation plaintext. Check the built browser bundle for secrets too. Repeat this check after adding any key or personal recording. A pattern scan is a useful check, not proof that all confidential content is absent.
4. Publish only the reviewed source repository. The GitHub Actions test workflow needs **no real Nebius key**: it uses synthetic fixtures and provider doubles. Do not add the live key to test jobs or let pull-request code access it.
5. For Cloudflare, use the [Worker secrets and deployment instructions](../cloudflare/README.md). The dedicated key is server-side. The optional Render blueprint uses `sync: false` placeholders if you choose that alternative; neither host receives keys through committed source.
6. Generate a separate high-entropy judge invitation code; put only its hash in `REWIND_JUDGE_CODE_HASH` for Python, or `JUDGE_CODE_HASH` for Cloudflare. Give the plaintext code and demo URL to judges through the submission's private testing instructions. Judges enter the code through **Enter invitation code** or the Debug report analysis panel; they never receive the Nebius key.
7. Before enabling launches, finish the real sandbox and pricing gates in `deployment.md`. Keep the eight-call cap, deadline, single-job limit, and reserved judge/test budgets. Invitation access still spends your budget; it is not free inference.
8. In an incognito browser, verify that examples and local imports work without an invitation, and that unauthenticated `POST /api/demo-runs` is denied. Verify a judge can log in and launch a real run once configured. Inspect browser network responses and downloaded assets to confirm no key appears.

The public hosted app does **not** currently accept a visitor's own API key. People wanting unrestricted live runs must self-host the source and configure their own server. A browser key-entry form would introduce an additional credential-handling surface and is deliberately absent.

## If a secret is accidentally committed

Revoke/rotate it first. Deleting the file or adding `.gitignore` does not remove older commits or invalidate copied credentials. Then assess whether history cleanup is required before publishing again. Do not treat private repository visibility as secret management.

## Current implementation checks

- `.gitignore` excludes real env files, local recordings, runtime data, and `.local`; only `.env.example` is intentionally committed.
- `NEBIUS_API_KEY` is read in Python configuration. API status uses an explicit safe field list and does not serialize configuration or credentials.
- Fresh runs and clip publication authenticate the invitation session on the server; UI hiding alone is not the protection.
- A synthetic-key regression test verifies public status, invitation login responses, and unauthorized launch responses do not expose the configured credential.
- Public source is published at [cnoles1980/agent-rewind](https://github.com/cnoles1980/agent-rewind). [Hosted access and analysis checks](cloudflare-deployment-check-2026-10-03.md) passed. Real sandbox coding execution still requires its separate acceptance check.

References: [Render environment variables and secret placeholders](https://render.com/docs/configure-environment-variables), [Vite client environment-variable exposure](https://vite.dev/guide/env-and-mode), [GitHub guidance after secret exposure](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
