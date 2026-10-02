# metacognition-srl.md calculations (2026-10-02). Reproduce: python3 metacognition-srl-calibsim.py  (numpy only, seed 11, ~10 s)
# All generative assumptions are [U] design guesses, not measured values. The arithmetic is what this file contributes.
#
# Bands follow conductor/day-cycle.md: B1 6-7, B2 8-9, B3 10-12, B4 13-15.
# A. Per-child test-retest reliability of calibration indices from 3-level confidence bets
#    ("pakka / shayad / pata nahi"), as a function of the number of bets N, by age band.
# B. The "unskilled-and-unaware" artefact: raw bias (mean conf - accuracy) correlates with ability
#    even when the true confidence offset is generated independent of ability.
# C. Reliability of a per-child help-seeking sensitivity slope (does the child ask more when the KT
#    model says the skill is weak?), as a function of help opportunities.
import numpy as np
rng = np.random.default_rng(11)
sig = lambda x: 1 / (1 + np.exp(-x))

# ---------- generative model for confidence bets ----------
# child c: theta_c ~ N(0,1)           ability (logit of first-try success against median item)
#          kappa_c ~ N(mu_k, sd_k)    confidence offset (metacognitive bias), independent of theta
#          psi_c   ~ N(mu_p, sd_p)+   metacognitive sensitivity (type-2 d'-like separation of correct vs wrong)
# trial:   b_k ~ N(-0.4, 0.8) (items targeted near 60-70% success), o ~ Bern(sig(theta - b))
#          y = kappa + psi*(o - .5)*2/2 ... latent; confidence level = 0 / 1 / 2 by thresholds -0.6, +0.6
BANDS = {  # [U] assumptions shaped on the review in section 3.1 of metacognition-srl.md
    "B1 (6-7)":  dict(mu_k=1.0, sd_k=0.6, mu_p=0.4, sd_p=0.30),
    "B2 (8-9)": dict(mu_k=0.7, sd_k=0.6, mu_p=0.8, sd_p=0.35),
    "B3 (10-12)":dict(mu_k=0.4, sd_k=0.6, mu_p=1.1, sd_p=0.40),
    "B4 (13-15)":dict(mu_k=0.3, sd_k=0.6, mu_p=1.3, sd_p=0.40),
}
TH = (-0.6, 0.6)
C = 2000  # simulated children per band

def draw_children(p):
    th = rng.standard_normal(C)
    ka = rng.normal(p["mu_k"], p["sd_k"], C)
    ps = np.clip(rng.normal(p["mu_p"], p["sd_p"], C), 0, None)
    return th, ka, ps

STATE_K, STATE_P = 0.5, 0.4   # [U] session-to-session state fluctuation SDs of kappa and psi (the "weather")
def bets(th, ka, ps, n, state=True):
    # bets arrive 3 per session; each session draws its own kappa and psi around the child's trait
    b = rng.normal(-0.4, 0.8, (C, n))
    o = (rng.random((C, n)) < sig(th[:, None] - b)).astype(float)
    ns = int(np.ceil(n / 3))
    kS = ka[:, None] + (STATE_K * rng.standard_normal((C, ns)) if state else 0)
    pS = np.clip(ps[:, None] + (STATE_P * rng.standard_normal((C, ns)) if state else 0), 0, None)
    kS = np.repeat(kS, 3, axis=1)[:, :n] if state else np.repeat(ka[:, None], n, 1)
    pS = np.repeat(pS, 3, axis=1)[:, :n] if state else np.repeat(ps[:, None], n, 1)
    y = kS + pS * (o - 0.5) * 2 + rng.standard_normal((C, n))
    conf = np.digitize(y, TH) / 2.0  # 0, .5, 1
    return o, conf

def indices(o, conf):
    acc = o.mean(1); mc = conf.mean(1)
    bias = mc - acc
    nc = o.sum(1); ne = (1 - o).sum(1)
    with np.errstate(invalid="ignore", divide="ignore"):
        mc_c = (conf * o).sum(1) / nc
        mc_e = (conf * (1 - o)).sum(1) / ne
    dconf = mc_c - mc_e                     # resolution (Delta-Conf)
    mid = (mc_c + mc_e) / 2                 # accuracy-independent offset estimate
    # Goodman-Kruskal gamma per child (concordant vs discordant pairs of (conf, o))
    g = np.full(C, np.nan)
    for i in range(C):
        cc = conf[i][o[i] == 1]; ce = conf[i][o[i] == 0]
        if len(cc) and len(ce):
            d = cc[:, None] - ce[None, :]
            P = (d > 0).sum(); Q = (d < 0).sum()
            if P + Q > 0: g[i] = (P - Q) / (P + Q)
    brier = ((conf - o) ** 2).mean(1)
    return dict(meanconf=mc, bias=bias, offset_mid=mid, dconf=dconf, gamma=g, brier=brier)

def r(a, b):
    m = np.isfinite(a) & np.isfinite(b)
    return np.corrcoef(a[m], b[m])[0, 1], m.mean()

print("A. Test-retest reliability (Pearson r between two independent sets of N bets), 3-level confidence,\n   3 bets per session, session-state SDs kappa 0.5 / psi 0.4 [U]")
print("   N = bets per window. At <=3 bets/session and ~4 sessions/week, N=60 is ~5 weeks, N=240 ~5 months.")
Ns = [30, 60, 120, 240, 480]
for name, p in BANDS.items():
    th, ka, ps = draw_children(p)
    print(f"\n  {name}: true mean kappa {p['mu_k']}, true mean psi {p['mu_p']}")
    print("   index         " + "  ".join(f"N={n:<4d}" for n in Ns) + "   (share of children computable at N=30)")
    rows = {}
    for n in Ns:
        o1, c1 = bets(th, ka, ps, n); o2, c2 = bets(th, ka, ps, n)
        I1, I2 = indices(o1, c1), indices(o2, c2)
        for k in I1:
            rr, share = r(I1[k], I2[k])
            rows.setdefault(k, []).append((rr, share))
    for k, v in rows.items():
        print(f"   {k:<13s} " + "  ".join(f"{x[0]:6.2f}" for x in v) + f"   ({v[0][1]:.2f})")

print("\nA1. Same as A for band B3 but WITHOUT session-state fluctuation (trait-only world; upper bound)")
p = BANDS["B3 (10-12)"]; th, ka, ps = draw_children(p)
for n in Ns:
    o1, c1 = bets(th, ka, ps, n, state=False); o2, c2 = bets(th, ka, ps, n, state=False)
    I1, I2 = indices(o1, c1), indices(o2, c2)
    print(f"   N={n:<4d} " + "  ".join(f"{k}={r(I1[k], I2[k])[0]:.2f}" for k in ["meanconf", "offset_mid", "dconf", "gamma"]))

print("\nA3. Sensitivity of resolution reliability to the (unknown) between-child SD of psi, band B3, with session state")
print("   (adult test-retest data suggest small stable between-person variance in sensitivity; see Rahnev 2025)")
for sdp in [0.15, 0.25, 0.40]:
    p = dict(BANDS["B3 (10-12)"]); p["sd_p"] = sdp; th, ka, ps = draw_children(p)
    out = []
    for n in Ns:
        o1, c1 = bets(th, ka, ps, n); o2, c2 = bets(th, ka, ps, n)
        I1, I2 = indices(o1, c1), indices(o2, c2)
        out.append(f"N={n}: dconf {r(I1['dconf'], I2['dconf'])[0]:.2f} / gamma {r(I1['gamma'], I2['gamma'])[0]:.2f}")
    print(f"   sd_psi={sdp:.2f}  " + " | ".join(out))

print("\nA2. Validity: correlation of the estimate with the TRUE generating parameter (N=240, band B3)")
p = BANDS["B3 (10-12)"]; th, ka, ps = draw_children(p); o, c = bets(th, ka, ps, 240); I = indices(o, c)
for k, truth, lab in [("meanconf", ka, "kappa"), ("bias", ka, "kappa"), ("offset_mid", ka, "kappa"),
                      ("dconf", ps, "psi"), ("gamma", ps, "psi"), ("brier", ps, "psi")]:
    print(f"   r({k:<10s}, true {lab:<5s}) = {r(I[k], truth)[0]:5.2f}")

print("\nB. Ability confound: r(index, true theta) when true kappa and psi are independent of theta (N=240)")
for name, p in BANDS.items():
    th, ka, ps = draw_children(p); o, c = bets(th, ka, ps, 240); I = indices(o, c)
    print(f"   {name}: r(bias,theta)={r(I['bias'], th)[0]:5.2f}  r(offset_mid,theta)={r(I['offset_mid'], th)[0]:5.2f}"
          f"  r(meanconf,theta)={r(I['meanconf'], th)[0]:5.2f}  r(gamma,theta)={r(I['gamma'], th)[0]:5.2f}")
    # quartile view of raw bias by ability: the classic 'unskilled and unaware' plot, produced by construction
    q = np.digitize(th, np.quantile(th, [.25, .5, .75]))
    print("      raw bias by ability quartile (low->high): " + "  ".join(f"{I['bias'][q==j].mean():+.2f}" for j in range(4)))

# ---------- C. help-seeking sensitivity ----------
# P(help request on a step) = sig(eta_c + lam_c * w), w = need = 1 - pL (KT mastery) centred; KT pL observed with noise.
print("\nC. Help-seeking sensitivity lambda_c: reliability vs opportunities (two independent windows)")
print("   eta_c ~ N(-1.7, 0.7) (base rate ~15%), lam_c ~ N(2.0, 1.0); w = (1-pL) - .5; pL from KT with logit noise SD 0.8")
def fit_logit(x, y, prior_sd=2.0, iters=25):
    # per-child ridge logistic regression (intercept + slope), Newton steps, vectorised over children
    n = x.shape[0]; beta = np.zeros((n, 2)); X = np.stack([np.ones_like(x), x], -1)
    lam = 1 / prior_sd**2
    for _ in range(iters):
        p = sig((X * beta[:, None, :]).sum(-1))
        g = ((y - p)[..., None] * X).sum(1) - lam * beta
        W = p * (1 - p)
        H = -(W[..., None, None] * X[..., :, None] * X[..., None, :]).sum(1) - lam * np.eye(2)
        beta = beta - np.linalg.solve(H, g[..., None])[..., 0]
    return beta
Cn = 2000
eta = rng.normal(-1.7, 0.7, Cn); lamc = rng.normal(2.0, 1.0, Cn)
print("   opportunities  r(lam_hat window1, window2)  r(lam_hat, true lam)  r(eta_hat w1, w2)  mean help rate")
for n in [50, 100, 200, 400, 800]:
    ests = []
    for rep in range(2):
        pl_true = sig(rng.normal(0.8, 1.5, (Cn, n)))
        pl_obs = sig(np.log(pl_true / (1 - pl_true)) + rng.normal(0, 0.8, (Cn, n)))
        w_true = (1 - pl_true) - 0.5; w_obs = (1 - pl_obs) - 0.5
        y = (rng.random((Cn, n)) < sig(eta[:, None] + lamc[:, None] * w_true)).astype(float)
        ests.append((fit_logit(w_obs, y), y.mean()))
    (b1, m1), (b2, m2) = ests
    print(f"   {n:<14d} {np.corrcoef(b1[:,1], b2[:,1])[0,1]:5.2f}                        {np.corrcoef(b1[:,1], lamc)[0,1]:5.2f}"
          f"                {np.corrcoef(b1[:,0], b2[:,0])[0,1]:5.2f}              {m1:.2f}")
