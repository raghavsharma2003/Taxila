"""E3: normals fix + low-poly head with ARKit/viseme deltas transferred by closest-point barycentric projection.
Reports glTF vertex counts, GLB sizes, three.js morph-texture memory, and blink cornea coverage on the low mesh."""
import sys,os,json,time; sys.path.insert(0,'exp')
import bpy, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out='exp/out'; t0=time.time()
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'ict_arkit.blend'))
ob=bpy.data.objects['generic_neutral_mesh']; me=ob.data
bpy.context.view_layer.objects.active=ob; ob.select_set(True)
names=[m.name for m in me.materials]
drop={i for i,m in enumerate(names) if any(k in m for k in ('EyeBlend','EyeOcclusion','LacrimalFluid'))}
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for p in me.polygons: p.select = p.material_index in drop
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.delete_loose(); bpy.ops.object.mode_set(mode='OBJECT')
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except Exception as e: print('no custom normals',e)
bpy.ops.object.shade_smooth()
def gl_export(obj,path):
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active=obj
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_morph=True, export_morph_normal=False, export_animations=False, export_skins=False)
    return os.path.getsize(path)
res={'hi_blender_verts':len(me.vertices),'hi_tris':sum(len(p.vertices)-2 for p in me.polygons)}
res['hi_glb']=gl_export(ob,os.path.join(out,'hi_smooth.glb'))
# --- hi data for transfer
keys=[k for k in me.shape_keys.key_blocks][1:]
N=len(me.vertices)
base=np.empty(N*3); me.shape_keys.key_blocks[0].data.foreach_get('co',base); base=base.reshape(-1,3)
D=np.empty((len(keys),N,3))
for i,k in enumerate(keys):
    a=np.empty(N*3); k.data.foreach_get('co',a); D[i]=a.reshape(-1,3)-base
hi_mat=np.array([p.material_index for p in me.polygons])
tris=[]; tri_mat=[]
for p in me.polygons:
    vs=list(p.vertices)
    for j in range(1,len(vs)-1): tris.append((vs[0],vs[j],vs[j+1])); tri_mat.append(p.material_index)
tris=np.array(tris); tri_mat=np.array(tri_mat)
for ratio in (0.25,0.12):
    t1=time.time()
    lo=ob.copy(); lo.data=ob.data.copy(); lo.name=f'lo_{ratio}'; bpy.context.collection.objects.link(lo)
    bpy.context.view_layer.objects.active=lo; bpy.ops.object.select_all(action='DESELECT'); lo.select_set(True)
    lo.shape_key_clear()
    mod=lo.modifiers.new('dec','DECIMATE'); mod.ratio=ratio; mod.use_collapse_triangulate=False
    bpy.ops.object.modifier_apply(modifier='dec')
    lm=lo.data; M=len(lm.vertices)
    lco=np.empty(M*3); lm.vertices.foreach_get('co',lco); lco=lco.reshape(-1,3)
    # per-vertex material of the low mesh (first polygon using it) so lids only sample lids, eyes only eyes
    vmat=np.full(M,-1)
    for p in lm.polygons:
        for vi in p.vertices:
            if vmat[vi]<0: vmat[vi]=p.material_index
    W=np.zeros((M,3)); I=np.zeros((M,3),dtype=int)
    for mi in np.unique(vmat):
        sel=np.where(tri_mat==mi)[0]
        if len(sel)==0: continue
        bvh=BVHTree.FromPolygons([Vector(x) for x in base], tris[sel].tolist())
        for vi in np.where(vmat==mi)[0]:
            loc,nor,fi,dist=bvh.find_nearest(Vector(lco[vi]))
            a,b,c=base[tris[sel][fi]]; p=np.array(loc)
            v0,v1,v2=b-a,c-a,p-a; d00,d01,d11,d20,d21=v0@v0,v0@v1,v1@v1,v2@v0,v2@v1
            den=d00*d11-d01*d01; wv=(d11*d20-d01*d21)/den; ww=(d00*d21-d01*d20)/den
            W[vi]=(1-wv-ww,wv,ww); I[vi]=tris[sel][fi]
    lo.shape_key_add(name='Basis')
    for i,k in enumerate(keys):
        dl=np.einsum('mk,mkc->mc',W,D[i][I])
        kb=lo.shape_key_add(name=k.name); kb.data.foreach_set('co',(lco+dl).ravel())
    tris_lo=sum(len(p.vertices)-2 for p in lm.polygons)
    path=os.path.join(out,f'lo_{ratio}.glb'); size=gl_export(lo,path)
    # blink coverage on low mesh: rays from eyeball centre through cornea verts vs lid (M_Face) polys
    face_mi=names.index('M_Face'); eye_mi={names.index('M_ScleraLeft'),names.index('M_IrisLeft')}
    eyev=np.where(np.isin(vmat,list(eye_mi)))[0]
    fpolys=[list(p.vertices) for p in lm.polygons if p.material_index==face_mi]
    bi=[k.name for k in keys].index('eyeBlinkLeft')
    def vis(shape):
        bvh=BVHTree.FromPolygons([Vector(x) for x in shape], fpolys)
        c=shape[eyev].mean(0); z=shape[eyev,2]; cor=eyev[z>np.quantile(z,0.85)]; esc=0
        for j in cor:
            o=Vector(shape[j]); dv=(o-Vector(c)).normalized()
            esc+= bvh.ray_cast(o+dv*0.01,dv,3.0)[0] is None
        return round(100*esc/len(cor),1), len(cor)
    dl=np.einsum('mk,mkc->mc',W,D[bi][I])
    res[f'lo_{ratio}']={'blender_verts':M,'tris':tris_lo,'glb':size,'open_visible_%':vis(lco),'blink_visible_%':vis(lco+dl),'seconds':round(time.time()-t1,1)}
json.dump(res,open(os.path.join(out,'e3.json'),'w'),indent=1); print(json.dumps(res,indent=1)); print('total s',round(time.time()-t0,1))
