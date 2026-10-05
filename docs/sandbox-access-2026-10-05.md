# Nebius sandbox access — October 5, 2026

**Access confirmed. Execution not yet verified.** The existing dedicated key and configured project now successfully list images, replacing the prior Forbidden result. Corey also supplied Nebius's activation email.

## Verified without execution

- The recommended `python:3.12-slim` image is available as UUID `4fa16c8f-62a9-35a4-a4ea-07b7e8cd44ae`.
- Its `/usr/local/bin` directory includes `python` → `python3` → `python3.12`. This establishes file presence, not a successful runtime check.
- The installed generated client exposes disposable operations, networking controls, deadlines, cancellation and output limits. The existing adapter uses these controls, but their behavior still needs a live check.
- No container was spawned, image imported, personal file uploaded, model invoked, or account setting changed during this access check.

Repeat the read-only check from the repository root:

```text
uv run python scripts/probe_sandbox.py
```

It reads existing local credentials, reports no credentials/project identifiers, and saves a small report under ignored `.local/`. A successful exit confirms access and the Python entry's presence only.

## Remaining price question

The activation email does not state a price or promise free use. The account's Billing → Prices search for `sandbox` returned no prices, and the public overview does not publish a rate. Absence of a price is not evidence that execution is free. No pricing-verification flag has been enabled.

Suggested owner reply to the activation email (not sent):

> Thanks—access is working. Before we enable a small hackathon demo, could you confirm whether Sandboxes are free during beta? If billed, what are the rates, minimum charges, and charges for failed/cancelled disposable operations? Is image storage or network traffic billed separately, and is a spending cap available? We plan one operation at a time with a 20-second execution deadline.

## Next execution checks

Once costs can be bounded within the existing budget: pin the image, run a disposable synthetic Python smoke test, verify no network/inherited credentials, check fresh filesystem state and no retained checkpoint, exercise cancellation and deadline cleanup, then run stale/corrected fixture acceptance tests. Follow with real Nemotron coding runs and hosted authorization, reservation, cancellation and restart-recovery checks. Preserve honest outcomes and the existing judge reserve. Do not enable hosted launches based only on image-list access.

References: [Nebius overview](https://docs.tokenfactory.nebius.com/sandboxes/overview), [spawn API](https://docs.tokenfactory.nebius.com/api-reference/sandboxes/instances/spawn-a-new-container-instance), and the installed `contree-client==0.2.2` contract. The account price screen and original approval message are private evidence; neither is published here.
