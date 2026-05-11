/**
 * PONG - Neon Protocol Mobile Edition
 * Classic two-player paddle battle
 */

class PongGame {
    constructor() {
        this.id = 'pong';
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        this.gameLoop = null;

        // Dimensions
        this.W = 375;
        this.H = 520;

        // Paddles
        this.p1 = { x: 10, y: 220, w: 8, h: 80, vy: 0, score: 0 };
        this.p2 = { x: 357, y: 220, w: 8, h: 80, vy: 0, score: 0 };
        this.paddleSpeed = 5;

        // Ball
        this.ball = { x: 187, y: 260, vx: 0, vy: 0, r: 6 };
        this.ballSpeed = 4;

        // State
        this.gameOver = false;
        this.winner = null;

        // AI for single player
        this.aiMode = true;
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
        this.p1.y = this.H / 2 - this.p1.h / 2;
        this.p2.y = this.H / 2 - this.p2.h / 2;
        this.p1.score = 0;
        this.p2.score = 0;
        this.gameOver = false;
        this.winner = null;

        // Random initial direction
        const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;
        this.ball.x = this.W / 2;
        this.ball.y = this.H / 2;
        this.ball.vx = Math.cos(angle) * this.ballSpeed;
        this.ball.vy = Math.sin(angle) * this.ballSpeed;

        neonAudio?.move();
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        this.update();
        this.draw(time);
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        // Paddle movement
        this.p1.y += this.p1.vy;
        this.p2.y += this.p2.vy;

        // Clamp paddles
        this.p1.y = Math.max(0, Math.min(this.H - this.p1.h, this.p1.y));
        this.p2.y = Math.max(0, Math.min(this.H - this.p2.h, this.p2.y));

        // Simple AI for player 2
        if (this.aiMode && !this.gameOver) {
            const target = this.ball.y - this.p2.h / 2 - 10;
            if (this.p2.y < target) this.p2.vy = this.paddleSpeed;
            else if (this.p2.y > target) this.p2.vy = -this.paddleSpeed;
            else this.p2.vy = 0;
        }

        // Ball movement
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Wall collision (top/bottom)
        if (this.ball.y - this.ball.r < 0 || this.ball.y + this.ball.r > this.H) {
            this.ball.vy *= -1;
            neonAudio?.move();
        }

        // Paddle collision
        if (this.ball.vx < 0 &&
            this.ball.x - this.ball.r < this.p1.x + this.p1.w &&
            this.ball.y > this.p1.y &&
            this.ball.y < this.p1.y + this.p1.h) {
            this.ball.vx *= -1;
            this.ball.x = this.p1.x + this.p1.w + this.ball.r;
            neonAudio?.move();
        }

        if (this.ball.vx > 0 &&
            this.ball.x + this.ball.r > this.p2.x &&
            this.ball.y > this.p2.y &&
            this.ball.y < this.p2.y + this.p2.h) {
            this.ball.vx *= -1;
            this.ball.x = this.p2.x - this.ball.r;
            neonAudio?.move();
        }

        // Score
        if (this.ball.x < 0) {
            this.p2.score++;
            this.resetBall(2);
        } else if (this.ball.x > this.W) {
            this.p1.score++;
            this.resetBall(1);
        }

        // Win condition
        if (this.p1.score >= 10 || this.p2.score >= 10) {
            this.gameOver = true;
            this.winner = this.p1.score >= 10 ? 'YOU WIN' : 'YOU LOSE';
            neonAudio?.gameOver();
            if (window.hub) {
                window.hub.updateScore(this.id, this.p1.score);
            }
        }
    }

    resetBall(scorer) {
        this.ball.x = this.W / 2;
        this.ball.y = this.H / 2;
        const angle = scorer === 1 ? Math.PI / 4 : -Math.PI / 4;
        this.ball.vx = Math.cos(angle) * this.ballSpeed;
        this.ball.vy = Math.sin(angle) * this.ballSpeed;
    }

    // ==================== RENDERING ====================
    draw(time) {
        const ctx = this.ctx;
        const W = this.W;
        const H = this.H;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);

        // Center line
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#00ff40';
        ctx.shadowColor = '#00ff40';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.p1.x, this.p1.y, this.p1.w, this.p1.h);
        ctx.fillStyle = '#ff0040';
        ctx.shadowColor = '#ff0040';
        ctx.fillRect(this.p2.x, this.p2.y, this.p2.w, this.p2.h);
        ctx.shadowBlur = 0;

        // Ball
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Scores
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.p1.score, W / 4, 40);
        ctx.fillText(this.p2.score, W * 3 / 4, 40);

        // Game over
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 24px Orbitron, monospace';
            ctx.fillText(this.winner, W / 2, H / 2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00f0ff';
            ctx.font = '14px Orbitron, monospace';
            ctx.fillText('TAP TO RESTART', W / 2, H / 2 + 40);
        }
    }

    // ==================== INPUT ====================
    handleInput(action) {
        if (action === 'up') this.p1.vy = -this.paddleSpeed;
        if (action === 'down') this.p1.vy = this.paddleSpeed;
        if (action === 'restart' && this.gameOver) this.resetGame();
    }

    handleInputRelease(action) {
        if (action === 'up' || action === 'down') this.p1.vy = 0;
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.container || !this.container.isConnected) return;
            if (e.code === 'ArrowUp') this.p1.vy = -this.paddleSpeed;
            if (e.code === 'ArrowDown') this.p1.vy = this.paddleSpeed;
            if (e.code === 'Enter' && this.gameOver) this.resetGame();
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'ArrowDown') this.p1.vy = 0;
        });

        // Touch (bottom half = down, top half = up)
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.gameOver) {
                this.resetGame();
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (y > this.H / 2) this.p1.vy = this.paddleSpeed;
            else this.p1.vy = -this.paddleSpeed;
        });

        this.canvas.addEventListener('pointerup', () => {
            this.p1.vy = 0;
        });
    }

    updateUI() {
        if (window.hub) window.hub.updateScore(this.id, this.p1.score);
    }

    destroy() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        if (this.canvas) this.canvas.remove();
    }
}

// Standalone support
if (typeof window !== 'undefined') window.PongGame = PongGame;