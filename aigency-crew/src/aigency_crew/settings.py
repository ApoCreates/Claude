"""Settings, paths, and the knowledge files every agent is grounded in.

Named ``settings.py`` rather than ``config.py`` because ``config/`` next door is
the YAML directory, and a module and a package of the same name inside one
package resolve in a way nobody should have to reason about."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

from .loops import LoopPolicy

PACKAGE_DIR = Path(__file__).resolve().parent
CONFIG_DIR = PACKAGE_DIR / "config"


def project_root() -> Path:
    """Where ``knowledge/``, ``state/`` and ``output/`` live.

    ``AIGENCY_HOME`` wins; otherwise the packaged source layout
    (``<root>/src/aigency_crew``) is assumed, with the current directory as a
    last resort for installed-package usage.
    """
    override = os.getenv("AIGENCY_HOME")
    if override:
        return Path(override).expanduser().resolve()
    candidate = PACKAGE_DIR.parents[1]
    if (candidate / "knowledge").is_dir():
        return candidate
    return Path.cwd()


def _env_float(name: str, fallback: float) -> float:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return fallback
    try:
        return float(raw)
    except ValueError:
        return fallback


@dataclass
class Settings:
    region: str
    horizon_months: int
    funding_target_count: int
    prospect_target_count: int
    campaign_goal: str
    loop_policies: dict[str, LoopPolicy]
    max_cycles: int
    recycle_score_floor: float
    producer_model: str
    auditor_model: str
    producer_temperature: float
    auditor_temperature: float
    raw: dict[str, Any] = field(default_factory=dict)

    def policy(self, stage: str) -> LoopPolicy:
        """Loop policy for a stage, falling back to the default block."""
        return self.loop_policies.get(stage, self.loop_policies["default"])


def load_settings(path: Optional[Path | str] = None) -> Settings:
    """Read ``config/settings.yaml``, then let ``AIGENCY_*`` env vars override."""
    path = Path(path) if path else CONFIG_DIR / "settings.yaml"
    data: dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    run = data.get("run", {})
    flow = data.get("flow", {})
    models = data.get("models", {})
    loops_cfg = data.get("loops", {}) or {}

    default_block = loops_cfg.get("default", {})
    policies: dict[str, LoopPolicy] = {}
    for name, block in {"default": default_block, **loops_cfg}.items():
        merged = {**default_block, **(block or {})}
        policies[name] = LoopPolicy(
            max_rounds=int(_env_float("AIGENCY_MAX_ROUNDS", merged.get("max_rounds", 3))),
            pass_score=_env_float("AIGENCY_PASS_SCORE", merged.get("pass_score", 80)),
            min_improvement=float(merged.get("min_improvement", 3)),
        )

    return Settings(
        region=os.getenv("AIGENCY_REGION", run.get("region", "United Arab Emirates")),
        horizon_months=int(run.get("horizon_months", 12)),
        funding_target_count=int(run.get("funding_target_count", 8)),
        prospect_target_count=int(run.get("prospect_target_count", 15)),
        campaign_goal=os.getenv("AIGENCY_CAMPAIGN_GOAL", run.get("campaign_goal", "")),
        loop_policies=policies,
        max_cycles=int(_env_float("AIGENCY_MAX_CYCLES", flow.get("max_cycles", 2))),
        recycle_score_floor=float(flow.get("recycle_score_floor", 70)),
        producer_model=os.getenv("AIGENCY_MODEL", models.get("producer", "anthropic/claude-sonnet-4-6")),
        auditor_model=os.getenv(
            "AIGENCY_AUDITOR_MODEL", models.get("auditor", models.get("producer", ""))
        )
        or os.getenv("AIGENCY_MODEL", "anthropic/claude-sonnet-4-6"),
        producer_temperature=float(models.get("producer_temperature", 0.4)),
        auditor_temperature=float(models.get("auditor_temperature", 0.1)),
        raw=data,
    )


def load_yaml(name: str) -> dict[str, Any]:
    """Load one of the packaged config files by filename."""
    return yaml.safe_load((CONFIG_DIR / name).read_text(encoding="utf-8")) or {}


def load_company_profile() -> str:
    """The studio profile agents are grounded in.

    Missing means missing: agents are told there is no profile rather than
    being handed a plausible-sounding default to build claims on.
    """
    path = project_root() / "knowledge" / "aigency_profile.md"
    if not path.exists():
        return (
            "NO COMPANY PROFILE FOUND at knowledge/aigency_profile.md. "
            "Make no claims about the studio's clients, results or credentials, "
            "and flag this gap prominently in your output."
        )
    return path.read_text(encoding="utf-8")


def load_icp() -> dict[str, Any]:
    path = project_root() / "knowledge" / "icp.yaml"
    if not path.exists():
        return {}
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {}


def ledger_path() -> Path:
    override = os.getenv("AIGENCY_LEDGER")
    return Path(override) if override else project_root() / "state" / "ledger.json"


def output_dir() -> Path:
    path = project_root() / "output"
    path.mkdir(parents=True, exist_ok=True)
    return path
