import {CONTRACTS,contractFor,FIELD_MODULES,fieldOffer,earnedRanks,rankThresholds,moduleLevel} from './sortie-progression.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formatTime=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
export function contractMarkup(campaign,canChoose){
  return `<section class="sortie-contracts" aria-label="Operation contract"><div class="sortie-section-heading"><div><p class="overline">OPERATION CONTRACT</p><h2>Choose your fight.</h2></div><p>${canChoose?'Choose the encounter pressure.':'Your host chooses the contract.'} Shared salvage fuels independent field upgrades. Modules last one sortie.</p></div><div class="contract-grid">${CONTRACTS.map(c=>`<button type="button" data-contract="${c.id}" aria-pressed="${(campaign.contract||'frontline')===c.id}" ${canChoose?'':'disabled'}><small>${c.tag}</small><strong>${c.name}</strong><span>${c.detail}</span><b>${c.reward===1?'STANDARD SALVAGE':'+'+Math.round((c.reward-1)*100)+'% SALVAGE'}</b><em>${campaign.records?.[c.id]?'BEST EXTRACTION / '+formatTime(campaign.records[c.id]):'NO EXTRACTION RECORD'}</em></button>`).join('')}</div></section>`;
}
export function debriefMarkup(report,compact=false){
  if(!report)return '';
  const outcome={victory:'EXTRACTION COMPLETE',defeat:'SQUAD LOST',withdrawal:'SQUAD WITHDRAWN'}[report.outcome];
  return `<section class="sortie-debrief${compact?' compact':''}" aria-label="Sortie debrief"><div class="sortie-section-heading"><div><p class="overline">${compact?'LAST SORTIE':'SORTIE DEBRIEF'} / ${contractFor(report.contract).name.toUpperCase()}</p><h2>${outcome}</h2></div><span>${formatTime(report.seconds)} / ${report.cleared} OF 5 OBJECTIVES</span></div><div class="debrief-totals"><span><b>${report.kills}</b> HOSTILES</span><span><b>${report.salvage}</b> SHARED SALVAGE</span><span><b>${report.redeploys}</b> REDEPLOYS USED</span></div><div class="debrief-pilots">${report.pilots.map(p=>`<article><strong>${escape(p.name)}</strong><span>${p.kills} eliminations · ${p.damage.toLocaleString('en-US')} damage</span><p>${p.modules.length?p.modules.map(id=>`<span class="module-chip">${FIELD_MODULES[id].name}</span>`).join(''):'No field modules installed'}</p></article>`).join('')}</div><p class="sortie-footnote">Salvage advances every pilot equally. Field modules reset on your next drop; your workshop loadout stays yours.</p></section>`;
}
export function createSortieHud(parent,submit){
  const hud=document.createElement('section');hud.id='sortieHud';hud.hidden=true;hud.setAttribute('aria-label','Field progression');parent.append(hud);
  const offers=document.createElement('section');offers.id='fieldOffers';offers.hidden=true;offers.setAttribute('aria-label','Choose a field upgrade');parent.append(offers);
  let latestWorld=null,latestPilot=null,opened=false,seenRank=0,key='',offerKey='',worldToken=null,pending=null;
  function choose(index){const id=fieldOffer(latestWorld,latestPilot)[index];if(!id||latestPilot.hp<=0||pending)return;pending={id,rank:latestPilot.field.modules.length+1};submit(pending);render(true);}
  hud.addEventListener('click',()=>{opened=!opened;render(true);});
  offers.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.close!==undefined){opened=false;render(true);}else if(button.dataset.choice!==undefined)choose(Number(button.dataset.choice));});
  function render(force=false){
    const w=latestWorld,p=latestPilot;hud.hidden=!w?.sortie||!p?.field;offers.hidden=true;if(hud.hidden)return;
    const rank=earnedRanks(w),used=p.field.modules.length,options=fieldOffer(w,p),thresholds=rankThresholds(w),next=thresholds[rank],start=thresholds[rank-1]||0,percent=next?Math.min(100,(w.sortie.salvage-start)/(next-start)*100):100;
    const newKey=JSON.stringify([w.sortie.salvage,used,rank,p.hp<=0,opened,pending,w.status]);if(!force&&key===newKey){offers.hidden=!(opened&&options.length&&w.status==='playing');return;}key=newKey;
    hud.innerHTML=`<div class="field-heading"><span>${contractFor(w.sortie.contract).name.toUpperCase()}</span><b>RANK ${rank} / 5</b></div><div class="salvage-meter" role="progressbar" aria-label="Salvage to next field rank" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><i style="width:${percent}%"></i></div><p>${w.sortie.salvage}${next?' / '+next:''} SHARED SALVAGE</p><button type="button" aria-expanded="${opened}" ${!options.length?'disabled':''}>${options.length?`${rank-used} UPGRADE${rank-used>1?'S':''} READY [U]`:'ALL EARNED MODULES FITTED'}</button><small>${used} / 5 modules fitted · This sortie only</small><div class="field-fitted">${[...new Set(p.field.modules)].map(id=>`<span title="${FIELD_MODULES[id].detail}">${FIELD_MODULES[id].name}<b>×${moduleLevel(p,id)}</b></span>`).join('')}</div>`;
    if(!opened||!options.length||w.status!=='playing')return;
    offers.hidden=false;
    // Salvage changes frequently during combat; keep clickable cards stable between offers.
    const nextOfferKey=JSON.stringify([used,options,p.hp<=0,pending]);if(!force&&offerKey===nextOfferKey)return;offerKey=nextOfferKey;
    offers.innerHTML=`<div class="field-offer-heading"><div><b>FIELD UPGRADE / ${used+1}</b><span>${p.hp<=0?'Recover your mech to install.':'Choose one. Combat stays live.'}</span></div><button type="button" data-close aria-label="Hide field upgrades">LATER [U] ×</button></div><div class="field-cards">${options.map((id,i)=>{const item=FIELD_MODULES[id];return `<button type="button" data-choice="${i}" ${p.hp<=0||pending?'disabled':''}><small>[${i+1}] ${item.role} / STACK ${moduleLevel(p,id)+1} OF 3</small><strong>${item.name}</strong><span>${item.detail}</span><b>${pending?.id===id?'INSTALLING…':'INSTALL ↗'}</b></button>`;}).join('')}</div>`;
  }
  return {
    update(w,p){
      if(w?.mission!==worldToken){worldToken=w?.mission;opened=false;seenRank=0;pending=null;key=offerKey='';submit(null);}
      latestWorld=w;latestPilot=p;
      if(pending&&p?.field?.modules.length>=pending.rank){pending=null;submit(null);opened=false;}
      const rank=earnedRanks(w);if(rank>seenRank){seenRank=rank;opened=true;}
      render();
    },
    key(code){if(!latestWorld?.sortie||latestWorld.status!=='playing')return false;if(code==='KeyU'){opened=!opened;render(true);return true;}if(opened&&/^Digit[123]$/.test(code)){choose(Number(code.slice(-1))-1);return true;}return false;}
  };
}
