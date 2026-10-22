import {ENEMY_ATTACKS,enemySeed,enemyRole} from './enemy-behaviors.js';
// Authored poses in model units/radians: crouch, pitch, roll, turret, petals.
// Slow preparation -> held silhouette -> fast release -> overshoot -> settle.
const poses={
 pounce:[[-.65,-.28,0,0,0],[.9,.35,0,0,0],[-.5,.2,0,0,0]],
 bite:[[-.15,-.2,.1,0,0],[.1,.38,-.12,0,0],[0,.1,0,0,0]],
 burst:[[.35,-.15,-.2,-.12,0],[.1,.12,.15,.14,0],[0,.08,0,.08,0]],
 fan:[[-.3,-.15,0,-.18,0],[-.45,.22,0,.28,0],[-.2,.12,0,.12,0]],
 sweep:[[-.4,-.12,-.12,-.35,0],[-.3,.15,.12,.2,0],[-.15,.08,.08,.15,0]],
 charge:[[-.55,-.36,0,0,0],[-.25,.48,0,0,0],[-.65,.3,0,0,0]],
 stomp:[[-.6,-.4,0,0,0],[-.8,.5,0,0,0],[-.4,.2,0,0,0]],
 snipe:[[-.18,-.04,0,-.15,0],[-.28,.16,0,.4,0],[-.12,.1,0,.22,0]],
 bombard:[[-.5,-.18,0,.9,0],[-.65,.28,0,.35,0],[-.3,.14,0,.55,0]],
 mend:[[.45,-.08,0,0,1],[.65,-.1,0,0,1],[.15,.08,0,0,.4]],
 siegeFan:[[-.4,-.22,0,-.15,0],[-.6,.28,0,.4,0],[-.25,.12,0,.15,0]],
 siegeBarrage:[[-.45,-.3,0,-.8,0],[-.6,.25,0,-.3,0],[-.2,.15,0,-.4,0]],
 siegeStomp:[[-.8,-.5,0,0,0],[-1,.55,0,0,0],[-.5,.2,0,0,0]],
};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t),zero=[0,0,0,0,0];
export function enemyPose(p){
 const a=ENEMY_ATTACKS[p.attackKind],keys=poses[p.attackKind];let pose=zero;
 if(a&&keys){const elapsed=p.actionTime||0;
  if(p.actionPhase==='windup')pose=mix(zero,keys[0],smooth(elapsed/(a.windup*.65)));
  else if(p.actionPhase==='active')pose=mix(keys[0],keys[1],smooth(elapsed/.065));
  else if(p.actionPhase==='recovery')pose=elapsed<.16?mix(keys[1],keys[2],smooth(elapsed/.16)):mix(keys[2],zero,smooth((elapsed-.16)/Math.max(.01,a.recovery-.16)));
 }
 if(p.stun>0)pose=[-.35,.22,.12,0,0];
 return{height:pose[0],pitch:pose[1],roll:pose[2],turret:pose[3],petals:pose[4]};
}
export function locomotionStyle(p){
 const role=enemyRole(p),variation=.92+enemySeed(p.id)*.16;
 return{stride:({hunter:.65,scarab:.32,rammer:.45,needle:.48,mortar:.23,mender:.35}[role]||.45)*variation,
  cadence:({hunter:1.6,scarab:1.1,rammer:1.25,needle:1.4,mortar:.85,mender:1.2}[role]||1)*variation,
  phase:enemySeed(p.id)*Math.PI*2};
}
