# Security and capture boundaries

This is a prototype for invited, bounded execution. It is not a public arbitrary-code service or a production multi-tenant telemetry backend.

- Imported personal tapes are parsed, redacted and stored in IndexedDB. No telemetry or third-party fonts/scripts are loaded. Do not serve this application alongside untrusted scripts on the same origin.
- The Python recorder redacts before writing. It excludes known credential fields, authorization/cookie values, encrypted reasoning payloads, configured secrets and sensitive keys. It cannot discover every private business detail, so sharing requires review.
- Context means captured messages/tool definitions and explicit application state. Missing context and timing are unknown. Imported Codex summaries do not imply access to hidden reasoning or full requests.
- Request size limits apply before JSON parsing (100 MB local tapes, 10,000 events, 2 MB hosted clips). API mutation bodies other than clips are capped at 8 KB. Hosted clip storage has a 128 MB global ceiling.
- Session cookies are HttpOnly, SameSite=Strict, expiring, and Secure on HTTPS. Invitation tokens have high entropy and are stored as hashes. Mutation routes require the exact configured Origin. Job access is session-owned. Rate limits and reservations are transactional in SQLite.
- Clips are unlisted, not authenticated for readers. Their management credential is separate from the viewing token. Revocation removes the hosted content, not copies already downloaded. Export or otherwise preserve management credentials before clearing browser storage if ongoing revocation matters.
- The server API holds the inference key. Generated code is constrained by an AST allowlist to a tiny shipping function, then executed only in a disposable remote VM. No imports, calls, filesystem access, networking, credentials, or personal repositories are provided. The acceptance harness is constructed server-side and never an editable tool target.
- Browser rendering uses React text nodes; no raw HTML rendering, `eval`, or executable imported content is supported. A restrictive production CSP blocks external scripts, objects, framing, and off-origin connections.
- Live requests have an eight-model-call limit and five-minute deadline. Sandbox operations have a separate remote 20-second limit. No automatic retry follows ambiguous execution/patch failures. Operation IDs are persisted for cancellation/restart recovery.

## Residual risks to verify before public release

1. Nebius beta behavior, image isolation, remote cancellation, billing and quotas need a real-account check. SDK contract doubles cannot establish those facts.
2. Login rate limiting sees the network peer supplied by the hosting proxy. Validate Render's proxy behavior with separate browsers/networks; do not blindly trust arbitrary forwarded-IP headers.
3. A 1 GB disk and single process are deliberately small. Monitor storage, host costs and provider usage. Tapes remain on the server for the submitted deployment period; define retention and deletion policy before expanding usage.
4. Local session formats may change. Unsupported representations are reported rather than reconstructed. The importer prioritizes raw tool calls over potentially duplicate UI tool wrappers; that can omit an unmatched UI-only event and is reported.
5. Comparison uses ordered tool alignment and ordinal context comparisons. Repeated similar calls can make alignment ambiguous; the paired evidence remains available for human inspection. Timing drift and declared volatile metadata are ignored, not business identifiers.
6. The UI is designed primarily for desktop investigation; narrow screens retain a horizontally scrollable timeline and stacked inspector. A three-person comprehension study is still required.
