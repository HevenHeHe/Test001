/**
 * 2048 - Neon Protocol Mobile Edition
 * Swipe-based number merging puzzle
 */

class Game2048 {
    constructor() {
        this.id = '2048';
        this.size = 4;
        this.cellSize = 72;
        this.gap = 8;
        this.board = [];
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.continueAfterWin = false;
        this.paused = false;

        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.gameLoop = null;
        this.lastTime = 0;

        // Animations
        this.animations = [];   // {type:'spawn'|'merge', x, y, value, progress, duration}
        this.particles = [];    // {x, y, vx, vy, life, color, size}

        // Touch
        this.touchStartX = 0;
        this.touchStartY = 0;

        // Neon palette for tile values
        this.TILE_BG = {
            0:    '#131326',
            2:    '#00f0ff',
            4:    '#0080ff',
            8:    '#00ff40',
            16:   '#ccff00',
            32:   '#ff8000',
            64:   '#ff0040',
            128:  '#ff00aa',
            256:  '#d000ff',
            512:  '#8000ff',
            1024: '#ffffff',
            2048: '#ffd700',
            4096: '#ff3333',
            8192: '#ff0000'
        };
        this.TILE_TEXT = {
            0: '#0a0a0f', 2: '#0a0a0f', 4: '#ffffff', 8: '#0a0a0f',
            16: '#0a0a0f', 32: '#0a0a0f', 64: '#ffffff', 128: '#ffffff',
            256: '#ffffff', 512: '#ffffff', 1024: '#0a0a0f', 2048: '#0a0a0f',
            4096: '#ffffff', 8192: '#ffffff'
        };
    }

    init(container) {
        this.container = container;

        // Mobile-first sizing
        const maxWidth = Math.min(window.innerWidth - 32, 375);
        this.cellSize = Math.floor((maxWidth - this.gap * (this.size + 1)) / this.size);
        this.cellSize = Math.max(50, Math.min(85, this.cellSize));
        const canvasSize = this.size * this.cellSize + (this.size + 1) * this.gap;

        this.canvas = document.createElement('canvas');
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '340px';
        this.canvas.style.height = 'auto';
        this.canvas.style.touchAction = 'none';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        this.resetGame();
        this.bindControls();

        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    resetGame() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.continueAfterWin = false;
        this.animations = [];
        this.particles = [];
        this.spawnTile();
        this.spawnTile();
        this.updateUI();
    }

    spawnTile() {
        const empty = [];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.board[y][x] === 0) empty.push({ x, y });
            }
        }
        if (empty.length === 0) return false;

        const pos = empty[Math.floor(Math.random() * empty.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        this.board[pos.y][pos.x] = value;

        this.animations.push({
            type: 'spawn',
            x: pos.x,
            y: pos.y,
            value,
            progress: 0,
            duration: 250
        });
        return true;
    }

    // ==================== MOVE LOGIC ====================
    move(direction) {
        if (this.gameOver) return;
        if (this.won && !this.continueAfterWin) {
            this.continueAfterWin = true;
        }

        const prevBoard = this.board.map(r => [...r]);
        let moved = false;
        let scoreGain = 0;

        const getLine = (i, dir) => {
            const line = [];
            for (let j = 0; j < this.size; j++) {
                if (dir === 'left')      line.push(this.board[i][j]);
                else if (dir === 'right')line.push(this.board[i][this.size - 1 - j]);
                else if (dir === 'up')   line.push(this.board[j][i]);
                else if (dir === 'down') line.push(this.board[this.size - 1 - j][i]);
            }
            return line;
        };

        const setLine = (i, dir, line) => {
            for (let j = 0; j < this.size; j++) {
                if (dir === 'left')      this.board[i][j] = line[j];
                else if (dir === 'right')this.board[i][this.size - 1 - j] = line[j];
                else if (dir === 'up')   this.board[j][i] = line[j];
                else if (dir === 'down') this.board[this.size - 1 - j][i] = line[j];
            }
        };

        const processLine = (line) => {
            let filtered = line.filter(v => v !== 0);
            let mergedIndices = new Set();
            for (let i = 0; i < filtered.length - 1; i++) {
                if (filtered[i] === filtered[i + 1] && !mergedIndices.has(i)) {
                    filtered[i] *= 2;
                    scoreGain += filtered[i];
                    if (filtered[i] === 2048) this.won = true;
                    mergedIndices.add(i);
                    filtered.splice(i + 1, 1);
                }
            }
            while (filtered.length < this.size) filtered.push(0);
            return filtered;
        };

        for (let i = 0; i < this.size; i++) {
            const line = getLine(i, direction);
            const processed = processLine(line);
            setLine(i, direction, processed);
            if (line.some((v, j) => v !== processed[j])) moved = true;
        }

        if (moved) {
            this.score += scoreGain;
            if (scoreGain > 0) {
                neonAudio?.reveal();
                this.spawnMergeParticles(prevBoard);
            } else {
                neonAudio?.move();
            }
            this.spawnTile();
            this.updateUI();

            if (!this.canMove()) {
                this.gameOver = true;
                neonAudio?.gameOver();
            }
        }
    }

    canMove() {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.board[y][x] === 0) return true;
                if (x < this.size - 1 && this.board[y][x] === this.board[y][x + 1]) return true;
                if (y < this.size - 1 && this.board[y][x] === this.board[y + 1][x]) return true;
            }
        }
        return false;
    }

    // ==================== PARTICLES ====================
    spawnMergeParticles(prevBoard) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const val = this.board[y][x];
                const prev = prevBoard[y][x];
                if (val > prev && prev !== 0 && val === prev * 2) {
                    const color = this.TILE_BG[val] || '#ff00ff';
                    const cx = this.gap + x * (this.cellSize + this.gap) + this.cellSize / 2;
                    const cy = this.gap + y * (this.cellSize + this.gap) + this.cellSize / 2;
                    for (let i = 0; i < 10; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 1.5 + Math.random() * 3;
                        this.particles.push({
                            x: cx, y: cy,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 1.0,
                            color,
                            size: 2 + Math.random() * 3
                        });
                    }
                }
            }
        }
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        // Update animations
        this.animations = this.animations.filter(a => {
            a.progress += dt / a.duration;
            return a.progress < 1;
        });

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // gravity
            p.life -= 0.025;
            return p.life > 0;
        });

        this.draw();
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    // ==================== RENDERING ====================
    draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const g = this.gap;
        const S = this.size;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Clear background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Board background
        ctx.fillStyle = '#0c0c18';
        this.drawRoundRect(0, 0, W, H, 8);
        ctx.fill();

        // Grid cells
        for (let y = 0; y < S; y++) {
            for (let x = 0; x < S; x++) {
                const val = this.board[y][x];
                const px = g + x * (cs + g);
                const py = g + y * (cs + g);

                // Cell background
                ctx.fillStyle = this.TILE_BG[val] || this.TILE_BG[0];
                ctx.shadowColor = val > 0 ? (this.TILE_BG[val] || '#ff00ff') : 'transparent';
                ctx.shadowBlur = val >= 128 ? 12 : (val > 0 ? 6 : 0);

                const radius = 6;
                this.drawRoundRect(px, py, cs, cs, radius);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Number
                if (val > 0) {
                    ctx.fillStyle = this.TILE_TEXT[val] || '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Dynamic font size
                    const digits = String(val).length;
                    const fontSize = digits <= 2 ? cs * 0.55 : digits === 3 ? cs * 0.42 : cs * 0.32;
                    ctx.font = `bold ${fontSize}px Orbitron, monospace`;

                    // Spawn scale animation
                    let scale = 1;
                    const spawnAnim = this.animations.find(a => a.type === 'spawn' && a.x === x && a.y === y);
                    if (spawnAnim) {
                        const t = spawnAnim.progress;
                        scale = t < 0.5 ? t * 2 : 1;
                    }

                    ctx.save();
                    ctx.translate(px + cs / 2, py + cs / 2);
                    ctx.scale(scale, scale);
                    ctx.fillText(String(val), 0, 0);
                    ctx.restore();
                }
            }
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Win overlay
        if (this.won && !this.continueAfterWin) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('2048!', W / 2, H / 2 - 25);
            ctx.shadowBlur = 0;
            ctx.font = '14px Orbitron, monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText('SWIPE TO CONTINUE', W / 2, H / 2 + 15);
        }

        // Game Over overlay
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ff0040';
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 24px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
            ctx.shadowBlur = 0;
            ctx.font = '14px Orbitron, monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`SCORE: ${this.score}`, W / 2, H / 2 + 15);
        }
    }

    drawRoundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ==================== INPUT ====================
    handleInput(action) {
        if (action === 'restart') {
            this.resetGame();
            return;
        }
        if (this.gameOver) return;
        if (['up', 'down', 'left', 'right'].includes(action)) {
            this.move(action);
        }
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.container || !this.container.isConnected) return;
            if (this.gameOver) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.resetGame();
                }
                return;
            }
            switch (e.key) {
                case 'ArrowLeft':  e.preventDefault(); this.move('left'); break;
                case 'ArrowRight': e.preventDefault(); this.move('right'); break;
                case 'ArrowUp':    e.preventDefault(); this.move('up'); break;
                case 'ArrowDown':  e.preventDefault(); this.move('down'); break;
            }
        });

        // Touch swipe on canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameOver) {
                this.resetGame();
                return;
            }
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            const minSwipe = 30;

            if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.move(dx > 0 ? 'right' : 'left');
            } else {
                this.move(dy > 0 ? 'down' : 'up');
            }
        }, { passive: false });
    }

    updateUI() {
        if (window.hub) {
            window.hub.updateScore(this.id, this.score);
        }
    }

    destroy() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        if (this.canvas) this.canvas.remove();
    }
}

// Standalone support
if (typeof window !== 'undefined') window.Game2048 = Game2048;
