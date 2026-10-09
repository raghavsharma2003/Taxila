"""Round 3 (voicesig): FLEURS read speech through the PRODUCT front-end, in two roles.
  dev15   EXACTLY the 2026-10-04 false-alarm harness (evals/voicesig/train/fleurs_prep.py): the first ~15 min of the
          hi_in / en_us DEV tar, 0.8 s noise gaps, one continuous session per language. Same rng seed, same order, so the
          shipped detector's 3.80 (hi) / 3.36 (en) false runs per speech-minute are re-measured on the same input.
  devall  every dev utterance (more speech-minutes, tighter interval); evaluation only.
  train   hard NEGATIVES for the detector: read speech has essentially no filled pauses, so every speech frame is labelled
          0 (non-filler) and silence is ignored. The TRAIN tar only (FLEURS train speakers are disjoint from dev/test
          speakers per the dataset card, read 2026-10-09), chunked into ~10 min sessions.
FLEURS (google/fleurs on Hugging Face, NOT gated), licence CC BY 4.0 (dataset card, read 2026-10-04 and 2026-10-09):
commercial use with attribution, so training negatives on it is permitted. The tar is STREAMED (never saved); each wav
is deleted after the front-end reduced it to numbers.

  python3 -I evals/voicesig/r3/fleurs_prep_r3.py <work> [--train-min hi_in=120,en_us=60] [--roles dev15,devall,train]
"""
import io, json, os, subprocess, sys, tarfile, urllib.request
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
URL = "https://huggingface.co/datasets/google/fleurs/resolve/main/data/{lang}/audio/{split}.tar.gz"


def utterances(lang, split):
    """Stream (name, float32 16 kHz mono) from the tar without saving it."""
    with urllib.request.urlopen(URL.format(lang=lang, split=split)) as r:
        with tarfile.open(fileobj=r, mode="r|gz") as tf:
            for m in tf:
                if not m.isfile() or not m.name.endswith(".wav"):
                    continue
                x, sr = sf.read(io.BytesIO(tf.extractfile(m).read()), dtype="float32")
                if x.ndim > 1:
                    x = x.mean(axis=1)
                if sr != 16000:
                    from scipy.signal import resample_poly
                    x = resample_poly(x, 16000, sr).astype(np.float32)
                yield m.name, x


def extract(stem, y, meta):
    wav = stem + ".wav"
    sf.write(wav, np.clip(y, -1, 1), 16000, subtype="PCM_16")
    try:
        r = subprocess.run(["node", os.path.join(ROOT, "evals/voicesig/train/extract.mjs"), wav, stem], capture_output=True, text=True, timeout=3600)
        if r.returncode != 0:
            raise RuntimeError(r.stderr[-300:])
    finally:
        os.remove(wav)
    j = json.load(open(stem + ".json"))
    j.update(meta)
    json.dump(j, open(stem + ".json", "w"))
    print(os.path.basename(stem), json.dumps({k: meta[k] for k in ("split", "speechS")}), flush=True)


def session(lang, split, minutes, rng, lead=True):
    parts, total, names = [], 0.0, []
    for name, x in utterances(lang, split):
        parts.append(x)
        parts.append((rng.standard_normal(int(0.8 * 16000)) * 3e-4).astype(np.float32))
        total += len(x) / 16000
        names.append(name)
        if minutes and total >= minutes * 60:
            yield parts, total, names
            parts, total, names = [], 0.0, []
    if parts:
        yield parts, total, names


def main():
    work = sys.argv[1]
    arg = lambda f, d: sys.argv[sys.argv.index(f) + 1] if f in sys.argv else d
    roles = arg("--roles", "dev15,devall,train").split(",")
    train_min = dict(kv.split("=") for kv in arg("--train-min", "hi_in=120,en_us=60").split(","))
    out = os.path.join(work, "feat")
    os.makedirs(out, exist_ok=True)
    for lang in ("hi_in", "en_us"):
        if "dev15" in roles and not os.path.exists(os.path.join(out, f"{lang}.dev15.json")):
            rng = np.random.default_rng(1)  # == fleurs_prep.py
            parts, total = [], 0.0
            for _, x in utterances(lang, "dev"):
                parts.append(x)
                parts.append((rng.standard_normal(int(0.8 * 16000)) * 3e-4).astype(np.float32))
                total += len(x) / 16000
                if total >= 15 * 60:
                    break
            y = np.concatenate([(rng.standard_normal(16000) * 3e-4).astype(np.float32)] + parts)
            extract(os.path.join(out, f"{lang}.dev15"), y, {"corpus": "fleurs", "meeting": lang, "speaker": lang, "sex": "", "l1": lang, "split": "falsealarm", "words": [], "speechS": round(total, 1), "role": "dev15"})
        if "devall" in roles and not os.path.exists(os.path.join(out, f"{lang}.devall.0.json")):
            rng = np.random.default_rng(2)
            for k, (parts, total, _) in enumerate(session(lang, "dev", 0, rng)):
                y = np.concatenate([(rng.standard_normal(16000) * 3e-4).astype(np.float32)] + parts)
                extract(os.path.join(out, f"{lang}.devall.{k}"), y, {"corpus": "fleurs", "meeting": lang, "speaker": lang, "sex": "", "l1": lang, "split": "falsealarm_all", "words": [], "speechS": round(total, 1), "role": "devall"})
        if "train" in roles and not os.path.exists(os.path.join(out, f"{lang}.train.0.json")):
            rng = np.random.default_rng(3)
            budget = float(train_min.get(lang, 0)) * 60
            got = 0.0
            for k, (parts, total, _) in enumerate(session(lang, "train", 10, rng)):
                y = np.concatenate([(rng.standard_normal(16000) * 3e-4).astype(np.float32)] + parts)
                extract(os.path.join(out, f"{lang}.train.{k}"), y, {"corpus": "fleurs", "meeting": f"{lang}-train-{k}", "speaker": f"fleurs-{lang}-train", "sex": "", "l1": lang, "split": "train_neg", "words": [], "speechS": round(total, 1), "role": "train"})
                got += total
                if got >= budget:
                    break


if __name__ == "__main__":
    main()
