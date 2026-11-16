(function (global) {
  "use strict";

  const SimLab = {
    sims: [],
    simsById: {},

    register(simDef) {
      if (!simDef || !simDef.id) {
        throw new Error("Simulation definition must include an id.");
      }
      if (this.simsById[simDef.id]) {
        const idx = this.sims.findIndex((s) => s.id === simDef.id);
        if (idx >= 0) this.sims[idx] = simDef;
      } else {
        this.sims.push(simDef);
      }
      this.simsById[simDef.id] = simDef;
      return simDef;
    },

    util: {
      clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
      },

      lerp(a, b, t) {
        return a + (b - a) * t;
      },

      hsl(h, s, l, a = 1) {
        return a >= 1
          ? `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
          : `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
      },

      roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
      },

      drawGrid(ctx, width, height, spacing = 40, color = "rgba(148, 163, 184, 0.08)") {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += spacing) {
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, height);
        }
        for (let y = 0; y <= height; y += spacing) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(width, y + 0.5);
        }
        ctx.stroke();
        ctx.restore();
      },

      drawArrow(ctx, x1, y1, x2, y2, color = "#38bdf8", label = "", lineWidth = 2.4) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 2) return;

        const headLen = Math.min(11, Math.max(6, len * 0.25));
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - Math.cos(angle) * (headLen * 0.6), y2 - Math.sin(angle) * (headLen * 0.6));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 7),
          y2 - headLen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 7),
          y2 - headLen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fill();

        if (label) {
          ctx.font = "600 11px 'Segoe UI', sans-serif";
          const lx = x2 + Math.cos(angle) * 8;
          const ly = y2 + Math.sin(angle) * 8;
          ctx.fillText(label, lx + 4, ly + 4);
        }
        ctx.restore();
      },

      _scaleNarrowOverlay(ctx, anchorX, anchorY) {
        if (ctx.canvas && ctx.canvas.logicalWidth < 560 && typeof ctx.scale === "function") {
          ctx.translate(anchorX, anchorY);
          ctx.scale(0.74, 0.74);
          ctx.translate(-anchorX, -anchorY);
        }
      },

      /**
       * Renders a compact floating scientific XY / strip-chart graph.
       * seriesArray: [{ name, color, data: [{ x, y }] or [y0, y1, ...] }]
       */
      drawGraph(ctx, x, y, w, h, title, xLabel, yLabel, seriesArray, yMin, yMax, options = {}) {
        ctx.save();
        this._scaleNarrowOverlay(ctx, x + w, y);
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fillStyle = "rgba(8, 13, 26, 0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const padL = 42;
        const padR = 14;
        const padT = 26;
        const padB = 24;
        const pw = Math.max(20, w - padL - padR);
        const ph = Math.max(20, h - padT - padB);
        const px = x + padL;
        const py = y + padT;

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "700 11px 'Segoe UI', sans-serif";
        ctx.fillText(title, x + 10, y + 16);

        // Plot frame & zero line
        ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
        ctx.strokeRect(px, py, pw, ph);

        const spanY = yMax - yMin || 1;
        if (yMin < 0 && yMax > 0) {
          const yZero = py + ph - ((0 - yMin) / spanY) * ph;
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(px, yZero);
          ctx.lineTo(px + pw, yZero);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Y-axis ticks
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px Consolas, monospace";
        ctx.textAlign = "right";
        ctx.fillText(yMax.toFixed(options.yDecimals ?? 1), px - 5, py + 8);
        ctx.fillText(yMin.toFixed(options.yDecimals ?? 1), px - 5, py + ph);
        ctx.textAlign = "left";

        // X/Y axis labels
        if (xLabel) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px 'Segoe UI', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(xLabel, px + pw, py + ph + 16);
          ctx.textAlign = "left";
        }
        if (yLabel) {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px 'Segoe UI', sans-serif";
          ctx.fillText(yLabel, x + 6, py + ph / 2);
        }

        // Determine X range if objects with .x are supplied
        let xMin = options.xMin ?? 0;
        let xMax = options.xMax ?? 1;
        let usesXY = false;
        for (const s of seriesArray) {
          if (s.data && s.data.length > 0 && typeof s.data[0] === "object") {
            usesXY = true;
            if (options.xMin === undefined) {
              xMin = Math.min(xMin, s.data[0].x);
            }
            if (options.xMax === undefined) {
              for (const pt of s.data) {
                if (pt.x > xMax) xMax = pt.x;
                if (pt.x < xMin) xMin = pt.x;
              }
            }
          }
        }
        const spanX = xMax - xMin || 1;

        // Clip to plot region
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, pw, ph);
        ctx.clip();

        for (const s of seriesArray) {
          if (!s.data || s.data.length < 2) continue;
          ctx.beginPath();
          ctx.strokeStyle = s.color || "#38bdf8";
          ctx.lineWidth = s.lineWidth || 1.8;

          for (let i = 0; i < s.data.length; i++) {
            const pt = s.data[i];
            const vx = usesXY
              ? px + ((pt.x - xMin) / spanX) * pw
              : px + (i / (s.data.length - 1)) * pw;
            const rawY = usesXY ? pt.y : pt;
            const vy = py + ph - ((rawY - yMin) / spanY) * ph;
            if (i === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Legend in top-right of chart
        let lx = x + w - 10;
        ctx.font = "600 10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        for (let i = seriesArray.length - 1; i >= 0; i--) {
          const s = seriesArray[i];
          if (!s.name) continue;
          ctx.fillStyle = s.color || "#38bdf8";
          ctx.fillText(s.name, lx, y + 16);
          lx -= ctx.measureText(s.name).width + 10;
        }
        ctx.textAlign = "left";
        ctx.restore();
      },

      /**
       * Renders a compact floating bar chart.
       * barsArray: [{ label, value, color }]
       */
      drawBarChart(ctx, x, y, w, h, title, barsArray, maxVal) {
        ctx.save();
        this._scaleNarrowOverlay(ctx, x + w, y);
        this.roundRect(ctx, x, y, w, h, 10);
        ctx.fillStyle = "rgba(8, 13, 26, 0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "700 11px 'Segoe UI', sans-serif";
        ctx.fillText(title, x + 10, y + 16);

        const padL = 12;
        const padR = 12;
        const padT = 26;
        const padB = 22;
        const pw = Math.max(20, w - padL - padR);
        const ph = Math.max(20, h - padT - padB);
        const px = x + padL;
        const py = y + padT;

        const n = barsArray.length || 1;
        const slotW = pw / n;
        const barW = Math.min(28, slotW * 0.62);
        const safeMax = Math.max(1e-6, maxVal);

        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.beginPath();
        ctx.moveTo(px, py + ph);
        ctx.lineTo(px + pw, py + ph);
        ctx.stroke();

        barsArray.forEach((bar, i) => {
          const frac = this.clamp(bar.value / safeMax, 0, 1);
          const bh = frac * ph;
          const bx = px + i * slotW + (slotW - barW) / 2;
          const by = py + ph - bh;

          ctx.fillStyle = bar.color || "#38bdf8";
          ctx.fillRect(bx, by, barW, bh);

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "10px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(bar.label, bx + barW / 2, py + ph + 13);

          if (bar.displayValue !== undefined) {
            ctx.fillStyle = "#f8fafc";
            ctx.font = "9px Consolas, monospace";
            ctx.fillText(bar.displayValue, bx + barW / 2, Math.max(py + 9, by - 4));
          }
        });

        ctx.textAlign = "left";
        ctx.restore();
      }
    },

    audio: {
      enabled: true,
      ctx: null,

      _ensureCtx() {
        if (!this.enabled) return null;
        if (!this.ctx && (global.AudioContext || global.webkitAudioContext)) {
          const Ctx = global.AudioContext || global.webkitAudioContext;
          try {
            this.ctx = new Ctx();
          } catch (e) {
            this.ctx = null;
          }
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      },

      toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
      },

      playTone(freq = 440, duration = 0.08, type = "sine", gainVal = 0.05) {
        const ctx = this._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      },

      playPop() {
        this.playTone(540, 0.06, "triangle", 0.05);
      },

      playLaunch() {
        this.playTone(220, 0.14, "sawtooth", 0.045);
      },

      playSuccess() {
        this.playTone(660, 0.12, "sine", 0.06);
      }
    },

    engine: {
      canvas: null,
      ctx: null,
      activeSim: null,
      state: null,
      running: true,
      speed: 1,
      simTime: 0,
      lastFrameTime: 0,
      rafId: null,
      onHudUpdate: null,
      onClockUpdate: null,

      attachCanvas(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext("2d");
        this.resizeCanvas();
        this._bindPointerEvents();
      },

      resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement
          ? this.canvas.parentElement.getBoundingClientRect()
          : this.canvas.getBoundingClientRect();
        const width = Math.max(300, Math.floor(rect.width));
        const height = Math.max(260, Math.floor(rect.height));
        const dpr = Math.min(global.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        this.canvas.logicalWidth = width;
        this.canvas.logicalHeight = height;

        if (this.ctx) {
          this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        if (this.activeSim && this.state) {
          this.renderFrame();
        }
      },

      loadSimulation(simDef, presetParams = null) {
        this.stop();
        this.activeSim = simDef;
        this.simTime = 0;
        this.running = true;

        const baseState = {
          params: {},
          time: 0
        };
        if (Array.isArray(simDef.controls)) {
          for (const ctrl of simDef.controls) {
            if (ctrl.key) {
              baseState.params[ctrl.key] = ctrl.default;
            }
          }
        }
        if (presetParams) {
          Object.assign(baseState.params, presetParams);
        }

        this.state = null;
        this.resizeCanvas();
        this.state = baseState;
        if (typeof simDef.init === "function") {
          simDef.init(this.state, this.canvas);
        }
        this.renderFrame();
        this.start();
      },

      resetSimulation() {
        if (!this.activeSim) return;
        const preservedParams = { ...(this.state ? this.state.params : {}) };
        this.simTime = 0;
        this.state = {
          params: preservedParams,
          time: 0
        };
        if (typeof this.activeSim.init === "function") {
          this.activeSim.init(this.state, this.canvas);
        }
        this.renderFrame();
        this._notifyClock();
      },

      resetAllDefaults() {
        if (!this.activeSim) return;
        this.loadSimulation(this.activeSim);
        this._notifyClock();
      },

      setSpeed(speedVal) {
        this.speed = Number(speedVal) || 1;
      },

      setRunning(isRunning) {
        this.running = Boolean(isRunning);
        if (this.running) {
          this.lastFrameTime = performance.now();
        }
      },

      stepOnce() {
        if (!this.activeSim || !this.state) return;
        this.running = false;
        const stepDt = (1 / 60) * this.speed;
        this._advanceSimulation(stepDt);
        this.renderFrame();
        this._notifyClock();
      },

      start() {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.lastFrameTime = performance.now();
        const tick = (now) => {
          const rawDt = Math.min(0.033, Math.max(0.001, (now - this.lastFrameTime) / 1000));
          this.lastFrameTime = now;

          if (this.running && this.activeSim && this.state) {
            const scaledDt = rawDt * this.speed;
            this._advanceSimulation(scaledDt);
            this.renderFrame();
            this._notifyClock();
          }
          this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
      },

      stop() {
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      },

      _advanceSimulation(dt) {
        const substeps = this.speed > 1 ? 2 : 1;
        const subDt = dt / substeps;
        for (let i = 0; i < substeps; i++) {
          this.simTime += subDt;
          this.state.time = this.simTime;
          if (typeof this.activeSim.update === "function") {
            this.activeSim.update(this.state, subDt, this.canvas);
          }
        }
      },

      renderFrame() {
        if (!this.activeSim || !this.ctx || !this.canvas || !this.state) return;
        const w = this.canvas.logicalWidth || this.canvas.width;
        const h = this.canvas.logicalHeight || this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        if (typeof this.activeSim.render === "function") {
          this.activeSim.render(this.state, this.ctx, this.canvas);
        }
        if (typeof this.onHudUpdate === "function" && typeof this.activeSim.getHud === "function") {
          this.onHudUpdate(this.activeSim.getHud(this.state));
        }
      },

      _notifyClock() {
        if (typeof this.onClockUpdate === "function") {
          this.onClockUpdate(this.simTime);
        }
      },

      _getCanvasCoords(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      },

      _bindPointerEvents() {
        if (!this.canvas || this.canvas._simBound) return;
        this.canvas._simBound = true;

        this.canvas.addEventListener("pointerdown", (evt) => {
          if (!this.activeSim || !this.state) return;
          const pt = this._getCanvasCoords(evt);
          if (this.canvas.setPointerCapture) {
            try {
              this.canvas.setPointerCapture(evt.pointerId);
            } catch (e) {}
          }
          if (typeof this.activeSim.onPointerDown === "function") {
            this.activeSim.onPointerDown(this.state, pt.x, pt.y, this.canvas);
            this.renderFrame();
          }
        });

        this.canvas.addEventListener("pointermove", (evt) => {
          if (!this.activeSim || !this.state) return;
          const pt = this._getCanvasCoords(evt);
          if (typeof this.activeSim.onPointerMove === "function") {
            this.activeSim.onPointerMove(this.state, pt.x, pt.y, this.canvas);
            if (!this.running) this.renderFrame();
          }
        });

        const endPointer = (evt) => {
          if (!this.activeSim || !this.state) return;
          const pt = this._getCanvasCoords(evt);
          if (typeof this.activeSim.onPointerUp === "function") {
            this.activeSim.onPointerUp(this.state, pt.x, pt.y, this.canvas);
            this.renderFrame();
          }
        };

        this.canvas.addEventListener("pointerup", endPointer);
        this.canvas.addEventListener("pointercancel", endPointer);
      }
    }
  };

  global.SimLab = SimLab;
})(window);
