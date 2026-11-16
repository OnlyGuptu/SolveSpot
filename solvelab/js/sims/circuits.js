(function () {
  "use strict";

  function solveCircuit(p) {
    const V = p.voltage;
    const R1 = Math.max(1, p.r1);
    const R2 = Math.max(1, p.r2);
    const R3 = Math.max(1, p.r3);

    let req = R1;
    let iTot = 0;
    let i1 = 0;
    let i2 = 0;
    let i3 = 0;
    let v1 = 0;
    let v2 = 0;
    let v3 = 0;

    if (p.topology === "simple") {
      req = R1;
    } else if (p.topology === "series") {
      req = R1 + R2;
    } else if (p.topology === "parallel") {
      req = (R1 * R2) / (R1 + R2);
    } else {
      const r23 = (R2 * R3) / (R2 + R3);
      req = R1 + r23;
    }

    if (p.switchClosed) {
      iTot = V / req;
      if (p.topology === "simple") {
        i1 = iTot;
        v1 = V;
      } else if (p.topology === "series") {
        i1 = iTot;
        i2 = iTot;
        v1 = i1 * R1;
        v2 = i2 * R2;
      } else if (p.topology === "parallel") {
        i1 = V / R1;
        i2 = V / R2;
        v1 = V;
        v2 = V;
      } else {
        i1 = iTot;
        v1 = i1 * R1;
        const v23 = V - v1;
        i2 = v23 / R2;
        i3 = v23 / R3;
        v2 = v23;
        v3 = v23;
      }
    }

    return {
      V,
      R1,
      R2,
      R3,
      req,
      iTot,
      i1,
      i2,
      i3,
      v1,
      v2,
      v3,
      pTot: p.switchClosed ? V * iTot : 0,
      p1: i1 * i1 * R1,
      p2: i2 * i2 * R2,
      p3: i3 * i3 * R3
    };
  }

  function getLayout(topology, canvas) {
    const w = canvas.logicalWidth || 800;
    const h = canvas.logicalHeight || 500;
    const left = Math.max(90, w * 0.14);
    const right = Math.min(w - 280, w * 0.68);
    const midX = (left + right) / 2;
    const top = 88;
    const bottom = h - 78;
    const midY = (top + bottom) / 2;
    return { w, h, left, right, midX, top, bottom, midY };
  }

  function drawBulb(ctx, x, y, label, resistance, current, power, showValues) {
    const brightness = SimLab.util.clamp(power / 18, 0, 1.3);
    ctx.save();

    if (brightness > 0.02) {
      const glowR = 26 + brightness * 42;
      const g = ctx.createRadialGradient(x, y, 4, x, y, glowR);
      g.addColorStop(0, `rgba(253, 224, 71, ${Math.min(0.85, brightness * 0.7)})`);
      g.addColorStop(0.5, `rgba(251, 191, 36, ${Math.min(0.35, brightness * 0.3)})`);
      g.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glass bulb
    ctx.beginPath();
    ctx.arc(x, y, 21, 0, Math.PI * 2);
    ctx.fillStyle = brightness > 0.05 ? `rgba(254, 240, 138, ${0.18 + Math.min(0.65, brightness * 0.55)})` : "rgba(30, 41, 59, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Filament zigzag
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 6);
    ctx.lineTo(x - 6, y - 6);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x + 6, y - 6);
    ctx.lineTo(x + 10, y + 6);
    ctx.strokeStyle = brightness > 0.05 ? "#fef08a" : "#64748b";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${label} (${resistance} Ω)`, x, y - 28);

    if (showValues) {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText(`I=${current.toFixed(2)}A  P=${power.toFixed(1)}W`, x, y + 36);
    }
    ctx.restore();
  }

  function drawChargesAlongPath(ctx, points, phase, speed, color, dirSign) {
    // Compute total length
    let totalLen = 0;
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.hypot(dx, dy);
      segs.push({ x1: points[i].x, y1: points[i].y, dx, dy, len });
      totalLen += len;
    }
    if (totalLen <= 1) return;

    const spacing = 34;
    const count = Math.floor(totalLen / spacing);
    const offset = ((phase * speed * dirSign) % spacing + spacing) % spacing;

    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i <= count; i++) {
      const dist = i * spacing + offset;
      if (dist > totalLen) continue;
      let acc = 0;
      for (const s of segs) {
        if (acc + s.len >= dist) {
          const t = (dist - acc) / Math.max(1e-6, s.len);
          const px = s.x1 + s.dx * t;
          const py = s.y1 + s.dy * t;
          ctx.beginPath();
          ctx.arc(px, py, 3.6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        acc += s.len;
      }
    }
    ctx.restore();
  }

  SimLab.register({
    id: "circuits",
    title: "Ohm's Law & DC Circuit Workbench",
    category: "physics",
    subtitle: "Series, Parallel, Bulb Power & Animated Charge Flow",
    icon: "⚡",
    color: "#38bdf8",
    description:
      "Build simple, series, parallel, and combination DC circuits. Toggle the knife switch, compare electron vs. conventional flow, and inspect live current, power, and I–V curves.",
    tags: ["Ohm's Law", "Circuits", "Power", "I-V Graph"],
    hint: "Click the Knife Switch on the top wire to open/close the circuit, or drag the yellow Meter Probe over any bulb!",
    presets: [
      { label: "Simple Ohm's Law", params: { topology: "simple", voltage: 12, r1: 12, switchClosed: true } },
      { label: "Series (R1 + R2)", params: { topology: "series", voltage: 12, r1: 10, r2: 20, switchClosed: true } },
      { label: "Parallel (R1 || R2)", params: { topology: "parallel", voltage: 12, r1: 10, r2: 20, switchClosed: true } },
      { label: "Combo (R1 + R2||R3)", params: { topology: "combo", voltage: 18, r1: 8, r2: 16, r3: 24, switchClosed: true } }
    ],
    controls: [
      {
        type: "select",
        key: "topology",
        label: "Circuit Topology",
        default: "parallel",
        options: [
          { value: "simple", label: "Simple Ohm's Law Loop (R₁)" },
          { value: "series", label: "Series Circuit (R₁ + R₂)" },
          { value: "parallel", label: "Parallel Circuit (R₁ || R₂)" },
          { value: "combo", label: "Series-Parallel (R₁ + R₂||R₃)" }
        ]
      },
      { type: "range", key: "voltage", label: "Battery Voltage (V)", min: 1, max: 24, step: 0.5, default: 12, unit: " V" },
      { type: "range", key: "r1", label: "Bulb / Resistor R₁", min: 2, max: 100, step: 1, default: 10, unit: " Ω" },
      { type: "range", key: "r2", label: "Bulb / Resistor R₂", min: 2, max: 100, step: 1, default: 20, unit: " Ω" },
      { type: "range", key: "r3", label: "Bulb / Resistor R₃", min: 2, max: 100, step: 1, default: 30, unit: " Ω" },
      { type: "checkbox", key: "switchClosed", label: "Circuit Switch Closed", default: true },
      {
        type: "select",
        key: "flowMode",
        label: "Charge Carrier View",
        default: "electron",
        options: [
          { value: "electron", label: "Electron Flow (− to +)" },
          { value: "conventional", label: "Conventional Current (+ to −)" }
        ]
      },
      { type: "checkbox", key: "showValues", label: "Show Values & Live I–V Graph", default: true }
    ],
    theory: {
      summary:
        "Ohm's Law states V = I · R. In series circuits, current is identical through every component and resistances add (Req = R₁ + R₂). In parallel circuits, voltage across each branch is identical and total current splits among branches (1/Req = 1/R₁ + 1/R₂).",
      formulas: [
        "V = I · R_eq,   P = V · I = I² R",
        "Series: R_eq = R₁ + R₂",
        "Parallel: 1 / R_eq = 1 / R₁ + 1 / R₂"
      ],
      challenges: [
        "Challenge 1: Set R₁ = 10 Ω and R₂ = 20 Ω at 12 V. Compare total current and bulb brightness in Series vs. Parallel.",
        "Challenge 2: In Series-Parallel mode, increase R₂ from 10 Ω to 80 Ω. Watch what happens to the voltage drop across R₁ and the brightness of R₃!",
        "Challenge 3: Switch between Electron Flow and Conventional Current and observe the direction of moving charge carriers."
      ]
    },

    init(state, canvas) {
      const L = getLayout(state.params.topology, canvas || { logicalWidth: 800, logicalHeight: 500 });
      state.chargePhase = 0;
      state.probe = { x: L.midX, y: L.bottom - 38 };
      state.draggingProbe = false;
    },

    update(state, dt) {
      state.chargePhase += dt * 42;
    },

    render(state, ctx, canvas) {
      const p = state.params;
      const L = getLayout(p.topology, canvas);
      const sol = solveCircuit(p);

      ctx.fillStyle = "#080d1a";
      ctx.fillRect(0, 0, L.w, L.h);
      SimLab.util.drawGrid(ctx, L.w, L.h, 36);

      const dirSign = p.flowMode === "electron" ? -1 : 1;
      const carrierColor = p.flowMode === "electron" ? "#38bdf8" : "#fb7185";

      // Switch coords on top wire
      const swX1 = L.left + 64;
      const swX2 = L.left + 114;

      // Wire Drawing Helper
      ctx.save();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const loopBranches = [];

      if (p.topology === "simple") {
        // Left battery, right bulb
        ctx.beginPath();
        ctx.moveTo(L.left, L.top);
        ctx.lineTo(swX1, L.top);
        ctx.moveTo(swX2, L.top);
        ctx.lineTo(L.right, L.top);
        ctx.lineTo(L.right, L.bottom);
        ctx.lineTo(L.left, L.bottom);
        ctx.lineTo(L.left, L.top);
        ctx.stroke();

        loopBranches.push({
          pts: [
            { x: L.left, y: L.top },
            { x: L.right, y: L.top },
            { x: L.right, y: L.bottom },
            { x: L.left, y: L.bottom },
            { x: L.left, y: L.top }
          ],
          current: sol.iTot
        });
      } else if (p.topology === "series") {
        ctx.beginPath();
        ctx.moveTo(L.left, L.top);
        ctx.lineTo(swX1, L.top);
        ctx.moveTo(swX2, L.top);
        ctx.lineTo(L.right, L.top);
        ctx.lineTo(L.right, L.bottom);
        ctx.lineTo(L.left, L.bottom);
        ctx.lineTo(L.left, L.top);
        ctx.stroke();

        loopBranches.push({
          pts: [
            { x: L.left, y: L.top },
            { x: L.right, y: L.top },
            { x: L.right, y: L.bottom },
            { x: L.left, y: L.bottom },
            { x: L.left, y: L.top }
          ],
          current: sol.iTot
        });
      } else if (p.topology === "parallel") {
        const b1X = L.midX + 10;
        const b2X = L.right;
        ctx.beginPath();
        ctx.moveTo(L.left, L.top);
        ctx.lineTo(swX1, L.top);
        ctx.moveTo(swX2, L.top);
        ctx.lineTo(b2X, L.top);
        ctx.lineTo(b2X, L.bottom);
        ctx.lineTo(L.left, L.bottom);
        ctx.lineTo(L.left, L.top);
        ctx.moveTo(b1X, L.top);
        ctx.lineTo(b1X, L.bottom);
        ctx.stroke();

        loopBranches.push({
          pts: [
            { x: L.left, y: L.top },
            { x: b1X, y: L.top }
          ],
          current: sol.iTot
        });
        loopBranches.push({
          pts: [
            { x: b1X, y: L.bottom },
            { x: L.left, y: L.bottom },
            { x: L.left, y: L.top }
          ],
          current: sol.iTot
        });
        loopBranches.push({
          pts: [
            { x: b1X, y: L.top },
            { x: b1X, y: L.bottom }
          ],
          current: sol.i1
        });
        loopBranches.push({
          pts: [
            { x: b1X, y: L.top },
            { x: b2X, y: L.top },
            { x: b2X, y: L.bottom },
            { x: b1X, y: L.bottom }
          ],
          current: sol.i2
        });
      } else {
        // Combo: R1 on top-right, R2 || R3 on right two vertical branches
        const b2X = L.midX + 30;
        const b3X = L.right;
        ctx.beginPath();
        ctx.moveTo(L.left, L.top);
        ctx.lineTo(swX1, L.top);
        ctx.moveTo(swX2, L.top);
        ctx.lineTo(b3X, L.top);
        ctx.lineTo(b3X, L.bottom);
        ctx.lineTo(L.left, L.bottom);
        ctx.lineTo(L.left, L.top);
        ctx.moveTo(b2X, L.top);
        ctx.lineTo(b2X, L.bottom);
        ctx.stroke();

        loopBranches.push({
          pts: [
            { x: L.left, y: L.top },
            { x: b2X, y: L.top }
          ],
          current: sol.i1
        });
        loopBranches.push({
          pts: [
            { x: b2X, y: L.bottom },
            { x: L.left, y: L.bottom },
            { x: L.left, y: L.top }
          ],
          current: sol.i1
        });
        loopBranches.push({
          pts: [
            { x: b2X, y: L.top },
            { x: b2X, y: L.bottom }
          ],
          current: sol.i2
        });
        loopBranches.push({
          pts: [
            { x: b2X, y: L.top },
            { x: b3X, y: L.top },
            { x: b3X, y: L.bottom },
            { x: b2X, y: L.bottom }
          ],
          current: sol.i3
        });
      }
      ctx.restore();

      // Animated Charge Carriers
      if (p.switchClosed) {
        for (const br of loopBranches) {
          if (br.current > 0.01) {
            drawChargesAlongPath(ctx, br.pts, state.chargePhase, 0.55 + br.current * 0.48, carrierColor, dirSign);
          }
        }
      }

      // Draw Battery on Left Wire
      ctx.save();
      const batY = L.midY;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(L.left - 18, batY - 34, 36, 68);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.strokeRect(L.left - 18, batY - 34, 36, 68);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(L.left - 16, batY - 32, 32, 18);
      ctx.fillStyle = "#fff";
      ctx.font = "800 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", L.left, batY - 19);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("−", L.left, batY + 26);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 12px Consolas, monospace";
      ctx.fillText(`${p.voltage.toFixed(1)}V`, L.left - 44, batY + 4);
      ctx.restore();

      // Draw Knife Switch
      ctx.save();
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(swX1, L.top, 5, 0, Math.PI * 2);
      ctx.arc(swX2, L.top, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.switchClosed ? "#34d399" : "#f87171";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(swX1, L.top);
      if (p.switchClosed) ctx.lineTo(swX2, L.top);
      else ctx.lineTo(swX2 - 8, L.top - 26);
      ctx.stroke();
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.switchClosed ? "Switch CLOSED (click)" : "Switch OPEN (click)", (swX1 + swX2) / 2, L.top - 32);
      ctx.restore();

      // Draw Bulbs & Store Probe Hitboxes
      const bulbNodes = [];
      if (p.topology === "simple") {
        bulbNodes.push({ x: L.right, y: L.midY, label: "R₁", r: sol.R1, i: sol.i1, v: sol.v1, p: sol.p1 });
      } else if (p.topology === "series") {
        bulbNodes.push({ x: L.midX + 40, y: L.top, label: "R₁", r: sol.R1, i: sol.i1, v: sol.v1, p: sol.p1 });
        bulbNodes.push({ x: L.right, y: L.midY, label: "R₂", r: sol.R2, i: sol.i2, v: sol.v2, p: sol.p2 });
      } else if (p.topology === "parallel") {
        bulbNodes.push({ x: L.midX + 10, y: L.midY, label: "R₁", r: sol.R1, i: sol.i1, v: sol.v1, p: sol.p1 });
        bulbNodes.push({ x: L.right, y: L.midY, label: "R₂", r: sol.R2, i: sol.i2, v: sol.v2, p: sol.p2 });
      } else {
        bulbNodes.push({ x: L.midX - 18, y: L.top, label: "R₁", r: sol.R1, i: sol.i1, v: sol.v1, p: sol.p1 });
        bulbNodes.push({ x: L.midX + 30, y: L.midY, label: "R₂", r: sol.R2, i: sol.i2, v: sol.v2, p: sol.p2 });
        bulbNodes.push({ x: L.right, y: L.midY, label: "R₃", r: sol.R3, i: sol.i3, v: sol.v3, p: sol.p3 });
      }

      for (const b of bulbNodes) {
        drawBulb(ctx, b.x, b.y, b.label, b.r, b.i, b.p, p.showValues);
      }

      // Live I-V Characteristic Curve
      if (p.showValues) {
        const maxV = 24;
        const maxI = Math.max(2, maxV / Math.max(1, sol.req));
        const ivPts = [];
        for (let vv = 0; vv <= maxV; vv += 1) {
          ivPts.push({ x: vv, y: p.switchClosed ? vv / sol.req : 0 });
        }
        const gx = L.w - 252;
        const gy = L.h - 158;
        SimLab.util.drawGraph(
          ctx,
          gx,
          gy,
          238,
          144,
          `I–V Curve (Req = ${sol.req.toFixed(1)} Ω)`,
          "V (volts)",
          "I (A)",
          [{ name: "I = V/Req", color: "#38bdf8", data: ivPts }],
          0,
          maxI,
          { xMin: 0, xMax: maxV, yDecimals: 1 }
        );

        // Highlight active operating point on graph
        const px = gx + 42 + (p.voltage / maxV) * (238 - 56);
        const py = gy + 26 + (1 - sol.iTot / maxI) * (144 - 50);
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
      }

      // Draggable Multimeter Probe
      let probedBulb = null;
      for (const b of bulbNodes) {
        if (Math.hypot(state.probe.x - b.x, state.probe.y - b.y) < 42) {
          probedBulb = b;
          break;
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(state.probe.x, state.probe.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();

      const readText = probedBulb
        ? `${probedBulb.label}: ${probedBulb.v.toFixed(2)}V | ${probedBulb.i.toFixed(2)}A`
        : "Drag Probe onto a Bulb";
      ctx.fillStyle = "rgba(8, 13, 26, 0.9)";
      SimLab.util.roundRect(ctx, state.probe.x + 14, state.probe.y - 14, ctx.measureText(readText).width + 20, 24, 6);
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#fbbf24";
      ctx.font = "700 11px Consolas, monospace";
      ctx.fillText(readText, state.probe.x + 22, state.probe.y + 2);
      ctx.restore();
    },

    getHud(state) {
      const sol = solveCircuit(state.params);
      return [
        { label: "Req", value: `${sol.req.toFixed(2)} Ω` },
        { label: "Total I", value: `${sol.iTot.toFixed(2)} A` },
        { label: "Total Power", value: `${sol.pTot.toFixed(1)} W` },
        { label: "Switch", value: state.params.switchClosed ? "CLOSED" : "OPEN" }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const L = getLayout(state.params.topology, canvas);
      const swMidX = L.left + 89;
      if (Math.hypot(x - swMidX, y - L.top) < 34) {
        state.params.switchClosed = !state.params.switchClosed;
        SimLab.audio.playPop();
        if (typeof state.syncControlUI === "function") state.syncControlUI();
        return;
      }
      if (Math.hypot(x - state.probe.x, y - state.probe.y) < 36) {
        state.draggingProbe = true;
      }
    },

    onPointerMove(state, x, y, canvas) {
      if (!state.draggingProbe) return;
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      state.probe.x = SimLab.util.clamp(x, 20, w - 20);
      state.probe.y = SimLab.util.clamp(y, 20, h - 20);
    },

    onPointerUp(state) {
      state.draggingProbe = false;
    }
  });
})();
