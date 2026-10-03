"""Read a dump_glb.mjs folder (procedural-v3's raw tier GLB) into numpy: meshes, morph targets, bones (world rest)."""
import json, os
import numpy as np
from scipy.spatial.transform import Rotation as Rot

DT = {"f32": np.float32, "u32": np.uint32, "u16": np.uint16, "u8": np.uint8}


def load(d):
    ix = json.load(open(os.path.join(d, "index.json")))
    rd = lambda f: np.fromfile(os.path.join(d, f), DT[f.rsplit(".", 1)[1]])
    meshes = {}
    for k, r in ix["meshes"].items():
        o = {"material": r["material"], "joints": r.get("joints"), "targetNames": r["targetNames"]}
        for sem, a in r["attrs"].items():
            arr = rd(a["file"]).reshape(a["count"], a["size"]) if a["size"] > 1 else rd(a["file"])
            o[sem] = arr
        o["idx"] = rd(r["indices"]).reshape(-1, 3)
        n = o["POSITION"].shape[0]
        o["targets"] = np.stack([rd(t).reshape(n, 3) for t in r["targets"]]) if r["targets"] else np.zeros((0, n, 3), np.float32)
        if "ibm" in r:
            o["ibm"] = rd(r["ibm"]).reshape(-1, 4, 4)
        meshes[k] = o
    bones = {b["name"]: b for b in ix["bones"]}

    def world(name):
        b = bones[name]
        M = np.eye(4)
        M[:3, :3] = Rot.from_quat(b["r"]).as_matrix() * np.array(b["s"])[None, :]
        M[:3, 3] = b["t"]
        return M if b["parent"] is None else world(b["parent"]) @ M
    for n in bones:
        bones[n]["world"] = world(n)
    return meshes, bones
