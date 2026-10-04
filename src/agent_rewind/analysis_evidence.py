"""Prepare reviewed report blocks; shared fixtures cover the browser/Worker adapter."""

import json
import re

EVIDENCE_REQUIRED = "Select recorded output or code before analysis. Metadata alone cannot support an investigation. No model call was made."
MALFORMED = "A reviewed JSON block is truncated or malformed. Generate a new report before analysis."


def evidence_excerpts(prepared):
    """Number bounded, contiguous source slices; the model selects but cannot rewrite them."""
    excerpts = []
    for source in prepared["sources"]:
        content, start = source["content"], 0
        while start < len(content):
            end = min(start + 800, len(content))
            if end < len(content):
                newline = content.rfind("\n", start, end)
                if newline > start + 400:
                    end = newline + 1
            excerpts.append(dict(id=len(excerpts) + 1, event_id=source["event_id"], text=content[start:end]))
            start = end
    return excerpts


def capture_text(value, limit=16000):
    buffer = head = tail = ""
    truncated = omitted = False
    nodes = 0
    half = max(1, limit // 2)

    def append(text):
        nonlocal buffer, head, tail, truncated
        part = text + "\n"
        if not truncated and len(buffer) + len(part) <= limit:
            buffer += part
            return
        if not truncated:
            head, tail, truncated = (buffer + part[:half])[:half], buffer[-half:], True
        tail = part[-half:] if len(part) >= half else (tail + part)[-half:]

    def visit(item, depth=0):
        nonlocal nodes, omitted
        nodes += 1
        if nodes > 2048 or depth > 10:
            if not omitted:
                append("[TRUNCATED: nested or extra data omitted]")
            omitted = True
            return
        if item is None and depth == 0:
            return
        if isinstance(item, str):
            if len(item) < 64000 and item.strip().startswith(("{", "[")):
                try:
                    decoded = json.loads(item)
                except ValueError:
                    pass
                else:
                    visit(decoded, depth + 1)
                    return
            append(item or '""')
        elif isinstance(item, list):
            if not item:
                append("[]")
            for child in item:
                visit(child, depth + 1)
                if nodes > 2048:
                    break
        elif isinstance(item, dict):
            if (
                item.get("type") == "text"
                and isinstance(item.get("text"), str)
                and set(item) <= {"type", "text"}
            ):
                visit(item["text"], depth + 1)
                return
            if not item and depth > 0:
                append("{}")
            for key, child in item.items():
                if depth == 0 and key == "capture":
                    continue
                append(f"{key}:")
                visit(child, depth + 1)
                if nodes > 2048:
                    break
        else:
            append(json.dumps(item))

    visit(value)
    return (head + "\n[TRUNCATED: middle omitted]\n" + tail if truncated else buffer).strip()


def reviewed_blocks(report):
    fence, lines, previous, supporting = "", [], "", False
    for line in report.splitlines():
        if fence:
            if line.rstrip() == fence:
                try:
                    block = json.loads("\n".join(lines))
                except ValueError:
                    raise ValueError(MALFORMED) from None
                yield block, supporting
                fence, lines = "", []
            else:
                lines.append(line)
        else:
            opening = re.fullmatch(r"(`{3,})json[ \t]*", line)
            if opening:
                fence, supporting = opening[1], previous == "## Explicitly included supporting context"
        if line.strip():
            previous = line.rstrip()
    if fence:
        raise ValueError(MALFORMED)


def prepare_evidence(report: str, ids: list[str], clean=lambda value: value):
    sources, supporting_context, seen = [], [], set()
    observation = "Expected behavior was not provided."
    for block, supporting in reviewed_blocks(report):
        if not isinstance(block, dict):
            continue
        if isinstance(block.get("observation"), str):
            observation = clean(block["observation"])
        event_id = block.get("event")
        if isinstance(event_id, str) and event_id in ids:
            if event_id in seen:
                raise ValueError("Duplicate event evidence; generate a new report.")
            seen.add(event_id)
            content = capture_text(clean(block.get("evidence")))
            if content:
                sources.append(
                    dict(
                        event_id=event_id,
                        content=content,
                    )
                )
        elif supporting:
            text = capture_text(clean(block))
            if text:
                supporting_context.append(text)
    if not sources:
        raise ValueError(EVIDENCE_REQUIRED)
    return dict(observation=observation, sources=sources, supporting_context=supporting_context)
