import {fillUiIcons} from './ui-icons.js';
// The shell owns wayfinding; individual screens own their working surfaces.
fillUiIcons();
const $=selector=>document.querySelector(selector);
const menus=[...document.querySelectorAll('.interface-menu')];
let dialogReturnFocus;
$('#modal').addEventListener('close',()=>{
 if(dialogReturnFocus?.isConnected&&dialogReturnFocus.getClientRects().length)dialogReturnFocus.focus({preventScroll:true});
 dialogReturnFocus=null;
});
const closeMenu=(menu,restoreFocus=false)=>{menu.open=false;if(restoreFocus)menu.querySelector('summary').focus();};
document.addEventListener('click',event=>{
 if(event.target.closest('#railHome'))$('#homeNav').click();
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

function syncShell(){
 const screen=document.body.dataset.screen;
 const active={home:'railHome',campaign:'campaignNav',garage:'garageNav'}[screen];
 for(const button of document.querySelectorAll('.section-rail .rail-button')){
  if(button.id===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
 }
 $('#screenContext').textContent={home:'COMMAND DECK',campaign:'OPERATIONS',garage:'FITTING BAY'}[screen]||'COMMAND DECK';
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#mainContent').animate([{opacity:.3},{opacity:1}],{duration:180,easing:'ease-out'});
}
new MutationObserver(syncShell).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
syncShell();
$('.section-rail').addEventListener('keydown',event=>{
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const buttons=[...document.querySelectorAll('.section-rail .rail-button')],index=buttons.indexOf(document.activeElement);
 if(index<0)return;event.preventDefault();
 const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)+buttons.length)%buttons.length;
 buttons[next].focus();
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
 $('#modal').classList.toggle('handbook-dialog',!!controls);$('#modal').classList.toggle('armory-dialog',!!body.querySelector('.armory-grid'));
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
 const layout=document.createElement('div');layout.className='handbook-layout';
 const navigation=document.createElement('nav');navigation.className='handbook-navigation';navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Handbook topics');navigation.setAttribute('aria-orientation','vertical');
 const content=document.createElement('div');content.className='handbook-content';
 const topics=[{label:'Quick controls',nodes:[controls]},...[...body.querySelectorAll('.manual-section')].map(section=>({label:section.querySelector('summary').textContent,nodes:[...section.children].filter(node=>node.tagName!=='SUMMARY'),section}))];
 const activateTopic=(index,focus=false)=>{
  for(const [i,button] of [...navigation.children].entries()){button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;content.children[i].hidden=i!==index;}
  if(focus)navigation.children[index].focus();
 };
 for(const [index,topic] of topics.entries()){
  const button=document.createElement('button');button.type='button';button.dataset.helpSection=String(index);button.id='help-topic-'+index;button.setAttribute('role','tab');button.setAttribute('aria-controls','help-panel-'+index);button.textContent=topic.label;
  button.onclick=()=>activateTopic(index);navigation.append(button);
  const panel=document.createElement('section');panel.id='help-panel-'+index;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
  if(index){const heading=document.createElement('h3');heading.textContent=topic.label;panel.append(heading);}
  panel.append(...topic.nodes);content.append(panel);topic.section?.remove();
 }
 navigation.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const current=[...navigation.children].indexOf(document.activeElement),count=topics.length;
  const next=event.key==='Home'?0:event.key==='End'?count-1:(current+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)+count)%count;activateTopic(next,true);
 });
 layout.append(navigation,content);body.append(layout);activateTopic(0);
}
