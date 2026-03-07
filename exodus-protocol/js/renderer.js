// Sprite renderer — loads JSON sprites and draws them on canvas elements.
// Sprites are optional decoration; game is fully playable if sprite files are missing.

const Renderer = (() => {
  const spriteCache = {};  // { path: spriteData | 'loading' | 'error' }

  // ---- Pixel art icon system ----
  // Each icon is drawn at 12×12 and returned as a PNG data URL (cached).

  const _iconCache = new Map();

  // Draw one icon by name onto ctx (12×12 internal pixel grid)
  function _drawIconShape(ctx, name, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const f = (x, y, w, h) => ctx.fillRect(x, y, w, h);

    switch (name) {
      case 'probe': // telescope
        f(0,4,2,4); f(2,3,7,6); f(9,5,3,2); break;

      case 'planets': // 3 dots
        f(1,1,3,3); f(5,4,4,4); f(9,8,2,2); break;

      case 'relic': // 4-point diamond
        f(5,0,2,2); f(3,2,6,2); f(1,4,10,4); f(3,8,6,2); f(5,10,2,2); break;

      case 'food': // wheat stalk
        f(5,0,2,1); f(4,1,4,1); f(5,2,2,8); f(3,4,2,2); f(7,6,2,2); break;

      case 'power': // lightning bolt
        f(7,0,3,1); f(6,1,3,1); f(5,2,3,1); f(4,3,5,1); f(3,4,5,1);
        f(5,5,3,1); f(4,6,3,1); f(3,7,3,1); f(2,8,3,1); break;

      case 'materials': // ore chunk
        f(3,1,6,2); f(1,3,10,4); f(2,7,8,2); f(4,9,4,2); break;

      case 'science': // flask
        f(4,0,4,1); f(5,1,2,4); f(2,5,8,5); f(1,10,10,1); break;

      case 'turns': // hourglass
        f(1,0,10,2); f(2,2,8,1); f(3,3,6,1); f(4,4,4,1); f(4,5,4,1); f(3,6,6,1); f(2,7,8,1); f(1,8,10,2); break;

      case 'globe': // circle with equator line
        f(4,0,4,1); f(2,1,8,1); f(1,2,10,1); f(0,3,12,1); f(0,4,12,2); f(0,6,12,1); f(1,7,10,1); f(2,8,8,1); f(4,9,4,1); break;

      case 'culture': // open book
        f(0,1,1,10); f(1,0,5,1); f(1,10,5,1); f(6,0,1,11);
        f(7,0,4,1); f(7,10,4,1); f(11,1,1,10); break;

      case 'robots_construct': // arm with claw
        f(0,4,7,3); f(7,2,3,2); f(7,7,3,2); f(10,1,2,4); f(10,7,2,4); break;

      case 'robots_maintain': // wrench
        f(0,4,2,2); f(1,2,2,2); f(1,6,2,2); f(2,1,3,1); f(2,8,3,1); f(4,3,1,4);
        f(5,4,6,2); f(10,3,2,4); f(11,2,1,2); f(11,6,1,2); break;

      case 'build': // hammer
        f(0,2,9,4); f(4,6,4,5); break;

      case 'research': // atom — circle center + 2 crossing ellipses (pixel approximation)
        f(4,0,4,1); f(2,1,3,1); f(9,1,1,1);
        f(1,2,2,1); f(9,2,2,1);
        f(0,3,2,1); f(10,3,2,1);
        f(0,4,12,4);
        f(0,7,2,1); f(10,7,2,1);
        f(1,8,2,1); f(9,8,2,1);
        f(2,9,3,1); f(7,9,3,1);
        f(4,10,4,1);
        f(4,4,4,4); // center circle
        break;

      case 'vault': // hexagon outline
        f(3,0,6,1); f(1,1,2,1); f(9,1,2,1); f(0,2,2,1); f(10,2,2,1);
        f(0,3,1,6); f(11,3,1,6);
        f(0,9,2,1); f(10,9,2,1); f(1,10,2,1); f(9,10,2,1); f(3,11,6,1); break;

      case 'back': // left arrow
        f(5,0,1,1); f(4,1,1,2); f(3,2,1,2); f(2,3,1,2); f(1,4,1,2); f(0,5,1,2);
        f(1,6,1,2); f(2,7,1,2); f(3,8,1,2); f(4,9,1,2); f(5,10,1,1);
        f(3,5,9,2); break;

      case 'star4': // 4-point star
        f(5,0,2,12); f(0,5,12,2); break;

      case 'warning_tri': // triangle + !
        f(5,0,2,2); f(4,2,4,2); f(3,4,6,2); f(2,6,8,2); f(1,8,10,2); f(0,10,12,2);
        f(5,4,2,4); f(5,9,2,1); break;

      case 'diamond_mix': // filled diamond
        f(5,0,2,2); f(3,2,6,2); f(1,4,10,4); f(3,8,6,2); f(5,10,2,2); break;

      case 'check': // checkmark
        f(0,6,2,2); f(2,8,2,2); f(4,10,2,2); f(5,8,2,2); f(7,6,2,2); f(9,4,2,2); f(11,2,1,2); break;

      case 'house': // house silhouette
        f(5,0,2,1); f(4,1,4,1); f(3,2,6,1); f(2,3,8,1); f(1,4,10,1);
        f(1,5,10,6); f(4,7,4,4); break;

      case 'water': // teardrop
        f(5,0,2,2); f(4,2,4,2); f(3,4,6,2); f(2,6,8,2); f(2,8,8,2); f(3,10,6,2); break;

      case 'sun': // circle + 4 rays
        f(5,0,2,2); f(5,10,2,2); f(0,5,2,2); f(10,5,2,2);
        f(4,3,4,6); f(3,4,6,4); break; // circle body

      case 'shield': // shield shape
        f(1,0,10,1); f(0,1,12,5); f(1,6,10,2); f(2,8,8,2); f(4,10,4,1); f(5,11,2,1); break;

      case 'atom': // same as research but simpler
        f(4,4,4,4); f(0,5,12,2); f(3,0,1,12); f(5,0,1,12); break;

      case 'robot': // robot face
        f(1,0,10,1); f(0,1,12,8); f(1,9,10,1); f(2,2,3,3); f(7,2,3,3); f(1,6,10,2); break;

      case 'brain': // lumpy organic shape
        f(3,0,6,1); f(1,1,4,2); f(6,1,4,2); f(0,3,5,3); f(7,3,5,3); f(1,6,10,3); f(3,9,6,2); break;

      case 'water_drop': // alias
        f(5,0,2,2); f(4,2,4,2); f(3,4,6,2); f(2,6,8,2); f(2,8,8,2); f(3,10,6,2); break;

      default: // fallback: small square
        f(2,2,8,8); break;
    }
  }

  function getIcon(name, color) {
    const col = color || '#dcdcf0';
    const key = name + '|' + col;
    if (_iconCache.has(key)) return _iconCache.get(key);

    const SIZE = 12;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    _drawIconShape(ctx, name, col);
    const url = canvas.toDataURL();
    _iconCache.set(key, url);
    return url;
  }

  // ---- Event art renderer ----
  // Draws a procedural scene into the planet panel area during Phase 1 jumps.

  function drawEventArt(ctx, w, h, eventId, seed) {
    // LCG seeded random
    let s = (seed || 42) | 1;
    const rand = () => { s = Math.imul(s, 1664525) + 1013904223 | 0; return (s >>> 0) / 4294967296; };

    // Base: dark starfield background
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, w, h);

    // Draw base stars
    const starCount = Math.floor(w * h / 600);
    for (let i = 0; i < starCount; i++) {
      const sx = rand() * w;
      const sy = rand() * h;
      const br = 0.2 + rand() * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${br.toFixed(2)})`;
      ctx.fillRect(sx, sy, rand() > 0.93 ? 2 : 1, rand() > 0.93 ? 2 : 1);
    }

    switch (eventId) {
      case 'asteroid_field': {
        const count = 6 + Math.floor(rand() * 8);
        for (let i = 0; i < count; i++) {
          const ax = rand() * w;
          const ay = rand() * h;
          const radius = 8 + rand() * 22;
          const sides = 5 + Math.floor(rand() * 4);
          const gray  = Math.round(60 + rand() * 70);
          const warm  = Math.round(rand() * 30);
          ctx.fillStyle = `rgb(${gray + warm},${gray},${Math.max(0,gray-10)})`;
          ctx.beginPath();
          for (let v = 0; v < sides; v++) {
            const angle = (v / sides) * Math.PI * 2 + rand() * 0.5;
            const r2 = radius * (0.6 + rand() * 0.4);
            const vx = ax + Math.cos(angle) * r2;
            const vy = ay + Math.sin(angle) * r2;
            if (v === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
          }
          ctx.closePath();
          ctx.fill();
          // Dark crater hint
          ctx.fillStyle = `rgba(0,0,0,0.3)`;
          ctx.beginPath();
          ctx.arc(ax - radius * 0.2, ay - radius * 0.2, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'radiation_storm': {
        // Purple-green wave bands from upper-left
        const cx = -w * 0.3, cy = -h * 0.3;
        for (let band = 0; band < 12; band++) {
          const r0 = (w * 0.3) + band * (w * 0.12);
          const alpha = 0.06 + rand() * 0.10;
          const green = band % 2 === 0;
          const col = green ? `rgba(60,220,80,${alpha})` : `rgba(140,40,220,${alpha})`;
          ctx.strokeStyle = col;
          ctx.lineWidth = 4 + rand() * 8;
          ctx.beginPath();
          ctx.arc(cx, cy, r0, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Bright source flare at corner
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
        grad.addColorStop(0, 'rgba(200,255,180,0.25)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }

      case 'solar_flare': {
        // Star at top-left corner + eruption arc
        const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.6);
        starGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
        starGrad.addColorStop(0.2, 'rgba(255,160,30,0.5)');
        starGrad.addColorStop(0.5, 'rgba(255,80,10,0.2)');
        starGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = starGrad;
        ctx.fillRect(0, 0, w, h);

        // Eruption arcs
        for (let arc = 0; arc < 4; arc++) {
          const angle = 0.3 + arc * 0.25 + rand() * 0.2;
          const len   = w * (0.4 + rand() * 0.4);
          ctx.strokeStyle = `rgba(255,${120 + Math.floor(rand() * 100)},20,0.5)`;
          ctx.lineWidth = 3 + rand() * 5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const cx2 = Math.cos(angle) * len * 0.5 + (rand() - 0.5) * 50;
          const cy2 = Math.sin(angle) * len * 0.5 + (rand() - 0.5) * 50;
          ctx.quadraticCurveTo(cx2, cy2, Math.cos(angle) * len, Math.sin(angle) * len);
          ctx.stroke();
        }
        break;
      }

      case 'cryo_malfunction': {
        // Blue frost patterns + cryo pod silhouettes
        // Pod shapes along bottom
        const podW = 24, podH = 40;
        const podCount = Math.floor(w / (podW + 6));
        for (let p = 0; p < podCount; p++) {
          const px2 = p * (podW + 6) + 8;
          const py2 = h - podH - 10;
          const broken = rand() < 0.35;
          ctx.fillStyle = broken ? '#1a0a22' : '#0a1a2e';
          ctx.fillRect(px2, py2, podW, podH);
          ctx.strokeStyle = broken ? '#e94560' : '#2a4a8a';
          ctx.lineWidth = 1;
          ctx.strokeRect(px2, py2, podW, podH);
          // Pod window
          ctx.fillStyle = broken ? 'rgba(233,69,96,0.4)' : 'rgba(80,140,220,0.3)';
          ctx.fillRect(px2 + 4, py2 + 6, podW - 8, podH * 0.5);
        }

        // Frost crystal lines from top
        ctx.strokeStyle = 'rgba(140,190,255,0.4)';
        for (let fr = 0; fr < 20; fr++) {
          const fx = rand() * w;
          const len2 = 15 + rand() * 40;
          const angle2 = (Math.PI * 0.5) + (rand() - 0.5) * 1.2;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fx, 0);
          ctx.lineTo(fx + Math.cos(angle2) * len2, Math.sin(angle2) * len2);
          ctx.stroke();
          // Branch
          const blen = len2 * 0.4;
          const bang = angle2 + 0.6;
          ctx.beginPath();
          ctx.moveTo(fx + Math.cos(angle2) * len2 * 0.5, Math.sin(angle2) * len2 * 0.5);
          ctx.lineTo(fx + Math.cos(angle2) * len2 * 0.5 + Math.cos(bang) * blen,
                     Math.sin(angle2) * len2 * 0.5 + Math.sin(bang) * blen);
          ctx.stroke();
        }
        break;
      }

      case 'cultural_schism': {
        // Warm left half, cool right half, dividing line
        const leftGrad = ctx.createLinearGradient(0, 0, w * 0.5, 0);
        leftGrad.addColorStop(0, 'rgba(180,60,20,0.25)');
        leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, w * 0.5, h);

        const rightGrad = ctx.createLinearGradient(w * 0.5, 0, w, 0);
        rightGrad.addColorStop(0, 'rgba(0,0,0,0)');
        rightGrad.addColorStop(1, 'rgba(20,60,200,0.25)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(w * 0.5, 0, w * 0.5, h);

        // Dividing line
        ctx.strokeStyle = 'rgba(200,200,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Scattered data fragments
        for (let d = 0; d < 12; d++) {
          const dx = rand() * w;
          const dy = rand() * h;
          const dw2 = 8 + rand() * 20;
          const dh2 = 4 + rand() * 10;
          const warm2 = dx < w * 0.5;
          ctx.fillStyle = warm2 ? 'rgba(220,100,40,0.3)' : 'rgba(60,100,220,0.3)';
          ctx.fillRect(dx, dy, dw2, dh2);
        }
        break;
      }

      case 'gravitational_anomaly': {
        // Concentric distortion rings around off-center point
        const cx2 = w * 0.6, cy2 = h * 0.4;
        for (let ring = 1; ring <= 8; ring++) {
          const r2 = ring * (Math.min(w, h) * 0.12);
          const alpha2 = 0.05 + (0.15 / ring);
          ctx.strokeStyle = `rgba(140,160,255,${alpha2.toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx2, cy2, r2, r2 * 0.6, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Bent star trails
        for (let st = 0; st < 8; st++) {
          const startX = rand() * w;
          const startY = rand() * h;
          const alpha3 = 0.1 + rand() * 0.2;
          ctx.strokeStyle = `rgba(200,210,255,${alpha3.toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          // Bend toward anomaly center
          const midX = (startX + cx2) * 0.5 + (rand() - 0.5) * 20;
          const midY = (startY + cy2) * 0.5 + (rand() - 0.5) * 20;
          ctx.quadraticCurveTo(midX, midY, cx2 + (rand()-0.5)*30, cy2 + (rand()-0.5)*30);
          ctx.stroke();
        }
        break;
      }

      case 'relic_signal': {
        // Geometric alien glyph centered
        const cx3 = w / 2, cy3 = h / 2;
        const gsize = Math.min(w, h) * 0.3;

        // Outer glow
        const gGrad = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, gsize * 1.5);
        gGrad.addColorStop(0, 'rgba(100,255,180,0.15)');
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, 0, w, h);

        // Hexagon outer
        ctx.strokeStyle = 'rgba(100,255,180,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let v = 0; v < 6; v++) {
          const angle = (v / 6) * Math.PI * 2 - Math.PI / 6;
          const vx = cx3 + Math.cos(angle) * gsize;
          const vy = cy3 + Math.sin(angle) * gsize;
          if (v === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner triangle
        ctx.strokeStyle = 'rgba(180,255,220,0.6)';
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const angle = (v / 3) * Math.PI * 2 - Math.PI / 2;
          const vx = cx3 + Math.cos(angle) * gsize * 0.5;
          const vy = cy3 + Math.sin(angle) * gsize * 0.5;
          if (v === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();

        // Center point
        ctx.fillStyle = 'rgba(200,255,230,0.8)';
        ctx.beginPath();
        ctx.arc(cx3, cy3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Radiating line spokes
        ctx.strokeStyle = 'rgba(100,255,180,0.2)';
        ctx.lineWidth = 1;
        for (let sp = 0; sp < 12; sp++) {
          const angle = (sp / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx3, cy3);
          ctx.lineTo(cx3 + Math.cos(angle) * gsize * 1.4, cy3 + Math.sin(angle) * gsize * 1.4);
          ctx.stroke();
        }
        break;
      }

      case 'systems_failure': {
        // Red warning grid + sparks
        // Tint background red
        ctx.fillStyle = 'rgba(100,10,10,0.4)';
        ctx.fillRect(0, 0, w, h);

        // Warning grid
        ctx.strokeStyle = 'rgba(200,40,40,0.15)';
        ctx.lineWidth = 1;
        const gridStep = 18;
        for (let gx = 0; gx < w; gx += gridStep) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += gridStep) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }

        // Spark streaks
        for (let sp = 0; sp < 16; sp++) {
          const sx = rand() * w;
          const sy = rand() * h;
          const sl = 10 + rand() * 40;
          const angle = rand() * Math.PI * 2;
          const brightness = 150 + Math.floor(rand() * 100);
          ctx.strokeStyle = `rgba(${brightness},${Math.floor(brightness*0.3)},10,0.7)`;
          ctx.lineWidth = 1 + rand() * 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(angle) * sl, sy + Math.sin(angle) * sl);
          ctx.stroke();
        }

        // Warning text-like rectangles (simulate alert bars)
        for (let al = 0; al < 3; al++) {
          const ay2 = h * (0.2 + al * 0.25);
          ctx.fillStyle = 'rgba(200,20,20,0.2)';
          ctx.fillRect(10, ay2, w - 20, 8);
          ctx.fillStyle = 'rgba(255,60,60,0.5)';
          ctx.fillRect(10, ay2, (w - 20) * (0.3 + rand() * 0.6), 8);
        }
        break;
      }

      default: // peaceful_jump / null — clean starfield already drawn above
        break;
    }
  }

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
    getIcon,
    drawEventArt,
  };
})();
