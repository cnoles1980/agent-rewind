"""Assemble real browser interaction captures into the 2:40 silent demo.

Inputs are reviewed timestamped frames in .local/promo-video-v2. This offline
renderer makes no network requests and does not automate or modify the app.
Requires Pillow, FFmpeg, and the same Windows fonts as render_promo.py.
"""

from concurrent.futures import ThreadPoolExecutor
from itertools import pairwise
import json
import subprocess

from PIL import Image, ImageDraw, ImageOps

from render_promo import BG, CYAN, INK, MUTED, ROOT, font, frame as title_frame

OUT = ROOT / ".local/promo-video-v2"
# Duration, capture folder, screen heading, persistent provenance label.
SHOTS = [
    (4, None, "Agent Rewind", ""),
    (22, "08-import", "Open one Codex log", "Synthetic import sample • Local processing"),
    (12, "01-timeline", "Replay the recorded run", "Switch to the illustrative checkout example"),
    (30, "02-evidence", "Follow the evidence", "Illustrative checkout example • No tools re-executed"),
    (16, "03-review", "Review before AI analysis", "Request preview • No new request sent in this take"),
    (22, "04-report", "Understand the mismatch", "Previously captured real Nemotron analysis • October 7"),
    (10, "05-source-link", "Check the source", "Saved analysis → recorded evidence"),
    (
        22,
        "06-handoff",
        "Take the report back to your coding agent",
        "Actual copy and download • No repair executed",
    ),
    (14, "07-compare", "See what changed", "Two illustrative examples • Differences are not proof of cause"),
    (8, None, "Same agents. Clearer stories.", ""),
]


def focus(folder: str, seconds: float):
    """Editorial camera cuts preserve the pixels and values in the captured UI."""
    if folder == "02-evidence":
        if 3 <= seconds < 9.8:
            return (
                (875, 75, 1210, 625),
                "The policy says\nstrictly above $50.",
                "The requirement is\n$50 or more.",
            )
        if 12 <= seconds < 18.8:
            return (875, 75, 1215, 450), "The code follows\nthe stale policy.", "subtotal > 50"
        if seconds >= 23:
            return (875, 80, 1205, 368), "Exactly $50.\nThe wrong charge.", "Expected: $0\nRecorded: $5"
    if folder == "04-report" and seconds >= 9:
        return (
            (344, 67, 895, 409),
            "Now the mismatch\nis explicit.",
            "Verify the suggested change\nagainst the actual project.",
        )
    if folder == "06-handoff" and seconds >= 7:
        return (
            (334, 43, 918, 670),
            "Keep the explanation\nand its evidence.",
            "Copy or download.\nThen ask your agent to verify.",
        )
    if folder == "03-review" and seconds >= 2:
        return (
            (334, 43, 918, 670),
            "Choose the evidence.\nState the expectation.",
            "Review what leaves\nyour browser.",
        )
    return None


def compose(index: int, item: dict, timing: dict):
    _, folder, heading, provenance = SHOTS[index]
    seconds = item["ms"] / 1000
    source = Image.open(OUT / folder / item["file"]).convert("RGB")
    canvas = Image.new("RGB", (1920, 1080), BG)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 1920, 7), fill=CYAN)
    draw.text((60, 25), heading, font=font(32, True), fill=INK)
    draw.text((1595, 32), "AGENT REWIND", font=font(23, True), fill=MUTED)
    framing = focus(folder, seconds)
    if framing:
        crop, title, detail = framing
        source = source.crop(crop)
        box = (850, 90, 1850, 940)
        draw.multiline_text((80, 310), title, font=font(48, True), fill=INK, spacing=12)
        draw.multiline_text((83, 525), detail, font=font(31), fill=MUTED, spacing=15)
    else:
        box = (65, 85, 1855, 945)
    left, top, right, bottom = box
    shot = ImageOps.contain(source, (right - left, bottom - top), Image.Resampling.LANCZOS)
    x = left + (right - left - shot.width) // 2
    y = top + (bottom - top - shot.height) // 2
    draw.rectangle((x - 3, y - 3, x + shot.width + 3, y + shot.height + 3), fill="#d7e3e8")
    canvas.paste(shot, (x, y))
    step = next((step for step in reversed(timing["steps"]) if step["ms"] <= item["ms"]), None)
    caption = step["label"] if step else heading
    if folder == "08-import" and 6 <= seconds < 10:
        caption = "Select one session JSONL • File picker omitted"
    draw.line((60, 972, 1860, 972), fill="#d7e3e8", width=2)
    draw.text((65, 988), caption, font=font(29, True), fill=INK)
    draw.text((65, 1035), provenance, font=font(23), fill=MUTED)
    return canvas


def run(command: list[str]):
    result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        raise RuntimeError(f"Video rendering failed:\n{result.stderr[-4000:]}")


def render(index: int):
    duration, folder, _, _ = SHOTS[index]
    if folder is None:
        path = OUT / "composed" / f"title-{index}.png"
        title = title_frame(0 if index == 0 else 15)
        ImageDraw.Draw(title).rectangle((1750, 1000, 1919, 1079), fill=BG)
        title.save(path)
        inputs = ["-loop", "1", "-i", str(path)]
        preview = path
    else:
        timing = json.loads((OUT / folder / "timing.json").read_text(encoding="utf-8"))
        frames = [item for item in timing["frames"] if 0 <= item["ms"] < duration * 1000]
        if not frames or any(b["ms"] <= a["ms"] for a, b in pairwise(frames)):
            raise ValueError(f"Missing or unordered capture frames: {folder}")
        lines = []
        target = OUT / "composed" / folder
        target.mkdir(exist_ok=True)
        for number, item in enumerate(frames):
            path = target / f"{number:04d}.jpg"
            compose(index, item, timing).save(path, quality=96, subsampling=0)
            next_ms = frames[number + 1]["ms"] if number + 1 < len(frames) else duration * 1000
            # The first frame also represents the tiny pre-capture interval.
            start_ms = item["ms"] if number else 0
            lines.extend(
                [f"file 'composed/{folder}/{path.name}'", f"duration {(next_ms - start_ms) / 1000:.6f}"]
            )
        lines.append(f"file 'composed/{folder}/{path.name}'")
        concat = OUT / f"{folder}.txt"
        concat.write_text("\n".join(lines), encoding="utf-8")
        inputs = ["-f", "concat", "-safe", "0", "-i", str(concat)]
        preview = target / f"{len(frames) // 2:04d}.jpg"
    Image.open(preview).save(OUT / "previews" / f"{index:02d}.jpg", quality=95)
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
            f"fps=30,fade=t=in:st=0:d=0.12:color={BG},fade=t=out:st={duration - 0.12}:d=0.12:color={BG}",
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
            str(OUT / "segments" / f"{index:02d}.mp4"),
        ]
    )
    print(f"Rendered {index + 1}/{len(SHOTS)}", flush=True)


def main():
    for folder in ("composed", "segments", "previews"):
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as executor:
        list(executor.map(render, range(len(SHOTS))))
    concat = OUT / "concat.txt"
    concat.write_text("\n".join(f"file 'segments/{i:02d}.mp4'" for i in range(len(SHOTS))), encoding="utf-8")
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
            "-movflags",
            "+faststart",
            str(OUT / "Agent-Rewind-Demo-v2-Silent-1080p.mp4"),
        ]
    )
    sheet = Image.new("RGB", (1920, 1620), BG)
    for index in range(len(SHOTS)):
        image = Image.open(OUT / "previews" / f"{index:02d}.jpg")
        image.thumbnail((640, 360))
        sheet.paste(image, ((index % 3) * 640, (index // 3) * 405))
    sheet.save(OUT / "storyboard-v2.jpg", quality=95)
    print("Saved 160-second screen-led demo.")


if __name__ == "__main__":
    main()
