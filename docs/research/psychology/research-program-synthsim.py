"""
research-program-synthsim.py  (Taxila psychology synthesis, 2026-10-02)

Reproducible checks behind RESEARCH-PROGRAM.md, PARENT-REPORT.md and PAPER-OUTLINE.md.
numpy only, fixed seed, runs in well under a minute. Every generative assumption is [U];
the arithmetic is reproducible.

  A. Parent-report gate under screening: independent weak priors (the original PR-D5 spec)
     vs normal-normal empirical-Bayes pooling vs two-groups (spike-and-slab) empirical
     Bayes, by menu size K, data per arm n and the share of real within-child effects.
     Measures claims admitted per report, false claims per report, what the budget
     believed (sum of 1 - P), and yield (share of real effects found). Real effects are
     +/-1.0 logit; baseline success .6 with child SD .5 logit; 3,000 children per cell.
  B. Change-statement ("then -> now") false-row rate per child-year under the null:
     raw-count route vs the corrected rule (pre-declared direction, once per term,
     magnitude floor, posterior >= .95).
  C. Children per age band needed to estimate a reliability coefficient to +/- h.
  D. Growth-rate reliability (GRR) re-check (Brandmaier/Willett).
  E. Sample-size re-checks used in the program (TOST, MDES, parent-report RCT).
  F. Time-to-first-eligible-claim per parent-report construct under three usage levels.
"""
import math
import numpy as np

rng = np.random.default_rng(20261002)
SQ2 = math.sqrt(2.0)


def Phi(x):
    x = np.asarray(x, dtype=float)
    return 0.5 * (1.0 + np.vectorize(math.erf)(x / SQ2))


def logit(p):
    return np.log(p / (1 - p))


def expit(x):
    return 1 / (1 + np.exp(-x))


# --------------------------------------------------------------------------------------
# A. Report gate under screening
# --------------------------------------------------------------------------------------
def gate_sim(K, n, prev, eff=1.0, C=3000, eps=0.3, thr=0.9):
    base = logit(0.6) + rng.normal(0, 0.5, size=(C, 1))
    real = rng.random((C, K)) < prev
    sign = np.where(rng.random((C, K)) < 0.5, -1.0, 1.0)
    d = np.where(real, sign * eff, 0.0)
    pA, pB = expit(base + d / 2), expit(base - d / 2)
    kA, kB = rng.binomial(n, pA), rng.binomial(n, pB)

    # method 1: independent Beta(1,1) per arm (normal approximation to the Beta posteriors)
    mA, mB = (kA + 1) / (n + 2), (kB + 1) / (n + 2)
    vA, vB = mA * (1 - mA) / (n + 3), mB * (1 - mB) / (n + 3)
    P1 = Phi((mA - mB) / np.sqrt(vA + vB))

    # method 2: empirical-Bayes normal-normal on the log-odds contrast, tau^2 learned per
    # menu item across all children (method of moments), mean fixed at 0
    a, b = (kA + 0.5) / (n + 1), (kB + 0.5) / (n + 1)
    dh = logit(a) - logit(b)
    se2 = 1 / (kA + .5) + 1 / (n - kA + .5) + 1 / (kB + .5) + 1 / (n - kB + .5)
    tau2 = np.maximum(0.0, (dh ** 2).mean(axis=0) - se2.mean(axis=0))  # per menu item
    shrink = tau2 / (tau2 + se2)
    pm, psd = dh * shrink, np.sqrt(tau2 * se2 / (tau2 + se2) + 1e-12)
    P2 = np.where(tau2 > 0, Phi(pm / psd), 0.5)

    # method 3: two-groups (spike-and-slab) empirical Bayes per menu item:
    #   d ~ pi0 * delta_0 + (1 - pi0) * N(0, s1^2), (pi0, s1) by grid marginal likelihood.
    #   P(claim correct) = P(d != 0 | data) * P(sign | d != 0, data)
    P3 = np.full_like(P1, 0.5)
    pis = np.linspace(0.50, 0.999, 60)
    s1s = np.linspace(0.1, 3.0, 59)
    for k in range(K):
        x, v = dh[:, k], se2[:, k]
        f0 = np.exp(-x ** 2 / (2 * v)) / np.sqrt(2 * np.pi * v)
        best, arg = -np.inf, (0.999, 0.1)
        for s1 in s1s:
            vv = v + s1 ** 2
            f1 = np.exp(-x ** 2 / (2 * vv)) / np.sqrt(2 * np.pi * vv)
            ll = np.log(np.outer(pis, f0) + np.outer(1 - pis, f1)).sum(axis=1)
            j = int(np.argmax(ll))
            if ll[j] > best:
                best, arg = ll[j], (pis[j], s1)
        pi0, s1 = arg
        vv = v + s1 ** 2
        f1 = np.exp(-x ** 2 / (2 * vv)) / np.sqrt(2 * np.pi * vv)
        lfdr = pi0 * f0 / (pi0 * f0 + (1 - pi0) * f1)
        pm3 = x * s1 ** 2 / (s1 ** 2 + v)
        psd3 = np.sqrt(s1 ** 2 * v / (s1 ** 2 + v))
        psign = Phi(np.abs(pm3) / psd3)
        pc = (1 - lfdr) * psign
        # encode as a directional P so the shared admission code below can read it
        P3[:, k] = np.where(pm3 >= 0, np.maximum(pc, 0.5), 1 - np.maximum(pc, 0.5))

    out = {}
    for name, P in (("independent", P1), ("hierarchical", P2), ("two-groups", P3)):
        conf = np.maximum(P, 1 - P)
        claim_sign = np.where(P >= 0.5, 1.0, -1.0)
        eligible = conf >= thr
        adm_n = np.zeros(C); false_n = np.zeros(C); exp_false = np.zeros(C); found = np.zeros(C)
        for c in range(C):
            idx = np.where(eligible[c])[0]
            idx = idx[np.argsort(-conf[c, idx])]
            budget = 0.0
            for i in idx:
                if budget + (1 - conf[c, i]) > eps:
                    break
                budget += 1 - conf[c, i]
                adm_n[c] += 1
                exp_false[c] += 1 - conf[c, i]
                if d[c, i] == 0 or np.sign(d[c, i]) != claim_sign[c, i]:
                    false_n[c] += 1
                else:
                    found[c] += 1
        nreal = real.sum()
        out[name] = (adm_n.mean(), false_n.mean(), exp_false.mean(),
                     (found.sum() / nreal) if nreal else float("nan"))
    return out


print("A. Report gate under screening (eps = 0.3, P >= .9, effect = 1.0 logit when real)")
print(f"{'K':>3} {'n/arm':>5} {'real':>5} | {'method':>12} | {'admitted':>8} {'false':>6} {'budget-believed':>15} {'yield':>6}")
for K in (30, 6):
    for n in (12, 40, 120):
        for prev in (0.0, 0.1, 0.3):
            r = gate_sim(K, n, prev)
            for m in ("independent", "hierarchical", "two-groups"):
                a, f, e, y = r[m]
                ys = "  n/a" if math.isnan(y) else f"{y:6.3f}"
                print(f"{K:>3} {n:>5} {prev:>5.1f} | {m:>12} | {a:8.2f} {f:6.2f} {e:15.2f} {ys}")
print()

# --------------------------------------------------------------------------------------
# B. False "then -> now" rows per child-year under the null
# --------------------------------------------------------------------------------------
def false_rows(C=4000, rows=6, n=30, p=0.6, months=12, pthr=0.95):
    # each row is a proportion observed in consecutive 28-day windows with n trials each
    k = rng.binomial(n, p, size=(C, rows, months))
    phat = k / n
    # raw-count route: any 3 consecutive windows moving in the same direction (either way),
    # checked every month -> count rows that ever fire in the year
    up = np.diff(phat, axis=2) > 0
    dn = np.diff(phat, axis=2) < 0
    fire_raw = np.zeros((C, rows), bool)
    for t in range(months - 2):
        fire_raw |= (up[:, :, t] & up[:, :, t + 1]) | (dn[:, :, t] & dn[:, :, t + 1])
    raw = fire_raw.sum(axis=1)
    # corrected rule: pre-declared direction (up), evaluated once per term (3 per year:
    # windows 3 vs 0, 7 vs 4, 11 vs 8), magnitude floor delta = .10 and
    # P(p_B - p_A > .10 | data) >= .95 under Beta(1,1)
    fires = np.zeros((C, rows), int)
    for A, B in ((0, 3), (4, 7), (8, 11)):
        kA, kB = k[:, :, A], k[:, :, B]
        mA, mB = (kA + 1) / (n + 2), (kB + 1) / (n + 2)
        v = mA * (1 - mA) / (n + 3) + mB * (1 - mB) / (n + 3)
        P = Phi((mB - mA - 0.10) / np.sqrt(v))
        fires += (P >= pthr)
    corr = fires.sum(axis=1)
    return raw.mean(), (raw >= 1).mean(), corr.mean(), (corr >= 1).mean()


print("B. False change rows per child-year under the null (n = 30 per 28-day window)")
for rows_, pthr in ((6, 0.95), (4, 0.95), (6, 0.975)):
    r = false_rows(rows=rows_, pthr=pthr)
    print(f"   {rows_} rows: raw-count route (3 consecutive same-direction windows, monthly): mean {r[0]:.2f} rows/yr, "
          f"{100 * r[1]:.0f}% of children >= 1 | corrected rule (pre-declared direction, once per term, "
          f"delta .10, P >= {pthr}): mean {r[2]:.3f} rows/yr, {100 * r[3]:.1f}% >= 1")
print()

# --------------------------------------------------------------------------------------
# C. Children per band to estimate a reliability coefficient (Fisher z, 95% CI half-width h)
# --------------------------------------------------------------------------------------
print("C. Children per age band so that a test-retest r has 95% CI half-width h")
for rr in (0.5, 0.7, 0.8):
    row = []
    for h in (0.10, 0.07, 0.05):
        nn = (1.96 * (1 - rr ** 2) / h) ** 2 + 3
        row.append(f"h={h:.2f}: {math.ceil(nn)}")
    print(f"   r = {rr:.1f}  " + "  ".join(row))
print()

# --------------------------------------------------------------------------------------
# D. GRR re-check: GRR = s2 / (s2 + e2 / SST)
# --------------------------------------------------------------------------------------
def grr(sig_s, sig_e, months, step=1):
    t = np.arange(0, months + 1, step) / 12
    sst = ((t - t.mean()) ** 2).sum()
    return sig_s ** 2 / (sig_s ** 2 + sig_e ** 2 / sst), sst


print("D. Growth-rate reliability (monthly occasions, sigma_eps = 0.3)")
for months in (6, 12, 18):
    vals = []
    for s in (0.25, 0.5, 0.75, 1.0):
        g, sst = grr(s, 0.3, months)
        vals.append(f"sigma_S={s}: {g:.2f}")
    print(f"   {months:>2} months (SST {sst:.3f} yr^2): " + "  ".join(vals))
print()

# --------------------------------------------------------------------------------------
# E. Sample-size re-checks
# --------------------------------------------------------------------------------------
z = {0.95: 1.6448536, 0.975: 1.9599640, 0.8: 0.8416212, 0.9: 1.2815516}
tost = 2 * (z[0.95] + z[0.9]) ** 2 / 0.10 ** 2
print("E. Sample sizes")
print(f"   H6 TOST +/-0.10 SD, alpha .05, power .80, true diff 0: {tost:.0f}/arm raw; "
      f"x(1-R2=.5) = {tost * .5:.0f}/arm; x1.5 bandit = {tost * .5 * 1.5:.0f}/arm -> {2 * tost * .5 * 1.5:.0f} total")
mdes = 2.8 * math.sqrt(2 * 0.5 / 300)
print(f"   H1 delayed-start MDES (300/arm, R2 = .5, 80% power, two-sided .05): {mdes:.3f} SD")
for dd in (0.03, 0.05, 0.10):
    nn = 2 * (z[0.975] + z[0.8]) ** 2 / dd ** 2
    print(f"   parent-report RCT, d = {dd:.2f}: {nn:,.0f} families per arm (before clustering/attrition)")
print()

# --------------------------------------------------------------------------------------
# F. Time to first eligible claim (weeks), three usage levels [all rates U]
# --------------------------------------------------------------------------------------
print("F. Weeks until a construct can first pass its parent-report gate (assumed rates, all [U])")
rates = dict(bets_per_session=3, bet_domains=2, bet_accuracy=0.80,
             delayed_checks_per_session=3, active_topic_types=4,
             eligible_errors_per_session=2.4, choice_offers_per_session=0.5,
             help_requests_per_session=2.0, help_windows_per_session=12.0)
rows = [
    ("calibration table (>=30 bets AND >=10 error-bets, one domain)",
     lambda s: max(30 / (s * rates['bets_per_session'] / rates['bet_domains']),
                   10 / (s * rates['bets_per_session'] / rates['bet_domains'] * (1 - rates['bet_accuracy'])))),
    ("durability L2 per topic type (>=80 randomised-lag checks)",
     lambda s: 80 / (s * rates['delayed_checks_per_session'] / rates['active_topic_types'])),
    ("durability L2 under the superseded >=30-check rule",
     lambda s: 30 / (s * rates['delayed_checks_per_session'] / rates['active_topic_types'])),
    ("persistence count (>=10 eligible errors)", lambda s: 10 / (s * rates['eligible_errors_per_session'])),
    ("choice counts (>=10 offers) / change (>=20)",
     lambda s: (10 / (s * rates['choice_offers_per_session']), 20 / (s * rates['choice_offers_per_session']))),
    ("help-by-kind counts (>=10 child requests)", lambda s: 10 / (s * rates['help_requests_per_session'])),
    ("help-need coupling lambda (~400 eligible windows; research only)",
     lambda s: 400 / (s * rates['help_windows_per_session'])),
]
print(f"   {'construct':<68} {'2/wk':>9} {'4/wk':>9} {'6/wk':>9}")
for name, f in rows:
    cells = []
    for s in (2, 4, 6):
        v = f(s)
        cells.append(f"{v[0]:.0f}/{v[1]:.0f}" if isinstance(v, tuple) else f"{v:.0f}")
    print(f"   {name:<68} {cells[0]:>9} {cells[1]:>9} {cells[2]:>9}")
print("   session regularity D28: 4 weeks at any usage; a D28 change line needs two windows and |diff| >= ~7 days")
print("   per-child learning rate, metacognitive efficiency, per-child format effect: not reachable in v1")
