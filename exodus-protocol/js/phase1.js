// Phase 1: "The Crossing" — interstellar journey and planet search loop.

const Phase1 = (() => {

  let ship = null;
  let currentPlanet = null;
  let currentScanReadings = null;
  let bestPlanets = [];     // planets evaluated during this run (for "Return to Best")
  let planetPanelEl = null;
  let bgCanvasEl = null;
  let onTransition = null;  // callback(ship, planet) → triggers Phase 2

  // ---- Utility ----

  function applyLosses(losses) {
    if (!losses || !ship) return;
    if (losses.hull)        Ship.damageSystem(ship, 'hull', losses.hull);
    if (losses.power)       Ship.damageSystem(ship, 'power', losses.power);
    if (losses.science)     Ship.damageSystem(ship, 'science', losses.science);
    if (losses.culture)     Ship.damageSystem(ship, 'culture', losses.culture);
    if (losses.engineering) { /* engineering DB removed — ignored */ }
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

  // ---- Jump: play warp animation then pick event, present choices ----

  function doJump(isReturn = false) {
    if (checkGameOver()) return;
    ship.turnsElapsed += 1;

    // Clear planet panel immediately, show generic deep-space art
    if (planetPanelEl) UI.showEventArt(null, planetPanelEl);

    // Play warp animation before revealing event/planet
    if (bgCanvasEl) {
      Renderer.playWarpAnimation(bgCanvasEl, () => _resolveJump(isReturn));
    } else {
      _resolveJump(isReturn);
    }
  }

  function _resolveJump(isReturn) {
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

    // Show event-specific art
    if (planetPanelEl) UI.showEventArt(event.id, planetPanelEl);

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
    currentPlanet = Planet.generate(ship.scannerLevel);
    currentScanReadings = Ship.scanPlanet(currentPlanet, ship.knowledge.science, ship.scannerLevel);
    const noiseRange = Ship.scanNoiseRange(ship.knowledge.science, ship.scannerLevel);
    const planetDesc = Planet.describe(currentPlanet, currentScanReadings, noiseRange);

    ship.planetsVisited += 1;

    UI.addSeparator(`— Planet Detected: ${currentPlanet.name} —`);

    const scannerLabels = ['basic', 'improved', 'advanced', 'deep-range'];
    const scanQuality = noiseRange === 0
      ? 'Readings are exact.'
      : noiseRange <= 8
      ? 'Readings are mostly reliable — some uncertainty remains.'
      : ship.knowledge.science < 50
      ? 'Readings are imprecise — the science database is damaged.'
      : 'Readings show a significant margin of uncertainty. A probe would resolve the exact values.';
    UI.addNarrative(`Sensors resolve a planet. Scanner array: <strong>${scannerLabels[ship.scannerLevel] || 'basic'}</strong>. ${scanQuality}`);

    // Show anomaly hints (visible from orbit even without probe)
    if (currentPlanet.anomalies && currentPlanet.anomalies.length > 0) {
      for (const anomaly of currentPlanet.anomalies) {
        UI.addNarrative(`<span class="narrative-warning">⚠ Unusual reading: ${anomaly.hint}</span>`, 'warning');
      }
    }

    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl, false);
    UI.updateHUD(ship, ship.planetsVisited);

    // Assess danger escalation
    if (ship.planetsVisited >= 5) {
      UI.addNarrative(`<span class="narrative-warning">The ship has been in transit for a long time. Systems are showing fatigue.</span>`, 'warning');
    }

    showPlanetChoices(planetDesc);
  }

  // ---- Show choices when at a planet ----

  function showPlanetChoices(planetDesc) {
    const landingStatus = ship.landingSystems >= 80 ? '' :
      ship.landingSystems >= 50 ? ' ⚠ Landing systems degraded' :
      ' ⚠⚠ Landing systems critical';

    const choices = [
      {
        label: `Land here${landingStatus}`,
        id: 'land',
        condition: () => true,
      },
      {
        label: currentPlanet.surveyed
          ? `Probe already deployed — readings are exact`
          : `Deploy probe for exact readings (${ship.probes} remaining)`,
        id: 'probe',
        condition: () => ship.probes > 0 && !currentPlanet.surveyed,
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
        label: `Return to ${best.name}${best.surveyed ? ' (probed)' : ''} — costs 1 construction robot`,
        id: 'return',
        condition: () => ship.constructionRobots > 0,
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
    currentScanReadings = { ...currentPlanet }; // exact readings, no noise
    currentPlanet.surveyed = true;
    currentPlanet.anomaliesRevealed = true;

    const planetDesc = Planet.describe(currentPlanet, currentScanReadings, 0); // noiseRange=0 → exact
    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl, true);

    UI.addNarrative(`Probe deployed. Full sensor sweep complete. All readings resolved to exact values.`);

    // Reveal anomalies
    if (currentPlanet.anomalies && currentPlanet.anomalies.length > 0) {
      UI.addNarrative(`<span class="narrative-separator">— Anomaly Report —</span>`);
      for (const anomaly of currentPlanet.anomalies) {
        const icon = anomaly.positive === true ? '✦' : anomaly.positive === false ? '⚠' : '◈';
        const cls  = anomaly.positive === true ? 'narrative-relic' : anomaly.positive === false ? 'narrative-critical' : 'narrative-warning';
        UI.addNarrative(`<span class="${cls}">${icon} ${anomaly.label}: ${anomaly.desc}</span>`);
      }
    } else {
      UI.addNarrative(`Probe finds no significant anomalies beyond the standard readings.`);
    }

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
    Ship.loseRobots(ship, 'construction', 1);
    UI.addNarrative(`Navigation recalibrates for return trajectory. One construction unit consumed in the process.`);
    UI.updateHUD(ship, ship.planetsVisited);
    doJump(true);
  }

  function returnToBestPlanet() {
    const best = bestPlanets.pop();
    if (!best) { arriveAtPlanet(); return; }

    currentPlanet = best;
    let noiseRange = 0;
    if (best.surveyed) {
      currentScanReadings = { ...best };
    } else {
      currentScanReadings = Ship.scanPlanet(best, ship.knowledge.science, ship.scannerLevel);
      noiseRange = Ship.scanNoiseRange(ship.knowledge.science, ship.scannerLevel);
    }

    const planetDesc = Planet.describe(currentPlanet, currentScanReadings, noiseRange);
    if (planetPanelEl) UI.renderPlanetPanel(planetDesc, planetPanelEl, best.anomaliesRevealed);

    UI.addSeparator(`— Returning to ${best.name} —`);
    UI.addNarrative(`You arrive back at ${best.name}. ${best.surveyed ? 'Probe data is still reliable.' : 'Time and sensor drift may have shifted the readings.'}`);
    UI.updateHUD(ship, ship.planetsVisited);

    showPlanetChoices(planetDesc);
  }

  // ---- Land on current planet → transition to Phase 2 ----

  function landOnPlanet() {
    UI.clearChoices();

    UI.addSeparator('— Descent —');

    const probeStatus = currentPlanet.surveyed ? 'Probe data confirmed.' : 'Surface conditions unverified — no probe deployed.';
    UI.addNarrative(`Descent trajectory locked. ${probeStatus}`, 'flavor');

    // Landing systems check
    let landingLoss = 0;
    if (ship.landingSystems < 20) {
      landingLoss = 100 + Math.floor(Math.random() * 150);
      Ship.loseColonists(ship, landingLoss);
      UI.addNarrative(`<span class="narrative-critical">⚠ Landing systems critical — descent is violent. ${landingLoss} colonists lost in the emergency landing sequence.</span>`, 'critical');
    } else if (ship.landingSystems < 50) {
      landingLoss = 30 + Math.floor(Math.random() * 60);
      Ship.loseColonists(ship, landingLoss);
      UI.addNarrative(`<span class="narrative-warning">⚠ Landing systems degraded — rough descent. ${landingLoss} colonists lost to g-force trauma and cryo disruption.</span>`, 'warning');
    } else if (ship.landingSystems < 80) {
      landingLoss = 10 + Math.floor(Math.random() * 25);
      Ship.loseColonists(ship, landingLoss);
      UI.addNarrative(`Landing systems show minor wear. Descent is manageable — ${landingLoss} colonists lost to minor cryo disruption.`);
    } else {
      UI.addNarrative(`Landing systems nominal. Descent proceeds cleanly.`);
    }

    if (checkGameOver()) return;

    UI.addNarrative(`Final tally: ${ship.colonists.alive.toLocaleString()} colonists. Science DB: ${Math.round(ship.knowledge.science)}%. Culture DB: ${Math.round(ship.knowledge.culture)}%. Construction robots: ${ship.constructionRobots}. Maintenance robots: ${ship.maintenanceRobots}.`);

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
      'A thousand colonists in hibernation. The accumulated knowledge of a civilization. A chance.',
      'You are the ship\'s AI. You have been watching over them for eleven years.',
      'The last transmission from Earth came three years into the flight. Static. Then silence.',
      'You have charted the path. The colonists do not know how long it has truly been.',
      'The stars ahead hold no guarantees. Some of what you find will be survivable. Some will not.',
      'The mission is to find a world. Then to keep them alive on it.',
      'Whatever you find out here — it is all they have left.',
      'The Crossing begins.',
    ];

    let timerId = null;
    const skipBtn = UI.showSkipButton('Skip Intro', () => {
      if (timerId) clearTimeout(timerId);
      skipBtn.remove();
      callback();
    });

    let i = 0;
    function nextLine() {
      if (i >= lines.length) {
        skipBtn.remove();
        callback();
        return;
      }
      UI.addNarrative(lines[i], i === 0 ? 'flavor opening' : 'flavor');
      i++;
      if (i < lines.length) {
        timerId = setTimeout(nextLine, 600);
      } else {
        timerId = setTimeout(() => { skipBtn.remove(); callback(); }, 800);
      }
    }
    nextLine();
  }

  // ---- Init / start ----

  function start({ shipState, planetPanelElement, transitionCallback, bgCanvas }) {
    ship = shipState;
    planetPanelEl = planetPanelElement;
    bgCanvasEl = bgCanvas || document.getElementById('bg-canvas');
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
