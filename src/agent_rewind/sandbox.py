"""Nebius sandbox adapter. Agent-written Python never runs in the API process."""

import asyncio
import base64
import json

from contree_client.httpx import ContreeAsyncClient
from contree_client.models import ClosableStreamRepr, InstanceNetworking, InstanceResourcesLimits
from contree_client.runtime import RetryPolicy


class NebiusSandbox:
    def __init__(self, config, on_operation=lambda value: None):
        self.config = config
        self.on_operation = on_operation
        self.operation = None
        self.client = ContreeAsyncClient(
            config.api_key,
            project=config.project,
            base_url="https://api.tokenfactory.nebius.com/sandboxes",
            timeout=20,
            retry=RetryPolicy(max_attempts=1),
        )

    async def evaluate(self, source, acceptance=False):
        # Fixed harness is transported as stdin, never interpolated into a shell command.
        cases = [[0, 5], [49, 5], [51, 0]] + ([[50, 0]] if acceptance else [])
        script = "import json\nns={}\nexec(compile(" + repr(source) + ", 'shipping.py', 'exec'), ns)\n"
        script += "cases=" + repr(cases) + "\nresults=[]\n"
        script += "for subtotal, expected in cases:\n actual=ns['shipping_fee'](subtotal)\n results.append({'subtotal':subtotal,'expected':expected,'actual':actual,'passed':type(actual) in (int,float) and actual==expected})\n"
        script += "print(json.dumps({'tests':results,'passed':all(x['passed'] for x in results)}))\n"
        spawned = await self.client.spawn_instance(
            command="/usr/local/bin/python",
            args=["-I", "-"],
            shell=False,
            image=self.config.sandbox_image,
            disposable=True,
            preserve_env=False,
            env={},
            networking=InstanceNetworking(enabled=False),
            resources_limits=InstanceResourcesLimits(max_layer_bytes=16 * 1024 * 1024),
            timeout=20,
            truncate_output_at=16000,
            stdin=ClosableStreamRepr(value=base64.b64encode(script.encode()).decode(), encoding="base64"),
        )
        if not isinstance(spawned.uuid, str):
            raise RuntimeError("Sandbox did not return an operation ID")
        self.operation = spawned.uuid
        self.on_operation(self.operation)
        try:
            async with asyncio.timeout(35):
                while True:
                    operation = await self.client.get_operation_status(self.operation)
                    state = str(operation.status).upper()
                    if state in ("SUCCESS", "FAILED", "ERROR", "CANCELLED", "CANCELED", "TIMEOUT"):
                        break
                    await asyncio.sleep(0.5)
                if state != "SUCCESS":
                    raise RuntimeError("Sandbox execution did not complete successfully")
                # The operation includes the instance outcome. No image persistence is requested.
                payload = operation.to_dict()
                outcome = payload.get("metadata", {}).get("result", {})
                self.operation = None
                self.on_operation(None)
                stream = outcome.get("stdout", {})
                value = stream.get("value", "")
                if stream.get("encoding") == "base64":
                    value = base64.b64decode(value).decode("utf-8", errors="replace")
                if outcome.get("state", {}).get("exit_code") != 0:
                    return {"passed": False, "error": "Fixture execution failed", "stdout": value[:16000]}
                try:
                    parsed = json.loads(value.strip())
                    if not isinstance(parsed.get("tests"), list):
                        raise ValueError()
                    return parsed
                except (ValueError, AttributeError):
                    return {"passed": False, "error": "Invalid fixture output", "stdout": value[:16000]}
        finally:
            await self.cancel()

    async def cancel(self):
        if self.operation:
            try:
                await self.client.cancel_operation(self.operation)
            except Exception:
                # Remote execution has a hard 20-second deadline. Preserve the ID for recovery.
                return
            self.operation = None
            self.on_operation(None)

    async def close(self):
        await self.cancel()
        await self.client.close()
