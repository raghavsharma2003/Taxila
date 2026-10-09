"""Round 3 voicesig: thinking pause vs turn end on AMI (CC BY 4.0), with GOLD filler words, as a check on pauses.mjs.

Events (the VAP / Brahimi-et-al. 2026 definition): a mutual silence >= 250 ms (no speaker's word, from the manual word
times of all four speakers) preceded by >= 1 s of one speaker's speech; HOLD when the same speaker speaks next, SHIFT when
another speaker does. Backchannel tokens (mm, hmm, mm-hmm, uh-huh, yeah, okay, right alone) never count as the next
speaker's turn. The speaker before the silence is S; the cue runs on S's OWN headset features (the product front-end,
ami_prep_r3.py), reading the detector over the 3 s before the silence + 120 ms of it, exactly as src/voicesig/holdCue.ts
(trailingFiller below is a line-for-line port; the unit test pins the TypeScript one to the same cases).

Reported: (1) the ceiling: P(hold | S's last word is a GOLD filler um/uh) vs P(hold) overall; (2) the cue: P(hold | cue
fired), its recall of holds, and how often it fires before a shift; (3) the detector as a trailing-filler detector
against the gold last word (precision / recall). ADULT English meetings (Indian-L1 series); not children.

  python3 -I evals/voicesig/r3/ami_pauses.py <ami feat dir> --model <onnx> --thr <p> --out <json> [--split test]
"""
import argparse, glob, json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from train_r3 import load16  # noqa: E402

BACKCHANNEL = {"mm", "hmm", "mm-hmm", "uh-huh", "mm-mm", "yeah", "yep", "okay", "ok", "right", "huh", "ah", "oh"}
FILLER = {"um", "uh", "uhm", "er", "erm", "umm", "uhh"}


def trailing_filler(speech, p, off, thr, min_ms=200, tail_ms=120, hop=20):
    need = -(-min_ms // hop)
    max_gap = tail_ms // hop
    end = -1
    for i in range(off, max(0, off - max_gap) - 1, -1):
        if speech[i] and p[i] >= thr:
            end = i
            break
    if end < 0:
        return False, 0
    s = end
    while s - 1 >= 0 and speech[s - 1] and p[s - 1] >= thr:
        s -= 1
    return (end - s + 1) >= need, (end - s + 1) * hop


def raw_words(manual, meeting, agent):
    import re
    p = os.path.join(manual, "words", f"{meeting}.{agent}.words.xml")
    out = []
    for m in re.finditer(r'<w [^>]*starttime="([\d.]+)" endtime="([\d.]+)"([^>]*)>([^<]*)</w>', open(p, encoding="latin-1").read()):
        if "punc=" in m.group(3):
            continue
        out.append((float(m.group(1)), float(m.group(2)), m.group(4).strip().lower()))
    return out


def events(meeting_words):
    """meeting_words: {agent: [(s, e, w)]} -> [(agent, silence_start, silence_end, label, last_word)].
    Floor activity = every word that is not another speaker's backchannel (a listener's "mm" does not take the floor)."""
    toks = sorted((s, e, w, a) for a, ws in meeting_words.items() for s, e, w in ws if e > s)
    floor = [x for x in toks if x[2] not in BACKCHANNEL]
    out = []
    # union of floor-word intervals; a gap >= 250 ms between union segments is a mutual silence
    seg_end, last = None, None  # running union end, and the word that set it
    for i, x in enumerate(floor):
        s, e, w, a = x
        if seg_end is not None and s - seg_end >= 0.25 and last is not None:
            S = last[3]
            g0, g1 = seg_end, s
            # >= 1 s of S's speech before, with no other speaker's floor word in that second
            own = [y for y in floor[max(0, i - 80):i] if y[3] == S and y[1] > g0 - 1.0]
            other = [y for y in floor[max(0, i - 80):i] if y[3] != S and y[1] > g0 - 1.0]
            run_start = min((y[0] for y in own), default=g0)
            if own and not other and run_start <= g0 - 1.0 + 0.3:
                out.append((S, g0, g1, "hold" if a == S else "shift", last[2]))
        if seg_end is None or e > seg_end:
            seg_end, last = e, x
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("feat")
    ap.add_argument("--manual", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--thr", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--split", default="test")
    ap.add_argument("--minms", type=int, default=200, help="the operating point's minimum filler run (model card minRunMs)")
    a = ap.parse_args()
    import onnxruntime as ort
    sess = ort.InferenceSession(a.model, providers=["CPUExecutionProvider"])
    stems = sorted(f[:-5] for f in glob.glob(os.path.join(a.feat, "*.json")) if not f.endswith(".regions.json"))
    files = {}
    for s in stems:
        j = json.load(open(s + ".json"))
        if j.get("split") == a.split and j.get("corpus") == "ami":
            files[(j["meeting"], os.path.basename(s).split(".")[1])] = s
    meetings = sorted({m for m, _ in files})
    rows = []
    for m in meetings:
        agents = sorted(ag for mm, ag in files if mm == m)
        mw = {ag: raw_words(a.manual, m, ag) for ag in agents}
        ev = events(mw)
        cache = {}
        for ag, s0, s1, label, last in ev:
            if ag not in cache:
                d = load16(files[(m, ag)])
                cache[ag] = d
            d = cache[ag]
            t = d["t"]
            i0 = np.searchsorted(t, (s0 - 3.0) * 1000)
            i1 = np.searchsorted(t, (s0 + 0.12) * 1000, "right")
            if i1 - i0 < 15 or (t[i1 - 1] - t[i0]) / 20 > (i1 - i0) + 5:  # a clock jump inside (region edge): skip
                continue
            x = d["x"][i0:i1][None]
            p = sess.run(None, {"x": x})[0][0]
            sp = d["speech"][i0:i1] > 0
            off = -1
            for i in range(len(sp) - 1, -1, -1):
                if sp[i] and t[i0 + i] <= s0 * 1000 + 60:
                    off = i
                    break
            if off < 0:
                continue
            fired, run = trailing_filler(sp, p, off, a.thr, min_ms=a.minms)
            rows.append({"m": m, "spk": f"{m}.{ag}", "label": label, "gapMs": round((s1 - s0) * 1000), "goldFiller": last in FILLER, "fired": bool(fired), "runMs": int(run)})

    def rate(k, n):
        if not n:
            return {"k": k, "n": n, "rate": None}
        z = 1.96
        p = k / n
        d = 1 + z * z / n
        c = (p + z * z / (2 * n)) / d
        h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
        return {"k": k, "n": n, "rate": round(p, 3), "ci95": [round(c - h, 3), round(c + h, 3)]}
    H = [r for r in rows if r["label"] == "hold"]
    S = [r for r in rows if r["label"] == "shift"]
    G = [r for r in rows if r["goldFiller"]]
    F = [r for r in rows if r["fired"]]
    res = {
        "label": "AMI Meeting Corpus (CC BY 4.0), test split (Indian-L1 series), ADULT English meetings, own headset channel; gold word times for events and fillers. Not children.",
        "model": os.path.relpath(a.model, os.path.abspath(os.path.join(HERE, "../../.."))), "thr": a.thr, "minMs": a.minms, "events": len(rows), "holds": len(H), "shifts": len(S),
        "baseHold": rate(len(H), len(rows)),
        "ceiling_PholdGivenGoldFillerLast": rate(sum(r["label"] == "hold" for r in G), len(G)),
        "cue_PholdGivenFired": rate(sum(r["label"] == "hold" for r in F), len(F)),
        "cue_holdRecall": rate(sum(r["fired"] for r in H), len(H)),
        "cue_firedBeforeShift": rate(sum(r["fired"] for r in S), len(S)),
        "detectorVsGoldTrailingFiller": {"precision": rate(sum(r["goldFiller"] for r in F), len(F)), "recall": rate(sum(r["fired"] for r in G), len(G))},
        "goldFillerLastShare": rate(len(G), len(rows)),
    }
    json.dump({**res, "rows": rows}, open(a.out, "w"), indent=1)
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
