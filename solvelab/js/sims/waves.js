(function () {
  "use strict";

  const GRID_W = 150;
  const GRID_H = 96;
  const STRING_N = 220;

  function initGrid2D(state) {
    const size = GRID_W * GRID_H;
    state.u = new Float32Array(size);
    state.uPrev = new Float32Array(size);
    state.uNext = new Float32Array(size);
    state.imgData = null;
    state.offCanvas = null;
    state.offCtx = null;
  }

  function initString1D(state) {
    state.strY = new Float32Array(STRING_N);
    state.strPrev = new Float32Array(STRING_N);
    state.strNext = new Float32Array(STRING_N);
    state.strEnvMax = new Float32Array(STRING_N);
  }

  SimLab.register({
    id: "waves",
    title: "Wave Interference & Ripple Tank",
    category: "physics",
    subtitle: "1D Standing Waves, 2D Interference & Double-Slit Diffraction",
    icon: "🌊",
    color: "#06b6d4",
    description:
      "Simulate 1D string oscillations with fixed, loose, or open boundaries, 2D two-source wave interference, and double-slit diffraction with a movable oscilloscope probe.",
    tags: ["Waves", "Interference", "Diffraction", "Oscilloscope"],
    hint: "Drag the yellow oscilloscope crosshair probe anywhere on the wave to measure live y(t)!",
    presets: [
      { label: "1D Standing Wave", params: { mode: "string1d", endType: "fixed", frequency: 2.0, amplitude: 1.0, damping: 0.005, showNodes: true } },
      { label: "1D Loose End", params: { mode: "string1d", endType: "loose", frequency: 1.75, amplitude: 1.0, damping: 0.005, showNodes: true } },
      { label: "2D Two-Source", params: { mode: "ripple2d", frequency: 2.2, amplitude: 1.0, sourceSep: 70, phaseOffset: 0, showNodes: true } },
      { label: "Double-Slit", params: { mode: "doubleslit", frequency: 2.8, amplitude: 1.1, sourceSep: 72, slitWidth: 22, showNodes: true } }
    ],
    controls: [
      {
        type: "select",
        key: "mode",
        label: "Wave Mode",
        default: "ripple2d",
        options: [
          { value: "ripple2d", label: "2D Two-Source Ripple Interference" },
          { value: "doubleslit", label: "2D Double-Slit Diffraction" },
          { value: "string1d", label: "1D String Oscillator" }
        ]
      },
      {
        type: "select",
        key: "endType",
        label: "1D Right Boundary",
        default: "fixed",
        options: [
          { value: "fixed", label: "Fixed End (Inverts Wave)" },
          { value: "loose", label: "Loose End (No Inversion)" },
          { value: "open", label: "Open / Absorbing End" }
        ]
      },
      { type: "range", key: "frequency", label: "Frequency (f)", min: 0.5, max: 4.0, step: 0.05, default: 2.2, unit: " Hz" },
      { type: "range", key: "amplitude", label: "Amplitude (A)", min: 0.2, max: 1.5, step: 0.05, default: 1.0, unit: "" },
      { type: "range", key: "damping", label: "Medium Damping", min: 0, max: 0.15, step: 0.005, default: 0.01, unit: "" },
      { type: "range", key: "sourceSep", label: "Source / Slit Separation", min: 20, max: 160, step: 2, default: 74, unit: " px" },
      { type: "range", key: "slitWidth", label: "Slit Width", min: 12, max: 50, step: 2, default: 22, unit: " px" },
      { type: "range", key: "phaseOffset", label: "2nd Source Phase Δφ", min: 0, max: 360, step: 5, default: 0, unit: "°" },
      { type: "checkbox", key: "showNodes", label: "Show Nodal / Interference Guide", default: true }
    ],
    theory: {
      summary:
        "Waves obey the linear wave equation ∂²u/∂t² = c²∇²u. Superposition causes constructive interference where path difference Δr = mλ (or phase difference is 0) and destructive nodal lines where Δr = (m + ½)λ.",
      formulas: [
        "∂²u / ∂t² = c² ∇²u",
        "v = f · λ",
        "Constructive: Δr = m λ,   Destructive: Δr = (m + ½) λ",
        "Double-Slit Maxima: d sin(θ) = m λ"
      ],
      challenges: [
        "Challenge 1: In 2D Two-Source mode, set Phase Δφ = 180° and place the probe along the central symmetry line. What happens to the oscilloscope signal?",
        "Challenge 2: Switch to Double-Slit Diffraction and increase Frequency from 1.2 Hz to 3.5 Hz. Observe how shorter wavelength λ narrows the diffraction fringe spacing.",
        "Challenge 3: Switch to 1D String Oscillator with a Fixed End and find a resonant frequency where clean stationary nodes appear."
      ]
    },

    init(state, canvas) {
      const w = canvas ? canvas.logicalWidth || 800 : 800;
      const h = canvas ? canvas.logicalHeight || 500 : 500;
      initGrid2D(state);
      initString1D(state);
      state.probe = { x: w * 0.65, y: h * 0.48 };
      state.probeHistory = [];
      state.probeSampleTimer = 0;
      state.draggingProbe = false;
      state.lastMode = state.params.mode;
    },

    update(state, dt, canvas) {
      const p = state.params;
      if (state.lastMode !== p.mode) {
        initGrid2D(state);
        initString1D(state);
        state.probeHistory = [];
        state.lastMode = p.mode;
      }

      const w = canvas ? canvas.logicalWidth || 800 : 800;
      const h = canvas ? canvas.logicalHeight || 500 : 500;

      if (p.mode === "string1d") {
        const substeps = 6;
        const c2 = 0.24; // Courant^2 <= 0.25 for stability
        const damp = SimLab.util.clamp(1 - p.damping * 0.22, 0.9, 1);

        for (let s = 0; s < substeps; s++) {
          const tNow = state.time + (s / substeps) * dt;
          state.strY[0] = p.amplitude * Math.sin(2 * Math.PI * p.frequency * tNow);
          state.strNext[0] = state.strY[0];

          for (let i = 1; i < STRING_N - 1; i++) {
            const lap = state.strY[i + 1] - 2 * state.strY[i] + state.strY[i - 1];
            state.strNext[i] = (2 * state.strY[i] - state.strPrev[i] + c2 * lap) * damp;
          }

          if (p.endType === "fixed") {
            state.strNext[STRING_N - 1] = 0;
          } else if (p.endType === "loose") {
            state.strNext[STRING_N - 1] = state.strNext[STRING_N - 2];
          } else {
            // Absorbing boundary
            const c = Math.sqrt(c2);
            state.strNext[STRING_N - 1] =
              state.strY[STRING_N - 2] + ((c - 1) / (c + 1)) * (state.strNext[STRING_N - 2] - state.strY[STRING_N - 1]);
          }

          const tmp = state.strPrev;
          state.strPrev = state.strY;
          state.strY = state.strNext;
          state.strNext = tmp;

          for (let i = 0; i < STRING_N; i++) {
            state.strEnvMax[i] = Math.max(state.strEnvMax[i] * 0.996, Math.abs(state.strY[i]));
          }
        }
      } else {
        // 2D Wave PDE
        const substeps = 2;
        const c2 = 0.22;
        const dampBase = 1 - p.damping * 0.16;

        const sepCells = Math.round((p.sourceSep / Math.max(200, h)) * GRID_H);
        const halfSep = Math.max(2, Math.floor(sepCells / 2));
        const midY = Math.floor(GRID_H / 2);

        const wallX = Math.floor(GRID_W * 0.34);
        const slitHalf = Math.max(2, Math.round(((p.slitWidth / Math.max(200, h)) * GRID_H) / 2));

        for (let s = 0; s < substeps; s++) {
          const tNow = state.time + (s / substeps) * dt;
          const omega = 2 * Math.PI * p.frequency;

          if (p.mode === "ripple2d") {
            const sx = Math.floor(GRID_W * 0.22);
            const sy1 = SimLab.util.clamp(midY - halfSep, 4, GRID_H - 5);
            const sy2 = SimLab.util.clamp(midY + halfSep, 4, GRID_H - 5);
            const phi = (p.phaseOffset * Math.PI) / 180;
            state.u[sy1 * GRID_W + sx] = p.amplitude * 2.2 * Math.sin(omega * tNow);
            state.u[sy2 * GRID_W + sx] = p.amplitude * 2.2 * Math.sin(omega * tNow + phi);
          } else {
            // Double-slit plane wave on left
            const srcX = 8;
            const val = p.amplitude * 1.45 * Math.sin(omega * tNow);
            for (let y = 4; y < GRID_H - 4; y++) {
              state.u[y * GRID_W + srcX] = val;
            }
          }

          for (let y = 1; y < GRID_H - 1; y++) {
            const row = y * GRID_W;
            // Sponge absorbing edge factor
            const edgeY = Math.min(y, GRID_H - 1 - y);
            const spongeY = edgeY < 6 ? 0.85 + 0.15 * (edgeY / 6) : 1;

            for (let x = 1; x < GRID_W - 1; x++) {
              const idx = row + x;
              if (p.mode === "doubleslit" && (x === wallX || x === wallX + 1)) {
                const inSlit1 = Math.abs(y - (midY - halfSep)) <= slitHalf;
                const inSlit2 = Math.abs(y - (midY + halfSep)) <= slitHalf;
                if (!inSlit1 && !inSlit2) {
                  state.uNext[idx] = 0;
                  continue;
                }
              }

              const edgeX = Math.min(x, GRID_W - 1 - x);
              const spongeX = edgeX < 6 ? 0.85 + 0.15 * (edgeX / 6) : 1;

              const lap =
                state.u[idx - 1] +
                state.u[idx + 1] +
                state.u[idx - GRID_W] +
                state.u[idx + GRID_W] -
                4 * state.u[idx];
              state.uNext[idx] = (2 * state.u[idx] - state.uPrev[idx] + c2 * lap) * dampBase * spongeX * spongeY;
            }
          }

          const tmp = state.uPrev;
          state.uPrev = state.u;
          state.u = state.uNext;
          state.uNext = tmp;
        }
      }

      // Sample oscilloscope probe
      state.probeSampleTimer += dt;
      if (state.probeSampleTimer >= 0.02) {
        state.probeSampleTimer = 0;
        let sampleVal = 0;
        if (p.mode === "string1d") {
          const padX = 56;
          const span = Math.max(100, w - 112);
          const frac = SimLab.util.clamp((state.probe.x - padX) / span, 0, 1);
          const idx = Math.round(frac * (STRING_N - 1));
          sampleVal = state.strY[idx] || 0;
        } else {
          const gx = SimLab.util.clamp(Math.round((state.probe.x / w) * (GRID_W - 1)), 0, GRID_W - 1);
          const gy = SimLab.util.clamp(Math.round((state.probe.y / h) * (GRID_H - 1)), 0, GRID_H - 1);
          sampleVal = state.u[gy * GRID_W + gx] || 0;
        }
        state.probeHistory.push(sampleVal);
        if (state.probeHistory.length > 150) state.probeHistory.shift();
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const p = state.params;

      if (p.mode === "string1d") {
        ctx.fillStyle = "#080d1a";
        ctx.fillRect(0, 0, w, h);
        SimLab.util.drawGrid(ctx, w, h, 40);

        const padX = 56;
        const span = Math.max(100, w - 112);
        const midY = h * 0.45;
        const ampPx = 88;

        // Equilibrium centerline
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padX, midY);
        ctx.lineTo(padX + span, midY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Envelope if showNodes
        if (p.showNodes) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.24)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < STRING_N; i++) {
            const sx = padX + (i / (STRING_N - 1)) * span;
            const sy = midY - state.strEnvMax[i] * ampPx;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          for (let i = STRING_N - 1; i >= 0; i--) {
            const sx = padX + (i / (STRING_N - 1)) * span;
            const sy = midY + state.strEnvMax[i] * ampPx;
            ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
          ctx.fill();
          ctx.stroke();
        }

        // String curve
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < STRING_N; i++) {
          const sx = padX + (i / (STRING_N - 1)) * span;
          const sy = midY - state.strY[i] * ampPx;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Oscillator piston on left
        const pistonY = midY - state.strY[0] * ampPx;
        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(padX, pistonY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Right clamp
        const endY = midY - state.strY[STRING_N - 1] * ampPx;
        if (p.endType === "fixed") {
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(padX + span - 5, midY - 12, 10, 24);
        } else if (p.endType === "loose") {
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(padX + span, midY - 110);
          ctx.lineTo(padX + span, midY + 110);
          ctx.stroke();
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(padX + span, endY, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 2D Water Ripple Rendering
        if (!state.offCanvas) {
          state.offCanvas = document.createElement("canvas");
          state.offCanvas.width = GRID_W;
          state.offCanvas.height = GRID_H;
          state.offCtx = state.offCanvas.getContext("2d");
          state.imgData = state.offCtx.createImageData(GRID_W, GRID_H);
        }

        const data = state.imgData.data;
        const wallX = Math.floor(GRID_W * 0.34);
        const midY = Math.floor(GRID_H / 2);
        const sepCells = Math.round((p.sourceSep / Math.max(200, h)) * GRID_H);
        const halfSep = Math.max(2, Math.floor(sepCells / 2));
        const slitHalf = Math.max(2, Math.round(((p.slitWidth / Math.max(200, h)) * GRID_H) / 2));

        for (let y = 0; y < GRID_H; y++) {
          for (let x = 0; x < GRID_W; x++) {
            const idx = y * GRID_W + x;
            const pix = idx * 4;

            if (p.mode === "doubleslit" && (x === wallX || x === wallX + 1)) {
              const inSlit1 = Math.abs(y - (midY - halfSep)) <= slitHalf;
              const inSlit2 = Math.abs(y - (midY + halfSep)) <= slitHalf;
              if (!inSlit1 && !inSlit2) {
                data[pix] = 100;
                data[pix + 1] = 116;
                data[pix + 2] = 139;
                data[pix + 3] = 255;
                continue;
              }
            }

            const v = state.u[idx];
            const clamped = SimLab.util.clamp(v * 0.9, -1, 1);
            if (clamped >= 0) {
              data[pix] = Math.round(14 + clamped * 52);
              data[pix + 1] = Math.round(45 + clamped * 175);
              data[pix + 2] = Math.round(92 + clamped * 163);
            } else {
              const neg = -clamped;
              data[pix] = Math.round(14 - neg * 10);
              data[pix + 1] = Math.round(45 - neg * 34);
              data[pix + 2] = Math.round(92 - neg * 60);
            }
            data[pix + 3] = 255;
          }
        }

        state.offCtx.putImageData(state.imgData, 0, 0);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(state.offCanvas, 0, 0, w, h);

        // Source markers & nodal lines
        if (p.mode === "ripple2d") {
          const sx = (Math.floor(GRID_W * 0.22) / GRID_W) * w;
          const sy1 = ((midY - halfSep) / GRID_H) * h;
          const sy2 = ((midY + halfSep) / GRID_H) * h;
          [sy1, sy2].forEach((sy, idx) => {
            ctx.beginPath();
            ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            ctx.fillStyle = idx === 0 ? "#34d399" : "#fbbf24";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          if (p.showNodes) {
            ctx.strokeStyle = "rgba(248, 250, 252, 0.22)";
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(sx, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        ctx.restore();
      }

      // Draw Draggable Oscilloscope Probe
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.probe.x, state.probe.y, 13, 0, Math.PI * 2);
      ctx.moveTo(state.probe.x - 19, state.probe.y);
      ctx.lineTo(state.probe.x + 19, state.probe.y);
      ctx.moveTo(state.probe.x, state.probe.y - 19);
      ctx.lineTo(state.probe.x, state.probe.y + 19);
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 10px 'Segoe UI', sans-serif";
      ctx.fillText("PROBE", state.probe.x + 16, state.probe.y - 10);
      ctx.restore();

      // Live Oscilloscope Overlay
      SimLab.util.drawGraph(
        ctx,
        w - 258,
        h - 150,
        244,
        136,
        "Oscilloscope Probe y(t)",
        "time",
        "amp",
        [{ name: "Wave y(t)", color: "#fbbf24", data: state.probeHistory }],
        -1.6,
        1.6,
        { yDecimals: 1 }
      );
    },

    getHud(state) {
      const p = state.params;
      const latest = state.probeHistory.length ? state.probeHistory[state.probeHistory.length - 1] : 0;
      return [
        { label: "Frequency", value: `${p.frequency.toFixed(2)} Hz` },
        { label: "Period T", value: `${(1 / p.frequency).toFixed(2)} s` },
        { label: "Probe y", value: `${latest.toFixed(2)}` }
      ];
    },

    onPointerDown(state, x, y) {
      if (Math.hypot(x - state.probe.x, y - state.probe.y) < 30) {
        state.draggingProbe = true;
      } else {
        state.probe.x = x;
        state.probe.y = y;
        state.draggingProbe = true;
      }
    },

    onPointerMove(state, x, y, canvas) {
      if (!state.draggingProbe) return;
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      state.probe.x = SimLab.util.clamp(x, 12, w - 12);
      state.probe.y = SimLab.util.clamp(y, 12, h - 12);
    },

    onPointerUp(state) {
      state.draggingProbe = false;
    }
  });
})();
