# Wave 1 production acceptance — 2026-10-04

Target: `https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, revision `taxila-web--s9242020-kj16`,
image `taxila-web:9242020` (Wave 1 + router ship-now fixes). Production DB = `.env.local` `DATABASE_URL` (verified
identical to taxila-web's `DATABASE_URL` secret by string compare; never printed). `TAXILA_OPS_KEY` from `.env.local`
(verified equal to the Container App's value). No product code was changed. Nothing committed or pushed.

Run from the US sandbox container under `NODE_USE_ENV_PROXY=1`, 2026-10-04 13:52–16:xx UTC.

## Summary

| step | check | result |
|---|---|---|
| 1 | `deploy-worker.mjs --jobs` (clean worktree) | __WORKER__ |
| 2 | probe image rebuild (`infra/probes/deploy.mjs`) | PASS — `taxila-probe:pmutvrmyw`, jobs ci + eus2 updated |
| 2 | probe adhoc `w1a-text-voice` (eastus2) | PASS 3/3 — p50 182 ms, p90 224 ms, n = 20 (bar ≤ 400 ms, enforced) — see note T3 |
| 3 | w0-smoke | PASS 5/5 |
| 3 | w1a-battery | PASS 16/16 |
| 3 | w1a-practice-ask | sandbox: FAIL (crash, env) → routed: PASS 23/23 |
| 3 | w1a-text-voice (sandbox) | PASS 3/3 (p50 175 ms, timing not gated from sandbox) |
| 3 | w1a-young-text | sandbox: FAIL (timeout, env) → routed: PASS 14/14 |
| 3 | w1b-mounts | PASS 54/54 (6 WARN, coverage notes) |
| 3 | w1b-tray | PASS 10/10 (routed) |
| 3 | w1c-reteach | PASS 13/13 |
| 3 | w1c-three-day | PASS 22/22 (1 WARN: delayed check cannot lift shallow, known) |
| 3 | w1c-settle (4 chunks, 28 lessons) | PASS — 63/63 held verdicts settled = 100 % (bar ≥ 95 %), 0 late |
| 3 | w1d-eyes | PASS 18/18 (routed; 5xx alert FIRED 14:48:33Z) |
| 3 | w1d-conductor | __CONDUCTOR__ |
| 3 | w1f-face | PASS 32/32 (routed) |
| 3 | `verify-release --live --only live-probes,prod-smoke` | PASS 2/2 gates (live-probes 10/10, prod-smoke 9/9) |
| 4 | leftover @taxila.test guardians | __GUARDIANS__ |

**Real product bugs found: none.** Every failure traced to the sandbox network path or the test harness (below).

"routed" = Chromium's same-origin requests served through Node `fetch` by a scratch preload
(`--import pwroute.mjs`, not in the repo), the method already used in `docs/design/gap-audit/live-content.md`
because the sandbox proxy answers Chromium with `net::ERR_TOO_MANY_RETRIES`. API-only tests ran unrouted.

## Failures, with diagnosis

### F1 — w1a-practice-ask, unrouted: process crash (ENV + test bug)
Output (both runs, 13:54 and 13:57 UTC): 8/8 API checks PASS, then
```
page.waitForResponse: Target page, context or browser has been closed
    at startStatus (tests/prod/w1a-practice-ask.mjs:38:43)
```
and the process exits before `withTestAccount`'s `finally` → no `cleanup: account deleted`.
Diagnosis: `page.goto(/c/<id>/practice)` threw because the sandbox proxy failed Chromium's asset loads
(`net::ERR_TOO_MANY_RETRIES` on `/assets/Teacher-*.css`, `/assets/tier-*.js`, `/fonts/*.woff2`; the same URLs return
200 to `curl` in 0.4 s and load in < 1 s when routed). The `finally { browser.close() }` then rejected the
already-created, not-yet-awaited `waitForResponse` promise → unhandled rejection → crash. **Environment**, plus a
**test bug**: a dangling `waitForResponse` promise turns any page error into a process crash that skips account
cleanup (leaked 2 guardians, deleted by hand in step 4). Routed rerun: 23/23 PASS.

### F2 — w1a-young-text, unrouted: timeout (ENV)
`FAIL test threw: page.waitForResponse: Timeout 45000ms exceeded while waiting for event "response"`. Same proxy
cause (the Desk never booted). Routed rerun: 14/14 PASS.

### T3 — probe adhoc did not gate timing as instructed (harness gap)
`TAXILA_PROBE=1 node infra/probes/deploy.mjs --adhoc "node tests/prod/w1a-text-voice.mjs"` sets TAXILA_PROBE only in
the sandbox; `adhoc()` passes the job just `TAXILA_BASE`, so in Azure the file printed
`WARN timing bar … enforced only from the Azure probe` and passed 2/2 (p50 176 ms, p90 197 ms, n = 20) without the bar.
Re-run with the variable inside the job command (`--adhoc "TAXILA_PROBE=1 node tests/prod/w1a-text-voice.mjs"`):
`PASS p50 182 ms ≤ 400 ms (n = 20, probe)`, 3/3. **Test/infra**: `--adhoc` should forward TAXILA_PROBE.
Also the first adhoc's local poller died on `ConnectTimeoutError … management.azure.com:443` (one transient ARM
connect timeout; `until()`/`arm()` do not retry); the execution itself Succeeded and its lines were read from Log
Analytics. **Env/harness**, not product.

### T4 — deploy freeze (not a failure)
At 13:52 UTC (19:22 IST) `deploy-worker.mjs` refuses production deploys (X37 freeze 18:00–21:30 IST). `--force` was
not used; the worker deploy ran after 16:00 UTC (21:30 IST) and w1d-conductor after it.

### T5 — the guardian-count check is global (harness noise)
`leftover @taxila.test guardians` is a count over the whole DB; during this run it read 10 → 9 inside one file
(another session's account went away mid-run). It can false-fail or false-pass when other sessions test concurrently.

## Step detail

### Step 1 — worker
__WORKER_DETAIL__

### Step 3 — w1c-settle split
| delay | lessons | held | settled | late-corrected | file time |
|---|---|---|---|---|---|
| 0 s | 8 | 17 | 17 | 0 | 386 s |
| 1 s | 8 | 20 | 20 | 0 | 464 s |
| 2 s | 7 | 15 | 15 | 0 | 524 s |
| 4 s | 5 | 11 | 11 | 0 | 528 s |
| **all** | **28** | **63** | **63 (100 %)** | 0 | |

Wilson 95 % lower bound for 63/63 = 94.3 %; the point estimate meets ≥ 95 %, the interval does not exclude 94 %.
Lesson counts were reduced at 2 s / 4 s so each chunk stayed under 600 s (measured 75 s/lesson at 2 s).

### Step 3 — w1b-mounts WARNs (coverage, not failures)
c5-maths-ch02-t01 and c6-science-ch02-t01: one G1 fill posed, only the wrong commit sent; c6-maths-ch07-t01 and
c7-maths-ch08-t01: item-bound only through G1 fills (no catalog-bound engine), only the right commit sent.

### Step 4 — test accounts
__GUARDIANS_DETAIL__
