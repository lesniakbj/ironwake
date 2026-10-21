import{impactLevel}from './impact-preferences.js';
import * as T from './vendor/three.module.min.js';
import {equipmentFor} from './core.js?v=41';

export const ITEM_TINTS={carbine:'#80f7ff',scatter:'#c596ff',rail:'#80f7ff',launcher:'#ffae64',plasma:'#c596ff',rotary:'#ff526d',phaser:'#7bffc4',flamer:'#ff9d54',dynamo:'#ffda68',blade:'#80f7ff',lance:'#80f7ff',hammer:'#c596ff',claws:'#ff9d54',scythe:'#c596ff',guard:'#80f7ff',emp:'#87dcff',shield:'#78afff',repair:'#8dffb7'};
const ringGeometry=new T.TorusGeometry(1,.1,6,24),orbGeometry=new T.IcosahedronGeometry(1,1);

// These details join the existing rigid-part batches; they do not add one draw call per plate.
export function addItemDetails(rig,k){
 const {body,head,arms,legs,parts,build,width}=rig,{box,cyl,glow,mesh,mat}=k;
 const dark='#17283c',steel='#abbfd1',paint=s=>build.partColors?.[s]||build.color||'#ee7950',light=build.trailColor||'#80f7ff';
 const group=(parent,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;};
 const ring=(p,x,y,z,r,c,rx=0,ry=0)=>{const m=mesh(p,ringGeometry,mat(c),x,y,z,r,r,r);m.rotation.set(rx,ry,0);return m;};
 const orb=(p,x,y,z,r,c)=>mesh(p,orbGeometry,mat(c,true),x,y,z,r,r,r);
 const fin=(p,x,y,z,w,h,d,c,angle)=>{const m=box(p,x,y,z,w,h,d,c);m.rotation.z=angle;return m;};
 const bars=(p,x,y,z,count,step,w,h,d,c)=>{for(let i=0;i<count;i++)box(p,x,y+i*step,z,w,h,d,c);};
 switch(parts.torso){
  case 'raptor':for(const s of[-1,1]){bars(body,s*.85,3,-.67,4,.3,.25,.12,.45,steel);fin(body,s*1.25,4.25,.1,.2,1.5,1,paint('torso'),-s*.6);}break;
  case 'spectre':for(const s of[-1,1])fin(body,s*.7,3.8,-.8,1.15,1.7,.22,paint('torso'),s*.4);orb(body,.75,4.3,-1,.14,light);break;
  case 'reactor':ring(body,0,3.8,-1.05,.75,steel);orb(body,0,3.8,-1.09,.46,'#ffda68');for(const s of[-1,1])bars(body,s*1.25,3.1,-.2,5,.25,.4,.12,1,paint('torso'));break;
  case 'corsair':for(const s of[-1,1]){fin(body,0,3.75,-1,2.7,.14,.16,steel,s*.6);box(body,s*1.1,2.85,-.5,.65,.65,.6,paint('torso'));box(body,s*.75,4.6,0,.5,.45,1.2,dark);}break;
  case 'citadel':for(let i=0;i<3;i++)box(body,0,3.1+i*.5,-1.18-i*.08,2.9-i*.2,.38,.3,paint('torso'));for(const s of[-1,1])box(body,s*1.35,4.8,0,.5,1.2,1.7,steel);break;
  case 'furnace':for(const s of[-1,1]){cyl(body,s*.95,5,1.05,.26,2.2,dark);cyl(body,s*.95,6.12,1.05,.36,.18,steel);bars(body,s*.8,3,-1.15,5,.28,.75,.12,.24,steel);}orb(body,0,3.8,-1.2,.4,'#ff9d54');break;
  case 'light':fin(body,0,3.8,-.85,.18,1.3,.28,steel,.4);break;
  case 'standard':for(const s of[-1,1])box(body,s*.9,4.35,-.85,.3,.25,.2,paint('torso'));break;
  case 'heavy':for(const s of[-1,1])bars(body,s*1.3,3.1,-1.04,3,.34,.4,.16,.2,dark);break;
 }
 switch(parts.head){
  case 'cyclops':box(head,0,0,-.68,.85,.55,.2,dark);ring(head,0,0,-.84,.38,steel);orb(head,0,0,-.85,.26,light);break;
  case 'mantis':for(const s of[-1,1]){orb(head,s*.43,.05,-.62,.2,'#b5ff8b');fin(head,s*.55,.55,0,.06,1,.06,steel,-s*.8);}break;
  case 'ronin':for(const s of[-1,1]){fin(head,s*.75,.5,-.1,.15,1.4,.18,'#ffd06a',-s*1.05);box(head,s*.53,-.25,0,.25,.75,.85,paint('head'));}break;
  case 'surveyor':ring(head,-.83,.3,0,.55,steel,0,Math.PI/2);cyl(head,-.82,.3,0,.3,.15,paint('head')).rotation.z=Math.PI/2;box(head,.65,.05,-.3,.35,.35,.9,dark);orb(head,.65,.05,-.8,.16,light);break;
  case 'paladin':box(head,0,0,-.73,1.25,.15,.16,steel);box(head,0,.02,-.75,.16,.9,.18,steel);fin(head,0,.65,.05,.2,.85,.7,paint('head'),0);break;
  case 'anvil':mesh(head,orbGeometry,mat(paint('head')),0,.34,.05,.85,.45,.75);for(const s of[-1,1]){box(head,s*.65,.6,.1,.24,.6,.36,dark);glow(head,s*.65,.72,-.1,.18,.15,.06,light);}break;
 }
 for(let i=0;i<2;i++){
  const s=i?-1:1,arm=arms[i],leg=legs[i],elbow=arm.userData.elbow;
  switch(parts.arms){
   case 'talon':fin(arm,-s*.6,.4,.15,.18,1.9,1.05,paint('arms'),s*.65);fin(elbow,-s*.45,-.4,-.2,.12,.9,.65,steel,s*.3);break;
   case 'wire':for(const z of[-.38,.38])cyl(arm,-s*.3,-.65,z,.09,1.25,steel);box(arm,0,.4,0,.65,.15,1.3,dark);break;
   case 'outrider':box(arm,-s*.6,i?0:-.35,0,.35,i?1.3:2.2,1.6,paint('arms'));bars(elbow,-s*.4,-.7,-.6,3,.23,.3,.12,.22,'#ffd06a');break;
   case 'conduit':ring(arm,-s*.66,0,0,.72,steel,0,Math.PI/2);for(const z of[-.4,0,.4])glow(elbow,-s*.45,-.4,z,.12,.7,.12,light);break;
   case 'rampart':for(const z of[-.5,0,.5])box(arm,0,.78,z,1.6,.45,.26,paint('arms'));bars(elbow,0,-.9,-.65,3,.3,1.15,.2,.25,steel);break;
   case 'riveter':for(const z of[-.7,.7]){cyl(arm,-s*.63,-.5,z,.18,1.8,steel);box(arm,0,.6,z,1.8,.2,.2,'#ffd06a');}break;
  }
  switch(parts.legs){
   case 'raptor':fin(leg,0,-1.2,.85,.18,1.25,.3,steel,s*.15);for(const x of[-.2,.2])fin(leg,x,-2.13,-.95,.18,.22,1.1,paint('legs'),0);break;
   case 'skate':box(leg,0,-2.25,-.35,.2,.22,2.6,steel);fin(leg,-s*.5,-1.65,.2,.12,.8,.8,paint('legs'),s*.7);break;
   case 'piston':cyl(leg,-s*.47,-1.5,-.25,.12,1.5,steel);ring(leg,0,-1.2,-.64,.4,paint('legs'));break;
   case 'outrigger':fin(leg,-s*.63,-1.8,.2,.2,.9,1.2,paint('legs'),-s*.7);box(leg,0,-1,-.7,1.2,.8,.3,steel);break;
   case 'crab':for(const x of[-.45,.45]){const toe=box(leg,x,-2.1,-1.1,.3,.3,1.4,steel);toe.rotation.y=x*.8;}box(leg,-s*.62,-.4,0,.6,1.2,1.35,paint('legs'));break;
   case 'tread':for(const x of[-.6,.6]){box(leg,x,-1.95,0,.4,.65,2.2,dark);for(let z=-.7;z<=.71;z+=.7){const wheel=cyl(leg,x,-1.95,z,.27,.44,steel);wheel.rotation.z=Math.PI/2;}for(let z=-.95;z<1;z+=.32)box(leg,x,-2.3,z,.48,.1,.15,paint('legs'));}break;
  }
 }
 switch(parts.booster){
  case 'kite':for(const s of[-1,1]){fin(body,s*2,4.9,1.4,.22,3.5,1.45,paint('booster'),-s*.8);glow(body,s*3.2,6.05,1.4,.18,.25,.3,light);}break;
  case 'wasp':for(const s of[-1,1])for(const y of[3.3,4.8]){const pod=group(body,s*1.8,y,1.5);pod.rotation.z=-s*.5;cyl(pod,0,0,0,.4,1.2,paint('booster'));ring(pod,0,-.6,0,.4,steel,Math.PI/2);glow(pod,0,-.65,0,.4,.08,.4,light);}break;
  case 'halo':ring(body,0,4.65,1.9,2.1,paint('booster'));ring(body,0,4.65,1.94,1.78,light);for(const s of[-1,1])box(body,s*1.1,4.5,1.5,.2,1,.9,steel);break;
  case 'gull':for(const s of[-1,1]){box(body,s*1.9,4,1.4,2.2,.3,1.1,paint('booster'));const pod=cyl(body,s*2.75,4,1.4,.57,2.3,steel);pod.rotation.x=Math.PI/2;ring(body,s*2.75,4,2.6,.44,light);}break;
  case 'saturn':for(const s of[-1,1]){cyl(body,s*1.5,4.55,1.6,.62,3.5,paint('booster'));for(const y of[3.3,4.7,5.8])cyl(body,s*1.5,y,1.6,.67,.18,steel);orb(body,s*1.5,6.35,1.6,.6,paint('booster'));}break;
  case 'foundry':for(const s of[-1,1]){bars(body,s*1.65,3.6,1.8,7,.32,1.6,.12,1.3,steel);box(body,s*1.65,4.55,1.3,.24,2.3,1,paint('booster'));}break;
 }
 const equipment=equipmentFor(build);
 equipment.slice(0,2).forEach((id,i)=>{
  const s=i?1:-1,p=group(body,s*(width+.55),3.6,1.1),tint=ITEM_TINTS[id];p.name='attachment:'+i+':'+id;
  box(p,0,0,0,.35,.55,.3,dark);
  switch(id){
   case 'carbine':for(let j=0;j<3;j++)box(p,s*j*.21,-.4,.22,.15,.9,.32,steel);glow(p,0,.2,.4,.5,.08,.08,tint);break;
   case 'scatter':for(let j=0;j<5;j++){cyl(p,s*j*.13,-.2,.3,.09,.65,tint);cyl(p,s*j*.13,.15,.3,.1,.12,steel);}break;
   case 'rail':for(const x of[-.2,.2]){box(p,x,.25,.3,.12,1.8,.4,steel);glow(p,x,.25,.53,.06,1.5,.06,tint);}break;
   case 'launcher':for(const x of[-.24,.24])for(const y of[-.3,.3]){const tube=cyl(p,x,y,.35,.2,.8,dark);tube.rotation.x=Math.PI/2;orb(p,x,y,.8,.13,tint);}break;
   case 'plasma':orb(p,0,0,.45,.45,tint);for(const y of[-.5,.5])ring(p,0,y,.4,.5,steel,Math.PI/2);break;
   case 'rotary':cyl(p,0,-.1,.35,.55,.9,steel);for(let j=0;j<5;j++)box(p,s*(.2+j*.12),-.5-j*.09,.45,.13,.3,.22,tint);break;
   case 'phaser':ring(p,0,.1,.4,.5,steel);glow(p,0,.1,.45,.25,.7,.2,tint);break;
   case 'flamer':for(const x of[-.3,.3]){cyl(p,x,0,.3,.25,1.5,'#be5335');cyl(p,x,.55,.3,.27,.12,steel);}box(p,0,-.7,.3,.75,.12,.4,dark);break;
   case 'dynamo':for(let j=0;j<3;j++){cyl(p,0,-.4+j*.42,.3,.32,.28,steel);glow(p,0,-.4+j*.42,.3,.66,.08,.55,tint);}break;
   case 'blade':box(p,0,-.3,.3,.25,1.65,.35,dark);glow(p,0,-.2,.5,.08,1.2,.05,tint);break;
   case 'lance':cyl(p,0,-.2,.3,.26,1.6,steel);fin(p,0,.8,.3,.12,.65,.2,tint,0);break;
   case 'hammer':box(p,0,0,.35,.75,.95,.65,steel);glow(p,0,0,.7,.5,.15,.05,tint);break;
   case 'claws':for(let j=0;j<3;j++)fin(p,s*(j-1)*.22,.3,.3,.12,1,.3,tint,-s*.25);break;
   case 'scythe':ring(p,0,.2,.4,.55,steel);fin(p,s*.5,.35,.4,.2,1.3,.25,tint,-s*.8);break;
   case 'guard':box(p,0,0,.4,.85,1.2,.3,steel);glow(p,0,0,.6,.12,.85,.08,tint);break;
  }
 });
 const special=equipment[2],tint=ITEM_TINTS[special],mount=group(body,0,4.15,2.05);mount.name='special:'+special;
 box(mount,0,0,0,1.1,1.3,.45,dark);
 if(special==='emp'){for(const s of[-1,1]){cyl(mount,s*.5,.6,0,.17,1.8,steel);for(let j=0;j<4;j++)ring(mount,s*.5,.1+j*.28,0,.24,tint,Math.PI/2);}ring(mount,0,0,.3,.46,steel);}
 if(special==='shield'){for(const s of[-1,1])fin(mount,s*.8,.4,0,.25,1.9,.45,steel,-s*.5);ring(mount,0,0,.3,.58,tint);}
 if(special==='repair'){for(const s of[-1,1]){cyl(mount,s*.65,0,0,.22,1.3,steel);glow(mount,s*.65,0,.23,.17,.8,.08,tint);}box(mount,0,0,.31,.75,.25,.16,tint);box(mount,0,0,.32,.25,.75,.16,tint);}
 const beacon=orb(body,0,4.15,2.45,.22,tint);beacon.name='special-beacon';
 const cargo=group(body,0,2.1,2.25);cargo.name='carried-cell';cargo.visible=false;
 box(cargo,0,0,0,1.25,1.8,1.05,dark);for(const y of[-.85,.85])box(cargo,0,y,0,1.5,.18,1.25,steel);
 glow(cargo,0,0,.57,.9,1.2,.1,'#abffd0');for(const x of[-.55,.55])box(cargo,x,0,.65,.12,1.65,.15,steel);
 return{beacon,cargo,special};
}

export function updateItemDetails(details,p,t,carrying=false){
 if(!details)return;
 details.cargo.visible=p.hp>0&&carrying;
 details.beacon.scale.setScalar(.22*(p.hp<=0?.2:p.active>0?1.4+(impactLevel()===1?Math.sin(t*5)*.15:0):1));
}
