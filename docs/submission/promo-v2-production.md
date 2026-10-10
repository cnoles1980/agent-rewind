# Screen-led demo · version 2

Prepared October 10, 2026 in response to Corey's request for more actual interaction footage, easy Codex import and a report handoff.

## Creative direction

Use a short, understandable problem and a demonstrable resolution. The memorable moment is the $50 boundary mismatch becoming clear, followed by a source-linked report the user can take back to their agent. More product evidence matters more here than visual spectacle.

Devpost's [presentation guidance](https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo) recommends briefly establishing the problem, demonstrating the working project and showing its resolution. Its [video tips from participants, including multiple-time winners](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video) emphasize scripting, actual inputs/outputs and showing the product rather than spending the video on slides.

A concrete winner reference is [Gemini Movie Detectives](https://devpost.com/software/gemini-movie-detectives), whose submission includes an embedded demo. Devpost identifies its creator as the [Google AI Hackathon second-place winner](https://info.devpost.com/blog/user-story-volker). This is a reference to explore, not evidence that its video style caused the win; the full video was not reviewed frame by frame for this production.

## Delivered edit

`Agent-Rewind-Demo-v2-Silent-1080p.mp4`: 160 seconds, 1920 × 1080, 30 fps H.264 output. Audio is intentionally absent pending Corey's narration. The first cut remains available separately.

There are **148 seconds of actual browser interaction capture** and **12 seconds of title/end cards**. Captures preserve their measured timing, apart from trimming the final fractions of a second at take boundaries. Screenshots were sampled about seven times per second and encoded at 30 fps; the result is not a native 30 fps screen recording. Editorial close-ups crop/resize actual captured pixels without rewriting their contents. Brief fades separate the takes.

| Time | Actual footage |
|---|---|
| 0:00–0:04 | Opening card |
| 0:04–0:26 | Settings → Codex → select synthetic session JSONL → local import → capture limits → tool result |
| 0:26–0:38 | Play/pause the illustrative checkout run |
| 0:38–1:08 | Select policy, recorded code Diff, then failed boundary check |
| 1:08–1:24 | Open analysis, enter expectation, review excerpt; no Send click |
| 1:24–1:46 | Open and scroll the actual saved Nemotron report |
| 1:46–1:56 | Follow Source 3 to the failed assertion |
| 1:56–2:18 | Reopen archive, expand exact handoff, Copy, Download |
| 2:18–2:32 | Enable comparison and jump to first behavior difference |
| 2:32–2:40 | Closing card and public URLs |

The source chooser is a native dialog not present in browser screenshots; the film labels its omission. The browser performs the actual file selection/import. No personal session is used. The synthetic sample is `tests/fixtures/codex-sanitized.jsonl`.

## Optional Codex insert

An actual paste into the native Codex window is **not yet filmed**. The Computer Use skill's Windows guidance prohibits automation of the ChatGPT desktop interface, which is how that window is exposed. We did not substitute a mock interface or trigger another agent task. The delivered report and six-second manual recording directions in [the new voiceover script](promo-v2-voiceover.md) let Corey provide this optional insert alongside narration.

## Files and reproduction

Media lives in ignored `.local/promo-video-v2/` and the delivery folder `Downloads/Agent-Rewind-Promo-v2`. No video has been publicly uploaded. The rendered MP4, narration text, draft SRT, storyboard, report for Codex and editable media bundle are provided together.

```powershell
python scripts/render_promo_v2.py
```

Requires Python/Pillow, FFmpeg and Windows Segoe UI fonts. The renderer reuses the first-cut title-card functions in `scripts/render_promo.py`; both scripts and the AR logo belong in a reproducible bundle. It reads only the reviewed local frame directories and timing manifests, and writes generated media in `.local/promo-video-v2`. It never reads credentials, calls a model or automates a browser. Rendering replaces generated outputs in that directory.

The editable bundle includes individual segments in numeric order, the original capture frames with timing/action records, the actual handoff report, scripts and logo. Draft SRT timings need adjustment to the eventual voice recording. No additional application dependency, deployment or budget change is needed.

## Verification

FFprobe confirmed all ten segment durations sum to exactly 160 seconds and the final MP4 has the expected 1920 × 1080 H.264 video stream at 30 fps, with no audio. FFmpeg decoded the complete file without errors. The storyboard, representative full-size source/report frames and an exported boundary-test frame were visually reviewed. The video is approximately 5.7 MB; the editable bundle is about 73 MB.

The 340-word narration is aligned to the new order and accompanied by 30 draft subtitle cues. Frame manifests are ordered, their files exist, and each take records its real actions and timestamps. ZIP integrity passed. The renderer compiled and passed Ruff lint/format checks. No private log, invitation or provider key is included. No new paid inference, native Codex submission, sandbox execution, deployment or public video upload occurred.
