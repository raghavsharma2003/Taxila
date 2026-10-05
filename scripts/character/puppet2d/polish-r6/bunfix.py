"""r4: composite ONLY the masked bun region of the edit (keys/yawRbun-0.png) onto yawR-0 -> keys/yawR-1.png, feathered
and colour-matched on a ring, so the rest of the plate (and every hand-read landmark in keyfield.py) is unchanged.
    python3 scripts/character/puppet2d/polish-r6/bunfix.py"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
K = "art/character/puppet2d/polish-r6/keys"
base = np.asarray(Image.open(f"{K}/yawR-0.png").convert("RGB")).astype(np.float32)
ed = np.asarray(Image.open(f"{K}/yawRbun-0.png").convert("RGB")).astype(np.float32)
m = np.asarray(Image.open(f"{K}/bunmask-R.png"))[..., 3] < 128          # editable area
inner = ndi.binary_erosion(m, iterations=10)
ring = ndi.binary_dilation(m, iterations=8) & ~m
gain = (base[ring].mean(0) + 1) / (ed[ring].mean(0) + 1)
ed = ed * gain
w = np.clip(ndi.distance_transform_edt(m) / 12.0, 0, 1)
w = (w * w * (3 - 2 * w))[..., None]
out = base * (1 - w) + ed * w
Image.fromarray(out.clip(0, 255).round().astype(np.uint8)).save(f"{K}/yawR-1.png")
print("gain", gain.round(3), "->", f"{K}/yawR-1.png")
