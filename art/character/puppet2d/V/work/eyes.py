import numpy as np, cv2, json
from PIL import Image
a=np.asarray(Image.open('cfront.png')).astype(np.float32)
r,g,b=a[...,0],a[...,1],a[...,2]
luma=0.299*r+0.587*g+0.114*b; sat=a.max(-1)-a.min(-1)
res={}
for name,(x0,y0,x1,y1) in {'L':(345,395,480,505),'R':(575,385,715,495)}.items():
  sub=a[y0:y1,x0:x1]; R,G,B=sub[...,0],sub[...,1],sub[...,2]
  lu=luma[y0:y1,x0:x1]; sa=sat[y0:y1,x0:x1]
  sclera=(lu>170)&(sa<60)
  iris=(R<200)&(R-B>25)&(lu<150)&(lu>35) # brown
  pupil=(lu<35)
  black=(lu<70)&(sa<45)
  skin=(R>200)&(R-B>90)
  # opening = sclera|iris|pupil|catchlight bounded: fill holes
  op=(sclera|iris|pupil).astype(np.uint8)
  n,lab,st,cen=cv2.connectedComponentsWithStats(op)
  # biggest comp
  k=1+np.argmax(st[1:,4]); opm=(lab==k)
  # fill holes
  ff=opm.astype(np.uint8).copy(); h,w=ff.shape; m=np.zeros((h+2,w+2),np.uint8); inv=(1-ff).copy(); cv2.floodFill(inv,m,(0,0),2); opm=(inv!=2)|opm
  cols=np.where(opm.any(0))[0]
  up=[];lo=[]
  for c in cols:
    ys=np.where(opm[:,c])[0]; up.append((x0+c,y0+ys.min())); lo.append((x0+c,y0+ys.max()))
  # lash thickness above upper boundary: count black pixels above up
  lash=[]
  bl=black
  for (X,Y) in up:
    c=X-x0; yy=Y-y0-1; t=0
    while yy>=0 and bl[yy,c]: t+=1; yy-=1
    lash.append(t)
  # iris circle fit: iris|pupil pixels edge
  ir=((iris|pupil)&opm).astype(np.uint8)
  ys,xs=np.where(ir)
  # fit circle to iris region: use moments of its convex hull plus top/bottom extents? use minEnclosingCircle on contours
  cnts,_=cv2.findContours(ir,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
  c=max(cnts,key=cv2.contourArea)
  (cx,cy),rad=cv2.minEnclosingCircle(c)
  pys,pxs=np.where(pupil&opm)
  # catchlight: bright inside iris hull
  res[name]=dict(box=[x0,y0,x1,y1],up=up[::3],lo=lo[::3],lash=lash[::3],iris=[x0+cx,y0+cy,rad],pupil=[x0+pxs.mean(),y0+pys.mean(),np.sqrt(len(pxs)/np.pi)],xr=[int(x0+cols.min()),int(x0+cols.max())])
  # extended lash mask: black region connected to upper boundary
  blk=(bl).astype(np.uint8); n,lab,st,cen=cv2.connectedComponentsWithStats(blk)
  big=1+np.argmax(st[1:,4]); lm=(lab==big)
  ys,xs=np.where(lm); res[name]['lashbox']=[int(x0+xs.min()),int(y0+ys.min()),int(x0+xs.max()),int(y0+ys.max())]
  # lash outline: top boundary per col
  lt=[];lb=[]
  for cc in range(lm.shape[1]):
    yy=np.where(lm[:,cc])[0]
    if len(yy): lt.append((x0+cc,y0+int(yy.min()))); lb.append((x0+cc,y0+int(yy.max())))
  res[name]['lashtop']=lt[::3]; res[name]['lashbot']=lb[::3]
  Image.fromarray((np.dstack([opm,lm,iris])*255).astype(np.uint8)).resize((x1-x0)*4 and ((x1-x0)*4,(y1-y0)*4),Image.NEAREST).save(f'eye_{name}.png')
def cv(o):
  if isinstance(o,(np.integer,)):return int(o)
  if isinstance(o,(np.floating,)):return round(float(o),1)
  raise TypeError
json.dump(res,open('eyes.json','w'),default=cv)
for k,v in res.items(): print(k,v['iris'],v['pupil'],v['xr'],v['lashbox'])
