"""Our own part meshes (numpy, no assets): eyeball + cornea, lash rim with flick, brow pillows, teeth arches, tongue, ear,
earring stud, bindi disc. All quad-dominant, low-frequency, built to the style C refs (TECH-PLAN 3.1 / 6.2-6.3)."""
import numpy as np


def grid_faces(nu, nv, wrap_u=False, wrap_v=False, off=0):
    F = []
    for j in range(nv - (0 if wrap_v else 1)):
        for i in range(nu - (0 if wrap_u else 1)):
            a = off + j * nu + i
            b = off + j * nu + (i + 1) % nu
            c = off + ((j + 1) % nv) * nu + (i + 1) % nu
            d = off + ((j + 1) % nv) * nu + i
            F.append([a, d, c, b])
    return F


def eyeball(C, r, nseg=32, nring=24, fwd=np.array([0, -1.0, 0])):
    """UV sphere with its pole on the gaze axis (front = -Y); uv = planar front projection (iris texture)."""
    V, UV = [], []
    for j in range(nring + 1):
        th = np.pi * j / nring                     # 0 = front pole
        for i in range(nseg):
            ph = 2 * np.pi * i / nseg
            x = np.sin(th) * np.cos(ph); z = np.sin(th) * np.sin(ph); y = -np.cos(th)
            V.append([x, y, z]); UV.append([0.5 + x * 0.5, 0.5 + z * 0.5])
    V = np.array(V); UV = np.array(UV)
    # collapse the poles (ring 0 and nring are points): keep one vertex each
    F = []
    for j in range(nring):
        for i in range(nseg):
            a = j * nseg + i; b = j * nseg + (i + 1) % nseg
            c = (j + 1) * nseg + (i + 1) % nseg; d = (j + 1) * nseg + i
            if j == 0:
                F.append([a, d, c])
            elif j == nring - 1:
                F.append([a, d, b])
            else:
                F.append([a, d, c, b])
    UV[:nseg] = [0.5, 0.5]
    return C + V * r, F, UV


def cornea(C, r, limbus=0.56, bulge=0.045, nseg=32, nr=7):
    """dome cap over the iris: base on the ball at planar radius `limbus` r, apex `bulge` r proud of the ball."""
    V = []
    zb = np.sqrt(1 - limbus ** 2)
    for k in range(nr + 1):
        s = 1 - k / nr                             # 1 = base, 0 = apex
        rho = limbus * np.sin(s * np.pi / 2)
        depth = zb + (1 + bulge - zb) * (np.cos(s * np.pi / 2))
        depth = max(depth, np.sqrt(max(0, 1 - rho ** 2)) + 0.004)
        for i in range(nseg if k < nr else 1):
            ph = 2 * np.pi * i / nseg
            V.append([rho * np.cos(ph), -depth, rho * np.sin(ph)])
    V = np.array(V)
    F = []
    for k in range(nr - 1):
        for i in range(nseg):
            a = k * nseg + i; b = k * nseg + (i + 1) % nseg
            c = (k + 1) * nseg + (i + 1) % nseg; d = (k + 1) * nseg + i
            F.append([a, b, c, d])
    apex = nr * nseg
    for i in range(nseg):
        F.append([(nr - 1) * nseg + i, (nr - 1) * nseg + (i + 1) % nseg, apex])
    return C + V * r, F


def tube_strip(path, width, height, normal, up_dir, taper=None):
    """a soft ribbon along `path` (n,3): cross-section of 4 verts (base-in, top-in, top-out, base-out) -> closed sides."""
    n = len(path)
    taper = np.ones(n) if taper is None else taper
    V = []
    for k in range(n):
        o = normal[k] * height * taper[k]
        u = up_dir[k] * width * taper[k]
        V += [path[k], path[k] + u * 0.15 + o, path[k] + u + o * 0.6, path[k] + u * 1.05 - o * 0.2]
    V = np.array(V)
    F = []
    for k in range(n - 1):
        for s in range(4):
            a = 4 * k + s; b = 4 * k + (s + 1) % 4
            F.append([a, b, b + 4, a + 4])
    F.append([3, 2, 1, 0]); F.append([4 * (n - 1), 4 * (n - 1) + 1, 4 * (n - 1) + 2, 4 * (n - 1) + 3])
    return V, F


def teeth_arch(M, R, ax, y_top, y_edge, z_front, thick, half_w, curve, n=22):
    """a rounded slab arch in the mouth frame (local x out, y up, z fwd) -> world. Returns V, F, gum weight (0..1)."""
    xs = np.linspace(-half_w, half_w, n)
    zc = z_front - curve * (xs / half_w) ** 2
    prof = [(0.0, y_top), (0.0, y_edge + 0.25 * (y_top - y_edge)), (0.15, y_edge), (0.85, y_edge), (1.0, y_edge + 0.25 * (y_top - y_edge)), (1.0, y_top)]
    V, gum = [], []
    for k in range(n):
        tng = np.array([1.0, 0, -2 * curve * xs[k] / half_w ** 2])
        tng /= np.linalg.norm(tng)
        nrm = np.array([-tng[2], 0, tng[0]])          # horizontal normal pointing forward-ish
        if nrm[2] < 0:
            nrm = -nrm
        for (tb, y) in prof:
            p = np.array([xs[k], y, zc[k]]) - nrm * thick * tb
            V.append(p); gum.append(1.0 if abs(y - y_top) < 1e-9 else 0.0)
    V = np.array(V)
    m = len(prof)
    F = []
    for k in range(n - 1):
        for s in range(m - 1):
            a = k * m + s
            F.append([a, a + m, a + m + 1, a + 1])
    F.append(list(range(m - 1, -1, -1))[:4]); F.append(list(range(m - 1, -1, -1))[2:6])
    e = (n - 1) * m
    F.append([e, e + 1, e + 2, e + 3]); F.append([e + 2, e + 3, e + 4, e + 5])
    W = M + V @ R.T
    return W, F, np.array(gum)


def ellipsoid(C, a, b, c, nu=20, nv=12, R=np.eye(3)):
    V = [[0, 0, 1.0]]
    for j in range(1, nv):
        th = np.pi * j / nv
        for i in range(nu):
            ph = 2 * np.pi * i / nu
            V.append([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph), np.cos(th)])
    V.append([0, 0, -1.0])
    V = np.array(V) * np.array([a, b, c])
    F = []
    for i in range(nu):
        F.append([0, 1 + i, 1 + (i + 1) % nu])
    for j in range(nv - 2):
        for i in range(nu):
            p = 1 + j * nu + i; q = 1 + j * nu + (i + 1) % nu
            F.append([p, p + nu, q + nu, q])
    last = len(V) - 1
    base = 1 + (nv - 2) * nu
    for i in range(nu):
        F.append([base + i, last, base + (i + 1) % nu])
    return C + V @ R.T, F


def disc(C, n_axis, r, seg=16, lift=0.00015):
    n_axis = n_axis / np.linalg.norm(n_axis)
    t1 = np.cross(n_axis, [0, 0, 1.0]); t1 /= np.linalg.norm(t1); t2 = np.cross(n_axis, t1)
    V = [C + n_axis * (lift + r * 0.12)]
    for k in range(2):
        rr = r * (0.6 if k == 0 else 1.0)
        for i in range(seg):
            a = 2 * np.pi * i / seg
            V.append(C + n_axis * (lift + (0.08 if k == 0 else 0.0) * r) + rr * (np.cos(a) * t1 + np.sin(a) * t2))
    V.append(C - n_axis * r * 0.25)
    F = [[0, 1 + (i + 1) % seg, 1 + i] for i in range(seg)]
    for i in range(seg):
        F.append([1 + i, 1 + (i + 1) % seg, 1 + seg + (i + 1) % seg, 1 + seg + i])
    b = len(V) - 1
    F += [[1 + seg + i, 1 + seg + (i + 1) % seg, b] for i in range(seg)]
    return np.array(V), F
