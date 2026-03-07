// Animation system — frame list panel, playback loop, thumbnail generation.

const Animation = (() => {
  let frameListEl;
  let previewTimerId = null;
  let animCurrentIndex = 0;
  let lastTimestamp = 0;
  let dragSrcIndex = null;

  // ---- Frame list panel ----

  function renderFrameList() {
    if (!frameListEl) return;
    frameListEl.innerHTML = '';

    State.frames.forEach((frame, idx) => {
      const item = document.createElement('div');
      item.className = 'frame-item' + (idx === State.activeFrameIndex ? ' active' : '');
      item.dataset.index = idx;
      item.draggable = true;

      // Thumbnail
      const thumb = Canvas.renderThumbnail(idx, 48);
      if (thumb) item.appendChild(thumb);

      // Label
      const label = document.createElement('span');
      label.className = 'frame-label';
      label.textContent = frame.label || `Frame ${idx + 1}`;
      item.appendChild(label);

      // Duration badge
      const dur = document.createElement('span');
      dur.className = 'frame-duration';
      dur.textContent = `${frame.duration_ms}ms`;
      item.appendChild(dur);

      // Click to select
      item.addEventListener('click', () => {
        State.activeFrameIndex = idx;
        State.notify();
        renderFrameList();
      });

      // Double-click to rename
      label.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = frame.label;
        input.className = 'frame-label-input';
        label.replaceWith(input);
        input.focus();
        input.select();
        input.addEventListener('blur', () => {
          frame.label = input.value || frame.label;
          State.dirty = true;
          renderFrameList();
        });
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') input.blur();
          if (ev.key === 'Escape') renderFrameList();
        });
      });

      // Duration click to edit
      dur.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = prompt('Frame duration (ms):', frame.duration_ms);
        if (val !== null) {
          const ms = parseInt(val);
          if (!isNaN(ms) && ms > 0) {
            frame.duration_ms = ms;
            State.dirty = true;
            renderFrameList();
          }
        }
      });

      // Drag & drop reorder
      item.addEventListener('dragstart', (e) => {
        dragSrcIndex = idx;
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (dragSrcIndex !== null && dragSrcIndex !== idx) {
          State.reorderFrame(dragSrcIndex, idx);
          renderFrameList();
        }
        dragSrcIndex = null;
      });

      frameListEl.appendChild(item);
    });
  }

  // ---- Playback ----

  function startPlayback() {
    if (State.isPlaying) return;
    State.isPlaying = true;
    animCurrentIndex = State.activeFrameIndex;
    lastTimestamp = performance.now();
    requestAnimationFrame(tick);
  }

  function stopPlayback() {
    State.isPlaying = false;
  }

  function tick(timestamp) {
    if (!State.isPlaying) return;
    const elapsed = timestamp - lastTimestamp;
    const frame = State.frames[animCurrentIndex];
    if (!frame) { stopPlayback(); return; }

    if (elapsed >= frame.duration_ms) {
      lastTimestamp = timestamp;
      animCurrentIndex = (animCurrentIndex + 1) % State.frames.length;
      Canvas.renderPreview(animCurrentIndex);
    }

    requestAnimationFrame(tick);
  }

  // ---- Public API ----

  function addFrame() {
    State.addFrame();
    renderFrameList();
    State.notify();
  }

  function duplicateFrame() {
    State.duplicateFrame(State.activeFrameIndex);
    renderFrameList();
    State.notify();
  }

  function deleteFrame() {
    if (State.frames.length <= 1) return;
    State.deleteFrame(State.activeFrameIndex);
    renderFrameList();
    State.notify();
  }

  function togglePlayback(btn) {
    if (State.isPlaying) {
      stopPlayback();
      btn.textContent = '▶ Play';
    } else {
      startPlayback();
      btn.textContent = '⏹ Stop';
    }
  }

  function init(frameListContainer) {
    frameListEl = frameListContainer;
    State.subscribe(() => renderFrameList());
    renderFrameList();
  }

  return {
    init,
    renderFrameList,
    addFrame,
    duplicateFrame,
    deleteFrame,
    togglePlayback,
  };
})();
