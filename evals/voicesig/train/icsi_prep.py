"""ICSI Meeting Corpus (CC BY 4.0, licence read at source 2026-10-04: groups.inf.ed.ac.uk/ami/icsi/license.shtml) ->
CROSS-CORPUS test set for the filler detector (never trained on). Only the headset-mix ("interaction") wav is distributed
there, so labels pool every speaker: frames inside any speaker's um/uh word = 1, inside any other word = 0, and frames
where two speakers' words overlap = ignore. Different site (Berkeley), mics, recording years and task than AMI.

usage: python3 icsi_prep.py <work_dir> [meeting ...]
"""
import json, os, re, subprocess, sys, urllib.request, zipfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
BASE = "https://groups.inf.ed.ac.uk/ami"
FILLER = {"um", "uh", "uhm", "er", "erm"}
IGNORE = {"mm", "hmm", "mm-hmm", "uh-huh", "ah", "eh", "huh"}
DEFAULT = ["Bmr013", "Bro018", "Bed003", "Bns002", "Btr001"]


def words(core, meeting):
    out = []
    d = os.path.join(core, "ICSI/Words")
    for f in sorted(os.listdir(d)):
        if not f.startswith(meeting + "."):
            continue
        agent = f.split(".")[1]
        for m in re.finditer(r'<w [^>]*starttime="([\d.]+)" endtime="([\d.]+)"[^>]*c="W"[^>]*>([^<]*)</w>', open(os.path.join(d, f), encoding="latin-1").read()):
            s, e, w = float(m.group(1)), float(m.group(2)), m.group(3).strip().lower()
            if e - s < 0.04:
                continue
            lab = 1 if w in FILLER else (-1 if w in IGNORE else 0)
            out.append([round(s, 3), round(e, 3), lab, agent])
    out.sort()
    # overlap between different speakers -> ignore both
    for i in range(len(out)):
        for j in range(i + 1, len(out)):
            if out[j][0] >= out[i][1]:
                break
            if out[j][3] != out[i][3]:
                out[i][2] = out[j][2] = -1
    return [[s, e, lab, ""] for s, e, lab, _ in out]


def main():
    work = sys.argv[1]
    meetings = sys.argv[2:] or DEFAULT
    os.makedirs(os.path.join(work, "feat"), exist_ok=True)
    z = os.path.join(work, "core.zip")
    core = os.path.join(work, "core")
    if not os.path.isdir(core):
        if not os.path.exists(z):
            urllib.request.urlretrieve(f"{BASE}/ICSICorpusAnnotations/ICSI_core_NXT.zip", z)
        zipfile.ZipFile(z).extractall(core)
    for m in meetings:
        stem = os.path.join(work, "feat", m)
        if os.path.exists(stem + ".json"):
            continue
        wav = stem + ".wav"
        urllib.request.urlretrieve(f"{BASE}/ICSIsignals/NXT/{m}.interaction.wav", wav)
        try:
            import soundfile as sf
            info = sf.info(wav)
            if info.samplerate != 16000 or info.channels != 1 or info.subtype != "PCM_16":
                x, sr = sf.read(wav, dtype="float32", always_2d=True)
                x = x.mean(axis=1)
                if sr != 16000:
                    from scipy.signal import resample_poly
                    x = resample_poly(x, 16000, sr)
                sf.write(wav, x, 16000, subtype="PCM_16")
            r = subprocess.run(["node", os.path.join(ROOT, "evals/voicesig/train/extract.mjs"), wav, stem], capture_output=True, text=True, timeout=3600)
            print(m, r.stdout.strip() or r.stderr[-300:], flush=True)
        finally:
            os.remove(wav)
        j = json.load(open(stem + ".json"))
        j.update({"corpus": "icsi", "meeting": m, "speaker": "mix", "sex": "", "l1": "", "split": "xcorpus", "words": words(core, m)})
        json.dump(j, open(stem + ".json", "w"))


if __name__ == "__main__":
    main()
