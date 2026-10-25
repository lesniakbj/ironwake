import{CHASSIS,CHASSIS_CLASSES}from './chassis.js';
import{treeFor,careerProfile,availablePoints,nodeStatus}from './career-progression.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pointLabel=count=>`${count} ${count===1?'point':'points'}`;
const mechIcon='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 3h8l2 5-6 3-6-3zM9 12l7-2 7 2-1 10-6 3-6-3zM4 12h4l1 10-4 2-2-5zM24 12h4l1 7-2 5-4-2zM10 25l5 1-1 5H8zM17 26l5-1 2 6h-6z"/></svg>';
const pilotIcon='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 4l6-2 6 2 3 7-2 10-7 4-7-4-2-10zM9 11h14v5l-7 3-7-3zM11 25l5 3 5-3 6 6H5z"/><path d="M12 13h8"/></svg>';

function chassisOptions(selected,equipped){
 return `<option value="custom"${selected==='custom'?' selected':''}>Custom frame${equipped==='custom'?' · equipped':''}</option>${Object.entries(CHASSIS_CLASSES).map(([id,group])=>`<optgroup label="${escape(group.name)}">${Object.values(CHASSIS).filter(c=>c.size===id).map(c=>`<option value="${c.id}"${selected===c.id?' selected':''}>${escape(c.name)}${equipped===c.id?' · equipped':''}</option>`).join('')}</optgroup>`).join('')}`;
}

function branchMarkup(branch,index,{career,kind,key,nodes}){
 const branchNodes=branch.nodes.map((node,rank)=>{
  const status=nodeStatus(career,kind,key,node.id),state=status.unlocked?'unlocked':status.available?'available':'locked';
  const prerequisites=node.requires.map(id=>nodes.find(n=>n.id===id)?.name||id);
  const statusLabel=status.unlocked?'RESEARCHED':status.available?'AVAILABLE':'LOCKED';
  const reason=status.unlocked?'Permanent upgrade installed.':status.available?'Ready to unlock in the hangar.':status.reason||'Complete the previous upgrade to continue.';
  return `<li class="career-node career-node-${state}" data-career-node="${escape(node.id)}">
   ${rank?'<div class="career-link" aria-hidden="true"><span>↓</span></div>':''}
   <article aria-labelledby="career-node-${index}-${rank}">
    <div class="career-node-meta"><span>RANK ${String(rank+1).padStart(2,'0')}</span><span class="career-node-status"><span aria-hidden="true">${status.unlocked?'✓':status.available?'◇':'▣'}</span> ${statusLabel}</span></div>
    <h4 id="career-node-${index}-${rank}">${escape(node.name)}</h4>
    <p class="career-effect"><span>EFFECT</span>${escape(node.description)}</p>
    <div class="career-requires">${prerequisites.length?`Requires: ${prerequisites.map(escape).join(' + ')}`:'Entry upgrade · no prerequisite'}</div>
    <p class="career-node-reason" id="career-reason-${index}-${rank}">${escape(reason)}</p>
    <button class="career-unlock" data-career-unlock="${escape(node.id)}" aria-describedby="career-reason-${index}-${rank}"${status.available&&!status.unlocked?'':' disabled'}><span>${status.unlocked?'Installed':'Unlock upgrade'}</span><b>${status.unlocked?'✓':escape(pointLabel(node.cost))}</b></button>
   </article>
  </li>`;
 }).join('');
 return `<section class="career-branch" aria-labelledby="career-branch-${index}"><header class="career-branch-heading"><span class="career-path-index">PATH / ${String(index+1).padStart(2,'0')}</span><h3 id="career-branch-${index}">${escape(branch.name)}</h3><p>${escape(branch.description)}</p></header><ol class="career-nodes">${branchNodes}</ol></section>`;
}

export function careerMarkup({career,build,pilot,tab='mech',chassisId}={}){
 const kind=tab==='pilot'?'pilot':'mech',equipped=Object.hasOwn(CHASSIS,build?.chassis)?build.chassis:'custom';
 const selected=chassisId==='custom'||Object.hasOwn(CHASSIS,chassisId)?chassisId:equipped,key=kind==='mech'?selected:pilot;
 const tree=treeFor(kind,key),profile=careerProfile(career,kind,key),points=availablePoints(career,kind,key),nodes=tree.branches.flatMap(branch=>branch.nodes);
 const purchased=nodes.filter(node=>profile.unlocked.includes(node.id)),spent=purchased.reduce((sum,node)=>sum+node.cost,0),isEquipped=selected===equipped;
 const identity=kind==='mech'?(CHASSIS[selected]?.name||'Custom frame'):(pilot||'Your pilot');
 const badge=kind==='pilot'?'ACTIVE PILOT':isEquipped?'EQUIPPED CHASSIS':'BROWSING CHASSIS';
 return `<section class="career-tree" aria-labelledby="career-title" data-career-kind="${kind}">
  <div class="career-protocol"><span>IRONWAKE / CAREER COMMAND</span><span><i aria-hidden="true"></i> HANGAR ACCESS</span></div>
  <header class="career-heading"><div class="career-heading-copy"><p class="career-kicker">PERMANENT PROGRESSION</p><h2 id="career-title">Built for the next drop.</h2><p>Develop your machine. Sharpen your pilot. Keep your progress across campaigns.</p></div><span class="career-stamp" aria-hidden="true">${mechIcon}<span>RESEARCH<br>DIVISION / 01</span></span></header>
  <nav class="career-tabs" aria-label="Upgrade tree"><button class="career-tab" data-career-tab="mech" aria-pressed="${kind==='mech'}">${mechIcon}<span><strong>Mech research</strong><small>Specialize each chassis</small></span><b aria-hidden="true">01</b></button><button class="career-tab" data-career-tab="pilot" aria-pressed="${kind==='pilot'}">${pilotIcon}<span><strong>Pilot skills</strong><small>Carry your skills into every mech</small></span><b aria-hidden="true">02</b></button></nav>
  <div class="career-profile">
   <div class="career-identity"><span class="career-active${kind==='mech'&&!isEquipped?' career-browsing':''}">${badge}</span>${kind==='mech'?`<label class="career-selector-label" for="career-chassis">Research chassis</label><select class="career-chassis" id="career-chassis" data-career-chassis aria-describedby="career-scope">${chassisOptions(selected,equipped)}</select>`:`<p class="career-pilot-name">${escape(identity)}</p>`}<p class="career-scope" id="career-scope">${kind==='mech'?'Research belongs to this chassis. Browsing keeps your equipped mech.':'Pilot skills stay with this callsign, whichever mech you equip.'}</p></div>
   <dl class="career-points" aria-label="Career points"><div class="career-points-available"><dt>Available points</dt><dd>${escape(points)}</dd></div><div><dt>Total earned</dt><dd>${escape(profile.earned)}</dd></div><div><dt>Upgrades</dt><dd>${purchased.length}<span> / ${nodes.length}</span></dd></div></dl>
  </div>
  <p class="career-feedback" role="status" aria-live="polite" tabindex="-1">Choose an available upgrade to unlock its permanent effect.</p>
  <div class="career-tree-intro"><div><p class="career-kicker">${kind==='mech'?'CHASSIS RESEARCH':'PILOT TRAINING'} / ${escape(identity)}</p><h3>${escape(tree.name)}</h3><p>${escape(tree.description)}</p></div><div class="career-legend" aria-label="Upgrade status legend"><span><i class="career-key-unlocked" aria-hidden="true"></i> Researched</span><span><i class="career-key-available" aria-hidden="true"></i> Available</span><span><i class="career-key-locked" aria-hidden="true"></i> Locked</span></div></div>
  <div class="career-branches">${tree.branches.map((branch,index)=>branchMarkup(branch,index,{career,kind,key,nodes})).join('')}</div>
  <footer class="career-footer"><div><strong>Earn in the field. Spend in the hangar.</strong><p>Start with 1 point per chassis and pilot. Each successful campaign extraction earns 1 point for your deployed chassis and pilot, up to 18 earned points per tree. Campaign and in-mission rewards use their own upgrade systems.</p><span class="career-save-note">Career progress saves on this browser and survives a new campaign.</span></div><div class="career-respec"><button data-career-reset class="career-reset"${purchased.length?'':' disabled'}>Respec ${kind==='mech'?'chassis':'pilot'} <span>↺</span></button><p>Refund ${escape(pointLabel(spent))}. Clear this ${kind==='mech'?'chassis’s research':'pilot’s skills'}.</p></div></footer>
 </section>`;
}
