"""Loopback-only production bundle server with synthetic browser-test credentials."""

from pathlib import Path

import uvicorn

from agent_rewind.api import create_app
from agent_rewind.config import Settings
from agent_rewind.storage import digest

if __name__ == "__main__":
    config = Settings(
        data_dir=Path(".local/browser-tests"),
        origin="http://127.0.0.1:8766",
        tester_hash=digest("synthetic-browser-test-credential"),
        judge_hash="",
        api_key="",
        project="",
        sandbox_image="",
        live_enabled=False,
    )
    uvicorn.run(create_app(config), host="127.0.0.1", port=8766)
