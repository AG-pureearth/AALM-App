"""
test_core.py — self-test for the AALM backend (run after installing Python deps).

It rebuilds the "Example2" scenario from the shared defaults, checks the generated
LeggettInput.txt against the golden reference, runs the real executable, and confirms
the blood-lead summary matches the known-good values from the original software.

Usage:
    cd backend
    python test_core.py
"""
import json
import os
import sys

from aalm_core import build_leggett_input, read_out_csv
from model_runner import run_aalm

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.dirname(BACKEND_DIR)
RUNS_ROOT = os.path.join(APP_ROOT, "runs")
SHARED = os.path.join(APP_ROOT, "shared", "defaults.json")
GOLDEN = os.path.join(BACKEND_DIR, "golden_TestEx2.txt")


def resolve_exe():
    env = os.environ.get("AALM_EXE")
    if env and os.path.isfile(env):
        return env
    parent = os.path.dirname(APP_ROOT)
    for c in ("AALM_64.exe", "AALM_32.exe"):
        p = os.path.join(parent, c)
        if os.path.isfile(p):
            return p
    return os.path.join(parent, "AALM_64.exe")


def make_example2_config():
    with open(SHARED, "r", encoding="utf-8") as fh:
        cfg = json.load(fh)
    cfg["simName"] = "TestEx2"
    cfg["sim"]["ageMaxYr"] = 50
    # Example2: only the "Other" source is active
    for k in ("soil", "dust", "water", "air", "food"):
        cfg["media"][k]["active"] = False
    cfg["media"]["other"]["active"] = True
    return cfg


def main():
    failures = 0
    cfg = make_example2_config()

    # 1) generated input matches the golden reference
    generated = build_leggett_input(cfg)
    with open(GOLDEN, "r", newline="") as fh:
        golden = fh.read()
    if generated.replace("\r\n", "\n") == golden.replace("\r\n", "\n"):
        print("PASS: generated LeggettInput.txt matches golden reference.")
    else:
        failures += 1
        print("FAIL: generated input differs from golden reference.")
        g1 = generated.replace("\r\n", "\n").splitlines()
        g2 = golden.replace("\r\n", "\n").splitlines()
        for i, (a, b) in enumerate(zip(g1, g2)):
            if a != b:
                print(f"  line {i+1}: got  {a!r}\n           want {b!r}")
                break

    # 2) run the model and check the blood-lead summary
    exe = resolve_exe()
    if not os.path.isfile(exe):
        print(f"SKIP: executable not found at {exe}; cannot run model.")
        sys.exit(1 if failures else 0)

    result = run_aalm(cfg, exe, RUNS_ROOT)
    if not os.path.isfile(result.out_csv):
        failures += 1
        print(f"FAIL: no output file produced (exit {result.exit_code}).")
        print("\n".join(result.stdout.splitlines()[-15:]))
    else:
        parsed = read_out_csv(result.out_csv, max_points=10_000_000)
        s = parsed["summary"]
        expect = {"peakBLL": 2.1926, "meanBLL": 0.6163, "finalBLL": 0.5705}
        print(f"Summary: peak={s['peakBLL']} mean={s['meanBLL']} final={s['finalBLL']} "
              f"(expected peak={expect['peakBLL']} mean={expect['meanBLL']} final={expect['finalBLL']})")
        ok = all(abs(s[k] - expect[k]) < 1e-3 for k in expect)
        if ok:
            print("PASS: model output reproduces the original Example2 result.")
        else:
            failures += 1
            print("FAIL: model summary does not match expected values.")

    print("\nALL TESTS PASSED" if failures == 0 else f"\n{failures} TEST(S) FAILED")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
