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

  // ---- Planet illustration (legacy fallback) ----

  function drawPlanetFallback(ctx, x, y, radius, grade) {
    const gradeColors = {
      A: ['#4ce9a0', '#2e8060'],
      B: ['#7cf0a0', '#3a7050'],
      C: ['#c8c040', '#806020'],
      D: ['#c07040', '#603020'],
      F: ['#a02020', '#601010'],
    };
    const [light, dark] = gradeColors[grade] || ['#888', '#444'];
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, light);
    grad.addColorStop(1, dark);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ---- Procedural planet art ----
  // planetDesc: { grade, attributes: { atmosphere, gravity, temperature, water, resources, biosphere } }

  function drawPlanet(ctx, x, y, radius, planetDesc) {
    const grade = planetDesc?.grade || 'C';
    const attrs = planetDesc?.attributes || {};
    const atm  = attrs.atmosphere?.value  ?? 50;
    const temp = attrs.temperature?.value ?? 50;
    const water = attrs.water?.value      ?? 30;
    const bio  = attrs.biosphere?.value   ?? 10;
    const hostile = bio > 60 && temp < 40;

    const gradeColors = {
      A: ['#4ce9a0', '#1e6040'],
      B: ['#7cf0a0', '#2a5038'],
      C: ['#c8c040', '#604e10'],
      D: ['#c07040', '#502810'],
      F: ['#a02020', '#480808'],
    };
    const [light, dark] = gradeColors[grade] || ['#888', '#444'];

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // 1. Base sphere
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.05, x, y, radius);
    grad.addColorStop(0, light);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    // Seeded LCG for deterministic surface features
    const seed = (planetDesc?.name || 'planet').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = seed || 54321;
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };

    // 2. Water bands (if water > 30)
    if (water > 30) {
      const waterAlpha = Math.min(0.6, water / 100);
      ctx.globalAlpha = waterAlpha;
      const numBands = Math.floor(water / 25);
      for (let i = 0; i < numBands; i++) {
        const bandY = y - radius + rand() * radius * 1.8;
        const bandH = 4 + rand() * 10;
        const r2 = Math.sqrt(Math.max(0, radius * radius - Math.pow(bandY - y, 2)));
        ctx.fillStyle = temp < 40 ? '#5890d0' : '#3070b0';
        ctx.fillRect(x - r2, bandY, r2 * 2, bandH);
      }
      ctx.globalAlpha = 1;
    }

    // 3. Ice caps (temperature < 25)
    if (temp < 25) {
      const capSize = radius * (0.2 + (25 - temp) / 25 * 0.4);
      // North cap
      const iceFade = ctx.createRadialGradient(x, y - radius, 0, x, y - radius, capSize);
      iceFade.addColorStop(0, 'rgba(220,240,255,0.9)');
      iceFade.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = iceFade;
      ctx.fillRect(x - radius, y - radius, radius * 2, capSize);
      // South cap
      const iceFadeS = ctx.createRadialGradient(x, y + radius, 0, x, y + radius, capSize);
      iceFadeS.addColorStop(0, 'rgba(220,240,255,0.9)');
      iceFadeS.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = iceFadeS;
      ctx.fillRect(x - radius, y + radius - capSize, radius * 2, capSize);
    }

    // 4. Biosphere patches (biosphere > 20)
    if (bio > 20) {
      const patchAlpha = Math.min(0.45, bio / 120);
      ctx.globalAlpha = patchAlpha;
      const numPatches = Math.floor(bio / 20);
      for (let i = 0; i < numPatches; i++) {
        const px = x - radius * 0.7 + rand() * radius * 1.4;
        const py = y - radius * 0.7 + rand() * radius * 1.4;
        const pr = 4 + rand() * 10;
        ctx.fillStyle = hostile ? '#60a030' : '#40c840';
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 5. Hostile life tinge (red-orange edge)
    if (hostile) {
      const hostileGrad = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius);
      hostileGrad.addColorStop(0, 'rgba(180,40,20,0)');
      hostileGrad.addColorStop(1, 'rgba(180,40,20,0.28)');
      ctx.fillStyle = hostileGrad;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    // 6. Storm bands (temperature > 75)
    if (temp > 75) {
      ctx.globalAlpha = 0.2 + (temp - 75) / 100;
      for (let i = 0; i < 3; i++) {
        const sy = y - radius * 0.5 + rand() * radius;
        const r2 = Math.sqrt(Math.max(0, radius * radius - Math.pow(sy - y, 2)));
        ctx.strokeStyle = '#d08020';
        ctx.lineWidth = 2 + rand() * 3;
        ctx.beginPath();
        ctx.moveTo(x - r2, sy);
        ctx.lineTo(x + r2, sy + (rand() - 0.5) * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 7. Thin atmo haze (atmosphere < 25)
    if (atm < 25) {
      ctx.fillStyle = 'rgba(100,100,100,0.22)';
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    ctx.restore();

    // 8. Atmosphere glow (outside clip)
    if (atm > 40) {
      const glowAlpha = Math.min(0.4, atm / 180);
      // Parse light hex to rgb for rgba usage
      const lr = parseInt(light.slice(1, 3), 16);
      const lg = parseInt(light.slice(3, 5), 16);
      const lb = parseInt(light.slice(5, 7), 16);
      const glowGrad = ctx.createRadialGradient(x, y, radius * 0.88, x, y, radius * 1.3);
      glowGrad.addColorStop(0, `rgba(${lr},${lg},${lb},${glowAlpha.toFixed(2)})`);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Warp animation ----
  // Plays a ~700ms hyperspace jump animation on the given canvas, then calls onComplete.

  function playWarpAnimation(canvas, onComplete) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const duration = 700;
    const start = performance.now();

    // Pre-generate streak angles and lengths for consistency
    const STREAK_COUNT = 80;
    const streaks = [];
    let s = 99991;
    const r = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = r() * Math.PI * 2;
      const len = 0.2 + r() * 0.8;   // fraction of half-diagonal
      const bright = 0.4 + r() * 0.6;
      streaks.push({ angle, len, bright });
    }
    const halfDiag = Math.sqrt(cx * cx + cy * cy);

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);

      ctx.fillStyle = '#06060f';
      ctx.fillRect(0, 0, w, h);

      if (t < 0.45) {
        // Phase 1: streaks zoom outward
        const phase = t / 0.45;        // 0→1 during first half
        const maxLen = halfDiag * phase;
        const tailFrac = 0.1 + phase * 0.3;

        streaks.forEach(({ angle, len, bright }) => {
          const endDist = halfDiag * len * phase + 10;
          const startDist = Math.max(0, endDist - maxLen * tailFrac);
          const ex = cx + Math.cos(angle) * endDist;
          const ey = cy + Math.sin(angle) * endDist;
          const sx = cx + Math.cos(angle) * startDist;
          const sy = cy + Math.sin(angle) * startDist;
          const grad = ctx.createLinearGradient(sx, sy, ex, ey);
          grad.addColorStop(0, `rgba(200,220,255,0)`);
          grad.addColorStop(1, `rgba(200,220,255,${(bright * phase).toFixed(2)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1 + phase;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        });
      } else {
        // Phase 2: fade to new starfield
        const fadeIn = (t - 0.45) / 0.55;
        ctx.globalAlpha = fadeIn;
        drawStarfield(ctx, w, h, Math.floor(Math.random() * 99999));
        ctx.globalAlpha = 1;
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(frame);
  }

  return {
    loadSprite,
    drawSprite,
    drawStatBar,
    renderToCanvas,
    drawStarfield,
    drawPlanetFallback,
    drawPlanet,
    playWarpAnimation,
  };
})();
