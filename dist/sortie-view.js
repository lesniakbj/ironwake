import {contractFor,FIELD_MODULES,moduleLevel} from './sortie-progression.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formatTime=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
export function debriefMarkup(report,compact=false){
  if(!report)return '';
  const outcome={victory:'EXTRACTION COMPLETE',defeat:'SQUAD LOST',withdrawal:'SQUAD WITHDRAWN'}[report.outcome];
  return `<section class="sortie-debrief${compact?' compact':''}" aria-label="Sortie debrief"><div class="sortie-section-heading"><div><p class="overline">${compact?'LAST SORTIE':'SORTIE DEBRIEF'} / ${escape(report.missionName)} / ${contractFor(report.contract).name.toUpperCase()}</p><h2>${outcome}</h2></div><span>${formatTime(report.seconds)} / ${report.cleared} OF ${report.totalObjectives||5} OBJECTIVES</span></div><div class="debrief-totals"><span><b>${report.kills}</b> HOSTILES</span><span><b>${report.salvage}</b> SHARED SALVAGE</span><span><b>${report.redeploys}</b> REDEPLOYS USED</span></div><div class="debrief-pilots">${report.pilots.map(p=>`<article><strong>${escape(p.name)}</strong><span>${p.kills} eliminations · ${p.damage.toLocaleString('en-US')} damage</span><p>${p.modules.length?p.modules.map(id=>`<span class="module-chip">${FIELD_MODULES[id].name}</span>`).join(''):'No field modules installed'}</p></article>`).join('')}</div><p class="sortie-footnote">Salvage is shared. Each pilot installs their earned upgrades at the refit between missions. Installed modules persist through the run; workshop loadouts remain separate.</p></section>`;
}
export function createSortieHud(parent){
 const hud=document.createElement('section');hud.id='sortieHud';hud.hidden=true;hud.setAttribute('aria-label','Run progression');parent.append(hud);let key='';
 return{update(w,p){hud.hidden=!w?.sortie||!p?.field;if(hud.hidden)return;const next=JSON.stringify([w.sortie.salvage,p.field.modules,w.mission.seed,w.mission.practice]);if(next===key)return;key=next;
 hud.innerHTML=`<div class="field-heading"><span>${w.mission.practice?'DRILL':w.mission.raid?'LEVEL '+w.mission.sector+' / 9':w.mission.name}</span><b>RUN MODULES ${p.field.modules.length}</b></div><p>${w.sortie.salvage} SHARED SALVAGE</p><small>${w.mission.practice?'Practice / no campaign rewards':'Earn now · Refit after extraction'}</small><div class="field-fitted">${[...new Set(p.field.modules)].map(id=>`<span>${FIELD_MODULES[id].name}<b>×${moduleLevel(p,id)}</b></span>`).join('')}</div>`;
 },key(){return false;}};
}
