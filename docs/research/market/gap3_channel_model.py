# gap-3: organic Play + OEM preload CAC/volume model (2026-10-02). All inputs [A] unless tagged.
# Comparators from MARKET-THESIS §5.2 / gap-1: school ₹818, CTWA ₹333, referral ₹220; LTV/CAC=3 ceiling ₹316-344.
import json
out={}
# ---- Organic Play (ASO, no paid UA) ----
# installs/month from ~20 Hindi-medium long-tail queries once ranked top-5 (Play pull: top results 50k-1M lifetime,
# median 50k; Tiwari/EduRev class apps accrue ~1-15k/month) [D from gap3-play-search + A on accrual years]
cases={'low':dict(inst=1000,cvr=0.007,leak=0.5,cost=250000),
       'base':dict(inst=3000,cvr=0.012,leak=0.6,cost=250000),
       'high':dict(inst=8000,cvr=0.019,leak=0.7,cost=250000)}
# cvr: RevenueCat IN/SEA D35 download->paid median 0.7%, top quartile 1.9% [V]; leak = consumption-only (no in-app
# purchase; payment via WhatsApp/web) multiplier [A]; cost = incremental 12-month ASO: Hindi listing creative, screenshot/video tests, review-reply ops, ₹2.5 lakh [A]
for k,c in cases.items():
  # ramp: months 1-6 at 30% of steady state, months 7-12 at 100% [A]
  inst=c['inst']*(6*0.3+6)
  payers=inst*c['cvr']*c['leak']
  out['organic_'+k]={'installs_y1':round(inst),'payers_y1':round(payers),'cac_inr':round(c['cost']/payers) if payers else None}
# ---- OEM preload (per-device fee) ----
pre={'low':dict(fee=10,open=0.05,childhh=0.35,pay=0.01),
     'base':dict(fee=25,open=0.10,childhh=0.40,pay=0.02),
     'high':dict(fee=40,open=0.20,childhh=0.45,pay=0.03)}
# fee ₹/device [U, no public Indian rate card found]; open = preload->first open [U]; childhh = share of buyer households
# with a child aged 6-15 [A]; pay = opened-in-child-household -> payer [A, ~RevenueCat top-quartile x leak]
for k,c in pre.items():
  per_dev=c['open']*c['childhh']*c['pay']
  out['preload_'+k]={'payers_per_100k_devices':round(1e5*per_dev),'cac_inr':round(c['fee']/per_dev)}
# best-case preload (cheapest fee, best funnel) for the bound
best=10/(0.20*0.45*0.03); out['preload_bound_best_cac']=round(best)
json.dump(out,open('gap3-channel-model-2026-10-02.json','w'),indent=1)
for k,v in out.items(): print(k,v)
