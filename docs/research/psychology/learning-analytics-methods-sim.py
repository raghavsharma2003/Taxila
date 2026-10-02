"""
learning-analytics-methods-sim.py  --  reproducible design calculations for
docs/research/psychology/learning-analytics-methods.md (Taxila, 2026-10-02).

numpy only, fixed seeds. Run:  python3 learning-analytics-methods-sim.py
All generative assumptions are [U] (Taxila design defaults, not measurements).
The arithmetic is reproducible; the inputs are guesses to be replaced by pilot data.

Parts
  A. Micro-randomised trial (MRT) power for a proximal binary outcome
     (centred-treatment WCLS / risk-difference excursion effect, child-clustered sandwich SE).
  B. Bandit allocation vs inference: bias, type-I error and power of the naive
     difference-in-means and of an IPW estimator, under batched Thompson sampling
     with exploration floors (Rafferty 2019; Zhang, Janson & Murphy 2020).
  C. Growth-mixture over-extraction: BIC class enumeration on ONE skewed population
     of per-child growth slopes (Bauer & Curran 2003), at Taxila's data shape.
  D. Per-child treatment-effect reliability: how many within-child randomised
     comparisons before a child-level "format X works better for your child" claim
     reaches empirical-Bayes reliability .70 (group-to-individual problem).
"""
import numpy as np

# ----------------------------------------------------------------------------------
# A. MRT power
# ----------------------------------------------------------------------------------
def mrt_once(rng, N, T, beta, p_rand=0.5, avail=0.8, tau_beta=0.0, sd_child=0.8, base=0.6):
    """One simulated MRT. Each child i has T decision points (e.g. 'a skill was just
    marked learned-today'); at each available point the probe/move is randomised with
    prob p_rand. Proximal outcome Y = delayed retrieval success at next session.
    Child baseline on logit scale ~ N(logit(base), sd_child^2); treatment adds beta on the
    probability scale (risk difference), with a child-varying deviation ~ N(0, tau_beta^2).
    Estimator: WLS of Y on [1, t/T, (A - p_rand)] among available points
    (Boruvka 2018 centring => marginal excursion effect), child-clustered sandwich SE."""
    lo = np.log(base / (1 - base))
    b0 = 1 / (1 + np.exp(-(lo + rng.normal(0, sd_child, N))))           # child baseline prob
    bi = beta + rng.normal(0, tau_beta, N)                               # child effect
    t = np.tile(np.arange(T), (N, 1))
    I = rng.random((N, T)) < avail
    A = (rng.random((N, T)) < p_rand).astype(float)
    drift = -0.05 * t / T                                                # mild fatigue/novelty drift
    p = np.clip(b0[:, None] + drift + bi[:, None] * A, 0.01, 0.99)
    Y = (rng.random((N, T)) < p).astype(float)
    X = np.stack([np.ones((N, T)), t / T, A - p_rand], axis=-1)          # N,T,3
    Xa, Ya = X[I], Y[I]
    cid = np.repeat(np.arange(N), T).reshape(N, T)[I]
    XtX = Xa.T @ Xa
    bhat = np.linalg.solve(XtX, Xa.T @ Ya)
    r = Ya - Xa @ bhat
    # cluster-robust meat
    S = np.zeros((N, 3))
    np.add.at(S, cid, Xa * r[:, None])
    meat = S.T @ S
    inv = np.linalg.inv(XtX)
    V = inv @ meat @ inv * (N / (N - 1))
    return bhat[2], np.sqrt(V[2, 2])

def part_a():
    print("\n=== A. MRT power: proximal delayed-retrieval outcome, alpha=.05 two-sided, 400 reps/cell ===")
    print("assumptions [U]: base success .60, child logit SD .8, availability .8, p_rand .5, drift -.05")
    rng = np.random.default_rng(20261002)
    for tau in (0.0, 0.05):
        print(f"\n  child-level effect SD tau_beta = {tau}")
        print("  effect(pp)  N\\T " + "".join(f"{T:>8}" for T in (10, 30, 60)))
        for beta in (0.03, 0.05):
            for N in (100, 200, 400, 800):
                row = []
                for T in (10, 30, 60):
                    hits = 0
                    for _ in range(400):
                        b, se = mrt_once(rng, N, T, beta, tau_beta=tau)
                        hits += abs(b / se) > 1.96
                    row.append(hits / 400)
                print(f"  {beta*100:>6.0f}     {N:>5} " + "".join(f"{x:>8.2f}" for x in row))
    # type-I check
    hits = 0
    for _ in range(1000):
        b, se = mrt_once(rng, 200, 30, 0.0)
        hits += abs(b / se) > 1.96
    print(f"\n  type-I error at beta=0 (N=200, T=30, 1000 reps): {hits/1000:.3f}")

# ----------------------------------------------------------------------------------
# B. Bandit allocation vs valid inference
# ----------------------------------------------------------------------------------
def bandit_once(rng, pA, pB, n_batches=20, batch=100, floor=0.0, uniform=False):
    """Batched Beta-Bernoulli Thompson sampling between two formats; propensity for arm A in
    each batch = Monte-Carlo P(A best) clipped to [floor, 1-floor]. Returns naive diff, its
    Wald SE, an IPW diff with a crude (iid) SE, and share of allocations to the better arm."""
    sA = fA = sB = fB = 0
    yA, yB, ipwA, ipwB = [], [], [], []
    toA = 0
    for _ in range(n_batches):
        if uniform:
            pi = 0.5
        else:
            dA = rng.beta(1 + sA, 1 + fA, 2000); dB = rng.beta(1 + sB, 1 + fB, 2000)
            pi = float(np.clip((dA > dB).mean(), floor, 1 - floor))
        a = rng.random(batch) < pi
        y = np.where(a, rng.random(batch) < pA, rng.random(batch) < pB).astype(float)
        sA += y[a].sum(); fA += a.sum() - y[a].sum(); sB += y[~a].sum(); fB += (~a).sum() - y[~a].sum()
        yA += list(y[a]); yB += list(y[~a]); toA += a.sum()
        # IPW contributions (Horvitz-Thompson per allocation); pi=0 or 1 gives undefined weights
        with np.errstate(divide="ignore", invalid="ignore"):
            ipwA += list(np.where(a, y / pi, 0.0)); ipwB += list(np.where(~a, y / (1 - pi), 0.0))
    yA, yB = np.array(yA), np.array(yB)
    if len(yA) < 2 or len(yB) < 2:
        return np.nan, np.nan, np.nan, np.nan, toA / (n_batches * batch)
    d = yA.mean() - yB.mean()
    se = np.sqrt(yA.var(ddof=1) / len(yA) + yB.var(ddof=1) / len(yB))
    ia, ib = np.array(ipwA), np.array(ipwB)
    ipw = ia.mean() - ib.mean()
    ipw_se = np.sqrt(np.var(ia - ib, ddof=1) / len(ia))
    return d, se, ipw, ipw_se, toA / (n_batches * batch)

def part_b():
    print("\n=== B. Batched Thompson sampling: inference consequences (2,000 allocations, 20 batches; 1,000 reps) ===")
    print("assumptions [U]: delayed-success p = .60 under H0 for both formats; H1: format A = .65")
    rng = np.random.default_rng(7)
    designs = [("uniform 50/50", dict(uniform=True)), ("TS floor .20", dict(floor=0.20)),
               ("TS floor .10", dict(floor=0.10)), ("TS floor .05", dict(floor=0.05)), ("TS no floor", dict(floor=0.0))]
    print(f"  {'design':<15}{'H0 bias(pp)':>12}{'H0 typeI naive':>16}{'H0 typeI IPW':>14}{'H1 power naive':>16}{'H1 share->A':>13}")
    for name, kw in designs:
        r0 = np.array([bandit_once(rng, .60, .60, **kw) for _ in range(1000)], dtype=float)
        r1 = np.array([bandit_once(rng, .65, .60, **kw) for _ in range(1000)], dtype=float)
        ok0 = ~np.isnan(r0[:, 0]); ok1 = ~np.isnan(r1[:, 0])
        bias = np.nanmean(r0[:, 0]) * 100
        t1n = np.mean(np.abs(r0[ok0, 0] / r0[ok0, 1]) > 1.96)
        okI = ok0 & np.isfinite(r0[:, 2]) & np.isfinite(r0[:, 3]) & (r0[:, 3] > 0)
        t1i = np.mean(np.abs(r0[okI, 2] / r0[okI, 3]) > 1.96) if okI.any() else np.nan
        pw = np.mean((r1[ok1, 0] / r1[ok1, 1]) > 1.96)
        share = np.mean(r1[:, 4])
        print(f"  {name:<15}{bias:>12.2f}{t1n:>16.3f}{t1i:>14.3f}{pw:>16.2f}{share:>13.2f}")
    print("  note: under a symmetric H0 the mean A-B difference is ~0 by symmetry; per-arm sample means are")
    print("        still biased (Shin, Ramdas & Rinaldo 2021). The damage shows as type-I inflation and lost power.")
    print("        IPW excludes reps where pi hit exactly 0/1 (undefined weights): that is the floor's job.")

# ----------------------------------------------------------------------------------
# C. Growth-mixture over-extraction on one skewed population
# ----------------------------------------------------------------------------------
def gmm1d_bic(x, k, rng, n_init=6, iters=300):
    n = len(x); best = -np.inf
    for _ in range(n_init):
        mu = rng.choice(x, k, replace=False); sd = np.full(k, x.std()); w = np.full(k, 1 / k)
        for _ in range(iters):
            dens = w * np.exp(-0.5 * ((x[:, None] - mu) / sd) ** 2) / (sd * np.sqrt(2 * np.pi)) + 1e-300
            ll = np.log(dens.sum(1)).sum()
            r = dens / dens.sum(1, keepdims=True)
            nk = r.sum(0) + 1e-9
            w = nk / n; mu = (r * x[:, None]).sum(0) / nk
            sd = np.sqrt((r * (x[:, None] - mu) ** 2).sum(0) / nk); sd = np.maximum(sd, 1e-3 * x.std())
        best = max(best, ll)
    p = 3 * k - 1
    return -2 * best + p * np.log(n)

def part_c():
    print("\n=== C. Growth-mixture over-extraction (Bauer & Curran 2003) at Taxila data shape; 100 reps ===")
    print("assumptions [U]: 1,000 children, 12 monthly theta estimates (SE .25 GE), ONE population of growth")
    print("slopes; slopes either normal or right-skewed (gamma, as when practice dose is skewed)")
    rng = np.random.default_rng(11)
    for label, gen in [("normal slopes", lambda n: rng.normal(0.08, 0.04, n)),
                       ("skewed slopes (gamma k=2)", lambda n: rng.gamma(2.0, 0.04, n))]:
        picks = []
        for _ in range(100):
            n, T = 1000, 12
            s = gen(n)
            tt = np.arange(T)
            th = rng.normal(0, 1, n)[:, None] + s[:, None] * tt + rng.normal(0, 0.25, (n, T))
            tc = tt - tt.mean()
            shat = (th * tc).sum(1) / (tc ** 2).sum()                     # per-child OLS slope
            bics = [gmm1d_bic(shat, k, rng) for k in (1, 2, 3, 4)]
            picks.append(int(np.argmin(bics)) + 1)
        picks = np.array(picks)
        print(f"  {label:<28} BIC picks k=1: {np.mean(picks==1):.2f}  k=2: {np.mean(picks==2):.2f}  "
              f"k=3: {np.mean(picks==3):.2f}  k=4: {np.mean(picks==4):.2f}")
    print("  reading: with ONE true population, skewness alone manufactures 'trajectory classes'.")

# ----------------------------------------------------------------------------------
# D. Per-child effect reliability (empirical Bayes), analytic
# ----------------------------------------------------------------------------------
def part_d():
    print("\n=== D. Child-level format-effect reliability rho = tau^2 / (tau^2 + V/n) (analytic) ===")
    print("assumptions [U]: delayed success p ~ .6; logit-scale sampling variance of a within-child")
    print("A-vs-B log-odds contrast with n comparisons per arm = 2/(n p(1-p)); tau = true child SD of effect")
    p = 0.6
    for tau in (0.1, 0.2, 0.3, 0.5):
        need = None
        for n in range(1, 5001):
            V = 2 / (n * p * (1 - p))
            if tau ** 2 / (tau ** 2 + V) >= 0.70:
                need = n; break
        print(f"  tau = {tau:.1f} logit -> delayed comparisons per arm for rho >= .70: {need}")
    print("  at Taxila's ~2-6 delayed comparisons per child x topic type per month [U],")
    print("  a per-child effect with tau <= .3 is not reportable within a school year.")

if __name__ == "__main__":
    part_d()
    part_a()
    part_b()
    part_c()
