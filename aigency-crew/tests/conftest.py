"""Shared fixtures. Nothing here touches the network or a model."""

from __future__ import annotations

import pytest

from aigency_crew.settings import load_settings
from aigency_crew.ledger import Ledger


@pytest.fixture
def ledger(tmp_path) -> Ledger:
    return Ledger.load(tmp_path / "ledger.json")


@pytest.fixture
def settings():
    return load_settings()
