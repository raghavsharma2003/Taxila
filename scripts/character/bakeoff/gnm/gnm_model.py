"""GNM Head v3.0 (Google, Apache-2.0 code and weights) loader + forward model for the gnm bake-off row (E-GNM1).

The weights are NOT in the repo (53 MB): fetched once into $CHAR_HOME/gnm/gnm_head.npz from
https://huggingface.co/google/gnm-v3/resolve/main/v3_0/gnm_head.npz and sha256-checked here.
Units: metres, Y up, +Z forward (the face looks down +Z), the same axes as our glTF.

Forward (the GNM README / XR Blocks GNMModel.js formulation, NumPy backend semantics):
  v_bind = template + sum_i c_id[i] * B_id[i] + sum_j c_ex[j] * B_ex[j]          (coefficients in unit-std units)
  j_bind = template_joints + sum_i c_id[i] * J_id[i]
Joint rotations are applied by our own runtime bones (Neck 35 % / Head 65 %, eyes), never baked, so only the bind
shape is evaluated here. GNM's pose-corrective regressor (36 x 3V) is not used: the runtime head turns are <= 12 deg
and the contract has no pose-driven correctives."""
import hashlib, json, os, base64
import numpy as np

CH = os.environ.get("CHAR_HOME", "/tmp/claude-0/char")
NPZ = os.path.join(CH, "gnm", "gnm_head.npz")
SHA = "61d78bbfb4ad8e0b38495804a4caef3214d3df00f8c3f68761e63b41ce3747eb"
URL = "https://huggingface.co/google/gnm-v3/resolve/main/v3_0/gnm_head.npz"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../../.."))
ART = os.path.join(ROOT, "art/character/bakeoff/gnm")


def fetch():
    if not os.path.exists(NPZ):
        import urllib.request
        os.makedirs(os.path.dirname(NPZ), exist_ok=True)
        urllib.request.urlretrieve(URL, NPZ)
    h = hashlib.sha256(open(NPZ, "rb").read()).hexdigest()
    if h != SHA:
        raise SystemExit(f"gnm_head.npz sha256 {h} != pinned {SHA}")
    return NPZ


class GNM:
    def __init__(self):
        d = np.load(fetch())
        self.T = d["template_vertex_positions"].astype(np.float64)
        self.Bid = d["vertex_identity_basis"]            # (253, V, 3) float32
        self.Bex = d["expression_basis"]                 # (383, V, 3)
        self.J0 = d["template_joint_positions"].astype(np.float64)
        self.Jid = d["joint_identity_basis"]
        self.tri = d["triangles"]
        self.tri_uv = d["triangle_uvs"]
        self.quads = d["quads"]
        self.W = d["skinning_weights"]                   # (4, V) neck, head, left_eye, right_eye
        self.mirror = d["mirror_indices"]
        self.gnames = [str(x) for x in d["vertex_group_names"]]
        self.G = d["vertex_groups"]
        self.ex_names = [str(x) for x in d["expression_names"]]
        self.id_names = [str(x) for x in d["identity_names"]]
        self.comp_names = [str(x) for x in d["mesh_component_names"]]
        self.V = self.T.shape[0]

    def group(self, name, thr=0.5):
        return self.G[self.gnames.index(name)] > thr

    def ex_index(self, prefix):
        return np.array([i for i, n in enumerate(self.ex_names) if n.startswith(prefix)])

    def id_index(self, prefix):
        return np.array([i for i, n in enumerate(self.id_names) if n.startswith(prefix)])

    def bind(self, cid=None, cex=None):
        v = self.T.copy()
        if cid is not None:
            v += np.tensordot(np.asarray(cid, np.float64), self.Bid, 1)
        if cex is not None:
            v += np.tensordot(np.asarray(cex, np.float64), self.Bex, 1)
        return v

    def joints(self, cid=None):
        j = self.J0.copy()
        if cid is not None:
            j += np.tensordot(np.asarray(cid, np.float64), self.Jid, 1)
        return j

    def expr_delta(self, cex):
        return np.tensordot(np.asarray(cex, np.float64), self.Bex, 1)


def mp_correspondence():
    """XR Blocks FaceCorrespondence (Apache-2.0, generated from edualvarado/gnm-webcam-puppet against GNM 3.0):
    MediaPipe landmark index -> GNM vertex, the reference cloud where the landmarker lands on the neutral GNM face
    (cancels the landmarker's own depth bias), and the 166 skull-fixed flags. Cached as JSON under art/."""
    f = os.path.join(ART, "mp_gnm_corr.json")
    if os.path.exists(f):
        d = json.load(open(f))
        return {k: np.array(v) for k, v in d.items() if k != "source"}
    js = open(os.path.join(CH, "gnm", "FaceCorrespondence.js")).read()
    packed = js.split("const PACKED =")[1].split("'")[1]
    b = base64.b64decode(packed)
    n = 473
    out = {"reference": np.frombuffer(b, np.float32, n * 3, 0).reshape(n, 3).astype(np.float64),
           "landmarks": np.frombuffer(b, np.uint16, n, 5676).astype(int),
           "vertices": np.frombuffer(b, np.uint16, n, 6622).astype(int),
           "rigid": np.frombuffer(b, np.uint8, n, 7568).astype(int)}
    json.dump({**{k: v.tolist() for k, v in out.items()},
               "source": "github.com/google/xrblocks samples/avatar_lab/gnm/FaceCorrespondence.js @863004a (Apache-2.0), "
                         "generated from github.com/edualvarado/gnm-webcam-puppet (Apache-2.0) against GNM 3.0"},
              open(f, "w"))
    return out


# ---------------------------------------------------------------- per-look paths (round 2: teal, slate, plum)
def look_from_argv(default="teal"):
    import sys
    return sys.argv[sys.argv.index("--look") + 1] if "--look" in sys.argv else default


def paths(look):
    """build dir, reference dir, fit file, and the parts source (procedural-v3 for teal; the main pipeline's
    iteration-2 build for slate / plum: v3 has no curls, bun, glasses or saree generators, VERDICT)."""
    refd = os.path.join(ROOT, "art/character/bakeoff/merged/refs/teal") if look == "teal" else os.path.join(ART, "refs", look)
    src = os.path.join(CH, "bakeoff-gnm", "v3dump") if look == "teal" else os.path.join(CH, "bakeoff-gnm", f"{look}-src")
    srctex = os.path.join(CH, "bakeoff-pv3", "teal", "tex") if look == "teal" else os.path.join(CH, "build", look, "tex")
    return {"BD": os.path.join(CH, "bakeoff-gnm", look), "REFD": refd, "FIT": os.path.join(ART, "fit", f"{look}.json"),
            "SRC": src, "SRCTEX": srctex, "LOOK": os.path.join(ART, "looks", f"{look}.json")}
