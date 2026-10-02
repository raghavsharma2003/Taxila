#!/usr/bin/env python3
"""Architect-review sensitivity checks for student-workspace.md (Taxila, 2026-10-02).

Deterministic; `python3 docs/research/conductor/student-workspace-review-cost.py`.
Re-uses the prices in student-workspace-cost.py [V there]. Every usage input here is [U] and is named.
It answers four questions the base model does not ask:
  1. WAL/history: what do jsonb state-row rewrites add to Neon "history" (billed $0.20/GB-month)?
  2. Peak DB load: what do device sync calls add, and does a 150k cell stay under the 16 CU ceiling?
  3. Notebook ink: how many rows/month if every stroke op is its own row?
  4. CDN: what does a short video per lesson add, and what does device-side dedup save?
"""
import importlib.util, pathlib

spec = importlib.util.spec_from_file_location(
    "ws", pathlib.Path(__file__).with_name("student-workspace-cost.py"))
ws = importlib.util.module_from_spec(spec); spec.loader.exec_module(ws)

N = 1_000_000
CELL = ws.STUDENTS_PER_CELL

# ---- 1. WAL from state-row rewrites [U] ----
CONDUCTOR_UPDATES_PER_DAY = 25        # one per student_event folded
CONDUCTOR_ROW_KB_COMPRESSED = 5       # conductor_state jsonb after TOAST pglz
DIRECTOR_UPDATES_PER_LESSON = 50      # lesson.state rewritten per Director step
DIRECTOR_ROW_KB_COMPRESSED = 4
FPW_FACTOR = 1.5                      # full-page writes after checkpoints, index updates
wal_mb = (CONDUCTOR_UPDATES_PER_DAY * ws.ACTIVE_DAYS * CONDUCTOR_ROW_KB_COMPRESSED
          + DIRECTOR_UPDATES_PER_LESSON * ws.LESSONS * DIRECTOR_ROW_KB_COMPRESSED) / 1000 * FPW_FACTOR
_, base_write_mb, _ = ws.per_student_bytes()
for window_days in (7, 30):
    base = N * base_write_mb / 1000 * window_days / 30 * ws.NEON_HIST_GB_MO
    extra = N * wal_mb / 1000 * window_days / 30 * ws.NEON_HIST_GB_MO
    print(f"[1] history window {window_days:>2} d at 1M: base model ${base:,.0f}/mo; "
          f"+state rewrites ({wal_mb:.1f} MB/child-mo WAL) ${extra:,.0f}/mo")

# ---- 2. Peak statements per cell [U] ----
DAILY_ACTIVE = 0.40
PEAK_HOUR_SHARE = 0.25                # of the day's lessons start in the peak hour (base model's figure)
SYNC_PEAK_SHARE = 0.5                 # half of the day's syncs land in a 4-hour evening window
SYNC_STATEMENTS = 8                   # device_child read, op inserts, doc version compare, ack update
concurrent = CELL * DAILY_ACTIVE * PEAK_HOUR_SHARE * (ws.LESSON_MIN / 60)
turn_st_s = concurrent * ws.STATEMENTS_PER_TURN * (ws.TURNS_PER_LESSON / 2) / (ws.LESSON_MIN * 60)
sync_req_s = CELL * DAILY_ACTIVE * ws.SYNC_CALLS_PER_DAY * SYNC_PEAK_SHARE / (4 * 3600)
sync_st_s = sync_req_s * SYNC_STATEMENTS
for label, st in (("turns only (base model)", turn_st_s), ("turns + sync", turn_st_s + sync_st_s)):
    cu = st * ws.HEADROOM / ws.CU_STATEMENTS_PER_S
    print(f"[2] 150k cell peak, {label}: {st:,.0f} statements/s -> {cu:.1f} CU with x{ws.HEADROOM:.0f} headroom "
          f"(ceiling 16; at 200 st/s/CU: {st * ws.HEADROOM / 200:.1f} CU)")
print(f"    concurrent lessons per cell at peak: {concurrent:,.0f}; sync requests/s: {sync_req_s:,.0f}")

# ---- 3. Notebook ink row churn [U] ----
STROKE_OPS_PER_LESSON = 600           # a child writing working on a board: strokes + erases
rows_per_month = N * ws.LESSONS * STROKE_OPS_PER_LESSON
BATCH_OPS_PER_ROW = 50                # one row per (page, writer, sync batch)
print(f"[3] notebook_op rows/month at 1M, one row per stroke: {rows_per_month / 1e9:.0f} B inserted then deleted; "
      f"batched x{BATCH_OPS_PER_ROW}: {rows_per_month / BATCH_OPS_PER_ROW / 1e9:.2f} B")

# ---- 4. CDN: video per lesson, and device dedup [U] ----
VIDEO_MB_PER_LESSON = 6.0             # one ~10 s sora-2 clip, 720p H.264
DEDUP_NEW_SHARE = 0.4                 # share of a day's pack bytes the device does not already hold
def cdn(pack_mb_day, module_mb_lesson):
    gb = N * (pack_mb_day * ws.ACTIVE_DAYS + module_mb_lesson * ws.LESSONS) / 1000
    return gb, ws.AFD_BASE_MO + ws.afd_egress_cost(gb)
for label, p, m in (("base model", ws.PACK_MB_PER_DAY, ws.MODULE_MB_PER_LESSON),
                    ("+1 video/lesson", ws.PACK_MB_PER_DAY, ws.MODULE_MB_PER_LESSON + VIDEO_MB_PER_LESSON),
                    ("device dedup of pack objects", ws.PACK_MB_PER_DAY * DEDUP_NEW_SHARE, ws.MODULE_MB_PER_LESSON)):
    gb, c = cdn(p, m)
    fam_mb = (p * ws.ACTIVE_DAYS + m * ws.LESSONS)
    print(f"[4] {label:<30} {gb / 1000:,.0f} TB/mo -> ${c:,.0f}/mo; family data {fam_mb:,.0f} MB/child-month")
