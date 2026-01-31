// hearts-canvas.js
// Big + small artistic hearts floating around, clickable + draggable + throwable.
// Smooth + performance-friendly: Path2D cached, DPR capped, no blur filters.

(() => {
  const canvas = document.getElementById("heartCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  // ====== Performance knobs ======
  const dpr = 1; // keep at 1 for stable FPS on most machines
  const BIG_COUNT = 7;
  const SMALL_COUNT = 15;

  // ====== Precompute heart shape once (massive perf win) ======
  const heartPath = new Path2D();
  for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.08) {
    const px = 16 * Math.pow(Math.sin(t), 3);
    const py =
      -(13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t));
    if (t === 0) heartPath.moveTo(px, py);
    else heartPath.lineTo(px, py);
  }
  heartPath.closePath();

  let w = 0,
    h = 0;

  const hearts = [];
  const particles = []; // pop burst particles
const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
window.addEventListener("mousemove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
window.addEventListener("touchmove", (e) => {
  const t = e.touches?.[0]; if (!t) return;
  pointer.x = t.clientX; pointer.y = t.clientY;
}, { passive: true });

// random behavior tuning
const POP_CHANCE = 0.45;   // 45% pop, 55% sticky (adjust to taste)
const STICK_MS = 500;     // how long it sticks to cursor


  // Drag state
  // { i, ox, oy, lastX, lastY, lastT }
  let dragging = null;

  // ---------- Helpers ----------
  const rand = (min, max) => min + Math.random() * (max - min);

  function resize() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeart(x, y, size, rot, fillStyle, strokeStyle, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    const s = size / 32;
    ctx.scale(s, s);

    ctx.fillStyle = fillStyle;
    ctx.fill(heartPath);

    if (strokeStyle) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke(heartPath);
    }

    ctx.restore();
  }

  function makeHeart(kind) {
    const isBig = kind === "big";
    const size = isBig ? rand(90, 210) : rand(28, 60);
    const speed = isBig ? rand(0.25, 0.85) : rand(0.5, 1.4);
    const hueShift = rand(-10, 12);

    const fill = `hsla(${330 + hueShift}, 92%, ${
      isBig ? rand(72, 86) : rand(70, 84)
    }%, ${isBig ? rand(0.33, 0.58) : rand(0.22, 0.42)})`;

    const stroke = `hsla(${330 + hueShift}, 95%, 55%, ${
      isBig ? 0.30 : 0.18
    })`;

    return {
      kind,
      x: rand(size, w - size),
      y: rand(size, h - size),
      vx: rand(-1, 1) * speed,
      vy: rand(-1, 1) * speed,
      size,
      rot: rand(-0.35, 0.35),
      vr: rand(-0.003, 0.003),
      fill,
      stroke,
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: isBig ? rand(0.006, 0.012) : rand(0.01, 0.018),
      dragFriction: 1,
    };
  }

  function init() {
    hearts.length = 0;
    for (let i = 0; i < BIG_COUNT; i++) hearts.push(makeHeart("big"));
    for (let i = 0; i < SMALL_COUNT; i++) hearts.push(makeHeart("small"));
  }

  function bounceWalls(hh) {
    const pad = hh.size * 0.52;
    if (hh.x < pad) {
      hh.x = pad;
      hh.vx *= -1;
    }
    if (hh.x > w - pad) {
      hh.x = w - pad;
      hh.vx *= -1;
    }
    if (hh.y < pad) {
      hh.y = pad;
      hh.vy *= -1;
    }
    if (hh.y > h - pad) {
      hh.y = h - pad;
      hh.vy *= -1;
    }
  }

  // ---------- Pointer / Drag ----------
  function pointerPosFromEvent(e) {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function findHeartAt(x, y) {
    for (let i = hearts.length - 1; i >= 0; i--) {
      const hh = hearts[i];
      const r = hh.size * 0.55;
      const dx = x - hh.x;
      const dy = y - hh.y;
      if (dx * dx + dy * dy <= r * r) return i;
    }
    return -1;
  }

  function onDown(e) {
    const p = pointerPosFromEvent(e);
    const idx = findHeartAt(p.x, p.y);
    if (idx === -1) return;
  
    // random action on click
    if (Math.random() < POP_CHANCE) {
      popHeartAtIndex(idx);
      e.preventDefault();
      return;
    } else {
      stickHeartAtIndex(idx);
      // do not return; allow drag if the user actually drags
    }
  
    // Start dragging as usual (so click+drag still works)
    const hh = hearts[idx];
  
    hh.vx *= 0.6;
    hh.vy *= 0.6;
    hh.vr *= 0.6;
  
    dragging = {
      i: idx,
      ox: hh.x - p.x,
      oy: hh.y - p.y,
      lastX: p.x,
      lastY: p.y,
      lastT: performance.now(),
    };
  
    // bring grabbed heart to front
    hearts.splice(idx, 1);
    hearts.push(hh);
    dragging.i = hearts.length - 1;
  
    e.preventDefault();
  }
  

  function onMove(e) {
    if (!dragging) return;

    const p = pointerPosFromEvent(e);
    const hh = hearts[dragging.i];

    // follow pointer
    hh.x = p.x + dragging.ox;
    hh.y = p.y + dragging.oy;

    // compute throw velocity
    const now = performance.now();
    const dt = Math.max(1, now - dragging.lastT);

    hh.vx = ((p.x - dragging.lastX) / dt) * 16;
    hh.vy = ((p.y - dragging.lastY) / dt) * 16;

    dragging.lastX = p.x;
    dragging.lastY = p.y;
    dragging.lastT = now;

    e.preventDefault();
  }

  function onUp() {
    if (dragging) {
      const hh = hearts[dragging.i];
      // keep extra friction briefly after release
      hh.dragFriction = 0.90;
    }
    dragging = null;
  }
  function spawnPopParticles(x, y, colorHint) {
    // A realistic pop burst: many tiny hearts/dots with gravity + drag
    const count = 20 + Math.floor(Math.random() * 18);
  
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2.2 + Math.random() * 5.0;
  
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        life: 520 + Math.random() * 420,    // ms
        age: 0,
        size: 6 + Math.random() * 10,
        rot: (Math.random() - 0.5) * 1.2,
        vr: (Math.random() - 0.5) * 0.08,
        color: colorHint || "rgba(255,70,160,0.9)",
        kind: Math.random() < 0.55 ? "heart" : "dot"
      });
    }
  }
  
  function popHeartAtIndex(idx) {
    const hh = hearts[idx];
    spawnPopParticles(hh.x, hh.y, hh.fill);
  
    hearts.splice(idx, 1);
  
    // spawn a replacement heart (bias big)
    const kind = Math.random() < 0.45 ? "big" : "small"; // 45% big
    hearts.push(makeHeart(kind));
  }
  
  
  function stickHeartAtIndex(idx) {
    const hh = hearts[idx];
    hh.stickUntil = performance.now() + STICK_MS;
    hh.stickStrength = hh.kind === "big" ? 0.18 : 0.24; // follow speed factor
  }
  

  // ---------- Animation Loop ----------
  function step() {
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.filter = "none";

    for (const hh of hearts) {
      hh.pulse += hh.pulseSpeed;

      const now = performance.now();
      const isDraggingThis = dragging && hearts[dragging.i] === hh;

      if (!isDraggingThis && hh.stickUntil && now < hh.stickUntil) {
        // Smoothly follow pointer (like magnet)
        const dx = pointer.x - hh.x;
        const dy = pointer.y - hh.y;

        const s = hh.stickStrength || 0.22;
        hh.vx += dx * s * 0.02;
        hh.vy += dy * s * 0.02;

        // cute little "cling wobble"
        hh.rot += (Math.random() - 0.5) * 0.004;
      } else if (hh.stickUntil && now >= hh.stickUntil) {
        hh.stickUntil = 0;
      }

      if (!isDraggingThis) {
        // friction
        const baseFriction = 0.995;

        // apply extra drag friction if present
        const f = hh.dragFriction ?? 1;
        hh.vx *= baseFriction * f;
        hh.vy *= baseFriction * f;

        // slowly relax drag friction back to normal
        hh.dragFriction += (1 - hh.dragFriction) * 0.04;

        // tiny wander keeps motion alive
        hh.vx += (Math.random() - 0.5) * 0.006;
        hh.vy += (Math.random() - 0.5) * 0.006;

        // mild separation so hearts don’t stack
        for (const other of hearts) {
          if (other === hh) continue;
          const ox = hh.x - other.x;
          const oy = hh.y - other.y;
          const d2 = ox * ox + oy * oy;
          if (d2 > 0 && d2 < 900) {
            const inv = 1 / Math.sqrt(d2);
            hh.vx += ox * inv * 0.002;
            hh.vy += oy * inv * 0.002;
          }
        }

        // update positions
        hh.x += hh.vx;
        hh.y += hh.vy;

        // bounce
        bounceWalls(hh);

        // rotate
        hh.rot += hh.vr;
      }

      const pulse =
        1 + Math.sin(hh.pulse) * (hh.kind === "big" ? 0.04 : 0.06);

      drawHeart(hh.x, hh.y, hh.size * pulse, hh.rot, hh.fill, hh.stroke, 1);
    }
    // ----- POP particles -----
const dt = 16; // approx frame ms; keep simple + fast
for (let i = particles.length - 1; i >= 0; i--) {
  const p = particles[i];
  p.age += dt;

  // physics: drag + gravity
  p.vx *= 0.985;
  p.vy *= 0.985;
  p.vy += 0.10;  // gravity
  p.x += p.vx;
  p.y += p.vy;
  p.rot += p.vr;

  // fade out
  const t = p.age / p.life;
  const alpha = Math.max(0, 1 - t);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (p.kind === "dot") {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  } else {
    // tiny heart particle using the same heartPath
    const size = p.size;
    drawHeart(p.x, p.y, size, p.rot, p.color, null, alpha);
  }
  ctx.restore();

  if (p.age >= p.life) particles.splice(i, 1);
}


    ctx.restore();
    requestAnimationFrame(step);
  }

  // ----- Start -----
  resize();
  init();
  step();

  // IMPORTANT: canvas must be clickable (pointer-events:auto in CSS)
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  canvas.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onUp);

  window.addEventListener(
    "resize",
    () => {
      resize();
      init();
    },
    { passive: true }
  );
})();
