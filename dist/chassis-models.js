import{chassisFor}from './chassis.js';

// Chassis-owned silhouettes use the same articulated body/head/limbs as replaceable parts.
// Weapon and special art can attach to those mounts without replacing this layer.
export function addChassisDetails({body,head,arms,legs,build},k){
 const c=chassisFor(build);if(!c.id)return;
 const{box,cyl,glow}=k,paint=build.partColors?.torso||build.color,steel='#abbfd1',dark='#17283c',light=build.trailColor||'#80f7ff';
 const fin=(parent,x,y,z,w,h,d,color,angle)=>{const p=box(parent,x,y,z,w,h,d,color);p.rotation.z=angle;return p;};
 if(c.size==='scout')for(const s of[-1,1]){fin(body,s*.9,4.3,0,.13,1.2,.6,paint,-s*.5);glow(body,s*.6,3.6,.9,.1,.55,.1,light);}
 if(c.size==='heavy'||c.size==='giga')for(const s of[-1,1]){
  box(body,s*1.35,4.1,-1.1,.55,.85,.3,paint);box(legs[s<0?0:1],0,-1.2,-.65,.95,.65,.3,steel);
  const arm=arms[s<0?0:1];box(arm,0,.57,0,1.55,.25,1.5,dark);
  for(let i=0;i<3;i++)box(arm,s*.6,-.2+i*.2,-.8,.2,.1,.12,steel);
 }
 if(c.size==='giga'){
  for(const s of[-1,1]){box(body,s*1.45,3.35,1.2,.7,2,1,paint);cyl(body,s*.9,4.9,1.3,.2,1.6,dark);box(legs[s<0?0:1],s*.55,-2.05,0,.3,.3,1.6,steel);}
  box(body,0,2.75,-.95,2.8,.45,.35,steel);
 }
 switch(c.specialty){
  case 'recon':for(const s of[-1,1]){const mast=box(head,s*.45,.8,.1,.05,1.5,.05,steel);mast.rotation.z=s*.3;glow(head,s*.6,1.4,.1,.12,.12,.12,light);}break;
  case 'sniper':box(head,.7,.05,-.25,.3,.35,1.25,dark);glow(head,.7,.05,-.9,.22,.2,.06,light);for(const s of[-1,1]){cyl(body,s*.8,3.4,1.2,.18,1.4,steel);box(legs[s<0?0:1],s*.45,-1.7,.3,.18,.8,.6,steel);}break;
  case 'aerial':for(const s of[-1,1]){fin(body,s*1.8,4.3,1.5,.2,2.5,1.4,paint,-s*.8);fin(body,s*2.6,4.8,1.5,.12,1.2,.8,steel,-s*1.0);glow(body,s*2.8,5.1,1.5,.15,.15,.2,light);}break;
  case 'skirmisher':for(const s of[-1,1]){fin(arms[s<0?0:1],s*.55,.2,-.1,.2,1,.8,paint,-s*.6);box(legs[s<0?0:1],0,-1.7,.6,.45,.5,.35,dark);}break;
  case 'melee':for(const s of[-1,1]){fin(head,s*.65,.4,-.15,.1,1.2,.1,steel,-s*.9);box(arms[s<0?0:1].userData.elbow,0,-.5,-.6,.8,.55,.25,steel);}break;
  case 'assault':for(const s of[-1,1]){box(body,s*.75,4.3,-.9,.5,.25,.3,steel);glow(body,s*.75,4.3,-1.07,.35,.06,.04,light);}break;
  case 'support':box(body,0,4.25,1.65,1.2,.9,.4,dark);glow(body,0,4.25,1.9,.75,.18,.08,'#8dffb7');glow(body,0,4.25,1.91,.18,.75,.08,'#8dffb7');for(const s of[-1,1])cyl(body,s*.8,3.7,1.4,.22,1.2,steel);break;
  case 'defense':for(const s of[-1,1])box(arms[s<0?0:1],s*.6,-.4,-.1,.4,1.8,1.5,paint);box(head,0,.4,0,1.65,.2,1.2,steel);break;
  case 'artillery':for(const s of[-1,1]){box(body,s*.9,4.7,1.3,.65,1.2,.8,dark);cyl(body,s*.9,5.4,1.3,.18,.8,steel);glow(body,s*.9,5.8,1.3,.2,.08,.2,light);}break;
 }
}
