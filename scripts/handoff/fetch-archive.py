"""Handoff (2026-10-27): download one of the handoff archives from Azure Storage (container handoff-2026-10-27).
Usage: python3 scripts/handoff/fetch-archive.py <blob-name> <out-path>
Reads AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_KEY from .env.local. Archives are large (GBs): mind the disk.
Blobs: main-session-transcripts-all.tar.gz, main-session-scratchpad-full.tar.gz"""
import sys, base64, hmac, hashlib, datetime, requests, os
env = dict(l.rstrip("\n").split("=", 1) for l in open(os.path.join(os.path.dirname(__file__), "../../.env.local")) if "=" in l and not l.startswith("#"))
acct, key = env["AZURE_STORAGE_ACCOUNT"].strip(), base64.b64decode(env["AZURE_STORAGE_KEY"].strip())
blob, out = sys.argv[1], sys.argv[2]; path = f"/handoff-2026-10-27/{blob}"
date = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT"); ver = "2021-08-06"
sts = f"GET\n\n\n\n\n\n\n\n\n\n\n\nx-ms-date:{date}\nx-ms-version:{ver}\n/{acct}{path}"
sig = base64.b64encode(hmac.new(key, sts.encode(), hashlib.sha256).digest()).decode()
r = requests.get(f"https://{acct}.blob.core.windows.net{path}", headers={"x-ms-date": date, "x-ms-version": ver, "Authorization": f"SharedKey {acct}:{sig}"}, stream=True, timeout=600)
r.raise_for_status(); n = 0
with open(out, "wb") as f:
    for c in r.iter_content(8 << 20): f.write(c); n += len(c)
print(f"{blob}: {n/1e6:.0f} MB -> {out}")
