// Native disclosures keep navigation and reference material available on demand.
const $=selector=>document.querySelector(selector);
const menus=[...document.querySelectorAll('.interface-menu')];
let dialogReturnFocus;
$('#modal').addEventListener('close',()=>{
 if(dialogReturnFocus?.isConnected&&dialogReturnFocus.getClientRects().length)dialogReturnFocus.focus({preventScroll:true});
 dialogReturnFocus=null;
});
const closeMenu=(menu,restoreFocus=false)=>{menu.open=false;if(restoreFocus)menu.querySelector('summary').focus();};
document.addEventListener('click',event=>{
 for(const menu of menus){
  if(!menu.open)continue;
  if(!menu.contains(event.target)){closeMenu(menu);continue;}
  const action=event.target.closest('[data-menu-action],[data-view],[data-feedback],#gameHelp,#exitGame');
  if(action)closeMenu(menu);
 }
 const destination=event.target.closest('[data-menu-action]')?.dataset.menuAction;
 if(destination==='campaign')$('#campaignNav').click();
 if(destination==='workshop')$('#garageNav').click();
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||document.querySelector('dialog[open]'))return;
 const open=menus.find(menu=>menu.open);
 if(open){event.preventDefault();event.stopPropagation();closeMenu(open,true);}
},true);
for(const menu of menus)menu.addEventListener('toggle',()=>{
 if(menu.open)for(const other of menus)if(other!==menu)closeMenu(other);
});

function referenceSection(label,nodes){
 const section=document.createElement('details');section.className='manual-section';
 const summary=document.createElement('summary');summary.textContent=label;section.append(summary,...nodes);return section;
}
export function prepareDialog(body){
 if(!$('#modal').open){const source=document.activeElement;dialogReturnFocus=source?.closest('.interface-menu')?.querySelector('summary')||source;}
 const title=body.querySelector('h2');
 if(title){title.id='dialogTitle';$('#modal').setAttribute('aria-labelledby','dialogTitle');$('#modal').removeAttribute('aria-label');}
 else{$('#modal').removeAttribute('aria-labelledby');$('#modal').setAttribute('aria-label','Game dialog');}
 const controls=body.querySelector('.manual-controls');
 if(!controls)return;
 const aiming=controls.nextElementSibling,touch=body.lastElementChild;
 body.querySelector('.overline').textContent='PILOT HANDBOOK';
 title.textContent='Make every move count.';
 title.after(controls);
 for(const [key,label] of [['H','Controls & help'],['M','Toggle sound'],['TAB','Full map · hold'],['ESC','Release mouse']]){
  const row=document.createElement('span'),kbd=document.createElement('kbd');kbd.textContent=key;row.append(kbd,document.createTextNode(label));controls.append(row);
 }
 const movement=referenceSection('Aiming, movement & touch',[aiming,touch]);
 controls.after(movement);
 const effects=body.querySelector('.impact-setting');
 const effectSection=referenceSection('Motion & impact effects',[]);
 effects.before(effectSection);effectSection.append(effects);
 for(const heading of [...body.querySelectorAll(':scope > h3')]){
  const nodes=[];let next=heading.nextSibling;
  while(next&&!(next.nodeType===1&&next.tagName==='H3')){nodes.push(next);next=next.nextSibling;}
  const section=referenceSection(heading.textContent,nodes);heading.replaceWith(section);
 }
 // Keep motion preferences easy to find, after the essential controls.
 body.append(body.querySelector('.manual-section:has(.impact-setting)'));
}
