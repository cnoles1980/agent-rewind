"""Bounded Nebius transport shared by analysis and the coding demo."""

import json

import httpx


async def complete(config, **body):
    async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
        async with client.stream(
            "POST",
            "https://api.tokenfactory.nebius.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.api_key}"},
            json=body,
        ) as response:
            if response.status_code != 200:
                raise RuntimeError(f"Nebius inference returned HTTP {response.status_code}")
            chunks, size = [], 0
            async for chunk in response.aiter_bytes():
                size += len(chunk)
                if size > 1_000_000:
                    raise RuntimeError("Nebius response exceeded capture limit")
                chunks.append(chunk)
            return json.loads(b"".join(chunks))
