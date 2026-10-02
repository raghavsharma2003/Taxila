import json,sys,re,collections,datetime
from google_play_scraper import reviews, Sort
ids=sys.argv[1:]
themes={
 'refund/money':r'refund|money back|paisa|paise|fraud|scam|cheat',
 'sales calls/pressure':r'\bcall(s|ing|ed)?\b|sales|counsell?or|spam|pressur',
 'loan/EMI':r'\bemi\b|loan|finance|nbfc',
 'price/expensive':r'expensive|costly|price|mehenga|mahanga|too much fee|high fee',
 'paywall/subscription':r'subscri|pay(wall)?|premium|paid|purchase|buy',
 'bugs/login/crash':r'crash|bug|login|log in|otp|not (open|work|load)|error|lag|hang|slow',
 'teacher quality':r'teacher|faculty|sir|mam|ma\'am|mentor|tutor',
 'doubt solving':r'doubt',
 'ads/notifications':r'\bads?\b|advertis|notification',
 'language/hindi':r'hindi|language|english medium|regional',
 'AI':r'\bai\b|chatgpt|artificial',
 'content/video':r'video|content|lecture|syllabus|ncert',
 'customer support':r'support|customer care|no response|not respond|helpline',
}
res={}
for i in ids:
    try:
        rs,_=reviews(i,lang='en',country='in',sort=Sort.NEWEST,count=400)
    except Exception as e:
        print(i,'ERR',e); continue
    if not rs: print(i,'none'); continue
    d=[r['at'] for r in rs]
    stars=collections.Counter(r['score'] for r in rs)
    low=[r for r in rs if r['score']<=2]
    tc=collections.Counter()
    for r in low:
        t=(r['content'] or '').lower()
        for k,p in themes.items():
            if re.search(p,t): tc[k]+=1
    mean=sum(r['score'] for r in rs)/len(rs)
    res[i]={'n':len(rs),'from':min(d).strftime('%Y-%m-%d'),'to':max(d).strftime('%Y-%m-%d'),'mean':round(mean,2),'pct_low':round(100*len(low)/len(rs)),'stars':dict(sorted(stars.items())),'low_themes':tc.most_common(8),
      'low_samples':[(r['at'].strftime('%Y-%m-%d'),r['score'],(r['content'] or '')[:300]) for r in sorted(low,key=lambda r:-(r['thumbsUpCount'] or 0))[:6]]}
    print(i,json.dumps({k:v for k,v in res[i].items() if k!='low_samples'},ensure_ascii=False))
json.dump(res,open('reviews_'+str(len(ids))+'_'+ids[0]+'.json','w'),ensure_ascii=False,indent=1,default=str)
