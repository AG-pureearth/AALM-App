# AALM Browser Front-End

A browser-based front-end for the **All Ages Lead Model (AALM) v3.1**. It replaces the
two Excel workbooks with a web app: enter parameters in the browser, run the model,
and view blood-lead and tissue-concentration results — all backed by the original
`AALM_64.exe` engine.

- **Inputs** mirror `AALM_Inputs_v3-1.xlsm` (simulation, exposure media, growth,
  physiology, lung, and the allowable-concentration solver).
- **Results** mirror `AALM_ExploreData_v3-1.xlsm` (summary statistics + interactive
  time-series charts of blood lead and other compartments).
- There is **no “import a parameter file” function** — inputs are entered directly in
  the UI, by design.
- A **guided walkthrough** (spotlight bubbles) auto-starts on first visit and can be
  replayed with the **Guide** button, stepping users through naming a run, setting
  exposures, and viewing results.

The app is built as a portable **static frontend + REST API** so it runs locally now
and can be deployed to the web later (see *Deployment*).

---

## Run it locally (Windows)

1. Install **Python 3** from <https://www.python.org/downloads/> — during setup,
   tick **“Add Python to PATH.”** (One-time.)
2. Double-click **`Start AALM App.bat`**.
   - On first run it creates a private virtual environment and installs FastAPI/uvicorn.
   - It then starts the server and opens <http://localhost:8000/> in your browser.
3. Keep the console window open while using the app; close it to stop the server.

### Manual start (any OS, for developers)

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

Open <http://localhost:8000/>. Interactive API docs are at `/docs`.

The backend finds the model at `..\AALM_64.exe` by default; override with the
`AALM_EXE` environment variable.

---

## Verify the engine

After installing the dependencies, confirm the backend reproduces a known result:

```bash
cd backend
python test_core.py
```

This rebuilds the original **Example 2** scenario, checks the generated
`LeggettInput.txt` against `golden_TestEx2.txt`, runs the executable, and confirms the
blood-lead summary matches the original software (peak ≈ 2.1926, mean ≈ 0.6163,
final ≈ 0.5705 µg/dL).

---

## How it works

```
frontend/ (static SPA)  ──HTTP/JSON──►  backend/ (FastAPI)
  index.html, js, css                     app.py        REST API + serves frontend
                                          models.py     request schema
                                          aalm_core.py  config → LeggettInput.txt, parse Out_*.csv
                                          model_runner.py  ⟵ the ONLY place the .exe is invoked
shared/defaults.json   ← single source of truth for default parameter values
runs/<SimName>/        ← generated input + CSV outputs per run (git-ignored)
```

1. The browser builds a complete run **config** (from the form + `defaults.json`).
2. `POST /api/run` sends it to FastAPI.
3. `aalm_core.build_leggett_input` formats it into the exact `LeggettInput.txt` the
   engine expects; `model_runner.run_aalm` writes it, runs the executable, and the
   `Out_<name>.csv` is parsed, down-sampled, and returned as JSON.
4. The frontend renders summary cards and an interactive chart.

**API**
| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/health`   | server + executable status |
| `GET`  | `/api/defaults` | canonical default configuration |
| `POST` | `/api/run`      | run a configuration, return parsed results |

---

## Deployment (web, later)

The frontend and API are host-agnostic. The one platform-specific piece is the
**model binary**, because `AALM_64.exe` is a Windows executable.

To deploy to a typical Linux host or container:

1. Provide a model binary for the target OS — either recompile the Fortran source
   (`code/AALM31_Fortran.f90`) for Linux, or have `model_runner.py` call out to a
   separate Windows host/service.
2. Set `AALM_EXE` to that binary's path. **`model_runner.py` is the only file that
   needs to change** — the API and UI are unaffected.
3. Build and run the container (see `Dockerfile`), or host the frontend statically and
   the API on any Python host (Render, Fly.io, Azure App Service, a VM, etc.). If the
   frontend is served from a different origin than the API, set `window.AALM_API_BASE`
   in `frontend/index.html` to the API URL (CORS is already enabled).

---

## Project layout

```
AALM App/
  Start AALM App.bat      one-click local launcher (Windows)
  Dockerfile              container image for web deployment
  README.md
  Summary.md              model overview
  Input Variables.md      parameter reference
  shared/
    defaults.json         canonical default parameter values
  backend/
    app.py                FastAPI app (API + static hosting)
    aalm_core.py          input builder + output parser
    model_runner.py       isolated executable invocation (swap point for deploy)
    models.py             API request model
    requirements.txt
    test_core.py          self-test vs. original Example 2
    golden_TestEx2.txt    reference input for the self-test
  frontend/
    index.html
    css/styles.css
    js/schema.js          parameter labels, units, definitions, options
    js/charts.js          dependency-free SVG charts
    js/app.js             form generation, run, results
  runs/                   generated per-run inputs/outputs (created at runtime)
```

Model support for the underlying engine: brown.james@epa.gov and PbHelp@epa.gov.
