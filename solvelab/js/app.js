(function () {
  "use strict";

  const els = {
    brandHome: document.getElementById("brand-home"),
    backHubBtn: document.getElementById("back-hub-btn"),
    hubFilters: document.getElementById("hub-filters"),
    filterPills: Array.from(document.querySelectorAll(".filter-pills .pill")),
    searchInput: document.getElementById("sim-search"),
    appFullscreenBtn: document.getElementById("app-fullscreen-btn"),
    appFsIcon: document.getElementById("app-fs-icon"),
    appFsLabel: document.getElementById("app-fs-label"),
    soundToggleBtn: document.getElementById("sound-toggle-btn"),
    soundIcon: document.getElementById("sound-icon"),
    hubView: document.getElementById("hub-view"),
    simGrid: document.getElementById("sim-grid"),
    emptySearch: document.getElementById("empty-search"),
    workbenchView: document.getElementById("workbench-view"),
    wbCategoryBadge: document.getElementById("wb-category-badge"),
    wbTitle: document.getElementById("wb-title"),
    wbSubtitle: document.getElementById("wb-subtitle"),
    wbPresets: document.getElementById("wb-presets"),
    theoryToggleBtn: document.getElementById("theory-toggle-btn"),
    screenshotBtn: document.getElementById("screenshot-btn"),
    stageFullscreenBtn: document.getElementById("stage-fullscreen-btn"),
    simCanvas: document.getElementById("sim-canvas"),
    simHud: document.getElementById("sim-hud"),
    simHint: document.getElementById("sim-hint"),
    fsControlsToggleBtn: document.getElementById("fs-controls-toggle-btn"),
    canvasFsBtn: document.getElementById("canvas-fs-btn"),
    playPauseBtn: document.getElementById("play-pause-btn"),
    stepBtn: document.getElementById("step-btn"),
    speedPills: Array.from(document.querySelectorAll(".speed-pill")),
    simClock: document.getElementById("sim-clock"),
    resetSimBtn: document.getElementById("reset-sim-btn"),
    simControls: document.getElementById("sim-controls"),
    simTheory: document.getElementById("sim-theory"),
    theoryCloseBtn: document.getElementById("theory-close-btn"),
    theoryContent: document.getElementById("theory-content")
  };

  let activeCategory = "all";
  let searchQuery = "";
  let controlBinders = [];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderHubGrid() {
    const query = searchQuery.trim().toLowerCase();
    const filtered = SimLab.sims.filter((sim) => {
      const catOk = activeCategory === "all" || sim.category === activeCategory;
      if (!catOk) return false;
      if (!query) return true;
      const haystack = `${sim.title} ${sim.subtitle} ${sim.description} ${(sim.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });

    els.simGrid.innerHTML = "";
    if (!filtered.length) {
      els.emptySearch.classList.remove("hidden");
      return;
    }
    els.emptySearch.classList.add("hidden");

    for (const sim of filtered) {
      const card = document.createElement("article");
      card.className = "sim-card";
      card.style.setProperty("--card-accent", sim.color || "#38bdf8");
      card.tabIndex = 0;

      const tagsHtml = (sim.tags || [])
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join("");

      card.innerHTML = `
        <div>
          <div class="sim-card-top">
            <div class="sim-icon">${sim.icon || "🔬"}</div>
            <span class="cat-badge ${sim.category}">${escapeHtml(sim.category)}</span>
          </div>
          <h3>${escapeHtml(sim.title)}</h3>
          <div class="sim-card-sub">${escapeHtml(sim.subtitle)}</div>
          <p>${escapeHtml(sim.description)}</p>
        </div>
        <div>
          <div class="sim-tags">${tagsHtml}</div>
          <div class="sim-card-footer">
            <span>Open Interactive Lab</span>
            <span class="launch-arrow">→</span>
          </div>
        </div>
      `;

      const launch = () => openSimulation(sim.id);
      card.addEventListener("click", launch);
      card.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          launch();
        }
      });
      els.simGrid.appendChild(card);
    }
  }

  function updatePlayButtonUI() {
    if (SimLab.engine.running) {
      els.playPauseBtn.textContent = "⏸ Pause";
    } else {
      els.playPauseBtn.textContent = "▶ Play";
    }
  }

  function updateSpeedPillsUI() {
    const cur = SimLab.engine.speed;
    for (const pill of els.speedPills) {
      pill.classList.toggle("active", Number(pill.dataset.speed) === cur);
    }
  }

  function renderHud(items) {
    if (!Array.isArray(items) || !items.length) {
      els.simHud.innerHTML = "";
      return;
    }
    els.simHud.innerHTML = items
      .map((item) => `<div class="hud-chip"><span>${escapeHtml(item.label)}:</span>${escapeHtml(item.value)}</div>`)
      .join("");
  }

  function syncAllControlInputs() {
    const state = SimLab.engine.state;
    if (!state) return;
    for (const sync of controlBinders) {
      sync(state.params);
    }
  }

  function buildControlsUI(sim) {
    els.simControls.innerHTML = "";
    controlBinders = [];

    const state = SimLab.engine.state;
    state.syncControlUI = syncAllControlInputs;

    let pendingActionGrid = null;
    const flushActionGrid = () => {
      if (pendingActionGrid) {
        els.simControls.appendChild(pendingActionGrid);
        pendingActionGrid = null;
      }
    };

    for (const ctrl of sim.controls || []) {
      if (ctrl.type === "action") {
        if (!pendingActionGrid) {
          pendingActionGrid = document.createElement("div");
          pendingActionGrid.className = "action-grid";
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn ${ctrl.variant === "primary" ? "btn-primary" : "btn-secondary"} ${
          ctrl.fullWidth ? "btn-full" : ""
        }`;
        btn.textContent = ctrl.label;
        btn.addEventListener("click", () => {
          if (typeof sim.onAction === "function") {
            sim.onAction(SimLab.engine.state, ctrl.id, SimLab.engine.canvas);
            SimLab.engine.renderFrame();
          }
        });
        pendingActionGrid.appendChild(btn);
        continue;
      }

      flushActionGrid();
      const group = document.createElement("div");
      group.className = "control-group";

      if (ctrl.type === "range") {
        const labelRow = document.createElement("div");
        labelRow.className = "control-label-row";
        const lbl = document.createElement("label");
        lbl.textContent = ctrl.label;
        const valSpan = document.createElement("span");
        valSpan.className = "control-value";

        const input = document.createElement("input");
        input.type = "range";
        input.min = ctrl.min;
        input.max = ctrl.max;
        input.step = ctrl.step;
        input.value = state.params[ctrl.key];

        const formatVal = (v) => {
          const num = Number(v);
          const decimals = String(ctrl.step).includes(".") ? String(ctrl.step).split(".")[1].length : 0;
          return `${num.toFixed(decimals)}${ctrl.unit || ""}`;
        };
        valSpan.textContent = formatVal(input.value);

        input.addEventListener("input", () => {
          state.params[ctrl.key] = Number(input.value);
          valSpan.textContent = formatVal(input.value);
          if (!SimLab.engine.running) SimLab.engine.renderFrame();
        });

        controlBinders.push((params) => {
          input.value = params[ctrl.key];
          valSpan.textContent = formatVal(params[ctrl.key]);
        });

        labelRow.appendChild(lbl);
        labelRow.appendChild(valSpan);
        group.appendChild(labelRow);
        group.appendChild(input);
      } else if (ctrl.type === "select") {
        const labelRow = document.createElement("div");
        labelRow.className = "control-label-row";
        const lbl = document.createElement("label");
        lbl.textContent = ctrl.label;
        labelRow.appendChild(lbl);

        const select = document.createElement("select");
        select.className = "control-select";
        for (const opt of ctrl.options || []) {
          const o = document.createElement("option");
          o.value = opt.value;
          o.textContent = opt.label;
          select.appendChild(o);
        }
        select.value = String(state.params[ctrl.key]);

        select.addEventListener("change", () => {
          state.params[ctrl.key] = select.value;
          if (!SimLab.engine.running) SimLab.engine.renderFrame();
        });

        controlBinders.push((params) => {
          select.value = String(params[ctrl.key]);
        });

        group.appendChild(labelRow);
        group.appendChild(select);
      } else if (ctrl.type === "checkbox") {
        const row = document.createElement("label");
        row.className = "checkbox-row";
        const span = document.createElement("span");
        span.textContent = ctrl.label;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = Boolean(state.params[ctrl.key]);

        cb.addEventListener("change", () => {
          state.params[ctrl.key] = cb.checked;
          if (!SimLab.engine.running) SimLab.engine.renderFrame();
        });

        controlBinders.push((params) => {
          cb.checked = Boolean(params[ctrl.key]);
        });

        row.appendChild(span);
        row.appendChild(cb);
        group.appendChild(row);
      }

      els.simControls.appendChild(group);
    }

    flushActionGrid();
  }

  function buildPresetsUI(sim) {
    els.wbPresets.innerHTML = "";
    for (const preset of sim.presets || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-pill";
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        Array.from(els.wbPresets.children).forEach((el) => el.classList.remove("active"));
        btn.classList.add("active");
        const extra = preset.initAngle !== undefined ? { initAngle: preset.initAngle } : {};
        SimLab.engine.loadSimulation(sim, { ...preset.params, ...extra });
        SimLab.engine.state.syncControlUI = syncAllControlInputs;
        buildControlsUI(sim);
        updatePlayButtonUI();
        SimLab.audio.playPop();
      });
      els.wbPresets.appendChild(btn);
    }
  }

  function buildTheoryUI(sim) {
    const theory = sim.theory || {};
    const formulasHtml = (theory.formulas || [])
      .map((f) => `<div class="formula-pill">${escapeHtml(f)}</div>`)
      .join("");
    const challengesHtml = (theory.challenges || [])
      .map((c) => `<div class="challenge-item">${escapeHtml(c)}</div>`)
      .join("");

    els.theoryContent.innerHTML = `
      <div class="theory-box">
        <h4>Physical / Chemical Principle</h4>
        <p>${escapeHtml(theory.summary || sim.description)}</p>
      </div>
      <div class="theory-box">
        <h4>Key Equations</h4>
        <div class="formula-list">${formulasHtml}</div>
      </div>
      <div class="theory-box">
        <h4>Guided Lab Challenges</h4>
        ${challengesHtml}
      </div>
    `;
  }

  function openSimulation(simId) {
    const sim = SimLab.simsById[simId];
    if (!sim) return;

    els.hubView.classList.add("hidden");
    els.hubFilters.classList.add("hidden");
    els.workbenchView.classList.remove("hidden");
    els.backHubBtn.classList.remove("hidden");
    els.simTheory.classList.add("hidden");

    els.wbTitle.textContent = sim.title;
    els.wbSubtitle.textContent = sim.subtitle;
    els.wbCategoryBadge.textContent = sim.category;
    els.wbCategoryBadge.className = `cat-badge ${sim.category}`;
    els.simHint.textContent = sim.hint || "Adjust controls on the right or drag elements on the canvas.";

    SimLab.engine.attachCanvas(els.simCanvas);
    SimLab.engine.setSpeed(1);
    updateSpeedPillsUI();
    SimLab.engine.loadSimulation(sim);
    buildPresetsUI(sim);
    buildControlsUI(sim);
    buildTheoryUI(sim);
    updatePlayButtonUI();
    els.simClock.textContent = "t = 0.00 s";
  }

  function isNativeFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function requestNativeFullscreen(targetEl) {
    const el = targetEl || document.documentElement;
    if (!el) return;
    try {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (typeof req === "function") {
        const res = req.call(el);
        if (res && typeof res.catch === "function") res.catch(() => {});
      }
    } catch (e) {}
  }

  function exitNativeFullscreen() {
    try {
      if (!isNativeFullscreen()) return;
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (typeof exit === "function") {
        const res = exit.call(document);
        if (res && typeof res.catch === "function") res.catch(() => {});
      }
    } catch (e) {}
  }

  function syncCanvasAfterLayout() {
    if (!els.workbenchView.classList.contains("hidden")) {
      SimLab.engine.resizeCanvas();
      setTimeout(() => {
        if (!els.workbenchView.classList.contains("hidden")) {
          SimLab.engine.resizeCanvas();
        }
      }, 60);
    }
  }

  function updateAppFsUI(active) {
    if (els.appFsIcon) els.appFsIcon.textContent = active ? "🗗" : "⛶";
    if (els.appFsLabel) els.appFsLabel.textContent = active ? "Exit Fullscreen" : "Fullscreen";
  }

  function setImmersiveFullscreen(active, skipNative = false) {
    if (document.body) {
      document.body.classList.toggle("sim-immersive-fullscreen", active);
      if (!active) {
        document.body.classList.remove("fs-controls-open");
      }
    }
    if (els.fsControlsToggleBtn) {
      els.fsControlsToggleBtn.classList.toggle("hidden", !active);
      els.fsControlsToggleBtn.textContent = "⚙ Controls";
    }
    if (els.canvasFsBtn) {
      els.canvasFsBtn.textContent = active ? "✕ Exit Fullscreen" : "⛶ Fullscreen";
    }
    if (els.stageFullscreenBtn) {
      els.stageFullscreenBtn.textContent = active ? "✕ Exit Fullscreen" : "⛶ Fullscreen Sim";
    }
    if (!skipNative) {
      if (active) {
        requestNativeFullscreen(document.documentElement);
      } else if (document.body && !document.body.classList.contains("app-fullscreen")) {
        exitNativeFullscreen();
      }
    }
    syncCanvasAfterLayout();
  }

  function toggleAppFullscreen() {
    const currentlyAppFs = document.body && document.body.classList.contains("app-fullscreen");
    const next = !currentlyAppFs && !isNativeFullscreen();
    if (document.body) {
      document.body.classList.toggle("app-fullscreen", next);
    }
    if (next) {
      requestNativeFullscreen(document.documentElement);
    } else {
      if (document.body && document.body.classList.contains("sim-immersive-fullscreen")) {
        setImmersiveFullscreen(false, true);
      }
      exitNativeFullscreen();
    }
    updateAppFsUI(next);
    syncCanvasAfterLayout();
  }

  function returnToHub() {
    if (document.body && document.body.classList.contains("sim-immersive-fullscreen")) {
      setImmersiveFullscreen(false);
    }
    SimLab.engine.stop();
    els.workbenchView.classList.add("hidden");
    els.backHubBtn.classList.add("hidden");
    els.simTheory.classList.add("hidden");
    els.hubView.classList.remove("hidden");
    els.hubFilters.classList.remove("hidden");
  }

  // Event Bindings
  els.brandHome.addEventListener("click", returnToHub);
  els.backHubBtn.addEventListener("click", returnToHub);

  for (const pill of els.filterPills) {
    pill.addEventListener("click", () => {
      els.filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeCategory = pill.dataset.category || "all";
      renderHubGrid();
    });
  }

  els.searchInput.addEventListener("input", () => {
    searchQuery = els.searchInput.value;
    renderHubGrid();
  });

  els.soundToggleBtn.addEventListener("click", () => {
    const on = SimLab.audio.toggle();
    els.soundIcon.textContent = on ? "🔊" : "🔇";
    const lbl = els.soundToggleBtn.querySelector(".btn-label");
    if (lbl) lbl.textContent = on ? "Sound On" : "Muted";
  });

  els.playPauseBtn.addEventListener("click", () => {
    SimLab.engine.setRunning(!SimLab.engine.running);
    updatePlayButtonUI();
  });

  els.stepBtn.addEventListener("click", () => {
    SimLab.engine.stepOnce();
    updatePlayButtonUI();
  });

  for (const pill of els.speedPills) {
    pill.addEventListener("click", () => {
      SimLab.engine.setSpeed(Number(pill.dataset.speed));
      updateSpeedPillsUI();
    });
  }

  els.resetSimBtn.addEventListener("click", () => {
    SimLab.engine.resetAllDefaults();
    if (SimLab.engine.activeSim) {
      buildControlsUI(SimLab.engine.activeSim);
      Array.from(els.wbPresets.children).forEach((el) => el.classList.remove("active"));
    }
    updatePlayButtonUI();
    SimLab.audio.playPop();
  });

  els.theoryToggleBtn.addEventListener("click", () => {
    els.simTheory.classList.toggle("hidden");
  });
  els.theoryCloseBtn.addEventListener("click", () => {
    els.simTheory.classList.add("hidden");
  });

  els.screenshotBtn.addEventListener("click", () => {
    if (!els.simCanvas) return;
    const url = els.simCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    const simId = SimLab.engine.activeSim ? SimLab.engine.activeSim.id : "sim";
    link.download = `solvelab-${simId}.png`;
    link.href = url;
    link.click();
    SimLab.audio.playPop();
  });

  if (els.appFullscreenBtn) {
    els.appFullscreenBtn.addEventListener("click", toggleAppFullscreen);
  }

  const toggleImmersive = () => {
    const active = document.body && document.body.classList.contains("sim-immersive-fullscreen");
    setImmersiveFullscreen(!active);
    SimLab.audio.playPop();
  };

  if (els.stageFullscreenBtn) {
    els.stageFullscreenBtn.addEventListener("click", toggleImmersive);
  }
  if (els.canvasFsBtn) {
    els.canvasFsBtn.addEventListener("click", toggleImmersive);
  }
  if (els.fsControlsToggleBtn) {
    els.fsControlsToggleBtn.addEventListener("click", () => {
      if (!document.body) return;
      const open = document.body.classList.toggle("fs-controls-open");
      els.fsControlsToggleBtn.textContent = open ? "✕ Hide Controls" : "⚙ Controls";
    });
  }

  const onFullscreenChange = () => {
    const nativeFs = isNativeFullscreen();
    if (!nativeFs) {
      if (document.body) {
        document.body.classList.remove("app-fullscreen");
        if (document.body.classList.contains("sim-immersive-fullscreen")) {
          setImmersiveFullscreen(false, true);
        }
      }
      updateAppFsUI(false);
    } else {
      updateAppFsUI(true);
    }
    syncCanvasAfterLayout();
  };

  if (typeof document.addEventListener === "function") {
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  }

  // Keyboard shortcuts (Hub + Workbench)
  window.addEventListener("keydown", (evt) => {
    if (evt.target && ["INPUT", "SELECT", "TEXTAREA"].includes(evt.target.tagName)) return;
    const inWorkbench = !els.workbenchView.classList.contains("hidden");

    if (evt.code === "KeyF") {
      evt.preventDefault();
      if (inWorkbench) {
        toggleImmersive();
      } else {
        toggleAppFullscreen();
      }
      return;
    }

    if (evt.code === "Escape" && inWorkbench && document.body && document.body.classList.contains("sim-immersive-fullscreen")) {
      setImmersiveFullscreen(false);
      return;
    }

    if (!inWorkbench) return;
    if (evt.code === "Space") {
      evt.preventDefault();
      SimLab.engine.setRunning(!SimLab.engine.running);
      updatePlayButtonUI();
    } else if (evt.key === "ArrowRight") {
      evt.preventDefault();
      SimLab.engine.stepOnce();
      updatePlayButtonUI();
    }
  });

  window.addEventListener("resize", () => {
    if (!els.workbenchView.classList.contains("hidden")) {
      SimLab.engine.resizeCanvas();
    }
  });
  window.addEventListener("orientationchange", syncCanvasAfterLayout);

  SimLab.engine.onHudUpdate = renderHud;
  SimLab.engine.onClockUpdate = (t) => {
    els.simClock.textContent = `t = ${t.toFixed(2)} s`;
  };

  renderHubGrid();
})();
