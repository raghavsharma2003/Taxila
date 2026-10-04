# Judge round 2: blind single-candidate vs c-front, GPT (DEPLOY_BRAIN). Candidate presented as "a 3D render", origin not stated.
import json, base64, io, urllib.request, sys
from PIL import Image
R='/home/user/Taxila/'
env={}
for l in open(R+'.env.local'):
    l=l.strip()
    if '=' in l and not l.startswith('#'):
        k,v=l.split('=',1); env[k]=v.strip().strip('"')
C=R+'docs/design/teacher/stylised/concepts/'
P=R+'docs/design/teacher/stylised/build/polish-r2/'
ref=Image.open(C+'c-front.webp').convert('RGB')
refh=Image.open(C+'c-happy.webp').convert('RGB')
cs=Image.open(P+'contact-sheet.webp').convert('RGB')
ex=Image.open(P+'expressions-sheet.webp').convert('RGB')
front=cs.crop((512,0,1024,478)); close=cs.crop((2048,0,2560,478))
happy=ex.crop((382,382,764,730))
def b64(im,size):
    im=im.copy(); im=im.resize((size,int(size*im.height/im.width))); bio=io.BytesIO(); im.save(bio,'PNG')
    return 'data:image/png;base64,'+base64.b64encode(bio.getvalue()).decode()
PROMPT="""You are a harsh senior art director at a studio that ships Apple-Memoji-quality stylised 3D characters.
REF is a 2D design concept for a character (front, and optionally an expression). X images are a 3D render of an attempt at that character.
Judge strictly. Answer in JSON with keys:
same_character (yes/no: would a normal person say X is the same character as REF rendered in 3D?),
memoji_quality (yes/no: is X at the craft level of Apple Memoji / Pixar-lite?),
uncanny_or_cheap (yes/no: is anything uncanny, doll-like, plastic, lifeless-eyed, or 'cheap game'?),
score (1-5; 4 = clearly the same character, Memoji quality, shippable; 5 = delightful; 1 = unusable),
top_defects (list of the 5 most important concrete visual defects, specific: which feature, what is wrong, what it should be),
best_parts (list).
Images are shown at the stated pixel size; judge what is visible at that size."""
def call(images, note):
    content=[{"type":"text","text":PROMPT+"\n"+note}]
    for lab,url in images:
        content+=[{"type":"text","text":f"Image {lab}:"},{"type":"image_url","image_url":{"url":url}}]
    body={"messages":[{"role":"user","content":content}],"max_completion_tokens":6000,"model":env['DEPLOY_BRAIN']}
    req=urllib.request.Request(env['AZURE_OPENAI_ENDPOINT'].rstrip('/')+"/chat/completions",data=json.dumps(body).encode(),
        headers={'api-key':env['AZURE_OPENAI_API_KEY'],'Content-Type':'application/json'})
    try: r=json.load(urllib.request.urlopen(req,timeout=300))
    except urllib.error.HTTPError as e: print('HTTP',e.code,e.read()[:300]); sys.exit(1)
    return r['choices'][0]['message']['content'], r.get('model')
trials=[
 ("front@1024",[('REF',b64(ref,1024)),('X front',b64(front,1024)),('X close-up',b64(close,1024))],"Size: 1024 px."),
 ("front@128",[('REF',b64(ref,128)),('X front',b64(front,128))],"Size: 128 px (thumbnail)."),
 ("happy@1024",[('REF happy',b64(refh,1024)),('X happy',b64(happy,1024))],"Size: 1024 px. Expression: happy."),
 ("front@1024 repeat",[('REF',b64(ref,1024)),('X front',b64(front,1024))],"Size: 1024 px."),
]
out=[]
for name,imgs,note in trials:
    txt,model=call(imgs,note)
    out.append({"trial":name,"model":model,"reply":txt}); print(name,model,txt[:1500],'\n---'); sys.stdout.flush()
json.dump(out,open(R+'docs/design/teacher/stylised/build/judge-r2-blind.json','w'),indent=1)
