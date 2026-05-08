/**
 * MINESWEEPER - Neon Protocol Mobile Edition
 * Complete implementation for GameHub framework
 */

class MinesweeperGame {
    constructor() {
        this.id = 'minesweeper';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.won = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerId = null;
        this.flaggedCount = 0;
        this.revealedCount = 0;
        this.container = null;
        this.cellSize = 22;
        this.rows = 16;
        this.cols = 16;
        this.totalMines = 40;
        this.diff = 'medium';
    }

    init(container) {
        this.container = container;
        // Calculate cell size to fit screen
        const maxWidth = Math.min(window.innerWidth - 32, 375);
        this.cellSize = Math.floor((maxWidth - 10) / this.cols);
        this.cellSize = Math.max(20, Math.min(36, this.cellSize));
        this.setDifficulty('medium');
        this.resetGame();
    }

    setDifficulty(diff) {
        const configs = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        const config = configs[diff] || configs.medium;
        this.rows = config.rows;
        this.cols = config.cols;
        this.totalMines = config.mines;
        this.diff = diff;
    }

    resetGame() {
        this.board = this.createMatrix(this.cols, this.rows, 0);
        this.revealed = this.createMatrix(this.cols, this.rows, false);
        this.flagged = this.createMatrix(this.cols, this.rows, false);
        this.gameOver = false;
        this.won = false;
        this.firstClick = true;
        this.timer = 0;
        this.flaggedCount = 0;
        this.revealedCount = 0;
        this.stopTimer();
        this.renderBoard();
        this.updateUI();
    }

    createMatrix(w, h, val) {
        return Array(h).fill(null).map(() => Array(w).fill(val));
    }

    // ==================== MINE PLACEMENT ====================
    placeMines(safeR, safeC) {
        let placed = 0;
        
        while (placed < this.totalMines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            if (this.board[r][c] === -1) continue;
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            
            this.board[r][c] = -1;
            placed++;
        }

        // Calculate neighbor counts
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) {
                            count++;
                        }
                    }
                }
                this.board[r][c] = count;
            }
        }
    }

    // ==================== REVEAL LOGIC ====================
    reveal(r, c) {
        if (this.gameOver || this.revealed[r][c] || this.flagged[r][c]) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(r, c);
            this.startTimer();
        }

        this.revealCell(r, c);
        
        if (this.board[r][c] === -1) {
            this.endGame(false);
            neonAudio?.boom();
            return;
        }
        
        if (this.board[r][c] === 0) {
            this.floodFill(r, c);
            neonAudio?.reveal();
        } else {
            neonAudio?.reveal();
        }
        
        this.updateUI();
        this.checkWin();
    }

    revealCell(r, c) {
        if (this.revealed[r][c] || this.flagged[r][c]) return;
        this.revealed[r][c] = true;
        this.revealedCount++;
    }

    floodFill(r, c) {
        const queue = [[r, c]];
        const visited = new Set([`${r},${c}`]);
        
        while (queue.length > 0) {
            const [cr, cc] = queue.shift();
            
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = cr + dr, nc = cc + dc;
                    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                    if (this.revealed[nr][nc] || this.flagged[nr][nc]) continue;
                    if (visited.has(`${nr},${nc}`)) continue;
                    
                    visited.add(`${nr},${nc}`);
                    this.revealCell(nr, nc);
                    
                    if (this.board[nr][nc] === 0) {
                        queue.push([nr, nc]);
                    }
                }
            }
        }
    }

    // ==================== FLAG LOGIC ====================
    toggleFlag(r, c) {
        if (this.gameOver || this.revealed[r][c]) return;
        
        if (this.flagged[r][c]) {
            this.flagged[r][c] = false;
            this.flaggedCount--;
            neonAudio?.unflag();
        } else {
            if (this.flaggedCount >= this.totalMines) return;
            this.flagged[r][c] = true;
            this.flaggedCount++;
            neonAudio?.flag();
        }
        this.updateUI();
    }

    // ==================== CHORD CLICK ====================
    chordClick(r, c) {
        if (this.gameOver || !this.revealed[r][c] || this.board[r][c] <= 0) return;
        
        let flagCount = 0;
        const hidden = [];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                if (this.flagged[nr][nc]) flagCount++;
                else if (!this.revealed[nr][nc]) hidden.push([nr, nc]);
            }
        }
        
        if (flagCount === this.board[r][c]) {
            hidden.forEach(([nr, nc]) => this.reveal(nr, nc));
        }
    }

    // ==================== WIN/LOSE ====================
    checkWin() {
        const totalCells = this.rows * this.cols;
        const nonMineCells = totalCells - this.totalMines;
        
        if (this.revealedCount >= nonMineCells) {
            this.endGame(true);
            neonAudio?.win();
        }
    }

    endGame(win) {
        this.gameOver = true;
        this.won = win;
        this.stopTimer();
        this.updateUI();
        
        if (win) {
            if (window.hub) window.hub.updateScore(this.id, this.timer * 100);
        }
    }

    // ==================== TIMER ====================
    startTimer() {
        this.timerId = setInterval(() => {
            this.timer++;
            this.updateUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    // ==================== DOM RENDERING ====================
    renderBoard() {
        this.container.innerHTML = '';
        
        const boardEl = document.createElement('div');
        boardEl.style.display = 'grid';
        boardEl.style.gap = '2px';
        boardEl.style.gridTemplateColumns = `repeat(${this.cols}, ${this.cellSize}px)`;
        boardEl.style.background = 'rgba(0, 240, 255, 0.1)';
        boardEl.style.padding = '4px';
        boardEl.style.borderRadius = '4px';
        boardEl.style.border = '1px solid rgba(0, 240, 255, 0.2)';
        boardEl.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.1)';
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                cell.style.cssText = `
                    width: ${this.cellSize}px;
                    height: ${this.cellSize}px;
                    background: rgba(0, 240, 255, 0.05);
                    border: 1px solid rgba(0, 240, 255, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    border-radius: 2px;
                    font-family: 'Orbitron', monospace;
                    color: #fff;
                `;
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                // Events
                cell.addEventListener('click', () => this.reveal(r, c));
                cell.addEventListener('contextmenu', (e) => { e.preventDefault(); this.toggleFlag(r, c); });
                
                boardEl.appendChild(cell);
            }
        }
        
        this.container.appendChild(boardEl);
    }

    // ==================== UI UPDATES ====================
    updateUI() {
        const cells = this.container.querySelectorAll('.ms-cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);
            
            if (this.revealed[r][c]) {
                cell.style.background = 'rgba(0, 0, 0, 0.5)';
                cell.style.borderColor = 'rgba(0, 240, 255, 0.1)';
                cell.style.cursor = 'default';
                
                if (this.board[r][c] === -1) {
                    cell.style.background = '#ff0040';
                    cell.innerHTML = '💣';
                } else if (this.board[r][c] > 0) {
                    cell.textContent = this.board[r][c];
                    const colors = {
                        1: '#00f0ff', 2: '#00ff40', 3: '#ff0040', 4: '#0080ff',
                        5: '#ff8000', 6: '#ff0080', 7: '#80ff00', 8: '#8000ff'
                    };
                    cell.style.color = colors[this.board[r][c]] || '#fff';
                    cell.style.textShadow = `0 0 8px ${colors[this.board[r][c]] || '#fff'}`;
                }
            } else if (this.flagged[r][c]) {
                cell.style.background = 'rgba(255, 0, 255, 0.2)';
                cell.style.borderColor = '#ff00ff';
                cell.innerHTML = '🚩';
            }
            
            if (this.gameOver) {
                cell.style.cursor = 'default';
            }
        });
        
        // Update HUD
        if (window.hub) {
            window.hub.updateScore(this.id, this.timer * 100);
        }
    }

    // ==================== INPUT HANDLING ====================
    handleInput(action) {
        switch(action) {
            case 'restart':
                this.resetGame();
                break;
        }
    }

    // ==================== CLEANUP ====================
    destroy() {
        this.stopTimer();
        this.container.innerHTML = '';
    }
}

// Standalone support
if (typeof window !== 'undefined') window.MinesweeperGame = MinesweeperGame;
