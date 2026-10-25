// Real-browser acceptance checks for the redesigned command deck, fitting bay and cockpit.
// PLAYWRIGHT_MODULE=file:///path/to/playwright/index.mjs node scripts/check-ui-ux.mjs
// UI_UX_STATIC=1 serves only public dist assets and the campaign fixture through browser routes.
// Each viewport uses an isolated local save. Campaign fixtures are development-only.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,realpath} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,relative,isAbsolute,sep,extname} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(process.env.UI_UX_OUTPUT||resolve(root,'.artifacts/ui-ux'));
await mkdir(output,{recursive:true});
const port=process.env.UI_UX_PORT||'4296',base=process.env.UI_UX_BASE_URL||`http://127.0.0.1:${port}/ironwake/`;
const staticMode=process.env.UI_UX_STATIC==='1',staticOrigin=new URL(base).origin,publicRoot=await realpath(resolve(root,'dist')),fixtureFile=await realpath(resolve(root,'tests/campaign-fixtures.html'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
let server,browser;
const failures=[],checks=[],errors=[],touchPages=new WeakSet(),touchSessions=new WeakMap();
const viewports=[{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:844,height:390}];
const hud=['.hull-wing','#combatSlots','.mobility-wing','#objectivesPanel','#squadPanel','#vicinityPanel','#sortieHud','#combatMenu','#joystick'];
if(!staticMode&&!process.env.UI_UX_BASE_URL){
 server=spawn(process.execPath,[fileURLToPath(new URL('./preview-server.mjs',import.meta.url)),port],{cwd:root,windowsHide:true});
 await new Promise((done,reject)=>{server.stdout.once('data',done);server.once('error',reject);server.once('exit',code=>reject(Error('Preview exited: '+code)));});
}
async function serveStatic(route){
 const request=route.request(),url=new URL(request.url());
 if(url.origin!==staticOrigin||request.method()!=='GET')return route.abort('blockedbyclient');
 try{
  const path=decodeURIComponent(url.pathname);let file;
  if(path==='/tests/campaign-fixtures.html')file=fixtureFile;
  else{
   const prefix=path.startsWith('/ironwake/')?'/ironwake/':path.startsWith('/dist/')?'/dist/':null;
   if(!prefix||path.includes('\\'))return route.fulfill({status:404,body:'Not found'});
   let assetPath=path.slice(prefix.length);if(!assetPath||assetPath.endsWith('/'))assetPath+='index.html';
   file=await realpath(resolve(publicRoot,assetPath));
   const within=relative(publicRoot,file);if(within==='..'||within.startsWith('..'+sep)||isAbsolute(within))return route.fulfill({status:403,body:'Forbidden'});
  }
  const contentType=mime[extname(file).toLowerCase()];if(!contentType)return route.fulfill({status:404,body:'Not found'});
  return route.fulfill({status:200,body:await readFile(file),contentType,headers:{'Cache-Control':'no-store'}});
 }catch{return route.fulfill({status:404,body:'Not found'});}
}
async function activate(locator){return touchPages.has(locator.page())?locator.tap():locator.click();}
async function screenshot(page,name){
 await page.waitForFunction(()=>!document.querySelector('#toast')?.classList.contains('show'),null,{timeout:6000});
 const fullPage=!await page.locator('#game').isVisible()&&!await page.locator('dialog[open]').count();
 await page.screenshot({path:resolve(output,name+'.png'),fullPage});
}
async function touchMode(page){
 if(!touchPages.has(page))return;
 let session=touchSessions.get(page);if(!session){session=await page.context().newCDPSession(page);touchSessions.set(page,session);}
 await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 assert.equal(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),true,'A touch capture must use a coarse primary pointer');
}
async function openItem(page,selector,menu='#interfaceMenu'){
 const target=page.locator(menu).locator(selector);assert.equal(await target.count(),1,'Each menu command must have one explicit target: '+selector);
 if(!await target.isVisible())await activate(page.locator(menu+'>summary'));
 await activate(target);
 await page.evaluate(s=>{const e=document.querySelector(s);if(e)e.open=false;},menu);
}
async function navigate(page,destination){await activate(page.locator(destination==='campaign'?'#campaignNav':'#garageNav'));await page.waitForFunction(d=>document.body.dataset.screen===d,destination==='campaign'?'campaign':'garage');}
async function tab(page,id){await activate(page.locator('[role=tab][data-tab="'+id+'"]'));assert.equal(await page.locator('[role=tab][data-tab="'+id+'"]').getAttribute('aria-selected'),'true');}
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('iw-active')));}
async function checkLayout(page,label,selectors=[],squadFixture=false,{viewportBounds=true}={}){
 const result=await page.evaluate(({selectors,squadFixture,viewportBounds})=>{
  const squad=document.querySelector('#squadHud'),previous=squad?.innerHTML;
  if(squadFixture&&squad)squad.innerHTML=Array.from({length:4},(_,i)=>`<div class="squad-channel"><span>0${i+1}</span><b>PILOT ABC${i}${i?'':' / YOU'}</b><small>ONLINE</small></div>`).join('');
  const visible=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&Number(getComputedStyle(e).opacity)>0;
  const rects=selectors.map(selector=>({selector,e:document.querySelector(selector)})).filter(({e})=>visible(e)).map(({selector,e})=>{const r=e.getBoundingClientRect();return{selector,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};});
  const overlaps=rects.flatMap((a,i)=>rects.slice(i+1).filter(b=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>2).map(b=>a.selector+' overlaps '+b.selector));
  const offscreen=viewportBounds?rects.filter(r=>r.x< -1||r.y< -1||r.right>innerWidth+1||r.bottom>innerHeight+1).map(r=>r.selector+' is outside viewport'):[];
  const dialogs=[...document.querySelectorAll('dialog[open]')].map(e=>({id:e.id,client:e.clientWidth,scroll:e.scrollWidth}));
  const textElements=[...document.querySelectorAll('body *')].filter(e=>visible(e)&&!e.closest('[aria-hidden=true]')&&[...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())),fonts=[...new Set(textElements.map(e=>getComputedStyle(e).fontFamily))],nonArial=textElements.filter(e=>!getComputedStyle(e).fontFamily.toLowerCase().includes('arial')).map(e=>({tag:e.tagName,id:e.id,text:e.textContent.trim().slice(0,70),font:getComputedStyle(e).fontFamily})),visibleOverlines=[...document.querySelectorAll('.overline,.eyebrow')].filter(visible).map(e=>e.textContent.trim());
  if(squadFixture&&squad)squad.innerHTML=previous;
  return{width:innerWidth,height:innerHeight,coarsePointer:matchMedia('(pointer:coarse)').matches,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,squadFixture,rects,overlaps,offscreen,dialogs,fonts,nonArial,visibleOverlines};
 },{selectors,squadFixture,viewportBounds});
 checks.push({label,...result});
 if(result.documentWidth>result.width+1)failures.push(label+': horizontal page overflow');
 for(const d of result.dialogs)if(d.scroll>d.client+1)failures.push(label+': '+d.id+' has horizontal overflow');
 failures.push(...[...result.overlaps,...result.offscreen].map(x=>label+': '+x));
 if(result.nonArial.length)failures.push(label+': visible text uses another font: '+JSON.stringify(result.nonArial));
 if(result.visibleOverlines.length)failures.push(label+': redundant overline labels remain visible: '+result.visibleOverlines.join(' / '));
 return result;
}
async function openGame(page){await page.waitForFunction(()=>!document.querySelector('#game').hidden&&document.querySelector('#deploymentScreen').hidden,null,{timeout:30000});await page.evaluate(()=>{if(document.pointerLockElement)document.exitPointerLock();});await page.waitForFunction(()=>document.querySelector('#hullValue').textContent!=='—');await touchMode(page);}
async function holdHand(page,hand){
 const button=page.locator('#'+hand+'HandButton'),r=await button.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();
 await page.waitForFunction(h=>document.querySelector('#'+h+'HandState').textContent!=='READY',hand,{timeout:3000});await page.mouse.up();
}
async function menuKeyboard(page,selector){
 const summary=page.locator(selector+'>summary');await summary.focus();await page.keyboard.press('Space');await page.waitForFunction(s=>document.querySelector(s).open,selector);await page.keyboard.press('Escape');assert.equal(await page.locator(selector).evaluate(e=>e.open),false);assert.equal(await summary.evaluate(e=>e===document.activeElement),true);
}
async function coarseTargets(page,label){
 if(!touchPages.has(page))return;
 const sizes=await page.locator('#leftHandButton,#rightHandButton,#flightButton,#dashButton,#abilityButton,#combatMenu>summary').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{id:e.id||e.parentElement.id,width:r.width,height:r.height}}));
 for(const s of sizes)assert.ok(s.width>=44&&s.height>=44,label+': '+s.id+' must be at least 44px');
 checks.push({label:label+' touch target sizes',sizes});
}
try{
 browser=await chromium.launch({channel:process.env.UI_UX_BROWSER_CHANNEL||'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 for(const viewport of viewports){
  const size=viewport.width+'x'+viewport.height,coarse=viewport.width<=844,context=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:coarse,isMobile:coarse}),page=await context.newPage();
  if(staticMode)await context.route('**/*',serveStatic);
  if(coarse)touchPages.add(page);page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(size+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(size+': '+m.text());});
  try{
   console.log('Checking '+size);
   await page.goto(base);await page.waitForFunction(()=>!!document.querySelector('#feedbackDialog'));await page.locator('#startMission').waitFor({state:'visible'});
   await checkLayout(page,size+' home primary actions',['#startMission','#startGarage','#startHost','#startJoin'],false,{viewportBounds:viewport.width>=761});
   await screenshot(page,size+'-01-home');await menuKeyboard(page,'#interfaceMenu');
   await activate(page.locator('#startMission'));await page.waitForFunction(()=>document.body.dataset.screen==='campaign');
   assert.equal(await page.locator('[data-action=deploy]').isEnabled(),true);assert.equal(await page.locator('.command-tabs [role=tab]').count(),5);
   await screenshot(page,size+'-02-operations');await checkLayout(page,size+' operations');
   await activate(page.locator('[data-level="8"]'));assert.equal(await page.locator('[data-level="8"]').getAttribute('aria-pressed'),'true');await activate(page.locator('[data-action=focus]'));assert.equal(await page.locator('[data-level="0"]').getAttribute('aria-pressed'),'true');
   await tab(page,'loadout');await page.locator('#campaignMech').selectOption('preset-0');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('iw-active')).chassis==='lark');
   const special=await page.locator('#campaignSpecial option').evaluateAll(es=>es.find(e=>!e.selected).value);await page.locator('#campaignSpecial').selectOption(special);await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).equipment[2]===id,special);
   const landing=await page.locator('#campaignLanding option').evaluateAll(es=>es.find(e=>!e.selected).value);await page.locator('#campaignLanding').selectOption(landing);await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-campaign')).landing===id,landing);
   const vanguard=await page.locator('#campaignMech option').evaluateAll(es=>es.find(e=>e.textContent.startsWith('Vanguard')).value);await page.locator('#campaignMech').selectOption(vanguard);
   await screenshot(page,size+'-02b-loadout');await checkLayout(page,size+' campaign loadout');
   await tab(page,'contracts');const contract=await page.locator('[data-contract][aria-pressed=false]').first().getAttribute('data-contract');await activate(page.locator('[data-contract="'+contract+'"]'));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-campaign')).contract===id,contract);await screenshot(page,size+'-02c-contracts');await checkLayout(page,size+' contracts');
   await tab(page,'refits');await checkLayout(page,size+' empty refits');await tab(page,'report');await checkLayout(page,size+' report');
   await page.locator('[role=tab][data-tab=operations]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[role=tab][data-tab=report]').getAttribute('aria-selected'),'true');await page.waitForFunction(()=>{const r=document.querySelector('[role=tab][data-tab=report]').getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1});await page.keyboard.press('Home');assert.equal(await page.locator('[role=tab][data-tab=operations]').getAttribute('aria-selected'),'true');
   await navigate(page,'workshop');await activate(page.locator('button[data-slot=torso]'));
   const before=await saved(page),choice=page.locator('[data-choice][aria-pressed=false]').first(),choiceId=await choice.getAttribute('data-choice');await activate(choice);
   assert.deepEqual(await saved(page),before,'Component preview must not write the fitted build');assert.equal(await page.locator('#fitComponent').isEnabled(),true);
   await screenshot(page,size+'-03-workshop-preview');await checkLayout(page,size+' workshop preview');
   await activate(page.locator('#fitComponent'));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).parts.torso===id,choiceId);assert.equal(await page.locator('[data-choice="'+choiceId+'"]').getAttribute('aria-pressed'),'true');
   if(viewport.width>=1100){const heights=await page.evaluate(()=>({page:document.documentElement.scrollHeight,view:innerHeight,catalog:getComputedStyle(document.querySelector('#parts')).overflowY}));assert.ok(heights.page<=heights.view+1,'Desktop workshop must fit the viewport');assert.equal(heights.catalog,'auto','The component catalog owns its scroll');}
   await activate(page.locator('[data-socket-group=armament]'));await activate(page.locator('button[data-slot=equip1]'));await activate(page.locator('[data-filter=all]'));
   const equipmentBefore=await saved(page),weapon=page.locator('[data-choice][aria-pressed=false]').first(),weaponId=await weapon.getAttribute('data-choice');await activate(weapon);assert.deepEqual(await saved(page),equipmentBefore,'Weapon preview must not alter the saved build');await activate(page.locator('#fitComponent'));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-active')).equipment[1]===id,weaponId);
   await screenshot(page,size+'-03b-workshop-installed');await checkLayout(page,size+' workshop armament');
   await activate(page.locator('#chooseChassis'));await page.locator('.chassis-picker').waitFor({state:'visible'});await screenshot(page,size+'-04-chassis');await checkLayout(page,size+' chassis');
   await activate(page.locator('[data-chassis-class=medium]'));assert.equal(await page.locator('.chassis-card').count(),3);await activate(page.locator('[data-chassis-factory=vanguard]'));await page.waitForFunction(()=>!document.querySelector('#modal').open&&JSON.parse(localStorage.getItem('iw-active')).chassis==='vanguard');
   assert.equal(await page.locator('#testBuildTop').isEnabled(),true);await activate(page.locator('#saveMech'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('iw-builds')).length===1);
   await openItem(page,'[data-view=manual]');assert.ok(await page.locator('.manual-controls kbd').count()>=8);await screenshot(page,size+'-05-handbook');await checkLayout(page,size+' handbook');
   await page.locator('[data-help-section]').first().focus();await page.keyboard.press('End');await page.waitForFunction(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return e.matches('[data-help-section]')&&e.getAttribute('aria-selected')==='true'&&r.x>=-1&&r.right<=innerWidth+1&&r.y>=-1&&r.bottom<=innerHeight+1});await page.keyboard.press('Home');
   if(!await page.locator('#manualImpactMode').isVisible())await activate(page.locator('[data-help-section]').filter({hasText:/Motion/i}).first());
   const mode=await page.locator('#manualImpactMode').textContent();await activate(page.locator('#manualImpactMode'));assert.notEqual(await page.locator('#manualImpactMode').textContent(),mode);await activate(page.locator('#closeModal'));
   await openItem(page,'[data-view=builds]');await page.locator('[data-load="0"]').waitFor({state:'visible'});await screenshot(page,size+'-05b-saved-mechs');await activate(page.locator('[data-load="0"]'));await page.waitForFunction(()=>!document.querySelector('#modal').open);
   await activate(page.locator('#testBuildTop'));await openGame(page);await screenshot(page,size+'-06-range');await checkLayout(page,size+' range',hud);await coarseTargets(page,size);
   assert.equal(await page.locator('#squadPanel').isVisible(),false,'Solo combat hides the redundant roster');
   await activate(page.locator('#objectivesPanel>summary'));assert.equal(await page.locator('#personalObjectiveDetail').isVisible(),true);await checkLayout(page,size+' objective details',hud);await activate(page.locator('#objectivesPanel>summary'));
   await holdHand(page,'left');await holdHand(page,'right');await menuKeyboard(page,'#combatMenu');
   await page.locator('#battle').focus();await page.keyboard.press('e');await page.waitForFunction(()=>document.querySelector('#abilityButton').dataset.state!=='ready');assert.ok(Number.parseFloat(await page.locator('#abilityButton').evaluate(e=>e.style.getPropertyValue('--charge')))<100,'The radial special follows actual cooldown');
   await page.keyboard.press('Shift');await page.waitForFunction(()=>document.querySelector('#dashCd').textContent!=='READY');
   await activate(page.locator('#combatMenu>summary'));await screenshot(page,size+'-06b-combat-menu');await checkLayout(page,size+' combat menu commands',['#gameHelp','#soundToggle','#gameReport','#exitGame']);await page.keyboard.press('Escape');
   await openItem(page,'#soundToggle','#combatMenu');assert.match(await page.locator('#soundToggle').textContent(),/OFF/);await openItem(page,'#gameHelp','#combatMenu');assert.equal(await page.locator('#modal').evaluate(e=>e.open),true);await activate(page.locator('#closeModal'));
   await openItem(page,'#exitGame','#combatMenu');await page.waitForFunction(()=>document.querySelector('#game').hidden);
   await navigate(page,'campaign');await tab(page,'operations');await activate(page.locator('[data-action=deploy]'));await openGame(page);assert.doesNotMatch(await page.locator('#objectiveMode').textContent(),/TEST BAY|COMBAT TRIAL/);
   await screenshot(page,size+'-07-mission');await checkLayout(page,size+' mission',hud);await checkLayout(page,size+' mission four-pilot fixture',hud,true);await coarseTargets(page,size+' mission');
   await openItem(page,'#exitGame','#combatMenu');await activate(page.locator('#confirmExit'));await page.waitForFunction(()=>document.querySelector('#game').hidden);assert.equal(await page.locator('#campaignScreen').isVisible(),true);
   if(['127.0.0.1','localhost'].includes(new URL(base).hostname)){
    await page.goto(new URL('../tests/campaign-fixtures.html',base).href);await activate(page.locator('#install'));await page.goto(base);await activate(page.locator('#continueCampaign'));await tab(page,'refits');
    const module=await page.locator('[data-refit]').first().getAttribute('data-refit');await screenshot(page,size+'-08-refit');await activate(page.locator('[data-refit="'+module+'"]'));await page.waitForFunction(id=>JSON.parse(localStorage.getItem('iw-campaign')).pilots.some(p=>p.modules.includes(id)),module);
    assert.equal(await page.locator('[role=tab][data-tab=refits]').getAttribute('aria-selected'),'true','The refit stays selected after installation');await checkLayout(page,size+' earned refit');await tab(page,'report');await screenshot(page,size+'-09-report');await checkLayout(page,size+' after-action report');
   }
  }catch(error){console.error(size+': '+error.message);failures.push(size+': '+error.message);await screenshot(page,size+'-failure').catch(()=>{});}
  finally{await context.close();}
 }
 failures.push(...errors.map(e=>'JavaScript error: '+e));await writeFile(resolve(output,'report.json'),JSON.stringify({base,staticMode,viewports,checks,failures},null,2)+'\n');
 assert.deepEqual(failures,[],`UI checks failed:\n${failures.join('\n')}`);console.log(`PASS: ${checks.length} layout/interaction groups across ${viewports.length} viewports. Screenshots: ${output}`);
}finally{await browser?.close();server?.kill();}
