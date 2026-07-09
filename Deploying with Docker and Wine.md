# Running the AALM App in a Browser (Docker + Wine)

This runs the AALM app as a **web app you open in a browser**, without recompiling the
model: the unmodified Windows engine (`AALM_64.exe`) runs on Linux through **Wine**,
inside a **Docker** container.

You've already installed Docker, so the first part below is just a couple of commands.
The second part — putting it on a public URL so *anyone* can use it — is optional and
comes later.

> The engine, the UI, Python, Wine, and the web server are all included in the image.
> The repository already contains what the steps refer to: `Dockerfile.wine`,
> `docker/aalm-wine.sh`, and the engine in `EPA AALM/`.

---

## Part 1 — Run it in your browser (on your own computer)

### Step 1 — Open a terminal in the app folder

Open **PowerShell** and go to the app folder (the one containing `Dockerfile.wine`):

```powershell
cd "c:\Users\Abigail Gilbert\AALM_V3-1 1-original\AALM App"
```

### Step 2 — Build the app image (first time only)

```powershell
docker build -f Dockerfile.wine -t aalm-app .
```

The first build downloads Ubuntu, Wine, and Python and takes **several minutes**. You
only do this once — repeat it later only if you change the app.

### Step 3 — Start the app

```powershell
docker run --rm -p 8000:8000 aalm-app
```

Leave this window open — it's the running server. (Press **Ctrl+C** to stop it.)

### Step 4 — Open it in your browser

Go to **<http://localhost:8000>**. Use the app normally: set your inputs, click
**Run model**, and view the results.

**That's it.** To use the app again another day, just repeat **Step 3** (no rebuild
needed). Only re-run Step 2 after you've changed the app's files.

> **If a model run fails with “did not produce an output file”:** a run can use about
> **3 GB of RAM** (more for very long simulations). Docker Desktop's default is usually
> enough, but if you hit this, open **Docker Desktop ▸ Settings ▸ Resources** and raise
> the **Memory** limit to **4 GB or more**, then try again.

> **Optional confidence check.** In a *second* PowerShell window (leave the server
> running), run the built-in self-test:
> ```powershell
> docker run --rm aalm-app python3 test_core.py
> ```
> It should end with `ALL TESTS PASSED` and **peak 2.1926 / mean 0.6163 / final 0.5705**,
> confirming the engine reproduces EPA's Example 2 exactly.

---

## Part 2 — If something doesn't work

- **“Port is already in use.”** Something else is on port 8000. Use another:
  `docker run --rm -p 8080:8000 aalm-app`, then open <http://localhost:8080>.
- **A run fails / empty results.** Raise Docker's memory (see the note above). If you
  updated the app, rebuild with Step 2 first.
- **The self-test shows `exit 127`.** "Wine command not found." The wrapper
  `docker/aalm-wine.sh` auto-detects the Wine loader name; if you saw this on an older
  copy, download the latest files and rebuild (Step 2).
- **Results differ from Windows.** Make sure the computer is **x86-64** (normal
  Intel/AMD, not ARM). On ARM, Wine emulates and results/speed suffer.

---

## Part 3 — Next steps: put it on a public URL

Everything above runs the app **only on your computer** (`localhost` works just for you).
To let anyone open it by typing a web address, the **same image** runs on an always-on
cloud host, which gives you a public `https://…` URL. The app already serves the UI and
the API together on one port, so there's nothing to split up — you just host the container.

### The one thing that shapes the choice: memory

Testing showed a model run peaks at about **3 GB of RAM** (and more for long
simulations). This rules out the **free tiers** of cloud hosts, which cap at 512 MB — the
app needs a few GB. That's the main cost driver.

### Recommended host: Google Cloud Run

For an app used in bursts (someone runs a model, reads results, leaves), **Cloud Run** is
the best fit: it **charges only while a run is actually computing** and scales to zero
when idle, while still allowing the several GB of RAM each run needs.

- **Cost:** likely **free to a few dollars a month** for occasional use (a fraction of a
  cent per run, under a generous monthly free allowance).
- **Trade-off:** the first visit after it's been idle waits ~15–30 seconds while it wakes
  up (“cold start”).

**Alternatives** (if you prefer no cold-start and a predictable flat bill):

- **Render** — connect the GitHub repo, choose “Docker,” point it at `Dockerfile.wine`.
  Needs its ~4 GB plan (about $85/month) because smaller plans lack the RAM.
- **Fly.io** — deploy the image with `flyctl`; a ~4 GB machine with auto-stop is roughly
  $20–30/month, less if it sleeps when idle.

### What each of us does

- **You (one-time, ~5 min):** create the host account and enable billing. A credit card
  is required even when usage is free — it's how the host verifies the account. **This
  part must be you** (your identity and payment).
- **Me (the rest):** install the host's command-line tool on your machine, build and
  upload the image, and deploy it with the right settings — for Cloud Run that's about
  **8 GB RAM, one run at a time, scale-to-zero**:
  ```powershell
  gcloud run deploy aalm-app --source . --port 8000 \
     --memory 8Gi --cpu 2 --concurrency 1 --timeout 900 --allow-unauthenticated
  ```
  Then I hand you the public URL and paste it into the README so it's the “Live URL.”

### A couple of things to know

- **Pick an x86-64 host** (the default on all three) so results stay identical to Windows.
- **Anyone with the link can submit runs.** For a low-traffic tool that's fine; if abuse
  is a concern later, we can put it behind a simple password.

When you've picked a host and made the account, tell me and I'll drive the deployment.

---

## How it works (for reference)

```
Browser ──HTTP──> Docker container (on your PC, then on a cloud host)
                    ├─ FastAPI backend  (serves the UI + /api/run)
                    ├─ Python           (runs the app)
                    └─ Wine ──runs──>  AALM_64.exe   (the unmodified engine)
```

The only new moving part is Wine. The app is pointed at `docker/aalm-wine.sh` through the
`AALM_EXE` environment variable (set in `Dockerfile.wine`); that wrapper runs the Windows
engine under Wine. Because `model_runner.py` already invokes the engine by path with a
relative argument and a set working directory, **no Python code changes are needed**.

---

## Appendix — Installing Docker (for reference)

You've already done this, but for a fresh machine:

1. **Enable WSL2:** in **PowerShell (Admin)** run `wsl --install`, and restart if asked.
2. **Install Docker Desktop:** from <https://www.docker.com/products/docker-desktop/>,
   keeping **“Use WSL 2”** checked.
3. **Verify:** `docker run --rm hello-world` prints a “Hello from Docker!” message.

Docker Desktop is free for a non-profit like Pure Earth. Free alternatives that run the
same commands: **Rancher Desktop** or **Podman Desktop**.
