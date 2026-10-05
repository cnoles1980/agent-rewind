"""Read-only sandbox access and Python-image check. Never starts an execution."""

import argparse
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from agent_rewind.config import settings
from agent_rewind.sandbox import NebiusSandbox


async def probe(config):
    result = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "execution_attempted": False,
        "access_verified": False,
        "image_tag": "python:3.12-slim",
        "python_entry_found": False,
        "pricing_verified": False,
    }
    if not config.api_key or not config.project:
        return {**result, "error": "Configure NEBIUS_API_KEY and NEBIUS_PROJECT_ID in local secrets."}
    sandbox = NebiusSandbox(config)
    try:
        listing = await sandbox.client.list_images(tag=result["image_tag"], limit=100)
        result["access_verified"] = True
        images = listing.to_dict().get("images", [])
        image = next((image for image in images if image.get("tag") == result["image_tag"]), None)
        if image is None:
            return {**result, "error": "The recommended Python image is not listed."}
        result["image_uuid"] = image["uuid"]
        directory = await sandbox.client.inspect_image_list(image["uuid"], "/usr/local/bin")
        result["python_entry_found"] = any(
            entry.get("path") == "python" for entry in directory.to_dict().get("files", [])
        )
        result["note"] = "File presence does not verify execution, isolation, cleanup, or pricing."
    except Exception as exc:
        # Provider exceptions can include private request details. Report only the category.
        result["error_type"] = type(exc).__name__
    finally:
        await sandbox.close()
    return result


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path(".local/sandbox-preflight.json"))
    args = parser.parse_args()
    result = await probe(settings())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    if not result["access_verified"] or not result["python_entry_found"] or "error_type" in result:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
