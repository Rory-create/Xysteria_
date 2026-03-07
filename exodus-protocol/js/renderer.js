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

  // ---- Planet pixel art renderer ----
  // Draws a 48×48 pixel-art planet scaled up to the target radius.
  // Six visual types determined by planetary attributes:
  //   volcanic, frozen, ocean, earthlike, barren, rocky

  function drawPlanet(ctx, x, y, radius, planetDesc) {
    const SIZE = 48;
    const cx = SIZE / 2, cy = SIZE / 2;
    const r = SIZE / 2 - 0.5;

    const attrs   = planetDesc?.attributes || {};
    const temp    = attrs.temperature?.value ?? 50;
    const water   = attrs.water?.value       ?? 30;
    const bio     = attrs.biosphere?.value   ?? 10;
    const atm     = attrs.atmosphere?.value  ?? 50;

    // Classify visual type
    let type;
    if (temp > 80)                                  type = 'volcanic';
    else if (temp < 20)                             type = 'frozen';
    else if (water > 65)                            type = 'ocean';
    else if (water > 28 && atm > 30 && bio > 18)   type = 'earthlike';
    else if (atm < 20 || (water < 12 && bio < 10)) type = 'barren';
    else                                             type = 'rocky';

    // Seeded LCG from planet name
    const seed = (planetDesc?.name || 'xp').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let s = (seed + 7777) | 1;
    const rand = () => { s = Math.imul(s, 1664525) + 1013904223 | 0; return (s >>> 0) / 4294967296; };

    // Build three noise layers at different spatial frequencies
    // Fine (SIZE×SIZE), medium (SIZE/3 blocks), coarse (SIZE/6 blocks)
    const fine   = new Float32Array(SIZE * SIZE);
    const medium = new Float32Array(SIZE * SIZE);
    const coarse = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) fine[i] = rand();

    // Blur fine noise into medium (3×3 box) and coarse (6×6 box)
    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        let sm = 0, sc = 0;
        for (let ky = -2; ky <= 2; ky++) for (let kx = -2; kx <= 2; kx++) {
          const idx = ((py + ky + SIZE) % SIZE) * SIZE + ((px + kx + SIZE) % SIZE);
          sm += fine[idx];
        }
        medium[py * SIZE + px] = sm / 25;
        for (let ky = -4; ky <= 4; ky++) for (let kx = -4; kx <= 4; kx++) {
          const idx = ((py + ky + SIZE) % SIZE) * SIZE + ((px + kx + SIZE) % SIZE);
          sc += fine[idx];
        }
        coarse[py * SIZE + px] = sc / 81;
      }
    }

    const buf = new Uint8ClampedArray(SIZE * SIZE * 4);

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const dx = px - cx + 0.5;
        const dy = py - cy + 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= r) continue;

        // Sphere lighting: light source from upper-left
        const nx = dx / r, ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const diffuse = Math.max(0, -nx * 0.42 - ny * 0.42 + nz * 0.80);
        const light = 0.16 + diffuse * 0.84;

        const ni  = py * SIZE + px;
        const f   = fine[ni];
        const m   = medium[ni];
        const c   = coarse[ni];

        let rr = 128, gg = 128, bb = 128;

        switch (type) {
          case 'volcanic': {
            // Dark basalt with glowing lava veins
            const lava = c * c + m * 0.25;
            if (lava > 0.62) {
              const t = Math.min(1, (lava - 0.62) / 0.38);
              rr = Math.round(190 + t * 65);
              gg = Math.round(35 + t * 115);
              bb = Math.round(f * 15);
            } else if (lava > 0.52) {
              // Lava edge glow
              rr = Math.round(90 + f * 50);
              gg = Math.round(20 + f * 20);
              bb = 5;
            } else {
              // Dark volcanic rock
              rr = Math.round(30 + f * 28 + m * 18);
              gg = Math.round(8  + f * 10 + m * 8);
              bb = Math.round(5  + f * 8);
            }
            break;
          }

          case 'frozen': {
            // Icy white-blue with crevasse shadows
            if (c > 0.52) {
              // Ice shadow / crevasse
              rr = Math.round(100 + f * 55 + m * 30);
              gg = Math.round(120 + f * 50 + m * 25);
              bb = Math.round(155 + f * 45 + m * 20);
            } else {
              // Bright ice surface
              rr = Math.round(190 + f * 60 + m * 5);
              gg = Math.round(200 + f * 50 + m * 5);
              bb = Math.round(215 + f * 35 + m * 5);
            }
            // Slight polar brightening at top
            if (dy < -r * 0.5) {
              const pole = (-dy / r - 0.5) / 0.5;
              rr = Math.min(255, Math.round(rr + pole * 30));
              gg = Math.min(255, Math.round(gg + pole * 25));
              bb = Math.min(255, Math.round(bb + pole * 15));
            }
            break;
          }

          case 'ocean': {
            // Deep blue ocean with cloud wisps
            const cloud = m * c;
            if (cloud > 0.38) {
              // Cloud
              rr = Math.round(195 + f * 60);
              gg = Math.round(210 + f * 45);
              bb = Math.round(235 + f * 20);
            } else if (cloud > 0.30) {
              // Cloud fringe
              rr = Math.round(120 + f * 60);
              gg = Math.round(150 + f * 50);
              bb = Math.round(200 + f * 30);
            } else {
              // Ocean — depth variation
              rr = Math.round(8  + m * 28 + f * 18);
              gg = Math.round(55 + m * 40 + f * 30);
              bb = Math.round(130 + m * 60 + f * 35);
            }
            break;
          }

          case 'earthlike': {
            const continent = c + m * 0.45;
            if (continent > 1.05) {
              // Cloud
              rr = Math.round(210 + f * 45); gg = Math.round(220 + f * 35); bb = Math.round(240 + f * 15);
            } else if (continent > 0.68) {
              // Land — greenery, some desert tones
              const green = f * 0.7 + m * 0.3;
              if (green > 0.55) {
                rr = Math.round(40 + green * 50); gg = Math.round(80 + green * 60); bb = Math.round(22 + green * 25);
              } else {
                // Sandy/rocky land
                rr = Math.round(90 + f * 60); gg = Math.round(80 + f * 45); bb = Math.round(50 + f * 30);
              }
            } else {
              // Ocean
              rr = Math.round(10 + m * 22 + f * 18);
              gg = Math.round(60 + m * 38 + f * 28);
              bb = Math.round(135 + m * 50 + f * 35);
            }
            // Ice caps at poles
            const lat = Math.abs(dy) / r;
            if (lat > 0.76) {
              const iceF = Math.min(1, (lat - 0.76) / 0.24);
              rr = Math.round(rr + (215 - rr) * iceF);
              gg = Math.round(gg + (230 - gg) * iceF);
              bb = Math.round(bb + (245 - bb) * iceF);
            }
            break;
          }

          case 'barren': {
            // Grey dust with craters
            const craterEdge = Math.abs(c - 0.5) * 2;
            const craterFloor = craterEdge < 0.12 && f < 0.38;
            const craterRim   = craterEdge > 0.12 && craterEdge < 0.22 && f < 0.45;
            if (craterFloor) {
              rr = Math.round(45 + f * 30); gg = rr - 3; bb = rr - 6;
            } else if (craterRim) {
              rr = Math.round(115 + f * 45); gg = rr - 5; bb = rr - 10;
            } else {
              rr = Math.round(80 + m * 50 + f * 30);
              gg = rr - 5; bb = rr - 12;
            }
            // Slight reddish tinge if very hot and airless
            if (temp > 60) {
              rr = Math.min(255, Math.round(rr + 18));
              gg = Math.max(0, Math.round(gg - 5));
            }
            break;
          }

          default: { // rocky / marginal
            rr = Math.round(62 + c * 48 + f * 22);
            gg = Math.round(52 + c * 38 + f * 18);
            bb = Math.round(40 + c * 30 + f * 12);
            // Sparse vegetation patches
            if (bio > 25 && f > 0.62 && m > 0.55) {
              rr = Math.round(42 + f * 28);
              gg = Math.round(72 + f * 45);
              bb = Math.round(28 + f * 20);
            }
            break;
          }
        }

        // Apply sphere lighting
        rr = Math.min(255, Math.round(rr * light));
        gg = Math.min(255, Math.round(gg * light));
        bb = Math.min(255, Math.round(bb * light));

        // Dark limb at planet edge
        if (dist / r > 0.90) {
          const edgeF = 1 - (dist / r - 0.90) / 0.10;
          rr = Math.round(rr * edgeF);
          gg = Math.round(gg * edgeF);
          bb = Math.round(bb * edgeF);
        }

        const i = (py * SIZE + px) * 4;
        buf[i] = rr; buf[i + 1] = gg; buf[i + 2] = bb; buf[i + 3] = 255;
      }
    }

    // Render to offscreen canvas and scale up (nearest-neighbour = pixel art look)
    const offscreen = document.createElement('canvas');
    offscreen.width = SIZE; offscreen.height = SIZE;
    const oc = offscreen.getContext('2d');
    oc.putImageData(new ImageData(buf, SIZE, SIZE), 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();

    // Atmosphere glow (drawn outside the planet circle)
    if (atm > 35) {
      const glowAlpha = Math.min(0.5, atm / 180);
      const glowPalette = {
        volcanic: '255,90,15',
        frozen:   '160,210,255',
        ocean:    '70,140,255',
        earthlike:'100,185,255',
        barren:   '150,125,100',
        rocky:    '140,130,105',
      };
      const gc = glowPalette[type] || '140,140,140';
      const glowGrad = ctx.createRadialGradient(x, y, radius * 0.90, x, y, radius * 1.40);
      glowGrad.addColorStop(0, `rgba(${gc},${glowAlpha.toFixed(2)})`);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Legacy fallback (kept for compatibility)
  function drawPlanetFallback(ctx, x, y, radius, grade) {
    drawPlanet(ctx, x, y, radius, { grade, attributes: {} });
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
