#!/usr/bin/env python3
"""Capture campus screenshots with headless Chrome. Local only."""

from __future__ import annotations

import base64
import json
import subprocess
import time
import urllib.request
from pathlib import Path

import websockets
import asyncio

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
CHROME = "/usr/local/bin/google-chrome"
PORT = 9333
BASE = "http://127.0.0.1:8741/campus/"


async def cdp(ws, method, params=None, msg_id=None):
    cdp.seq += 1
    mid = msg_id or cdp.seq
    await ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    while True:
        raw = json.loads(await ws.recv())
        if raw.get("id") == mid:
            if "error" in raw:
                raise RuntimeError(raw["error"])
            return raw.get("result", {})


cdp.seq = 0


async def evaluate(ws, expression):
    result = await cdp(
        ws,
        "Runtime.evaluate",
        {"expression": expression, "awaitPromise": True, "returnByValue": True},
    )
    if result.get("exceptionDetails"):
        raise RuntimeError(result["exceptionDetails"])
    return result.get("result", {}).get("value")


async def shot(ws, path: Path, width: int, height: int):
    await cdp(
        ws,
        "Emulation.setDeviceMetricsOverride",
        {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 500},
    )
    data = await cdp(ws, "Page.captureScreenshot", {"format": "png"})
    path.write_bytes(base64.b64decode(data["data"]))
    print("wrote", path, path.stat().st_size)


async def run() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    user_dir = Path("/tmp/voice-lab-chrome")
    if user_dir.exists():
        import shutil
        shutil.rmtree(user_dir, ignore_errors=True)
    proc = subprocess.Popen(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--no-default-browser-check",
            "--user-data-dir=/tmp/voice-lab-chrome",
            f"--remote-debugging-port={PORT}",
            "--window-size=1440,900",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        target = None
        for _ in range(40):
            try:
                req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new?{BASE}", method="PUT")
                with urllib.request.urlopen(req, timeout=2) as response:
                    target = json.loads(response.read().decode())
                break
            except Exception:
                time.sleep(0.25)
        if not target:
            raise SystemExit("chrome debugger did not come up")
        async with websockets.connect(target["webSocketDebuggerUrl"], max_size=20_000_000) as ws:
            await cdp(ws, "Page.enable")
            await cdp(ws, "Runtime.enable")
            await cdp(
                ws,
                "Page.addScriptToEvaluateOnNewDocument",
                {
                    "source": "window.__errors=[];window.addEventListener('error',function(e){window.__errors.push(String(e.message));});window.addEventListener('unhandledrejection',function(e){window.__errors.push(String(e.reason));});"
                },
            )
            pages = [
                (
                    "home.png",
                    BASE + "#/",
                    1440,
                    1280,
                    "document.querySelector('#home-orbit').click(); new Promise((r)=>setTimeout(r, 900))",
                ),
                ("home-mobile.png", BASE + "#/", 390, 844, None),
                (
                    "lab-direct-routing.png",
                    BASE + "#/lab/dr-path",
                    1440,
                    1000,
                    "document.querySelector('#dr-run').click()",
                ),
                (
                    "lab-dial-plan.png",
                    BASE + "#/lab/dial-plan",
                    1440,
                    1000,
                    "document.querySelector('#dp-num').value='(425) 555-0100'; document.querySelector('#dp-run').click()",
                ),
                (
                    "lab-erlang.png",
                    BASE + "#/lab/erlang",
                    1440,
                    1000,
                    "document.querySelector('#er-run').click()",
                ),
                (
                    "lesson-direct-routing.png",
                    BASE + "#/lesson/t05-dr",
                    1440,
                    1500,
                    None,
                ),
                (
                    "ecosystem-map.png",
                    BASE + "#/map",
                    1440,
                    1200,
                    None,
                ),
                (
                    "powershell.png",
                    BASE + "#/powershell",
                    1440,
                    1000,
                    "document.querySelector('#ps-in').value='Get-CsOnlinePSTNGateway'; document.querySelector('#ps-form').requestSubmit()",
                ),
                (
                    "sbc-mesh.png",
                    BASE + "#/topology",
                    1440,
                    1100,
                    "new Promise((resolve)=>{ const start=Date.now(); const tick=()=>{ const canvas=document.querySelector('#topo-gl'); if(canvas && !canvas.hidden || Date.now()-start>2500) resolve(true); else setTimeout(tick, 50); }; tick(); })",
                ),
                ("field-desk.png", BASE + "#/field", 1440, 1200, None),
                ("ports.png", BASE + "#/ports", 1440, 1200, None),
                ("downloads.png", BASE + "#/downloads", 1440, 1400, None),
                (
                    "ports-game.png",
                    BASE + "#/game",
                    1440,
                    1100,
                    "document.querySelector('[data-g]') && document.querySelector('[data-g]').click()",
                ),
            ]
            for name, url, width, height, action in pages:
                await cdp(ws, "Page.navigate", {"url": url})
                await evaluate(
                    ws,
                    "new Promise((resolve) => { const start = Date.now(); const tick = () => { const view = document.querySelector('#view'); const ready = view && view.childElementCount > 0 && !view.querySelector('.loading'); if (ready || Date.now()-start>8000) resolve(document.querySelector('h1') && document.querySelector('h1').textContent); else setTimeout(tick, 50); }; tick(); })",
                )
                await evaluate(ws, "new Promise((r) => setTimeout(r, 400))")
                title = await evaluate(ws, "document.querySelector('h1') && document.querySelector('h1').textContent")
                print(name, "h1:", title)
                errors = await evaluate(ws, "window.__errors || []")
                if errors:
                    print("  ERRORS:", errors)
                    raise SystemExit(f"{name} console errors: {errors}")
                if action:
                    await evaluate(ws, action)
                    await evaluate(ws, "new Promise((r) => setTimeout(r, 250))")
                    live = await evaluate(
                        ws,
                        "document.querySelector('[aria-live]') && document.querySelector('[aria-live]').innerText.slice(0, 240)",
                    )
                    print("  live:", live)
                await shot(ws, OUT / name, width, height)
            for theme_name, theme_id in (
                ("theme-light.png", "light"),
                ("theme-futuristic.png", "futuristic"),
                ("theme-gaming.png", "gaming"),
                ("theme-neon.png", "neon"),
                ("theme-dark.png", "dark"),
                ("theme-hc.png", "hc"),
                ("theme-teams.png", "teams"),
            ):
                await evaluate(
                    ws,
                    "localStorage.setItem('mvcc-lab-v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('mvcc-lab-v1') || '{}'), {theme: '%s', font: 'md', reduceMotion: 'system'}))); 'ok'"
                    % theme_id,
                )
                await cdp(ws, "Page.navigate", {"url": BASE + "?theme=" + theme_id + "#/"})
                got = await evaluate(
                    ws,
                    "new Promise((resolve) => { const start = Date.now(); const tick = () => { const view = document.querySelector('#view'); const ready = view && view.childElementCount > 0 && !view.querySelector('.loading') && document.documentElement.dataset.theme === '%s'; if (ready) resolve(document.documentElement.dataset.theme); else if (Date.now()-start>8000) resolve(document.documentElement.dataset.theme || 'timeout'); else setTimeout(tick, 50); }; tick(); })"
                    % theme_id,
                )
                print(theme_name, "theme:", got)
                if got != theme_id:
                    raise SystemExit(f"{theme_name} rendered {got}")
                await evaluate(ws, "new Promise((r) => setTimeout(r, 300))")
                await shot(ws, OUT / theme_name, 1440, 1100)
            await evaluate(
                ws,
                "localStorage.setItem('mvcc-lab-v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('mvcc-lab-v1') || '{}'), {theme: 'light'}))); 'ok'",
            )
            await cdp(ws, "Page.navigate", {"url": BASE + "#/settings"})
            await evaluate(
                ws,
                "new Promise((resolve) => { const start = Date.now(); const tick = () => { const view = document.querySelector('#set-voice'); if (view || Date.now()-start>8000) resolve(true); else setTimeout(tick, 50); }; tick(); })",
            )
            await evaluate(ws, "new Promise((r) => setTimeout(r, 500))")
            await shot(ws, OUT / "settings.png", 1440, 1200)
            await cdp(ws, "Page.navigate", {"url": BASE + "#/tips/t05"})
            await evaluate(
                ws,
                "new Promise((resolve) => { const start = Date.now(); const tick = () => { const view = document.querySelector('.sheet'); if (view || Date.now()-start>8000) resolve(true); else setTimeout(tick, 50); }; tick(); })",
            )
            await shot(ws, OUT / "tips-pstn.png", 1440, 1200)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    asyncio.run(run())
