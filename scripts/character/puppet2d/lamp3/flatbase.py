"""lamp3 arm D probe: the approved front (graded, native) as FLAT colour fields: mean-shift smoothing (edge-preserving),
k-means in CIE Lab to K colours, small islands merged, region edges anti-aliased by supersampled median smoothing.
    python3 -I flatbase.py <K> <out.png>"""
import sys, os
sys.path.insert(0, "/home/user/Taxila/scripts/character/puppet2d/lamp2")
from common import *
import numpy as np, cv2
from PIL import Image
K_, out = int(sys.argv[1]), sys.argv[2]
a = np.asarray(Image.open(f"{S}/front-graded-native.png").convert("RGB"))
sm = cv2.pyrMeanShiftFiltering(a, 6, 14)
lab = cv2.cvtColor(sm, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
_, lbl, cen = cv2.kmeans(lab, K_, None, crit, 3, cv2.KMEANS_PP_CENTERS)
lbl = lbl.reshape(a.shape[:2])
lbl = cv2.medianBlur(lbl.astype(np.uint8), 5)
q = cv2.cvtColor(cen[lbl].astype(np.uint8).reshape(a.shape[0], a.shape[1], 3), cv2.COLOR_LAB2RGB)
# anti-aliased edges: 4x up (nearest), median, then area down
big = cv2.resize(q, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)
big = cv2.medianBlur(big, 9)
q2 = cv2.resize(big, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_AREA)
Image.fromarray(q2).save(out)
