#!/usr/bin/env python3
"""Run a build-time job on a throwaway EC2 instance and bring its outputs back.

    python3 scripts/gpu/run.py <job-dir> [--cpu] [--types g6.xlarge,g5.xlarge] [--max-minutes 90] [--disk 150]
                                         [--on-demand] [--no-spot-retry] [--out DIR] [--dry-run]

A job directory holds `run.sh` (executed as root with bash on the instance, cwd = the unpacked job) plus any inputs, and
optionally `job.json` with defaults: {"name", "gpuTypes", "cpuTypes", "maxMinutes", "diskGb", "amiSsm", "cpuAmi"
("ubuntu" | "dlami"), "exclude": [glob, ...], "include": {"dest": "repo/path"}, "env": {K: V}}. run.sh writes its results under $OUT; everything there
comes back to <out>/ (default <job-dir>/runs/<job-id>/). Env on the instance: JOB_ID, OUT, JOB_DIR, BUCKET, S3_PREFIX,
AWS_DEFAULT_REGION, MAX_MINUTES, DEADLINE_EPOCH, plus job.json env.

Flow: pack -> s3://$AWS_BUILD_BUCKET/jobs/<id>/job.tar.gz; launch (spot first, on-demand fallback, every type x default
subnet) with the taxila-gpu-worker profile, tag taxila=gpu-build, the no-inbound security group, IMDSv2, shutdown
behaviour = terminate; schedule the EventBridge backstop; poll the log (the instance PUTs it every 30 s) and status.json;
download outputs; ALWAYS terminate on exit (success, error, Ctrl-C, SIGTERM) and wait for `terminated`.
The instance side (user-data) schedules `shutdown -h +MAX` before anything else, so it dies on its own even if this
process and the scheduler both vanish.
"""
import argparse
import datetime as dt
import fnmatch
import io
import json
import os
import secrets
import signal
import sys
import tarfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as C  # noqa: E402

USER_DATA = r"""#!/bin/bash
# taxila build job __JOB_ID__ (scripts/gpu/run.py). Hard lifetime first, before anything can hang.
shutdown -h +__MAX__ "taxila job hard max lifetime" || (sleep __MAX_S__; poweroff -f) &
set -u
J=/opt/job; mkdir -p $J/out; cd $J
exec > $J/boot.log 2>&1
put() { for i in 1 2 3; do curl -fsS --retry 3 -X PUT -T "$1" "$2" && return 0; sleep 2; done; return 1; }
now() { date -u +%s; }
BOOT=$(now)
printf '{"phase":"booted","bootEpoch":%s}' $BOOT > $J/status.json; put $J/status.json '__PUT_STATUS__'
curl -fsS --retry 5 -o $J/job.tar.gz '__GET_JOB__' || { echo "job download failed" >> $J/boot.log; cp $J/boot.log $J/log.txt; put $J/log.txt '__PUT_LOG__';
  printf '{"phase":"done","rc":97,"bootEpoch":%s,"endEpoch":%s}' $BOOT $(now) > $J/status.json; put $J/status.json '__PUT_STATUS__'; shutdown -h now; }
tar xzf job.tar.gz -C $J && rm -f job.tar.gz
touch $J/log.txt
( while true; do sleep 30; { cat $J/boot.log; echo "---- run.sh ----"; tail -c 20000000 $J/log.txt; } > $J/log.up; put $J/log.up '__PUT_LOG__' >/dev/null 2>&1; done ) &
LOOP=$!
export JOB_ID='__JOB_ID__' OUT=$J/out JOB_DIR=$J BUCKET='__BUCKET__' S3_PREFIX='__PREFIX__' AWS_DEFAULT_REGION='__REGION__' \
       MAX_MINUTES=__MAX__ DEADLINE_EPOCH=__DEADLINE__ HOME=/root
__ENV__
START=$(now)
printf '{"phase":"running","bootEpoch":%s,"startEpoch":%s}' $BOOT $START > $J/status.json; put $J/status.json '__PUT_STATUS__'
timeout --kill-after=30 __RUN_S__ bash $J/run.sh >> $J/log.txt 2>&1
RC=$?
END=$(now)
echo "[harness] run.sh exit $RC after $((END-START)) s" >> $J/log.txt
if [ "${HARNESS_SELFTEST_HANG:-0}" = 1 ]; then echo "[harness] SELFTEST: hanging before upload; only the hard lifetime / backstop can end this" >> $J/log.txt
  { cat $J/boot.log; echo "---- run.sh ----"; cat $J/log.txt; } > $J/log.up; put $J/log.up '__PUT_LOG__'; sleep infinity; fi
tar czf $J/outputs.tar.gz -C $J/out . 2>> $J/log.txt
if command -v aws >/dev/null 2>&1 && aws s3 cp --only-show-errors $J/outputs.tar.gz "s3://__BUCKET__/__PREFIX__outputs.tar.gz" 2>> $J/log.txt; then :; else put $J/outputs.tar.gz '__PUT_OUT__' || echo "[harness] output upload FAILED" >> $J/log.txt; fi
UP=$(now)
kill $LOOP 2>/dev/null
{ cat $J/boot.log; echo "---- run.sh ----"; tail -c 20000000 $J/log.txt; } > $J/log.up; put $J/log.up '__PUT_LOG__'
printf '{"phase":"done","rc":%s,"bootEpoch":%s,"startEpoch":%s,"endEpoch":%s,"uploadedEpoch":%s,"outBytes":%s}' $RC $BOOT $START $END $UP $(stat -c %s $J/outputs.tar.gz) > $J/status.json
put $J/status.json '__PUT_STATUS__'
sync; shutdown -h now
"""

FALLBACK_ERRORS = ("InsufficientInstanceCapacity", "MaxSpotInstanceCountExceeded", "SpotMaxPriceTooLow", "VcpuLimitExceeded",
                   "InstanceLimitExceeded", "Unsupported", "InsufficientFreeAddressesInSubnet", "InvalidParameterCombination",
                   "CapacityNotAvailable")


class Stop(Exception):
    pass


def pack(job_dir, exclude, include=None):
    """tar.gz of the job dir, plus `include`: {"dest/in/tar": "repo/relative/path (file or dir)"} for repo inputs."""
    buf = io.BytesIO()
    ex = list(exclude) + ["runs/*", "runs", "__pycache__", "*.pyc", ".git"]
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        for p in sorted(job_dir.rglob("*")):
            rel = p.relative_to(job_dir).as_posix()
            if any(fnmatch.fnmatch(rel, e) or fnmatch.fnmatch(rel.split("/")[0], e) for e in ex):
                continue
            if p.is_file():
                tf.add(p, arcname=rel)
        for dest, src in (include or {}).items():
            sp = (C.ROOT / src).resolve()
            if not sp.exists():
                sys.exit(f"include {src} not found")
            files = [sp] if sp.is_file() else sorted(q for q in sp.rglob("*") if q.is_file())
            for q in files:
                rel = q.relative_to(sp).as_posix() if sp.is_dir() else ""
                if rel and any(fnmatch.fnmatch(rel, e) for e in ex):
                    continue
                tf.add(q, arcname=(dest.rstrip("/") + "/" + rel) if rel else dest)
    return buf.getvalue()


def presign(s3, method, key, expires):
    return s3.generate_presigned_url(method, Params={"Bucket": C.bucket(), "Key": key}, ExpiresIn=expires)


def launch(ec2, *, ami, types, subnets, sg, user_data, tags, disk_gb, spot, root_dev):
    """Try spot then on-demand (unless spot=False) over types x subnets. Returns (instance dict, lifecycle, attempts)."""
    attempts = []
    for lifecycle in (["spot", "on-demand"] if spot else ["on-demand"]):
        for itype in types:
            for az, sn in subnets:
                kw = dict(ImageId=ami, InstanceType=itype, MinCount=1, MaxCount=1, UserData=user_data,
                          IamInstanceProfile={"Name": C.PROFILE}, InstanceInitiatedShutdownBehavior="terminate",
                          NetworkInterfaces=[{"DeviceIndex": 0, "SubnetId": sn, "Groups": [sg], "AssociatePublicIpAddress": True,
                                              "DeleteOnTermination": True}],
                          BlockDeviceMappings=[{"DeviceName": root_dev, "Ebs": {"VolumeSize": disk_gb, "VolumeType": "gp3", "DeleteOnTermination": True}}],
                          MetadataOptions={"HttpTokens": "required", "HttpEndpoint": "enabled", "HttpPutResponseHopLimit": 2},
                          TagSpecifications=[{"ResourceType": "instance", "Tags": tags}, {"ResourceType": "volume", "Tags": tags}])
                if lifecycle == "spot":
                    kw["InstanceMarketOptions"] = {"MarketType": "spot", "SpotOptions": {"SpotInstanceType": "one-time",
                                                                                         "InstanceInterruptionBehavior": "terminate"}}
                try:
                    r = ec2.run_instances(**kw)
                    inst = r["Instances"][0]
                    attempts.append({"lifecycle": lifecycle, "type": itype, "az": az, "ok": True})
                    return inst, lifecycle, attempts
                except Exception as e:
                    code = getattr(e, "response", {}).get("Error", {}).get("Code", type(e).__name__)
                    msg = getattr(e, "response", {}).get("Error", {}).get("Message", str(e))[:160]
                    attempts.append({"lifecycle": lifecycle, "type": itype, "az": az, "error": code, "message": msg})
                    C.log(f"  {lifecycle} {itype} {az}: {code}")
                    if not any(code.startswith(f) for f in FALLBACK_ERRORS):
                        raise
                    if code in ("VcpuLimitExceeded", "MaxSpotInstanceCountExceeded"):
                        break                       # a quota, not a zone: other subnets will say the same
    return None, None, attempts


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("job_dir")
    ap.add_argument("--cpu", action="store_true", help="CPU test run (default t3.small, Ubuntu 22.04 AMI)")
    ap.add_argument("--types", help="comma list of instance types, tried in order")
    ap.add_argument("--max-minutes", type=int)
    ap.add_argument("--disk", type=int, help="root volume GB")
    ap.add_argument("--on-demand", action="store_true", help="skip spot")
    ap.add_argument("--no-spot-retry", action="store_true", help="do not relaunch on-demand after a spot interruption")
    ap.add_argument("--ami-ssm", help="pin an AMI family by SSM parameter path")
    ap.add_argument("--env", action="append", default=[], metavar="K=V", help="extra env for run.sh (overrides job.json env)")
    ap.add_argument("--include", action="append", default=[], metavar="DEST=REPO_PATH", help="extra repo file/dir packed at DEST")
    ap.add_argument("--out")
    ap.add_argument("--poll", type=float, default=15)
    ap.add_argument("--dry-run", action="store_true", help="pack + resolve + print, launch nothing")
    a = ap.parse_args()

    job_dir = Path(a.job_dir).resolve()
    if not (job_dir / "run.sh").exists():
        sys.exit(f"{job_dir}/run.sh missing")
    spec = json.loads((job_dir / "job.json").read_text()) if (job_dir / "job.json").exists() else {}
    name = spec.get("name", job_dir.name)
    max_min = int(a.max_minutes or spec.get("maxMinutes", 30 if a.cpu else 120))
    if not 5 <= max_min <= C.HARD_MAX_MINUTES:
        sys.exit(f"--max-minutes must be within 5..{C.HARD_MAX_MINUTES}")
    types = (a.types.split(",") if a.types else spec.get("cpuTypes" if a.cpu else "gpuTypes") or (C.DEFAULT_CPU_TYPES if a.cpu else C.DEFAULT_GPU_TYPES))
    job_id = f"{name}-{dt.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{secrets.token_hex(2)}"
    prefix = f"jobs/{job_id}/"
    out_dir = Path(a.out).resolve() if a.out else job_dir / "runs" / job_id
    ami_kind = spec.get("cpuAmi", "ubuntu") if a.cpu else "dlami"
    ami_ssm = a.ami_ssm or (spec.get("amiSsm") if ami_kind == "dlami" else None)
    ami, ssm_path, ami_name, img = C.resolve_ami(ami_kind, ami_ssm)
    if spec.get("amiId") and not a.ami_ssm:                      # exact pin wins over the SSM family
        ami, ssm_path = spec["amiId"], "job.json amiId"
        img = C.client("ec2").describe_images(ImageIds=[ami])["Images"][0]; ami_name = img.get("Name", "")
    root_dev = img["RootDeviceName"]
    snap_gb = max([b["Ebs"]["VolumeSize"] for b in img.get("BlockDeviceMappings", []) if "Ebs" in b] or [8])
    disk = max(int(a.disk or spec.get("diskGb", 20 if a.cpu else 150)), snap_gb)

    s3, ec2 = C.client("s3"), C.client("ec2")
    inc = dict(spec.get("include") or {})
    inc.update(kv.split("=", 1) for kv in a.include)
    blob = pack(job_dir, spec.get("exclude", []), inc)
    rec = {"jobId": job_id, "jobDir": str(job_dir.relative_to(C.ROOT)) if job_dir.is_relative_to(C.ROOT) else str(job_dir),
           "ami": ami, "amiName": ami_name, "amiSsm": ssm_path, "types": types, "maxMinutes": max_min, "diskGb": disk,
           "packedBytes": len(blob), "s3": f"s3://{C.bucket()}/{prefix}", "t": {}}
    C.log(f"job {job_id}: {len(blob)/1e6:.2f} MB packed; AMI {ami} ({ami_name}); types {types}; max {max_min} min; disk {disk} GB")
    if a.dry_run:
        print(json.dumps(rec, indent=1))
        return 0

    t0 = time.time()
    s3.put_object(Bucket=C.bucket(), Key=prefix + "job.tar.gz", Body=blob)
    s3.put_object(Bucket=C.bucket(), Key=prefix + "manifest.json", Body=json.dumps(rec, indent=1).encode())
    exp = max_min * 60 + 3600
    deadline = dt.datetime.utcnow().replace(microsecond=0) + dt.timedelta(minutes=max_min)
    envs = dict(spec.get("env", {}))
    envs.update(kv.split("=", 1) for kv in a.env)
    rec["env"] = envs
    env_lines = "\n".join(f"export {k}={json.dumps(str(v))}" for k, v in envs.items())
    ud = (USER_DATA.replace("__JOB_ID__", job_id).replace("__MAX__", str(max_min)).replace("__MAX_S__", str(max_min * 60 + 60))
          .replace("__RUN_S__", str(max(60, max_min * 60 - 240)))                    # leave 4 min for upload + shutdown
          .replace("__BUCKET__", C.bucket()).replace("__PREFIX__", prefix).replace("__REGION__", C.region())
          .replace("__DEADLINE__", str(int(deadline.replace(tzinfo=dt.timezone.utc).timestamp()))).replace("__ENV__", env_lines)
          .replace("__GET_JOB__", presign(s3, "get_object", prefix + "job.tar.gz", exp))
          .replace("__PUT_LOG__", presign(s3, "put_object", prefix + "log.txt", exp))
          .replace("__PUT_STATUS__", presign(s3, "put_object", prefix + "status.json", exp))
          .replace("__PUT_OUT__", presign(s3, "put_object", prefix + "outputs.tar.gz", exp)))
    if len(ud.encode()) > 16000:
        sys.exit(f"user-data {len(ud)} bytes > 16 KB")
    vpc, subnets = C.default_subnets()
    sg = C.ensure_sg(vpc)
    tags = [{"Key": C.TAG_KEY, "Value": C.TAG_VAL}, {"Key": "taxila-job", "Value": job_id}, {"Key": "Name", "Value": f"taxila-{job_id}"[:255]},
            {"Key": "taxila-max-minutes", "Value": str(max_min)}, {"Key": "taxila-deadline", "Value": deadline.isoformat() + "Z"}]

    inst_id, state = None, {"lifecycle": None}
    def on_term(signum, frame):
        raise Stop(f"signal {signum}")
    signal.signal(signal.SIGTERM, on_term)
    signal.signal(signal.SIGHUP, on_term)
    rc, retried = 1, False
    try:
        while True:
            C.log("launching" + (" (on-demand retry after spot interruption)" if retried else ""))
            tl = time.time()
            inst, lifecycle, attempts = launch(ec2, ami=ami, types=types, subnets=subnets, sg=sg, user_data=ud, tags=tags,
                                               disk_gb=disk, spot=not (a.on_demand or retried), root_dev=root_dev)
            rec.setdefault("launchAttempts", []).extend(attempts)
            if not inst:
                C.log("no capacity / quota for any type and lifecycle; nothing launched")
                rec["result"] = "not-launched"
                return 3
            inst_id = inst["InstanceId"]
            state.update(lifecycle=lifecycle, type=inst["InstanceType"], az=inst["Placement"]["AvailabilityZone"])
            rec.update(instanceId=inst_id, lifecycle=lifecycle, instanceType=inst["InstanceType"], az=state["az"])
            rec["t"]["launchCallS"] = round(time.time() - tl, 1)
            C.log(f"instance {inst_id} {inst['InstanceType']} {lifecycle} in {state['az']}")
            try:
                # from NOW (the instance boots after this), so slow capacity retries never eat into the job's window
                at = dt.datetime.utcnow().replace(microsecond=0) + dt.timedelta(minutes=max_min + C.SCHEDULER_GRACE_MIN)
                rec["backstop"] = C.schedule_backstop(inst_id, at, job_id)
                C.log(f"backstop schedule {rec['backstop']} at {at}Z")
            except Exception as e:
                rec["backstop"] = None
                C.log(f"WARNING: backstop schedule failed ({str(e)[:120]}); instance self-shutdown + reaper still apply")

            t_launch, t_running, t_status, seen, interrupted = time.time(), None, {}, 0, False
            while True:
                if time.time() - t0 > (max_min + 15) * 60:
                    raise Stop("past max lifetime + 15 min on the poller side")
                d = ec2.describe_instances(InstanceIds=[inst_id])["Reservations"][0]["Instances"][0]
                st = d["State"]["Name"]
                if st == "running" and t_running is None:
                    t_running = time.time()
                    rec["t"]["toRunningS"] = round(t_running - t_launch, 1)
                    C.log(f"running after {rec['t']['toRunningS']} s")
                try:
                    body = s3.get_object(Bucket=C.bucket(), Key=prefix + "log.txt")["Body"].read().decode("utf-8", "replace")
                    if len(body) > seen:
                        for line in body[seen:].splitlines():
                            print("    | " + line, flush=True)
                        seen = len(body)
                except s3.exceptions.NoSuchKey:
                    pass
                try:
                    stj = json.loads(s3.get_object(Bucket=C.bucket(), Key=prefix + "status.json")["Body"].read())
                except s3.exceptions.NoSuchKey:
                    stj = {}
                ph = stj.get("phase")
                if ph and ph not in t_status:
                    t_status[ph] = time.time()
                    C.log(f"instance phase: {ph}")
                if ph == "done":
                    rec["status"] = stj
                    break
                if st in ("shutting-down", "terminated"):
                    reason = d.get("StateReason", {}).get("Message", "")
                    interrupted = "Spot" in reason or "spot" in reason or lifecycle == "spot"
                    C.log(f"instance went {st} before finishing: {reason}")
                    rec.setdefault("lostInstances", []).append({"id": inst_id, "reason": reason, "lifecycle": lifecycle})
                    break
                time.sleep(a.poll)
            if rec.get("status"):
                break
            C.terminate(inst_id, "(lost)")
            C.delete_backstop(inst_id)
            if interrupted and not retried and not a.no_spot_retry and not a.on_demand:
                retried = True
                continue
            rec["result"] = "lost"
            return 4

        stj = rec["status"]
        rec["t"].update({"bootToStartS": stj.get("startEpoch", 0) - stj.get("bootEpoch", 0),
                         "jobS": stj.get("endEpoch", 0) - stj.get("startEpoch", 0),
                         "uploadS": stj.get("uploadedEpoch", 0) - stj.get("endEpoch", 0),
                         "launchToBootS": round(stj.get("bootEpoch", 0) - d["LaunchTime"].timestamp(), 1)})
        out_dir.mkdir(parents=True, exist_ok=True)
        td = time.time()
        try:
            data = s3.get_object(Bucket=C.bucket(), Key=prefix + "outputs.tar.gz")["Body"].read()
            with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tf:
                tf.extractall(out_dir, filter="data")
            rec["outputsBytes"] = len(data)
            rec["outputs"] = sorted(str(p.relative_to(out_dir)) for p in out_dir.rglob("*") if p.is_file())
        except s3.exceptions.NoSuchKey:
            rec["outputs"] = []
            C.log("no outputs.tar.gz in S3")
        rec["t"]["downloadS"] = round(time.time() - td, 1)
        (out_dir / "log.txt").write_text(s3.get_object(Bucket=C.bucket(), Key=prefix + "log.txt")["Body"].read().decode("utf-8", "replace"))
        rc = int(stj.get("rc", 1))
        rec["result"] = "ok" if rc == 0 else f"job-exit-{rc}"
        C.log(f"job exit {rc}; {len(rec['outputs'])} output file(s) -> {out_dir}")
        return 0 if rc == 0 else 2
    except (KeyboardInterrupt, Stop) as e:
        C.log(f"interrupted: {e!r}")
        rec["result"] = f"interrupted: {e!r}"
        return 130
    finally:
        signal.signal(signal.SIGINT, signal.SIG_IGN)       # do not let a second Ctrl-C skip the cleanup
        if inst_id:
            tt = time.time()
            C.terminate(inst_id, "(run.py exit)")
            for _ in range(144):            # GPU instances sit in shutting-down for 6-7 min (measured); not billed there
                d = ec2.describe_instances(InstanceIds=[inst_id])["Reservations"][0]["Instances"][0]
                if d["State"]["Name"] == "terminated":
                    break
                time.sleep(5)
            rec["finalState"] = d["State"]["Name"]
            rec["stateReason"] = d.get("StateReason", {}).get("Message")
            rec["t"]["terminateWaitS"] = round(time.time() - tt, 1)
            launched = d.get("LaunchTime")
            life = (dt.datetime.now(dt.timezone.utc) - launched).total_seconds() if launched else time.time() - t0
            rec["t"]["instanceLifeS"] = round(life, 1)
            rec["cost"] = C.cost_estimate(rec.get("instanceType", "?"), rec.get("lifecycle"), rec.get("az"), life, disk)
            if rec["finalState"] == "terminated":
                C.delete_backstop(inst_id)
            C.log(f"instance {inst_id}: {rec['finalState']} ({rec['stateReason']}); life {life:.0f} s; est. ${rec['cost']['totalUsd']:.4f}")
        rec["t"]["wallS"] = round(time.time() - t0, 1)
        try:
            s3.put_object(Bucket=C.bucket(), Key=prefix + "run.json", Body=json.dumps(rec, indent=1, default=str).encode())
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "run.json").write_text(json.dumps(rec, indent=1, default=str))
        except Exception as e:
            C.log(f"could not write run record: {e}")
        signal.signal(signal.SIGINT, signal.default_int_handler)


if __name__ == "__main__":
    sys.exit(main())
