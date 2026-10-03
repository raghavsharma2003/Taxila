#!/usr/bin/env python3
"""Terminate every taxila=gpu-build instance that has outlived its max lifetime.

    python3 scripts/gpu/reaper.py [--dry-run] [--grace 5] [--all]

Lifetime = the instance's own `taxila-max-minutes` tag (HARD_MAX_MINUTES if missing or unparsable) + --grace minutes,
counted from LaunchTime. --all terminates every tagged instance regardless of age (the panic button). Also deletes
`taxila-reap-*` backstop schedules whose instance is already gone. Safe to run any time, from anywhere with the keys.
"""
import argparse
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as C  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--grace", type=float, default=5)
    ap.add_argument("--all", action="store_true")
    a = ap.parse_args()
    now = dt.datetime.now(dt.timezone.utc)
    live = C.tagged_instances(("pending", "running", "stopping", "stopped"))
    killed = 0
    for i in live:
        try:
            mx = min(int(i["_tags"].get("taxila-max-minutes", C.HARD_MAX_MINUTES)), C.HARD_MAX_MINUTES)
        except ValueError:
            mx = C.HARD_MAX_MINUTES
        age = (now - i["LaunchTime"]).total_seconds() / 60
        over = age > mx + a.grace
        verdict = "TERMINATE" if (over or a.all) else "ok"
        C.log(f"{i['InstanceId']} {i['InstanceType']} {i['State']['Name']} age {age:.1f} min / max {mx} -> {verdict}  ({i['_tags'].get('taxila-job', '-')})")
        if verdict == "TERMINATE" and not a.dry_run:
            C.terminate(i["InstanceId"], "(reaper)")
            killed += 1
    # orphaned backstop schedules
    try:
        sch = C.client("scheduler")
        ids_alive = {i["InstanceId"] for i in C.tagged_instances(("pending", "running", "stopping", "stopped", "shutting-down"))}
        for page in sch.get_paginator("list_schedules").paginate(GroupName=C.SCHED_GROUP, NamePrefix="taxila-reap-"):
            for s in page["Schedules"]:
                iid = s["Name"][len("taxila-reap-"):]
                if iid not in ids_alive:
                    C.log(f"orphan schedule {s['Name']} -> delete")
                    if not a.dry_run:
                        sch.delete_schedule(Name=s["Name"], GroupName=C.SCHED_GROUP)
    except Exception as e:
        C.log(f"schedule cleanup skipped: {str(e)[:120]}")
    C.log(f"{len(live)} live tagged instance(s); terminated {killed}" + (" (dry run)" if a.dry_run else ""))


if __name__ == "__main__":
    main()
