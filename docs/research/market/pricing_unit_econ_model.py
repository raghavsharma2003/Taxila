# Pricing and unit-economics model for Taxila (reproduces every [D] number in pricing-unit-econ.md).
# Run: python3 docs/research/market/pricing_unit_econ_model.py  -> prints tables, writes pricing-unit-econ-model-2026-10-02.json
# Prices: Azure retail pricing pages (azure-openai, speech, container-apps, bandwidth, content-safety), read 2026-10-02
# from the data-amount attributes, us-east-2 / Global unless noted  [V].  Everything tagged A_ is an assumption [A].
import importlib.util, json, os, itertools

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("rtm", os.path.join(HERE, "..", "realtime-cost-model.py"))
rtm = importlib.util.module_from_spec(spec)
import contextlib, io
with contextlib.redirect_stdout(io.StringIO()):
    spec.loader.exec_module(rtm)          # re-uses the sibling 45-min realtime simulator (60 turns, teacher 40% / child 15%)

FX = 96.0           # INR per USD (tech-and-market.md, 2026-10-02) [S]
GST = 0.18          # GST on online education subscriptions, price shown GST-inclusive [S]
PAY = {             # payment cost as a share of the GST-inclusive price
    "web_razorpay": 0.02 * 1.18,                 # 2% platform fee incl. UPI + 18% GST on the fee [V razorpay.com/pricing]
    "play_billing": 0.15,                        # Play auto-renewing subscriptions 15% [V Play help 112622]
    "play_alt_billing_india": 0.11 + 0.02 * 1.18 # Play fee reduced by 4 pts under alternative billing + own PSP [V/D]
}
A_SUPPORT_REFUND = 0.03   # support + refunds share of net revenue (RevenueCat Education refund rate 4.86% [V-sibling]) [A]

# ---------------- Azure unit prices [V] ----------------
P = dict(
    luna6_in=0.10, luna6_cached=0.01, luna6_out=0.50,        # GPT-6 Luna (short context) Global, $/M
    luna56_in=0.20, luna56_cached=0.02, luna56_out=1.20,     # GPT-5.6-luna
    terra_in=2.0, terra_cached=0.20, terra_out=12.0,         # GPT-5.6-terra (flex: 1.0 / 0.1 / 6.0)
    tts_neural_per_Mchar=15.0, tts_hd_per_Mchar=22.0, tts_commit_per_Mchar=9.75,  # Azure TTS; 400M-char commitment overage
    mini_tts_audio_out=12.0,                                 # gpt-4o-mini-tts $/M audio tokens
    mai2_per_h=0.10, gpt_transcribe_per_h=0.27, azure_stt_rt_per_h=1.0, mini_transcribe_audio_in=3.0,
    gpt_live_voice_per_h=3.0,                                # GPT-Live-1 voice, Azure catalog snippet [S]
    vl_std_audio_in=15.0, vl_std_audio_out=26.0,             # Voice Live Standard, Azure-speech audio, $/M tokens
    content_safety_per_1k_records=0.375,
    egress_per_GB=0.12,                                      # Asia source, after first 100 GB
)

# ---------------- per-minute lane costs (USD per minute of session time in that lane) ----------------
TEACH_SHARE, CHILD_SHARE = 0.40, 0.15     # same as realtime-cost-model.py
TURNS_PER_MIN = 60 / 45
A_WPM, A_CHARS_PER_WORD = 140, 6.0        # Hinglish teacher speech rate, romanised chars incl. space [A]
A_VAD_GATED = 0.25                        # share of session audio actually sent to STT after client VAD [A]
A_TERRA_SHARE = 0.15                      # share of turns routed to terra for misconception diagnosis [A]

def luna6_turn(in_tok=6000, cached=0.8, out_tok=200):
    return (in_tok*(1-cached)*P["luna6_in"] + in_tok*cached*P["luna6_cached"] + out_tok*P["luna6_out"]) / 1e6
def terra_turn(in_tok=6000, cached=0.8, out_tok=400):
    return (in_tok*(1-cached)*P["terra_in"] + in_tok*cached*P["terra_cached"] + out_tok*P["terra_out"]) / 1e6

brain_per_min = TURNS_PER_MIN * ((1-A_TERRA_SHARE)*luna6_turn() + A_TERRA_SHARE*terra_turn())
chars_per_min = TEACH_SHARE * A_WPM * A_CHARS_PER_WORD

def cascade_per_min(cached_narration=0.5, tts_price=P["tts_neural_per_Mchar"], stt="mai2_gated", terra=True):
    stt_cost = {"mai2_gated": P["mai2_per_h"]/60*A_VAD_GATED,
                "mai2_full": P["mai2_per_h"]/60,
                "azure_rt_gated": P["azure_stt_rt_per_h"]/60*A_VAD_GATED,
                "mini_transcribe_gated": 600*A_VAD_GATED*P["mini_transcribe_audio_in"]/1e6}[stt]
    llm = brain_per_min if terra else TURNS_PER_MIN*luna6_turn()
    tts = chars_per_min*(1-cached_narration)*tts_price/1e6
    return stt_cost + llm + tts

def rt_per_min(model, **kw):
    c,_,_ = rtm.run(model, **kw); return c/45 + TURNS_PER_MIN*A_TERRA_SHARE*terra_turn()  # + out-of-band diagnosis

LANES = {
    "rt21_w1":          rt_per_min("rt-2.1", window=1),
    "rt21mini_w1":      rt_per_min("rt-2.1-mini", window=1),
    "rt21mini_w1_cache70": rt_per_min("rt-2.1-mini", window=1, cache_hit=0.7),   # only if Azure starts caching (M1)
    "rt21mini_nocut":   rt_per_min("rt-2.1-mini"),
    "gpt_live":         P["gpt_live_voice_per_h"]/60 + brain_per_min,
    "voicelive_std_luna": (P["vl_std_audio_in"]*10*60*A_VAD_GATED + P["vl_std_audio_out"]*20*60*TEACH_SHARE)/1e6 + brain_per_min,
    "cascade":          cascade_per_min(),
    "cascade_luna_only": cascade_per_min(terra=False),
    "cascade_no_cache_tts": cascade_per_min(cached_narration=0.0),
    "cascade_scale_tts": cascade_per_min(tts_price=P["tts_commit_per_Mchar"]),
    # tap = kit items with verified keys (no model grading) + cached narration; one luna hint call per 2 min,
    # one content-safety record per 2 min, narration egress 32 kbps
    # (Azure OpenAI's built-in content filter is included in token prices [S]; the paid Content Safety API is used
    #  only on generated, non-kit text: ~1 record per 10 min of tap time)
    "tap":              0.5*luna6_turn(3000, 0.9, 150) + 0.1*P["content_safety_per_1k_records"]/1000 + 0.24/1024*P["egress_per_GB"],
}

# ---------------- per-child monthly fixed costs (USD) ----------------
FIXED = dict(
    conductor=0.12,     # sibling estimate $0.25 on gpt-5.6-luna (orchestration §9.1), ~half on GPT-6 Luna [D/A]
    reports=0.05,       # 4 weekly reports on terra flex/batch + monthly PTM summary [A]
    infra=0.10,         # ACA compute, blob, ops, egress ~ $0.03-0.10 (sandboxes-per-student §9.3) [S-sibling]
    observability=0.05, # logs/metrics [A]
    whatsapp=6*0.115*1.18/FX,  # 6 utility messages at INR 0.115 + GST [S-sibling]
)
CONTENT = {"year1": 1.50, "mature": 0.30}   # Forge LLM+image spend attributable per active child-month;
                                            # sibling range $3-7 early / $0.5-1 mature with no pre-build (llm-game-generation §8) [A]
FIXED_FREE = dict(conductor=0.01, reports=0.005, infra=0.015, whatsapp=4*0.115*1.18/FX)   # weekly plan + weekly luna report [A]

# ---------------- usage profiles ----------------
BAND_MIN_PER_DAY = {"B1": 21, "B2": 28, "B3": 42, "B4": 52.5}   # 0.7 x daily cap (day-cycle.md DC caps 30/40/60/75) [S-sibling]
DAYS = {"median": 16, "heavy": 26}                              # active days per month for a payer [A]

# Tier definitions: absolute monthly budgets of two-way voice minutes by lane; all remaining minutes are tap.
TIERS = {
    "free":        dict(price=0,    annual=0,     rt=0,   cascade=0,   free=True),
    "saathi_299":  dict(price=299,  annual=2499,  rt=0,   cascade=90),
    "saathi_299_a10": dict(price=299, annual=2999, rt=0,  cascade=90),     # annual = 10x monthly
    "saathi_349":  dict(price=349,  annual=2999,  rt=0,   cascade=120),
    "tutor_699":   dict(price=699,  annual=6999,  rt=30,  cascade=300),
    "ghar_999":    dict(price=999,  annual=9999,  rt=60,  cascade=420),
    "ghar_1199":   dict(price=1199, annual=11999, rt=90,  cascade=480),
    "pro_1499":    dict(price=1499, annual=14999, rt=150, cascade=540),
}

def net_rev(price, channel="web_razorpay"):
    ex_gst = price/(1+GST)
    return ex_gst - price*PAY[channel]

def tier_cogs_usd(t, band="B3", usage="median", stage="mature", rt_lane="rt21mini_w1", casc_lane="cascade"):
    minutes = BAND_MIN_PER_DAY[band]*DAYS[usage]
    if t.get("free"):
        tap_min = min(minutes, 15*12)       # free MAU: ~15 min x 12 days [A]
        return tap_min*LANES["tap"] + sum(FIXED_FREE.values()), dict(minutes=tap_min, rt=0, cascade=0)
    rt = min(t["rt"], minutes)
    casc = min(t["cascade"], minutes-rt)
    if usage == "median":                   # median users do not exhaust budgets: use 70% of the voice budget [A]
        rt, casc = rt*0.7, casc*0.7
    tap = minutes - rt - casc
    cost = rt*LANES[rt_lane] + casc*LANES[casc_lane] + tap*LANES["tap"] + sum(FIXED.values()) + CONTENT[stage]
    return cost, dict(minutes=minutes, rt=round(rt), cascade=round(casc), tap=round(tap))

def gm(price, cogs_usd, channel="web_razorpay", plan="monthly", annual_price=None):
    if plan == "annual":
        nr = net_rev(annual_price, channel)/12
    else:
        nr = net_rev(price, channel)
    nr_after_support = nr*(1-A_SUPPORT_REFUND)
    cogs_inr = cogs_usd*FX
    return dict(net_rev_inr=round(nr,1), cogs_inr=round(cogs_inr,1), gm_pct=round(100*(nr_after_support-cogs_inr)/nr,1) if nr else None)

out = {"fx": FX, "lanes_usd_per_min": {k: round(v,5) for k,v in LANES.items()},
       "lanes_usd_per_hour": {k: round(v*60,3) for k,v in LANES.items()},
       "lanes_inr_per_hour": {k: round(v*60*FX,1) for k,v in LANES.items()}}
print("Lane cost per hour of session time (USD | INR):")
for k,v in LANES.items():
    print(f"  {k:24s} ${v*60:6.3f}/h   Rs{v*60*FX:7.1f}/h")

rows = []
for name,t in TIERS.items():
    for band, usage, stage in itertools.product(["B2","B3","B4"], ["median","heavy"], ["year1","mature"]):
        c, mix = tier_cogs_usd(t, band, usage, stage)
        r = dict(tier=name, band=band, usage=usage, stage=stage, cogs_usd=round(c,2), mix=mix)
        if not t.get("free"):
            r["web_monthly"] = gm(t["price"], c)
            r["web_annual"] = gm(t["price"], c, plan="annual", annual_price=t["annual"])
            r["play_monthly"] = gm(t["price"], c, channel="play_billing")
        rows.append(r)
out["tier_rows"] = rows
print("\nTier COGS and gross margin, B3 (classes 5-7):")
for r in rows:
    if r["band"]=="B3":
        if "web_monthly" in r:
            print(f"  {r['tier']:14s} {r['stage']:6s} {r['usage']:6s} COGS ${r['cogs_usd']:5.2f} (Rs{r['cogs_usd']*FX:6.0f}) | GM web-monthly {r['web_monthly']['gm_pct']:5.1f}% | web-annual {r['web_annual']['gm_pct']:5.1f}% | Play {r['play_monthly']['gm_pct']:5.1f}% | mix {r['mix']}")
        else:
            print(f"  {r['tier']:14s} {r['stage']:6s} {r['usage']:6s} COGS ${r['cogs_usd']:5.3f} (Rs{r['cogs_usd']*FX:5.1f}) per free MAU-month")

# Voice minutes affordable at a target gross margin (web monthly, mature, fixed+content included)
def affordable(price, target_gm, lane, stage="mature"):
    nr = net_rev(price)*(1-A_SUPPORT_REFUND)
    budget = (nr - (1-target_gm)*0 ) # placeholder
    cogs_cap_inr = net_rev(price)*(1-A_SUPPORT_REFUND) - target_gm*net_rev(price)
    voice_usd = cogs_cap_inr/FX - sum(FIXED.values()) - CONTENT[stage]
    return max(0, voice_usd)/LANES[lane]
aff = {}
print("\nTwo-way voice minutes per month affordable at 55% / 65% GM (web, mature, after fixed+content):")
for price in [299, 349, 499, 699, 999, 1199, 1499, 1999]:
    aff[price] = {lane: {g: round(affordable(price, g, lane)) for g in (0.55, 0.65)} for lane in ["cascade","rt21mini_w1","gpt_live","rt21_w1"]}
    print(f"  Rs{price:5d}: " + " | ".join(f"{l} {aff[price][l][0.55]}/{aff[price][l][0.65]} min" for l in aff[price]))
out["affordable_voice_min"] = aff

# Free tier and trial economics
free_cost_inr = tier_cogs_usd(TIERS["free"])[0]*FX
trial = {}
for days, rt_min, casc_min, conv in [(7,15,60,0.374),(14,15,60,0.425),(14,60,240,0.425),(14,0,0,0.425)]:
    c = (rt_min*LANES["rt21mini_w1"] + casc_min*LANES["cascade"] + days*30*LANES["tap"] + (sum(FIXED.values())+CONTENT["mature"])*days/30)*FX
    trial[f"{days}d_rt{rt_min}_casc{casc_min}"] = dict(cost_per_trial_inr=round(c), conv=conv, cost_per_payer_inr=round(c/conv))
free_sub = {}
for cost in [free_cost_inr, 3, 15, 50]:
    for months, conv in [(2,0.02),(2,0.04),(3,0.06)]:
        free_sub[f"Rs{cost:.0f}/MAU x {months}mo @ {conv:.0%}"] = round(cost*months/conv)
out["free_mau_cost_inr"] = round(free_cost_inr,2); out["trial"] = trial; out["free_subsidy_per_payer_inr"] = free_sub
print(f"\nFree MAU-month cost: Rs{free_cost_inr:.1f}")
print("Trial cost:", json.dumps(trial, indent=1))
print("Free-tier subsidy per converted payer (Rs):", json.dumps(free_sub, indent=1))

# Tutor-replacement check: a B4 heavy child using the 'ghar' tiers vs a Rs1,500-3,000 tutor
rep = {}
for name in ["tutor_699","ghar_999","ghar_1199","pro_1499"]:
    t = TIERS[name]; c, mix = tier_cogs_usd(t, "B4", "heavy", "mature")
    rep[name] = dict(price=t["price"], cogs_inr=round(c*FX), gm_web=gm(t["price"], c)["gm_pct"],
                     voice_h=round((mix["rt"]+mix["cascade"])/60,1), total_h=round(mix["minutes"]/60,1),
                     share_of_1500=round(t["price"]/1500,2), share_of_3000=round(t["price"]/3000,2),
                     inr_per_learning_hour=round(t["price"]/(mix["minutes"]/60)))
out["tutor_replacement_B4_heavy"] = rep
print("\nTutor replacement (B4 heavy, mature):", json.dumps(rep, indent=1))

# What if every minute of a tuition-length slot were realtime voice (the naive 'replace the tutor hour for hour')
naive = {}
for h in [20, 26, 39]:
    naive[f"{h}h"] = {l: round(h*60*LANES[l]*FX) for l in ["cascade","rt21mini_w1","gpt_live","rt21_w1","rt21mini_nocut"]}
out["naive_hour_for_hour_inr_per_month"] = naive
print("\nHour-for-hour voice replacement cost per month (Rs):", json.dumps(naive, indent=1))

# Azure grant runway
out["grant_runway_student_months_per_5k_usd"] = {k: round(5000/tier_cogs_usd(TIERS[k], "B3", "median", "year1")[0]) for k in ["saathi_299","tutor_699","ghar_999"]}
print("\n$5k grant runway, student-months (B3 median, year-1 content):", out["grant_runway_student_months_per_5k_usd"])

json.dump(out, open(os.path.join(HERE, "pricing-unit-econ-model-2026-10-02.json"), "w"), indent=1)

# Blended GM (70% median / 30% heavy payers), B3, mature and year-1, web monthly
blend = {}
for name,t in TIERS.items():
    if t.get("free"): continue
    for stage in ["year1","mature"]:
        cm,_ = tier_cogs_usd(t,"B3","median",stage); ch,_ = tier_cogs_usd(t,"B3","heavy",stage)
        c = 0.7*cm+0.3*ch
        blend[f"{name}|{stage}"] = dict(cogs_inr=round(c*FX), gm_web_monthly=gm(t["price"],c)["gm_pct"],
                                        gm_web_annual=gm(t["price"],c,plan="annual",annual_price=t["annual"])["gm_pct"],
                                        gm_play=gm(t["price"],c,channel="play_billing")["gm_pct"],
                                        gm_play_alt=gm(t["price"],c,channel="play_alt_billing_india")["gm_pct"])
out["blended_B3"] = blend
print("\nBlended (70/30) B3:", json.dumps(blend, indent=1))

# Cascade cost decomposition per hour
dec = dict(stt=P["mai2_per_h"]*A_VAD_GATED, luna=60*TURNS_PER_MIN*(1-A_TERRA_SHARE)*luna6_turn(),
           terra=60*TURNS_PER_MIN*A_TERRA_SHARE*terra_turn(), tts=60*chars_per_min*0.5*P["tts_neural_per_Mchar"]/1e6)
out["cascade_decomposition_usd_per_h"] = {k: round(v,4) for k,v in dec.items()}
print("\nCascade decomposition $/h:", out["cascade_decomposition_usd_per_h"])

# Price needed (GST-incl, web) for hour-for-hour voice at a target GM
def price_needed(cogs_inr, g):
    nr = cogs_inr/(1-A_SUPPORT_REFUND-g)
    return nr/(1/(1+GST) - PAY["web_razorpay"])
need = {}
fixed_inr = (sum(FIXED.values())+CONTENT["mature"])*FX
for h in [20,26]:
    for lane in ["cascade_luna_only","cascade","rt21mini_w1","gpt_live"]:
        c = h*60*LANES[lane]*FX + fixed_inr
        need[f"{h}h|{lane}"] = dict(cogs_inr=round(c), price_at_55=round(price_needed(c,0.55)), price_at_40=round(price_needed(c,0.40)))
out["price_needed_hour_for_hour"] = need
print("\nPrice needed for hour-for-hour voice:", json.dumps(need, indent=1))
json.dump(out, open(os.path.join(HERE, "pricing-unit-econ-model-2026-10-02.json"), "w"), indent=1)
