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
      landingSystems: 100,  // affects descent safety; damageable during crossing
      scannerLevel: 0,      // 0=basic, 1=improved, 2=advanced, 3=deep-range; reduces scan noise
      probes: 5,
      constructionRobots: 8,   // used for Phase 2 building speed
      maintenanceRobots: 5,    // deployable during Phase 1 events
      relics: [],           // array of relic ids found during The Crossing
      log: [],              // narrative history [{turn, text}]
      planetsVisited: 0,
      turnsElapsed: 0,
      metaUpgrades,         // reference to active meta upgrades for this run
      _firstDamageTaken: false,
      cryoViability: 100,   // 0–100; ticks down each jump; at 0 colonists die per jump
      flags: {},            // consequence flags set by events, checked by later events/arrival
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

    if (system === 'hull' || system === 'power' || system === 'landing') {
      const key = system === 'landing' ? 'landingSystems' : system;
      ship[key] = Math.max(0, ship[key] - amount);
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
  // Returns attribute readings with noise based on science DB and scanner level.
  // At science=100 OR scanner level 3, readings are exact.
  // Scanner level reduces noise by 8 per level (max 24 at level 3).

  // Each scanner level has a noise floor — the irreducible uncertainty that
  // only a deployed probe can resolve. Science DB reduces noise from max (40)
  // down toward the floor, but never below it without a probe.
  // floors: basic=20, improved=12, advanced=5, deep-range=0
  function scanNoiseRange(science, scannerLevel = 0) {
    const floors = [20, 12, 5, 0];
    const floor = floors[Math.min(scannerLevel, 3)];
    return Math.round(floor + (1 - science / 100) * (40 - floor));
  }

  function scanPlanet(planet, science, scannerLevel = 0) {
    const noiseRange = scanNoiseRange(science, scannerLevel);
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
      landingSystems: ship.landingSystems,
    };
  }

  return {
    createDefault,
    damageSystem,
    loseColonists,
    loseRobots,
    scanPlanet,
    scanNoiseRange,
    severityMultiplier,
    serialize,
    deserialize,
    derivePhase2Start,
  };
})();
