"""The readable digest of a finished run."""

from __future__ import annotations

import json
from datetime import date, timedelta

import pytest

from aigency_crew.demo import demo_workstreams
from aigency_crew.engine import GrowthEngine
from aigency_crew.reporting import latest_run, render_run
from aigency_crew.settings import load_settings


@pytest.fixture
def run_dir(tmp_path, monkeypatch, ledger):
    monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
    engine = GrowthEngine(load_settings(), ledger, demo_workstreams())
    result = engine.run(cycles=1)
    engine.write_outputs(result)
    return tmp_path / "output" / result.run_id


class TestRender:
    def test_leads_with_the_scores_and_why_each_loop_stopped(self, run_dir):
        report = render_run(run_dir)
        assert "Why the loop stopped" in report
        for stage in ("funding", "clients", "outreach"):
            assert stage in report
        assert "scored 86.0 >= 80.0 with no blockers" in report

    def test_funding_is_ranked_by_probability_weighted_value(self, run_dir):
        report = render_run(run_dir)
        big = report.index("Example Creative AI Fund")   # 400k x 0.35 = 140k
        small = report.index("Example Compute Credits")  # 50k x 0.60 = 30k
        assert big < small

    def test_each_opportunity_explains_why_it_is_under_the_radar(self, run_dir):
        assert "Why it's under the radar" in render_run(run_dir)

    def test_sources_are_rendered_as_links(self, run_dir):
        assert "](https://example.org/programmes/creative-ai)" in render_run(run_dir)

    def test_prospects_are_ranked_by_fit_and_show_the_why_now(self, run_dir):
        report = render_run(run_dir)
        assert report.index("Example Hospitality Group") < report.index("Example Retail Co")
        assert "new head of brand" in report

    def test_the_campaign_shows_the_sequence_with_its_opt_outs(self, run_dir):
        report = render_run(run_dir)
        assert "Day 0 · step 1" in report
        assert "Reply STOP" in report
        assert "Personalisation source:" in report

    def test_escalations_are_called_out_at_the_top(self, tmp_path, monkeypatch, ledger):
        monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
        workstreams = demo_workstreams()
        workstreams["funding"].scores = [50.0, 51.0]
        engine = GrowthEngine(load_settings(), ledger, workstreams)
        result = engine.run(cycles=1)
        engine.write_outputs(result)

        report = render_run(tmp_path / "output" / result.run_id)
        assert "Needs your eyes" in report
        assert report.index("Needs your eyes") < report.index("## Funding")

    def test_a_passed_deadline_is_flagged_rather_than_shown_as_a_date(self, run_dir):
        funding = json.loads((run_dir / "funding.json").read_text(encoding="utf-8"))
        funding["opportunities"][0]["deadline"] = str(date.today() - timedelta(days=5))
        (run_dir / "funding.json").write_text(json.dumps(funding), encoding="utf-8")
        assert "(passed)" in render_run(run_dir)

    def test_a_partial_run_still_renders(self, run_dir):
        (run_dir / "campaign.json").unlink()
        report = render_run(run_dir)
        assert "## Funding" in report
        assert "## Campaign" not in report


class TestLatestRun:
    def test_finds_the_most_recent_run(self, tmp_path):
        root = tmp_path / "output"
        for name in ("run-20260101-000000", "run-20260601-120000"):
            (root / name).mkdir(parents=True)
        assert latest_run(root).name == "run-20260601-120000"

    def test_returns_none_before_anything_has_run(self, tmp_path):
        assert latest_run(tmp_path) is None


class TestNothingSurvived:
    """A live run produced exactly this: eleven programmes found, every one
    dropped for want of a verifiable source. The report has to say so."""

    def _emptied(self, run_dir, name, key, rejected_key, reasons):
        payload = json.loads((run_dir / f"{name}.json").read_text(encoding="utf-8"))
        payload[key] = []
        payload[rejected_key] = reasons
        (run_dir / f"{name}.json").write_text(json.dumps(payload), encoding="utf-8")

    def test_an_emptied_funding_report_says_so_and_lists_why(self, run_dir):
        self._emptied(
            run_dir, "funding", "opportunities", "searched_but_rejected",
            ["example-fund — no retrieval date on any source"],
        )
        report = render_run(run_dir)
        assert "Nothing survived audit" in report
        assert "no retrieval date" in report
        assert "That is a real result, not an error" in report

    def test_an_emptied_prospect_list_says_so_too(self, run_dir):
        self._emptied(
            run_dir, "prospects", "prospects", "excluded",
            ["Example Co — trigger event could not be dated"],
        )
        assert "Nothing survived audit" in render_run(run_dir)

    def test_a_populated_report_is_unaffected(self, run_dir):
        assert "Nothing survived audit" not in render_run(run_dir)
