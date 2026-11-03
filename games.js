/**
 * SolveSpot Arcade & Break Zone (10 Micro-Games)
 * Responsive Canvas Engines + Audio Synthesizer + LocalStorage High Scores
 */

(function() {
    'use strict';

    // 1. Retro Sound Synthesizer (Web Audio API)
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'jump' || type === 'tap') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'score' || type === 'coin') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'hit' || type === 'crash') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.25);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'win') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.1);
                osc.frequency.setValueAtTime(659.25, now + 0.2);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch (e) {}
    }

    // 2. High Score Storage
    function getHighScore(gameId) {
        return parseInt(localStorage.getItem(`solvespot_hs_${gameId}`) || '0', 10);
    }

    function saveHighScore(gameId, score) {
        const cur = getHighScore(gameId);
        if (score > cur) {
            localStorage.setItem(`solvespot_hs_${gameId}`, String(score));
            const el = document.getElementById(`hs-val-${gameId}`);
            if (el) el.innerText = score;
            return true;
        }
        return false;
    }

    // 3. Game Catalog Definition
    const GAMES_CATALOG = [
        {
            id: 'snake',
            title: 'Neon Snake',
            icon: '🐍',
            tag: 'Classic Arcade',
            desc: 'Guide the glowing snake, eat neon pellets, grow longer, and avoid walls and your own tail!',
            controls: 'Arrows / WASD / D-Pad'
        },
        {
            id: '2048',
            title: '2048 Challenge',
            icon: '🔢',
            tag: 'Puzzle & Chill',
            desc: 'Swipe or slide tiles to combine identical numbers. Can you reach the legendary 2048 tile?',
            controls: 'Arrows / Swipes'
        },
        {
            id: 'flappy',
            title: 'Flappy Solv',
            icon: '🕊️',
            tag: 'Reflex Tapper',
            desc: 'Tap or press Space to flap wings and navigate through floating pipe obstacles.',
            controls: 'Tap / Spacebar'
        },
        {
            id: 'runner',
            title: 'Endless Cyber Runner',
            icon: '🦖',
            tag: 'Infinite Runner',
            desc: 'Sprint through a neon desert, jump over barriers and dodge airborne drones!',
            controls: 'Tap / Space / Up Arrow'
        },
        {
            id: 'breaker',
            title: 'Neon Brick Breaker',
            icon: '🧱',
            tag: 'Arcade Smash',
            desc: 'Bounce laser balls, smash colorful brick layers, and collect power-ups!',
            controls: 'Mouse / Arrows / Drag'
        },
        {
            id: 'stacker',
            title: 'Tower Stacker',
            icon: '🏗️',
            tag: 'Timing & Zen',
            desc: 'Stack sliding blocks with pinpoint accuracy. Overhanging edges get trimmed!',
            controls: 'Tap / Spacebar'
        },
        {
            id: 'knife',
            title: 'Knife Hit',
            icon: '🗡️',
            tag: 'Target Precision',
            desc: 'Throw blades into the spinning timber wheel without hitting previously lodged knives.',
            controls: 'Tap / Spacebar'
        },
        {
            id: 'shooter',
            title: 'Retro Space Shooter',
            icon: '🚀',
            tag: 'Action Arcade',
            desc: 'Command your starfighter, blast alien invaders, and dodge hostile laser bombardments.',
            controls: 'Arrows / A,D / Touch'
        },
        {
            id: 'dodge',
            title: '3-Lane Dodge Runner',
            icon: '🏃',
            tag: 'Fast Reflexes',
            desc: 'Switch lanes at breakneck speed to evade barricades and hoard golden bonus coins.',
            controls: 'Left/Right Arrows / Swipe'
        },
        {
            id: 'minesweeper',
            title: 'Neon Minesweeper',
            icon: '💣',
            tag: 'Logic Grid',
            desc: 'Analyze numeric clues to safely flag hidden mines and clear the grid.',
            controls: 'Click / Tap / Flag Mode'
        }
    ];

    let currentGameId = null;
    let animFrameId = null;
    let gameLoopFn = null;
    let isPaused = false;
    let currentScore = 0;

    // 4. Render Hub Cards
    function renderGamesHubCards() {
        const grid = document.getElementById('games-catalog-grid');
        if (!grid) return;
        grid.innerHTML = GAMES_CATALOG.map(g => `
            <div class="game-card" onclick="launchGame('${g.id}')">
                <div class="game-card-top">
                    <div class="game-icon-badge">${g.icon}</div>
                    <span class="game-tag">${g.tag}</span>
                </div>
                <h3 class="game-card-title">${g.title}</h3>
                <p class="game-card-desc">${g.desc}</p>
                <div class="game-card-footer">
                    <span class="game-high-score">🏆 Best: <span id="hs-val-${g.id}">${getHighScore(g.id)}</span></span>
                    <button class="btn-play-card" onclick="event.stopPropagation(); launchGame('${g.id}')">Play &#9658;</button>
                </div>
            </div>
        `).join('');
    }

    // 5. Launch & Switch Games
    window.launchGame = function(gameId, isRestart = false) {
        stopCurrentGame();
        currentGameId = gameId;
        const gameMeta = GAMES_CATALOG.find(g => g.id === gameId);
        if (!gameMeta) return;

        const stage = document.getElementById('active-game-stage');
        const grid = document.getElementById('games-catalog-grid');
        if (stage) stage.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        document.getElementById('current-game-title').innerText = gameMeta.title;
        document.getElementById('current-game-icon').innerText = gameMeta.icon;
        document.getElementById('stage-high-score').innerText = getHighScore(gameId);
        updateScore(0);

        // Control container visibility
        const canvasContainer = document.getElementById('game-canvas-container');
        const grid2048 = document.getElementById('game-2048-container');
        const msContainer = document.getElementById('game-minesweeper-container');
        const dpad = document.getElementById('mobile-dpad-controls');
        const tapBar = document.getElementById('mobile-tap-controls');

        if (canvasContainer) canvasContainer.classList.remove('hidden');
        if (grid2048) grid2048.classList.add('hidden');
        if (msContainer) msContainer.classList.add('hidden');
        if (dpad) dpad.classList.remove('visible');
        if (tapBar) tapBar.classList.remove('visible');

        initAudio();

        if (gameId === 'snake') {
            if (dpad) dpad.classList.add('visible');
            initSnake();
        } else if (gameId === '2048') {
            if (canvasContainer) canvasContainer.classList.add('hidden');
            if (grid2048) grid2048.classList.remove('hidden');
            init2048();
        } else if (gameId === 'flappy') {
            if (tapBar) tapBar.classList.add('visible');
            initFlappy();
        } else if (gameId === 'runner') {
            if (tapBar) tapBar.classList.add('visible');
            initRunner();
        } else if (gameId === 'breaker') {
            initBreaker();
        } else if (gameId === 'stacker') {
            if (tapBar) tapBar.classList.add('visible');
            initStacker();
        } else if (gameId === 'knife') {
            if (tapBar) tapBar.classList.add('visible');
            initKnife();
        } else if (gameId === 'shooter') {
            if (dpad) dpad.classList.add('visible');
            initShooter();
        } else if (gameId === 'dodge') {
            if (dpad) dpad.classList.add('visible');
            initDodge();
        } else if (gameId === 'minesweeper') {
            if (canvasContainer) canvasContainer.classList.add('hidden');
            if (msContainer) msContainer.classList.remove('hidden');
            initMinesweeper();
        }

        // CRITICAL: When clicking Play Again, DO NOT scroll away! Stay exactly where user taps!
        if (!isRestart) {
            stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    window.closeGameStage = function() {
        stopCurrentGame();
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
        const stage = document.getElementById('active-game-stage');
        const grid = document.getElementById('games-catalog-grid');
        if (stage) {
            stage.classList.remove('is-fullscreen');
            stage.classList.add('hidden');
        }
        if (grid) grid.classList.remove('hidden');
        renderGamesHubCards();
    };

    // Fullscreen Toggle for All Games
    window.toggleFullscreenGame = function() {
        const stage = document.getElementById('active-game-stage');
        if (!stage) return;

        const isCurrentlyFs = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            stage.classList.contains('is-fullscreen')
        );

        if (!isCurrentlyFs) {
            stage.classList.add('is-fullscreen');
            if (stage.requestFullscreen) {
                stage.requestFullscreen().catch(() => {});
            } else if (stage.webkitRequestFullscreen) {
                stage.webkitRequestFullscreen();
            }
        } else {
            stage.classList.remove('is-fullscreen');
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        updateFullscreenUI();
    };

    function updateFullscreenUI() {
        const stage = document.getElementById('active-game-stage');
        const isFs = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            (stage && stage.classList.contains('is-fullscreen'))
        );
        const iconEl = document.getElementById('fullscreen-btn-icon');
        const textEl = document.getElementById('fullscreen-btn-text');
        if (iconEl) iconEl.innerHTML = isFs ? '&#x2921;' : '&#x26F6;';
        if (textEl) textEl.innerText = isFs ? 'Exit' : 'Fullscreen';
        if (stage) stage.classList.toggle('is-fullscreen', isFs);
    }

    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

    window.triggerCanvasTap = function(e) {
        if (typeof window.triggerMobileTap === 'function') {
            window.triggerMobileTap();
        }
    };

    function updateScore(val) {
        currentScore = val;
        const el = document.getElementById('stage-current-score');
        if (el) el.innerText = currentScore;
        if (currentGameId) {
            if (saveHighScore(currentGameId, currentScore)) {
                const hsEl = document.getElementById('stage-high-score');
                if (hsEl) hsEl.innerText = currentScore;
            }
        }
    }

    function stopCurrentGame() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        gameLoopFn = null;
        isPaused = false;
        // Clear active key listeners
        window.onkeydown = null;
    }

    function showOverlay(title, subtitle, btnText = 'Play Again') {
        const overlay = document.getElementById('game-stage-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        document.getElementById('overlay-title').innerText = title;
        document.getElementById('overlay-subtitle').innerText = subtitle;
        document.getElementById('overlay-btn').innerText = btnText;
    }

    function hideOverlay() {
        const overlay = document.getElementById('game-stage-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.restartCurrentGame = function() {
        hideOverlay();
        if (currentGameId) launchGame(currentGameId, true); // isRestart = true: DO NOT SCROLL!
    };

    window.toggleSound = function() {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('sound-toggle-icon');
        const text = document.getElementById('sound-toggle-text');
        if (icon) icon.innerText = soundEnabled ? '🔊' : '🔇';
        if (text) text.innerText = soundEnabled ? 'Sound ON' : 'Muted';
    };

    // -------------------------------------------------------------
    // GAME 1: NEON SNAKE
    // -------------------------------------------------------------
    function initSnake() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 400;

        const gridSize = 20;
        const tileCount = canvas.width / gridSize;
        let snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
        let dx = 0, dy = -1;
        let food = { x: 5, y: 5 };
        let score = 0;
        let speedMs = 110;
        let lastTime = 0;

        function placeFood() {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);
        }

        window.onkeydown = function(e) {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (dy === 0) { dx = 0; dy = -1; } e.preventDefault(); }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (dy === 0) { dx = 0; dy = 1; } e.preventDefault(); }
            else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (dx === 0) { dx = -1; dy = 0; } e.preventDefault(); }
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (dx === 0) { dx = 1; dy = 0; } e.preventDefault(); }
        };

        window.triggerDpad = function(dir) {
            if (dir === 'up' && dy === 0) { dx = 0; dy = -1; }
            if (dir === 'down' && dy === 0) { dx = 0; dy = 1; }
            if (dir === 'left' && dx === 0) { dx = -1; dy = 0; }
            if (dir === 'right' && dx === 0) { dx = 1; dy = 0; }
        };

        function loop(timestamp) {
            if (!timestamp) timestamp = performance.now();
            if (timestamp - lastTime >= speedMs) {
                lastTime = timestamp;

                const head = { x: snake[0].x + dx, y: snake[0].y + dy };

                // Collision with walls
                if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                    playSound('hit');
                    showOverlay('Game Over!', `Score: ${score}`);
                    return;
                }

                // Collision with self
                for (let i = 0; i < snake.length; i++) {
                    if (snake[i].x === head.x && snake[i].y === head.y) {
                        playSound('hit');
                        showOverlay('Game Over!', `Score: ${score}`);
                        return;
                    }
                }

                snake.unshift(head);

                if (head.x === food.x && head.y === food.y) {
                    score += 10;
                    updateScore(score);
                    playSound('score');
                    placeFood();
                    if (speedMs > 60) speedMs -= 1.5;
                } else {
                    snake.pop();
                }

                // Draw
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Grid lines subtle
                ctx.strokeStyle = '#1e293b';
                for (let x = 0; x < canvas.width; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = 0; y < canvas.height; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }

                // Food
                ctx.fillStyle = '#f43f5e';
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 12;
                ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

                // Snake
                snake.forEach((part, idx) => {
                    ctx.fillStyle = idx === 0 ? '#38bdf8' : '#0ea5e9';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = idx === 0 ? 10 : 4;
                    ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
                });
                ctx.shadowBlur = 0;
            }

            animFrameId = requestAnimationFrame(loop);
        }

        placeFood();
        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 2: 2048 PUZZLE
    // -------------------------------------------------------------
    function init2048() {
        const boardEl = document.getElementById('grid-2048-board');
        if (!boardEl) return;

        let grid = Array(4).fill(null).map(() => Array(4).fill(0));
        let score = 0;

        function addTile() {
            let empty = [];
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (grid[r][c] === 0) empty.push({ r, c });
                }
            }
            if (empty.length > 0) {
                let cell = empty[Math.floor(Math.random() * empty.length)];
                grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
            }
        }

        function renderBoard() {
            boardEl.innerHTML = '';
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    const val = grid[r][c];
                    const cell = document.createElement('div');
                    cell.className = 'cell-2048';
                    if (val > 0) {
                        cell.innerText = val;
                        cell.setAttribute('data-val', val);
                    }
                    boardEl.appendChild(cell);
                }
            }
            updateScore(score);
        }

        function slide(row) {
            let arr = row.filter(val => val);
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i] === arr[i + 1]) {
                    arr[i] *= 2;
                    score += arr[i];
                    arr.splice(i + 1, 1);
                    playSound('coin');
                }
            }
            while (arr.length < 4) arr.push(0);
            return arr;
        }

        function move(dir) {
            let moved = false;
            let newGrid = Array(4).fill(null).map(() => Array(4).fill(0));

            if (dir === 'left' || dir === 'right') {
                for (let r = 0; r < 4; r++) {
                    let row = grid[r].slice();
                    if (dir === 'right') row.reverse();
                    let res = slide(row);
                    if (dir === 'right') res.reverse();
                    newGrid[r] = res;
                    if (res.join(',') !== grid[r].join(',')) moved = true;
                }
            } else {
                for (let c = 0; c < 4; c++) {
                    let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
                    if (dir === 'down') col.reverse();
                    let res = slide(col);
                    if (dir === 'down') res.reverse();
                    for (let r = 0; r < 4; r++) newGrid[r][c] = res[r];
                    if (col.join(',') !== res.join(',')) moved = true;
                }
            }

            if (moved) {
                grid = newGrid;
                addTile();
                renderBoard();
                playSound('tap');
            }
        }

        window.onkeydown = function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'a') { move('left'); e.preventDefault(); }
            else if (e.key === 'ArrowRight' || e.key === 'd') { move('right'); e.preventDefault(); }
            else if (e.key === 'ArrowUp' || e.key === 'w') { move('up'); e.preventDefault(); }
            else if (e.key === 'ArrowDown' || e.key === 's') { move('down'); e.preventDefault(); }
        };

        // Touch swipes for 2048
        let touchStartX = 0, touchStartY = 0;
        boardEl.ontouchstart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        boardEl.ontouchend = (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) move('right');
                else if (dx < -30) move('left');
            } else {
                if (dy > 30) move('down');
                else if (dy < -30) move('up');
            }
        };

        addTile();
        addTile();
        renderBoard();
    }

    // -------------------------------------------------------------
    // GAME 3: FLAPPY SOLV
    // -------------------------------------------------------------
    function initFlappy() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 480;

        let bird = { x: 60, y: 220, vy: 0, gravity: 0.35, jump: -6.5, radius: 14 };
        let pipes = [];
        let score = 0;
        let pipeTimer = 0;
        let gameStarted = false;

        function flap() {
            if (!gameStarted) {
                gameStarted = true;
            }
            bird.vy = bird.jump;
            playSound('jump');
        }

        window.onkeydown = (e) => { if (e.code === 'Space' || e.key === 'ArrowUp') { flap(); e.preventDefault(); } };
        canvas.onclick = flap;
        window.triggerMobileTap = flap;

        function loop(timestamp) {
            if (!timestamp) timestamp = performance.now();

            if (!gameStarted) {
                // Hover bird gently in center, waiting for player's first tap
                bird.y = 220 + Math.sin(timestamp / 200) * 8;
                bird.vy = 0;
            } else {
                bird.vy += bird.gravity;
                bird.y += bird.vy;

                pipeTimer++;
                if (pipeTimer % 95 === 0) {
                    const gap = 130;
                    const topH = Math.floor(Math.random() * (canvas.height - gap - 100)) + 40;
                    pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false });
                }

                // Collisions with ceiling/ground
                if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }
            }

            // Draw Background
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                const p = pipes[i];
                p.x -= 2.2;

                // Collision check
                if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) {
                    if (bird.y - bird.radius < p.top || bird.y + bird.radius > canvas.height - p.bottom) {
                        playSound('hit');
                        showOverlay('Game Over!', `Score: ${score}`);
                        return;
                    }
                }

                if (!p.passed && p.x + 50 < bird.x) {
                    p.passed = true;
                    score++;
                    updateScore(score);
                    playSound('score');
                }

                // Render Pipe (Neon Cyan)
                ctx.fillStyle = '#06b6d4';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 8;
                ctx.fillRect(p.x, 0, 50, p.top);
                ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom);

                if (p.x + 50 < 0) pipes.splice(i, 1);
            }
            ctx.shadowBlur = 0;

            // Draw Bird (SolveSpot glowing orb)
            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Eye
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(bird.x + 5, bird.y - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 4: ENDLESS CYBER RUNNER
    // -------------------------------------------------------------
    function initRunner() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 440;
        canvas.height = 300;

        let player = { x: 40, y: 220, w: 26, h: 36, vy: 0, isGrounded: true };
        let obstacles = [];
        let score = 0;
        let speed = 4.5;
        let spawnCounter = 0;
        let gameStarted = false;

        function jump() {
            if (!gameStarted) gameStarted = true;
            if (player.isGrounded) {
                player.vy = -11;
                player.isGrounded = false;
                playSound('jump');
            }
        }

        window.onkeydown = (e) => { if (e.code === 'Space' || e.key === 'ArrowUp') { jump(); e.preventDefault(); } };
        canvas.onclick = jump;
        window.triggerMobileTap = jump;

        function loop() {
            // Physics
            player.vy += 0.65;
            player.y += player.vy;
            if (player.y >= 220) {
                player.y = 220;
                player.vy = 0;
                player.isGrounded = true;
            }

            if (gameStarted) {
                spawnCounter++;
                if (spawnCounter > 70 && Math.random() < 0.025) {
                    spawnCounter = 0;
                    obstacles.push({ x: canvas.width, w: 20, h: 34 });
                }
            }

            // Draw
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Ground
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 256);
            ctx.lineTo(canvas.width, 256);
            ctx.stroke();

            // Obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.x -= speed;

                // Collision
                if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
                    player.y < 256 && player.y + player.h > 256 - obs.h) {
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }

                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, 256 - obs.h, obs.w, obs.h);

                if (obs.x + obs.w < 0) {
                    obstacles.splice(i, 1);
                    score += 5;
                    updateScore(score);
                    speed += 0.05;
                }
            }

            // Player
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.fillRect(player.x, player.y, player.w, player.h);
            ctx.shadowBlur = 0;

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 5: NEON BRICK BREAKER
    // -------------------------------------------------------------
    function initBreaker() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 420;

        let paddle = { x: 160, w: 75, h: 12, speed: 7 };
        let ball = { x: 200, y: 280, vx: 3.5, vy: -3.5, r: 6 };
        let bricks = [];
        let score = 0;
        const rows = 5, cols = 8;
        const bW = 44, bH = 16, bPad = 5, bTop = 40, bLeft = 6;

        const colors = ['#f43f5e', '#fb923c', '#eab308', '#10b981', '#3b82f6'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                bricks.push({ x: bLeft + c * (bW + bPad), y: bTop + r * (bH + bPad), alive: true, color: colors[r] });
            }
        }

        let leftPressed = false, rightPressed = false;
        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
            if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
            if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
        };

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            paddle.x = (e.clientX - rect.left) - paddle.w / 2;
        };

        canvas.ontouchmove = (e) => {
            const rect = canvas.getBoundingClientRect();
            paddle.x = (e.touches[0].clientX - rect.left) - paddle.w / 2;
        };

        function loop() {
            if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;
            if (rightPressed && paddle.x + paddle.w < canvas.width) paddle.x += paddle.speed;

            if (paddle.x < 0) paddle.x = 0;
            if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;

            ball.x += ball.vx;
            ball.y += ball.vy;

            // Walls
            if (ball.x - ball.r < 0 || ball.x + ball.r > canvas.width) { ball.vx = -ball.vx; playSound('tap'); }
            if (ball.y - ball.r < 0) { ball.vy = -ball.vy; playSound('tap'); }

            // Paddle bounce
            if (ball.y + ball.r >= canvas.height - 25 && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
                ball.vy = -Math.abs(ball.vy);
                const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
                ball.vx = hitPos * 5;
                playSound('jump');
            }

            // Bottom drain
            if (ball.y - ball.r > canvas.height) {
                playSound('hit');
                showOverlay('Game Over', `Score: ${score}`);
                return;
            }

            // Bricks collision
            let allDead = true;
            bricks.forEach(b => {
                if (b.alive) {
                    allDead = false;
                    if (ball.x > b.x && ball.x < b.x + bW && ball.y > b.y && ball.y < b.y + bH) {
                        b.alive = false;
                        ball.vy = -ball.vy;
                        score += 15;
                        updateScore(score);
                        playSound('score');
                    }
                }
            });

            if (allDead) {
                playSound('win');
                showOverlay('Victory!', `Level Cleared! Score: ${score}`);
                return;
            }

            // Render
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bricks
            bricks.forEach(b => {
                if (b.alive) {
                    ctx.fillStyle = b.color;
                    ctx.fillRect(b.x, b.y, bW, bH);
                }
            });

            // Paddle
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(paddle.x, canvas.height - 25, paddle.w, paddle.h);

            // Ball
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fill();

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 6: TOWER STACKER
    // -------------------------------------------------------------
    function initStacker() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 480;

        let stack = [{ x: 100, y: 440, w: 160, color: '#38bdf8' }];
        let cur = { x: 0, y: 410, w: 160, vx: 3.5, color: '#f43f5e' };
        let score = 0;
        const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#c084fc'];

        function dropBlock() {
            const top = stack[stack.length - 1];
            const diff = cur.x - top.x;

            if (Math.abs(diff) >= cur.w) {
                playSound('hit');
                showOverlay('Game Over!', `Tower Height: ${score}`);
                return;
            }

            // Slice overhang
            if (diff > 0) {
                cur.w -= diff;
            } else if (diff < 0) {
                cur.w += diff;
                cur.x = top.x;
            }

            playSound('coin');
            stack.push({ x: cur.x, y: cur.y, w: cur.w, color: cur.color });
            score++;
            updateScore(score);

            // Spawn next
            const nextColor = colors[score % colors.length];
            cur = { x: 0, y: cur.y - 25, w: cur.w, vx: 3.5 + score * 0.15, color: nextColor };

            // Camera shift down if tower exceeds top
            if (cur.y < 120) {
                stack.forEach(b => b.y += 25);
                cur.y += 25;
            }
        }

        window.onkeydown = (e) => { if (e.code === 'Space') { dropBlock(); e.preventDefault(); } };
        canvas.onclick = dropBlock;
        window.triggerMobileTap = dropBlock;

        function loop() {
            cur.x += cur.vx;
            if (cur.x <= 0 || cur.x + cur.w >= canvas.width) {
                cur.vx = -cur.vx;
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Stacked blocks
            stack.forEach(b => {
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.w, 22);
            });

            // Active moving block
            ctx.fillStyle = cur.color;
            ctx.fillRect(cur.x, cur.y, cur.w, 22);

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 7: KNIFE HIT
    // -------------------------------------------------------------
    function initKnife() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 460;

        let angle = 0;
        let rotSpeed = 0.035;
        let targetRadius = 60;
        let stuckKnives = []; // angles
        let knifeY = 380;
        let isShooting = false;
        let score = 0;

        function throwKnife() {
            if (isShooting) return;
            isShooting = true;
            playSound('jump');
        }

        window.onkeydown = (e) => { if (e.code === 'Space') { throwKnife(); e.preventDefault(); } };
        canvas.onclick = throwKnife;
        window.triggerMobileTap = throwKnife;

        function loop() {
            angle += rotSpeed;

            if (isShooting) {
                knifeY -= 20;
                if (knifeY <= 150 + targetRadius) {
                    // Check collision with already stuck knives
                    const hitAngle = -angle % (Math.PI * 2);
                    let collision = false;
                    stuckKnives.forEach(a => {
                        let diff = Math.abs((a - hitAngle) % (Math.PI * 2));
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        if (diff < 0.25) collision = true;
                    });

                    if (collision) {
                        playSound('hit');
                        showOverlay('Deflected!', `Knives Lodged: ${score}`);
                        return;
                    } else {
                        playSound('score');
                        stuckKnives.push(hitAngle);
                        score++;
                        updateScore(score);
                        isShooting = false;
                        knifeY = 380;
                        if (score % 6 === 0) rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.02);
                    }
                }
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Spinning Wheel
            ctx.save();
            ctx.translate(canvas.width / 2, 150);
            ctx.rotate(angle);

            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(0, 0, targetRadius, 0, Math.PI * 2);
            ctx.fill();

            // Inner rings
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Stuck Knives
            stuckKnives.forEach(a => {
                ctx.save();
                ctx.rotate(a);
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(-3, targetRadius - 10, 6, 35);
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(-5, targetRadius + 25, 10, 15);
                ctx.restore();
            });
            ctx.restore();

            // Active Knife
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(canvas.width / 2 - 3, knifeY, 6, 40);
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(canvas.width / 2 - 5, knifeY + 40, 10, 18);

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 8: RETRO SPACE SHOOTER
    // -------------------------------------------------------------
    function initShooter() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 380;
        canvas.height = 460;

        let ship = { x: 175, y: 400, w: 30, h: 25, speed: 6 };
        let bullets = [];
        let enemies = [];
        let score = 0;
        let enemyTimer = 0;

        let left = false, right = false;
        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') right = true;
            if (e.code === 'Space') { fireBullet(); e.preventDefault(); }
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') right = false;
        };

        window.triggerDpad = (dir) => {
            if (dir === 'left') ship.x = Math.max(10, ship.x - 25);
            if (dir === 'right') ship.x = Math.min(canvas.width - 40, ship.x + 25);
            if (dir === 'up') fireBullet();
        };

        function fireBullet() {
            bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, vy: -7 });
            playSound('tap');
        }

        setInterval(() => { if (currentGameId === 'shooter') fireBullet(); }, 400);

        function loop() {
            if (left && ship.x > 5) ship.x -= ship.speed;
            if (right && ship.x + ship.w < canvas.width - 5) ship.x += ship.speed;

            enemyTimer++;
            if (enemyTimer % 45 === 0) {
                enemies.push({ x: Math.random() * (canvas.width - 30), y: -20, vy: 2 + Math.random() * 1.5 });
            }

            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bullets
            for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
                const b = bullets[bIdx];
                b.y += b.vy;
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(b.x, b.y, 4, 10);
                if (b.y < 0) bullets.splice(bIdx, 1);
            }

            // Enemies
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const en = enemies[eIdx];
                en.y += en.vy;

                // Hit player
                if (en.x < ship.x + ship.w && en.x + 25 > ship.x && en.y < ship.y + ship.h && en.y + 20 > ship.y) {
                    playSound('hit');
                    showOverlay('Ship Destroyed!', `Score: ${score}`);
                    return;
                }

                // Hit bullet
                for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
                    const b = bullets[bIdx];
                    if (b.x > en.x && b.x < en.x + 25 && b.y > en.y && b.y < en.y + 20) {
                        enemies.splice(eIdx, 1);
                        bullets.splice(bIdx, 1);
                        score += 20;
                        updateScore(score);
                        playSound('score');
                        break;
                    }
                }

                // Render Alien
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(en.x, en.y, 24, 18);

                if (en.y > canvas.height) enemies.splice(eIdx, 1);
            }

            // Ship
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(ship.x + ship.w / 2, ship.y);
            ctx.lineTo(ship.x, ship.y + ship.h);
            ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
            ctx.fill();

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 9: 3-LANE DODGE RUNNER
    // -------------------------------------------------------------
    function initDodge() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 460;

        const lanes = [60, 180, 300];
        let currentLane = 1;
        let obstacles = [];
        let coins = [];
        let score = 0;
        let speed = 4;
        let timer = 0;

        function moveLane(dir) {
            if (dir === 'left' && currentLane > 0) currentLane--;
            if (dir === 'right' && currentLane < 2) currentLane++;
            playSound('jump');
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') moveLane('left');
            if (e.key === 'ArrowRight' || e.key === 'd') moveLane('right');
        };

        window.triggerDpad = (dir) => {
            if (dir === 'left') moveLane('left');
            if (dir === 'right') moveLane('right');
        };

        function loop() {
            timer++;
            if (timer % 55 === 0) {
                const laneIdx = Math.floor(Math.random() * 3);
                obstacles.push({ x: lanes[laneIdx] - 25, y: -40, w: 50, h: 30 });
            }
            if (timer % 40 === 0) {
                const coinLane = Math.floor(Math.random() * 3);
                coins.push({ x: lanes[coinLane], y: -20, r: 8 });
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Lane markers
            ctx.strokeStyle = '#334155';
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(120, 0); ctx.lineTo(120, canvas.height);
            ctx.moveTo(240, 0); ctx.lineTo(240, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Coins
            for (let cIdx = coins.length - 1; cIdx >= 0; cIdx--) {
                const c = coins[cIdx];
                c.y += speed;
                if (Math.abs(c.x - lanes[currentLane]) < 25 && Math.abs(c.y - 380) < 25) {
                    coins.splice(cIdx, 1);
                    score += 10;
                    updateScore(score);
                    playSound('coin');
                    continue;
                }
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                ctx.fill();
                if (c.y > canvas.height) coins.splice(cIdx, 1);
            }

            // Obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.y += speed;

                // Hit check
                if (Math.abs((obs.x + obs.w / 2) - lanes[currentLane]) < 30 && obs.y + obs.h > 360 && obs.y < 400) {
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }

                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                if (obs.y > canvas.height) obstacles.splice(i, 1);
            }

            // Player Kart
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(lanes[currentLane] - 18, 360, 36, 44);

            score++;
            if (score % 200 === 0) speed += 0.3;

            animFrameId = requestAnimationFrame(loop);
        }

        hideOverlay();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 10: NEON MINESWEEPER
    // -------------------------------------------------------------
    function initMinesweeper() {
        const boardEl = document.getElementById('game-minesweeper-container');
        if (!boardEl) return;

        const size = 9;
        const totalMines = 10;
        let board = [];
        let flagMode = false;
        let gameOver = false;

        boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        // Setup empty board
        for (let r = 0; r < size; r++) {
            board[r] = [];
            for (let c = 0; c < size; c++) {
                board[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
            }
        }

        // Place mines
        let placed = 0;
        while (placed < totalMines) {
            let rr = Math.floor(Math.random() * size);
            let cc = Math.floor(Math.random() * size);
            if (!board[rr][cc].mine) {
                board[rr][cc].mine = true;
                placed++;
            }
        }

        // Calculate counts
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c].mine) continue;
                let cnt = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc].mine) cnt++;
                    }
                }
                board[r][c].count = cnt;
            }
        }

        function render() {
            boardEl.innerHTML = '';
            let revealedCount = 0;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cellData = board[r][c];
                    const div = document.createElement('div');
                    div.className = 'ms-cell' + (cellData.revealed ? ' revealed' : '') + (cellData.flagged ? ' flagged' : '');
                    if (cellData.revealed) {
                        revealedCount++;
                        if (cellData.mine) {
                            div.innerText = '💣';
                            div.classList.add('mine');
                        } else if (cellData.count > 0) {
                            div.innerText = cellData.count;
                            div.setAttribute('data-count', cellData.count);
                        }
                    } else if (cellData.flagged) {
                        div.innerText = '🚩';
                    }

                    div.onclick = () => onCellClick(r, c);
                    div.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); };
                    boardEl.appendChild(div);
                }
            }

            if (revealedCount === size * size - totalMines && !gameOver) {
                gameOver = true;
                playSound('win');
                updateScore(100);
                showOverlay('Grid Cleared!', 'You found all safe cells!');
            }
        }

        function reveal(r, c) {
            if (r < 0 || r >= size || c < 0 || c >= size || board[r][c].revealed || board[r][c].flagged) return;
            board[r][c].revealed = true;
            if (board[r][c].count === 0 && !board[r][c].mine) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
                }
            }
        }

        function onCellClick(r, c) {
            if (gameOver) return;
            if (flagMode) { toggleFlag(r, c); return; }
            if (board[r][c].flagged) return;

            if (board[r][c].mine) {
                // Reveal all mines
                gameOver = true;
                playSound('hit');
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        if (board[i][j].mine) board[i][j].revealed = true;
                    }
                }
                render();
                showOverlay('Detonated!', 'Better luck next sweep!');
                return;
            }

            playSound('tap');
            reveal(r, c);
            render();
        }

        function toggleFlag(r, c) {
            if (gameOver || board[r][c].revealed) return;
            board[r][c].flagged = !board[r][c].flagged;
            playSound('tap');
            render();
        }

        render();
    }

    function refreshHighScores() {
        GAMES_CATALOG.forEach(g => {
            const el = document.getElementById(`hs-val-${g.id}`);
            if (el) el.innerText = getHighScore(g.id);
        });
    }

    // 6. Router Hook for /games
    window.initGamesHub = function(subgame) {
        refreshHighScores();
        if (subgame && GAMES_CATALOG.some(g => g.id === subgame)) {
            launchGame(subgame);
        } else {
            closeGameStage();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { refreshHighScores(); });
    } else {
        refreshHighScores();
    }

})();

