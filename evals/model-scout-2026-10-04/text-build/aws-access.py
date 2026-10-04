# Scout text-build 2026-10-04: can ANY credit-eligible AWS inference path be called today? One 5-token Converse call per
# (region, model id) for the scout's promising text/build arms, plus the Bedrock daily-token quotas and the SageMaker
# GPU endpoint quotas. Writes results/aws-access-2026-10-04.json. Prints no secrets.
# Run: python3 aws-access.py
import os, json, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
for line in open(os.path.join(ROOT, '.env.local')):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1); os.environ[k] = v.strip().strip('"').strip("'")
os.environ['AWS_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
import boto3
from botocore.config import Config
ARMS = {'ap-south-1': ['global.amazon.nova-2-lite-v1:0', 'amazon.nova-pro-v1:0', 'apac.amazon.nova-pro-v1:0', 'deepseek.v3.2', 'moonshotai.kimi-k3', 'global.moonshotai.kimi-k3',
                       'global.xai.grok-4.7', 'mistral.mistral-large-3-675b-instruct', 'qwen.qwen3-next-80b-a3b', 'zai.glm-5', 'minimax.minimax-m2.5', 'openai.gpt-oss-safeguard-120b', 'google.gemma-3-27b-it'],
        'us-east-1': ['us.amazon.nova-2-lite-v1:0', 'amazon.nova-pro-v1:0', 'us.amazon.nova-premier-v1:0', 'us.meta.llama4-maverick-17b-instruct-v1:0', 'qwen.qwen3-coder-next', 'deepseek.v3.2', 'global.moonshotai.kimi-k3']}
out = {'at': datetime.datetime.utcnow().isoformat() + 'Z', 'calls': [], 'bedrockTokenQuotas': {}, 'sagemakerGpuEndpointQuotasNonzero': {}}
for reg, mids in ARMS.items():
    br = boto3.client('bedrock-runtime', region_name=reg, config=Config(retries={'max_attempts': 1}))
    for m in mids:
        try:
            r = br.converse(modelId=m, messages=[{'role': 'user', 'content': [{'text': 'say hi'}]}], inferenceConfig={'maxTokens': 5})
            out['calls'].append({'region': reg, 'model': m, 'ok': True, 'usage': r.get('usage')})
        except Exception as e:
            out['calls'].append({'region': reg, 'model': m, 'ok': False, 'err': f'{type(e).__name__}: {str(e)[:220]}'})
        print(out['calls'][-1]['region'], m, 'OK' if out['calls'][-1]['ok'] else out['calls'][-1]['err'][:110])
    sq = boto3.client('service-quotas', region_name=reg); tq = []; gq = []
    for pg in sq.get_paginator('list_service_quotas').paginate(ServiceCode='bedrock'):
        for q in pg['Quotas']:
            if 'tokens per day' in q['QuotaName'].lower() and not q['QuotaName'].startswith('(Model customization)'): tq.append({'name': q['QuotaName'], 'value': q['Value'], 'adjustable': q.get('Adjustable')})
    for pg in sq.get_paginator('list_service_quotas').paginate(ServiceCode='sagemaker'):
        for q in pg['Quotas']:
            if 'endpoint usage' in q['QuotaName'] and any(t in q['QuotaName'] for t in ['.g5.', '.g6.', '.g6e.', '.p4d.', '.p5.', '.inf2.']) and q['Value'] > 0: gq.append({'name': q['QuotaName'], 'value': q['Value']})
    out['bedrockTokenQuotas'][reg] = {'n': len(tq), 'nonzero': [x for x in tq if x['value'] > 0], 'adjustable': sum(1 for x in tq if x['adjustable'])}
    out['sagemakerGpuEndpointQuotasNonzero'][reg] = gq
    print(reg, 'bedrock token/day quotas:', len(tq), 'nonzero:', len(out['bedrockTokenQuotas'][reg]['nonzero']), 'adjustable:', out['bedrockTokenQuotas'][reg]['adjustable'], '| sagemaker GPU endpoint nonzero:', len(gq))
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'results', 'aws-access-2026-10-04.json'), 'w'), indent=1)
