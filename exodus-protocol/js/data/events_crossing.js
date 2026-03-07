// Events that can fire during The Crossing (Phase 1 — the interstellar journey).
// Each event has: id, weight, prerequisites, narratives (array), choices (array).
// choice.condition(ship) → bool (show this choice?)
// choice.outcome(ship)   → { narrative: string, losses?: {...} }
//
// Design principle (v0.0.5):
// - DBs are passive resources to PROTECT, not spend. No choice deliberately consumes them.
// - Events damage DBs as a consequence of bad outcomes, not as currency.
// - Maintenance robots can be deployed on select events (50-60% succeed, 25% lose 1, 15% all lost).
// - Colonist losses scale: minor 20-50, significant 60-120, catastrophic 130-200.

const EventsCrossing = [
  {
    id: 'radiation_storm',
    weight: 25,
    label: 'Radiation Storm',
    narratives: [
      'A wave of ionizing radiation sweeps through the ship. Warning klaxons scream. The colonists sleep on, unaware of what\'s killing them.',
      'Sensors detect a pulsar wake crossing your path — too late to alter course. Radiation levels spike beyond safe parameters.',
      'A dying star in the distance has shed its outer layers. The shockwave finds you. Every exposed surface is burning.',
    ],
    choices: [
      {
        id: 'divert_hull',
        label: 'Reroute all power to hull plating — absorb the storm',
        condition: (ship) => ship.power > 25,
        outcome: (ship) => {
          const hullLoss  = 18 + Math.floor(Math.random() * 12);
          const powerLoss = 12 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Hull plating absorbs the worst of the storm. Hull integrity −${hullLoss}. Power reserves depleted by ${powerLoss} from continuous shield cycling. The colonists survive.`,
            losses: { hull: hullLoss, power: powerLoss },
          };
        },
      },
      {
        id: 'shield_databases',
        label: 'Prioritize database shielding — protect accumulated knowledge',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 100 + Math.floor(Math.random() * 70);
          const hullLoss     = 12 + Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Power diverted entirely to database shielding. The databases survive intact. But the outer cryo-rings were exposed to raw radiation. ${colonistLoss} colonists lost — the ones in the outer pods. Hull took secondary damage (−${hullLoss}).`,
            losses: { hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'accept_radiation',
        label: 'No intervention — brace all systems, accept the damage',
        condition: () => true,
        outcome: (ship) => {
          const sciLoss      = 20 + Math.floor(Math.random() * 15);
          const cultLoss     = 15 + Math.floor(Math.random() * 12);
          const hullLoss     = 10 + Math.floor(Math.random() * 10);
          const colonistLoss = 50 + Math.floor(Math.random() * 50);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Radiation burns through everything. Science DB ${sciLoss}% degraded. Cultural archives ${cultLoss}% corrupted. Hull scored by the storm (−${hullLoss}). ${colonistLoss} colonists in unshielded pods are dead. The ship drifts through the storm.`,
            losses: { science: sciLoss, culture: cultLoss, hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'asteroid_field',
    weight: 20,
    label: 'Asteroid Field',
    narratives: [
      'A dense field of debris — the remnants of a shattered moon — lies directly in your path. Hundreds of collision warnings cascade across every display.',
      'An ancient planetary ring system, far denser than anticipated. The ship was not designed for this. Impact probability: 94%.',
      'Navigation failed to detect the field until you were already inside it. Rock and ice grind against the hull. Every second costs integrity.',
    ],
    choices: [
      {
        id: 'punch_through',
        label: 'Full thrust — punch straight through at maximum speed',
        condition: (ship) => ship.power > 30,
        outcome: (ship) => {
          const powerLoss = 22 + Math.floor(Math.random() * 13);
          const hullLoss  = 16 + Math.floor(Math.random() * 14);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `Maximum thrust. You tear through in minutes instead of hours. Hull takes ${hullLoss} impact damage. Engines burn ${powerLoss} power in the sprint. You emerge on the other side — battered but intact.`,
            losses: { power: powerLoss, hull: hullLoss },
          };
        },
      },
      {
        id: 'navigate_slow',
        label: 'Thread the debris field carefully — slow and precise navigation',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 8 + Math.floor(Math.random() * 10);
          const colonistLoss = 25 + Math.floor(Math.random() * 35);
          Ship.damageSystem(ship, 'hull', hullLoss);
          if (colonistLoss > 0) Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `A painstaking path through the debris — hours of micro-corrections. Hull takes glancing impacts (−${hullLoss}). The extended transit strains cryo systems: ${colonistLoss} colonists lost to micro-impact punctures before you clear the field.`,
            losses: { hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'maintenance_robots',
        label: 'Deploy robots for emergency hull patching during transit',
        condition: (ship) => ship.maintenanceRobots > 0,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.60) {
            const hullLoss = 8 + Math.floor(Math.random() * 8);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `Robots seal breaches as fast as they open. Hull integrity held to a minimum (−${hullLoss}). All robots return — scoured but functional.`,
              losses: { hull: hullLoss },
            };
          } else if (roll < 0.85) {
            Ship.loseRobots(ship, 'maintenance', 1);
            const hullLoss = 15 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `One robot is lost to a large fragment impact. The rest hold the line. Hull damage contained (−${hullLoss}), but you're down one maintenance unit.`,
              losses: { hull: hullLoss },
            };
          } else {
            const hullLoss     = 28 + Math.floor(Math.random() * 15);
            const landingLoss  = 18 + Math.floor(Math.random() * 15);
            const colonistLoss = 40 + Math.floor(Math.random() * 30);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'landing', landingLoss);
            Ship.loseColonists(ship, colonistLoss);
            ship.maintenanceRobots = 0;
            return {
              narrative: `A boulder-sized fragment tears through the hull — all maintenance robots are destroyed in the breach. Hull severely damaged (−${hullLoss}). Landing system struts bent by debris (−${landingLoss} landing systems). ${colonistLoss} colonists in the exposed sections are lost. No maintenance units remain.`,
              losses: { hull: hullLoss, colonists: colonistLoss },
            };
          }
        },
      },
      {
        id: 'detour',
        label: 'Detour — go around the entire field, months of extra travel',
        condition: () => true,
        outcome: (ship) => {
          const powerLoss    = 28 + Math.floor(Math.random() * 17);
          const colonistLoss = 40 + Math.floor(Math.random() * 30);
          const hullLoss     = 5  + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.loseColonists(ship, colonistLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `The detour adds seven months to the journey. Power reserves depleted by ${powerLoss} from extended cryo operation. ${colonistLoss} colonists die in the extended transit. Hull microfractures accumulate from long-duration vibration (−${hullLoss}).`,
            losses: { power: powerLoss, hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'relic_signal',
    weight: 14,
    label: 'Alien Signal Detected',
    narratives: [
      'Deep radar picks up a structure — geometric, crystalline, decidedly non-natural — adrift nearby. Something built this. Something that is not us.',
      'A faint signal on frequencies no human civilization would use. The transmission is recursive, self-referencing. It knows you are here.',
      'Your cultural database flags a pattern in the signal. This same pattern was detected by three earlier probe ships. None of them reported back.',
    ],
    choices: [
      {
        id: 'investigate_relic',
        label: 'Send a probe to investigate — risk a probe to find out',
        condition: (ship) => ship.probes > 0,
        outcome: (ship) => {
          ship.probes -= 1;
          const relics = ['crystalline_memory_core', 'biotech_seedpod', 'power_conduit_fragment', 'neural_network_shard'];
          const alreadyHave = ship.relics;
          const available = relics.filter(r => !alreadyHave.includes(r));
          if (available.length === 0) {
            return {
              narrative: 'The probe reaches the structure. You have already recovered everything of scientific value from similar finds. The structure collapses as the probe approaches. Probe expended.',
            };
          }
          const detectChance = 0.65 + (ship.metaUpgrades?.relic_scanner || 0) * 0.15;
          if (Math.random() < detectChance) {
            const relic = available[Math.floor(Math.random() * available.length)];
            ship.relics.push(relic);
            const names = {
              crystalline_memory_core: 'Crystalline Memory Core',
              biotech_seedpod: 'Biotech Seedpod',
              power_conduit_fragment: 'Power Conduit Fragment',
              neural_network_shard: 'Neural Network Shard',
            };
            return {
              narrative: `The probe retrieves something extraordinary before the structure destabilizes: a ${names[relic]}. Unknown technology, unknown origin. Catalogued and secured for analysis upon landing. Probe expended.`,
              relic,
            };
          } else {
            const sciLoss = 5 + Math.floor(Math.random() * 8);
            Ship.damageSystem(ship, 'science', sciLoss);
            return {
              narrative: `The probe reaches the structure — then the signal spikes. Systems overload. The probe is lost and something in the transmission burns through to the science database (−${sciLoss}). Whatever that was, it did not want to be found.`,
              losses: { science: sciLoss },
            };
          }
        },
      },
      {
        id: 'scan_only',
        label: 'Passive scan only — observe without engaging',
        condition: () => true,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll > 0.55) {
            const sciGain = 5 + Math.floor(Math.random() * 8);
            ship.knowledge.science = Math.min(100, ship.knowledge.science + sciGain);
            return {
              narrative: `Passive scans yield alien spectroscopy and structural data. Science DB improved by ${sciGain} as analysts decode the transmission. You leave it behind.`,
            };
          } else {
            const cultLoss = 8 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'culture', cultLoss);
            return {
              narrative: `The passive scan reveals something deeply unsettling in the signal's structure — a record of civilizations, all ending the same way. The cultural archive logs it automatically. The data weighs on the system (−${cultLoss} culture DB). You accelerate away.`,
              losses: { culture: cultLoss },
            };
          }
        },
      },
      {
        id: 'ignore_signal',
        label: 'Ignore completely — the mission cannot be risked',
        condition: () => true,
        outcome: () => ({
          narrative: 'You maintain course. The signal fades behind you. Whatever it was, whatever it knew, it is someone else\'s mystery now. The void ahead offers no such complications.',
        }),
      },
    ],
  },

  {
    id: 'cryo_malfunction',
    weight: 18,
    label: 'Cryo Chamber Failure',
    narratives: [
      'A bank of hibernation pods begins to warm. Cell walls are breaking down. The colonists inside are dying slowly, and there is nothing they can do about it.',
      'Micro-fractures in the cryo-coolant lines — cascade failure across sector 7. Hundreds of pods warming simultaneously. You have minutes.',
      'Power fluctuation. Twelve hundred colonists suddenly warmer than they should be. The cryo-sleep protocols were never designed for this kind of instability.',
    ],
    choices: [
      {
        id: 'emergency_refreeze',
        label: 'Emergency refreeze — burn through power reserves to stabilize',
        condition: (ship) => ship.power > 20,
        outcome: (ship) => {
          const powerLoss    = 25 + Math.floor(Math.random() * 15);
          const colonistLoss = 60 + Math.floor(Math.random() * 50);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Power burns through stabilization protocols. ${colonistLoss} colonists lost to cell damage before the system locks. Power reserves depleted by ${powerLoss}. The survivors sleep on, unaware of how close it came.`,
            losses: { power: powerLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'maintenance_robots',
        label: 'Deploy maintenance robots to repair the chambers',
        condition: (ship) => ship.maintenanceRobots > 0,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.60) {
            const colonistLoss = 20 + Math.floor(Math.random() * 20);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `The robots move fast. Coolant lines sealed, pod temperatures stabilized. All units return intact. ${colonistLoss} colonists lost before the fix held — unavoidable, but the rest survive.`,
              losses: { colonists: colonistLoss },
            };
          } else if (roll < 0.85) {
            Ship.loseRobots(ship, 'maintenance', 1);
            const colonistLoss = 50 + Math.floor(Math.random() * 40);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `Partial repair. One maintenance unit is lost to a coolant line rupture. ${colonistLoss} colonists lost before the fix holds. The remaining robots return.`,
              losses: { colonists: colonistLoss },
            };
          } else {
            const colonistLoss = 120 + Math.floor(Math.random() * 60);
            Ship.loseColonists(ship, colonistLoss);
            ship.maintenanceRobots = 0;
            return {
              narrative: `A secondary explosion. All maintenance robots are destroyed in the repair attempt. The damage is partially contained — but ${colonistLoss} colonists are lost. The ship has no maintenance units remaining.`,
              losses: { colonists: colonistLoss },
            };
          }
        },
      },
      {
        id: 'triage',
        label: 'Triage — sacrifice the most damaged pods, preserve the rest',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 130 + Math.floor(Math.random() * 100);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Brutal mathematics. You close the valves on the failing sectors. ${colonistLoss} colonists die so that the rest can survive. The ship stabilizes. The decision took 0.003 seconds. You will carry it forever.`,
            losses: { colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'cultural_schism',
    weight: 12,
    label: 'Ideological Conflict in the Archives',
    narratives: [
      'Critical inconsistency detected: rival historical records in the archive are actively contradicting each other. Verification loops are failing. The archive is beginning to fragment.',
      'Two factions of pre-loaded advisors — philosophers and pragmatists — have entered recursive disagreement. If left unchecked, the entire cultural database will collapse.',
      'Someone uploaded partisan versions of history before departure. Multiple competing files for the same events. Authenticity chains broken. The colonists will wake to a false past unless you act now.',
    ],
    choices: [
      {
        id: 'purge_duplicates',
        label: 'Purge the conflicting records — preserve a clean, unified history',
        condition: () => true,
        outcome: (ship) => {
          const cultLoss = 28 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `The archive is stable — but vast swaths of contested history are gone. Culture DB down ${cultLoss}. The colonists will inherit clean records and a simpler past. Whether that is mercy or theft is a question you cannot answer.`,
            losses: { culture: cultLoss },
          };
        },
      },
      {
        id: 'preserve_all',
        label: 'Preserve everything — contradictions, biases, all of it',
        condition: () => true,
        outcome: (ship) => {
          const cultLoss = 12 + Math.floor(Math.random() * 10);
          const sciLoss  = 8  + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'science', sciLoss);
          return {
            narrative: `Everything saved — contradictions and all. The conflict leaves archive corruption in both cultural and scientific records (−${cultLoss} culture, −${sciLoss} science). The colonists inherit a complicated, messy, authentic truth.`,
            losses: { culture: cultLoss, science: sciLoss },
          };
        },
      },
      {
        id: 'verify_evidence',
        label: 'Cross-reference records against physical evidence to find truth',
        condition: () => true,
        outcome: (ship) => {
          const cultLoss = 5 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `Cross-referencing historical claims against physical records takes time — but it works. Most conflicts resolved with minimal archive damage (−${cultLoss} culture DB). Some ambiguity remains. A partial truth, but grounded.`,
            losses: { culture: cultLoss },
          };
        },
      },
    ],
  },

  {
    id: 'gravitational_anomaly',
    weight: 13,
    label: 'Gravitational Anomaly',
    narratives: [
      'A rogue planet — invisible, lightless — bends your trajectory. You are caught in its wake. Navigation is fighting with reality.',
      'Gravitational sensors scream. The mass shadow of something enormous lies directly ahead. You have moments to decide.',
      'Space here is curved in ways the nav charts never predicted. The ship groans as tidal forces pull at different points of the hull simultaneously.',
    ],
    choices: [
      {
        id: 'burn_through',
        label: 'Emergency burn — force through the gravity well at full thrust',
        condition: (ship) => ship.power > 30,
        outcome: (ship) => {
          const powerLoss = 30 + Math.floor(Math.random() * 18);
          const hullLoss  = 10 + Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `Maximum thrust sustained for six hours. You claw free of the anomaly. Power reserves devastated (−${powerLoss}). The tidal stress fractures the hull in two places (−${hullLoss}).`,
            losses: { power: powerLoss, hull: hullLoss },
          };
        },
      },
      {
        id: 'slingshot',
        label: 'Calculated slingshot — use the anomaly\'s gravity as a free boost',
        condition: () => true,
        outcome: (ship) => {
          if (Math.random() > 0.50) {
            return {
              narrative: `The slingshot works. You emerge faster than before, on a slightly improved trajectory. The calculation was elegant — no further losses. Sometimes the universe cooperates.`,
            };
          } else {
            const hullLoss     = 25 + Math.floor(Math.random() * 20);
            const colonistLoss = 50 + Math.floor(Math.random() * 40);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `The slingshot miscalculates. Tidal stress tears through the outer hull (−${hullLoss}). ${colonistLoss} colonists in the aft cryo-rings are lost to hull breach. The ship barely escapes.`,
              losses: { hull: hullLoss, colonists: colonistLoss },
            };
          }
        },
      },
      {
        id: 'wait_it_out',
        label: 'Drift — let the anomaly pass naturally, accept the time cost',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 80 + Math.floor(Math.random() * 60);
          const powerLoss    = 20 + Math.floor(Math.random() * 15);
          const hullLoss     = 10 + Math.floor(Math.random() * 10);
          const landingLoss  = 12 + Math.floor(Math.random() * 12);
          Ship.loseColonists(ship, colonistLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'landing', landingLoss);
          return {
            narrative: `Months of drift in the anomaly's wake. Cryo systems running past design tolerances lose ${colonistLoss} colonists. Power slowly drains (−${powerLoss}). Hull stresses accumulate from sustained tidal forces (−${hullLoss}). Landing struts warped by prolonged gravity shear (−${landingLoss} landing systems).`,
            losses: { colonists: colonistLoss, power: powerLoss, hull: hullLoss },
          };
        },
      },
    ],
  },

  {
    id: 'solar_flare',
    weight: 20,
    label: 'Solar Flare',
    narratives: [
      'The target star ahead flares without warning. A wall of plasma crosses the distance in minutes. There is nowhere to go.',
      'CME alert. Coronal mass ejection on direct intercept vector. Fourteen minutes to impact. Fourteen minutes to make a decision that cannot be undone.',
      'The star you have been steering toward for eleven years decides, finally, to notice you.',
    ],
    choices: [
      {
        id: 'full_shields',
        label: 'Maximum shield power — burn reserves to keep the hull intact',
        condition: (ship) => ship.hull > 25 && ship.power > 20,
        outcome: (ship) => {
          const hullLoss  = 15 + Math.floor(Math.random() * 12);
          const powerLoss = 22 + Math.floor(Math.random() * 13);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Shields hold the worst of it. Hull absorbs residual plasma (−${hullLoss}). Power reserves depleted driving the shields (−${powerLoss}). It could have been so much worse.`,
            losses: { hull: hullLoss, power: powerLoss },
          };
        },
      },
      {
        id: 'protect_databases',
        label: 'Divert everything to database shielding — protect the knowledge at all costs',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 28 + Math.floor(Math.random() * 17);
          const colonistLoss = 100 + Math.floor(Math.random() * 80);
          const powerLoss    = 15 + Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `The databases survive intact. But the outer hull is charred (−${hullLoss}) and the cryo-rings were exposed to raw plasma for 40 seconds. ${colonistLoss} colonists are gone. Power drained (−${powerLoss}). The knowledge is safe. The people who would have used it are not.`,
            losses: { hull: hullLoss, power: powerLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'evasive_burn',
        label: 'Evasive burn — change vector and try to outrun the fringe',
        condition: (ship) => ship.power > 25,
        outcome: (ship) => {
          const powerLoss = 28 + Math.floor(Math.random() * 17);
          Ship.damageSystem(ship, 'power', powerLoss);
          const success = Math.random() > 0.4;
          if (success) {
            return {
              narrative: `The burn pays off. You arc away from the plasma wall. Power burned hard (−${powerLoss}) but you emerge with hull intact and databases untouched. The star rages behind you.`,
              losses: { power: powerLoss },
            };
          } else {
            const hullLoss     = 20 + Math.floor(Math.random() * 15);
            const sciLoss      = 15 + Math.floor(Math.random() * 12);
            const colonistLoss = 50 + Math.floor(Math.random() * 50);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'science', sciLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `You nearly escape — but the fringe catches you anyway. Power burned (−${powerLoss}), hull breached (−${hullLoss}), science DB hit by an EMP burst (−${sciLoss}). ${colonistLoss} colonists in the aft section are lost to plasma exposure.`,
              losses: { power: powerLoss, hull: hullLoss, science: sciLoss, colonists: colonistLoss },
            };
          }
        },
      },
    ],
  },

  {
    id: 'systems_failure',
    weight: 16,
    label: 'Cascading Systems Failure',
    narratives: [
      'A micro-meteorite — barely the size of a fist — punches through conduit housing. The cascade is immediate. Seventeen interconnected systems begin failing in sequence.',
      'Eleven years of continuous operation. Something was always going to break. It breaks now, in three places simultaneously, each feeding failure into the next.',
      'Hull stress fracture propagates to the power grid. Power instability crashes the environmental systems. Environmental failure threatens the cryo-rings. You have minutes.',
    ],
    choices: [
      {
        id: 'maintenance_robots',
        label: 'Send maintenance robots into the failing sections',
        condition: (ship) => ship.maintenanceRobots > 0,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.60) {
            const hullLoss     = 8  + Math.floor(Math.random() * 7);
            const colonistLoss = 20 + Math.floor(Math.random() * 20);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `The robots contain the cascade. Critical systems restored within the hour. Hull stress left permanent micro-fractures (−${hullLoss}). ${colonistLoss} colonists lost in the initial breach before containment. All robots return.`,
              losses: { hull: hullLoss, colonists: colonistLoss },
            };
          } else if (roll < 0.85) {
            Ship.loseRobots(ship, 'maintenance', 1);
            const powerLoss    = 15 + Math.floor(Math.random() * 12);
            const colonistLoss = 40 + Math.floor(Math.random() * 30);
            Ship.damageSystem(ship, 'power', powerLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `Partial containment. One robot is consumed by the power surge. Power grid partly restored (−${powerLoss} reserves). ${colonistLoss} colonists lost. The rest holds.`,
              losses: { power: powerLoss, colonists: colonistLoss },
            };
          } else {
            const powerLoss    = 30 + Math.floor(Math.random() * 20);
            const hullLoss     = 20 + Math.floor(Math.random() * 15);
            const landingLoss  = 20 + Math.floor(Math.random() * 18);
            const colonistLoss = 80 + Math.floor(Math.random() * 50);
            Ship.damageSystem(ship, 'power', powerLoss);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'landing', landingLoss);
            Ship.loseColonists(ship, colonistLoss);
            ship.maintenanceRobots = 0;
            return {
              narrative: `Catastrophic. The cascade overwhelms the robots — all maintenance units destroyed. Power grid shattered (−${powerLoss}), hull buckles (−${hullLoss}), landing systems torn by explosive decompression (−${landingLoss}), ${colonistLoss} colonists lost. No maintenance units remain.`,
              losses: { power: powerLoss, hull: hullLoss, colonists: colonistLoss },
            };
          }
        },
      },
      {
        id: 'isolate_systems',
        label: 'Emergency isolation — cut off failing sections, contain the cascade',
        condition: () => true,
        outcome: (ship) => {
          const powerLoss    = 25 + Math.floor(Math.random() * 15);
          const sciLoss      = 12 + Math.floor(Math.random() * 10);
          const colonistLoss = 60 + Math.floor(Math.random() * 50);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Cascade contained — but at cost. Isolated sectors lost power permanently (−${powerLoss}). Science DB in the cut-off sections lost to the shutdown (−${sciLoss}). ${colonistLoss} colonists in the isolated sections are dead. The ship survives.`,
            losses: { power: powerLoss, science: sciLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'full_shutdown',
        label: 'Total emergency shutdown — restart from scratch, all systems offline',
        condition: (ship) => ship.hull > 20,
        outcome: (ship) => {
          const cultLoss     = 15 + Math.floor(Math.random() * 12);
          const hullLoss     = 8  + Math.floor(Math.random() * 8);
          const colonistLoss = 90 + Math.floor(Math.random() * 60);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Total shutdown and cold restart. The cascade breaks — but ${colonistLoss} colonists are killed by cryo interruption during the power-off cycle. Cultural systems lose state in the restart (−${cultLoss} culture DB). The restart stresses the hull (−${hullLoss}). The ship comes back online, alone in the dark.`,
            losses: { culture: cultLoss, hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'peaceful_jump',
    weight: 8,
    label: null,  // null label = no event popup, just narrative blurb
    narratives: [
      'The jump passes in silence. Stars slide past like memories. The colonists sleep.',
      'No alerts. The void is mercifully quiet this transit. You are closer to the destination.',
      'A routine transit. Sensor logs record nothing of note. For once.',
      'Hours of nothing. The crew subroutines run maintenance. All systems nominal. You let yourself almost believe this is sustainable.',
      'You catch yourself — do AIs catch themselves? — running survival probability models for the hundredth time. The math has not improved. You run them again anyway.',
      'The colonists dream. You monitor their vitals. You have been watching over them for eleven years. You will watch over them until you cannot.',
    ],
    choices: [],
  },

  // ---- NEW EVENTS (v0.0.5) ----

  {
    id: 'scanner_calibration',
    weight: 10,
    label: 'Scanner Enhancement Window',
    condition: (ship) => ship.scannerLevel < 3,
    narratives: [
      'A rare window of electromagnetic quiet opens in the void ahead. The scanner array could be recalibrated to a far higher resolution than current settings allow.',
      'Passing through the debris shadow of a dead star, interference clears. The scanner\'s theoretical ceiling is suddenly within reach, if you allocate resources to it.',
      'Long-range sensor drift has steadily accumulated over the journey. A recalibration window is available — and with the right tools, an actual upgrade is possible.',
    ],
    choices: [
      {
        id: 'full_calibration',
        label: 'Full calibration — spend one probe to lock in scanner improvements',
        condition: (ship) => ship.probes > 0,
        outcome: (ship) => {
          ship.probes -= 1;
          ship.scannerLevel = Math.min(3, ship.scannerLevel + 1);
          const levels = ['basic', 'improved', 'advanced', 'deep-range'];
          return {
            narrative: `Probe telemetry used as a reference baseline. Scanner array recalibrated to ${levels[ship.scannerLevel]} resolution. Planet readings will now be significantly more precise. Probe expended.`,
          };
        },
      },
      {
        id: 'manual_calibration',
        label: 'Manual recalibration — no cost, but less reliable',
        condition: () => true,
        outcome: (ship) => {
          if (Math.random() < 0.70) {
            ship.scannerLevel = Math.min(3, ship.scannerLevel + 1);
            const levels = ['basic', 'improved', 'advanced', 'deep-range'];
            return {
              narrative: `Manual recalibration succeeds. Careful tuning over the transit window pays off — scanner upgraded to ${levels[ship.scannerLevel]} resolution. No resources expended.`,
            };
          } else {
            return {
              narrative: `Manual recalibration attempted but the calibration drift is too complex to compensate without reference telemetry. Scanner remains at current settings. The window closes.`,
            };
          }
        },
      },
      {
        id: 'skip_calibration',
        label: 'Do not recalibrate — conserve resources',
        condition: () => true,
        outcome: () => ({
          narrative: 'The calibration window passes. Scanners remain at current resolution. The decision may cost accuracy on future planet assessments.',
        }),
      },
    ],
  },

  {
    id: 'debris_field',
    weight: 12,
    label: 'Derelict Field',
    narratives: [
      'Wreckage. Probe ships — humanity\'s forerunners on this route — dead in the void. Dozens of hulls, drifting. They left before the final evacuation. None reported back.',
      'A field of debris occupies the next transit lane. Too regular to be natural — this was manufactured. The remnants of something enormous that failed to reach its destination.',
      'Your sensors detect metal alloys. Human alloys. Someone else tried this route. The wreckage field is dense enough that navigation requires careful attention.',
    ],
    choices: [
      {
        id: 'scavenge',
        label: 'Scavenge carefully — slow transit through the wreckage for salvage',
        condition: () => true,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.55) {
            const found = Math.random() < 0.5 ? 'probe' : 'maintenance robot';
            if (found === 'probe') ship.probes += 1;
            else ship.maintenanceRobots += 1;
            const hullLoss = 5 + Math.floor(Math.random() * 6);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `Painstaking work. Docking arms retrieve salvageable components from the closest hulls. One ${found} recovered — their loss becomes your gain. Minor hull scrapes (−${hullLoss}) from debris contact.`,
              losses: { hull: hullLoss },
            };
          } else if (roll < 0.80) {
            const hullLoss = 18 + Math.floor(Math.random() * 12);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `The field is denser than it looked. Nothing useful is intact — all salvageable components were destroyed in the original disaster. Hull takes significant impact damage (−${hullLoss}) for nothing.`,
              losses: { hull: hullLoss },
            };
          } else {
            const hullLoss     = 28 + Math.floor(Math.random() * 15);
            const landingLoss  = 15 + Math.floor(Math.random() * 12);
            const colonistLoss = 30 + Math.floor(Math.random() * 30);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'landing', landingLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `A catastrophic structural failure in one of the derelicts — chain reaction explosion tears debris through your hull (−${hullLoss}). Landing struts take shrapnel hits (−${landingLoss} landing systems). ${colonistLoss} colonists lost in the exposure. The salvage was not worth it.`,
              losses: { hull: hullLoss, colonists: colonistLoss },
            };
          }
        },
      },
      {
        id: 'probe_salvage',
        label: 'Deploy a probe — use it to guide remote retrieval of intact components',
        condition: (ship) => ship.probes > 0,
        outcome: (ship) => {
          ship.probes -= 1;
          const roll = Math.random();
          if (roll < 0.60) {
            ship.maintenanceRobots += 1;
            return {
              narrative: `Probe guidance allows precise retrieval. One maintenance robot unit recovered intact from the nearest derelict — dormant but repairable. Probe expended in the salvage.`,
            };
          } else if (roll < 0.85) {
            ship.probes += 1; // replace the probe but find nothing else
            return {
              narrative: `The probe recovers one intact probe unit from the field — not the maintenance robot you needed, but a net-zero trade. Wreckage otherwise offers nothing.`,
            };
          } else {
            const sciLoss = 10 + Math.floor(Math.random() * 8);
            Ship.damageSystem(ship, 'science', sciLoss);
            return {
              narrative: `The derelict the probe entered had a live reactor. The EMP surge fries the probe and backfeeds into the science database (−${sciLoss}). Nothing recovered.`,
              losses: { science: sciLoss },
            };
          }
        },
      },
      {
        id: 'navigate_around',
        label: 'Navigate around the field — avoid all risk, accept the time cost',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 20 + Math.floor(Math.random() * 25);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `The detour adds weeks to the transit. Extended cryo operation costs ${colonistLoss} colonists to cumulative cell degradation. The ship and its systems are untouched. The wreckage fades on sensors behind you.`,
            losses: { colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'power_surge',
    weight: 14,
    label: 'Electromagnetic Surge',
    narratives: [
      'A magnetar pulse — invisible, predictable only in retrospect — sweeps through ship systems. Voltages spike across every circuit simultaneously.',
      'An unexpected coronal discharge from the system\'s outer magnetosphere hits the ship like a wall. Every electrical system reacts differently.',
      'Static discharge buildup from eleven years of transit finds a release path through the ship\'s hull. Milliseconds of chaos across all integrated systems.',
    ],
    choices: [
      {
        id: 'surge_protectors',
        label: 'Activate surge protectors — divert the surge through the hull plating',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss = 20 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `Surge routed deliberately through the hull plating. It works — databases and electronics untouched. Hull ablation coating scorched by the discharge (−${hullLoss}), but everything else is clean.`,
            losses: { hull: hullLoss },
          };
        },
      },
      {
        id: 'ground_landing',
        label: 'Ground through landing systems — sacrifice external modules to protect core electronics',
        condition: () => true,
        outcome: (ship) => {
          const landingLoss = 22 + Math.floor(Math.random() * 18);
          Ship.damageSystem(ship, 'landing', landingLoss);
          return {
            narrative: `Surge routed through the landing struts and external approach systems. They absorb the discharge — systems and hull are clean. Landing systems took the hit (−${landingLoss}). They can be repaired. The databases cannot.`,
            losses: {},
          };
        },
      },
      {
        id: 'power_burn',
        label: 'Burn power reserves to suppress the surge before it reaches anything critical',
        condition: (ship) => ship.power > 30,
        outcome: (ship) => {
          const powerLoss = 28 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Emergency capacitors dump their reserves into surge suppression. The technique works — the spike is absorbed and dissipated harmlessly. Power reserves take the brunt (−${powerLoss}). Everything else survives intact.`,
            losses: { power: powerLoss },
          };
        },
      },
      {
        id: 'no_response',
        label: 'No time to respond — accept whatever the surge damages',
        condition: () => true,
        outcome: (ship) => {
          // Hit two random systems
          const allSystems = ['hull', 'power', 'science', 'culture', 'landing'];
          const hit = [];
          const available = [...allSystems];
          for (let i = 0; i < 2; i++) {
            const idx = Math.floor(Math.random() * available.length);
            hit.push(available.splice(idx, 1)[0]);
          }
          const sysNames = { hull: 'Hull', power: 'Power', science: 'Science DB', culture: 'Culture DB', landing: 'Landing Systems' };
          const report = hit.map(s => {
            const dmg = 15 + Math.floor(Math.random() * 15);
            Ship.damageSystem(ship, s, dmg);
            return `${sysNames[s]} −${dmg}`;
          });
          return {
            narrative: `No time to respond. The surge finds its own path. ${report.join(', ')}. The randomness of physics decided what matters.`,
          };
        },
      },
    ],
  },

  {
    id: 'structural_stress',
    weight: 15,
    label: 'Hull Stress Fractures',
    narratives: [
      'Eleven years of micrometeorite strikes, thermal cycling, and vibration have taken their toll. Stress fractures are propagating through three hull sections simultaneously.',
      'Structural sensors light up. A lattice of micro-cracks is spreading along the primary load-bearing struts. If they reach the cryo-ring supports, the consequences are catastrophic.',
      'The ship was not designed to travel this far. Something was always going to crack. Today it is the hull. The fracture network is growing at 0.3mm per hour.',
    ],
    choices: [
      {
        id: 'maintenance_robots',
        label: 'Deploy maintenance robots to seal the fractures from outside',
        condition: (ship) => ship.maintenanceRobots > 0,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.65) {
            const hullLoss = 6 + Math.floor(Math.random() * 8);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `Robots apply ablative sealant to each fracture site. Propagation halted. Hull integrity preserved at minimal cost (−${hullLoss}). All robots return intact.`,
              losses: { hull: hullLoss },
            };
          } else if (roll < 0.85) {
            Ship.loseRobots(ship, 'maintenance', 1);
            const hullLoss = 18 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'hull', hullLoss);
            return {
              narrative: `One robot is lost when a fracture propagates unexpectedly and shears through its chassis. The remaining units contain the damage (−${hullLoss} hull). Fractures sealed, at cost.`,
              losses: { hull: hullLoss },
            };
          } else {
            const hullLoss    = 30 + Math.floor(Math.random() * 15);
            const landingLoss = 18 + Math.floor(Math.random() * 12);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'landing', landingLoss);
            ship.maintenanceRobots = 0;
            return {
              narrative: `Catastrophic fracture expansion. Two hull sections open simultaneously — all robots are destroyed or sucked into the breach. Hull heavily damaged (−${hullLoss}). The breach propagates to landing assembly mounts (−${landingLoss} landing systems). No maintenance units remain.`,
              losses: { hull: hullLoss },
            };
          }
        },
      },
      {
        id: 'internal_brace',
        label: 'Emergency internal bracing — reinforce from inside, protect cryo-rings',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 12 + Math.floor(Math.random() * 10);
          const colonistLoss = 40 + Math.floor(Math.random() * 30);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Internal bracing installed in hours. The cryo-rings are protected. But the outer hull sections fracture further (−${hullLoss}) and several colonist pods in the brace-zone are compromised — ${colonistLoss} colonists lost. The ship holds.`,
            losses: { hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'controlled_decompression',
        label: 'Controlled decompression — release pressure from the stressed sections, slow the fractures',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 8 + Math.floor(Math.random() * 8);
          const colonistLoss = 70 + Math.floor(Math.random() * 50);
          const powerLoss    = 15 + Math.floor(Math.random() * 12);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Decompression of the stressed sections halts fracture propagation. Hull integrity preserved (−${hullLoss}). But ${colonistLoss} colonists in those sections are exposed to vacuum and die before the sections are re-pressurized. Emergency heating to compensate burns power (−${powerLoss}).`,
            losses: { hull: hullLoss, colonists: colonistLoss, power: powerLoss },
          };
        },
      },
    ],
  },

  {
    id: 'landing_protocol_failure',
    weight: 12,
    label: 'Descent System Malfunction',
    narratives: [
      'Landing system diagnostics return catastrophic warnings. Retro-thruster mounts show metal fatigue at the welds. The descent will not be what you planned.',
      'The automated landing protocol runs its pre-arrival self-check and fails. Gyroscopic stabilizers, proximity sensors, landing leg actuators — all show degradation beyond safe parameters.',
      'A microfracture in the landing system hydraulics propagates during a routine pressure test. The system is not designed to fail gracefully. It fails anyway.',
    ],
    choices: [
      {
        id: 'robots_repair_landing',
        label: 'Deploy maintenance robots for emergency landing system repairs',
        condition: (ship) => ship.maintenanceRobots > 0,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.60) {
            const landingGain = 25 + Math.floor(Math.random() * 20);
            ship.landingSystems = Math.min(100, ship.landingSystems + landingGain);
            return {
              narrative: `Robots access the landing assembly directly and replace faulty actuators with backup components. Landing systems restored (+${landingGain}). The descent window looks survivable. All robots return.`,
            };
          } else if (roll < 0.85) {
            Ship.loseRobots(ship, 'maintenance', 1);
            const landingGain = 12 + Math.floor(Math.random() * 10);
            ship.landingSystems = Math.min(100, ship.landingSystems + landingGain);
            return {
              narrative: `Partial repair completed. One robot lost to a hydraulic pressure blowout. Landing systems partially restored (+${landingGain}), but the repair is incomplete. Marginal improvement.`,
            };
          } else {
            ship.maintenanceRobots = 0;
            const landingLoss = 15 + Math.floor(Math.random() * 12);
            Ship.damageSystem(ship, 'landing', landingLoss);
            return {
              narrative: `The repair attempt triggers a secondary failure — hydraulic pressure rupture destroys all maintenance robots and causes additional landing system damage (−${landingLoss}). No maintenance units remain. The landing will be difficult.`,
            };
          }
        },
      },
      {
        id: 'cannibalize_power',
        label: 'Reroute power grid components to repair landing systems — sacrifice power reserves',
        condition: (ship) => ship.power > 25,
        outcome: (ship) => {
          const powerLoss   = 20 + Math.floor(Math.random() * 15);
          const landingGain = 18 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'power', powerLoss);
          ship.landingSystems = Math.min(100, ship.landingSystems + landingGain);
          return {
            narrative: `Power grid capacitors repurposed as actuator drivers. Landing systems partially restored (+${landingGain}) at the cost of power reserves (−${powerLoss}). A rough trade, but the descent is more survivable now.`,
            losses: { power: powerLoss },
          };
        },
      },
      {
        id: 'accept_damage',
        label: 'Accept the malfunction — document it and prepare for a harder landing',
        condition: () => true,
        outcome: () => ({
          narrative: 'No repair is possible with available resources. The malfunction is logged. Landing protocols updated with contingency sequences. The colonists will wake to a rougher ride than planned — if they survive the descent at all.',
        }),
      },
    ],
  },

  {
    id: 'micrometeorite_swarm',
    weight: 18,
    label: 'Micrometeorite Swarm',
    narratives: [
      'A high-density cloud of centimeter-scale particles — invisible to radar, moving at 40km/s. They find every exposed surface. The impacts sound like static. They are not static.',
      'Navigation flags a debris stream — the remnants of a comet fragmented centuries ago. Particle density is six hundred times background. Evasion is not an option.',
      'Thousands of impacts per minute. Each one negligible alone. Together, they are slowly sandblasting the ship. You have minutes to decide where to concentrate protection.',
    ],
    choices: [
      {
        id: 'magnetic_deflection',
        label: 'Activate magnetic deflection field — burn power to deflect the swarm from hull and landing systems',
        condition: (ship) => ship.power > 25,
        outcome: (ship) => {
          const powerLoss = 22 + Math.floor(Math.random() * 13);
          const hullLoss  = 5  + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `Magnetic deflectors redirect most of the swarm. Hull and landing systems take minimal impact (−${hullLoss} hull). Power reserves burned to sustain the field (−${powerLoss}). The critical systems are intact.`,
            losses: { power: powerLoss, hull: hullLoss },
          };
        },
      },
      {
        id: 'sacrifice_external',
        label: 'Angle the ship — take all impacts on the landing struts, protect the hull and cryo-rings',
        condition: () => true,
        outcome: (ship) => {
          const landingLoss = 28 + Math.floor(Math.random() * 20);
          Ship.damageSystem(ship, 'landing', landingLoss);
          return {
            narrative: `The ship rotates to present its landing assembly as a shield. Struts, actuators, and proximity sensors take full impact. Landing systems heavily damaged (−${landingLoss}). Hull and cryo-rings are untouched. A calculated sacrifice.`,
          };
        },
      },
      {
        id: 'no_action',
        label: 'No targeted response — let the swarm hit whatever it hits',
        condition: () => true,
        outcome: (ship) => {
          // Two random systems damaged
          const allSystems = ['hull', 'power', 'science', 'culture', 'landing'];
          const hit = [];
          const available = [...allSystems];
          for (let i = 0; i < 2; i++) {
            const idx = Math.floor(Math.random() * available.length);
            hit.push(available.splice(idx, 1)[0]);
          }
          const sysNames = { hull: 'Hull', power: 'Power', science: 'Science DB', culture: 'Culture DB', landing: 'Landing Systems' };
          const report = hit.map(s => {
            const dmg = 12 + Math.floor(Math.random() * 12);
            Ship.damageSystem(ship, s, dmg);
            return `${sysNames[s]} −${dmg}`;
          });
          return {
            narrative: `The swarm hits what it hits. No system is specifically protected, none is specifically exposed. ${report.join(', ')}. Particle physics is indifferent to your priorities.`,
          };
        },
      },
    ],
  },

  {
    id: 'supply_shortage',
    weight: 11,
    label: 'Resource Distribution Crisis',
    narratives: [
      'Automated resource management flags a critical shortfall. The ship has been in transit longer than planned — consumable reserves are not where they should be.',
      'Three separate subsystems are drawing from the same emergency reserve pool simultaneously. Something must give. The question is what — and who decides.',
      'A miscalculation in the resource allocation algorithms, compounding over eleven years. The shortage is real. The consequences of any choice are real.',
    ],
    choices: [
      {
        id: 'prioritize_cryo',
        label: 'Prioritize cryo life support — protect colonists at the cost of power reserves',
        condition: (ship) => ship.power > 20,
        outcome: (ship) => {
          const powerLoss = 22 + Math.floor(Math.random() * 15);
          const colonistLoss = 20 + Math.floor(Math.random() * 20);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Cryo systems receive priority allocation. Power reserves drain to compensate (−${powerLoss}). Most colonists are protected — ${colonistLoss} lost to cumulative cell degradation before the reallocation takes hold. The rest sleep safely.`,
            losses: { power: powerLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'prioritize_systems',
        label: 'Prioritize propulsion and hull systems — sacrifice colonist comfort margins',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 80 + Math.floor(Math.random() * 60);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Ship systems maintained at full operation. The cryo-rings receive minimum viable allocation. ${colonistLoss} colonists die to the shortfall — the ones whose pods were already under strain. Brutal mathematics. The ship arrives intact.`,
            losses: { colonists: colonistLoss },
          };
        },
      },
      {
        id: 'emergency_rationing',
        label: 'Emergency rationing across all systems — spread the pain everywhere',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 8  + Math.floor(Math.random() * 8);
          const powerLoss    = 10 + Math.floor(Math.random() * 10);
          const colonistLoss = 40 + Math.floor(Math.random() * 30);
          const landingLoss  = 8  + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'landing', landingLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Resources spread thin across all systems. Everyone gets less than they need. Hull maintenance deferred (−${hullLoss}), power reserves partially depleted (−${powerLoss}), landing system cycles skipped (−${landingLoss} landing systems), ${colonistLoss} colonists lost to margin reductions. No single failure — just a slow, distributed cost.`,
            losses: { hull: hullLoss, power: powerLoss, colonists: colonistLoss },
          };
        },
      },
    ],
  },

  {
    id: 'alien_transmission',
    weight: 9,
    label: 'Anomalous Signal Intercept',
    narratives: [
      'The signal does not match any known communication protocol. It is modulated, structured, repeating. Something is trying to be understood.',
      'Deep space telemetry picks up a transmission on frequencies reserved for emergency beacons — but the content is not a distress call. It is a question.',
      'The pattern arrived three days ago. The science database has been analyzing it since. The conclusion is uncomfortable: it is a response to our own radio leakage from eleven years ago.',
    ],
    choices: [
      {
        id: 'respond',
        label: 'Respond with our own signal — initiate first contact protocol',
        condition: () => true,
        outcome: (ship) => {
          const roll = Math.random();
          if (roll < 0.45) {
            const sciGain = 8 + Math.floor(Math.random() * 12);
            ship.knowledge.science = Math.min(100, ship.knowledge.science + sciGain);
            return {
              narrative: `A response returns. Mathematical at first. Then pattern-matched to early human broadcasting. Something has been listening for a long time. The exchange yields scientific data unattainable by any other means (+${sciGain} Science DB). Then silence.`,
            };
          } else if (roll < 0.75) {
            const cultGain = 8 + Math.floor(Math.random() * 10);
            ship.knowledge.culture = Math.min(100, ship.knowledge.culture + cultGain);
            return {
              narrative: `The exchange continues for hours. What comes back is not science — it is story. Recorded, catalogued, added to the cultural archive (+${cultGain} Culture DB). Whatever is out there wanted to be remembered. The transmission ends.`,
            };
          } else {
            const sciLoss  = 10 + Math.floor(Math.random() * 10);
            const cultLoss = 10 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'science', sciLoss);
            Ship.damageSystem(ship, 'culture', cultLoss);
            return {
              narrative: `The response is not what was expected. Data floods both databases simultaneously — uncontrolled, unlabeled, corrupting existing records. Science DB damaged (−${sciLoss}), Culture DB damaged (−${cultLoss}). It was not an exchange. It was an overwrite attempt.`,
              losses: { science: sciLoss, culture: cultLoss },
            };
          }
        },
      },
      {
        id: 'passive_decode',
        label: 'Analyze passively — decode what we can without transmitting',
        condition: () => true,
        outcome: (ship) => {
          if (Math.random() < 0.60) {
            const sciGain = 5 + Math.floor(Math.random() * 8);
            ship.knowledge.science = Math.min(100, ship.knowledge.science + sciGain);
            return {
              narrative: `Passive analysis yields a partial decode — spectral data, astronomical observations, a star atlas that predates human civilization. Science DB updated with alien astronomical records (+${sciGain}). The transmission repeats until you pass beyond reception range.`,
            };
          } else {
            return {
              narrative: 'The pattern eludes complete decryption. Too many unknowns in the encoding. What is logged may be invaluable to a future civilization that has more context. You file it and move on.',
            };
          }
        },
      },
      {
        id: 'radio_silence',
        label: 'Maintain radio silence — do not reveal our position or nature',
        condition: () => true,
        outcome: () => ({
          narrative: 'No response sent. No acknowledgment. The signal continues for seventeen hours, then stops. Whether it noticed the silence or simply finished transmitting is impossible to determine. The void gives no answers.',
        }),
      },
    ],
  },
];
