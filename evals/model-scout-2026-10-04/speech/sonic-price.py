# Nova Sonic list prices from the AWS Pricing API (us-east-1), 2026-10-04.
import awsenv, boto3, json
p = boto3.client('pricing', region_name='us-east-1'); out = []; tok = None
for svc in ['AmazonBedrock', 'AmazonBedrockFoundationModels']:
    tok = None
    while True:
        kw = dict(ServiceCode=svc, Filters=[{'Type': 'TERM_MATCH', 'Field': 'regionCode', 'Value': 'us-east-1'}], MaxResults=100)
        if tok: kw['NextToken'] = tok
        try: r = p.get_products(**kw)
        except Exception as e: print(svc, 'ERR', str(e)[:100]); break
        for s in r['PriceList']:
            d = json.loads(s); a = d['product']['attributes']
            if 'sonic' in json.dumps(a).lower():
                for t in d['terms'].get('OnDemand', {}).values():
                    for pd in t['priceDimensions'].values(): out.append((a.get('model') or a.get('usagetype'), a.get('usagetype'), pd['description'], pd['pricePerUnit'].get('USD'), pd['unit']))
        tok = r.get('NextToken')
        if not tok: break
for o in sorted(set(out)): print(o)
json.dump(sorted(set(out)), open('results/nova-sonic-prices.json', 'w'), indent=1)
