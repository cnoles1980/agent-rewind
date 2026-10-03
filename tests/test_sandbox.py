import base64
import json
from types import SimpleNamespace

from agent_rewind.config import Settings
from agent_rewind.sandbox import NebiusSandbox


async def test_nebius_adapter_contract_disables_network_and_uses_disposable_execution():
    seen = {}

    class Client:
        async def spawn_instance(self, **kwargs):
            seen.update(kwargs)
            return SimpleNamespace(uuid="operation-1")

        async def get_operation_status(self, operation):
            assert operation == "operation-1"
            return SimpleNamespace(
                status="SUCCESS",
                to_dict=lambda: {
                    "metadata": {
                        "result": {
                            "state": {"exit_code": 0},
                            "stdout": {"value": json.dumps({"passed": True, "tests": []})},
                        }
                    }
                },
            )

        async def close(self):
            seen["closed"] = True

    sandbox = object.__new__(NebiusSandbox)
    sandbox.config = Settings(sandbox_image="verified-image")
    sandbox.client = Client()
    sandbox.operation = None
    operations = []
    sandbox.on_operation = operations.append
    assert (await sandbox.evaluate("def shipping_fee(subtotal):\n return 0", True))["passed"]
    assert seen["disposable"] is True and seen["preserve_env"] is False and seen["shell"] is False
    assert seen["networking"].enabled is False and seen["timeout"] == 20 and seen["env"] == {}
    script = base64.b64decode(seen["stdin"].value).decode()
    assert "[50, 0]" in script
    assert operations == ["operation-1", None]
    await sandbox.close()
    assert seen["closed"]
