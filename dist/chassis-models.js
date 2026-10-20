import * as T from './vendor/three.module.min.js';
import{chassisFor}from './chassis.js';
import{CHASSIS_ART}from './chassis-art.js';

const round=new T.IcosahedronGeometry(1,2),hoop=new T.TorusGeometry(1,.11,6,24),plates=new Map(),up=new T.Vector3(0,1,0);
// Replace structural shells, never the articulated rig, weapon mounts or live jets.
// Selected part tiers change shell bulk; equipment can add hardware after this pass.
export function buildChassisModel({body,head,arms,legs,jets,build},k){
 const c=chassisFor(build),art=CHASSIS_ART[c.id];if(!art)return null;
 const{box,cyl,glow,mesh,mat}=k,dark='#172732',steel='#9eb1b9',black='#0a141e',light=build.trailColor||'#80f7ff';
 const paint=slot=>build.partColors?.[slot]||build.color||'#79b9bd';
 const bulk=slot=>({light:.86,standard:1,heavy:1.13}[build.parts?.[slot]]||1);
 for(const root of[body,head,...arms,...arms.map(a=>a.userData.elbow),...legs])for(const child of [...root.children])if(child.isMesh)child.removeFromParent();
 const group=(parent,name)=>{const g=new T.Group();g.name='chassis:'+name;parent.add(g);return g;};
 const hull=group(body,'hull'),helmet=group(head,'head'),pack=group(body,'propulsion'),mounts=group(body,'mounts');
 const shoulders=arms.map((a,i)=>group(a,'shoulder-'+i)),forearms=arms.map((a,i)=>group(a.userData.elbow,'forearm-'+i)),feet=legs.map((a,i)=>group(a,'undercarriage-'+i));
 head.position.set(...art.head);legs.forEach((leg,i)=>leg.position.x=(i?1:-1)*art.stance);
 const orb=(p,x,y,z,a,b,d,color)=>mesh(p,round,mat(color),x,y,z,a,b,d);
 const ring=(p,x,y,z,r,color,rx=0,ry=0)=>{const o=mesh(p,hoop,mat(color),x,y,z,r,r,r);o.rotation.set(rx,ry,0);return o;};
 const plate=(p,x,y,z,points,depth,color)=>{const key=JSON.stringify(points);if(!plates.has(key)){const shape=new T.Shape();points.forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1});geo.translate(0,0,-.5);plates.set(key,geo);}return mesh(p,plates.get(key),mat(color),x,y,z,1,1,depth);};
 const strut=(p,a,b,r,color)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.sub(av),o=cyl(p,0,0,0,r,delta.length(),color);o.position.copy(av.addScaledVector(delta,.5));o.quaternion.setFromUnitVectors(up,delta.normalize());return o;};
 const fin=(p,x,y,z,w,h,d,color,angle)=>{const o=box(p,x,y,z,w,h,d,color);o.rotation.z=angle;return o;};
 const vent=(p,x,y,z,w,n=4,facing=-1)=>{box(p,x,y,z,w,.13*n,.12,black);for(let i=0;i<n;i++)box(p,x,y+(i-(n-1)/2)*.13,z+facing*.08,w*.86,.045,.05,steel);};
 const eye=(p,x,y,z,w=.7)=>{box(p,x,y,z,w+.14,.23,.17,black);glow(p,x,y,z-.1,w,.075,.04,light);};
 const lens=(p,x,y,z,r)=>{ring(p,x,y,z,r,steel);orb(p,x,y,z-.02,r*.78,r*.78,.12,black);mesh(p,round,mat(light,true),x,y,z-.15,r*.55,r*.55,.06);};
 const pelvis=(w=.65)=>{cyl(hull,0,2.7,0,.3,.55,dark);box(hull,0,2.45,0,w*2,.3,.75,dark);};
 const chest=(points,depth=1.2)=>plate(hull,0,3.65,0,points,depth,paint('torso'));
 const brow=(style='knight')=>{
  if(style==='dome'){orb(helmet,0,.05,0,.62,.52,.6,paint('head'));eye(helmet,0,0,-.56,.82);box(helmet,0,-.3,-.52,.34,.18,.22,steel);}
  else if(style==='beak'){plate(helmet,0,.05,0,[[-.5,.18],[0,.42],[.5,.18],[.3,-.24],[0,-.43],[-.3,-.24]],.85,paint('head'));eye(helmet,0,.03,-.46,.65);plate(helmet,0,-.23,-.5,[[-.18,.12],[.18,.12],[0,-.32]],.4,steel);}
  else{plate(helmet,0,0,0,[[-.53,.35],[.53,.35],[.61,-.08],[0,-.48],[-.61,-.08]],.9,paint('head'));eye(helmet,0,.04,-.5,.78);box(helmet,0,.05,-.61,.09,.43,.09,steel);}
 };
 const armsFor=style=>arms.forEach((arm,i)=>{
  const s=i?1:-1,p=shoulders[i],f=forearms[i],color=paint('arms');p.scale.setScalar(bulk('arms'));f.scale.setScalar(bulk('arms'));
  cyl(p,0,-.4,0,.17,.95,dark);orb(p,0,0,0,.28,.28,.3,steel);box(f,0,-.44,0,.28,.85,.34,dark);
  if(style==='skeletal'){strut(p,[s*.22,.15,.2],[s*.16,-.9,.2],.085,steel);box(f,s*.17,-.4,0,.13,.75,.5,color);}
  else if(style==='blade'){plate(p,s*.15,.2,-.03,[[-.48,.4],[.48,.7],[.3,-.65],[-.25,-.24]],.7,color);plate(f,0,-.4,-.12,[[-.25,.4],[.35,.2],[0,-.7]],.55,color);}
  else if(style==='samurai'){for(let j=0;j<3;j++)box(p,s*(.15+j*.13),.12-j*.29,0,1.2,.22,1.05,color);box(f,0,-.45,-.12,.72,.73,.72,color);for(let j=0;j<3;j++)box(f,0,-.2-j*.22,-.51,.66,.045,.04,steel);}
  else if(style==='round'||style==='brawler'){const b=style==='brawler';orb(p,s*.18,-.05,0,b?.95:.72,b?.73:.6,b?.86:.7,color);orb(f,0,-.48,-.08,b?.79:.51,b?.75:.55,b?.72:.5,color);if(b){box(f,0,-.92,-.48,1.25,.35,.5,dark);for(let j=0;j<3;j++)box(f,(j-1)*.38,-.92,-.77,.24,.21,.1,steel);}else eye(p,0,0,-.7,.45);}
  else if(style==='aero'){plate(p,s*.15,.08,0,[[-.62,.32],[.62,.32],[.72,-.25],[-.5,-.58]],1.45,color);eye(p,0,.05,-.77,.6);cyl(f,0,-.45,0,.4,.85,color);box(f,0,-.45,-.44,.48,.5,.12,steel);}
  else if(style==='bunker'||style==='curtain'){box(p,s*.15,-.1,0,1.22,style==='curtain'?1.9:1.5,1.7,color);box(p,s*.15,.75,0,1.35,.18,1.8,steel);box(f,0,-.55,-.05,.93,1.15,1.1,color);vent(p,s*.15,-.1,-.88,.8);}
  else if(style==='industrial'){if(i===0){plate(p,0,-.25,0,[[-.8,.65],[.8,.65],[.7,-1],[-.7,-1]],1.2,color);for(let j=0;j<4;j++)fin(p,-.55+j*.36,-.15,-.66,.11,1.1,.05,steel,-.4);}else{box(p,0,.1,0,1.3,.55,1.3,color);vent(p,0,.1,-.7,.9);}cyl(f,s*.25,-.4,0,.12,.85,steel);box(f,0,-.63,-.3,.75,.45,.7,color);}
  else if(style==='sniper'){box(p,0,.16,0,i? .66:1.05,i?.45:1.15,.9,color);strut(f,[s*.25,0,.1],[s*.25,-.85,.1],.09,steel);box(f,0,-.5,-.22,.42,.7,.5,color);}
  else{plate(p,0,0,0,[[-.65,.45],[.65,.45],[.75,-.3],[0,-.65],[-.75,-.3]],1.15,color);box(f,0,-.47,-.12,.72,.9,.82,color);box(f,0,-.4,-.56,.5,.58,.08,steel);}
 });
 const legsFor=style=>feet.forEach((p,i)=>{
  const s=i?1:-1,color=paint('legs');p.scale.x=bulk('legs');
  if(style==='track'){
   box(p,0,-1.5,0,1.12,1.18,2.8,black);box(p,0,-.82,0,1.25,.26,2.65,color);
   for(const z of[-.95,-.32,.32,.95]){const wheel=cyl(p,s*.59,-1.55,z,.4,.13,steel);wheel.rotation.z=Math.PI/2;ring(p,s*.67,-1.55,z,.24,dark,0,Math.PI/2);}
   for(let j=0;j<11;j++)for(const y of[-2.08,-.94])box(p,0,y,-1.22+j*.245,1.22,.1,.13,steel);
   for(const z of[-1.4,1.4])for(let j=0;j<4;j++)box(p,0,-1.85+j*.23,z,1.22,.12,.09,steel);
   strut(p,[0,0,0],[0,-.8,0],.22,dark);return;
  }
  if(style==='quad'){
   for(const z of[-1,1]){strut(p,[0,-.05,0],[s*.63,-.75,z*.85],.19,steel);orb(p,s*.63,-.75,z*.85,.28,.28,.28,dark);strut(p,[s*.63,-.75,z*.85],[s*.92,-1.92,z*1.3],.18,color);plate(p,s*.92,-1.92,z*1.3,[[-.4,.15],[.4,.15],[.55,-.18],[-.55,-.18]],.85,color);box(p,s*.63,-.75,z*.85,.57,.35,.6,color);}return;
  }
  const runner=style==='runner',stilt=style==='stilt'||style==='clamp',knee=runner?[s*.1,-.92,-.42]:[s*.06,-.97,0],ankle=runner?[s*.15,-1.85,.35]:[0,-1.85,.02];
  strut(p,[0,0,0],knee,stilt?.12:.22,dark);strut(p,knee,ankle,stilt?.095:.2,steel);orb(p,...knee,.25,.24,.24,dark);
  if(runner){plate(p,0,-.6,-.28,[[-.3,.42],[.35,.2],[.15,-.5],[-.16,-.4]],.55,color);box(p,s*.1,-1.5,.22,.3,.65,.3,color);for(const toe of[-1,1])strut(p,[0,-1.94,.26],[toe*.26,-2.12,-.65],.12,steel);}
  else if(stilt){box(p,s*.1,-.52,.13,.23,.75,.35,color);box(p,0,-1.52,.13,.22,.7,.3,color);box(p,0,-2.06,-.2,style==='clamp'?.5:.38,.17,.95,color);if(style==='clamp')for(const z of[-.65,.4])box(p,0,-1.96,z,.6,.28,.15,steel);}
  else if(style==='rescue'){orb(p,0,-.55,0,.43,.68,.43,color);orb(p,0,-1.55,0,.5,.55,.5,color);box(p,0,-2.01,-.23,.88,.28,1.15,dark);}
  else if(style==='industrial'){for(const x of[-.3,.3])strut(p,[x,-.1,.15],[x,-1.86,.15],.09,steel);box(p,0,-1.45,-.18,.57,.77,.5,color);box(p,0,-2,-.1,1.18,.3,1.42,dark);for(const z of[-.72,.52])box(p,0,-2.02,z,1.3,.3,.18,steel);}
  else{const wide=style==='bunker'||style==='brawler';box(p,0,-.5,0,wide?.85:.65,.95,.8,dark);plate(p,0,-1.4,-.2,[[-(wide?.55:.38),.52],[wide?.55:.38,.52],[wide?.48:.3,-.48],[-(wide?.48:.3),-.48]],wide?.95:.7,color);box(p,0,-2.02,-.3,wide?1.25:.85,.3,wide?1.7:1.25,color);if(style==='brawler')for(let t=0;t<3;t++)box(p,(t-1)*.36,-2.02,-1.15,.21,.18,.3,steel);}
 });
 const fan=(p,x,y,z,r)=>{ring(p,x,y,z,r,paint('booster'));ring(p,x,y,z,r*.8,dark);orb(p,x,y,z,.15,.15,.13,steel);for(let j=0;j<4;j++){const a=j*Math.PI/2;const vane=box(p,x+Math.cos(a)*r*.35,y+Math.sin(a)*r*.35,z,.55*r,.14*r,.12,steel);vane.rotation.z=a+.45;}};
 const backPair=(style='slim',spread=.8)=>{for(const s of[-1,1]){if(style==='wing'){plate(pack,s*1.35,4,1.12,[[0,.35],[s*1.65,-.35],[s*1.8,-.85],[0,-.3]],.24,paint('booster'));box(pack,s*1.1,3.4,1.25,.45,1.65,.58,dark);}else{box(pack,s*spread,3.6,1.15,style==='pod'?.8:.4,style==='pod'?1.75:1.4,.75,paint('booster'));vent(pack,s*spread,3.8,1.56,style==='pod'?.5:.25,4,1);}}};
 pelvis(art.stance);
 switch(c.id){
  case 'lark':
   for(const s of[-1,1]){strut(hull,[s*.7,4.3,0],[0,2.95,0],.13,steel);plate(hull,s*.38,3.8,-.15,[[-.21,.5],[.21,.3],[0,-.6]],.5,paint('torso'));fin(pack,s*.7,4,1,.16,1.4,.45,paint('booster'),-s*.3);}orb(hull,0,3.2,0,.27,.32,.32,dark);eye(hull,0,3.6,-.4,.35);brow('beak');for(const s of[-1,1])strut(helmet,[s*.3,.3,0],[s*.7,.8,.15],.035,steel);armsFor('skeletal');legsFor('runner');box(pack,0,3.1,1.35,.24,.22,1.2,dark);break;
  case 'needle':
   box(hull,0,3.6,0,.68,1.85,.78,paint('torso'));vent(hull,0,3.5,-.43,.45,6);lens(helmet,0,0,-.08,.47);box(helmet,0,0,.18,.68,.72,.65,paint('head'));box(pack,.58,4.6,.8,.12,2.45,.13,steel);glow(pack,.58,5.8,.8,.18,.13,.16,light);for(const s of[-1,1])strut(pack,[s*.4,4.3,.5],[s*.8,2.65,1.35],.08,steel);armsFor('sniper');legsFor('stilt');break;
  case 'wisp':
   ring(hull,0,3.65,0,.86,paint('torso'));ring(hull,0,3.65,-.04,.65,steel);orb(hull,0,3.65,0,.31,.31,.32,dark);glow(hull,0,3.65,-.32,.28,.28,.06,light);strut(hull,[0,2.55,0],[0,2.95,0],.16,steel);box(helmet,0,0,0,1.15,.32,.55,paint('head'));for(const x of[-.36,0,.36])lens(helmet,x,0,-.3,.12);for(const s of[-1,1])for(const y of[3.2,4.65]){strut(pack,[0,y,.65],[s*1.35,y,.8],.1,steel);fan(pack,s*1.35,y,.8,.59);}armsFor('skeletal');legsFor('clamp');break;
  case 'kestrel':
   chest([[-1,.65],[0,.15],[1,.65],[.62,-.75],[0,-1],[-.62,-.75]],.95);for(const s of[-1,1])fin(hull,s*.45,3.7,-.58,.13,1,.14,steel,-s*.65);brow('beak');armsFor('blade');legsFor('runner');backPair('wing');break;
  case 'ronin':
   chest([[-.95,.65],[.95,.65],[.7,-.75],[-.7,-.75]],1.15);for(let j=0;j<4;j++)box(hull,0,3.3+j*.24,-.62,1.5,.07,.07,steel);brow();for(const s of[-1,1]){strut(helmet,[s*.25,.3,-.13],[s*.73,.5,-.13],.085,steel);strut(helmet,[s*.73,.5,-.13],[s*.92,1.03,-.13],.07,steel);for(let j=0;j<3;j++)fin(hull,s*(.46+j*.28),2.6,0,.42,.85,1.08,paint('torso'),s*.16);}armsFor('samurai');legsFor('knight');backPair();break;
  case 'harrier':
   chest([[-.55,.85],[.55,.85],[.8,-.55],[0,-1.2],[-.8,-.55]],1.5);plate(hull,0,3.65,-.82,[[-.35,.6],[.35,.6],[0,-.8]],.55,dark);brow('beak');backPair('wing');for(const s of[-1,1]){fin(pack,s*.7,4.9,1.05,.14,1.5,.8,paint('booster'),-s*.6);cyl(pack,s*1.15,3.5,1.25,.37,2,steel);}armsFor('round');legsFor('stilt');break;
  case 'vanguard':
   chest([[-1.04,.7],[1.04,.7],[1.15,-.22],[0,-1],[-1.15,-.22]],1.4);plate(hull,0,3.8,-.78,[[-.7,.35],[.7,.35],[0,-.6]],.13,steel);eye(hull,0,4.15,-.9,.8);brow();armsFor('knight');legsFor('knight');backPair('pod');break;
  case 'longbow':
   chest([[-.6,.85],[.6,.85],[.52,-1],[-.52,-1]],1.05);box(hull,0,3.8,-.58,.16,1.25,.12,steel);box(helmet,-.2,-.05,0,.6,.47,.7,paint('head'));eye(helmet,-.2,0,-.4,.38);strut(helmet,[.3,-.2,.2],[.3,.76,.2],.11,steel);box(helmet,.3,.72,-.08,.45,.38,.85,paint('head'));lens(helmet,.3,.72,-.54,.16);box(pack,-.8,4.6,.8,.14,2.1,.2,dark);backPair('slim',.5);armsFor('sniper');legsFor('stilt');break;
  case 'warden':
   orb(hull,0,3.65,0,1.05,1.2,.86,paint('torso'));ring(hull,0,3.8,-.66,.58,steel);glow(hull,0,3.8,-.88,.7,.16,.05,'#9dffc4');glow(hull,0,3.8,-.89,.16,.7,.05,'#9dffc4');brow('dome');armsFor('round');legsFor('rescue');for(const x of[-.75,0,.75]){cyl(pack,x,3.6,1.1,.27,1.7,paint('booster'));ring(pack,x,4.5,1.1,.25,steel,Math.PI/2);box(pack,x,3.6,1.39,.32,.18,.08,steel);}break;
  case 'bastion':
   chest([[-1.35,.62],[1.35,.62],[1.05,-.85],[-1.05,-.85]],1.7);plate(hull,0,3.7,-.94,[[-1.15,.45],[1.15,.45],[.8,-.55],[-.8,-.55]],.2,steel);box(helmet,0,0,0,1.42,.53,1.13,paint('head'));box(helmet,0,.3,-.08,1.65,.22,1.38,steel);eye(helmet,0,-.02,-.63,1.1);armsFor('bunker');legsFor('bunker');backPair('pod',1);box(hull,0,2.65,-.7,2.1,.4,.5,paint('torso'));break;
  case 'anvil':
   chest([[-1.1,.7],[.85,.85],[1.17,-.7],[-.78,-.9]],1.5);box(hull,0,3.65,-.82,1.25,1.13,.14,black);for(let j=0;j<5;j++){glow(hull,0,3.22+j*.2,-.91,.94,.07,.04,'#ff995b');box(hull,0,3.22+j*.2,-.96,1.2,.035,.06,steel);}box(helmet,0,0,0,1,.65,.85,paint('head'));eye(helmet,0,0,-.47,.68);for(const s of[-1,1]){cyl(pack,s*.85,4.55,1,.23,2.4,dark);cyl(pack,s*.85,5.65,1,.3,.2,steel);orb(pack,s*.85,5.78,1,.18,.06,.18,black);}vent(hull,0,3.6,.85,1.3,6,1);armsFor('industrial');legsFor('industrial');break;
  case 'skyguard':
   orb(hull,0,3.65,0,.92,1.05,1.02,paint('torso'));plate(hull,0,3.5,-.9,[[-.45,.65],[.45,.65],[0,-.75]],.3,steel);brow('dome');for(const s of[-1,1]){box(pack,s*2.1,4.65,.8,2.7,.17,.85,paint('booster'));box(pack,s*1.9,3.85,1,2.3,.13,.7,steel);fan(pack,s*3.15,4.75,.85,.82);box(pack,s*3.15,4.1,1.15,.85,1.1,.8,paint('booster'));}vent(hull,0,3.7,1.04,.7,5,1);armsFor('aero');legsFor('stilt');break;
  case 'colossus':
   chest([[-1.35,.65],[1.35,.65],[1,-.65],[.5,-1],[-.5,-1],[-1,-.65]],1.7);ring(hull,0,3.8,-.9,.62,steel);orb(hull,0,3.8,-.98,.46,.46,.13,black);mesh(hull,round,mat(light,true),0,3.8,-1.12,.29,.29,.06);box(helmet,0,0,0,1.05,.6,1.05,paint('head'));eye(helmet,0,.05,-.56,.76);box(helmet,0,-.25,-.51,.65,.23,.25,steel);armsFor('brawler');legsFor('brawler');backPair('pod',1.05);break;
  case 'leviathan':
   chest([[-1.25,.55],[1.25,.55],[1.5,-.3],[0,-1.05],[-1.5,-.3]],1.9);plate(hull,0,3.6,-1.02,[[-1,.35],[1,.35],[0,-.9]],.22,steel);box(helmet,0,-.15,0,1.25,.42,1.2,paint('head'));box(helmet,0,.28,.1,.85,.44,.85,paint('head'));eye(helmet,0,.28,-.37,.7);strut(helmet,[0,.5,.3],[0,1.12,.3],.05,steel);box(helmet,0,.92,.3,.75,.06,.1,steel);for(const s of[-1,1]){box(pack,s*1.2,3.7,1.1,.45,.8,1.8,paint('booster'));vent(pack,s*1.2,3.75,.15,.3);fin(pack,s*1.75,3.65,1.15,.85,.16,1.7,steel,-s*.2);}armsFor('knight');legsFor('quad');break;
  case 'citadel':
   chest([[-.9,.75],[.9,.75],[1.2,-.9],[-1.2,-.9]],1.4);box(hull,0,3.5,-.82,1.5,.9,.22,steel);box(hull,0,3.5,-.97,.75,.57,.08,dark);eye(hull,0,3.65,-1.03,.57);box(helmet,0,.02,0,1.05,.95,1.05,paint('head'));box(helmet,0,.54,0,1.45,.18,1.4,steel);for(const x of[-.55,0,.55])for(const z of[-.5,.5])box(helmet,x,.76,z,.28,.32,.35,paint('head'));eye(helmet,0,.05,-.57,.75);armsFor('curtain');legsFor('track');box(pack,0,3.75,1.15,1.7,1.8,.7,paint('booster'));vent(pack,0,3.75,1.54,1.3,7,1);break;
 }
 hull.scale.x=bulk('torso');helmet.scale.setScalar(bulk('head'));
 strut(mounts,[0,4.15,0],art.head,.15,dark);cyl(mounts,0,4.4,0,.24,.15,steel);
 arms.forEach((arm,i)=>{const s=i?1:-1;for(const z of[-.2,.2])strut(mounts,[s*(c.id==='wisp'?.68:.25),4.15,z],[arm.position.x,4.15,z],.095,steel);});
 const mainJets=jets.filter(j=>j.parent===body);mainJets.forEach((jet,i)=>jet.position.set((i?1:-1)*(c.id==='wisp'?1.35:c.id==='skyguard'?3.15:c.size==='scout'?.6:.85),c.id==='wisp'?2.65:c.id==='skyguard'?3.25:2.7,c.id==='skyguard'?1.15:1.3));
 legs.forEach((leg,i)=>{const heel=jets.find(j=>j.parent===leg);if(c.id==='leviathan')heel.position.set((i?1:-1)*.92,-1.94,-1.15);if(c.id==='citadel')heel.position.set(0,-1.65,.7);});
 body.userData.chassisShells={hull,helmet,pack,mounts,shoulders,forearms,feet};
 return{id:c.id,name:art.name,gait:art.gait,locomotion:c.id==='citadel'?'tracks':c.id==='leviathan'?'quadruped':'biped'};
}
