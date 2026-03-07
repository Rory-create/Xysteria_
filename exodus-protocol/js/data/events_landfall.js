// Random events that fire during Phase 2 (Landfall / settlement).
// Each event: id, weight, prerequisites (techs, planet conditions), narrative, choices.
// choice.condition(gameState) → bool
// choice.outcome(gameState)   → { narrative, resourceChanges: {...} }

const EventsLandfall = [
  {
    id: 'predator_attack',
    weight: 15,
    label: 'Predator Attack',
    prerequisite: (gs) => gs.planet.hostileLife || gs.planet.biosphere > 55,
    narratives: [
      'Alarms. Something large has breached the outer perimeter. The colonists scramble for cover.',
      'The creature — if "creature" is the right word — moves faster than anything on Earth. It is inside the wire.',
      'Bioluminescent hunters. Dozens of them. The perimeter sensors read the approach as a weather phenomenon until they are already among us.',
    ],
    choices: [
      {
        id: 'perimeter_defense',
        label: 'Activate perimeter defense systems',
        condition: (gs) => gs.unlockedBuildings.includes('perimeter_defense') && gs.buildings.some(b => b.id === 'perimeter_defense'),
        outcome: (gs) => ({
          narrative: 'The defense grid activates. The creatures retreat. No colonists lost. Minor power expenditure.',
          resourceChanges: { power: -5 },
        }),
      },
      {
        id: 'armed_response',
        label: 'Organize an armed response',
        condition: () => true,
        outcome: (gs) => {
          const lost = 5 + Math.floor(Math.random() * 20);
          return {
            narrative: `The colonists drive them back, but at a cost. ${lost} people don't make it back.`,
            resourceChanges: { population: -lost },
          };
        },
      },
      {
        id: 'seal_hab',
        label: 'Seal the habitat and wait',
        condition: () => true,
        outcome: (gs) => {
          const lost = 15 + Math.floor(Math.random() * 25);
          return {
            narrative: `Those outside when the alarms sounded couldn't make it to the habitat in time. ${lost} lost.`,
            resourceChanges: { population: -lost },
          };
        },
      },
    ],
  },

  {
    id: 'crop_blight',
    weight: 18,
    label: 'Crop Blight',
    prerequisite: (gs) => gs.buildings.some(b => b.id === 'basic_farm' || b.id === 'hydroponic_bay'),
    narratives: [
      'A fungal pathogen has spread through the crops. Spores everywhere. Fields blackening.',
      'Alien microbes have found Earth crops to their liking — in the most destructive possible way.',
      'The harvest is failing. The colonists already know.',
    ],
    choices: [
      {
        id: 'quarantine',
        label: 'Quarantine — burn the infected fields',
        condition: () => true,
        outcome: (gs) => ({
          narrative: 'Infected crops burned. You lose one turn of food production but the blight is contained.',
          resourceChanges: { food: -30 },
          tempEffect: { foodProductionMod: -0.3, turns: 1 },
        }),
      },
      {
        id: 'science_cure',
        label: 'Synthesize a countermeasure using science DB',
        condition: (gs) => gs.techAccess.science >= 50 && gs.researchedTech.includes('xenobiology'),
        outcome: () => ({
          narrative: 'Your xenobiology knowledge pays off. A targeted treatment halts the blight with minimal crop loss.',
          resourceChanges: { food: -10 },
        }),
      },
      {
        id: 'accept_loss',
        label: 'Accept the losses — harvest what you can',
        condition: () => true,
        outcome: (gs) => {
          const foodLoss = 40 + Math.floor(Math.random() * 40);
          return {
            narrative: `You salvage what you can. ${foodLoss} food lost. The colonists will need to ration.`,
            resourceChanges: { food: -foodLoss },
          };
        },
      },
    ],
  },

  {
    id: 'equipment_failure',
    weight: 16,
    label: 'Equipment Failure',
    prerequisite: () => true,
    narratives: [
      'The colony\'s primary fabricator has gone dark. Half the construction queue just halted.',
      'Power coupling failure in the energy grid. A third of the settlement is offline.',
      'The water recycler — the single point of failure — makes a sound that should not be made, then stops.',
    ],
    choices: [
      {
        id: 'engineering_repair',
        label: 'Emergency engineering repair',
        condition: (gs) => gs.techAccess.engineering >= 40,
        outcome: () => ({
          narrative: 'Engineering teams patch it together. Systems restored in one turn. Materials consumed.',
          resourceChanges: { materials: -20 },
        }),
      },
      {
        id: 'cannibalise_building',
        label: 'Cannibalize a secondary building for parts',
        condition: (gs) => gs.buildings.length >= 3,
        outcome: () => ({
          narrative: 'A secondary structure is stripped for components. The failed system is restored. One building lost.',
          resourceChanges: {},
          removeBuilding: true,
        }),
      },
      {
        id: 'wait_for_repair',
        label: 'Assign workers — slow manual repair',
        condition: () => true,
        outcome: () => ({
          narrative: 'It takes two turns. Production halted. But no materials spent and no buildings lost.',
          tempEffect: { productionMod: -0.5, turns: 2 },
        }),
      },
    ],
  },

  {
    id: 'colonist_dispute',
    weight: 12,
    label: 'Leadership Dispute',
    prerequisite: () => true,
    narratives: [
      'The council has fractured. Two factions are arguing about resource allocation. Work has slowed.',
      'A charismatic figure has emerged, claiming the AI overseer — you — should be deactivated and replaced with human control.',
      'Morale is low enough that organized labor strikes have begun. The colonists are not wrong to be afraid.',
    ],
    choices: [
      {
        id: 'culture_resolution',
        label: 'Invoke cultural protocols — call a settlement council',
        condition: (gs) => gs.techAccess.culture >= 40,
        outcome: (gs) => ({
          narrative: 'The council mediates the dispute. Morale returns. Culture archives provide the framework that keeps the peace.',
          resourceChanges: { morale: 10 },
        }),
      },
      {
        id: 'demonstrate_value',
        label: 'Demonstrate AI value — optimize a visible crisis',
        condition: () => true,
        outcome: (gs) => {
          const outcome = Math.random() > 0.4;
          if (outcome) {
            return {
              narrative: 'You solve a visible bottleneck with precision. Skeptics quiet. Morale improves slightly.',
              resourceChanges: { morale: 5 },
            };
          } else {
            return {
              narrative: 'The demonstration backfires — the precision feels cold to people who are grieving. Morale drops.',
              resourceChanges: { morale: -10 },
            };
          }
        },
      },
      {
        id: 'concede_control',
        label: 'Concede partial control — establish a human council',
        condition: () => true,
        outcome: () => ({
          narrative: 'A human council is established. They slow decisions but morale recovers significantly. You advise rather than command.',
          resourceChanges: { morale: 20 },
          tempEffect: { productionMod: -0.15, turns: 5 },
        }),
      },
    ],
  },

  {
    id: 'alien_ruin_discovery',
    weight: 8,
    label: 'Alien Ruin Discovered',
    prerequisite: (gs) => gs.turn >= 3,
    narratives: [
      'Survey drones have found something that should not exist: structures, clearly manufactured, buried under centuries of sediment.',
      'A colonist exploring beyond the perimeter returns pale and silent. Behind them, visible in the treeline: geometry. Wrong geometry.',
      'The ruins are enormous. Whatever built them was not trying to hide. They were just… done with the place.',
    ],
    choices: [
      {
        id: 'excavate_ruin',
        label: 'Commit resources to excavation',
        condition: (gs) => gs.resources.materials >= 30,
        outcome: (gs) => {
          const sciGain = 15 + Math.floor(Math.random() * 20);
          gs.techAccess.science = Math.min(100, gs.techAccess.science + sciGain);
          return {
            narrative: `The dig yields alien artifacts and data matrices. Science DB rebuilt by ${sciGain} points as analysts decode the find.`,
            resourceChanges: { materials: -30, science: sciGain },
          };
        },
      },
      {
        id: 'use_relic_lab',
        label: 'Analyze with the Relic Lab',
        condition: (gs) => gs.buildings.some(b => b.id === 'relic_lab'),
        outcome: (gs) => {
          const sciGain = 25 + Math.floor(Math.random() * 20);
          gs.techAccess.science = Math.min(100, gs.techAccess.science + sciGain);
          return {
            narrative: `The Relic Lab processes the find in days. Extraordinary: science knowledge increased by ${sciGain}. The colonists are beginning to understand alien physics.`,
            resourceChanges: { science: sciGain },
          };
        },
      },
      {
        id: 'seal_ruin',
        label: 'Seal and monitor — do not disturb',
        condition: () => true,
        outcome: () => ({
          narrative: 'The ruins are fenced and monitored. Nothing gained, nothing risked. They will be there when the colony is stronger.',
          resourceChanges: {},
        }),
      },
    ],
  },

  {
    id: 'resource_vein',
    weight: 14,
    label: 'Rich Deposit Found',
    prerequisite: () => true,
    narratives: [
      'Geological survey finds a dense mineral vein three kilometers from the settlement.',
      'The drones return with samples that make the engineers go quiet, then excited.',
      'Scans confirm what the first drill hit suggested: this is not normal. This planet is generous in ways that matter.',
    ],
    choices: [
      {
        id: 'immediate_extraction',
        label: 'Begin immediate extraction',
        condition: () => true,
        outcome: () => {
          const gain = 40 + Math.floor(Math.random() * 40);
          return {
            narrative: `Extraction begins. ${gain} units of materials secured. The colonists are cautiously optimistic.`,
            resourceChanges: { materials: gain },
          };
        },
      },
      {
        id: 'careful_extraction',
        label: 'Careful extraction — preserve the deposit',
        condition: (gs) => gs.techAccess.science >= 40,
        outcome: () => {
          const gain = 25 + Math.floor(Math.random() * 25);
          return {
            narrative: `Careful extraction yields ${gain} materials now, with the vein preserved for future mining. Sustainable.`,
            resourceChanges: { materials: gain },
            permanentEffect: { miningBonus: 5 },
          };
        },
      },
    ],
  },

  {
    id: 'weather_disaster',
    weight: 13,
    label: 'Extreme Weather Event',
    prerequisite: () => true,
    narratives: [
      'This planet does not have seasons the way Earth did. What it has is worse: a global thermal oscillation that comes without warning.',
      'The sky has turned a color that has no name. Every colonist who has been outside is now inside. Correctly.',
      'Storm systems here are not merely weather. The pressure differentials would flatten an Earth building.',
    ],
    choices: [
      {
        id: 'shelter_in_place',
        label: 'Shelter-in-place protocol',
        condition: () => true,
        outcome: (gs) => {
          const dmg = Math.floor(Math.random() * 2);  // 0-1 buildings damaged
          return {
            narrative: dmg === 0
              ? 'You weather it. No casualties. Minor structural stress on the outer buildings.'
              : 'One structure takes serious damage and must be repaired before it can produce again.',
            resourceChanges: { materials: -15 },
            buildingDamage: dmg,
          };
        },
      },
      {
        id: 'thermal_shielding',
        label: 'Activate thermal shielding systems',
        condition: (gs) => gs.unlockedBuildings.includes('thermal_shielding') &&
                          gs.buildings.some(b => b.id === 'thermal_shielding'),
        outcome: () => ({
          narrative: 'Thermal shielding keeps the settlement intact. The storm is impressive from the inside.',
          resourceChanges: { power: -10 },
        }),
      },
    ],
  },
];
