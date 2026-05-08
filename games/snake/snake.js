/**
 * SNAKE - Neon Protocol Mobile Edition
 * Classic snake game optimized for portrait mobile
 */

class SnakeGame {
    constructor() {
        this.id = 'snake';
        this.cols = 15;
        this.rows = 20;
        this.cellSize = 22;
        this.snake = [];
        this.direction = { x: 0, y: -1 };
        this.nextDirection = { x: 0, y: -1 };
        this.food = null;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.speed = 150;
        this.lastMove = 0;
        this.gameLoop = null;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
    }

    init(container) {
        this.container = container;

        // Calculate cell size for portrait mobile
        const maxWidth = Math.min(window.innerWidth - 32, 375);
        this.cellSize = Math.floor((maxWidth - 10) / this.cols);
        this.cellSize = Math.max(16, Math.min(28, this.cellSize));

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '320px';
        this.canvas.style.height = 'auto';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        this.resetGame();
        this.bindControls();

        this.lastMove = performance.now();
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    resetGame() {
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX, y: startY + 1 },
            { x: startX, y: startY + 2 }
        ];
        this.direction = { x: 0, y: -1 };
        this.nextDirection = { x: 0, y: -1 };
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.speed = 150;
        this.spawnFood();
        this.updateUI();
    }

    spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.isSnakeAt(pos.x, pos.y));
        this.food = pos;
    }

    isSnakeAt(x, y) {
        return this.snake.some(seg => seg.x === x && seg.y === y);
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        if (this.gameOver) return;

        if (!this.paused && time - this.lastMove > this.speed) {
            this.update();
            this.lastMove = time;
        }

        this.draw();
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        this.direction = { ...this.nextDirection };

        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.endGame();
            return;
        }

        // Self collision
        if (this.isSnakeAt(head.x, head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Check food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.speed = Math.max(60, 150 - Math.floor(this.score / 50) * 10);
            this.spawnFood();
            neonAudio?.reveal();
        } else {
            this.snake.pop();
        }

        this.updateUI();
    }

    endGame() {
        this.gameOver = true;
        neonAudio?.gameOver();
        if (window.hub) {
            window.hub.updateScore(this.id, this.score);
        }
    }

    // ==================== RENDERING ====================
    draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cs, 0);
            ctx.lineTo(x * cs, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cs);
            ctx.lineTo(this.canvas.width, y * cs);
            ctx.stroke();
        }

        // Draw food (neon pink pulse)
        if (this.food) {
            const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 15;
            ctx.fillRect(this.food.x * cs + 2, this.food.y * cs + 2, cs - 4, cs - 4);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        // Draw snake
        this.snake.forEach((seg, i) => {
            const isHead = i === 0;
            const alpha = 1 - (i / this.snake.length) * 0.4;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = isHead ? '#00ff40' : '#00c830';
            ctx.shadowColor = '#00ff40';
            ctx.shadowBlur = isHead ? 12 : 0;

            ctx.fillRect(seg.x * cs + 1, seg.y * cs + 1, cs - 2, cs - 2);

            // Head eyes
            if (isHead) {
                ctx.fillStyle = '#0a0a0f';
                ctx.shadowBlur = 0;
                const ex = cs / 4;
                const ey = cs / 4;
                ctx.fillRect(seg.x * cs + ex, seg.y * cs + ey, 3, 3);
                ctx.fillRect(seg.x * cs + cs - ex - 3, seg.y * cs + ey, 3, 3);
            }
        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Game over overlay
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#ff0040';
            ctx.font = 'bold 22px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 15);
            ctx.font = '14px Orbitron, monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    // ==================== INPUT HANDLING ====================
    handleInput(action) {
        if (this.gameOver) {
            if (action === 'restart') this.resetGame();
            return;
        }

        switch (action) {
            case 'up':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'down':
                if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'left':
                if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'right':
                if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            if (e.key === 'ArrowUp') this.handleInput('up');
            if (e.key === 'ArrowDown') this.handleInput('down');
            if (e.key === 'ArrowLeft') this.handleInput('left');
            if (e.key === 'ArrowRight') this.handleInput('right');
            if (e.key === ' ' || e.key === 'Enter') this.handleInput('restart');
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
if (typeof window !== 'undefined') window.SnakeGame = SnakeGame;
