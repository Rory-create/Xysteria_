// Phase 2: "Landfall" — knowledge-gated survival and settlement building.

const Phase2 = (() => {

  let gs = null;   // game state for Phase 2
  let buildPanelEl = null;
  let techPanelEl = null;
  let onRunEnd = null;  // callback(gs, winType)

  // ---- Derive initial game state from Phase 1 outcomes ----

  function createGameState(phase2Start) {
    const { population, morale, techAccess, buildingSpeedMod, energyStockpile,
            structuralQuality, relics, planet, metaUpgrades, log,
            constructionRobots, maintenanceRobots } = phase2Start;

    // Compute free starting techs
    const allNodes = [...TechTreeBase, ...TechTreeRelics];
    const freeTechIds = Tech.computeFreeTechs(techAccess.science, allNodes);
    const researchedTech = [...freeTechIds];
    const unlockedBuildings = [];
    const statMods = {};
    const unlockedEventOptions = [];

    // Apply free tech effects
    freeTechIds.forEach(id => {
      const node = allNodes.find(n => n.id === id);
      if (node) {
        Tech.research(node, { researchedTech, unlockedBuildings, statMods, unlockedEventOptions });
      }
    });

    // Apply relic relics to unlocked relics list
    const unlockedRelics = [...relics];

    const state = {
      turn: 1,
      planet: { ...planet },
      population,
      populationCap: 200,   // starts small, grows with housing
      morale: Math.max(20, morale),
      techAccess: { ...techAccess },
      buildingSpeedMod,
      structuralQuality,
      constructionRobots: constructionRobots ?? 8,
      maintenanceRobots: maintenanceRobots ?? 5,
      relics: unlockedRelics,
      metaUpgrades,
      log: [...log],

      // Resources
      resources: {
        food: 30,
        power: 15 + energyStockpile,
        materials: 22,
        science_pts: 0,
      },

      // Production per turn (recalculated each turn)
      production: { food: 0, power: 0, materials: 0, science_pts: 0, morale: 0 },

      // Upkeep per turn
      upkeep: { food: 0, power: 0, materials: 0 },

      // Tech / building state
      researchedTech,
      unlockedBuildings,
      statMods,
      unlockedEventOptions,
      buildings: [],    // placed buildings [{ id, turnsBuilt, damaged }]

      // Active environmental hardships
      hardships: Planet.getEnvironmentalHardships(planet),

      // Mitigation progress (for slow mitigations like atmo processor)
      mitigationProgress: {},

      // Win/lose tracking
      winConditions: {},
      isOver: false,
      winType: null,

      // Temp effects (duration-limited modifiers)
      tempEffects: [],
    };

    // Xenobiologist meta: biosphere friendlier
    if (metaUpgrades?.xenobiologist) {
      const bioHardship = state.hardships.findIndex(h => h.id === 'hostile_biosphere');
      if (bioHardship >= 0 && Math.random() < 0.3) {
        state.hardships.splice(bioHardship, 1);
        state.log.push({ turn: 0, text: 'Xenobiologist training: the native biosphere appears non-aggressive.' });
      }
    }

    return state;
  }

  // ---- Compute production for this turn ----

  function computeProduction() {
    const prod = { food: 0, power: 0, materials: 0, science_pts: 0, morale: 0 };
    const upk  = { food: 0, power: 0, materials: 0 };

    gs.buildings.forEach(b => {
      if (b.damaged) return; // damaged buildings don't produce
      const def = BuildingDefs.find(d => d.id === b.id);
      if (!def) return;

      // Base output
      for (const [res, amt] of Object.entries(def.output_per_turn)) {
        prod[res] = (prod[res] || 0) + amt;
      }

      // Planet scaling (water scales food, resources scales materials, etc.)
      if (def.planet_scale) {
        for (const [attr, res] of Object.entries(def.planet_scale)) {
          const attrVal = gs.planet[attr] || 50;
          const scaleFactor = (attrVal / 100) * 0.5 + 0.5; // 0.5× at 0, 1× at 50, 1.5× at 100
          prod[res] = ((prod[res] || 0)) * scaleFactor;
        }
      }

      // Upkeep
      for (const [res, amt] of Object.entries(def.upkeep)) {
        upk[res] = (upk[res] || 0) + amt;
      }

      // Population capacity
      if (def.capacity) {
        gs.populationCap += def.capacity;
      }
    });

    // Reset pop cap then re-add from buildings (recalculate)
    gs.populationCap = 200;
    gs.buildings.forEach(b => {
      const def = BuildingDefs.find(d => d.id === b.id);
      if (def && def.capacity) gs.populationCap += def.capacity;
    });

    // Apply stat mods (from tech)
    if (gs.statMods.mining_efficiency) {
      prod.materials = (prod.materials || 0) * (1 + gs.statMods.mining_efficiency);
    }
    if (gs.statMods.all_production_bonus) {
      for (const k in prod) {
        prod[k] = (prod[k] || 0) * (1 + gs.statMods.all_production_bonus);
      }
    }
    if (gs.statMods.power_production_bonus) {
      prod.power = (prod.power || 0) + gs.statMods.power_production_bonus;
    }
    if (gs.statMods.morale_growth) {
      prod.morale = (prod.morale || 0) + gs.statMods.morale_growth;
    }

    // Apply active temp effects
    gs.tempEffects = gs.tempEffects.filter(e => e.turns > 0);
    gs.tempEffects.forEach(e => {
      if (e.foodProductionMod) prod.food *= (1 + e.foodProductionMod);
      if (e.productionMod) {
        for (const k in prod) prod[k] = (prod[k] || 0) * (1 + e.productionMod);
      }
      e.turns -= 1;
    });

    // Hardship effects on upkeep
    gs.hardships.forEach(h => {
      if (h.foodMod && !isMitigated(h)) upk.food = (upk.food || 0) * (h.foodMod - 1);
      if (h.powerMod && !isMitigated(h)) upk.power = (upk.power || 0) * (h.powerMod - 1);
      if (h.powerDrainFlat && !isMitigated(h)) upk.power = (upk.power || 0) + h.powerDrainFlat;
    });

    // Round everything
    for (const k in prod) prod[k] = Math.round(prod[k] || 0);
    for (const k in upk)  upk[k]  = Math.round(upk[k] || 0);

    gs.production = prod;
    gs.upkeep = upk;
  }

  function isMitigated(hardship) {
    if (!hardship.mitigation) return false;
    return gs.buildings.some(b => b.id === hardship.mitigation && !b.damaged);
  }

  // ---- Apply production and upkeep ----

  function applyEconomy() {
    for (const [res, amt] of Object.entries(gs.production)) {
      if (res === 'morale') { gs.morale = Math.min(100, gs.morale + amt); continue; }
      gs.resources[res] = (gs.resources[res] || 0) + amt;
    }
    for (const [res, amt] of Object.entries(gs.upkeep)) {
      gs.resources[res] = Math.max(0, (gs.resources[res] || 0) - amt);
    }

    // Science DB slow recovery from Relic Lab
    if (gs.statMods.science_regen) {
      gs.techAccess.science = Math.min(100, gs.techAccess.science + gs.statMods.science_regen);
    }
  }

  // ---- Apply hardship penalties ----

  function applyHardships() {
    let msgs = [];

    gs.hardships.forEach(h => {
      if (isMitigated(h)) {
        // Check slow mitigations (atmo processor)
        const def = BuildingDefs.find(d => d.id === h.mitigation);
        if (def && def.mitigation_turns) {
          gs.mitigationProgress[h.id] = (gs.mitigationProgress[h.id] || 0) + 1;
          if (gs.mitigationProgress[h.id] >= def.mitigation_turns) {
            gs.hardships = gs.hardships.filter(x => x.id !== h.id);
            msgs.push(`✦ ${h.label} has been fully mitigated!`);
          }
        }
        return;
      }

      // Colonist decay
      if (h.colonistDecay) {
        const lost = h.colonistDecay;
        gs.population = Math.max(0, gs.population - lost);
        msgs.push(`⚠ ${h.label}: ${lost} colonists lost this turn.`);
      }

      // Health decay
      if (h.healthDecay) {
        gs.morale = Math.max(0, gs.morale - h.healthDecay);
        msgs.push(`⚠ ${h.label}: colonist morale declining.`);
      }

      // Random hostile life losses
      if (h.randomColonistLoss && Math.random() > 0.25) {
        const lost = 10 + Math.floor(Math.random() * 20);
        gs.population = Math.max(0, gs.population - lost);
        msgs.push(`⚠ Hostile Biosphere: ${lost} colonists lost to creature attacks.`);
      }

      // Terraforming progress
      gs.buildings.forEach(b => {
        const def = BuildingDefs.find(d => d.id === b.id);
        if (def && def.terraforms) {
          for (const attr of ['atmosphere', 'gravity', 'temperature', 'water', 'resources', 'biosphere']) {
            gs.planet[attr] = Math.min(100, gs.planet[attr] + 2);
          }
          // Recompute grade
          gs.planet.grade = Planet.gradeplanet(gs.planet);
        }
      });
    });

    return msgs;
  }

  // ---- Population growth ----

  function applyPopulationGrowth() {
    if (gs.resources.food <= 0) {
      // Starvation
      const lost = 40 + Math.floor(Math.random() * 30);
      gs.population = Math.max(0, gs.population - lost);
      return `⚠ Starvation: ${lost} colonists died from food shortage.`;
    }
    if (gs.population < gs.populationCap && gs.morale > 30) {
      const growthRate = 0.01 + (gs.morale / 100) * 0.02; // 1-3% per turn
      const growth = Math.floor(gs.population * growthRate);
      gs.population = Math.min(gs.populationCap, gs.population + growth);
      if (growth > 0) return `Population grew by ${growth} this turn.`;
    }
    return null;
  }

  // ---- Check win conditions ----

  function checkWinConditions() {
    // Survival win: alive at turn 30
    if (gs.turn >= 30) {
      return determineWin();
    }

    // Early win conditions
    if (gs.population <= 0) {
      return { win: false, type: 'death', message: 'All colonists have perished.' };
    }

    // Legacy win
    if (gs.buildings.some(b => b.id === 'capitol')) {
      return { win: true, type: 'legacy', message: 'A self-governing civilization has been established.' };
    }

    // Relic win
    if (gs.buildings.some(b => b.id === 'neural_hub')) {
      return { win: true, type: 'relic', message: 'The alien neural network has integrated with the colony. A new kind of civilization emerges.' };
    }

    return null;
  }

  function determineWin() {
    const startPop = gs.log.find(l => l.startPop)?.startPop || 800;
    if (gs.population <= 0) {
      return { win: false, type: 'death', message: 'The colony perished.' };
    }
    if (gs.population < startPop * 0.4) {
      return { win: false, type: 'death', message: 'Too many were lost. The colony could not sustain itself.' };
    }
    if (gs.population >= startPop * 2.0) {
      return { win: true, type: 'thriving', message: 'The colony is thriving. Population has more than doubled.' };
    }
    return { win: true, type: 'survival', message: 'The colony has survived 30 years on ' + gs.planet.name + '.' };
  }

  // ---- Build a building ----

  function buildBuilding(bdef, callback) {
    // Check cost
    for (const [res, amt] of Object.entries(bdef.cost)) {
      if ((gs.resources[res] || 0) < amt) {
        callback({ success: false, message: `Insufficient ${res}.` });
        return;
      }
    }

    // Deduct cost (with phase_constructor discount)
    const discount = gs.buildings.some(b => b.id === 'phase_constructor') ? 0.35 : 0;
    for (const [res, amt] of Object.entries(bdef.cost)) {
      const discounted = Math.ceil(amt * (1 - discount));
      gs.resources[res] -= discounted;
    }

    gs.buildings.push({ id: bdef.id, damaged: false, turnsBuilt: gs.turn });

    callback({ success: true, message: `${bdef.icon} ${bdef.label} built.` });
  }

  // ---- Research a tech ----

  function researchTech(node, callback) {
    if (gs.resources.science_pts < node.cost_research_points) {
      callback({ success: false, message: 'Insufficient research points.' });
      return;
    }
    gs.resources.science_pts -= node.cost_research_points;
    Tech.research(node, gs);
    callback({ success: true, message: `✓ ${node.label} researched.` });
  }

  // ---- Advance one turn ----

  function advanceTurn(callback) {
    gs.turn += 1;

    // Reset pop cap (recalculated in computeProduction)
    computeProduction();
    applyEconomy();
    const hardshipMsgs = applyHardships();
    const popMsg = applyPopulationGrowth();

    // Clamp resources
    for (const k in gs.resources) {
      gs.resources[k] = Math.max(0, gs.resources[k]);
    }

    // Random landfall event (30% chance per turn)
    if (Math.random() < 0.30) {
      const event = Events.pickLandfallEvent(gs);
      if (event) {
        callback({ type: 'event', event, hardshipMsgs, popMsg });
        return;
      }
    }

    callback({ type: 'turn', hardshipMsgs, popMsg });
  }

  // ---- Opening landing narrative ----

  function showLandingNarrative(callback) {
    const { planet } = gs;
    const gradeNarr = {
      A: 'The surface below is verdant and calm. It is almost beautiful. Almost like home.',
      B: 'The planet is hospitable, if challenging. The colonists can survive here. They will have to.',
      C: 'A difficult world. The scans confirm what you suspected: this will not be easy. But it is possible.',
      D: 'A harsh planet. As the ship descends, emergency protocols begin activating one by one. The colonists will wake to hardship.',
      F: 'Emergency landing protocols. The ship\'s systems trigger crisis mode before the first colonist opens their eyes.',
    };

    UI.addSeparator('— Landfall —');
    UI.addNarrative(`You have chosen ${planet.name}. The descent begins.`, 'flavor');
    UI.addNarrative(gradeNarr[planet.grade] || '', 'flavor');

    if (gs.hardships.length > 0) {
      UI.addNarrative('<strong>Active hardships detected:</strong>');
      gs.hardships.forEach(h => {
        UI.addNarrative(`<span class="narrative-warning">⚠ ${h.label}: ${h.desc}</span>`, 'warning');
      });
    }

    if (gs.researchedTech.length > 0) {
      const allNodes = [...TechTreeBase, ...TechTreeRelics];
      const names = gs.researchedTech.map(id => allNodes.find(n => n.id === id)?.label || id).join(', ');
      UI.addNarrative(`Knowledge intact: ${names} available from the start.`, 'flavor');
    }

    setTimeout(callback, 400);
  }

  // ---- Render turn state ----

  function renderTurnUI() {
    UI.updateLandfallHUD(gs);
    if (buildPanelEl) UI.renderBuildingPanel(gs, buildPanelEl, (bdef) => {
      buildBuilding(bdef, (result) => {
        UI.addNarrative(result.success
          ? `<span class="narrative-success">${result.message}</span>`
          : `<span class="narrative-warning">${result.message}</span>`);
        if (result.success) renderTurnUI();
      });
    });
    if (techPanelEl) UI.renderTechPanel(gs, techPanelEl, (node) => {
      researchTech(node, (result) => {
        UI.addNarrative(result.success
          ? `<span class="narrative-success">${result.message}</span>`
          : `<span class="narrative-warning">${result.message}</span>`);
        if (result.success) renderTurnUI();
      });
    });
  }

  // ---- Process a landfall event ----

  function processLandfallEvent(event, afterEvent) {
    UI.addSeparator(`— ${event.label} —`);
    UI.addNarrative(Events.getEventNarrative(event));

    const validChoices = Events.getValidChoices(event, gs);
    UI.showChoices(validChoices, (choice) => {
      if (!choice) { afterEvent(); return; }
      const result = choice.outcome(gs);

      // Apply resource changes
      if (result.resourceChanges) {
        for (const [k, v] of Object.entries(result.resourceChanges)) {
          if (k === 'population') {
            gs.population = Math.max(0, gs.population + v);
          } else if (k === 'morale') {
            gs.morale = Math.max(0, Math.min(100, gs.morale + v));
          } else if (k === 'science') {
            gs.techAccess.science = Math.min(100, gs.techAccess.science + v);
          } else {
            gs.resources[k] = Math.max(0, (gs.resources[k] || 0) + v);
          }
        }
      }

      if (result.tempEffect) gs.tempEffects.push({ ...result.tempEffect });
      if (result.removeBuilding && gs.buildings.length > 0) {
        gs.buildings.pop(); // remove last non-essential building
      }
      if (result.buildingDamage) {
        const b = gs.buildings[Math.floor(Math.random() * gs.buildings.length)];
        if (b) b.damaged = true;
      }

      UI.addNarrative(result.narrative);
      afterEvent();
    });
  }

  // ---- Main turn loop ----

  function doTurnLoop() {
    const winResult = checkWinConditions();

    if (winResult) {
      gs.isOver = true;
      gs.winType = winResult.type;
      UI.addSeparator(winResult.win ? '— Victory —' : '— The End —');
      UI.addNarrative(winResult.message, winResult.win ? 'success' : 'critical');
      UI.showContinueButton('End Run', () => {
        if (onRunEnd) onRunEnd(gs, winResult.type);
      });
      return;
    }

    renderTurnUI();

    UI.showContinueButton(`Advance to Turn ${gs.turn + 1}`, () => {
      advanceTurn((result) => {
        // Display turn messages
        if (result.popMsg) UI.addNarrative(result.popMsg, 'flavor');
        result.hardshipMsgs?.forEach(m => UI.addNarrative(m, 'warning'));

        UI.addNarrative(`Turn ${gs.turn} complete. Food: ${gs.resources.food} | Power: ${gs.resources.power} | Materials: ${gs.resources.materials}`, 'dim');

        if (result.type === 'event') {
          processLandfallEvent(result.event, () => doTurnLoop());
        } else {
          doTurnLoop();
        }
      });
    });
  }

  // ---- Init ----

  function init(phase2Start, { buildPanel, techPanel, runEndCallback }) {
    buildPanelEl = buildPanel;
    techPanelEl = techPanel;
    onRunEnd = runEndCallback;

    gs = createGameState(phase2Start);
    // Store start pop for win condition comparison
    gs.log.push({ startPop: gs.population });

    UI.setPhaseIndicator('Phase 2: Landfall');
    UI.clearNarrative();
    UI.updateLandfallHUD(gs);

    showLandingNarrative(() => doTurnLoop());
  }

  return { init };
})();
