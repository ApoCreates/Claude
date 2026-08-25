"""Getting a structured object back out of a model that answered in prose.

CrewAI converts a task's output into its `output_pydantic` model most of the
time. When it doesn't — a long report, a model that decided markdown was more
helpful — the run should not die several frames from the cause with the whole
round's work thrown away. These helpers salvage what came back before anything
more expensive is attempted.
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional, Type

from pydantic import BaseModel, ValidationError

_FENCE = re.compile(r"```(?:json|JSON)?\s*(.+?)```", re.DOTALL)


def extract_json(text: str) -> Optional[Any]:
    """Pull the first JSON object or array out of arbitrary model output."""
    if not text:
        return None

    candidates: list[str] = []
    candidates += [match.group(1).strip() for match in _FENCE.finditer(text)]
    candidates.append(text.strip())

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
        block = _first_balanced(candidate)
        if block:
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                continue
    return None


def _first_balanced(text: str) -> Optional[str]:
    """The first balanced {...} or [...] span, ignoring braces inside strings."""
    start = next(
        (i for i, ch in enumerate(text) if ch in "{["),
        None,
    )
    if start is None:
        return None

    opener = text[start]
    closer = "}" if opener == "{" else "]"
    depth = 0
    in_string = False
    escaped = False

    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def coerce(value: Any, model: Type[BaseModel]) -> Optional[BaseModel]:
    """Validate whatever we have against the model, or return None."""
    if value is None:
        return None
    if isinstance(value, model):
        return value
    try:
        if isinstance(value, (dict, list)):
            return model.model_validate(value)
        if isinstance(value, str):
            data = extract_json(value)
            return model.model_validate(data) if data is not None else None
    except (ValidationError, TypeError):
        return None
    return None


def repair_prompt(raw: str, model: Type[BaseModel], limit: int = 24_000) -> str:
    """Ask a model to restate its own answer as JSON, losing nothing.

    Cheaper and far more faithful than re-running the task: the research is
    already done, only the shape is wrong.
    """
    schema = json.dumps(model.model_json_schema(), indent=2)
    body = raw if len(raw) <= limit else raw[:limit] + "\n... [truncated]"
    return (
        "Convert the content below into a single JSON object matching this "
        "schema exactly.\n\nSCHEMA\n"
        f"{schema}\n\n"
        "RULES\n"
        "- Output JSON only. No prose, no markdown fences, no commentary.\n"
        "- Carry over every item and every field present in the content. Do not "
        "summarise, drop, or shorten anything.\n"
        "- Invent nothing. Where the content has no value for a required field, "
        "use the most conservative valid value (an empty string, an empty list, "
        "or the lowest score).\n\nCONTENT\n"
        f"{body}"
    )
