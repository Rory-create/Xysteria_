// Game main — phase router, save/load, meta vault, run end handling.

const GameMain = (() => {
  const SAVE_KEY = 'exodus-protocol-save';

  let metaState = null;
  let currentPhase = null;  // 'menu' | 'vault' | 'phase1' | 'phase2'

  // ---- DOM references ----
  let screenMenu, screenVault, screenGame;
  let narrativeEl, choicesEl, hudEl, phaseIndicatorEl;
  let planetPanelEl, buildPanelEl, techPanelEl;
  let gameCanvas, gameCtx;
  let bgCanvas, bgCtx;

  // ---- Save / Load ----

  function saveGame(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  // ---- Screen routing ----

  function showScreen(name) {
    [screenMenu, screenVault, screenGame].forEach(s => {
      if (s) s.style.display = 'none';
    });
    currentPhase = name;
    if (name === 'menu')  { screenMenu.style.display = 'flex'; }
    if (name === 'vault') { screenVault.style.display = 'flex'; }
    if (name === 'game')  { screenGame.style.display = 'grid'; }
  }

  // ---- Start a new run ----

  function startNewRun() {
    clearSave();
    const activeUpgrades = Meta.getActiveUpgrades(metaState);
    const ship = Ship.createDefault(activeUpgrades);

    // Probe cache meta
    if (activeUpgrades.extra_probes) ship.probes += activeUpgrades.extra_probes;
    // Power cells meta
    if (activeUpgrades.power_cells) ship.power = Math.min(100, ship.power + activeUpgrades.power_cells * 10);

    drawBackground('crossing');
    showScreen('game');
    Phase1.start({
      shipState: ship,
      planetPanelElement: planetPanelEl,
      transitionCallback: (finalShip, planet) => transitionToPhase2(finalShip, planet),
    });
  }

  // ---- Phase transition ----

  function transitionToPhase2(ship, planet) {
    const phase2Start = Ship.derivePhase2Start(ship, planet);

    saveGame({ phase: 2, phase2Start, metaId: Date.now() });
    drawBackground('landfall', planet.grade);

    Phase2.init(phase2Start, {
      buildPanel: buildPanelEl,
      techPanel: techPanelEl,
      runEndCallback: (gs, winType) => endRun(ship, gs, winType),
    });
  }

  // ---- End of run ----

  function endRun(ship, gs, winType) {
    clearSave();

    const planet = gs ? gs.planet : null;
    const grade = planet ? planet.grade : null;
    const turns = gs ? gs.turn : 0;

    const pointsEarned = Meta.awardPoints(metaState, winType, grade, turns);
    Meta.save(metaState);

    const winMessages = {
      survival: 'The colony survived. Against everything, they endured.',
      thriving: 'The colony thrives. A new civilization has taken root.',
      legacy:   'A government formed. Humanity has a future here.',
      relic:    'Alien intelligence integrated with human will. Something new emerged.',
      death:    'The colony is lost. The stars remember.',
    };

    const msg = winMessages[winType] || 'The run is over.';

    UI.showModal(
      winType === 'death' ? 'End of Run' : '✦ Victory',
      `<p>${msg}</p>
       <p>Planet: ${planet?.name || 'unknown'} (Grade ${grade || '?'})</p>
       <p>+${pointsEarned} Legacy Points earned. Total: ${metaState.legacyPoints}</p>
       <p>Runs completed: ${metaState.totalRuns}</p>`,
      () => showMainMenu()
    );
  }

  // ---- Main menu ----

  function showMainMenu() {
    showScreen('menu');
    const save = loadSave();

    const continueBtn = document.getElementById('btn-continue');
    if (continueBtn) continueBtn.style.display = save ? 'block' : 'none';

    // Render meta stats on menu
    const statsEl = document.getElementById('menu-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        Runs: ${metaState.totalRuns} &nbsp;|&nbsp;
        Legacy Points: ${metaState.legacyPoints} &nbsp;|&nbsp;
        Best outcome: ${metaState.bestWinType || 'none yet'}
      `;
    }

    // Draw animated starfield on menu canvas
    const menuCanvas = document.getElementById('menu-canvas');
    if (menuCanvas) {
      const mCtx = menuCanvas.getContext('2d');
      menuCanvas.width = menuCanvas.offsetWidth || 400;
      menuCanvas.height = menuCanvas.offsetHeight || 300;
      Renderer.drawStarfield(mCtx, menuCanvas.width, menuCanvas.height);
    }
  }

  // ---- Continue a saved run ----

  function continueRun() {
    const save = loadSave();
    if (!save) { startNewRun(); return; }

    if (save.phase === 2 && save.phase2Start) {
      const planet = save.phase2Start.planet;
      drawBackground('landfall', planet?.grade);
      showScreen('game');
      Phase2.init(save.phase2Start, {
        buildPanel: buildPanelEl,
        techPanel: techPanelEl,
        runEndCallback: (gs, winType) => endRun(null, gs, winType),
      });
    } else {
      startNewRun();
    }
  }

  // ---- Legacy Vault ----

  function showVault() {
    showScreen('vault');
    const containerEl = document.getElementById('vault-container');
    if (containerEl) {
      UI.renderMetaVault(metaState, containerEl, (upgradeId) => {
        Meta.purchase(metaState, upgradeId);
        showVault(); // re-render
      });
    }
  }

  // ---- Background drawing ----

  function drawBackground(mode, grade) {
    if (!bgCtx || !bgCanvas) return;
    bgCanvas.width  = bgCanvas.offsetWidth  || window.innerWidth;
    bgCanvas.height = bgCanvas.offsetHeight || window.innerHeight;

    if (mode === 'crossing') {
      Renderer.drawStarfield(bgCtx, bgCanvas.width, bgCanvas.height, Math.random() * 99999);
    } else if (mode === 'landfall') {
      bgCtx.fillStyle = '#08080f';
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      // Draw planet in corner
      const r = Math.min(bgCanvas.width, bgCanvas.height) * 0.3;
      Renderer.drawPlanetFallback(bgCtx, bgCanvas.width - r - 20, r + 20, r, grade || 'C');
    }
  }

  // ---- Init ----

  function init() {
    // DOM
    screenMenu  = document.getElementById('screen-menu');
    screenVault = document.getElementById('screen-vault');
    screenGame  = document.getElementById('screen-game');

    narrativeEl      = document.getElementById('narrative');
    choicesEl        = document.getElementById('choices');
    hudEl            = document.getElementById('hud');
    phaseIndicatorEl = document.getElementById('phase-indicator');
    planetPanelEl    = document.getElementById('planet-panel');
    buildPanelEl     = document.getElementById('build-panel');
    techPanelEl      = document.getElementById('tech-panel');
    bgCanvas         = document.getElementById('bg-canvas');
    if (bgCanvas) bgCtx = bgCanvas.getContext('2d');

    // Init UI module
    UI.init({
      narrative: narrativeEl,
      choices: choicesEl,
      hud: hudEl,
      phaseIndicator: phaseIndicatorEl,
    });

    // Load meta
    metaState = Meta.load();

    // Button wiring
    document.getElementById('btn-new-run')?.addEventListener('click', startNewRun);
    document.getElementById('btn-continue')?.addEventListener('click', continueRun);
    document.getElementById('btn-vault')?.addEventListener('click', showVault);
    document.getElementById('btn-vault-back')?.addEventListener('click', showMainMenu);

    // Show main menu
    showMainMenu();
  }

  return { init, endRun, transitionToPhase2 };
})();

document.addEventListener('DOMContentLoaded', () => GameMain.init());
