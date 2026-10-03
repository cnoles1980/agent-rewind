import argparse
import json
from pathlib import Path

from .importer import import_codex
from .schema import Tape
from .tapes import read, write


def main():
    parser = argparse.ArgumentParser(prog="rewind", description="Record / Replay / Understand")
    sub = parser.add_subparsers(dest="command", required=True)
    imp = sub.add_parser("import").add_subparsers(dest="source", required=True).add_parser("codex")
    imp.add_argument("--file", required=True, type=Path)
    imp.add_argument("--out", required=True, type=Path)
    schema = sub.add_parser("schema")
    schema.add_argument("--out", required=True, type=Path)
    val = sub.add_parser("validate")
    val.add_argument("file", type=Path)
    pack = sub.add_parser("pack", help="Combine a recording and its notes sidecar into a portable tape")
    pack.add_argument("--file", required=True, type=Path)
    pack.add_argument("--out", required=True, type=Path)
    sub.add_parser("serve")
    args = parser.parse_args()
    try:
        if args.command == "import":
            tape = import_codex(args.file)
            write(args.out, tape)
            print(
                json.dumps(
                    {"events": len(tape.events), "status": tape.run.status, "warnings": tape.run.warnings},
                    indent=2,
                )
            )
        elif args.command == "pack":
            tape = read(args.file)
            write(args.out, tape)
            print(f"Packed {len(tape.events)} events and {len(tape.notes)} notes")
        elif args.command == "schema":
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(Tape.model_json_schema(), indent=2), encoding="utf-8")
        elif args.command == "validate":
            tape = read(args.file)
            print(f"Valid v1 tape: {len(tape.events)} events, {tape.run.status}")
        elif args.command == "serve":
            import uvicorn

            uvicorn.run("agent_rewind.api:app", host="127.0.0.1", port=8765)
    except (ValueError, OSError) as exc:
        parser.exit(1, f"Error: {exc}\n")


if __name__ == "__main__":
    main()
