// Central application state — all modules read from and write to this object.
// Call State.notify() after any mutation to trigger a re-render.

const State = (() => {
  const DEFAULT_PALETTE = [
    '#00000000', // 0 = transparent (always first)
    '#000000FF', '#FFFFFFFF', '#FF0000FF', '#00FF00FF', '#0000FFFF',
    '#FFFF00FF', '#FF00FFFF', '#00FFFFFF', '#FF8800FF', '#8800FFFF',
    '#00FF88FF', '#FF0088FF', '#88FF00FF', '#0088FFFF', '#FF8888FF',
    '#88FF88FF', '#8888FFFF', '#884400FF', '#448800FF', '#004488FF',
    '#880044FF', '#448844FF', '#444488FF', '#222222FF', '#444444FF',
    '#666666FF', '#888888FF', '#AAAAAAFF', '#CCCCCCFF', '#EEEEEEFF',
    '#1A1A2EFF', '#16213EFF', '#0F3460FF', '#533483FF', '#E94560FF',
  ];

  function makeEmptyFrame(w, h, label = 'Frame 1') {
    return {
      id: Date.now() + Math.random(),
      label,
      duration_ms: 200,
      pixels: Array.from({ length: h }, () => new Array(w).fill(0)),
    };
  }

  const _listeners = [];

  const state = {
    // Canvas / sprite dimensions
    spriteWidth: 16,
    spriteHeight: 16,

    // Viewport
    zoom: 16,          // display pixels per sprite pixel
    panX: 0,
    panY: 0,
    showGrid: true,
    showCheckerboard: true,

    // Active tool
    tool: 'pencil',    // pencil | eraser | fill | eyedropper | line | rect

    // Color
    activePaletteIndex: 1,  // index into palette (0 = transparent)
    palette: [...DEFAULT_PALETTE],

    // Frames
    frames: [],
    activeFrameIndex: 0,

    // Animation
    isPlaying: false,
    animFrameIndex: 0,

    // Named animations
    animations: {
      idle: { frames: [0], loop: true },
    },

    // Line/rect tool transient state (stroke start point)
    strokeStart: null,

    // Hover cell (for cursor highlight)
    hoverCell: null,

    // Dirty flag
    dirty: false,

    // Sprite name
    spriteName: 'untitled',

    // ---- Computed helpers ----
    get activeFrame() {
      return this.frames[this.activeFrameIndex] || null;
    },

    // ---- Mutation helpers ----
    setPixel(row, col, paletteIndex) {
      const frame = this.activeFrame;
      if (!frame) return;
      if (row < 0 || row >= this.spriteHeight) return;
      if (col < 0 || col >= this.spriteWidth) return;
      frame.pixels[row][col] = paletteIndex;
      this.dirty = true;
    },

    getPixel(row, col) {
      const frame = this.activeFrame;
      if (!frame) return 0;
      if (row < 0 || row >= this.spriteHeight) return 0;
      if (col < 0 || col >= this.spriteWidth) return 0;
      return frame.pixels[row][col];
    },

    resizeTo(w, h) {
      this.spriteWidth = w;
      this.spriteHeight = h;
      this.frames = this.frames.map(f => {
        const newPixels = Array.from({ length: h }, (_, r) =>
          Array.from({ length: w }, (_, c) =>
            (f.pixels[r] && f.pixels[r][c] !== undefined) ? f.pixels[r][c] : 0
          )
        );
        return { ...f, pixels: newPixels };
      });
      if (this.frames.length === 0) {
        this.frames.push(makeEmptyFrame(w, h));
        this.activeFrameIndex = 0;
      }
    },

    addFrame() {
      const { spriteWidth: w, spriteHeight: h, frames } = this;
      const label = `Frame ${frames.length + 1}`;
      const frame = makeEmptyFrame(w, h, label);
      frames.splice(this.activeFrameIndex + 1, 0, frame);
      this.activeFrameIndex = this.activeFrameIndex + 1;
      this.dirty = true;
    },

    duplicateFrame(index) {
      const src = this.frames[index];
      if (!src) return;
      const copy = {
        ...src,
        id: Date.now() + Math.random(),
        label: src.label + ' copy',
        pixels: src.pixels.map(row => [...row]),
      };
      this.frames.splice(index + 1, 0, copy);
      this.activeFrameIndex = index + 1;
      this.dirty = true;
    },

    deleteFrame(index) {
      if (this.frames.length <= 1) return;
      this.frames.splice(index, 1);
      this.activeFrameIndex = Math.min(index, this.frames.length - 1);
      this.dirty = true;
    },

    reorderFrame(fromIndex, toIndex) {
      const [frame] = this.frames.splice(fromIndex, 1);
      this.frames.splice(toIndex, 0, frame);
      this.activeFrameIndex = toIndex;
      this.dirty = true;
    },

    // ---- Observer ----
    subscribe(fn) {
      _listeners.push(fn);
    },

    notify() {
      _listeners.forEach(fn => fn(this));
    },

    // ---- Init ----
    init(w = 16, h = 16) {
      this.spriteWidth = w;
      this.spriteHeight = h;
      this.frames = [makeEmptyFrame(w, h)];
      this.activeFrameIndex = 0;
      this.palette = [...DEFAULT_PALETTE];
      this.activePaletteIndex = 1;
      this.tool = 'pencil';
      this.zoom = Math.max(4, Math.min(32, Math.floor(480 / Math.max(w, h))));
      this.panX = 0;
      this.panY = 0;
      this.dirty = false;
      this.spriteName = 'untitled';
      this.animations = { idle: { frames: [0], loop: true } };
    },
  };

  // Export makeEmptyFrame for use in export.js
  state._makeEmptyFrame = makeEmptyFrame;
  return state;
})();
