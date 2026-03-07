// Export / Import — PNG, JSON (the sprite format shared with the game).

const Export = (() => {
  // ---- Serialize current state → sprite JSON ----

  function toSpriteJSON() {
    const { spriteWidth: w, spriteHeight: h, palette, frames, animations, spriteName } = State;
    return {
      meta: {
        name: spriteName,
        version: 1,
        width: w,
        height: h,
        created: new Date().toISOString().slice(0, 10),
        tags: [],
      },
      palette: [...palette],
      frames: frames.map((f, idx) => ({
        id: idx,
        duration_ms: f.duration_ms,
        label: f.label,
        pixels: f.pixels.map(row => [...row]),
      })),
      animations: { ...animations },
    };
  }

  // ---- Load sprite JSON → state ----

  function fromSpriteJSON(data) {
    if (!data || !data.meta || !data.palette || !data.frames) {
      throw new Error('Invalid sprite JSON: missing required fields (meta, palette, frames).');
    }
    const { meta, palette, frames, animations } = data;

    // Validate
    if (!Number.isInteger(meta.width) || !Number.isInteger(meta.height)) {
      throw new Error('Invalid sprite JSON: meta.width and meta.height must be integers.');
    }
    if (!Array.isArray(palette)) throw new Error('Invalid sprite JSON: palette must be an array.');
    if (!Array.isArray(frames) || frames.length === 0) {
      throw new Error('Invalid sprite JSON: frames must be a non-empty array.');
    }

    State.spriteWidth = meta.width;
    State.spriteHeight = meta.height;
    State.spriteName = meta.name || 'imported';
    State.palette = palette.map(c => {
      // Normalize: #RRGGBB → #RRGGBBFF
      if (c.length === 7) return c + 'FF';
      return c;
    });

    State.frames = frames.map((f, idx) => ({
      id: Date.now() + idx,
      label: f.label || `Frame ${idx + 1}`,
      duration_ms: f.duration_ms || 200,
      pixels: f.pixels.map(row => [...row]),
    }));

    State.animations = animations || { idle: { frames: [0], loop: true } };
    State.activeFrameIndex = 0;
    State.zoom = Math.max(4, Math.min(32, Math.floor(480 / Math.max(meta.width, meta.height))));
    State.panX = 0;
    State.panY = 0;
    State.dirty = false;

    State.notify();
  }

  // ---- Trigger a file download ----

  function download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Export as JSON ----

  function exportJSON() {
    const data = toSpriteJSON();
    const json = JSON.stringify(data, null, 2);
    download(json, `${State.spriteName}.json`, 'application/json');
    State.dirty = false;
  }

  // ---- Export current frame as PNG ----

  function exportPNG() {
    const { spriteWidth: w, spriteHeight: h, palette, activeFrame } = State;
    if (!activeFrame) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');

    // Paint pixels — transparent pixels stay fully transparent
    const imageData = ctx.createImageData(w, h);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const idx = activeFrame.pixels[row][col];
        const hex = palette[idx] || '#00000000';
        const c = Canvas.hexToRgba(hex);
        const i = (row * w + col) * 4;
        imageData.data[i]     = c.r;
        imageData.data[i + 1] = c.g;
        imageData.data[i + 2] = c.b;
        imageData.data[i + 3] = Math.round(c.a * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${State.spriteName}_frame${State.activeFrameIndex}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---- Export all frames as a horizontal PNG strip ----

  function exportPNGStrip() {
    const { spriteWidth: w, spriteHeight: h, palette, frames } = State;
    if (frames.length === 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = w * frames.length;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');

    frames.forEach((frame, fi) => {
      const imageData = ctx.createImageData(w, h);
      for (let row = 0; row < h; row++) {
        for (let col = 0; col < w; col++) {
          const idx = frame.pixels[row][col];
          const hex = palette[idx] || '#00000000';
          const c = Canvas.hexToRgba(hex);
          const i = (row * w + col) * 4;
          imageData.data[i]     = c.r;
          imageData.data[i + 1] = c.g;
          imageData.data[i + 2] = c.b;
          imageData.data[i + 3] = Math.round(c.a * 255);
        }
      }
      ctx.putImageData(imageData, fi * w, 0);
    });

    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${State.spriteName}_strip.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---- Import from JSON file ----

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (State.dirty) {
          if (!confirm('You have unsaved changes. Import anyway?')) return;
        }
        fromSpriteJSON(data);
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ---- localStorage auto-save ----

  const AUTOSAVE_KEY = 'sprite-designer-autosave';

  function autosave() {
    try {
      const data = toSpriteJSON();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage may be full; silently skip
    }
  }

  function loadAutosave() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      fromSpriteJSON(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAutosave() {
    localStorage.removeItem(AUTOSAVE_KEY);
  }

  // ---- Public API ----
  return {
    exportJSON,
    exportPNG,
    exportPNGStrip,
    importJSON,
    autosave,
    loadAutosave,
    clearAutosave,
    toSpriteJSON,
    fromSpriteJSON,
  };
})();
