# How to Run the AALM App

A simple, step-by-step guide. No technical background needed.

There are two parts:
- **Part 1 — Run it on your own computer** (do this first).
- **Part 2 — Put it on the web later** (optional, needs some help from an IT person).

---

## Part 1 — Run it on your computer

You only do Steps 1–3 once. After that, running the app is just Step 4.

### Step 1 — Keep the app folder in the right place

The app lives in a folder called **`AALM App`**, inside your main AALM folder:

```
C:\Users\Abigail Gilbert\AALM_V3-1 1-original\AALM App
```

**Important rules:**
- Keep the **`AALM App`** folder *inside* the `AALM_V3-1 1-original` folder, next to the
  file named **`AALM_64.exe`**. The app needs that file to do its calculations.
- Keep everything under your user folder (the `C:\Users\Abigail Gilbert\...` area).
  The model will **not** work properly if you move it into **Documents**, **OneDrive**,
  or a shared **network drive**.

You do **not** have to place or move any program files yourself. Everything the app
needs is already inside the `AALM App` folder. (You will install one free program —
Python — in the next step, but that installs itself automatically; you don't move any
files by hand.)

### Step 2 — Install Python (a free program the app needs)

Python is a small, free program that runs the app behind the scenes. You install it
once.

1. Open your web browser and go to: **https://www.python.org/downloads/**
2. Click the big yellow button that says **“Download Python 3.x”** (the exact numbers
   don’t matter).
3. Open the file you just downloaded to start the installer.
4. **This part matters:** on the very first installer screen, tick the box at the
   bottom that says **“Add python.exe to PATH.”**
5. Click **“Install Now”** and wait for it to finish. Click **Close** when done.

That’s it — you won’t need to open Python yourself. The app uses it automatically.

### Step 3 — Allow the app to run (first time only)

Windows is cautious about new files. If you ever see a blue **“Windows protected your
PC”** box when starting the app, click **“More info,”** then **“Run anyway.”** This is
safe — it’s your own file.

### Step 4 — Start the app

1. Open the **`AALM App`** folder.
2. Double-click the file named **`Start AALM App.bat`**.
3. A black window opens and shows some text. The first time, it spends a minute setting
   itself up — this is normal. (Later starts are quick.)
4. Your web browser opens automatically to the app. If it shows an error for a moment,
   wait a few seconds and refresh the page.

**Keep the black window open while you use the app.** It is the engine running in the
background. When you’re finished, simply close that black window to shut the app down.

> If the browser doesn’t open on its own, open your browser and type this into the
> address bar: **http://localhost:8000** — this is a private address that only works on
> your own computer.

---

## How to use the app

> **First time?** When the app opens, a short **step-by-step guide** pops up and walks
> you through everything below. You can close it any time, and replay it later by
> clicking the **❓ Guide** button at the top right.

The app has three tabs across the top: **Simulation inputs**, **Advanced options**,
and **Results**.

1. **Name your run.** On the **Simulation inputs** tab, type a short **Simulation
   name** (letters, numbers, and underscores only — for example `City_Test1`).
2. **Set the basics.** Choose the start and end **age** (in years), the **sex**, and
   leave the other settings as they are unless you have a reason to change them.
3. **Set the exposure.** Under **Exposure media**, turn on the sources that apply
   (Soil, Dust, Water, Air, Food, Other) and type in the lead **concentrations** and
   **intake** amounts. You can add more age columns with the **“+ age”** button.
4. **(Optional) Advanced options.** Growth, physiology, and lung settings live on the
   **Advanced options** tab. They are pre-filled with standard values — open that tab
   only if you need to change them. Most simulations use the defaults.
5. **Run it.** Click the green **“Run model”** button at the top right. It takes a few
   seconds (longer for very long simulations). The **Results** tab opens automatically
   when it finishes.
6. **Read the results** on the **Results** tab:
   - The four boxes show the **highest, average, and final** value and the **age at the
     peak** for the output parameter you are focused on (blood lead to start with).
     **Click** the highest, average, or final box to mark that value on the chart;
     click again to remove it.
   - **Switch which parameter the statistics describe.** In the **Series** list, tick a
     different output (kidney, liver, bone, etc.) or click its name — the boxes,
     estimator, and chart markers all switch to that parameter (a ★ shows which one is
     in focus). Click **Blood lead** again to switch back.
   - **Estimate the value at any age.** In the **“Estimate … at a chosen age”** box,
     type an age (in years). The big number shows the estimated value of the focused
     parameter at that age, and a line on the chart marks the spot.
   - The chart shows the plotted parameters over the person’s life. Move your mouse over
     it to read exact values at any age.
   - Click **“Download plotted data (CSV)”** to save the numbers as a spreadsheet file.
7. **Try another scenario.** Go back to the **Simulation inputs** tab, change anything,
   and click **Run model** again. (Give it a new **Simulation name** if you want to keep
   the previous run’s files.)

---

## If something doesn’t work

- **“Python was not found.”** Python isn’t installed yet, or the “Add to PATH” box
  wasn’t ticked during install. Re-do **Step 2**, making sure that box is checked.
- **The browser says it can’t connect.** Make sure the black window from **Step 4** is
  still open, wait a few seconds, and refresh the page.
- **The app says the model didn’t produce results.** Usually an input was left blank or
  set to something the model can’t use. Check your exposure numbers and try again.
- **Nothing happens when you double-click the .bat file.** Right-click
  `Start AALM App.bat`, choose **Properties**, and if you see an **“Unblock”** box near
  the bottom, tick it, click **OK**, and try again.

---

## Part 2 — Putting the app on the web later

This part is more technical. The plan below is written so you can hand it to an IT
person or web developer; they will find the details in the files **`README.md`** and
**`Dockerfile`** inside the `AALM App` folder.

### The one thing to know first

The app has two pieces:
- the **screens** you see in the browser (these work anywhere), and
- the **calculation engine** — the lead model itself.

The calculation engine is the file **`AALM_64.exe`**, and it only runs on **Windows**.
So putting the app on the web means deciding where that engine will run.

### The simplest options (easiest to hardest)

1. **Shared link on your office network.** If you only need coworkers on the same
   office network to use it, an IT person can run the app on one Windows computer or
   Windows server and give everyone a link to it. Nothing about the engine has to
   change. This is the least work.

2. **A Windows machine in the cloud.** Rent a Windows server from a cloud provider
   (for example Microsoft Azure or Amazon Web Services), copy the `AALM App` folder and
   `AALM_64.exe` onto it, install Python, and start the app the same way you do on your
   own computer. Then share the server’s web address.

3. **A standard (non-Windows) web host.** Most web hosting runs on a system called
   Linux, which **cannot** run the Windows engine as-is. To use this kind of hosting,
   a developer would need to rebuild the lead model from its original source code
   (the file `code/AALM31_Fortran.f90`) so it runs on Linux. The app was deliberately
   built so this is a small, contained change — only one file
   (`backend/model_runner.py`) needs to point to the new engine.

### What to give your IT person

- The whole **`AALM App`** folder and the **`AALM_64.exe`** file.
- A note that the technical setup steps and a ready-made container recipe are in
  **`README.md`** and **`Dockerfile`** in that folder.
- This sentence: *“The Python app and web pages are ready to deploy; the only
  platform-specific piece is the Windows model executable, which must either run on a
  Windows host or be recompiled for the server’s operating system.”*

---

*Questions about the underlying lead model (not the app) can go to the model’s authors:
brown.james@epa.gov and PbHelp@epa.gov.*
