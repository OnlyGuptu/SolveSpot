/**
 * SolveSpot Arcade & Break Zone (10 Micro-Games)
 * Zero-Glitch Responsive Canvas Engines + Web Audio Synthesizer + LocalStorage High Scores
 * Optimized for both Mobile Touch (Phone/Tablet) and Desktop (Keyboard/Mouse) + Fullscreen
 */

(function() {
    'use strict';

    // 1. Retro Sound Synthesizer (Web Audio API)
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) audioCtx = new AudioContext();
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {}
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
                osc.frequency.exponentialRampToValueAtTime(580, now + 0.09);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (type === 'score' || type === 'coin') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'perfect') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'hit' || type === 'crash') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(55, now + 0.24);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.24);
                osc.start(now);
                osc.stop(now + 0.24);
            } else if (type === 'win') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.1);
                osc.frequency.setValueAtTime(659.25, now + 0.2);
                osc.frequency.setValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            }
        } catch (e) {}
    }

    // 2. High Score Persistence
    function getHighScore(gameId) {
        try {
            return parseInt(localStorage.getItem('solvespot_hs_' + gameId) || '0', 10);
        } catch (e) {
            return 0;
        }
    }

    function saveHighScore(gameId, score) {
        try {
            const current = getHighScore(gameId);
            if (score > current) {
                localStorage.setItem('solvespot_hs_' + gameId, String(score));
                return true;
            }
        } catch (e) {}
        return false;
    }

    // 3. Catalog Metadata
    const GAMES_CATALOG = [
        {
            id: 'snake',
            title: 'Neon Snake',
            icon: '🐍',
            tag: 'Classic Arcade',
            desc: 'Guide the glowing snake, eat neon energy orbs, grow longer, and avoid crashing into walls or your own tail!',
            controls: 'Arrows / WASD / Swipe / D-Pad'
        },
        {
            id: '2048',
            title: '2048 Challenge',
            icon: '🔢',
            tag: 'Brain Puzzle',
            desc: 'Swipe or slide tiles to merge matching numbers. Can you build the legendary 2048 tile?',
            controls: 'Arrows / WASD / Swipe / D-Pad'
        },
        {
            id: 'flappy',
            title: 'Flappy Solv',
            icon: '🐦',
            tag: 'One-Tap Reflex',
            desc: 'Tap or press Space to flap your wings and thread through glowing neon laser pipes.',
            controls: 'Space / Click / Tap Button'
        },
        {
            id: 'runner',
            title: 'Endless Cyber Runner',
            icon: '🦖',
            tag: 'Infinite Runner',
            desc: 'Sprint across the cyber grid and leap over incoming plasma barriers as speed ramps up!',
            controls: 'Space / Up Arrow / Tap'
        },
        {
            id: 'breaker',
            title: 'Neon Brick Breaker',
            icon: '🧱',
            tag: 'Retro Smash',
            desc: 'Deflect the plasma ball with your hover-paddle and shatter every brick in the neon wall.',
            controls: 'Mouse / Touch Drag / Arrows'
        },
        {
            id: 'stacker',
            title: 'Tower Stacker',
            icon: '🏗️',
            tag: 'Precision Timing',
            desc: 'Drop swinging blocks with pinpoint accuracy to build the tallest skyscraper!',
            controls: 'Space / Tap Screen / Button'
        },
        {
            id: 'knife',
            title: 'Knife Hit Master',
            icon: '🗡️',
            tag: 'Target Action',
            desc: 'Launch daggers into the spinning target core without striking any previously lodged blades!',
            controls: 'Space / Tap Screen / Button'
        },
        {
            id: 'shooter',
            title: 'Retro Space Shooter',
            icon: '🚀',
            tag: 'Arcade Action',
            desc: 'Pilot your starfighter, auto-blast alien squadrons, and dodge incoming invaders.',
            controls: 'Touch Drag / Arrows / D-Pad'
        },
        {
            id: 'dodge',
            title: '3-Lane Dodge Runner',
            icon: '🏎️',
            tag: 'High Speed',
            desc: 'Switch lanes at breakneck speed to evade roadblocks and collect golden turbo coins.',
            controls: 'Left/Right Arrows / Swipe / D-Pad'
        },
        {
            id: 'minesweeper',
            title: 'Neon Minesweeper',
            icon: '💣',
            tag: 'Logic Grid',
            desc: 'Use numeric clues to flag hidden mines and clear the safe cyber-grid without detonating!',
            controls: 'Click / Tap / Flag Mode Button'
        }
    ];

    let currentGameId = null;
    let animFrameId = null;
    let activeIntervalId = null;
    let currentScore = 0;
    let lastActionTime = 0; // Anti-double-tap debounce timestamp

    // Helper: Convert client X/Y to internal canvas coordinates accurately in both normal & fullscreen
    function getCanvasCoords(canvas, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Helper: Debounce rapid synthetic touch+click events on mobile
    function canTriggerAction(minGapMs = 75) {
        const now = performance.now();
        if (now - lastActionTime < minGapMs) return false;
        lastActionTime = now;
        return true;
    }

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
        hideOverlay();
        currentGameId = gameId;
        lastActionTime = performance.now();

        const gameMeta = GAMES_CATALOG.find(g => g.id === gameId);
        if (!gameMeta) return;

        const stage = document.getElementById('active-game-stage');
        const grid = document.getElementById('games-catalog-grid');
        if (stage) stage.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');

        const titleEl = document.getElementById('current-game-title');
        const iconEl = document.getElementById('current-game-icon');
        const hsEl = document.getElementById('stage-high-score');
        if (titleEl) titleEl.innerText = gameMeta.title;
        if (iconEl) iconEl.innerText = gameMeta.icon;
        if (hsEl) hsEl.innerText = getHighScore(gameId);
        updateScore(0);

        // Control container visibility
        const canvasContainer = document.getElementById('game-canvas-container');
        const grid2048 = document.getElementById('game-2048-container');
        const msContainer = document.getElementById('game-minesweeper-container');
        const dpad = document.getElementById('mobile-dpad-controls');
        const tapBar = document.getElementById('mobile-tap-controls');
        const tapBtn = document.querySelector('#mobile-tap-controls .btn-mobile-tap');

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
            if (dpad) dpad.classList.add('visible');
            init2048();
        } else if (gameId === 'flappy') {
            if (tapBar) tapBar.classList.add('visible');
            if (tapBtn) tapBtn.innerText = '⚡ TAP TO FLAP WINGS ⚡';
            initFlappy();
        } else if (gameId === 'runner') {
            if (tapBar) tapBar.classList.add('visible');
            if (tapBtn) tapBtn.innerText = '⚡ TAP TO JUMP ⚡';
            initRunner();
        } else if (gameId === 'breaker') {
            if (dpad) dpad.classList.add('visible');
            initBreaker();
        } else if (gameId === 'stacker') {
            if (tapBar) tapBar.classList.add('visible');
            if (tapBtn) tapBtn.innerText = '🏗️ TAP TO DROP BLOCK 🏗️';
            initStacker();
        } else if (gameId === 'knife') {
            if (tapBar) tapBar.classList.add('visible');
            if (tapBtn) tapBtn.innerText = '🗡️ TAP TO THROW KNIFE 🗡️';
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

        if (!isRestart && stage) {
            stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    window.closeGameStage = function() {
        stopCurrentGame();
        hideOverlay();
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

    // Prevent double-bubbling from #game-canvas-container onclick
    window.triggerCanvasTap = function(e) {
        // Handled directly on canvas/button with debounce to prevent double triggers
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
        if (activeIntervalId) {
            clearInterval(activeIntervalId);
            activeIntervalId = null;
        }
        window.onkeydown = null;
        window.onkeyup = null;
        window.triggerMobileTap = null;
        window.triggerDpad = null;

        const canvas = document.getElementById('game-main-canvas');
        if (canvas) {
            canvas.onclick = null;
            canvas.onpointerdown = null;
            canvas.onmousemove = null;
            canvas.ontouchmove = null;
            canvas.ontouchstart = null;
            canvas.ontouchend = null;
        }
    }

    function showOverlay(title, subtitle, btnText = 'Play Again') {
        const overlay = document.getElementById('game-stage-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        const tEl = document.getElementById('overlay-title');
        const sEl = document.getElementById('overlay-subtitle');
        const bEl = document.getElementById('overlay-btn');
        if (tEl) tEl.innerText = title;
        if (sEl) sEl.innerText = subtitle;
        if (bEl) bEl.innerText = btnText;
    }

    function hideOverlay() {
        const overlay = document.getElementById('game-stage-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    window.restartCurrentGame = function() {
        hideOverlay();
        if (currentGameId) launchGame(currentGameId, true);
    };

    window.toggleSound = function() {
        soundEnabled = !soundEnabled;
        const icon = document.getElementById('sound-toggle-icon');
        const text = document.getElementById('sound-toggle-text');
        if (icon) icon.innerText = soundEnabled ? '🔊' : '🔇';
        if (text) text.innerText = soundEnabled ? 'Sound ON' : 'Muted';
    };

    // -------------------------------------------------------------
    // GAME 1: NEON SNAKE (With Direction Queue & Swipe Controls)
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
        let moveQueue = [];
        let food = { x: 5, y: 5 };
        let score = 0;
        let speedMs = 115;
        let lastTime = 0;
        let isGameOver = false;

        function placeFood() {
            let valid = false;
            while (!valid) {
                food.x = Math.floor(Math.random() * tileCount);
                food.y = Math.floor(Math.random() * tileCount);
                valid = !snake.some(s => s.x === food.x && s.y === food.y);
            }
        }

        function queueDirection(newDx, newDy) {
            if (isGameOver) return;
            const lastDir = moveQueue.length > 0 ? moveQueue[moveQueue.length - 1] : { dx, dy };
            // Prevent 180-degree self-reversal
            if (lastDir.dx + newDx === 0 && lastDir.dy + newDy === 0) return;
            if (lastDir.dx === newDx && lastDir.dy === newDy) return;
            if (moveQueue.length < 2) {
                moveQueue.push({ dx: newDx, dy: newDy });
            }
        }

        window.onkeydown = function(e) {
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { queueDirection(0, -1); e.preventDefault(); }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { queueDirection(0, 1); e.preventDefault(); }
            else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { queueDirection(-1, 0); e.preventDefault(); }
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { queueDirection(1, 0); e.preventDefault(); }
        };

        window.triggerDpad = function(dir) {
            if (dir === 'up') queueDirection(0, -1);
            if (dir === 'down') queueDirection(0, 1);
            if (dir === 'left') queueDirection(-1, 0);
            if (dir === 'right') queueDirection(1, 0);
        };

        let tsX = 0, tsY = 0;
        canvas.ontouchstart = (e) => {
            tsX = e.touches[0].clientX;
            tsY = e.touches[0].clientY;
        };
        canvas.ontouchend = (e) => {
            const diffX = e.changedTouches[0].clientX - tsX;
            const diffY = e.changedTouches[0].clientY - tsY;
            if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) return;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                queueDirection(diffX > 0 ? 1 : -1, 0);
            } else {
                queueDirection(0, diffY > 0 ? 1 : -1);
            }
        };

        function loop(timestamp) {
            if (isGameOver) return;
            if (!timestamp) timestamp = performance.now();
            if (timestamp - lastTime >= speedMs) {
                lastTime = timestamp;

                if (moveQueue.length > 0) {
                    const next = moveQueue.shift();
                    dx = next.dx;
                    dy = next.dy;
                }

                const head = { x: snake[0].x + dx, y: snake[0].y + dy };

                // Wall collision
                if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                    isGameOver = true;
                    playSound('hit');
                    showOverlay('Game Over!', `Score: ${score}`);
                    return;
                }

                // Self collision
                for (let i = 0; i < snake.length - 1; i++) {
                    if (snake[i].x === head.x && snake[i].y === head.y) {
                        isGameOver = true;
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
                    if (speedMs > 58) speedMs -= 1.5;
                } else {
                    snake.pop();
                }

                // Render
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1;
                for (let x = 0; x < canvas.width; x += gridSize) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
                }
                for (let y = 0; y < canvas.height; y += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
                }

                // Food Orb
                ctx.fillStyle = '#f43f5e';
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
                ctx.fill();

                // Snake Segments
                snake.forEach((part, idx) => {
                    ctx.fillStyle = idx === 0 ? '#38bdf8' : '#0284c7';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = idx === 0 ? 10 : 0;
                    ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
                });
                ctx.shadowBlur = 0;
            }

            animFrameId = requestAnimationFrame(loop);
        }

        placeFood();
        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 2: 2048 PUZZLE (Fixed Column Logic + Game Over Check + D-Pad)
    // -------------------------------------------------------------
    function init2048() {
        const boardEl = document.getElementById('grid-2048-board');
        if (!boardEl) return;

        let grid = Array(4).fill(null).map(() => Array(4).fill(0));
        let score = 0;
        let isGameOver = false;

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

        function canMoveAny() {
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    if (grid[r][c] === 0) return true;
                    if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
                    if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
                }
            }
            return false;
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

            if (!canMoveAny() && !isGameOver) {
                isGameOver = true;
                playSound('hit');
                showOverlay('No More Moves!', `Final Score: ${score}`);
            }
        }

        function slide(row) {
            let arr = row.filter(val => val > 0);
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
            if (isGameOver) return;
            let moved = false;
            let newGrid = Array(4).fill(null).map(() => Array(4).fill(0));

            if (dir === 'left' || dir === 'right') {
                for (let r = 0; r < 4; r++) {
                    const originalRow = grid[r].slice();
                    let working = originalRow.slice();
                    if (dir === 'right') working.reverse();
                    let res = slide(working);
                    if (dir === 'right') res.reverse();
                    newGrid[r] = res;
                    if (res.join(',') !== originalRow.join(',')) moved = true;
                }
            } else {
                for (let c = 0; c < 4; c++) {
                    const originalCol = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
                    let working = originalCol.slice();
                    if (dir === 'down') working.reverse();
                    let res = slide(working);
                    if (dir === 'down') res.reverse();
                    for (let r = 0; r < 4; r++) newGrid[r][c] = res[r];
                    if (res.join(',') !== originalCol.join(',')) moved = true;
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
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { move('left'); e.preventDefault(); }
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { move('right'); e.preventDefault(); }
            else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { move('up'); e.preventDefault(); }
            else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { move('down'); e.preventDefault(); }
        };

        window.triggerDpad = function(dir) {
            move(dir);
        };

        let touchStartX = 0, touchStartY = 0;
        boardEl.ontouchstart = (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        boardEl.ontouchend = (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                move(dx > 0 ? 'right' : 'left');
            } else {
                move(dy > 0 ? 'down' : 'up');
            }
        };

        addTile();
        addTile();
        renderBoard();
    }

    // -------------------------------------------------------------
    // GAME 3: FLAPPY SOLV (Debounced Single-Tap + Hover Start)
    // -------------------------------------------------------------
    function initFlappy() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 480;

        let bird = { x: 70, y: 220, vy: 0, gravity: 0.34, jump: -6.4, radius: 14 };
        let pipes = [];
        let score = 0;
        let pipeTimer = 0;
        let gameStarted = false;
        let isGameOver = false;

        function flap(e) {
            if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
            if (isGameOver) return;
            if (!canTriggerAction(80)) return;

            if (!gameStarted) gameStarted = true;
            bird.vy = bird.jump;
            playSound('jump');
        }

        window.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
                flap();
                e.preventDefault();
            }
        };
        canvas.onpointerdown = flap;
        window.triggerMobileTap = flap;

        function loop(timestamp) {
            if (isGameOver) return;
            if (!timestamp) timestamp = performance.now();

            if (!gameStarted) {
                bird.y = 220 + Math.sin(timestamp / 200) * 8;
                bird.vy = 0;
            } else {
                bird.vy += bird.gravity;
                bird.y += bird.vy;

                pipeTimer++;
                if (pipeTimer % 95 === 0) {
                    const gap = 132;
                    const topH = Math.floor(Math.random() * (canvas.height - gap - 110)) + 45;
                    pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false });
                }

                if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
                    isGameOver = true;
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }
            }

            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = pipes.length - 1; i >= 0; i--) {
                const p = pipes[i];
                p.x -= 2.3;

                if (bird.x + bird.radius - 2 > p.x && bird.x - bird.radius + 2 < p.x + 52) {
                    if (bird.y - bird.radius + 2 < p.top || bird.y + bird.radius - 2 > canvas.height - p.bottom) {
                        isGameOver = true;
                        playSound('hit');
                        showOverlay('Game Over!', `Score: ${score}`);
                        return;
                    }
                }

                if (!p.passed && p.x + 52 < bird.x) {
                    p.passed = true;
                    score++;
                    updateScore(score);
                    playSound('score');
                }

                ctx.fillStyle = '#06b6d4';
                ctx.shadowColor = '#06b6d4';
                ctx.shadowBlur = 8;
                ctx.fillRect(p.x, 0, 52, p.top);
                ctx.fillRect(p.x, canvas.height - p.bottom, 52, p.bottom);
                if (p.x + 55 < 0) pipes.splice(i, 1);
            }
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#facc15';
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(bird.x + 5, bird.y - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            if (!gameStarted) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.font = 'bold 16px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ TAP SCREEN OR SPACE TO FLY ⚡', canvas.width / 2, 290);
            }

            animFrameId = requestAnimationFrame(loop);
        }

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

        let player = { x: 45, y: 220, w: 26, h: 36, vy: 0, isGrounded: true };
        let obstacles = [];
        let score = 0;
        let speed = 4.6;
        let nextSpawnDist = 60;
        let gameStarted = false;
        let isGameOver = false;

        function jump(e) {
            if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
            if (isGameOver) return;
            if (!canTriggerAction(70)) return;

            if (!gameStarted) gameStarted = true;
            if (player.isGrounded) {
                player.vy = -11.2;
                player.isGrounded = false;
                playSound('jump');
            }
        }

        window.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
                jump();
                e.preventDefault();
            }
        };
        canvas.onpointerdown = jump;
        window.triggerMobileTap = jump;

        function loop() {
            if (isGameOver) return;

            player.vy += 0.62;
            player.y += player.vy;
            if (player.y >= 220) {
                player.y = 220;
                player.vy = 0;
                player.isGrounded = true;
            }

            if (gameStarted) {
                nextSpawnDist--;
                if (nextSpawnDist <= 0) {
                    const h = 26 + Math.floor(Math.random() * 18);
                    obstacles.push({ x: canvas.width, w: 20, h: h });
                    nextSpawnDist = Math.floor(55 + Math.random() * 50);
                }
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Neon Ground
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 256);
            ctx.lineTo(canvas.width, 256);
            ctx.stroke();

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.x -= speed;

                if (player.x + 3 < obs.x + obs.w && player.x + player.w - 3 > obs.x &&
                    player.y + player.h - 3 > 256 - obs.h) {
                    isGameOver = true;
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }

                ctx.fillStyle = '#f43f5e';
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 8;
                ctx.fillRect(obs.x, 256 - obs.h, obs.w, obs.h);
                ctx.shadowBlur = 0;

                if (obs.x + obs.w < 0) {
                    obstacles.splice(i, 1);
                    score += 10;
                    updateScore(score);
                    if (speed < 9) speed += 0.08;
                }
            }

            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.fillRect(player.x, player.y, player.w, player.h);
            ctx.shadowBlur = 0;

            if (!gameStarted) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                ctx.font = 'bold 15px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ TAP SCREEN OR SPACE TO SPRINT ⚡', canvas.width / 2, 130);
            }

            animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 5: NEON BRICK BREAKER (Scaled Mouse/Touch + D-Pad Support)
    // -------------------------------------------------------------
    function initBreaker() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 420;

        let paddle = { x: 160, w: 84, h: 12, speed: 7 };
        let ball = { x: 200, y: 340, vx: 3.4, vy: -3.8, r: 7 };
        let bricks = [];
        let score = 0;
        let isGameOver = false;
        const rows = 5, cols = 8;
        const bW = 44, bH = 16, bPad = 5, bTop = 42, bLeft = 6;
        const colors = ['#f43f5e', '#fb923c', '#eab308', '#10b981', '#3b82f6'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                bricks.push({ x: bLeft + c * (bW + bPad), y: bTop + r * (bH + bPad), alive: true, color: colors[r] });
            }
        }

        let leftPressed = false, rightPressed = false;
        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = true;
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') leftPressed = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rightPressed = false;
        };

        window.triggerDpad = (dir) => {
            if (dir === 'left') paddle.x = Math.max(0, paddle.x - 32);
            if (dir === 'right') paddle.x = Math.min(canvas.width - paddle.w, paddle.x + 32);
        };

        canvas.onmousemove = (e) => {
            const pos = getCanvasCoords(canvas, e.clientX, e.clientY);
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, pos.x - paddle.w / 2));
        };

        canvas.ontouchmove = (e) => {
            if (e.cancelable) e.preventDefault();
            const pos = getCanvasCoords(canvas, e.touches[0].clientX, e.touches[0].clientY);
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, pos.x - paddle.w / 2));
        };

        function loop() {
            if (isGameOver) return;

            if (leftPressed) paddle.x -= paddle.speed;
            if (rightPressed) paddle.x += paddle.speed;
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

            ball.x += ball.vx;
            ball.y += ball.vy;

            // Wall bounces (clamped so ball never gets stuck in wall)
            if (ball.x - ball.r <= 0) {
                ball.x = ball.r;
                ball.vx = Math.abs(ball.vx);
                playSound('tap');
            } else if (ball.x + ball.r >= canvas.width) {
                ball.x = canvas.width - ball.r;
                ball.vx = -Math.abs(ball.vx);
                playSound('tap');
            }
            if (ball.y - ball.r <= 0) {
                ball.y = ball.r;
                ball.vy = Math.abs(ball.vy);
                playSound('tap');
            }

            // Paddle bounce
            if (ball.vy > 0 && ball.y + ball.r >= canvas.height - 28 && ball.y - ball.r <= canvas.height - 14 &&
                ball.x >= paddle.x - 4 && ball.x <= paddle.x + paddle.w + 4) {
                ball.y = canvas.height - 28 - ball.r;
                ball.vy = -Math.abs(ball.vy);
                const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
                ball.vx = hitPos * 4.8;
                if (Math.abs(ball.vx) < 1.2) ball.vx = ball.vx >= 0 ? 1.2 : -1.2;
                playSound('jump');
            }

            // Bottom drain
            if (ball.y - ball.r > canvas.height) {
                isGameOver = true;
                playSound('hit');
                showOverlay('Game Over', `Score: ${score}`);
                return;
            }

            // Bricks collision
            let allDead = true;
            for (let i = 0; i < bricks.length; i++) {
                const b = bricks[i];
                if (!b.alive) continue;
                allDead = false;
                if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + bW &&
                    ball.y + ball.r > b.y && ball.y - ball.r < b.y + bH) {
                    b.alive = false;
                    ball.vy = -ball.vy;
                    score += 15;
                    updateScore(score);
                    playSound('score');
                    break;
                }
            }

            if (allDead) {
                isGameOver = true;
                playSound('win');
                showOverlay('Victory!', `All Bricks Cleared! Score: ${score}`);
                return;
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            bricks.forEach(b => {
                if (b.alive) {
                    ctx.fillStyle = b.color;
                    ctx.fillRect(b.x, b.y, bW, bH);
                }
            });

            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.fillRect(paddle.x, canvas.height - 26, paddle.w, paddle.h);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fill();

            animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 6: TOWER STACKER / BRICK TOWER (Complete Zero-Glitch Overhaul!)
    // -------------------------------------------------------------
    function initStacker() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 480;

        const blockH = 24;
        const colors = ['#38bdf8', '#f43f5e', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#818cf8', '#c084fc'];

        // Foundation block at bottom
        let stack = [{ x: 90, y: 430, w: 180, color: colors[0] }];
        let debris = []; // Falling sliced pieces
        let perfectTextTimer = 0;
        let score = 0;
        let isGameOver = false;
        let cameraOffsetY = 0;
        let targetCameraOffsetY = 0;

        // Spawn active block starting near center-left moving right
        let cur = {
            x: 20,
            y: 430 - blockH,
            w: 180,
            vx: 3.2,
            color: colors[1]
        };

        function dropBlock(e) {
            if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
            if (isGameOver) return;
            // Strong 140ms debounce so a single tap/click NEVER drops two blocks at once!
            if (!canTriggerAction(140)) return;

            const top = stack[stack.length - 1];
            const diff = cur.x - top.x;

            // Complete miss -> Game Over
            if (Math.abs(diff) >= cur.w) {
                // Make entire missed block fall into debris
                debris.push({ x: cur.x, y: cur.y, w: cur.w, vy: 2, color: cur.color });
                isGameOver = true;
                playSound('hit');
                showOverlay('Tower Collapsed!', `Tower Height: ${score} Floors`);
                return;
            }

            // Check for Perfect Drop (within 4.5px tolerance)
            if (Math.abs(diff) <= 4.5) {
                cur.x = top.x;
                cur.w = top.w;
                perfectTextTimer = 40;
                score += 2; // Bonus point for Perfect alignment!
                playSound('perfect');
            } else {
                // Slice overhanging part and spawn falling debris piece
                if (diff > 0) {
                    const overhangW = diff;
                    debris.push({ x: top.x + top.w, y: cur.y, w: overhangW, vy: 1.5, color: cur.color });
                    cur.w -= overhangW;
                } else {
                    const overhangW = -diff;
                    debris.push({ x: cur.x, y: cur.y, w: overhangW, vy: 1.5, color: cur.color });
                    cur.w -= overhangW;
                    cur.x = top.x;
                }
                score += 1;
                playSound('coin');
            }

            // Prevent ultra-thin sub-pixel blocks
            if (cur.w < 6) {
                isGameOver = true;
                playSound('hit');
                showOverlay('Tower Too Narrow!', `Final Score: ${score}`);
                return;
            }

            stack.push({ x: cur.x, y: cur.y, w: cur.w, color: cur.color });
            updateScore(score);

            // Next floor
            const floorCount = stack.length - 1;
            const nextColor = colors[floorCount % colors.length];
            const nextY = cur.y - blockH;
            const nextSpeed = Math.min(7.5, 3.2 + floorCount * 0.16);
            const startFromLeft = (floorCount % 2 === 0);

            cur = {
                x: startFromLeft ? 0 : (canvas.width - cur.w),
                y: nextY,
                w: cur.w,
                vx: startFromLeft ? nextSpeed : -nextSpeed,
                color: nextColor
            };

            // Smooth camera scroll up when tower exceeds 8 blocks
            if (floorCount > 8) {
                targetCameraOffsetY = (floorCount - 8) * blockH;
            }
        }

        window.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 's') {
                dropBlock();
                e.preventDefault();
            }
        };
        canvas.onpointerdown = dropBlock;
        window.triggerMobileTap = dropBlock;

        function loop() {
            // Smooth camera interpolation
            cameraOffsetY += (targetCameraOffsetY - cameraOffsetY) * 0.15;

            if (!isGameOver) {
                cur.x += cur.vx;
                // Clamped wall bounce so block NEVER gets stuck on edge!
                if (cur.x <= 0) {
                    cur.x = 0;
                    cur.vx = Math.abs(cur.vx);
                } else if (cur.x + cur.w >= canvas.width) {
                    cur.x = canvas.width - cur.w;
                    cur.vx = -Math.abs(cur.vx);
                }
            }

            // Background sky gradient
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle guide lines for current top of tower
            if (stack.length > 0 && !isGameOver) {
                const top = stack[stack.length - 1];
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(top.x, 0);
                ctx.lineTo(top.x, canvas.height);
                ctx.moveTo(top.x + top.w, 0);
                ctx.lineTo(top.x + top.w, canvas.height);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.save();
            ctx.translate(0, cameraOffsetY);

            // Draw Stacked Tower Blocks
            stack.forEach((b, idx) => {
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.w, blockH - 2);
                // Top 3D highlight edge
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.fillRect(b.x, b.y, b.w, 3);
            });

            // Draw Falling Sliced Debris
            for (let i = debris.length - 1; i >= 0; i--) {
                const d = debris[i];
                d.y += d.vy;
                d.vy += 0.45;
                ctx.fillStyle = d.color;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(d.x, d.y, d.w, blockH - 2);
                ctx.globalAlpha = 1.0;
                if (d.y - cameraOffsetY > canvas.height + 50) {
                    debris.splice(i, 1);
                }
            }

            // Draw Active Swinging Block
            if (!isGameOver) {
                ctx.fillStyle = cur.color;
                ctx.shadowColor = cur.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(cur.x, cur.y, cur.w, blockH - 2);
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fillRect(cur.x, cur.y, cur.w, 3);
            }

            ctx.restore();

            // "PERFECT! +2" Pop-up Feedback
            if (perfectTextTimer > 0) {
                perfectTextTimer--;
                ctx.fillStyle = '#4ade80';
                ctx.font = 'bold 18px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✨ PERFECT DROP! +2 ✨', canvas.width / 2, 75);
            } else if (stack.length === 1 && !isGameOver) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.font = 'bold 14px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Tap Screen or Space to Stack Blocks!', canvas.width / 2, 75);
            }

            if (!isGameOver || debris.length > 0) {
                animFrameId = requestAnimationFrame(loop);
            }
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 7: KNIFE HIT MASTER (Fixed Angle Wrap Math + Stage Progression)
    // -------------------------------------------------------------
    function initKnife() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 360;
        canvas.height = 460;

        let angle = 0;
        let rotSpeed = 0.035;
        const targetRadius = 62;
        let stuckKnives = [];
        let knifeY = 375;
        let isShooting = false;
        let score = 0;
        let stageLevel = 1;
        let knivesLeftInStage = 7;
        let hitFlash = 0;
        let isGameOver = false;

        function throwKnife(e) {
            if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
            if (isGameOver || isShooting) return;
            if (!canTriggerAction(90)) return;
            isShooting = true;
            playSound('jump');
        }

        window.onkeydown = (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                throwKnife();
                e.preventDefault();
            }
        };
        canvas.onpointerdown = throwKnife;
        window.triggerMobileTap = throwKnife;

        function loop() {
            if (isGameOver) return;
            angle += rotSpeed;

            if (isShooting) {
                knifeY -= 24;
                if (knifeY <= 155 + targetRadius) {
                    const hitAngle = -angle;
                    let collision = false;

                    for (let i = 0; i < stuckKnives.length; i++) {
                        // Exact shortest angular distance around circle
                        const angularDiff = Math.abs(Math.atan2(Math.sin(stuckKnives[i] - hitAngle), Math.cos(stuckKnives[i] - hitAngle)));
                        if (angularDiff < 0.21) {
                            collision = true;
                            break;
                        }
                    }

                    if (collision) {
                        isGameOver = true;
                        playSound('hit');
                        showOverlay('Blade Deflected!', `Total Knives Hit: ${score}`);
                        return;
                    } else {
                        stuckKnives.push(hitAngle);
                        score++;
                        knivesLeftInStage--;
                        hitFlash = 6;
                        updateScore(score);
                        isShooting = false;
                        knifeY = 375;

                        if (knivesLeftInStage <= 0) {
                            // Next stage: clear wheel & increase challenge
                            playSound('win');
                            stageLevel++;
                            knivesLeftInStage = Math.min(10, 6 + stageLevel);
                            stuckKnives = [];
                            // Add 1 or 2 pre-stuck obstacle blades on higher stages
                            if (stageLevel >= 2) stuckKnives.push(0);
                            if (stageLevel >= 3) stuckKnives.push(Math.PI);
                            rotSpeed = (stageLevel % 2 === 0 ? -1 : 1) * Math.min(0.065, 0.032 + stageLevel * 0.005);
                        } else {
                            playSound('score');
                        }
                    }
                }
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Stage & Remaining Knives HUD
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`STAGE ${stageLevel}`, 16, 28);
            ctx.textAlign = 'right';
            ctx.fillText(`Knives Left: ${knivesLeftInStage} 🗡️`, canvas.width - 16, 28);

            // Spinning Log Target
            ctx.save();
            const shakeY = hitFlash > 0 ? -4 : 0;
            if (hitFlash > 0) hitFlash--;
            ctx.translate(canvas.width / 2, 155 + shakeY);
            ctx.rotate(angle);

            // Stuck Knives (drawn behind wheel rim)
            stuckKnives.forEach(a => {
                ctx.save();
                ctx.rotate(a);
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(-3, targetRadius - 8, 6, 34);
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(-5, targetRadius + 26, 10, 14);
                ctx.restore();
            });

            // Log Core
            ctx.fillStyle = hitFlash > 0 ? '#f59e0b' : '#d97706';
            ctx.beginPath();
            ctx.arc(0, 0, targetRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#78350f';
            ctx.stroke();

            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(0, 0, targetRadius * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Active Knife Ready to Throw
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(canvas.width / 2 - 3, knifeY, 6, 38);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(canvas.width / 2 - 6, knifeY + 38, 12, 18);

            animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 8: RETRO SPACE SHOOTER (No Leaked Intervals + Touch Drag)
    // -------------------------------------------------------------
    function initShooter() {
        const canvas = document.getElementById('game-main-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 380;
        canvas.height = 460;

        let ship = { x: 175, y: 400, w: 32, h: 26, speed: 6 };
        let bullets = [];
        let enemies = [];
        let score = 0;
        let tick = 0;
        let isGameOver = false;

        let left = false, right = false;
        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') right = true;
            if (e.code === 'Space') { fireBullet(); e.preventDefault(); }
        };
        window.onkeyup = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') right = false;
        };

        window.triggerDpad = (dir) => {
            if (dir === 'left') ship.x = Math.max(10, ship.x - 28);
            if (dir === 'right') ship.x = Math.min(canvas.width - ship.w - 10, ship.x + 28);
            if (dir === 'up') fireBullet();
        };

        canvas.onmousemove = (e) => {
            const pos = getCanvasCoords(canvas, e.clientX, e.clientY);
            ship.x = Math.max(8, Math.min(canvas.width - ship.w - 8, pos.x - ship.w / 2));
        };
        canvas.ontouchmove = (e) => {
            if (e.cancelable) e.preventDefault();
            const pos = getCanvasCoords(canvas, e.touches[0].clientX, e.touches[0].clientY);
            ship.x = Math.max(8, Math.min(canvas.width - ship.w - 8, pos.x - ship.w / 2));
        };

        function fireBullet() {
            if (isGameOver) return;
            bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y - 6, vy: -8 });
        }

        function loop() {
            if (isGameOver) return;
            tick++;

            if (left && ship.x > 8) ship.x -= ship.speed;
            if (right && ship.x + ship.w < canvas.width - 8) ship.x += ship.speed;

            // Auto-fire every 22 frames inside animation loop (never leaks intervals!)
            if (tick % 22 === 0) {
                fireBullet();
            }

            if (tick % 44 === 0) {
                enemies.push({
                    x: 15 + Math.random() * (canvas.width - 55),
                    y: -24,
                    vy: 2.1 + Math.min(2.5, score / 400)
                });
            }

            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bullets
            for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
                const b = bullets[bIdx];
                b.y += b.vy;
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(b.x, b.y, 4, 12);
                if (b.y < -15) bullets.splice(bIdx, 1);
            }

            // Enemies
            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                const en = enemies[eIdx];
                en.y += en.vy;

                if (en.x < ship.x + ship.w && en.x + 26 > ship.x && en.y < ship.y + ship.h && en.y + 20 > ship.y) {
                    isGameOver = true;
                    playSound('hit');
                    showOverlay('Ship Destroyed!', `Score: ${score}`);
                    return;
                }

                let hit = false;
                for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
                    const b = bullets[bIdx];
                    if (b.x + 4 > en.x && b.x < en.x + 26 && b.y < en.y + 20 && b.y + 12 > en.y) {
                        enemies.splice(eIdx, 1);
                        bullets.splice(bIdx, 1);
                        score += 20;
                        updateScore(score);
                        playSound('score');
                        hit = true;
                        break;
                    }
                }
                if (hit) continue;

                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(en.x, en.y, 26, 18);

                if (en.y > canvas.height) enemies.splice(eIdx, 1);
            }

            // Starfighter
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(ship.x + ship.w / 2, ship.y);
            ctx.lineTo(ship.x, ship.y + ship.h);
            ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 9: 3-LANE DODGE RUNNER (Swipe + Tap Left/Right + D-Pad)
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
        let speed = 4.2;
        let timer = 0;
        let isGameOver = false;

        function moveLane(dir) {
            if (isGameOver) return;
            if (dir === 'left' && currentLane > 0) {
                currentLane--;
                playSound('jump');
            } else if (dir === 'right' && currentLane < 2) {
                currentLane++;
                playSound('jump');
            }
        }

        window.onkeydown = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { moveLane('left'); e.preventDefault(); }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { moveLane('right'); e.preventDefault(); }
        };

        window.triggerDpad = (dir) => {
            if (dir === 'left') moveLane('left');
            if (dir === 'right') moveLane('right');
        };

        canvas.onpointerdown = (e) => {
            if (!canTriggerAction(80)) return;
            const pos = getCanvasCoords(canvas, e.clientX, e.clientY);
            if (pos.x < canvas.width / 2) moveLane('left');
            else moveLane('right');
        };

        function loop() {
            if (isGameOver) return;
            timer++;

            if (timer % 52 === 0) {
                const laneIdx = Math.floor(Math.random() * 3);
                obstacles.push({ x: lanes[laneIdx] - 25, y: -40, w: 50, h: 28 });
            }
            if (timer % 38 === 0) {
                const coinLane = Math.floor(Math.random() * 3);
                coins.push({ x: lanes[coinLane], y: -20, r: 9 });
            }

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Road Lanes
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.setLineDash([16, 16]);
            ctx.beginPath();
            ctx.moveTo(120, 0); ctx.lineTo(120, canvas.height);
            ctx.moveTo(240, 0); ctx.lineTo(240, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Coins
            for (let cIdx = coins.length - 1; cIdx >= 0; cIdx--) {
                const c = coins[cIdx];
                c.y += speed;
                if (Math.abs(c.x - lanes[currentLane]) < 25 && Math.abs(c.y - 380) < 28) {
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
                if (c.y > canvas.height + 20) coins.splice(cIdx, 1);
            }

            // Obstacles
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.y += speed;

                if (Math.abs((obs.x + obs.w / 2) - lanes[currentLane]) < 28 && obs.y + obs.h > 362 && obs.y < 402) {
                    isGameOver = true;
                    playSound('hit');
                    showOverlay('Crashed!', `Score: ${score}`);
                    return;
                }

                ctx.fillStyle = '#f43f5e';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                if (obs.y > canvas.height + 20) {
                    obstacles.splice(i, 1);
                    score += 2;
                    updateScore(score);
                }
            }

            // Player Racer
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillRect(lanes[currentLane] - 18, 360, 36, 44);
            ctx.shadowBlur = 0;

            if (timer % 180 === 0 && speed < 9.5) speed += 0.3;

            animFrameId = requestAnimationFrame(loop);
        }

        animFrameId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------
    // GAME 10: NEON MINESWEEPER (Safe First Click + Mobile Flag Toggle)
    // -------------------------------------------------------------
    function initMinesweeper() {
        const boardEl = document.getElementById('game-minesweeper-container');
        if (!boardEl) return;

        const size = 9;
        const totalMines = 10;
        let board = [];
        let flagMode = false;
        let minesPlaced = false;
        let gameOver = false;

        const tapBar = document.getElementById('mobile-tap-controls');
        const tapBtn = document.querySelector('#mobile-tap-controls .btn-mobile-tap');
        if (tapBar) tapBar.classList.add('visible');
        if (tapBtn) {
            tapBtn.innerText = '⛏️ MODE: DIG (TAP TO SWITCH TO FLAG 🚩)';
        }

        window.triggerMobileTap = function() {
            flagMode = !flagMode;
            if (tapBtn) {
                tapBtn.innerText = flagMode
                    ? '🚩 MODE: PLACE FLAG (TAP TO SWITCH TO DIG ⛏️)'
                    : '⛏️ MODE: DIG (TAP TO SWITCH TO FLAG 🚩)';
            }
            playSound('tap');
        };

        boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        for (let r = 0; r < size; r++) {
            board[r] = [];
            for (let c = 0; c < size; c++) {
                board[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
            }
        }

        function generateMinesSafe(safeR, safeC) {
            let placed = 0;
            while (placed < totalMines) {
                let rr = Math.floor(Math.random() * size);
                let cc = Math.floor(Math.random() * size);
                if (Math.abs(rr - safeR) <= 1 && Math.abs(cc - safeC) <= 1) continue;
                if (!board[rr][cc].mine) {
                    board[rr][cc].mine = true;
                    placed++;
                }
            }

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
            minesPlaced = true;
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

            updateScore(revealedCount * 5);

            if (revealedCount === size * size - totalMines && !gameOver) {
                gameOver = true;
                playSound('win');
                updateScore(500);
                showOverlay('Grid Cleared!', 'You swept all 10 mines safely! Score: 500');
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

            if (!minesPlaced) {
                generateMinesSafe(r, c);
            }

            if (board[r][c].mine) {
                gameOver = true;
                playSound('hit');
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        if (board[i][j].mine) board[i][j].revealed = true;
                    }
                }
                render();
                showOverlay('Detonated! 💥', 'You hit a hidden mine!');
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
