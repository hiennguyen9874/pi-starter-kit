"""Standard-library sstock client for the persistent ipython kernel.

Inject the kernel's pi bridge: client = SStockClient(pi). Reuse that client for
stock, proxy and retry fetches so they share a rolling rate budget.
"""
from __future__ import annotations

import asyncio
import json
import re
import time
from collections import deque
from pathlib import Path

PREFIX = "mcp__sstock__"


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def decode_result(result):
    """Accept MCP envelopes (including structuredContent) or pi's text return."""
    if isinstance(result, str):
        try:
            result = json.loads(result)
        except ValueError:
            return False, {"_raw": result}
    if not isinstance(result, dict):
        return False, {"_raw": str(result)}
    if "content" not in result and "structuredContent" not in result:
        return bool(result.get("isError")), result
    data = result.get("structuredContent")
    if data is None:
        text = "".join(part.get("text", "") for part in result.get("content", [])
                       if isinstance(part, dict))
        try:
            data = json.loads(text)
        except ValueError:
            data = {"_raw": text}
    return bool(result.get("isError")), data


def error_text(data):
    return data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)


class SStockClient:
    def __init__(self, pi, per_min=25, *, sleep=asyncio.sleep, clock=time.monotonic):
        if isinstance(per_min, bool) or not isinstance(per_min, int) or not 1 <= per_min <= 30:
            raise ValueError("per_min must be an integer between 1 and 30")
        self.pi = pi
        self.per_min = per_min
        self.sleep = sleep
        self.clock = clock
        self.stamps = deque()
        self.descriptions = {}

    async def throttle(self):
        while True:
            now = self.clock()
            while self.stamps and now - self.stamps[0] >= 61:
                self.stamps.popleft()
            if len(self.stamps) < self.per_min:
                self.stamps.append(now)
                return
            await self.sleep(61 - (now - self.stamps[0]))

    async def call(self, tool, args):
        name = PREFIX + tool
        # Inspect each tool before its first invocation; failures here are setup
        # errors and should stop the fetch rather than masquerade as missing data.
        if name not in self.descriptions:
            self.descriptions[name] = await self.pi.describe(name)
        for attempt in range(5):
            await self.throttle()
            try:
                is_error, data = decode_result(await self.pi.tool(name, args))
            except Exception as exc:
                result = getattr(exc, "result", None)
                _, data = decode_result(result) if result is not None else (True, {"_raw": str(exc)})
                is_error = True
            text = error_text(data)
            rate_limited = bool(re.search(r"429|rate[_ -]?limit", text, re.I))
            if not is_error or not rate_limited:
                return {"tool": tool, "args": args, "isError": is_error, "data": data}
            if attempt < 4:
                delay = re.search(r"(?:sau|after|retry[- ]after[: ]*)\s*(\d+)", text, re.I)
                await self.sleep((int(delay.group(1)) if delay else 30) + 2)
        return {"tool": tool, "args": args, "isError": True,
                "data": {"_raw": "rate limited 5x: " + text}}
