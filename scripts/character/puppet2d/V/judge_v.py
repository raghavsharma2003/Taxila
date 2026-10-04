# Blind Foundry vision judge for arm V (advisory; PLAN §11). X is described only as "an animated 2D version attempt".
#   python3 scripts/character/puppet2d/V/judge_v.py
import json, base64, io, urllib.request, sys, random
from PIL import Image
R = '/home/user/Taxila/'
env = {}
for l in open(R + '.env.local'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k] = v.strip().strip('"')
C = R + 'docs/design/teacher/stylised/concepts/'; E = R + 'art/character/puppet2d/V/evidence/poses/'
ld = lambda p, box=None: (Image.open(p).convert('RGB').crop(box) if box else Image.open(p).convert('RGB'))
def b64(im, size):
    im = im.resize((size, size)); bio = io.BytesIO(); im.save(bio, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode()
PROMPT = """You are a harsh senior art director at a studio that ships premium app characters (Duolingo Lily, Apple Memoji level).
REF is the approved design concept of a character. X is a frame from an animated 2D version attempt of that character.
Judge strictly. Answer ONLY JSON with keys:
same_character (yes/no: would a normal person say X is the same character as REF, animated?),
premium (yes/no: a polished app character, not a paper cutout, not flat clip-art, not a cheap game),
uncanny_or_cheap (yes/no),
soft_shading_kept (yes/no),
expression_matches (yes/no/na: does X show the same expression/state as REF?),
score (1-5; 4 = clearly her, premium, shippable; 5 = delightful; 1 = unusable),
top_defects (list of the 5 most important concrete visual defects: feature, what is wrong, what it should be),
best_parts (list)."""
face = (150, 60, 900, 810)
trials = [
    ("rest@1024", [('REF', b64(ld(C + 'c-front.webp'), 1024)), ('X', b64(ld(E + 'rest.png'), 1024))], "Size 1024 px."),
    ("rest@128", [('REF', b64(ld(C + 'c-front.webp'), 128)), ('X', b64(ld(E + 'rest.png'), 128))], "Size 128 px (thumbnail)."),
    ("talking@512", [('REF', b64(ld(C + 'c-talking.webp'), 512)), ('X', b64(ld(E + 'talk_aa.png', face), 512))], "Size 512 px. REF state: talking."),
    ("happy@512", [('REF', b64(ld(C + 'c-happy.webp'), 512)), ('X', b64(ld(E + 'delight.png', face), 512))], "Size 512 px. REF state: happy."),
    ("thinking@512", [('REF', b64(ld(C + 'c-thinking.webp'), 512)), ('X', b64(ld(E + 'thinking.png', face), 512))], "Size 512 px. REF state: thinking."),
    ("turn@512", [('REF', b64(ld(C + 'c-front.webp'), 512)), ('X', b64(ld(E + 'yaw_p20.png', face), 512))], "Size 512 px. X has the head turned about 20 degrees; judge whether the turn reads as a real head turn."),
]
def call(images, note):
    content = [{"type": "text", "text": PROMPT + "\n" + note}]
    for lab, url in images:
        content += [{"type": "text", "text": f"Image {lab}:"}, {"type": "image_url", "image_url": {"url": url}}]
    body = {"messages": [{"role": "user", "content": content}], "max_completion_tokens": 5000, "model": env['DEPLOY_BRAIN']}
    req = urllib.request.Request(env['AZURE_OPENAI_ENDPOINT'].rstrip('/') + "/chat/completions", data=json.dumps(body).encode(),
                                 headers={'api-key': env['AZURE_OPENAI_API_KEY'], 'Content-Type': 'application/json'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        return 'HTTP %d %s' % (e.code, e.read()[:200]), None, None
    return r['choices'][0]['message']['content'], r.get('model'), r.get('usage')
out = []
for name, imgs, note in trials:
    txt, model, usage = call(imgs, note)
    out.append({"trial": name, "model": model, "usage": usage, "reply": txt}); print(name, model, txt[:900], '\n---'); sys.stdout.flush()
json.dump(out, open(R + 'art/character/puppet2d/V/evidence/judge-v-blind.json', 'w'), indent=1)
