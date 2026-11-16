(function () {
  "use strict";

  const KW = 1e-14;
  const V_ANALYTE_ML = 25.0;
  const C_NAOH = 0.2;

  const SOLUTIONS = {
    hcl: { name: "Strong Acid (HCl)", ka: 1e6, basePh: null, type: "acid" },
    acetic: { name: "Weak Acid (CH₃COOH)", ka: 1.8e-5, basePh: null, type: "acid" },
    battery: { name: "Battery Acid (H₂SO₄)", ka: 1e3, basePh: 1.0, type: "preset" },
    coffee: { name: "Black Coffee", ka: 1e-5, basePh: 5.0, type: "preset" },
    water: { name: "Pure Water (H₂O)", ka: 1e-14, basePh: 7.0, type: "preset" },
    blood: { name: "Human Blood (Buffer)", ka: 4.5e-7, basePh: 7.4, type: "preset" },
    soap: { name: "Hand Soap Solution", ka: 1e-10, basePh: 10.0, type: "preset" },
    bleach: { name: "Household Bleach", ka: 3e-8, basePh: 12.6, type: "preset" }
  };

  function computeSolutionPH(solutionKey, concM, naohMl, mode) {
    const sol = SOLUTIONS[solutionKey] || SOLUTIONS.acetic;
    if (mode === "explorer" && sol.basePh !== null) {
      // Adding NaOH or changing concentration gently shifts explorer solutions toward NaOH pH
      if (naohMl <= 0.01) {
        if (solutionKey === "water") return 7.0;
        const shift = Math.log10(concM / 0.15) * (sol.basePh < 7 ? -0.35 : 0.35);
        return SimLab.util.clamp(sol.basePh + shift, 0.2, 13.8);
      }
    }

    // Exact monoprotic charge-balance bisection for acid + NaOH titration
    let caEff = concM;
    let ka = sol.ka;
    if (sol.basePh !== null) {
      if (sol.basePh < 7) {
        const h0 = Math.pow(10, -sol.basePh);
        caEff = h0;
        ka = 1e6;
      } else if (sol.basePh === 7) {
        caEff = 0;
      } else {
        // Basic preset plus added NaOH
        const oh0 = Math.pow(10, -(14 - sol.basePh));
        const totalV = V_ANALYTE_ML + naohMl;
        const ohTotal = (oh0 * V_ANALYTE_ML + C_NAOH * naohMl) / totalV;
        const ohEq = 0.5 * (ohTotal + Math.sqrt(ohTotal * ohTotal + 4 * KW));
        return SimLab.util.clamp(14 + Math.log10(ohEq), 0, 14);
      }
    }

    const vTot = V_ANALYTE_ML + naohMl;
    const ca = (caEff * V_ANALYTE_ML) / vTot;
    const cb = (C_NAOH * naohMl) / vTot;

    let lo = 0.0;
    let hi = 14.0;
    for (let i = 0; i < 44; i++) {
      const mid = 0.5 * (lo + hi);
      const h = Math.pow(10, -mid);
      const oh = KW / h;
      const aMinus = ca * (ka / (h + ka));
      const f = h + cb - oh - aMinus;
      if (f > 0) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  function getIndicatorColor(ph, indicator) {
    if (indicator === "phenolphthalein") {
      if (ph < 8.2) return "rgba(186, 230, 253, 0.28)";
      const t = SimLab.util.clamp((ph - 8.2) / 1.8, 0, 1);
      const r = Math.round(SimLab.util.lerp(200, 236, t));
      const g = Math.round(SimLab.util.lerp(220, 72, t));
      const b = Math.round(SimLab.util.lerp(245, 153, t));
      return `rgba(${r}, ${g}, ${b}, ${0.32 + t * 0.45})`;
    }
    if (indicator === "bromothymol") {
      if (ph <= 6.0) return "rgba(250, 204, 21, 0.58)";
      if (ph >= 7.6) return "rgba(37, 99, 235, 0.62)";
      const t = (ph - 6.0) / 1.6;
      const r = Math.round(SimLab.util.lerp(250, 34, t));
      const g = Math.round(SimLab.util.lerp(204, 180, t));
      const b = Math.round(SimLab.util.lerp(21, 140, t));
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }
    // Universal Indicator rainbow spectrum
    const hue = SimLab.util.clamp(((ph - 1) / 12) * 265, 0, 270);
    return `hsla(${Math.round(hue)}, 85%, 52%, 0.58)`;
  }

  SimLab.register({
    id: "acidbase",
    title: "pH Scale & Acid-Base Titration Lab",
    category: "chemistry",
    subtitle: "Titration Curves, Equivalence Points & Indicators",
    icon: "🧪",
    color: "#ec4899",
    description:
      "Perform virtual acid-base titrations with a dripping burette and magnetic stir bar. Explore strong vs. weak acids, buffer regions, indicator color transitions, and ion concentrations.",
    tags: ["pH", "Titration", "Buffer", "Equivalence"],
    hint: "Use the dropwise NaOH buttons or drag the Titrant Volume slider to hit the equivalence point!",
    presets: [
      { label: "Weak Acid Titration", params: { mode: "titration", solution: "acetic", analyteConc: 0.16, naohVol: 0, indicator: "phenolphthalein" } },
      { label: "Strong Acid Titration", params: { mode: "titration", solution: "hcl", analyteConc: 0.16, naohVol: 0, indicator: "bromothymol" } },
      { label: "Half-Equivalence Buffer", params: { mode: "titration", solution: "acetic", analyteConc: 0.16, naohVol: 10.0, indicator: "universal" } },
      { label: "Everyday pH Explorer", params: { mode: "explorer", solution: "coffee", analyteConc: 0.15, naohVol: 0, indicator: "universal" } }
    ],
    controls: [
      {
        type: "select",
        key: "mode",
        label: "Lab Mode",
        default: "titration",
        options: [
          { value: "titration", label: "Acid-Base Titration Curve Lab" },
          { value: "explorer", label: "pH Scale Explorer" }
        ]
      },
      {
        type: "select",
        key: "solution",
        label: "Analyte / Solution (25 mL)",
        default: "acetic",
        options: [
          { value: "acetic", label: "Weak Acid (CH₃COOH)" },
          { value: "hcl", label: "Strong Acid (HCl)" },
          { value: "battery", label: "Battery Acid (pH ~1.0)" },
          { value: "coffee", label: "Black Coffee (pH ~5.0)" },
          { value: "water", label: "Pure Water (pH 7.0)" },
          { value: "blood", label: "Human Blood (pH 7.4)" },
          { value: "soap", label: "Hand Soap (pH 10.0)" },
          { value: "bleach", label: "Household Bleach (pH 12.6)" }
        ]
      },
      { type: "range", key: "analyteConc", label: "Analyte Molarity", min: 0.05, max: 0.4, step: 0.01, default: 0.16, unit: " M" },
      { type: "range", key: "naohVol", label: "Added 0.20M NaOH", min: 0, max: 50, step: 0.1, default: 0, unit: " mL" },
      { type: "action", id: "add1ml", label: "💧 +1.0 mL NaOH", variant: "primary" },
      { type: "action", id: "addDrop", label: "🔬 +0.1 mL Drop", variant: "primary" },
      { type: "action", id: "resetBeaker", label: "↺ Empty Burette (0 mL)", variant: "secondary", fullWidth: true },
      {
        type: "select",
        key: "indicator",
        label: "Color Indicator",
        default: "phenolphthalein",
        options: [
          { value: "phenolphthalein", label: "Phenolphthalein (Clear → Pink)" },
          { value: "bromothymol", label: "Bromothymol Blue (Yellow → Blue)" },
          { value: "universal", label: "Universal Indicator (Rainbow)" }
        ]
      },
      { type: "checkbox", key: "showIons", label: "Show Ion Concentration Chart", default: true }
    ],
    theory: {
      summary:
        "During titration of an acid HA with strong base NaOH, pH rises slowly through the buffer region (for weak acids, pH = pKa at half-equivalence) and shoots sharply upward at the equivalence point where moles of OH⁻ equal initial moles of acid.",
      formulas: [
        "pH = −log₁₀[H₃O⁺],   pOH = −log₁₀[OH⁻]",
        "pH + pOH = 14.00  (at 25 °C)",
        "Henderson-Hasselbalch: pH = pKa + log₁₀([A⁻] / [HA])",
        "Equivalence: C_a V_a = C_b V_eq"
      ],
      challenges: [
        "Challenge 1: For 25 mL of 0.16 M CH₃COOH titrated with 0.20 M NaOH, calculate the equivalence volume V_eq = (0.16 × 25) / 0.20 = 20.0 mL, then add NaOH dropwise from 19.5 mL to 20.5 mL!",
        "Challenge 2: At exactly half-equivalence (10.0 mL NaOH), verify that the pH equals pKa ≈ 4.74.",
        "Challenge 3: Compare Phenolphthalein vs. Bromothymol Blue color transitions near pH 7.0–9.0."
      ]
    },

    init(state) {
      state.stirAngle = 0;
      state.drops = [];
      state.ions = [];
      for (let i = 0; i < 28; i++) {
        state.ions.push({
          rx: Math.random(),
          ry: Math.random(),
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45
        });
      }
    },

    onAction(state, actionId) {
      if (actionId === "add1ml") {
        state.params.naohVol = Math.min(50, Math.round((state.params.naohVol + 1.0) * 10) / 10);
        state.drops.push({ yOffset: 0, speed: 280 });
        SimLab.audio.playPop();
      } else if (actionId === "addDrop") {
        state.params.naohVol = Math.min(50, Math.round((state.params.naohVol + 0.1) * 10) / 10);
        state.drops.push({ yOffset: 0, speed: 240 });
        SimLab.audio.playTone(680, 0.04, "sine", 0.03);
      } else if (actionId === "resetBeaker") {
        state.params.naohVol = 0;
        state.drops = [];
      }
      if (typeof state.syncControlUI === "function") state.syncControlUI();
    },

    update(state, dt) {
      state.stirAngle += dt * 11;
      for (let i = state.drops.length - 1; i >= 0; i--) {
        state.drops[i].yOffset += state.drops[i].speed * dt;
        if (state.drops[i].yOffset > 120) state.drops.splice(i, 1);
      }
      for (const ion of state.ions) {
        ion.rx += ion.vx * dt;
        ion.ry += ion.vy * dt;
        if (ion.rx < 0.05 || ion.rx > 0.95) ion.vx *= -1;
        if (ion.ry < 0.08 || ion.ry > 0.92) ion.vy *= -1;
        ion.rx = SimLab.util.clamp(ion.rx, 0.05, 0.95);
        ion.ry = SimLab.util.clamp(ion.ry, 0.08, 0.92);
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const p = state.params;
      const ph = computeSolutionPH(p.solution, p.analyteConc, p.naohVol, p.mode);

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, w, h);
      SimLab.util.drawGrid(ctx, w, h, 36);

      // Lab bench
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, h - 42, w, 42);
      ctx.strokeStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(0, h - 42);
      ctx.lineTo(w, h - 42);
      ctx.stroke();

      // Beaker geometry
      const beakerX = Math.max(70, w * 0.12);
      const beakerW = 190;
      const beakerH = 195;
      const beakerBottom = h - 46;
      const beakerTop = beakerBottom - beakerH;
      const liquidFrac = SimLab.util.clamp(0.38 + (p.naohVol / 50) * 0.45, 0.35, 0.88);
      const liquidTop = beakerBottom - beakerH * liquidFrac;

      // Burette above beaker (in titration mode or when NaOH added)
      const buretteX = beakerX + beakerW / 2;
      ctx.save();
      ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.fillRect(buretteX - 11, 20, 22, 130);
      ctx.strokeRect(buretteX - 11, 20, 22, 130);
      // Titrant remaining inside burette
      const remFrac = 1 - p.naohVol / 50;
      ctx.fillStyle = "rgba(186, 230, 253, 0.42)";
      ctx.fillRect(buretteX - 9, 22 + (1 - remFrac) * 124, 18, remFrac * 124);
      // Burette tip & stopcock
      ctx.beginPath();
      ctx.moveTo(buretteX - 5, 150);
      ctx.lineTo(buretteX + 5, 150);
      ctx.lineTo(buretteX + 2, 178);
      ctx.lineTo(buretteX - 2, 178);
      ctx.closePath();
      ctx.fillStyle = "#cbd5e1";
      ctx.fill();
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(buretteX - 12, 156, 24, 6);

      // Falling NaOH drops
      ctx.fillStyle = "#bae6fd";
      for (const dr of state.drops) {
        const dy = 180 + dr.yOffset;
        if (dy < liquidTop) {
          ctx.beginPath();
          ctx.arc(buretteX, dy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Liquid inside beaker
      ctx.save();
      ctx.fillStyle = getIndicatorColor(ph, p.indicator);
      ctx.fillRect(beakerX + 3, liquidTop, beakerW - 6, beakerBottom - liquidTop - 3);

      // Meniscus highlight
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beakerX + 3, liquidTop);
      ctx.lineTo(beakerX + beakerW - 3, liquidTop);
      ctx.stroke();

      // Floating H3O+ (red) / OH- (blue) ions
      const hFraction = SimLab.util.clamp((14 - ph) / 14, 0.04, 0.96);
      const hCount = Math.round(state.ions.length * hFraction);
      state.ions.forEach((ion, idx) => {
        const ix = beakerX + 12 + ion.rx * (beakerW - 24);
        const iy = liquidTop + 10 + ion.ry * Math.max(20, beakerBottom - liquidTop - 22);
        ctx.beginPath();
        ctx.arc(ix, iy, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = idx < hCount ? "#fb7185" : "#38bdf8";
        ctx.fill();
      });

      // Magnetic stir bar spinning at bottom
      const stirW = Math.max(4, Math.abs(Math.cos(state.stirAngle)) * 28);
      ctx.fillStyle = "#f8fafc";
      SimLab.util.roundRect(ctx, buretteX - stirW, beakerBottom - 12, stirW * 2, 7, 3);
      ctx.fill();

      // Beaker glass walls
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerTop);
      ctx.lineTo(beakerX, beakerBottom);
      ctx.lineTo(beakerX + beakerW, beakerBottom);
      ctx.lineTo(beakerX + beakerW, beakerTop);
      ctx.stroke();
      ctx.restore();

      // Digital pH Meter Probe dipped in beaker
      const meterX = beakerX + beakerW + 26;
      const meterY = beakerTop - 16;
      ctx.save();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(beakerX + 34, liquidTop + 26);
      ctx.lineTo(beakerX + 34, beakerTop - 22);
      ctx.lineTo(meterX, meterY + 26);
      ctx.stroke();

      SimLab.util.roundRect(ctx, meterX, meterY, 108, 66, 10);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = ph < 6.5 ? "#fb7185" : ph > 7.5 ? "#38bdf8" : "#34d399";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "700 10px 'Segoe UI', sans-serif";
      ctx.fillText("DIGITAL pH METER", meterX + 10, meterY + 18);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 22px Consolas, monospace";
      ctx.fillText(ph.toFixed(2), meterX + 14, meterY + 46);
      ctx.restore();

      // Right-hand Charts: Titration Curve + Ion Concentrations
      const chartW = Math.min(340, Math.max(240, w - (meterX + 132)));
      const chartX = w - chartW - 14;

      if (chartW >= 200) {
        const curvePts = [];
        for (let v = 0; v <= 50; v += 0.5) {
          curvePts.push({ x: v, y: computeSolutionPH(p.solution, p.analyteConc, v, p.mode) });
        }
        SimLab.util.drawGraph(
          ctx,
          chartX,
          16,
          chartW,
          180,
          "Titration Curve: pH vs. NaOH Added",
          "mL NaOH",
          "pH",
          [{ name: "pH", color: "#f472b6", data: curvePts }],
          0,
          14,
          { xMin: 0, xMax: 50, yDecimals: 0 }
        );

        // Current point on titration curve
        const dotX = chartX + 42 + (p.naohVol / 50) * (chartW - 56);
        const dotY = 16 + 26 + (1 - ph / 14) * (180 - 50);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Equivalence point marker for acids
        const sol = SOLUTIONS[p.solution] || SOLUTIONS.acetic;
        if (sol.type === "acid") {
          const vEq = (p.analyteConc * V_ANALYTE_ML) / C_NAOH;
          if (vEq <= 50) {
            const eqX = chartX + 42 + (vEq / 50) * (chartW - 56);
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
            ctx.beginPath();
            ctx.moveTo(eqX, 42);
            ctx.lineTo(eqX, 172);
            ctx.stroke();
            ctx.fillStyle = "#34d399";
            ctx.font = "600 10px Consolas, monospace";
            ctx.fillText(`Veq=${vEq.toFixed(1)}mL`, Math.min(chartX + chartW - 76, eqX + 4), 56);
            ctx.restore();
          }
        }

        if (p.showIons) {
          const hConcLog = 14 - ph; // 14 - pH gives height scale for log10([H+]) + 14
          const ohConcLog = ph; // 14 - pOH = pH
          SimLab.util.drawBarChart(
            ctx,
            chartX,
            210,
            chartW,
            142,
            "Relative Ion Concentration (log₁₀ scale)",
            [
              { label: "H₃O⁺ (Acid)", value: hConcLog, color: "#fb7185", displayValue: `10^-${ph.toFixed(1)}` },
              { label: "OH⁻ (Base)", value: ohConcLog, color: "#38bdf8", displayValue: `10^-${(14 - ph).toFixed(1)}` }
            ],
            14
          );
        }
      }
    },

    getHud(state) {
      const p = state.params;
      const ph = computeSolutionPH(p.solution, p.analyteConc, p.naohVol, p.mode);
      const poh = 14 - ph;
      const vEq = (p.analyteConc * V_ANALYTE_ML) / C_NAOH;
      return [
        { label: "pH", value: ph.toFixed(2) },
        { label: "pOH", value: poh.toFixed(2) },
        { label: "NaOH", value: `${p.naohVol.toFixed(1)} mL` },
        { label: "V_eq (acid)", value: `${vEq.toFixed(1)} mL` }
      ];
    }
  });
})();
