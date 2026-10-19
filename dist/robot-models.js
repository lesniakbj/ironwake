import * as T from './vendor/three.module.min.js';
const box=new T.BoxGeometry(1,1,1),ball=new T.IcosahedronGeometry(1,0),tube=new T.CylinderGeometry(1,1,1,8),ring=new T.TorusGeometry(1,.1,5,20),mats=new Map();
function material(color,lit=false){const k=color+lit;if(!mats.has(k))mats.set(k,lit?new T.MeshBasicMaterial({color}):new T.MeshToonMaterial({color}));return mats.get(k);}
function piece(g,x,y,z,w,h,d,c,lit=false,geo=box){const o=new T.Mesh(geo,material(c,lit));o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=!lit;o.receiveShadow=true;g.add(o);return o;}
function limb(g,x,z,index,kind){const joint=new T.Group();joint.position.set(x,2,z);g.add(joint);const side=Math.sign(x);piece(joint,side*.25,-.35,0,.45,1.2,.5,'#6b737b').rotation.z=side*.4;piece(joint,side*.48,-1.2,.18,.35,1.15,.4,'#28343d').rotation.x=-.35;piece(joint,side*.5,-1.75,-.2,.65,.25,.95,kind==='hunter'?'#be8960':'#82939d');joint.userData.index=index;return joint;}
export function makeRobot(kind){const g=new T.Group(),body=new T.Group();g.add(body);g.userData.robot=true;g.userData.body=body;g.userData.legs=[];g.userData.phase=0;
 if(kind==='hunter'){
  piece(body,0,2.1,.15,2.3,1.35,4.1,'#8f6b50');piece(body,0,2.85,.1,1.5,.55,3.7,'#d1a478');piece(body,0,2.4,-2,1.8,1.2,1.7,'#3b454a');piece(body,0,2.15,-2.95,1.5,.6,.7,'#b4a18a');piece(body,0,2.7,-2.88,1.5,.18,.15,'#ff653a',true);
  for(const side of[-1,1]){piece(body,side*.65,3.4,-1.8,.35,.9,.55,'#d4ac7f').rotation.z=side*.22;piece(body,side*.56,1.8,-3.1,.18,.6,.22,'#c8d9de');for(let i=0;i<3;i++)piece(body,side*1.17,2.25,-.9+i*.8,.08,.45,.35,'#ff8050',true);}
  for(let i=0;i<4;i++)g.userData.legs.push(limb(body,i%2?1.1:-1.1,i<2?-1.3:1.6,i,kind));const tail=new T.Group();tail.position.set(0,2.5,2);body.add(tail);piece(tail,0,.45,.7,.35,.35,1.6,'#4a5660').rotation.x=-.4;piece(tail,0,1,1.5,.4,.4,.8,'#f19d66');g.userData.tail=tail;
 }else if(kind==='wisp'){
  piece(body,0,1.8,0,1.8,1.2,1.7,'#517882',false,ball);piece(body,0,1.9,-1.5,.8,.55,.25,'#e8fbff',true);piece(body,0,1.9,-1.65,.28,.28,.1,'#ff6849',true);piece(body,0,.55,-.5,.4,.4,1.7,'#293845');
  const rotor=new T.Group();rotor.position.y=1.5;body.add(rotor);g.userData.rotor=rotor;for(const side of[-1,1]){piece(body,side*2,1.5,0,2.1,.3,.65,'#739ca2');const hoop=piece(rotor,side*2.5,0,0,1.05,1.05,1.05,'#68e6ec',true,ring);hoop.rotation.x=Math.PI/2;piece(body,side*2.5,.8,0,.4,.9,.4,'#5bd5e9',true);}piece(body,0,3,0,.13,1,.13,'#d6e8e9');
 }else{
  piece(body,0,1.6,0,3.5,1.5,3.6,'#5b756c');piece(body,0,2.5,.3,2.6,.8,3,'#9cb5a0');for(const side of[-1,1]){piece(body,side*1.3,2.1,-1.9,.8,.7,1,'#30434a');piece(body,side*1.3,2.1,-2.45,.45,.35,.12,'#ffd284',true);}const turret=new T.Group();turret.position.y=2.65;body.add(turret);piece(turret,0,.35,0,1.7,.7,1.6,'#31484b');piece(turret,0,.35,-1.5,.45,.45,2.8,'#98aaa6');g.userData.turret=turret;for(let i=0;i<6;i++)g.userData.legs.push(limb(body,i%2?1.55:-1.55,-1.25+Math.floor(i/2)*1.3,i,kind));
 }
 return g;
}
export function animateRobot(g,p,dt,t){const u=g.userData,x=p.x*.1,z=p.y*.1,old=u.previous,speed=old?Math.hypot(x-old.x,z-old.z)/Math.max(.001,dt):0;u.previous={x,z};const f=1-Math.exp(-dt*25);g.position.x=T.MathUtils.lerp(g.position.x,x,f);g.position.z=T.MathUtils.lerp(g.position.z,z,f);g.position.y=(p.altitude||0)*.1;const yaw=-p.angle-Math.PI/2;g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*f;u.phase+=dt*Math.min(24,speed*1.6);const stunned=p.stun>0;
 if(p.species==='wisp'){u.body.position.y=Math.sin(t*3+Number(p.id))*.3;u.body.rotation.z=Math.sin(t*4+Number(p.id))*.08;u.rotor.rotation.y=t*(stunned?1:8);}
 else{for(const leg of u.legs){const cycle=u.phase+(leg.userData.index%2?Math.PI:0)+(leg.userData.index>1?Math.PI:0);leg.rotation.x=stunned?0:Math.sin(cycle)*Math.min(.65,speed*.035);}u.body.position.y=p.windup>0?-.4:Math.sin(u.phase*2)*Math.min(.08,speed*.005);const age=t-(p.lastLunge??-10);if(p.species==='hunter'){u.tail.rotation.y=Math.sin(t*5)*.28;if(age>=0&&age<.3)u.body.position.y+=Math.sin(age/.3*Math.PI)*1.2;}if(u.turret)u.turret.rotation.x=p.windup>0?Math.sin(t*30)*.04:0;}
}
