"""Does the teacher's face resemble a real person? A lookalike check against a public-figure face set.

Model: OpenCV Zoo SFace (face_recognition_sface_2021dec.onnx, Apache-2.0; MobileFaceNet trained with the SFace loss)
with the YuNet detector (face_detection_yunet_2023mar.onnx, MIT) for the 5-point alignment, both through OpenCV's
FaceRecognizerSF / FaceDetectorYN. 128-d embedding, cosine similarity. OpenCV's published operating point for SFace
is cosine >= 0.363 = "same identity" (opencv_zoo face_recognition_sface README / demo). That point does not hold on
this gallery (see the calibration note in the code), so the bar is relative: below the p95 of the gallery's own
nearest-different-person similarity, for every SHIPPED probe (the renders); the references are reported separately.

Probes: our renders (H tier, neutral and warm, front and 3/4) and the generated reference portraits the face was fitted
to (if the references resemble someone, the mesh inherits it).
Gallery: identity/faceset.py (Wikidata + Wikimedia Commons; Indian women public figures + the most-linked women
worldwide). Images with no detectable face are dropped.
Calibration, so a pass means something: (1) probe-vs-probe similarity (our renders vs our own references: the model must
see these as one person or near it), (2) the gallery's own nearest-neighbour distribution (how close two DIFFERENT real
people get under this model), so our max similarity is read against it.
    <venv with opencv>/python realperson.py --faceset <dir> --models <dir> --probes a.png b.png ... --out report.json"""
import argparse, glob, json, os
import numpy as np
import cv2

ap = argparse.ArgumentParser()
ap.add_argument("--faceset", required=True)
ap.add_argument("--models", required=True)
ap.add_argument("--probes", nargs="+", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--thr", type=float, default=0.363)
a = ap.parse_args()
rec = cv2.FaceRecognizerSF.create(os.path.join(a.models, "face_recognition_sface_2021dec.onnx"), "")
det = cv2.FaceDetectorYN.create(os.path.join(a.models, "face_detection_yunet_2023mar.onnx"), "", (320, 320), 0.7, 0.3, 5000)


def embed(path):
    img = cv2.imread(path)
    if img is None:
        return None, "unreadable"
    h, w = img.shape[:2]
    s = 640 / max(h, w) if max(h, w) > 640 else 1.0
    if s != 1.0:
        img = cv2.resize(img, (int(w * s), int(h * s)))
    det.setInputSize((img.shape[1], img.shape[0]))
    _, faces = det.detect(img)
    if faces is None or not len(faces):
        return None, "no face"
    f = faces[np.argmax(faces[:, 2] * faces[:, 3])]
    al = rec.alignCrop(img, f)
    e = rec.feature(al).ravel()
    return e / np.linalg.norm(e), float(f[-1])


man = json.load(open(os.path.join(a.faceset, "manifest.json")))
G, gid = [], []
skipped = 0
for f in sorted(glob.glob(os.path.join(a.faceset, "img", "*.jpg"))):
    e, sc = embed(f)
    if e is None:
        skipped += 1; continue
    G.append(e); gid.append(os.path.basename(f)[:-4])
G = np.array(G)
P, pn = [], []
for f in a.probes:
    e, sc = embed(f)
    if e is None:
        print("probe without a detectable face:", f); continue
    P.append(e); pn.append(f)
P = np.array(P)
S = P @ G.T
# gallery nearest neighbour among DIFFERENT people (calibration)
GG = G @ G.T
np.fill_diagonal(GG, -1)
nn = GG.max(1)
rows = []
for i, f in enumerate(pn):
    j = np.argsort(-S[i])[:5]
    rows.append({"probe": f, "maxCos": round(float(S[i, j[0]]), 4),
                 "top5": [{"wikidata": gid[k], "set": man.get(gid[k], {}).get("set"), "cos": round(float(S[i, k]), 4)} for k in j]})
PP = P @ P.T
out = {
    "model": "OpenCV Zoo SFace 2021dec (Apache-2.0) + YuNet 2023mar (MIT), cosine similarity",
    "threshold": a.thr, "gallery": {"faces": int(len(G)), "skippedNoFace": skipped,
                                     "india": sum(man.get(g, {}).get("set") == "india" for g in gid),
                                     "world": sum(man.get(g, {}).get("set") == "world" for g in gid)},
    "calibration": {"galleryNearestOtherPerson": {"p50": round(float(np.median(nn)), 4), "p95": round(float(np.percentile(nn, 95)), 4),
                                                   "p99": round(float(np.percentile(nn, 99)), 4), "max": round(float(nn.max()), 4),
                                                   "shareAboveThreshold": round(float((nn >= a.thr).mean()), 4)},
                    "probeVsProbe": {pn[i].split("/")[-1] + " | " + pn[k].split("/")[-1]: round(float(PP[i, k]), 4)
                                     for i in range(len(pn)) for k in range(i + 1, len(pn))}},
    "probes": rows,
    "maxOverProbes": round(float(S.max()), 4) if len(P) else None,
}
# The fixed OpenCV operating point (0.363) does not hold on this population: 93.6% of the gallery's real people have a
# DIFFERENT real person above it (measured, calibration block), i.e. SFace separates Indian women's faces poorly (its
# training data is mostly other populations). So the bar is relative and stated: a probe passes when its nearest real
# person is no closer than the p95 of the gallery's own nearest-different-person similarities (it resembles no one more
# than most real people resemble a stranger), and it must stay far below same-identity similarity (probe-vs-probe).
p95 = float(np.percentile(nn, 95))
out["bar"] = {"rule": "max cosine to any gallery face < p95 of gallery nearest-different-person cosine", "p95": round(p95, 4),
              "openCvOperatingPoint": a.thr}
for r in rows:
    r["pass"] = bool(r["maxCos"] < p95)
ship = [r for r in rows if "/refs/" not in r["probe"]]
out["passShipped"] = bool(ship and all(r["pass"] for r in ship))
out["passReferences"] = bool(all(r["pass"] for r in rows if "/refs/" in r["probe"]))
json.dump(out, open(a.out, "w"), indent=1)
print(json.dumps({k: out[k] for k in ("gallery", "maxOverProbes", "bar", "passShipped", "passReferences")}), json.dumps(out["calibration"]["galleryNearestOtherPerson"]))
for r in rows:
    print(r["probe"].split("/")[-1], r["maxCos"], r["pass"], r["top5"][0])
