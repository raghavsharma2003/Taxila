#!/usr/bin/env python3
"""Fetch every pinned repo in weights.expected.json to <W>/<key> (huggingface_hub, exact revision), mark <key>.done,
then (with --verify) sha256 every LFS file / git-oid every small file and write pins/weights-sha256.json.

    python fetch_open.py weights.expected.json /opt/w [--only k1,k2] [--verify OUT/pins/weights-sha256.json]
"""
import hashlib
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

exp = json.load(open(sys.argv[1]))["repos"]
W = Path(sys.argv[2])
args = sys.argv[3:]
only = args[args.index("--only") + 1].split(",") if "--only" in args else list(exp)
verify = args[args.index("--verify") + 1] if "--verify" in args else None
ORDER = ["snac", "veena", "voxcpm2", "svara", "chatterbox-base", "chatterbox-hi", "qwen2.5-7b-tok", "vibevoice-hindi-7b", "vibevoice-hindi-1.5b"]


def fetch(k):
    from huggingface_hub import snapshot_download
    r = exp[k]
    t = time.time()
    for i in range(4):
        try:
            snapshot_download(repo_id=r["repo"], revision=r["revision"], allow_patterns=r.get("allow"), local_dir=str(W / k), max_workers=8)
            break
        except Exception as e:
            print(f"[fetch] {k} retry {i + 1}: {str(e)[:200]}", flush=True)
            time.sleep(10 * (i + 1))
    else:
        (W / f"{k}.failed").write_text("download failed")
        return
    gb = sum(p.stat().st_size for p in (W / k).rglob("*") if p.is_file() and ".cache" not in p.parts) / 1e9
    (W / f"{k}.done").write_text(json.dumps({"s": round(time.time() - t, 1), "gb": round(gb, 2)}))
    print(f"[fetch] {k} done: {gb:.2f} GB in {time.time() - t:.0f} s", flush=True)


def digest(p, kind):
    if kind == "sha256":
        h = hashlib.sha256()
        with open(p, "rb") as f:
            for b in iter(lambda: f.read(1 << 22), b""):
                h.update(b)
        return h.hexdigest()
    data = open(p, "rb").read()
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def check(k):
    out = {}
    for f, e in exp[k]["files"].items():
        p = W / k / f
        if not p.exists():
            out[f] = {"ok": False, "error": "missing"}
            continue
        if e.get("sha256"):
            got = digest(p, "sha256")
            out[f] = {"sha256": got, "ok": got == e["sha256"], "size": p.stat().st_size}
        else:
            got = digest(p, "oid")
            out[f] = {"gitOid": got, "ok": got == e["gitOid"], "size": p.stat().st_size}
    return k, {"repo": exp[k]["repo"], "revision": exp[k]["revision"], "files": out, "allOk": all(v["ok"] for v in out.values())}


if __name__ == "__main__":
    W.mkdir(parents=True, exist_ok=True)
    keys = [k for k in ORDER if k in only and k in exp]
    if verify:
        with ThreadPoolExecutor(3) as ex:
            res = dict(ex.map(check, [k for k in keys if (W / f"{k}.done").exists()]))
        Path(verify).parent.mkdir(parents=True, exist_ok=True)
        json.dump(res, open(verify, "w"), indent=1)
        print("[verify]", {k: v["allOk"] for k, v in res.items()}, flush=True)
    else:
        # two at a time, in the order the renders need them
        with ThreadPoolExecutor(2) as ex:
            list(ex.map(fetch, keys))
