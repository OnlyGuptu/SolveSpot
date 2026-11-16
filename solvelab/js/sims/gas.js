(function () {
  "use strict";

  const MASS_HEAVY = 28;
  const MASS_LIGHT = 4;

  function getChamberBounds(state, canvas) {
    const w = canvas ? canvas.logicalWidth || 800 : 800;
    const h = canvas ? canvas.logicalHeight || 500 : 500;
    const right = Math.min(w - 265, w * 0.65);
    const maxW = Math.max(200, right - 65);
    const curW = maxW * (state.params.volumePct / 100);
    const left = right - curW;
    const top = 74;
    const bottom = h - 52;
    return { w, h, left, right, top, bottom, maxW };
  }

  function randomGaussianSpeed(mass, tempK) {
    // Thermal speed scale: sqrt(T / m)
    const sigma = 16.5 * Math.sqrt(tempK / mass);
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    return { vx: z0 * sigma, vy: z1 * sigma };
  }

  function spawnParticle(species, bounds, tempK) {
    const mass = species === "heavy" ? MASS_HEAVY : MASS_LIGHT;
    const r = species === "heavy" ? 6.5 : 4.2;
    const v = randomGaussianSpeed(mass, tempK);
    return {
      species,
      mass,
      r,
      x: bounds.left + r + Math.random() * Math.max(10, bounds.right - bounds.left - 2 * r),
      y: bounds.top + r + Math.random() * Math.max(10, bounds.bottom - bounds.top - 2 * r),
      vx: v.vx,
      vy: v.vy
    };
  }

  function syncParticleCounts(state, bounds) {
    const targetHeavy = Math.round(state.params.heavyCount);
    const targetLight = Math.round(state.params.lightCount);

    let heavy = state.particles.filter((pt) => pt.species === "heavy");
    let light = state.particles.filter((pt) => pt.species === "light");

    while (heavy.length < targetHeavy) {
      heavy.push(spawnParticle("heavy", bounds, state.measuredTemp || state.params.targetTemp));
    }
    if (heavy.length > targetHeavy) {
      heavy.length = targetHeavy;
    }

    while (light.length < targetLight) {
      light.push(spawnParticle("light", bounds, state.measuredTemp || state.params.targetTemp));
    }
    if (light.length > targetLight) {
      light.length = targetLight;
    }

    state.particles = heavy.concat(light);
  }

  function computeTemperatureK(particles) {
    if (!particles.length) return 0;
    let sumKE = 0;
    for (const pt of particles) {
      sumKE += 0.5 * pt.mass * (pt.vx * pt.vx + pt.vy * pt.vy);
    }
    // Calibrated so randomGaussianSpeed at tempK returns ~tempK
    return sumKE / (particles.length * 16.5 * 16.5);
  }

  function rescaleToTemperature(particles, targetK) {
    const curK = computeTemperatureK(particles);
    if (curK <= 1e-4) return;
    const factor = Math.sqrt(targetK / curK);
    for (const pt of particles) {
      pt.vx *= factor;
      pt.vy *= factor;
    }
  }

  SimLab.register({
    id: "gas",
    title: "Gas Properties & Ideal Gas Law",
    category: "chemistry",
    subtitle: "PV = nRT, Elastic Collisions & Maxwell-Boltzmann Speeds",
    icon: "🎈",
    color: "#34d399",
    description:
      "Pump heavy N₂ and light He molecules into a compressible chamber. Drag the wall piston to perform adiabatic compression, adjust temperature, and inspect live pressure and speed distributions.",
    tags: ["Ideal Gas", "PV=nRT", "Thermodynamics", "Boltzmann"],
    hint: "Drag the left movable piston wall handle in or out to compress/expand the chamber!",
    presets: [
      { label: "Standard Air Mix", params: { heavyCount: 40, lightCount: 20, volumePct: 75, targetTemp: 300, gravityOn: false } },
      { label: "High Pressure", params: { heavyCount: 70, lightCount: 60, volumePct: 40, targetTemp: 550, gravityOn: false } },
      { label: "Cold Slow-Mo", params: { heavyCount: 45, lightCount: 35, volumePct: 80, targetTemp: 120, gravityOn: false } },
      { label: "With Gravity", params: { heavyCount: 55, lightCount: 35, volumePct: 85, targetTemp: 300, gravityOn: true } }
    ],
    controls: [
      { type: "action", id: "pumpHeavy", label: "➕ Pump +10 N₂ (Heavy)", variant: "primary" },
      { type: "action", id: "pumpLight", label: "➕ Pump +10 He (Light)", variant: "primary" },
      { type: "action", id: "vent", label: "💨 Vent 25% Gas", variant: "secondary", fullWidth: true },
      { type: "range", key: "heavyCount", label: "Heavy Molecules (N₂)", min: 0, max: 120, step: 1, default: 38, unit: "" },
      { type: "range", key: "lightCount", label: "Light Molecules (He)", min: 0, max: 120, step: 1, default: 28, unit: "" },
      { type: "range", key: "volumePct", label: "Chamber Volume", min: 30, max: 100, step: 1, default: 75, unit: "%" },
      { type: "range", key: "targetTemp", label: "Heater / Cooler Temp", min: 100, max: 1000, step: 10, default: 300, unit: " K" },
      { type: "checkbox", key: "gravityOn", label: "Enable Gravity", default: false },
      { type: "checkbox", key: "showHistogram", label: "Maxwell-Boltzmann Histogram", default: true }
    ],
    theory: {
      summary:
        "An ideal gas exerts pressure through elastic molecular collisions against the container walls. At thermal equilibrium, heavy and light species share the same average kinetic energy ½mv² = k_B T, meaning lighter He atoms move √(28/4) ≈ 2.65× faster than N₂.",
      formulas: [
        "P V = n R T",
        "KE_avg = ½ m v_rms² = (3/2) k_B T  (3D)  |  k_B T  (2D)",
        "v_rms = √(2 k_B T / m)"
      ],
      challenges: [
        "Challenge 1: Halve the Chamber Volume from 80% to 40% while keeping molecules fixed. Observe how pressure doubles (and rises even further from adiabatic heating during rapid piston drag!).",
        "Challenge 2: Mix equal counts of N₂ and He at 300 K and inspect the bimodal Maxwell-Boltzmann speed histogram.",
        "Challenge 3: Turn on Gravity at 150 K and see heavy N₂ settle lower than light He."
      ]
    },

    init(state, canvas) {
      const bounds = getChamberBounds(state, canvas);
      state.particles = [];
      state.measuredTemp = state.params.targetTemp;
      state.lastTargetTemp = state.params.targetTemp;
      state.prevLeft = bounds.left;
      state.wallImpulse = 0;
      state.pressureAtm = 1.0;
      state.pressureHistory = [];
      state.sampleAccum = 0;
      state.draggingWall = false;
      syncParticleCounts(state, bounds);
    },

    onAction(state, actionId) {
      if (actionId === "pumpHeavy") {
        state.params.heavyCount = Math.min(120, state.params.heavyCount + 10);
        SimLab.audio.playPop();
      } else if (actionId === "pumpLight") {
        state.params.lightCount = Math.min(120, state.params.lightCount + 10);
        SimLab.audio.playPop();
      } else if (actionId === "vent") {
        state.params.heavyCount = Math.floor(state.params.heavyCount * 0.75);
        state.params.lightCount = Math.floor(state.params.lightCount * 0.75);
        SimLab.audio.playTone(180, 0.12, "triangle", 0.04);
      }
      if (typeof state.syncControlUI === "function") state.syncControlUI();
    },

    update(state, dt, canvas) {
      const p = state.params;
      const bounds = getChamberBounds(state, canvas);
      syncParticleCounts(state, bounds);

      if (state.lastTargetTemp !== p.targetTemp) {
        rescaleToTemperature(state.particles, p.targetTemp);
        state.lastTargetTemp = p.targetTemp;
      }

      const wallVel = (bounds.left - state.prevLeft) / Math.max(1e-4, dt);
      state.prevLeft = bounds.left;

      const pts = state.particles;
      const n = pts.length;
      const gAcc = p.gravityOn ? 110 : 0;
      let impulseStep = 0;

      // Move & wall collisions
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        a.vy += gAcc * dt;
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        if (a.x - a.r < bounds.left) {
          a.x = bounds.left + a.r;
          const relVx = a.vx - wallVel;
          if (relVx < 0) {
            const newVx = -a.vx + 2 * wallVel;
            impulseStep += a.mass * Math.abs(newVx - a.vx);
            a.vx = SimLab.util.clamp(newVx, -900, 900);
          }
        } else if (a.x + a.r > bounds.right) {
          a.x = bounds.right - a.r;
          if (a.vx > 0) {
            impulseStep += 2 * a.mass * a.vx;
            a.vx = -a.vx;
          }
        }

        if (a.y - a.r < bounds.top) {
          a.y = bounds.top + a.r;
          if (a.vy < 0) {
            impulseStep += 2 * a.mass * Math.abs(a.vy);
            a.vy = -a.vy;
          }
        } else if (a.y + a.r > bounds.bottom) {
          a.y = bounds.bottom - a.r;
          if (a.vy > 0) {
            impulseStep += 2 * a.mass * a.vy;
            a.vy = -a.vy;
          }
        }
      }

      // Pairwise 2D elastic hard-sphere collisions
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        for (let j = i + 1; j < n; j++) {
          const b = pts[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.r + b.r;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDist * minDist && distSq > 1e-8) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Positional separation
            const overlap = (minDist - dist) * 0.5;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const jImpulse = (-2 * velAlongNormal) / (1 / a.mass + 1 / b.mass);
              a.vx -= (jImpulse / a.mass) * nx;
              a.vy -= (jImpulse / a.mass) * ny;
              b.vx += (jImpulse / b.mass) * nx;
              b.vy += (jImpulse / b.mass) * ny;
            }
          }
        }
      }

      state.measuredTemp = computeTemperatureK(pts);
      const perimeter = 2 * ((bounds.right - bounds.left) + (bounds.bottom - bounds.top));
      const instantP = (impulseStep / Math.max(1e-4, dt * perimeter)) * 0.012;
      state.pressureAtm = SimLab.util.lerp(state.pressureAtm, instantP, 0.08);
    },

    render(state, ctx, canvas) {
      const bounds = getChamberBounds(state, canvas);
      const p = state.params;

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, bounds.w, bounds.h);
      SimLab.util.drawGrid(ctx, bounds.w, bounds.h, 36);

      // Chamber background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

      // Particles
      for (const pt of state.particles) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = pt.species === "heavy" ? "#38bdf8" : "#fb923c";
        ctx.fill();
      }

      // Chamber metallic frame
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 5;
      ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

      // Movable Left Piston Handle
      const handleY = (bounds.top + bounds.bottom) / 2;
      ctx.save();
      ctx.fillStyle = "#fbbf24";
      SimLab.util.roundRect(ctx, bounds.left - 22, handleY - 34, 20, 68, 6);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      for (let gy = -16; gy <= 16; gy += 8) {
        ctx.beginPath();
        ctx.moveTo(bounds.left - 17, handleY + gy);
        ctx.lineTo(bounds.left - 7, handleY + gy);
        ctx.stroke();
      }
      ctx.fillStyle = "#fde68a";
      ctx.font = "600 10px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DRAG", bounds.left - 12, handleY - 40);
      ctx.restore();

      // Analog Pressure Gauge on top-right of chamber
      const gx = bounds.right + 56;
      const gy = bounds.top + 48;
      ctx.save();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bounds.right, gy);
      ctx.lineTo(gx - 34, gy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(gx, gy, 36, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.stroke();

      const pFrac = SimLab.util.clamp(state.pressureAtm / 40, 0, 1);
      const needleAng = Math.PI * 0.75 + pFrac * Math.PI * 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + Math.cos(needleAng) * 26, gy + Math.sin(needleAng) * 26);
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 11px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${state.pressureAtm.toFixed(1)} atm`, gx, gy + 52);
      ctx.restore();

      // Digital Thermometer readout next to gauge
      const tx = bounds.right + 148;
      const ty = bounds.top + 48;
      ctx.save();
      SimLab.util.roundRect(ctx, tx - 42, ty - 28, 86, 56, 8);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#34d399";
      ctx.font = "700 13px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(state.measuredTemp)} K`, tx + 1, ty - 3);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText(`${Math.round(state.measuredTemp - 273.15)} °C`, tx + 1, ty + 16);
      ctx.restore();

      // Maxwell-Boltzmann Speed Histogram
      if (p.showHistogram) {
        const bins = 12;
        const maxSpeed = 360;
        const counts = new Array(bins).fill(0);
        for (const pt of state.particles) {
          const sp = Math.hypot(pt.vx, pt.vy);
          const bIdx = Math.min(bins - 1, Math.floor((sp / maxSpeed) * bins));
          counts[bIdx]++;
        }
        const maxBin = Math.max(8, ...counts);
        const bars = counts.map((c, idx) => ({
          label: idx % 3 === 0 ? `${Math.round((idx / bins) * maxSpeed)}` : "",
          value: c,
          color: idx < 4 ? "#38bdf8" : idx < 8 ? "#34d399" : "#fb923c"
        }));

        SimLab.util.drawBarChart(
          ctx,
          bounds.w - 252,
          bounds.h - 175,
          238,
          160,
          "Speed Distribution (m/s)",
          bars,
          maxBin
        );
      }
    },

    getHud(state) {
      return [
        { label: "N₂ / He", value: `${Math.round(state.params.heavyCount)} / ${Math.round(state.params.lightCount)}` },
        { label: "Temp", value: `${Math.round(state.measuredTemp)} K` },
        { label: "Pressure", value: `${state.pressureAtm.toFixed(1)} atm` },
        { label: "Volume", value: `${state.params.volumePct}%` }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const bounds = getChamberBounds(state, canvas);
      if (Math.abs(x - (bounds.left - 10)) < 28 && y >= bounds.top && y <= bounds.bottom) {
        state.draggingWall = true;
      }
    },

    onPointerMove(state, x, y, canvas) {
      if (!state.draggingWall) return;
      const bounds = getChamberBounds(state, canvas);
      const newWidth = SimLab.util.clamp(bounds.right - x, bounds.maxW * 0.3, bounds.maxW);
      state.params.volumePct = Math.round((newWidth / bounds.maxW) * 100);
      if (typeof state.syncControlUI === "function") state.syncControlUI();
    },

    onPointerUp(state) {
      state.draggingWall = false;
    }
  });
})();
