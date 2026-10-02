import json,urllib.request,time,statistics as st,collections,sys
def get(u):
    return json.load(urllib.request.urlopen(u,timeout=90))
pr=get("https://atlas.ripe.net/api/v2/probes/?country_code=IN&status=1&page_size=500&fields=id,asn_v4,is_anchor")['results']
asn={p['id']:p['asn_v4'] for p in pr}
ids=",".join(str(i) for i in asn)
now=int(time.time()); s0=now-86400
out={}
for m in [50894291,50914741,22453852,22455342,143241219,143243831,88756610,89024086]:
    d=get(f"https://atlas.ripe.net/api/v2/measurements/{m}/results/?start={s0}&stop={now}&probe_ids={ids}&format=json")
    rows=collections.defaultdict(lambda:{'rtt':[],'sent':0,'rcvd':0,'jit':[]})
    for r in d:
        R=rows[r['prb_id']]; R['sent']+=r.get('sent',0); R['rcvd']+=r.get('rcvd',0)
        v=[x['rtt'] for x in r.get('result',[]) if 'rtt' in x]; R['rtt']+=v
        if len(v)>=2: R['jit'].append(st.mean(abs(v[i]-v[i-1]) for i in range(1,len(v))))
    out[m]={str(p):{'asn':asn.get(p),'n':len(R['rtt']),'min':min(R['rtt']) if R['rtt'] else None,'med':st.median(R['rtt']) if R['rtt'] else None,
      'p95':sorted(R['rtt'])[int(.95*len(R['rtt']))-1] if len(R['rtt'])>20 else None,'loss':1-R['rcvd']/R['sent'] if R['sent'] else None,
      'jit':st.median(R['jit']) if R['jit'] else None} for p,R in rows.items()}
    print(m,len(rows),'probes',file=sys.stderr)
json.dump({'fetched':now,'window_s':86400,'results':out},open('atlas-india-ashburn.json','w'),indent=1)
