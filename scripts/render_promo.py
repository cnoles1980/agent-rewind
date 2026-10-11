"""Render the reviewed local promo captures; never captures UI or calls an API.

Requires Pillow and ffmpeg on PATH. Raw captures and output stay in .local.
Run from any directory: python scripts/render_promo.py [--stills-only]
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".local" / "promo-video"
SIZE = (1920, 1080)
BG = "#f5f8fa"
INK = "#101f29"
MUTED = "#526672"
CYAN = "#009ab8"
FONT_DIR = Path("C:/Windows/Fonts")

# Crops are camera framing only: source pixels/content are never rewritten.
SCENES = [
    (
        6,
        "OPEN",
        "Agent Rewind",
        "Understand your\nagent's mistakes.",
        "Record. Replay. Understand.",
        None,
        None,
        "hero",
    ),
    (
        9,
        "01 / FIND",
        "Find the moment\nthat matters.",
        "Turn a long agent history into\na timeline you can investigate.",
        "Actual playback • Illustrative example",
        "02-policy.jpg",
        None,
        "wide",
    ),
    (
        10,
        "02 / INSPECT",
        "One word.\nA different rule.",
        "The requirement: $50 or more.\nThe returned policy: strictly above $50.",
        "Illustrative checkout example • Recorded policy",
        "02-policy.jpg",
        (875, 70, 1210, 625),
        "detail",
    ),
    (
        9,
        "02 / INSPECT",
        "Follow the evidence\ninto the code.",
        "The recorded edit uses > 50.\nExactly $50 is excluded.",
        "Illustrative checkout example • Recorded code change",
        "03-code.jpg",
        (875, 72, 1215, 450),
        "detail",
    ),
    (
        9,
        "02 / INSPECT",
        "The boundary\nreveals the problem.",
        "Subtotal: $50\nExpected shipping: $0\nRecorded shipping: $5",
        "Illustrative checkout example • Captured test result",
        "04-test.jpg",
        (875, 80, 1205, 368),
        "detail",
    ),
    (
        11,
        "03 / UNDERSTAND",
        "Ask a clear question.\nReview the evidence.",
        "Choose the failure.\nState what you expected.\nReview the excerpt before sending.",
        "Analysis request preview • No request sent in this shot",
        "05-review.jpg",
        (334, 43, 918, 670),
        "report",
    ),
    (
        9,
        "03 / UNDERSTAND",
        "Real Nemotron.\nSaved for review.",
        "NVIDIA Nemotron 3.5 Lightning\nthrough Nebius Token Factory.\n\nA result from our successful rehearsal.",
        "Previously captured Nemotron analysis • October 7, 2026",
        "06-saved-report.jpg",
        (334, 43, 918, 650),
        "report",
    ),
    (
        15,
        "03 / UNDERSTAND",
        "An explanation\nyou can act on.",
        "Greater than 50 excludes 50.\nThe code follows the stale policy;\nthe test follows the requirement.",
        "Previously captured Nemotron analysis • Interpretation to verify",
        "07-explanation.jpg",
        (344, 67, 895, 409),
        "report",
    ),
    (
        17,
        "03 / VERIFY",
        "Check the suggestion.\nKeep the requirement.",
        "Verify the current implementation.\nCheck the inclusive boundary.\nRe-run the $50 acceptance test.",
        "Suggested next step • No fix or test executed by analysis",
        "07-explanation.jpg",
        (345, 275, 895, 405),
        "report",
    ),
    (
        10,
        "04 / KEEP",
        "Keep the report\nwith the recording.",
        "Reopen it in Saved reports.\nThe analyzed excerpt stays attached.\nNo new model call needed.",
        "Browser-local archive • Download a backup",
        "06-saved-report.jpg",
        (334, 43, 918, 440),
        "report",
    ),
    (
        9,
        "04 / HAND OFF",
        "Take the investigation\nback to your agent.",
        "Copy or download the explanation\nand its exact supporting evidence.\nAsk your agent to verify it.",
        "Reviewed handoff • Your agent checks the actual project",
        "07-explanation.jpg",
        (344, 443, 895, 615),
        "report",
    ),
    (
        10,
        "05 / COMPARE",
        "See what changed.",
        "Compare the two recorded policies.\nA difference points to evidence;\nit does not prove the cause.",
        "Two illustrative examples • Observed differences",
        "09-comparison.jpg",
        (260, 85, 1230, 540),
        "wide",
    ),
    (
        10,
        "05 / SHARE",
        "Share only\nthe useful part.",
        "Select a range.\nReview what is included.\nExport a clip or publish a link.",
        "Clip review • Nothing published during filming",
        "10-clip.jpg",
        (334, 43, 918, 670),
        "report",
    ),
    (
        8,
        "06 / IMPORT",
        "Bring your\nown recording.",
        "Open a Codex log locally.\nNo account connection is needed.\nReview capture limits after import.",
        "Local import • AI analysis is a separate action",
        "11-sources.jpg",
        (334, 43, 918, 635),
        "report",
    ),
    (
        9,
        "06 / IMPORT",
        "Know what\nwas captured.",
        "This synthetic sample shows\nthe importer and its limits.\nMissing context stays unknown.",
        "Synthetic Codex import sample • No upload",
        "12-import.jpg",
        (250, 90, 1230, 675),
        "wide",
    ),
    (
        9,
        "CLOSE",
        "Same agents.\nClearer stories.",
        "A personal debugger for\nunderstanding recorded agent runs.",
        "Public source • MIT license",
        None,
        None,
        "end",
    ),
]


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_DIR / ("segoeuib.ttf" if bold else "segoeui.ttf")), size)


def text(draw, xy, value, size, color=INK, bold=False, spacing=14):
    draw.multiline_text(xy, value, font=font(size, bold), fill=color, spacing=spacing)


def frame(index: int, playback: Path | None = None) -> Image.Image:
    _, chapter, title, body, label, source, crop, layout = SCENES[index]
    canvas = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 1920, 9), fill=CYAN)
    text(draw, (70, 48), "AGENT REWIND", 25, bold=True)
    text(draw, (1530, 48), "REPLAY / UNDERSTAND", 20, MUTED)
    draw.line((70, 101, 1850, 101), fill="#d5e2e8", width=2)

    if layout in {"hero", "end"}:
        logo = Image.open(ROOT / "web/src/assets/ar-logo.png").convert("RGBA")
        logo.thumbnail((760, 760), Image.Resampling.LANCZOS)
        canvas.paste(logo, (1030, 160), logo)
        text(draw, (110, 235), title, 96, bold=True, spacing=4)
        text(draw, (117, 485 if layout == "hero" else 555), body, 46, MUTED)
        if layout == "hero":
            text(draw, (118, 770), "A PERSONAL DEBUGGER FOR RECORDED AGENT RUNS", 26, CYAN, True)
        else:
            text(draw, (118, 777), "agent-rewind.cnoles1980.workers.dev", 34, CYAN, True)
            text(draw, (118, 842), "github.com/cnoles1980/agent-rewind", 30, MUTED)
    else:
        text(draw, (76, 153), chapter, 25, CYAN, True)
        title_size = 62 if layout != "wide" else 53
        text(draw, (76, 225), title, title_size, bold=True, spacing=9)
        text(draw, (80, 441), body, 31 if layout == "wide" else 34, MUTED, spacing=19)
        shot = Image.open(playback or OUT / "captures" / source).convert("RGB")
        if crop and playback is None:
            shot = shot.crop(crop)
        if layout == "wide":
            box = (640, 213, 1840, 925)
        elif layout == "detail":
            box = (1080, 170, 1780, 931)
        else:
            box = (978, 170, 1818, 933)
        left, top, right, bottom = box
        draw.rounded_rectangle((left - 12, top - 12, right + 12, bottom + 12), 19, fill="#dfe8ed")
        draw.rounded_rectangle(box, 13, fill="white")
        shot = ImageOps.contain(shot, (right - left - 28, bottom - top - 28), Image.Resampling.LANCZOS)
        canvas.paste(shot, (left + (right - left - shot.width) // 2, top + (bottom - top - shot.height) // 2))
        text(draw, (left + 18, bottom + 24), "CAPTURED FROM THE WORKING APP", 18, MUTED)

    draw.line((70, 988, 1850, 988), fill="#d5e2e8", width=2)
    text(draw, (76, 1013), label, 24, MUTED)
    text(draw, (1772, 1013), f"{index + 1:02d}/{len(SCENES):02d}", 23, MUTED)
    return canvas


def run(command: list[str]):
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def encode(index: int):
    duration = SCENES[index][0]
    clip = OUT / "segments" / f"{index:02d}.mp4"
    inputs = ["-loop", "1", "-i", str(OUT / "frames" / f"{index:02d}.png")]
    if index == 1:
        inputs = ["-f", "concat", "-safe", "0", "-i", str(OUT / "motion.txt")]
    run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            *inputs,
            "-t",
            str(duration),
            "-vf",
            f"fps=30,fade=t=in:st=0:d=0.18:color={BG},fade=t=out:st={duration - 0.18}:d=0.18:color={BG}",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "19",
            "-pix_fmt",
            "yuv420p",
            "-threads",
            "4",
            str(clip),
        ]
    )
    print(f"Rendered {index + 1}/{len(SCENES)}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stills-only", action="store_true")
    args = parser.parse_args()
    if not args.stills_only and not shutil.which("ffmpeg"):
        parser.error("Install ffmpeg and add it to PATH before rendering.")
    for folder in ("frames", "segments", "motion"):
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    for index in range(len(SCENES)):
        frame(index).save(OUT / "frames" / f"{index:02d}.png")
    sheet = Image.new("RGB", (1920, 1080), "white")
    for index in range(len(SCENES)):
        preview = Image.open(OUT / "frames" / f"{index:02d}.png")
        preview.thumbnail((480, 270))
        sheet.paste(preview, ((index % 4) * 480, (index // 4) * 270))
    sheet.save(OUT / "storyboard.jpg", quality=94)
    if args.stills_only:
        return

    timing = json.loads((OUT / "playback" / "timing.json").read_text())
    lines = []
    for index, item in enumerate(timing):
        image_path = OUT / "motion" / f"{index:04d}.png"
        frame(1, OUT / "playback" / item["file"]).save(image_path)
        next_ms = timing[index + 1]["ms"] if index + 1 < len(timing) else 9000
        lines.extend([f"file 'motion/{image_path.name}'", f"duration {(next_ms - item['ms']) / 1000:.6f}"])
    lines.append(f"file 'motion/{len(timing) - 1:04d}.png'")
    (OUT / "motion.txt").write_text("\n".join(lines), encoding="utf-8")
    with ThreadPoolExecutor(max_workers=2) as executor:
        list(executor.map(encode, range(len(SCENES))))
    (OUT / "concat.txt").write_text(
        "\n".join(f"file 'segments/{i:02d}.mp4'" for i in range(len(SCENES))), encoding="utf-8"
    )
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
            str(OUT / "concat.txt"),
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            str(OUT / "Agent-Rewind-Promo-Silent-1080p.mp4"),
        ]
    )
    print("Saved silent promo: " + str(OUT / "Agent-Rewind-Promo-Silent-1080p.mp4"))


if __name__ == "__main__":
    main()
