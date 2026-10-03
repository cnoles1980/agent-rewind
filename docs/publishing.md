# Publish the source without publishing your Nebius key

Agent Rewind has three access paths:

| Audience | What they can use | Whose inference key pays for new runs? |
|---|---|---|
| Public visitors | Recorded examples, their own browser-local imports, notes, comparisons, local reports/exports, and links to published clips | None of these features calls a model |
| Invited judges/testers on your hosted demo | The same tools, plus allowlisted fresh coding runs and reviewed clip publication | Your dedicated server-side Nebius key, behind invitations and budget admission |
| People cloning the public GitHub repository | Run the player/API locally; optionally configure their own live runner | Their own Nebius account, key, sandbox project, image and budget |

Public source does not mean public access to your paid inference. Forks do not inherit your Render secret settings. Do not provide the judge invitation in the public README, demo video, screenshots, repository issues, or source.

## Corey: when ready to publish

1. Create a **dedicated Rewind Nebius key** in the provider dashboard. Keep it separate from Agent Bridge. Do not paste it into chat or code.
2. For local development, place it in the ignored root `.env` as `NEBIUS_API_KEY`. The committed `.env.example` contains empty placeholders. Never use a `VITE_` variable for credentials: those values can be bundled into browser JavaScript.
3. Before the first GitHub push, review the staged files **and Git history**, not only `.gitignore`. Exclude `.env`, private recordings, `.local`, runtime databases, logs, backups, and invitation plaintext. Check the built browser bundle for secrets too. Repeat this check after adding any key or personal recording. A pattern scan is a useful check, not proof that all confidential content is absent.
4. Publish only the reviewed source repository. The GitHub Actions test workflow needs **no real Nebius key**: it uses synthetic fixtures and provider doubles. Do not add the live key to test jobs or let pull-request code access it.
5. In **Render → Rewind service → Environment**, add `NEBIUS_API_KEY` and the other server settings from the deployment guide. The blueprint uses `sync: false` placeholders, so actual secrets are supplied through Render rather than committed to `render.yaml`. Deploy/restart to apply them.
6. Generate a separate high-entropy judge invitation code; put only its hash in `REWIND_JUDGE_CODE_HASH`. Give the plaintext code and demo URL to judges through the submission's private testing instructions. Judges enter the code in **New demo run**; they never receive the Nebius key.
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
- Hosting, real judge execution, and public publication still need their separate acceptance checks. These instructions do not claim deployment is complete.

References: [Render environment variables and secret placeholders](https://render.com/docs/configure-environment-variables), [Vite client environment-variable exposure](https://vite.dev/guide/env-and-mode), [GitHub guidance after secret exposure](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
