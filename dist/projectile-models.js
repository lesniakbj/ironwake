import * as T from './vendor/three.module.min.js';
const box=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(1,1),cylinder=new T.CylinderGeometry(1,1,1,10),cone=new T.ConeGeometry(1,1,10),zAxis=new T.Vector3(0,0,1),materials=new Map();
const material=(color,glow=false,opacity=1)=>{const key=[color,glow,opacity].join(':');if(!materials.has(key))materials.set(key,glow?new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,blending:opacity<1?T.AdditiveBlending:T.NormalBlending}):new T.MeshStandardMaterial({color,roughness:.45,metalness:.6}));return materials.get(key);};
function part(root,geometry,color,x,y,z,sx,sy,sz,glow=false,opacity=1){const mesh=new T.Mesh(geometry,material(color,glow,opacity));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);root.add(mesh);return mesh;}
let bladeGeometries;
export function makeProjectile(kind){const root=new T.Group();root.userData.kind=kind;
 if(kind==='bladeWave'){if(!bladeGeometries){const path=new T.CatmullRomCurve3(Array.from({length:17},(_,i)=>{const x=(i-8);return new T.Vector3(x,0,2.3*(1-x*x/64));}));bladeGeometries=[new T.TubeGeometry(path,24,.12,5,false),new T.TubeGeometry(path,24,.35,5,false)];}root.add(new T.Mesh(bladeGeometries[0],material('#baffff',true)),new T.Mesh(bladeGeometries[1],material('#45dfff',true,.35)));}else if(kind==='launcher'){
  const body=part(root,cylinder,'#c3d2dd',0,0,0,.24,1.5,.24);body.rotation.x=Math.PI/2;
  const nose=part(root,cone,'#ff7848',0,0,1.02,.25,.64,.25);nose.rotation.x=Math.PI/2;
  for(const z of[-.5,.4]){const band=part(root,cylinder,'#25394c',0,0,z,.255,.14,.255);band.rotation.x=Math.PI/2;}
  for(let i=0;i<4;i++){const fin=new T.Group();fin.rotation.z=i*Math.PI/2;root.add(fin);part(fin,box,'#e2874b',.26,0,-.5,.45,.07,.55);}
  const nozzle=part(root,cylinder,'#182533',0,0,-.85,.19,.25,.19);nozzle.rotation.x=Math.PI/2;
  const exhaust=new T.Group();exhaust.position.z=-.98;root.add(exhaust);root.userData.exhaust=exhaust;
  const fire=part(exhaust,cone,'#ff8d42',0,0,-.8,.25,1.6,.25,true,.65);fire.rotation.x=-Math.PI/2;
  const white=part(exhaust,cone,'#fff2b0',0,0,-.3,.12,.8,.12,true);white.rotation.x=-Math.PI/2;
  for(let i=0;i<5;i++)part(root,sphere,'#8fa4b5',0,0,-1.7-i*.7,.12+i*.07,.12+i*.07,.24+i*.1,true,.16);
 }else if(kind==='plasma'){
  part(root,sphere,'#e8c9ff',0,0,0,.35,.35,.35,true);part(root,sphere,'#9e55ff',0,0,0,.78,.78,.78,true,.32);
  for(let i=0;i<3;i++){const arc=part(root,box,'#ddafff',0,0,0,.09,1.9,.14,true);arc.rotation.z=i*Math.PI/3;}
  part(root,cone,'#9d5dff',0,0,-1,.45,2,.45,true,.25).rotation.x=-Math.PI/2;
 }else{
  const color=kind==='dynamo'?'#ffd257':kind==='rail'?'#8eeeff':kind==='scatter'?'#cf97ff':kind==='rotary'?'#ff526d':kind==='enemy'?'#ff6c32':'#48dcff',length=kind==='dynamo'?4.8:kind==='rail'?7:kind==='scatter'?1.5:kind==='rotary'?1.6:2.8,radius=kind==='dynamo'?.21:kind==='rail'?.11:kind==='scatter'?.12:.07;
  root.userData.boltLength=length;part(root,box,color,0,0,0,radius*3,radius*3,length,true,.45);part(root,box,'#efffff',0,0,.1,radius,radius,length*.8,true);
  if(kind==='scatter'){const shard=part(root,sphere,color,0,0,.6,.2,.2,.4,true);shard.rotation.z=Math.PI/4;}
 }
 return root;
}
export function updateProjectile(root,b,t){root.position.set(b.x*.1,(b.z??38)*.1,b.y*.1);root.quaternion.setFromUnitVectors(zAxis,new T.Vector3(b.vx,b.vz||0,b.vy).normalize());if(root.userData.boltLength){const distance=b.origin?Math.hypot(b.x-b.origin.x,b.y-b.origin.y,b.z-b.origin.z)*.1:root.userData.boltLength,length=Math.min(root.userData.boltLength,distance);root.scale.z=Math.max(.01,length/root.userData.boltLength);root.position.addScaledVector(new T.Vector3(b.vx,b.vz||0,b.vy).normalize(),-length/2);}if(root.userData.exhaust)root.userData.exhaust.scale.z=.85+Math.sin(t*60+b.id)*.2;if(b.kind==='plasma')root.rotateZ(t*4+b.id);}
