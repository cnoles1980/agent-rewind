"""Create local-only invitation credentials without printing them in logs."""

import hashlib
import os
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[1]
env = root / ".env"
if env.exists():
    raise SystemExit(".env already exists; leaving your settings unchanged.")
private = root / ".local"
private.mkdir(exist_ok=True)
codes = {role: secrets.token_urlsafe(32) for role in ("tester", "judge")}
content = (root / ".env.example").read_text(encoding="utf-8")
for role, code in codes.items():
    name = f"REWIND_{role.upper()}_CODE_HASH="
    content = content.replace(name, name + hashlib.sha256(code.encode()).hexdigest())
env.write_text(content, encoding="utf-8")
credentials = private / "local-invitations.txt"
credentials.write_text(
    "LOCAL DEVELOPMENT ONLY. Do not commit or publish.\n\n"
    + "\n".join(f"{role}: {code}" for role, code in codes.items()),
    encoding="utf-8",
)
if os.name != "nt":
    env.chmod(0o600)
    credentials.chmod(0o600)
print("Created .env with live execution disabled.")
print(f"Open {credentials} to obtain a local invitation code.")
