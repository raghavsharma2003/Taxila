# gap-3: Google Trends (web search, not Play search) India, 2024-01-01..2026-09-30, via pytrends. Relative 0-100 indices.
import json,time
from pytrends.request import TrendReq
out={}
p=TrendReq(hl='en-IN',tz=330,timeout=(10,25))
sets={'A':['class 5 maths','ncert solutions','tuition','ai teacher','kaksha 6 vigyan']}
for name,kw in sets.items():
  for attempt in range(4):
    try:
      p.build_payload(kw,geo='IN',timeframe='2024-01-01 2026-09-30')
      r=p.interest_by_region(resolution='REGION',inc_low_vol=True)
      out[name+'_region']=r.to_dict(orient='index'); break
    except Exception as e: print('region err',e); time.sleep(60)
  time.sleep(30)
  for attempt in range(4):
    try:
      t=p.interest_over_time().drop(columns=['isPartial'],errors='ignore')
      q=t.resample('QE').mean().round(1); q.index=q.index.astype(str)
      out[name+'_quarterly']=q.to_dict(orient='index'); break
    except Exception as e: print('time err',e); time.sleep(60)
json.dump(out,open('gap3-trends-2026-10-02.json','w'),indent=1)
belt=['Uttar Pradesh','Bihar','Madhya Pradesh','Rajasthan','Jharkhand','Chhattisgarh','Haryana','Uttarakhand','Delhi','Himachal Pradesh']
reg=out.get('A_region',{})
print('state',sets['A'])
for s in belt+['Maharashtra','Karnataka','Tamil Nadu','West Bengal','Kerala','Gujarat']:
  if s in reg: print(s,[reg[s][k] for k in sets['A']])
for k,v in out.get('A_quarterly',{}).items(): print(k,v)
