"""Step 4: project the generated portraits onto OUR face UVs (runs inside texture.py, before the skin maps are written).

Per view (front, the two 3/4 views, the profile):
  camera  an affine camera (2x4, least squares) from our mesh's landmark points (corr.json on the wrapped basis) to the
          view's MediaPipe landmarks, then a 2D thin-plate residual warp through the same landmarks, so the eyelids,
          lip line, brows and nostrils land on our geometry exactly;
  mask    a z-buffer of our own face mesh in that camera (texels hidden behind the nose or cheek are not sampled),
          facing weight (n . v)^2, the image's skin / face region (inside the dilated landmark oval, or skin-coloured
          pixels outside it: neck and ears; never background, garment or hair), minus the eye openings;
  mirror  each view is also sampled at the MIRRORED texel (x -> -x) at half weight, so the side that every generated
          view turned away from still gets the person's skin (the face is symmetrised, wrap.py);
  delight the image is divided by its own low-pass skin luminance (masked normalised convolution, sigma 0.12 IOD) and
          speculars above the skin's p97 are pulled down, which removes the broad studio shading and keeps the
          colour detail (pores, freckles, under-eye tone, lip colour, brows).
Colour is then ANCHORED: per channel, the projected albedo is scaled so that its mean over the G9 patches (cheeks,
forehead, lower cheek) equals the procedural MST-anchored albedo there, so G9 keeps its solved gain. The projection
blends over the procedural maps by its weight (scalp, back of the neck, inner ears stay procedural).
Normal detail: a height field from the de-lit image's fine high-pass luminance (darker = lower), sampled per view at
3D points and turned into tangent-space normals with the pipeline's own normal_from, added to the procedural pores.
Nothing here uses a photo of a real person: the inputs are images generated for this look (refs.json carries the prompts).
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.interpolate import RBFInterpolator


def _lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _bilinear(img, xy):
    h, w = img.shape[:2]
    x = np.clip(xy[:, 0] - 0.5, 0, w - 1.001); y = np.clip(xy[:, 1] - 0.5, 0, h - 1.001)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    if img.ndim == 2:
        fx, fy = fx[:, 0], fy[:, 0]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy


def _poly_mask(h, w, pts, dil=0):
    from PIL import ImageDraw
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    m = np.asarray(m) > 0
    return ndimage.binary_dilation(m, iterations=dil) if dil else m


def _ordered_loop(idx_edges):
    """MediaPipe connection sets are edge lists; walk them into a closed loop of landmark ids."""
    adj = {}
    for a, b in idx_edges:
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    start = idx_edges[0][0]; loop = [start]; prev = None; cur = start
    while True:
        nxt = [n for n in adj[cur] if n != prev]
        if not nxt or nxt[0] == start:
            break
        prev, cur = cur, nxt[0]; loop.append(cur)
        if len(loop) > 500:
            break
    return loop


def apply(G):
    look, log, R = G["look"], G["log"], G["R"]
    spec = look["projection"]
    import gpu_target as GT                     # no-op unless TAXILA_IDENTITY_TARGET names a face3d GPU run
    spec = GT.projection_spec(spec, log)
    Pt, Nt, Tx, Bx, cov = G["Pt"], G["Nt"], G["Tx"], G["Bx"], G["cov"]
    A, A_H, Nb = G["A"], G["A_H"], G["Nb"]
    face, P, tris = G["face"], G["P"], G["tris"]
    eyeC = G["eyeC"]
    LM = json.load(open(spec["landmarks"]))
    C = json.load(open(spec["corr"]))["corr"]
    RGd = json.load(open(spec["regions"]))
    vid = np.zeros(len(face.data.vertices), np.int32)
    face.data.attributes["vid"].data.foreach_get("value", vid)
    inv = {int(v): i for i, v in enumerate(vid) if v >= 0}
    idx = [k for k in range(468) if C[k] is not None and all(int(v) in inv for v in C[k]["vid"])]
    V = np.array([[inv[int(v)] for v in C[k]["vid"]] for k in idx]); W = np.array([C[k]["w"] for k in idx])
    L3 = (P[V] * W[:, :, None]).sum(1)                       # our landmark points on the final basis
    oval_set = set(RGd["oval"])
    is_oval = np.array([k in oval_set for k in idx])
    oval_loop = _ordered_loop([tuple(e) for e in _edges(RGd, "oval")])
    eyeL_loop = _ordered_loop([tuple(e) for e in _edges(RGd, "leye")]) if _edges(RGd, "leye") else None
    eyeR_loop = _ordered_loop([tuple(e) for e in _edges(RGd, "reye")]) if _edges(RGd, "reye") else None

    # the skin-region tris of our own face for the z-buffer (rest basis)
    region = G["region"]
    skinT = G["tris"]                                          # texture.py already restricted tris to skin
    N = len(Pt)
    hs = np.clip((G["scalpT"] - 0.2) / 0.3, 0, 1)
    # texels above the portrait's forehead-top landmark (10) are hair zone too: the wrap gave this face a taller forehead
    # than MakeHuman's scalp mask, and those texels fell back to a flat procedural skin wedge at the parting (measured: a
    # light wedge that stayed with the hair cards hidden)
    if 10 in idx:
        z10 = L3[idx.index(10)][2]
        hs = np.maximum(hs, np.clip((Pt[:, 2] - (z10 - 0.006)) / 0.008, 0, 1))
    mir = np.array([-1.0, 1.0, 1.0])
    acc = np.zeros((N, 3)); wacc = np.zeros(N); hacc = np.zeros(N); hwacc = np.zeros(N); views_used = {}
    hfuns = []
    # G9 patch texels (Blender axes; g9.mjs offsets are glTF (x, y up, z fwd) -> Blender (x, -z, y))
    eL, eR = eyeC["L"], eyeC["R"]; midp = (eL + eR) / 2
    gl2b = lambda d: np.array([d[0], -d[2], d[1]])
    patches = [eL + gl2b([0.006, -0.034, 0.012]), eR + gl2b([-0.006, -0.034, 0.012]), midp + gl2b([0, 0.045, 0.012]),
               eR + gl2b([-0.004, -0.066, 0.006])]
    from scipy.spatial import cKDTree
    tt = cKDTree(Pt)
    patch_tex = np.unique(np.concatenate([tt.query_ball_point(p, 0.006) for p in patches]).astype(int))

    for vname, vw in spec["views"].items():
        v = LM.get(vname)
        if not v:
            continue
        img8 = np.asarray(Image.open(os.path.join(spec["dir"], f"{vname}.png")).convert("RGB")).astype(np.float32) / 255.0
        img = _lin(img8)
        H_, W_ = img.shape[:2]
        u = np.array(v["lm"])[idx, :2]
        # ---- camera: affine 2x4, interior landmarks (contours slide with the view), then residual TPS incl. contour on the front
        use = ~is_oval
        Xh = np.c_[L3, np.ones(len(L3))]
        M, *_ = np.linalg.lstsq(Xh[use], u[use], rcond=None)        # (4,2)
        proj = lambda Q: np.c_[Q, np.ones(len(Q))] @ M
        r = u - proj(L3)
        tps_use = use | (is_oval & (vname == "front"))
        rms = float(np.sqrt((r[use] ** 2).sum(1).mean()))
        warp = RBFInterpolator(proj(L3)[tps_use], r[tps_use], kernel="thin_plate_spline", smoothing=2.0, degree=1)
        iod = float(np.linalg.norm(np.array(v["lm"])[33, :2] - np.array(v["lm"])[263, :2]))
        # camera direction: null space of the 2x3 linear part, pointing from the face toward the camera
        Ml = M[:3].T
        vd = np.cross(Ml[0], Ml[1]); vd /= np.linalg.norm(vd)
        # the nose tip (landmark 1) must be nearer the camera than the eye centres
        nose = L3[idx.index(1)] if 1 in idx else Pt[np.argmin(Pt[:, 1])]
        if (nose - midp) @ vd < 0:
            vd = -vd
        # ---- de-light: masked low-pass of luminance over the skin
        lm_all = np.array(v["lm"])
        ovm = _poly_mask(H_, W_, lm_all[oval_loop, :2], dil=int(0.06 * iod))
        Y = img @ np.array([0.2126, 0.7152, 0.0722])
        cheek = np.median(img[ovm], axis=0)
        chroma = img / np.maximum(Y[..., None], 1e-4)
        cref = cheek / max(cheek @ np.array([0.2126, 0.7152, 0.0722]), 1e-4)
        skinlike = (np.linalg.norm(chroma - cref, axis=-1) < 0.35) & (Y > 0.25 * (cheek @ np.array([0.2126, 0.7152, 0.0722])))
        skinlike = ndimage.binary_opening(skinlike, iterations=2)
        eyes = np.zeros_like(ovm)
        for lp in (eyeL_loop, eyeR_loop):
            if lp:
                eyes |= _poly_mask(H_, W_, lm_all[lp, :2], dil=1)
        okpix = (ovm & ~eyes) | (skinlike & ~eyes)
        m = (okpix & skinlike).astype(np.float32)
        sig = 0.12 * iod
        lowY = ndimage.gaussian_filter(Y * m, sig) / np.maximum(ndimage.gaussian_filter(m, sig), 1e-4)
        Ysk = np.median(Y[okpix & skinlike])
        shade = np.clip(lowY / Ysk, 0.35, 2.5)
        D = img / shade[..., None]
        Yd = D @ np.array([0.2126, 0.7152, 0.0722])
        p97 = np.percentile(Yd[okpix & skinlike], 97)
        over = np.clip(Yd / p97, 1, None)
        D = D / over[..., None] ** 0.8
        Yd = D @ np.array([0.2126, 0.7152, 0.0722])
        hp = (Yd - ndimage.gaussian_filter(Yd, 1.6)) / np.maximum(ndimage.gaussian_filter(Yd, 6), 1e-3)
        okf = ndimage.gaussian_filter(okpix.astype(np.float32), 1.5)
        # scalp texels may take HAIR pixels (anything that is not background or eye): a painted hairline that matches
        # the portrait instead of a procedural one (the procedural scalp read as a bare wedge at the parting)
        border = np.concatenate([img[:8].reshape(-1, 3), img[:, :8].reshape(-1, 3), img[:, -8:].reshape(-1, 3)])
        # background: bright and unsaturated (the generated backdrop is light warm grey with a soft gradient; a
        # border-colour distance of 0.06 missed its gradient and painted it onto the scalp at the parting)
        mx, mn = img.max(-1), img.min(-1)
        bg = ((Y > 0.45) & ((mx - mn) / np.maximum(mx, 1e-4) < 0.22)) | (np.linalg.norm(img - np.median(border, 0), axis=-1) < 0.08)
        bg = ndimage.binary_dilation(ndimage.binary_opening(bg, iterations=2), iterations=3)
        okh = ndimage.gaussian_filter((~bg & ~eyes & (np.arange(H_)[:, None] < lm_all[152, 1])).astype(np.float32), 1.5)
        # merged: HAIR evidence per pixel (dark, not skin-like, not backdrop, above the eyes): where the portrait shows
        # hair but v3's designed hairline still says skin (the temple corners: the portrait's hairline sits lower), the
        # texel was left to the procedural skin, a flat light triangle (the wedge). texture.py extends the hairline there.
        eye_row = min(lm_all[33, 1], lm_all[263, 1])
        hairpix = (~bg & ~eyes & ~skinlike & (Y < 0.55 * Ysk) & (np.arange(H_)[:, None] < eye_row)).astype(np.float32)
        hairpix = ndimage.gaussian_filter(hairpix, 2.0)

        # ---- visibility: z-buffer of our skin triangles in this camera
        Pp = proj(P); Pp = Pp + warp(Pp)
        depth = P @ vd
        zres = 768
        sc = zres / max(H_, W_)
        uvt = (Pp[skinT] * sc) / zres
        TRI, BAR = G["raster"](uvt.astype(np.float64), zres)
        zbuf = np.full((zres, zres), -np.inf)
        okz = TRI >= 0
        zbuf[okz] = (depth[skinT[TRI[okz]]] * BAR[okz]).sum(1)
        zbuf = ndimage.maximum_filter(zbuf, size=3)

        def sample(Q, Nq):
            q = proj(Q); q = q + warp(q)
            dq = Q @ vd
            gx = np.clip((q * sc).astype(int), 0, zres - 1)
            vis = dq >= zbuf[gx[:, 1], gx[:, 0]] - 0.0025
            facing = np.clip((Nq @ vd - 0.15) / 0.6, 0, 1) ** 2
            inside = (q[:, 0] > 1) & (q[:, 1] > 1) & (q[:, 0] < W_ - 2) & (q[:, 1] < H_ - 2)
            w = vis * facing * inside * ((1 - hs) * _bilinear(okf, q) + hs * _bilinear(okh, q))
            hw = vis * facing * inside
            return _bilinear(D, q), w, q, hw * _bilinear(hairpix, q), hw
        col, w, q, hp_, hw_ = sample(Pt, Nt)
        hacc += hp_ * vw; hwacc += hw_ * vw
        colm, wm, qm, hpm_, hwm_ = sample(Pt * mir, Nt * mir)
        hacc += 0.5 * hpm_ * vw; hwacc += 0.5 * hwm_ * vw
        w = w * vw; wm = wm * vw * 0.5
        acc += col * w[:, None] + colm * wm[:, None]
        wacc += w + wm
        hp_v = hp
        hfuns.append((proj, warp, hp_v, w, wm))
        views_used[vname] = {"weight": vw, "affineRmsPx": round(rms, 2), "affineRmsPctIOD": round(100 * rms / iod, 2), "iodPx": round(iod, 1),
                             "texelsDirect": int((w > 0.05).sum()), "texelsMirror": int((wm > 0.05).sum())}
        log(f"projection {vname}: affine rms {rms:.2f} px ({100 * rms / iod:.1f}% IOD), texels {int((w > 0.05).sum())} direct / {int((wm > 0.05).sum())} mirror")

    wsum = np.clip(wacc, 1e-6, None)
    Ap = acc / wsum[:, None]
    have = wacc > 1e-3
    # ---- G9 anchor: per-channel scale so the projected albedo matches the procedural one over the G9 patches
    pt_ = patch_tex[have[patch_tex]]
    k = A[pt_].mean(0) / np.maximum(Ap[pt_].mean(0), 1e-6)
    Ap = Ap * k[None, :]
    # merged (blotches): the de-lit portrait keeps low-frequency grey-blue / olive patches around the mouth and jaw (the
    # generator's shadowing and stubble-like shading), which read as dirty skin on the shipped face. Luminance detail is
    # kept; chromaticity that drifts from the face's median skin chroma toward blue/green (the cast directions) is
    # clamped to spec.chromaTol (rg-chromaticity units); warm drift (flush, lips) is left alone.
    _tol = float(spec.get("chromaTol", 0.012))
    if _tol > 0:
        _Y = Ap @ np.array([0.2126, 0.7152, 0.0722])
        _c = Ap / np.maximum(Ap.sum(1, keepdims=True), 1e-6)
        _ref = have & (np.clip(wacc / float(spec.get("fullWeight", 0.35)), 0, 1) > 0.5)
        _m = np.median(_c[_ref], axis=0)
        _d = _c - _m
        # "cast" = less red than the median (grey, olive, blue); clamp its magnitude
        _cast = np.clip(-_d[:, 0], 0, None)
        _k = np.where(_cast > _tol, _tol / np.maximum(_cast, 1e-9), 1.0)
        _c2 = _m + _d * _k[:, None]
        _Ap2 = _c2 * (_Y / np.maximum(_c2 @ np.array([0.2126, 0.7152, 0.0722]), 1e-6))[:, None]
        G["PJ_CHROMA"] = {"tol": _tol, "clampedPct": round(100 * float((_k < 1)[_ref].mean()), 1), "medianChroma": np.round(_m, 4).tolist()}
        Ap = np.where(have[:, None], _Ap2, Ap)
    alpha = np.clip(wacc / float(spec.get("fullWeight", 0.35)), 0, 1)
    alpha = alpha * float(spec.get("strength", 1.0))
    # merged: the scalp is v3's (its designed per-texel hairline, hair-coloured, under the curve-generated cards); the
    # portrait is never projected onto hair-bearing texels. Projecting the portrait's own hair there brought its centre
    # parting (a skin-coloured line in the hair) onto a scalp whose cards do not part: the wedge (VERDICT item 1)
    # merged (fix 2): the exclusion follows the SAME curve as the painted hairline (texture.py: hl = smoothstep(0.3, 0.7,
    # scalpT)). The earlier ramp (0.15 -> 0.4) cut the projection well below the painted hairline, so the band
    # 0.15 < scalpT < 0.5 fell back to the bare procedural skin: the light triangles at both temples
    _t = np.clip((G["scalpT"] - 0.3) / 0.4, 0, 1)
    hs_strict = _t * _t * (3 - 2 * _t)
    alpha = alpha * (1 - hs_strict)
    G["PJ_ALPHA"] = alpha
    # merged (seams): where the projection fades out (under the chin, the neck, the ears, the temples) the procedural
    # skin showed through LIGHTER than the projected skin (a pale band under the jaw, the temple flaps). The procedural
    # maps take the projection's low-frequency tone: per channel, the ratio projected / procedural averaged on a 5 mm
    # voxel grid over well-covered texels (alpha > 0.5), diffused (normalised Gaussian, 1.5 cm, with a 6 cm fallback
    # where nothing is near), clamped to 0.6..1.6, multiplies the procedural albedo before the blend.
    from scipy import ndimage as _nd
    _h = 0.005
    _lo = Pt.min(0)
    _ix = np.floor((Pt - _lo) / _h).astype(int)
    _sh = tuple(_ix.max(0) + 1)
    _w = (alpha > 0.5).astype(np.float64)
    _flat = np.ravel_multi_index(_ix.T, _sh)
    _W = np.bincount(_flat, _w, minlength=int(np.prod(_sh))).reshape(_sh)
    _ratio = np.ones((len(Pt), 3))
    _Ws, _Wb = _nd.gaussian_filter(_W, 3.0), _nd.gaussian_filter(_W, 12.0)
    for _c in range(3):
        _Sp = np.bincount(_flat, Ap[:, _c] * _w, minlength=_W.size).reshape(_sh)
        _Sa = np.bincount(_flat, A[:, _c] * _w, minlength=_W.size).reshape(_sh)
        _rs = _nd.gaussian_filter(_Sp, 3.0) / np.maximum(_nd.gaussian_filter(_Sa, 3.0), 1e-9)
        _rb = _nd.gaussian_filter(_Sp, 12.0) / np.maximum(_nd.gaussian_filter(_Sa, 12.0), 1e-9)
        _t = np.clip(_Ws / max(float(_Ws.max()) * 0.02, 1e-9), 0, 1)
        _r = _rs * _t + _rb * (1 - _t)
        _ratio[:, _c] = np.clip(_r.ravel()[_flat], 0.6, 1.6)
    G["PJ_TONE"] = {"ratioMedian": np.round(np.median(_ratio, 0), 3).tolist(), "ratioP5": np.round(np.percentile(_ratio, 5, 0), 3).tolist(),
                    "ratioP95": np.round(np.percentile(_ratio, 95, 0), 3).tolist()}
    A = A * _ratio
    A_H = A_H * _ratio
    A2 = A * (1 - alpha[:, None]) + Ap * alpha[:, None]
    A_H2 = A_H * (1 - alpha[:, None]) + Ap * alpha[:, None]
    # the scalp texels the portraits do not see (crown, back) keep the procedural hair-coloured scalp (alpha is 0 there)

    # ---- normal detail from the image high-pass
    amp = float(spec.get("detailHeightM", 0.00035))
    def hfun(Q):
        out = np.zeros(len(Q)); ws = np.zeros(len(Q))
        for proj, warp, hp_v, w, wm in hfuns:
            for QQ, ww in ((Q, w), (Q * mir, wm)):
                q = proj(QQ); q = q + warp(q)
                out += _bilinear(hp_v, q) * ww; ws += ww
        return amp * out / np.maximum(ws, 1e-6)
    Nd = G["normal_from"](hfun, Pt)
    a_n = alpha * float(spec.get("detailNormal", 1.0))
    Nb2 = Nb + np.stack([Nd[:, 0], Nd[:, 1], np.zeros(len(Nd))], 1) * a_n[:, None]
    Nb2 /= np.linalg.norm(Nb2, axis=1, keepdims=True)
    G["PJ_HAIR"] = hacc / np.maximum(hwacc, 1e-6) * (hwacc > 0.05)
    rep = {"views": views_used, "chroma": G.get("PJ_CHROMA"), "tone": G.get("PJ_TONE"), "g9AnchorScale": np.round(k, 4).tolist(), "coveredTexelPct": round(100 * float((alpha > 0.5).mean()), 1),
           "patchTexels": int(len(pt_))}
    json.dump(rep, open(os.path.join(G["args"].build, "projection.json"), "w"), indent=1)
    log(f"projection: {rep['coveredTexelPct']}% of skin texels at alpha > 0.5; G9 anchor scale {rep['g9AnchorScale']}")
    return A2, A_H2, Nb2


def _edges(RGd, name):
    return RGd.get(name + "_edges") or []
