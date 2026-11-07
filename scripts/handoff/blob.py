import os, sys, base64, hmac, hashlib, datetime, requests, tarfile, io, urllib.parse
sys.path.insert(0, os.path.dirname(__file__)); from redact import redact_text, leftover
env = dict(l.rstrip("\n").split("=", 1) for l in open("/home/user/Taxila/.env.local") if "=" in l and not l.startswith("#"))
ACCT, KEY = env["AZURE_STORAGE_ACCOUNT"].strip(), base64.b64decode(env["AZURE_STORAGE_KEY"].strip())
VER = "2021-08-06"; S = requests.Session(); S.verify = "/root/.ccr/ca-bundle.crt"
def call(verb, path, params=None, body=b"", extra=None):
    params = params or {}; date = datetime.datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")
    h = {"x-ms-date": date, "x-ms-version": VER, **(extra or {})}
    ch = "".join(f"{k}:{v}\n" for k, v in sorted((k.lower(), v) for k, v in h.items() if k.lower().startswith("x-ms-")))
    cr = f"/{ACCT}{path}" + "".join(f"\n{k}:{v}" for k, v in sorted((k.lower(), v) for k, v in params.items()))
    ln = str(len(body)) if body else ""
    sts = f"{verb}\n\n\n{ln}\n\n{h.get('Content-Type','')}\n\n\n\n\n\n\n{ch}{cr}"
    sig = base64.b64encode(hmac.new(KEY, sts.encode(), hashlib.sha256).digest()).decode()
    h["Authorization"] = f"SharedKey {ACCT}:{sig}"
    url = f"https://{ACCT}.blob.core.windows.net{path}" + ("?" + urllib.parse.urlencode(params) if params else "")
    for i in range(5):
        try:
            r = S.request(verb, url, headers=h, data=body, timeout=300)
            if r.status_code < 500: return r
        except requests.RequestException as e: err = e
    return r
class BlobWriter(io.RawIOBase):
    def __init__(self, container, name, chunk=16 * 1024 * 1024):
        self.p = f"/{container}/{name}"; self.buf = bytearray(); self.ids = []; self.chunk = chunk; self.total = 0
    def writable(self): return True
    def write(self, b):
        self.buf += b; self.total += len(b)
        while len(self.buf) >= self.chunk: self._put(bytes(self.buf[:self.chunk])); del self.buf[:self.chunk]
        return len(b)
    def _put(self, data):
        bid = base64.b64encode(f"{len(self.ids):08d}".encode()).decode()
        r = call("PUT", self.p, {"comp": "block", "blockid": bid}, data)
        if r.status_code != 201: raise SystemExit(f"put block {r.status_code} {r.text[:200]}")
        self.ids.append(bid)
    def close(self):
        if self.closed: return
        if self.buf: self._put(bytes(self.buf)); self.buf.clear()
        xml = ("<?xml version='1.0' encoding='utf-8'?><BlockList>" + "".join(f"<Latest>{i}</Latest>" for i in self.ids) + "</BlockList>").encode()
        r = call("PUT", self.p, {"comp": "blocklist"}, xml, {"Content-Type": "application/xml"})
        if r.status_code != 201: raise SystemExit(f"blocklist {r.status_code} {r.text[:200]}")
        super().close()
TEXT = {'.mjs','.js','.cjs','.ts','.tsx','.py','.sh','.md','.txt','.log','.json','.jsonl','.csv','.tsv','.patch','.diff','.sql','.html','.yaml','.yml','.css','.env','.xml','.svg',''}
def archive(container, name, roots, skip_dirs=frozenset()):
    w = BlobWriter(container, name); st = {"files": 0, "red": 0, "bad": [], "bytes": 0}
    with tarfile.open(fileobj=w, mode="w|gz") as tar:
        for root, arcbase in roots:
            if os.path.isfile(root): walk = [(os.path.dirname(root), [], [os.path.basename(root)])]
            else: walk = os.walk(root)
            for d, dirs, files in walk:
                dirs[:] = [x for x in dirs if x not in skip_dirs]
                for f in files:
                    p = os.path.join(d, f)
                    if os.path.islink(p) or not os.path.isfile(p): continue
                    arc = os.path.join(arcbase, os.path.relpath(p, root if os.path.isdir(root) else os.path.dirname(root)))
                    if os.path.splitext(f)[1].lower() in TEXT and os.path.getsize(p) < 300_000_000:
                        t, k = redact_text(open(p, encoding="utf-8", errors="surrogateescape").read()); st["red"] += k
                        if leftover(t): st["bad"].append(arc)
                        data = t.encode("utf-8", errors="surrogateescape")
                    else:
                        data = None
                    ti = tarfile.TarInfo(arc); ti.mtime = int(os.path.getmtime(p))
                    if data is not None: ti.size = len(data); tar.addfile(ti, io.BytesIO(data))
                    else:
                        ti.size = os.path.getsize(p)
                        with open(p, "rb") as fh: tar.addfile(ti, fh)
                    st["files"] += 1; st["bytes"] += ti.size
    w.close(); print(name, "files", st["files"], "raw", st["bytes"] // 1_000_000, "MB, uploaded", w.total // 1_000_000, "MB, redactions", st["red"], "leftover files", st["bad"][:5], flush=True)
if __name__ == "__main__":
    C = "handoff-2026-10-27"
    r = call("PUT", f"/{C}", {"restype": "container"}); print("container", r.status_code, r.text[:120] if r.status_code not in (201, 409) else "ok", flush=True)
    if sys.argv[1:] == ["test"]: sys.exit()
    P = "/root/.claude/projects/-home-user"
    archive(C, "main-session-transcripts-all.tar.gz", [(P + "/ecee9fc1-62f9-5f67-a47d-69ca79d9981a.jsonl", "transcripts"), (P + "/ecee9fc1-62f9-5f67-a47d-69ca79d9981a", "transcripts/ecee9fc1-62f9-5f67-a47d-69ca79d9981a")])
    SP = "/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad"
    archive(C, "main-session-scratchpad-full.tar.gz", [(SP, "scratchpad")], skip_dirs=frozenset({"node_modules", ".git", "handoff-tool"}))
