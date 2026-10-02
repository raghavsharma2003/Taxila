# Critic probe: reuses visual-identity-contrast.py helpers. Run: python3 visual-identity-critique-probe.py
import importlib.util, itertools, sys, io, contextlib
spec = importlib.util.spec_from_file_location('vc', 'visual-identity-contrast.py'); vc = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(vc)
cr, sim, lab, de = vc.cr, vc.simulate, vc.lab, vc.de2000
def d(a,b,k): return de(lab(sim(a,k)), lab(sim(b,k)))
print('CONTRAST')
for n,a,b in [('tile-border on bg','#8C8478','#FFF8EE'),('tile-border on surface','#8C8478','#FFFFFF'),('bg vs surface','#FFF8EE','#FFFFFF'),
  ('jamun-soft underlay vs bg','#EFE6FA','#FFF8EE'),('focus ink on board','#1F1A14','#1F3B30'),('focus ink on jamun','#1F1A14','#5B2E91'),
  ('done on bg','#1F7A4D','#FFF8EE'),('think on bg','#5B6470','#FFF8EE'),('stop on bg','#B3261E','#FFF8EE'),('chalk-mark vs turn lum','#F2CF6B','#FFB21E')]:
    print(f'  {n}: {cr(a,b):.2f}')
print('STATUS PAIRS dE2000 (normal/protan/deutan/tritan)')
for n,a,b in [('done vs stop','#1F7A4D','#B3261E'),('done vs turn','#1F7A4D','#FFB21E'),('think vs listen','#5B6470','#2563C9'),
  ('turn vs chalk-mark','#FFB21E','#F2CF6B'),('turn vs haldi','#FFB21E','#946B0E'),('stop vs think','#B3261E','#5B6470'),('jamun vs listen','#5B2E91','#2563C9'),('listen vs neel','#2563C9','#2A72C6')]:
    print(f'  {n}:', ' / '.join(f'{d(a,b,k):.1f}' for k in ('normal','protan','deutan','tritan')))
