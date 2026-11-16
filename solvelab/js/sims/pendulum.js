(function () {
  "use strict";

  function rk4Step(theta, omega, L, g, damping, dt) {
    const deriv = (th, om) => ({
      dTheta: om,
      dOmega: -(g / L) * Math.sin(th) - damping * om
    });

    const k1 = deriv(theta, omega);
    const k2 = deriv(theta + 0.5 * dt * k1.dTheta, omega + 0.5 * dt * k1.dOmega);
    const k3 = deriv(theta + 0.5 * dt * k2.dTheta, omega + 0.5 * dt * k2.dOmega);
    const k4 = deriv(theta + dt * k3.dTheta, omega + dt * k3.dOmega);

    return {
      theta: theta + (dt / 6) * (k1.dTheta + 2 * k2.dTheta + 2 * k3.dTheta + k4.dTheta),
      omega: omega + (dt / 6) * (k1.dOmega + 2 * k2.dOmega + 2 * k3.dOmega + k4.dOmega)
    };
  }

  function getPivotAndBobs(state, canvas) {
    const w = canvas.logicalWidth || 800;
    const h = canvas.logicalHeight || 500;
    const pivotX = w * 0.44;
    const pivotY = 58;
    const pxPerMeter = Math.min(165, (h - 140) / 2.6);

    const b1 = {
      x: pivotX + state.params.length1 * pxPerMeter * Math.sin(state.p1.theta),
      y: pivotY + state.params.length1 * pxPerMeter * Math.cos(state.p1.theta)
    };
    const b2 = {
      x: pivotX + state.params.length2 * pxPerMeter * Math.sin(state.p2.theta),
      y: pivotY + state.params.length2 * pxPerMeter * Math.cos(state.p2.theta)
    };
    return { pivotX, pivotY, pxPerMeter, b1, b2 };
  }

  SimLab.register({
    id: "pendulum",
    title: "Pendulum & Harmonic Motion",
    category: "physics",
    subtitle: "Nonlinear RK4 Oscillator, Energy & Period Lab",
    icon: "⏱️",
    color: "#a78bfa",
    description:
      "Drag up to two pendulums to any release angle, measure real oscillation periods vs. small-angle approximations, and watch kinetic, potential, and thermal energy exchange.",
    tags: ["Oscillations", "RK4", "Energy", "Period"],
    hint: "Drag either pendulum bob directly on the canvas to pull it back and release!",
    presets: [
      { label: "Small Angle (15°)", params: { length1: 1.5, mass1: 1.5, gravity: "9.81", damping: 0, secondPendulum: false }, initAngle: 15 },
      { label: "Large Angle (75°)", params: { length1: 1.5, mass1: 1.5, gravity: "9.81", damping: 0, secondPendulum: false }, initAngle: 75 },
      { label: "Dual Comparison", params: { length1: 1.8, length2: 0.9, secondPendulum: true, damping: 0 }, initAngle: 35 },
      { label: "Damped Decay", params: { length1: 1.4, damping: 0.25, secondPendulum: false }, initAngle: 55 }
    ],
    controls: [
      { type: "range", key: "length1", label: "Length L₁", min: 0.3, max: 2.5, step: 0.05, default: 1.5, unit: " m" },
      { type: "range", key: "mass1", label: "Mass m₁", min: 0.2, max: 5, step: 0.1, default: 1.5, unit: " kg" },
      {
        type: "select",
        key: "gravity",
        label: "Gravity (g)",
        default: "9.81",
        options: [
          { value: "9.81", label: "Earth (9.81 m/s²)" },
          { value: "1.62", label: "Moon (1.62 m/s²)" },
          { value: "3.72", label: "Mars (3.72 m/s²)" },
          { value: "24.79", label: "Jupiter (24.79 m/s²)" }
        ]
      },
      { type: "range", key: "damping", label: "Friction / Damping (b)", min: 0, max: 0.5, step: 0.01, default: 0.02, unit: "" },
      { type: "checkbox", key: "secondPendulum", label: "Compare 2nd Pendulum (L₂)", default: true },
      { type: "range", key: "length2", label: "Length L₂", min: 0.3, max: 2.5, step: 0.05, default: 1.0, unit: " m" },
      { type: "checkbox", key: "showVectors", label: "Velocity & Acceleration Vectors", default: true },
      { type: "checkbox", key: "showEnergy", label: "Energy Bar Chart (KE/PE/Eth)", default: true },
      { type: "checkbox", key: "showGraph", label: "Live θ(t) Strip Chart", default: true }
    ],
    theory: {
      summary:
        "A simple pendulum obeys the nonlinear differential equation θ'' = -(g/L) sin(θ) - b θ'. For small angles (θ < 15°), sin(θ) ≈ θ yields simple harmonic motion with period T ≈ 2π√(L/g), independent of mass. At larger angles, the true period lengthens.",
      formulas: [
        "d²θ/dt² = −(g / L) sin(θ) − b (dθ/dt)",
        "T_small = 2π √(L / g)",
        "PE = m g L (1 − cos θ),   KE = ½ m (L ω)²"
      ],
      challenges: [
        "Challenge 1: Double Length L₁ from 0.5 m to 2.0 m. How much does the measured period T increase? (Hint: √4 = 2×).",
        "Challenge 2: Release from 10° vs. 85°. Compare the measured period T against the small-angle formula 2π√(L/g).",
        "Challenge 3: Enable the 2nd pendulum with L₁ = 1.6 m and L₂ = 0.4 m. Watch how many swings L₂ completes for every 1 swing of L₁."
      ]
    },

    init(state) {
      const startDeg = state.params.initAngle || 38;
      const startRad = (startDeg * Math.PI) / 180;
      state.p1 = { theta: startRad, omega: 0, alpha: 0, trail: [] };
      state.p2 = { theta: startRad, omega: 0, alpha: 0, trail: [] };
      state.initialEnergy = null;
      state.dragging = null;
      state.periodTimer = { lastCrossTime: null, measuredPeriod: null };
      state.history1 = [];
      state.history2 = [];
      state.sampleTimer = 0;
    },

    update(state, dt) {
      const p = state.params;
      const g = Number(p.gravity);

      if (state.initialEnergy === null) {
        state.initialEnergy =
          p.mass1 * g * p.length1 * (1 - Math.cos(state.p1.theta)) +
          0.5 * p.mass1 * Math.pow(p.length1 * state.p1.omega, 2);
      }

      if (state.dragging !== "p1") {
        const prevTheta = state.p1.theta;
        const next1 = rk4Step(state.p1.theta, state.p1.omega, p.length1, g, p.damping, dt);
        state.p1.theta = next1.theta;
        state.p1.omega = next1.omega;
        state.p1.alpha = -(g / p.length1) * Math.sin(next1.theta) - p.damping * next1.omega;

        // Detect positive zero crossing for automatic period stopwatch
        if (prevTheta < 0 && next1.theta >= 0 && state.p1.omega > 0) {
          if (state.periodTimer.lastCrossTime !== null) {
            state.periodTimer.measuredPeriod = state.time - state.periodTimer.lastCrossTime;
          }
          state.periodTimer.lastCrossTime = state.time;
          SimLab.audio.playTick && SimLab.audio.playTone(380, 0.03, "sine", 0.02);
        }
      }

      if (p.secondPendulum && state.dragging !== "p2") {
        const next2 = rk4Step(state.p2.theta, state.p2.omega, p.length2, g, p.damping, dt);
        state.p2.theta = next2.theta;
        state.p2.omega = next2.omega;
        state.p2.alpha = -(g / p.length2) * Math.sin(next2.theta) - p.damping * next2.omega;
      }

      state.sampleTimer += dt;
      if (state.sampleTimer >= 0.025) {
        state.sampleTimer = 0;
        const deg1 = (state.p1.theta * 180) / Math.PI;
        const deg2 = (state.p2.theta * 180) / Math.PI;
        state.history1.push(deg1);
        state.history2.push(deg2);
        if (state.history1.length > 180) state.history1.shift();
        if (state.history2.length > 180) state.history2.shift();
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const p = state.params;
      const g = Number(p.gravity);

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, w, h);
      SimLab.util.drawGrid(ctx, w, h, 40);

      const { pivotX, pivotY, pxPerMeter, b1, b2 } = getPivotAndBobs(state, canvas);

      // Protractor arc
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 64, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Vertical equilibrium dashed line
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + Math.max(p.length1, p.length2) * pxPerMeter + 26);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Support beam
      ctx.fillStyle = "#334155";
      SimLab.util.roundRect(ctx, pivotX - 75, pivotY - 14, 150, 14, 5);
      ctx.fill();

      // Draw Pendulum 2 (behind if enabled)
      if (p.secondPendulum) {
        ctx.save();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.78)";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(b2.x, b2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(b2.x, b2.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("2", b2.x, b2.y + 3.5);
        ctx.restore();
      }

      // Draw Pendulum 1
      const r1 = 11 + Math.sqrt(p.mass1) * 5.2;
      ctx.save();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(b1.x, b1.y);
      ctx.stroke();

      const grad = ctx.createRadialGradient(b1.x - 4, b1.y - 4, 2, b1.x, b1.y, r1);
      grad.addColorStop(0, "#7dd3fc");
      grad.addColorStop(1, "#0284c7");
      ctx.beginPath();
      ctx.arc(b1.x, b1.y, r1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("1", b1.x, b1.y + 4);
      ctx.restore();

      // Pivot bolt
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#e2e8f0";
      ctx.fill();

      // Velocity & Acceleration vectors on Pendulum 1
      if (p.showVectors) {
        const tangX = Math.cos(state.p1.theta);
        const tangY = -Math.sin(state.p1.theta);
        const speed = p.length1 * state.p1.omega;
        const vScale = 22;
        SimLab.util.drawArrow(
          ctx,
          b1.x,
          b1.y,
          b1.x + tangX * speed * vScale,
          b1.y + tangY * speed * vScale,
          "#22c55e",
          "v"
        );

        const aTang = p.length1 * state.p1.alpha;
        const aCent = p.length1 * state.p1.omega * state.p1.omega;
        const radX = -Math.sin(state.p1.theta);
        const radY = -Math.cos(state.p1.theta);
        const ax = tangX * aTang + radX * aCent;
        const ay = tangY * aTang + radY * aCent;
        const aScale = 5.5;
        SimLab.util.drawArrow(ctx, b1.x, b1.y, b1.x + ax * aScale, b1.y + ay * aScale, "#fb7185", "a");
      }

      // Energy Bar Chart
      if (p.showEnergy) {
        const pe = p.mass1 * g * p.length1 * (1 - Math.cos(state.p1.theta));
        const ke = 0.5 * p.mass1 * Math.pow(p.length1 * state.p1.omega, 2);
        const totalRef = Math.max(0.5, state.initialEnergy || pe + ke);
        const thermal = Math.max(0, totalRef - (pe + ke));

        SimLab.util.drawBarChart(
          ctx,
          w - 236,
          14,
          222,
          135,
          "Pendulum 1 Energy (J)",
          [
            { label: "KE", value: ke, color: "#38bdf8", displayValue: ke.toFixed(1) },
            { label: "PE", value: pe, color: "#34d399", displayValue: pe.toFixed(1) },
            { label: "Eth", value: thermal, color: "#f87171", displayValue: thermal.toFixed(1) },
            { label: "Tot", value: ke + pe, color: "#fbbf24", displayValue: (ke + pe).toFixed(1) }
          ],
          Math.max(totalRef, ke + pe)
        );
      }

      // Strip chart theta(t)
      if (p.showGraph) {
        const series = [{ name: "θ₁ (°)", color: "#38bdf8", data: state.history1 }];
        if (p.secondPendulum) {
          series.push({ name: "θ₂ (°)", color: "#fbbf24", data: state.history2 });
        }
        SimLab.util.drawGraph(
          ctx,
          w - 254,
          h - 154,
          240,
          140,
          "Angle vs. Time θ(t)",
          "time",
          "deg",
          series,
          -95,
          95,
          { yDecimals: 0 }
        );
      }
    },

    getHud(state) {
      const p = state.params;
      const g = Number(p.gravity);
      const tTheory = 2 * Math.PI * Math.sqrt(p.length1 / g);
      const deg1 = (state.p1.theta * 180) / Math.PI;
      return [
        { label: "θ₁", value: `${deg1.toFixed(1)}°` },
        { label: "ω₁", value: `${state.p1.omega.toFixed(2)} rad/s` },
        { label: "T (small-angle)", value: `${tTheory.toFixed(3)} s` },
        {
          label: "T (measured)",
          value: state.periodTimer.measuredPeriod
            ? `${state.periodTimer.measuredPeriod.toFixed(3)} s`
            : "swinging..."
        }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const { b1, b2 } = getPivotAndBobs(state, canvas);
      if (Math.hypot(x - b1.x, y - b1.y) < 30) {
        state.dragging = "p1";
        return;
      }
      if (state.params.secondPendulum && Math.hypot(x - b2.x, y - b2.y) < 28) {
        state.dragging = "p2";
      }
    },

    onPointerMove(state, x, y, canvas) {
      if (!state.dragging) return;
      const { pivotX, pivotY } = getPivotAndBobs(state, canvas);
      const angle = Math.atan2(x - pivotX, y - pivotY);
      const clamped = SimLab.util.clamp(angle, -Math.PI * 0.85, Math.PI * 0.85);
      if (state.dragging === "p1") {
        state.p1.theta = clamped;
        state.p1.omega = 0;
        state.initialEnergy = null;
        state.periodTimer.lastCrossTime = null;
      } else if (state.dragging === "p2") {
        state.p2.theta = clamped;
        state.p2.omega = 0;
      }
    },

    onPointerUp(state) {
      state.dragging = null;
    }
  });
})();
