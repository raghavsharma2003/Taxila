"""Round 3 (voicesig) AMI feature prep. Same corpus, labels, front-end and TEST split as ami_prep.py (2026-10-04), so the
test numbers are comparable with the shipped detector's 0.753 / 0.601 on the same harness; more TRAINING data:
  test  = the 8 Indian-L1 series' "b" meetings (identical to ami_prep.choose(M, 15)["test"]: 32 channels, 32 speakers)
  val   = ami_prep.choose(M, n)["val"] ("b" meetings)
  train = ami_prep.choose(M, n)["train"] series, up to --train-meetings meetings per series (same speakers, more hours;
          speaker-disjointness is by series, so extra meetings of a train series never leak a test or val speaker)
AMI Meeting Corpus, CC BY 4.0 (licence read at source 2026-10-04, re-checked 2026-10-09:
groups.inf.ed.ac.uk/ami/corpus/license.shtml). Only numbers are kept: each wav is deleted after the product front-end
(evals/voicesig/train/extract.mjs -> src/voicesig/frontend) reduced it to per-frame features.

  python3 -I evals/voicesig/r3/ami_prep_r3.py <work> --manual <ami manual dir> [--local-s16 <dir>] [--series 40]
      [--train-meetings 2] [--jobs 5] [--only test,val,train]
"""
import argparse, json, os, struct, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
sys.path.insert(0, os.path.join(ROOT, "evals/voicesig/train"))
import ami_prep as A  # noqa: E402


def wav_from_s16(src, dst):
    n = os.path.getsize(src)
    with open(dst, "wb") as f:
        f.write(b"RIFF" + struct.pack("<I", 36 + n) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, 16000, 32000, 2, 16) + b"data" + struct.pack("<I", n))
        with open(src, "rb") as s:
            while True:
                b = s.read(1 << 20)
                if not b:
                    break
                f.write(b)


def one(job):
    meeting, sp, split, out, manual, local = job
    stem = os.path.join(out, f"{meeting}.{sp['agent']}")
    if os.path.exists(stem + ".json"):
        try:
            j = json.load(open(stem + ".json"))
            if "split" in j:
                if j.get("dtype") != "f2+t":
                    j.update(to_f16(stem, j["width"]))
                    json.dump(j, open(stem + ".json", "w"))
                return stem, "cached"
        except Exception:  # noqa: BLE001
            pass
    wav = stem + ".wav"
    lab = A.words(manual, meeting, sp["agent"])
    reg = []
    for s, e, _, _ in lab:
        a, b = max(0.0, s - A.PAD), e + A.PAD
        if reg and a - reg[-1][1] < A.MERGE:
            reg[-1][1] = max(reg[-1][1], b)
        else:
            reg.append([a, b])
    rpath = stem + ".regions.json"
    json.dump(reg, open(rpath, "w"))
    src = "download"
    try:
        s16 = os.path.join(local, f"{meeting}.{sp['agent']}.s16") if local else None
        if s16 and os.path.exists(s16):
            wav_from_s16(s16, wav)
            src = "local-s16"
        else:
            url = f"{A.BASE}/AMICorpusMirror/amicorpus/{meeting}/audio/{meeting}.Headset-{sp['ch']}.wav"
            urllib.request.urlretrieve(url, wav)
        r = subprocess.run(["node", os.path.join(ROOT, "evals/voicesig/train/extract.mjs"), wav, stem, rpath], capture_output=True, text=True, timeout=7200)
        if r.returncode != 0:
            return stem, "extract-fail " + r.stderr[-300:]
    except Exception as e:  # noqa: BLE001
        return stem, f"fail {e}"
    finally:
        if os.path.exists(wav):
            os.remove(wav)
    j = json.load(open(stem + ".json"))
    j.update({"corpus": "ami", "meeting": meeting, "speaker": sp["id"], "sex": sp["sex"], "l1": sp["l1"], "split": split, "words": lab, "audioFrom": src})
    j.update(to_f16(stem, j["width"]))
    json.dump(j, open(stem + ".json", "w"))
    return stem, "ok " + src


def to_f16(stem, width):
    """Halve the disk footprint (the box is shared and tight): the clock column stays float32 in <stem>.t.bin, the other
    columns (rmsDb, f0, speech, the 22 GRU inputs) go to float16 in <stem>.bin. evals/voicesig/r3/train_r3.py reads both."""
    import numpy as np
    a = np.fromfile(stem + ".bin", dtype="<f4").reshape(-1, width)
    a[:, 0].astype("<f4").tofile(stem + ".t.bin")
    a[:, 1:].astype("<f2").tofile(stem + ".bin")
    return {"dtype": "f2+t", "width16": width - 1}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--manual", required=True)
    ap.add_argument("--local-s16")
    ap.add_argument("--series", type=int, default=40)
    ap.add_argument("--train-meetings", type=int, default=2)
    ap.add_argument("--jobs", type=int, default=5)
    ap.add_argument("--only", default="test,val,train")
    ap.add_argument("--reverse", action="store_true", help="process the job list backwards (a second process sharing the work)")
    a = ap.parse_args()
    M = A.meta(a.manual)
    S15 = A.choose(M, 15)
    S = A.choose(M, a.series)
    assert S["test"] == S15["test"], "test split must equal the 2026-10-04 harness"
    series = {}
    for k in M:
        series.setdefault(k[:-1], []).append(k)
    train = []
    for k in S["train"]:
        ms = sorted(series[k[:-1]], key=lambda m: (m != k, m))  # the chosen meeting first, then the others
        train += ms[: a.train_meetings]
    plan = {"test": S["test"], "val": S["val"], "train": train}
    out = os.path.join(a.work, "feat")
    os.makedirs(out, exist_ok=True)
    json.dump(plan, open(os.path.join(a.work, "split.json"), "w"), indent=1)
    jobs = [(k, sp, split, out, a.manual, a.local_s16) for split in a.only.split(",") for k in plan[split] for sp in M[k]["spk"]]
    if a.reverse:
        jobs = jobs[::-1]
    print(json.dumps({k: len(v) for k, v in plan.items()}), len(jobs), "channels", flush=True)
    with ThreadPoolExecutor(a.jobs) as ex:
        for stem, st in ex.map(one, jobs):
            print(os.path.basename(stem), st, flush=True)


if __name__ == "__main__":
    main()
