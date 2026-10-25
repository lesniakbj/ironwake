import { CHASSIS, CHASSIS_CLASSES, chassisFor, chassisBlueprint } from './chassis.js';
import { CHASSIS_ART } from './chassis-art.js';
import { cleanBuild, mechStats } from './core.js?v=41';

export function chassisIcon(c) {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${CHASSIS_ART[c.id]?.icon || ''}"/></svg>`;
}
export function chassisPickerMarkup(build, size = 'all') {
  const current = chassisFor(build),
    cards = Object.values(CHASSIS)
      .filter((c) => size === 'all' || c.size === size)
      .map((c) => {
        const stats = mechStats(cleanBuild(chassisBlueprint(c.id)));
        return `<article class="chassis-card ${current.id === c.id ? 'selected' : ''}"><div class="chassis-card-title">${chassisIcon(c)}<div><small>${c.size.toUpperCase()} / ${c.role}</small><h3>${c.name}</h3></div></div><p><b>${CHASSIS_ART[c.id].name}.</b> ${CHASSIS_ART[c.id].description} ${c.description}</p><dl><div><dt>Armor</dt><dd>${stats.hp}</dd></div><div><dt>Boost speed</dt><dd>${Math.round(stats.speed * stats.boost)}</dd></div><div><dt>Lift / sec</dt><dd>${stats.lift}</dd></div><div><dt>Payload</dt><dd>${stats.capacity}t</dd></div></dl><p class="chassis-mounts">2 hand mounts · ${c.hardpoints.heavy} heavy-rated · 1 special · ${c.scale.toFixed(2)}× size</p><div class="chassis-card-actions"><button class="button secondary" data-chassis-fit="${c.id}">Fit chassis</button><button class="text-button" data-chassis-factory="${c.id}">Factory build ↗</button></div></article>`;
      })
      .join('');
  return `<div class="chassis-picker"><p class="overline">BASE CHASSIS / 15 PLATFORMS</p><h2>Choose your machine.</h2><p>Fit chassis keeps your parts, paint and weapons. Factory build loads the starting kit. Stats below describe each factory build; custom parts change the result.</p><nav aria-label="Chassis class" class="chassis-filters">${[['all', 'All 15'], ...Object.entries(CHASSIS_CLASSES).map(([id, c]) => [id, c.name])].map(([id, label]) => `<button class="button secondary" data-chassis-class="${id}" aria-pressed="${id === size}">${label}</button>`).join('')}</nav><div class="chassis-cards">${cards}</div><p class="chassis-note">Heavy-rated weapons: railgun, Dynamo, rockets, plasma, Gatling, flame, hammer and Bulwark. A heavy-rated weapon uses one hand mount and one heavy allowance. Both hands keep independent controls.</p></div>`;
}
