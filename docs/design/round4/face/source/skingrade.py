"""What MST 6 would look like on a painted front: a skin-only grade in L*a*b* (the rig would bake this into the skin
layer). Skin mask = pixels whose a*/b* hue sits in the skin wedge and whose L* is in the face's range, feathered;
then chroma and lightness are pulled toward MST 6 by fixed factors that bring the measured patch mean onto the bar.
  python3 -I skingrade.py <id> <out.png> <kC> <dL>
"""
import sys, numpy as np, cv2
from PIL import Image
i, out, kC, dL = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
a = np.asarray(Image.open(f"raw/{i}.png").convert("RGB"))
lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB).astype(np.float32)  # L 0..255, a,b offset 128
L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
hue = np.degrees(np.arctan2(B, A)); C = np.hypot(A, B)
m = ((hue > 35) & (hue < 80) & (C > 18) & (L > 30) & (L < 85)).astype(np.float32)
# keep the background out: background is very light and low-chroma-ish; skin region = the central figure
yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
m *= ((np.abs(xx - 512) < 260) & (yy < 900)).astype(np.float32)
m = cv2.GaussianBlur(m, (0, 0), 3)
A2 = A * (1 - m * (1 - kC)); B2 = B * (1 - m * (1 - kC)); L2 = L + m * dL
o = np.stack([L2 * 255 / 100, A2 + 128, B2 + 128], -1).clip(0, 255).astype(np.uint8)
Image.fromarray(cv2.cvtColor(o, cv2.COLOR_LAB2RGB)).save(out)
