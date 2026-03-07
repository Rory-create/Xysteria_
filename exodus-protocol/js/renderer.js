// Sprite renderer — loads JSON sprites and draws them on canvas elements.
// Sprites are optional decoration; game is fully playable if sprite files are missing.

const Renderer = (() => {
  const spriteCache = {};  // { path: spriteData | 'loading' | 'error' }

  // ---- Load a sprite JSON (async, cached) ----

  async function loadSprite(path) {
    if (spriteCache[path]) return spriteCache[path];
    spriteCache[path] = 'loading';
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      spriteCache[path] = data;
      return data;
    } catch (e) {
      spriteCache[path] = 'error';
      return null;
    }
  }

  // ---- Draw a sprite frame onto a canvas context ----

  function drawSprite(ctx, sprite, x, y, scale = 1, animName = 'idle', frameOverride = null) {
    if (!sprite || sprite === 'loading' || sprite === 'error') return;
    if (!sprite.palette || !sprite.frames) return;

    const { palette, frames, animations, meta } = sprite;
    const w = meta.width;
    const h = meta.height;

    // Resolve animation frame index
    let frameIdx = frameOverride !== null ? frameOverride : 0;
    if (animations && animations[animName]) {
      const anim = animations[animName];
      frameIdx = anim.frames[frameIdx % anim.frames.length];
    }

    const frame = frames[frameIdx];
    if (!frame) return;

    const pixelSize = Math.max(1, Math.round(scale));

    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const idx = frame.pixels[row][col];
        if (idx === 0) continue;  // transparent
        const hex = palette[idx];
        if (!hex) continue;

        // Parse RRGGBBAA
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;

        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---- Draw a stat bar ----

  function drawStatBar(ctx, label, value, max, x, y, barW, barH, color) {
    const pct = Math.max(0, Math.min(1, value / max));

    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barW, barH);

    // Fill
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.round(barW * pct), barH);

    // Label
    ctx.fillStyle = '#ddd';
    ctx.font = `${barH - 2}px monospace`;
    ctx.fillText(`${label}: ${Math.round(value)}/${max}`, x + 2, y + barH - 2);
  }

  // ---- Sprite canvas widget (renders a sprite into an <canvas> element) ----

  function renderToCanvas(canvas, spritePath, scale = 1, animName = 'idle', frameIndex = 0) {
    const sprite = spriteCache[spritePath];
    if (!sprite || sprite === 'loading' || sprite === 'error') {
      // Try to load it (async)
      if (!spriteCache[spritePath]) {
        loadSprite(spritePath).then(() => renderToCanvas(canvas, spritePath, scale, animName, frameIndex));
      }
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSprite(ctx, sprite, 0, 0, scale, animName, frameIndex);
  }

  // ---- Background: starfield (generated in-code, no JSON needed) ----

  function drawStarfield(ctx, w, h, seed = 0) {
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, w, h);

    // Seeded random (simple LCG so stars are consistent per seed)
    let s = seed || 12345;
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };

    const starCount = Math.floor((w * h) / 800);
    for (let i = 0; i < starCount; i++) {
      const x = Math.floor(rand() * w);
      const y = Math.floor(rand() * h);
      const brightness = 0.3 + rand() * 0.7;
      const size = rand() > 0.95 ? 2 : 1;
      ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(2)})`;
      ctx.fillRect(x, y, size, size);
    }
  }

  // ---- Planet illustration (fallback if no sprite) ----

  function drawPlanetFallback(ctx, x, y, radius, grade) {
    const gradeColors = {
      A: ['#4ce9a0', '#2e8060'],
      B: ['#7cf0a0', '#3a7050'],
      C: ['#c8c040', '#806020'],
      D: ['#c07040', '#603020'],
      F: ['#a02020', '#601010'],
    };
    const [light, dark] = gradeColors[grade] || ['#888', '#444'];

    // Planet body
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, light);
    grad.addColorStop(1, dark);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  return {
    loadSprite,
    drawSprite,
    drawStatBar,
    renderToCanvas,
    drawStarfield,
    drawPlanetFallback,
  };
})();
