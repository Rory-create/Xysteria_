// Palette panel — color swatches, color picker, add/remove colors.

const Palette = (() => {
  let container;
  let hiddenColorInput; // native <input type="color"> for picking

  // ---- Render ----

  function render() {
    if (!container) return;
    container.innerHTML = '';

    State.palette.forEach((hex, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch' + (idx === State.activePaletteIndex ? ' active' : '');
      swatch.dataset.index = idx;
      swatch.title = `[${idx}] ${hex}`;

      if (idx === 0) {
        // Transparent slot — show checkerboard
        swatch.classList.add('transparent');
      } else {
        // Convert RRGGBBAA → CSS
        swatch.style.backgroundColor = Canvas.paletteColorToCss(hex);
      }

      swatch.addEventListener('click', () => {
        State.activePaletteIndex = idx;
        render();
        State.notify();
      });

      swatch.addEventListener('dblclick', () => {
        if (idx === 0) return; // can't edit the transparent slot
        openColorPicker(idx, hex);
      });

      container.appendChild(swatch);
    });

    // Add color button
    const addBtn = document.createElement('div');
    addBtn.className = 'palette-swatch add-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Add color';
    addBtn.addEventListener('click', addColor);
    container.appendChild(addBtn);
  }

  function openColorPicker(idx, currentHex) {
    // Convert #RRGGBBAA to #RRGGBB for the native picker
    const hex6 = '#' + currentHex.slice(1, 7);
    hiddenColorInput.value = hex6;
    hiddenColorInput.dataset.editIndex = idx;
    hiddenColorInput.click();
  }

  function onColorInputChange(e) {
    const idx = parseInt(hiddenColorInput.dataset.editIndex);
    const hex6 = e.target.value; // '#RRGGBB'
    // Preserve the alpha from the existing color
    const existingAlpha = State.palette[idx] ? State.palette[idx].slice(7, 9) : 'FF';
    State.palette[idx] = hex6 + existingAlpha;
    State.dirty = true;
    render();
    State.notify();
  }

  function addColor() {
    if (State.palette.length >= 256) return;
    State.palette.push('#808080FF');
    State.activePaletteIndex = State.palette.length - 1;
    State.dirty = true;
    render();
    State.notify();
  }

  // ---- Alpha slider ----
  function setAlpha(idx, alpha) {
    // alpha: 0-255
    const hex = State.palette[idx];
    if (!hex) return;
    const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();
    State.palette[idx] = hex.slice(0, 7) + alphaHex;
    State.dirty = true;
    render();
    State.notify();
  }

  // ---- Init ----
  function init(containerEl, colorInputEl) {
    container = containerEl;
    hiddenColorInput = colorInputEl;
    hiddenColorInput.addEventListener('change', onColorInputChange);
    State.subscribe(render);
    render();
  }

  return { init, render, setAlpha };
})();
