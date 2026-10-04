# Polish r2 vision judge (TECH-PLAN §8): atomic 20-item checklist, single candidate vs its concept, two judge families
# (GPT = DEPLOY_BRAIN, Grok = grok-4-20-non-reasoning), 128 px and 1024 px. Advisory only (rj-holistic-model-judge-gate).
#   python judge2.py sanity  <out.json>            # sanity battery: rejected faces vs c-front, ref-vs-ref pairs
#   python judge2.py run <stimuli_dir> <out.json>  # the 6 round-2 stimuli (pose_j_*.png from render3.mjs)
# Prints no secrets. Keys come from the gitignored .env.local.
import os, sys, json, base64, io, re, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

R = '/home/user/Taxila/'
HERE = os.path.dirname(os.path.abspath(__file__))
env = {}
for l in open(R + '.env.local'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k] = v.strip().strip('"')
FAMILIES = {'gpt': env['DEPLOY_BRAIN'], 'grok': 'grok-4-20-non-reasoning', 'grokfast': 'grok-4-1-fast-non-reasoning', 'mistral': 'Mistral-Large-3'}
PROMPT = open(os.path.join(HERE, 'prompt.txt')).read()
C = R + 'docs/design/teacher/stylised/concepts/'
REF = R + 'docs/design/teacher/stylised/build/refs/'
T = R + 'docs/design/teacher/'


def b64(path, size, crop=None):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop(crop)
    im = im.resize((size, int(size * im.height / im.width)), Image.LANCZOS)
    bio = io.BytesIO(); im.save(bio, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode()


def call(family, ref, cand, size, state, crop=None):
    content = [{"type": "text", "text": PROMPT.replace('{STATE}', state)},
               {"type": "text", "text": "Image REF:"}, {"type": "image_url", "image_url": {"url": b64(ref, size)}},
               {"type": "text", "text": "Image X:"}, {"type": "image_url", "image_url": {"url": b64(cand, size, crop)}}]
    body = {"model": FAMILIES[family], "messages": [{"role": "user", "content": content}]}
    body["max_completion_tokens" if family == 'gpt' else "max_tokens"] = 6000 if family == 'gpt' else 2500
    if family != 'gpt':
        body["temperature"] = 0.2
    req = urllib.request.Request(env['AZURE_OPENAI_ENDPOINT'].rstrip('/') + '/chat/completions', data=json.dumps(body).encode(),
                                 headers={'api-key': env['AZURE_OPENAI_API_KEY'], 'Content-Type': 'application/json'})
    for attempt in range(4):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=300))
            txt = r['choices'][0]['message']['content']
            m = re.search(r'\{.*\}', txt, re.S)
            return {'model': r.get('model'), 'json': json.loads(m.group(0)), 'usage': r.get('usage', {})}
        except urllib.error.HTTPError as e:
            err = f'HTTP {e.code}'
            time.sleep(10 * (attempt + 1))
        except Exception as e:
            err = str(e)[:200]
            time.sleep(5)
    return {'error': err}


def run_jobs(jobs, out):
    def one(j):
        r = call(j['family'], j['ref'], j['cand'], j['size'], j.get('state', 'neutral'), j.get('crop'))
        return {**{k: v for k, v in j.items() if k not in ('ref', 'cand')}, 'ref': os.path.relpath(j['ref'], R),
                'cand': os.path.relpath(j['cand'], R), **r}
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(one, jobs))
    json.dump(res, open(out, 'w'), indent=1)
    return res


def passed(r):
    j = r.get('json') or {}
    it = j.get('items', {})
    ok = lambda k: bool(it.get(k, [False])[0]) if isinstance(it.get(k), list) else bool(it.get(k))
    return {'same': ok('1'), 'register': ok('2'), 'not_uncanny': ok('3'), 'score': j.get('score'),
            'items': {k: ok(k) for k in map(str, range(1, 21))}}


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'sanity':
        out = sys.argv[2]
        sfams = sys.argv[3].split(',') if len(sys.argv) > 3 else ['gpt', 'grok']
        neg = [T + 'bakeoff/stylised-premium/renders/teal/emotions/warm.png', T + 'bakeoff/gnm/renders/teal/emotions/warm.png',
               T + 'bakeoff/procedural-v3/renders/teal/emotions/warm.png', T + 'bakeoff/merged/renders/teal/emotions/warm.png',
               T + 'renders/plum/emotions/warm.png', T + 'renders/slate/emotions/warm.png',
               '/tmp/claude-0/r2/A_r1_front.png', '/tmp/claude-0/r2/B_r1_front.png']
        pos = [REF + 'neutral.webp', REF + 'front-ortho.webp', REF + 'q3-left.webp', REF + 'q3-right.webp',
               C + 'c-talking.webp', C + 'c-listening.webp', C + 'c-thinking.webp', C + 'c-happy.webp']
        jobs = []
        for fam in sfams:
            for size in (1024, 128):
                for p in neg:
                    jobs.append({'family': fam, 'size': size, 'kind': 'neg', 'ref': C + 'c-front.webp', 'cand': p})
                for p in pos:
                    jobs.append({'family': fam, 'size': size, 'kind': 'pos', 'ref': C + 'c-front.webp', 'cand': p})
        res = run_jobs(jobs, out)
        summ = {}
        for fam in sfams:
            for kind in ('neg', 'pos'):
                rs = [r for r in res if r['family'] == fam and r['kind'] == kind and 'json' in r]
                if kind == 'neg':
                    # reject = not (same character AND score >= 4)
                    ok = sum(1 for r in rs if not (passed(r)['same'] and (passed(r)['score'] or 0) >= 4))
                else:
                    ok = sum(1 for r in rs if passed(r)['same'])
                summ[f'{fam}_{kind}'] = f'{ok}/{len(rs)}'
        print(json.dumps(summ))
        json.dump({'summary': summ, 'results': res}, open(out, 'w'), indent=1)
    elif mode == 'run':
        sd, out = sys.argv[2], sys.argv[3]
        fams = sys.argv[4].split(',') if len(sys.argv) > 4 else ['gpt', 'grok']
        stim = [('j_neutral', C + 'c-front.webp', 'neutral, warm resting smile'), ('j_smile', C + 'c-happy.webp', 'happy smile'),
                ('j_aa', C + 'c-talking.webp', 'talking (mouth open on "aa")'), ('j_listen', C + 'c-listening.webp', 'listening attentively'),
                ('j_think', C + 'c-thinking.webp', 'thinking'), ('j_q3', REF + 'q3-left.webp', 'neutral, three-quarter view')]
        # sanity battery (2026-10-04): grok-4.20 passes at 1024 (16/16 neg, 8/8 pos) but accepts only 6/8 ref-vs-ref
        # pairs at 128, so it is used at 1024 only; GPT passes 16/16 + 16/16 at both sizes
        SIZES = {'gpt': (1024, 128), 'grok': (1024,), 'mistral': (1024,)}
        jobs = [{'family': f, 'size': s, 'stim': n, 'state': st, 'ref': ref, 'cand': f'{sd}/pose_{n}.png'}
                for f in fams for s in SIZES[f] for n, ref, st in stim]
        res = run_jobs(jobs, out)
        rows = {}
        for r in res:
            if 'json' not in r:
                continue
            p = passed(r)
            rows.setdefault('all', []).append(p)
            rows.setdefault(r['family'], []).append(p)
            rows.setdefault(r['size'], []).append(p)
        summ = {}
        for k, ps in rows.items():
            n = len(ps)
            summ[str(k)] = {'n': n, 'mean_score': round(sum(p['score'] or 0 for p in ps) / n, 2),
                            'item_pass': {i: round(sum(p['items'][i] for p in ps) / n, 2) for i in map(str, range(1, 21))}}
        print(json.dumps(summ, indent=0)[:3000])
        json.dump({'summary': summ, 'results': res}, open(out, 'w'), indent=1)
