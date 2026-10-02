"""Habit-formation identifiability simulation for motivation-habits.md §6.4.

Question: from session logs alone, can Taxila estimate (a) a per-child habit-formation time
(Lally-style 'days to 95% of asymptote') and (b) simple descriptive habit indicators
(days-with-session per 28 d; share of sessions in the anchored slot) reliably enough to tell a parent?

Generative model (all parameters [U], chosen to resemble Lally 2009/2010 and Keller 2021 ranges):
  H_c(t) = 1 - exp(-k_c * n_c(t))           habit strength, driven by cumulative anchored repetitions n_c(t)
  p_c(t) = sigmoid(a_c + d_c * H_c(t) + w_dow + e_t),  e_t ~ N(0, 0.6) day noise (tuition, guests, illness)
  slot = anchor with prob q0_c + (q1_c - q0_c) * H_c(t)  (given a session)
  k_c lognormal, set so the median time to H = 0.95 is ~ 60-70 days for a child at median p
  holiday block (festival) days 70-79: p multiplied by 0.35 (context disruption)
Estimators:
  t95_hat: grid-search fit of y(t) = A - B * exp(-C t) to the 7-day rolling session rate (Lally's curve)
  D28: sessions-days in a 28-day block;  ANCH: share of sessions in the anchor slot in a 28-day block
Outputs: corr(t95_hat, t95_true), share of children with a 'good fit' (R^2 >= .7), and 28-day test-retest r.
Run: python3 motivation-habits-habitsim.py   (numpy only; seed fixed; ~10 s)
"""
import numpy as np
rng = np.random.default_rng(20261002)

def simulate(N=400, T=168):
    a = rng.normal(-0.6, 0.7, N)            # baseline propensity (logit)
    d = rng.gamma(4, 0.45, N)               # how much habit lifts propensity
    k = np.exp(rng.normal(np.log(0.055), 0.6, N))   # per-repetition habit gain
    q0 = rng.beta(4, 4, N); q1 = np.clip(q0 + rng.beta(5, 3, N) * (1 - q0), 0, 0.98)
    dow = np.array([0.0, 0.0, 0.0, 0.0, -0.2, -0.5, -0.4])   # Fri-Sun lower [U]
    sess = np.zeros((N, T), bool); anch = np.zeros((N, T), bool); H = np.zeros((N, T))
    n = np.zeros(N)
    for t in range(T):
        h = 1 - np.exp(-k * n); H[:, t] = h
        logit = a + d * h + dow[t % 7] + rng.normal(0, 0.6, N)
        p = 1 / (1 + np.exp(-logit))
        if 70 <= t < 80: p = p * 0.35
        s = rng.random(N) < p
        an = s & (rng.random(N) < (q0 + (q1 - q0) * h))
        sess[:, t] = s; anch[:, t] = an; n += an
    # true t95: first day H >= .95 (inf if never)
    t95 = np.array([np.argmax(H[i] >= 0.95) if (H[i] >= 0.95).any() else np.inf for i in range(N)])
    return sess, anch, H, t95

def fit_asymptote(y, days):
    best = (np.inf, None, None)
    for C in np.exp(np.linspace(np.log(0.005), np.log(0.5), 120)):
        X = np.column_stack([np.ones_like(days), -np.exp(-C * days)])
        coef, *_ = np.linalg.lstsq(X, y, rcond=None)
        r = y - X @ coef; sse = (r ** 2).sum()
        if sse < best[0] and coef[1] > 0: best = (sse, C, coef)
    sse, C, coef = best
    if C is None: return np.nan, 0.0
    r2 = 1 - sse / ((y - y.mean()) ** 2).sum()
    return 3.0 / C, r2          # time to 95% of asymptote = ln(20)/C ~ 3/C

def run(T):
    sess, anch, H, t95 = simulate(T=T)
    N = sess.shape[0]
    roll = np.array([np.convolve(sess[i].astype(float), np.ones(7) / 7, 'valid') for i in range(N)])
    days = np.arange(roll.shape[1], dtype=float) + 6
    est = np.array([fit_asymptote(roll[i], days) for i in range(N)])
    t95h, r2 = est[:, 0], est[:, 1]
    ok = np.isfinite(t95) & np.isfinite(t95h) & (t95 < T)
    good = r2 >= 0.7
    c_all = np.corrcoef(np.log(t95h[ok]), np.log(t95[ok]))[0, 1]
    g5 = r2 >= 0.5
    c_good = np.corrcoef(np.log(t95h[ok & g5]), np.log(t95[ok & g5]))[0, 1] if (ok & g5).sum() > 10 else np.nan
    # descriptive indicators: test-retest between the last two 28-day blocks (steady-ish state)
    b1, b2 = slice(T - 56, T - 28), slice(T - 28, T)
    D1, D2 = sess[:, b1].sum(1), sess[:, b2].sum(1)
    A1 = anch[:, b1].sum(1) / np.maximum(D1, 1); A2 = anch[:, b2].sum(1) / np.maximum(D2, 1)
    m = (D1 >= 4) & (D2 >= 4)
    return dict(T=T, median_true_t95=float(np.median(t95[np.isfinite(t95)])),
                share_reaching_95_within_T=float(np.mean(t95 < T)),
                share_good_fit=float(np.mean(good)), median_fit_R2=float(np.nanmedian(r2)), corr_log_t95_all=float(c_all), corr_log_t95_R2ge05=float(c_good),
                D28_test_retest=float(np.corrcoef(D1, D2)[0, 1]), ANCH_test_retest=float(np.corrcoef(A1[m], A2[m])[0, 1]))

if __name__ == '__main__':
    for T in (84, 168, 252):
        print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in run(T).items()})
