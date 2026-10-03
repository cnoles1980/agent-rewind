# Design QA

**Final result: pass for the adapted local desktop prototype.** This is visual/interaction QA, not a declaration that the live service is ready for submission.

## Comparison evidence and scope

- Source visual truth: `C:/Users/ullwo/Downloads/ChatGPT Image Oct 3, 2026, 02_14_54 PM.png`, 1448 × 1086 pixels.
- Implementation: `http://127.0.0.1:5173`, desktop CSS viewport 1448 × 1086.
- Saved implementation: `docs/screenshots/workspace.jpg`, 1433 × 1185 pixels (full page excluding the vertical scrollbar; no density enlargement).
- State: light workspace, selected stale-policy tool result at 00:22, inspector Event tab, comparison open, unauthenticated, clearly labeled illustrative recording.
- Source and implementation images were emitted together in the same comparison input twice, before and after visual fixes. The source includes a promotional poster around an app frame; the implementation is the app itself. Their outer framing and run content intentionally differ. The central player, sidebar, inspector, typography and comparison regions were inspected directly; no pixel-perfect whole-poster match is claimed.

## Findings fixed

- **P2: timeline shrank horizontally when height was capped.** The first implementation had unnecessary empty margins and smaller lane text. The corrected SVG uses a denser native coordinate layout rather than forcing a smaller rendered aspect ratio. The revised screenshot shows the lanes filling the available player width.
- **P2: comparison was pushed too far below the investigation view.** Bounded inspector scrolling and a compact, independently scrollable event list bring the A/B section directly below the timeline workspace. The revised full-page capture shows the complete comparison and its navigation.
- **P2: temporary AR text mark substituted for the supplied identity.** Replaced with a transparent raster asset derived from the supplied AR monogram through image generation. The revised header shows the angular black AR and cyan rewind accent. Corner alpha was verified as zero; no background box is visible.
- **P2: event-list actions lost button semantics.** Native buttons now sit inside list items. The live accessibility tree exposes the individual event actions as buttons; keyboard transport and the range input provide an accessible alternative to the SVG.

## Required fidelity surfaces

- **Fonts/typography:** local Inter for the UI and IBM Plex Mono for time/code match the reference's sans-serif/monospace roles. The source's exact font is not identified; weight and hierarchy are adapted. Code text was enlarged after inspection. No essential labels wrap over controls at the tested desktop or 390 px layout.
- **Spacing/layout:** the white workspace, restrained borders, narrow sidebar, top transport, shared playhead, right inspector and lower A/B region follow the source. The additional event list is required for accessible investigation. Poster copy and unused sidebar destinations are deliberately omitted.
- **Colors/tokens:** blue Model, mint Tools, purple Context, amber Memory, red Errors and gray Notes preserve the reference palette; selected events and playhead retain a blue accent. Empty lanes explain missing capture rather than fabricating activity.
- **Image quality:** the header uses the actual generated PNG asset, not CSS/text geometry or an embedded screenshot of the interface. It remains sharp at its small display size and has real alpha transparency. Standard action icons use Phosphor. The supplied full mockup is not shipped.
- **Copy/content:** Model replaces Reasoning; exposed provider reasoning is labeled within captured model data. Examples, capture gaps, unknown timing, review requirements, and observed differences are explicit. Real tests determine badges. The product avoids claiming inferred root causes or complete imported prompts.

## Interaction verification and remaining polish

Automated browser checks cover paired evidence, note creation/editing, search, local imports, clip review/export, invitation login, share/revoke, production CSP and narrow viewport overflow. Inspector content scrolls independently; the page may scroll vertically. The timeline deliberately scrolls horizontally on narrow screens while persistent controls remain visible.

P3 follow-up: tune small-label contrast and exact font weight with Corey during the first usability sessions. The final logo/asset rights and a real hosted/live run need owner review. No remaining P0/P1/P2 visual issue was identified in the reviewed desktop state; this does not replace the planned three-person comprehension test.


## Settings and source imports follow-up

Added Settings in both the sidebar and mobile-visible top bar. Source cards show support level, local file instructions, and an opening action above the longer guide. Factory is explicitly summary-only. Reports have an exact text preview, optional linked context, redaction, and a review-gated copy/download action. Checked the live browser at its normal viewport; mobile 390px automated checks pass with no horizontal overflow. Saved `docs/screenshots/settings-sources.jpg`. No changes to the logo or mockup-derived visual direction.
