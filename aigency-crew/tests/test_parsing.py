"""Salvaging a structured object from a model that answered in prose.

Every one of these cases is cheaper than re-running a research round.
"""

from __future__ import annotations

from aigency_crew.models import AuditReport, FundingReport
from aigency_crew.parsing import coerce, extract_json, repair_prompt

AUDIT_JSON = '{"score": 72.5, "verdict": "revise", "summary": "needs sources"}'


class TestExtractJson:
    def test_plain_json(self):
        assert extract_json('{"a": 1}') == {"a": 1}

    def test_fenced_json(self):
        assert extract_json('Here you go:\n```json\n{"a": 1}\n```\nHope that helps') == {"a": 1}

    def test_unlabelled_fence(self):
        assert extract_json("```\n{\"a\": 1}\n```") == {"a": 1}

    def test_json_buried_in_commentary(self):
        text = 'I reviewed the report.\n{"a": 1, "b": [2, 3]}\nLet me know if you need more.'
        assert extract_json(text) == {"a": 1, "b": [2, 3]}

    def test_braces_inside_strings_do_not_confuse_the_scan(self):
        text = 'prose {"note": "use {curly} braces", "n": 1} more prose'
        assert extract_json(text) == {"note": "use {curly} braces", "n": 1}

    def test_escaped_quotes_are_handled(self):
        assert extract_json(r'x {"q": "she said \"hi\"", "n": 2} y') == {
            "q": 'she said "hi"',
            "n": 2,
        }

    def test_arrays_too(self):
        assert extract_json("result: [1, 2, 3]") == [1, 2, 3]

    def test_nothing_parseable_returns_none(self):
        assert extract_json("no json here at all") is None

    def test_empty_input(self):
        assert extract_json("") is None


class TestCoerce:
    def test_an_object_of_the_right_type_passes_straight_through(self):
        report = AuditReport(score=50)
        assert coerce(report, AuditReport) is report

    def test_a_dict_is_validated(self):
        assert coerce({"score": 61.0}, AuditReport).score == 61.0

    def test_a_json_string_is_parsed_then_validated(self):
        assert coerce(AUDIT_JSON, AuditReport).verdict == "revise"

    def test_a_fenced_json_string_is_parsed(self):
        assert coerce(f"```json\n{AUDIT_JSON}\n```", AuditReport).score == 72.5

    def test_data_that_violates_the_schema_is_rejected_not_forced(self):
        assert coerce('{"score": 900}', AuditReport) is None

    def test_prose_with_no_json_returns_none(self):
        assert coerce("verdict: revise, score: 18", AuditReport) is None

    def test_none_is_handled(self):
        assert coerce(None, AuditReport) is None


class TestRepairPrompt:
    def test_carries_the_schema_and_the_content(self):
        prompt = repair_prompt("score: 18, verdict: revise", AuditReport)
        assert "dimension_scores" in prompt          # from the schema
        assert "score: 18, verdict: revise" in prompt

    def test_forbids_invention(self):
        prompt = repair_prompt("anything", FundingReport)
        assert "Invent nothing" in prompt
        assert "Do not summarise" in prompt

    def test_long_content_is_truncated_rather_than_refused(self):
        prompt = repair_prompt("x" * 50_000, AuditReport, limit=1_000)
        assert "[truncated]" in prompt
        assert len(prompt) < 40_000
