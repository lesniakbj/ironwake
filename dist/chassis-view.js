import{CHASSIS,CHASSIS_CLASSES,chassisFor,chassisBlueprint}from './chassis.js';
import{cleanBuild,mechStats}from './core.js?v=41';

export function chassisIcon(c){
 const index=Object.keys(CHASSIS_CLASSES).indexOf(c.size),w=12+index*3;
 const badge={sniper:'M45 17H61 M53 9V25',aerial:'M3 11L18 27 M61 11L46 27',support:'M29 25H35 M32 22V28',defense:'M22 20H42V33L32 40 22 33Z',artillery:'M19 12V3 M45 12V3',melee:'M4 22L15 39 M60 22L49 39'}[c.specialty]||'M26 24H38';
 return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M${32-w} 17H${32+w}V37L40 43H24L${32-w} 37Z M25 8H39V16H25Z M${29-w} 20H${23-w}V40H${29-w} M${35+w} 20H${41+w}V40H${35+w} M23 41H30V56H17V51H23Z M34 41H41V51H47V56H34Z ${badge}"/></svg>`;
}
export function chassisPickerMarkup(build,size='all'){
 const current=chassisFor(build),cards=Object.values(CHASSIS).filter(c=>size==='all'||c.size===size).map(c=>{
  const stats=mechStats(cleanBuild(chassisBlueprint(c.id)));
  return `<article class="chassis-card ${current.id===c.id?'selected':''}"><div class="chassis-card-title">${chassisIcon(c)}<div><small>${c.size.toUpperCase()} / ${c.role}</small><h3>${c.name}</h3></div></div><p>${c.description}</p><dl><div><dt>Armor</dt><dd>${stats.hp}</dd></div><div><dt>Boost speed</dt><dd>${Math.round(stats.speed*stats.boost)}</dd></div><div><dt>Lift / sec</dt><dd>${stats.lift}</dd></div><div><dt>Payload</dt><dd>${stats.capacity}t</dd></div></dl><p class="chassis-mounts">2 hand mounts · ${c.hardpoints.heavy} heavy-rated · 1 special · ${c.scale.toFixed(2)}× size</p><div class="chassis-card-actions"><button class="button secondary" data-chassis-fit="${c.id}">Fit chassis</button><button class="text-button" data-chassis-factory="${c.id}">Factory build ↗</button></div></article>`;
 }).join('');
 return `<div class="chassis-picker"><p class="overline">BASE CHASSIS / 15 PLATFORMS</p><h2>Choose your machine.</h2><p>Fit chassis keeps your parts, paint and weapons. Factory build loads the starting kit. Stats below describe each factory build; custom parts change the result.</p><nav aria-label="Chassis class" class="chassis-filters">${[['all','All 15'],...Object.entries(CHASSIS_CLASSES).map(([id,c])=>[id,c.name])].map(([id,label])=>`<button class="button secondary" data-chassis-class="${id}" aria-pressed="${id===size}">${label}</button>`).join('')}</nav><div class="chassis-cards">${cards}</div><p class="chassis-note">Heavy-rated weapons: railgun, Dynamo, rockets, plasma, Gatling, flame, hammer and Bulwark. A heavy-rated weapon uses one hand mount and one heavy allowance. Both hands keep independent controls.</p></div>`;
}
