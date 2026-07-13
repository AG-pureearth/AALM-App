# Download and Run the AALM App on Your Computer

This guide gets the AALM app running on your own **Windows, Mac, or Linux** computer.
The only program you install is **Docker** — the app and the lead model come together in
one download, so there's nothing else to set up.

The app runs entirely on your computer: you open it in your web browser, enter your
inputs, and it calculates locally. Nothing is sent over the internet.

---

## Step 1 — Install Docker Desktop (one time)

Docker is a free program that runs the app for you.

- **Windows / Mac:** go to <https://www.docker.com/products/docker-desktop/>, click the
  download for your system, open the installer, and keep the default options.
  - On **Windows**, if it asks to enable **WSL 2**, allow it (restart if prompted).
  - On **Mac**, pick the download that matches your chip — **Apple Silicon** (M1/M2/M3/M4)
    or **Intel**. Not sure? Apple menu → **About This Mac** shows it.
- **Linux:** install Docker Engine — <https://docs.docker.com/engine/install/>.

After installing, **start Docker Desktop** and wait until it says the engine is running
(the whale icon in your menu bar / taskbar stops animating). Leave it running.

---

## Step 2 — Download the app

1. Go to the app's page: <https://github.com/AG-pureearth/AALM-App>
2. Click the green **Code** button → **Download ZIP**.
3. Find the downloaded file (usually in **Downloads**) and unzip it
   (Windows: right-click → **Extract All**; Mac: double-click).
4. Open the unzipped folder, then open the **`launchers`** folder inside it.

---

## Step 3 — Start the app

In the `launchers` folder, run the file for your operating system:

- **Windows:** double-click **`Run with Docker (Windows).bat`**
  - If you see a blue **“Windows protected your PC”** box, click **More info → Run
    anyway** (it's your own file).
- **Mac:** double-click **`Run with Docker (Mac).command`**
  - The first time, if it won't open, **right-click the file → Open → Open**. (macOS is
    cautious about downloaded files.)
- **Linux:** run **`Run with Docker (Linux).sh`** (double-click, or in a terminal:
  `sh "Run with Docker (Linux).sh"`).

A small window opens and shows some text.
- **The first time**, it downloads the app (a few minutes). Later starts are quick.
- When it shows **“Uvicorn running”**, the app is ready.
- **Keep this window open** while you use the app.

Your web browser opens automatically to **http://localhost:8000**. If it shows an error
for a moment, wait a few seconds and refresh the page.

> If the browser doesn't open on its own, open it yourself and type **http://localhost:8000**
> into the address bar.

---

## Step 4 — Use the app

Enter your simulation inputs (age, sex, exposure media, etc.), click **Run model**, and
view the results and charts. A short built-in guide pops up the first time to walk you
through it.

---

## Step 5 — Stop the app

When you're finished, **close the small window** that opened in Step 3 (or press
**Ctrl + C** inside it). That shuts the app down. To use it again later, just repeat
Step 3.

---

## If something doesn't work

- **“Docker is not installed or not running.”** Start **Docker Desktop** and wait until
  it says the engine is running, then run the launcher again.
- **The browser says it can't connect.** Make sure the launcher window is still open, wait
  a few seconds for **“Uvicorn running”**, and refresh the page.
- **Mac: the file won't open.** Right-click it → **Open** (first time only). Or, in
  Terminal, run `chmod +x "Run with Docker (Mac).command"` once, then double-click.
- **Apple Silicon Mac (M1–M4):** the app works, but runs a little slower because the lead
  model is a Windows program running under translation. This is normal.
- **It's slow the very first time.** That's the one-time download of the app; it's cached
  afterward, so later runs are fast.

---

## Good to know

- **You only need Docker.** Python, the lead-model engine, and everything else are inside
  the download — you don't install them separately.
- **Getting updates:** the launcher automatically fetches the latest version each time you
  run it, so you stay current.
- **Advanced:** you don't strictly need the whole ZIP — the launcher alone is enough,
  because it downloads the app image (`ghcr.io/ag-pureearth/aalm-app`) which contains
  everything.
