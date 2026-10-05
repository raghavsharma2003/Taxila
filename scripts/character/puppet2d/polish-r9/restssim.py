"""r4: rendered rest (view 0,0,1024 at 720 px) vs c-front (resized), SSIM on the full frame and the head crop."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
a = np.asarray(Image.open(sys.argv[1]).convert("L")).astype(np.float64) / 255
b = np.asarray(Image.open("art/character/puppet2d/polish-r9/c-front.png").convert("L").resize(a.shape[::-1], Image.LANCZOS)).astype(np.float64) / 255
def ssim(x, y):
    g = lambda z: ndi.gaussian_filter(z, 1.5)
    mx, my = g(x), g(y); vx, vy, cxy = g(x * x) - mx * mx, g(y * y) - my * my, g(x * y) - mx * my
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return float((((2 * mx * my + c1) * (2 * cxy + c2)) / ((mx * mx + my * my + c1) * (vx + vy + c2))).mean())
s = a.shape[0] / 1024
hc = (slice(int(180 * s), int(720 * s)), slice(int(280 * s), int(780 * s)))
print("rest SSIM full", round(ssim(a, b), 4), "head", round(ssim(a[hc], b[hc]), 4))
