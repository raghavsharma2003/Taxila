#!/usr/bin/env python3
"""Harness status: tagged instances, spend estimate, quota values and quota-request status.

    python3 scripts/gpu/status.py [--json] [--jobs 10]

Spend: (a) each live instance's running cost so far (Pricing API / spot history x age); (b) the ledger of finished
runs, summed from s3://$AWS_BUILD_BUCKET/jobs/*/run.json (run.py writes one per run); (c) the AWS Budget
`taxila-build-gpu` actual and forecast for the month, which is AWS's own number (it lags by up to a day).
"""
import argparse
import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as C  # noqa: E402


def quotas():
    sq = C.client("service-quotas")
    out = {}
    for code, name in C.QUOTAS.items():
        try:
            v = sq.get_service_quota(ServiceCode="ec2", QuotaCode=code)["Quota"]["Value"]
        except Exception as e:
            v = f"? {str(e)[:60]}"
        out[code] = {"name": name, "value": v, "requests": []}
    try:
        for page in sq.get_paginator("list_requested_service_quota_change_history").paginate(ServiceCode="ec2"):
            for r in page["RequestedQuotas"]:
                if r["QuotaCode"] in out:
                    out[r["QuotaCode"]]["requests"].append({"id": r["Id"], "desired": r["DesiredValue"], "status": r["Status"],
                                                            "created": str(r.get("Created", ""))[:19], "caseId": r.get("CaseId")})
    except Exception as e:
        out["_error"] = str(e)[:120]
    return out


def ledger(limit):
    s3 = C.client("s3")
    rows, total = [], 0.0
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=C.bucket(), Prefix="jobs/"):
        for o in page.get("Contents", []):
            if o["Key"].endswith("/run.json"):
                try:
                    r = json.loads(s3.get_object(Bucket=C.bucket(), Key=o["Key"])["Body"].read())
                except Exception:
                    continue
                usd = (r.get("cost") or {}).get("totalUsd") or 0
                total += usd
                rows.append({"job": r.get("jobId"), "type": r.get("instanceType"), "lifecycle": r.get("lifecycle"), "result": r.get("result"),
                             "lifeS": r.get("t", {}).get("instanceLifeS"), "usd": usd, "when": str(o["LastModified"])[:16]})
    rows.sort(key=lambda r: r["when"], reverse=True)
    return rows[:limit], round(total, 4), len(rows)


def budget():
    try:
        acct = C.client("sts").get_caller_identity()["Account"]
        b = C.client("budgets").describe_budget(AccountId=acct, BudgetName="taxila-build-gpu")["Budget"]
        cs = b.get("CalculatedSpend", {})
        return {"limitUsd": b["BudgetLimit"]["Amount"], "actualUsd": cs.get("ActualSpend", {}).get("Amount"),
                "forecastUsd": cs.get("ForecastedSpend", {}).get("Amount"), "updated": str(b.get("LastUpdatedTime", ""))[:19]}
    except Exception as e:
        return {"error": str(e)[:120]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--jobs", type=int, default=10)
    a = ap.parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    inst = []
    for i in C.tagged_instances(("pending", "running", "stopping", "stopped", "shutting-down")):
        age = (now - i["LaunchTime"]).total_seconds()
        life = "spot" if i.get("InstanceLifecycle") == "spot" else "on-demand"
        c = C.cost_estimate(i["InstanceType"], life, i["Placement"]["AvailabilityZone"], age, 0)
        inst.append({"id": i["InstanceId"], "type": i["InstanceType"], "lifecycle": life, "state": i["State"]["Name"],
                     "ageMin": round(age / 60, 1), "maxMin": i["_tags"].get("taxila-max-minutes"), "job": i["_tags"].get("taxila-job"),
                     "usdSoFar": c["ec2Usd"], "usdPerHour": c["usdPerHour"]})
    rows, total, n = ledger(a.jobs)
    res = {"at": now.isoformat()[:19] + "Z", "instances": inst, "ledger": {"runs": n, "totalUsd": total, "recent": rows},
           "budget": budget(), "quotas": quotas()}
    if a.json:
        print(json.dumps(res, indent=1, default=str))
        return
    print(f"== live taxila=gpu-build instances ({len(inst)})")
    for i in inst:
        print(f"  {i['id']} {i['type']:<11} {i['lifecycle']:<9} {i['state']:<13} {i['ageMin']:>6} min / max {i['maxMin']}  ${i['usdSoFar']:.4f} so far  {i['job']}")
    print(f"== ledger: {n} run(s), est. ${total:.4f} total")
    for r in rows:
        print(f"  {r['when']}  {r['job']:<40} {r['type'] or '-':<10} {r['lifecycle'] or '-':<9} {r['result']:<14} {r['lifeS']} s  ${r['usd']:.4f}")
    b = res["budget"]
    print(f"== budget taxila-build-gpu: " + (f"actual ${b.get('actualUsd')} / forecast ${b.get('forecastUsd')} of ${b.get('limitUsd')} (updated {b.get('updated')})" if "error" not in b else b["error"]))
    print("== quotas (us-east-1, ec2)")
    for code, q in res["quotas"].items():
        if code.startswith("_"):
            print("  ", q)
            continue
        reqs = "; ".join(f"request {r['desired']:g} {r['status']} ({r['created']}, case {r['caseId'] or '-'})" for r in q["requests"]) or "no request"
        print(f"  {code} {q['name']}: {q['value']}  | {reqs}")


if __name__ == "__main__":
    main()
