"""AMI Meeting Corpus (CC BY 4.0, licence read at source 2026-10-04: groups.inf.ed.ac.uk/ami/corpus/license.shtml) ->
filled-pause training/eval data for the on-device filler detector (SPEC F3 acoustic). Licence-clean for a shipped model
(commercial use permitted, attribution: "AMI Meeting Corpus, University of Edinburgh et al., CC BY 4.0").

For each chosen meeting: download each individual-headset wav, run the PRODUCT front-end over it
(evals/voicesig/train/extract.mjs -> src/voicesig/frontend), write per-frame features, then DELETE the wav (only numbers
are kept). Labels come from the manual word annotations (ami_public_manual_1.6.2): frames inside the channel owner's
"um/uh/uhm/er/erm" words = 1, inside the owner's other words = 0, everything else (silence, crosstalk, backchannels
mm/hmm/mm-hmm/uh-huh, laughter) = ignore.

Split (speaker-disjoint, by meeting series so a speaker never crosses splits):
  test  = every series with an Indian-L1 speaker (Hindi, Telugu, Tamil, ...): the closest public proxy to our population
  train / val = other series, val = every 5th series
Any series whose speakers also appear in another split is dropped (asserted).

usage: python3 ami_prep.py <work_dir> [--train N] [--jobs 4]
"""
import argparse, collections, json, os, re, subprocess, sys, urllib.request, zipfile
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
BASE = "https://groups.inf.ed.ac.uk/ami"
FILLER = {"um", "uh", "uhm", "er", "erm", "umm", "uhh"}
IGNORE = {"mm", "hmm", "mm-hmm", "uh-huh", "mm-mm", "ah", "eh", "huh"}
IND = {"Hindi", "Telugu", "Tamil", "Malayalam", "Konkani"}
PAD, MERGE = 2.0, 4.0


def meta(manual):
    P = {}
    src = open(os.path.join(manual, "corpusResources/participants.xml"), encoding="latin-1").read()
    for m in re.finditer(r'<participant nite:id="([^"]+)" sex="([^"]*)"[^>]*?native_language="([^"]*)"', src):
        P[m.group(1)] = {"sex": m.group(2), "l1": m.group(3)}
    M = collections.OrderedDict()
    src = open(os.path.join(manual, "corpusResources/meetings.xml"), encoding="latin-1").read()
    for m in re.finditer(r'<meeting [^>]*observation="([^"]+)"[^>]*duration="(\d*)"[^>]*>(.*?)</meeting>', src, re.S):
        sp = re.findall(r'channel="(\d+)" nxt_agent="(\w)"[^>]*global_name="([^"]+)"', m.group(3))
        M[m.group(1)] = {"dur": int(m.group(2) or 0), "spk": [{"ch": int(c), "agent": a, "id": g, **P.get(g, {"sex": "", "l1": ""})} for c, a, g in sp]}
    return M


def words(manual, meeting, agent):
    p = os.path.join(manual, "words", f"{meeting}.{agent}.words.xml")
    out = []
    for m in re.finditer(r'<w [^>]*starttime="([\d.]+)" endtime="([\d.]+)"([^>]*)>([^<]*)</w>', open(p, encoding="latin-1").read()):
        if "punc=" in m.group(3):
            continue
        s, e, w = float(m.group(1)), float(m.group(2)), m.group(4).strip().lower()
        if e - s < 0.04:
            continue
        lab = 1 if w in FILLER else (-1 if w in IGNORE else 0)
        out.append([round(s, 3), round(e, 3), lab, w if lab == 1 else ""])
    return out


def choose(M, n_train):
    series = collections.OrderedDict()
    for k in M:
        series.setdefault(k[:-1], []).append(k)
    def spk(s):
        return {p["id"] for k in series[s] for p in M[k]["spk"]}
    test = [s for s in series if any(p["l1"] in IND for k in series[s] for p in M[k]["spk"])]
    test_spk = set().union(*(spk(s) for s in test))
    rest = [s for s in series if s not in test and not (spk(s) & test_spk) and re.match(r"^(ES|IS|TS)\d{4}$", s)]
    rest = rest[:n_train]
    val = rest[::5]
    train = [s for s in rest if s not in val]
    used = {}
    for name, ss in (("train", train), ("val", val), ("test", test)):
        for s in ss:
            for p in spk(s):
                assert used.get(p, name) == name, f"speaker {p} in {used[p]} and {name}"
                used[p] = name
    pick = lambda ss: [next((k for k in series[s] if k.endswith("b")), series[s][0]) for s in ss]
    return {"train": pick(train), "val": pick(val), "test": pick(test)}


def one(job):
    meeting, sp, split, out, manual = job
    stem = os.path.join(out, f"{meeting}.{sp['agent']}")
    if os.path.exists(stem + ".json"):
        return stem, "cached"
    wav = stem + ".wav"
    url = f"{BASE}/AMICorpusMirror/amicorpus/{meeting}/audio/{meeting}.Headset-{sp['ch']}.wav"
    lab = words(manual, meeting, sp["agent"])
    # Analyse only where the channel owner talks (+-PAD s, gaps < MERGE s bridged): ~3x less CPU on a shared box.
    reg = []
    for s, e, _, _ in lab:
        a, b = max(0.0, s - PAD), e + PAD
        if reg and a - reg[-1][1] < MERGE:
            reg[-1][1] = max(reg[-1][1], b)
        else:
            reg.append([a, b])
    rpath = stem + ".regions.json"
    json.dump(reg, open(rpath, "w"))
    try:
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
    j.update({"corpus": "ami", "meeting": meeting, "speaker": sp["id"], "sex": sp["sex"], "l1": sp["l1"], "split": split, "words": lab})
    json.dump(j, open(stem + ".json", "w"))
    return stem, "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--train", type=int, default=15)
    ap.add_argument("--jobs", type=int, default=4)
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    z = os.path.join(a.work, "ami_manual.zip")
    manual = os.path.join(a.work, "manual")
    if not os.path.isdir(manual):
        if not os.path.exists(z):
            urllib.request.urlretrieve(f"{BASE}/AMICorpusAnnotations/ami_public_manual_1.6.2.zip", z)
        zipfile.ZipFile(z).extractall(manual)
    M = meta(manual)
    S = choose(M, a.train)
    out = os.path.join(a.work, "feat")
    os.makedirs(out, exist_ok=True)
    json.dump(S, open(os.path.join(a.work, "split.json"), "w"), indent=1)
    jobs = [(k, sp, split, out, manual) for split, ks in S.items() for k in ks for sp in M[k]["spk"]]
    print(json.dumps({k: len(v) for k, v in S.items()}), len(jobs), "channels", flush=True)
    with ThreadPoolExecutor(a.jobs) as ex:
        for stem, st in ex.map(one, jobs):
            print(os.path.basename(stem), st, flush=True)


if __name__ == "__main__":
    main()
