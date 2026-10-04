"""Our own skin topology for the style C head (TECH-PLAN 3.1 / 4.3): a generalized-cylinder quad grid around the head
axis with the eye and mouth blocks replaced by concentric ring structures (inset by construction), so every loop the
shape rig needs is a NAMED index list, never a nearest-vertex search.

Domain: (u, s). u = yaw angle about the head axis (0 = front, + = her left = +X); s = continuous row index. A row maps to
a ray origin on the axis (oz) and an elevation (e). The grid is exactly mirror-symmetric in u, so every vertex has a
topological twin (G3).

Pure numpy; the 3D placement (raycast onto the sculpt target) lives in build.py.
"""
import numpy as np


def column_angles(nu, a=0.5):
    """Mirror-symmetric yaw angles, dense at the front: u = pi (a t + (1 - a) t^3), t uniform in [-1, 1)."""
    t = np.arange(nu) / nu * 2 - 1
    t = np.roll(t, -nu // 2)                      # index 0 = front (t = 0)
    return np.pi * (a * t + (1 - a) * t ** 3)


class Skin:
    def __init__(self, rows, nu=72, eye_block=(8, 4), mouth_block=(10, 4)):
        """rows: list of (elevation_deg, origin_z) per grid row, top to bottom."""
        self.rows = np.asarray(rows, float)
        self.nu = nu
        self.nr = len(rows)
        self.u = column_angles(nu)
        self.eyeW, self.eyeH = eye_block
        self.mW, self.mH = mouth_block
        self.verts = []        # domain coords (u, s) or None for 3D-placed verts
        self.kind = []         # 'grid' | 'ring' | 'pole' | 'lining' | 'bag'
        self.faces = []
        self.groups = {}
        gid = np.zeros((nu, self.nr), int)
        for j in range(self.nr):
            for i in range(nu):
                gid[i, j] = self._add((self.u[i], float(j)), "grid")
        self.gid = gid
        self.pole = self._add((0.0, -1.0), "pole")

    def _add(self, d, kind):
        self.verts.append(d)
        self.kind.append(kind)
        return len(self.verts) - 1

    def col(self, k):
        """column index for a signed column offset from the front (k = 0 front, + her left)."""
        return k % self.nu

    # --------------------------------------------------------------------------------------------- blocks
    def block_boundary(self, k0, j0, W, H):
        """grid vertex ids of a block's boundary loop, in order: top edge (left->right in +u), right edge (down),
        bottom edge (right->left), left edge (up). k0 = signed column offset of the block's left (lowest-u) edge."""
        g = self.gid
        top = [g[self.col(k0 + a), j0] for a in range(W)]
        right = [g[self.col(k0 + W), j0 + b] for b in range(H)]
        bot = [g[self.col(k0 + W - a), j0 + H] for a in range(W)]
        left = [g[self.col(k0), j0 + H - b] for b in range(H)]
        return top + right + bot + left

    def block_cells(self, k0, j0, W, H):
        return {(self.col(k0 + a), j0 + b) for a in range(W) for b in range(H)}

    def make_rings(self, boundary, n_rings, kind="ring"):
        """concentric rings inside a boundary loop: ring 0 = the boundary; returns [ring0, ring1, ..] id lists.
        Quads connect ring m-1 to ring m; positions are filled in later (domain coords set by the caller)."""
        rings = [list(boundary)]
        n = len(boundary)
        for m in range(1, n_rings + 1):
            ring = [self._add(None, kind) for _ in range(n)]
            prev = rings[-1]
            for p in range(n):
                q = (p + 1) % n
                self.faces.append([prev[p], ring[p], ring[q], prev[q]])
            rings.append(ring)
        return rings

    def extrude_ring(self, ring, kind):
        """a new ring connected to `ring` by quads, positions set later (3D-placed lining / bag)."""
        n = len(ring)
        new = [self._add(None, kind) for _ in range(n)]
        for p in range(n):
            q = (p + 1) % n
            self.faces.append([ring[p], new[p], new[q], ring[q]])
        return new

    def cap_ring(self, ring, kind):
        c = self._add(None, kind)
        n = len(ring)
        for p in range(n):
            self.faces.append([ring[p], c, ring[(p + 1) % n]])
        return c

    def finalize_grid(self, removed_cells):
        """grid quads (minus the block cells) + the top pole fan. Faces wind so normals point outward."""
        F = []
        for j in range(self.nr - 1):
            for i in range(self.nu):
                if (i, j) in removed_cells:
                    continue
                i2 = (i + 1) % self.nu
                F.append([self.gid[i, j], self.gid[i, j + 1], self.gid[i2, j + 1], self.gid[i2, j]])
        for i in range(self.nu):
            F.append([self.pole, self.gid[i, 0], self.gid[(i + 1) % self.nu, 0]])
        self.faces = F + self.faces

    def corner_split(self, n_ring, W, H):
        """indices (within a ring of 2W + 2H) of the two corners (left-mid, right-mid of the block) and the upper /
        lower halves, both ordered from the low-u corner to the high-u corner."""
        n = 2 * W + 2 * H
        left_mid = 2 * W + H + H // 2          # on the left edge going up: index of the middle vertex
        right_mid = W + H // 2
        lm, rm = left_mid % n, right_mid
        upper = [(lm + k) % n for k in range(1, (rm - lm) % n)]           # left-mid -> top -> right-mid
        lower = [(lm - k) % n for k in range(1, (lm - rm) % n)]            # left-mid -> bottom -> right-mid
        return lm, rm, upper, lower
