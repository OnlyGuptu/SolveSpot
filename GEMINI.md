# Aura Farming AI — Project Memory & Context

Welcome back! This document permanently preserves the memory, context, and project guidelines of **Aura Farming AI** for this repository. Even if this folder is moved, renamed, or opened in a new conversation, Antigravity loads this file automatically.

---

## 1. Project Overview: SolveSpot (`solvespot.in`)
* **Domain / Brand:** [SolveSpot.in](https://solvespot.in) *(previously NCERT Solved / contact.ncertsolved@gmail.com)*.
* **Mission:** An ultra-fast, zero-clutter, free study platform built by a student for CBSE Class 9 students. No paywalls, no 50-page PDFs, no spammy popups.
* **Core Content:** 100% verified textbook solutions for Class 9:
  * **Science** (Physics, Chemistry, Biology)
  * **Mathematics** (Ganita Manjari & Ganita Prakash)
  * **Social Science** (History, Civics, Geography, Economics)
  * **Languages** (English Beehive/Moments & Hindi)

---

## 2. Tech Stack & Architecture
* **Stack:** Pure Vanilla HTML5, CSS3, and JavaScript (ES6+). Zero heavy frontend frameworks for instantaneous load times and offline performance.
* **Core Files:**
  * `index.html` — Master template and single-page shell.
  * `script.js` — Core database (`ncertDatabase`) holding thousands of structured questions, answers, formulas, and diagrams.
  * `build-ssg.ps1` — Static Site Generator script in PowerShell. It parses `script.js` and `index.html` to generate **606+ static HTML pages** and updates `sitemap.xml` with canonical URLs.
  * `style.css`, `dark-mode.css`, `mobile.css` — High-performance responsive styling with native dark mode support.
  * `robots.txt`, `sitemap.xml`, `CNAME` — Production SEO and deployment configuration (Vercel).

---

## 3. Key Interactive Features & Tools
1. **Interactive Periodic Table (`/periodic-table/`):**
   * Driven by `tools.js` & `tools.css`.
   * Features an interactive HTML5 `<canvas>` with animated Bohr-Bury electron shells ($K, L, M, N$).
   * Element inspector with Atomic Number ($Z$), Mass Number ($A$), valencies, Class 9 chemical formulas, and exam notes.
2. **Instant CBSE Marks & Percentage Calculator (`/calculator/`):**
   * Calculates overall percentage, total marks, 9-point CBSE grades (`A1` to `E`), and CGPA.
   * Exam max mark presets (80, 100, 40, 20) with celebratory confetti and scorecard copy.
3. **Student Arcade Zone (`/games/`):**
   * Driven by `games.js` & `games.css`.
   * 10 retro browser games (Brick Tower, Space Shooter, Knife Hit, Brick Breaker, 2048, Minesweeper, Neon Snake, Flappy Solv, etc.).
   * Optimized with debounced touch controls, touch-swipe support, and responsive canvas coordinate scaling for mobile and PC.
4. **SolveLab Interactive Physics & Chemistry Simulations (`/solvelab/`):**
   * Self-contained HTML5 Canvas portal (`solvelab/index.html`, `solvelab/css/styles.css`, `solvelab/js/core.js`, `solvelab/js/app.js`, and 10 modules in `solvelab/js/sims/`).
   * Features 5 Physics sims (Projectile, Pendulum, Waves, Gravity Orbits, DC Circuits) and 5 Chemistry sims (Ideal Gas Law, States of Matter, pH Titration, Build an Atom, Reaction Kinetics) with slow-motion time scaling (`0.1x–2x`), `+1` frame stepping, mobile-responsive layout, and fullscreen mode.

---

## 4. Development & Build Rules
* **Rebuilding Static Pages:** Any time `script.js` or the main layout is updated, run `powershell -ExecutionPolicy Bypass -File build-ssg.ps1` to recompile all static HTML pages and keep the sitemap updated.
* **Answer Formatting:** Clean, concise answers with bold headings and structured bullet points. Remove any raw citation tags like `[cite: XX]`.
* **Monetization & Ads Policy:** 
  * Google AdSense script integration.
  * Clean, non-intrusive ad placement only (no intrusive pop-ups, redirects, or adult ad categories) to maintain Google AdSense policy compliance. Alternative clean networks evaluated: Adsterra, Media.net.

---

## 5. Marketing & Social Profiles
* **Target Audience:** Indian high school students (CBSE Class 9) and coaching centers.
* **Content Hooks:** "Skip the fluff / Anti-paywall", "Periodic table electron visualizer", "CBSE Percentage calculator", "2-minute study break arcade".
* **Developer Portfolio:** SolveSpot serves as the creator's live showcase project for freelance client acquisition (coaching institutes, schools, and small businesses needing fast, modern web apps).
