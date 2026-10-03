"""Small vectorised geometry helpers (numpy): closest point on triangles, ray/segment-triangle tests."""
import numpy as np
from scipy.spatial import cKDTree


def closest_on_tri(P, A, B, C):
    """Closest points on triangles (A,B,C) to P, all (n,3): returns (Q, bary (n,3)). Ericson, RTCD 5.1.5."""
    ab, ac, ap = B - A, C - A, P - A
    d1, d2 = (ab * ap).sum(1), (ac * ap).sum(1)
    bp = P - B; d3, d4 = (ab * bp).sum(1), (ac * bp).sum(1)
    cp = P - C; d5, d6 = (ab * cp).sum(1), (ac * cp).sum(1)
    va = d3 * d6 - d5 * d4; vb = d5 * d2 - d1 * d6; vc = d1 * d4 - d3 * d2
    n = len(P)
    bary = np.zeros((n, 3))
    done = np.zeros(n, bool)

    def put(mask, w):
        m = mask & ~done
        bary[m] = w[m] if w.ndim == 2 else w
        done[m] = True
    one = lambda i: np.tile(np.eye(3)[i], (n, 1))
    put((d1 <= 0) & (d2 <= 0), one(0))
    put((d3 >= 0) & (d4 <= d3), one(1))
    v = d1 / np.where(d1 - d3 == 0, 1, d1 - d3)
    put((vc <= 0) & (d1 >= 0) & (d3 <= 0), np.stack([1 - v, v, 0 * v], 1))
    put((d6 >= 0) & (d5 <= d6), one(2))
    w = d2 / np.where(d2 - d6 == 0, 1, d2 - d6)
    put((vb <= 0) & (d2 >= 0) & (d6 <= 0), np.stack([1 - w, 0 * w, w], 1))
    w2 = (d4 - d3) / np.where((d4 - d3) + (d5 - d6) == 0, 1, (d4 - d3) + (d5 - d6))
    put((va <= 0) & ((d4 - d3) >= 0) & ((d5 - d6) >= 0), np.stack([0 * w2, 1 - w2, w2], 1))
    den = 1 / np.where(va + vb + vc == 0, 1, va + vb + vc)
    vv, ww = vb * den, vc * den
    put(np.ones(n, bool), np.stack([1 - vv - ww, vv, ww], 1))
    Q = bary[:, :1] * A + bary[:, 1:2] * B + bary[:, 2:] * C
    return Q, bary


def surf_closest(P, V, F, k=10):
    """Closest point on mesh (V, F) to each P: (dist, tri index, bary). Candidate triangles by centroid k-NN."""
    cen = V[F].mean(1)
    _, cand = cKDTree(cen).query(P, k=min(k, len(F)))
    best_d = np.full(len(P), np.inf); best_t = np.zeros(len(P), int); best_b = np.zeros((len(P), 3))
    for j in range(cand.shape[1]):
        t = cand[:, j]
        Q, b = closest_on_tri(P, V[F[t, 0]], V[F[t, 1]], V[F[t, 2]])
        d = np.linalg.norm(P - Q, axis=1)
        better = d < best_d
        best_d[better], best_t[better], best_b[better] = d[better], t[better], b[better]
    return best_d, best_t, best_b


def seg_hits(O, Pt, V, F, chunk=256, eps=1e-9):
    """For each segment O[i] -> Pt[i]: does it cross any triangle of (V, F) strictly between the ends? (bool array)"""
    A, B, C = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    e1, e2 = B - A, C - A
    hit = np.zeros(len(O), bool)
    for i in range(0, len(O), chunk):
        o, p = O[i:i + chunk], Pt[i:i + chunk]
        d = p - o                                              # (n, 3)
        h = np.cross(d[:, None, :], e2[None])                  # (n, T, 3)
        a = (e1[None] * h).sum(-1)
        ok = np.abs(a) > eps
        f = 1 / np.where(ok, a, 1)
        s = o[:, None, :] - A[None]
        u = f * (s * h).sum(-1)
        q = np.cross(s, e1[None])
        v = f * (d[:, None, :] * q).sum(-1)
        t = f * (e2[None] * q).sum(-1)
        hh = ok & (u >= 0) & (v >= 0) & (u + v <= 1) & (t > 1e-4) & (t < 1 - 1e-4)
        hit[i:i + chunk] = hh.any(1)
    return hit


def ray_hits(O, D, V, F, tmax=1.0, chunk=256):
    """Ray O + t D (t in (0, tmax]) hits any triangle?"""
    return seg_hits(O, O + D * tmax, V, F, chunk)
