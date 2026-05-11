/**
 * BREAKOUT - Neon Protocol Mobile Edition
 * Classic brick-breaking arcade game
 */

class BreakoutGame {
    constructor() {
        this.id = 'breakout';
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.gameLoop = null;

        // Dimensions
        this.W = 375;
        this.H = 520;

        // Paddle
        this.paddle = { x: 150, y: 480, w: 80, h: 12, vx: 0 };
        this.paddleSpeed = 6;

        // Ball
        this.ball = { x: 0, y: 0, vx: 0, vy: 0, r: 7 };
        this.ballSpeed = 3.5;

        // Bricks
        this.bricks = [];
        this.brickRows = 6;
        this.brickCols = 8;
        this.brickW = 42;
        this.brickH = 18;
        this.brickPadding = 4;

        // Score & state
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.gameOver = false;
        this.level = 1;

        // Visuals
        this.particles = [];
        this.trail = [];
        this.brickColors = ['#ff0040', '#ff8000', '#ffd700', '#00ff40', '#00f0ff', '#8000ff'];
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

        this.resetGame();
        this.bindControls();

        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    resetGame() {
        this.paddle.x = this.W / 2 - this.paddle.w / 2;
        this.paddle.y = this.H - 50;
        this.paddle.vx = 0;

        this.resetBall();
        this.generateBricks();

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.particles = [];
        this.trail = [];

        this.updateUI();
    }

    resetBall() {
        this.ball.x = this.W / 2;
        this.ball.y = this.H - 80;
        const angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
        this.ball.vx = Math.cos(angle) * this.ballSpeed;
        this.ball.vy = Math.sin(angle) * this.ballSpeed;
    }

    generateBricks() {
        this.bricks = [];
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brick = {
                    x: col * (this.brickW + this.brickPadding) + 15,
                    y: row * (this.brickH + this.brickPadding) + 50,
                    w: this.brickW,
                    h: this.brickH,
                    hit: false
                };
                this.bricks.push(brick);
            }
        }
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        if (!this.gameOver || this.score < this.brickRows * this.brickCols) {
            this.update();
        }
        this.draw(time);
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // Paddle movement (touch/drag)
        this.paddle.x += this.paddle.vx;
        this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));

        // Ball movement
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Trail
        this.trail.push({ x: this.ball.x, y: this.ball.y, life: 10 });
        if (this.trail.length > 10) this.trail.shift();

        // Wall collision
        if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > this.W) {
            this.ball.vx *= -1;
            neonAudio?.wallHit();
        }
        if (this.ball.y - this.ball.r < 0) {
            this.ball.vy *= -1;
            neonAudio?.wallHit();
        }

        // Paddle collision
        if (this.ball.y + this.ball.r > this.paddle.y &&
            this.ball.y + this.ball.r < this.paddle.y + this.paddle.h &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.w) {
            this.ball.vy = -Math.abs(this.ball.vy);
            const hitPos = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
            this.ball.vx = hitPos * 3;
            neonAudio?.move();
        }

        // Brick collision
        for (let brick of this.bricks) {
            if (!brick.hit) {
                if (this.ball.x > brick.x &&
                    this.ball.x < brick.x + brick.w &&
                    this.ball.y - this.ball.r < brick.y + brick.h &&
                    this.ball.y + this.ball.r > brick.y) {
                    brick.hit = true;
                    this.ball.vy *= -1;
                    this.score += 10;
                    this.createBrickParticles(brick);
                    neonAudio?.reveal();
                    this.updateUI();
                    break;
                }
            }
        }

        // Ball out (lose life)
        if (this.ball.y - this.ball.r > this.H) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver = true;
                neonAudio?.gameOver();
                if (window.hub) window.hub.updateScore(this.id, this.score);
            } else {
                this.resetBall();
            }
        }

        // Level complete
        if (this.bricks.every(b => b.hit)) {
            this.levelUp();
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            return p.life > 0;
        });
    }

    createBrickParticles(brick) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: brick.x + brick.w / 2,
                y: brick.y + brick.h / 2,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 1,
                life: 1,
                color: brick.color || this.brickColors[0]
            });
        }
    }

    levelUp() {
        this.level++;
        this.ballSpeed = Math.min(6, this.ballSpeed + 0.3);
        this.resetBall();
        this.generateBricks();
        neonAudio?.levelUp();
    }

    // ==================== RENDERING ====================
    draw(time) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0a14');
        grad.addColorStop(1, '#050508');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Grid pattern
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, H);
            ctx.stroke();
        }

        // Ball trail
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = i / this.trail.length * 0.3;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.ball.r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Bricks
        let colorIdx = 0;
        for (let brick of this.bricks) {
            if (!brick.hit) {
                brick.color = this.brickColors[colorIdx % this.brickColors.length];
                const row = Math.floor(colorIdx / this.brickCols);
                ctx.fillStyle = brick.color;
                ctx.shadowColor = brick.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
                ctx.shadowBlur = 0;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(brick.x, brick.y, brick.w, brick.h);
            }
            colorIdx++;
        }

        // Paddle
        ctx.fillStyle = '#00ff40';
        ctx.shadowColor = '#00ff40';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
        ctx.shadowBlur = 0;

        // Ball
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1;

        // UI
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE:${this.score}`, 10, 20);
        ctx.fillText(`LIVES:${this.lives}`, 10, 40);

        // Game over
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ff0040';
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00f0ff';
            ctx.font = '16px Orbitron, monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, W / 2, H / 2 + 10);
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px Orbitron, monospace';
            ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 50);
        }
    }

    // ==================== INPUT ====================
    handleInput(action) {
        if (action === 'left') this.paddle.vx = -this.paddleSpeed;
        if (action === 'right') this.paddle.vx = this.paddleSpeed;
        if (action === 'restart') this.resetGame();
    }

    handleInputRelease(action) {
        if (action === 'left' || action === 'right') this.paddle.vx = 0;
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.container || !this.container.isConnected) return;
            if (e.code === 'ArrowLeft') this.paddle.vx = -this.paddleSpeed;
            if (e.code === 'ArrowRight') this.paddle.vx = this.paddleSpeed;
            if (e.code === 'Enter' && this.gameOver) this.resetGame();
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') this.paddle.vx = 0;
        });

        // Touch drag
        let isDragging = false;
        let startX = 0;

        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.gameOver) {
                this.resetGame();
                return;
            }
            isDragging = true;
            startX = e.clientX;
            e.preventDefault();
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            this.paddle.x += dx * 0.5;
            this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));
            startX = e.clientX;
            e.preventDefault();
        });

        this.canvas.addEventListener('pointerup', () => {
            isDragging = false;
        });
    }

    updateUI() {
        if (window.hub) window.hub.updateScore(this.id, this.score);
    }

    destroy() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        if (this.canvas) this.canvas.remove();
    }
}

// Standalone support
if (typeof window !== 'undefined') window.BreakoutGame = BreakoutGame;