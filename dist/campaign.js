import {contractFor,cleanSortieReport} from './sortie-progression.js';
// Campaign state belongs to the host; battlefield simulation stays in planet-mission.js.
export const CAMPAIGN_VERSION = 1;
export const LANDINGS = [
  {id:'beachhead',name:'Beachhead',code:'A1',cell:'3-3',x:850,y:1050,detail:'Central insertion. Rally on the freight road and push toward Battery Ridge.'},
  {id:'west-approach',name:'West approach',code:'A2',cell:'2-4',x:650,y:1050,detail:'Rear insertion. Regroup west of the beachhead before moving up the canyon.'},
  {id:'forward-drop',name:'Forward drop',code:'A3',cell:'4-3',x:1050,y:1050,detail:'Forward insertion. Land closer to the first checkpoint on the same canyon route.'}
];
export function newCampaign(seed) {
  return {version:CAMPAIGN_VERSION,id:crypto.randomUUID(),seed:seed>>>0,revision:0,landing:'beachhead',contract:'frontline',sorties:0,victories:0,lastResult:null,lastReport:null,records:{}};
}
export function cleanCampaign(value) {
  if(!value||value.version!==CAMPAIGN_VERSION||typeof value.id!=='string'||value.id.length>64||!Number.isInteger(value.seed))return null;
  const records={};for(const id of ['frontline','overrun','siegebreaker'])if(Number.isSafeInteger(value.records?.[id])&&value.records[id]>0&&value.records[id]<=999999)records[id]=value.records[id];
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,999999):0;
  return {version:CAMPAIGN_VERSION,id:value.id,seed:value.seed>>>0,revision:count(value.revision),landing:LANDINGS.some(p=>p.id===value.landing)?value.landing:'beachhead',sorties:count(value.sorties),victories:Math.min(count(value.victories),count(value.sorties)),lastResult:['victory','defeat','withdrawal'].includes(value.lastResult)?value.lastResult:null,contract:contractFor(value.contract).id,lastReport:cleanSortieReport(value.lastReport),records};
}
export const landingFor=campaign=>LANDINGS.find(p=>p.id===campaign?.landing)||LANDINGS[0];
export function campaignMission(campaign,makeMission) {
  const mission=makeMission((campaign.seed+campaign.sorties)>>>0),landing=landingFor(campaign);
  // All three insertions are inside the clear starting corridor, before checkpoint 01.
  mission.entry={x:landing.x,y:landing.y};
  mission.contract=contractFor(campaign.contract).id;
  mission.campaign={id:campaign.id,revision:campaign.revision,landing:landing.id};
  return mission;
}
export function recordSortie(campaign,outcome,report=null) {
  const lastReport=cleanSortieReport(report),records={...campaign.records};
  if(outcome==='victory'&&lastReport?.outcome==='victory'&&lastReport.seconds>0){const id=lastReport.contract;records[id]=Math.min(records[id]||Infinity,lastReport.seconds);}
  return {...campaign,revision:campaign.revision+1,sorties:campaign.sorties+1,victories:campaign.victories+(outcome==='victory'?1:0),lastResult:outcome,lastReport,records};
}
export function campaignCells(campaign) {
  const cells=[];
  for(let row=0;row<7;row++)for(let col=0;col<10;col++){
    if((row===0&&(col<2||col>7))||(row===6&&(col<1||col>7))||(row===1&&col===9))continue;
    const id=`${col}-${row}`,landing=LANDINGS.find(p=>p.cell===id);
    const fog=(row===0||row===6||col===9),control=landing?(campaign?.victories?'allied':'contested'):fog?'unknown':col<3?'allied':col<5?'contested':'hostile';
    cells.push({id,col,row,x:112+col*67+(row%2)*33.5,y:78+row*58,control,landing});
  }
  return cells;
}
