"""gap-1-retention-benchmark-unit: re-derive churn, paid months, LTV, CAC ceiling and the base SOM inflow
under every defensible reading of the SpeakX retention figure and the RevenueCat 2026 renewal benchmarks.

Reuses gtm_funnel_model.py (price, GST, fees, COGS, annual-plan logic, channel CACs) unchanged and only swaps the
retention inputs. Run: python3 retention_benchmark_model.py  -> retention-benchmark-model-2026-10-02.json

Survival convention (RevenueCat 2026 definitions, [V]): S0 = 1 is the first paid month; S_k = share of first
payments that have made k renewals. "M3 (3 renewals)" = S3 is RevenueCat's 3-month retention; "paying in month 3"
= S2 is the looser founder-style reading. Both are reported because SpeakX never defined its figure.
"""
import json, os
import gtm_funnel_model as g

HORIZON = 60

# Each curve: first three monthly renewal rates, then a constant late renewal rate.
# Sources: RC26 = RevenueCat State of Subscription Apps 2026, https://www.revenuecat.com/state-of-subscription-apps/
CURVES = {
    "A_in_sea_median_rc26": {
        "r": [0.46, 0.66, 0.75], "late": 0.86,
        "src": "r1 46% = IN/SEA monthly 1st-renewal median [V RC26]; r2/r3 = global 2nd 65-77% / 3rd 73-82% medians "
               "shaded down because IN/SEA 'trails by 10 to 15 percent on 1st renewals' and converges by the 3rd [V RC26 -> A]; "
               "late 0.86 solved from global monthly Y1 median 8% [V RC26 -> D]"},
    "B_global_median_rc26": {
        "r": [0.57, 0.71, 0.78], "late": 0.86,
        "src": "midpoints of global category medians: 1st 53-61%, 2nd 65-77%, 3rd 73-82% [V RC26]; late solved so S12 = 8% "
               "(monthly Y1 median, 2024 cohort) [V RC26 -> D]"},
    "C_speakx_35pct_M3_outlook_oct25": {
        "r": [0.591, 0.74, 0.80], "late": 0.88,
        "src": "'35% retention at month three' [S, company claim via Outlook Business 16-Oct-2025], read as S3; "
               "r2/r3 at the top of the global range [A]; r1 solved [D]"},
    "D_speakx_30pct_as_M3_inc42_sep26": {
        "r": [0.527, 0.72, 0.79], "late": 0.86,
        "src": "'paid user retention ... around 30% on a monthly basis' [S, Inc42 01-Sep-2026] read as a month-3 cohort "
               "figure (the reading the thesis used); r1 solved [D]"},
    "E_literal_30pct_month_on_month": {
        "r": [0.30, 0.30, 0.30], "late": 0.30,
        "src": "the literal Inc42 wording: 30% of paid users renew each month (70% monthly churn). Implausible against "
               "SpeakX's own 3.7x LTV/CAC and ~2 lakh stock [D]; kept as a floor"},
    "F_30pct_is_monthly_churn": {
        "r": [0.70, 0.70, 0.70], "late": 0.70,
        "src": "the founder meant churn, not retention: 70% month-on-month renewal, flat [U reading]"},
    "G_current_gtm_base": {
        "r": [0.70, 0.70, 0.70], "late": 0.88,
        "src": "gtm_funnel_model.py base: 30% churn x3 then 12% [A]"},
    "H_som_15pct_flat": {
        "r": [0.85, 0.85, 0.85], "late": 0.85,
        "src": "MARKET-THESIS §3.3 base SOM: 15% monthly churn flat [D/A]"},
}

ANNUAL_RENEW_CASES = {
    "model_base_0.45": 0.45,                 # gtm_funnel_model.py ANNUAL_RENEW base [A]
    "global_1st_annual_median_0.30": 0.30,   # RC26: 1st annual renewal median 23-40% by category [V]
    "in_sea_1st_annual_0.22": 0.22,          # RC26: yearly 1st renewal IN/SEA 22% [V]
}


def survival(c):
    s, out = 1.0, []
    for k in range(HORIZON):
        out.append(s)
        s *= c["r"][k] if k < 3 else c["late"]
    return out


def curve_stats(c):
    S = survival(c)
    L = sum(S)
    return {"S1": round(S[1], 3), "paying_in_month3_S2": round(S[2], 3), "M3_3renewals_S3": round(S[3], 3),
            "S6": round(S[6], 3), "Y1_S12": round(S[12], 3), "paid_months_monthly_plan": round(L, 2),
            "avg_churn_first3": round(1 - S[3] ** (1 / 3), 3), "late_churn": round(1 - c["late"], 3),
            "stock_equiv_flat_churn": round(1 / L, 3)}


def ltv(L, annual_r, case="base", fee="web_upi_autopay", mix=None):
    net_m = g.PRICE_M / (1 + g.GST) * (1 - g.FEES[fee])
    net_y = g.PRICE_Y / (1 + g.GST) * (1 - g.FEES[fee])
    cm, cy = net_m * (1 - g.COGS_SHARE[case]), net_y * (1 - g.COGS_SHARE[case])
    life_y = sum(annual_r ** k for k in range(5))
    mix = g.ANNUAL_MIX[case] if mix is None else mix
    lm, ly = cm * L, cy * life_y
    return {"ltv_monthly": round(lm), "ltv_annual": round(ly), "ltv_blended": round((1 - mix) * lm + mix * ly),
            "paid_months_blended": round((1 - mix) * L + mix * 12 * life_y, 2)}


def solve_r1_for(L_target, r2=0.71, r3=0.78, late=0.86):
    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        L = sum(survival({"r": [mid, r2, r3], "late": late}))
        lo, hi = (mid, hi) if L < L_target else (lo, mid)
    S3 = mid * r2 * r3
    return round(mid, 3), round(S3, 3)


def main():
    P = 400_000  # base SOM average payers (MARKET-THESIS §3.3)
    out = {"curves": {}, "notes": "S-notation per docstring; LTV = contribution after GST, 2% web UPI fee, 40% COGS"}
    for name, c in CURVES.items():
        st = curve_stats(c)
        row = {"src": c["src"], "retention": st, "ltv": {}}
        L = st["paid_months_monthly_plan"]
        for an, r in ANNUAL_RENEW_CASES.items():
            v = ltv(L, r)
            v["cac_ceiling_3x"] = round(v["ltv_blended"] / 3)
            row["ltv"][an] = v
        mo = ltv(L, 0.30, mix=0.0)
        row["monthly_only"] = {"ltv": mo["ltv_monthly"], "cac_ceiling_3x": round(mo["ltv_monthly"] / 3)}
        # base SOM inflow: average stock / expected paid months per new payer
        row["som_400k"] = {
            "new_payers_per_month_monthly_only": round(P / L),
            "new_payers_per_month_blended_annual0.30": round(P / ltv(L, 0.30)["paid_months_blended"]),
        }
        out["curves"][name] = row
    # What retention does each target need (family: r2 .71, r3 .78, late .86 = global median shape)?
    out["required"] = {}
    for label, Lt in {"SOM_15pct_flat_L6.67": 1 / 0.15, "gtm_base_L5.05": 5.05, "L4.0": 4.0}.items():
        r1, S3 = solve_r1_for(Lt)
        out["required"][label] = {"r1_needed": r1, "M3_S3_needed": S3}
    # Gate test: M3 needed for LTV/CAC >= 3 at each base channel CAC (blended, annual renew 0.30, mix 0.35)
    gate = {}
    for ch in ("click_to_whatsapp_diagnostic", "school_seeded_parent_pays", "paid_social_to_app", "parent_referral"):
        cac = g.cac(ch, "base")
        need = 3 * cac
        lo, hi = 0.05, 1.0
        best = None
        for _ in range(60):
            mid = (lo + hi) / 2
            L = sum(survival({"r": [mid, 0.71, 0.78], "late": 0.86}))
            v = ltv(L, 0.30)["ltv_blended"]
            lo, hi = (mid, hi) if v < need else (lo, mid)
            best = (mid, L, v)
        r1, L, v = best
        gate[ch] = {"base_cac": round(cac), "ltv_needed": round(need),
                    "M3_S3_needed": round(r1 * 0.71 * 0.78, 3) if r1 < 0.999 else "unreachable (r1>=1)",
                    "paid_months_needed": round(L, 2)}
    out["gate_M3_for_ltv_cac_3"] = gate
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "retention-benchmark-model-2026-10-02.json")
    json.dump(out, open(path, "w"), indent=1, ensure_ascii=False)
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
