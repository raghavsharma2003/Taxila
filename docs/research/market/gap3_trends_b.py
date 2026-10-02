# gap-3 set B: does 'ncert solutions' decline track general-AI adoption? and Devanagari query volume.
import json,time
from pytrends.request import TrendReq
p=TrendReq(hl='en-IN',tz=330,timeout=(10,25))
out={}
for name,kw in {'B':['ncert solutions','chatgpt','gemini'],'C':['कक्षा 6','class 6','ncert solutions']}.items():
  p.build_payload(kw,geo='IN',timeframe='2024-01-01 2026-09-30')
  t=p.interest_over_time().drop(columns=['isPartial'],errors='ignore')
  q=t.resample('QE').mean().round(1); q.index=q.index.astype(str); out[name+'_quarterly']=q.to_dict(orient='index')
  time.sleep(90)
  r=p.interest_by_region(resolution='REGION',inc_low_vol=True); out[name+'_region']=r.to_dict(orient='index'); time.sleep(90)
json.dump(out,open('gap3-trends-b-2026-10-02.json','w'),indent=1)
for k,v in out.items():
  if 'quarterly' in k:
    print(k); [print(' ',a,b) for a,b in v.items()]
r=out['C_region']
for s in ['Uttar Pradesh','Bihar','Madhya Pradesh','Rajasthan','Jharkhand','Chhattisgarh','Haryana','Delhi','Maharashtra','Kerala']:
  print(s,r.get(s))
