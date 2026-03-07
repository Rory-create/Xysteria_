// Tech tree engine — knowledge-gated base tree + relic unlock branches.
// Knowledge requirements gate visibility; prerequisites gate availability.

const Tech = (() => {

  // ---- Base tech tree (loaded from data file) ----
  // Nodes are looked up by id.

  function getAvailableNodes(researchedIds, shipKnowledge, unlockedRelics, allNodes) {
    return allNodes.filter(node => {
      // Relic requirement
      if (node.requires_relic && !unlockedRelics.includes(node.requires_relic)) return false;

      // Knowledge requirement
      if (node.knowledge_required) {
        for (const [k, req] of Object.entries(node.knowledge_required)) {
          if ((shipKnowledge[k] || 0) < req) return false;
        }
      }

      // Already researched
      if (researchedIds.includes(node.id)) return false;

      // Prerequisites met
      if (node.prerequisites && node.prerequisites.length > 0) {
        if (!node.prerequisites.every(pid => researchedIds.includes(pid))) return false;
      }

      return true;
    });
  }

  // ---- Research a node ----

  function research(node, gameState) {
    // Add to researched list
    gameState.researchedTech.push(node.id);

    // Apply tech effects
    if (node.unlocks_buildings) {
      node.unlocks_buildings.forEach(bid => {
        if (!gameState.unlockedBuildings.includes(bid)) {
          gameState.unlockedBuildings.push(bid);
        }
      });
    }

    if (node.stat_mods) {
      for (const [k, v] of Object.entries(node.stat_mods)) {
        gameState.statMods[k] = (gameState.statMods[k] || 0) + v;
      }
    }

    if (node.event_options) {
      node.event_options.forEach(opt => {
        if (!gameState.unlockedEventOptions.includes(opt)) {
          gameState.unlockedEventOptions.push(opt);
        }
      });
    }
  }

  // ---- Compute free starting techs from science DB level ----

  function computeFreeTechs(scienceLevel, allNodes) {
    // 100% science → up to 3 tier-0 techs unlocked for free
    // 70%  science → up to 2
    // 40%  science → up to 1
    // <40% science → 0 (start from nothing)
    let freeTechCount = 0;
    if (scienceLevel >= 90) freeTechCount = 3;
    else if (scienceLevel >= 70) freeTechCount = 2;
    else if (scienceLevel >= 40) freeTechCount = 1;

    return allNodes
      .filter(n => !n.prerequisites || n.prerequisites.length === 0)
      .filter(n => !n.requires_relic)
      .filter(n => !n.knowledge_required || Object.entries(n.knowledge_required).every(([k, req]) => req <= 30))
      .slice(0, freeTechCount)
      .map(n => n.id);
  }

  // ---- Check if a specific building is unlocked ----

  function isBuildingUnlocked(buildingId, gameState) {
    return gameState.unlockedBuildings.includes(buildingId);
  }

  // ---- Describe a tech node for UI ----

  function describeNode(node, shipKnowledge) {
    const blocked = [];
    if (node.knowledge_required) {
      for (const [k, req] of Object.entries(node.knowledge_required)) {
        if ((shipKnowledge[k] || 0) < req) {
          blocked.push(`${k} DB ≥ ${req}% (yours: ${Math.round(shipKnowledge[k] || 0)}%)`);
        }
      }
    }
    return {
      ...node,
      isBlocked: blocked.length > 0,
      blockedReason: blocked,
    };
  }

  return {
    getAvailableNodes,
    research,
    computeFreeTechs,
    isBuildingUnlocked,
    describeNode,
  };
})();
