// Design estimate, not a human playtest: one 240-DPS weapon/pilot with 35% objective uptime.
// Remaining time covers dodging, clearing reinforcements and repositioning.
import {newWorld,planetMission,cleanBuild,mechStats} from '../dist/core.js';
import {stepOperation} from '../dist/planet-mission.js';
for(const n of [1,2,3,4]){
 const w=newWorld(planetMission(38),Array.from({length:n},(_,i)=>({id:String(i),build:cleanBuild({})}))),dt=.1,phases=[];let previous=-1;
 const move=(p,t)=>{const d=Math.hypot(p.x-t.x,p.y-t.y),s=Math.min(140*dt,d);p.x+=(t.x-p.x)/Math.max(d,1)*s;p.y+=(t.y-p.y)/Math.max(d,1)*s;p.altitude=t.altitude??t.z??0;return d;};
 for(let i=0;i<24000&&w.status==='playing';i++){
  w.time+=dt;const o=w.operation;
  if(o.phase!==previous){phases.push([o.phase,Math.round(w.time)]);previous=o.phase;}
  if(o.phase===0)w.kills=Math.floor(w.time/(2.9/n));
  for(const p of w.players){
   if(o.phase===1||o.phase===3){const target=w.enemies.filter(e=>e.hp>0&&!e.locked).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target&&move(p,target)<500)target.hp-=84*dt;}
   if(o.phase===2){const carried=o.cells.find(c=>c.carrier===p.id);let cell=o.cells.filter(c=>c.state==='sealed'||c.state==='loose').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(carried)move(p,o.crawler);else if(cell){const d=move(p,cell),cache=w.enemies.find(e=>e.id==='cache-'+cell.id);if(d<400&&cache)cache.hp-=84*dt;}}
   if(o.phase===4)move(p,w.mission.exit);
  }
  w.enemies=w.enemies.filter(e=>e.hp>0);stepOperation(w,dt,mechStats);for(const s of w.spawn.filter(s=>s.zone.elite&&s.time+1.8<=w.time)){const hp=s.zone.warden?16000*(1+.9*(n-1)):3600*(1+.65*(n-1));w.enemies.push({id:s.zone.warden?'cinder-warden':'siege-'+w.id++,x:s.zone.x,y:s.zone.y,hp,max:hp,elite:true});}w.spawn=w.spawn.filter(s=>s.zone.elite&&s.time+1.8>w.time);
 }
 console.log(JSON.stringify({pilots:n,status:w.status,minutes:Math.round(w.time/6)/10,phaseStarts:phases}));if(w.status!=='won')process.exitCode=1;
}
