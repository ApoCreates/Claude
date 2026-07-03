"""Local image generation (a "paid" feature, here unlocked and unlimited).

Talks to a local Stable-Diffusion-compatible HTTP API (Automatic1111,
SD.Next or ComfyUI via its txt2img-compatible bridge). If none is
configured it reports that clearly instead of failing silently. Nothing is
sent off-device.
"""

from __future__ import annotations

import base64
import time
from pathlib import Path

import httpx

from .config import settings


class ImageGenerator:
    def available(self) -> bool:
        return bool(settings.sd_url)

    def status(self) -> dict:
        ok = False
        if settings.sd_url:
            try:
                r = httpx.get(f"{settings.sd_url}/sdapi/v1/options", timeout=3)
                ok = r.status_code == 200
            except Exception:
                ok = False
        return {"configured": bool(settings.sd_url), "reachable": ok,
                "endpoint": settings.sd_url or None}

    def generate(self, prompt: str, *, width: int = 768, height: int = 768,
                 steps: int = 28, negative: str = "") -> dict:
        if not settings.sd_url:
            return {"ok": False, "error":
                    "No local image backend configured. Set LOCALBIRD_SD_URL to a "
                    "running Automatic1111/SD.Next endpoint (e.g. http://127.0.0.1:7860)."}
        try:
            r = httpx.post(
                f"{settings.sd_url}/sdapi/v1/txt2img",
                json={"prompt": prompt, "negative_prompt": negative,
                      "width": width, "height": height, "steps": steps},
                timeout=600,
            )
            r.raise_for_status()
            images = r.json().get("images", [])
            if not images:
                return {"ok": False, "error": "backend returned no images"}
            raw = base64.b64decode(images[0].split(",", 1)[-1])
            out = settings.image_dir / f"img-{int(time.time())}.png"
            Path(out).write_bytes(raw)
            return {"ok": True, "path": str(out), "prompt": prompt}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
