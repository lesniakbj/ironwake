import * as T from './vendor/three.module.min.js';
import {impactLevel} from './impact-preferences.js';

const SHOT_KICK={carbine:.13,rotary:.055,scatter:.65,rail:.75,dynamo:.8,launcher:.5,plasma:.24};
// Camera impulses are applied only AFTER the authoritative aiming ray is sampled.
// Save/restore the clean pose so presentation shake never feeds back into aiming.
export function createCombatFeel(canvas){
  const overlay=document.createElement('div');overlay.className='impact-screen';overlay.setAttribute('aria-hidden','true');
  const paths=Array.from({length:26},(_,i)=>{
    const angle=(i+.3)*Math.PI*2/26,x=Math.cos(angle),y=Math.sin(angle),start=.61+(i%4)*.055;
    return '<path d="M'+(500+x*570*start)+' '+(350+y*420*start)+'L'+(500+x*680)+' '+(350+y*510)+'" stroke-width="'+(i%3?1.3:3)+'"/>';
  }).join('');
  overlay.innerHTML='<svg class="impact-speed-lines" viewBox="0 0 1000 700" preserveAspectRatio="none"><g>'+paths+'</g></svg><div class="impact-reticle"><i></i><i></i><i></i><i></i></div><div class="impact-damage-edge"></div>';
  canvas.parentElement.append(overlay);
  const speedLines=overlay.querySelector('svg'),reticle=overlay.querySelector('.impact-reticle'),edge=overlay.querySelector('.impact-damage-edge');
  const position=new T.Vector3(),quaternion=new T.Quaternion(),offset=new T.Vector3();
  let saved=false,baseFov=72,kick=0,shake=0,hit=0,hurt=0,speed=0,heavy=false,precision=false;
  let shots=[],lastHp=null,lastMove=0,lastBlast=0,lastDamage=0,initialized=false;
  return {
    reset(){saved=false;kick=shake=hit=hurt=speed=0;shots=[];lastHp=null;lastMove=lastBlast=lastDamage=0;initialized=false;overlay.style.opacity='0';},
    restore(camera){if(!saved)return;camera.position.copy(position);camera.quaternion.copy(quaternion);camera.fov=baseFov;camera.updateProjectionMatrix();saved=false;},
    update(world,self,dt,t){
      const full=impactLevel()===1;
      kick*=Math.exp(-dt*18);shake*=Math.exp(-dt*22);hit=Math.max(0,hit-dt);hurt=Math.max(0,hurt-dt);
      if(!hit)heavy=precision=false;
      const hands=self.hands||[self];
      hands.forEach((hand,i)=>{
        const count=hand.shotCount||0;
        if(initialized&&count>(shots[i]||0))kick=Math.min(1.6,kick+(SHOT_KICK[hand.item||self.weapon]||0));
        shots[i]=count;
      });
      if(lastHp!==null&&self.hp<lastHp){shake=Math.min(1.5,shake+.65);hurt=.22;}
      lastHp=self.hp;
      if(initialized&&(self.moveCount||0)>lastMove){kick=Math.min(1.6,kick+.55);shake=Math.min(1,shake+.25);}lastMove=self.moveCount||0;
      for(const event of world.damageEvents||[]){
        if(event.id<=lastDamage)continue;lastDamage=event.id;
        if(!initialized||event.owner!==self.id||event.life<.75||event.kind==='burn'||event.kind==='phaser')continue;
        hit=.16;heavy=heavy||event.amount>=120;precision=precision||event.kind==='precision';
        if(heavy){kick=Math.min(1.6,kick+.25);shake=Math.min(.7,shake+.15);}
      }
      for(const event of world.effects||[]){
        if(event.id<=lastBlast||event.kind!=='explosion')continue;lastBlast=event.id;
        if(!initialized||event.max-event.life>.16)continue;
        const distance=Math.hypot(event.x-self.x,event.y-self.y,(event.z||0)-(self.altitude||0));
        const power=Math.max(0,1-distance/950)*Math.min(1,(event.r||100)/180);
        shake=Math.min(1.5,shake+power*.7);kick=Math.min(1.6,kick+power*.2);
      }
      initialized=true;
      const throttle=self.hp>0?(self.moveTime>0?1:self.boosting?.25:self.airborne?.12:0):0;
      speed=T.MathUtils.lerp(speed,throttle,1-Math.exp(-dt*12));
      overlay.style.opacity='1';overlay.dataset.reduced=String(!full);
      speedLines.style.opacity=String(full?speed*.42:0);speedLines.style.transform='scale('+(1+(t*2%1)*.04)+')';
      reticle.style.opacity=String(hit>0?Math.min(1,hit/.07):0);reticle.style.transform='scale('+(full?1+hit*1.8:1)+')';
      reticle.dataset.heavy=String(heavy);reticle.dataset.precision=String(precision);
      edge.style.opacity=String(full?hurt*.6:0);
    },
    apply(camera,t){
      position.copy(camera.position);quaternion.copy(camera.quaternion);baseFov=camera.fov;saved=true;
      if(impactLevel()!==1)return;
      offset.set(Math.sin(t*49)*shake*.045,Math.cos(t*61)*shake*.035,kick*.1).applyQuaternion(camera.quaternion);camera.position.add(offset);
      camera.rotateX(kick*.004+Math.sin(t*47)*shake*.002);camera.rotateZ(Math.sin(t*33)*shake*.002);
      camera.fov+=Math.min(2.8,kick*1.9);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    }
  };
}
