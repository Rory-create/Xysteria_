// Planet generation, grading, and difficulty modelling.

const Planet = (() => {

  // ---- Planet class definitions ----
  // Each defines probability ranges [min, max] for each attribute.
  const PLANET_CLASSES = {
    excellent: {
      weight: 5,
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
      weight: 15,
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
      weight: 30,
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
      weight: 28,
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
      weight: 22,
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
    [85, 100, 'Crushing',     'Extreme physical toll. Exosuits and mechanical assistance required.'],
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
    [80, 100, 'Oceanic',      'Permanent land is rare. All settlements require marine foundations.'],
  ];

  const RES_LABELS = [
    [0,  20,  'Depleted',     'Almost no accessible minerals. Industry will struggle.'],
    [20, 45,  'Sparse',       'Limited deposits. Every resource counts.'],
    [45, 70,  'Rich',         'Good mineral diversity. Standard construction viable.'],
    [70, 90,  'Abundant',     'Multiple rare-earth deposits. Rapid industrialization possible.'],
    [90, 100, 'Exceptional',  'Mineral density far exceeding projections. Rapid industrialization possible.'],
  ];

  const BIO_LABELS = [
    [0,  10,  'Sterile',      'No native life. A blank slate.'],
    [10, 30,  'Microbial',    'Simple extremophiles. Generally harmless.'],
    [30, 55,  'Sparse Flora', 'Plants and simple animals. Mixed impact on colonists.'],
    [55, 75,  'Rich Biome',   'Complex ecosystem. Could be resource or threat.'],
    [75, 100, 'Teeming',      'Life everywhere. Native organisms will contest every foothold.'],
  ];

  // ---- Planet anomalies ----
  // Anomalies are special qualities hidden from initial scans.
  // Some have a visible hint (unusual readings); all are fully revealed by probe.
  // phase2Effect carries forward into the colony phase.

  const ANOMALY_POOL = [
    {
      id: 'ancient_ruins',
      label: 'Ancient Ruins',
      hint: 'Sensors detect unusually regular geometric formations on the surface.',
      desc: 'Ruins of a non-human civilization. Troves of alien knowledge and cultural data await careful excavation.',
      positive: true,
      phase2Effect: { id: 'ancient_ruins', label: 'Ancient Ruins', cultureBonus: 20, desc: 'Alien ruins boost cultural knowledge. Culture DB +20 on arrival.' },
    },
    {
      id: 'crystalline_formations',
      label: 'Crystalline Formations',
      hint: 'Anomalous mineral density readings — far beyond what the resource index suggests.',
      desc: 'Vast crystalline structures with unusual energy properties. A rare industrial windfall.',
      positive: true,
      phase2Effect: { id: 'crystalline_formations', label: 'Crystalline Formations', resourceBonus: true, desc: 'Crystalline mineral deposits significantly boost resource extraction.' },
    },
    {
      id: 'subsurface_ocean',
      label: 'Subsurface Ocean',
      hint: 'Gravitational micro-variations inconsistent with surface topology.',
      desc: 'A vast ocean lies beneath the crust. Water scarcity is far less severe than surface readings suggest.',
      positive: true,
      phase2Effect: { id: 'subsurface_ocean', label: 'Subsurface Ocean', waterMitigates: true, desc: 'Subsurface ocean accessible via drilling. Water scarcity penalties halved.' },
    },
    {
      id: 'geothermal_vents',
      label: 'Geothermal Vents',
      hint: 'Localized thermal spikes in surface temperature readings.',
      desc: 'Geothermal activity provides a natural power source. Energy requirements reduced from the start.',
      positive: true,
      phase2Effect: { id: 'geothermal_vents', label: 'Geothermal Vents', powerBonus: 15, desc: 'Geothermal taps provide free power. Starting power stockpile +15.' },
    },
    {
      id: 'magnetic_shield',
      label: 'Powerful Magnetosphere',
      hint: 'Strong EM interference degrading long-range sensor accuracy.',
      desc: 'An unusually powerful magnetosphere shields colonists from radiation and reduces hostile life spread.',
      positive: true,
      phase2Effect: { id: 'magnetic_shield', label: 'Powerful Magnetosphere', radiationShield: true, desc: 'Natural radiation shielding. Hostile biosphere penalties reduced.' },
    },
    {
      id: 'alien_ruins_dangerous',
      label: 'Dangerous Alien Artifacts',
      hint: 'Unusual electromagnetic bursts at irregular intervals from the surface.',
      desc: 'Active alien technology, poorly understood. Potentially valuable — or lethal to colonists who disturb it.',
      positive: null, // mixed
      phase2Effect: { id: 'alien_ruins_dangerous', label: 'Dangerous Alien Artifacts', mixed: true, desc: 'Alien artifacts are a double-edged opportunity. Research them or leave them alone.' },
    },
    {
      id: 'unstable_crust',
      label: 'Unstable Crust',
      hint: 'Micro-seismic readings inconsistent with the planet\'s estimated geological age.',
      desc: 'The crust is tectonically unstable. Buildings without reinforcement face periodic collapse risk.',
      positive: false,
      phase2Effect: { id: 'unstable_crust', label: 'Unstable Crust', buildingCollapse: true, desc: 'Seismic activity periodically damages structures. Engineering investment critical.' },
    },
    {
      id: 'dormant_pathogen',
      label: 'Dormant Pathogen',
      hint: 'Unusual organic compound signatures in surface atmosphere samples.',
      desc: 'A dormant alien pathogen exists in the soil. Without medical preparation, colonists face epidemic risk within months of landing.',
      positive: false,
      phase2Effect: { id: 'dormant_pathogen', label: 'Dormant Pathogen', diseaseRisk: true, desc: 'Alien pathogen will activate. Medical research required or colonist losses begin.' },
    },
    {
      id: 'seismic_activity',
      label: 'Active Seismic Zones',
      hint: 'Ground-penetrating radar shows deep stress fractures radiating from multiple epicenters.',
      desc: 'Regular seismic events will damage structures and injure colonists without engineering mitigation.',
      positive: false,
      phase2Effect: { id: 'seismic_activity', label: 'Active Seismic Zones', periodicDamage: true, desc: 'Quakes periodically damage buildings. Seismic Anchoring tech required.' },
    },
    {
      id: 'breathable_pockets',
      label: 'Breathable Atmosphere Zones',
      hint: 'Atmospheric composition varies significantly by region — some areas read far better than others.',
      desc: 'Localized zones with near-breathable air. Settlement in these zones reduces sealed habitat requirements.',
      positive: true,
      phase2Effect: { id: 'breathable_pockets', label: 'Breathable Zones', atmCostReduction: true, desc: 'Breathable pockets reduce sealed habitat costs. Building costs −15%.' },
    },
  ];

  function generateAnomalies(planet) {
    // Roll for 0–2 anomalies; excellent/habitable planets more likely to have them
    const baseChance = planet.class === 'excellent' ? 0.75 :
                       planet.class === 'habitable'  ? 0.60 :
                       planet.class === 'marginal'   ? 0.40 :
                       planet.class === 'barren'     ? 0.25 : 0.20;

    if (Math.random() > baseChance) return [];

    const maxCount = planet.class === 'excellent' || planet.class === 'habitable' ? 2 : 1;
    const count = Math.random() < 0.35 ? maxCount : 1;

    // Exclude obviously incompatible anomalies
    const pool = ANOMALY_POOL.filter(a => {
      if (a.id === 'subsurface_ocean' && planet.water > 40) return false;
      if (a.id === 'geothermal_vents' && planet.temperature < 30) return false;
      if (a.id === 'dormant_pathogen' && planet.biosphere < 5) return false;
      return true;
    });

    const chosen = [];
    const available = [...pool];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      chosen.push({ ...available[idx] });
      available.splice(idx, 1);
    }
    return chosen;
  }

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
  // Better scanners detect hospitable planets more reliably — hostile/barren worlds
  // are filtered from consideration earlier in the search.
  const SCANNER_ADJUSTMENTS = [
    {},                                                        // level 0: no change
    { excellent: 5,  habitable: 8,  barren: -5,  hostile: -8  },  // level 1
    { excellent: 10, habitable: 15, barren: -10, hostile: -15 },  // level 2
    { excellent: 15, habitable: 20, barren: -15, hostile: -18 },  // level 3
  ];

  function rollClass(scannerLevel = 0) {
    const adj = SCANNER_ADJUSTMENTS[Math.min(scannerLevel, 3)] || {};
    let total = 0;
    const weights = {};
    for (const [name, cls] of Object.entries(PLANET_CLASSES)) {
      weights[name] = Math.max(1, cls.weight + (adj[name] || 0));
      total += weights[name];
    }
    let roll = Math.random() * total;
    for (const [name, w] of Object.entries(weights)) {
      roll -= w;
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

  function generate(scannerLevel = 0) {
    const cls = rollClass(scannerLevel);
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
      anomalies: [],          // populated below
      anomaliesRevealed: false,
    };

    planet.grade = gradeplanet(planet);
    planet.anomalies = generateAnomalies(planet);
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
        colonistDecay: 12, cropMod: 0.5, mitigation: 'water_recycler', urgent: true,
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
  // noiseRange: if > 0, attributes show uncertainty ranges instead of exact values

  function describe(planet, scanReadings, noiseRange = 0) {
    const readings = scanReadings || planet;

    function buildAttr(val, table) {
      const { label, desc } = getLabel(val, table);
      const entry = { value: val, label, desc };
      if (noiseRange > 0) {
        const lo = Math.max(0, val - noiseRange);
        const hi = Math.min(100, val + noiseRange);
        entry.rangeStr = `~${lo}–${hi}`;
      }
      return entry;
    }

    return {
      name: planet.name,
      class: planet.class,
      anomalies: planet.anomalies || [],
      anomaliesRevealed: planet.anomaliesRevealed || false,
      surveyed: planet.surveyed || false,
      attributes: {
        atmosphere:  buildAttr(readings.atmosphere,  ATM_LABELS),
        gravity:     buildAttr(readings.gravity,      GRAV_LABELS),
        temperature: buildAttr(readings.temperature,  TEMP_LABELS),
        water:       buildAttr(readings.water,        WATER_LABELS),
        resources:   buildAttr(readings.resources,    RES_LABELS),
        biosphere:   buildAttr(readings.biosphere,    BIO_LABELS),
      },
    };
  }

  // ---- Vague sensor impressions for heading choice ----
  // Returns one prose sentence per attribute at low/mid/high tiers.

  const VAGUE_IMPRESSIONS = {
    atmosphere: [
      [0,  35,  'minimal atmospheric signature — hostile surface conditions likely'],
      [35, 65,  'moderate atmospheric readings — some habitability plausible'],
      [65, 100, 'dense atmospheric envelope detected'],
    ],
    gravity:    [
      [0,  30,  'low gravitational field — structural concerns anticipated'],
      [30, 65,  'gravity near standard — no anomalous pull detected'],
      [65, 100, 'elevated gravity signature — high-mass body'],
    ],
    temperature: [
      [0,  30,  'extreme cold detected — thermal profile far below survivable range'],
      [30, 70,  'temperate thermal band — surface conditions not immediately hostile'],
      [70, 100, 'intense heat signature — surface temperatures exceed standard tolerances'],
    ],
    water:      [
      [0,  25,  'negligible hydrosphere — surface appears arid'],
      [25, 60,  'moderate water signatures — liquid presence possible'],
      [60, 100, 'strong hydrosphere readings — significant liquid water indicated'],
    ],
    resources:  [
      [0,  35,  'sparse mineral density — limited extraction potential'],
      [35, 70,  'moderate resource index — standard deposit profile'],
      [70, 100, 'elevated mineral density — rich deposit signatures'],
    ],
    biosphere:  [
      [0,  20,  'no detectable biological activity'],
      [20, 60,  'faint biosignatures — minor organic presence possible'],
      [60, 100, 'strong biosignatures — active ecosystem likely'],
    ],
  };

  function getVagueImpression(attr, value) {
    const tiers = VAGUE_IMPRESSIONS[attr];
    if (!tiers) return '';
    for (const [min, max, text] of tiers) {
      if (value >= min && value < max) return text;
    }
    return tiers[tiers.length - 1][2];
  }

  function peekPlanet(scannerLevel = 0, flags = {}) {
    const candidate = generate(scannerLevel);

    // Scanner damaged: one random heading is blinded
    if (flags.scannerDamaged && Math.random() < 0.5) {
      return { candidate, impressions: [], blocked: true };
    }

    // Scanner level 0–1: 1 impression; 2+: 2 impressions
    const attrPool = ['water', 'temperature', 'atmosphere', 'resources', 'biosphere', 'gravity'];
    // Shuffle
    for (let i = attrPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [attrPool[i], attrPool[j]] = [attrPool[j], attrPool[i]];
    }
    const count = scannerLevel >= 2 ? 2 : 1;
    const impressions = attrPool.slice(0, count).map(attr =>
      getVagueImpression(attr, candidate[attr])
    );

    return { candidate, impressions, blocked: false };
  }

  return {
    generate,
    gradeplanet,
    describe,
    getEnvironmentalHardships,
    generateAnomalies,
    peekPlanet,
    getVagueImpression,
    ANOMALY_POOL,
    getLabel,
    ATM_LABELS, GRAV_LABELS, TEMP_LABELS, WATER_LABELS, RES_LABELS, BIO_LABELS,
  };
})();
