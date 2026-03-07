// Events that can fire during The Crossing (Phase 1 — the interstellar journey).
// Each event has: id, weight, prerequisites, narratives (array), choices (array).
// choice.condition(ship) → bool (show this choice?)
// choice.outcome(ship)   → { narrative: string, losses?: {colonists?,science?,culture?,engineering?,hull?,power?} }
//
// Balance notes (starting from 100% on all systems):
// - "Safe" choices cost 15-25 points in one system
// - "Risky" choices can save one system but sacrifice another, sometimes backfiring
// - "Desperate" / last-resort choices are always available but expensive (30-60 pts)
// - Colonist losses scale: minor 30-60, significant 80-130, catastrophic 150-250

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
        id: 'shield_science',
        label: 'Prioritize database shielding — protect accumulated knowledge',
        condition: (ship) => ship.knowledge.science > 30,
        outcome: (ship) => {
          const sciLoss      = 8 + Math.floor(Math.random() * 8);
          const colonistLoss = 80 + Math.floor(Math.random() * 70);
          const hullLoss     = 10 + Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `The databases survive mostly intact (science −${sciLoss}). But the outer cryo-rings were exposed to raw radiation. ${colonistLoss} colonists lost — the ones in the outer pods. Hull took secondary damage (−${hullLoss}).`,
            losses: { science: sciLoss, hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'accept_radiation',
        label: 'No intervention — brace all systems, accept the damage',
        condition: () => true,
        outcome: (ship) => {
          const sciLoss  = 20 + Math.floor(Math.random() * 15);
          const engLoss  = 15 + Math.floor(Math.random() * 12);
          const cultLoss = 10 + Math.floor(Math.random() * 10);
          const colonistLoss = 40 + Math.floor(Math.random() * 40);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Radiation burns through everything. Science DB ${sciLoss}% degraded. Engineering ${engLoss}% corrupted. Cultural archives ${cultLoss}% lost. ${colonistLoss} colonists in unshielded pods are dead. The ship drifts through the storm.`,
            losses: { science: sciLoss, engineering: engLoss, culture: cultLoss, colonists: colonistLoss },
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
        label: 'Navigate carefully — use engineering precision to thread the gaps',
        condition: (ship) => ship.knowledge.engineering > 35,
        outcome: (ship) => {
          const engLoss = 18 + Math.floor(Math.random() * 12);
          const colonistLoss = 20 + Math.floor(Math.random() * 30);
          const hullLoss = 5 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          if (colonistLoss > 0) Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `A painstaking path through the debris. Engineering expertise strained (−${engLoss} DB). ${colonistLoss} colonists lost to micro-impact cryo punctures before you clear the field. Hull integrity down ${hullLoss} from glancing blows.`,
            losses: { engineering: engLoss, hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'detour',
        label: 'Detour — go around the entire field, months of extra travel',
        condition: () => true,
        outcome: (ship) => {
          const powerLoss = 28 + Math.floor(Math.random() * 17);
          const cultLoss  = 18 + Math.floor(Math.random() * 12);
          const colonistLoss = 30 + Math.floor(Math.random() * 30);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `The detour adds seven months to the journey. Power reserves depleted by ${powerLoss} from extended cryo operation. ${colonistLoss} colonists die in the extended transit — cryo-sleep was not designed for this duration. Morale in the archive corrupts (−${cultLoss} culture DB).`,
            losses: { power: powerLoss, culture: cultLoss, colonists: colonistLoss },
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
              narrative: `The passive scan reveals something deeply unsettling in the signal's structure — a record of civilizations, all ending the same way. The cultural archive logs it automatically. Colonist morale subroutines register the data (−${cultLoss} culture DB). You accelerate away.`,
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
          const powerLoss = 25 + Math.floor(Math.random() * 15);
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
        id: 'engineering_repair',
        label: 'Manual cryo repair — reroute the coolant lines by hand',
        condition: (ship) => ship.knowledge.engineering > 40,
        outcome: (ship) => {
          const engLoss = 22 + Math.floor(Math.random() * 15);
          const colonistLoss = 50 + Math.floor(Math.random() * 60);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `A frantic repair under lethal conditions. Engineering knowledge stripped to its limits (−${engLoss} DB) as you calculate repair sequences in seconds. ${colonistLoss} lost before the fix holds. You saved the rest.`,
            losses: { engineering: engLoss, colonists: colonistLoss },
          };
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
          const sciLoss  = 8 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'science', sciLoss);
          return {
            narrative: `Everything saved — contradictions and all. The conflict leaves archive corruption in both cultural and scientific records (−${cultLoss} culture, −${sciLoss} science). The colonists inherit a complicated, messy, authentic truth.`,
            losses: { culture: cultLoss, science: sciLoss },
          };
        },
      },
      {
        id: 'science_arbitrates',
        label: 'Use science DB to cross-reference records against physical evidence',
        condition: (ship) => ship.knowledge.science > 45,
        outcome: (ship) => {
          const sciLoss  = 20 + Math.floor(Math.random() * 12);
          const cultLoss = 8 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `Cross-referencing historical claims against physical records takes enormous computational overhead. Science DB strained (−${sciLoss}). Most conflicts resolved, some ambiguity remains (−${cultLoss} culture). A partial truth — but grounded.`,
            losses: { science: sciLoss, culture: cultLoss },
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
        condition: (ship) => ship.knowledge.engineering > 50,
        outcome: (ship) => {
          if (Math.random() > 0.45) {
            const engLoss = 8 + Math.floor(Math.random() * 8);
            Ship.damageSystem(ship, 'engineering', engLoss);
            return {
              narrative: `The slingshot works. You emerge faster than before, on a slightly improved trajectory. The calculation required straining engineering subroutines (−${engLoss} DB) but no further losses. Sometimes the universe cooperates.`,
              losses: { engineering: engLoss },
            };
          } else {
            const hullLoss  = 25 + Math.floor(Math.random() * 20);
            const engLoss   = 18 + Math.floor(Math.random() * 12);
            const colonistLoss = 40 + Math.floor(Math.random() * 40);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'engineering', engLoss);
            Ship.loseColonists(ship, colonistLoss);
            return {
              narrative: `The slingshot miscalculates. Tidal stress tears through the outer hull (−${hullLoss}). Engineering systems buckle under the load (−${engLoss}). ${colonistLoss} colonists in the aft cryo-rings are lost to hull breach. The ship barely escapes.`,
              losses: { hull: hullLoss, engineering: engLoss, colonists: colonistLoss },
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
          const cultLoss     = 20 + Math.floor(Math.random() * 15);
          const powerLoss    = 15 + Math.floor(Math.random() * 10);
          Ship.loseColonists(ship, colonistLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Months of drift in the anomaly's wake. Cryo systems running past design tolerances lose ${colonistLoss} colonists. Power slowly drains (−${powerLoss}). The extended silence and uncertainty corrupts portions of the cultural archive (−${cultLoss}).`,
            losses: { colonists: colonistLoss, culture: cultLoss, power: powerLoss },
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
            const hullLoss  = 20 + Math.floor(Math.random() * 15);
            const sciLoss   = 15 + Math.floor(Math.random() * 12);
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
        id: 'emergency_repair_power',
        label: 'Prioritize power grid — restore it first, let other systems suffer',
        condition: (ship) => ship.knowledge.engineering > 30,
        outcome: (ship) => {
          const engLoss      = 22 + Math.floor(Math.random() * 13);
          const hullLoss     = 15 + Math.floor(Math.random() * 10);
          const colonistLoss = 35 + Math.floor(Math.random() * 35);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Power restored in 4 hours. Engineering database strained to its limit (−${engLoss}). The hull fracture propagates further while you focus elsewhere (−${hullLoss}). ${colonistLoss} colonists in the affected cryo-sectors die before systems restabilize.`,
            losses: { engineering: engLoss, hull: hullLoss, colonists: colonistLoss },
          };
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
          const engLoss      = 12 + Math.floor(Math.random() * 10);
          const colonistLoss = 90 + Math.floor(Math.random() * 60);
          Ship.damageSystem(ship, 'culture', cultLoss);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Total shutdown and cold restart. The cascade breaks — but ${colonistLoss} colonists are killed by cryo interruption during the power-off cycle. Engineering and cultural systems lose state in the restart (−${engLoss} engineering, −${cultLoss} culture). The ship comes back online, alone in the dark.`,
            losses: { culture: cultLoss, engineering: engLoss, colonists: colonistLoss },
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
];
