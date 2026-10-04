# Cloudflare deployment check — October 3, 2026 (Central)

Public site: https://agent-rewind.cnoles1980.workers.dev/

## Verified on the actual hosted service

- HTTPS player, public examples, first-use tutorial, and safe API status.
- Separate tester and judge invitation login with Secure/HttpOnly/SameSite cookies. Anonymous paid access is denied; foreign mutation origins return 403.
- Real NVIDIA Nemotron 3.5 Lightning inference through Nebius, approximately 7.1 seconds for the first synthetic excerpt: 792 input / 1,756 completion / 2,548 total tokens. This is inference verification, **not sandbox execution**.
- Duplicate analysis request returned 409, without a second paid call.
- Reviewed synthetic clip publication, anonymous read, seeded-secret removal, persistence across actual redeployment, revocation, and 404 after revocation.
- Previous local development reservations ($1.25) carried into hosted accounting. Fresh hosted invitations are stored only in the owner's ignored local files. The dedicated provider key is a Cloudflare Worker secret.
- Local paid analysis was disabled and its API restarted to avoid separate local/hosted spending ledgers. Local imports, replay, comparison, and evidence-only reports remain available.

The first model response identified the boundary problem but included a conditional suggestion to change the acceptance test. The system instruction was tightened and the reviewed handoff now includes an explicit application-written guardrail preserving stated requirements and protected tests. Model suggestions still require human review; successful inference does not prove diagnostic accuracy.

A second real check through the hosted browser workflow returned 4,691 total tokens. It correctly separated the passing $49/$51 cases from the failing $50 acceptance test, suggested inspecting `>` versus `>=`, and preserved the existing tests. Both hosted requests retained their full 25-cent reservations; with the migrated development allowance, tester reservations totaled $1.75 and judge reservations remained $0.

Automated verification at deployment: 50 Python tests, 34 frontend unit tests, 18 browser tests, and 7 Cloudflare runtime/storage integration tests passed. The Cloudflare checks exercise real local Durable Object persistence, concurrent admission, duplicate requests, provider errors, invalid citations, clipping, revocation, redaction, body limits, tester budget exhaustion, protected judge allowance, and recovery from an interrupted analysis using a synthetic provider.

## Still blocked or unverified

- Nebius sandbox access request was submitted by the owner. The latest read-only image-list probe with the configured project returned 403 (insufficient permissions). No approval has arrived and no live sandbox operation has been run.
- The Cloudflare adapter deliberately returns 503 for fresh coding runs. Connecting the runner, testing cancellation/isolation/cleanup, and recording both genuine coding outcomes remain required after provisioning.
- No three-user usability study or final Devpost/video submission has been completed by this deployment check.
- Supplier invoice totals and service availability through December 15 require ongoing owner review. No Cloudflare plan upgrade was performed.

See [Cloudflare operation and recovery](../cloudflare/README.md) and [the remaining sandbox gate](deployment.md).
