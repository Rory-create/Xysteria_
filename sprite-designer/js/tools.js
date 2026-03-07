// Drawing tools — pencil, eraser, fill, eyedropper, line, rect.
// All tools read from State and mutate State.activeFrame.pixels.

const Tools = (() => {
  // ---- Bresenham line rasterization ----
  function linePixels(r0, c0, r1, c1) {
    const pixels = [];
    let dr = Math.abs(r1 - r0), dc = Math.abs(c1 - c0);
    let r = r0, c = c0;
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dc - dr;
    while (true) {
      pixels.push({ row: r, col: c });
      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 < dc)  { err += dc; r += sr; }
    }
    return pixels;
  }

  // ---- Rectangle outline pixels ----
  function rectPixels(r0, c0, r1, c1) {
    const pixels = [];
    const rMin = Math.min(r0, r1), rMax = Math.max(r0, r1);
    const cMin = Math.min(c0, c1), cMax = Math.max(c0, c1);
    for (let c = cMin; c <= cMax; c++) {
      pixels.push({ row: rMin, col: c });
      pixels.push({ row: rMax, col: c });
    }
    for (let r = rMin + 1; r < rMax; r++) {
      pixels.push({ row: r, col: cMin });
      pixels.push({ row: r, col: cMax });
    }
    return pixels;
  }

  // ---- BFS flood fill ----
  function floodFill(frame, startRow, startCol, targetIdx, fillIdx, w, h) {
    if (targetIdx === fillIdx) return;
    const visited = new Uint8Array(w * h);
    const queue = [startRow * w + startCol];
    visited[startRow * w + startCol] = 1;
    frame.pixels[startRow][startCol] = fillIdx;

    while (queue.length > 0) {
      const pos = queue.pop();
      const r = Math.floor(pos / w);
      const c = pos % w;
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= h || nc < 0 || nc >= w) continue;
        const npos = nr * w + nc;
        if (visited[npos]) continue;
        if (frame.pixels[nr][nc] !== targetIdx) continue;
        visited[npos] = 1;
        frame.pixels[nr][nc] = fillIdx;
        queue.push(npos);
      }
    }
  }

  // ---- Apply a single pixel (used by pencil/eraser during drag) ----
  function applyPencil(row, col) {
    if (!Canvas.isInBounds(row, col)) return;
    State.setPixel(row, col, State.activePaletteIndex);
  }

  function applyEraser(row, col) {
    if (!Canvas.isInBounds(row, col)) return;
    State.setPixel(row, col, 0); // 0 = transparent
  }

  // ---- Commit stroke (line/rect) to frame pixels ----
  function commitStroke(endRow, endCol) {
    const { strokeStart, tool, activePaletteIndex, activeFrame,
            spriteWidth: w, spriteHeight: h } = State;
    if (!strokeStart || !activeFrame) return;

    const pixels = tool === 'line'
      ? linePixels(strokeStart.row, strokeStart.col, endRow, endCol)
      : rectPixels(strokeStart.row, strokeStart.col, endRow, endCol);

    for (const { row, col } of pixels) {
      if (row >= 0 && row < h && col >= 0 && col < w) {
        activeFrame.pixels[row][col] = activePaletteIndex;
      }
    }
    State.dirty = true;
    State.strokeStart = null;
  }

  // ---- Tool dispatch: mousedown ----
  function onMouseDown(row, col) {
    const { tool, activePaletteIndex, activeFrame, spriteWidth: w, spriteHeight: h } = State;

    if (!Canvas.isInBounds(row, col)) return;

    switch (tool) {
      case 'pencil':
        applyPencil(row, col);
        break;
      case 'eraser':
        applyEraser(row, col);
        break;
      case 'fill': {
        const targetIdx = activeFrame ? activeFrame.pixels[row][col] : 0;
        if (activeFrame) {
          floodFill(activeFrame, row, col, targetIdx, activePaletteIndex, w, h);
          State.dirty = true;
        }
        break;
      }
      case 'eyedropper': {
        const idx = State.getPixel(row, col);
        State.activePaletteIndex = idx;
        break;
      }
      case 'line':
      case 'rect':
        State.strokeStart = { row, col };
        break;
    }
    State.notify();
  }

  // ---- Tool dispatch: mousemove (while button held) ----
  function onMouseMove(row, col, isDown) {
    State.hoverCell = { row, col };

    if (isDown) {
      const { tool } = State;
      if (tool === 'pencil') { applyPencil(row, col); State.notify(); }
      else if (tool === 'eraser') { applyEraser(row, col); State.notify(); }
      else if (tool === 'line' || tool === 'rect') {
        State.notify(); // repaint overlay preview
      }
    } else {
      State.notify(); // repaint hover highlight only
    }
  }

  // ---- Tool dispatch: mouseup ----
  function onMouseUp(row, col) {
    const { tool } = State;
    if (tool === 'line' || tool === 'rect') {
      commitStroke(row, col);
    }
    State.notify();
  }

  function onMouseLeave() {
    State.hoverCell = null;
    State.notify();
  }

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    floodFill,
    linePixels,
    rectPixels,
  };
})();
