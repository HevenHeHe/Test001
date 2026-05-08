/**
 * GAME HUB - Main Application Controller
 * Manages game loading, view switching, and shared state
 */

class GameHub {
    constructor() {
        this.currentGame = null;
        this.games = {};
        this.scores = JSON.parse(localStorage.getItem('neonScores') || '{}');
        this.settings = JSON.parse(localStorage.getItem('neonSettings') || '{"sound":true,"vibration":true}');
        this.init();
    }

    init() {
        this.renderLobby();
        this.bindEvents();
        
        // Initialize audio on first interaction
        document.addEventListener('click', () => {
            neonAudio.init();
        }, { once: true });
    }

    // ==================== LOBBY ====================
    renderLobby() {
        const grid = document.getElementById('games-grid');
        grid.innerHTML = GAMES_MANIFEST.map(game => `
            <div class="game-card" data-id="${game.id}" onclick="hub.launchGame('${game.id}')">
                <div class="game-icon" style="background: ${game.color}">
                    <span class="game-emoji">${game.icon}</span>
                </div>
                <div class="game-card-info">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <span class="highscore-small">🏆 ${this.getHighScore(game.id)}</span>
                </div>
            </div>
        `).join('');
    }

    // ==================== GAME LAUNCHING ====================
    async launchGame(gameId) {
        const manifest = GAMES_MANIFEST.find(g => g.id === gameId);
        if (!manifest) return;

        this.showLoading(true);

        try {
            // Load game script dynamically (works with file:// and http://)
            if (!window[manifest.className]) {
                await this.loadScript(manifest.path);
            }
            
            this.currentGame = new window[manifest.className]();
            
            // Setup game view
            document.getElementById('game-title').textContent = manifest.name;
            document.getElementById('game-highscore').textContent = `🏆 ${this.getHighScore(gameId)}`;
            
            // Initialize game in container
            const container = document.getElementById('game-container');
            container.innerHTML = '';
            this.currentGame.init(container);
            
            // Setup touch controls
            this.setupTouchControls(manifest.id);
            
            // Switch view
            this.switchView('game-view');
            
        } catch (err) {
            console.error('Failed to load game:', err);
            alert('游戏加载失败: ' + err.message);
        } finally {
            this.showLoading(false);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loading
            const existing = document.querySelector(`script[data-game="${src}"]`);
            if (existing) {
                existing.addEventListener('load', resolve);
                existing.addEventListener('error', reject);
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.dataset.game = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`加载失败: ${src}`));
            document.head.appendChild(script);
        });
    }

    // ==================== VIEW MANAGEMENT ====================
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    }

    exitGame() {
        if (this.currentGame) {
            this.currentGame.destroy?.();
            this.currentGame = null;
        }
        document.getElementById('game-container').innerHTML = '';
        document.getElementById('game-controls').innerHTML = '';
        this.switchView('lobby');
    }

    showLoading(show) {
        document.getElementById('load-screen').style.display = show ? 'flex' : 'none';
    }

    // ==================== SCORE MANAGEMENT ====================
    getHighScore(gameId) {
        return this.scores[gameId] || 0;
    }

    updateScore(gameId, score) {
        if (score > (this.scores[gameId] || 0)) {
            this.scores[gameId] = score;
            localStorage.setItem('neonScores', JSON.stringify(this.scores));
            this.updateHighScoreUI(gameId, score);
        }
    }

    updateHighScoreUI(gameId, score) {
        // Update game view if active
        const highScoreEl = document.getElementById('game-highscore');
        if (highScoreEl && this.currentGame?.id === gameId) {
            highScoreEl.textContent = `🏆 ${score}`;
        }
        // Update lobby card
        const card = document.querySelector(`[data-id="${gameId}"] .highscore-small`);
        if (card) card.textContent = `🏆 ${score}`;
    }

    // ==================== TOUCH CONTROLS ====================
    setupTouchControls(gameId) {
        const container = document.getElementById('game-controls');
        if (gameId === 'tetris') {
            container.innerHTML = `
                <div class="touch-controls tetris">
                    <button class="touch-btn" data-action="left">←</button>
                    <div class="touch-center">
                        <button class="touch-btn rotate" data-action="rotate">↻</button>
                        <button class="touch-btn drop" data-action="drop">▼</button>
                    </div>
                    <button class="touch-btn" data-action="right">→</button>
                </div>
            `;
        } else if (gameId === 'minesweeper') {
            container.innerHTML = `
                <div class="touch-controls minesweeper">
                    <button class="touch-btn mode-toggle" data-action="toggle-mode">
                        <span class="mode-icon flag">🚩</span>
                        <span class="mode-icon dig hidden">⛏️</span>
                    </button>
                    <span class="mode-label">长按格子标记/揭开</span>
                </div>
            `;
        } else if (gameId === 'snake') {
            container.innerHTML = `
                <div class="touch-controls snake">
                    <div class="dpad">
                        <button class="touch-btn" data-action="up">▲</button>
                        <div class="dpad-mid">
                            <button class="touch-btn" data-action="left">◀</button>
                            <button class="touch-btn" data-action="right">▶</button>
                        </div>
                        <button class="touch-btn" data-action="down">▼</button>
                    </div>
                </div>
            `;
        }
        
        // Bind touch events
        container.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.currentGame?.handleInput?.(btn.dataset.action);
            });
            btn.addEventListener('mousedown', (e) => {
                this.currentGame?.handleInput?.(btn.dataset.action);
            });
        });
    }

    // ==================== EVENT BINDING ====================
    bindEvents() {
        document.getElementById('btn-back').addEventListener('click', () => {
            this.exitGame();
        });
        
        // Handle back button on mobile
        window.addEventListener('popstate', () => {
            if (this.currentGame) {
                this.exitGame();
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.hub = new GameHub();
    neonAudio.init();
});
