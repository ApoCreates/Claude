"""The YAML wiring.

A missing placeholder or a task pointing at an agent that does not exist fails
at the worst possible moment — mid-run, after the first agent has already been
paid for. These tests catch it in a tenth of a second instead.
"""

from __future__ import annotations

import pytest

from aigency_crew.settings import CONFIG_DIR, load_icp, load_settings, load_yaml
from aigency_crew.engine import STAGES
from aigency_crew.inputs import full_inputs, placeholders_in_tasks, web_access_note

AGENTS = load_yaml("agents.yaml")
TASKS = load_yaml("tasks.yaml")

EXPECTED_AGENTS = {
    "funding_scout",
    "funding_auditor",
    "client_prospector",
    "prospect_auditor",
    "campaign_architect",
    "campaign_auditor",
}


class TestAgents:
    def test_there_are_exactly_six_agents(self):
        assert set(AGENTS) == EXPECTED_AGENTS

    @pytest.mark.parametrize("key", sorted(EXPECTED_AGENTS))
    def test_every_agent_has_role_goal_and_backstory(self, key):
        agent = AGENTS[key]
        for field in ("role", "goal", "backstory"):
            assert agent.get(field, "").strip(), f"{key} is missing {field}"

    @pytest.mark.parametrize("key", sorted(EXPECTED_AGENTS))
    def test_no_agent_may_delegate(self, key):
        """Delegation would let a producer hand its work to its own auditor,
        which is precisely the separation this design exists to keep."""
        assert AGENTS[key].get("allow_delegation") is False


class TestTasks:
    def test_every_stage_has_produce_audit_and_revise(self):
        expected = {
            "find_funding", "audit_funding", "revise_funding",
            "build_client_list", "audit_client_list", "revise_client_list",
            "build_campaign", "audit_campaign", "revise_campaign",
        }
        assert set(TASKS) == expected

    @pytest.mark.parametrize("name", sorted(TASKS))
    def test_every_task_names_an_agent_that_exists(self, name):
        assert TASKS[name]["agent"] in AGENTS

    @pytest.mark.parametrize("name", sorted(TASKS))
    def test_every_task_declares_its_expected_output(self, name):
        assert TASKS[name].get("expected_output", "").strip()

    def test_audit_tasks_are_given_the_draft_to_review(self):
        for name in ("audit_funding", "audit_client_list", "audit_campaign"):
            assert "{draft_json}" in TASKS[name]["description"], (
                f"{name} would be auditing thin air"
            )

    def test_revision_tasks_receive_the_findings_and_the_previous_draft(self):
        for name in ("revise_funding", "revise_client_list", "revise_campaign"):
            description = TASKS[name]["description"]
            assert "{feedback}" in description and "{previous_json}" in description

    def test_producing_tasks_carry_the_prior_learnings(self):
        for name in ("find_funding", "build_client_list", "build_campaign"):
            assert "{learnings}" in TASKS[name]["description"], (
                f"{name} would relearn last cycle's lessons from scratch"
            )

    def test_audit_and_produce_are_never_the_same_agent(self):
        pairs = (
            ("find_funding", "audit_funding"),
            ("build_client_list", "audit_client_list"),
            ("build_campaign", "audit_campaign"),
        )
        for producer, auditor in pairs:
            assert TASKS[producer]["agent"] != TASKS[auditor]["agent"]


class TestPlaceholders:
    def test_every_placeholder_in_the_yaml_is_supplied(self, ledger):
        supplied = set(full_inputs(load_settings(), ledger, "funding"))
        missing = placeholders_in_tasks() - supplied
        assert not missing, f"tasks.yaml references unsupplied inputs: {sorted(missing)}"

    def test_per_call_values_override_the_defaults(self, ledger):
        inputs = full_inputs(
            load_settings(), ledger, "clients", extra={"round": 3, "feedback": "fix it"}
        )
        assert inputs["round"] == 3
        assert inputs["feedback"] == "fix it"

    def test_prior_learnings_reach_the_prompt(self, ledger):
        ledger.add_learnings("clients", ["an undated trigger is not a trigger"])
        inputs = full_inputs(load_settings(), ledger, "clients")
        assert "undated trigger" in inputs["learnings"]

    def test_without_search_the_agents_are_told_to_say_so(self):
        note = web_access_note(False)
        assert "NO web search" in note and "unverified" in note


class TestSettings:
    def test_defaults_load_from_the_packaged_yaml(self):
        settings = load_settings()
        assert settings.funding_target_count > 0
        assert settings.max_cycles >= 1

    def test_every_stage_resolves_a_loop_policy(self):
        settings = load_settings()
        for stage in STAGES:
            assert settings.policy(stage).max_rounds >= 1

    def test_outreach_is_held_to_a_higher_bar_than_the_default(self):
        settings = load_settings()
        assert settings.policy("outreach").pass_score >= settings.policy("funding").pass_score

    def test_env_overrides_win(self, monkeypatch):
        monkeypatch.setenv("AIGENCY_PASS_SCORE", "91")
        monkeypatch.setenv("AIGENCY_MAX_ROUNDS", "5")
        settings = load_settings()
        assert settings.policy("funding").pass_score == 91.0
        assert settings.policy("funding").max_rounds == 5

    def test_producer_and_auditor_default_to_different_models(self):
        settings = load_settings()
        assert settings.producer_model != settings.auditor_model, (
            "an auditor sharing the producer's model shares its blind spots"
        )

    def test_auditors_can_be_pointed_at_a_second_opinion_model(self, monkeypatch):
        monkeypatch.setenv("AIGENCY_AUDITOR_MODEL", "anthropic/claude-opus-5")
        assert load_settings().auditor_model == "anthropic/claude-opus-5"


class TestKnowledge:
    def test_the_icp_carries_the_lists_the_scorer_matches_on(self):
        icp = load_icp()
        for key in ("sectors", "geographies", "size_bands", "services"):
            assert icp.get(key), f"icp.yaml is missing {key}"

    def test_icp_values_are_lowercase_because_the_scorer_matches_on_them(self):
        icp = load_icp()
        for key in ("sectors", "geographies", "services"):
            for value in icp[key]:
                assert value == value.lower(), f"{value!r} in {key} must be lowercase"

    def test_settings_yaml_is_where_it_is_expected(self):
        assert (CONFIG_DIR / "settings.yaml").exists()


class TestModelLimits:
    """The provider's 4096 default truncates a full report into an empty
    response, and the resulting error names neither tokens nor the task."""

    def test_output_budgets_are_well_clear_of_the_provider_default(self):
        settings = load_settings()
        assert settings.producer_max_tokens > 4096
        assert settings.auditor_max_tokens > 4096

    def test_temperature_is_unset_by_default(self):
        """The Anthropic SDK rejects it outright from 1.0.0 onward."""
        settings = load_settings()
        assert settings.producer_temperature is None
        assert settings.auditor_temperature is None

    def test_the_output_budget_can_be_raised_from_the_environment(self, monkeypatch):
        monkeypatch.setenv("AIGENCY_MAX_TOKENS", "32000")
        assert load_settings().producer_max_tokens == 32000
