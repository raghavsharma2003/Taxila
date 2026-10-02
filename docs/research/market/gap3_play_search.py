# gap-3: Play search pull (2026-10-02). Top-30 results per wedge query, country=in, lang hi and en.
import json, time
from google_play_scraper import search, app
Q=['class 5 maths','kaksha 6 vigyan','कक्षा 6 विज्ञान','NCERT solutions class 7','AI teacher Hindi','tuition app','hindi medium class 8','ai tutor']
out={}
for q in Q:
  for lang in ['en','hi']:
    try:
      r=search(q,lang=lang,country='in',n_hits=30)
    except Exception as e:
      out[f'{q}|{lang}']={'error':str(e)};continue
    rows=[]
    for x in r:
      rows.append({k:x.get(k) for k in ['appId','title','developer','score','installs','free','genre']})
    out[f'{q}|{lang}']=rows
    time.sleep(1)
json.dump(out,open('gap3-play-search-2026-10-02.json','w'),indent=1,default=str)
for k,v in out.items():
  if isinstance(v,dict): print(k,v);continue
  print('==',k,len(v))
  for x in v[:30]: print('  ',x['installs'],x['score'] and round(x['score'],2),x['appId'],'|',(x['title'] or '')[:50])
