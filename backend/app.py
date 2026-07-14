"""
app.py — FastAPI backend for the AALM browser front-end.

Run locally:
    cd backend
    python -m uvicorn app:app --reload --port 8000
Then open http://localhost:8000/

The frontend (../frontend) is served by this app for local convenience, but it is a
fully static SPA and can also be hosted separately (point it at this API via
window.AALM_API_BASE). The model executable is invoked only through model_runner.py.
"""
from __future__ import annotations
import asyncio
import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from aalm_core import read_out_csv
from model_runner import run_aalm
from models import RunConfig

# ---- paths ----------------------------------------------------------------- #
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.dirname(BACKEND_DIR)          # the "AALM App" folder
FRONTEND_DIR = os.path.join(APP_ROOT, "frontend")
SHARED_DIR = os.path.join(APP_ROOT, "shared")
RUNS_ROOT = os.path.join(APP_ROOT, "runs")
os.makedirs(RUNS_ROOT, exist_ok=True)


def _resolve_exe() -> str:
    """Locate the AALM engine.

    Default: the copy bundled with the app at "AALM App/EPA AALM/". Override
    with the AALM_EXE environment variable (e.g. for web deployment).
    """
    env = os.environ.get("AALM_EXE")
    if env and os.path.isfile(env):
        return os.path.abspath(env)
    engine_dir = os.path.join(APP_ROOT, "EPA AALM")   # bundled with the app
    for cand in ("AALM_64.exe", "AALM_32.exe"):
        p = os.path.join(engine_dir, cand)
        if os.path.isfile(p):
            return os.path.abspath(p)
    # last resort: return the expected 64-bit path (errors surface at run time)
    return os.path.join(engine_dir, "AALM_64.exe")


EXE_PATH = _resolve_exe()

with open(os.path.join(SHARED_DIR, "defaults.json"), "r", encoding="utf-8") as fh:
    DEFAULTS = json.load(fh)

app = FastAPI(title="AALM Front-End API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ---- optional password protection (HTTP Basic Auth) ------------------------ #
# Set AALM_USER and AALM_PASSWORD (e.g. in the Render dashboard) to require a
# username/password before the app loads. If either is unset (e.g. running
# locally), no password is required.
_AUTH_USER = os.environ.get("AALM_USER")
_AUTH_PASS = os.environ.get("AALM_PASSWORD")
if _AUTH_USER and _AUTH_PASS:
    import base64
    import secrets
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import Response as _Response

    class _BasicAuthMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            if request.url.path == "/api/health" or request.method == "OPTIONS":
                return await call_next(request)          # allow health checks / CORS preflight
            header = request.headers.get("Authorization", "")
            ok = False
            if header.startswith("Basic "):
                try:
                    user, _, pw = base64.b64decode(header[6:]).decode("utf-8").partition(":")
                    ok = (secrets.compare_digest(user, _AUTH_USER)
                          and secrets.compare_digest(pw, _AUTH_PASS))
                except Exception:
                    ok = False
            if not ok:
                return _Response("Authentication required.", status_code=401,
                                 headers={"WWW-Authenticate": 'Basic realm="AALM"'})
            return await call_next(request)

    app.add_middleware(_BasicAuthMiddleware)


# ---- API ------------------------------------------------------------------- #
@app.get("/api/health")
def health():
    return {"ok": True, "exe": os.path.basename(EXE_PATH), "exeFound": os.path.isfile(EXE_PATH)}


@app.get("/api/defaults")
def defaults():
    return DEFAULTS


# ---- run queue ------------------------------------------------------------- #
# Serialize model runs so simultaneous users don't stack memory (a single run can
# use several hundred MB; two at once could exceed a small host's limit). By default
# one run executes at a time and additional requests wait their turn, in arrival
# order. Raise AALM_MAX_CONCURRENT on a host with more memory to allow more.
_MAX_CONCURRENT = max(1, int(os.environ.get("AALM_MAX_CONCURRENT", "1")))
_run_gate = asyncio.Semaphore(_MAX_CONCURRENT)


@app.post("/api/run")
async def run(cfg: RunConfig):
    config = cfg.model_dump()
    if not os.path.isfile(EXE_PATH):
        raise HTTPException(status_code=503,
                            detail=f"Model executable not found at {EXE_PATH}. Set the AALM_EXE environment variable.")

    # Queue: at most _MAX_CONCURRENT run(s) execute at once; others await here in
    # arrival order. The blocking work runs in a threadpool so the server stays
    # responsive to other requests (health checks, the queued waiters) meanwhile.
    async with _run_gate:
        try:
            result = await run_in_threadpool(run_aalm, config, EXE_PATH, RUNS_ROOT)
        except (ValueError, TimeoutError) as e:
            return JSONResponse({"ok": False, "message": str(e)})

        if not os.path.isfile(result.out_csv):
            tail = "\n".join(result.stdout.splitlines()[-25:])
            return JSONResponse({
                "ok": False,
                "message": "The model did not produce an output file. It may have stopped on an input error.",
                "exit": result.exit_code, "runInfo": result.run_info, "log": result.log, "stdoutTail": tail,
            })

        try:
            parsed = await run_in_threadpool(read_out_csv, result.out_csv)
        except Exception as e:  # noqa: BLE001
            return JSONResponse({"ok": False, "message": f"Could not parse model output: {e}"})

    return {
        "ok": True,
        "name": result.name,
        "exit": result.exit_code,
        "columns": parsed["columns"],
        "xYears": parsed["xYears"],
        "series": parsed["series"],
        "summary": parsed["summary"],
        "runInfo": result.run_info,
        "outPath": result.out_csv,
    }


# ---- static frontend (mounted last so /api/* wins) ------------------------- #
class NoCacheStatic(StaticFiles):
    """Serve the frontend without browser caching, so edits always show on refresh."""
    def is_not_modified(self, response_headers, request_headers) -> bool:
        return False

    async def get_response(self, path, scope):
        resp = await super().get_response(path, scope)
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp


if os.path.isdir(FRONTEND_DIR):
    app.mount("/", NoCacheStatic(directory=FRONTEND_DIR, html=True), name="frontend")
