import test from 'node:test';
import assert from 'node:assert/strict';
import{CHASSIS}from '../dist/chassis.js';
import{newCareer,treeFor,unlockCareer,nodeStatus}from '../dist/career-progression.js';
import{careerMarkup}from '../dist/career-view.js';

const pilot='PILOT-ABCDEFGH',build={chassis:'vanguard'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nodeCard=(html,id)=>html.split(`data-career-node="${id}"`)[1]?.split('</li>')[0];

test('every chassis and custom frame has a browsable tree with effects, costs and prerequisite names',()=>{
 const career=newCareer(),before=JSON.stringify(career);
 for(const id of['custom',...Object.keys(CHASSIS)]){
  const tree=treeFor('mech',id),html=careerMarkup({career,build,pilot,chassisId:id});
  assert.equal((html.match(/class="career-branch"/g)||[]).length,3,id);
  assert.match(html,new RegExp(`value="${id}" selected`),id);
  assert.equal((html.match(/ selected/g)||[]).length,1,id);
  for(const branch of tree.branches){
   assert.ok(html.includes(escape(branch.name)),id);
   for(const node of branch.nodes){
    const card=nodeCard(html,node.id);assert.ok(card,node.id);
    assert.ok(card.includes(escape(node.name)),node.id);
    assert.ok(card.includes(escape(node.description)),node.id);
    assert.ok(card.includes(`${node.cost} ${node.cost===1?'point':'points'}`),node.id);
    for(const required of node.requires){
     const parent=tree.branches.flatMap(b=>b.nodes).find(n=>n.id===required);
     assert.ok(card.includes(escape(parent.name)),node.id+' shows the prerequisite by name');
    }
   }
  }
  assert.ok(html.includes(id===build.chassis?'EQUIPPED CHASSIS':'BROWSING CHASSIS'));
 }
 assert.equal(JSON.stringify(career),before,'Browsing does not spend points or modify the career');
 assert.equal(build.chassis,'vanguard','Browsing does not equip the selected chassis');
});

test('available upgrades are actionable while locked nodes explain why they cannot be bought',()=>{
 const career=newCareer(),tree=treeFor('mech',build.chassis),html=careerMarkup({career,build,pilot});
 for(const node of tree.branches.flatMap(b=>b.nodes)){
  const status=nodeStatus(career,'mech',build.chassis,node.id),card=nodeCard(html,node.id);
  const button=card.match(/<button[^>]*data-career-unlock=[^>]*>/)[0];
  assert.equal(button.includes(' disabled'),!status.available,node.id);
  if(status.available)assert.ok(card.includes('AVAILABLE'),node.id);
  else{assert.ok(card.includes('LOCKED'),node.id);assert.ok(card.includes(escape(status.reason)),node.id);}
  assert.match(button,/aria-describedby="career-reason-\d-\d"/);
 }
 assert.match(html,/data-career-reset class="career-reset" disabled/);
 assert.match(html,/Refund 0 points/);
});

test('purchased upgrades show installed state and a respec refunds the actual spent points',()=>{
 let career=newCareer();const node=treeFor('mech',build.chassis).branches[0].nodes[0];
 career=unlockCareer(career,{kind:'mech',key:build.chassis,nodeId:node.id,revision:career.revision});
 const html=careerMarkup({career,build,pilot}),card=nodeCard(html,node.id);
 assert.ok(card.includes('RESEARCHED'));assert.ok(card.includes('Installed'));
 assert.match(card,/<button[^>]* disabled>/);
 assert.doesNotMatch(html,/data-career-reset class="career-reset" disabled/);
 assert.ok(html.includes(`Refund ${node.cost} ${node.cost===1?'point':'points'}`));
 assert.match(html,/class="career-points-available"><dt>Available points<\/dt><dd>0<\/dd>/);
});

test('pilot skills carry between mechs and explain permanent and run upgrade scope',()=>{
 const career=newCareer(),html=careerMarkup({career,build,pilot,tab:'pilot'});
 assert.equal(html,careerMarkup({career,build:{chassis:'colossus'},pilot,tab:'pilot',chassisId:'needle'}));
 assert.match(html,/data-career-tab="pilot" aria-pressed="true"/);
 assert.match(html,/ACTIVE PILOT/);assert.ok(html.includes(pilot));
 assert.doesNotMatch(html,/data-career-chassis/);
 assert.match(html,/whichever mech you equip/);
 assert.match(html,/successful campaign extraction earns 1 point/);
 assert.match(html,/Campaign and in-mission rewards use their own upgrade systems/);
 assert.match(html,/survives a new campaign/);
 assert.match(html,/Respec pilot/);
});

test('dynamic pilot text is escaped and invalid browser choices fall back to the equipped chassis',()=>{
 const career=newCareer(),payload='PILOT-<script>"&\'boom</script>',html=careerMarkup({career,build,pilot:payload,tab:'pilot'});
 assert.ok(html.includes(escape(payload)));
 assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(html,/"&'boom/);
 const fallback=careerMarkup({career,build,pilot,tab:'missing',chassisId:'__proto__'});
 assert.match(fallback,/data-career-kind="mech"/);
 assert.match(fallback,/value="vanguard" selected/);
 assert.match(fallback,/EQUIPPED CHASSIS/);
 assert.match(careerMarkup({career,pilot}),/value="custom" selected/);
});
