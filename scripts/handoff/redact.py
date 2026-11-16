import re, os
ENV = "/home/user/Taxila/.env.local"
SECRET_NAME = re.compile(r"(KEY|SECRET|PASSWORD|TOKEN|CONNECTION_STRING|SALT)(_|$)|_KEY_|DATABASE_URL|_PG_SIN_URL$")
def load():
    out = []
    for line in open(ENV, encoding="utf-8"):
        line = line.rstrip("\n")
        if "=" not in line or line.lstrip().startswith("#"): continue
        k, v = line.split("=", 1); v = v.strip().strip('"').strip("'")
        if SECRET_NAME.search(k) and len(v) >= 8:
            out.append((k, v))
            m = re.match(r"^[a-z]+://([^:/@]+):([^@]+)@", v)
            if m and len(m.group(2)) >= 6: out.append((k + "_PW", m.group(2)))
    return out
SECRETS = load()
_vals = sorted({v for _, v in SECRETS}, key=len, reverse=True)
_name = {v: k for k, v in SECRETS}
_ALT = re.compile("|".join(re.escape(v) for v in _vals)) if _vals else None
PATTERNS = [
    (re.compile(r"AccountKey=[A-Za-z0-9+/=]{20,}"), "AccountKey=[REDACTED]"),
    (re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._\-~+/]{24,}=*"), r"\1[REDACTED]"),
    (re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{8,}"), "[REDACTED:JWT]"),
    (re.compile(r"sk-or-v1-[A-Za-z0-9]{20,}"), "[REDACTED:OPENROUTER]"),
    (re.compile(r"((?:postgres|postgresql|mysql|rediss?)://[^:\s/@\"']+):[^@\s\"']+@"), r"\1:[REDACTED]@"),
    (re.compile(r"([?&]sig=)[A-Za-z0-9%+/=]{20,}"), r"\1[REDACTED]"),
]
def redact_text(t):
    n = 0
    if _ALT:
        def rep(m):
            nonlocal n; n += 1; return f"[REDACTED:{_name[m.group(0)]}]"
        t = _ALT.sub(rep, t)
    for rx, r in PATTERNS:
        t, k = rx.subn(r, t); n += k
    return t, n
def leftover(t):
    return [ _name[v] for v in _vals if v in t ]
if __name__ == "__main__":
    print(len(SECRETS), "secret values from", len({k.replace('_PW','') for k,_ in SECRETS}), "keys:")
    print(" ".join(sorted({k for k,_ in SECRETS})))
