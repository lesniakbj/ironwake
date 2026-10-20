import{addMuzzleBurst}from './impact-effects.js';
import{BULWARK}from './bulwark.js?v=41';
import{MUZZLES}from './weapon-origin.js?v=41';
import * as T from './vendor/three.module.min.js';
export function makeWeapons(build,k){
 const {box,cyl,glow,mesh,mat,sphereGeometry}=k,dark='#172331',steel='#a6b8c5',orange='#ff9d54',cyan='#80f7ff',purple='#c596ff';
 const detailFX=new T.Group();const gun=new T.Group(),meleeRig=new T.Group(),moving=new T.Group();gun.add(moving,detailFX);
 const tube=(parent,x,y,z,r,length,color)=>{const o=cyl(parent,x,y,z,r,length,color);o.rotation.x=Math.PI/2;return o;};
 const plate=(parent,points,thickness,color)=>{const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,thickness/2,0);return mesh(parent,geo,mat(color,color===cyan||color===purple||color===orange),0,0,0,1,1,1);};
 let muzzleZ=-2.6,shieldFX=null,barrels=null,slide=null,core=null,pile=null,hammerHead=null,trailColor=cyan,tip=new T.Vector3(0,0,-4.5),base=new T.Vector3(0,0,-.6);
 box(gun,0,-.1,.15,.42,.48,.8,dark);
 switch(build.weapon){
 case'dynamo':
 box(gun,0,.1,-.65,1,.8,1.65,dark);tube(gun,0,.1,-1.7,.35,1.8,steel);
 for(const side of[-1,1]){box(gun,side*.47,.1,-1.9,.2,.55,2.4,'#947843');glow(gun,side*.35,.1,-1.9,.08,.25,2.3,'#ffda68');}
 for(let i=0;i<4;i++){const cell=new T.Group();cell.position.set(0,.59,-.5-i*.45);cell.userData.charge=i/4;detailFX.add(cell);glow(cell,0,0,0,.65,.13,.26,'#ffda68');}
 tube(gun,0,.1,-3,.47,.22,dark);core=mesh(gun,sphereGeometry,mat('#ffe28b',true),0,.1,-3.15,.23,.23,.23);muzzleZ=-3.15;break;

 case'flamer':
 box(gun,0,.05,-.7,.9,.8,1.6,dark);tube(gun,0,.1,-1.9,.34,1.65,steel);tube(gun,0,.1,-2.77,.44,.2,dark);glow(gun,0,.1,-2.88,.24,.24,.04,orange);for(const side of[-1,1]){tube(gun,side*.65,-.05,-.4,.29,1.6,'#be5335');tube(gun,side*.65,-.05,.43,.32,.12,steel);for(let i=0;i<4;i++)box(gun,side*.4,.1,-1.5-i*.25,.12,.5,.08,orange);}muzzleZ=-2.85;break;
 case'phaser':
 box(gun,0,.05,-.5,.8,.65,1.5,dark);for(const side of[-1,1]){tube(gun,side*.38,.1,-1.5,.14,2.1,steel);glow(gun,side*.38,.1,-2.58,.2,.2,.06,'#7bffc4');box(gun,side*.53,.1,-.65,.14,.7,.8,'#386f68');}tube(gun,0,.1,-1.7,.25,1.5,'#386f68');core=mesh(gun,sphereGeometry,mat('#9dffda',true),0,.1,-2.42,.2,.2,.2);muzzleZ=-2.6;break;
 case'scatter':
  box(gun,0,.1,-.55,.95,.75,1.6,dark);box(gun,0,.48,-.8,.85,.15,1.6,steel);
  for(const x of[-.27,.27]){tube(gun,x,.12,-1.85,.22,2.1,steel);tube(gun,x,.12,-2.91,.18,.06,dark);glow(gun,x,.12,-2.95,.22,.22,.035,purple);}
  slide=new T.Group();gun.add(slide);box(slide,0,-.25,-1.7,1.08,.4,.7,'#d67c48');for(let i=0;i<4;i++)box(slide,0,-.46,-1.45-i*.16,.9,.05,.06,dark);muzzleZ=-3;break;
 case'rail':
  box(gun,0,0,-.7,.8,.7,1.7,dark);for(const side of[-1,1]){box(gun,side*.3,.1,-2.55,.19,.35,3.5,steel);glow(gun,side*.19,.1,-2.55,.05,.19,3.3,cyan);for(let i=0;i<5;i++)box(gun,side*.42,.1,-1.2-i*.48,.13,.55,.17,dark);}
  slide=new T.Group();gun.add(slide);box(slide,0,.35,-.4,.65,.3,.8,steel);glow(gun,0,.16,-4.25,.16,.14,.06,cyan);core=mesh(gun,sphereGeometry,mat(cyan,true),0,.1,-4.25,.05,.05,.05);muzzleZ=-4.3;break;
 case'launcher':
  tube(gun,0,.25,-.9,.68,2.8,dark);tube(gun,0,.25,-2.32,.76,.2,steel);tube(gun,0,.25,-2.45,.53,.05,'#080d15');tube(gun,0,.25,.62,.72,.3,orange);
  for(const side of[-1,1])box(gun,side*.64,.25,-.7,.16,.55,1.8,'#d67c48');box(gun,0,1,-.6,.35,.25,.7,steel);muzzleZ=-2.5;break;
 case'plasma':
  box(gun,0,.1,-.4,1.05,.9,1.3,dark);tube(gun,0,.1,-1,.6,.8,steel);
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2,x=Math.cos(a)*.55,y=.1+Math.sin(a)*.55;box(gun,x,y,-1.85,.25,.25,1.75,steel);glow(gun,x*.78,.1+(y-.1)*.78,-1.95,.12,.12,1.4,purple);}
  core=mesh(gun,sphereGeometry,mat(purple,true),0,.1,-1.7,.43,.43,.43);muzzleZ=-2.7;break;
 case'rotary':
  tube(gun,0,.1,-.5,.7,1.2,dark);barrels=new T.Group();barrels.position.set(0,.1,-1.55);gun.add(barrels);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*.38,y=Math.sin(a)*.38;tube(barrels,x,y,-.3,.14,2.5,steel);tube(barrels,x,y,-1.58,.1,.06,dark);glow(barrels,x,y,-1.62,.11,.11,.04,'#ff526d');}tube(barrels,0,0,.5,.58,.2,dark);tube(barrels,0,0,-1,.57,.16,dark);
  tube(gun,.8,-.15,-.35,.6,.7,'#556375');box(gun,.55,-.35,-.2,.65,.4,.45,dark);muzzleZ=-3.2;break;
 default:
  box(gun,0,.05,-.6,.65,.62,1.5,dark);box(gun,0,.4,-.65,.52,.18,1.8,steel);tube(gun,0,.05,-1.9,.16,1.4,steel);box(gun,0,.05,-2.55,.4,.38,.4,dark);glow(gun,0,.26,-2.55,.19,.04,.25,cyan);
  const mag=box(gun,0,-.55,-.55,.4,.7,.5,cyan);mag.rotation.x=-.18;slide=new T.Group();gun.add(slide);box(slide,.35,.16,-.4,.14,.26,.55,steel);break;
 }
 // Receiver details and moving cooling vanes give each weapon a different silhouette.
const accent={dynamo:'#ffda68',carbine:cyan,scatter:purple,rail:cyan,launcher:'#e6a05a',plasma:purple,rotary:'#ff526d',phaser:'#7bffc4'}[build.weapon]||cyan;
for(const side of[-1,1]){for(let i=0;i<3;i++)box(gun,side*.43,.24,-.35-i*.18,.06,.11,.06,steel);const vent=new T.Group();vent.position.set(side*.52,.35,-.85);vent.userData={vent:true,side};detailFX.add(vent);box(vent,0,0,0,.1,.32,.8,dark);glow(vent,side*.06,0,0,.04,.12,.55,accent);}
if(build.weapon==='rail'){for(let i=0;i<5;i++){const cell=new T.Group();cell.position.set(0,.34,-1.1-i*.56);cell.userData.charge=i/5;detailFX.add(cell);glow(cell,0,0,0,.48,.08,.13,cyan);}}
if(build.weapon==='carbine'){box(gun,0,.66,-.55,.34,.28,.5,dark);glow(gun,0,.66,-.82,.19,.14,.025,cyan);}
if(build.weapon==='rotary')for(let i=0;i<6;i++){const a=i*.27;box(gun,.82+Math.sin(a)*.22,-.68+i*.15,-.25,.3,.1,.27,accent);}
if(build.weapon==='launcher'){box(gun,.67,.63,-.7,.12,.45,.8,dark);glow(gun,.74,.63,-.7,.03,.25,.5,'#93ffb5');}
const muzzle=new T.Group();muzzle.position.set(...(MUZZLES[build.weapon]||MUZZLES.carbine));gun.add(muzzle);const flashColor=build.weapon==='dynamo'?'#ffe28b':build.weapon==='phaser'?'#aaffd8':build.weapon==='plasma'||build.weapon==='scatter'?purple:build.weapon==='rotary'?'#ffb3c4':build.weapon==='launcher'?'#fff1bb':cyan;addMuzzleBurst(muzzle,flashColor);muzzle.visible=false;
 box(meleeRig,0,0,0,.36,.35,.6,dark);
 switch(build.melee||'blade'){
 case'guard':
 meleeRig.scale.setScalar(BULWARK.scale);
 // A compact armored slab carried by the equipped forearm.
 shieldFX=new T.Group();meleeRig.add(shieldFX);glow(shieldFX,0,0,-1.04,4.25,3.42,.04,cyan);shieldFX.visible=false;shieldFX.scale.set(.98,1.02,1);trailColor=cyan;
 box(meleeRig,0,0,-.65,4.6,3.72,.4,dark);box(meleeRig,0,0,-.9,4.3,3.42,.2,steel);box(meleeRig,0,0,-1.03,4,3.1,.1,'#354d60');
 for(const side of[-1,1]){box(meleeRig,side*2.2,0,-.72,.2,3.72,.5,steel);glow(meleeRig,side*2.22,0,-1.07,.055,2.6,.04,cyan);}for(const y of[-1.65,1.65])box(meleeRig,0,y,-1.02,4.4,.17,.22,dark);glow(meleeRig,0,.9,-1.1,.7,.08,.03,cyan);break;
 case'hammer':
  trailColor=purple;tip.set(0,-1.5,-3.4);box(meleeRig,0,0,-1.65,.27,.27,3.2,steel);for(let i=0;i<5;i++)box(meleeRig,0,0,-.25-i*.18,.34,.34,.08,dark);
  hammerHead=new T.Group();hammerHead.position.z=-3.4;meleeRig.add(hammerHead);box(hammerHead,0,0,0,1.5,2.5,1.35,dark);for(const side of[-1,1]){box(hammerHead,0,side*1.3,0,1.7,.25,1.6,steel);glow(hammerHead,0,side*1.45,0,1.45,.08,1.3,purple);}tube(meleeRig,0,0,-2.6,.43,.38,steel);glow(meleeRig,0,0,-2.38,.55,.55,.06,purple);break;
 case'lance':
  tip.set(0,0,-4.7);tube(meleeRig,0,0,-.8,.6,1.6,dark);for(const side of[-1,1]){box(meleeRig,side*.5,0,-1,.2,.65,1.7,steel);glow(meleeRig,side*.62,0,-.85,.06,.2,1.1,cyan);}
  pile=new T.Group();meleeRig.add(pile);tube(pile,0,0,-2.1,.24,2.3,steel);const cone=mesh(pile,new T.ConeGeometry(.3,1.2,6),mat(steel),0,0,-3.8,1,1,1);cone.rotation.x=-Math.PI/2;break;
 case'claws':
  trailColor=orange;tip.set(0,0,-2.65);box(meleeRig,0,0,-.55,1.05,.7,1.25,dark);box(meleeRig,0,.4,-.55,1.12,.2,1.1,steel);for(const x of[-.38,0,.38]){const claw=new T.Group();claw.position.x=x;meleeRig.add(claw);plate(claw,[[-.1,-.8],[.12,-.8],[.16,-1.9],[0,-2.7],[-.09,-1.85]],.16,orange);}break;
 case'scythe':
  trailColor=purple;tip.set(2.6,0,-3.9);box(meleeRig,0,0,-1.8,.22,.22,4.2,steel);box(meleeRig,0,0,-3.6,.55,.4,.6,dark);
  plate(meleeRig,[[-.2,-3.6],[.65,-4.1],[1.65,-4.05],[2.75,-3.45],[3.2,-2.5],[2.35,-3.15],[1.2,-3.35],[.05,-3.1]],.23,dark);
  plate(meleeRig,[[.05,-3.1],[1.2,-3.35],[2.35,-3.15],[3.2,-2.5],[2.35,-2.95],[1.1,-3.1],[0,-2.9]],.25,purple);break;
 default:
  box(meleeRig,0,0,-.42,1.1,.26,.25,dark);
  plate(meleeRig,[[-.23,-.55],[.3,-.55],[.43,-3.4],[.03,-4.65],[-.25,-3.25]],.24,steel);
  plate(meleeRig,[[.3,-.55],[.43,-3.4],[.03,-4.65],[.2,-3.2],[.16,-.55]],.28,cyan);glow(meleeRig,-.1,.16,-1.85,.06,.05,2.35,cyan);break;
 }
 return{shieldFX,gun,meleeRig,muzzle,detailFX,barrels,slide,core,pile,hammerHead,tip,base,trailColor};
}
