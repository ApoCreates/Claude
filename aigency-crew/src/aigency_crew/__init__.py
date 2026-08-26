"""Six-agent CrewAI growth engine for The Aigency.

Three producing agents — funding research, client pipeline, outreach campaigns
— each paired with an auditor that double-checks its work, and a loop
controller that decides when the pair has converged, stalled, or needs a human.

The modules that hold the logic (:mod:`loops`, :mod:`ledger`, :mod:`engine`,
:mod:`tools.scoring`) deliberately do not import CrewAI, so the orchestration
can be tested without a model in the room.
"""

from .engine import GrowthEngine, RunResult
from .ledger import Ledger
from .loops import CycleResult, Decision, LoopController, LoopPolicy, run_audited_cycle
from .models import AuditReport, Campaign, FundingReport, ProspectList

__version__ = "0.1.0"

__all__ = [
    "GrowthEngine",
    "RunResult",
    "Ledger",
    "LoopController",
    "LoopPolicy",
    "CycleResult",
    "Decision",
    "run_audited_cycle",
    "AuditReport",
    "FundingReport",
    "ProspectList",
    "Campaign",
]
