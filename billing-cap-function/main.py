"""
Cloud Function: disable billing when a budget threshold is exceeded.

Triggered by a Pub/Sub message from a Cloud Billing budget. When the reported
cost exceeds the budget amount, it removes the billing account from the project,
which stops all billable usage (including this app).

WARNING: disabling billing shuts down the WHOLE project until you re-enable it.

Entry point: stop_billing  (2nd-gen / CloudEvent signature)
"""
import base64
import json

import functions_framework
import google.auth
from googleapiclient import discovery

# The project the function runs in (and whose billing it will disable).
_, PROJECT_ID = google.auth.default()
PROJECT_NAME = f"projects/{PROJECT_ID}"


@functions_framework.cloud_event
def stop_billing(cloud_event):
    payload = base64.b64decode(cloud_event.data["message"]["data"]).decode("utf-8")
    event = json.loads(payload)
    cost = event.get("costAmount", 0)
    budget = event.get("budgetAmount", 0)
    print(f"Budget notification: cost={cost}, budget={budget}")

    if cost <= budget:
        print("Under budget — no action taken.")
        return

    billing = discovery.build("cloudbilling", "v1", cache_discovery=False)
    projects = billing.projects()
    if _billing_enabled(projects):
        _disable_billing(projects)
    else:
        print("Billing already disabled — nothing to do.")


def _billing_enabled(projects):
    try:
        info = projects.getBillingInfo(name=PROJECT_NAME).execute()
        return info.get("billingEnabled", False)
    except Exception as e:  # noqa: BLE001
        print(f"Could not check billing status ({e}); assuming enabled.")
        return True


def _disable_billing(projects):
    try:
        res = projects.updateBillingInfo(
            name=PROJECT_NAME, body={"billingAccountName": ""}
        ).execute()
        print(f"BILLING DISABLED for {PROJECT_NAME}: {json.dumps(res)}")
    except Exception as e:  # noqa: BLE001
        print(f"FAILED to disable billing: {e} — check the function's IAM role.")
