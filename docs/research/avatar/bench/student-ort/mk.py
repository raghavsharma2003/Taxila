import numpy as np, onnx, sys
from onnx import helper as h, TensorProto as T, numpy_helper as nh
C=int(sys.argv[1]); H=int(sys.argv[2]); out=sys.argv[3]
F=84; K=3; dil=[1,2,4,8,16]; rng=np.random.default_rng(0)
nodes=[];inits=[];inputs=[h.make_tensor_value_info('x',T.FLOAT,[1,F,1])];outputs=[]
prev='x'; cin=F; params=0
for i,d in enumerate(dil):
    L=(K-1)*d; s=f's{i}'
    inputs.append(h.make_tensor_value_info(s,T.FLOAT,[1,cin,L]))
    nodes.append(h.make_node('Concat',[s,prev],[f'cat{i}'],axis=2))
    W=(rng.standard_normal((C,cin,K))*0.05).astype(np.float32); B=np.zeros(C,np.float32); params+=W.size+C
    inits+= [nh.from_array(W,f'W{i}'),nh.from_array(B,f'B{i}')]
    nodes.append(h.make_node('Conv',[f'cat{i}',f'W{i}',f'B{i}'],[f'cv{i}'],dilations=[d],kernel_shape=[K]))
    nodes.append(h.make_node('Relu',[f'cv{i}'],[f'r{i}']))
    inits+=[nh.from_array(np.array([1],np.int64),f'st{i}'),nh.from_array(np.array([L+1],np.int64),f'en{i}'),nh.from_array(np.array([2],np.int64),f'ax{i}')]
    nodes.append(h.make_node('Slice',[f'cat{i}',f'st{i}',f'en{i}',f'ax{i}'],[f'o{s}']))
    outputs.append(h.make_tensor_value_info(f'o{s}',T.FLOAT,[1,cin,L]))
    prev=f'r{i}'; cin=C
# GRU: input (seq=1,batch=1,C)
nodes.append(h.make_node('Transpose',[prev],['tp'],perm=[2,0,1]))
Wg=(rng.standard_normal((1,3*H,C))*0.05).astype(np.float32);Rg=(rng.standard_normal((1,3*H,H))*0.05).astype(np.float32);Bg=np.zeros((1,6*H),np.float32)
params+=Wg.size+Rg.size+Bg.size
inits+=[nh.from_array(Wg,'Wg'),nh.from_array(Rg,'Rg'),nh.from_array(Bg,'Bg')]
inputs.append(h.make_tensor_value_info('h0',T.FLOAT,[1,1,H]))
nodes.append(h.make_node('GRU',['tp','Wg','Rg','Bg','','h0'],['Y','hN'],hidden_size=H,linear_before_reset=1))
outputs.append(h.make_tensor_value_info('hN',T.FLOAT,[1,1,H]))
Wo=(rng.standard_normal((H,26))*0.05).astype(np.float32);params+=Wo.size
inits.append(nh.from_array(Wo,'Wo'))
nodes.append(h.make_node('Reshape',['hN','shp'],['hf']));inits.append(nh.from_array(np.array([1,H],np.int64),'shp'))
nodes.append(h.make_node('MatMul',['hf','Wo'],['y']))
outputs.insert(0,h.make_tensor_value_info('y',T.FLOAT,[1,26]))
g=h.make_graph(nodes,'student',inputs,outputs,inits)
m=h.make_model(g,opset_imports=[h.make_opsetid('',17)]);m.ir_version=8
onnx.checker.check_model(m);onnx.save(m,out);print(out,'params',params)
