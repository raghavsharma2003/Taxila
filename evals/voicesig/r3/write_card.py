"""Write the round-3 detector's files from a train_r3.py result: models/voicesig/filler-gru-r3.onnx (copied from the
exported candidate) and filler-gru-r3.json (the model card the device reads: threshold AND minimum run length, the hold
cue's measured pComplete, every number with its population, n, method and date). Run once, after review of the result.

  python3 -I evals/voicesig/r3/write_card.py <train result.json> <candidate> --pause-eval <pauses-eot-hi-*.json> --out models/voicesig
"""
import argparse, json, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("result")
    ap.add_argument("cand")
    ap.add_argument("--pause-eval", required=True)
    ap.add_argument("--out", default=os.path.join(ROOT, "models/voicesig"))
    a = ap.parse_args()
    r = json.load(open(a.result))
    c = r["candidates"][a.cand]
    op = c["val"]["opAtTarget"]
    t = c["test"]["atTarget"]
    pe = json.load(open(a.pause_eval))
    fired = pe["all"]["fired"]
    ends = fired - pe["all"]["precisionHold"]["k"]
    # pComplete = the upper 95% Wilson bound of P(turn end | fired) on the dyadic Hindi set: never argue harder than the data
    lo_hold = pe["all"]["precisionHold"]["ci95"][0]
    p_complete = round(min(0.49, max(0.05, 1 - lo_hold)), 3)
    dst = os.path.join(a.out, "filler-gru-r3.onnx")
    shutil.copyfile(c["export"]["path"], dst)
    card = {
        "name": "filler-gru-r3", "ver": f"filler-gru/2-{a.cand}",
        "task": "filled-pause (um/uh/er, Hindi aa/umm) per-frame detection on the product front-end",
        "input": "x [1, T, 22] float32 (src/voicesig/frontend/gruInput.ts, vsgru-in/1)", "output": "p [1, T] per-frame P(filled pause)",
        "threshold": op["thr"], "minRunMs": op["minFrames"] * 20,
        "operatingPoint": f"max VAL recall at VAL precision >= {r['target']} (pre-registered), chosen on val only; test read once",
        "platt": c.get("platt"),
        "trainingData": "AMI Meeting Corpus individual headsets (University of Edinburgh et al.), CC BY 4.0: 84 speakers / 32.7 h (warm start from filler-gru/1, itself AMI CC BY 4.0); FLEURS hi_in + en_us TRAIN read speech (Google), CC BY 4.0, as non-filler negatives. Commercial use permitted with attribution.",
        "notCovered": ["child speech (no licence-clean child corpus marks fillers; HiACC fire rates only, evaluation only)", "Hindi or Hinglish spontaneous fillers as POSITIVES (Hindi appears only as read-speech negatives)",
                       "phone microphones / AGC-processed capture", "bt / speakerphone routes (narrowband: unusable, the head and the hold cue ignore them)"],
        "metrics": {"population": "ADULT", "test": {"set": "AMI 8 Indian-L1 series, 32 held-out speakers (the 2026-10-04 harness)", "event": t["event"], "eventCi": t["eventCi"],
                    "eventIndianL1": t["eventIndianL1"], "wordAuroc": c["test"]["wordAuroc"]}, "fleursFalseAlarms": t["fleursFalseAlarms"], "val": op},
        "holdCue": {"pComplete": p_complete, "tailGapMs": pe["cfg"]["tailGapMs"], "readAfterMs": pe["cfg"]["readAfterMs"], "minFillerMs": op["minFrames"] * 20,
                    "measured": f"LiveKit EOT-Bench Hindi (CC BY 4.0, 400 ADULT turns): P(hold | fired) {pe['all']['precisionHold']['rate']} (Wilson 95% {pe['all']['precisionHold']['ci95']}), fired {fired}, at turn ends {ends}/{pe['all']['ends']}; pComplete = 1 - the lower bound", "at": pe["date"]},
        "date": r["date"], "params": c.get("params"), "bytes": os.path.getsize(dst),
        "results": "evals/voicesig/results/2026-10-09/filler-r3-train-eval.json",
        "attribution": "Contains information from the AMI Meeting Corpus (University of Edinburgh, IDIAP, TNO et al.), licensed CC BY 4.0, and from FLEURS (Google), licensed CC BY 4.0.",
    }
    json.dump(card, open(os.path.join(a.out, "filler-gru-r3.json"), "w"), indent=1)
    print(json.dumps(card, indent=1))


if __name__ == "__main__":
    main()
