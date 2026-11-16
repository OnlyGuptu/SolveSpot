(function () {
  "use strict";

  const SUBSTANCES = {
    neon: { name: "Neon (Ne)", sigma: 18, eps: 1.0, meltK: 24, boilK: 27, critK: 44, color: "#38bdf8", r: 7 },
    argon: { name: "Argon (Ar)", sigma: 20, eps: 2.8, meltK: 84, boilK: 87, critK: 151, color: "#a78bfa", r: 8 },
    oxygen: { name: "Oxygen (O₂)", sigma: 21, eps: 3.1, meltK: 54, boilK: 90, critK: 155, color: "#f87171", r: 8 },
    water: { name: "Water (H₂O)", sigma: 22, eps: 6.8, meltK: 273, boilK: 373, critK: 647, color: "#22d3ee", r: 8.5 }
  };

  function getBox(state, canvas) {
    const w = canvas ? canvas.logicalWidth || 800 : 800;
    const h = canvas ? canvas.logicalHeight || 500 : 500;
    const left = 64;
    const right = Math.min(w - 275, 420);
    const baseTop = 54;
    const bottom = h - 98;
    const maxStroke = (bottom - baseTop) * 0.62;
    const pistonY = baseTop + (state.params.pistonPct / 100) * maxStroke;
    return { w, h, left, right, baseTop, pistonY, bottom };
  }

  function createCrystalLattice(state, box) {
    const sub = SUBSTANCES[state.params.substance] || SUBSTANCES.argon;
    const cols = 7;
    const rows = 5;
    const spacing = sub.sigma * 1.12;
    const startX = (box.left + box.right) / 2 - ((cols - 1) * spacing) / 2;
    const startY = box.bottom - 24 - (rows - 1) * spacing;
    const atoms = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offsetX = r % 2 === 1 ? spacing * 0.48 : 0;
        const speed = Math.sqrt(state.params.temperature) * 1.9;
        const ang = Math.random() * Math.PI * 2;
        atoms.push({
          x: SimLab.util.clamp(startX + c * spacing + offsetX, box.left + 12, box.right - 12),
          y: SimLab.util.clamp(startY + r * spacing, box.pistonY + 12, box.bottom - 12),
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          fx: 0,
          fy: 0
        });
      }
    }
    return atoms;
  }

  function computeForces(atoms, sub) {
    const n = atoms.length;
    for (let i = 0; i < n; i++) {
      atoms[i].fx = 0;
      atoms[i].fy = 16; // Gentle gravity to seat solid/liquid at bottom
    }

    const sig = sub.sigma;
    const eps = sub.eps * 8500;
    const cutoffSq = (sig * 2.8) * (sig * 2.8);

    for (let i = 0; i < n; i++) {
      const a = atoms[i];
      for (let j = i + 1; j < n; j++) {
        const b = atoms[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r2 = dx * dx + dy * dy;
        if (r2 > cutoffSq || r2 < 1e-4) continue;

        const safeR2 = Math.max(r2, sig * sig * 0.68);
        const invR2 = (sig * sig) / safeR2;
        const invR6 = invR2 * invR2 * invR2;
        const invR12 = invR6 * invR6;
        // F_mag / r = 24 * eps * (2*(sig/r)^12 - (sig/r)^6) / r^2
        let fOverR = (24 * eps * (2 * invR12 - invR6)) / safeR2;
        fOverR = SimLab.util.clamp(fOverR, -280, 280);

        const fx = fOverR * dx;
        const fy = fOverR * dy;
        a.fx -= fx;
        a.fy -= fy;
        b.fx += fx;
        b.fy += fy;
      }
    }
  }

  function detectPhase(tempK, pistonPct, sub) {
    if (tempK > sub.critK && pistonPct > 35) return "Supercritical Fluid";
    if (tempK < sub.meltK * 0.92) return "Solid Crystal";
    if (tempK < sub.boilK * 1.15) return "Liquid";
    return "Gas / Vapor";
  }

  SimLab.register({
    id: "states",
    title: "States of Matter & Phase Transitions",
    category: "chemistry",
    subtitle: "Lennard-Jones Potential, Compression & Phase Diagrams",
    icon: "🧊",
    color: "#22d3ee",
    description:
      "Observe Neon, Argon, Oxygen, and Water molecules interact via Lennard-Jones forces. Heat or cool with the burner/ice bucket, or push the top piston down to induce phase changes.",
    tags: ["Phases", "Lennard-Jones", "Thermodynamics", "Crystal"],
    hint: "Drag the top piston down to compress molecules, or click the Flame 🔥 / Ice ❄️ buttons below the chamber!",
    presets: [
      { label: "Solid Crystal (40 K)", params: { substance: "argon", temperature: 40, pistonPct: 12 } },
      { label: "Liquid Phase (110 K)", params: { substance: "argon", temperature: 92, pistonPct: 15 } },
      { label: "Gas Phase (300 K)", params: { substance: "argon", temperature: 260, pistonPct: 10 } },
      { label: "High-Pressure Dense", params: { substance: "water", temperature: 390, pistonPct: 56 } }
    ],
    controls: [
      {
        type: "select",
        key: "substance",
        label: "Substance",
        default: "argon",
        options: [
          { value: "neon", label: "Neon (Ne) — Weak Intermolecular" },
          { value: "argon", label: "Argon (Ar) — Medium Van der Waals" },
          { value: "oxygen", label: "Oxygen (O₂) — Diatomic" },
          { value: "water", label: "Water (H₂O) — Strong H-Bonds" }
        ]
      },
      { type: "range", key: "temperature", label: "Thermostat Temp (T)", min: 15, max: 500, step: 5, default: 40, unit: " K" },
      { type: "range", key: "pistonPct", label: "Top Piston Compression", min: 0, max: 65, step: 1, default: 12, unit: "%" },
      { type: "checkbox", key: "showLJ", label: "Show Lennard-Jones & Phase Plot", default: true }
    ],
    theory: {
      summary:
        "Molecules attract at moderate distances (Van der Waals / hydrogen bonding) and repel strongly at short distances (electron-cloud overlap), modeled by the Lennard-Jones 12-6 potential. Phase depends on the competition between thermal kinetic energy k_B T and binding depth ε.",
      formulas: [
        "U(r) = 4ε [ (σ/r)¹² − (σ/r)⁶ ]",
        "Solid: k_B T ≪ ε (ordered lattice)",
        "Liquid: k_B T ~ ε (mobile cohesive fluid)",
        "Gas: k_B T ≫ ε (free high-speed molecules)"
      ],
      challenges: [
        "Challenge 1: Start with Solid Crystal Argon (40 K) and slowly raise Temperature past 85 K. Watch the rigid lattice melt into a fluid liquid, then boil into gas!",
        "Challenge 2: Compare Neon vs. Water at 295 K (room temperature). Why is Neon a gas while Water remains a liquid?",
        "Challenge 3: Compress Gas Phase Argon by dragging the piston down to 55% and observe particle spacing and collision pressure."
      ]
    },

    init(state, canvas) {
      const box = getBox(state, canvas);
      state.lastSubstance = state.params.substance;
      state.atoms = createCrystalLattice(state, box);
      state.draggingPiston = false;
      state.burnerMode = 0; // +1 heat, -1 cool, 0 idle
      state.pressureVal = 1.0;
    },

    update(state, dt, canvas) {
      const p = state.params;
      const box = getBox(state, canvas);

      if (state.lastSubstance !== p.substance) {
        state.lastSubstance = p.substance;
        state.atoms = createCrystalLattice(state, box);
      }

      if (state.burnerMode !== 0) {
        p.temperature = SimLab.util.clamp(p.temperature + state.burnerMode * 55 * dt, 15, 500);
        if (typeof state.syncControlUI === "function") state.syncControlUI();
      }

      const sub = SUBSTANCES[p.substance] || SUBSTANCES.argon;
      const substeps = 4;
      const h = dt / substeps;
      let wallImpact = 0;

      for (let s = 0; s < substeps; s++) {
        computeForces(state.atoms, sub);
        for (const a of state.atoms) {
          a.vx += a.fx * h;
          a.vy += a.fy * h;
          a.vx = SimLab.util.clamp(a.vx, -280, 280);
          a.vy = SimLab.util.clamp(a.vy, -280, 280);
          a.x += a.vx * h;
          a.y += a.vy * h;

          if (a.x - sub.r < box.left) {
            a.x = box.left + sub.r;
            a.vx = Math.abs(a.vx) * 0.96;
            wallImpact += Math.abs(a.vx);
          } else if (a.x + sub.r > box.right) {
            a.x = box.right - sub.r;
            a.vx = -Math.abs(a.vx) * 0.96;
            wallImpact += Math.abs(a.vx);
          }

          if (a.y - sub.r < box.pistonY) {
            a.y = box.pistonY + sub.r;
            a.vy = Math.abs(a.vy) * 0.96;
            wallImpact += Math.abs(a.vy);
          } else if (a.y + sub.r > box.bottom) {
            a.y = box.bottom - sub.r;
            a.vy = -Math.abs(a.vy) * 0.96;
            wallImpact += Math.abs(a.vy);
          }
        }

        // Berendsen gentle thermostat toward target temperature
        let keSum = 0;
        for (const a of state.atoms) {
          keSum += 0.5 * (a.vx * a.vx + a.vy * a.vy);
        }
        const curTemp = Math.max(1, keSum / (state.atoms.length * 1.9));
        const targetKE = p.temperature * 1.9;
        const curKE = keSum / state.atoms.length;
        const scale = Math.sqrt(SimLab.util.lerp(1, targetKE / Math.max(1, curKE), 0.14));
        for (const a of state.atoms) {
          a.vx *= scale;
          a.vy *= scale;
        }
      }

      const newP = (wallImpact / Math.max(1e-4, dt)) * 0.003;
      state.pressureVal = SimLab.util.lerp(state.pressureVal, newP, 0.08);
    },

    render(state, ctx, canvas) {
      const box = getBox(state, canvas);
      const p = state.params;
      const sub = SUBSTANCES[p.substance] || SUBSTANCES.argon;

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, box.w, box.h);
      SimLab.util.drawGrid(ctx, box.w, box.h, 36);

      // Chamber interior
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(box.left, box.baseTop, box.right - box.left, box.bottom - box.baseTop);

      // Piston rod & plate
      ctx.fillStyle = "#475569";
      ctx.fillRect((box.left + box.right) / 2 - 9, 14, 18, box.pistonY - 14);
      ctx.fillStyle = "#fbbf24";
      SimLab.util.roundRect(ctx, box.left + 2, box.pistonY - 14, box.right - box.left - 4, 14, 4);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 10px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DRAG PISTON", (box.left + box.right) / 2, box.pistonY - 4);

      // Draw molecules
      for (const a of state.atoms) {
        if (p.substance === "water") {
          ctx.beginPath();
          ctx.arc(a.x, a.y, sub.r * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = "#ef4444";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(a.x - 6, a.y - 5, 3.6, 0, Math.PI * 2);
          ctx.arc(a.x + 6, a.y - 5, 3.6, 0, Math.PI * 2);
          ctx.fillStyle = "#f8fafc";
          ctx.fill();
        } else if (p.substance === "oxygen") {
          ctx.beginPath();
          ctx.arc(a.x - 4, a.y, 5.2, 0, Math.PI * 2);
          ctx.arc(a.x + 4, a.y, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = sub.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(a.x, a.y, sub.r, 0, Math.PI * 2);
          ctx.fillStyle = sub.color;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Chamber walls
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 5;
      ctx.strokeRect(box.left, box.baseTop, box.right - box.left, box.bottom - box.baseTop);

      // Interactive Heat / Cool Pads below Chamber
      const midX = (box.left + box.right) / 2;
      const padY = box.bottom + 14;
      // Heat Button
      ctx.save();
      SimLab.util.roundRect(ctx, midX - 108, padY, 96, 36, 8);
      ctx.fillStyle = state.burnerMode === 1 ? "#dc2626" : "rgba(239, 68, 68, 0.22)";
      ctx.fill();
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#fecaca";
      ctx.font = "700 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔥 Heat (+)", midX - 60, padY + 22);

      // Ice Button
      SimLab.util.roundRect(ctx, midX + 12, padY, 96, 36, 8);
      ctx.fillStyle = state.burnerMode === -1 ? "#0284c7" : "rgba(56, 189, 248, 0.22)";
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.stroke();
      ctx.fillStyle = "#bae6fd";
      ctx.fillText("❄️ Cool (−)", midX + 60, padY + 22);
      ctx.restore();

      // Lennard-Jones Potential & Phase Diagram Overlays
      if (p.showLJ) {
        const ljData = [];
        for (let rNorm = 0.94; rNorm <= 2.6; rNorm += 0.05) {
          const inv6 = Math.pow(1 / rNorm, 6);
          const u = 4 * sub.eps * (inv6 * inv6 - inv6);
          ljData.push({ x: rNorm, y: SimLab.util.clamp(u, -sub.eps * 1.2, sub.eps * 2.2) });
        }

        const gw = 242;
        const gh = 148;
        const gx = box.w - gw - 14;
        SimLab.util.drawGraph(
          ctx,
          gx,
          16,
          gw,
          gh,
          "Lennard-Jones Potential U(r)",
          "r / σ",
          "U",
          [{ name: sub.name, color: sub.color, data: ljData }],
          -sub.eps * 1.2,
          sub.eps * 2.2,
          { xMin: 0.94, xMax: 2.6, yDecimals: 1 }
        );

        // Phase Indicator Card
        const phaseName = detectPhase(p.temperature, p.pistonPct, sub);
        SimLab.util.roundRect(ctx, gx, 178, gw, 128, 10);
        ctx.fillStyle = "rgba(8, 13, 26, 0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "700 11px 'Segoe UI', sans-serif";
        ctx.fillText("PHASE STATE MONITOR", gx + 14, 200);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "800 17px 'Segoe UI', sans-serif";
        ctx.fillText(phaseName, gx + 14, 226);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Consolas, monospace";
        ctx.fillText(`Melt: ${sub.meltK} K   Boil: ${sub.boilK} K`, gx + 14, 252);
        ctx.fillText(`T = ${Math.round(p.temperature)} K (${Math.round(p.temperature - 273.15)} °C)`, gx + 14, 272);
        ctx.fillText(`P ≈ ${state.pressureVal.toFixed(1)} atm`, gx + 14, 290);
      }
    },

    getHud(state) {
      const p = state.params;
      const sub = SUBSTANCES[p.substance] || SUBSTANCES.argon;
      return [
        { label: "Substance", value: sub.name },
        { label: "Temp", value: `${Math.round(p.temperature)} K` },
        { label: "Phase", value: detectPhase(p.temperature, p.pistonPct, sub) },
        { label: "Pressure", value: `${state.pressureVal.toFixed(1)} atm` }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const box = getBox(state, canvas);
      if (x >= box.left && x <= box.right && Math.abs(y - (box.pistonY - 7)) < 22) {
        state.draggingPiston = true;
        return;
      }
      const midX = (box.left + box.right) / 2;
      const padY = box.bottom + 14;
      if (y >= padY && y <= padY + 36) {
        if (x >= midX - 108 && x <= midX - 12) {
          state.burnerMode = 1;
          return;
        }
        if (x >= midX + 12 && x <= midX + 108) {
          state.burnerMode = -1;
          return;
        }
      }
    },

    onPointerMove(state, x, y, canvas) {
      if (!state.draggingPiston) return;
      const box = getBox(state, canvas);
      const maxStroke = (box.bottom - box.baseTop) * 0.62;
      const pct = ((y - box.baseTop) / maxStroke) * 100;
      state.params.pistonPct = Math.round(SimLab.util.clamp(pct, 0, 65));
      if (typeof state.syncControlUI === "function") state.syncControlUI();
    },

    onPointerUp(state) {
      state.draggingPiston = false;
      state.burnerMode = 0;
    }
  });
})();
