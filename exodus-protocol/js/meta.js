// Roguelike meta-progression — persists across runs in localStorage.
// Earn Legacy Points each run; spend them at the Legacy Vault between runs.

const Meta = (() => {
  const STORAGE_KEY = 'exodus-protocol-meta';

  const UPGRADES = [
    {
      id: 'emergency_archives',
      label: 'Emergency Archives',
      desc: 'Start each run with +10% Science DB integrity per rank.',
      maxRank: 3,
      costPerRank: [15, 25, 40],
      effect: 'science_db_bonus',
    },
    {
      id: 'veteran_sleepers',
      label: 'Veteran Sleepers',
      desc: 'Start with +50 colonists per rank.',
      maxRank: 4,
      costPerRank: [10, 18, 28, 45],
      effect: 'colonist_bonus',
    },
    {
      id: 'relic_scanner',
      label: 'Relic Scanner',
      desc: '+20% chance to detect alien relics during The Crossing per rank.',
      maxRank: 3,
      costPerRank: [20, 35, 55],
      effect: 'relic_detect_bonus',
    },
    {
      id: 'adaptive_hull',
      label: 'Adaptive Hull',
      desc: 'First ship system damaged each run takes 50% less damage.',
      maxRank: 1,
      costPerRank: [25],
      effect: 'first_damage_halved',
    },
    {
      id: 'generational_memory',
      label: 'Generational Memory',
      desc: 'Unlocks a Cultural Heritage tech path, providing alternate culture-based builds.',
      maxRank: 1,
      costPerRank: [40],
      effect: 'unlock_culture_tech_path',
    },
    {
      id: 'xenobiologist',
      label: 'Xenobiologist',
      desc: 'Alien biospheres have +30% chance of being beneficial rather than hostile.',
      maxRank: 1,
      costPerRank: [30],
      effect: 'biosphere_friendly_chance',
    },
    {
      id: 'deep_cryogenics',
      label: 'Deep Cryogenics',
      desc: 'Unlock the "Sacrifice" mechanic: trade colonists for a burst of resources.',
      maxRank: 1,
      costPerRank: [35],
      effect: 'unlock_sacrifice_mechanic',
    },
    {
      id: 'extra_probes',
      label: 'Probe Cache',
      desc: 'Start each run with +1 surface probe per rank.',
      maxRank: 3,
      costPerRank: [12, 20, 30],
      effect: 'probe_bonus',
    },
    {
      id: 'power_cells',
      label: 'Emergency Power Cells',
      desc: 'Start with +10 power reserves per rank.',
      maxRank: 3,
      costPerRank: [8, 14, 22],
      effect: 'power_bonus',
    },
  ];

  // ---- Load / save ----

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefault();
      return JSON.parse(raw);
    } catch {
      return getDefault();
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getDefault() {
    return {
      legacyPoints: 0,
      totalRuns: 0,
      bestWinType: null,
      upgrades: {},  // { upgrade_id: rank }
    };
  }

  // ---- Legacy Points award ----
  // Called at end of each run.
  function awardPoints(meta, winType, planetGrade, turnsElapsed) {
    let pts = 0;

    // Base: survived
    pts += 5;

    // Win type bonuses
    const winBonus = { survival: 10, thriving: 20, legacy: 30, relic: 35 };
    if (winType && winBonus[winType]) pts += winBonus[winType];

    // Harder planet = more points
    const gradeBonus = { A: 5, B: 10, C: 18, D: 28, F: 45 };
    if (planetGrade && gradeBonus[planetGrade]) pts += gradeBonus[planetGrade];

    meta.legacyPoints += pts;
    meta.totalRuns += 1;
    if (!meta.bestWinType && winType) meta.bestWinType = winType;

    save(meta);
    return pts;
  }

  // ---- Purchases ----

  function canAfford(meta, upgradeId) {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    const currentRank = meta.upgrades[upgradeId] || 0;
    if (currentRank >= upgrade.maxRank) return false;
    return meta.legacyPoints >= upgrade.costPerRank[currentRank];
  }

  function purchase(meta, upgradeId) {
    if (!canAfford(meta, upgradeId)) return false;
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    const currentRank = meta.upgrades[upgradeId] || 0;
    meta.legacyPoints -= upgrade.costPerRank[currentRank];
    meta.upgrades[upgradeId] = currentRank + 1;
    save(meta);
    return true;
  }

  // ---- Build active upgrade map for ship creation ----

  function getActiveUpgrades(meta) {
    const active = {};
    for (const [id, rank] of Object.entries(meta.upgrades || {})) {
      if (rank > 0) active[id] = rank;
    }
    return active;
  }

  return {
    UPGRADES,
    load,
    save,
    awardPoints,
    canAfford,
    purchase,
    getActiveUpgrades,
  };
})();
