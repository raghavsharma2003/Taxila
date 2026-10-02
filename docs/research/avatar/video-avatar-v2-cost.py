# Reproduces the tables in video-avatar-v2.md section 8. Run: python3 video-avatar-v2-cost.py
# Every price is tagged: V = verified 2026-10-02 (Azure Retail Prices API / vendor docs), S = secondary, U = assumption.
INR_PER_USD = 87.0          # U (same rate the market docs use)
EUR_USD = 1.17              # U
LESSON_MIN, LESSONS_PER_MONTH = 45, 20
SPEAK_SHARE = 0.40          # teacher speaks 40% of a lesson (tech-and-market 1.9 model)
LIVE_DIALOG_MIN = 12        # hybrid design: cached narration + ~12 min live dialog (tech-and-market 1.9)
MOMENT_MIN = 2              # greeting + celebration only

# ---- per-minute vendor / Azure prices (billed per SESSION minute unless noted) ----
PRICES = {
  'Azure TTS avatar, standard, real-time (V)':      0.50,
  'Azure TTS avatar, HD standard, real-time (V)':   0.70,
  'Azure TTS avatar, custom, real-time (V)':        0.60,   # + $0.60/h hosting per custom avatar endpoint (V)
  'Azure photo avatar (VASA-1) real-time (S)':      0.60,
  'Tavus CVI overage (V, pricing page)':            0.345,  # $0.32-0.37
  'Beyond Presence Scale overage (V, EUR)':         0.0875 * EUR_USD,
  'HeyGen LiveAvatar LITE, Business plan (V)':      475 / 6010,
  'HeyGen LiveAvatar LITE, Essential plan (V)':     99 / 1110,
  'Simli (marketing "<$0.01", S)':                  0.01,
}

# ---- self-hosted on Azure GPU (Central India, on-demand Linux, Retail Prices API 2026-10-02, V) ----
A100_VM_H = 5.142           # Standard_NC24ads_A100_v4, centralindia
A100_SPOT_H = 0.950         # same, Spot (offline rendering only: eviction kills a live lesson)
T4_ACA_H = 0.000102 * 3600  # ACA serverless T4, centralindia, per second -> per hour
VCPU_ACA_H = 0.000024 * 3600
EGRESS_GB = 0.11            # first tier internet egress, centralindia (V)
VIDEO_KBPS = 500            # U: 512x512-720p talking head H.264 at 25 fps
HEADROOM = 0.70             # fraction of GPU stream capacity we plan to use (bursts of overlapping speech)

def self_hosted(gpu_h, talking_streams_per_gpu, label):
    sessions_per_gpu = talking_streams_per_gpu / SPEAK_SHARE * HEADROOM
    gpu = gpu_h / 60 / sessions_per_gpu
    enc = 0.5 * VCPU_ACA_H / 60                       # U: 0.5 vCPU x264 per session
    egr = VIDEO_KBPS / 8 * 60 / 1024 / 1024 * EGRESS_GB  # GB per minute * $/GB
    return label, gpu + enc + egr, sessions_per_gpu

SELF = [
  # talking streams per GPU at 25 fps (all U except where a source exists):
  self_hosted(T4_ACA_H, 1.5, 'Self-host Wav2Lip-256 on ACA T4 (U: 1.5 streams; LiveTalking 60 fps on RTX 3060 [V])'),
  self_hosted(A100_VM_H, 2.0, 'Self-host MuseTalk 1.5 on A100 VM (U: 2 streams; 72 fps on 4090 [V])'),
  self_hosted(A100_VM_H, 1 / 0.895, 'Self-host Ditto on A100 VM (RTF 0.895 on A100 [V, paper])'),
]

def monthly(per_min, minutes_per_lesson):
    return per_min * minutes_per_lesson * LESSONS_PER_MONTH

print('== Avatar cost per student-month (20 lessons) ==')
print(f"{'option':78s} {'$/min':>7s} {'full 45m':>9s} {'hybrid 12m':>10s} {'moments 2m':>10s}")
rows = list(PRICES.items()) + [(l, c) for l, c, _ in SELF]
for label, p in rows:
    print(f"{label:78s} {p:7.4f} {monthly(p, LESSON_MIN):9.2f} {monthly(p, LIVE_DIALOG_MIN):10.2f} {monthly(p, MOMENT_MIN):10.2f}")
for l, c, s in SELF:
    print(f"  {l[:40]:40s} sessions per GPU at {HEADROOM:.0%} headroom: {s:.1f}")

print('\n== What each price tier can afford (avatar budget = 20% of revenue) ==')
for inr in (299, 499, 999, 1499, 2999):
    budget = inr / INR_PER_USD * 0.20
    print(f"Rs{inr:5d}/mo -> ${budget:5.2f}/mo -> max ${budget / (LESSON_MIN * LESSONS_PER_MONTH):.4f}/session-min (full) "
          f"| ${budget / (LIVE_DIALOG_MIN * LESSONS_PER_MONTH):.4f}/min (hybrid) | ${budget / (MOMENT_MIN * LESSONS_PER_MONTH):.4f}/min (moments)")

print('\n== Pre-rendered narration video (cached across students) ==')
LIB_MIN = 2000 * 15         # U: ~2,000 lessons x 15 min of identical narration
for chars in (1, 5):
    for label, rt_factor, streams in (('MuseTalk offline, Spot A100', 1.2, 2), ('diffusion (LatentSync-class), Spot A100', 0.1, 1)):
        per_vmin = A100_SPOT_H / 60 / (rt_factor * streams)     # U: rt_factor = video-min produced per wall-min per stream
        print(f"{chars} character(s), {label:42s}: ${LIB_MIN * chars * per_vmin:9,.0f} one-time  (${per_vmin:.4f}/video-min)")
narr_egress = 15 * VIDEO_KBPS / 8 * 60 / 1024 / 1024 * EGRESS_GB * LESSONS_PER_MONTH
print(f"CDN-less egress for 15 min narration x 20 lessons: ${narr_egress:.2f}/student-month")

print('\n== Fleet size for self-hosted MuseTalk (A100 VMs), peak evening load ==')
_, c_muse, s_muse = SELF[1]
for students in (100, 1000, 10000):
    for mode, live_min in (('full', LESSON_MIN), ('hybrid', LIVE_DIALOG_MIN)):
        # U: lessons concentrated in a 4 h evening window, 30 days, peak factor 1.5
        conc = students * LESSONS_PER_MONTH * live_min / 60 / (30 * 4) * 1.5
        gpus = max(1, -(-conc // s_muse))
        gpu_hours = students * LESSONS_PER_MONTH * live_min / 60 / s_muse
        floor = A100_VM_H * 730   # one always-warm GPU
        cost = max(floor, gpu_hours * A100_VM_H)
        print(f"{students:6d} students {mode:6s}: peak {conc:6.0f} sessions -> {gpus:4.0f} A100 at peak; "
              f"${cost:9,.0f}/mo (${cost / students:6.2f}/student) [floor ${floor:,.0f}]")
print('\n== Grant burn: student-months per $10k of grant ==')
for label, p in [('Azure standard avatar full', 0.50), ('Azure standard avatar hybrid', 0.50)]:
    m = LESSON_MIN if 'full' in label else LIVE_DIALOG_MIN
    print(f"{label:34s}: {10000 / monthly(p, m):6.1f} student-months")
print(f"{'Self-host MuseTalk hybrid':34s}: {10000 / monthly(c_muse, LIVE_DIALOG_MIN):6.1f} student-months (marginal, excl. warm floor)")
