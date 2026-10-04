# Loads AWS_* from the gitignored .env.local into os.environ (values never printed).
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
for line in open(os.path.join(ROOT, '.env.local')):
    line = line.strip()
    if line.startswith('AWS_') and '=' in line:
        k, v = line.split('=', 1); os.environ[k] = v.strip().strip('"').strip("'")
os.environ['AWS_CA_BUNDLE'] = '/root/.ccr/ca-bundle.crt'
