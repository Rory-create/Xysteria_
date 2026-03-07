// Event engine — weighted random selection, prerequisite checking, outcome application.

const Events = (() => {

  // ---- Weighted random pick from a catalog ----

  function weightedPick(catalog, filterFn) {
    const pool = catalog.filter(filterFn || (() => true));
    if (pool.length === 0) return null;
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const event of pool) {
      roll -= event.weight;
      if (roll <= 0) return event;
    }
    return pool[pool.length - 1];
  }

  // ---- Pick a Crossing event ----

  function pickCrossingEvent(ship) {
    // Scale severity: heavier damage amounts applied in choice outcomes via Ship.severityMultiplier
    // Peaceful jump becomes less likely the more planets are skipped
    const peacefulWeight = Math.max(5, 30 - ship.planetsVisited * 3);

    // Temporarily adjust peaceful event weight
    const catalog = EventsCrossing.map(e =>
      e.id === 'peaceful_jump' ? { ...e, weight: peacefulWeight } : e
    );

    return weightedPick(catalog);
  }

  // ---- Pick a Landfall event ----

  function pickLandfallEvent(gameState) {
    return weightedPick(EventsLandfall, (e) => {
      if (e.prerequisite && !e.prerequisite(gameState)) return false;
      return true;
    });
  }

  // ---- Get valid choices for an event (filter by condition) ----

  function getValidChoices(event, context) {
    return (event.choices || []).filter(c => !c.condition || c.condition(context));
  }

  // ---- Pick a random narrative variant ----

  function getEventNarrative(event) {
    const variants = event.narratives || [event.narrative || ''];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  return {
    pickCrossingEvent,
    pickLandfallEvent,
    getValidChoices,
    getEventNarrative,
    weightedPick,
  };
})();
