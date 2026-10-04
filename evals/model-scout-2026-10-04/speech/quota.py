# Reads Bedrock service quotas for Nova Sonic / Nova 2 Sonic (us-east-1) and the on-demand token-per-day caps.
import awsenv, boto3, json
out = {}
for reg in ['us-east-1', 'ap-south-1']:
    sq = boto3.client('service-quotas', region_name=reg); qs = []; tok = None
    while True:
        kw = {'ServiceCode': 'bedrock', 'MaxResults': 100}
        if tok: kw['NextToken'] = tok
        r = sq.list_service_quotas(**kw); qs += r['Quotas']; tok = r.get('NextToken')
        if not tok: break
    out[reg] = [(q['QuotaName'], q['Value'], q.get('Adjustable')) for q in qs if 'sonic' in q['QuotaName'].lower() or ('tokens per day' in q['QuotaName'].lower() and ('nova' in q['QuotaName'].lower()))]
print(json.dumps(out, indent=1))
