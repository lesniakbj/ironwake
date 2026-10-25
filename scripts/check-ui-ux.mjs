// Optional Chrome UI integration check. All saves and gameplay use isolated local browser contexts.
// Example: PLAYWRIGHT_MODULE=file:///path/to/playwright/index.mjs node scripts/check-ui-ux.mjs
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(process.env.UI_UX_OUTPUT||resolve(root,'.artifacts/ui-ux'));
await mkdir(output,{recursive:true});
const port=process.env.UI_UX_PORT||'4296';
const base=process.env.UI_UX_BASE_URL||`http://127.0.0.1:${port}/ironwake/`;
let server;
if(!process.env.UI_UX_BASE_URL){
 server=spawn(process.execPath,[fileURLToPath(new URL('./preview-server.mjs',import.meta.url)),port],{cwd:root,windowsHide:true});
 await new Promise((resolve,reject)=>{
  server.stdout.once('data',resolve);server.once('error',reject);
  server.once('exit',code=>reject(Error('Preview exited: '+code)));
 });
}
let browser;
const failures=[],checks=[],errors=[];
const touchPages=new WeakSet();
const touchSessions=new WeakMap();
const viewports=[{width:1440,height:1000},{width:1280,height:720},{width:390,height:844},{width:844,height:390}];
const hud=['#squadPanel','#vicinityPanel','#loadoutPanel','#objectivesPanel','#sortieHud','#combatMenu'];

async function screenshot(page,name){
 await page.waitForFunction(()=>!document.querySelector('#toast')?.classList.contains('show'),null,{timeout:6000});
 const fullPage=!await page.locator('#game').isVisible()&&!await page.locator('dialog[open]').count();
 await page.screenshot({path:resolve(output,name+'.png'),fullPage});
}
async function activate(locator){return touchPages.has(locator.page())?locator.tap():locator.click();}
async function activateTouch(page){
 if(!touchPages.has(page))return;
 // Full-page Chrome captures can reset the primary pointer emulation. Restore it before checking combat.
 let session=touchSessions.get(page);if(!session){session=await page.context().newCDPSession(page);touchSessions.set(page,session);}
 await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await page.locator('#joystick').tap();
 assert.equal(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),true,'Combat touch capture must use a coarse primary pointer');
}
async function openItem(page,selector,menu='#interfaceMenu'){
 if(!await page.locator(selector).isVisible()&&await page.locator(menu).count())await activate(page.locator(menu+'>summary'));
 await activate(page.locator(selector));
 // Menus are native disclosures; dismiss after using a command so they do not obscure subsequent actions.
 await page.evaluate(selector=>{const menu=document.querySelector(selector);if(menu)menu.open=false;},menu);
}
async function navigate(page,destination){
 const direct=destination==='campaign'?'#campaignNav':'#garageNav';
 if(await page.locator(direct).isVisible())await activate(page.locator(direct));
 else await openItem(page,`[data-menu-action="${destination}"]`);
}
async function layout(page,label,selectors=[],squadFixture=false){
 const result=await page.evaluate(({selectors,squadFixture})=>{
  const squad=document.querySelector('#squadHud'),game=document.querySelector('#game');
  const previousSquad=squad?.innerHTML,previousExtra=game?.style.getPropertyValue('--squad-extra');
  if(squadFixture&&squad){
   squad.innerHTML=Array.from({length:4},(_,i)=>`<div class="squad-channel"><span>0${i+1}</span><b>PILOT-ABC${i} / ${i?'ALLY':'YOU'}</b><small>ONLINE</small></div>`).join('');
   game.style.setProperty('--squad-extra','42px');
  }
  const visible=el=>el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&Number(getComputedStyle(el).opacity)>0&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
  const rects=selectors.map(selector=>({selector,el:document.querySelector(selector)})).filter(({el})=>visible(el)).map(({selector,el})=>{const r=el.getBoundingClientRect();return{selector,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};});
  const overlaps=[];
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j],width=Math.min(a.right,b.right)-Math.max(a.x,b.x),height=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);
   if(width>2&&height>2)overlaps.push(`${a.selector} overlaps ${b.selector} (${Math.round(width)}×${Math.round(height)})`);
  }
  const offscreen=rects.filter(r=>r.x< -1||r.y< -1||r.right>innerWidth+1||r.bottom>innerHeight+1).map(r=>`${r.selector} extends outside ${innerWidth}×${innerHeight}`);
  const dialogs=[...document.querySelectorAll('dialog[open]')].map(el=>({id:el.id,client:el.clientWidth,scroll:el.scrollWidth}));
  const result={width:innerWidth,height:innerHeight,coarsePointer:matchMedia('(pointer:coarse)').matches,squadFixture,documentWidth:document.documentElement.scrollWidth,rects,overlaps,offscreen,dialogs};
  if(squadFixture&&squad){squad.innerHTML=previousSquad;game.style.setProperty('--squad-extra',previousExtra);}
  return result;
 },{selectors,squadFixture});
 checks.push({label,...result});
 if(result.documentWidth>result.width+1)failures.push(`${label}: horizontal page overflow (${result.documentWidth}px in ${result.width}px)`);
 for(const item of result.dialogs)if(item.scroll>item.client+1)failures.push(`${label}: #${item.id} has horizontal dialog overflow`);
 for(const item of [...result.overlaps,...result.offscreen])failures.push(`${label}: ${item}`);
}
async function openGame(page){
 await page.waitForFunction(()=>!document.querySelector('#game').hidden&&document.querySelector('#deploymentScreen').hidden,null,{timeout:30000});
 await page.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();});
 await page.waitForFunction(()=>document.querySelector('#hullValue').textContent!=='—');
}
async function exitRange(page){
 await openItem(page,'#exitGame','#combatMenu');
 await page.waitForFunction(()=>document.querySelector('#game').hidden);
}

try{
 browser=await chromium.launch({channel:process.env.UI_UX_BROWSER_CHANNEL||'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 for(const viewport of viewports){
  const size=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:viewport.width<=844,isMobile:viewport.width<=844}),page=await context.newPage();
  if(viewport.width<=844)touchPages.add(page);
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(`${size}: ${error.message}`));
  try{
   console.log(`Checking ${size}`);
   await page.goto(base);await page.waitForFunction(()=>!!document.querySelector('#feedbackDialog'));
   await page.locator('#startMission').waitFor({state:'visible'});
   await screenshot(page,`${size}-01-home`);await layout(page,`${size} home`);

   await activate(page.locator('#startMission'));
   await page.waitForFunction(()=>document.body.dataset.screen==='campaign');
   assert.equal(await page.locator('#campaignMech').count(),1);
   assert.equal(await page.locator('[data-action=deploy]').isEnabled(),true);
   await screenshot(page,`${size}-02-campaign`);await layout(page,`${size} campaign collapsed`);
   // Changing a preset and special must still update the saved build and remain deployable.
   if(!await page.locator('#campaignMech').isVisible())await activate(page.locator('details[data-disclosure=loadout]>summary'));
   await page.locator('#campaignMech').selectOption('preset-0');
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('iw-active')).chassis==='lark');
   const special=await page.locator('#campaignSpecial option').evaluateAll(options=>options.find(o=>!o.selected)?.value);
   await page.locator('#campaignSpecial').selectOption(special);
   await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).equipment[2]===id,special);
   await screenshot(page,`${size}-02b-loadout`);await layout(page,`${size} campaign loadout`);
   for(const selector of ['details[data-disclosure=route]','details[data-disclosure=contracts]'])if(await page.locator(selector).count()){
    await activate(page.locator(selector+'>summary'));await layout(page,`${size} ${selector} expanded`);
    if(selector==='details[data-disclosure=route]'){
     await activate(page.locator('[data-level="8"]'));
     assert.equal(await page.locator('[data-level="8"]').getAttribute('aria-pressed'),'true');
     await activate(page.locator('[data-action=focus]'));
     assert.equal(await page.locator('[data-level="0"]').getAttribute('aria-pressed'),'true');
    }
    await activate(page.locator(selector+'>summary'));
   }
   const vanguard=await page.locator('#campaignMech option').evaluateAll(options=>options.find(o=>o.textContent.startsWith('Vanguard'))?.value);
   await page.locator('#campaignMech').selectOption(vanguard);

   await navigate(page,'workshop');
   await page.waitForFunction(()=>document.body.dataset.screen==='garage');
   // Frame choices are real buttons: fitting must update the build, pressed state and capacity validation.
   await activate(page.locator('button[data-slot=torso]'));
   const choice=page.locator('[data-choice][aria-pressed=false]').first(),choiceId=await choice.getAttribute('data-choice');
   await activate(choice);
   assert.equal(await page.locator(`[data-choice="${choiceId}"]`).getAttribute('aria-pressed'),'true');
   await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).parts.torso===id,choiceId);
   await screenshot(page,`${size}-03-workshop`);await layout(page,`${size} workshop`);
   const alternatives=page.locator('details.alternate-designs');
   if(await alternatives.count()){
    if(!await alternatives.evaluate(el=>el.open))await activate(alternatives.locator(':scope > summary'));
    const alternate=alternatives.locator('[data-choice]').first(),alternateId=await alternate.getAttribute('data-choice');
    await activate(alternate);
    assert.equal(await page.locator('details.alternate-designs').evaluate(el=>el.open),true,'Fitted alternate must remain discoverable');
    assert.equal(await page.locator(`[data-choice="${alternateId}"]`).getAttribute('aria-pressed'),'true');
    await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).parts.torso===id,alternateId);
    await layout(page,`${size} alternate frame designs`);
   }

   await activate(page.locator('#chooseChassis'));await page.locator('.chassis-picker').waitFor({state:'visible'});
   await screenshot(page,`${size}-04-chassis`);await layout(page,`${size} chassis`);
   await activate(page.locator('[data-chassis-class=medium]'));
   assert.equal(await page.locator('.chassis-card').count(),3);
   await activate(page.locator('[data-chassis-factory=vanguard]'));
   await page.waitForFunction(()=>!document.querySelector('#modal').open&&JSON.parse(localStorage.getItem('iw-active')).chassis==='vanguard');
   assert.equal(await page.locator('#testBuildTop').isEnabled(),true);
   await activate(page.locator('#saveMech'));
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('iw-builds')).length===1);

   await openItem(page,'[data-view=manual]');
   assert.equal(await page.locator('.manual-controls kbd').count()>=8,true);
   await screenshot(page,`${size}-05-controls`);await layout(page,`${size} controls`);
   if(!await page.locator('#manualImpactMode').isVisible())await activate(page.locator('details.manual-section:has(.impact-setting)>summary'));
   const mode=await page.locator('#manualImpactMode').textContent();
   await activate(page.locator('#manualImpactMode'));
   assert.notEqual(await page.locator('#manualImpactMode').textContent(),mode);
   await activate(page.locator('#closeModal'));

   // Load immediately before entering the range to check the real load-confirmation toast over combat.
   await openItem(page,'[data-view=builds]');await page.locator('[data-load="0"]').waitFor({state:'visible'});
   await activate(page.locator('[data-load="0"]'));
   await page.waitForFunction(()=>!document.querySelector('#modal').open);
   await activate(page.locator('#testBuildTop'));await openGame(page);
   await activateTouch(page);
   await layout(page,`${size} range transient notice`,[...hud,'#toast','#viewHint','#joystick']);
   await screenshot(page,`${size}-06-range`);await layout(page,`${size} range`,hud);
   if(touchPages.has(page)){
    assert.equal(await page.locator('#joystick').isVisible(),true,'Touch movement joystick must stay visible');
    assert.equal(await page.locator('#flightButton').isVisible(),true,'Touch flight control must stay visible');
    await layout(page,`${size} touch controls`,[...hud,'#joystick']);
   }
   if(await page.locator('#combatMenu').count()){
    await page.locator('#combatMenu>summary').focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.querySelector('#combatMenu').open);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#combatMenu').evaluate(el=>el.open),false);
    assert.equal(await page.locator('#combatMenu>summary').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('#combatMenu').open);
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#flightButton').evaluate(el=>el.classList.contains('engaged')),false,'Opening a menu with Space must not fly');
    assert.equal(await page.locator('#dashCd').textContent(),'READY');
    await page.keyboard.press('Escape');await page.locator('#battle').focus();
   }
   // Validate actual combat inputs through their visible cooldown state.
   await page.keyboard.press('e');await page.waitForFunction(()=>document.querySelector('#abilityButton').dataset.state!=='ready');
   await page.keyboard.press('Shift');await page.waitForFunction(()=>document.querySelector('#dashCd').textContent!=='READY');
   if(await page.locator('#combatMenu').count()){
    await activate(page.locator('#combatMenu>summary'));
    await screenshot(page,`${size}-06b-combat-menu`);
    await layout(page,`${size} combat menu`,['#gameHelp','#soundToggle','#gameReport','#exitGame']);
   }
   await openItem(page,'#soundToggle','#combatMenu');
   assert.match(await page.locator('#soundToggle').textContent(),/OFF/);
   await openItem(page,'#gameHelp','#combatMenu');assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
   await activate(page.locator('#closeModal'));await exitRange(page);

   // The campaign's visible deploy action must still start its actual authored battlefield.
   await navigate(page,'campaign');await activate(page.locator('[data-action=deploy]'));await openGame(page);
   assert.doesNotMatch(await page.locator('#objectiveMode').textContent(),/TEST BAY|COMBAT TRIAL/);
   await activateTouch(page);
   await screenshot(page,`${size}-07-mission`);await layout(page,`${size} mission`,hud);
   await layout(page,`${size} mission four-pilot layout fixture`,hud,true);
   await openItem(page,'#exitGame','#combatMenu');
   await activate(page.locator('#confirmExit'));await page.waitForFunction(()=>document.querySelector('#game').hidden);
   assert.equal(await page.locator('#campaignScreen').isVisible(),true);
   if(viewport.width===1440&&['127.0.0.1','localhost'].includes(new URL(base).hostname)){
    await page.goto(new URL('../tests/campaign-fixtures.html',base).href);await activate(page.locator('#install'));
    await page.goto(base);await activate(page.locator('#continueCampaign'));
    const refit=page.locator('details[data-disclosure=refit]');
    assert.equal(await refit.evaluate(el=>el.open),true,'Earned upgrade choices must open the refit');
    const module=await page.locator('[data-refit]').first().getAttribute('data-refit');
    await activate(page.locator(`[data-refit="${module}"]`));
    await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-campaign')).pilots.some(p=>p.modules.includes(id)),module);
    assert.equal(await refit.evaluate(el=>el.open),true,'Refit must remain open after installing an upgrade');
    await screenshot(page,`${size}-08-refit`);await layout(page,`${size} earned refit`);
   }
  }catch(error){
   console.error(`${size}: ${error.message}`);
   failures.push(`${size}: ${error.message}`);await screenshot(page,`${size}-failure`).catch(()=>{});
  }finally{await context.close();}
 }
 failures.push(...errors.map(error=>'JavaScript error: '+error));
 await writeFile(resolve(output,'report.json'),JSON.stringify({base,viewports,checks,failures},null,2)+'\n');
 assert.deepEqual(failures,[],`UI checks failed:\n${failures.join('\n')}`);
 console.log(`PASS: ${viewports.length} viewport sizes; home, campaign, workshop, chassis, controls, range and mission. Screenshots: ${output}`);
}finally{await browser?.close();server?.kill();}
