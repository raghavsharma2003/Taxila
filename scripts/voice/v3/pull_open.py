#!/usr/bin/env python3
"""Copy the open-weight renders of one scripts/gpu/run.py job into docs/research/voice/v3/renders/<arm>/ and stamp each
arm's manifest with the job's GPU, lifecycle, cost and the on-instance weight hashes.

    python3 scripts/voice/v3/pull_open.py <run-out-dir>          # the --out dir given to scripts/gpu/run.py
    python3 scripts/voice/v3/pull_open.py --s3 <job-id> <dir>    # or: fetch the per-arm partial uploads from S3 first

Cost per arm is the job's estimated instance cost split by arm wall time (setup time is charged to the job, not arms).
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / "docs/research/voice/v3/renders"


def s3_fetch(job_id, out):
    sys.path.insert(0, str(ROOT / "scripts/gpu"))
    import common as C
    s3 = C.client("s3")
    pre = f"jobs/{job_id}/renders/"
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=C.bucket(), Prefix=pre):
        for o in page.get("Contents", []):
            dst = Path(out) / "renders" / o["Key"][len(pre):]
            dst.parent.mkdir(parents=True, exist_ok=True)
            s3.download_file(C.bucket(), o["Key"], str(dst))
    try:
        (Path(out) / "run.json").write_bytes(s3.get_object(Bucket=C.bucket(), Key=f"jobs/{job_id}/run.json")["Body"].read())
    except Exception:
        pass


def main():
    a = sys.argv[1:]
    if a and a[0] == "--s3":
        s3_fetch(a[1], a[2])
        a = [a[2]]
    run = Path(a[0])
    rj = json.loads((run / "run.json").read_text()) if (run / "run.json").exists() else {}
    sha = json.loads((run / "pins/weights-sha256.json").read_text()) if (run / "pins/weights-sha256.json").exists() else {}
    arms_txt = (run / "arms.txt").read_text().splitlines()[1:] if (run / "arms.txt").exists() else []
    arm_s = {l.split()[0]: int(l.split()[2]) for l in arms_txt if len(l.split()) == 3 and l.split()[2].isdigit()}
    total_arm_s = sum(arm_s.values()) or 1
    cost = (rj.get("cost") or {}).get("totalUsd")
    gpu = (run / "pins/gpu.csv").read_text().strip().splitlines()[-1] if (run / "pins/gpu.csv").exists() else None
    DEST.mkdir(parents=True, exist_ok=True)
    summary = {}
    for d in sorted((run / "renders").glob("*")):
        if not (d / "manifest.json").exists():
            continue
        m = json.loads((d / "manifest.json").read_text())
        out = DEST / d.name
        if out.exists():
            shutil.rmtree(out)
        out.mkdir(parents=True)
        for f in d.glob("*.wav"):
            shutil.copy2(f, out / f.name)
        keys = list((m.get("repos") or {}).keys())
        m["weightsSha256"] = {k: sha.get(k) for k in keys} if sha else "not verified (pins/weights-sha256.json missing)"
        m["job"] = {"jobId": rj.get("jobId"), "instanceType": rj.get("instanceType"), "lifecycle": rj.get("lifecycle"), "az": rj.get("az"),
                    "region": (rj.get("az") or "")[:-1] or None, "gpu": gpu, "ami": rj.get("amiName"),
                    "jobCostUsd": cost, "costSource": (rj.get("cost") or {}).get("priceSource"), "usdPerHour": (rj.get("cost") or {}).get("usdPerHour"),
                    "armWallS": arm_s.get(d.name),
                    "armCostUsdEst": round(cost * arm_s.get(d.name, 0) / total_arm_s, 4) if cost else None,
                    "instanceLifeS": (rj.get("t") or {}).get("instanceLifeS"), "s3": rj.get("s3")}
        (out / "manifest.json").write_text(json.dumps(m, ensure_ascii=False, indent=1))
        summary[d.name] = {"wav": len(list(out.glob("*.wav"))), **m.get("summary", {})}
    print(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
