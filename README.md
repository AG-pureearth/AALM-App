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
- A **guided walkthrough** (spotlight bubbles) auto-starts on first visit and can be
  replayed with the **Guide** button, stepping users through naming a run, setting
  exposures, and viewing results.

The app is a **web app** — a browser front-end plus a small REST API that runs the
engine — so you use it entirely in a web browser. There is no desktop program to install.

---

## Open the app in your browser

The AALM v3.1 engine is **bundled with the app** (in the `EPA AALM/` folder), so there is
nothing to download from EPA. There are two ways to load the app in a browser:

### Option 1 — Hosted online (a public link)

> **Live URL:** _not deployed yet._
>
> To create one, follow **[Deploying with Docker and Wine.md](Deploying%20with%20Docker%20and%20Wine.md)**.
> It packages the app (engine included) and hosts it at a public web address — e.g. on
> Render, Fly.io, or Google Cloud Run. Once deployed, paste the URL here; anyone with the
> link then opens the app in their browser with **nothing to install**.

### Option 2 — Run it with Docker, then open it in your browser

Works on any computer (Windows, macOS, or Linux). Docker runs the app — the Windows
engine included, via Wine — and serves it to your browser at `http://localhost:8000`.
This is also the basis for the hosted option above. The full walkthrough, including how
to install Docker, is in
**[Deploying with Docker and Wine.md](Deploying%20with%20Docker%20and%20Wine.md)**; in short:

1. Get the app from GitHub — on <https://github.com/AG-pureearth/AALM-App> click
   **Code ▸ Download ZIP** and extract it (or `git clone`), then open a terminal in the
   app folder (the one containing `Dockerfile.wine`).
2. Install **Docker Desktop** (<https://www.docker.com/products/docker-desktop/>).
3. Build and run:
   ```bash
   docker build -f Dockerfile.wine -t aalm-app .
   docker run --rm -p 8000:8000 aalm-app
   ```
4. Open <http://localhost:8000> in your browser.

### For developers

To run the backend directly (no Docker): from `backend/`, create a virtualenv,
`pip install -r requirements.txt`, then `python -m uvicorn app:app --reload --port 8000`
and open <http://localhost:8000/> (interactive API docs at `/docs`). The engine is found
in `EPA AALM/` by default; override with the `AALM_EXE` environment variable.

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

## Software it's built with

The key thing to know: **you only install two things yourself** — Docker and a web
browser. Almost everything else is either bundled with the app or installed
automatically inside the Docker container.

**What you install on your computer**

| Software | Why |
|----------|-----|
| **Docker Desktop** | Builds and runs the whole app in a container. On Windows it uses **WSL2** (a lightweight Linux layer) under the hood, which Docker sets up for you. |
| **A web browser** | To use the app — the screens appear at `http://localhost:8000`. You already have one. |

**Bundled with the app** (no install needed)

| Software | Role |
|----------|------|
| **AALM engine — `AALM_64.exe`** | The lead model itself: a compiled Fortran program from EPA, in the `EPA AALM/` folder. |
| **Frontend (HTML / CSS / JavaScript)** | The screens you interact with, running in your browser. No framework or build tools (no Node.js) — deliberately dependency-free. |

**Installed automatically inside the container** (via `Dockerfile.wine`)

| Software | Role |
|----------|------|
| **Ubuntu Linux** | The operating system the container runs on. |
| **Wine** | Runs the **Windows** `AALM_64.exe` on **Linux** — the bridge that makes hosting possible. |
| **Python 3** | Runs the backend. |
| **FastAPI** | Web framework — serves the UI and the `/api/run` endpoint. |
| **Uvicorn** | The web server that runs FastAPI and listens on port 8000. |

FastAPI and Uvicorn are the only two entries in `backend/requirements.txt`; they pull in
a few small helper libraries automatically.

```
Your browser  ──►  Uvicorn + FastAPI (Python)  ──►  Wine  ──►  AALM_64.exe
   (the UI)          the web server / API            bridge      the model
        └──────────── all inside one Docker container (Ubuntu) ──────────┘
```

Hosting the app publicly later needs one more thing — a cloud host account (and possibly
its command-line tool) — but that is **not** required to run the app on your own machine.

---

## Run it as a desktop app (any OS — install only Docker)

For a downloadable app that runs the same on **Windows, macOS, and Linux**, use the
**prebuilt Docker image**. The **only** software a user installs is **Docker Desktop** —
the app, the engine, Python, and Wine are all inside the image, so there's nothing else
to install and nothing to build.

1. Install **Docker Desktop** (<https://www.docker.com/products/docker-desktop/>) and
   start it.
2. Download the launcher for your operating system from the [`launchers/`](launchers/)
   folder:
   - **Windows:** `Run with Docker (Windows).bat`
   - **macOS:** `Run with Docker (Mac).command`
   - **Linux:** `Run with Docker (Linux).sh`
3. **Double-click** the launcher. The first run downloads the app image (a few minutes);
   later runs are quick. Your browser opens to <http://localhost:8000>.

Notes:
- The launcher just runs the published image (`ghcr.io/ag-pureearth/aalm-app`), so a user
  doesn't even need the rest of the repo — the image contains everything.
- On a personal computer there's plenty of memory, so the short-run caps aren't needed —
  see *Simulation limits* below to restore the full range for a local build.
- **macOS:** if double-clicking doesn't run it, right-click → **Open** the first time, or
  run `chmod +x "Run with Docker (Mac).command"` once in Terminal. (Downloaded ZIPs don't
  always keep the “executable” flag.)
- The image is rebuilt and republished automatically by a GitHub Action
  (`.github/workflows/publish-image.yml`) on every push to `main`, so it stays current.

> **Maintainer, one-time setup:** the first time the GitHub Action publishes the image it
> is **private**. Make it public so users can pull it without signing in: on GitHub go to
> your profile → **Packages** → **aalm-app** → **Package settings** →
> **Change visibility → Public**.

---

## Simulation limits (and how to restore the full range)

To fit within a **free 512 MB host** (such as Render's free tier), this app ships with
**reduced defaults and input caps** — a long or high-resolution run needs several GB of
memory, which a free host doesn't have.

| Setting | This build | Original |
|---------|-----------|----------|
| Default steps per day | **25** | 100 |
| Default output interval (`outwrite`) | **25** | 100 |
| Maximum steps per day | **25** | (uncapped) |
| Maximum simulation length (end − start age) | **15 years** | (uncapped) |

These keep every run under ~512 MB. A message on the Simulation inputs tab tells users
about the limits.

### Restoring the original, full-capability settings

If you host somewhere with more memory (Hugging Face's 16 GB free tier, Google Cloud Run,
or your own computer), you can restore the original behaviour:

1. **Defaults** — in `shared/defaults.json`, under `"sim"`, set:
   - `"stepsPerDay": 100`   (currently `25`)
   - `"outwrite": 100`      (currently `25`)
2. **Input caps** — in `frontend/js/app.js`, in the `renderSimulation` function:
   - raise or remove the simulation-length limit: change `const MAX_AGE_SPAN = 15;` to a
     larger number (or remove the `validateAgeSpan` check)
   - change the steps-per-day field's `{ min: 1, max: 25, step: 1 }` back to `{ min: 1, step: 1 }`
   - remove the on-screen limits note (the `media-doc-note` paragraph mentioning
     “15 years and 25 steps per day”)
3. Bump the asset version in `frontend/index.html` (e.g. `?v=22` → `?v=23`) so browsers
   load the change.

**Original defaults:** `stepsPerDay` = **100**, `outwrite` = **100**, with **no cap** on
simulation length or resolution.

---

## Host it on the web

The recommended path is the **Docker + Wine** image: it runs the unmodified Windows
engine on a Linux host with **no recompilation**, then deploys the same container to a
public URL (Render, Fly.io, or Google Cloud Run). This has been verified to reproduce the
Example 2 result inside the container. Full, tested walkthrough:
**[Deploying with Docker and Wine.md](Deploying%20with%20Docker%20and%20Wine.md)**.

The engine (`AALM_64.exe`) is the one platform-specific piece — a Windows binary — so it
either runs under **Wine** (the Docker path above) or is recompiled from the AALM Fortran
source (`AALM31_Fortran.f90`, part of the EPA distribution) for the target OS.
`model_runner.py` is the only file that invokes the engine; the API and UI are unaffected.
If you host the frontend separately (e.g. GitHub Pages / Netlify), point it at the API with
`window.AALM_API_BASE` in `frontend/index.html` (CORS is already enabled).

---

## Project layout

```
AALM App/
  Deploying with Docker and Wine.md  build + run + hosting guide
  Dockerfile.wine         container image that runs the engine via Wine
  docker/aalm-wine.sh     wrapper: runs the Windows engine under Wine
  README.md
  EPA AALM/               bundled model engine (AALM_64.exe, AALM_32.exe)
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
  Archived files/         not needed to run via Docker + Wine (kept for reference)
```

Model support for the underlying engine: brown.james@epa.gov and PbHelp@epa.gov.
