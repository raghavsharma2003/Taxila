#!/usr/bin/env python3
"""Per-student workspace cost model (Taxila, 2026-10-02).

Deterministic; re-run with `python3 docs/research/conductor/student-workspace-cost.py`.
Prices [V] were read from the Azure Retail Prices API (prices.azure.com) and neon.com/pricing on
2026-10-02. Every usage number below is an assumption [U] and is labelled as such; change it and re-run.
Scope: the WORKSPACE only (state, storage, sync, per-child compute). Live voice, LLM calls and Forge
generation are costed in orchestration-architecture.md §9 and tech-and-market.md §1.9.
"""

# ---------- prices [V] ----------
ACA_VCPU_S = 0.000024        # $/vCPU-second, Consumption active (eastus2)
ACA_GIB_S = 0.000003         # $/GiB-second, Consumption active
ACA_REQ_M = 0.40             # $/million requests
ACA_SESSION_H = 0.03         # $/session-hour, dynamic sessions (code interpreter)
NEON_CU_H = 0.222            # $/CU-hour, Scale plan
NEON_GB_MO = 0.35            # $/GB-month Postgres storage
NEON_HIST_GB_MO = 0.20       # $/GB-month instant-restore history
BLOB_HOT_LRS_CI = 0.020      # $/GB-month, Central India, Hot LRS
BLOB_COOL_LRS_CI = 0.011     # $/GB-month, Central India, Cool LRS
BLOB_PREM_ZRS_CI = 0.279     # $/GB-month, Central India, Premium ZRS (sandbox snapshot meter)
BLOB_PREM_ZRS_E2 = 0.200     # $/GB-month, eastus2, Premium ZRS
BLOB_WRITE_10K = 0.055       # $/10k write ops, Hot LRS (Central India)
BLOB_READ_10K = 0.0044       # $/10k read ops, Hot LRS
KV_OP_10K = 0.03             # $/10k Key Vault operations (Standard)
AFD_BASE_MO = 35.0           # $/month Front Door Standard base fee
AFD_REQ_M = 0.6              # $/million requests (Standard Requests meter; some zones list 1.0)
# Front Door Standard data transfer out, "Zone 5" tiers (zone→country mapping [S]); (from_GB, $/GB)
AFD_EGRESS_TIERS = [(0, 0.109), (10_000, 0.084998), (50_000, 0.082001), (150_000, 0.02858),
                    (500_000, 0.010104), (1_000_000, 0.009102), (5_000_000, 0.008001)]

# ---------- usage per active student per month [U] ----------
LESSONS = 20                 # live or practice sessions per month
LESSON_MIN = 25              # average minutes per session
TURNS_PER_LESSON = 100       # child + teacher turns
EVENTS_PER_DAY = 25          # student_event rows per active day (boundary facts, not turns)
ACTIVE_DAYS = 20
EVIDENCE_PER_LESSON = 40     # kt_evidence rows
ROW_B = {"turn": 450, "evidence": 220, "event": 380, "decision": 300}  # bytes incl. index overhead
HOT_DAYS = {"turn": 30, "evidence": 180, "event": 400, "decision": 90}
SMALL_STATE_MB = 0.35        # skill/misconception state, memory, prefs, conductor_state, plans(90 d), shelf
COMPRESS = 5.0               # zstd ratio for archived NDJSON segments
NOTEBOOK_KB_PER_LESSON = 30  # child-ink + teacher-anchor op logs, compressed
PACK_MB_PER_DAY = 3.0        # offline pack: items, params, narration clips (Opus), images
MODULE_MB_PER_LESSON = 2.0   # library artefacts fetched live (games, images) beyond the pack
SYNC_CALLS_PER_DAY = 60      # device ↔ /api/ws/* requests
NIGHT_BUILD_VCPU_S = 3.0     # pack + brief build per child per active day
DEK_UNWRAPS = 40             # Key Vault unwraps per month (session opens; cached otherwise)
MONTHS_RETAINED = 12         # archive depth used for the steady-state blob figure

# ---------- shared infrastructure [U] ----------
STATEMENTS_PER_TURN = 6
CU_STATEMENTS_PER_S = 800    # sustained simple OLTP statements/s per Neon CU (measure: WS-M2)
HEADROOM = 3.0
STUDENTS_PER_CELL = 150_000  # one Neon project ("cell") per this many students
CELL_FLOOR_CU = 1.0          # always-on floor per cell (no scale-to-zero in production)


def afd_egress_cost(gb):
    cost, tiers = 0.0, AFD_EGRESS_TIERS + [(float("inf"), 0)]
    for (lo, p), (hi, _) in zip(tiers, tiers[1:]):
        if gb > lo:
            cost += (min(gb, hi) - lo) * p
    return cost


def per_student_bytes():
    lessons_rows = {"turn": LESSONS * TURNS_PER_LESSON, "evidence": LESSONS * EVIDENCE_PER_LESSON,
                    "event": EVENTS_PER_DAY * ACTIVE_DAYS, "decision": EVENTS_PER_DAY * ACTIVE_DAYS}
    hot_mb = SMALL_STATE_MB + sum(lessons_rows[k] * ROW_B[k] * HOT_DAYS[k] / 30 for k in ROW_B) / 1e6
    write_mb_mo = sum(lessons_rows[k] * ROW_B[k] for k in ROW_B) / 1e6
    archive_mb_mo = write_mb_mo / COMPRESS + LESSONS * NOTEBOOK_KB_PER_LESSON / 1000
    return hot_mb, write_mb_mo, archive_mb_mo


def option_a(n):
    """Logical workspace: Neon (cells) + Blob + device cache/outbox."""
    hot_mb, write_mb, arch_mb = per_student_bytes()
    cells = max(1, -(-n // STUDENTS_PER_CELL))
    lesson_hours = n * LESSONS * LESSON_MIN / 60
    st_per_lesson_s = STATEMENTS_PER_TURN * TURNS_PER_LESSON / 2 / (LESSON_MIN * 60)
    cu_h_load = lesson_hours * st_per_lesson_s / CU_STATEMENTS_PER_S * HEADROOM
    cu_h = cu_h_load + cells * CELL_FLOOR_CU * 730
    neon = cu_h * NEON_CU_H + n * hot_mb / 1000 * NEON_GB_MO + n * write_mb / 1000 * (7 / 30) * NEON_HIST_GB_MO
    blob_store = n * arch_mb * MONTHS_RETAINED / 1000 * BLOB_COOL_LRS_CI
    blob_ops = n * (LESSONS * 3) / 1e4 * BLOB_WRITE_10K + n * LESSONS * 5 / 1e4 * BLOB_READ_10K
    egress_gb = n * (PACK_MB_PER_DAY * ACTIVE_DAYS + MODULE_MB_PER_LESSON * LESSONS) / 1000
    cdn = AFD_BASE_MO + afd_egress_cost(egress_gb) + n * (ACTIVE_DAYS * 40) / 1e6 * AFD_REQ_M
    api = n * SYNC_CALLS_PER_DAY * ACTIVE_DAYS / 1e6 * ACA_REQ_M
    night = n * ACTIVE_DAYS * NIGHT_BUILD_VCPU_S * (ACA_VCPU_S + 2 * ACA_GIB_S)
    kv = n * DEK_UNWRAPS / 1e4 * KV_OP_10K
    parts = {"neon": neon, "blob": blob_store + blob_ops, "cdn": cdn, "api+night": api + night, "keys": kv}
    return parts, cells, cu_h


def option_b(n, tier_vcpu=0.25, tier_gib=0.5, snapshot_gb=1.0, idle_min=5, always_on=False):
    """Real per-student ACA Sandbox, suspended between sessions, PLUS the Postgres that cross-child
    reads still need (parent dashboard, KT refits, Forge library, safety, analytics)."""
    a, _, _ = option_a(n)
    hours = 730 if always_on else LESSONS * (LESSON_MIN + idle_min) / 60
    compute = n * hours * 3600 * (tier_vcpu * ACA_VCPU_S + tier_gib * ACA_GIB_S)
    snaps = n * snapshot_gb * BLOB_PREM_ZRS_CI
    peak_concurrent = n * 0.4 * 0.25 * (LESSON_MIN / 60)   # 40% daily, 25% of them in the peak hour
    cores = peak_concurrent * tier_vcpu
    parts = dict(a)
    parts["sandbox compute"] = compute
    parts["sandbox snapshots"] = snaps
    return parts, cores


def option_c(n):
    """Browser-local only (no server copy). Shown for completeness; fails requirements (§3)."""
    egress_gb = n * (PACK_MB_PER_DAY * ACTIVE_DAYS + MODULE_MB_PER_LESSON * LESSONS) / 1000
    return {"cdn": AFD_BASE_MO + afd_egress_cost(egress_gb)}


def fmt(x):
    return f"${x:,.0f}" if x >= 10 else f"${x:,.2f}"


if __name__ == "__main__":
    hot, wr, arch = per_student_bytes()
    print(f"per student: hot Postgres {hot:.2f} MB, writes {wr:.2f} MB/mo, archive +{arch:.2f} MB/mo "
          f"({arch * MONTHS_RETAINED:.1f} MB after {MONTHS_RETAINED} mo)")
    print("\n| students | A: logical workspace /mo | A per student | B: sandbox per child (suspended) /mo | "
          "B per student | B peak cores (quota 500) | B always-on per student | C: local only /mo |")
    print("|---|---|---|---|---|---|---|---|")
    for n in (10_000, 100_000, 1_000_000):
        a, cells, cu = option_a(n)
        b, cores = option_b(n)
        b_on, _ = option_b(n, always_on=True)
        c = option_c(n)
        ta, tb, tbo, tc = sum(a.values()), sum(b.values()), sum(b_on.values()), sum(c.values())
        print(f"| {n:,} | {fmt(ta)} | {fmt(ta / n)} | {fmt(tb)} | {fmt(tb / n)} | {cores:,.0f} | {fmt(tbo / n)} | {fmt(tc)} |")
    print("\nOption A breakdown:")
    for n in (10_000, 100_000, 1_000_000):
        a, cells, cu = option_a(n)
        print(f"  {n:>9,}: cells={cells} CU-h={cu:,.0f} " + " ".join(f"{k}={fmt(v)}" for k, v in a.items()))
