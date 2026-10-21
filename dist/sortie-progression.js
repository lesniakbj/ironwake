// Shared round rewards and run-module combat effects. Installation belongs to campaign refits.
export const CONTRACTS = [
  {id:'frontline',name:'Frontline',tag:'BALANCED',detail:'Standard Cinderfall patrols and siege arrivals. Learn the route and build your mech as you fight.',reward:1,wave:5.5,tanks:9,eliteTimes:[20,45]},
  {id:'overrun',name:'Overrun',tag:'RELENTLESS',detail:'Reinforcements arrive 24% sooner. Keep moving and clear groups quickly. Earn 25% more salvage.',reward:1.25,wave:4.2,tanks:9,eliteTimes:[20,45]},
  {id:'siegebreaker',name:'Siegebreaker',tag:'HEAVY CONTACT',detail:'More armored scarabs; siege mechs drop earlier. Bring armor-breaking weapons. Earn 35% more salvage.',reward:1.35,wave:5.5,tanks:4,eliteTimes:[12,25]}
];
export const contractFor=id=>CONTRACTS.find(c=>c.id===id)||CONTRACTS[0];
export const FIELD_MODULES = {
  power:{name:'Weapon overdrive',role:'ASSAULT',detail:'+12% damage to every weapon, dash and special per stack.',short:'+12% damage'},
  breaker:{name:'Siege rounds',role:'BREACH',detail:'+20% damage against armored scarabs, siege mechs and mission targets per stack.',short:'+20% heavy damage'},
  plating:{name:'Reactive armor',role:'SURVIVAL',detail:'Take 10% less damage per stack. ',short:'10% less damage'},
  repair:{name:'Recovery mesh',role:'RECOVERY',detail:'After 7 seconds without a hit, repair an extra 2 hull per second per stack.',short:'+2 hull/sec recovery'},
  thrusters:{name:'Vector boosters',role:'MOBILITY',detail:'+10% movement speed and lift per stack. Dash recharge is 10% faster per stack.',short:'+10% speed / lift'},
  capacitor:{name:'Special capacitor',role:'SYSTEMS',detail:'Recharge your equipped special 25% faster per stack.',short:'+25% special recharge'}
};
const EMPTY=[];
export function moduleLevel(p,id){let level=0;for(const value of p?.field?.modules||EMPTY)if(value===id)level++;return level;}
export function initSortie(w){
  w.sortie={contract:contractFor(w.mission.contract).id,salvage:0,salvageUnits:0,combatKills:0,objectives:0,teamSize:w.players.length};
  w.players.forEach((p,i)=>p.field={modules:w.mission.raid?(w.mission.campaign?.pilots?.find(q=>q.name===p.name)?.modules||[]).filter(id=>Object.hasOwn(FIELD_MODULES,id)).slice(0,18):[],damage:0,kills:0,maxHull:p.hp,seed:(w.mission.seed+i*7919)>>>0});
}
// Legacy input APIs intentionally reject combat-time installs; the campaign refit owns upgrades.
export function fieldOffer(){return [];}
export function chooseFieldModule(){return false;}
export function awardSalvage(w,amount){
  if(!w.sortie)return;
  // Preserve fractional contract bonuses across kills; publish whole salvage.
  w.sortie.salvageUnits=Math.min(99999900,w.sortie.salvageUnits+Math.round(amount*contractFor(w.sortie.contract).reward*100));
  w.sortie.salvage=Math.floor(w.sortie.salvageUnits/100);
}
export function rewardDefeat(w,e){
  if(!w.sortie||e.training)return;
  awardSalvage(w,e.id==='cinder-warden'?100:e.elite?50:e.objective?24:e.type==='tank'?10:e.type==='gunner'?6:4);
  if(e.objective)w.sortie.objectives++;else w.sortie.combatKills++;
  const p=w.players.find(p=>p.id===e.lastHitBy);if(p?.field&&!e.objective)p.field.kills++;
}
export function fieldDamage(p,e,damage){
  return damage*(1+.12*moduleLevel(p,'power'))*(e.objective||e.elite||e.type==='tank'?1+.2*moduleLevel(p,'breaker'):1);
}
const count=(n,max=999999)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.round(n))):0;
export function cleanSortieReport(value){
  if(!value||!['victory','defeat','withdrawal'].includes(value.outcome))return null;
  return {teamSize:Math.max(1,count(value.teamSize||value.pilots?.length||1,4)),missionId:typeof value.missionId==='string'?value.missionId.slice(0,32):null,missionName:typeof value.missionName==='string'?value.missionName.slice(0,40):'Cinderfall',totalObjectives:count(value.totalObjectives||5,5),round:!!value.round,outcome:value.outcome,contract:contractFor(value.contract).id,seconds:count(value.seconds),cleared:count(value.cleared,5),kills:count(value.kills),salvage:count(value.salvage),redeploys:count(value.redeploys,2),pilots:(Array.isArray(value.pilots)?value.pilots:[]).slice(0,4).map(p=>({name:String(p?.name||'Pilot').slice(0,24),damage:count(p?.damage,99999999),kills:count(p?.kills),modules:(Array.isArray(p?.modules)?p.modules:[]).filter(id=>typeof id==='string'&&Object.hasOwn(FIELD_MODULES,id)).slice(0,18)}))};
}
export function sortieReport(w,outcome){
  if(!w?.sortie)return null;
  return cleanSortieReport({teamSize:w.sortie.teamSize,missionId:w.mission.missionId,missionName:w.mission.name,totalObjectives:w.mission.zones.length,round:w.mission.raid,outcome,contract:w.sortie.contract,seconds:w.time,cleared:w.cleared,kills:w.sortie.combatKills,salvage:w.sortie.salvage,redeploys:(w.mission.raid?1:2)-w.operation.redeploys,pilots:w.players.map(p=>({name:p.name,damage:p.field?.damage,kills:p.field?.kills,modules:p.field?.modules}))});
}
