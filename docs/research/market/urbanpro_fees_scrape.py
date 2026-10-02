import re,html,subprocess,statistics,json,sys
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
cities={"T1":["delhi","mumbai","bangalore","hyderabad","chennai","kolkata","pune"],
        "T2":["jaipur","lucknow","patna","indore","bhopal","kanpur","nagpur","ahmedabad","chandigarh"],
        "T3":["varanasi","ranchi","gwalior","allahabad","meerut","jodhpur","kota","dehradun","agra","gorakhpur","bikaner","udaipur"]}
classes=["class-i-v-tuition","class-6-tuition","class-9-tuition"]
out={}
for tier,cl in cities.items():
  for c in cl:
    for k in classes:
      u=f"https://www.urbanpro.com/{c}/{k}"
      try:
        s=subprocess.run(["curl","-sS","-L","-A",UA,u,"--max-time","25"],capture_output=True,text=True,errors="ignore").stdout
      except Exception as e:
        continue
      t=re.sub(r'<script.*?</script>|<style.*?</style>','',s,flags=re.S)
      t=re.sub(r'<[^>]+>',' ',t); t=html.unescape(t); t=re.sub(r'\s+',' ',t)
      hr=[int(x.replace(',','')) for x in re.findall(r'₹ ?([\d,]+) per hour',t)]
      mo=[int(x.replace(',','')) for x in re.findall(r'₹ ?([\d,]+) per month',t)]
      out[f"{tier}|{c}|{k}"]={"hour":hr,"month":mo}
      print(tier,c,k,len(hr),statistics.median(hr) if hr else None,len(mo),statistics.median(mo) if mo else None,flush=True)
json.dump(out,open("urbanpro_fees_2026-10-02.json","w"),indent=1)
