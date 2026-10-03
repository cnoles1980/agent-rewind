"""Redact at capture boundaries, before any persistence."""

import json
import re
from typing import Any

SENSITIVE = re.compile(
    r"^(authorization|proxy.authorization|cookie|set.cookie|.*api.?key|.*password|.*secret|access.?token|refresh.?token|token|encrypted_content|environment|env|creator_user_id|creator_account_id)$",
    re.I,
)
PATTERNS = [
    re.compile(r"(?i)Bearer\s+[A-Za-z0-9._~+/-]+=*"),
    re.compile(r"\b(?:sk-|ghp_|github_pat_|hf_)[A-Za-z0-9_\-]{12,}"),
    re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"),
    re.compile(r"(?i)(?:api[_-]?key|password|secret|access_token|authorization)\s*[:=]\s*[^\s,;\"']+"),
]
PATHS = re.compile(r"[A-Za-z]:[\\/](?:Users|home)[\\/][^\s\"'<>]+|/(?:Users|home)/[^\s\"'<>]+")


class Redactor:
    def __init__(self, secrets=(), sensitive_keys=(), paths=False):
        self.secrets = tuple(s for s in secrets if s and len(s) >= 4)
        self.keys = {k.lower() for k in sensitive_keys}
        self.paths = paths

    def clean(self, value: Any, depth=0) -> Any:
        if depth > 35:
            return "[DEPTH LIMIT]"
        if hasattr(value, "model_dump"):
            value = value.model_dump(mode="json")
        if isinstance(value, dict):
            return {
                str(k): "[REDACTED]"
                if SENSITIVE.match(str(k)) or str(k).lower() in self.keys
                else self.clean(v, depth + 1)
                for k, v in value.items()
            }
        if isinstance(value, (list, tuple)):
            return [self.clean(v, depth + 1) for v in value]
        if isinstance(value, str):
            # Tool arguments are often JSON encoded inside a string.
            if value.lstrip().startswith(("{", "[")):
                try:
                    parsed = json.loads(value)
                    return json.dumps(self.clean(parsed, depth + 1), ensure_ascii=False)
                except (ValueError, RecursionError):
                    pass
            for secret in self.secrets:
                value = value.replace(secret, "[REDACTED]")
            for pattern in PATTERNS:
                value = pattern.sub("[REDACTED]", value)
            if self.paths:
                value = PATHS.sub("[LOCAL PATH]", value)
            return value
        if value is None or isinstance(value, (bool, int, float)):
            return value
        return "[UNSERIALIZABLE]"
