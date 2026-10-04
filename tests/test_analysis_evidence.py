import json
from copy import deepcopy
from pathlib import Path

import pytest

from agent_rewind.analysis import AnalysisDraft, AnalysisFailure, accept_draft
from agent_rewind.analysis_evidence import capture_text, prepare_evidence
from agent_rewind.redaction import Redactor

CASES = json.loads((Path(__file__).parent / "fixtures/analysis-evidence.json").read_text())


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["name"])
def test_reviewed_evidence_parity(case):
    case = deepcopy(case)
    if case.get("generated_input_length"):
        case["blocks"][0]["evidence"]["input"] = "x" * case["generated_input_length"]
    fence = "`" * case.get("fence", 3)
    report = "\n\n".join(f"{fence}json\n{json.dumps(block)}\n{fence}" for block in case["blocks"]) + case.get(
        "suffix", ""
    )
    clean = Redactor(paths=True).clean if case.get("clean") else lambda value: value
    if "error" in case:
        with pytest.raises(ValueError, match=case["error"]):
            prepare_evidence(report, case["ids"])
    else:
        result = prepare_evidence(report, case["ids"], clean)
        assert len(result["sources"]) == 1
        if "content" in case:
            assert result["sources"][0]["content"] == case["content"]
        for fragment in case.get("contains", []):
            assert fragment in result["sources"][0]["content"]


def test_excerpts_are_selected_by_id_and_text_always_comes_from_source():
    prepared = {"sources": [{"event_id": "evt", "content": "actual: []\n  expected: []"}]}
    draft = AnalysisDraft(
        quotes=[{"excerpt_id": 1}],
        questions=[],
        missing_evidence=[],
        verification_steps=["Inspect comparison semantics."],
    )
    assert accept_draft(draft, prepared).facts[0].text == prepared["sources"][0]["content"]
    draft.quotes[0].excerpt_id = 999
    with pytest.raises(AnalysisFailure, match="does not exist"):
        accept_draft(draft, prepared)


def test_truncation_is_bounded_even_with_one_character_remaining():
    text = capture_text(["x" * 15999, "y" * 100000])
    assert len(text) < 16100
    assert "TRUNCATED" in text


def test_excerpts_preserve_all_text_across_chunk_boundaries_and_source_ids():
    from agent_rewind.analysis_evidence import evidence_excerpts

    content = "header\n" + "x" * 1000 + "\nactual: []\nexpected: []"
    prepared = {
        "sources": [{"event_id": "first", "content": content}, {"event_id": "second", "content": "[]"}]
    }
    excerpts = evidence_excerpts(prepared)
    assert all(0 < len(item["text"]) <= 800 for item in excerpts)
    assert "".join(item["text"] for item in excerpts if item["event_id"] == "first") == content
    assert excerpts[-1] == {"id": 3, "event_id": "second", "text": "[]"}


def test_malformed_report_fails_instead_of_guessing():
    with pytest.raises(ValueError, match="malformed"):
        prepare_evidence('```json\n{"event":"evt"\n```', ["evt"])


@pytest.mark.parametrize(
    "case",
    json.loads((Path(__file__).parent / "fixtures/analysis-excerpts.json").read_text(encoding="utf-8")),
    ids=lambda case: case["name"],
)
def test_unicode_excerpt_parity(case):
    from agent_rewind.analysis_evidence import evidence_excerpts

    text = "x" * case["prefix_length"] + case["suffix"]
    excerpts = evidence_excerpts({"sources": [{"event_id": "evt", "content": text}]})
    assert [len(item["text"]) for item in excerpts] == case["lengths"]
    assert "".join(item["text"] for item in excerpts) == text
