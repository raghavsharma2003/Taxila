import json,statistics as st
d=json.load(open('gap3-play-search-2026-10-02.json'))
def n(s):
  try: return int(str(s).replace(',','').replace('+',''))
  except: return 0
summ={}
for k,v in d.items():
  if not isinstance(v,list): continue
  ins=[n(x['installs']) for x in v]; sc=[x['score'] for x in v if x['score']]
  solution=sum(1 for x in v if any(w in (x['title'] or '').lower() for w in ['solution','notes','guide','book','ncert','mcq']))
  ai=sum(1 for x in v if any(w in (x['title'] or '').lower() for w in [' ai','ai ','tutor','teacher']))
  top=sorted(v,key=lambda x:-n(x['installs']))[:5]
  summ[k]={'n':len(v),'median_installs':st.median(ins) if ins else 0,'n_ge_1M':sum(i>=1_000_000 for i in ins),'n_ge_10M':sum(i>=10_000_000 for i in ins),
    'n_lt_100k':sum(i<100_000 for i in ins),'mean_score':round(st.mean(sc),2) if sc else None,'solution_titles':solution,'ai_tutor_titles':ai,
    'top5':[(x['appId'],x['installs']) for x in top]}
json.dump(summ,open('gap3-play-search-summary-2026-10-02.json','w'),indent=1)
for k,s in summ.items(): print(k,{a:b for a,b in s.items() if a!='top5'}, [t[0]+' '+t[1] for t in s['top5'][:3]])
