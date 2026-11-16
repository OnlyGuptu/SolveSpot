(function () {
  "use strict";

  const COLORS = ["#38bdf8", "#fbbf24", "#34d399", "#f472b6", "#a78bfa", "#fb7185"];

  function createProjectile(state) {
    const p = state.params;
    const rad = (p.angle * Math.PI) / 180;
    const vx = p.speed * Math.cos(rad);
    const vy = p.speed * Math.sin(rad);
    const color = COLORS[state.trajectories.length % COLORS.length];
    return {
      x: 0,
      y: p.height,
      vx,
      vy,
      ax: 0,
      ay: -Number(p.gravity),
      t: 0,
      maxH: p.height,
      landed: false,
      hitTarget: false,
      color,
      points: [{ t: 0, x: 0, y: p.height, vx, vy, v: p.speed }]
    };
  }

  function worldToScreen(wx, wy, canvas) {
    const w = canvas.logicalWidth || 800;
    const h = canvas.logicalHeight || 500;
    const groundY = h - 54;
    const originX = 72;
    const scale = Math.max(5.5, Math.min(13, (w - 130) / 85));
    return {
      sx: originX + wx * scale,
      sy: groundY - wy * scale,
      groundY,
      originX,
      scale
    };
  }

  function screenToWorld(sx, sy, canvas) {
    const { groundY, originX, scale } = worldToScreen(0, 0, canvas);
    return {
      wx: (sx - originX) / scale,
      wy: (groundY - sy) / scale
    };
  }

  SimLab.register({
    id: "projectile",
    title: "Projectile Motion Lab",
    category: "physics",
    subtitle: "Kinematics, Drag & Parabolic Trajectories",
    icon: "🎯",
    color: "#38bdf8",
    description:
      "Fire projectiles from a movable cannon with adjustable angle, mass, gravity, and quadratic air drag. Inspect every trajectory point with the live probe.",
    tags: ["Kinematics", "Vectors", "Drag", "Energy"],
    hint: "Drag the red target bullseye, drag the cannon barrel/platform, or hover dots with the probe!",
    presets: [
      { label: "45° Max Range", params: { angle: 45, speed: 26, height: 0, gravity: "9.81", airDrag: false } },
      { label: "Moon Shot", params: { angle: 45, speed: 16, height: 2, gravity: "1.62", airDrag: false } },
      { label: "Heavy Drag", params: { angle: 40, speed: 34, height: 2, gravity: "9.81", airDrag: true, dragCoeff: 0.4, mass: 2 } },
      { label: "Cliff Launch", params: { angle: 15, speed: 22, height: 12, gravity: "9.81", airDrag: false } }
    ],
    controls: [
      { type: "action", id: "fire", label: "🚀 Fire Cannon", variant: "primary", fullWidth: true },
      { type: "action", id: "clear", label: "🗑 Clear Paths", variant: "secondary", fullWidth: true },
      { type: "range", key: "angle", label: "Launch Angle", min: 0, max: 90, step: 1, default: 45, unit: "°" },
      { type: "range", key: "speed", label: "Initial Speed", min: 5, max: 45, step: 0.5, default: 26, unit: " m/s" },
      { type: "range", key: "height", label: "Cannon Height", min: 0, max: 15, step: 0.5, default: 2, unit: " m" },
      { type: "range", key: "mass", label: "Projectile Mass", min: 0.5, max: 50, step: 0.5, default: 5, unit: " kg" },
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
      { type: "checkbox", key: "airDrag", label: "Air Resistance (Drag)", default: false },
      { type: "range", key: "dragCoeff", label: "Drag Coefficient (Cd)", min: 0, max: 0.5, step: 0.01, default: 0.15, unit: "" },
      { type: "checkbox", key: "showVel", label: "Velocity Vectors (v, vx, vy)", default: true },
      { type: "checkbox", key: "showAcc", label: "Acceleration Vector (a)", default: false },
      { type: "checkbox", key: "showEnergy", label: "Energy Bar Chart", default: true }
    ],
    theory: {
      summary:
        "Without air resistance, horizontal velocity remains constant while gravity accelerates the projectile downward at g. Quadratic air drag opposes velocity with magnitude proportional to Cd · v² / m, reducing range and creating asymmetric trajectories.",
      formulas: [
        "x(t) = v₀ cos(θ) · t",
        "y(t) = y₀ + v₀ sin(θ) · t − ½ g t²",
        "F_drag = −½ ρ Cd A |v| v",
        "KE = ½ m v²,  PE = m g y"
      ],
      challenges: [
        "Challenge 1: Keep speed at 26 m/s and height at 0 m without air drag. Compare ranges at 30°, 45°, and 60°.",
        "Challenge 2: Turn on Air Resistance with mass = 2 kg and drag = 0.40. Find the new launch angle that maximizes range (hint: it's below 45°!).",
        "Challenge 3: Place the target at 45 m, set height to 10 m, and hit the bullseye on Mars gravity (3.72 m/s²)."
      ]
    },

    init(state) {
      state.targetX = 50;
      state.trajectories = [];
      state.activeShot = createProjectile(state);
      state.trajectories.push(state.activeShot);
      state.probe = { active: false, x: 0, y: 0, nearest: null };
      state.dragging = null;
      state.sampleAccum = 0;
      state.hitBannerTimer = 0;
    },

    onAction(state, actionId, canvas) {
      if (actionId === "fire") {
        if (state.trajectories.length >= 6) {
          state.trajectories.shift();
        }
        const shot = createProjectile(state);
        state.activeShot = shot;
        state.trajectories.push(shot);
        state.sampleAccum = 0;
        SimLab.audio.playLaunch();
      } else if (actionId === "clear") {
        state.trajectories = [];
        state.activeShot = null;
        state.probe.nearest = null;
        SimLab.audio.playPop();
      }
    },

    update(state, dt) {
      if (state.hitBannerTimer > 0) {
        state.hitBannerTimer = Math.max(0, state.hitBannerTimer - dt);
      }

      const shot = state.activeShot;
      if (!shot || shot.landed) return;

      const p = state.params;
      const g = Number(p.gravity);
      const mass = Math.max(0.2, p.mass);
      const dragFactor = p.airDrag ? (0.04 * p.dragCoeff) / mass : 0;

      // RK2 midpoint integration step
      const speed1 = Math.hypot(shot.vx, shot.vy);
      const ax1 = -dragFactor * speed1 * shot.vx;
      const ay1 = -g - dragFactor * speed1 * shot.vy;

      const halfDt = dt * 0.5;
      const mvx = shot.vx + ax1 * halfDt;
      const mvy = shot.vy + ay1 * halfDt;
      const speedMid = Math.hypot(mvx, mvy);
      const ax2 = -dragFactor * speedMid * mvx;
      const ay2 = -g - dragFactor * speedMid * mvy;

      const prevX = shot.x;
      const prevY = shot.y;
      shot.x += mvx * dt;
      shot.y += mvy * dt;
      shot.vx += ax2 * dt;
      shot.vy += ay2 * dt;
      shot.ax = ax2;
      shot.ay = ay2;
      shot.t += dt;
      if (shot.y > shot.maxH) shot.maxH = shot.y;

      if (shot.y <= 0) {
        const frac = prevY / Math.max(1e-6, prevY - shot.y);
        shot.x = prevX + (shot.x - prevX) * SimLab.util.clamp(frac, 0, 1);
        shot.y = 0;
        shot.landed = true;
        shot.points.push({
          t: shot.t,
          x: shot.x,
          y: 0,
          vx: shot.vx,
          vy: shot.vy,
          v: Math.hypot(shot.vx, shot.vy)
        });
        if (Math.abs(shot.x - state.targetX) <= 2.4) {
          shot.hitTarget = true;
          state.hitBannerTimer = 2.8;
          SimLab.audio.playSuccess();
        } else {
          SimLab.audio.playTone(150, 0.08, "sine", 0.04);
        }
        return;
      }

      state.sampleAccum += dt;
      if (state.sampleAccum >= 0.06) {
        state.sampleAccum = 0;
        shot.points.push({
          t: shot.t,
          x: shot.x,
          y: shot.y,
          vx: shot.vx,
          vy: shot.vy,
          v: Math.hypot(shot.vx, shot.vy)
        });
      }
    },

    render(state, ctx, canvas) {
      const w = canvas.logicalWidth || 800;
      const h = canvas.logicalHeight || 500;
      const p = state.params;

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#091326");
      sky.addColorStop(0.78, "#0f203d");
      sky.addColorStop(1, "#14294a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const { groundY, originX, scale } = worldToScreen(0, 0, canvas);

      // Subtle ruler grid every 10 meters
      const meterStep = 10 * scale;
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.09)";
      ctx.lineWidth = 1;
      for (let m = 0; originX + m * scale < w; m += 10) {
        const x = originX + m * scale;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, groundY);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(`${m}m`, x + 3, groundY + 15);
      }
      for (let mh = 10; groundY - mh * scale > 20; mh += 10) {
        const y = groundY - mh * scale;
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.font = "10px Consolas, monospace";
        ctx.fillText(`${mh}m`, 14, y + 3);
      }
      ctx.restore();

      // Ground
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      groundGrad.addColorStop(0, "#14532d");
      groundGrad.addColorStop(0.22, "#0f3d21");
      groundGrad.addColorStop(1, "#071a10");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();

      // Target Bullseye
      const tgt = worldToScreen(state.targetX, 0, canvas);
      ctx.save();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.ellipse(tgt.sx, groundY, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(tgt.sx, groundY, 13, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.ellipse(tgt.sx, groundY, 6, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fca5a5";
      ctx.font = "600 11px Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Target ${state.targetX.toFixed(1)}m`, tgt.sx, groundY + 30);
      ctx.restore();

      // Cannon Platform & Barrel
      const cannonBase = worldToScreen(0, p.height, canvas);
      ctx.save();
      if (p.height > 0.1) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(originX - 18, cannonBase.sy, 36, groundY - cannonBase.sy);
        ctx.strokeStyle = "#64748b";
        ctx.strokeRect(originX - 18, cannonBase.sy, 36, groundY - cannonBase.sy);
      }

      const rad = (p.angle * Math.PI) / 180;
      ctx.translate(cannonBase.sx, cannonBase.sy);
      ctx.rotate(-rad);
      ctx.fillStyle = "#475569";
      SimLab.util.roundRect(ctx, -10, -10, 44, 20, 6);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(28, -9, 7, 18);
      ctx.restore();

      // Cannon pivot wheel
      ctx.save();
      ctx.beginPath();
      ctx.arc(cannonBase.sx, cannonBase.sy, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Trajectories
      for (const traj of state.trajectories) {
        if (traj.points.length < 1) continue;
        ctx.save();
        ctx.strokeStyle = traj.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        traj.points.forEach((pt, idx) => {
          const s = worldToScreen(pt.x, pt.y, canvas);
          if (idx === 0) ctx.moveTo(s.sx, s.sy);
          else ctx.lineTo(s.sx, s.sy);
        });
        if (!traj.landed) {
          const cur = worldToScreen(traj.x, traj.y, canvas);
          ctx.lineTo(cur.sx, cur.sy);
        }
        ctx.stroke();

        // Sample dots
        ctx.fillStyle = traj.color;
        for (const pt of traj.points) {
          const s = worldToScreen(pt.x, pt.y, canvas);
          ctx.beginPath();
          ctx.arc(s.sx, s.sy, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Active Projectile & Vectors
      const shot = state.activeShot;
      if (shot) {
        const sc = worldToScreen(shot.x, shot.y, canvas);
        ctx.save();
        ctx.beginPath();
        ctx.arc(sc.sx, sc.sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = shot.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();

        if (!shot.landed) {
          const vScale = 2.3;
          if (p.showVel) {
            SimLab.util.drawArrow(ctx, sc.sx, sc.sy, sc.sx + shot.vx * vScale, sc.sy, "#22c55e", "vx");
            SimLab.util.drawArrow(ctx, sc.sx, sc.sy, sc.sx, sc.sy - shot.vy * vScale, "#f59e0b", "vy");
            SimLab.util.drawArrow(
              ctx,
              sc.sx,
              sc.sy,
              sc.sx + shot.vx * vScale,
              sc.sy - shot.vy * vScale,
              "#38bdf8",
              "v"
            );
          }
          if (p.showAcc) {
            const aScale = 4.2;
            SimLab.util.drawArrow(
              ctx,
              sc.sx,
              sc.sy,
              sc.sx + shot.ax * aScale,
              sc.sy - shot.ay * aScale,
              "#fb7185",
              "a"
            );
          }
        }
      }

      // Energy Bar Chart
      if (p.showEnergy && shot) {
        const g = Number(p.gravity);
        const vSq = shot.vx * shot.vx + shot.vy * shot.vy;
        const ke = 0.5 * p.mass * vSq;
        const pe = p.mass * g * Math.max(0, shot.y);
        const initE = 0.5 * p.mass * p.speed * p.speed + p.mass * g * p.height;
        const lost = Math.max(0, initE - (ke + pe));
        const maxE = Math.max(10, initE);

        SimLab.util.drawBarChart(
          ctx,
          w - 235,
          14,
          220,
          132,
          "Mechanical Energy (J)",
          [
            { label: "KE", value: ke, color: "#38bdf8", displayValue: ke.toFixed(0) },
            { label: "PE", value: pe, color: "#34d399", displayValue: pe.toFixed(0) },
            { label: "Drag", value: lost, color: "#f87171", displayValue: lost.toFixed(0) },
            { label: "Total", value: ke + pe, color: "#fbbf24", displayValue: (ke + pe).toFixed(0) }
          ],
          maxE
        );
      }

      // Probe Inspector Callout
      if (state.probe && state.probe.nearest) {
        const pt = state.probe.nearest;
        const s = worldToScreen(pt.x, pt.y, canvas);
        ctx.save();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, 8, 0, Math.PI * 2);
        ctx.stroke();

        const boxW = 166;
        const boxH = 66;
        const bx = SimLab.util.clamp(s.sx + 14, 12, w - boxW - 12);
        const by = SimLab.util.clamp(s.sy - 72, 12, groundY - boxH - 8);
        SimLab.util.roundRect(ctx, bx, by, boxW, boxH, 8);
        ctx.fillStyle = "rgba(8, 13, 26, 0.92)";
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();

        ctx.fillStyle = "#fbbf24";
        ctx.font = "700 11px Consolas, monospace";
        ctx.fillText(`Probe  t = ${pt.t.toFixed(2)} s`, bx + 10, by + 18);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(`x = ${pt.x.toFixed(2)} m   y = ${pt.y.toFixed(2)} m`, bx + 10, by + 36);
        ctx.fillText(`|v| = ${pt.v.toFixed(2)} m/s`, bx + 10, by + 53);
        ctx.restore();
      }

      // Direct Hit Banner
      if (state.hitBannerTimer > 0) {
        ctx.save();
        ctx.fillStyle = "rgba(16, 185, 129, 0.92)";
        SimLab.util.roundRect(ctx, w / 2 - 110, 22, 220, 38, 10);
        ctx.fill();
        ctx.fillStyle = "#042f2e";
        ctx.font = "800 15px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎯 DIRECT HIT ON TARGET!", w / 2, 46);
        ctx.restore();
      }
    },

    getHud(state) {
      const shot = state.activeShot;
      if (!shot) {
        return [{ label: "Status", value: "Ready to fire" }];
      }
      return [
        { label: "Range x", value: `${shot.x.toFixed(2)} m` },
        { label: "Height y", value: `${shot.y.toFixed(2)} m` },
        { label: "Max H", value: `${shot.maxH.toFixed(2)} m` },
        { label: "Speed", value: `${Math.hypot(shot.vx, shot.vy).toFixed(2)} m/s` },
        { label: "Flight t", value: `${shot.t.toFixed(2)} s` }
      ];
    },

    onPointerDown(state, x, y, canvas) {
      const tgt = worldToScreen(state.targetX, 0, canvas);
      if (Math.hypot(x - tgt.sx, y - tgt.groundY) < 28) {
        state.dragging = "target";
        return;
      }
      const cannon = worldToScreen(0, state.params.height, canvas);
      if (Math.hypot(x - cannon.sx, y - cannon.sy) < 55) {
        state.dragging = "cannon";
      }
    },

    onPointerMove(state, x, y, canvas) {
      const world = screenToWorld(x, y, canvas);
      if (state.dragging === "target") {
        state.targetX = SimLab.util.clamp(world.wx, 6, 95);
        return;
      }
      if (state.dragging === "cannon") {
        const cannon = worldToScreen(0, state.params.height, canvas);
        const dx = x - cannon.sx;
        const dy = cannon.sy - y;
        if (dx > 8) {
          const deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
          state.params.angle = SimLab.util.clamp(deg, 0, 90);
        } else {
          state.params.height = SimLab.util.clamp(Math.round(world.wy * 2) / 2, 0, 15);
        }
        return;
      }

      // Probe nearest recorded trajectory dot
      let best = null;
      let bestDist = 18;
      for (const traj of state.trajectories) {
        for (const pt of traj.points) {
          const sc = worldToScreen(pt.x, pt.y, canvas);
          const d = Math.hypot(sc.sx - x, sc.sy - y);
          if (d < bestDist) {
            bestDist = d;
            best = pt;
          }
        }
      }
      state.probe.nearest = best;
    },

    onPointerUp(state) {
      state.dragging = null;
    }
  });
})();
