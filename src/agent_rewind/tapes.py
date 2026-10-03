import json
from pathlib import Path

from .schema import Event, Note, Run, Tape

MAX_BYTES = 100 * 1024 * 1024


def loads(text: str) -> Tape:
    if len(text.encode("utf-8")) > MAX_BYTES:
        raise ValueError("Local tape exceeds 100 MB; select a smaller session")
    try:
        document = json.loads(text)
    except ValueError:
        document = None
    if isinstance(document, dict) and "run" in document:
        return Tape.model_validate(document)
    lines = text.splitlines()
    records = []
    partial = False
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        try:
            records.append(json.loads(line))
        except ValueError:
            if i == len(lines) - 1 and records:
                partial = True
            else:
                raise ValueError(f"Invalid JSON at line {i + 1}") from None
    if not records or records[0].get("record") != "run":
        raise ValueError("Missing run header")
    run = Run.model_validate(records[0])
    events, notes = [], []
    for record in records[1:]:
        if record.get("record") == "event":
            events.append(Event.model_validate(record))
        elif record.get("record") == "note":
            notes.append(Note.model_validate(record))
        else:
            raise ValueError("Unknown tape record")
    endings = [e for e in events if e.kind == "run.end"]
    if endings:
        run.status = endings[-1].data.get("status", "incomplete")
        run.duration_ms = endings[-1].elapsed_ms
    elif run.status == "running":
        run.status = "incomplete"
    if partial:
        run.status = "incomplete"
        run.warnings.append("Recovered a truncated final record.")
    return Tape(run=run, events=events, notes=notes)


def read(path: Path) -> Tape:
    if path.stat().st_size > MAX_BYTES:
        raise ValueError("Local tape exceeds 100 MB; select a smaller session")
    tape = loads(path.read_text(encoding="utf-8"))
    sidecar = path.with_suffix(".notes.json")
    if sidecar.exists():
        tape.notes = [Note.model_validate(n) for n in json.loads(sidecar.read_text(encoding="utf-8"))]
    return Tape.model_validate(tape.model_dump())


def write(path: Path, tape: Tape):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8") as f:
        for record in [tape.run, *tape.events, *tape.notes]:
            f.write(record.model_dump_json() + "\n")
