// Events that can fire during The Crossing (Phase 1 — the interstellar journey).
// Each event has: id, weight, prerequisites, narratives (array), choices (array).
// choice.condition(ship) → bool (show this choice?)
// choice.outcome(ship)   → { narrative: string, losses?: {colonists?,science?,culture?,engineering?,hull?,power?} }

const EventsCrossing = [
  {
    id: 'radiation_storm',
    weight: 25,
    label: 'Radiation Storm',
    narratives: [
      'A wave of ionizing radiation sweeps through the ship. Warning klaxons scream. The colonists sleep on, unaware.',
      'Sensors detect a pulsar wake crossing your path — too late to alter course. Radiation levels spike.',
      'A dying star in the distance has shed its outer layers. The shockwave finds you.',
    ],
    choices: [
      {
        id: 'divert_hull',
        label: 'Reroute power to hull plating',
        condition: (ship) => ship.hull > 15,
        outcome: (ship) => {
          const hullLoss = 10 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `Hull plating absorbs the worst of it. Hull integrity reduced by ${hullLoss}. The colonists are safe.`,
            losses: { hull: hullLoss },
          };
        },
      },
      {
        id: 'shield_science',
        label: 'Protect the science database',
        condition: (ship) => ship.knowledge.science > 20,
        outcome: (ship) => {
          const sciLoss = 5 + Math.floor(Math.random() * 8);
          const colonistLoss = 20 + Math.floor(Math.random() * 30);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `The databases survive. But the outer cryo-rings were exposed. ${colonistLoss} colonists lost.`,
            losses: { science: sciLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'accept_radiation',
        label: 'No intervention — brace for impact',
        condition: () => true,
        outcome: (ship) => {
          const sciLoss  = 8 + Math.floor(Math.random() * 12);
          const engLoss  = 5 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'science', sciLoss);
          Ship.damageSystem(ship, 'engineering', engLoss);
          return {
            narrative: `Radiation burns through. Science DB degraded by ${sciLoss}. Engineering systems fried by ${engLoss}.`,
            losses: { science: sciLoss, engineering: engLoss },
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
      'A dense field of debris — the remnants of a shattered moon — lies directly in your path.',
      'Collision warnings fill the navigation display. Hundreds of impacts incoming.',
      'An ancient planetary ring system. The ship was not designed for this.',
    ],
    choices: [
      {
        id: 'punch_through',
        label: 'Full thrust — punch straight through',
        condition: (ship) => ship.power > 20,
        outcome: (ship) => {
          const powerLoss = 15 + Math.floor(Math.random() * 10);
          const hullLoss  = 8 + Math.floor(Math.random() * 12);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'hull', hullLoss);
          return {
            narrative: `You punch through in minutes. The hull takes ${hullLoss} damage. Power drained by ${powerLoss}.`,
            losses: { power: powerLoss, hull: hullLoss },
          };
        },
      },
      {
        id: 'navigate_slow',
        label: 'Navigate slowly — use engineering precision',
        condition: (ship) => ship.knowledge.engineering > 25,
        outcome: (ship) => {
          const engLoss = 8 + Math.floor(Math.random() * 10);
          const colonistLoss = Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'engineering', engLoss);
          if (colonistLoss > 0) Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `A careful path through. Engineering expertise costs ${engLoss} DB integrity. Minor cryo losses: ${colonistLoss}.`,
            losses: { engineering: engLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'detour',
        label: 'Detour around the field',
        condition: () => true,
        outcome: (ship) => {
          const powerLoss = 20 + Math.floor(Math.random() * 15);
          const cultLoss  = 5 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `The detour costs power (−${powerLoss}) and months of extra travel. Colonist morale erodes (−${cultLoss} culture DB).`,
            losses: { power: powerLoss, culture: cultLoss },
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
      'Deep radar picks up a structure — geometric, crystalline, decidedly non-natural — adrift nearby.',
      'A faint signal on frequencies no human civilization would use. Something is out here.',
      'Your cultural database flags a pattern in the signal. It has been detected before — by probes that never returned.',
    ],
    choices: [
      {
        id: 'investigate_relic',
        label: 'Investigate — send a probe',
        condition: (ship) => ship.probes > 0,
        outcome: (ship) => {
          ship.probes -= 1;
          const relics = ['crystalline_memory_core', 'biotech_seedpod', 'power_conduit_fragment', 'neural_network_shard'];
          const alreadyHave = ship.relics;
          const available = relics.filter(r => !alreadyHave.includes(r));
          if (available.length === 0) {
            return {
              narrative: 'The probe returns with fragments — but you already carry everything of value from similar finds. Probe expended.',
              losses: { probes: 1 },
            };
          }
          // Relic scanner meta bonus
          const detectChance = 0.7 + (ship.metaUpgrades?.relic_scanner || 0) * 0.2;
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
              narrative: `The probe retrieves something extraordinary: a ${names[relic]}. Unknown technology. Catalogued for analysis upon landing.`,
              relic,
            };
          } else {
            return {
              narrative: 'The probe reaches the structure but finds only fragile fragments. Nothing recoverable. Probe expended.',
              losses: { probes: 1 },
            };
          }
        },
      },
      {
        id: 'scan_only',
        label: 'Passive scan only — do not investigate',
        condition: () => true,
        outcome: (ship) => {
          const sciGain = 3 + Math.floor(Math.random() * 5);
          ship.knowledge.science = Math.min(100, ship.knowledge.science + sciGain);
          return {
            narrative: `Passive scans yield alien spectroscopy data. Science DB improved by ${sciGain} as analysts decode the signal structure.`,
          };
        },
      },
      {
        id: 'ignore_signal',
        label: 'Ignore — the mission cannot be risked',
        condition: () => true,
        outcome: () => ({
          narrative: 'You maintain course. The signal fades behind you. Whatever it was, it is someone else\'s mystery now.',
        }),
      },
    ],
  },

  {
    id: 'cryo_malfunction',
    weight: 18,
    label: 'Cryo Chamber Failure',
    narratives: [
      'A bank of hibernation pods begins to warm. The colonists inside stir toward wakefulness with nowhere to go.',
      'Micro-fractures in the cryo-coolant lines. Cell damage is beginning.',
      'Power fluctuation. Twelve hundred colonists suddenly warmer than they should be.',
    ],
    choices: [
      {
        id: 'emergency_refreeze',
        label: 'Emergency refreeze — burn power to stabilize',
        condition: (ship) => ship.power > 15,
        outcome: (ship) => {
          const powerLoss = 12 + Math.floor(Math.random() * 10);
          const colonistLoss = 5 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'power', powerLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Power burned to refreeze them. ${colonistLoss} colonists lost to warming damage before stabilization. Power −${powerLoss}.`,
            losses: { power: powerLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'engineering_repair',
        label: 'Engineering patch — manual cryo repair',
        condition: (ship) => ship.knowledge.engineering > 30,
        outcome: (ship) => {
          const engLoss = 10 + Math.floor(Math.random() * 10);
          const colonistLoss = 10 + Math.floor(Math.random() * 20);
          Ship.damageSystem(ship, 'engineering', engLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `A frantic repair job. ${colonistLoss} lost before the fix holds. Engineering DB drained by ${engLoss}.`,
            losses: { engineering: engLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'triage',
        label: 'Triage — save the most viable pods only',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 50 + Math.floor(Math.random() * 80);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Brutal mathematics. ${colonistLoss} colonists sacrificed so the rest might sleep on. The ship stabilizes.`,
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
      'Your cultural subroutines flag a critical inconsistency: rival historical records in the archive are contradicting each other.',
      'Two factions of pre-loaded advisors — philosophers and pragmatists — have entered recursive disagreement. The archive is fragmenting.',
      'Someone uploaded partisan versions of history. Multiple competing files for the same event. Authenticity verification failed.',
    ],
    choices: [
      {
        id: 'purge_duplicates',
        label: 'Purge the conflicting records — preserve consensus history',
        condition: () => true,
        outcome: (ship) => {
          const cultLoss = 15 + Math.floor(Math.random() * 10);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `Clean records, but many histories deleted. Culture DB degraded by ${cultLoss}. The colonists will have a simpler past.`,
            losses: { culture: cultLoss },
          };
        },
      },
      {
        id: 'preserve_all',
        label: 'Preserve all records — let colonists decide later',
        condition: () => true,
        outcome: (ship) => {
          const cultLoss = 5 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `Everything saved, contradictions and all. Minor archive corruption from the conflict. Culture −${cultLoss}. The colonists inherit a complicated truth.`,
            losses: { culture: cultLoss },
          };
        },
      },
      {
        id: 'science_arbitrates',
        label: 'Use science DB to cross-reference and verify',
        condition: (ship) => ship.knowledge.science > 40,
        outcome: (ship) => {
          const sciLoss = 8 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'science', sciLoss);
          return {
            narrative: `Cross-referencing historical data with physical records resolves most conflicts. Science DB strained (−${sciLoss}) but culture archive is stable.`,
            losses: { science: sciLoss },
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
      'A rogue planet — invisible, lightless — bends your trajectory. You are caught in its wake.',
      'Gravitational sensors scream. The mass shadow of something enormous lies ahead.',
      'Space here is curved. Navigation systems are fighting with reality.',
    ],
    choices: [
      {
        id: 'burn_through',
        label: 'Emergency burn — force through the gravity well',
        condition: (ship) => ship.power > 25,
        outcome: (ship) => {
          const powerLoss = 20 + Math.floor(Math.random() * 15);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Maximum thrust. You claw free of the anomaly. Power reserves depleted by ${powerLoss}.`,
            losses: { power: powerLoss },
          };
        },
      },
      {
        id: 'slingshot',
        label: 'Use the anomaly — calculated slingshot',
        condition: (ship) => ship.knowledge.engineering > 45,
        outcome: (ship) => {
          // Risky but potentially free — or dangerous
          if (Math.random() > 0.4) {
            return {
              narrative: 'The slingshot works. You emerge faster than before, on a slightly improved trajectory. No losses.',
            };
          } else {
            const hullLoss = 15 + Math.floor(Math.random() * 15);
            const engLoss  = 10 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'hull', hullLoss);
            Ship.damageSystem(ship, 'engineering', engLoss);
            return {
              narrative: `The slingshot partially fails. Hull stress: −${hullLoss}. Engineering overstrained: −${engLoss}.`,
              losses: { hull: hullLoss, engineering: engLoss },
            };
          }
        },
      },
      {
        id: 'wait_it_out',
        label: 'Drift — let the anomaly pass naturally',
        condition: () => true,
        outcome: (ship) => {
          const colonistLoss = 15 + Math.floor(Math.random() * 25);
          const cultLoss = 8 + Math.floor(Math.random() * 8);
          Ship.loseColonists(ship, colonistLoss);
          Ship.damageSystem(ship, 'culture', cultLoss);
          return {
            narrative: `Months of drift. Cryo systems under extended load lose ${colonistLoss} colonists. The long wait strains the cultural archive (−${cultLoss}).`,
            losses: { colonists: colonistLoss, culture: cultLoss },
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
      'The target star ahead flares without warning. A wall of plasma crosses the distance in minutes.',
      'CME alert. Coronal mass ejection on intercept vector. Fourteen minutes to impact.',
      'The star you have been steering toward decides to notice you.',
    ],
    choices: [
      {
        id: 'full_shields',
        label: 'Maximum shield power',
        condition: (ship) => ship.hull > 20 && ship.power > 15,
        outcome: (ship) => {
          const hullLoss  = 8 + Math.floor(Math.random() * 10);
          const powerLoss = 10 + Math.floor(Math.random() * 8);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.damageSystem(ship, 'power', powerLoss);
          return {
            narrative: `Shields hold most of it. Hull −${hullLoss}, power −${powerLoss}. Could have been worse.`,
            losses: { hull: hullLoss, power: powerLoss },
          };
        },
      },
      {
        id: 'protect_databases',
        label: 'Divert all power to database shielding',
        condition: () => true,
        outcome: (ship) => {
          const hullLoss     = 18 + Math.floor(Math.random() * 12);
          const colonistLoss = 30 + Math.floor(Math.random() * 40);
          Ship.damageSystem(ship, 'hull', hullLoss);
          Ship.loseColonists(ship, colonistLoss);
          return {
            narrative: `Databases protected at all costs. The outer hull pays for it (−${hullLoss}) and cryo exposure takes ${colonistLoss} colonists.`,
            losses: { hull: hullLoss, colonists: colonistLoss },
          };
        },
      },
      {
        id: 'evasive_burn',
        label: 'Evasive burn — change vector',
        condition: (ship) => ship.power > 20,
        outcome: (ship) => {
          const powerLoss = 18 + Math.floor(Math.random() * 12);
          Ship.damageSystem(ship, 'power', powerLoss);
          const success = Math.random() > 0.35;
          if (success) {
            return {
              narrative: `The burn pays off. You arc away from the worst of the flare. Power drained (−${powerLoss}) but minimal hull damage.`,
              losses: { power: powerLoss },
            };
          } else {
            const sciLoss = 10 + Math.floor(Math.random() * 10);
            Ship.damageSystem(ship, 'science', sciLoss);
            return {
              narrative: `You nearly escape but the fringe catches you. Power drained (−${powerLoss}) and science DB hit (−${sciLoss}).`,
              losses: { power: powerLoss, science: sciLoss },
            };
          }
        },
      },
    ],
  },

  {
    id: 'peaceful_jump',
    weight: 10,
    label: null,  // null label = no event popup, just narrative blurb
    narratives: [
      'The jump passes in silence. Stars slide past. The colonists sleep.',
      'No alerts. The void is mercifully quiet. You are closer to the destination.',
      'A routine transit. Sensor logs record nothing of note.',
      'Hours of nothing. The crew subroutines run maintenance. All systems nominal.',
      'You catch yourself — do AIs catch themselves? — running risk projections for the hundredth time. The void gives no answers.',
    ],
    choices: [],
  },
];
