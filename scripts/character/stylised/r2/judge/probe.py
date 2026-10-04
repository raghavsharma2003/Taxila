# Which Foundry Direct deployments accept image input? (judge-family bake-off probe; prints no secrets)
import json, base64, io, sys, urllib.request
from PIL import Image
R = '/home/user/Taxila/'
env = {}
for l in open(R + '.env.local'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k] = v.strip().strip('"')
im = Image.open(R + 'docs/design/teacher/stylised/concepts/c-front.webp').convert('RGB'); im.thumbnail((256, 256))
bio = io.BytesIO(); im.save(bio, 'PNG'); url = 'data:image/png;base64,' + base64.b64encode(bio.getvalue()).decode()
for model in sys.argv[1:]:
    body = {"model": model, "messages": [{"role": "user", "content": [{"type": "text", "text": "In 8 words: what colour is her top and her hair?"}, {"type": "image_url", "image_url": {"url": url}}]}], "max_tokens": 60}
    ep = env['AZURE_OPENAI_ENDPOINT'].rstrip('/')
    for path in ('/chat/completions',):
        req = urllib.request.Request(ep + path, data=json.dumps(body).encode(), headers={'api-key': env['AZURE_OPENAI_API_KEY'], 'Content-Type': 'application/json'})
        try:
            r = json.load(urllib.request.urlopen(req, timeout=120))
            print(model, 'OK', r.get('model'), repr(r['choices'][0]['message']['content'])[:120])
        except urllib.error.HTTPError as e:
            print(model, 'HTTP', e.code, e.read()[:200])
        except Exception as e:
            print(model, 'ERR', e)
