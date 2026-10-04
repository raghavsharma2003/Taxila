import os, json, base64, io, random, urllib.request, sys
from PIL import Image
R='/home/user/Taxila/'
env={}
for l in open(R+'.env.local'):
    l=l.strip()
    if '=' in l and not l.startswith('#'):
        k,v=l.split('=',1); env[k]=v.strip().strip('"')
ref=Image.open(R+'docs/design/teacher/stylised/concepts/c-front.webp').convert('RGB')
A=Image.open(R+'docs/design/teacher/stylised/build/armA/contact-sheet.webp').convert('RGB').crop((512,0,1024,478))
B=Image.open(R+'docs/design/teacher/stylised/build/armB/contact.webp').convert('RGB').crop((768,12,1540,770))
A=A.resize((768,int(768*A.height/A.width))); B=B.resize((768,int(768*B.height/B.width)))
A.save('A_front.png'); B.save('B_front.png')
def b64(im,size):
    im=im.copy(); im.thumbnail((size,size)); bio=io.BytesIO(); im.save(bio,'PNG')
    return 'data:image/png;base64,'+base64.b64encode(bio.getvalue()).decode()
PROMPT=open('prompt.txt').read()
def call(images):
    content=[{"type":"text","text":PROMPT}]
    for lab,url in images:
        content+= [{"type":"text","text":f"Image {lab}:"},{"type":"image_url","image_url":{"url":url}}]
    body={"messages":[{"role":"user","content":content}],"max_completion_tokens":6000}
    ep=env['AZURE_OPENAI_ENDPOINT'].rstrip('/')
    url=f"{ep}/chat/completions"; body["model"]=env['DEPLOY_BRAIN']
    req=urllib.request.Request(url,data=json.dumps(body).encode(),headers={'api-key':env['AZURE_OPENAI_API_KEY'],'Content-Type':'application/json'})
    try: r=json.load(urllib.request.urlopen(req,timeout=300))
    except urllib.error.HTTPError as e: print('HTTP',e.code,e.read()[:300]); sys.exit(1)
    return r['choices'][0]['message']['content'], r.get('model')
out=[]
for trial,size in enumerate([1024,128,1024,128]):
    swap=(trial%2==1) ^ (trial>=2)
    X,Y=(B,A) if swap else (A,B)
    txt,model=call([('REF',b64(ref,size)),('X',b64(X,size)),('Y',b64(Y,size))])
    out.append({"trial":trial,"size":size,"X":"B" if swap else "A","Y":"A" if swap else "B","model":model,"reply":txt})
    print(json.dumps(out[-1],indent=1)[:4000]); sys.stdout.flush()
json.dump(out,open('judge-out.json','w'),indent=1)
