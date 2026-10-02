#!/usr/bin/env python3
"""Taxila K-9 India market-size model (bottom-up TAM/SAM/SOM).
Every input is tagged: V = read at primary source, S = secondary, D = derived, A = assumption.
Run: python3 market_size_model.py   (prints all tables used in market-size.md)
Sources: see market-size.md section 9. Date of model: 2026-10-02.
"""
INR_PER_USD = 88.0  # A: planning rate, not a forecast

# ---- UDISE+ 2025-26, Table 5.1-5.5 (V). Columns: primary(1-5), upper primary(6-8), secondary(9-10)
UD = {  # state: (total_primary, total_UP, total_sec, pvt_unaided_primary, pvt_unaided_UP, pvt_unaided_sec)
 "India":            (101915874, 63241424, 38290413, 40683127, 22321253, 13733265),
 "Uttar Pradesh":    (19055227, 11326899, 5932015, 9135436, 5372867, 3897946),
 "Bihar":            (9456028, 5801895, 2857196, 1458419, 720433, 373694),
 "Madhya Pradesh":   (6341133, 3797536, 2182486, 2865520, 1546350, 792198),
 "Rajasthan":        (6429327, 4086054, 2449038, 3410331, 1976864, 1114557),
 "Jharkhand":        (3241400, 1942997, 1162666, 386401, 287477, 352319),
 "Chhattisgarh":     (2408076, 1447013, 839820, 832062, 392052, 204568),
 "Haryana":          (2196563, 1499532, 933362, 1407167, 867265, 558148),
 "Delhi":            (1644731, 1179335, 722461, 877521, 436886, 212943),
 "Uttarakhand":      (916556, 572188, 361572, 596761, 320553, 178150),
 "Himachal Pradesh": (462209, 328308, 220306, 236199, 135278, 79914),
 "Chandigarh":       (76271, 62129, 39955, 32425, 21044, 14162),
}
HINDI_BELT = [k for k in UD if k != "India"]
CLASS9_SHARE_OF_SEC = 0.52   # A: class 9 is a bit larger than class 10 (repetition, 9->10 dropout); range 0.50-0.54

# ---- ASER 2024 rural, Annexure 3: % paid tuition (V). (I-V govt, I-V pvt, VI-VIII govt, VI-VIII pvt)
ASER_TUITION = {
 "India": (30.4, 28.5, 32.9, 24.5), "Uttar Pradesh": (17.5, 26.8, 15.9, 24.8), "Bihar": (66.3, 67.9, 75.1, 66.6),
 "Madhya Pradesh": (13.0, 14.9, 15.3, 15.5), "Rajasthan": (3.8, 9.1, 4.7, 8.3), "Jharkhand": (44.8, 48.2, 52.1, 46.1),
 "Chhattisgarh": (4.9, 12.6, 3.7, 11.4), "Haryana": (16.1, 26.8, 13.4, 24.2), "Uttarakhand": (12.2, 33.6, 11.1, 32.3),
 "Himachal Pradesh": (11.3, 16.5, 12.0, 20.3),
 # Delhi/Chandigarh are not in ASER rural; use CMS urban national rates (V) below.
}
# ---- CMS:E 2025 (NSS 80th round), PIB release charts (V): incidence % and spend per ENROLLED student (Rs/yr)
CMS_INC = {"primary": (21.6, 26.6, 22.9), "middle": (29.1, 31.0, 29.6), "secondary": (36.7, 40.2, 37.8)}  # rural, urban, all
CMS_SPEND = {"primary": (1039, 2108, 1313), "middle": (1745, 3326, 2189), "secondary": (3159, 6585, 4183)}

def k9(state):
    p, u, s, pp, pu, ps = UD[state]
    c9 = s * CLASS9_SHARE_OF_SEC
    pv9 = ps * CLASS9_SHARE_OF_SEC
    return dict(primary=p, middle=u, class9=c9, total=p + u + c9, pvt=pp + pu + pv9)

def tuition_rate(state, level):
    """Blended paid-tuition rate for a state and level. ASER rural weighted by private-unaided share (D)."""
    d = k9(state)
    if state not in ASER_TUITION:  # urban UTs
        return CMS_INC[level][1] / 100
    g15, p15, g68, p68 = ASER_TUITION[state]
    p, u, s, pp, pu, ps = UD[state]
    if level == "primary":
        w = pp / p; return ((1 - w) * g15 + w * p15) / 100
    w = pu / u; base = ((1 - w) * g68 + w * p68) / 100
    if level == "middle":
        return base
    return min(base + 0.10, base * CMS_INC["secondary"][2] / CMS_INC["middle"][2])  # class 9 uplift, CMS ratio, capped +10pp (D/A)

# ASER (Sep-Dec fieldwork, "paid tuition") runs above CMS (Apr-Jun fieldwork, "taking/had taken coaching this
# academic year"). Calibrate ASER state rates to the CMS rural national level so state sums are CMS-consistent (D).
def _aser_india_blend(level):
    g15, p15, g68, p68 = ASER_TUITION["India"]
    w = 0.306  # ASER 2024 rural: 30.6% of 6-14 in private school (V, India table 1)
    return ((1 - w) * g15 + w * p15) / 100 if level == "primary" else ((1 - w) * g68 + w * p68) / 100
CALIB = {"primary": CMS_INC["primary"][0] / 100 / _aser_india_blend("primary"),
         "middle": CMS_INC["middle"][0] / 100 / _aser_india_blend("middle")}
CALIB["secondary"] = CALIB["middle"]

def tuition_rate_cms(state, level):
    if state not in ASER_TUITION:
        return tuition_rate(state, level)
    return tuition_rate(state, level) * CALIB[level]

def per_taker(level, col):  # Rs/yr spent by a child who takes coaching (D = spend / incidence)
    return CMS_SPEND[level][col] / (CMS_INC[level][col] / 100)

if __name__ == "__main__":
    print("== 1. K-9 enrolment, UDISE+ 2025-26 (class 9 = 52% of 9-10) ==")
    tot = k9("India"); print({k: round(v / 1e6, 2) for k, v in tot.items()}, "M; pvt-unaided share", round(tot["pvt"] / tot["total"], 3))
    hb = {k: sum(k9(s)[k] for s in HINDI_BELT) for k in tot}
    print("Hindi belt:", {k: round(v / 1e6, 2) for k, v in hb.items()}, "M; share of India", round(hb["total"] / tot["total"], 3))
    for s in HINDI_BELT:
        d = k9(s); print(f"  {s:18s} K-9 {d['total']/1e6:6.2f}M  pvt {d['pvt']/d['total']:.0%}")

    print("\n== 2. Per-taker coaching spend (CMS 2025, D) Rs/yr and Rs/month(12) ==")
    for lv in CMS_SPEND:
        r, u, a = (per_taker(lv, i) for i in range(3))
        print(f"  {lv:9s} rural {r:7.0f} ({r/12:5.0f}/mo)  urban {u:7.0f} ({u/12:5.0f}/mo)  all {a:7.0f} ({a/12:5.0f}/mo)")

    print("\n== 3. TAM-1: current K-9 coaching wallet, India (enrolment x CMS spend per enrolled student) ==")
    w = tot["primary"] * CMS_SPEND["primary"][2] + tot["middle"] * CMS_SPEND["middle"][2] + tot["class9"] * CMS_SPEND["secondary"][2]
    takers = tot["primary"] * CMS_INC["primary"][2] / 100 + tot["middle"] * CMS_INC["middle"][2] / 100 + tot["class9"] * CMS_INC["secondary"][2] / 100
    print(f"  wallet Rs {w/1e7:,.0f} cr = ${w/INR_PER_USD/1e9:.2f}B ; tuition takers {takers/1e6:.1f}M ({takers/tot['total']:.1%})")

    print("\n== 4. Hindi-belt tuition takers by state; ASER basis (upper) and CMS-calibrated (lower) ==")
    print("  calibration ASER->CMS:", {k: round(v, 3) for k, v in CALIB.items()})
    SMART = {"primary": 0.67, "middle": 0.74, "class9": 0.81}   # BaSE 2025 child smartphone access by grade band (V)
    LV = (("primary", "primary"), ("middle", "middle"), ("class9", "secondary"))
    hb_t = {"aser": 0, "cms": 0}; hb_ts = {"aser": 0, "cms": 0}; hb_w = {"rural": 0, "all": 0}
    for s_ in HINDI_BELT:
        d = k9(s_); ta = tc = 0
        for lv, key in LV:
            ta += d[lv] * tuition_rate(s_, key); tc += d[lv] * tuition_rate_cms(s_, key)
            hb_ts["aser"] += d[lv] * tuition_rate(s_, key) * SMART[lv]; hb_ts["cms"] += d[lv] * tuition_rate_cms(s_, key) * SMART[lv]
            hb_w["rural"] += d[lv] * tuition_rate_cms(s_, key) * per_taker(key, 0)
            hb_w["all"] += d[lv] * tuition_rate_cms(s_, key) * per_taker(key, 2)
        hb_t["aser"] += ta; hb_t["cms"] += tc
        print(f"  {s_:18s} K-9 {d['total']/1e6:5.2f}M takers ASER {ta/1e6:5.2f}M ({ta/d['total']:.0%}) CMS-cal {tc/1e6:5.2f}M ({tc/d['total']:.0%})")
    print(f"  Hindi belt takers: ASER {hb_t['aser']/1e6:.1f}M ({hb_t['aser']/hb['total']:.1%}) | CMS-cal {hb_t['cms']/1e6:.1f}M ({hb_t['cms']/hb['total']:.1%})")
    print(f"  HB coaching wallet (CMS-cal takers x per-taker spend): rural price Rs {hb_w['rural']/1e7:,.0f} cr ; all-India price Rs {hb_w['all']/1e7:,.0f} cr")

    print("\n== 5. SAM / SOM funnel ==")
    non_hb = tot["total"] - hb["total"]
    cbse_nonhb = non_hb * 0.12            # A: CBSE share of K-9 outside the Hindi belt (CBSE XII 2026 = ~13% of a class-12 cohort)
    cbse_takers = cbse_nonhb * 0.30 * 0.85  # A: CMS urban incidence ~30%; 85% phone access in CBSE homes
    for basis in ("cms", "aser"):
        sam1 = hb_ts[basis] + cbse_takers
        print(f"  SAM-1 ({basis}) = HB tuition takers with phone {hb_ts[basis]/1e6:.1f}M + non-HB CBSE takers {cbse_takers/1e6:.1f}M = {sam1/1e6:.1f}M heads")
    # SAM-2 adds private-unaided non-takers with phone access (independence assumption, A)
    add = 0
    for s_ in HINDI_BELT:
        d = k9(s_)
        for (lv, key), idx in zip(LV, (0, 1, 2)):
            pv = UD[s_][3 + idx] / UD[s_][idx]
            add += d[lv] * (1 - tuition_rate_cms(s_, key)) * pv * SMART[lv]
    add += cbse_nonhb * 0.70 * 0.85
    sam1c = hb_ts["cms"] + cbse_takers
    print(f"  SAM-2 = SAM-1(cms) + private-school non-takers with phone {add/1e6:.1f}M = {(sam1c+add)/1e6:.1f}M heads")
    for price in (299, 499):
        months = 10  # A
        v1 = sam1c * price * months; v2 = (sam1c + add) * price * months
        print(f"  value at Rs {price}/mo x {months}: SAM-1 Rs {v1/1e7:,.0f} cr (${v1/INR_PER_USD/1e9:.2f}B) ; SAM-2 Rs {v2/1e7:,.0f} cr (${v2/INR_PER_USD/1e9:.2f}B)")
    print("  SOM scenarios (average paying students in year 3):")
    for name, n in (("conservative", 150_000), ("base", 400_000), ("aggressive", 1_200_000)):
        for price in (299, 499):
            rev = n * price * 12
            print(f"    {name:12s} {n/1e3:5.0f}k x Rs {price}: ARR Rs {rev/1e7:6.1f} cr (${rev/INR_PER_USD/1e6:5.1f}M) = {n/sam1c:.2%} of SAM-1, {n/(sam1c+add):.2%} of SAM-2")

    print("\n== 6. B2B2C lens: affordable private schools (LEAD-style, Rs 943/student/yr, S) ==")
    for s_lbl, n in (("India pvt-unaided K-9", tot["pvt"]), ("HB pvt-unaided K-9", hb["pvt"])):
        print(f"  {s_lbl}: {n/1e6:.1f}M x Rs 943 = Rs {n*943/1e7:,.0f} cr ; x Rs 500 = Rs {n*500/1e7:,.0f} cr")

    print("\n== 7. Demographic drift (UDISE+ 2024-25 -> 2025-26, V) ==")
    for lbl, a, b in (("primary", 104381347, 101915874), ("upper primary", 63695100, 63241424), ("secondary", 37165436, 38290413)):
        print(f"  {lbl:14s} {a/1e6:6.2f}M -> {b/1e6:6.2f}M ({(b-a)/a:+.1%})")
