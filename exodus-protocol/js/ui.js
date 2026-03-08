// UI module — narrative feed, choice buttons, HUD updates, panels.

const UI = (() => {

  // ---- DOM references (set on init) ----
  let narrativeEl, choicesEl, hudEl, phaseIndicatorEl;

  // ---- Narrative log ----

  let narrativeQueue = [];

  function addNarrative(text, className = '') {
    if (!narrativeEl) return;
    const p = document.createElement('p');
    p.className = 'narrative-line' + (className ? ' ' + className : '');
    // Animate in
    p.style.opacity = '0';
    p.innerHTML = text;
    narrativeEl.appendChild(p);
    narrativeEl.scrollTop = narrativeEl.scrollHeight;
    requestAnimationFrame(() => {
      p.style.transition = 'opacity 0.4s';
      p.style.opacity = '1';
    });
  }

  function clearNarrative() {
    if (narrativeEl) narrativeEl.innerHTML = '';
  }

  function addSeparator(label = '') {
    if (!narrativeEl) return;
    const div = document.createElement('div');
    div.className = 'narrative-separator';
    div.textContent = label;
    narrativeEl.appendChild(div);
    narrativeEl.scrollTop = narrativeEl.scrollHeight;
  }

  // ---- Choice buttons ----

  function showChoices(choices, onSelect) {
    if (!choicesEl) return;
    choicesEl.innerHTML = '';

    if (!choices || choices.length === 0) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = 'Continue';
      btn.addEventListener('click', () => { choicesEl.innerHTML = ''; onSelect(null); });
      choicesEl.appendChild(btn);
      return;
    }

    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn' + (choice.highlight ? ' choice-highlight' : '');
      const tagHtml = choice.tag ? ` <span class="choice-tag">[${choice.tag}]</span>` : '';
      btn.innerHTML = `<span class="choice-num">${idx + 1}.</span> ${choice.label}${tagHtml}`;
      if (choice.condition && !choice.condition) btn.disabled = true;
      btn.addEventListener('click', () => {
        choicesEl.innerHTML = '';
        onSelect(choice);
      });
      choicesEl.appendChild(btn);
    });
  }

  function showContinueButton(label, onClick) {
    showChoices(null, onClick);
    if (choicesEl && choicesEl.firstChild) {
      choicesEl.firstChild.textContent = label || 'Continue';
    }
  }

  function clearChoices() {
    if (choicesEl) choicesEl.innerHTML = '';
  }

  // Adds a muted skip button to the choices area and returns the element.
  function showSkipButton(label, onClick) {
    if (!choicesEl) return { remove: () => {} };
    const btn = document.createElement('button');
    btn.className = 'choice-btn choice-btn--skip';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    choicesEl.appendChild(btn);
    return btn;
  }

  // ---- Pixel art icon helper ----

  function _icon(name, color) {
    const src = Renderer.getIcon(name, color);
    return `<img class="pixel-icon" src="${src}" alt="">`;
  }

  // ---- HUD / stat bars ----

  function updateHUD(ship, planetsVisited) {
    if (!hudEl) return;

    const pct = (val, max = 100) => Math.max(0, Math.min(100, Math.round((val / max) * 100)));

    hudEl.innerHTML = `
      <div class="hud-section">
        <div class="hud-label">Colonists</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar colonists" style="width:${pct(ship.colonists.alive, ship.colonists.max)}%"></div>
        </div>
        <div class="hud-value">${ship.colonists.alive.toLocaleString()} / ${ship.colonists.max.toLocaleString()}</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Hull</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar hull" style="width:${pct(ship.hull)}%"></div>
        </div>
        <div class="hud-value">${Math.round(ship.hull)}%</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Power</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar power" style="width:${pct(ship.power)}%"></div>
        </div>
        <div class="hud-value">${Math.round(ship.power)}%</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Cryo Integrity</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar" style="width:${pct(ship.cryoViability)}%;background:${ship.cryoViability > 60 ? '#4caf82' : ship.cryoViability > 30 ? '#e0a020' : '#e05050'}"></div>
        </div>
        <div class="hud-value" style="color:${ship.cryoViability > 60 ? '' : ship.cryoViability > 30 ? '#e0a020' : '#e05050'}">${Math.round(ship.cryoViability)}%${ship.cryoViability <= 30 ? ' ⚠' : ''}</div>
      </div>

      <div class="hud-divider"></div>

      <div class="hud-section">
        <div class="hud-label">Science DB${ship.knowledge.science > 100 ? ' <span class="hud-enhanced">ENHANCED</span>' : ''}</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar science" style="width:${pct(ship.knowledge.science, 125)}%;${ship.knowledge.science > 100 ? 'background:linear-gradient(90deg,#f0e840,#c0a800)' : ''}"></div>
        </div>
        <div class="hud-value" style="${ship.knowledge.science > 100 ? 'color:#f0e840' : ''}">${Math.round(ship.knowledge.science)}%</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Culture DB${ship.knowledge.culture > 100 ? ' <span class="hud-enhanced">ENHANCED</span>' : ''}</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar culture" style="width:${pct(ship.knowledge.culture, 125)}%;${ship.knowledge.culture > 100 ? 'background:linear-gradient(90deg,#f0c040,#c08000)' : ''}"></div>
        </div>
        <div class="hud-value" style="${ship.knowledge.culture > 100 ? 'color:#f0c040' : ''}">${Math.round(ship.knowledge.culture)}%</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Landing Systems</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar landing" style="width:${pct(ship.landingSystems)}%;background:${ship.landingSystems < 50 ? '#e94560' : ship.landingSystems < 80 ? '#f0c040' : '#4ce9a0'}"></div>
        </div>
        <div class="hud-value">${Math.round(ship.landingSystems)}%</div>
      </div>

      <div class="hud-divider"></div>

      <div class="hud-stat">${_icon('probe','#9898b8')} Probes: <strong>${ship.probes}</strong></div>
      <div class="hud-stat">${_icon('planets','#9898b8')} Planets scanned: <strong>${planetsVisited}</strong></div>
      <div class="hud-stat">📡 Scanner: <strong>${['Basic','Improved','Advanced','Deep-Range'][ship.scannerLevel] || 'Basic'}</strong></div>
      <div class="hud-stat">Crossings: <strong>${ship.turnsElapsed}</strong></div>
      ${ship.relics.length > 0 ? `<div class="hud-stat">${_icon('relic','#f0a040')} Relics: <strong>${ship.relics.length}</strong></div>` : ''}

      <div class="hud-divider"></div>

      <div class="hud-stat">${_icon('robots_construct','#a07cf0')} Build robots: <strong>${ship.constructionRobots}</strong></div>
      <div class="hud-stat">${_icon('robots_maintain','#4ce9a0')} Maint. robots: <strong>${ship.maintenanceRobots}</strong></div>
    `;
  }

  // ---- Phase 2 HUD ----

  function updateLandfallHUD(gs) {
    if (!hudEl) return;
    const { resources, population, morale, turn, planet } = gs;

    hudEl.innerHTML = `
      <div class="hud-section">
        <div class="hud-label">Population</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar colonists" style="width:${Math.min(100, (population / gs.populationCap) * 100)}%"></div>
        </div>
        <div class="hud-value">${population.toLocaleString()} / ${gs.populationCap}</div>
      </div>

      <div class="hud-section">
        <div class="hud-label">Morale</div>
        <div class="hud-bar-wrap">
          <div class="hud-bar culture" style="width:${morale}%"></div>
        </div>
        <div class="hud-value">${morale}%</div>
      </div>

      <div class="hud-divider"></div>

      <div class="hud-stat">${_icon('food','#9898b8')} Food: <strong>${resources.food}</strong></div>
      <div class="hud-stat">${_icon('power','#9898b8')} Power: <strong>${resources.power}</strong></div>
      <div class="hud-stat">${_icon('materials','#9898b8')} Materials: <strong>${resources.materials}</strong></div>
      <div class="hud-stat">${_icon('science','#9898b8')} Research: <strong>${resources.science_pts}</strong></div>

      <div class="hud-divider"></div>

      <div class="hud-stat">${_icon('turns','#9898b8')} Turn: <strong>${turn}</strong> / 30</div>
      <div class="hud-stat">${_icon('globe','#9898b8')} Planet: <strong>${planet.name}</strong></div>

      <div class="hud-divider"></div>

      <div class="hud-label">Tech Access</div>
      <div class="hud-stat">${_icon('science','#4c8ce9')} Science: <strong>${Math.round(gs.techAccess.science)}%</strong></div>
      <div class="hud-stat">${_icon('culture','#c04ce9')} Culture: <strong>${Math.round(gs.techAccess.culture)}%</strong></div>

      <div class="hud-divider"></div>

      <div class="hud-stat">${_icon('robots_construct','#a07cf0')} Build robots: <strong>${gs.constructionRobots || 0}</strong></div>
    `;
  }

  // ---- Planet scan panel ----

  function renderPlanetPanel(planetDesc, containerEl, anomaliesRevealed = false) {
    if (!containerEl) return;
    const { name, attributes, class: cls, anomalies, surveyed } = planetDesc;

    // Build anomaly section
    let anomalyHtml = '';
    if (anomalies && anomalies.length > 0) {
      if (anomaliesRevealed) {
        anomalyHtml = `
          <div class="planet-anomalies">
            <div class="anomaly-header">Anomalies Detected</div>
            ${anomalies.map(a => {
              const iconName = a.positive === true ? 'star4' : a.positive === false ? 'warning_tri' : 'diamond_mix';
              const iconColor = a.positive === true ? '#4ce9a0' : a.positive === false ? '#e94560' : '#f0c040';
              const iconImg = `<img class="pixel-icon-inline" src="${Renderer.getIcon(iconName, iconColor)}" alt="">`;
              const cls2 = a.positive === true ? 'anomaly-positive' : a.positive === false ? 'anomaly-negative' : 'anomaly-mixed';
              return `<div class="anomaly-item ${cls2}">${iconImg} <strong>${a.label}</strong><br><em>${a.desc}</em></div>`;
            }).join('')}
          </div>`;
      } else {
        anomalyHtml = `
          <div class="planet-anomalies">
            <div class="anomaly-header">Anomalies Detected</div>
            ${anomalies.map(a =>
              `<div class="anomaly-item anomaly-unknown">? <strong>Unknown Anomaly</strong><br><em>${a.hint}</em><br><span class="anomaly-probe-hint">Deploy a probe to identify.</span></div>`
            ).join('')}
          </div>`;
      }
    }

    const surveyedBadge = surveyed
      ? `<span class="planet-surveyed-badge">Probed</span>`
      : `<span class="planet-unsurveyed-badge">Unprobed</span>`;

    const intelligentLifeHtml = planetDesc.intelligentLife
      ? `<div class="planet-intelligent-life">◈ CIVILIZATION DETECTED — Technological signatures confirmed</div>`
      : '';

    containerEl.innerHTML = `
      <canvas id="planet-portrait" width="96" height="96"></canvas>
      <div class="planet-name">${name} ${surveyedBadge}</div>
      <div class="planet-class">Class: ${cls}</div>
      ${intelligentLifeHtml}
      <div class="planet-attrs">
        ${Object.entries(attributes).map(([key, attr]) => {
          if (attr.offline) {
            return `
              <div class="planet-attr planet-attr--offline">
                <div class="attr-label">${key.charAt(0).toUpperCase() + key.slice(1)} <span class="attr-offline-tag">OFFLINE</span></div>
                <div class="attr-bar-wrap"><div class="attr-bar attr-bar--offline" style="width:100%"></div></div>
                <div class="attr-label-detail attr-offline-desc">${attr.desc}</div>
              </div>`;
          }
          return `
            <div class="planet-attr">
              <div class="attr-label">${key.charAt(0).toUpperCase() + key.slice(1)} <span class="attr-value-num">${attr.rangeStr || attr.value}</span></div>
              <div class="attr-bar-wrap">
                <div class="attr-bar" style="width:${attr.value}%;background:${attrColor(key, attr.value)}"></div>
              </div>
              <div class="attr-label-detail">${attr.label}${attr.rangeStr ? ' <em>(estimated)</em>' : ''} — <em>${attr.desc}</em></div>
            </div>`;
        }).join('')}
      </div>
      ${anomalyHtml}
    `;

    // Draw planet portrait
    const portraitCanvas = containerEl.querySelector('#planet-portrait');
    if (portraitCanvas) {
      const ctx = portraitCanvas.getContext('2d');
      Renderer.drawPlanet(ctx, 48, 48, 40, planetDesc);
    }
  }

  function attrColor(key, val) {
    // Green = good, red = bad (heuristic per attribute)
    if (key === 'gravity' || key === 'temperature') {
      // Mid-range is best
      const dist = Math.abs(val - 50);
      const pct = 1 - dist / 50;
      return `hsl(${Math.round(pct * 120)}, 70%, 45%)`;
    }
    return `hsl(${Math.round(val * 1.2)}, 70%, 45%)`;
  }

  // ---- Building panel (Phase 2) ----

  function renderBuildingPanel(gs, containerEl, onBuild) {
    if (!containerEl) return;
    const allBuildings = BuildingDefs;
    const available = allBuildings.filter(b =>
      gs.unlockedBuildings.includes(b.id) &&
      !b.unique // non-unique can be built multiple times
    );

    containerEl.innerHTML = '<div class="panel-section-label">Build</div>';

    if (available.length === 0) {
      containerEl.innerHTML += '<p class="dim-text">No buildings available. Research techs first.</p>';
      return;
    }

    available.forEach(bdef => {
      const canAfford = Object.entries(bdef.cost).every(([res, amt]) =>
        (gs.resources[res] || 0) >= amt
      );
      const div = document.createElement('div');
      div.className = 'build-item' + (canAfford ? '' : ' disabled');
      div.innerHTML = `
        <span class="build-icon"><img class="pixel-icon-build" src="${Renderer.getIcon(bdef.icon)}" alt=""></span>
        <div class="build-info">
          <div class="build-label">${bdef.label}</div>
          <div class="build-cost">${Object.entries(bdef.cost).map(([k,v]) => `${v} ${k}`).join(', ')}</div>
          <div class="build-desc">${bdef.desc}</div>
        </div>
        <button class="build-btn" ${canAfford ? '' : 'disabled'}>Build</button>
      `;
      div.querySelector('.build-btn').addEventListener('click', () => onBuild(bdef));
      containerEl.appendChild(div);
    });
  }

  // ---- Tech panel (Phase 2) ----

  function renderTechPanel(gs, containerEl, onResearch) {
    if (!containerEl) return;
    const allNodes = [...TechTreeBase, ...TechTreeRelics];
    const available = Tech.getAvailableNodes(
      gs.researchedTech,
      gs.techAccess,
      gs.relics,
      allNodes
    );

    containerEl.innerHTML = '<div class="panel-section-label">Research</div>';

    const canAffordPts = (node) => gs.resources.science_pts >= node.cost_research_points;

    if (available.length === 0) {
      containerEl.innerHTML += '<p class="dim-text">No researchable techs available.</p>';
    }

    available.forEach(node => {
      const described = Tech.describeNode(node, gs.techAccess);
      const blocked = described.isBlocked;
      const affordable = canAffordPts(node);
      const canResearch = !blocked && affordable;

      const div = document.createElement('div');
      div.className = 'tech-item' + (canResearch ? '' : ' disabled');
      div.innerHTML = `
        <div class="tech-label">${node.label} ${node.requires_relic ? `<img class="pixel-icon-inline" src="${Renderer.getIcon('relic','#f0a040')}" alt="">` : ''}</div>
        <div class="tech-cost">${node.cost_research_points} research pts</div>
        <div class="tech-desc">${node.desc}</div>
        ${blocked ? `<div class="tech-blocked">Requires: ${described.blockedReason.join('; ')}</div>` : ''}
        <button class="tech-btn" ${canResearch ? '' : 'disabled'}>Research</button>
      `;
      div.querySelector('.tech-btn').addEventListener('click', () => onResearch(node));
      containerEl.appendChild(div);
    });

    // Show researched
    if (gs.researchedTech.length > 0) {
      const doneDiv = document.createElement('div');
      doneDiv.className = 'panel-section-label';
      doneDiv.style.marginTop = '12px';
      doneDiv.textContent = 'Researched';
      containerEl.appendChild(doneDiv);
      gs.researchedTech.forEach(id => {
        const node = allNodes.find(n => n.id === id);
        if (!node) return;
        const p = document.createElement('p');
        p.className = 'tech-done';
        p.innerHTML = `<img class="pixel-icon-inline" src="${Renderer.getIcon('check','#4ce9a0')}" alt=""> ${node.label}`;
        containerEl.appendChild(p);
      });
    }
  }

  // ---- Event art panel ----

  function showEventArt(eventId, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    const w = containerEl.clientWidth  || 220;
    const h = containerEl.clientHeight || 300;
    const canvas = document.createElement('canvas');
    canvas.id = 'event-art-canvas';
    canvas.width  = w;
    canvas.height = h;
    canvas.style.display = 'block';
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    canvas.style.imageRendering = 'pixelated';
    containerEl.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    Renderer.drawEventArt(ctx, w, h, eventId, Date.now());
  }

  // ---- Heading choice (shown before a jump after "Move on") ----

  function showHeadingChoice(headings, ship, onChoose) {
    if (!choicesEl) return;
    choicesEl.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'heading-header';
    header.textContent = 'Set heading — long-range sensors show:';
    choicesEl.appendChild(header);

    headings.forEach((h, idx) => {
      const labels = ['Alpha', 'Beta', 'Gamma'];
      const btn = document.createElement('button');

      let btnClass = 'choice-btn heading-btn';
      if (h.signalType) btnClass += ' heading-signal';
      else if (h.bypass) btnClass += ' heading-bypass';
      btn.className = btnClass;

      let sensorLines;
      if (h.bypass) {
        sensorLines = `<div class="heading-sensor heading-bypass-note">Navigational wake detected — bypass corridor. Cryo systems reprieve.</div>`;
      } else if (h.blocked) {
        sensorLines = `<div class="heading-sensor heading-blocked">Sensors degraded — no reliable data</div>`;
      } else {
        sensorLines = h.impressions.map(line =>
          `<div class="heading-sensor">${line}</div>`
        ).join('');
      }

      const prognosisHtml = (!h.bypass && !h.blocked && h.prognosis)
        ? `<div class="heading-prognosis heading-prognosis-${h.prognosis}">${h.prognosis.charAt(0).toUpperCase() + h.prognosis.slice(1)}</div>`
        : '';

      const signalLabels = { distress: '⚠ Distress beacon detected', thermal: '◈ Thermal anomaly signature', em: '◈ Unknown EM transmission' };
      const signalHtml = h.signalType
        ? `<div class="heading-signal-note">${signalLabels[h.signalType] || '◈ Anomalous signal'}</div>`
        : '';

      btn.innerHTML = `
        <span class="heading-label">Vector ${labels[idx]}</span>
        ${sensorLines}
        ${prognosisHtml}
        ${signalHtml}
      `;
      btn.addEventListener('click', () => {
        choicesEl.innerHTML = '';
        onChoose(idx);
      });
      choicesEl.appendChild(btn);
    });
  }

  // ---- Phase indicator ----

  function setPhaseIndicator(text) {
    if (phaseIndicatorEl) phaseIndicatorEl.textContent = text;
  }

  // ---- Modal ----

  function showModal(title, body, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${body}</div>
        <button class="choice-btn modal-close">Continue</button>
      </div>
    `;
    overlay.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (onClose) onClose();
    });
    document.body.appendChild(overlay);
  }

  // ---- Legacy Vault UI ----

  function renderMetaVault(meta, containerEl, onPurchase) {
    if (!containerEl) return;
    containerEl.innerHTML = `
      <div class="vault-header">
        <span>Legacy Vault</span>
        <span class="vault-pts">${meta.legacyPoints} Legacy Points</span>
      </div>
    `;

    Meta.UPGRADES.forEach(upgrade => {
      const rank = meta.upgrades[upgrade.id] || 0;
      const maxed = rank >= upgrade.maxRank;
      const cost = maxed ? '—' : upgrade.costPerRank[rank];
      const canAfford = !maxed && meta.legacyPoints >= cost;

      const div = document.createElement('div');
      div.className = 'vault-item';
      div.innerHTML = `
        <div class="vault-label">${upgrade.label} <span class="vault-rank">[${rank}/${upgrade.maxRank}]</span></div>
        <div class="vault-desc">${upgrade.desc}</div>
        <button class="choice-btn vault-btn" ${canAfford ? '' : 'disabled'}>
          ${maxed ? 'Maxed' : `Buy — ${cost} pts`}
        </button>
      `;
      if (canAfford) {
        div.querySelector('.vault-btn').addEventListener('click', () => onPurchase(upgrade.id));
      }
      containerEl.appendChild(div);
    });
  }

  // ---- Init ----

  function init({ narrative, choices, hud, phaseIndicator }) {
    narrativeEl = narrative;
    choicesEl = choices;
    hudEl = hud;
    phaseIndicatorEl = phaseIndicator;
  }

  return {
    init,
    addNarrative,
    clearNarrative,
    addSeparator,
    showChoices,
    showContinueButton,
    clearChoices,
    showSkipButton,
    updateHUD,
    updateLandfallHUD,
    renderPlanetPanel,
    renderBuildingPanel,
    renderTechPanel,
    setPhaseIndicator,
    showModal,
    renderMetaVault,
    showEventArt,
    showHeadingChoice,
  };
})();
