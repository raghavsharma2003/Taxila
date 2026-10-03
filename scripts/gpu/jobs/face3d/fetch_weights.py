#!/usr/bin/env python3
"""Fetch every pinned weight file in weights.lock.json and verify it (stdlib only; runs before any venv exists).

  - Hugging Face files come from https://huggingface.co/<repo>/resolve/<pinned revision>/<path>; LFS files must match the
    lock's sha256, small files the lock's git blob oid (sha1 of "blob <len>\\0" + bytes).
  - Layout: Hunyuan3D-2.1 under $HY3DGEN_MODELS/tencent/Hunyuan3D-2.1 (hy3dshape's smart_load_model reads it there),
    and every repo as an offline Hugging Face cache snapshot under $HF_HOME/hub (refs/main -> the pinned revision), so
    snapshot_download / from_pretrained resolve offline (HF_HUB_OFFLINE=1) to exactly these bytes.
  - Optional S3 cache: with the instance role and the aws CLI, a verified file is mirrored to
    s3://$BUCKET/cache/weights/<sha256> and later runs pull it from there (same-region S3, no HF egress).
    python3 fetch_weights.py weights.lock.json
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

LOCK = json.load(open(sys.argv[1]))
HF_HOME = os.environ.get("HF_HOME", "/opt/hf")
HY = os.environ.get("HY3DGEN_MODELS", "/opt/hy3dgen")
WDIR = os.environ.get("WEIGHTS_DIR", "/opt/weights")
BUCKET = os.environ.get("BUCKET")
HAVE_AWS = shutil.which("aws") is not None and BUCKET


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 22), b""):
            h.update(b)
    return h.hexdigest()


def gitoid(p):
    data = open(p, "rb").read()
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def download(url, dst, tries=4):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".part"
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "taxila-build"}), timeout=120) as r, open(tmp, "wb") as f:
                shutil.copyfileobj(r, f, 1 << 22)
            os.replace(tmp, dst)
            return
        except Exception as e:
            print(f"[weights] retry {i + 1} {url[-60:]}: {e}", flush=True)
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"download failed: {url}")


def s3_get(digest, dst):
    if not HAVE_AWS:
        return False
    r = subprocess.run(["aws", "s3", "cp", "--only-show-errors", f"s3://{BUCKET}/cache/weights/{digest}", dst], capture_output=True)
    return r.returncode == 0 and os.path.exists(dst)


def s3_put(digest, src):
    if HAVE_AWS:
        subprocess.run(["aws", "s3", "cp", "--only-show-errors", src, f"s3://{BUCKET}/cache/weights/{digest}"], capture_output=True)


def fetch_one(job):
    url, dst, want_sha, want_oid = job
    if os.path.exists(dst) and ((want_sha and sha256(dst) == want_sha) or (not want_sha and want_oid and gitoid(dst) == want_oid)):
        return dst, "present"
    src = "s3-cache" if (want_sha and s3_get(want_sha, dst)) else None
    if src and sha256(dst) != want_sha:
        src = None
    if not src:
        download(url, dst)
        src = "origin"
    if want_sha:
        got = sha256(dst)
        if got != want_sha:
            raise RuntimeError(f"SHA256 MISMATCH {dst}: {got} != {want_sha}")
        if src == "origin":
            s3_put(want_sha, dst)
    elif want_oid:
        got = gitoid(dst)
        if got != want_oid:
            raise RuntimeError(f"GIT OID MISMATCH {dst}: {got} != {want_oid}")
    return dst, src


jobs = []
for repo, v in LOCK["hf"].items():
    rev = v["revision"]
    owner, name = repo.split("/")
    snap = os.path.join(HF_HOME, "hub", f"models--{owner}--{name}", "snapshots", rev)
    os.makedirs(os.path.join(HF_HOME, "hub", f"models--{owner}--{name}", "refs"), exist_ok=True)
    open(os.path.join(HF_HOME, "hub", f"models--{owner}--{name}", "refs", "main"), "w").write(rev)
    base = os.path.join(HY, owner, name) if repo == "tencent/Hunyuan3D-2.1" else snap
    if base != snap:                       # one copy of the bytes: the HF snapshot is a symlink to the hy3dgen dir
        os.makedirs(os.path.dirname(snap), exist_ok=True)
        os.makedirs(base, exist_ok=True)
        if not os.path.islink(snap):
            shutil.rmtree(snap, ignore_errors=True)
            os.symlink(base, snap)
    for path, f in v["files"].items():
        jobs.append((f"https://huggingface.co/{repo}/resolve/{rev}/{path}", os.path.join(base, path), f.get("sha256"), f.get("gitOid")))
for name, f in LOCK["url"].items():
    jobs.append((f["url"], os.path.join(WDIR, name), f["sha256"], None))

t0 = time.time()
rep = {}
with ThreadPoolExecutor(8) as ex:
    for dst, src in ex.map(fetch_one, jobs):
        rep[dst] = src
n = {k: sum(1 for v in rep.values() if v == k) for k in ("origin", "s3-cache", "present")}
print(f"[weights] {len(jobs)} files verified in {time.time() - t0:.0f} s: {n}", flush=True)
json.dump({"files": len(jobs), "sources": n, "seconds": round(time.time() - t0, 1)}, open(os.path.join(WDIR, "fetch-report.json"), "w"))
