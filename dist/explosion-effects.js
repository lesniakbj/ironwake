import * as T from './vendor/three.module.min.js';
const geometry=new T.IcosahedronGeometry(1,1),stamp=new T.Object3D(),up=new T.Vector3(0,1,0),direction=new T.Vector3();
// Bounded, reusable bursts: irregular fire/cloud volumes and streaks, never flat hit rings.
export function createExplosionPool(parent){
 const pool=[];
 function layer(color,count,additive){const material=new T.MeshBasicMaterial({color,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});const mesh=new T.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;return mesh;}
 function create(){const group=new T.Group();group.add(layer('#ffb039',12,true),layer('#454859',10,false),layer('#fff4c9',20,true));parent.add(group);return group;}
 return{
 update(events){const bursts=events.filter(e=>e.kind==='explosion').slice(-24);while(pool.length<bursts.length)pool.push(create());pool.forEach((group,i)=>{const e=bursts[i];group.visible=!!e;if(!e)return;const plasma=e.weapon==='plasma',age=Math.max(0,e.max-e.life),progress=age/e.max,radius=e.r*.1,spread=1-Math.exp(-age*9),fade=Math.max(0,1-progress),seed=e.id||0;group.position.set(e.x*.1,Math.max(.2,e.z*.1),e.y*.1);
 const [fire,cloud,sparks]=group.children;fire.material.color.set(plasma?'#ad7bff':age<.12?'#fff1b4':'#ff862c');fire.material.opacity=Math.min(1,fade*2)*(plasma?.4:.6);cloud.material.color.set(plasma?'#7249ae':'#3d4652');cloud.material.opacity=Math.sin(progress*Math.PI)*(plasma?.16:.4);sparks.material.color.set(plasma?'#bdedff':'#ffe3a1');sparks.material.opacity=fade;
 for(let j=0;j<20;j++){const a=j*2.39996+seed*.71,y=Math.sin(j*6.73+seed)*.8;direction.set(Math.cos(a),y,Math.sin(a)).normalize();
 if(j<12){const reach=j===0?0:radius*spread*(.22+(j%4)*.12);stamp.position.copy(direction).multiplyScalar(reach);stamp.rotation.set(a,age*(j%2?2:-2),a*.3);const size=radius*(j===0?.32:.2)*spread*Math.pow(fade,.65)*(1+Math.sin(age*32+j)*.12);stamp.scale.set(size,size*(plasma?.65:1.1),size);stamp.updateMatrix();fire.setMatrixAt(j,stamp.matrix);}
 if(j<10){stamp.position.copy(direction).multiplyScalar(radius*spread*.55);stamp.position.y+=age*radius*.5;stamp.rotation.set(a,0,age);const size=radius*(.15+progress*.2);stamp.scale.set(size,size*.8,size);stamp.updateMatrix();cloud.setMatrixAt(j,stamp.matrix);}
 stamp.position.copy(direction).multiplyScalar(radius*spread*(.6+(j%5)*.1));stamp.position.y-=plasma?0:age*age*radius*.3;stamp.quaternion.setFromUnitVectors(up,direction);const size=Math.max(.01,fade)*radius*.012;stamp.scale.set(size,size*(plasma?16:9),size);stamp.updateMatrix();sparks.setMatrixAt(j,stamp.matrix);
 }
 for(const part of group.children)part.instanceMatrix.needsUpdate=true;
 });},
 dispose(){for(const group of pool){for(const part of group.children){part.material.dispose();part.dispose();}group.removeFromParent();}pool.length=0;}
 };
}
