"""The producer/auditor pair, built on CrewAI.

One class covers all three workstreams because their shape is identical:
a producing agent, an auditing agent on a different model, and three tasks
(produce, audit, revise) read from YAML. What differs between workstreams is
configuration, so that is all the subclasses in this package supply.

Each call builds a single-agent, single-task crew and kicks it off. That is
deliberate: the produce -> audit -> revise sequence is driven by
:func:`aigency_crew.loops.run_audited_cycle`, which needs to inspect the
artifact and decide whether another round is worth running. A single
sequential crew of three tasks would run all three unconditionally and could
not stop early, roll back a regression, or escalate.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Optional, Type

from crewai import Agent, Crew, LLM, Process, Task
from pydantic import BaseModel

from ..settings import Settings, load_yaml
from ..guardrails import Guardrail, require_audit_fixes
from ..inputs import full_inputs as build_full_inputs
from ..ledger import Ledger
from ..models import AuditReport
from ..tools.crew_tools import SHARED_TOOLS, has_web_access, research_tools


@dataclass
class StageSpec:
    """Everything that makes one workstream different from the other two."""

    stage: str
    producer_key: str
    auditor_key: str
    produce_task: str
    audit_task: str
    revise_task: str
    artifact_model: Type[BaseModel]
    producer_tools: list = field(default_factory=list)
    auditor_tools: list = field(default_factory=list)
    producer_guardrails: list[Guardrail] = field(default_factory=list)


def _json_snippet(value: Any, limit: int = 20_000) -> str:
    """Serialise an artifact for prompt injection, trimmed to something sane."""
    if value is None:
        return "None available."
    if isinstance(value, BaseModel):
        text = value.model_dump_json(indent=2)
    elif isinstance(value, str):
        text = value
    else:
        text = json.dumps(value, indent=2, default=str)
    if len(text) > limit:
        return text[:limit] + f"\n... [truncated at {limit} characters]"
    return text


class Workstream:
    """A producer agent and its auditor, satisfying the loop protocols."""

    def __init__(
        self,
        spec: StageSpec,
        settings: Settings,
        ledger: Ledger,
        verbose: bool = True,
    ) -> None:
        self.spec = spec
        self.stage = spec.stage
        self.settings = settings
        self.ledger = ledger
        self.verbose = verbose
        self._agents_yaml = load_yaml("agents.yaml")
        self._tasks_yaml = load_yaml("tasks.yaml")

    # -- construction ------------------------------------------------------

    def _llm(self, *, auditor: bool) -> LLM:
        return LLM(
            model=self.settings.auditor_model if auditor else self.settings.producer_model,
            temperature=(
                self.settings.auditor_temperature
                if auditor
                else self.settings.producer_temperature
            ),
        )

    def _agent(self, key: str, *, auditor: bool, tools: list) -> Agent:
        config = self._agents_yaml[key]
        return Agent(
            role=config["role"],
            goal=config["goal"],
            backstory=config["backstory"],
            llm=self._llm(auditor=auditor),
            tools=tools,
            verbose=config.get("verbose", self.verbose),
            allow_delegation=config.get("allow_delegation", False),
            max_iter=config.get("max_iter", 25),
        )

    def producer_agent(self) -> Agent:
        tools = [*SHARED_TOOLS, *self.spec.producer_tools, *research_tools()]
        return self._agent(self.spec.producer_key, auditor=False, tools=tools)

    def auditor_agent(self) -> Agent:
        tools = [*SHARED_TOOLS, *self.spec.auditor_tools, *research_tools()]
        return self._agent(self.spec.auditor_key, auditor=True, tools=tools)

    def _run(
        self,
        task_key: str,
        agent: Agent,
        output_model: Type[BaseModel],
        inputs: dict,
        guardrails: Optional[list[Guardrail]] = None,
    ) -> BaseModel:
        config = self._tasks_yaml[task_key]
        task = Task(
            description=config["description"],
            expected_output=config["expected_output"],
            agent=agent,
            output_pydantic=output_model,
            guardrails=list(guardrails or []),
            guardrail_max_retries=2,
        )
        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            verbose=self.verbose,
        )
        result = crew.kickoff(inputs=self.full_inputs(inputs))
        artifact = getattr(result, "pydantic", None)
        if artifact is None:
            raise RuntimeError(
                f"Task '{task_key}' did not return a {output_model.__name__}. "
                f"Raw output began: {str(result)[:300]}"
            )
        return artifact

    # -- inputs ------------------------------------------------------------

    def full_inputs(self, extra: dict) -> dict:
        """Every placeholder in tasks.yaml, filled. See :mod:`aigency_crew.inputs`."""
        return build_full_inputs(
            self.settings,
            self.ledger,
            self.stage,
            has_web=has_web_access(),
            extra=extra,
        )

    # -- the Producer protocol --------------------------------------------

    def produce(self, inputs: dict) -> BaseModel:
        return self._run(
            self.spec.produce_task,
            self.producer_agent(),
            self.spec.artifact_model,
            inputs,
            guardrails=self.spec.producer_guardrails,
        )

    def revise(self, previous: BaseModel, audit: AuditReport, inputs: dict) -> BaseModel:
        return self._run(
            self.spec.revise_task,
            self.producer_agent(),
            self.spec.artifact_model,
            {
                **inputs,
                "round": audit.round + 1,
                "feedback": audit.feedback_brief(),
                "previous_json": _json_snippet(previous),
            },
            guardrails=self.spec.producer_guardrails,
        )

    # -- the Auditor protocol ---------------------------------------------

    def audit(self, artifact: BaseModel, inputs: dict, round_number: int) -> AuditReport:
        report = self._run(
            self.spec.audit_task,
            self.auditor_agent(),
            AuditReport,
            {
                **inputs,
                "round": round_number,
                "draft_json": _json_snippet(artifact),
                "previous_json": _json_snippet(artifact),
            },
            guardrails=[require_audit_fixes()],
        )
        report.stage = self.stage
        report.round = round_number
        return report
