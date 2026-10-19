// Attract-mode choreography uses the game's actual mechs, muzzle sockets, jets and weapons.
// All effects share the scene clock; pausing freezes the entire battle. Pools stay bounded.
export function createHomeBattle({T,box,glow,lighting,makeMech,animateMech,cleanBuild,createSky,makeProjectile,updateProjectile,createExplosionPool}){
 const scene=new T.Scene();scene.background=new T.Color('#080e20');scene.fog=new T.Fog('#101a30',85,210);lighting(scene);
 const camera=new T.PerspectiveCamera(49,1,.1,1000),sky=new T.Group();scene.add(sky);createSky(sky,{seed:84901,biome:0});
 const floor=box(scene,0,-.55,-8,120,1,110,'#25364a');floor.receiveShadow=true;
 for(let i=-6;i<=6;i++){glow(scene,i*9,.02,-8,.025,.02,110,'#426078');glow(scene,0,.02,i*8,120,.02,.025,'#426078');}
 for(const x of[-43,43]){box(scene,x,1,-12,3,2,80,'#152538');glow(scene,x,2.03,-12,2,.05,78,'#ff8752');}
 for(let i=0;i<7;i++){const x=-45+i*15;box(scene,x,7,-49,8,14,5,'#1b2a41');glow(scene,x,7,-46.4,.14,11,.08,'#67c6f5');}
 const rim=new T.DirectionalLight('#ff8752',1.1);rim.position.set(20,12,-12);scene.add(rim);
 const specs=[{weapon:'carbine',melee:'blade',color:'#74adca',trailColor:'#56bfff',parts:{torso:'light',legs:'light',booster:'light'}},{weapon:'launcher',melee:'lance',color:'#d3dadd',trailColor:'#c596ff',parts:{torso:'standard',booster:'standard'}},{weapon:'rotary',melee:'guard',color:'#ee7950',trailColor:'#ff785e',parts:{torso:'heavy',legs:'heavy',booster:'heavy'}}];
 const models=specs.map(b=>{const g=makeMech(cleanBuild(b));scene.add(g);return g;});
 const positions=[new T.Vector3(),new T.Vector3(),new T.Vector3()],aims=positions.map(()=>new T.Vector3());
 const crates=[[-15,-17],[17,-20],[3,-31]].map(([x,z])=>{const group=new T.Group();group.position.set(x,0,z);scene.add(group);box(group,0,2.5,0,4,5,4,'#3f5266');for(const y of[.5,4.5])box(group,0,y,0,4.3,.3,4.3,'#8d9caa');glow(group,0,2.6,2.03,2.8,.2,.04,'#ffa05e');return{group,x,z,destroyed:-1};});
 const shots=specs.map((b,i)=>Array.from({length:i===1?6:12},()=>{const model=makeProjectile(b.weapon);model.visible=false;scene.add(model);return{model,active:false,start:new T.Vector3(),end:new T.Vector3(),at:new T.Vector3(),direction:new T.Vector3()};}));
 const lastShots=[-1,-1,-1],shotIndex=[0,0,0],bursts=[],explosions=createExplosionPool(scene);
 const debrisGeometry=new T.BoxGeometry(1,1,1),debrisMaterial=new T.MeshStandardMaterial({color:'#8c9caa',roughness:.75,metalness:.5}),debris=new T.InstancedMesh(debrisGeometry,debrisMaterial,144),stamp=new T.Object3D();debris.frustumCulled=false;scene.add(debris);
 const fragments=Array.from({length:144},()=>({born:-99,start:new T.Vector3(),velocity:new T.Vector3(),size:0}));let fragmentIndex=0,lastTime=-1,lastCycle=-1,dead=false,serial=1;
 function explode(at,time,radius,shatter=false){bursts.push({id:serial++,x:at.x*10,y:at.z*10,z:at.y*10,r:radius*10,kind:'explosion',weapon:'launcher',born:time,max:shatter?1.1:.26});if(bursts.length>24)bursts.shift();if(shatter)for(let j=0;j<24;j++){const f=fragments[fragmentIndex++%fragments.length],angle=j*2.399;f.born=time;f.start.copy(at);f.velocity.set(Math.cos(angle)*(5+j%5),6+j%7,Math.sin(angle)*(5+j%5));f.size=.2+j%4*.16;}}
 function reset(){for(const row of shots)for(const shot of row){shot.active=false;shot.model.visible=false;}for(const c of crates){c.group.visible=true;c.destroyed=-1;}lastShots.fill(-1);dead=false;}
 return function draw(renderer,canvas,t){
  const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
  if(renderer.domElement.width!==Math.round(width*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(height*renderer.getPixelRatio()))renderer.setSize(width,height,false);
  camera.aspect=width/height;camera.updateProjectionMatrix();
  if(t===lastTime){renderer.render(scene,camera);return;}
  const dt=lastTime<0?.04:Math.min(.05,Math.max(0,t-lastTime)),cycle=Math.floor(t/12),beat=t%12;lastTime=t;
  if(cycle!==lastCycle){reset();lastCycle=cycle;}
  // Fast strafing at ground level, a climbing flank, and a heavy returning fire.
  positions[0].set(-6+Math.sin(t*1.45)*15,1.4+Math.pow(.5+.5*Math.sin(t*1.45),3)*7,8+Math.cos(t*1.45)*7);
  positions[1].set(13+Math.sin(t*.88+1)*11,7+Math.sin(t*1.2)*4,-3+Math.cos(t*.88)*10);
  positions[2].set(3+Math.sin(t*.9)*7,.5,-18+Math.cos(t*1.1)*3);
  const crateIndex=Math.min(2,Math.floor(beat/3)),crate=crates[crateIndex];
  aims[0].copy(positions[2]).y+=3.7;aims[1].set(crate.x,2.5,crate.z);if(crate.destroyed>=0)aims[1].copy(aims[0]);aims[2].copy(positions[0]).y+=3.7;
  if(beat>10.4&&!dead){dead=true;explode(aims[0],t,12,true);}
  for(let i=0;i<3;i++){
   const g=models[i],pos=positions[i],end=aims[i],rate=i===1?.78:i===2?.075:.105,shotNumber=Math.floor(t/rate),firing=!dead||i!==2;
   const angle=Math.atan2(end.z-pos.z,end.x-pos.x),vx=i===0?Math.cos(t*1.45):i===1?Math.cos(t*.88+1):Math.cos(t*.9),vz=i===0?-Math.sin(t*1.45):i===1?-Math.sin(t*.88):0;
   animateMech(g,{x:pos.x*10,y:pos.z*10,altitude:pos.y*10,hp:dead&&i===2?0:100,angle,pitch:Math.atan2(end.y-pos.y-3.7,Math.hypot(end.x-pos.x,end.z-pos.z)),boosting:!dead||i!==2,airborne:i!==2,boostX:vx,boostY:vz,shot:firing?.1:0,shotCount:firing?shotNumber+1:0,meleeTime:0,aimPoint:{x:end.x*10,y:end.z*10,z:end.y*10}},dt,t);
   if(firing&&shotNumber!==lastShots[i]){
    lastShots[i]=shotNumber;const s=shots[i][shotIndex[i]++%shots[i].length];g.updateWorldMatrix(true,true);g.userData.muzzle.getWorldPosition(s.start);s.end.copy(end);
    if(i!==1){s.end.x+=Math.sin(shotNumber*7.1)*1.4;s.end.y+=Math.cos(shotNumber*4.3)*1.2;}
    s.direction.copy(s.end).sub(s.start).normalize();s.born=t;s.duration=i===1?.5:.16;s.active=true;s.crate=i===1&&crate.destroyed<0?crateIndex:-1;
   }
  }
  for(let i=0;i<3;i++)for(const s of shots[i]){
   const age=t-s.born;s.model.visible=s.active&&age<s.duration;if(!s.active)continue;
   if(age>=s.duration){s.active=false;explode(s.end,t,i===1?8:1.1,i===1);if(s.crate>=0){const c=crates[s.crate];c.destroyed=t;c.group.visible=false;}continue;}
   s.at.copy(s.start).lerp(s.end,age/s.duration);
   if(i===1){s.at.y+=Math.sin(age/s.duration*Math.PI)*2.4;s.direction.copy(s.end).sub(s.at).normalize();}
   updateProjectile(s.model,{x:s.at.x*10,y:s.at.z*10,z:s.at.y*10,vx:s.direction.x,vy:s.direction.z,vz:s.direction.y,kind:specs[i].weapon,id:i,origin:{x:s.start.x*10,y:s.start.z*10,z:s.start.y*10}},t);
  }
  for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.life=b.max-(t-b.born);if(b.life<=0)bursts.splice(i,1);}explosions.update(bursts);
  for(let i=0;i<fragments.length;i++){const f=fragments[i],age=t-f.born,alive=age>=0&&age<3.5;stamp.position.copy(f.start).addScaledVector(f.velocity,age);stamp.position.y=Math.max(.15,stamp.position.y-age*age*7);stamp.rotation.set(age*3+i,age*2,age*4);stamp.scale.setScalar(alive?f.size*Math.min(1,(3.5-age)*2):0);stamp.updateMatrix();debris.setMatrixAt(i,stamp.matrix);}debris.instanceMatrix.needsUpdate=true;
  // Low, close framing keeps the models readable; a small impact kick adds weight.
  const kick=bursts.reduce((sum,b)=>sum+(b.r>50?Math.max(0,1-(t-b.born)/.18)*.08:0),0),fit=Math.max(1,.95/camera.aspect);
  camera.position.set(19+Math.sin(t*.28)*3,11+Math.sin(t*.4)*1.4+Math.sin(t*39)*kick,36*fit);
  camera.lookAt(2,4.5,-7);renderer.render(scene,camera);
 };
}
