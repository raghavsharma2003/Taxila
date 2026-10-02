# Reliability of per-child learning-rate (iAFM slope) and durability (HLR half-life offset) estimates.
# Empirical-Bayes (MAP with the true population prior) per child; reliability = corr(est,true)^2.
import numpy as np
rng=np.random.default_rng(7)
sig=lambda x:1/(1+np.exp(-x))

def fit_iafm(y,T,bk,sd_th,sd_g,g0,iters=30):
    # params: th (intercept dev), g (slope dev); prior N(0,sd^2)
    p=np.zeros(2)
    X=np.stack([np.ones_like(T),T],1)
    P=np.diag([1/sd_th**2,1/sd_g**2])
    for _ in range(iters):
        eta=bk+X@p+g0*T
        mu=sig(eta)
        grad=X.T@(y-mu)-P@p
        H=-(X.T*(mu*(1-mu)))@X-P
        p=p-np.linalg.solve(H,grad)
    return p

def sim_iafm(nchild,K,opp,sd_th=0.59,sd_g=0.0148,g0=0.1,sd_b=0.8):
    tr=[];es=[]
    for c in range(nchild):
        th=rng.normal(0,sd_th); g=rng.normal(0,sd_g)
        bk=np.repeat(rng.normal(np.log(.65/.35),sd_b,K),opp)
        T=np.tile(np.arange(opp,dtype=float),K)
        y=(rng.random(K*opp)<sig(bk+th+(g0+g)*T)).astype(float)
        e=fit_iafm(y,T,bk,sd_th,sd_g,g0)
        tr.append(g);es.append(e[1])
    r=np.corrcoef(tr,es)[0,1]
    return r*r

def sim_hlr(nchild,M,sd_u=0.5,mu=3.0,sd_item=0.5,lagmax=30):
    # p = 2^(-lag/h), log2 h = mu + u_c + item noise (known item part ignored -> noise)
    tr=[];es=[]
    for c in range(nchild):
        u=rng.normal(0,sd_u)
        lag=rng.uniform(1,lagmax,M)
        item=rng.normal(0,sd_item,M)
        h=2**(mu+u+item); p=np.clip(2**(-lag/h),1e-4,1-1e-4)
        y=(rng.random(M)<p).astype(float)
        # MAP for u with item effect treated as unknown noise (integrate crudely by ignoring) -> grid posterior
        grid=np.linspace(-2.5,2.5,201)
        ll=np.zeros_like(grid)
        for i,uu in enumerate(grid):
            # marginalise item noise by Gauss-Hermite (5 pts)
            xs,ws=np.polynomial.hermite_e.hermegauss(7); ws=ws/ws.sum()
            pp=np.zeros(M)
            for x,w in zip(xs,ws):
                pp+=w*np.clip(2**(-lag/2**(mu+uu+sd_item*x)),1e-6,1-1e-6)
            ll[i]=np.sum(y*np.log(pp)+(1-y)*np.log(1-pp))
        lp=ll-0.5*(grid/sd_u)**2
        w=np.exp(lp-lp.max()); w/=w.sum()
        tr.append(u); es.append((w*grid).sum())
    r=np.corrcoef(tr,es)[0,1]
    return r*r

print("iAFM slope reliability (SD slope=0.0148, Koedinger IQR 0.020):")
for K,opp in [(10,7),(30,7),(30,15),(100,10)]:
    print(f"  K={K:3d} skills x {opp:2d} opp = {K*opp:4d} obs: rel={sim_iafm(300,K,opp):.2f}")
print("iAFM slope reliability if SD slope 2.5x larger (0.037, cf. Lee et al. 2026 inflation range):")
for K,opp in [(10,7),(30,7),(30,15),(100,10)]:
    print(f"  K={K:3d} x {opp:2d} = {K*opp:4d}: rel={sim_iafm(300,K,opp,sd_g=0.037):.2f}")
print("iAFM intercept reliability check (K=10,opp=7) skipped")
print("HLR child half-life offset reliability (SD u=0.5 log2 units, item SD 0.5, lags U(1,30)d, base h=8d):")
for M in [5,10,20,40,80,160]:
    print(f"  M={M:3d} delayed checks: rel={sim_hlr(300,M):.2f}")
print("HLR with item SD 1.0 (generated items, poorly calibrated):")
for M in [10,40,160]:
    print(f"  M={M:3d}: rel={sim_hlr(300,M,sd_item=1.0):.2f}")
print("HLR with child SD 0.25:")
for M in [10,40,160]:
    print(f"  M={M:3d}: rel={sim_hlr(300,M,sd_u=0.25):.2f}")

# --- intercept vs slope run (relsim2) ---
def sim_iafm2(nchild,K,opp,sd_th=0.59,sd_g=0.0148,g0=0.1,sd_b=0.8):
    tt=[];te=[];gt=[];ge=[]
    for c in range(nchild):
        th=rng.normal(0,sd_th); g=rng.normal(0,sd_g)
        bk=np.repeat(rng.normal(np.log(.65/.35),sd_b,K),opp)
        T=np.tile(np.arange(opp,dtype=float),K)
        y=(rng.random(K*opp)<sig(bk+th+(g0+g)*T)).astype(float)
        e=fit_iafm(y,T,bk,sd_th,sd_g,g0)
        tt.append(th);te.append(e[0]);gt.append(g);ge.append(e[1])
    return np.corrcoef(tt,te)[0,1]**2, np.corrcoef(gt,ge)[0,1]**2
for K,opp in [(5,7),(10,7),(30,30)]:
    a,b=sim_iafm2(400,K,opp); print(f"K={K} opp={opp} N={K*opp}: intercept rel={a:.2f} slope rel={b:.2f}")
