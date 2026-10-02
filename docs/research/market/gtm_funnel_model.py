"""GTM unit-economics model for Taxila (gtm-distribution.md §9).

Every input is tagged: V = read at a primary source this session, S = secondary or earlier Taxila doc,
A = assumption (no source; the number to replace with a measurement). Cases: pess / base / opt applied consistently (opt = cheaper, stickier). Run: python3 gtm_funnel_model.py
Writes gtm-funnel-model-2026-10-02.json next to this file. FX ₹96 = $1 (same as tech-and-market.md).
"""
import json, os

FX = 96.0
GST = 0.18                      # V: Indian consumer prices are GST-inclusive; 18% on digital services (S)

# ---------- plan economics ----------
PRICE_M = 299                   # S: SpeakX ₹299/mo; market-size.md A9
PRICE_Y = 2499                  # A: annual at ~30% off 12x monthly
COGS_SHARE = {"pess": 0.60, "base": 0.40, "opt": 0.25}  # A: compute+TTS share of net revenue (market-size: 50-60% GM at ₹299 with rationed voice)
FEES = {"web_upi_autopay": 0.02,            # A/S: typical gateway MDR for UPI recurring ~2% (not verified)
        "play_billing_subs": 0.15,          # V: Google Play 15% on auto-renewing subscriptions
        "play_user_choice": 0.11 + 0.02}    # V: India alternative billing = Play fee minus 4%; + gateway (A)

# Monthly retention curve: early churn for 3 months then steady churn.
# Anchor: SpeakX ~30-35% month-3 paid retention (S); RevenueCat 2025 monthly-plan Y1 retention 17% (V, global median).
EARLY_CHURN = {"pess": 0.38, "base": 0.30, "opt": 0.22}   # A
LATE_CHURN = {"pess": 0.16, "base": 0.12, "opt": 0.08}    # A
# Annual plans: RevenueCat 2025 first annual renewal 61.7% median, low-price annual Y1 retention 53.7% (V, global)
ANNUAL_RENEW = {"pess": 0.35, "base": 0.45, "opt": 0.55}  # A: India discount to the global medians
ANNUAL_MIX = {"pess": 0.2, "base": 0.35, "opt": 0.5}      # A: share of payers choosing annual


def lifetime_months(early, late, horizon=60):
    s, total = 1.0, 0.0
    for m in range(horizon):
        total += s
        s *= (1 - early) if m < 3 else (1 - late)
    return total


def ltv(case, fee_key="web_upi_autopay", rev_share=0.0):
    net_m = PRICE_M / (1 + GST) * (1 - FEES[fee_key]) * (1 - rev_share)
    net_y = PRICE_Y / (1 + GST) * (1 - FEES[fee_key]) * (1 - rev_share)
    contrib_m = net_m * (1 - COGS_SHARE[case])
    contrib_y = net_y * (1 - COGS_SHARE[case])
    life_m = lifetime_months(EARLY_CHURN[case], LATE_CHURN[case])
    r = ANNUAL_RENEW[case]
    life_y = sum(r ** k for k in range(5))  # 5-year cap
    ltv_monthly = contrib_m * life_m
    ltv_annual = contrib_y * life_y
    mix = ANNUAL_MIX[case]
    return {
        "monthly_lifetime_months": round(life_m, 2),
        "gross_revenue_ltv_monthly_plan_inr": round(PRICE_M * life_m),
        "contribution_ltv_monthly_plan_inr": round(ltv_monthly),
        "contribution_ltv_annual_plan_inr": round(ltv_annual),
        "contribution_ltv_blended_inr": round((1 - mix) * ltv_monthly + mix * ltv_annual),
    }


# ---------- channels: (cost per top-of-funnel unit, conversion from that unit to payer) ----------
# All A unless noted. The point is the break-even conversion, not the point estimate.
CHANNELS = {
    "paid_social_to_app": {          # Meta/Google app ads aimed at mothers, Hindi creatives
        "unit": "install", "cost": {"opt": 25, "base": 40, "pess": 80},
        "to_payer": {"opt": 0.08, "base": 0.04, "pess": 0.02},
        "note": "RevenueCat 2026 D35 download->paid: hard paywall 10.7%, freemium 2.1% (V, global medians)"},
    "click_to_whatsapp_diagnostic": {  # CTWA ad -> structured WhatsApp diagnostic (buttons, not open chat) -> app
        "unit": "WhatsApp conversation", "cost": {"opt": 10, "base": 20, "pess": 40},
        "to_payer": {"opt": 0.10, "base": 0.06, "pess": 0.03},
        "note": "72h free entry-point window (V, Meta); no general-purpose AI chat allowed (S, Jan-2026 policy)"},
    "school_seeded_parent_pays": {     # free for school; homework + report via class WhatsApp group; parent upgrades
        "unit": "school", "cost": {"opt": 6000, "base": 9000, "pess": 18000},
        "to_payer": {"opt": 18, "base": 11, "pess": 6},   # payers per school-year (see funnel in §9)
        "note": "~205 K-9 pupils per private unaided school (UDISE+ 2025-26, D); BaSE: 63% discover EdTech via school (V)"},
    "youtube_creator_integration": {   # sponsored segment on a mid-tier Hindi K-8 teacher channel
        "unit": "integration", "cost": {"opt": 15000, "base": 40000, "pess": 100000},
        "to_payer": {"opt": 60, "base": 25, "pess": 8},
        "note": "creator rates in India not verified this session (U)"},
    "parent_referral": {               # both parents get one free month
        "unit": "referred payer", "cost": {"opt": 150, "base": 220, "pess": 350},
        "to_payer": {"opt": 1, "base": 1, "pess": 1},
        "note": "cost = COGS of the free months + share-card ops; BaSE: 58% discover via friends/classmates (V)"},
}


def cac(ch, case):
    c = CHANNELS[ch]
    return c["cost"][case] / c["to_payer"][case]


def breakeven_conversion(ch, target_cac):
    c = CHANNELS[ch]
    return c["cost"]["base"] / target_cac


# School-paid "lite" layer (LEAD-like), per school-year
SCHOOL_PAID = {"price_per_pupil_year": {"pess": 600, "base": 900, "opt": 1200},  # S: LEAD ≈ ₹943, Embibe ₹500
               "pupils": {"pess": 120, "base": 180, "opt": 260},                    # D: UDISE+ ~205 K-9 per school
               "lite_cogs_per_pupil_month": {"pess": 50, "base": 30, "opt": 15}}    # A: text + cached narration + ~5-10 voice min


def school_paid(case):
    p, n, cg = (SCHOOL_PAID[k][case] for k in ("price_per_pupil_year", "pupils", "lite_cogs_per_pupil_month"))
    rev = p * n / (1 + GST)
    cogs = cg * 10 * n           # 10 school months
    return {"revenue_net_inr": round(rev), "cogs_inr": round(cogs), "contribution_inr": round(rev - cogs),
            "acquisition_cost_inr": CHANNELS["school_seeded_parent_pays"]["cost"][case]}


def main():
    out = {"inputs_note": "see docstring; A = assumption", "ltv": {}, "cac": {}, "breakeven": {}, "school_paid": {}}
    for case in ("pess", "base", "opt"):
        out["ltv"][case] = {k: ltv(case, k) for k in FEES}
        out["ltv"][case]["web_with_15pct_school_share"] = ltv(case, "web_upi_autopay", rev_share=0.15)
        out["school_paid"][case] = school_paid(case)
    for ch in CHANNELS:
        out["cac"][ch] = {case: round(cac(ch, case)) for case in ("pess", "base", "opt")}
        out["cac"][ch]["note"] = CHANNELS[ch]["note"]
    base_ltv = out["ltv"]["base"]["web_upi_autopay"]["contribution_ltv_blended_inr"]
    out["cac_ceiling_base_inr"] = {"LTV/CAC=1": base_ltv, "LTV/CAC=3": round(base_ltv / 3)}
    for ch in ("paid_social_to_app", "click_to_whatsapp_diagnostic"):
        out["breakeven"][ch] = {f"conversion_needed_for_CAC_{t}": f"{breakeven_conversion(ch, t):.1%}"
                                for t in (round(base_ltv / 3), base_ltv)}
    per_school = CHANNELS["school_seeded_parent_pays"]["cost"]["base"]
    out["breakeven"]["school_seeded_parent_pays"] = {
        f"payers_per_school_for_CAC_{t}": round(per_school / t, 1) for t in (round(base_ltv / 3), base_ltv)}
    out["revenuecat_in_sea_y1_ltv_per_payer_inr"] = 14 * FX   # V: RevenueCat 2026, IN/SEA Y1 realized LTV per payer $14
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gtm-funnel-model-2026-10-02.json")
    json.dump(out, open(path, "w"), indent=1, ensure_ascii=False)
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
