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
