"""r10 (judge r9 minor: 'the eyeliner wing tips show a faint double edge at 4x'). Cause (measured on layers/lid{L,R}.png): the
wing's LOWER contour is the cut mask's binary staircase, and its partial-alpha pixels carry c-front's SKIN colour, so under
4x the wing had a stepped dark edge plus a lighter brown second edge below it. Same rebuild as bunedge.py, limited to the
wing (columns outside the eye opening, rows below the lash's top edge): smooth contour (gaussian 1.2 on the mask,
re-threshold), x4 supersampled 2D coverage, 0.5 px feather; edge colour = the nearest SOLID INK pixel (the lash), so the
premultiplied edge is a clean dark ramp. Only pixels within 3 px of the contour change. Originals kept as lid?.r9.png.
    python3 scripts/character/puppet2d/polish-r10/wingedge.py"""
import os, shutil, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
L = "art/character/puppet2d/polish-r10/layers/"
g = json.load(open(L + "geom.json"))
for s in "LR":
    P = f"{L}lid{s}.png"; B = P.replace(".png", ".r9.png")
    if not os.path.exists(B): shutil.copy(P, B)
    a = np.asarray(Image.open(B).convert("RGBA")).astype(np.float32)
    A = a[..., 3] / 255
    x0, y0 = g["rects"]["lid" + s][:2]
    e = g["eyes"][s]
    H, W = A.shape
    X = np.arange(W)[None, :] + x0; Y = np.arange(H)[:, None] + y0
    # wing zone: outside the eye opening's outer end (+4 px of overlap), below the lash's top line there
    lt = np.interp(np.arange(W) + x0, np.arange(len(e["lashTop"])) + e["lashX"][0], e["lashTop"])[None, :]
    wing = ((X < e["x"][0] + 4) if s == "L" else (X > e["x"][1] - 4)) & (Y > lt + 2)
    m = ndi.gaussian_filter(A, 1.2)
    S = 4
    hi = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((W * S, H * S), Image.BICUBIC), np.float32) / 255
    cov = (hi > 0.5).astype(np.float32).reshape(H, S, W, S).mean((1, 3))
    cov = ndi.gaussian_filter(cov, 0.5)
    dist_in = ndi.distance_transform_edt(A > 0.5); dist_out = ndi.distance_transform_edt(A <= 0.5)
    band = ((np.minimum(dist_in, dist_out) <= 3) & wing).astype(np.float32)
    # feather the band's own border into the untouched texture (1.5 px) so the rebuilt patch has no seam
    band = np.minimum(band, ndi.gaussian_filter(band, 0.8) * 1.6).clip(0, 1) * wing
    newA = A * (1 - band) + cov * band
    lum = a[..., :3].mean(-1)
    ink = (A > 0.97) & (lum < 70)
    _, (iy, ix) = ndi.distance_transform_edt(~ink, return_indices=True)
    rgb = a[..., :3].copy()
    fill = rgb[iy, ix]
    w = (np.clip((0.97 - A) / 0.6, 0, 1) * band)[..., None]
    rgb = rgb * (1 - w) + fill * w
    out = np.dstack([rgb, newA * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(P)
    ch = np.abs(newA - A)
    print(f"lid{s}: wing px changed > 0.05: {int((ch > 0.05).sum())}, max {ch.max():.3f}, coverage delta {float((newA - A).sum()):.1f} px")
