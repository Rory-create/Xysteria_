// Canvas rendering engine — draws the editing surface and animation preview.

const Canvas = (() => {
  let mainCanvas, mainCtx;
  let previewCanvas, previewCtx;
  let overlayCanvas, overlayCtx; // for live tool previews (line/rect)

  // Checkerboard tile size (for transparency visualization)
  const CHECKER = 8;

  // ---- Helpers ----

  function hexToRgba(hex) {
    // Accepts #RRGGBBAA or #RRGGBB
    const h = hex.replace('#', '');
    if (h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16) / 255,
      };
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }

  function paletteColorToCss(hex) {
    // Convert #RRGGBBAA → CSS rgba(...)
    const c = hexToRgba(hex);
    return `rgba(${c.r},${c.g},${c.b},${c.a.toFixed(3)})`;
  }

  // ---- Coordinate mapping ----

  function screenToPixel(screenX, screenY) {
    const { zoom, panX, panY } = State;
    const col = Math.floor((screenX - panX) / zoom);
    const row = Math.floor((screenY - panY) / zoom);
    return { row, col };
  }

  function pixelToScreen(row, col) {
    const { zoom, panX, panY } = State;
    return {
      x: col * zoom + panX,
      y: row * zoom + panY,
    };
  }

  function isInBounds(row, col) {
    return row >= 0 && row < State.spriteHeight && col >= 0 && col < State.spriteWidth;
  }

  // ---- Draw checkerboard (transparency indicator) ----

  function drawCheckerboard(ctx, x, y, w, h) {
    for (let cy = 0; cy < h; cy += CHECKER) {
      for (let cx = 0; cx < w; cx += CHECKER) {
        const even = ((Math.floor(cy / CHECKER) + Math.floor(cx / CHECKER)) % 2 === 0);
        ctx.fillStyle = even ? '#CCCCCC' : '#888888';
        ctx.fillRect(x + cx, y + cy, Math.min(CHECKER, w - cx), Math.min(CHECKER, h - cy));
      }
    }
  }

  // ---- Main canvas render ----

  function render() {
    if (!mainCtx) return;
    const { spriteWidth: sw, spriteHeight: sh, zoom, panX, panY, palette,
            showGrid, showCheckerboard, hoverCell, activeFrame } = State;

    const canvasW = mainCanvas.width;
    const canvasH = mainCanvas.height;

    mainCtx.clearRect(0, 0, canvasW, canvasH);

    // Dark background
    mainCtx.fillStyle = '#1e1e2e';
    mainCtx.fillRect(0, 0, canvasW, canvasH);

    const spriteScreenW = sw * zoom;
    const spriteScreenH = sh * zoom;

    // Checkerboard for transparency
    if (showCheckerboard) {
      drawCheckerboard(mainCtx, panX, panY, spriteScreenW, spriteScreenH);
    }

    // Draw pixels
    if (activeFrame) {
      for (let row = 0; row < sh; row++) {
        for (let col = 0; col < sw; col++) {
          const idx = activeFrame.pixels[row][col];
          if (idx === 0) continue; // transparent
          const color = palette[idx] || '#FF00FFFF';
          mainCtx.fillStyle = paletteColorToCss(color);
          mainCtx.fillRect(panX + col * zoom, panY + row * zoom, zoom, zoom);
        }
      }
    }

    // Grid overlay
    if (showGrid && zoom >= 4) {
      mainCtx.strokeStyle = 'rgba(255,255,255,0.12)';
      mainCtx.lineWidth = 0.5;
      mainCtx.beginPath();
      for (let col = 0; col <= sw; col++) {
        const x = panX + col * zoom;
        mainCtx.moveTo(x, panY);
        mainCtx.lineTo(x, panY + spriteScreenH);
      }
      for (let row = 0; row <= sh; row++) {
        const y = panY + row * zoom;
        mainCtx.moveTo(panX, y);
        mainCtx.lineTo(panX + spriteScreenW, y);
      }
      mainCtx.stroke();

      // Sprite border
      mainCtx.strokeStyle = 'rgba(255,255,255,0.4)';
      mainCtx.lineWidth = 1;
      mainCtx.strokeRect(panX, panY, spriteScreenW, spriteScreenH);
    }

    // Hover highlight
    if (hoverCell && isInBounds(hoverCell.row, hoverCell.col)) {
      const { row, col } = hoverCell;
      mainCtx.fillStyle = 'rgba(255,255,255,0.18)';
      mainCtx.fillRect(panX + col * zoom, panY + row * zoom, zoom, zoom);
    }

    // Render overlay (live line/rect preview) — drawn on top via overlayCanvas compositing
    renderOverlay();
  }

  // ---- Overlay canvas (tool previews) ----

  function renderOverlay() {
    if (!overlayCtx) return;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const { tool, strokeStart, hoverCell, palette, activePaletteIndex, zoom, panX, panY } = State;
    if (!strokeStart || !hoverCell) return;
    if (tool !== 'line' && tool !== 'rect') return;

    const color = palette[activePaletteIndex] || '#FFFFFFFF';
    overlayCtx.strokeStyle = paletteColorToCss(color);
    overlayCtx.lineWidth = zoom;
    overlayCtx.lineCap = 'square';

    const x1 = panX + strokeStart.col * zoom + zoom / 2;
    const y1 = panY + strokeStart.row * zoom + zoom / 2;
    const x2 = panX + hoverCell.col * zoom + zoom / 2;
    const y2 = panY + hoverCell.row * zoom + zoom / 2;

    overlayCtx.beginPath();
    if (tool === 'line') {
      overlayCtx.moveTo(x1, y1);
      overlayCtx.lineTo(x2, y2);
      overlayCtx.stroke();
    } else {
      const rx = Math.min(x1, x2) - zoom / 2;
      const ry = Math.min(y1, y2) - zoom / 2;
      const rw = Math.abs(x2 - x1) + zoom;
      const rh = Math.abs(y2 - y1) + zoom;
      overlayCtx.strokeRect(rx, ry, rw, rh);
    }
  }

  // ---- Animation preview ----

  function renderPreview(frameIndex) {
    if (!previewCtx) return;
    const { spriteWidth: sw, spriteHeight: sh, palette, frames } = State;
    const frame = frames[frameIndex] || frames[0];
    if (!frame) return;

    const pw = previewCanvas.width;
    const ph = previewCanvas.height;
    const zoom = Math.floor(Math.min(pw / sw, ph / sh));

    previewCtx.clearRect(0, 0, pw, ph);

    // Checkerboard
    drawCheckerboard(previewCtx, 0, 0, sw * zoom, sh * zoom);

    for (let row = 0; row < sh; row++) {
      for (let col = 0; col < sw; col++) {
        const idx = frame.pixels[row][col];
        if (idx === 0) continue;
        const color = palette[idx] || '#FF00FFFF';
        previewCtx.fillStyle = paletteColorToCss(color);
        previewCtx.fillRect(col * zoom, row * zoom, zoom, zoom);
      }
    }
  }

  // ---- Thumbnail (for frame list panel) ----

  function renderThumbnail(frameIndex, size = 48) {
    const { spriteWidth: sw, spriteHeight: sh, palette, frames } = State;
    const frame = frames[frameIndex];
    if (!frame) return null;

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = size;
    thumbCanvas.height = size;
    const ctx = thumbCanvas.getContext('2d');

    const zoom = Math.floor(Math.min(size / sw, size / sh));
    const ox = Math.floor((size - sw * zoom) / 2);
    const oy = Math.floor((size - sh * zoom) / 2);

    drawCheckerboard(ctx, ox, oy, sw * zoom, sh * zoom);

    for (let row = 0; row < sh; row++) {
      for (let col = 0; col < sw; col++) {
        const idx = frame.pixels[row][col];
        if (idx === 0) continue;
        const color = palette[idx] || '#FF00FFFF';
        ctx.fillStyle = paletteColorToCss(color);
        ctx.fillRect(ox + col * zoom, oy + row * zoom, zoom, zoom);
      }
    }
    return thumbCanvas;
  }

  // ---- Init ----

  function init(mainEl, previewEl, overlayEl) {
    mainCanvas = mainEl;
    mainCtx = mainEl.getContext('2d');
    previewCanvas = previewEl;
    previewCtx = previewEl.getContext('2d');
    overlayCanvas = overlayEl;
    overlayCtx = overlayEl.getContext('2d');

    // Subscribe to state changes
    State.subscribe(() => render());
  }

  // ---- Mouse event helpers (used by main.js) ----

  function getPixelFromEvent(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;
    return screenToPixel(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
  }

  return {
    init,
    render,
    renderPreview,
    renderThumbnail,
    getPixelFromEvent,
    screenToPixel,
    pixelToScreen,
    isInBounds,
    paletteColorToCss,
    hexToRgba,
  };
})();
