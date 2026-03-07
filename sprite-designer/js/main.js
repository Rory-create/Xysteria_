// Main — app init, DOM wiring, event routing.

document.addEventListener('DOMContentLoaded', () => {
  // ---- Canvas elements ----
  const mainCanvas   = document.getElementById('main-canvas');
  const overlayCanvas = document.getElementById('overlay-canvas');
  const previewCanvas = document.getElementById('preview-canvas');

  // ---- Panels ----
  const paletteContainer = document.getElementById('palette-container');
  const colorInput        = document.getElementById('hidden-color-input');
  const frameListEl       = document.getElementById('frame-list');

  // ---- Toolbar buttons ----
  const toolButtons = document.querySelectorAll('[data-tool]');
  const sizeSelect  = document.getElementById('size-select');
  const customWInput = document.getElementById('custom-w');
  const customHInput = document.getElementById('custom-h');
  const applyCustom = document.getElementById('apply-custom-size');
  const gridToggle  = document.getElementById('toggle-grid');
  const zoomInBtn   = document.getElementById('zoom-in');
  const zoomOutBtn  = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const spriteNameInput = document.getElementById('sprite-name');

  // ---- Animation buttons ----
  const addFrameBtn  = document.getElementById('add-frame');
  const dupFrameBtn  = document.getElementById('dup-frame');
  const delFrameBtn  = document.getElementById('del-frame');
  const playBtn      = document.getElementById('play-btn');

  // ---- Export/Import buttons ----
  const exportJSONBtn  = document.getElementById('export-json');
  const exportPNGBtn   = document.getElementById('export-png');
  const exportStripBtn = document.getElementById('export-strip');
  const importFileInput = document.getElementById('import-file');
  const newSpriteBtn   = document.getElementById('new-sprite');

  // ---- Canvas sizing ----
  function resizeCanvases() {
    const container = document.getElementById('canvas-area');
    const w = container.clientWidth;
    const h = container.clientHeight;
    mainCanvas.width   = w;
    mainCanvas.height  = h;
    overlayCanvas.width  = w;
    overlayCanvas.height = h;
    centerSprite();
    State.notify();
  }

  function centerSprite() {
    const container = document.getElementById('canvas-area');
    const { spriteWidth: sw, spriteHeight: sh, zoom } = State;
    State.panX = Math.floor((container.clientWidth  - sw * zoom) / 2);
    State.panY = Math.floor((container.clientHeight - sh * zoom) / 2);
  }

  // ---- Init modules ----
  State.init(16, 16);
  Canvas.init(mainCanvas, previewCanvas, overlayCanvas);
  Palette.init(paletteContainer, colorInput);
  Animation.init(frameListEl);
  resizeCanvases();

  // Restore autosave
  const restored = Export.loadAutosave();
  if (restored) {
    spriteNameInput.value = State.spriteName;
  }

  // Autosave every 30 seconds
  setInterval(() => Export.autosave(), 30000);

  // ---- Tool selection ----
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      State.tool = btn.dataset.tool;
      toolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Mark default tool active
  document.querySelector('[data-tool="pencil"]')?.classList.add('active');

  // ---- Size presets ----
  const PRESETS = { '8': [8,8], '16': [16,16], '32': [32,32], '64': [64,64], '128': [128,128] };
  sizeSelect?.addEventListener('change', () => {
    const v = sizeSelect.value;
    if (v === 'custom') {
      document.getElementById('custom-size-row').style.display = 'flex';
      return;
    }
    document.getElementById('custom-size-row').style.display = 'none';
    const [w, h] = PRESETS[v] || [16, 16];
    applySize(w, h);
  });

  applyCustom?.addEventListener('click', () => {
    const w = parseInt(customWInput.value) || 16;
    const h = parseInt(customHInput.value) || 16;
    applySize(Math.max(1, Math.min(256, w)), Math.max(1, Math.min(256, h)));
  });

  function applySize(w, h) {
    if (!confirm(`Resize canvas to ${w}×${h}? Existing pixels will be preserved where possible.`)) return;
    State.resizeTo(w, h);
    State.zoom = Math.max(4, Math.min(32, Math.floor(480 / Math.max(w, h))));
    centerSprite();
    State.notify();
  }

  // ---- Grid toggle ----
  gridToggle?.addEventListener('click', () => {
    State.showGrid = !State.showGrid;
    gridToggle.textContent = State.showGrid ? 'Grid: On' : 'Grid: Off';
    State.notify();
  });

  // ---- Zoom ----
  zoomInBtn?.addEventListener('click', () => {
    State.zoom = Math.min(64, State.zoom * 2);
    centerSprite();
    State.notify();
  });
  zoomOutBtn?.addEventListener('click', () => {
    State.zoom = Math.max(1, Math.floor(State.zoom / 2));
    centerSprite();
    State.notify();
  });
  zoomResetBtn?.addEventListener('click', () => {
    State.zoom = Math.max(4, Math.min(32, Math.floor(480 / Math.max(State.spriteWidth, State.spriteHeight))));
    centerSprite();
    State.notify();
  });

  // Scroll to zoom
  mainCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      State.zoom = Math.min(64, State.zoom + 2);
    } else {
      State.zoom = Math.max(1, State.zoom - 2);
    }
    centerSprite();
    State.notify();
  }, { passive: false });

  // ---- Sprite name ----
  spriteNameInput?.addEventListener('input', () => {
    State.spriteName = spriteNameInput.value.trim() || 'untitled';
  });

  // ---- Canvas mouse events ----
  let isMouseDown = false;
  let isPanning = false;
  let panStartX = 0, panStartY = 0, panStartPanX = 0, panStartPanY = 0;

  mainCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+click = pan
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartPanX = State.panX;
      panStartPanY = State.panY;
      return;
    }
    if (e.button !== 0) return;
    isMouseDown = true;
    const { row, col } = Canvas.getPixelFromEvent(e);
    Tools.onMouseDown(row, col);
  });

  mainCanvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
      State.panX = panStartPanX + (e.clientX - panStartX);
      State.panY = panStartPanY + (e.clientY - panStartY);
      State.notify();
      return;
    }
    const { row, col } = Canvas.getPixelFromEvent(e);
    Tools.onMouseMove(row, col, isMouseDown);
  });

  window.addEventListener('mouseup', (e) => {
    if (isPanning) { isPanning = false; return; }
    if (!isMouseDown) return;
    isMouseDown = false;
    const { row, col } = Canvas.getPixelFromEvent(e);
    Tools.onMouseUp(row, col);
  });

  mainCanvas.addEventListener('mouseleave', () => {
    if (!isMouseDown) Tools.onMouseLeave();
  });

  // Touch support (basic single-touch drawing)
  mainCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMouseDown = true;
    const touch = e.touches[0];
    const rect = mainCanvas.getBoundingClientRect();
    const { row, col } = Canvas.screenToPixel(
      (touch.clientX - rect.left) * (mainCanvas.width / rect.width),
      (touch.clientY - rect.top)  * (mainCanvas.height / rect.height)
    );
    Tools.onMouseDown(row, col);
  }, { passive: false });

  mainCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = mainCanvas.getBoundingClientRect();
    const { row, col } = Canvas.screenToPixel(
      (touch.clientX - rect.left) * (mainCanvas.width / rect.width),
      (touch.clientY - rect.top)  * (mainCanvas.height / rect.height)
    );
    Tools.onMouseMove(row, col, isMouseDown);
  }, { passive: false });

  mainCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isMouseDown = false;
    Tools.onMouseLeave();
  }, { passive: false });

  // ---- Keyboard shortcuts ----
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
      case 'p': setTool('pencil'); break;
      case 'e': setTool('eraser'); break;
      case 'f': setTool('fill'); break;
      case 'i': setTool('eyedropper'); break;
      case 'l': setTool('line'); break;
      case 'r': setTool('rect'); break;
      case 'g': State.showGrid = !State.showGrid; State.notify(); break;
      case '+': case '=': State.zoom = Math.min(64, State.zoom + 2); centerSprite(); State.notify(); break;
      case '-': State.zoom = Math.max(1, State.zoom - 2); centerSprite(); State.notify(); break;
      case 'z': if (e.ctrlKey || e.metaKey) {/* TODO: undo */} break;
    }
  });

  function setTool(tool) {
    State.tool = tool;
    toolButtons.forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  }

  // ---- Animation buttons ----
  addFrameBtn?.addEventListener('click',  () => Animation.addFrame());
  dupFrameBtn?.addEventListener('click',  () => Animation.duplicateFrame());
  delFrameBtn?.addEventListener('click',  () => Animation.deleteFrame());
  playBtn?.addEventListener('click',      () => Animation.togglePlayback(playBtn));

  // ---- Export/Import ----
  exportJSONBtn?.addEventListener('click',  () => Export.exportJSON());
  exportPNGBtn?.addEventListener('click',   () => Export.exportPNG());
  exportStripBtn?.addEventListener('click', () => Export.exportPNGStrip());

  importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      Export.importJSON(file);
      e.target.value = '';
    }
  });

  newSpriteBtn?.addEventListener('click', () => {
    if (State.dirty && !confirm('Discard unsaved changes and start a new sprite?')) return;
    Export.clearAutosave();
    State.init(State.spriteWidth, State.spriteHeight);
    spriteNameInput.value = 'untitled';
    centerSprite();
    State.notify();
  });

  // ---- Drag & drop JSON onto canvas ----
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      Export.importJSON(file);
    }
  });

  // ---- Window resize ----
  window.addEventListener('resize', resizeCanvases);

  // Initial render
  State.notify();
});
