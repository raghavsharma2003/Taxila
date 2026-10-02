# gap-2: Play metadata pull (2026-10-02) for missed K-8 live/self-study competitors.
# Review themes come from playstore_snapshot.py -> gap2-reviews-2026-10-02.json (renamed).
import json
from google_play_scraper import app
ids=['com.newplanetspark.native_android','com.planetspark.parent','com.brightchamps.learner','com.brightchamps.e10x',
     'com.tce.studi','com.tce.studi.live','com.teachmint.teachmint','app.codingal','me.sparkl.student','com.curiousjr']
out={}
for i in ids:
    try:
        a=app(i,lang='en',country='in')
        out[i]={k:a.get(k) for k in ['title','developer','installs','realInstalls','score','ratings','reviews','lastUpdatedOn','released','inAppProductPrice','genre','contentRating']}
    except Exception as e:
        out[i]={'error':str(e)}
rv=json.load(open('gap2-reviews-2026-10-02.json'))
for i,r in rv.items():
    low=sum(v for k,v in r['stars'].items() if int(k)<=2)
    t=dict(r['low_themes'])
    out.setdefault(i,{})['newest']={'n':r['n'],'from':r['from'],'to':r['to'],'mean':r['mean'],'pct_low':r['pct_low'],
      'refund_share_all':round(100*t.get('refund/money',0)/r['n'],1),'sales_share_all':round(100*t.get('sales calls/pressure',0)/r['n'],1),
      'refund_share_low':round(100*t.get('refund/money',0)/max(low,1),1),'sales_share_low':round(100*t.get('sales calls/pressure',0)/max(low,1),1)}
json.dump(out,open('gap2-playstore-2026-10-02.json','w'),indent=1,default=str)
for i,v in out.items(): print(i,json.dumps(v,default=str)[:600])
