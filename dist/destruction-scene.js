import * as T from './vendor/three.module.min.js';
import {bindDestruction,obstacleSolid,structureFor,DESTRUCTION_LIMITS,DESTRUCTION_MATERIALS} from './destruction.js';

// Geometry/material batches are stable; only affected instance transforms/colors
// change on a revision. Debris is analytical and never enters gameplay collision.
export function buildDestructionScene(parent,m,coverMeshes){
 const box=new T.BoxGeometry(1,1,1),tank=new T.CylinderGeometry(.5,.5,1,10),rock=new T.IcosahedronGeometry(1,0),stamp=new T.Object3D(),tint=new T.Color(),batches=new Map(),owned=[];
 const staticParts=[];
 function batch(geometry,color,entries,glow=false){
  const material=glow?new T.MeshBasicMaterial({color}):new T.MeshToonMaterial({color});
  const mesh=new T.InstancedMesh(geometry,material,Math.max(1,entries.length));mesh.frustumCulled=false;mesh.castShadow=!glow;mesh.receiveShadow=!glow;mesh.count=entries.length;parent.add(mesh);owned.push(mesh);return mesh;
 }
 function put(mesh,index,p,scale,color){stamp.position.set(...p);stamp.rotation.set(0,0,0);stamp.scale.set(...scale);stamp.updateMatrix();mesh.setMatrixAt(index,stamp.matrix);if(color)mesh.setColorAt(index,tint.set(color));}
 const colliderMat=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
 const floor=new T.Mesh(box,new T.MeshToonMaterial({color:'#414d4c'}));floor.position.set(m.width*.05,-.6,m.height*.05);floor.scale.set(m.width*.1,1.2,m.height*.1);floor.receiveShadow=true;parent.add(floor);coverMeshes.push(floor);
 for(const o of m.obstacles){
  const base=o.baseZ||0,cx=(o.x+o.w/2)*.1,cz=(o.y+o.h/2)*.1,h=(o.height-base)*.1;
  const collider=new T.Mesh(box,colliderMat);collider.position.set(cx,(base*.1+h/2),cz);collider.scale.set(o.w*.1,h,o.h*.1);collider.visible=false;
  collider.raycast=(ray,hits)=>{if(obstacleSolid(m,o))T.Mesh.prototype.raycast.call(collider,ray,hits);};parent.add(collider);coverMeshes.push(collider);
  const material=o.material||'steel',key=material+':'+(o.shape||'box');
  if(!batches.has(key))batches.set(key,{material,geometry:o.shape==='tank'?tank:box,pieces:[],mesh:null});
  batches.get(key).pieces.push(o);
 }
 const zero=[0,0,0];
 for(const b of batches.values()){
  b.mesh=batch(b.geometry,DESTRUCTION_MATERIALS[b.material].color,b.pieces);b.hp=new Int32Array(b.pieces.length).fill(-1);
  b.frames=b.pieces.map(o=>{const base=o.baseZ||0,h=(o.height-base)*.1;return{p:[(o.x+o.w/2)*.1,base*.1+h/2,(o.y+o.h/2)*.1],s:[o.w*.1,h,o.h*.1],max:o.durability||DESTRUCTION_MATERIALS[b.material].hp};});
 }
 const accentGroups=new Map();
 for(const o of m.obstacles){
  if(o.breakable===undefined||o.baseZ)continue;
  const cylinder=o.shape==='tank',color=cylinder?'#ebd6a6':o.material==='support'?'#293a3b':'#c0c9b3',key=color+cylinder;
  if(!accentGroups.has(key))accentGroups.set(key,{color,geometry:cylinder?tank:box,entries:[],mesh:null});
  const entries=accentGroups.get(key).entries;
  for(const f of[cylinder?.22:.22,cylinder?.78:.72]){
   const faceX=o.w<o.h;
   entries.push({o,p:cylinder?[(o.x+o.w/2)*.1,o.height*.1*f,(o.y+o.h/2)*.1]:faceX?[o.x*.1-.025,o.height*.1*f,(o.y+o.h/2)*.1]:[(o.x+o.w/2)*.1,o.height*.1*f,o.y*.1-.025],s:cylinder?[o.w*.1+.1,.24,o.h*.1+.1]:faceX?[.08,.18,o.h*.08]:[o.w*.08,.18,.08]});
  }
 }
 for(const b of accentGroups.values()){b.mesh=batch(b.geometry,b.color,b.entries);b.alive=new Uint8Array(b.entries.length).fill(2);}
 // Roads, hazard stripes, floodlight towers, pipe bridges and readable silhouettes.
 for(const c of m.compounds){
  staticParts.push({p:[(c.x+c.w/2)*.1,-.01,(c.y+c.h/2)*.1],s:[c.w*.1,.08,c.h*.1],c:'#58605b'});
  for(const side of[-1,1]){
   staticParts.push({p:[(c.x+c.w/2)*.1,24,(c.y+c.h/2+side*c.h*.5)*.1],s:[c.w*.1+2,1,1.4],c:'#23373c'});
   staticParts.push({p:[(c.x+c.w/2)*.1,24.6,(c.y+c.h/2+side*c.h*.5)*.1],s:[c.w*.1, .12,.3],c:'#eab776',glow:true});
   for(const edge of[0,c.w])staticParts.push({p:[(c.x+edge)*.1,12,(c.y+c.h/2+side*c.h*.5)*.1],s:[.7,24,.7],c:'#23373c'});
  }
 }
 for(let x=250;x<m.width-200;x+=110){
  staticParts.push({p:[x*.1,.025,m.entry.y*.1],s:[5,.05,.3],c:'#d7cda9'});
  for(const y of[230,m.height-260]){
   staticParts.push({p:[x*.1,18,y*.1],s:[.7,36,.7],c:'#2a3c40'});
   staticParts.push({p:[x*.1,36,y*.1],s:[6,1,2],c:'#d0c7a3',glow:true});
  }
 }
 const staticGroups=new Map();for(const p of staticParts){const key=p.c+!!p.glow;if(!staticGroups.has(key))staticGroups.set(key,[]);staticGroups.get(key).push(p);}
 for(const entries of staticGroups.values()){const mesh=batch(box,entries[0].c,entries,entries[0].glow);entries.forEach((e,i)=>put(mesh,i,e.p,e.s));mesh.instanceMatrix.needsUpdate=true;}
 const signTextures=[],signGeometries=[],signMaterials=[];
 for(const [i,c]of m.compounds.entries()){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#172a30';ctx.fillRect(0,0,768,160);ctx.fillStyle='#f1c586';ctx.font='bold 44px sans-serif';ctx.fillText(c.name,20,70);ctx.fillStyle='#a9c9ba';ctx.font='24px monospace';ctx.fillText('BREAKWATER / '+(i+1)+' / LIVE DEMOLITION',22,120);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const geometry=new T.PlaneGeometry(25,5.2),material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),mesh=new T.Mesh(geometry,material);
  mesh.position.set((c.x-1)*.1,18,(c.y+c.h/2)*.1);mesh.rotation.y=-Math.PI/2;parent.add(mesh);signTextures.push(texture);signGeometries.push(geometry);signMaterials.push(material);
 }
 const exit=new T.Mesh(new T.RingGeometry(13.8,15.5,48),new T.MeshBasicMaterial({color:'#a5ffd1',side:T.DoubleSide}));exit.position.set(m.exit.x*.1,.05,m.exit.y*.1);exit.rotation.x=-Math.PI/2;parent.add(exit);
 const beam=new T.Mesh(new T.CylinderGeometry(.3,1,60,8),new T.MeshBasicMaterial({color:'#a5ffd1',transparent:true,opacity:.22,depthWrite:false}));beam.position.set(m.exit.x*.1,30,m.exit.y*.1);parent.add(beam);
 const debris=batch(rock,'#afaa91',Array(DESTRUCTION_LIMITS.debris)),rubble=batch(rock,'#716e62',Array(DESTRUCTION_LIMITS.rubble));debris.count=rubble.count=0;debris.castShadow=false;
 let revision=-1,lastState=null,lastDestroyed=-1;const motionQuery=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)'),colors=Object.fromEntries(Object.entries(DESTRUCTION_MATERIALS).map(([id,m])=>[id,new T.Color(m.color)]));
 const panelColor=new T.Color(),dark=new T.Color('#433c34');
 return{
  stats(){return{debris:debris.count};},
  update(w){
   bindDestruction(m,w.destruction);const state=w.destruction;if(!state)return;
   if(revision!==state.revision||lastState!==state&&w.time<.1){
    revision=state.revision;
    for(const b of batches.values()){
     let dirty=false;
     for(let i=0;i<b.pieces.length;i++){
      const o=b.pieces[i],hp=o.breakable===undefined?1:state.hp[o.breakable],frame=b.frames[i];
      if(b.hp[i]===hp)continue;b.hp[i]=hp;dirty=true;
      panelColor.copy(colors[b.material]).lerp(dark,o.breakable===undefined?0:(1-hp/frame.max)*.6);
      put(b.mesh,i,frame.p,hp>0?frame.s:zero,panelColor);
     }
     if(dirty){b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;}
    }
    for(const b of accentGroups.values()){
     let dirty=false;for(let i=0;i<b.entries.length;i++){const a=b.entries[i],alive=state.hp[a.o.breakable]>0?1:0;if(b.alive[i]===alive)continue;b.alive[i]=alive;dirty=true;put(b.mesh,i,a.p,alive?a.s:zero);}
     if(dirty)b.mesh.instanceMatrix.needsUpdate=true;
    }
    if(lastDestroyed!==state.destroyed){
     lastDestroyed=state.destroyed;let count=0;
     for(const o of m.obstacles)if(o.breakable!==undefined&&state.hp[o.breakable]<=0&&count<DESTRUCTION_LIMITS.rubble)put(rubble,count++,[(o.x+o.w/2)*.1,.2,(o.y+o.h/2)*.1],[Math.min(3,o.w*.04),.35,Math.min(3,o.h*.04)]);
     rubble.count=count;rubble.instanceMatrix.needsUpdate=true;
    }
   }
   lastState=state;let count=0;
   const reduced=motionQuery?.matches;
   for(let i=state.events.length-1;i>=0&&count<DESTRUCTION_LIMITS.debris;i--){
    const e=state.events[i],age=w.time-e.at;if(age<0||age>1.9)continue;
    const o=structureFor(m,e.piece),pieces=reduced?3:e.kind==='collapse'?12:8;
    for(let j=0;j<pieces&&count<DESTRUCTION_LIMITS.debris;j++){
     const slab=e.kind==='collapse'&&j===0,angle=e.id*2.399+j*2.399,speed=slab?.8:(j%3+1)*4,life=slab?Math.min(1,Math.max(0,(1.9-age)/.45)):Math.max(0,1-age/1.9);
     stamp.position.set(e.x*.1+Math.cos(angle)*speed*age,Math.max(.15,e.z*.1+(slab?0:5+j%4*2)*age-12*age*age),e.y*.1+Math.sin(angle)*speed*age);
     stamp.rotation.set(age*(slab?.3:(j+1)*2),angle,age*(slab?.5:4));
     if(slab)stamp.scale.set(o.w*.065*life,Math.max(.4,(o.height-(o.baseZ||0))*.035)*life,o.h*.065*life);else stamp.scale.setScalar((e.kind==='collapse'?.6:.32)*life);
     stamp.updateMatrix();debris.setMatrixAt(count,stamp.matrix);debris.setColorAt(count,colors[o.material]);count++;
    }
   }
   debris.count=count;debris.instanceMatrix.needsUpdate=true;if(debris.instanceColor)debris.instanceColor.needsUpdate=true;
   beam.visible=m.variant==='level'&&w.siege?.phase===3;
  },
  dispose(){for(const mesh of owned){mesh.removeFromParent();mesh.material.dispose();mesh.dispose();}box.dispose();tank.dispose();rock.dispose();colliderMat.dispose();floor.material.dispose();exit.geometry.dispose();exit.material.dispose();beam.geometry.dispose();beam.material.dispose();signTextures.forEach(t=>t.dispose());signGeometries.forEach(g=>g.dispose());signMaterials.forEach(m=>m.dispose());}
 };
}
