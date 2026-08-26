"""The CrewAI Flow wrapper, exercised with scripted agents.

Skipped when CrewAI is not installed — the rest of the suite deliberately runs
without it, and this file is the one place the real Flow graph is checked.
"""

from __future__ import annotations

import pytest

pytest.importorskip("crewai", reason="CrewAI not installed; flow graph not exercised")

from aigency_crew.settings import load_settings  # noqa: E402
from aigency_crew.demo import ScriptedWorkstream, demo_workstreams, sample_campaign  # noqa: E402
from aigency_crew.engine import GrowthEngine  # noqa: E402
from aigency_crew.flow import AigencyGrowthFlow  # noqa: E402


@pytest.fixture
def flow_engine(tmp_path, monkeypatch, ledger):
    monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
    monkeypatch.setenv("CREWAI_TELEMETRY_OPT_OUT", "true")
    return GrowthEngine(load_settings(), ledger, demo_workstreams())


def test_the_flow_graph_is_valid_and_runs_end_to_end(flow_engine):
    flow = AigencyGrowthFlow(engine=flow_engine)
    result = flow.kickoff()

    assert [o.stage for o in result.outcomes] == ["funding", "clients", "outreach"]
    assert flow.state.funding_score > 0
    assert flow.state.clients_score > 0
    assert flow.state.outreach_score > 0
    assert flow.state.cycle == 1


def test_the_router_records_why_it_stopped(flow_engine):
    flow = AigencyGrowthFlow(engine=flow_engine)
    flow.kickoff()
    assert flow.state.decisions
    assert "no upstream rework needed" in flow.state.decisions[0]


def test_a_list_problem_sends_the_flow_back_through_prospecting(flow_engine):
    flow_engine.workstreams["outreach"] = ScriptedWorkstream(
        stage="outreach",
        artifact_factory=sample_campaign,
        scores=[40.0, 44.0],
        blocker_rounds=(1, 2, 3, 4),
        dimension="personalisation",
    )
    flow = AigencyGrowthFlow(engine=flow_engine)
    result = flow.kickoff()

    assert flow.state.cycle == 2
    assert result.needs_human, "a campaign that never reached the bar must not ship quietly"
    assert flow_engine.workstreams["clients"].produced >= 2
