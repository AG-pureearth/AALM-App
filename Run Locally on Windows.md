# Run the AALM App Locally on Windows (no Docker)

Run the app on your own Windows PC and use it in your browser at a local web address:
**<http://localhost:8000>**. No Docker, no Wine, no PowerShell — just **Python**.

> **Why this is simpler on Windows.** The lead-model engine (`AALM_64.exe`) is a Windows
> program, so on Windows it runs directly — Docker and Wine aren't needed (those are only
> for hosting online or running on Mac/Linux). This guide is **Windows-only**.

---

## What you need

- A **Windows** PC.
- **Python 3** — a free, one-time install.
- The **app folder** (this repository). The engine is already included, in `EPA AALM/`.

---

## Step 1 — Install Python 3 (one time)

1. Go to <https://www.python.org/downloads/> and click **Download Python 3.x**.
2. Open the installer. On the first screen, **tick “Add python.exe to PATH.”**
3. Click **Install Now**, then **Close**.

You never open Python yourself — the app uses it in the background.

---

## Step 2 — Start the app

### Easiest: double-click the launcher

1. Open the **app folder** (the one containing `Start AALM App.bat`).
2. Double-click **`Start AALM App.bat`**.
   - The first time, it spends about a minute setting itself up (creating a small private
     environment and installing two web libraries). Later starts are quick.
   - A **black window** opens and stays open — that's the app's server. **Keep it open**
     while you use the app.
3. Your browser opens to **<http://localhost:8000>**. If it shows an error for a second,
   wait a few seconds and refresh the page.

### Alternative: Command Prompt (no launcher)

If you prefer typing commands, or the launcher isn't present:

1. Open **Command Prompt** (press Start, type `cmd`, press Enter). *(This is Command
   Prompt, not PowerShell.)*
2. Go to the app's `backend` folder — replace the path with where your app folder is:
   ```bat
   cd /d "C:\Users\<you>\AALM App\backend"
   ```
3. The first time only, create the environment and install the libraries:
   ```bat
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```
4. Start the server (do this each time you want to run the app):
   ```bat
   .venv\Scripts\python -m uvicorn app:app --port 8000
   ```
5. Open **<http://localhost:8000>** in your browser.

---

## Step 3 — Use the app

The app is now at **<http://localhost:8000>** — a private address that works **only on
this computer**. Set your inputs, click **Run model**, and view the results. You can
bookmark the address for next time.

---

## Step 4 — Stop the app

Close the **black server window** (or press **Ctrl + C** inside it). The app shuts down;
the local address stops working until you start it again.

---

## If something doesn't work

- **“Python was not found.”** Python isn't installed, or the **“Add python.exe to PATH”**
  box wasn't ticked. Redo **Step 1** with that box checked.
- **The browser says it can't connect.** Make sure the black server window is still open,
  wait a few seconds, and refresh.
- **A model run fails or seems to hang.** A run can use around **3 GB of memory**; a
  typical PC handles it, but very long simulations need more. Close other heavy programs
  and try again.

---

## Notes

- **“Locally-hosted” means it runs only on your machine.** The `http://localhost:8000`
  address is not reachable by anyone else. To give others a link they can open, you need
  to host it — see **[Deploying with Docker and Wine.md](Deploying%20with%20Docker%20and%20Wine.md)**.
- This native Windows path and the Docker path are independent ways to run the same app;
  you don't need both.
