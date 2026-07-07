# Running the AALM App in a Browser with Docker + Wine

This guide takes the AALM app and runs it as a **web app** — reachable in a browser —
without recompiling the model. It does this by running the unmodified Windows engine
(`AALM_64.exe`) on Linux through **Wine**, inside a **Docker** container.

You will do two things:

1. **Build and test it on your own computer** (this proves it works — the hard part).
2. **Deploy it to a public web address** (optional follow-on, needs a hosting account).

> **Read this first — three honest points.**
> - This does **not** run on GitHub Pages. Pages only serves static files; it can't run
>   the engine. Docker + Wine gives you a running **backend** that you host somewhere.
> - **Fidelity:** because the *same* `.exe` runs, results are effectively bit-identical
>   to Windows — **as long as the machine is x86-64** (normal Intel/AMD; not ARM).
> - This setup is **experimental until you complete Part 3** — the go/no-go test is
>   whether the engine reproduces EPA's Example 2 inside the container.

The repository already contains everything the steps below refer to:
`Dockerfile.wine`, `docker/aalm-wine.sh`, and the engine in `EPA AALM/`.

---

## Part 1 — Install Docker Desktop (Windows)

Docker is the tool that builds and runs the Linux container. You install it once.

1. **Turn on virtualization / WSL2** (Docker needs it):
   - Open **PowerShell as Administrator** (right-click Start → *Terminal (Admin)*).
   - Run: `wsl --install`
   - If it asks you to restart, do so. (If WSL is already installed, this does nothing
     harmful.)
2. **Download Docker Desktop:** go to <https://www.docker.com/products/docker-desktop/>
   and click **Download for Windows**.
3. **Install it:** open the downloaded installer, keep the default options (make sure
   **“Use WSL 2”** stays checked), and finish. Restart if prompted.
4. **Start Docker Desktop** from the Start menu. Wait until the whale icon in the
   taskbar stops animating and says **“Engine running.”**
5. **Verify it works.** Open a normal PowerShell window and run:
   ```powershell
   docker --version
   docker run --rm hello-world
   ```
   The second command should print a “Hello from Docker!” message. If it does, Docker is
   ready.

> **Licensing:** Docker Desktop is free for individuals, education, and small
> organizations (fewer than 250 employees **and** under $10M revenue) — a non-profit
> like Pure Earth almost certainly qualifies. If you'd rather not use it, **Rancher
> Desktop** or **Podman Desktop** are free alternatives that run the same commands.

---

## Part 2 — Build the app image

This packages the app + Python + Wine + the engine into one Docker image.

1. Open PowerShell in the **app folder** (the folder containing `Dockerfile.wine`):
   ```powershell
   cd "c:\Users\Abigail Gilbert\AALM_V3-1 1-original\AALM App"
   ```
2. Build the image:
   ```powershell
   docker build -f Dockerfile.wine -t aalm-app .
   ```
   The first build downloads Ubuntu, Wine, and Python and can take **several minutes**.
   You only pay this cost once; later builds are fast. A successful build ends without
   an error and shows the image being tagged `aalm-app`.

---

## Part 3 — Run it and open it in the browser (the go/no-go test)

1. Start the container:
   ```powershell
   docker run --rm -p 8000:8000 aalm-app
   ```
   Leave this window open — it's the running server. (Press **Ctrl+C** to stop it.)
2. Open your browser to: <http://localhost:8000>
   The app should load exactly like the local version.
3. **Validate the engine (this is the important test).** In the app:
   - Reproduce **Example 2**, or any run, and click **Run model**.
   - Confirm you get results and a chart.
   The definitive check is the built-in self-test. Open a **second** PowerShell window
   (leave the server running in the first) and run it in a throwaway container:
   ```powershell
   docker run --rm aalm-app python3 test_core.py
   ```
   A pass prints:
   ```
   PASS: model output reproduces the original Example2 result.
   ALL TESTS PASSED
   ```
   with **peak 2.1926 / mean 0.6163 / final 0.5705**. **If you see this, Wine is running
   the engine faithfully and Option B is viable.** If it fails, see Troubleshooting.

---

## Part 4 — Troubleshooting (Wine-specific)

- **The self-test fails with a Wine/loader error, or the exe “can't start.”**
  The engine may need Intel Fortran runtime libraries that aren't in the base image, or
  the bundled Wine (Ubuntu's is older) may be too old. Try a newer Wine by switching the
  first line of `Dockerfile.wine` to an image that ships current Wine (e.g.
  `FROM scottyhardy/docker-wine:latest`) and rebuild, or install the WineHQ stable repo.
- **Errors mentioning “no display” / `wineboot` hangs.** Wrap the engine call in a
  virtual display: change `docker/aalm-wine.sh`'s last line to
  `exec xvfb-run -a wine64 "/app/EPA AALM/AALM_64.exe" "$@"` and rebuild.
- **Results differ from Windows.** Confirm the host is **x86-64**, not ARM. On Apple
  Silicon or ARM cloud instances, Wine emulates and fidelity/speed suffer — use an
  x86-64 machine/host.
- **Port already in use.** Something else is on 8000. Run on another port:
  `docker run --rm -p 8080:8000 aalm-app` and open <http://localhost:8080>.
- **Rebuild after any change:** re-run the `docker build …` command from Part 2.

---

## Part 5 — Put it on the public web (make it a website for others)

Once Part 3 passes, the **same image** can run on a cloud host so anyone with the link
can use it. The app already serves the frontend and API together on one port, so you
just need to host the container.

Pick one host (all can run a Docker image; all need you to create an account):

- **Fly.io** — good free/low-cost tier, simple for containers.
  ```powershell
  # after installing flyctl and signing in:
  fly launch --dockerfile Dockerfile.wine   # answer the prompts
  fly deploy
  ```
  It gives you a URL like `https://aalm-app.fly.dev`.
- **Google Cloud Run** — pay-per-use, scales to zero.
  ```powershell
  gcloud run deploy aalm-app --source . --port 8000 --allow-unauthenticated
  ```
- **Render** — connect the GitHub repo, choose “Docker,” point it at `Dockerfile.wine`.

Notes:
- **Choose an x86-64 host** (the default on all three) so results stay bit-identical.
- **Cost:** free tiers exist but may “sleep” when idle (a few seconds of cold-start on
  the first request) and have usage limits. A small always-on instance is a few dollars
  a month.
- **Security/scale:** a public URL means anyone can submit runs. For a low-traffic tool
  this is fine; if abuse is a concern, put it behind a simple password or access list.
- **(Optional) split the frontend to GitHub Pages/Netlify.** You can host just the UI as
  a static site and point it at the hosted backend by setting `window.AALM_API_BASE` in
  `frontend/index.html` to the backend URL (CORS is already enabled). Most people should
  skip this and let the one container serve both.

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
relative argument and a set working directory, **no Python code changes are needed** —
the local Windows app is completely unaffected by any of this.
