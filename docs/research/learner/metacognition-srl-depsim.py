"""
metacognition-srl-depsim.py — dependency-risk metric simulation for Taxila (learner/metacognition-srl.md §5).

Question: which dependency indicators are (a) confounded with ability, (b) valid for a latent
dependency propensity delta, and (c) reliable at Taxila's data volume?

Generative assumptions are [U] (design defaults, not measured). Arithmetic is reproducible:
    python3 metacognition-srl-depsim.py      (numpy only, seed 7, ~20-40 s)

Model per child c (independent draws):
    theta_c ~ N(0,1)            ability (KT owns it)
    delta_c ~ N(0,1)            dependency propensity, generated INDEPENDENT of theta
    session weather u_cs ~ N(0, 0.5) on help propensity
Per practice item k (12/session) with difficulty b_k ~ N(0,1):
    p_know   = sigmoid(theta_c - b_k)
    pL_obs   = sigmoid(logit(p_know) + N(0, 0.8))          KT noise
    pre-attempt help   ~ Bern(sigmoid(-2.2 + 2.5*(1-p_know) + 0.8*delta_c + u_cs))
    answer-kind | help ~ Bern(sigmoid(-1.6 + 0.9*delta_c + 0.6*(1-p_know)))
    click-through (dwell < tau_read on >=2 rungs) | help ~ Bern(sigmoid(-1.8 + 0.7*delta_c))
Solo twins (3/session): an isomorphic item after an assisted episode, tutor silent until commit.
    gain from the episode on logit scale = 1.2 * (1 - p_know) * (1 - 0.6*sigmoid(1.5*delta_c))
    -> dependent children learn less from the same help (Bastani 2025 mechanism, size [U])
    solo success ~ Bern(sigmoid(logit(p_know) + gain))
Indices (per child, per window):
    RAW_HELP      help requests / items                      (the naive "uses lots of hints")
    HELP_RESID    mean(h - h_hat(pL_obs)), population logistic on observed pL (need-adjusted)
    EXPEDIENT     (answer requests + 1) / (help requests + 4)  (Beta(1,3)-shrunk share)
    CLICK         click-through share of help events, shrunk
    TRANSFER_RES  mean(solo - s_hat(pL_obs)), population logistic on observed pL; NEGATED so
                  higher = more dependent
    DRI           mean of z-scores of HELP_RESID, EXPEDIENT, CLICK, TRANSFER_RES (equal prior weights)
Windows: 4 sessions/week. Test-retest = Pearson r between two independent windows of equal length.
"""
import numpy as np

rng = np.random.default_rng(7)
N = 3000                       # children
ITEMS_PER_SESSION = 12
SOLO_PER_SESSION = 3
SESS_PER_WEEK = 4

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def logit(p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p))

theta = rng.normal(0, 1, N)
delta = rng.normal(0, 1, N)

def simulate_window(weeks, seed, gain_mult=1.0):
    r = np.random.default_rng(seed)
    S = weeks * SESS_PER_WEEK
    nI = S * ITEMS_PER_SESSION
    nT = S * SOLO_PER_SESSION
    u = r.normal(0, 0.5, (N, S))
    u_items = np.repeat(u, ITEMS_PER_SESSION, axis=1)
    b = r.normal(0, 1, (N, nI))
    pk = sigmoid(theta[:, None] - b)
    pl = sigmoid(logit(pk) + r.normal(0, 0.8, (N, nI)))
    h = r.random((N, nI)) < sigmoid(-2.2 + 2.5 * (1 - pk) + 0.8 * delta[:, None] + u_items)
    ans = (r.random((N, nI)) < sigmoid(-1.6 + 0.9 * delta[:, None] + 0.6 * (1 - pk))) & h
    clk = (r.random((N, nI)) < sigmoid(-1.8 + 0.7 * delta[:, None])) & h
    c0 = (r.random((N, nI)) < pk) & ~h                       # unaided first-try success (KT class C0)
    n_unaided = (~h).sum(1)
    theta_hat = logit((c0.sum(1) + 1) / (n_unaided + 2))      # per-child ability from unaided items only
    # solo twins
    bt = r.normal(0, 1, (N, nT))
    pkt = sigmoid(theta[:, None] - bt)
    plt = sigmoid(logit(pkt) + r.normal(0, 0.8, (N, nT)))
    gain = gain_mult * 1.2 * (1 - pkt) * (1 - 0.6 * sigmoid(1.5 * delta[:, None]))
    solo = r.random((N, nT)) < sigmoid(logit(pkt) + gain)
    return dict(h=h, ans=ans, clk=clk, pl=pl, solo=solo, plt=plt, theta_hat=theta_hat)

def pop_fit(x, y, iters=30):
    """1-D logistic regression y ~ a + b*logit(x) by Newton (population expectation model)."""
    X = np.stack([np.ones(x.size), logit(x.ravel())], 1)
    yv = y.ravel().astype(float)
    w = np.zeros(2)
    for _ in range(iters):
        p = sigmoid(X @ w)
        g = X.T @ (yv - p)
        H = (X * (p * (1 - p))[:, None]).T @ X
        w += np.linalg.solve(H + 1e-6 * np.eye(2), g)
    return w

def pop_fit2(x, th, y, iters=30):
    """logistic y ~ a + b*logit(x) + c*theta_hat_child (conditions on the child's unaided ability)."""
    T = np.broadcast_to(th[:, None], x.shape)
    X = np.stack([np.ones(x.size), logit(x.ravel()), T.ravel()], 1)
    yv = y.ravel().astype(float)
    w = np.zeros(3)
    for _ in range(iters):
        p = sigmoid(X @ w)
        g = X.T @ (yv - p)
        H = (X * (p * (1 - p))[:, None]).T @ X
        w += np.linalg.solve(H + 1e-6 * np.eye(3), g)
    return w

def indices(d, w_h=None, w_s=None, w_s2=None):
    if w_h is None:
        w_h = pop_fit(d['pl'], d['h'])
        w_s = pop_fit(d['plt'], d['solo'])
        w_s2 = pop_fit2(d['plt'], d['theta_hat'], d['solo'])
    hhat = sigmoid(w_h[0] + w_h[1] * logit(d['pl']))
    shat = sigmoid(w_s[0] + w_s[1] * logit(d['plt']))
    shat2 = sigmoid(w_s2[0] + w_s2[1] * logit(d['plt']) + w_s2[2] * d['theta_hat'][:, None])
    nh = d['h'].sum(1)
    out = dict(
        RAW_HELP=d['h'].mean(1),
        HELP_RESID=(d['h'] - hhat).mean(1),
        EXPEDIENT=(d['ans'].sum(1) + 1) / (nh + 4),
        CLICK=(d['clk'].sum(1) + 1) / (nh + 4),
        TRANSFER_RES=-(d['solo'] - shat).mean(1),
        TRANSFER_RES2=-(d['solo'] - shat2).mean(1),
    )
    z = lambda v: (v - v.mean()) / v.std()
    out['DRI'] = (z(out['HELP_RESID']) + z(out['EXPEDIENT']) + z(out['CLICK']) + z(out['TRANSFER_RES2'])) / 4
    return out, (w_h, w_s, w_s2)

def r(a, b):
    return float(np.corrcoef(a, b)[0, 1])

names = ['RAW_HELP', 'HELP_RESID', 'EXPEDIENT', 'CLICK', 'TRANSFER_RES', 'TRANSFER_RES2', 'DRI']
print(f"N={N} children; {ITEMS_PER_SESSION} practice items + {SOLO_PER_SESSION} solo twins per session; {SESS_PER_WEEK} sessions/week\n")
print("Table A: validity and test-retest by window length")
print(f"{'index':14s} | " + " | ".join(f"wk={w}: r(.,theta) r(.,delta) retest" for w in (2, 4, 8)))
res = {}
for weeks in (2, 4, 8):
    d1 = simulate_window(weeks, 100 + weeks)
    d2 = simulate_window(weeks, 200 + weeks)
    i1, W = indices(d1)
    i2, _ = indices(d2, *W)
    for n in names:
        res.setdefault(n, []).append((r(i1[n], theta), r(i1[n], delta), r(i1[n], i2[n])))
for n in names:
    print(f"{n:14s} | " + " | ".join(f"{a:+.2f} {b:+.2f} {c:.2f}".rjust(32) for a, b, c in res[n]))

# Table B: who gets flagged (top 10%) at 4 weeks
d1 = simulate_window(4, 300)
i1, _ = indices(d1)
q_theta = np.quantile(theta, [0.25, 0.75])
low_ab = theta < q_theta[0]
hi_dep = delta > np.quantile(delta, 0.9)
lo_dep = delta < np.quantile(delta, 0.5)
print("\nTable B: flag = top 10% of the index at 4 weeks")
print(f"{'index':14s} | share of flags in lowest-ability quartile | hit rate on top-10% delta | false flags among delta below median")
for n in ['RAW_HELP', 'HELP_RESID', 'TRANSFER_RES', 'TRANSFER_RES2', 'DRI']:
    f = i1[n] > np.quantile(i1[n], 0.9)
    print(f"{n:14s} | {f[low_ab].sum() / f.sum():.2f} (chance .25) | {f[hi_dep].mean():.2f} | {f[lo_dep].mean():.3f}")

# Table C: solo twins needed for TRANSFER_RES alone
print("\nTable C: TRANSFER_RES2 (ability-conditioned) test-retest vs number of solo twins")
for weeks in (1, 2, 4, 8, 16):
    a = simulate_window(weeks, 400 + weeks); b2 = simulate_window(weeks, 500 + weeks)
    ia, W = indices(a); ib, _ = indices(b2, *W)
    print(f"  solo twins={weeks * SESS_PER_WEEK * SOLO_PER_SESSION:4d}  retest={r(ia['TRANSFER_RES2'], ib['TRANSFER_RES2']):.2f}  r(.,delta)={r(ia['TRANSFER_RES2'], delta):+.2f}  r(.,theta)={r(ia['TRANSFER_RES2'], theta):+.2f}")

# Table D: fleet-level detection of a policy that weakens transfer (gain x0.8 = a 'leakier' Director)
print("\nTable D: fleet A/B, 2-week window, mean solo-twin success per child; policy B multiplies episode gain by 0.8 or 0.5")
a = simulate_window(2, 600, 1.0)
ma = a['solo'].mean(1)
for k, mult in enumerate((0.8, 0.5)):
    b3 = simulate_window(2, 700 + k, mult)
    mb = b3['solo'].mean(1)
    diff = ma.mean() - mb.mean()
    sd = np.sqrt((ma.var() + mb.var()) / 2)
    n80 = int(np.ceil(2 * ((1.96 + 0.84) * sd / diff) ** 2))
    print(f"  gain x{mult}: solo success A={ma.mean():.3f}  B={mb.mean():.3f}  diff={diff:.3f}  child-level SD={sd:.3f}  children per arm for 80% power (alpha .05)={n80}")
