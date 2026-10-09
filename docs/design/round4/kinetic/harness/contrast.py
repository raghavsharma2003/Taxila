# WCAG 2.x contrast for every text/ground pair Taal uses (sRGB relative luminance).
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
T={'kajal':'#0E0B12','kajal-2':'#1A1420','jamun':'#2A0F35','jamun-2':'#3A1648','jamun-3':'#4B1F5C','neel':'#0E1748','neel-2':'#18245F','neel-3':'#2A3A9A','mor':'#052E2C','mor-2':'#0B403D',
   'ink':'#FFF5EA','ink-2':'#DCCFC6','ink-3':'#A89BA3','genda':'#FFB000','rani':'#FF2E88','rani-text':'#FF6AA8','mint':'#3FE0A0','sky':'#7CD3FF',
   'paper':'#F7F2F0','paper-2':'#FFFFFF','p-ink':'#1C1020','p-ink-2':'#574A5A','rani-deep':'#B0105A','p-mint':'#0B7D55','genda-soft':'#FFD978','genda-edge':'#B87A00'}
pairs=[('ink','kajal'),('ink-2','kajal'),('ink-3','kajal'),('genda','kajal'),('rani-text','kajal'),('rani','kajal'),('mint','kajal'),('sky','kajal'),
       ('ink','jamun'),('ink-2','jamun'),('ink-3','jamun'),('genda','jamun'),('rani-text','jamun'),('ink','jamun-2'),('ink-2','jamun-2'),('ink-3','jamun-2'),('genda','jamun-3'),('ink-3','jamun-3'),
       ('ink','neel'),('ink-3','neel'),('genda','neel'),('ink','neel-2'),('ink-3','neel-2'),('ink','neel-3'),('kajal','genda'),
       ('ink','mor'),('ink-2','mor'),('ink-3','mor'),('genda','mor'),('rani-text','mor'),('ink-3','mor-2'),('genda','mor-2'),
       ('kajal','rani'),('kajal','genda'),('kajal','mint'),('kajal','sky'),('ink','kajal-2'),
       ('p-ink','paper'),('p-ink-2','paper'),('p-ink','paper-2'),('p-ink-2','paper-2'),('p-mint','paper-2'),('rani-deep','paper'),('paper','p-ink'),('genda-soft','p-ink'),('p-ink','genda-soft'),('genda-edge','paper-2')]
print('| text | ground | ratio | AA body (4.5) |'); print('|---|---|---|---|')
for a,b in pairs:
    r=cr(T[a],T[b]); print(f'| {a} `{T[a]}` | {b} `{T[b]}` | {r:.2f} | {"pass" if r>=4.5 else ("large/graphic only" if r>=3 else "FAIL")} |')
