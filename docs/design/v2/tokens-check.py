# PRODUCT-DESIGN-V2 token check (docs/design/PRODUCT-DESIGN-V2.md §7). Written 2026-10-03. stdlib only.
# Run: python3 docs/design/v2/tokens-check.py docs/design/v2/tokens-check-2026-10-03.json
# 1) WCAG 2 contrast for every text / non-text pair the final token file uses, light and dark.
# 2) CIEDE2000 between the state carriers under Machado 2009 severity-1.0 CVD simulation (same maths as
#    docs/design/directions/calm-mastery-contrast.py and docs/research/design/visual-identity-contrast.py).
# 3) The lamp hue lint WITH the saturation floor Child-First Wonder found missing: every saturated token
#    (HSL S >= 35%, 20% <= L <= 85%) other than the lamp family must sit >= 12 deg of hue from --lamp.
import itertools, math, json, sys, colorsys
def hex2rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def lin(c): return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def unlin(c): c=min(max(c,0),1); return 12.92*c if c<=0.0031308 else 1.055*c**(1/2.4)-0.055
def lum(h): r,g,b=map(lin,hex2rgb(h)); return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b): la,lb=lum(a),lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
M={'protan':[[0.152286,1.052583,-0.204868],[0.114503,0.786281,0.099216],[-0.003882,-0.048116,1.051998]],
   'deutan':[[0.367322,0.860646,-0.227968],[0.280085,0.672501,0.047413],[-0.011820,0.042940,0.968881]],
   'tritan':[[1.255528,-0.076749,-0.178779],[-0.078411,0.930809,0.147602],[0.004733,0.691367,0.303900]]}
def sim(h,k):
    if k=='normal': return hex2rgb(h)
    r,g,b=map(lin,hex2rgb(h)); m=M[k]; return [unlin(m[i][0]*r+m[i][1]*g+m[i][2]*b) for i in range(3)]
def lab(rgb):
    r,g,b=map(lin,rgb); X=(0.4124*r+0.3576*g+0.1805*b)/0.95047; Y=0.2126*r+0.7152*g+0.0722*b; Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    return 116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))
def de(l1,l2):
    L1,a1,b1=l1; L2,a2,b2=l2; C1,C2=math.hypot(a1,b1),math.hypot(a2,b2); Cb=(C1+C2)/2
    G=0.5*(1-math.sqrt(Cb**7/(Cb**7+25**7))); a1p,a2p=(1+G)*a1,(1+G)*a2; C1p,C2p=math.hypot(a1p,b1),math.hypot(a2p,b2)
    h1p=math.degrees(math.atan2(b1,a1p))%360; h2p=math.degrees(math.atan2(b2,a2p))%360; dLp,dCp=L2-L1,C2p-C1p
    dhp=0 if C1p*C2p==0 else (h2p-h1p if abs(h2p-h1p)<=180 else (h2p-h1p-360 if h2p>h1p else h2p-h1p+360))
    dHp=2*math.sqrt(C1p*C2p)*math.sin(math.radians(dhp/2)); Lbp,Cbp=(L1+L2)/2,(C1p+C2p)/2
    hbp=h1p+h2p if C1p*C2p==0 else ((h1p+h2p)/2 if abs(h1p-h2p)<=180 else ((h1p+h2p+360)/2 if h1p+h2p<360 else (h1p+h2p-360)/2))
    T=1-0.17*math.cos(math.radians(hbp-30))+0.24*math.cos(math.radians(2*hbp))+0.32*math.cos(math.radians(3*hbp+6))-0.20*math.cos(math.radians(4*hbp-63))
    Sl=1+0.015*(Lbp-50)**2/math.sqrt(20+(Lbp-50)**2); Sc=1+0.045*Cbp; Sh=1+0.015*Cbp*T
    Rt=-2*math.sqrt(Cbp**7/(Cbp**7+25**7))*math.sin(math.radians(60*math.exp(-((hbp-275)/25)**2)))
    return math.sqrt((dLp/Sl)**2+(dCp/Sc)**2+(dHp/Sh)**2+Rt*(dCp/Sc)*(dHp/Sh))

SHARED={'stage':'#26304A','stageInk':'#F5F2E8','stageInk2':'#C3C9D9','board':'#1F3B30','chalk':'#F5F2E8','chalk2':'#BFD3C6',
        'skyPanel':'#0F1A33','skyLabel':'#F6F1E8','white':'#FFFFFF','black':'#121418'}
THEMES={
 'light':{'paper':'#F6F3EC','surface':'#FFFFFF','tray':'#ECE6DA','ink':'#1A1C22','ink2':'#4C505A','line':'#868A94',
          'nib':'#24346E','nibSoft':'#E4E8F4','onNib':'#FFFFFF','lamp':'#FFB21E','lampWash':'#FFF3DB','lampRing':'#7A4800','lampInk':'#5C3600',
          'listen':'#0B7285','onListen':'#FFFFFF','think':'#5B6470','got':'#2E7D32','gotSoft':'#E6F2E7','trouble':'#A3341F','focus':'#1A1C22'},
 'dark': {'paper':'#121418','surface':'#1C1F26','tray':'#262A33','ink':'#F1EEE7','ink2':'#B4B0A8','line':'#7C808A',
          'nib':'#AFC0FF','nibSoft':'#2A3354','onNib':'#121418','lamp':'#FFB21E','lampWash':'#3D2C08','lampRing':'#FFB21E','lampInk':'#FFD27A',
          'listen':'#5CC8D9','onListen':'#121418','think':'#9AA3AF','got':'#6CCB70','gotSoft':'#1E3321','trouble':'#FF8F7A','focus':'#F1EEE7'},
}
# (fg, bg, kind) text = 4.5, large = 3.0, ui = 3.0 (non-text)
PAIRS=[('ink','paper','text'),('ink','surface','text'),('ink','tray','text'),('ink2','paper','text'),('ink2','surface','text'),
       ('ink2','tray','text'),('nib','paper','text'),('nib','surface','text'),('nib','nibSoft','text'),('onNib','nib','text'),
       ('line','paper','ui'),('line','surface','ui'),('lampRing','paper','ui'),('lampRing','lampWash','ui'),('lampRing','surface','ui'),
       ('lampInk','lampWash','text'),('ink','lampWash','text'),('listen','surface','ui'),('listen','paper','ui'),('onListen','listen','ui'),
       ('think','surface','text'),('got','surface','ui'),('got','gotSoft','ui'),('ink','gotSoft','text'),('trouble','surface','text'),
       ('trouble','paper','text'),('focus','surface','ui'),('focus','paper','ui'),
       ('stageInk','stage','text'),('stageInk2','stage','text'),('lamp','stage','ui'),('chalk','board','text'),('chalk2','board','text'),
       ('skyLabel','skyPanel','text')]
STATES=['nib','lampRing','listen','think','got','trouble']
# saturated colours that may appear on a child screen (tokens + Codex art anchors); lamp family excluded
SAT={'nib':'#24346E','listen':'#0B7285','got':'#2E7D32','trouble':'#A3341F','d1':'#2A72C6','d2':'#C2410C','d3':'#0B5E50',
     'd4':'#3F2272','d5-old-haldi':'#946B0E','d5-rose':'#B4466A','d6':'#3A3631','grow-leaf':'#2F7A3E','grow-flower':'#A8326E',
     'grow-fruit':'#5B2E91','art-terracotta':'#B5532E','art-wall':'#E9B89C','art-sky':'#A9D8E8','art-rose':'#B4466A',
     'art-neem':'#2F6B4F','art-sand':'#D9C7A7','skin-3':'#C99366','skin-4':'#A9744A','skin-5':'#8A5634','board-frame':'#8C6B4A',
     'p-amber-old':'#8A4B00','p-yourturn-fill-old':'#FFD27A'}
def hsl(h):
    r,g,b=hex2rgb(h); hh,l,s=colorsys.rgb_to_hls(r,g,b); return hh*360,s,l
def hue_d(a,b): d=abs(a-b)%360; return min(d,360-d)
fails=0; out={}
for th,P0 in THEMES.items():
    P={**SHARED,**P0}; rows=[]
    for fg,bg,k in PAIRS:
        r=cr(P[fg],P[bg]); need=4.5 if k=='text' else 3.0; ok=r>=need; fails+=0 if ok else 1
        rows.append((fg,bg,k,round(r,2),'ok' if ok else 'FAIL'))
    cvd={}
    for a,b in itertools.combinations(STATES,2):
        cvd[a+'/'+b]={k:round(de(lab(sim(P[a],k)),lab(sim(P[b],k))),1) for k in ('normal','protan','deutan','tritan')}
    out[th]={'contrast':rows,'cvd_de2000':cvd}
lh,_,_=hsl('#FFB21E'); lint=[]
for n,h in SAT.items():
    hh,s,l=hsl(h); applies = s>=0.35 and 0.20<=l<=0.85; d=hue_d(hh,lh)
    lint.append((n,h,round(hh,1),round(s*100),round(l*100),round(d,1),'n/a (below sat floor)' if not applies else ('ok' if d>=12 else 'FAIL')))
out['lamp_hue_lint']=lint
for th in ('light','dark'):
    print('==',th)
    for r in out[th]['contrast']: print('  %-10s on %-9s %-5s %6.2f %s'%r)
    print('  CVD pairs with min dE2000 < 15 (shape and word must carry them):')
    for k,v in out[th]['cvd_de2000'].items():
        if min(v.values())<15: print('   ',k,v)
print('== lamp hue lint (lamp hue %.1f deg)'%lh)
for r in lint: print('  %-20s %s hue %5.1f S %3d%% L %3d%%  d=%5.1f  %s'%r)
print('contrast failures:',fails, '| hue-lint failures:', sum(1 for r in lint if r[-1]=='FAIL'))
if len(sys.argv)>1: json.dump(out,open(sys.argv[1],'w'),indent=1)
