import numpy as np, cv2
from PIL import Image
a=np.asarray(Image.open('cfront.png')).astype(np.float32)
r,g,b=a[...,0],a[...,1],a[...,2]
H,W=r.shape
bgc=np.array([252,230,188.])
d=np.sqrt(((a-bgc)**2).sum(-1))
bgcand=(d<28).astype(np.uint8)
n,lab=cv2.connectedComponents(bgcand)
border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
bg=np.isin(lab,list(border))
luma=0.299*r+0.587*g+0.114*b
sat=a.max(-1)-a.min(-1)
dark=(luma<105)&(sat<60)
teal=(b>r+30)
L=np.zeros((H,W),np.uint8) # 0 skin/other
L[bg]=1; L[dark]=2; L[teal]=3
cols=np.array([[230,150,90],[255,255,255],[30,30,30],[0,120,130]],np.uint8)
Image.fromarray(cols[L]).save('seg0.png')
np.save('L0.npy',L)
