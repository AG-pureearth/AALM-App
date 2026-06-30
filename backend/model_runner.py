"""
model_runner.py — the ONLY module that knows how to execute the AALM model.

Isolating execution here means deploying to a different environment (a Linux build
of the Fortran model, a container, or a remote compute service) is a change to this
one file; the API and core logic are unaffected.

Local default: invoke the Windows executable AALM_64.exe exactly the way the
original software does — set the working directory to the runs root, create a
subfolder named after the run, and pass "<name>/LeggettInput.txt" as the argument.
Outputs land in runs/<name>/.
"""
from __future__ import annotations
import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from typing import Any, Dict

from aalm_core import build_leggett_input

NAME_RE = re.compile(r"^[A-Za-z0-9_]{1,19}$")


@dataclass
class RunResult:
    name: str
    run_dir: str
    input_path: str
    out_csv: str
    exit_code: int
    stdout: str
    stderr: str
    run_info: str
    log: str


def _read_first(run_dir: str, prefix: str) -> str:
    try:
        for fn in os.listdir(run_dir):
            if fn.startswith(prefix):
                with open(os.path.join(run_dir, fn), "r", errors="replace") as fh:
                    return fh.read()
    except FileNotFoundError:
        pass
    return ""


def run_aalm(cfg: Dict[str, Any], exe_path: str, runs_root: str, timeout_sec: int = 600) -> RunResult:
    name = str(cfg["simName"] if isinstance(cfg, dict) else cfg.simName)
    if not NAME_RE.match(name):
        raise ValueError(
            "Invalid simulation name '%s' (use letters, digits, underscore; under 20 characters)." % name
        )

    run_dir = os.path.join(runs_root, name)
    if os.path.isdir(run_dir):
        shutil.rmtree(run_dir)
    os.makedirs(run_dir, exist_ok=True)

    input_text = build_leggett_input(cfg)
    input_path = os.path.join(run_dir, "LeggettInput.txt")
    with open(input_path, "w", newline="") as fh:
        fh.write(input_text)

    arg = f"{name}/LeggettInput.txt"
    try:
        proc = subprocess.run(
            [exe_path, arg],
            cwd=runs_root,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
        stdout, stderr, code = proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as e:
        raise TimeoutError(f"AALM run timed out after {timeout_sec} seconds.") from e

    return RunResult(
        name=name,
        run_dir=run_dir,
        input_path=input_path,
        out_csv=os.path.join(run_dir, f"Out_{name}.csv"),
        exit_code=code,
        stdout=stdout,
        stderr=stderr,
        run_info=_read_first(run_dir, "RunInfo_"),
        log=_read_first(run_dir, "Log_"),
    )
