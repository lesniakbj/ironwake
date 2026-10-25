import { select as $, escapeHtml as escape } from './dom.js';
import {
  WEAPONS,
  ABILITIES,
  EQUIPMENT,
  COMBAT_MOVES,
  activeItem,
  specialFor,
  combatStats,
} from '../core.js?v=41';
import { hullStatus, taskStatus, objectiveStatus, ultimateStatus } from '../hud-status.js?v=41';
import { squadStatus } from '../squad-status.js?v=41';
import { view } from '../view-controls.js?v=41';

// Read the current session on every update; controllers never cache a world snapshot.
export function createCombatHud({ readState, sortieHud, mouseLook, beforeUpdate }) {
  function updateMotionReticle(p) {
    const hands = (p.hands || [])
        .map((h, i) => ({ ...h, index: i }))
        .filter((h) => WEAPONS[h.item]?.moveRecharge),
      panel = $('#motionReticle');
    panel.hidden = !hands.length;
    if (!hands.length) return;
    const dual = hands.length === 2;
    $('#motionRightTrack').style.display = dual ? '' : 'none';
    for (let i = 0; i < 2; i++) {
      const ring = $(i ? '#motionRight' : '#motionLeft'),
        h = hands[i];
      ring.style.display = h ? '' : 'none';
      if (h) ring.style.strokeDashoffset = 100 - Math.min(100, (h.motionCharge || 0) * 100);
    }
    const ready = hands.every((h) => h.motionCharge >= 1 && h.shot <= 0);
    panel.dataset.ready = String(ready);
    $('#motionChargeText').textContent = hands
      .map(
        (h) =>
          (h.index ? 'R ' : 'L ') +
          (h.motionCharge >= 1
            ? h.shot > 0
              ? 'CYCLING'
              : 'READY'
            : Math.floor(h.motionCharge * 100) + '%'),
      )
      .join(' · ');
    $('#motionChargeHint').textContent = ready
      ? 'DYNAMO'
      : hands.some((h) => h.motionCharge < 1)
        ? 'MOVE TO RECHARGE'
        : 'RECOVERING';
    panel.setAttribute(
      'aria-label',
      hands
        .map(
          (h) =>
            (h.index ? 'Right' : 'Left') +
            ' Dynamo charge ' +
            Math.round(h.motionCharge * 100) +
            ' percent',
        )
        .join('. '),
    );
  }

  function updateHud() {
    const { world, localId } = readState();
    beforeUpdate(world);
    const p = world.players.find((p) => p.id === localId);
    if (!p) return;
    sortieHud.update(world, p);
    $('#game').classList.toggle('boosting', !!p.boosting);
    $('#flightButton').classList.toggle('engaged', !!p.airborne);
    const task = taskStatus(world, p, view.yaw);
    $('#taskBanner').hidden = !task.warning && !task.notice;
    const objectives = objectiveStatus(world, p);
    $('#objectivesPanel').classList.toggle(
      'objectives-duplicate',
      objectives.personal.trim().toLowerCase() === objectives.team.trim().toLowerCase(),
    );
    for (const [id, key] of [
      ['personalObjective', 'personal'],
      ['personalObjectiveDetail', 'personalDetail'],
      ['teamObjective', 'team'],
      ['teamObjectiveDetail', 'teamDetail'],
    ]) {
      if ($('#' + id).textContent !== objectives[key]) $('#' + id).textContent = objectives[key];
    }
    $('#objectiveMode').textContent =
      world.mission.mode === 'sandbox'
        ? 'TEST BAY'
        : world.mission.mode === 'trial'
          ? 'COMBAT TRIAL'
          : world.operation
            ? world.mission.name
            : world.siege
              ? 'PROTOTYPE 02'
              : 'MISSION';
    $('#teamProgress').hidden = objectives.progress === null;
    $('#teamProgressFill').style.width = (objectives.progress || 0) + '%';
    if ($('#levelLabel').textContent !== task.label) $('#levelLabel').textContent = task.label;
    if ($('#objectiveText').textContent !== task.detail)
      $('#objectiveText').textContent = task.detail;
    $('#taskKind').textContent = task.warning
      ? '! WARNING'
      : task.notice
        ? 'MISSION UPDATE'
        : 'TASK / ' + String(world.zoneIndex + 1).padStart(2, '0');
    $('#taskBanner').classList.toggle('warning', !!task.warning);
    $('#taskBanner').classList.toggle('heavy-arrival', !!task.heavy);
    $('#progressBar').style.width =
      (world.mission.zones.length ? (world.cleared / world.mission.zones.length) * 100 : 0) + '%';
    $('#hudName').textContent = p.build.name;
    const hull = hullStatus(p, combatStats(p).hp);
    $('#hullHealth').dataset.state = hull.state;
    $('#hullValue').textContent = hull.current + ' / ' + hull.max;
    $('#hullFill').style.width = hull.percent + '%';
    $('#hullMeter').setAttribute('aria-valuenow', String(hull.percent));
    $('#hullCondition').textContent =
      hull.state === 'offline' ? 'OFFLINE' : hull.state === 'critical' ? 'CRITICAL' : 'HULL';
    $('#game').classList.toggle('guarding', !!p.guarding);
    const selected = activeItem(p),
      special = specialFor(p),
      item = EQUIPMENT[selected];
    $('#abilityLabel').textContent = special ? ABILITIES[special].name.toUpperCase() : 'NO SPECIAL';
    for (const kind of ['dash']) {
      const remaining = p[kind + 'Cd'] || 0,
        active = p.moveKind === kind && p.moveTime > 0,
        ready = p.hp > 0 && remaining <= 0 && !(p.moveTime > 0);
      $('#' + kind + 'Cd').textContent = active
        ? 'ACTIVE'
        : remaining > 0
          ? remaining.toFixed(1) + 's'
          : p.moveTime > 0
            ? 'WAIT'
            : 'READY';
      $('#' + kind + 'Button').disabled = !ready;
      $('#' + kind + 'Button').classList.toggle('active', active);
      $('#' + kind + 'Button').setAttribute(
        'aria-label',
        COMBAT_MOVES[kind].name +
          ': ' +
          (active
            ? 'active'
            : ready
              ? 'ready'
              : remaining > 0
                ? remaining.toFixed(1) + ' seconds'
                : 'finish current move'),
      );
      $('#' + kind + 'Fill').style.width =
        Math.max(0, 100 * (1 - remaining / COMBAT_MOVES[kind].cd)) + '%';
    }
    const ultimate = ultimateStatus(p, ABILITIES[special]);
    $('#abilityCd').textContent = ultimate.counter;
    $('#abilityStatus').textContent = ultimate.detail;
    $('#abilityButton').dataset.state = ultimate.state;
    $('#abilityButton').disabled = !ultimate.ready;
    $('#abilityButton').setAttribute(
      'aria-label',
      `${ABILITIES[special]?.name || 'Ultimate'}: ${ultimate.ready ? 'ready, press E' : ultimate.detail + ', ' + ultimate.counter + ' to recharge'}`,
    );
    $('#ultimateFill').style.width = ultimate.percent + '%';
    $('#ultimateMeter').setAttribute('aria-valuenow', String(ultimate.percent));
    $('#abilityButton').classList.toggle('engaged', p.active > 0);
    for (let i = 0; i < 2; i++) {
      const hand = i ? 'right' : 'left',
        id = p.build.equipment[i],
        name = WEAPONS[id].name.split(' / ').at(-1),
        h = p.hands?.[i] || {},
        state = h.guarding
          ? 'BLOCKING'
          : id === 'guard'
            ? 'HOLD TO BLOCK'
            : h.slamDiving
              ? 'DIVING'
              : h.meleeTime > 0
                ? 'SWINGING'
                : h.railCharge > 0
                  ? 'CHARGE ' + Math.round(h.railCharge * 100) + '%'
                  : h.flame
                    ? 'FLAME ACTIVE'
                    : h.beam
                      ? 'BEAM ACTIVE'
                      : id === 'rotary' && (h.spin || 0) > 0
                        ? (h.spin || 0) >= 1
                          ? 'STABILIZED'
                          : 'SPIN ' + Math.round((h.spin || 0) * 100) + '%'
                        : id === 'dynamo' && (h.motionCharge || 0) < 1
                          ? 'MOVE ' + Math.floor((h.motionCharge || 0) * 100) + '%'
                          : h.shot > 0
                            ? id === 'rail'
                              ? 'RECOVERING'
                              : 'CYCLING'
                            : id === 'rail'
                              ? 'HOLD TO REPEAT'
                              : 'READY';
      $('#' + hand + 'HandName').textContent = name;
      $('#' + hand + 'HandState').textContent = state;
      $('#' + hand + 'HandButton').classList.toggle(
        'active',
        !!h.guarding || h.meleeTime > 0 || h.shot > 0 || h.railCharge > 0,
      );
      $(i ? '#activeEquipment' : '#diagramMelee').textContent = name;
    }
    updateMotionReticle(p);
    $('#equipmentState').textContent = 'INDEPENDENT HAND CONTROLS';
    $('#zoomState').textContent = p.build.equipment.includes('rail')
      ? 'RAIL: CLICK / HOLD'
      : 'HOLD TO USE';
    $('#crosshair').classList.toggle('hit', world.time - p.hitTime < 0.12);
    $('#viewHint').hidden =
      matchMedia('(pointer:coarse)').matches ||
      (!view.strafing && !mouseLook.paused && view.locked && world.time > 9);
    $('#viewHint').textContent = mouseLook.paused
      ? 'AIM PAUSED · Click battlefield to resume'
      : view.strafing
        ? 'STRAFE LOCK · Release Q / middle mouse to follow aim'
        : 'Mouse aims · Hold Q / middle mouse to strafe · Esc releases cursor';
    $('#damageVignette').style.opacity =
      world.mission.mode === 'trial' || world.operation
        ? Math.max(0, 1 - (world.time - (p.lastHurt ?? -10)) / 0.3) * 0.45
        : 0;
    $('#squadLinkState').textContent = world.players.length + ' / 4';
    $('#game').style.setProperty(
      '--squad-extra',
      Math.max(0, world.players.length - 1) * 14 + 'px',
    );
    const squadMarkup = squadStatus(world.players, localId)
      .filter((q) => !q.empty)
      .map(
        (q) =>
          `<div class="squad-channel ${q.downed ? 'downed' : ''}"><span>0${q.channel}</span><b>${escape(q.name)}${q.self ? ' · YOU' : ''}</b><small>${q.status}</small></div>`,
      )
      .join('');
    if ($('#squadHud').innerHTML !== squadMarkup) $('#squadHud').innerHTML = squadMarkup;
  }

  return updateHud;
}
