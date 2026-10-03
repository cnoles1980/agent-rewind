import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


@dataclass
class Settings:
    data_dir: Path = field(default_factory=lambda: Path(os.getenv("REWIND_DATA_DIR", "data")))
    origin: str = field(default_factory=lambda: os.getenv("REWIND_ORIGIN", "http://127.0.0.1:5173"))
    secure_cookies: bool = field(
        default_factory=lambda: os.getenv("REWIND_SECURE_COOKIES", "false") == "true"
    )
    tester_hash: str = field(default_factory=lambda: os.getenv("REWIND_TESTER_CODE_HASH", ""))
    judge_hash: str = field(default_factory=lambda: os.getenv("REWIND_JUDGE_CODE_HASH", ""))
    api_key: str = field(default_factory=lambda: os.getenv("NEBIUS_API_KEY", ""))
    project: str = field(default_factory=lambda: os.getenv("NEBIUS_PROJECT_ID", ""))
    sandbox_image: str = field(default_factory=lambda: os.getenv("NEBIUS_SANDBOX_IMAGE", ""))
    model: str = field(default_factory=lambda: os.getenv("NEBIUS_MODEL", "nvidia/Nemotron-3_5-Lightning"))
    live_enabled: bool = field(default_factory=lambda: os.getenv("REWIND_LIVE_ENABLED", "false") == "true")
    prices_verified: bool = field(
        default_factory=lambda: os.getenv("REWIND_PRICES_VERIFIED", "false") == "true"
    )
    reserve_cents: int = field(default_factory=lambda: int(os.getenv("REWIND_RUN_RESERVATION_CENTS", "100")))
    test_budget_cents: int = 2000
    judge_budget_cents: int = 3000
    non_execution_cents: int = field(
        default_factory=lambda: int(os.getenv("REWIND_NON_EXECUTION_CENTS", "3000"))
    )

    def blockers(self):
        missing = []
        for key, value in (
            ("Dedicated Nebius key", self.api_key),
            ("Nebius sandbox project", self.project),
            ("Verified Python sandbox image", self.sandbox_image),
            ("Verified execution pricing", self.prices_verified),
            ("Live execution enabled", self.live_enabled),
        ):
            if not value:
                missing.append(key)
        if not self.model.lower().startswith("nvidia/") or "nemotron" not in self.model.lower():
            missing.append("NVIDIA Nemotron model")
        if self.reserve_cents < 1:
            missing.append("Positive per-run cost reservation")
        if self.origin.startswith("https://") and not self.secure_cookies:
            missing.append("Secure cookies required for HTTPS")
        return missing


def settings():
    load_dotenv()
    return Settings()
