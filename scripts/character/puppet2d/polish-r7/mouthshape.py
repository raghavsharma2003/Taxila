"""The mouth patch region (rev 2): an ellipse round the lips plus the two smile-corner creases, so a non-smiling
mouth never carries c-front's corner creases as fixed 'dimples'. One definition for the face hole, the edit mask
and the patch cut. Coordinates: c-front pixels."""
import numpy as np
from scipy import ndimage as ndi
ELL = (530, 627, 104, 60)
CORNERS = [(452, 582, 21), (608, 578, 21)]
FEATHER = 12.0


def region(H=1024, W=1024):
    yy, xx = np.mgrid[0:H, 0:W]
    cx, cy, rx, ry = ELL
    m = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
    for x, y, r in CORNERS:
        m |= (xx - x) ** 2 + (yy - y) ** 2 <= r * r
    return m


def alpha(H=1024, W=1024):
    m = region(H, W)
    d = ndi.distance_transform_edt(m)
    a = np.clip(d / FEATHER, 0, 1)
    a = a * a * (3 - 2 * a)
    return ndi.gaussian_filter(a.astype(np.float32), 1.0)


def edit_mask(H=1024, W=1024):
    return ndi.binary_dilation(region(H, W), iterations=7)
