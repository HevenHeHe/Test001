/**
 * FLAPPY - Neon Protocol Mobile Edition
 * Endless pipe-flying arcade game
 */

class FlappyGame {
    constructor() {
        this.id = 'flappy';
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.gameLoop = null;

        // Dimensions
        this.W = 375;
        this.H = 520;
        this.groundH = 40;

        // Bird
        this.bird = { x: 80, y: 200, r: 12, vy: 0, angle: 0 };
        this.gravity = 0.25;
        this.flapPower = -5.5;

        // Pipes
        this.pipes = [];     // { x, gapY, passed }
        this.pipeW = 52;
        this.gapSize = 130;
        this.pipeSpacing = 220;
        this.pipeSpeed = 2.5;
        this.nextPipeX = this.W;

        // Score & state
        this.score = 0;
        this.highScore = 0;
        this.gameOver = false;
        this.started = false;
        this.flash = 0;

        // Visuals
        this.particles = [];
        this.groundOffset = 0;
        this.wingFrame = 0;
        this.stars = [];
        this.buildings = [];
    }

    init(container) {
        this.container = container;

        // Responsive canvas
        const maxWidth = Math.min(window.innerWidth - 32, 375);
        const scale = maxWidth / this.W;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.W * scale;
        this.canvas.height = this.H * scale;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '375px';
        this.canvas.style.height = 'auto';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(scale, scale);

        container.appendChild(this.canvas);

        // Generate background elements
        this.generateStars();
        this.generateBuildings();

        this.resetGame();
        this.bindControls();

        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    generateStars() {
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * this.W,
                y: Math.random() * (this.H - this.groundH - 80),
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.6 + 0.2,
                twinkleSpeed: Math.random() * 0.03 + 0.01
            });
        }
    }

    generateBuildings() {
        this.buildings = [];
        let bx = 0;
        while (bx < this.W * 2) {
            const bw = 20 + Math.random() * 35;
            const bh = 40 + Math.random() * 80;
            this.buildings.push({ x: bx, w: bw, h: bh });
            bx += bw + Math.random() * 10;
        }
    }

    resetGame() {
        this.bird = { x: 80, y: this.H / 2 - 40, r: 12, vy: 0, angle: 0 };
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.started = false;
        this.flash = 0;
        this.particles = [];
        this.groundOffset = 0;
        this.pipeSpeed = 2.5;
        this.nextPipeX = this.W + 50;
        this.updateUI();
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        if (!this.gameOver) {
            this.update();
        }
        this.draw(time);
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        if (!this.started) return;

        // Bird physics
        this.bird.vy += this.gravity;
        this.bird.y += this.bird.vy;
        this.bird.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.bird.vy * 0.08));

        // Wing animation
        this.wingFrame += 0.15;

        // Ground scroll
        this.groundOffset -= this.pipeSpeed;
        if (this.groundOffset <= -30) this.groundOffset += 30;

        // Move pipes
        for (let p of this.pipes) {
            p.x -= this.pipeSpeed;

            // Score when passing bird
            if (!p.passed && p.x + this.pipeW < this.bird.x) {
                p.passed = true;
                this.score++;
                this.updateUI();
                neonAudio?.reveal();

                // Speed up every 5 pipes
                if (this.score % 5 === 0) {
                    this.pipeSpeed = Math.min(5.5, this.pipeSpeed + 0.3);
                }
            }
        }

        // Remove off-screen pipes
        this.pipes = this.pipes.filter(p => p.x > -this.pipeW);

        // Spawn new pipe
        if (this.nextPipeX <= this.W) {
            const minGapY = 60;
            const maxGapY = this.H - this.groundH - this.gapSize - 60;
            const gapY = minGapY + Math.random() * (maxGapY - minGapY);
            this.pipes.push({ x: this.nextPipeX, gapY, passed: false });
            this.nextPipeX += this.pipeSpacing;
        }
        this.nextPipeX -= this.pipeSpeed;

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.025;
            return p.life > 0;
        });

        // Collision detection
        this.checkCollision();
    }

    checkCollision() {
        const b = this.bird;

        // Ceiling / ground
        if (b.y - b.r < 0 || b.y + b.r > this.H - this.groundH) {
            this.endGame();
            return;
        }

        // Pipes
        for (let p of this.pipes) {
            if (b.x + b.r > p.x && b.x - b.r < p.x + this.pipeW) {
                if (b.y - b.r < p.gapY || b.y + b.r > p.gapY + this.gapSize) {
                    this.endGame();
                    return;
                }
            }
        }
    }

    endGame() {
        this.gameOver = true;
        this.flash = 1;
        neonAudio?.gameOver();

        // Death particles
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1.0,
                color: i % 3 === 0 ? '#00ff40' : i % 3 === 1 ? '#00f0ff' : '#ffff00',
                size: 2 + Math.random() * 3
            });
        }

        if (window.hub) {
            window.hub.updateScore(this.id, this.score);
        }
    }

    // ==================== RENDERING ====================
    draw(time) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Stars
        this.stars.forEach(s => {
            const alpha = s.alpha + Math.sin(time * s.twinkleSpeed) * 0.15;
            ctx.globalAlpha = Math.max(0.1, alpha);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // City silhouette
        ctx.fillStyle = '#080812';
        this.buildings.forEach(b => {
            const bx = ((b.x + this.groundOffset * 0.3) % (W * 2) + W * 2) % (W * 2) - W * 0.5;
            ctx.fillRect(bx, H - this.groundH - b.h, b.w, b.h);
        });

        // Pipes
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;

        for (let p of this.pipes) {
            const topH = p.gapY;
            const bottomY = p.gapY + this.gapSize;
            const bottomH = H - this.groundH - bottomY;

            // Top pipe
            ctx.fillRect(p.x, 0, this.pipeW, topH);
            ctx.strokeRect(p.x, 0, this.pipeW, topH);
            ctx.strokeRect(p.x - 2, topH - 20, this.pipeW + 4, 20);

            // Bottom pipe
            ctx.fillRect(p.x, bottomY, this.pipeW, bottomH);
            ctx.strokeRect(p.x, bottomY, this.pipeW, bottomH);
            ctx.strokeRect(p.x - 2, bottomY, this.pipeW + 4, 20);
        }
        ctx.shadowBlur = 0;

        // Ground
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, H - this.groundH, W, this.groundH);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < W / 30 + 2; i++) {
            const gx = i * 30 + this.groundOffset % 30;
            ctx.beginPath();
            ctx.moveTo(gx, H - this.groundH);
            ctx.lineTo(gx - 10, H);
            ctx.stroke();
        }
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, H - this.groundH);
        ctx.lineTo(W, H - this.groundH);
        ctx.stroke();

        // Bird
        if (!this.gameOver || this.flash > 0.3) {
            this.drawBird(ctx);
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Score (in-game)
        if (this.started && !this.gameOver) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.fillText(String(this.score), W / 2, 60);
            ctx.shadowBlur = 0;
        }

        // Start screen
        if (!this.started && !this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 22px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FLAPPY', W / 2, H / 2 - 30);
            ctx.shadowBlur = 0;
            ctx.font = '14px Orbitron, monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('TAP / SPACE TO FLY', W / 2, H / 2 + 10);
        }

        // Game over overlay
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#ff0040';
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 24px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CRASHED', W / 2, H / 2 - 40);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#00f0ff';
            ctx.font = '16px Orbitron, monospace';
            ctx.fillText(`SCORE: ${this.score}`, W / 2, H / 2 + 5);

            ctx.fillStyle = '#ffd700';
            ctx.font = '14px Orbitron, monospace';
            ctx.fillText(`BEST: ${Math.max(this.score, this.highScore)}`, W / 2, H / 2 + 35);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '12px Orbitron, monospace';
            ctx.fillText('TAP TO RETRY', W / 2, H / 2 + 70);
        }

        // Flash effect on death
        if (this.flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.3})`;
            ctx.fillRect(0, 0, W, H);
            this.flash -= 0.03;
        }
    }

    drawBird(ctx) {
        const b = this.bird;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        // Glow
        ctx.shadowColor = '#00ff40';
        ctx.shadowBlur = 15;

        // Body
        ctx.fillStyle = '#00ff40';
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff8000';
        ctx.beginPath();
        ctx.moveTo(6, 1);
        ctx.lineTo(14, 4);
        ctx.lineTo(6, 7);
        ctx.closePath();
        ctx.fill();

        // Wing (animated)
        const wingY = Math.sin(this.wingFrame) * 4;
        ctx.fillStyle = '#00cc30';
        ctx.beginPath();
        ctx.ellipse(-4, 2 + wingY, 7, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ==================== INPUT ====================
    flap() {
        if (this.gameOver) {
            this.resetGame();
            return;
        }
        if (!this.started) {
            this.started = true;
        }
        this.bird.vy = this.flapPower;
        neonAudio?.move();
    }

    handleInput(action) {
        if (action === 'restart') {
            this.resetGame();
            return;
        }
        this.flap();
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.container || !this.container.isConnected) return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.flap();
            }
        });

        // Touch / click on canvas
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.flap();
        });
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
if (typeof window !== 'undefined') window.FlappyGame = FlappyGame;
