import numpy as np, json, os
F=os.path.join(os.path.dirname(__file__),'..','ICT-FaceKit','FaceXModel')
def v(name):
    out=[]
    with open(os.path.join(F,name+'.obj')) as f:
        for l in f:
            if l.startswith('v '): out.append(l.split()[1:4])
    return np.array(out,dtype=np.float64)
