# Arm A shapes: rig-then-bake (TECH-PLAN §5.1) without a Blender armature. A pose is a dict of channel weights; F(pose)
# deforms each mesh's rest positions with:
#   - spherical lids: lid vertices slide along meridians of the eyeball sphere (elevation change about the eye
#     centre), so a blink always wraps the ball; the upper margin is clamped at the closing line (the clamp is what
#     the eyeBlink_* correctives capture);
#   - jaw: rotation about a pivot, weights from the named mouth rings + a geometric falloff;
#   - mouth / brow / cheek channels: smooth falloff fields;
#   - tongue / teeth: rigid with the jaw plus tongue channels.
# Key k = F({k: 1}) - rest. Visemes = F(recipe) - rest (a nonlinear mix, the plan's recipes). Correctives are
# F(a + b) - F(a) - F(b) + rest, exact by construction (CHARACTER-PIPELINE §4.2 rule 4).
import math
import numpy as np

import head as HD

ARKIT = ["eyeBlinkLeft", "eyeLookDownLeft", "eyeLookInLeft", "eyeLookOutLeft", "eyeLookUpLeft", "eyeSquintLeft", "eyeWideLeft",
         "eyeBlinkRight", "eyeLookDownRight", "eyeLookInRight", "eyeLookOutRight", "eyeLookUpRight", "eyeSquintRight", "eyeWideRight",
         "jawForward", "jawLeft", "jawRight", "jawOpen", "mouthClose", "mouthFunnel", "mouthPucker", "mouthLeft", "mouthRight",
         "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight", "mouthDimpleLeft", "mouthDimpleRight",
         "mouthStretchLeft", "mouthStretchRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper",
         "mouthPressLeft", "mouthPressRight", "mouthLowerDownLeft", "mouthLowerDownRight", "mouthUpperUpLeft", "mouthUpperUpRight",
         "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight", "cheekPuff", "cheekSquintLeft",
         "cheekSquintRight", "noseSneerLeft", "noseSneerRight", "tongueOut"]
VISEMES = {  # TECH-PLAN §5.3 recipes, in ARKit + tongue channels
    "viseme_sil": {},
    "viseme_PP": {"jawOpen": 0.06, "mouthClose": 0.06, "mouthPressLeft": 0.5, "mouthPressRight": 0.5, "mouthRollLower": 0.15, "mouthRollUpper": 0.1},
    "viseme_FF": {"mouthRollLower": 0.6, "jawOpen": 0.08, "mouthUpperUpLeft": 0.2, "mouthUpperUpRight": 0.2},
    "viseme_TH": {"jawOpen": 0.15, "tongueOut": 0.3, "tongueTipUp": 0.2},
    "viseme_DD": {"jawOpen": 0.15, "tongueTipUp": 1.0, "mouthStretchLeft": 0.1, "mouthStretchRight": 0.1},
    "viseme_kk": {"jawOpen": 0.2, "mouthStretchLeft": 0.15, "mouthStretchRight": 0.15, "tongueBack": 1.0},
    "viseme_CH": {"mouthFunnel": 0.5, "jawOpen": 0.12, "mouthUpperUpLeft": 0.15, "mouthUpperUpRight": 0.15},
    "viseme_SS": {"mouthStretchLeft": 0.4, "mouthStretchRight": 0.4, "jawOpen": 0.05, "mouthLowerDownLeft": 0.2, "mouthLowerDownRight": 0.2,
                  "mouthUpperUpLeft": 0.15, "mouthUpperUpRight": 0.15},
    "viseme_nn": {"jawOpen": 0.1, "tongueTipUp": 0.8},
    "viseme_RR": {"mouthFunnel": 0.3, "tongueCurl": 0.6, "jawOpen": 0.12},
    "viseme_aa": {"jawOpen": 0.45, "mouthLowerDownLeft": 0.3, "mouthLowerDownRight": 0.3, "mouthUpperUpLeft": 0.15, "mouthUpperUpRight": 0.15},
    "viseme_E": {"mouthStretchLeft": 0.5, "mouthStretchRight": 0.5, "mouthSmileLeft": 0.2, "mouthSmileRight": 0.2, "jawOpen": 0.15},
    "viseme_I": {"mouthStretchLeft": 0.35, "mouthStretchRight": 0.35, "jawOpen": 0.1, "mouthSmileLeft": 0.1, "mouthSmileRight": 0.1},
    "viseme_O": {"mouthFunnel": 0.6, "mouthPucker": 0.3, "jawOpen": 0.25},
    "viseme_U": {"mouthPucker": 0.9, "jawOpen": 0.08, "mouthFunnel": 0.2},
}
TONGUE = ["tongueTipUp", "tongueCurl", "tongueWide"]
CORRECTIVES = {
    "jawOpen_mouthClose": ("jawOpen", "mouthClose"), "mouthFunnel_jawOpen": ("mouthFunnel", "jawOpen"),
    "jawOpen_mouthSmileLeft": ("jawOpen", "mouthSmileLeft"), "jawOpen_mouthSmileRight": ("jawOpen", "mouthSmileRight"),
    "eyeBlink_eyeLookDownLeft": ("eyeBlinkLeft", "eyeLookDownLeft"), "eyeBlink_eyeLookDownRight": ("eyeBlinkRight", "eyeLookDownRight"),
    "eyeBlink_eyeSquintLeft": ("eyeBlinkLeft", "eyeSquintLeft"), "eyeBlink_eyeSquintRight": ("eyeBlinkRight", "eyeSquintRight"),
    "browInnerUp_browDownLeft": ("browInnerUp", "browDownLeft"), "browInnerUp_browDownRight": ("browInnerUp", "browDownRight"),
    "cheekSquint_eyeBlinkLeft": ("cheekSquintLeft", "eyeBlinkLeft"), "cheekSquint_eyeBlinkRight": ("cheekSquintRight", "eyeBlinkRight"),
}
ALL_KEYS = ARKIT + list(VISEMES) + TONGUE + list(CORRECTIVES)  # 52 + 15 + 3 + 12 = 82


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def gauss(X, c, s):
    d = (X - np.asarray(c)) / np.asarray(s)
    return np.exp(-(d * d).sum(1))


class Rig:
    def __init__(self, P, L, M, head_rest, edges=None):
        self.edges = edges
        self.P = P; self.PH = P['head']; self.PP = P['parts']; self.R = P.get('rig', {})
        self.L = L; self.M = M
        self.frames = {1: HD.eye_frame(self.PH, 1), -1: HD.eye_frame(self.PH, -1)}
        self.head_attrs = self._head_attrs(head_rest)
        nt = np.ones(len(head_rest), bool)
        for key in ('eye_L_tuck', 'eye_R_tuck'):
            nt[self.L[key][0]] = False
        self.not_tuck = nt

    # ---------------------------------------------------------------- lid curves
    def lid_curves(self, t):
        PH = self.PH
        au, eu = HD.lid_margin(PH, t, True)
        al, el = HD.lid_margin(PH, t, False)
        ec = el + self.R.get('close_frac', 0.35) * (eu - el)
        return eu, el, ec

    def t_from_a(self, a):
        A_in = math.radians(self.PH['eye_A_in']); A_out = math.radians(self.PH['eye_A_out'])
        return np.clip((a + A_in) / (A_in + A_out), 0, 1)

    # ---------------------------------------------------------------- per-vertex fields on the head
    def _head_attrs(self, X):
        n = len(X); PH = self.PH
        A = {}
        for s, key in ((1, 'eye_L'), (-1, 'eye_R')):
            wu = np.zeros(n); wl = np.zeros(n); tt = np.zeros(n)
            rings = self.L[key]
            t = np.array(self.M[key]['t']); up = np.array(self.M[key]['upper'])
            K = len(rings) - 1
            wk = self.R.get('lid_ring_w', [1.0, 0.85, 0.5, 0.2, 0.0])
            corner = (t <= 1e-6) | (t >= 1 - 1e-6)
            for k, ring in enumerate(rings):
                w = wk[k] if k < len(wk) else 0.0
                for j, vi in enumerate(ring):
                    tt[vi] = t[j]
                    cw = 0.25 if corner[j] else 1.0
                    if up[j]:
                        wu[vi] = max(wu[vi], w * cw)
                    elif not corner[j]:
                        wl[vi] = max(wl[vi], w * cw)
                    else:
                        wu[vi] = max(wu[vi], w * 0.15); wl[vi] = max(wl[vi], w * 0.15)
            for j, vi in enumerate(self.L[key + '_tuck'][0]):
                tt[vi] = t[j]
                if up[j]:
                    wu[vi] = 1.0
                elif not corner[j]:
                    wl[vi] = 1.0
            A[('lidU', s)] = wu; A[('lidL', s)] = wl; A[('lidT', s)] = tt
        # mouth: upper / lower lip weights by ring
        lu = np.zeros(n); ll = np.zeros(n); seam = np.zeros(n)
        t = np.array(self.M['mouth']['t']); up = np.array(self.M['mouth']['upper'])
        corner = (t <= 1e-6) | (t >= 1 - 1e-6)
        rk = self.R.get('lip_ring_w', [1.0, 1.0, 0.9, 0.55, 0.25, 0.0])
        for k, ring in enumerate(self.L['mouth']):
            for j, vi in enumerate(ring):
                w = rk[k] if k < len(rk) else 0
                if corner[j]:
                    lu[vi] = max(lu[vi], 0.5 * w); ll[vi] = max(ll[vi], 0.5 * w)
                elif up[j]:
                    lu[vi] = max(lu[vi], w)
                else:
                    ll[vi] = max(ll[vi], w)
                if k == 0:
                    seam[vi] = 1.0
        for k, ring in enumerate(self.L['mouth_in']):
            for j, vi in enumerate(ring):
                if corner[j]:
                    lu[vi] = 0.5; ll[vi] = 0.5
                elif up[j]:
                    lu[vi] = 1.0
                else:
                    ll[vi] = 1.0
        bc = self.L['mouth_bag_c'][0][0]
        lu[bc] = 0.3; ll[bc] = 0.7
        A['lipU'] = lu; A['lipL'] = ll; A['seam'] = seam
        A['inner'] = np.zeros(n)
        for ring in self.L['mouth_in']:
            A['inner'][ring] = 1.0
        A['inner'][bc] = 1.0
        # jaw weight: lower lip rings 1, upper 0, else geometric
        mz = PH['mouth_z']
        below = mz - X[:, 2]
        wj = smooth(-0.0015, 0.007, below) * (1 - smooth(0.03, 0.065, X[:, 1])) * (1 - 0.75 * smooth(-0.075, -0.11, X[:, 2]))
        # lateral: full under the mouth, fading toward the cheeks (wider lower down, along the jaw line)
        wj *= (1 - smooth(0.022 + 0.6 * np.clip(below, 0, 0.05), 0.058 + 0.3 * np.clip(below, 0, 0.05), np.abs(X[:, 0])))
        ringset = np.zeros(n, bool)
        K = len(self.L['mouth']) - 1
        for k, ring in enumerate(self.L['mouth']):
            if k < K - 1:
                ringset[ring] = True
        for ring in self.L['mouth_in']:
            ringset[ring] = True
        ringset[bc] = True
        lower = (ll > 0) & (lu == 0); upper_ = (lu > 0) & (ll == 0); both = (lu > 0) & (ll > 0)
        wj = np.where(ringset & lower, np.maximum(ll, wj), wj)
        wj = np.where(ringset & upper_, wj * (1 - lu), wj)
        wj = np.where(ringset & both, 0.5, wj)
        # smooth the jaw field over the mesh (pinned: seam + interior rings), so no ring steps fold the skin
        if getattr(self, 'edges', None) is not None:
            E = self.edges
            pin = np.zeros(n, bool)
            pin[self.L['mouth'][0]] = True
            for ring in self.L['mouth_in']:
                pin[ring] = True
            pin[bc] = True
            deg = np.bincount(E.ravel(), minlength=n).astype(float)
            for _ in range(self.R.get('jaw_smooth', 12)):
                acc = np.zeros(n)
                np.add.at(acc, E[:, 0], wj[E[:, 1]]); np.add.at(acc, E[:, 1], wj[E[:, 0]])
                avg = np.where(deg > 0, acc / np.maximum(deg, 1), wj)
                wj = np.where(pin, wj, 0.5 * wj + 0.5 * avg)
        A['jaw'] = wj
        a0 = PH['mouth_a'][0]
        front = (X[:, 1] < 0.02).astype(float)
        A['mouth'] = gauss(X[:, [0, 2]], [0, mz], [0.026, 0.017]) * front
        A['cornerL'] = gauss(X[:, [0, 2]], [a0, mz + PH['mouth_rest_smile']], [0.011, 0.0095]) * front
        A['cornerR'] = gauss(X[:, [0, 2]], [-a0, mz + PH['mouth_rest_smile']], [0.011, 0.0095]) * front
        A['sideL'] = smooth(-0.004, 0.004, X[:, 0]); A['sideR'] = 1 - A['sideL']
        A['cheekL'] = gauss(X[:, [0, 2]], [0.036, -0.024], [0.014, 0.012]) * front
        A['cheekR'] = gauss(X[:, [0, 2]], [-0.036, -0.024], [0.014, 0.012]) * front
        A['chin'] = gauss(X[:, [0, 2]], [0, mz - 0.02], [0.016, 0.012]) * front
        A['wingL'] = gauss(X, PH['wing_c'], [0.007, 0.008, 0.006]); A['wingR'] = gauss(X, np.array(PH['wing_c']) * [-1, 1, 1], [0.007, 0.008, 0.006])
        # forehead skin under the brows (follows 30%)
        A['fore'] = gauss(X[:, [2]], [0.029], [0.012]) * (1 - smooth(0.05, 0.068, np.abs(X[:, 0]))) * (X[:, 1] < 0.0)
        A['xs'] = X[:, 0]
        return A

    # ---------------------------------------------------------------- deformers
    def lids(self, X, w, s, wu, wl, tt, clamp=True):
        """Spherical lid rotation for eye side s. Returns new X."""
        Fr = self.frames[s]
        tag = 'Left' if s > 0 else 'Right'
        g = lambda k: w.get(k + tag, 0.0)
        mask = (wu > 0) | (wl > 0)
        if not mask.any():
            return X
        Xm = X[mask]
        a, e, r = HD.eye_ae(Fr, Xm)
        t = tt[mask]
        eu, el, ec = self.lid_curves(t)
        R = self.R
        ov = math.radians(R.get('blink_overlap_deg', 1.5))
        du = (g('eyeBlink') * (ec - ov - eu) + g('eyeWide') * math.radians(R.get('wide_deg', 9))
              + g('eyeLookUp') * math.radians(R.get('lookup_up_deg', 7)) - g('eyeLookDown') * math.radians(R.get('lookdown_up_deg', 11))
              + g('eyeSquint') * 0.12 * (ec - eu))
        dl = (g('eyeBlink') * (ec - el) + g('eyeSquint') * R.get('squint_lo', 0.5) * (ec - el) + g('cheekSquint') * 0.25 * (ec - el)
              + g('eyeLookUp') * math.radians(R.get('lookup_lo_deg', 3.5)) - g('eyeLookDown') * math.radians(R.get('lookdown_lo_deg', 4.5))
              - g('eyeWide') * math.radians(R.get('wide_lo_deg', 2)) + w.get('mouthSmile' + tag, 0.0) * 0.12 * (ec - el))
        if clamp:
            # the margins never cross the closing line (upper stays above, lower stays below)
            du = np.maximum(du, (ec - ov - eu))
            dl = np.minimum(dl, (ec - el) + 0.0)
        da = (g('eyeLookIn') * -1 + g('eyeLookOut')) * math.radians(R.get('lookside_deg', 3))
        wuM = wu[mask]; wlM = wl[mask]
        e2 = e + du * wuM + dl * wlM
        a2 = a + da * np.maximum(wuM, wlM)
        d = HD.eye_dir(Fr, a2, e2)
        Xn = X.copy()
        Xn[mask] = Fr[0] + d * r[:, None]
        return Xn

    def head(self, X0, w):
        A = self.head_attrs; R = self.R; PH = self.PH
        X = X0.copy()
        D = np.zeros_like(X)
        g = lambda k: w.get(k, 0.0)
        # ---- mouth & cheeks (translations)
        for s, tag in ((1, 'Left'), (-1, 'Right')):
            cw = A['corner' + ('L' if s > 0 else 'R')]; ch = A['cheek' + ('L' if s > 0 else 'R')]
            side = A['side' + ('L' if s > 0 else 'R')]
            sm = g('mouthSmile' + tag)
            D += sm * (cw[:, None] * np.array([s * 0.0040, 0.0026, 0.0062]) + ch[:, None] * np.array([s * 0.0008, -0.0016, 0.0034]))
            D += g('mouthFrown' + tag) * cw[:, None] * np.array([s * 0.0005, -0.0004, -0.0042])
            D += g('mouthDimple' + tag) * cw[:, None] * np.array([s * 0.001, 0.0022, 0.0002])
            D += g('mouthStretch' + tag) * (cw[:, None] * np.array([s * 0.0042, 0.0012, -0.0012]) + (A['lipU'] + A['lipL'])[:, None] * side[:, None] * np.array([s * 0.0012, 0.0004, 0]))
            pr = g('mouthPress' + tag) * side
            D += pr[:, None] * (A['lipU'][:, None] * np.array([0, 0.0008, -0.0007]) + A['lipL'][:, None] * np.array([0, 0.0008, 0.0009]))
            ld = g('mouthLowerDown' + tag) * side * (1 - 0.6 * cw)
            D += ld[:, None] * A['lipL'][:, None] * np.array([0, 0.0005, -0.0036])
            uu = g('mouthUpperUp' + tag) * side * (1 - 0.6 * cw)
            D += uu[:, None] * A['lipU'][:, None] * np.array([0, 0.0003, 0.0034])
            D += g('cheekSquint' + tag) * ch[:, None] * np.array([0, -0.0006, 0.0028])
            wg = A['wing' + ('L' if s > 0 else 'R')]
            D += g('noseSneer' + tag) * (wg[:, None] * np.array([s * 0.0005, -0.0004, 0.0024]) + (A['lipU'] * side * (1 - cw))[:, None] * np.array([0, 0, 0.0012]))
        lipsum = np.clip(A['lipU'] + A['lipL'], 0, 1)
        D += g('mouthRollLower') * A['lipL'][:, None] * np.array([0, 0.0026, 0.0018]) * (1 - A['inner'])[:, None]
        D += g('mouthRollUpper') * A['lipU'][:, None] * np.array([0, 0.0024, -0.0016]) * (1 - A['inner'])[:, None]
        D += g('mouthShrugLower') * (A['lipL'] * 0.8 + A['chin'])[:, None] * np.array([0, -0.0012, 0.0022])
        D += g('mouthShrugUpper') * A['lipU'][:, None] * np.array([0, -0.0004, 0.0016])
        xs = A['xs']; a0 = PH['mouth_a'][0]
        # funnel: lips forward, seam opens into an O, corners in
        fu = g('mouthFunnel')
        D += fu * (lipsum[:, None] * np.array([0, -0.0032, 0]) + (A['lipU'] * A['seam'])[:, None] * np.array([0, 0, 0.0022])
                   - (A['lipL'] * A['seam'])[:, None] * np.array([0, 0, 0.0024]))
        D[:, 0] += fu * (-xs * 0.22) * A['mouth']
        pk = g('mouthPucker')
        D[:, 0] += pk * (-xs * 0.42) * A['mouth']
        D += pk * lipsum[:, None] * np.array([0, -0.0042, 0]) + pk * A['mouth'][:, None] * np.array([0, -0.0012, 0])
        D[:, 0] += (g('mouthLeft') - g('mouthRight')) * 0.0052 * A['mouth']
        D += g('cheekPuff') * (A['cheekL'][:, None] * np.array([0.004, -0.0012, 0]) + A['cheekR'][:, None] * np.array([-0.004, -0.0012, 0]))
        X = X + D
        # ---- jaw (rotation). mouthClose (ARKit meaning): the lips close against an open jaw, so the key itself carries
        # minus the lower-lip part of the full jawOpen displacement; jaw w + close w then seals linearly.
        piv = np.array(R.get('jaw_pivot', [0.0, 0.048, -0.018]))
        wj = A['jaw']
        thf = math.radians(R.get('jaw_deg', 22))

        def rot(Xa, ang):
            q = Xa - piv
            c, s_ = np.cos(ang), np.sin(ang)
            return np.stack([Xa[:, 0], q[:, 1] * c - q[:, 2] * s_ + piv[1], q[:, 1] * s_ + q[:, 2] * c + piv[2]], 1)
        cl = g('mouthClose')
        if cl:
            lipw = np.clip(A['lipL'], 0, 1) * (1 - 0.5 * (A['lipU'] > 0))
            Dfull = rot(X, thf * wj) - X
            X = X - cl * Dfull * lipw[:, None] * R.get('close_gain', 1.0)
            # the upper lip comes down a touch to meet it
            X[:, 2] -= cl * 0.0006 * A['lipU'] * (A['lipL'] == 0)
        th = thf * g('jawOpen')
        if th != 0 or g('jawForward') or g('jawLeft') or g('jawRight'):
            X = rot(X, th * wj)
            X[:, 1] += -g('jawForward') * 0.004 * wj
            X[:, 0] += (g('jawLeft') - g('jawRight')) * 0.004 * wj
        # ---- lids
        for s in (1, -1):
            X = self.lids(X, w, s, A[('lidU', s)], A[('lidL', s)], A[('lidT', s)])
        # ---- lid-over-eyeball push-out on every pose (tucks excepted)
        Xp = HD.push_out(X[self.not_tuck], self.PH | self.PP)
        X[self.not_tuck] = Xp
        # ---- forehead skin follows the brows (30%)
        bd = self.brow_disp(X0, w, follow=True)
        X = X + bd * (A['fore'] * R.get('fore_follow', 0.3))[:, None]
        return X

    def brow_disp(self, X, w, follow=False):
        pts = np.array(self.PP['brow_pts'])
        x0, x1 = pts[0, 0], pts[-1, 0]
        D = np.zeros_like(X)
        sgn = np.sign(X[:, 0])
        sp = np.clip((np.abs(X[:, 0]) - x0) / (x1 - x0), 0, 1)
        g = lambda k: w.get(k, 0.0)
        iu = g('browInnerUp')
        D[:, 2] += iu * 0.0095 * (1 - sp) ** 1.2
        D[:, 0] += iu * -(2 * smooth(-0.003, 0.003, X[:, 0]) - 1) * 0.0007 * (1 - sp)
        sideL = smooth(-0.003, 0.003, X[:, 0])
        for s, tag in ((1, 'Left'), (-1, 'Right')):
            m = sideL if s > 0 else 1 - sideL
            bdn = g('browDown' + tag) * m
            D[:, 2] += bdn * (-0.0035 - 0.0025 * (1 - sp))
            D[:, 0] += bdn * (-s * 0.0025 * (1 - sp) ** 1.5)
            D[:, 1] += bdn * 0.0006
            bo = g('browOuterUp' + tag) * m
            D[:, 2] += bo * 0.0065 * sp ** 1.1
        return D

    def brow(self, X0, w):
        return X0 + self.brow_disp(X0, w)

    def lash(self, X0, w, s):
        Fr = self.frames[s]
        a, e, r = HD.eye_ae(Fr, X0)
        t = self.t_from_a(a)
        ones = np.ones(len(X0))
        return self.lids(X0, w, s, ones, np.zeros(len(X0)), t)

    def jaw_rigid(self, X0, w, extra=None):
        th = math.radians(self.R.get('jaw_deg', 22)) * w.get('jawOpen', 0.0)
        piv = np.array(self.R.get('jaw_pivot', [0.0, 0.048, -0.018]))
        X = X0.copy()
        if extra is not None:
            X = extra(X)
        q = X - piv
        c, s_ = math.cos(th), math.sin(th)
        X = np.stack([X[:, 0], q[:, 1] * c - q[:, 2] * s_ + piv[1], q[:, 1] * s_ + q[:, 2] * c + piv[2]], 1)
        X[:, 1] += -w.get('jawForward', 0.0) * 0.004
        X[:, 0] += (w.get('jawLeft', 0.0) - w.get('jawRight', 0.0)) * 0.004
        return X

    def tongue(self, X0, w, centre):
        def ex(X):
            X = X.copy()
            c = np.asarray(centre)
            fr = np.clip((c[1] - X[:, 1]) / 0.013 * 0.5 + 0.5, 0, 1)  # 1 at the tip (front), 0 at the root
            tip = fr ** 2
            X[:, 1] -= w.get('tongueOut', 0.0) * 0.010 * fr
            X[:, 2] += w.get('tongueOut', 0.0) * 0.0015 * fr
            X[:, 2] += w.get('tongueTipUp', 0.0) * 0.0065 * tip
            X[:, 1] += w.get('tongueTipUp', 0.0) * -0.001 * tip
            cu = w.get('tongueCurl', 0.0)
            X[:, 2] += cu * 0.006 * tip
            X[:, 1] += cu * 0.0045 * tip
            wd = w.get('tongueWide', 0.0)
            X[:, 0] += wd * 0.3 * (X[:, 0] - c[0])
            X[:, 2] -= wd * 0.25 * (X[:, 2] - c[2])
            bk = w.get('tongueBack', 0.0)
            X[:, 2] += bk * 0.005 * (1 - fr)
            return X
        return self.jaw_rigid(X0, w, ex)


def pose_meshes(rig, rests, w):
    out = {}
    for name, X0 in rests.items():
        if name == 'head':
            out[name] = rig.head(X0, w)
        elif name.startswith('brow'):
            out[name] = rig.brow(X0, w)
        elif name.startswith('lash'):
            out[name] = rig.lash(X0, w, 1 if name.endswith('L') else -1)
        elif name == 'teeth_L':
            out[name] = rig.jaw_rigid(X0, w)
        elif name == 'tongue':
            out[name] = rig.tongue(X0, w, rig.tongue_centre)
        elif name == 'bindi':
            out[name] = X0 + rig.brow_disp(X0, w) * rig.R.get('fore_follow', 0.3)
        else:
            out[name] = X0
    return out


def key_targets(rig, rests):
    """name -> {mesh: absolute positions} for all 82 keys."""
    zero = {k: v for k, v in rests.items()}
    T = {}
    for k in ARKIT + TONGUE:
        T[k] = pose_meshes(rig, rests, {k: 1.0})
    for k, rec in VISEMES.items():
        T[k] = pose_meshes(rig, rests, rec)
    for k, (a, b) in CORRECTIVES.items():
        ab = pose_meshes(rig, rests, {a: 1.0, b: 1.0})
        A_ = T[a]; B_ = T[b]
        T[k] = {m: ab[m] - A_[m] - B_[m] + 2 * zero[m] for m in rests}
    return T


def author(objs, L, M, P):
    import bpy
    names = ['head', 'lash_L', 'lash_R', 'brow_L', 'brow_R', 'teeth_L', 'tongue', 'bindi']
    rests = {}
    for n in names:
        me = objs[n].data
        rests[n] = np.array([v.co[:] for v in me.vertices])
    me = objs['head'].data
    E = np.zeros(len(me.edges) * 2, int); me.edges.foreach_get('vertices', E)
    rig = Rig(P, L, M, rests['head'], edges=E.reshape(-1, 2))
    rig.tongue_centre = rests['tongue'].mean(0)
    T = key_targets(rig, rests)
    for n in names:
        ob = objs[n]
        ob.shape_key_add(name='Basis', from_mix=False)
        for k in ALL_KEYS:
            kb = ob.shape_key_add(name=k, from_mix=False)
            kb.data.foreach_set('co', T[k][n].astype(np.float32).ravel())
            kb.slider_min = 0.0; kb.slider_max = 1.0
    return T
