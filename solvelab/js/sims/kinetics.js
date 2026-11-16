(function () {
  "use strict";

  const SPECIES_COLOR = {
    A: "#38bdf8",
    B: "#fbbf24",
    C: "#34d399"
  };

  function getVesselBounds(canvas) {
    const w = canvas ? canvas.logicalWidth || 800 : 800;
    const h = canvas ? canvas.logicalHeight || 500 : 500;
    return {
      w,
      h,
      left: 34,
      right: Math.min(w - 280, w * 0.61),
      top: 52,
      bottom: h - 46
    };
  }

  function makeParticle(type, bounds, tempK) {
    const baseSpeed = 48 * Math.sqrt(tempK / 300);
    const ang = Math.random() * Math.PI * 2;
    const spd = baseSpeed * (0.55 + Math.random() * 0.95);
    return {
      type,
      r: type === "C" ? 6.2 : 6.8,
      x: bounds.left + 12 + Math.random() * Math.max(20, bounds.right - bounds.left - 24),
      y: bounds.top + 12 + Math.random() * Math.max(20, bounds.bottom - bounds.top - 24),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      cooldown: 0
    };
  }

  function computeEffectiveBarriers(p) {
    const catFactor = p.catalyst ? 0.55 : 1.0;
    const eaFwd = Math.max(8, p.eaForward * catFactor);
    // Thermodynamic consistency: Ea_rev - Ea_fwd = -DeltaH
    const eaRev = Math.max(8, eaFwd - p.deltaH);
    return { eaFwd, eaRev };
  }

  function drawReactionCoordinate(ctx, x, y, w, h, p) {
    ctx.save();
    SimLab.util.roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = "rgba(8, 13, 26, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 11px 'Segoe UI', sans-serif";
    ctx.fillText("Reaction Energy Profile (kJ/mol)", x + 10, y + 17);

    const padX = 24;
    const baseLineY = y + h * 0.62;
    const scaleY = (h * 0.42) / 110;
    const reactY = baseLineY;
    const prodY = SimLab.util.clamp(baseLineY - p.deltaH * scaleY, y + 34, y + h - 18);
    const uncatPeakY = SimLab.util.clamp(reactY - p.eaForward * scaleY, y + 28, reactY - 12);
    const catPeakY = SimLab.util.clamp(reactY - p.eaForward * 0.55 * scaleY, y + 28, reactY - 8);

    const x0 = x + padX;
    const x1 = x + w * 0.3;
    const xPeak = x + w * 0.52;
    const x2 = x + w * 0.72;
    const x3 = x + w - padX;

    const drawCurve = (peakY, color, dashed) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      if (dashed) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, reactY);
      ctx.lineTo(x1, reactY);
      ctx.bezierCurveTo(x1 + 18, reactY, xPeak - 20, peakY, xPeak, peakY);
      ctx.bezierCurveTo(xPeak + 20, peakY, x2 - 18, prodY, x2, prodY);
      ctx.lineTo(x3, prodY);
      ctx.stroke();
      ctx.restore();
    };

    if (p.catalyst) {
      drawCurve(uncatPeakY, "rgba(148, 163, 184, 0.55)", true);
      drawCurve(catPeakY, "#34d399", false);
    } else {
      drawCurve(uncatPeakY, "#f472b6", false);
    }

    ctx.fillStyle = "#38bdf8";
    ctx.font = "600 10px 'Segoe UI', sans-serif";
    ctx.fillText("A + B", x0, reactY - 6);

    ctx.fillStyle = "#34d399";
    ctx.fillText("2C", x3 - 18, prodY - 6);

    ctx.fillStyle = "#fbbf24";
    const { eaFwd, eaRev } = computeEffectiveBarriers(p);
    ctx.fillText(`Ea=${eaFwd.toFixed(0)} | ΔH=${p.deltaH >= 0 ? "+" : ""}${p.deltaH}`, x + 12, y + h - 8);
    ctx.restore();
  }

  SimLab.register({
    id: "kinetics",
    title: "Reaction Kinetics & Equilibrium Lab",
    category: "chemistry",
    subtitle: "A + B ⇌ 2C, Activation Energy, Catalysis & Le Chatelier",
    icon: "⚗️",
    color: "#10b981",
    description:
      "Watch reversible molecular collisions in A + B ⇌ 2C. Adjust temperature, activation energy Ea, enthalpy ΔH, or add a catalyst to shift reaction rates and equilibrium concentrations.",
    tags: ["Kinetics", "Equilibrium", "Catalyst", "Activation Energy"],
    hint: "Try adding a Catalyst or raising Temperature to compare initial rate vs. final equilibrium concentrations!",
    presets: [
      { label: "Exothermic (ΔH = -25)", params: { initA: 45, initB: 45, temperature: 450, eaForward: 46, deltaH: -25, catalyst: false } },
      { label: "Endothermic (ΔH = +25)", params: { initA: 45, initB: 45, temperature: 560, eaForward: 52, deltaH: 25, catalyst: false } },
      { label: "Catalyzed Fast Rxn", params: { initA: 50, initB: 50, temperature: 400, eaForward: 68, deltaH: -20, catalyst: true } },
      { label: "Excess Reactant A", params: { initA: 75, initB: 25, temperature: 480, eaForward: 44, deltaH: -18, catalyst: false } }
    ],
    controls: [
      { type: "action", id: "restart", label: "🔄 Restart Reaction", variant: "primary", fullWidth: true },
      { type: "range", key: "initA", label: "Initial Reactant [A]", min: 10, max: 80, step: 1, default: 45, unit: "" },
      { type: "range", key: "initB", label: "Initial Reactant [B]", min: 10, max: 80, step: 1, default: 45, unit: "" },
      { type: "range", key: "temperature", label: "Temperature (T)", min: 200, max: 800, step: 10, default: 450, unit: " K" },
      { type: "range", key: "eaForward", label: "Activation Energy (Ea)", min: 20, max: 100, step: 2, default: 48, unit: " kJ/mol" },
      { type: "range", key: "deltaH", label: "Enthalpy Change (ΔH)", min: -50, max: 50, step: 2, default: -20, unit: " kJ/mol" },
      { type: "checkbox", key: "catalyst", label: "Add Catalyst (Lowers Ea)", default: false },
      { type: "checkbox", key: "showDiagrams", label: "Show Energy Profile & [t] Plot", default: true }
    ],
    theory: {
      summary:
        "According to collision theory, molecules react only when they collide with kinetic energy along the line of centers exceeding the activation barrier Ea. A catalyst lowers Ea for both forward and reverse directions equally — speeding up equilibrium attainment without shifting K_eq.",
      formulas: [
        "A + B ⇌ 2C,   K_eq = [C]² / ([A][B])",
        "k = A_freq · exp(−Ea / RT)   (Arrhenius Equation)",
        "Ea_rev = Ea_fwd − ΔH"
      ],
      challenges: [
        "Challenge 1: Set Ea = 72 kJ/mol and T = 360 K. Notice how slowly products form, then toggle Add Catalyst and observe the immediate rate surge.",
        "Challenge 2: Compare an Exothermic reaction (ΔH = -30) vs. Endothermic (ΔH = +30) at 500 K. Which yields more C at equilibrium?",
        "Challenge 3: Increase Temperature from 300 K to 700 K in an Exothermic reaction and observe Le Chatelier's principle shift K_eq."
      ]
    },

    init(state, canvas) {
      const bounds = getVesselBounds(canvas);
      const p = state.params;
      state.particles = [];
      for (let i = 0; i < p.initA; i++) state.particles.push(makeParticle("A", bounds, p.temperature));
      for (let i = 0; i < p.initB; i++) state.particles.push(makeParticle("B", bounds, p.temperature));
      state.flashes = [];
      state.histA = [];
      state.histB = [];
      state.histC = [];
      state.sampleTimer = 0;
      state.lastTemp = p.temperature;
      state.lastInitA = p.initA;
      state.lastInitB = p.initB;
    },

    onAction(state, actionId, canvas) {
      if (actionId === "restart") {
        this.init(state, canvas);
        SimLab.audio.playPop();
      }
    },

    update(state, dt, canvas) {
      const p = state.params;
      const bounds = getVesselBounds(canvas);

      if (state.lastInitA !== p.initA || state.lastInitB !== p.initB) {
        this.init(state, canvas);
        return;
      }

      if (state.lastTemp !== p.temperature) {
        const factor = Math.sqrt(p.temperature / Math.max(100, state.lastTemp));
        for (const pt of state.particles) {
          pt.vx *= factor;
          pt.vy *= factor;
        }
        state.lastTemp = p.temperature;
      }

      const { eaFwd, eaRev } = computeEffectiveBarriers(p);
      const pts = state.particles;
      const n = pts.length;

      // Move and wall bounce
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        if (a.cooldown > 0) a.cooldown = Math.max(0, a.cooldown - dt);
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        if (a.x - a.r < bounds.left) {
          a.x = bounds.left + a.r;
          a.vx = Math.abs(a.vx);
        } else if (a.x + a.r > bounds.right) {
          a.x = bounds.right - a.r;
          a.vx = -Math.abs(a.vx);
        }
        if (a.y - a.r < bounds.top) {
          a.y = bounds.top + a.r;
          a.vy = Math.abs(a.vy);
        } else if (a.y + a.r > bounds.bottom) {
          a.y = bounds.bottom - a.r;
          a.vy = -Math.abs(a.vy);
        }
      }

      // Pairwise elastic collisions & reactive barrier checks
      for (let i = 0; i < n; i++) {
        const a = pts[i];
        for (let j = i + 1; j < n; j++) {
          const b = pts[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minD = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 < minD * minD && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const overlap = 0.5 * (minD - d);
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const vn = rvx * nx + rvy * ny;
            if (vn < 0) {
              a.vx += vn * nx;
              a.vy += vn * ny;
              b.vx -= vn * nx;
              b.vy -= vn * ny;

              if (a.cooldown <= 0 && b.cooldown <= 0) {
                // Kinetic energy along line of centers calibrated in kJ/mol
                const eColl = 0.0046 * vn * vn;
                const isAB = (a.type === "A" && b.type === "B") || (a.type === "B" && b.type === "A");
                const isCC = a.type === "C" && b.type === "C";

                if (isAB && eColl >= eaFwd) {
                  a.type = "C";
                  b.type = "C";
                  a.r = 6.2;
                  b.r = 6.2;
                  a.cooldown = 0.25;
                  b.cooldown = 0.25;
                  state.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, age: 0, color: "#34d399" });
                } else if (isCC && eColl >= eaRev) {
                  a.type = "A";
                  b.type = "B";
                  a.r = 6.8;
                  b.r = 6.8;
                  a.cooldown = 0.25;
                  b.cooldown = 0.25;
                  state.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, age: 0, color: "#38bdf8" });
                }
              }
            }
          }
        }
      }

      // Gentle thermal bath maintenance
      let sumV2 = 0;
      for (const pt of pts) sumV2 += pt.vx * pt.vx + pt.vy * pt.vy;
      const targetMeanV2 = Math.pow(48 * Math.sqrt(p.temperature / 300), 2) * 1.15;
      const curMeanV2 = sumV2 / Math.max(1, pts.length);
      const scale = Math.sqrt(SimLab.util.lerp(1, targetMeanV2 / Math.max(1, curMeanV2), 0.06));
      for (const pt of pts) {
        pt.vx *= scale;
        pt.vy *= scale;
      }

      for (let i = state.flashes.length - 1; i >= 0; i--) {
        state.flashes[i].age += dt;
        if (state.flashes[i].age > 0.35) state.flashes.splice(i, 1);
      }

      state.sampleTimer += dt;
      if (state.sampleTimer >= 0.12) {
        state.sampleTimer = 0;
        let cA = 0, cB = 0, cC = 0;
        for (const pt of pts) {
          if (pt.type === "A") cA++;
          else if (pt.type === "B") cB++;
          else cC++;
        }
        state.histA.push(cA);
        state.histB.push(cB);
        state.histC.push(cC);
        if (state.histA.length > 160) {
          state.histA.shift();
          state.histB.shift();
          state.histC.shift();
        }
      }
    },

    render(state, ctx, canvas) {
      const bounds = getVesselBounds(canvas);
      const p = state.params;

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, bounds.w, bounds.h);
      SimLab.util.drawGrid(ctx, bounds.w, bounds.h, 36);

      // Reaction Vessel
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

      if (p.catalyst) {
        // Catalytic surface strip at vessel floor
        ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
        ctx.fillRect(bounds.left + 2, bounds.bottom - 14, bounds.right - bounds.left - 4, 12);
        ctx.fillStyle = "#34d399";
        ctx.font = "700 10px 'Segoe UI', sans-serif";
        ctx.fillText("CATALYST ACTIVE (Lower Ea)", bounds.left + 12, bounds.bottom - 20);
      }

      // Reactive Flash Rings
      for (const fl of state.flashes) {
        const frac = fl.age / 0.35;
        ctx.save();
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 7 + frac * 18, 0, Math.PI * 2);
        ctx.strokeStyle = fl.color;
        ctx.globalAlpha = 1 - frac;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (const pt of state.particles) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = SPECIES_COLOR[pt.type];
        ctx.fill();
        ctx.fillStyle = "#080d1a";
        ctx.font = "800 8px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pt.type, pt.x, pt.y + 3);
      }
      ctx.textAlign = "left";

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 4;
      ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

      // Legend header above vessel
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "700 12px 'Segoe UI', sans-serif";
      ctx.fillText("Reaction:  A (Blue) + B (Gold)  ⇌  2 C (Green)", bounds.left, bounds.top - 14);

      if (p.showDiagrams) {
        const panelW = Math.min(258, Math.max(210, bounds.w - bounds.right - 28));
        const panelX = bounds.w - panelW - 14;
        drawReactionCoordinate(ctx, panelX, 16, panelW, 170, p);

        const totalPop = Math.max(20, state.particles.length);
        SimLab.util.drawGraph(
          ctx,
          panelX,
          198,
          panelW,
          172,
          "Species Concentration vs. Time",
          "time",
          "count",
          [
            { name: "[A]", color: "#38bdf8", data: state.histA },
            { name: "[B]", color: "#fbbf24", data: state.histB },
            { name: "[C]", color: "#34d399", data: state.histC }
          ],
          0,
          totalPop,
          { yDecimals: 0 }
        );
      }
    },

    getHud(state) {
      let cA = 0, cB = 0, cC = 0;
      for (const pt of state.particles) {
        if (pt.type === "A") cA++;
        else if (pt.type === "B") cB++;
        else cC++;
      }
      const kEq = cA * cB > 0 ? ((cC * cC) / (cA * cB)).toFixed(2) : "∞";
      return [
        { label: "A", value: `${cA}` },
        { label: "B", value: `${cB}` },
        { label: "C (Product)", value: `${cC}` },
        { label: "Q = [C]²/[A][B]", value: kEq }
      ];
    }
  });
})();
