# Speech scout 2026-10-04: Amazon Transcribe STREAMING, ap-south-1 (Mumbai), on the stt-hinglish v2 corpus
# (docs/research/voice/v2/stt/audio, 183 clips). Fork of ../../model-refresh-2026-10-04/scout/transcribe-stream.py with
# the multi-language arm FIXED (that run passed language_options as a string and omitted language_code=None, so all
# 183 T3 calls errored before audio was sent). T1/T2 rows from that run are reused, not re-bought.
# Real-time pace: 100 ms PCM chunks, 16 kHz, so final-after-speech-end is comparable to the Azure arms.
# Run: python3 transcribe-stream.py <cfg> [concurrency] [limit]
#   T3 identify_multiple_languages over hi-IN,en-IN (preferred hi-IN)  - code-switch mode
#   T4 identify_language (one language per stream) over hi-IN,en-IN    - single LID
#   T5 hi-IN + custom vocabulary taxila-scout-hi (D4's 16 keywords + 6 decoys, see vocab.py)
import awsenv, os, sys, json, time, asyncio, subprocess
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
ROOT = awsenv.ROOT
STT = os.path.join(ROOT, 'docs/research/voice/v2/stt'); META = json.load(open(os.path.join(STT, 'clips-meta.json')))
CFG = sys.argv[1]; CONC = int(sys.argv[2]) if len(sys.argv) > 2 else 6
NAMES = {'T3': 'T3 aws-transcribe-stream multiLID hi-IN+en-IN', 'T4': 'T4 aws-transcribe-stream LID(single) hi-IN|en-IN', 'T5': 'T5 aws-transcribe-stream hi-IN + custom vocab'}
OUT = os.path.join(os.path.dirname(__file__), 'results', 'transcribe-rows.jsonl')
SR = 16000

def pcm_of(clip):
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(STT, 'audio', clip + '.ogg'), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout

class H(TranscriptResultStreamHandler):
    def __init__(self, s, t0):
        super().__init__(s); self.t0 = t0; self.final = []; self.first = None; self.lastFinal = None; self.langs = set()
    async def handle_transcript_event(self, ev):
        for r in ev.transcript.results:
            if not r.alternatives: continue
            now = (time.perf_counter() - self.t0) * 1000
            if self.first is None and r.alternatives[0].transcript: self.first = now
            if not r.is_partial:
                self.final.append(r.alternatives[0].transcript); self.lastFinal = now
                if getattr(r, 'language_code', None): self.langs.add(r.language_code)

async def one(clip, sem):
    async with sem:
        pcm = pcm_of(clip); client = TranscribeStreamingClient(region='ap-south-1')
        kw = dict(media_sample_rate_hz=SR, media_encoding='pcm')
        if CFG == 'T3': kw.update(language_code=None, identify_multiple_languages=True, language_options=['hi-IN', 'en-IN'], preferred_language='hi-IN')
        elif CFG == 'T4': kw.update(language_code=None, identify_language=True, language_options=['hi-IN', 'en-IN'], preferred_language='hi-IN')
        elif CFG == 'T5': kw.update(language_code='hi-IN', vocabulary_name='taxila-scout-hi')
        t0 = time.perf_counter()
        try:
            stream = await client.start_stream_transcription(**kw)
            h = H(stream.output_stream, t0)
            async def feed():
                step = SR * 2 // 10
                for i in range(0, len(pcm), step):
                    await stream.input_stream.send_audio_event(audio_chunk=pcm[i:i + step]); await asyncio.sleep(0.1)
                await stream.input_stream.end_stream()
            await asyncio.gather(feed(), h.handle_events())
            end = META.get(clip, {}).get('endMs')
            row = {'clip': clip, 'cfg': NAMES[CFG], 'text': ' '.join(h.final).strip(), 'reqMs': round((time.perf_counter() - t0) * 1000), 'firstPartialMs': round(h.first) if h.first else None,
                   'finalAfterEndMs': round(h.lastFinal - end) if (h.lastFinal and end) else None, 'langs': sorted(h.langs), 'audioSec': round(len(pcm) / SR / 2, 2)}
        except Exception as e:
            row = {'clip': clip, 'cfg': NAMES[CFG], 'text': '', 'err': str(e)[:300]}
        with open(OUT, 'a') as f: f.write(json.dumps(row, ensure_ascii=False) + '\n')
        return row

async def main():
    clips = sorted(c[:-4] for c in os.listdir(os.path.join(STT, 'audio')) if c.endswith('.ogg'))
    if len(sys.argv) > 3: clips = clips[:int(sys.argv[3])]
    sem = asyncio.Semaphore(CONC); rows = await asyncio.gather(*(one(c, sem) for c in clips))
    print(CFG, len(rows), 'errs', sum(1 for r in rows if r.get('err')), 'audio min', round(sum(r.get('audioSec', 0) for r in rows) / 60, 1))
    for r in rows[:3]: print(r)
asyncio.run(main())
