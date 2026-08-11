# Billing hard-cap Cloud Function (optional)

This is a small Cloud Function that **disables billing on your project** when a Cloud
Billing budget is exceeded — a true spending hard-cap. It is **not part of the AALM app**;
it's optional billing-safety infrastructure for your Google Cloud project.

> **⚠️ What "disable billing" does:** it detaches the billing account from the project,
> which **stops every billable service in the project** — including the AALM app on Cloud
> Run. The app goes **offline** until you manually re-enable billing. Also, budget data
> lags real spend by a few hours, so spending can slightly overshoot before this fires.
> Use this only if you want a guaranteed stop, not just a warning.

Files: `main.py` (the function), `requirements.txt` (its libraries).

---

## Setup (once)

### 1. Enable the required APIs
In the Cloud Console search bar, search each and click **Enable**:
- **Cloud Billing API**
- **Cloud Functions API**
- **Cloud Build API**
- **Cloud Pub/Sub API**

### 2. Create a Pub/Sub topic
1. Search **Pub/Sub** → **Topics** → **Create topic**.
2. Topic ID: **`billing-cap`** → **Create**.

### 3. Point your budget at the topic
1. **Billing → Budgets & alerts →** open your budget (or create one; see the main
   Cloud Run guide, Part 4).
2. **Edit → Manage notifications** (or "Connect a Pub/Sub topic to this budget").
3. Check **Connect a Pub/Sub topic to this budget** → select **`billing-cap`** → **Save**.

### 4. Deploy the function
**Option A — Console (no command line):**
1. Search **Cloud Run functions** (or "Cloud Functions") → **Create function**.
2. **Environment:** 2nd gen.  **Name:** `stop-billing`.  **Region:** match your app's.
3. **Trigger:** **Cloud Pub/Sub** → topic **`billing-cap`** → Save.
4. **Runtime:** Python 3.12.  **Entry point:** **`stop_billing`**.
5. In the inline editor, replace `main.py` with the contents of this folder's `main.py`,
   and `requirements.txt` with this folder's `requirements.txt`.
6. **Deploy.**

**Option B — gcloud CLI (from this folder):**
```bash
gcloud functions deploy stop-billing \
  --gen2 --runtime=python312 --region=us-central1 \
  --source=. --entry-point=stop_billing \
  --trigger-topic=billing-cap
```

### 5. Give the function permission to disable billing (critical)
The function runs as a **service account** that needs the **Billing Account
Administrator** role on your **billing account** (not the project). Without this, it
can't disable billing.

1. Find the function's service account: open the function → **Details/Trigger** tab (or
   **Runtime, build, connections and security settings → Runtime service account**). By
   default it's `PROJECT_NUMBER-compute@developer.gserviceaccount.com`.
2. Go to **Billing → (select your billing account) → Account management** (or the billing
   account's **IAM/Permissions**).
3. **Add principal** → paste the function's service account → role **Billing Account
   Administrator** → **Save**.

---

## Test it (carefully)
- Temporarily set your budget very low (e.g. **$0.01**) and wait for the next budget
  notification. When cost exceeds it, the function runs and **billing is disabled** —
  confirm in the function **Logs** ("BILLING DISABLED …") and in **Billing** (the project
  shows no billing account).
- **Re-enable billing** afterward: **Billing → (project) → link a billing account** — then
  raise the budget back to your real amount.

## Notes
- The whole thing is free/near-free: Pub/Sub + a rarely-triggered function cost essentially
  nothing.
- This is a **hard stop**, not a soft throttle. For most low-traffic uses, budget alert
  emails + a low `max-instances` are enough, and this function is belt-and-suspenders.
