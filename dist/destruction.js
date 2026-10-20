// Opt-in, host-authoritative panel destruction. No rigid-body simulation.
// Immutable geometry stays in the mission; only HP, revision and recent events replicate.
export const DESTRUCTION_LIMITS={events:48,queue:128,workPerStep:12,debris:240,rubble:160};
export const DESTRUCTION_MATERIALS={
 concrete:{hp:144,color:'#a49b83',heat:.15},steel:{hp:216,color:'#627f81',heat:.1},
 glass:{hp:36,color:'#7cdad8',heat:1},cargo:{hp:96,color:'#bf8c56',heat:.5},
 fuel:{hp:72,color:'#d86c42',heat:1},support:{hp:240,color:'#e6b05d',heat:.1}
};
const missions=new WeakMap(),CELL=180;
function indexFor(m){
 let data=missions.get(m);if(data)return data;
 data={state:null,grid:new Map(),dependents:new Map(),pieces:[]};
 for(const o of m.obstacles){if(o.breakable===undefined)continue;data.pieces[o.breakable]=o;
  for(let y=Math.floor(o.y/CELL);y<=Math.floor((o.y+o.h)/CELL);y++)for(let x=Math.floor(o.x/CELL);x<=Math.floor((o.x+o.w)/CELL);x++){
   const key=x+','+y;if(!data.grid.has(key))data.grid.set(key,[]);data.grid.get(key).push(o);
  }
  for(const id of o.supports||[]){if(!data.dependents.has(id))data.dependents.set(id,[]);data.dependents.get(id).push(o);}
 }
 missions.set(m,data);return data;
}
export function bindDestruction(m,state){if(m.destructible)indexFor(m).state=state;}
export function destructionRevision(m){return m.destructible?(indexFor(m).state?.revision||0):0;}
export function structureFor(m,id){return indexFor(m).pieces[id];}
export function obstacleSolid(m,o){return o.breakable===undefined||(indexFor(m).state?.hp[o.breakable]??1)>0;}
export function initDestruction(w){
 const pieces=indexFor(w.mission).pieces;
 w.destruction={hp:pieces.map(o=>o.durability||DESTRUCTION_MATERIALS[o.material].hp),revision:0,destroyed:0,events:[],pending:[],chains:0,collapses:0};
 bindDestruction(w.mission,w.destruction);
}
export function nearbyStructures(m,x,y,r=2){
 if(!m.destructible)return[];
 const grid=indexFor(m).grid,found=new Set();
 for(let gy=Math.floor((y-r)/CELL);gy<=Math.floor((y+r)/CELL);gy++)for(let gx=Math.floor((x-r)/CELL);gx<=Math.floor((x+r)/CELL);gx++)for(const o of grid.get(gx+','+gy)||[])found.add(o);
 return [...found];
}
const center=o=>({x:o.x+o.w/2,y:o.y+o.h/2,z:((o.baseZ||0)+o.height)/2});
function queue(w,job){if(w.destruction.pending.length<DESTRUCTION_LIMITS.queue)w.destruction.pending.push(job);}
function damage(w,o,amount,kind){
 const s=w.destruction,id=o.breakable;if(!s||s.hp[id]<=0)return 0;
 const resistance=kind==='flamer'?DESTRUCTION_MATERIALS[o.material].heat:1,applied=Math.min(s.hp[id],Math.max(0,Math.round(amount*resistance)));
 if(!applied)return 0;s.hp[id]-=applied;s.revision++;
 if(s.hp[id]>0)return applied;
 s.destroyed++;const p=center(o);
 s.events.push({id:w.id++,piece:id,...p,at:w.time,kind:o.explosive?'fuel':kind==='collapse'?'collapse':'fracture'});
 if(s.events.length>DESTRUCTION_LIMITS.events)s.events.shift();
 if(o.explosive)queue(w,{at:w.time+.12,kind:'blast',...p,r:o.explosive,amount:270});
 for(const roof of indexFor(w.mission).dependents.get(id)||[]){
  if(s.hp[roof.breakable]>0&&roof.supports.every(i=>s.hp[i]<=0)&&!s.pending.some(j=>j.piece===roof.breakable))queue(w,{at:w.time+.15+(roof.breakable%4)*.035,kind:'collapse',piece:roof.breakable});
 }
 return applied;
}
export function damageStructureAt(w,p,amount,kind='hit'){
 if(!w.destruction)return 0;
 const o=nearbyStructures(w.mission,p.x,p.y,3).find(o=>obstacleSolid(w.mission,o)&&p.x>=o.x-3&&p.x<=o.x+o.w+3&&p.y>=o.y-3&&p.y<=o.y+o.h+3&&p.z>=(o.baseZ||0)&&p.z<=o.height);
 return o?damage(w,o,amount,kind):0;
}
export function damageStructureArea(w,p,r,amount,kind='blast',angle=null,arc=Math.PI){
 if(!w.destruction)return 0;let hits=0;
 for(const o of nearbyStructures(w.mission,p.x,p.y,r)){
  if(!obstacleSolid(w.mission,o))continue;
  const dx=Math.max(o.x-p.x,0,p.x-o.x-o.w),dy=Math.max(o.y-p.y,0,p.y-o.y-o.h),dz=Math.max((o.baseZ||0)-(p.z||0),0,(p.z||0)-o.height),distance=Math.hypot(dx,dy,dz);
  if(distance>r)continue;
  if(angle!==null){const c=center(o),delta=Math.atan2(c.y-p.y,c.x-p.x)-angle;if(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))>arc)continue;}
  if(damage(w,o,amount*(1-.55*distance/Math.max(1,r)),kind)>0)hits++;
 }return hits;
}
export function stepDestruction(w,onBlast=()=>{}){
 if(!w.destruction)return;bindDestruction(w.mission,w.destruction);
 const s=w.destruction;s.events=s.events.filter(e=>w.time-e.at<2.4);
 let budget=DESTRUCTION_LIMITS.workPerStep;
 while(budget--){const index=s.pending.findIndex(j=>j.at<=w.time);if(index<0)break;const [job]=s.pending.splice(index,1);
  if(job.kind==='collapse'){
   const o=structureFor(w.mission,job.piece);
   if(o&&s.hp[job.piece]>0){damage(w,o,s.hp[job.piece],'collapse');s.collapses++;}
  }else{
   s.chains++;damageStructureArea(w,job,job.r,job.amount,'blast');onBlast(job);
   w.effects.push({id:w.id++,x:job.x,y:job.y,z:job.z,r:job.r,kind:'explosion',weapon:'fuel',life:.8,max:.8});
  }
 }
}
