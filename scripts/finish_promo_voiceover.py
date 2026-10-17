"""Finish the reviewed October narration locally; no network or model calls.

Pass the original recording with --audio. Word transcripts from local Whisper
belong in .local/promo-voiceover; original media is never included in Git.
Requires NumPy, Pillow and FFmpeg. All times below are seconds.
"""

import argparse
import json
from pathlib import Path
import re
import subprocess
import textwrap
import wave

import numpy as np
from PIL import Image, ImageDraw

from render_promo import BG, CYAN, INK, MUTED, ROOT, font

WORK = ROOT / ".local/promo-voiceover"
PICTURE = ROOT / ".local/promo-video-v2"
RATE = 48000
# Name, original picture segment, duration, (source in, source out, local start).
# Discard the false analysis starts and the misspoken "five-dollar change" clause.
SCENES = [
    ("Opening", 0, 4, [(2.85, 5.60, 0.55)]),
    ("Why I built it", None, 13, [(176.75, 188.74, 0.45)]),
    ("Open a Codex log", 1, 22, [(5.98, 26.43, 0.65)]),
    ("Replay", 2, 12, [(27.02, 38.71, 0.12)]),
    (
        "Follow the evidence",
        3,
        24,
        [(39.27, 45.18, 0.50), (45.27, 48.94, 6.55), (49.08, 55.72, 10.40), (58.15, 62.63, 17.60)],
    ),
    ("Review the excerpt", 4, 14, [(79.27, 91.91, 0.80)]),
    ("Saved Nemotron result", 5, 21, [(92.80, 112.55, 0.80)]),
    ("Verify the source", 6, 10, [(113.03, 121.65, 0.45)]),
    ("Reopen and hand off", 7, 18, [(122.10, 137.65, 1.00)]),
    ("Compare", 8, 14, [(138.24, 150.00, 0.65)]),
    ("Closing", 9, 8, [(150.30, 158.03, 0.10)]),
]


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-4000:])
    return result


def wav(path, samples):
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())


def stamp(seconds):
    ms = round(seconds * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def captions(words, duration):
    # Reviewed phrase boundaries avoid orphaned words and awkward mid-clause cuts.
    phrases = (ROOT / "docs/submission/final-narration.txt").read_text(encoding="utf-8").splitlines()
    groups, position = [], 0
    for phrase in filter(str.strip, phrases):
        tokens = phrase.split()
        group = words[position : position + len(tokens)]
        expected = [re.sub(r"[^a-z0-9]", "", token.lower()) for token in tokens]
        actual = [re.sub(r"[^a-z0-9]", "", word["word"].lower()) for word in group]
        assert expected == actual, (phrase, actual)
        groups.append((group, phrase))
        position += len(tokens)
    assert position == len(words), "All spoken words must be captioned."
    cues = []
    for index, (group, content) in enumerate(groups):
        start = max(0, group[0]["start"] - 0.08)
        next_start = groups[index + 1][0][0]["start"] - 0.10 if index + 1 < len(groups) else duration
        end = min(next_start, duration, group[-1]["end"] + 0.18)
        lines = textwrap.wrap(content, width=40, break_long_words=False)
        assert 0 <= start < end <= duration and len(lines) <= 2, content
        cues.append((start, end, "\n".join(lines)))
    return cues


def write_srt(path, cues):
    path.write_text(
        "\n\n".join(
            f"{i + 1}\n{stamp(start)} --> {stamp(end)}\n{text}" for i, (start, end, text) in enumerate(cues)
        )
        + "\n",
        encoding="utf-8",
    )


def why_card():
    image = Image.new("RGB", (1920, 1080), BG)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1920, 9), fill=CYAN)
    draw.text((100, 80), "WHY I BUILT AGENT REWIND", font=font(28, True), fill=CYAN)
    draw.multiline_text((100, 250), "For individual\nbuilders.", font=font(100, True), fill=INK, spacing=5)
    draw.multiline_text(
        (108, 550),
        "See the problem.\nTake the evidence back to your agent.",
        font=font(40),
        fill=MUTED,
        spacing=22,
    )
    logo = Image.open(ROOT / "web/src/assets/ar-logo.png").convert("RGBA")
    logo.thumbnail((760, 760), Image.Resampling.LANCZOS)
    image.paste(logo, (1030, 160), logo)
    draw.text((108, 970), "A personal debugger for recorded agent runs", font=font(27), fill=MUTED)
    image.save(WORK / "why-card.png")


def render_pictures():
    why_card()
    clips = WORK / "picture"
    clips.mkdir(exist_ok=True)
    for index, (_, source, duration, _) in enumerate(SCENES):
        inputs = (
            ["-loop", "1", "-i", str(WORK / "why-card.png")]
            if source is None
            else ["-i", str(PICTURE / "segments" / f"{source:02d}.mp4")]
        )
        filters = []
        if source == 3:
            # Shorten inspection pauses so each piece of evidence matches speech.
            mapping = [(0, 9.8, 6.5), (9.8, 19.8, 4), (19.8, 30, 13.5)]
        elif source == 7:
            mapping = [(0, 6.27, 5), (6.27, 14.43, 3.5), (14.43, 18.54, 2), (18.54, 22, 7.5)]
        else:
            mapping = []
        if mapping:
            parts = []
            for j, (start, end, target) in enumerate(mapping):
                parts.append(
                    f"[0:v]trim=start={start}:end={end},setpts=(PTS-STARTPTS)*{target / (end - start)}[p{j}]"
                )
            parts.append(
                "".join(f"[p{j}]" for j in range(len(mapping))) + f"concat=n={len(mapping)}:v=1:a=0,fps=30[v]"
            )
            filters = ["-filter_complex", ";".join(parts), "-map", "[v]"]
        elif source is None:
            filters = [
                "-vf",
                f"fps=30,fade=t=in:st=0:d=0.12:color={BG},fade=t=out:st=12.88:d=0.12:color={BG}",
            ]
        original_duration = [4, 22, 12, 30, 16, 22, 10, 22, 14, 8][source] if source is not None else None
        encoding = (
            ["-c:v", "copy"]
            if source is not None and not mapping and duration == original_duration
            else ["-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", "-threads", "4"]
        )
        run(
            [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                *inputs,
                *filters,
                "-an",
                "-t",
                str(duration),
                *encoding,
                str(clips / f"{index:02d}.mp4"),
            ]
        )
    concat = WORK / "picture.txt"
    concat.write_text("\n".join(f"file 'picture/{i:02d}.mp4'" for i in range(len(SCENES))), encoding="utf-8")
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat),
            "-c",
            "copy",
            str(WORK / "picture-silent.mp4"),
        ]
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audio", type=Path, required=True)
    args = parser.parse_args()
    if not args.audio.is_file():
        parser.error("The original recording file is required.")
    WORK.mkdir(parents=True, exist_ok=True)
    data = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", str(args.audio), "-f", "f32le", "-ar", str(RATE), "-ac", "1", "-"]
    )
    original = np.frombuffer(data, dtype=np.float32)
    transcript = json.loads((WORK / "transcript-small.json").read_text(encoding="utf-8"))
    base = json.loads((WORK / "transcript.json").read_text(encoding="utf-8"))
    words = [
        word
        for segment in transcript
        for word in segment["words"]
        if not (77 <= word["start"] < 92 or 176 <= word["start"] < 189)
    ]
    for word in words:
        if word["word"].strip() == "So" and 57 < word["start"] < 59:
            word["start"] = 58.29
    for segment in base:
        for word in segment["words"]:
            if 77.39 <= word["start"] < 92 or 176 <= word["start"] < 189:
                word = dict(word)
                if word["word"].strip() == "I" and word["start"] < 79:
                    word["start"] = 79.39
                words.append(word)
    words.sort(key=lambda word: word["start"])
    total = sum(scene[2] for scene in SCENES)
    narration = np.zeros(round(total * RATE), dtype=np.float32)
    mapped, edits, offset = [], [], 0
    for name, _, duration, takes in SCENES:
        for start, end, local in takes:
            assert 0 <= start < end <= len(original) / RATE
            assert local + end - start <= duration + 0.001, name
            clip = original[round(start * RATE) : round(end * RATE)].copy()
            fade = round(0.012 * RATE)
            clip[:fade] *= np.linspace(0, 1, fade)
            clip[-fade:] *= np.linspace(1, 0, fade)
            target = round((offset + local) * RATE)
            narration[target : target + len(clip)] = clip
            edits.append(
                {"scene": name, "source_in": start, "source_out": end, "timeline_in": offset + local}
            )
            for word in words:
                if start <= (word["start"] + word["end"]) / 2 < end:
                    mapped.append(
                        {
                            "word": word["word"],
                            "start": offset + local + max(start, word["start"]) - start,
                            "end": offset + local + min(end, word["end"]) - start,
                        }
                    )
        offset += duration
    wav(WORK / "narration-edited.wav", narration)
    chain = "highpass=f=75,afftdn=nr=6:nf=-45,acompressor=threshold=0.1:ratio=2:attack=15:release=150"
    first = run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(WORK / "narration-edited.wav"),
            "-af",
            chain + ",loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json",
            "-f",
            "null",
            "-",
        ]
    )
    stats, _ = json.JSONDecoder().raw_decode(first.stderr[first.stderr.rfind("{") :])
    (WORK / "loudness-first-pass.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    normalizer = (
        f"loudnorm=I=-16:TP=-1.5:LRA=7:measured_I={stats['input_i']}:"
        f"measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:"
        f"measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(WORK / "narration-edited.wav"),
            "-af",
            chain + "," + normalizer,
            "-ar",
            str(RATE),
            "-c:a",
            "pcm_s24le",
            str(WORK / "Narration-cleaned.wav"),
        ]
    )
    cues = captions(mapped, total)
    write_srt(WORK / "Agent-Rewind-Captions.srt", cues)
    ass = (
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        "Style: Default,Segoe UI,38,&H00FFFFFF,&H00FFFFFF,&H00101F29,&H00101F29,0,0,0,0,100,100,0,0,1,0,0,2,100,100,28,1\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    for start, end, content in cues:
        begin = stamp(start)[1:-1].replace(",", ".")
        finish = stamp(end)[1:-1].replace(",", ".")
        content = content.replace("\n", r"\N")
        ass += f"Dialogue: 0,{begin},{finish},Default,,0,0,0,,{content}\n"
    (WORK / "Agent-Rewind-Captions.ass").write_text(ass, encoding="utf-8")
    (WORK / "edit-decisions.json").write_text(json.dumps(edits, indent=2), encoding="utf-8")
    (WORK / "aligned-words.json").write_text(json.dumps(mapped, indent=2), encoding="utf-8")
    render_pictures()
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(WORK / "picture-silent.mp4"),
            "-i",
            str(WORK / "Narration-cleaned.wav"),
            "-i",
            str(WORK / "Agent-Rewind-Captions.srt"),
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-map",
            "2:s",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-c:s",
            "mov_text",
            "-metadata:s:s:0",
            "language=eng",
            "-movflags",
            "+faststart",
            "-t",
            str(total),
            str(WORK / "Agent-Rewind-Submission-1080p.mp4"),
        ]
    )
    # A dedicated subtitle band preserves the app's provenance labels and controls.
    video_filter = "scale=1664:936,pad=1920:1080:128:0:color=0x101f29,ass='Agent-Rewind-Captions.ass'"
    command = [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        "Agent-Rewind-Submission-1080p.mp4",
        "-map",
        "0:v",
        "-map",
        "0:a",
        "-vf",
        video_filter,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "19",
        "-threads",
        "6",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        "Agent-Rewind-Submission-Captioned-1080p.mp4",
    ]
    result = subprocess.run(command, cwd=WORK, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-4000:])
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-ss",
            "4",
            "-i",
            str(WORK / "Narration-cleaned.wav"),
            "-t",
            "13",
            "-c:a",
            "pcm_s24le",
            str(WORK / "Why-I-built-it-cleaned.wav"),
        ]
    )
    print(f"Finished {total}s narrated video, captions and cleaned audio.")


if __name__ == "__main__":
    main()
