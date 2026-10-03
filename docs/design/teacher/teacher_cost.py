# TEACHER-VISUAL.md section 2: per-student-month cost of a video teacher vs the 3D teacher.
# Re-derives docs/research/avatar/video-avatar-v2-cost.py with (a) prices re-pulled 2026-10-03 from the Azure Retail
# Prices API (azure-prices-2026-10-03.json, written by azure_prices_pull.py), (b) the graphics review's corrections
# (pinned sessions, Wav2Lip dropped as non-commercial, peak-window fleet), (c) the price tiers and FX of
# docs/research/market/pricing-unit-econ.md (Rs 96 = $1, prices GST-inclusive, revenue net of 18% GST).
# Tags: V = price row in the JSON; R = docs/research (cited); U = assumption. Run: python3 teacher_cost.py
import json, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, "azure-prices-2026-10-03.json")))["queries"]

def row(q, pred):
    r = [x for x in P[q]["rows"] if pred(x)]
    assert r, (q, "no row")
    return r[0]["retailPrice"]

av = lambda name: row("avatar_centralindia", lambda x: x["meterName"] == name)
vm = lambda sku, spot=False: row("gpu_vm_centralindia", lambda x: x["armSkuName"] == sku and ("Spot" in x["meterName"]) == spot and "Low Priority" not in x["meterName"] and "Windows" not in (x["productName"] or ""))
sora = lambda name, region="eastus2": row("sora_video_any", lambda x: x["meterName"] == name and x["armRegionName"] == region)

PRICE = {
    "az_avatar_std_rt": av("TTS Standard Avatar Realtime Speech"),        # V $/min
    "az_avatar_hd_rt": av("TTS HD Standard Avatar Realtime Speech"),
    "az_avatar_custom_rt": av("TTS Custom Avatar Realtime Speech"),
    "az_avatar_custom_host_h": av("TTS Custom Avatar Hosting Unit"),       # V $/h per endpoint
    "az_avatar_std_batch": av("TTS Standard Avatar Batch Speech"),
    "az_avatar_custom_batch": av("TTS Custom Avatar Batch Speech"),
    "a100_vm_h": vm("Standard_NC24ads_A100_v4"),                           # V centralindia on-demand
    "a100_spot_h": vm("Standard_NC24ads_A100_v4", spot=True),
    "a10_vm_h": vm("Standard_NV36ads_A10_v5"),
    "rtx6000_quarter_h": vm("Standard_NC24lds_xl_RTXPRO6000BSE_v6"),
    "aca_a100_s": row("aca_centralindia", lambda x: x["meterName"] == "Standard NC A100 v4 GPU Usage"),  # V row; regional availability U
    "aca_t4_s": row("aca_centralindia", lambda x: x["meterName"] == "Standard NC T4 v3 GPU Usage"),
    "egress_gb": 0.11,                                                      # V (Internet routing, first paid tier)
    "sora2_s": sora("Sora 2 glbl Second"),                                  # V eastus2 global standard
    "sora2pro_s": sora("Sora 2 pro glbl Second"),
}

INR_PER_USD, GST = 96.0, 0.18            # R pricing-unit-econ.md
TIERS = [299, 699, 999, 1499]            # R
# Teacher-on-screen live dialog minutes a tier can afford for VOICE (cascade, 55% margin) [R pricing-unit-econ.md 0.4]
LIVE_MIN = {299: 92, 699: 388, 999: 610, 1499: 980}
FULL_MIN = 20 * 45                       # R video-avatar-v2: 20 lessons x 45 min, teacher on screen throughout
MOMENT_MIN = 20 * 2                      # R: 2 min per lesson of live, per-child moments (greeting, celebration)
TALK = 0.40                              # R: teacher speaks 40% of a session
VIDEO_KBPS, AUDIO_KBPS, OVERHEAD = 500, 32, 1.08   # R graphics review R2 (video + Opus + RTP/FEC)
MB_PER_MIN = (VIDEO_KBPS + AUDIO_KBPS) * OVERHEAD * 60 / 8 / 1000
EGRESS_PER_MIN = MB_PER_MIN / 1024 * PRICE["egress_gb"]

def per_min(gpu_h, sessions):            # GPU share + egress; encode runs on the VM's own vCPUs (A100 has no NVENC)
    return gpu_h / 60 / sessions + EGRESS_PER_MIN

# Live renderers: (label, $/session-min, licence verdict). Sessions per GPU per graphics review R1.8 (pinned) [U].
LIVE = [
    ("Azure TTS avatar, standard, real-time", PRICE["az_avatar_std_rt"], "Azure first-party; does NOT take our audio (renders its own TTS voice) [R]"),
    ("Azure TTS avatar, HD, real-time", PRICE["az_avatar_hd_rt"], "same"),
    ("Azure TTS avatar, custom, real-time (+$0.60/h hosting each)", PRICE["az_avatar_custom_rt"], "limited access; actor video; same voice problem"),
    ("MuseTalk 1.5, A100 VM, pinned 2 sessions/GPU", per_min(PRICE["a100_vm_h"], 2), "MIT code + weights: clean [R]"),
    ("MuseTalk 1.5, A100 VM, pooled 3.5 sessions/GPU", per_min(PRICE["a100_vm_h"], 3.5), "clean; needs the per-utterance GPU-pool scheduler (3-4 wk) [R]"),
    ("MuseTalk 1.5, ACA serverless A100 (centralindia row), pinned 2", per_min(PRICE["aca_a100_s"] * 3600, 2), "NOT AVAILABLE: price row exists but the ACA doc (2026-09-24) lists Central India A100 = No (nearest: Australia East); no UDP ingress"),
    ("MuseTalk 1.5, 1/4 RTX PRO 6000 slice, 1 session", per_min(PRICE["rtx6000_quarter_h"], 1), "clean; NVENC in a vGPU slice unmeasured (E-13) [U]"),
    ("MuseTalk 1.5, A10 VM, 1 session (throughput unmeasured)", per_min(PRICE["a10_vm_h"], 1), "clean [U]"),
    ("Ditto, A100 VM, pinned 1 session", per_min(PRICE["a100_vm_h"], 1), "NOT clean: InsightFace detector + HF weights with no licence [R]"),
    ("LivePortrait driven by our FaceFrame, A100 VM, 2 sessions (renders every frame)", per_min(PRICE["a100_vm_h"], 2), "NOT clean until InsightFace is swapped; retarget model is research [R]"),
]

def money(x): return f"${x:,.2f}"
print("## Prices re-pulled 2026-10-03 (Azure Retail Prices API)")
for k, v in PRICE.items(): print(f"- {k}: {v}")
print(f"- derived: {MB_PER_MIN:.2f} MB per video-minute; egress ${EGRESS_PER_MIN:.5f}/min")

print("\n## A. Live video per student-month (marginal; no warm floor)")
print("| renderer | $/session-min | full lessons (900 min) | hybrid: live = tier's dialog minutes (299 / 699 / 999 / 1499) | moments (40 min) | licence |")
print("|---|---|---|---|---|---|")
for label, c, lic in LIVE:
    hy = " / ".join(money(c * LIVE_MIN[t]) for t in TIERS)
    print(f"| {label} | {c:.4f} | {money(c * FULL_MIN)} | {hy} | {money(c * MOMENT_MIN)} | {lic} |")

print("\n## B. What a tier earns and what share a video teacher would take")
print("| tier | net revenue/mo | 5% of net | 20% of net | MuseTalk pooled hybrid | as % of net | MuseTalk pinned moments | % | Azure std moments | % |")
print("|---|---|---|---|---|---|---|---|---|---|")
mp, mpin, az = LIVE[4][1], LIVE[3][1], LIVE[0][1]
for t in TIERS:
    net = t / (1 + GST) / INR_PER_USD
    h, m, a = mp * LIVE_MIN[t], mpin * MOMENT_MIN, az * MOMENT_MIN
    print(f"| Rs{t} | {money(net)} | {money(net*.05)} | {money(net*.2)} | {money(h)} | {h/net:.0%} | {money(m)} | {m/net:.0%} | {money(a)} | {a/net:.0%} |")

print("\n## C. Pre-rendered, shared clips (one-time per character; every child sees the same clip)")
LIB_NARR = 2000 * 15        # R: 30,000 narration minutes per character
LIB_MOMENTS = 300 * 8 / 60  # U: 300 moment clips (greetings without names, praise, transitions) x 8 s = 40 min
rows = [
    ("MuseTalk 1.5 offline, Spot A100 (1.2x real time, 2 streams) [R, throughput U]", PRICE["a100_spot_h"] / 60 / (1.2 * 2)),
    ("LatentSync-class diffusion, Spot A100 (0.1x) [R; InsightFace trap]", PRICE["a100_spot_h"] / 60 / 0.1),
    ("Azure TTS avatar batch, standard (stock avatar, Azure voice)", PRICE["az_avatar_std_batch"]),
    ("Azure TTS avatar batch, custom (actor-trained)", PRICE["az_avatar_custom_batch"]),
    ("Sora 2 (eastus2 global), 1 take [faces rejected; own audio; retiring]", PRICE["sora2_s"] * 60),
    ("Sora 2 Pro, 1 take", PRICE["sora2pro_s"] * 60),
]
print("| renderer | $/video-min | 40-min moments library | 30,000-min narration library |")
print("|---|---|---|---|")
for label, c in rows:
    print(f"| {label} | {c:.4f} | {money(c * LIB_MOMENTS)} | {money(c * LIB_NARR)} |")
narr_stream = 15 * 20 * EGRESS_PER_MIN
print(f"\nStreaming 15 min of pre-rendered narration x 20 lessons = {15*20*MB_PER_MIN/1024:.2f} GB/child-month -> {money(narr_stream)} egress; the parent's data plan carries the same GB.")

print("\n## D. Fleet floor for live MuseTalk (A100 VMs held for a 5 h evening window, pinned 2 sessions/GPU)")
print("| paying students on the video tier | mode | peak sessions | GPUs | $/month | $/student |")
print("|---|---|---|---|---|---|")
for n in (100, 600, 1000, 10000):
    for mode, mins in (("hybrid (Rs999 dialog minutes)", LIVE_MIN[999]), ("full", FULL_MIN)):
        conc = n * mins / 60 / (30 * 4) * 1.5      # R: 4 h usage window, 1.5 peak factor
        gpus = max(1, math.ceil(conc / 2))
        cost = gpus * 5 * 30 * PRICE["a100_vm_h"]  # R1.8: allocate for the window + warm-up
        print(f"| {n:,} | {mode} | {conc:,.0f} | {gpus:,} | {money(cost)} | {money(cost/n)} |")

print("\n## E. The 3D teacher (for comparison)")
glb_mb = 4.0   # U: hero GLB + KTX2 textures, fetched once per device, then cached (APK bundles it)
print(f"- runtime compute: $0 (renders on the child's phone). Delivery: {glb_mb} MB once = {money(glb_mb/1024*PRICE['egress_gb'])} per device.")
print("- one-time build per character: artist + art-director time (section 9 of TEACHER-VISUAL.md), not GPU.")
