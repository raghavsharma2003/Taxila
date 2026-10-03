"""Debug views of a mesh without the browser: painter's-algorithm polygons with Lambert shading (PIL only).
    from quickview import view; view(V, F, "out.png", yaw=0, crop=(cx, cy, half))"""
import numpy as np
from PIL import Image, ImageDraw


def view(V, F, path=None, yaw=0.0, pitch=0.0, size=600, center=None, half=0.13, colors=None, img=None):
    th, ph = np.radians(yaw), np.radians(pitch)
    Ry = np.array([[np.cos(th), 0, np.sin(th)], [0, 1, 0], [-np.sin(th), 0, np.cos(th)]])
    Rx = np.array([[1, 0, 0], [0, np.cos(ph), -np.sin(ph)], [0, np.sin(ph), np.cos(ph)]])
    c = V.mean(0) if center is None else np.asarray(center)
    X = (V - c) @ (Rx @ Ry).T
    tri = X[F]
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
    vis = n[:, 2] > 0
    L = np.array([0.3, 0.4, 0.86]); L /= np.linalg.norm(L)
    sh = np.clip(n @ L, 0, 1) * 0.8 + 0.2
    order = np.argsort(tri[:, :, 2].mean(1))
    im = img if img is not None else Image.new("RGB", (size, size), (40, 40, 46))
    d = ImageDraw.Draw(im)
    k = size / (2 * half)
    for i in order:
        if not vis[i]:
            continue
        p = [(size / 2 + k * x, size / 2 - k * y) for x, y, _ in tri[i]]
        col = np.array(colors[i] if colors is not None else (200, 180, 160)) * sh[i]
        d.polygon(p, fill=tuple(int(v) for v in col))
    if path:
        im.save(path)
    return im


def strip(ims, path):
    W = Image.new("RGB", (sum(i.width for i in ims), max(i.height for i in ims)))
    x = 0
    for i in ims:
        W.paste(i, (x, 0)); x += i.width
    W.save(path)
