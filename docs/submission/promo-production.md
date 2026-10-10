# Prepared promo · October 10, 2026

## Deliverable

Silent 2:40 H.264 MP4, 1920 × 1080 at 30 fps, prepared for Corey's later voiceover. The edit combines a nine-second capture of actual timeline playback with still app captures, close-ups, explanatory text and title cards. It is an edited walkthrough, not a continuous screen recording. No inference requests or public clip publications were made during filming.

The matching narration is [promo-voiceover.md](promo-voiceover.md). This supersedes the earlier manual screen-recording steps for this prepared cut. The original [video script](video-script.md) remains an alternative for a fresh live-request recording.

Local output is in `.local/promo-video/`; a delivery copy is in the user's Downloads/Agent-Rewind-Promo folder. Large media and raw capture files are deliberately excluded from Git. The public repository contains the renderer and narration, not private access instructions.

## Shot list

| Time | Shot | Evidence/provenance |
|---|---|---|
| 0:00–0:06 | Opening title | App's existing AR logo |
| 0:06–0:15 | Moving timeline | Actual playback of illustrative fixture, captured through browser tools |
| 0:15–0:25 | Policy | Stale illustrative policy at 00:22 |
| 0:25–0:34 | Code difference | Illustrative patch at 00:44 |
| 0:34–0:43 | Boundary test | Illustrative acceptance result at 01:20 |
| 0:43–0:54 | Review excerpt | Real app dialog; no Send click or inference |
| 0:54–1:03 | Saved Nemotron response | Successful real Nebius request from October 7 |
| 1:03–1:18 | Explanation | Actual saved response, unmodified |
| 1:18–1:35 | Proposed verification | Actual saved suggestion, not an executed fix |
| 1:35–1:45 | Archive | Real browser-local saved report |
| 1:45–1:54 | Handoff | Actual copy/download controls |
| 1:54–2:04 | Comparison | Two illustrative fixture policy responses |
| 2:04–2:14 | Clip preview | Range 18–81 seconds; no publication |
| 2:14–2:22 | Sources | Real Codex instructions |
| 2:22–2:31 | Imported sample | Public `tests/fixtures/codex-sanitized.jsonl`, labeled synthetic |
| 2:31–2:40 | Closing card | Public app and GitHub URLs |

## Re-render locally

The renderer uses the reviewed local input files; it does not read credentials, automate a browser or call a model. A fresh clone does not include these media inputs. Preserve the local project bundle for later edits.

Prerequisites: Python with Pillow, FFmpeg on PATH, and Windows Segoe UI fonts. These are production-tool prerequisites, not new application runtime dependencies.

```powershell
python scripts/render_promo.py --stills-only
python scripts/render_promo.py
```

Inputs: `.local/promo-video/captures/*.jpg`, `.local/promo-video/playback/*.jpg`, `playback/timing.json`, and `web/src/assets/ar-logo.png`. Output: `Agent-Rewind-Promo-Silent-1080p.mp4`, individual scene MP4s, storyboard and frames. The output directory is fixed to this repository's ignored `.local` directory. Re-rendering replaces generated media there.

Shot duration and framing live in `SCENES` in the renderer. Source screenshots are cropped/resized for camera framing; their displayed values are not rewritten. Actual playback frame timestamps determine motion timing. Encoding uses two workers with four FFmpeg threads each.

## Verification of the silent export

- FFprobe reports exactly 160.000 seconds, 1920 × 1080, 30 fps, H.264; there is intentionally no audio stream. File size is approximately 3.7 MB (decimal).
- FFmpeg decoded the entire exported video without reporting errors. The storyboard and sampled exported frames were visually reviewed for framing and legibility; the saved explanation and proposed check were also inspected at full size.
- Captures contain the illustrative examples, public synthetic import fixture and existing saved response. No invitation codes, provider credentials, personal recordings or private file pickers are shown.
- The renderer passed Python compilation and the repository's Ruff lint/format checks. Application code, runtime dependencies and deployment were not changed.
- The delivery includes a 314-word read-aloud script, draft SRT timing, storyboard and ZIP of individual scene MP4s, reviewed source captures and rendering code. No recorded user voice is included yet.

## Before publication

Add and review the user's actual voiceover; optionally insert the user's camera footage. Retime the subtitle guide to the final voice. No video or Devpost entry has been published by this production step. Registration/eligibility, organizer access clarification, final judge rehearsal and submission publication remain in the existing checklist.
