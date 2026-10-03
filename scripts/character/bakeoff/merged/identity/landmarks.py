"""MediaPipe Face Landmarker (Apache-2.0, build time only): 478 landmarks + head transform per image.
    <venv with mediapipe>/python landmarks.py --model face_landmarker.task --out lm.json img1.png img2.png ...
Writes {name: {w, h, lm: [[x_px, y_px, z_px]...], M: 4x4 facial transformation, blend: {name: score}}}; z is MediaPipe's
relative depth in the same pixel scale as x (camera looks down -z; smaller z = nearer the camera)."""
import argparse, json, os
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("images", nargs="+")
a = ap.parse_args()
opts = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=a.model), num_faces=1,
                                    output_face_blendshapes=True, output_facial_transformation_matrixes=True)
det = vision.FaceLandmarker.create_from_options(opts)
out = json.load(open(a.out)) if os.path.exists(a.out) else {}
for f in a.images:
    img = mp.Image.create_from_file(f)
    r = det.detect(img)
    name = os.path.splitext(os.path.basename(f))[0]
    if not r.face_landmarks:
        print(f"[lm] {name}: no face"); out[name] = None; continue
    w, h = img.width, img.height
    lm = [[p.x * w, p.y * h, p.z * w] for p in r.face_landmarks[0]]
    out[name] = {"w": w, "h": h, "lm": np.round(lm, 3).tolist(), "M": np.asarray(r.facial_transformation_matrixes[0]).round(5).tolist(),
                 "blend": {b.category_name: round(b.score, 3) for b in r.face_blendshapes[0]}}
    print(f"[lm] {name}: {len(lm)} landmarks")
json.dump(out, open(a.out, "w"))
