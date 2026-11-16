(function () {
  "use strict";

  const ELEMENTS = [
    null,
    { z: 1, sym: "H", name: "Hydrogen", stableN: [0, 1] },
    { z: 2, sym: "He", name: "Helium", stableN: [1, 2] },
    { z: 3, sym: "Li", name: "Lithium", stableN: [3, 4] },
    { z: 4, sym: "Be", name: "Beryllium", stableN: [5] },
    { z: 5, sym: "B", name: "Boron", stableN: [5, 6] },
    { z: 6, sym: "C", name: "Carbon", stableN: [6, 7] },
    { z: 7, sym: "N", name: "Nitrogen", stableN: [7, 8] },
    { z: 8, sym: "O", name: "Oxygen", stableN: [8, 9, 10] },
    { z: 9, sym: "F", name: "Fluorine", stableN: [10] },
    { z: 10, sym: "Ne", name: "Neon", stableN: [10, 11, 12] }
  ];

  function getElectronConfig(eCount) {
    if (eCount <= 0) return "None (Bare Nucleus)";
    const s1 = Math.min(2, eCount);
    let rem = eCount - s1;
    const s2 = Math.min(2, rem);
    rem -= s2;
    const p2 = Math.min(6, rem);
    const parts = [`1s²`.replace("²", s1 === 1 ? "¹" : "²")];
    if (s2 > 0) parts.push(`2s${s2 === 1 ? "¹" : "²"}`);
    if (p2 > 0) {
      const sup = ["", "¹", "²", "³", "⁴", "⁵", "⁶"][p2];
      parts.push(`2p${sup}`);
    }
    return parts.join(" ");
  }

  function isStableNucleus(z, n) {
    const el = ELEMENTS[z];
    if (!el) return false;
    return el.stableN.includes(n);
  }

  function buildNucleonLayout(z, n) {
    const list = [];
    const total = z + n;
    for (let i = 0; i < total; i++) {
      const isProton = i < z;
      const angle = i * 2.39996; // Golden angle packing
      const rad = i === 0 ? 0 : 7.2 * Math.sqrt(i);
      list.push({
        type: isProton ? "p" : "n",
        ox: Math.cos(angle) * rad,
        oy: Math.sin(angle) * rad
      });
    }
    return list;
  }

  function getTrays(canvas) {
    const w = canvas ? canvas.logicalWidth || 800 : 800;
    const h = canvas ? canvas.logicalHeight || 500 : 500;
    const y = h - 46;
    const midX = w * 0.42;
    return [
      { id: "p", label: "+ Proton", x: midX - 110, y, color: "#ef4444" },
      { id: "n", label: "+ Neutron", x: midX, y, color: "#94a3b8" },
      { id: "e", label: "+ Electron", x: midX + 110, y, color: "#38bdf8" }
    ];
  }

  SimLab.register({
    id: "atom",
    title: "Build an Atom & Rutherford Lab",
    category: "chemistry",
    subtitle: "Bohr Shells, Quantum Clouds, Stability & Alpha Scattering",
    icon: "⚛️",
    color: "#34d399",
    description:
      "Construct atoms from protons, neutrons, and electrons. Switch between Bohr orbits and Quantum probability clouds, check nuclear stability, or fire alpha particles at a gold nucleus.",
    tags: ["Atomic Structure", "Orbitals", "Isotopes", "Rutherford"],
    hint: "Drag a Proton, Neutron, or Electron from the bottom tray into the atom — or switch to Rutherford Scattering!",
    presets: [
      { label: "Carbon-12 (Neutral)", params: { mode: "build", protons: 6, neutrons: 6, electrons: 6, electronModel: "bohr" } },
      { label: "Quantum Cloud (O)", params: { mode: "build", protons: 8, neutrons: 8, electrons: 8, electronModel: "cloud" } },
      { label: "Unstable Carbon-14", params: { mode: "build", protons: 6, neutrons: 8, electrons: 6, electronModel: "bohr" } },
      { label: "Rutherford Gold Foil", params: { mode: "rutherford", protons: 10, alphaEnergy: 5, beamIntensity: 6 } }
    ],
    controls: [
      {
        type: "select",
        key: "mode",
        label: "Simulation Mode",
        default: "build",
        options: [
          { value: "build", label: "Build an Atom (Bohr & Quantum)" },
          { value: "rutherford", label: "Rutherford Alpha Scattering" }
        ]
      },
      { type: "range", key: "protons", label: "Protons (Z)", min: 1, max: 10, step: 1, default: 6, unit: "" },
      { type: "range", key: "neutrons", label: "Neutrons (N)", min: 0, max: 12, step: 1, default: 6, unit: "" },
      { type: "range", key: "electrons", label: "Electrons (e⁻)", min: 0, max: 10, step: 1, default: 6, unit: "" },
      { type: "action", id: "addP", label: "+ Proton", variant: "primary" },
      { type: "action", id: "subP", label: "− Proton", variant: "secondary" },
      { type: "action", id: "addN", label: "+ Neutron", variant: "primary" },
      { type: "action", id: "subN", label: "− Neutron", variant: "secondary" },
      { type: "action", id: "addE", label: "+ Electron", variant: "primary" },
      { type: "action", id: "subE", label: "− Electron", variant: "secondary" },
      { type: "action", id: "neutral", label: "⚖ Make Neutral Ground State", variant: "secondary", fullWidth: true },
      {
        type: "select",
        key: "electronModel",
        label: "Electron Representation",
        default: "bohr",
        options: [
          { value: "bohr", label: "Bohr Shell Orbits" },
          { value: "cloud", label: "Quantum Probability Cloud" }
        ]
      },
      { type: "checkbox", key: "showTile", label: "Show Periodic Table Tile & Meters", default: true },
      { type: "range", key: "alphaEnergy", label: "Alpha Energy (Rutherford)", min: 1, max: 10, step: 0.5, default: 5, unit: " MeV" },
      { type: "range", key: "beamIntensity", label: "Alpha Beam Rate", min: 1, max: 10, step: 1, default: 6, unit: "" }
    ],
    theory: {
      summary:
        "An element's atomic number Z equals its proton count. Mass number A = Z + N combines protons and neutrons. Net charge is Z − e⁻. In Rutherford's 1909 gold foil experiment, rare large-angle alpha particle deflections proved the atom's positive charge resides in a tiny, dense nucleus.",
      formulas: [
        "Atomic Number Z = # Protons,   Mass Number A = Z + N",
        "Net Charge q = Z − (# Electrons)",
        "Coulomb Force: F = k (2e)(Ze) / r²"
      ],
      challenges: [
        "Challenge 1: Build a neutral Oxygen-16 atom (8p, 8n, 8e⁻), then remove 2 electrons to observe the O²⁺ cation, or add 2 electrons for O²⁻.",
        "Challenge 2: Add neutrons to Carbon-12 until it becomes unstable (like Carbon-14) and watch the nuclear instability tremor.",
        "Challenge 3: Switch to Rutherford Alpha Scattering and lower Alpha Energy from 8 MeV to 2 MeV. How does the distance of closest approach change?"
      ]
    },

    init(state) {
      state.orbitPhase = 0;
      state.alphas = [];
      state.spawnAccum = 0;
      state.cloudSeeds = Array.from({ length: 160 }, () => ({
        ang: Math.random() * Math.PI * 2,
        rad: Math.pow(Math.random(), 0.7),
        shell: Math.random() < 0.35 ? 1 : 2
      }));
      state.dragParticle = null;
    },

    onAction(state, actionId) {
      const p = state.params;
      if (actionId === "addP") p.protons = Math.min(10, p.protons + 1);
      else if (actionId === "subP") p.protons = Math.max(1, p.protons - 1);
      else if (actionId === "addN") p.neutrons = Math.min(12, p.neutrons + 1);
      else if (actionId === "subN") p.neutrons = Math.max(0, p.neutrons - 1);
      else if (actionId === "addE") p.electrons = Math.min(10, p.electrons + 1);
      else if (actionId === "subE") p.electrons = Math.max(0, p.electrons - 1);
      else if (actionId === "neutral") p.electrons = p.protons;
      SimLab.audio.playPop();
      if (typeof state.syncControlUI === "function") state.syncControlUI();
    },

    update(state, dt, canvas) {
      const p = state.params;
      state.orbitPhase += dt * 1.9;

      if (p.mode === "rutherford") {
        const w = canvas ? canvas.logicalWidth || 800 : 800;
        const h = canvas ? canvas.logicalHeight || 500 : 500;
        const nucX = w * 0.56;
        const nucY = h * 0.5;

        state.spawnAccum += dt * (p.beamIntensity * 3.2);
        while (state.spawnAccum >= 1) {
          state.spawnAccum -= 1;
          const speed = 150 + p.alphaEnergy * 34;
          const yOff = (Math.random() - 0.5) * (h * 0.68);
          state.alphas.push({
            x: 24,
            y: nucY + yOff,
            vx: speed,
            vy: 0,
            trail: []
          });
        }

        const kCoulomb = 34000 * (p.protons * 1.8);
        const substeps = 3;
        const subDt = dt / substeps;
        for (let i = state.alphas.length - 1; i >= 0; i--) {
          const al = state.alphas[i];
          for (let s = 0; s < substeps; s++) {
            const dx = al.x - nucX;
            const dy = al.y - nucY;
            const r2 = dx * dx + dy * dy + 64;
            const r = Math.sqrt(r2);
            const acc = kCoulomb / (r2 * r);
            al.vx += acc * dx * subDt;
            al.vy += acc * dy * subDt;
            al.x += al.vx * subDt;
            al.y += al.vy * subDt;
          }
          al.trail.push({ x: al.x, y: al.y });
          if (al.trail.length > 48) al.trail.shift();
          if (al.x < -40 || al.x > w + 40 || al.y < -40 || al.y > h + 40) {
            state.alphas.splice(i, 1);
          }
        }
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const p = state.params;

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, w, h);
      SimLab.util.drawGrid(ctx, w, h, 36);

      const el = ELEMENTS[p.protons] || ELEMENTS[6];
      const massNum = p.protons + p.neutrons;
      const charge = p.protons - p.electrons;
      const stable = isStableNucleus(p.protons, p.neutrons);

      if (p.mode === "build") {
        const cx = w * 0.42;
        const cy = h * 0.46;

        // Electron Shells or Quantum Cloud
        if (p.electronModel === "bohr") {
          [78, 134].forEach((radius, idx) => {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.setLineDash([]);
          });

          const shell1 = Math.min(2, p.electrons);
          const shell2 = Math.max(0, p.electrons - 2);
          for (let i = 0; i < shell1; i++) {
            const ang = state.orbitPhase * 1.4 + (i * Math.PI * 2) / Math.max(1, shell1);
            const ex = cx + Math.cos(ang) * 78;
            const ey = cy + Math.sin(ang) * 78;
            ctx.beginPath();
            ctx.arc(ex, ey, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
          for (let i = 0; i < shell2; i++) {
            const ang = -state.orbitPhase * 0.85 + (i * Math.PI * 2) / Math.max(1, shell2);
            const ex = cx + Math.cos(ang) * 134;
            const ey = cy + Math.sin(ang) * 134;
            ctx.beginPath();
            ctx.arc(ex, ey, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#38bdf8";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        } else {
          // Quantum probability cloud
          const cloudMaxR = p.electrons > 2 ? 148 : 85;
          const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, cloudMaxR);
          g.addColorStop(0, "rgba(56, 189, 248, 0.42)");
          g.addColorStop(0.55, "rgba(56, 189, 248, 0.16)");
          g.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, cloudMaxR, 0, Math.PI * 2);
          ctx.fill();

          const count = Math.min(state.cloudSeeds.length, p.electrons * 16);
          ctx.fillStyle = "rgba(125, 211, 252, 0.72)";
          for (let i = 0; i < count; i++) {
            const sd = state.cloudSeeds[i];
            const rr = (sd.shell === 1 || p.electrons <= 2 ? 78 : 138) * sd.rad;
            const ang = sd.ang + state.orbitPhase * 0.15;
            ctx.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 2.2, 2.2);
          }
        }

        // Nucleus (vibrates if unstable)
        const jitter = stable ? 0 : 2.3;
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;
        const nucleons = buildNucleonLayout(p.protons, p.neutrons);
        for (const nuc of nucleons) {
          ctx.beginPath();
          ctx.arc(cx + nuc.ox + jx, cy + nuc.oy + jy, 7, 0, Math.PI * 2);
          ctx.fillStyle = nuc.type === "p" ? "#ef4444" : "#94a3b8";
          ctx.fill();
          ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Subatomic Particle Tray Buckets at Bottom
        const trays = getTrays(canvas);
        for (const t of trays) {
          ctx.save();
          SimLab.util.roundRect(ctx, t.x - 46, t.y - 18, 92, 36, 9);
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
          ctx.fill();
          ctx.strokeStyle = t.color;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(t.x - 28, t.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = t.color;
          ctx.fill();
          ctx.fillStyle = "#f8fafc";
          ctx.font = "700 11px 'Segoe UI', sans-serif";
          ctx.fillText(t.label, t.x - 16, t.y + 4);
          ctx.restore();
        }

        if (state.dragParticle) {
          ctx.beginPath();
          ctx.arc(state.dragParticle.x, state.dragParticle.y, 9, 0, Math.PI * 2);
          ctx.fillStyle =
            state.dragParticle.type === "p"
              ? "#ef4444"
              : state.dragParticle.type === "n"
              ? "#94a3b8"
              : "#38bdf8";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // Rutherford Alpha Scattering Mode
        const nucX = w * 0.56;
        const nucY = h * 0.5;

        // Alpha emitter box on left
        ctx.fillStyle = "#334155";
        SimLab.util.roundRect(ctx, 8, nucY - 120, 22, 240, 6);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "700 10px 'Segoe UI', sans-serif";
        ctx.fillText("α BEAM", 10, nucY - 128);

        // Alpha trails
        for (const al of state.alphas) {
          if (al.trail.length > 1) {
            ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            al.trail.forEach((pt, idx) => {
              if (idx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(al.x, al.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fde047";
          ctx.fill();
        }

        // Dense positive target nucleus
        const glow = ctx.createRadialGradient(nucX, nucY, 4, nucX, nucY, 34);
        glow.addColorStop(0, "rgba(239, 68, 68, 0.75)");
        glow.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nucX, nucY, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nucX, nucY, 10 + p.protons * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "700 11px Consolas, monospace";
        ctx.textAlign = "center";
        ctx.fillText(`+${p.protons}e`, nucX, nucY + 4);
        ctx.textAlign = "left";
      }

      // Periodic Table Tile & Telemetry Card
      if (p.showTile) {
        const cardW = 216;
        const cardX = w - cardW - 14;
        ctx.save();
        SimLab.util.roundRect(ctx, cardX, 16, cardW, 246, 12);
        ctx.fillStyle = "rgba(8, 13, 26, 0.9)";
        ctx.fill();
        ctx.strokeStyle = stable ? "#34d399" : "#f87171";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Tile square
        ctx.fillStyle = "#1e293b";
        SimLab.util.roundRect(ctx, cardX + 14, 30, 86, 86, 8);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.font = "700 12px Consolas, monospace";
        ctx.fillText(`Z = ${p.protons}`, cardX + 22, 48);
        ctx.fillText(`A = ${massNum}`, cardX + 22, 106);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "800 32px 'Segoe UI', sans-serif";
        ctx.fillText(el.sym, cardX + 34, 84);

        const qStr = charge === 0 ? "0 (Neutral)" : charge > 0 ? `+${charge} (Cation)` : `${charge} (Anion)`;
        ctx.fillStyle = "#f8fafc";
        ctx.font = "700 15px 'Segoe UI', sans-serif";
        ctx.fillText(el.name, cardX + 112, 54);
        ctx.fillStyle = stable ? "#34d399" : "#fb7185";
        ctx.font = "700 11px 'Segoe UI', sans-serif";
        ctx.fillText(stable ? "● Stable Isotope" : "● Unstable Isotope", cardX + 112, 76);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "12px Consolas, monospace";
        ctx.fillText(`Net Charge: ${qStr}`, cardX + 14, 144);
        ctx.fillText(`Protons:    ${p.protons}`, cardX + 14, 166);
        ctx.fillText(`Neutrons:   ${p.neutrons}`, cardX + 14, 186);
        ctx.fillText(`Electrons:  ${p.electrons}`, cardX + 14, 206);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`Config: ${getElectronConfig(p.electrons)}`, cardX + 14, 234);
        ctx.restore();
      }
    },

    getHud(state) {
      const p = state.params;
      const el = ELEMENTS[p.protons] || ELEMENTS[6];
      const charge = p.protons - p.electrons;
      const qStr = charge === 0 ? "0" : charge > 0 ? `+${charge}` : `${charge}`;
      return [
        { label: "Element", value: `${el.name}-${p.protons + p.neutrons}` },
        { label: "Charge", value: qStr },
        { label: "Stability", value: isStableNucleus(p.protons, p.neutrons) ? "Stable" : "Unstable" },
        { label: "e⁻ Config", value: getElectronConfig(p.electrons) }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      if (state.params.mode !== "build") return;
      const trays = getTrays(canvas);
      for (const t of trays) {
        if (Math.abs(x - t.x) < 48 && Math.abs(y - t.y) < 20) {
          state.dragParticle = { type: t.id, x, y };
          return;
        }
      }
    },

    onPointerMove(state, x, y) {
      if (state.dragParticle) {
        state.dragParticle.x = x;
        state.dragParticle.y = y;
      }
    },

    onPointerUp(state, x, y, canvas) {
      if (!state.dragParticle) return;
      const w = canvas ? canvas.logicalWidth || 800 : 800;
      const h = canvas ? canvas.logicalHeight || 500 : 500;
      const distToAtom = Math.hypot(x - w * 0.42, y - h * 0.46);
      if (distToAtom < 185) {
        const t = state.dragParticle.type;
        if (t === "p") state.params.protons = Math.min(10, state.params.protons + 1);
        else if (t === "n") state.params.neutrons = Math.min(12, state.params.neutrons + 1);
        else if (t === "e") state.params.electrons = Math.min(10, state.params.electrons + 1);
        SimLab.audio.playPop();
        if (typeof state.syncControlUI === "function") state.syncControlUI();
      }
      state.dragParticle = null;
    }
  });
})();
