/**
 * TETRIS - Neon Protocol Mobile Edition
 * Complete implementation with full game logic
 */

export default class TetrisGame {
    constructor() {
        this.id = 'tetris';
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK = 28;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.board = [];
        this.player = null;
        this.nextPieceData = null;
        this.gameLoop = null;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        // Piece shapes with standard rotation
        this.SHAPES = {
            'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            'J': [[1,0,0], [1,1,1], [0,0,0]],
            'L': [[0,0,1], [1,1,1], [0,0,0]],
            'O': [[1,1], [1,1]],
            'S': [[0,1,1], [1,1,0], [0,0,0]],
            'T': [[0,1,0], [1,1,1], [0,0,0]],
            'Z': [[1,1,0], [0,1,1], [0,0,0]]
        };
        this.COLORS = {
            'I': '#00f0ff', 'J': '#0060ff', 'L': '#ff8000',
            'O': '#ffff00', 'S': '#00ff40', 'T': '#ff00ff', 'Z': '#ff0040'
        };
    }

    init(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.COLS * this.BLOCK;
        this.canvas.height = this.ROWS * this.BLOCK;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '280px';
        this.canvas.style.height = 'auto';
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);

        this.resetGame();
        this.bindControls();

        // Start game loop
        this.lastTime = 0;
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    resetGame() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.dropCounter = 0;
        this.player = this.createPiece();
        this.nextPieceData = this.createPiece();
        this.updateUI();
    }

    createPiece(type) {
        const types = Object.keys(this.SHAPES);
        const t = type || types[Math.floor(Math.random() * types.length)];
        const shape = this.SHAPES[t];
        return {
            pos: { x: Math.floor(this.COLS / 2) - Math.ceil(shape[0].length / 2), y: 0 },
            matrix: this.cloneMatrix(shape),
            color: this.COLORS[t],
            type: t
        };
    }

    cloneMatrix(m) {
        return m.map(row => [...row]);
    }

    // ==================== ROTATION (Super Rotation System) ====================
    rotateMatrix(matrix, dir = 1) {
        const N = matrix.length;
        const M = matrix[0].length;
        const result = [];
        
        if (dir > 0) {
            // Clockwise
            for (let i = 0; i < M; i++) {
                const row = [];
                for (let j = N - 1; j >= 0; j--) {
                    row.push(matrix[j][i]);
                }
                result.push(row);
            }
        } else {
            // Counter-clockwise
            for (let i = M - 1; i >= 0; i--) {
                const row = [];
                for (let j = 0; j < N; j++) {
                    row.push(matrix[j][i]);
                }
                result.push(row);
            }
        }
        return result;
    }

    // Wall kick: try shifting piece horizontally after rotation
    tryRotate(dir) {
        const originalMatrix = this.cloneMatrix(this.player.matrix);
        const rotated = this.rotateMatrix(this.player.matrix, dir);
        this.player.matrix = rotated;

        // If rotated piece collides, try wall kicks
        if (this.collide(this.player)) {
            const kicks = [-1, 1, -2, 2]; // Try shifting left/right
            for (const kick of kicks) {
                this.player.pos.x += kick;
                if (!this.collide(this.player)) {
                    neonAudio?.rotate();
                    return;
                }
                this.player.pos.x -= kick;
            }
            // Restore original
            this.player.matrix = originalMatrix;
        } else {
            neonAudio?.rotate();
        }
    }

    // ==================== COLLISION DETECTION ====================
    collide(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (piece.matrix[y][x]) {
                    const boardX = piece.pos.x + x;
                    const boardY = piece.pos.y + y;
                    
                    if (boardX < 0 || boardX >= this.COLS || boardY >= this.ROWS) return true;
                    if (boardY >= 0 && this.board[boardY][boardX]) return true;
                }
            }
        }
        return false;
    }

    // ==================== MERGE & CLEAR ====================
    merge() {
        this.player.matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    this.board[this.player.pos.y + y][this.player.pos.x + x] = this.player.color;
                }
            });
        });
        neonAudio?.land();
    }

    clearLines() {
        let linesCleared = 0;
        
        outer: for (let y = this.ROWS - 1; y >= 0; y--) {
            for (let x = 0; x < this.COLS; x++) {
                if (!this.board[y][x]) continue outer;
            }
            
            // Remove line
            this.board.splice(y, 1);
            this.board.unshift(Array(this.COLS).fill(null));
            linesCleared++;
            y++; // Check same row again
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [0, 100, 300, 500, 800][Math.min(linesCleared, 4)] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            neonAudio?.clear(linesCleared);
        }
        return linesCleared;
    }

    // ==================== GAME LOOP ====================
    loop(time) {
        if (this.gameOver) return;

        const delta = time - this.lastTime;
        this.lastTime = time;

        if (!this.paused) {
            this.dropCounter += delta;
            const interval = Math.max(100, 500 - (this.level - 1) * 50);
            
            if (this.dropCounter > interval) {
                this.player.pos.y++;
                if (this.collide(this.player)) {
                    this.player.pos.y--;
                    this.merge();
                    this.clearLines();
                    
                    // Spawn new piece
                    this.player = this.nextPieceData;
                    this.nextPieceData = this.createPiece();
                    
                    if (this.collide(this.player)) {
                        this.gameOver = true;
                        neonAudio?.gameOver();
                        this.updateUI();
                        return;
                    }
                }
                this.dropCounter = 0;
                this.updateUI();
            }
        }

        this.draw();
        this.gameLoop = requestAnimationFrame((t) => this.loop(t));
    }

    // ==================== RENDERING ====================
    draw() {
        // Background
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK, 0);
            this.ctx.lineTo(x * this.BLOCK, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK);
            this.ctx.stroke();
        }
        
        // Draw placed blocks
        this.board.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) this.drawBlock(x, y, color);
            });
        });
        
        // Draw ghost piece
        if (!this.gameOver) {
            const ghost = { ...this.player, pos: { ...this.player.pos } };
            while (!this.collide(ghost)) ghost.pos.y++;
            ghost.pos.y--;
            this.drawPiece(ghost, 0.15);
        }
        
        // Draw current piece
        if (!this.gameOver) this.drawPiece(this.player, 1);
        
        // Draw game over text
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff0040';
            this.ctx.font = 'bold 24px Orbitron, monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '16px Orbitron, monospace';
            this.ctx.fillStyle = '#00f0ff';
            this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    drawBlock(x, y, color, alpha = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.BLOCK + 1, y * this.BLOCK + 1, this.BLOCK - 2, this.BLOCK - 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x * this.BLOCK + 1, y * this.BLOCK + 1, this.BLOCK - 2, this.BLOCK - 2);
        this.ctx.globalAlpha = 1;
    }

    drawPiece(piece, alpha = 1) {
        piece.matrix.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    this.drawBlock(piece.pos.x + x, piece.pos.y + y, piece.color, alpha);
                }
            });
        });
    }

    // ==================== INPUT HANDLING ====================
    handleInput(action) {
        if (this.gameOver || this.paused) return;
        
        switch(action) {
            case 'left':
                this.player.pos.x--;
                if (this.collide(this.player)) this.player.pos.x++;
                else neonAudio?.move();
                break;
            case 'right':
                this.player.pos.x++;
                if (this.collide(this.player)) this.player.pos.x--;
                else neonAudio?.move();
                break;
            case 'rotate':
                this.tryRotate(1);
                break;
            case 'drop':
                this.player.pos.y++;
                if (this.collide(this.player)) {
                    this.player.pos.y--;
                    this.merge();
                    this.clearLines();
                    this.player = this.nextPieceData;
                    this.nextPieceData = this.createPiece();
                    if (this.collide(this.player)) {
                        this.gameOver = true;
                        neonAudio?.gameOver();
                        this.updateUI();
                        return;
                    }
                }
                neonAudio?.drop();
                this.dropCounter = 0;
                this.updateUI();
                break;
            case 'hardDrop':
                while (!this.collide(this.player)) this.player.pos.y++;
                this.player.pos.y--;
                neonAudio?.hardDrop();
                break;
        }
    }

    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            if (e.key === 'ArrowLeft') this.handleInput('left');
            if (e.key === 'ArrowRight') this.handleInput('right');
            if (e.key === 'ArrowUp') this.handleInput('rotate');
            if (e.key === 'ArrowDown') this.handleInput('drop');
            if (e.key === ' ') this.handleInput('hardDrop');
        });
    }

    // ==================== UI UPDATES ====================
    updateUI() {
        if (window.hub) {
            window.hub.updateScore(this.id, this.score);
        }
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }

    // ==================== CLEANUP ====================
    destroy() {
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        if (this.canvas) this.canvas.remove();
    }
}

// Standalone support
if (typeof window !== 'undefined') window.TetrisGame = TetrisGame;
