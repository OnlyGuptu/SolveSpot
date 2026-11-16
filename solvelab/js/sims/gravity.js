(function () {
  "use strict";

  const G_CONST = 1800; // Simulation gravitational constant (px^3 / (M * s^2))
  const SOFTENING = 14;

  function buildSystem(mode, state) {
    const p = state.params;
    const mStar = p.starMass;
    const mPlanet = p.planetMass * 0.015;
    const vMult = p.speedFactor;
    const bodies = [];

    if (mode === "sun_earth") {
      const r = 155;
      const vOrb = Math.sqrt((G_CONST * mStar) / r) * vMult;
      bodies.push({ name: "Star", mass: mStar, x: 0, y: 0, vx: 0, vy: 0, r: 22, color: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)", trail: [], isStar: true });
      bodies.push({ name: "Planet", mass: mPlanet, x: r, y: 0, vx: 0, vy: vOrb, r: 9, color: "#38bdf8", glow: "rgba(56, 189, 248, 0.35)", trail: [], isPlanet: true });
    } else if (mode === "sun_earth_moon") {
      const rE = 165;
      const vE = Math.sqrt((G_CONST * mStar) / rE) * vMult;
      const eMass = Math.max(0.04, p.planetMass * 0.04);
      const rM = 28;
      const vM = Math.sqrt((G_CONST * eMass) / rM);
      bodies.push({ name: "Star", mass: mStar, x: 0, y: 0, vx: 0, vy: 0, r: 22, color: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)", trail: [], isStar: true });
      bodies.push({ name: "Earth", mass: eMass, x: rE, y: 0, vx: 0, vy: vE, r: 10, color: "#38bdf8", glow: "rgba(56, 189, 248, 0.35)", trail: [], isPlanet: true });
      bodies.push({ name: "Moon", mass: 0.001, x: rE + rM, y: 0, vx: 0, vy: vE + vM, r: 4.5, color: "#cbd5e1", trail: [] });
    } else if (mode === "binary") {
      const d = 62;
      const m1 = 0.9 * mStar;
      const m2 = 0.9 * mStar;
      const vStar = Math.sqrt((G_CONST * m2) / (4 * d));
      const rP = 195;
      const vP = Math.sqrt((G_CONST * (m1 + m2)) / rP) * vMult;
      bodies.push({ name: "Star A", mass: m1, x: -d, y: 0, vx: 0, vy: -vStar, r: 17, color: "#fbbf24", glow: "rgba(251, 191, 36, 0.35)", trail: [], isStar: true });
      bodies.push({ name: "Star B", mass: m2, x: d, y: 0, vx: 0, vy: vStar, r: 16, color: "#f97316", glow: "rgba(249, 115, 22, 0.35)", trail: [] });
      bodies.push({ name: "Exoplanet", mass: mPlanet, x: rP, y: 0, vx: 0, vy: vP, r: 8.5, color: "#34d399", trail: [], isPlanet: true });
    } else if (mode === "comet") {
      const r = 210;
      const vCirc = Math.sqrt((G_CONST * mStar) / r);
      bodies.push({ name: "Star", mass: mStar, x: 0, y: 0, vx: 0, vy: 0, r: 22, color: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)", trail: [], isStar: true });
      bodies.push({ name: "Planet", mass: mPlanet, x: 0, y: -125, vx: Math.sqrt((G_CONST * mStar) / 125), vy: 0, r: 9, color: "#38bdf8", trail: [], isPlanet: true });
      bodies.push({ name: "Comet", mass: 0.002, x: r, y: -20, vx: -0.22 * vCirc * vMult, vy: 0.56 * vCirc * vMult, r: 5.5, color: "#a78bfa", trail: [] });
    } else {
      // 4-body symmetric dance
      const r = 130;
      const m = 0.55 * mStar;
      const v = Math.sqrt((G_CONST * m * 0.95) / r) * vMult;
      const cols = ["#fbbf24", "#38bdf8", "#34d399", "#f472b6"];
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        bodies.push({
          name: `Body ${i + 1}`,
          mass: m,
          x: r * Math.cos(ang),
          y: r * Math.sin(ang),
          vx: -v * Math.sin(ang),
          vy: v * Math.cos(ang),
          r: 12,
          color: cols[i],
          trail: []
        });
      }
    }
    return bodies;
  }

  function computeAccelerations(bodies) {
    const n = bodies.length;
    const ax = new Float64Array(n);
    const ay = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = bodies[j].x - bodies[i].x;
        const dy = bodies[j].y - bodies[i].y;
        const distSq = dx * dx + dy * dy + SOFTENING * SOFTENING;
        const dist = Math.sqrt(distSq);
        const fOverDist = G_CONST / (distSq * dist);

        ax[i] += fOverDist * bodies[j].mass * dx;
        ay[i] += fOverDist * bodies[j].mass * dy;
        ax[j] -= fOverDist * bodies[i].mass * dx;
        ay[j] -= fOverDist * bodies[i].mass * dy;
      }
    }
    return { ax, ay };
  }

  SimLab.register({
    id: "gravity",
    title: "Gravity & Orbits (N-Body Lab)",
    category: "physics",
    subtitle: "Kepler's Laws, Binary Stars & Gravitational Slingshots",
    icon: "🪐",
    color: "#fbbf24",
    description:
      "Explore Newton's law of universal gravitation using Velocity Verlet integration. Watch orbital speed change at perihelion vs. aphelion or fling new asteroids into orbit.",
    tags: ["Gravitation", "Kepler", "Verlet", "N-Body"],
    hint: "Drag any planet/star to reposition it, or click-and-drag empty space to launch an asteroid!",
    presets: [
      { label: "Sun + Earth", params: { presetMode: "sun_earth", starMass: 1.0, planetMass: 1.0, speedFactor: 1.0 } },
      { label: "Sun + Earth + Moon", params: { presetMode: "sun_earth_moon", starMass: 1.0, planetMass: 1.5, speedFactor: 1.0 } },
      { label: "Binary Stars", params: { presetMode: "binary", starMass: 1.0, planetMass: 1.0, speedFactor: 1.0 } },
      { label: "Comet Slingshot", params: { presetMode: "comet", starMass: 1.0, planetMass: 1.0, speedFactor: 1.0 } },
      { label: "4-Body Dance", params: { presetMode: "four_body", starMass: 1.0, planetMass: 1.0, speedFactor: 1.0 } }
    ],
    controls: [
      {
        type: "select",
        key: "presetMode",
        label: "Orbital System",
        default: "sun_earth_moon",
        options: [
          { value: "sun_earth", label: "Sun + Earth" },
          { value: "sun_earth_moon", label: "Sun + Earth + Moon" },
          { value: "binary", label: "Binary Stars + Planet" },
          { value: "comet", label: "Comet Slingshot" },
          { value: "four_body", label: "4-Body Dance" }
        ]
      },
      { type: "range", key: "starMass", label: "Central Star Mass", min: 0.5, max: 3.0, step: 0.1, default: 1.0, unit: " M☉" },
      { type: "range", key: "planetMass", label: "Planet Mass", min: 0.2, max: 5.0, step: 0.1, default: 1.2, unit: " M⊕" },
      { type: "range", key: "speedFactor", label: "Initial Speed Factor", min: 0.5, max: 1.5, step: 0.05, default: 1.0, unit: "×" },
      { type: "checkbox", key: "showForce", label: "Gravity Force Vectors", default: true },
      { type: "checkbox", key: "showVel", label: "Velocity Vectors", default: true },
      { type: "checkbox", key: "showTrails", label: "Orbital Trails", default: true },
      { type: "checkbox", key: "showGrid", label: "Spacetime Gravity Grid", default: true }
    ],
    theory: {
      summary:
        "Every two masses attract with force F = G m₁ m₂ / r². Under an inverse-square force, bound orbits are ellipses (Kepler's 1st Law), sweep equal areas in equal times (2nd Law), and satisfy T² ∝ a³ (3rd Law). Velocity Verlet integration preserves orbital energy over long runs.",
      formulas: [
        "F = G m₁ m₂ / r²",
        "v_circular = √(G M / r)",
        "v_escape = √(2 G M / r) = √2 · v_circular",
        "T² = (4π² / G M) a³"
      ],
      challenges: [
        "Challenge 1: Set Sun + Earth, double Star Mass from 1.0 to 2.0 M☉ using Initial Speed 1.0×, or adjust Speed Factor to 1.41× (√2) to find escape velocity.",
        "Challenge 2: Turn on Gravity Force Vectors in Comet Slingshot mode and observe how F grows dramatically near perihelion.",
        "Challenge 3: Click and drag in empty space to launch a custom retrograde asteroid between the binary stars."
      ]
    },

    init(state) {
      state.lastMode = state.params.presetMode;
      state.lastStarMass = state.params.starMass;
      state.lastPlanetMass = state.params.planetMass;
      state.lastSpeedFactor = state.params.speedFactor;
      state.bodies = buildSystem(state.params.presetMode, state);
      state.lastAcc = computeAccelerations(state.bodies);
      state.dragBody = null;
      state.launchDrag = null;
      state.trailAccum = 0;
    },

    update(state, dt) {
      const p = state.params;
      if (state.lastMode !== p.presetMode || state.lastSpeedFactor !== p.speedFactor) {
        this.init(state);
        return;
      }

      // Live star/planet mass adjustments
      if (state.lastStarMass !== p.starMass) {
        for (const b of state.bodies) {
          if (b.isStar) b.mass = p.starMass;
        }
        state.lastStarMass = p.starMass;
      }
      if (state.lastPlanetMass !== p.planetMass) {
        for (const b of state.bodies) {
          if (b.isPlanet) b.mass = p.planetMass * 0.015;
        }
        state.lastPlanetMass = p.planetMass;
      }

      const substeps = 4;
      const h = dt / substeps;
      for (let s = 0; s < substeps; s++) {
        const acc0 = computeAccelerations(state.bodies);
        for (let i = 0; i < state.bodies.length; i++) {
          const b = state.bodies[i];
          if (state.dragBody === b) continue;
          b.x += b.vx * h + 0.5 * acc0.ax[i] * h * h;
          b.y += b.vy * h + 0.5 * acc0.ay[i] * h * h;
        }
        const acc1 = computeAccelerations(state.bodies);
        for (let i = 0; i < state.bodies.length; i++) {
          const b = state.bodies[i];
          if (state.dragBody === b) continue;
          b.vx += 0.5 * (acc0.ax[i] + acc1.ax[i]) * h;
          b.vy += 0.5 * (acc0.ay[i] + acc1.ay[i]) * h;
        }
        state.lastAcc = acc1;
      }

      state.trailAccum += dt;
      if (state.trailAccum >= 0.03) {
        state.trailAccum = 0;
        for (const b of state.bodies) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 260) b.trail.shift();
        }
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const cx = w / 2;
      const cy = h / 2;
      const p = state.params;

      ctx.fillStyle = "#040814";
      ctx.fillRect(0, 0, w, h);

      // Background stars (deterministic)
      ctx.fillStyle = "rgba(226, 232, 240, 0.35)";
      for (let i = 0; i < 65; i++) {
        const sx = ((i * 197 + 41) % 997) / 997 * w;
        const sy = ((i * 313 + 73) % 991) / 991 * h;
        ctx.fillRect(sx, sy, (i % 2) + 1, (i % 2) + 1);
      }

      // Spacetime Gravity Warped Grid
      if (p.showGrid) {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
        ctx.lineWidth = 1;
        const step = 42;
        const warpPoint = (wx, wy) => {
          let dxSum = 0;
          let dySum = 0;
          for (const b of state.bodies) {
            if (b.mass < 0.1) continue;
            const dx = b.x - wx;
            const dy = b.y - wy;
            const dist = Math.hypot(dx, dy) + 28;
            const pull = Math.min(24, (b.mass * 420) / (dist * dist));
            dxSum += (dx / dist) * pull;
            dySum += (dy / dist) * pull;
          }
          return { x: cx + wx + dxSum, y: cy + wy + dySum };
        };

        for (let gx = -w / 2; gx <= w / 2; gx += step) {
          ctx.beginPath();
          for (let gy = -h / 2; gy <= h / 2; gy += 22) {
            const pt = warpPoint(gx, gy);
            if (gy === -h / 2) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
        for (let gy = -h / 2; gy <= h / 2; gy += step) {
          ctx.beginPath();
          for (let gx = -w / 2; gx <= w / 2; gx += 22) {
            const pt = warpPoint(gx, gy);
            if (gx === -w / 2) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // Trails
      if (p.showTrails) {
        for (const b of state.bodies) {
          if (b.trail.length < 2) continue;
          ctx.save();
          ctx.strokeStyle = b.color;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          b.trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(cx + pt.x, cy + pt.y);
            else ctx.lineTo(cx + pt.x, cy + pt.y);
          });
          ctx.stroke();
          ctx.restore();
        }
      }

      // Bodies & Vectors
      const acc = state.lastAcc || computeAccelerations(state.bodies);
      state.bodies.forEach((b, i) => {
        const sx = cx + b.x;
        const sy = cy + b.y;

        if (b.glow) {
          ctx.save();
          const g = ctx.createRadialGradient(sx, sy, b.r * 0.3, sx, sy, b.r * 2.5);
          g.addColorStop(0, b.glow);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, b.r * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (p.showVel) {
          SimLab.util.drawArrow(ctx, sx, sy, sx + b.vx * 0.35, sy + b.vy * 0.35, "#34d399", "v");
        }
        if (p.showForce && !b.isStar) {
          SimLab.util.drawArrow(ctx, sx, sy, sx + acc.ax[i] * 0.55, sy + acc.ay[i] * 0.55, "#fb7185", "Fg");
        }
      });

      // Slingshot asteroid preview
      if (state.launchDrag) {
        const { sx, sy, ex, ey } = state.launchDrag;
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#e2e8f0";
        ctx.fill();
        SimLab.util.drawArrow(ctx, sx, sy, sx + (sx - ex), sy + (sy - ey), "#fbbf24", "Launch v");
        ctx.restore();
      }
    },

    getHud(state) {
      let ke = 0;
      let pe = 0;
      const bodies = state.bodies;
      for (let i = 0; i < bodies.length; i++) {
        ke += 0.5 * bodies[i].mass * (bodies[i].vx * bodies[i].vx + bodies[i].vy * bodies[i].vy);
        for (let j = i + 1; j < bodies.length; j++) {
          const d = Math.hypot(bodies[j].x - bodies[i].x, bodies[j].y - bodies[i].y) + SOFTENING;
          pe -= (G_CONST * bodies[i].mass * bodies[j].mass) / d;
        }
      }
      const pBody = bodies.find((b) => b.isPlanet) || bodies[bodies.length - 1];
      const speed = pBody ? Math.hypot(pBody.vx, pBody.vy) : 0;
      return [
        { label: "Bodies", value: `${bodies.length}` },
        { label: "Planet Speed", value: `${speed.toFixed(1)} u/s` },
        { label: "Total E", value: `${(ke + pe).toFixed(0)}` }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const cx = (canvas.logicalWidth || 800) / 2;
      const cy = (canvas.logicalHeight || 500) / 2;
      for (const b of state.bodies) {
        if (Math.hypot(cx + b.x - x, cy + b.y - y) <= Math.max(18, b.r + 8)) {
          state.dragBody = b;
          return;
        }
      }
      state.launchDrag = { sx: x, sy: y, ex: x, ey: y };
    },

    onPointerMove(state, x, y, canvas) {
      const cx = (canvas.logicalWidth || 800) / 2;
      const cy = (canvas.logicalHeight || 500) / 2;
      if (state.dragBody) {
        state.dragBody.x = x - cx;
        state.dragBody.y = y - cy;
        state.dragBody.trail = [];
        return;
      }
      if (state.launchDrag) {
        state.launchDrag.ex = x;
        state.launchDrag.ey = y;
      }
    },

    onPointerUp(state, x, y, canvas) {
      if (state.dragBody) {
        state.dragBody = null;
        return;
      }
      if (state.launchDrag) {
        const cx = (canvas.logicalWidth || 800) / 2;
        const cy = (canvas.logicalHeight || 500) / 2;
        const { sx, sy, ex, ey } = state.launchDrag;
        const vx = (sx - ex) * 1.1;
        const vy = (sy - ey) * 1.1;
        state.bodies.push({
          name: "Asteroid",
          mass: 0.005,
          x: sx - cx,
          y: sy - cy,
          vx,
          vy,
          r: 5.5,
          color: "#e2e8f0",
          trail: []
        });
        state.launchDrag = null;
        SimLab.audio.playPop();
      }
    }
  });
})();
