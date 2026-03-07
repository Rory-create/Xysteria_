// Ship state — systems, colonists, relics, journey log.
// Mutated by events and phase1 mechanics; carried into phase2.

const Ship = (() => {
  function createDefault(metaUpgrades = {}) {
    const colonistBonus  = (metaUpgrades.veteran_sleepers || 0) * 50;
    const scienceBonus   = (metaUpgrades.emergency_archives || 0) * 0.05;
    const hullBonus      = (metaUpgrades.adaptive_hull || 0) > 0 ? 0 : 0; // applied on first damage

    return {
      colonists: {
        alive: 1000 + colonistBonus,
        max: 1000 + colonistBonus,
      },
      knowledge: {
        science: Math.min(100, 100 + Math.round(100 * scienceBonus)),
        culture: 100,
      },
      hull: 100,
      power: 100,
      probes: 5,
      constructionRobots: 8,   // used for Phase 2 building speed
      maintenanceRobots: 5,    // deployable during Phase 1 events
      relics: [],           // array of relic ids found during The Crossing
      log: [],              // narrative history [{turn, text}]
      planetsVisited: 0,
      turnsElapsed: 0,
      metaUpgrades,         // reference to active meta upgrades for this run
      _firstDamageTaken: false,
    };
  }

  // ---- Damage model ----

  function damageSystem(ship, system, amount) {
    // system: 'hull' | 'power' | 'science' | 'culture'
    // Adaptive Hull meta: first damage taken per run is halved
    if (!ship._firstDamageTaken && ship.metaUpgrades.adaptive_hull) {
      amount = Math.ceil(amount / 2);
      ship._firstDamageTaken = true;
    }

    if (system === 'hull' || system === 'power') {
      ship[system] = Math.max(0, ship[system] - amount);
    } else {
      ship.knowledge[system] = Math.max(0, ship.knowledge[system] - amount);
    }
  }

  function loseRobots(ship, type, n) {
    // type: 'maintenance' | 'construction'
    const key = type === 'maintenance' ? 'maintenanceRobots' : 'constructionRobots';
    ship[key] = Math.max(0, (ship[key] || 0) - n);
  }

  function loseColonists(ship, count) {
    const actual = Math.min(ship.colonists.alive, count);
    ship.colonists.alive -= actual;
    return actual;
  }

  // ---- Planet scan noise ----
  // Returns attribute readings with noise based on science DB level.
  // At science=100 the reading is exact. At science=0, up to ±40 noise.

  function scanPlanet(planet, science) {
    const noiseRange = Math.round((1 - science / 100) * 40);
    const noisy = {};
    for (const attr of ['atmosphere', 'gravity', 'temperature', 'water', 'resources', 'biosphere']) {
      const noise = noiseRange > 0 ? Math.floor(Math.random() * (noiseRange * 2 + 1)) - noiseRange : 0;
      noisy[attr] = Math.max(0, Math.min(100, planet[attr] + noise));
    }
    return noisy;
  }

  // ---- Severity multiplier for events ----

  function severityMultiplier(ship) {
    return 1 + ship.planetsVisited * 0.18;
  }

  // ---- Serialize / deserialize (for save system) ----

  function serialize(ship) {
    return JSON.parse(JSON.stringify(ship));
  }

  function deserialize(data) {
    return data;
  }

  // ---- Derive Phase 2 starting conditions from Phase 1 outcomes ----

  function derivePhase2Start(ship, planet) {
    return {
      population: ship.colonists.alive,
      morale: Math.round(ship.knowledge.culture),        // 0-100
      techAccess: {
        science: ship.knowledge.science,
        culture: ship.knowledge.culture,
      },
      constructionRobots: ship.constructionRobots,
      buildingSpeedMod: 0.3 + (ship.constructionRobots / 10) * 0.7, // 0.3× – 1.0×
      energyStockpile: Math.round(ship.power * 0.3),     // leftover power → energy
      structuralQuality: Math.round(ship.hull),           // affects building success rate
      relics: [...ship.relics],
      planet: { ...planet },
      metaUpgrades: ship.metaUpgrades,
      log: [...ship.log],
    };
  }

  return {
    createDefault,
    damageSystem,
    loseColonists,
    loseRobots,
    scanPlanet,
    severityMultiplier,
    serialize,
    deserialize,
    derivePhase2Start,
  };
})();
