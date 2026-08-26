"""The outer loop: what the engine remembers between runs."""

from __future__ import annotations

import json

from aigency_crew.ledger import MAX_LEARNINGS_PER_STAGE, Ledger


class TestLearnings:
    def test_new_learnings_are_stored_and_counted(self, ledger):
        assert ledger.add_learnings("funding", ["check the licence type first"]) == 1
        assert ledger.learnings("funding") == ["check the licence type first"]

    def test_the_same_lesson_is_never_stored_twice(self, ledger):
        ledger.add_learnings("funding", ["Check the licence type"])
        added = ledger.add_learnings("funding", ["check the licence type", "  CHECK THE LICENCE TYPE  "])
        assert added == 0
        assert len(ledger.learnings("funding")) == 1

    def test_blank_notes_are_ignored(self, ledger):
        assert ledger.add_learnings("funding", ["", "   ", None]) == 0

    def test_old_advice_is_trimmed_so_the_brief_stays_readable(self, ledger):
        ledger.add_learnings("clients", [f"lesson {i}" for i in range(MAX_LEARNINGS_PER_STAGE + 10)])
        notes = ledger.learnings("clients")
        assert len(notes) == MAX_LEARNINGS_PER_STAGE
        assert notes[-1] == f"lesson {MAX_LEARNINGS_PER_STAGE + 9}", "newest advice survives"

    def test_briefing_says_so_when_there_is_nothing_to_say(self, ledger):
        assert "No prior learnings" in ledger.briefing("outreach")

    def test_briefing_renders_as_prompt_ready_bullets(self, ledger):
        ledger.add_learnings("outreach", ["name the source URL"])
        assert ledger.briefing("outreach") == "- name the source URL"


class TestDeduplication:
    def test_ids_delivered_before_are_not_novel(self, ledger):
        ledger.remember_ids("funding", ["grant-a", "grant-b"])
        assert ledger.novel("funding", ["grant-a", "grant-c"]) == ["grant-c"]

    def test_stages_do_not_share_an_id_space(self, ledger):
        ledger.remember_ids("funding", ["shared-id"])
        assert ledger.novel("clients", ["shared-id"]) == ["shared-id"]

    def test_remembering_is_idempotent(self, ledger):
        ledger.remember_ids("funding", ["grant-a"])
        ledger.remember_ids("funding", ["grant-a"])
        assert ledger.seen("funding") == ["grant-a"]


class TestOutcomes:
    def test_rates_are_derived_from_the_raw_counts(self, ledger):
        ledger.record_outcome("q3", sent=200, replies=16, meetings=6, won=2, segment="hospitality")
        assert ledger.data["outcomes"]["q3"]["reply_rate"] == 0.08

    def test_a_campaign_with_no_sends_has_no_rate_rather_than_a_fake_zero(self, ledger):
        ledger.record_outcome("draft", sent=0, replies=0)
        assert ledger.data["outcomes"]["draft"]["reply_rate"] is None

    def test_performance_brief_leads_with_the_best_performer(self, ledger):
        ledger.record_outcome("weak", sent=100, replies=1)
        ledger.record_outcome("strong", sent=100, replies=20)
        brief = ledger.performance_brief()
        assert brief.index("strong") < brief.index("weak")

    def test_performance_brief_is_explicit_when_nothing_has_been_sent(self, ledger):
        assert "No campaign results recorded" in ledger.performance_brief()


class TestPersistence:
    def test_survives_a_save_and_reload(self, tmp_path):
        path = tmp_path / "ledger.json"
        first = Ledger.load(path)
        first.add_learnings("funding", ["a lesson"])
        first.remember_ids("funding", ["grant-a"])
        first.record_run("run-1", {"cycles_run": 1})
        first.save()

        second = Ledger.load(path)
        assert second.learnings("funding") == ["a lesson"]
        assert second.seen("funding") == ["grant-a"]
        assert second.last_run()["run_id"] == "run-1"

    def test_a_corrupt_ledger_is_quarantined_rather_than_crashing_the_run(self, tmp_path):
        path = tmp_path / "ledger.json"
        path.write_text("{not json at all", encoding="utf-8")
        ledger = Ledger.load(path)
        assert ledger.learnings("funding") == []
        assert (tmp_path / "ledger.corrupt.json").exists()

    def test_the_run_log_is_capped(self, ledger):
        for i in range(60):
            ledger.record_run(f"run-{i}", {})
        assert len(ledger.data["runs"]) == 50

    def test_saved_file_is_readable_json(self, tmp_path):
        ledger = Ledger.load(tmp_path / "ledger.json")
        ledger.add_learnings("clients", ["a lesson"])
        ledger.save()
        data = json.loads((tmp_path / "ledger.json").read_text(encoding="utf-8"))
        assert data["learnings"]["clients"][0]["note"] == "a lesson"
