# T-client patches (outside src/trace/**)

| # | patch | file | why |
|---|---|---|---|
| 01 | `01-main-install-trace.diff` | `src/main.tsx` | `installTrace()` first at boot, so every request, route, tap and error from page load on is recorded (applied on `claude/r4-content` as a `[patch-request]` commit) |
| 02 | (in the same `[patch-request]` commit) | `package.json`, `package-lock.json` | `rrweb@2.1.7` (MIT, a lazy chunk loaded only for tier 2) and `rrweb-player@2.1.7` (dev, tooling only); the brief allows rrweb, self-hosted |
