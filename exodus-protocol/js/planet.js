// Planet generation, grading, and difficulty modelling.

const Planet = (() => {

  // ---- Planet class definitions ----
  // Each defines probability ranges [min, max] for each attribute.
  const PLANET_CLASSES = {
    excellent: {
      weight: 8,
      ranges: {
        atmosphere:  [65, 95],
        gravity:     [40, 70],
        temperature: [40, 70],
        water:       [40, 80],
        resources:   [50, 90],
        biosphere:   [30, 75],
      },
    },
    habitable: {
      weight: 20,
      ranges: {
        atmosphere:  [40, 80],
        gravity:     [25, 75],
        temperature: [25, 75],
        water:       [20, 70],
        resources:   [30, 75],
        biosphere:   [10, 60],
      },
    },
    marginal: {
      weight: 28,
      ranges: {
        atmosphere:  [15, 60],
        gravity:     [10, 85],
        temperature: [10, 85],
        water:       [5, 55],
        resources:   [15, 65],
        biosphere:   [0, 40],
      },
    },
    barren: {
      weight: 25,
      ranges: {
        atmosphere:  [0, 35],
        gravity:     [0, 100],
        temperature: [0, 100],
        water:       [0, 20],
        resources:   [10, 50],
        biosphere:   [0, 10],
      },
    },
    hostile: {
      weight: 19,
      ranges: {
        atmosphere:  [0, 20],
        gravity:     [0, 100],
        temperature: [0, 15],   // or flip for extreme heat
        water:       [0, 10],
        resources:   [5, 40],
        biosphere:   [0, 30],   // hostile life still possible
      },
    },
  };

  // Atmosphere condition labels
  const ATM_LABELS = [
    [0,  10,  'None',         'No atmosphere — vacuum exposure without a suit is fatal.'],
    [10, 25,  'Trace',        'Barely a wisp of gas. Sealed habitats are mandatory.'],
    [25, 45,  'Thin',         'Breathable with filters. Crops require pressurized domes.'],
    [45, 65,  'Moderate',     'Close to Earth-standard. Mild adaptation required.'],
    [65, 85,  'Dense',        'Rich oxygen but high-pressure — some altitude sickness.'],
    [85, 100, 'Toxic',        'Corrosive compounds in the air. Suits required outside.'],
  ];

  const GRAV_LABELS = [
    [0,  15,  'Microgravity', 'Bone loss accelerates. Gravity therapy essential.'],
    [15, 35,  'Low',          'Easy on the body but structures have weak foundations.'],
    [35, 65,  'Moderate',     'Near Earth-standard. No significant penalties.'],
    [65, 85,  'High',         'Construction is laborious. Workers tire quickly.'],
    [85, 100, 'Crushing',     'Extreme physical toll. Movement AI assists needed.'],
  ];

  const TEMP_LABELS = [
    [0,  10,  'Glacial',      'Average below −60°C. Everything freezes. Heating critical.'],
    [10, 30,  'Arctic',       'Extreme cold. Heating costs dominate energy budget.'],
    [30, 70,  'Temperate',    'Comfortable range for biological activity.'],
    [70, 90,  'Scorching',    'Average above 50°C. Cooling systems essential.'],
    [90, 100, 'Inferno',      'Surface temps melt standard alloys. Specialized builds only.'],
  ];

  const WATER_LABELS = [
    [0,  10,  'Arid',         'No detectable surface water. Recycling is life or death.'],
    [10, 30,  'Scarce',       'Ice pockets only. Extraction complex.'],
    [30, 55,  'Moderate',     'Lakes and rivers. Farming viable with effort.'],
    [55, 80,  'Abundant',     'Wide oceans. Coastal settlements ideal.'],
    [80, 100, 'Oceanic',      'Mostly water. All structures need floating platforms.'],
  ];

  const RES_LABELS = [
    [0,  20,  'Depleted',     'Almost no accessible minerals. Industry will struggle.'],
    [20, 45,  'Sparse',       'Limited deposits. Every resource counts.'],
    [45, 70,  'Rich',         'Good mineral diversity. Standard construction viable.'],
    [70, 90,  'Abundant',     'Multiple rare-earth deposits. Rapid industrialization possible.'],
    [90, 100, 'Exceptional',  'Extraordinary resource density — almost too good to be true.'],
  ];

  const BIO_LABELS = [
    [0,  10,  'Sterile',      'No native life. A blank slate.'],
    [10, 30,  'Microbial',    'Simple extremophiles. Generally harmless.'],
    [30, 55,  'Sparse Flora', 'Plants and simple animals. Mixed impact on colonists.'],
    [55, 75,  'Rich Biome',   'Complex ecosystem. Could be resource or threat.'],
    [75, 100, 'Teeming',      'Life everywhere. Aggressive adaptation expected.'],
  ];

  function getLabel(value, table) {
    for (const [min, max, label, desc] of table) {
      if (value >= min && value < max) return { label, desc };
    }
    return { label: 'Unknown', desc: '' };
  }

  // ---- Random in range ----
  function randInRange([min, max]) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  // ---- Weighted random class ----
  function rollClass() {
    const total = Object.values(PLANET_CLASSES).reduce((s, c) => s + c.weight, 0);
    let roll = Math.random() * total;
    for (const [name, cls] of Object.entries(PLANET_CLASSES)) {
      roll -= cls.weight;
      if (roll <= 0) return name;
    }
    return 'marginal';
  }

  // ---- Planet name generator ----
  const PREFIXES = ['Kepler','Nova','Proxima','Tau','Sigma','Alpha','Beta','Omicron','Epsilon','Zeta','Vega','Lyra'];
  const SUFFIXES = ['Prime','Secundus','Minor','Major','VI','III','IV','VIII','IX','Novus','Ultima'];
  const MIDWORDS = ['-','b-','-','-C','Deep-','Far-'];

  function generateName() {
    const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const m = MIDWORDS[Math.floor(Math.random() * MIDWORDS.length)];
    const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    return `${p}${m}${s}`;
  }

  // ---- Generate a planet ----

  function generate() {
    const cls = rollClass();
    const ranges = PLANET_CLASSES[cls].ranges;
    const attrs = {};
    for (const [attr, range] of Object.entries(ranges)) {
      attrs[attr] = randInRange(range);
    }

    // Hostile class: flip temperature range sometimes (inferno instead of glacial)
    if (cls === 'hostile' && Math.random() > 0.5) {
      attrs.temperature = 90 + Math.floor(Math.random() * 10);
    }

    // Biosphere can also generate hostile life independently
    const hasHostileLife = attrs.biosphere > 60 && Math.random() > 0.4;

    const planet = {
      name: generateName(),
      class: cls,
      ...attrs,
      hostileLife: hasHostileLife,
      surveyed: false,
    };

    planet.grade = gradeplanet(planet);
    return planet;
  }

  // ---- Grade (A/B/C/D/F) ----

  function gradeplanet(planet) {
    // Weighted score — atmosphere and temperature most important for survival
    const weights = {
      atmosphere:  0.25,
      gravity:     0.12,
      temperature: 0.25,
      water:       0.22,
      resources:   0.10,
      biosphere:   0.06,
    };

    // Remap each attribute: extremes are bad, midrange is good
    function remap(attr, val) {
      if (attr === 'gravity' || attr === 'temperature') {
        // 50 is ideal; 0 or 100 is worst
        return 100 - Math.abs(val - 50) * 2;
      }
      if (attr === 'atmosphere') {
        // 60 is ideal; too little or too high (toxic) is bad
        if (val < 10) return 0;
        if (val > 85) return val > 90 ? 5 : 20;
        return Math.min(100, val + 10);
      }
      return val;
    }

    let score = 0;
    for (const [attr, weight] of Object.entries(weights)) {
      score += remap(attr, planet[attr]) * weight;
    }

    // Penalty for hostile life
    if (planet.hostileLife) score -= 8;

    score = Math.max(0, Math.min(100, score));

    if (score >= 75) return 'A';
    if (score >= 58) return 'B';
    if (score >= 42) return 'C';
    if (score >= 25) return 'D';
    return 'F';
  }

  // ---- Phase 2 environmental penalties per attribute ----

  function getEnvironmentalHardships(planet) {
    const hardships = [];

    if (planet.atmosphere < 30) {
      hardships.push({
        id: 'no_atmosphere',
        label: 'Hostile Atmosphere',
        desc: 'Sealed habitats required. Food and power upkeep ×1.5 until Atmospheric Processor built.',
        foodMod: 1.5, powerMod: 1.5, mitigation: 'atmospheric_processor',
      });
    } else if (planet.atmosphere > 85) {
      hardships.push({
        id: 'toxic_atmosphere',
        label: 'Toxic Atmosphere',
        desc: 'Corrosive air degrades structures. Building maintenance costs are increased.',
        maintenanceMod: 1.4, mitigation: 'filtration_array',
      });
    }

    if (planet.gravity > 80) {
      hardships.push({
        id: 'high_gravity',
        label: 'Crushing Gravity',
        desc: 'Construction costs ×1.5. Colonists suffer health penalties without Gravity Therapy.',
        buildCostMod: 1.5, healthDecay: 1, mitigation: 'gravity_therapy',
      });
    } else if (planet.gravity < 20) {
      hardships.push({
        id: 'low_gravity',
        label: 'Microgravity',
        desc: 'Bone density loss. Long-term colonist health degrades without Gravity Therapy.',
        healthDecay: 1, mitigation: 'gravity_therapy',
      });
    }

    if (planet.temperature < 20) {
      hardships.push({
        id: 'extreme_cold',
        label: 'Extreme Cold',
        desc: 'Heating consumes 20% of power production. Crops need Greenhouse tech.',
        powerDrainFlat: 20, cropMitigation: 'greenhouse_dome',
      });
    } else if (planet.temperature > 80) {
      hardships.push({
        id: 'extreme_heat',
        label: 'Extreme Heat',
        desc: 'Cooling consumes 20% of power. Structures degrade without Thermal Shielding.',
        powerDrainFlat: 20, structureDegradation: true, mitigation: 'thermal_shielding',
      });
    }

    if (planet.water < 25) {
      hardships.push({
        id: 'water_scarcity',
        label: 'Water Scarcity',
        desc: 'Colonists lose 5/turn without Water Recycler. All crop yields halved.',
        colonistDecay: 5, cropMod: 0.5, mitigation: 'water_recycler', urgent: true,
      });
    }

    if (planet.hostileLife) {
      hardships.push({
        id: 'hostile_biosphere',
        label: 'Hostile Biosphere',
        desc: 'Alien predators and pathogens. Random colonist losses without Perimeter Defense.',
        randomColonistLoss: true, mitigation: 'perimeter_defense',
      });
    }

    return hardships;
  }

  // ---- Describe a planet in narrative text ----

  function describe(planet, scanReadings) {
    const readings = scanReadings || planet;
    const atm  = getLabel(readings.atmosphere,  ATM_LABELS);
    const grav = getLabel(readings.gravity,      GRAV_LABELS);
    const temp = getLabel(readings.temperature,  TEMP_LABELS);
    const wat  = getLabel(readings.water,        WATER_LABELS);
    const res  = getLabel(readings.resources,    RES_LABELS);
    const bio  = getLabel(readings.biosphere,    BIO_LABELS);

    return {
      name: planet.name,
      class: planet.class,
      grade: planet.grade,
      attributes: {
        atmosphere:  { value: readings.atmosphere,  ...atm  },
        gravity:     { value: readings.gravity,      ...grav },
        temperature: { value: readings.temperature,  ...temp },
        water:       { value: readings.water,        ...wat  },
        resources:   { value: readings.resources,    ...res  },
        biosphere:   { value: readings.biosphere,    ...bio  },
      },
    };
  }

  return {
    generate,
    gradeplanet,
    describe,
    getEnvironmentalHardships,
    getLabel,
    ATM_LABELS, GRAV_LABELS, TEMP_LABELS, WATER_LABELS, RES_LABELS, BIO_LABELS,
  };
})();
