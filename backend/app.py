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
import json
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

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
    """Locate AALM_64.exe (override with the AALM_EXE environment variable)."""
    env = os.environ.get("AALM_EXE")
    if env and os.path.isfile(env):
        return os.path.abspath(env)
    parent = os.path.dirname(APP_ROOT)            # the original software folder
    for cand in ("AALM_64.exe", "AALM_32.exe"):
        p = os.path.join(parent, cand)
        if os.path.isfile(p):
            return os.path.abspath(p)
    # last resort: return the expected 64-bit path (errors surface at run time)
    return os.path.join(parent, "AALM_64.exe")


EXE_PATH = _resolve_exe()

with open(os.path.join(SHARED_DIR, "defaults.json"), "r", encoding="utf-8") as fh:
    DEFAULTS = json.load(fh)

app = FastAPI(title="AALM Front-End API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


# ---- API ------------------------------------------------------------------- #
@app.get("/api/health")
def health():
    return {"ok": True, "exe": os.path.basename(EXE_PATH), "exeFound": os.path.isfile(EXE_PATH)}


@app.get("/api/defaults")
def defaults():
    return DEFAULTS


@app.post("/api/run")
def run(cfg: RunConfig):
    config = cfg.model_dump()
    if not os.path.isfile(EXE_PATH):
        raise HTTPException(status_code=503,
                            detail=f"Model executable not found at {EXE_PATH}. Set the AALM_EXE environment variable.")
    try:
        result = run_aalm(config, EXE_PATH, RUNS_ROOT)
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
        parsed = read_out_csv(result.out_csv)
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
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
