# Objective prosody for the Polly clips with the SAME functions as docs/design/superhuman/voice-probe/splice.py metrics
# (f0 SD/range in semitones, inner pauses >=180 ms at -45 dB, pause SD). Polly 16 kHz renders resampled to 24 kHz (wav24/).
import sys, os, glob, json
import numpy as np
VP = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../docs/design/superhuman/voice-probe'))
sys.path.insert(0, VP); import splice
out = {}
for f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wav24/*.wav'))):
    x = splice.rd(f); SR = splice.SR; f0 = splice.f0_track(x)
    st = 12 * np.log2(f0 / np.median(f0)) if len(f0) > 10 else np.array([0.0])
    S = splice.silences(x, min_ms=180); inner = [(b - a) / SR for a, b in S if a > 0.05 * SR and b < len(x) - 0.05 * SR]
    out[os.path.basename(f)[:-4]] = {'dur': round(len(x) / SR, 2), 'f0_median': round(float(np.median(f0)), 1) if len(f0) else None, 'f0_sd_st': round(float(np.std(st)), 2),
        'pauses': len(inner), 'pause_sd_s': round(float(np.std(inner)), 3) if len(inner) > 1 else 0.0, 'max_pause_s': round(max(inner), 2) if inner else 0.0}
ref = json.load(open(os.path.join(VP, 'metrics.json')))
def arm(d, pre):
    v = [x for k, x in d.items() if k.startswith(pre)]
    return {'n': len(v), 'pause_sd_s': round(float(np.mean([x['pause_sd_s'] for x in v])), 3), 'f0_sd_st': round(float(np.mean([x['f0_sd_st'] for x in v])), 2), 'pauses_per_clip': round(float(np.mean([x['pauses'] for x in v])), 1), 'dur_s': round(float(np.mean([x['dur'] for x in v])), 2)}
summ = {'polly-kajal-neural': arm(out, 'polly-kajal-neural-hi'), 'polly-kajal-generative': arm(out, 'polly-kajal-gen-hi'),
        'dhd-diya plain (metrics.json)': arm({k: v for k, v in ref.items() if k.startswith('dhd-diya') and k.endswith('plain')}, 'dhd-diya'),
        'dhd-diya full layer (metrics.json)': arm({k: v for k, v in ref.items() if k.startswith('dhd-diya') and k.endswith('.spliced')}, 'dhd-diya'),
        'mai-priyaF plain (metrics.json)': arm({k: v for k, v in ref.items() if k.startswith('mai-priyaF') and k.endswith('plain')}, 'mai')}
for k, v in summ.items(): print(k, v)
json.dump({'date': '2026-10-04', 'method': 'voice-probe/splice.py metrics functions', 'summary': summ, 'clips': out}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results/prosody-metrics.json'), 'w'), indent=1)
