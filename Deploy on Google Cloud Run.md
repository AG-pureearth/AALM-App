# Deploy the AALM App on Google Cloud Run

This guide moves the app from Render to **Google Cloud Run** — a pay-per-use host that
**scales to zero** (you pay only while a simulation is running) and spins up a separate
small instance per simultaneous user. It also sets up a **spending budget with email
warnings** and, optionally, a **hard spending cap**.

Everything below is done in the browser, from your GitHub repo — no command line required.

**Before you start:** you have a Google Cloud account (done), and the app is on GitHub at
<https://github.com/AG-pureearth/AALM-App>.

---

## Part 1 — Create a project and enable the services

1. Go to the **Google Cloud Console**: <https://console.cloud.google.com>.
2. At the top, click the **project dropdown → New Project**. Name it e.g. `aalm-app`,
   and make sure **billing** is linked (it prompts you if not). Click **Create**, then
   select the new project in the dropdown.
3. Enable the APIs the deploy needs. In the top search bar, search each of these and click
   **Enable** on its page:
   - **Cloud Run Admin API**
   - **Cloud Build API**
   - **Artifact Registry API**
   *(You can also just start Part 2 — the console will offer to enable any that are
   missing.)*

---

## Part 2 — Deploy from your GitHub repo

1. In the search bar, go to **Cloud Run** → click **Create Service**.
2. Choose **“Continuously deploy from a repository (source or function)”** →
   click **Set up with Cloud Build**.
3. **Connect your repository:**
   - **Repository provider:** GitHub → **Authenticate** (installs the Cloud Build GitHub
     app; approve access to `AG-pureearth/AALM-App`).
   - **Repository:** select **AG-pureearth/AALM-App**. Click **Next**.
4. **Build configuration:**
   - **Branch:** `^main$`
   - **Build Type:** **Dockerfile**
   - **Source location:** `/Dockerfile.wine`  ← **important** (our Dockerfile is named
     `Dockerfile.wine`, not the default `Dockerfile`)
   - Click **Save**.
5. **Service settings:**
   - **Service name:** `aalm-app`
   - **Region:** pick one close to your users (e.g. `us-central1`). It must be an
     **x86-64** region (all standard ones are) so the Windows engine runs under Wine.
   - **Authentication:** **Allow unauthenticated invocations** (so anyone with the link
     can use it). *(Choose “Require authentication” instead if you want it private.)*
6. Expand **Container(s), Volumes, Networking, Security** → **Container** tab:
   - **Memory:** **2 GiB**
   - **CPU:** **1**
   - **CPU allocation:** **CPU is only allocated during request processing** (this is the
     cheapest, pay-per-use mode)
   - **Request timeout:** `300` seconds (fine — runs take seconds)
   - **Maximum concurrent requests per instance:** **1** (one simulation per instance, so
     memory never stacks)
   - **Container port:** leave the default (the app reads Cloud Run's port automatically)
7. Open the **“Autoscaling”** / revision scaling settings:
   - **Minimum number of instances:** **0** (scale to zero — no idle cost)
   - **Maximum number of instances:** **5** (caps how many simulations run at once; see
     the cost note in Part 4)
8. Click **Create**.

Cloud Build now builds the image (it downloads Ubuntu + Wine, so the **first build takes
several minutes**). When it finishes, Cloud Run shows a public URL like
**`https://aalm-app-xxxxx.a.run.app`**.

---

## Part 3 — Test it

1. Open the service URL. The **first visit after it's been idle waits ~15–30 seconds**
   (a “cold start” while it wakes up and loads the engine); after that it's quick.
2. Run a simulation and confirm you get results.
3. **Auto-deploy is on:** every time you push to `main`, Cloud Build rebuilds and Cloud
   Run redeploys automatically.

> **Simulation limits:** the app caps simulations at **40 years / 25 steps per day**.
> Cloud Run at 2 GiB has room for this. To change it, edit `MAX_AGE_SPAN` / `MAX_STEPS`
> in `frontend/js/app.js` and push — see **“Simulation limits”** in `README.md`.

---

## Part 4 — Spending budget + warning emails

This gives you an **early-warning email** as you approach a dollar amount.

1. In the console search bar, go to **Billing** → **Budgets & alerts** →
   **Create budget**.
2. **Scope:** select your **project** (`aalm-app`) so the budget only tracks this app.
3. **Amount:** set your monthly target, e.g. **$10**. (Given the free tier and short
   runs, you'll likely stay near $0 — this is just a safety net.)
4. **Threshold rules:** keep/add alerts at **50%, 90%, and 100%** of the budget. These
   email the billing admins when each threshold is crossed.
5. Click **Finish**.

> **Important:** a budget **only sends warnings** — by itself it does **not** stop
> spending. For that, see Part 5.

---

## Part 5 — (Optional) Hard spending cap that actually stops charges

A budget warns you; it doesn't halt anything. Two ways to put a real ceiling on cost:

**A. The instance cap you already set (soft ceiling).**
`Maximum instances = 5` limits how many instances can run at once. Since you're only
billed while a request runs, and runs are seconds long, your realistic cost is a tiny
fraction of the worst case. The absolute worst case (all 5 instances busy 24/7 at
1 CPU + 2 GiB) is roughly a few hundred dollars/month — but that requires nonstop traffic
that this app will never see. Lowering **Max instances** lowers that ceiling.

**B. A true auto-shutoff (advanced).**
To make spending actually **stop** at your budget, wire the budget to automation:
budget → **Pub/Sub** notification → a **Cloud Function** that disables billing on the
project. Google documents the exact recipe here:
<https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage>.
- **Trade-off:** disabling billing shuts down the **whole project** (the app goes offline
  until you re-enable billing). That's the cost of a guaranteed hard cap.

For a low-traffic non-profit tool, **Part 4's budget alert + the Max-instances cap is
usually enough**; set up option B only if you need a guaranteed stop.

---

## Cost expectation

- Cloud Run's free tier (≈ 180,000 vCPU-seconds, 360,000 GiB-seconds, 2M requests/month)
  covers on the order of **tens of thousands of runs per month for free**.
- Realistic usage for this tool → **$0 to a few dollars a month**.
- You only pay while a simulation computes; idle time is free (scale-to-zero).
- Verify current prices with Google's calculator: <https://cloud.google.com/products/calculator>.

---

## Notes vs. your Render setup

- **You can keep Render running** alongside Cloud Run, or delete the Render service once
  Cloud Run works — they're independent.
- Same repo, same `Dockerfile.wine`; only the host changes. Cloud Run sets the port via an
  environment variable, which the app already honors, so no code changes are needed.
- If you set the service to **Require authentication** in Part 2, only signed-in Google
  users you grant the **Cloud Run Invoker** role can open it.
