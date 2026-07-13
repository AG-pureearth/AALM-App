# AALM Browser Front-End

A browser-based front-end for the **All Ages Lead Model (AALM) v3.1**. It replaces the
two Excel workbooks with a web app: enter parameters in the browser, run the model,
and view blood-lead and tissue-concentration results — all backed by the original
`AALM_64.exe` engine.

- The UI is organized into three tabs: **Simulation inputs** (simulation settings,
  exposure media, and the allowable-concentration solver), **Advanced options**
  (growth, physiology, and lung parameters — opt-in), and **Results**.
- **Inputs** mirror `AALM_Inputs_v3-1.xlsm`.
- **Results** mirror `AALM_ExploreData_v3-1.xlsm` (a dedicated results page with
  interactive summary statistics — click a stat to annotate the chart — and
  time-series charts of blood lead and other compartments).
- There is **no “import a parameter file” function** — inputs are entered directly in
  the UI, by design.
- A **guided walkthrough** (spotlight bubbles) auto-starts and can be replayed with the
  **Guide** button, stepping users through naming a run, setting exposures, and viewing
  results.

The app runs on **your own computer** and opens in your **web browser**. It's packaged as
a Docker image, so the only thing you install is **Docker** — the AALM engine, Python, and
everything else come bundled. It runs the same on Windows, macOS, and Linux.

---

## Run it on your computer (any OS)

The only software a user installs is **Docker Desktop** — the app, the AALM engine,
Python, and Wine are all inside a **prebuilt image**, so there's nothing else to install
and nothing to build.

1. Install **Docker Desktop** (<https://www.docker.com/products/docker-desktop/>) and
   start it.
2. Download the app from GitHub — click **Code ▸ Download ZIP** and extract it — then open
   the [`launchers/`](launchers/) folder and run the launcher for your system:
   - **Windows:** `Run with Docker (Windows).bat`
   - **macOS:** `Run with Docker (Mac).command`  (first time: right-click → **Open**)
   - **Linux:** `Run with Docker (Linux).sh`
3. The first run downloads the app image (a few minutes); later runs are quick. Your
   browser opens to <http://localhost:8000>.

A full step-by-step, non-technical guide is in
**[Download and Run on Your Computer.md](Download%20and%20Run%20on%20Your%20Computer.md)**.

Notes:
- The launcher just runs the published image (`ghcr.io/ag-pureearth/aalm-app`), which
  contains everything — a user doesn't even need the rest of the repo.
- The image is rebuilt and republished automatically by a GitHub Action
  (`.github/workflows/publish-image.yml`) on every push to `main`, so it stays current.

> **Maintainer, one-time setup:** the first time the GitHub Action publishes the image it
> is **private**. Make it public so users can pull it without signing in: on GitHub go to
> your profile → **Packages** → **aalm-app** → **Package settings** →
> **Change visibility → Public**.

### For developers

To run the backend directly (no Docker): from `backend/`, create a virtualenv,
`pip install -r requirements.txt`, then `python -m uvicorn app:app --reload --port 8000`
and open <http://localhost:8000/> (interactive API docs at `/docs`). The engine is found
in `EPA AALM/` by default; override with the `AALM_EXE` environment variable. To build the
image yourself instead of pulling the prebuilt one:
`docker build -f Dockerfile.wine -t aalm-app .` then `docker run --rm -p 8000:8000 aalm-app`.

---

## Verify the engine

Confirm the backend reproduces a known result:

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

## Software it's built with

The only software a user installs is **Docker** and a **web browser**. Everything else is
either bundled with the app or installed automatically inside the Docker image.

**What you install**

| Software | Why |
|----------|-----|
| **Docker Desktop** | Runs the whole app in a container. On Windows it uses **WSL2** (a lightweight Linux layer), which Docker sets up for you. |
| **A web browser** | To use the app — the screens appear at `http://localhost:8000`. You already have one. |

**Bundled with the app** (no install needed)

| Software | Role |
|----------|------|
| **AALM engine — `AALM_64.exe`** | The lead model itself: a compiled Fortran program from EPA, in the `EPA AALM/` folder. |
| **Frontend (HTML / CSS / JavaScript)** | The screens you interact with, running in your browser. No framework or build tools (no Node.js). |

**Installed automatically inside the image** (via `Dockerfile.wine`)

| Software | Role |
|----------|------|
| **Ubuntu Linux** | The operating system the container runs on. |
| **Wine** | Runs the **Windows** `AALM_64.exe` on Linux/Mac — the bridge that makes it cross-platform. |
| **Python 3** | Runs the backend. |
| **FastAPI** | Web framework — serves the UI and the `/api/run` endpoint. |
| **Uvicorn** | The web server that runs FastAPI and listens on port 8000. |

FastAPI and Uvicorn are the only two entries in `backend/requirements.txt`.

```
Your browser  ──►  Uvicorn + FastAPI (Python)  ──►  Wine  ──►  AALM_64.exe
   (the UI)          the web server / API            bridge      the model
        └──────────── all inside one Docker container (Ubuntu) ──────────┘
```

---

## Project layout

```
AALM App/
  Download and Run on Your Computer.md  end-user guide (any OS)
  launchers/              one-click launchers (Windows / Mac / Linux)
  Dockerfile.wine         container image that runs the engine via Wine
  docker/aalm-wine.sh     wrapper: runs the Windows engine under Wine
  .github/workflows/      GitHub Action that publishes the prebuilt image
  README.md
  EPA AALM/               bundled model engine (AALM_64.exe, AALM_32.exe)
  shared/
    defaults.json         canonical default parameter values
  backend/
    app.py                FastAPI app (API + static hosting)
    aalm_core.py          input builder + output parser
    model_runner.py       isolated executable invocation
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
  Archived files/         older files kept for reference (not used to run the app)
```

Model support for the underlying engine: brown.james@epa.gov and PbHelp@epa.gov.
