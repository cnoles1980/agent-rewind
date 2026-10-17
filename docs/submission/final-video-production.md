# Narrated submission video — October 17, 2026

Corey's original iPhone recording was preserved. The finished edit is 160 seconds (2:40), 1920 × 1080, with natural-speed narration and no music or synthetic voice. Generated media remains local, outside the public repository. Nothing has been uploaded to YouTube or submitted to Devpost.

## Delivery

Use `Downloads/Agent-Rewind-Submission-Video/Agent-Rewind-Submission-Captioned-1080p.mp4` for a version with always-visible captions in a dedicated band. The app image is fitted above that band so captions do not cover controls, evidence, or provenance labels.

`Agent-Rewind-Submission-1080p.mp4` preserves the full-size picture and includes a selectable English subtitle track. `Agent-Rewind-Captions.srt` is provided for uploading captions separately to YouTube. Do not enable duplicate captions over the burned-in version. The delivery also contains cleaned narration, the short purpose excerpt and an editable local source bundle.

## Editorial choices

- Removed the two false starts before the final analysis-preview read, opening handling noise, unused recording directions and unused purpose-statement retakes.
- Inserted a 13-second purpose card after the hook using Corey's recorded explanation about helping individual builders investigate problems and bring useful suggestions back to their agent.
- Omitted the broader claim that individual-agent alternatives do not exist. The edit presents an intended audience and use case, not an unsupported market-exclusivity claim.
- Removed the misspoken “five-dollar change” clause. The failed-check footage still shows the expected zero and actual five-dollar shipping charge.
- Trimmed visual pauses and retimed the policy/code/test and handoff inspection shots to the narration. The voice is not sped up. Screen interactions are an edited demonstration, not a claim of continuous real-time execution.
- Replaced draft captions with phrase-level captions aligned to the recorded speech, using two local speech-recognition passes and reviewed phrase breaks. Normalized punctuation and product-name capitalization.
- Preserved illustrative/synthetic labels, the saved real Nemotron response label, and the distinction between a suggested check and an executed repair. No native Codex paste or sandbox execution was added.

## Picture order

| Time | Content |
|---|---|
| 0:00–0:04 | Opening |
| 0:04–0:17 | Why I built it |
| 0:17–0:39 | Local Codex import |
| 0:39–0:51 | Replay |
| 0:51–1:15 | Policy, code and failed test |
| 1:15–1:29 | Reviewed analysis excerpt |
| 1:29–1:50 | Saved real Nemotron report |
| 1:50–2:00 | Source verification |
| 2:00–2:18 | Archive, Copy and Download |
| 2:18–2:32 | Comparison |
| 2:32–2:40 | Closing |

## Processing and verification

Processing was local: FFmpeg, Pillow, NumPy and local Whisper models. No recording was uploaded to a transcription/enhancement service, and no paid inference or sandbox call was made. Temporary transcription dependencies live in the uv cache, not the application dependency files.

The audio uses a 75 Hz high-pass filter, gentle 6 dB noise reduction, mild compression, short cut fades and two-pass loudness normalization. The final AAC track measures approximately **−16.02 LUFS integrated**, **−1.47 dBTP true peak**, and **3.3 LU loudness range**. This is conservative cleanup, not a claim that all room sound has been removed.

Full-file decoding passed; FFprobe confirms a 160-second container with H.264 1080p video and 48 kHz AAC narration. The captioned picture is 4,799 frames; its final frame ends 33 milliseconds before the audio container, after the closing words. Caption cues are ordered, non-overlapping, within the video, and at most two lines. Reviewed full-size frames cover the purpose card, failed test, saved report and closing. A fresh transcription of the edited narration verifies removal of the analysis restarts and unwanted clause. Corey should watch/listen once before publishing to confirm the personal edit and voice treatment.

The [official rules](https://nebiusglobalaihackathon.devpost.com/rules), checked October 17, call for a video under three minutes showing the project functioning and publicly visible on YouTube. This local edit is below that duration; publication and the broader submission checklist remain separate steps.

## Reproduction

`scripts/finish_promo_voiceover.py --audio <original-recording.m4a>` reads the reviewed picture sources and local timestamp transcripts, builds a sample-aligned narration timeline, generates captions from [the final narration](final-narration.txt), and exports both videos. Requires Python with NumPy/Pillow and FFmpeg on PATH. It reads only the supplied recording and local production inputs; it does not access credentials, run agent tools or contact a service. It replaces generated files in `.local/promo-voiceover` while preserving the original recording.

The editable local bundle contains the previous picture sources, the original audio, local timestamp transcripts, edit decisions, aligned words, scripts, logo, caption files and production notes. That bundle is for local editing and is not published in Git. Keep original media out of the public source repository.
