// Shared strike timing keeps authoritative damage aligned with the animated contact.
export const STRIKES={blade:.26,lance:.34,hammer:.43,claws:.25,scythe:.38};
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
// Shoulder XYZ, elbow X, wrist XYZ, torso yaw, torso lean, piston extension.
const idle=[.15,0,-.12,.4,-.85,0,0,0,0,0];
const poses={
 blade:[[.45,1.05,-.45,.9,-.55,.3,-.4,.38,-.06,0],[.9,-1.15,-.2,.22,-.9,-.2,.3,-.38,.12,0]],
 lance:[[-.25,.1,-.3,1.15,-.9,0,0,.2,-.1,0],[1.2,-.1,-.12,.08,-1.28,0,0,-.12,.22,1.5]],
 hammer:[[2.6,.1,-.3,.45,-.55,0,0,.16,-.18,0],[.8,-.1,-.12,.35,-1.55,0,0,-.14,.32,0]],
 claws:[[.15,.5,-.4,.9,-.9,0,-.4,.2,-.05,0],[1.2,-.35,-.1,.1,-1.4,0,.4,-.22,.12,0]],
 scythe:[[.6,1.65,-.35,.65,-.55,0,-.25,.65,-.08,0],[.85,-1.65,-.2,.18,-.9,0,.2,-.65,.1,0]]
};
export function meleePose(id,progress,count=1){
 const pair=poses[id]||poses.blade,hit=STRIKES[id]||.26;
 let values=idle.slice(),trail=false;
 if(progress>=0&&progress<1){
  const start=hit*.66,end=hit+.12;
  let a,b,u;
  if(progress<start){a=idle;b=pair[0];u=smooth(progress/start);}
  else if(progress<end){a=pair[0];b=pair[1];u=smooth((progress-start)/(end-start));trail=true;}
  else{a=pair[1];b=idle;u=smooth((progress-end)/(1-end));}
  values=a.map((v,i)=>mix(v,b[i],u));
  if((id==='blade'||id==='claws')&&count%2===0){values[1]*=-1;values[5]*=-1;values[6]*=-1;values[7]*=-1;}
 }
 return{values,trail};
}
export const recoilFor={dynamo:.55,carbine:.18,scatter:.65,rail:.5,launcher:.38,plasma:.28,rotary:.08};
