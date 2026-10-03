import pytest
from agent_rewind.demo import validate_source


@pytest.mark.parametrize(
    "source",
    [
        "import os\ndef shipping_fee(subtotal):\n return 0",
        'def shipping_fee(subtotal):\n return __import__("os").system("echo bad")',
        "def shipping_fee(subtotal):\n while True: pass",
        "def shipping_fee(subtotal=print(1)):\n return 0",
        "def shipping_fee(subtotal):\n return subtotal.__class__",
    ],
)
def test_fixture_cannot_execute_arbitrary_agent_code(source):
    with pytest.raises((ValueError, SyntaxError)):
        validate_source(source)


def test_correct_and_stale_boundary_implementations_are_permitted():
    for op in (">", ">="):
        validate_source(f"def shipping_fee(subtotal):\n    return 0 if subtotal {op} 50 else 5\n")
