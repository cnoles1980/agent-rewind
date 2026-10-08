# Nebius / NVIDIA technology feedback — draft for submission

Agent Rewind uses NVIDIA Nemotron 3.5 Lightning through Nebius Token Factory to interpret a user-reviewed excerpt of a recorded agent run. The rest of the hosted application runs on Cloudflare. Model credentials stay server-side; the model has no tools and does not apply repairs.

**What worked:** the hosted API integrated into a bounded request/response workflow. Model/provider identification and reported usage support inspection and accounting. For a complete shipping-boundary example, the real rehearsal response explained why `subtotal > 50` charges shipping at exactly $50 despite the stated inclusive requirement, then suggested verifying the implementation and rerunning that acceptance test. Its references returned users to the original evidence, and the completed response survived browser reload in the local archive.

**What needs improvement:** structured output success and diagnostic correctness are separate. Earlier evaluation found unsupported causal claims and premature advice in schema-valid reports. In the latest bounded check, missing-requirement, conflicting-requirement and hostile-log controls each returned incomplete responses after about 33–34 seconds. Those short inputs still did not yield complete structured answers within our 8,192-token completion ceiling. We cannot establish the internal cause from the app response alone. The app surfaced failures and retained budget reservations; it did not silently retry.

**Useful improvements:** clearer guidance for predictable reasoning/output budgets with structured responses; examples that preserve uncertainty when evidence conflicts; and provider diagnostics that distinguish output-budget exhaustion, timeout and schema issues without exposing sensitive request content. A model should ask which requirement is authoritative rather than infer one or propose weakening tests.

**Sandbox feedback:** beta access was approved and read-only image access worked. We did not establish execution pricing or verify runtime isolation/cancellation/cleanup, so the sandbox experiment is deferred from this submission. Account-specific beta pricing and practical lifecycle examples would help evaluate this integration responsibly.

These observations come from small, selected cases. They are product integration feedback, not a general model benchmark. See the [October 7 report evaluation](../report-quality-2026-10-07.md) and [submission rehearsal](verification-2026-10-07.md).
