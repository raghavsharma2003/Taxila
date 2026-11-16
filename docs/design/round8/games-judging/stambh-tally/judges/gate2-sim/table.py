from fractions import Fraction as F
from itertools import product
PAD="1234567890"
def pos(k): i=PAD.index(k); return (i//6,i%6)
def near(d):
    r,c=pos(d); return [k for k in PAD if k!=d and max(abs(pos(k)[0]-r),abs(pos(k)[1]-c))==1]
def typos(v):
    t=str(v); out=[]
    for i,ch in enumerate(t):
        for k in near(ch): out.append(int(t[:i]+k+t[i+1:]))
    if len(t)==2:
        if t[0]!=t[1]: out.append(int(t[1]+t[0]))
        out+= [int(t[0]),int(t[1])]
    else: out.append(int(t+t))
    return [x for x in out if x!=v and x<=99]
W={'right':(lambda b,s:5*b+s,1),'dropped':(lambda b,s:5*b,1),'doubled':(lambda b,s:5*b+2*s,1),'sixth':(lambda b,s:6*b+s,1),
   'across':(lambda b,s:b,0),'groups':(lambda b,s:b+s,0),'ten':(lambda b,s:10*b+s,0),'loose':(lambda b,s:s,0)}
def cs(f,st,b,s):
    v=f(b,s); o=[f(b+1,s)]
    if b>=1:o.append(f(b-1,s))
    if s>=1:o+=[f(b,s-1),f(b,s+1)]
    if st and b>=1:o+=[v-1,v+1]
    return [x for x in o if x!=v and x>=0]
sh=lambda xs,t: F(sum(x==t for x in xs),len(xs)) if xs else F(0)
rows=[n for n in range(16,50) if not (n%5==n//5)]
res={}
for n in rows:
    b,s=n//5,n%5; M=n-b; by={}
    for k,(f,st) in W.items():
        v=f(b,s); by[k]=F(1) if v==M else max(sh(cs(f,st,b,s),M),sh(typos(v),M))
    worst=max(by.values()); wk=[k for k in by if by[k]==worst]
    res[n]=(by['right'],worst,wk)
    print(n,f"{b}+{s}",M,"right",by['right'],"worst",worst,wk if worst>0 else "firm")
firm=[n for n in rows if res[n][1]==0]; print("firm",firm)
wp=max(res[n][1] for n in rows if n not in firm); print("weak max",wp)
def sess(ps,named):
    tot=F(0)
    for hit in product([0,1],repeat=len(ps)):
        if named(hit):
            p=F(1)
            for h,q in zip(hit,ps): p*= q if h else 1-q
            tot+=p
    return tot
B=F(1,100)
def worst(pw,pf,rule,n=4):
    best=(0,None)
    for c in range(n+1):
        ps=[pf]*c+[pw]*(n-c)
        v=sess(ps,lambda h: rule(h,c)); best=(v,c) if v>best[0] else best
    return best
rule=lambda h,c: sum(h)>=3 or (sum(h)>=2 and any(h[i] for i in range(c)))
optA=lambda h,c: sum(h)>=2 and any(h[i] for i in range(c))
s=worst(F(1,4),B,rule); print("slip",s, float(1/s[0]))
print("slip one firm", float(1/sess([B,F(1,4),F(1,4),F(1,4)],lambda h: rule(h,1))))
bl=worst(B,B,rule); print("blind",bl,float(1/bl[0]))
print("pair3",sess([F(1,4)]*3,lambda h:sum(h)>=2),"pair4",sess([F(1,4)]*4,lambda h:sum(h)>=2),"five",sess([F(1,4)]*5,lambda h:sum(h)>=3),float(sess([F(1,4)]*5,lambda h:sum(h)>=3)))
a=worst(F(1,4),B,optA); print("optA",a,float(1/a[0]))
import math
n=1; 
while 1-(1-1e-4)**(n+1)<0.1: n+=1
print("keep blind n max",n, 1-(1-1e-4)**1053, 1-(1-1e-4)**1054)
# pairs count
pairs=sum(1 for x in rows for y in rows if x<y and x//5!=y//5 and x%5!=y%5); print("pairs",pairs)
