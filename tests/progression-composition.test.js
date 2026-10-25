import test from 'node:test';
import assert from 'node:assert/strict';
import {chassisBlueprint} from '../dist/chassis.js';
import {progressionModifiers,treeFor} from '../dist/career-progression.js';
import {campaignRound} from '../dist/mission-catalog.js';
import {newWorld,mechStats,combatStats,testPlatform,combatTrial,setInput,step,snapshot,WEAPONS} from '../dist/core.js';

const certified={
  mech:treeFor('mech','vanguard').branches.flatMap(branch=>branch.nodes.map(node=>node.id)),
  pilot:treeFor('pilot','Pilot').branches.flatMap(branch=>branch.nodes.map(node=>node.id))
};
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-7,`${message}: ${actual} should equal ${expected}`);

function campaignWorld({modules=[],upgrades=[],items=[],equipment=['blade','carbine','emp']}={}){
  const mission=campaignRound('ashgate',61);
  mission.campaign={pilots:[{name:'Pilot',modules,upgrades,items}]};
  const world=newWorld(mission,[{id:'p',name:'Pilot',build:{...chassisBlueprint('vanguard'),equipment},progression:certified}]);
  world.operation.nextWave=world.operation.nextStrike=1e9;
  world.mission.obstacles=[];
  world.mission.platforms=[];
  world.mission.ramps=[];
  world.field.nodes=[];
  world.enemies=[];
  world.spawn=[];
  Object.assign(world.players[0],{x:1000,y:1000,altitude:0,recoverUntil:0});
  return world;
}

function isolateCombat(world,mode='sandbox'){
  world.operation=null;
  world.encounter=false;
  world.mission.mode=mode;
  world.mission.raid=false;
  return world;
}

function target(player,type='target'){
  return {id:'target',type,training:true,x:player.x+80,y:player.y,altitude:0,hp:2000,max:2000,stun:0,r:12};
}

function tick(world,input={},count=1){
  for(let i=0;i<count;i++){
    setInput(world,'p',{angle:0,...input});
    step(world,.01);
  }
}

test('career hull and carried field hull initialize together and survive snapshots and emergency redeploy',()=>{
  const world=campaignWorld({upgrades:['hull'],items:['spall']});
  const player=world.players[0];
  const career=progressionModifiers(player.progression,'vanguard');
  const trainedHull=Math.round(mechStats(player.build).hp*career.hp);
  const expected=trainedHull*1.23;
  near(player.field.maxHull,trainedHull,'field baseline includes permanent training');
  near(player.hp,expected,'initial hull includes career and both field bonuses');
  near(combatStats(player).hp,expected,'effective maximum hull');
  const remote=JSON.parse(JSON.stringify(snapshot(world))).players[0];
  near(combatStats(remote).hp,expected,'remote effective hull');
  step(world,.01);
  near(player.hp,expected,'field tick preserves trained maximum');
  world.time=20;
  world.operation.wipeAt=10;
  player.hp=0;
  step(world,.01);
  near(player.hp,expected,'emergency redeploy restores both hull bonuses');
});

test('career mitigation multiplies additive field armor and the strongest active dome',()=>{
  const world=isolateCombat(campaignWorld({upgrades:['plating','plating'],items:['spall']}));
  const player=world.players[0];
  const career=progressionModifiers(player.progression,'vanguard');
  Object.assign(player,{activeAbility:'shield',active:8});
  const before=player.hp;
  world.bullets.push({id:999,enemy:true,x:player.x,y:player.y,z:30,vx:0,vy:0,vz:0,life:.2,damage:100});
  step(world,.01);
  assert.ok(career.damageReduction<1);
  near(before-player.hp,100*.6*career.damageReduction*.74*.4,'combined incoming mitigation');
});

test('permanent damage works without a sortie in sandbox and trial and composes once with field damage',()=>{
  for(const mode of ['sandbox','trial']){
    for(const hasField of [false,true]){
      const world=hasField
        ? isolateCombat(campaignWorld({modules:['power','breaker'],upgrades:['brawler']}),mode)
        : newWorld(mode==='trial'?combatTrial():testPlatform(),[{id:'p',name:'Pilot',build:chassisBlueprint('vanguard'),progression:certified}]);
      const player=world.players[0];
      const enemy=target(player,'tank');
      world.enemies=[enemy];
      const career=progressionModifiers(player.progression,'vanguard');
      tick(world,{left:true});
      tick(world,{},70);
      near(2000-enemy.hp,180*career.damage*career.heavyDamage*(hasField?1.3*1.2:1),`${mode}, field=${hasField}`);
    }
  }
});

test('safe recovery combines career training with carried recovery hardware and observes the damage delay',()=>{
  const world=campaignWorld({modules:['repair'],items:['medic']});
  const player=world.players[0];
  const career=progressionModifiers(player.progression,'vanguard');
  world.time=10;
  player.hp=50;
  player.lastHurt=9;
  step(world,.05);
  near(player.hp,50,'recent damage blocks all recovery');
  player.lastHurt=0;
  step(world,.05);
  near(player.hp,50+.05*(4+2+2+career.repair),'combined passive recovery');
});

test('phaser and field siphon share the career-plus-field hull cap without losing either repair source',()=>{
  const world=isolateCombat(campaignWorld({upgrades:['hull','siphon'],items:['spall'],equipment:['phaser','guard','emp']}));
  const player=world.players[0];
  const enemy=target(player);
  world.enemies=[enemy];
  player.hp=50;
  player.field.leechBudget=24;
  player.lastHurt=world.time;
  tick(world,{left:true,aimPoint:{x:enemy.x,y:enemy.y,z:32}});
  const damage=2000-enemy.hp;
  assert.ok(damage>0);
  near(player.hp,50+damage*(WEAPONS.phaser.leech+.015),'native and field repair both apply');
  player.hp=combatStats(player).hp-.01;
  tick(world,{left:true,aimPoint:{x:enemy.x,y:enemy.y,z:32}},20);
  near(player.hp,combatStats(player).hp,'all repair respects combined maximum');
  assert.ok(player.hp>mechStats(player.build).hp*1.23,'repair includes permanent hull training');
});
