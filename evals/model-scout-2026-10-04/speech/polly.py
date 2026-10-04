# Speech scout 2026-10-04: Amazon Polly on the HUMAN-VOICE Hinglish lines (docs/design/superhuman/voice-probe/lines.mjs,
# TEST STIMULI ONLY). Only Hindi-capable Polly voice is Kajal (en-IN, AdditionalLanguageCodes hi-IN):
#   neural in ap-south-1 + us-east-1; generative in us-east-1 ONLY (DescribeVoices, 2026-10-04).
# Usage: python3 polly.py render   -> wav/<arm>__<line>__plain.wav (16 kHz PCM wrapped as wav), plain text, no SSML
#        python3 polly.py ttfb [N] -> results/polly-ttfb.json : time to first audio byte of a STREAMED SynthesizeSpeech
#   (same sentence as voice-probe/latency.mjs S1), plus a DescribeVoices round trip per region as the network floor.
import awsenv, boto3, json, os, sys, time, wave, statistics, subprocess
from botocore.config import Config
HERE = os.path.dirname(os.path.abspath(__file__))
LINES = json.loads(subprocess.run(['node', '-e', 'import("' + os.path.join(awsenv.ROOT, 'docs/design/superhuman/voice-probe/lines.mjs') + '").then(m=>console.log(JSON.stringify(m.LINES)))'], capture_output=True, text=True, check=True).stdout)
ARMS = {
    'polly-kajal-neural-hi-aps1': ('ap-south-1', 'neural', 'hi-IN'),
    'polly-kajal-neural-en-aps1': ('ap-south-1', 'neural', 'en-IN'),
    'polly-kajal-gen-hi-use1': ('us-east-1', 'generative', 'hi-IN'),
    'polly-kajal-gen-en-use1': ('us-east-1', 'generative', 'en-IN'),
}
CL = {r: boto3.client('polly', region_name=r, config=Config(retries={'max_attempts': 3})) for r in ('ap-south-1', 'us-east-1')}
def synth(arm, text):
    reg, eng, lang = ARMS[arm]
    return CL[reg].synthesize_speech(Engine=eng, VoiceId='Kajal', LanguageCode=lang, OutputFormat='pcm', SampleRate='16000', Text=text, TextType='text')
S1 = "अरे! पहली बार में ही? तुमने ऊपर और नीचे दोनों को चार से divide किया।"
cmd = sys.argv[1]; chars = 0
if cmd == 'render':
    for arm in ARMS:
        for L in LINES:
            r = synth(arm, L['text']); pcm = r['AudioStream'].read(); chars += int(r['RequestCharacters'])
            f = os.path.join(HERE, 'wav', f"{arm}__{L['id']}__plain.wav")
            with wave.open(f, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(pcm)
            print(arm, L['id'], round(len(pcm) / 32000, 2), 's')
    print('chars billed', chars)
elif cmd == 'ttfb':
    N = int(sys.argv[2]) if len(sys.argv) > 2 else 20; raw = {k: [] for k in ARMS}; floor = {r: [] for r in CL}
    for r in CL: CL[r].describe_voices(LanguageCode='hi-IN')  # warm the connection pool; not counted
    for k in ARMS: synth(k, 'नमस्ते').get('AudioStream').read()  # warm-up per arm, not counted
    for i in range(N):
        for r in CL:
            t0 = time.perf_counter(); CL[r].describe_voices(LanguageCode='hi-IN'); floor[r].append(round((time.perf_counter() - t0) * 1000))
        for k in ARMS:
            t0 = time.perf_counter(); resp = synth(k, S1); s = resp['AudioStream']; b = s.read(1024); ttfb = (time.perf_counter() - t0) * 1000
            rest = s.read(); total = (time.perf_counter() - t0) * 1000; chars += int(resp['RequestCharacters'])
            raw[k].append({'ttfb': round(ttfb), 'total': round(total), 'audio_s': round((len(b) + len(rest)) / 32000, 2)}); time.sleep(0.3)
    q = lambda a, p: sorted(a)[min(len(a) - 1, int(p * len(a)))]
    summ = {k: {'n': len(v), 'ttfb_p50': q([x['ttfb'] for x in v], .5), 'ttfb_p90': q([x['ttfb'] for x in v], .9), 'ttfb_max': max(x['ttfb'] for x in v), 'total_p50': q([x['total'] for x in v], .5), 'audio_s_p50': q([x['audio_s'] for x in v], .5)} for k, v in raw.items()}
    fl = {r: {'n': len(v), 'p50': q(v, .5), 'p90': q(v, .9)} for r, v in floor.items()}
    for k, v in summ.items(): print(k, v)
    print('floor (DescribeVoices round trip)', fl, 'chars', chars)
    json.dump({'date': '2026-10-04', 'from': 'US cloud container (through agent proxy) -> Polly ap-south-1 / us-east-1', 'sentence': S1, 'summary': summ, 'floor_describe_voices_ms': fl, 'chars_billed': chars, 'raw': raw}, open(os.path.join(HERE, 'results', 'polly-ttfb.json'), 'w'), ensure_ascii=False, indent=1)
