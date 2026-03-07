// Phase 1: "The Crossing" — interstellar journey and planet search loop.

const Phase1 = (() => {

  let ship = null;
  let currentPlanet = null;
  let currentScanReadings = null;
  let bestPlanets = [];     // planets evaluated during this run (for "Return to Best")
  let planetPanelEl = null;
  let onTransition = null;  // callback(ship, planet) → triggers Phase 2

  // ---- Utility ----

  function applyLosses(losses) {
    if (!losses || !ship) return;
    if (losses.hull)        Ship.damageSystem(ship, 'hull', losses.hull);
    if (losses.power)       Ship.damageSystem(ship, 'power', losses.power);
    if (losses.science)     Ship.damageSystem(ship, 'science', losses.science);
    if (losses.culture)     Ship.damageSystem(ship, 'culture', losses.culture);
    if (losses.engineering) Ship.damageSystem(ship, 'engineering', losses.engineering);
    if (losses.colonists)   Ship.loseColonists(ship, losses.colonists);
  }

  function checkGameOver() {
    if (ship.colonists.alive <= 0) {
      UI.addNarrative('<span class="narrative-critical">All colonists lost. The ship drifts on, empty.</span>', 'critical');
      UI.addNarrative('The mission is over. The last of humanity\'s children never found their new home.', 'flavor');
      UI.showContinueButton('End Run', () => GameMain.endRun(ship, null, 'death'));
      return true;
    }
    if (ship.hull <= 0) {
      UI.addNarrative('<span class="narrative-critical">Hull integrity at zero. The ship breaks apart.</span>', 'critical');
      UI.showContinueButton('End Run', () => GameMain.endRun(ship, null, 'death'));
      return true;
    }
    return false;
  }

  // ---- Jump: pick event, present choices ----

  function doJump(isReturn = false) {
    if (checkGameOver()) return;
    ship.turnsElapsed += 1;

    const event = Events.pickCrossingEvent(ship);
    if (!event) { arriveAtPlanet(); return; }

    // Peaceful jump — just narrative, no choices
    if (event.id === 'peaceful_jump' || event.choices.length === 0) {
      UI.addNarrative(Events.getEventNarrative(event), 'flavor');
      if (isReturn) {
        returnToBestPlanet();
      } else {
        arriveAtPlanet();
      }
      return;
    }

    // Event with choices
    UI.addSeparator(`— ${event.label} —`);
    UI.addNarrative(Events.getEventNarrative(event));
    UI.updateHUD(ship, ship.planetsVisited);

    const validChoices = Events.getValidChoices(event, ship);
    UI.showChoices(validChoices, (choice) => {
      if (!choice) { arriveAtPlanet(); return; }
      const result = choice.outcome(ship);

      // Apply relic find
      if (result.relic) {
        UI.addNarrative(`<span class="narrative-relic">✦ Relic acquired: ${result.relic.replace(/_/g, ' ')}</span>`, 'relic');
      }

      UI.addNarrative(result.narrative);

      // Log event
      ship.log.push({ turn: ship.turnsElapsed, event: event.label, choice: choice.label });

      UI.updateHUD(ship, ship.planetsVisited);

      if (checkGameOver()) return;

      if (isReturn) {
        returnToBestPlanet();
      } else {
        arriveAtPlanet();
      }
    });
  }

  // ---- Arrive at a new planet ----

  function arriveAtPlanet() {
    currentPlanet = Planet.generate();
    currentScanReadings = Ship.scanPlanet(currentPlanet, ship.knowledge.science);
    const planetDesc = Planet.describe(currentPlanet, currentScanReadings);

    ship.planetsVisited += 1;

    UI.addSeparator(`— Planet Detected: ${currentPlanet.name} —`);
    UI.addNarrative(`Sensors resolve a planet. ${ship.knowledge.science < 50 ? 'Readings are imprecise — the science database is damaged.' : 'Readings look reliable.'}`);

    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl);
    UI.updateHUD(ship, ship.planetsVisited);

    // Assess danger escalation
    if (ship.planetsVisited >= 5) {
      UI.addNarrative(`<span class="narrative-warning">The ship has been in transit for a long time. Systems are showing fatigue.</span>`, 'warning');
    }

    showPlanetChoices(planetDesc);
  }

  // ---- Show choices when at a planet ----

  function showPlanetChoices(planetDesc) {
    const { grade } = currentPlanet;

    const choices = [
      {
        label: `Land here (Grade ${grade} planet)`,
        id: 'land',
        condition: () => true,
      },
      {
        label: `Deploy probe for accurate readings (${ship.probes} remaining)`,
        id: 'probe',
        condition: () => ship.probes > 0,
      },
      {
        label: `Move on — search for better worlds`,
        id: 'continue',
        condition: () => true,
      },
    ];

    if (bestPlanets.length > 0) {
      const best = bestPlanets[bestPlanets.length - 1];
      choices.push({
        label: `Return to ${best.name} (Grade ${best.grade}) — costs engineering DB`,
        id: 'return',
        condition: () => ship.knowledge.engineering > 15,
      });
    }

    const valid = choices.filter(c => c.condition());

    UI.showChoices(valid, (choice) => {
      switch (choice.id) {
        case 'land':
          landOnPlanet();
          break;
        case 'probe':
          deployProbe();
          break;
        case 'continue':
          skipPlanet();
          break;
        case 'return':
          initiateReturn();
          break;
      }
    });
  }

  // ---- Deploy probe: reveal true attributes ----

  function deployProbe() {
    ship.probes -= 1;
    currentScanReadings = { ...currentPlanet }; // exact readings
    currentPlanet.surveyed = true;
    currentPlanet.grade = Planet.gradeplanet(currentPlanet);

    const planetDesc = Planet.describe(currentPlanet, currentScanReadings);
    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl);

    UI.addNarrative(`Probe deployed. Full sensor sweep complete. Readings are now exact.`);
    UI.updateHUD(ship, ship.planetsVisited);

    showPlanetChoices(planetDesc);
  }

  // ---- Skip planet: record it, jump again ----

  function skipPlanet() {
    // Record this planet for possible return
    bestPlanets.push({ ...currentPlanet });
    // Keep only the 3 most recent for simplicity
    if (bestPlanets.length > 3) bestPlanets.shift();

    UI.addNarrative(`You log ${currentPlanet.name} and push on. The jump drive spools up.`, 'flavor');
    doJump();
  }

  // ---- Return to a previous planet (costs engineering DB) ----

  function initiateReturn() {
    const cost = 10 + Math.floor(Math.random() * 10);
    Ship.damageSystem(ship, 'engineering', cost);
    UI.addNarrative(`Navigation calculates a return trajectory. Engineering DB strained by ${cost} from the complex calculation.`);
    UI.updateHUD(ship, ship.planetsVisited);
    doJump(true);
  }

  function returnToBestPlanet() {
    const best = bestPlanets.pop();
    if (!best) { arriveAtPlanet(); return; }

    currentPlanet = best;
    currentScanReadings = best.surveyed
      ? { ...best }
      : Ship.scanPlanet(best, ship.knowledge.science);

    const planetDesc = Planet.describe(currentPlanet, currentScanReadings);
    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl);

    UI.addSeparator(`— Returning to ${best.name} —`);
    UI.addNarrative(`You arrive back at ${best.name}. ${best.surveyed ? 'Probe data is still reliable.' : 'Time and sensor drift may have changed the readings.'}`);
    UI.updateHUD(ship, ship.planetsVisited);

    showPlanetChoices(planetDesc);
  }

  // ---- Land on current planet → transition to Phase 2 ----

  function landOnPlanet() {
    UI.clearChoices();

    const grade = currentPlanet.grade;
    const gradeMessages = {
      A: 'A promising world. The colonists stir in their chambers as approach begins.',
      B: 'A decent world. Challenges ahead, but survivable. The colonists sleep on.',
      C: 'A difficult planet. There will be hardship. But this is where it ends.',
      D: 'A harsh planet. The colonists will struggle. This is the choice you make.',
      F: 'A brutal world. Emergency protocols engage the moment the ship enters orbit. Some colonists are already being woken.',
    };

    UI.addSeparator('— Descent —');
    UI.addNarrative(gradeMessages[grade] || 'Approach begins.', 'flavor');
    UI.addNarrative(`Final tally: ${ship.colonists.alive.toLocaleString()} colonists. Science DB: ${Math.round(ship.knowledge.science)}%. Culture DB: ${Math.round(ship.knowledge.culture)}%. Engineering DB: ${Math.round(ship.knowledge.engineering)}%.`);

    if (ship.relics.length > 0) {
      UI.addNarrative(`Relics in cargo: ${ship.relics.map(r => r.replace(/_/g, ' ')).join(', ')}.`, 'relic');
    }

    UI.showContinueButton('Begin Landfall', () => {
      if (onTransition) onTransition(ship, currentPlanet);
    });
  }

  // ---- Opening narrative ----

  function showOpeningNarrative(callback) {
    const lines = [
      'And when they knew the Earth was doomed, they built a ship.',
      'One thousand colonists in hibernation. The accumulated knowledge of a civilization. A chance.',
      'You are the ship\'s AI. You have been watching over them for eleven years.',
      'The stars ahead hold no guarantees. Some of what you find will be survivable. Some will not.',
      'The mission is to find a world. Then to keep them alive on it.',
      'The Crossing begins.',
    ];

    let i = 0;
    function nextLine() {
      if (i >= lines.length) { callback(); return; }
      UI.addNarrative(lines[i], i === 0 ? 'flavor opening' : 'flavor');
      i++;
      if (i < lines.length) {
        setTimeout(nextLine, 600);
      } else {
        setTimeout(callback, 800);
      }
    }
    nextLine();
  }

  // ---- Init / start ----

  function start({ shipState, planetPanelElement, transitionCallback }) {
    ship = shipState;
    planetPanelEl = planetPanelElement;
    onTransition = transitionCallback;
    bestPlanets = [];

    UI.setPhaseIndicator('Phase 1: The Crossing');
    UI.clearNarrative();
    UI.updateHUD(ship, 0);

    showOpeningNarrative(() => {
      UI.showContinueButton('Begin First Jump', () => doJump());
    });
  }

  return { start };
})();
