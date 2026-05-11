/**
 * SIMON - Neon Protocol Mobile Edition
 * Classic memory sequence game with neon aesthetics
 */

class SimonGame {
    constructor() {
        this.id = 'simon';
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        // Game state
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameLoop = null;
        
        // Game sequence
        this.sequence = [];
        this.playerSequence = [];
        this.currentStep = 0;
        this.isPlayerTurn = false;
        
        // Colors (neon theme)
        this.colors = {
            red: '#ff0040',
            blue: '#00f0ff',
            green: '#00ff40',
            yellow: '#ffff00',
            dark: '#0a0a0f',
            active: '#ffffff'
        };
        
        // Button positions and sizes
        this.centerX = 200;
        this.centerY = 200;
        this.radius = 150;
        this.buttonRadius = 60;
        
        // Input
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Animation
        this.activeButton = null;
        this.animationTime = 0;
        this.buttonPressDuration = 300;
        
        // Game settings
        this.sequenceLength = 3;
        this.speedIncrease = 0.8;
        this.maxLevel = 15;
    }
    
    init(container) {
        this.container = container;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 500;
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = '400px';
        this.canvas.style.height = 'auto';
        this.canvas.style.backgroundColor = this.colors.dark;
        this.canvas.style.border = '2px solid #00f0ff';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.5)';
        
        container.appendChild(this.canvas);
        
        // Get context
        this.ctx = this.canvas.getContext('2d');
        
        // Load high score
        this.loadHighScore();
        
        // Setup controls
        this.setupControls();
        
        // Start game
        this.startNewGame();
        
        // Play start sound
        if (window.neonAudio) {
            window.neonAudio.play('start');
        }
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('simonHighScore');
        if (saved) {
            this.highScore = parseInt(saved);
        }
    }
    
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('simonHighScore', this.highScore.toString());
        }
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchStartX = touch.clientX - rect.left;
            this.touchStartY = touch.clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameOver || this.paused || !this.isPlayerTurn) return;
            
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            this.handleButtonPress(touchX, touchY);
        });
        
        // Mouse controls for testing
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver || this.paused || !this.isPlayerTurn) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            this.handleButtonPress(clickX, clickY);
        });
    }
    
    handleButtonPress(x, y) {
        const angle = Math.atan2(y - this.centerY, x - this.centerX);
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        
        if (distance <= this.buttonRadius) {
            let buttonIndex;
            let normalizedAngle = angle + Math.PI / 4;
            if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
            
            if (normalizedAngle < Math.PI / 2) {
                buttonIndex = 0; // Red (top)
            } else if (normalizedAngle < Math.PI) {
                buttonIndex = 1; // Blue (right)
            } else if (normalizedAngle < 3 * Math.PI / 2) {
                buttonIndex = 2; // Green (bottom)
            } else {
                buttonIndex = 3; // Yellow (left)
            }
            
            this.pressButton(buttonIndex);
        }
    }
    
    pressButton(buttonIndex) {
        if (!this.isPlayerTurn) return;
        
        // Visual feedback
        this.activeButton = buttonIndex;
        this.animationTime = Date.now();
        
        // Play sound
        if (window.neonAudio) {
            window.neonAudio.play(`simon${buttonIndex}`);
        }
        
        // Add to player sequence
        this.playerSequence.push(buttonIndex);
        
        // Check if correct
        if (this.playerSequence[this.playerSequence.length - 1] !== this.sequence[this.playerSequence.length - 1]) {
            this.gameOver = true;
            this.saveHighScore();
            if (window.neonAudio) {
                window.neonAudio.play('gameOver');
            }
            return;
        }
        
        // Check if sequence complete
        if (this.playerSequence.length === this.sequence.length) {
            // Level complete
            this.score += this.level * 10;
            this.level++;
            
            if (this.level > this.maxLevel) {
                this.gameOver = true;
                this.saveHighScore();
                if (window.neonAudio) {
                    window.neonAudio.play('win');
                }
            } else {
                // Add new step to sequence
                this.sequence.push(Math.floor(Math.random() * 4));
                this.playerSequence = [];
                this.currentStep = 0;
                this.isPlayerTurn = false;
                
                // Play new sequence
                setTimeout(() => {
                    this.playSequence();
                }, 1000);
            }
        }
    }
    
    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.sequence = [];
        this.playerSequence = [];
        this.currentStep = 0;
        this.gameOver = false;
        this.isPlayerTurn = false;
        
        // Create initial sequence
        for (let i = 0; i < this.sequenceLength; i++) {
            this.sequence.push(Math.floor(Math.random() * 4));
        }
        
        // Start game loop
        this.startGame();
        
        // Play initial sequence
        setTimeout(() => {
            this.playSequence();
        }, 1000);
    }
    
    startGame() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    playSequence() {
        this.isPlayerTurn = false;
        this.currentStep = 0;
        
        const playNext = () => {
            if (this.currentStep < this.sequence.length) {
                const buttonIndex = this.sequence[this.currentStep];
                this.activeButton = buttonIndex;
                this.animationTime = Date.now();
                
                // Play sound
                if (window.neonAudio) {
                    window.neonAudio.play(`simon${buttonIndex}`);
                }
                
                this.currentStep++;
                
                setTimeout(() => {
                    this.activeButton = null;
                    setTimeout(() => {
                        playNext();
                    }, 200);
                }, this.buttonPressDuration * (1 / (this.level * this.speedIncrease)));
            } else {
                // Player's turn
                this.isPlayerTurn = true;
                this.playerSequence = [];
            }
        };
        
        playNext();
    }
    
    update() {
        if (this.gameOver || this.paused) {
            this.gameLoop = requestAnimationFrame(() => this.update());
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, 400, 500);
        
        // Draw game board
        this.drawBoard();
        
        // Draw UI
        this.drawUI();
        
        // Continue game loop
        this.gameLoop = requestAnimationFrame(() => this.update());
    }
    
    drawBoard() {
        // Draw four buttons
        const buttons = [
            { color: this.colors.red, angle: 0 },      // Top
            { color: this.colors.blue, angle: Math.PI / 2 },  // Right
            { color: this.colors.green, angle: Math.PI },      // Bottom
            { color: this.colors.yellow, angle: 3 * Math.PI / 2 } // Left
        ];
        
        buttons.forEach((button, index) => {
            const x = this.centerX + Math.cos(button.angle) * this.radius;
            const y = this.centerY + Math.sin(button.angle) * this.radius;
            
            // Draw button
            this.ctx.fillStyle = this.activeButton === index ? this.colors.active : button.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.buttonRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw button border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        });
        
        // Draw center circle
        this.ctx.fillStyle = this.colors.dark;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.buttonRadius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw center text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('SIMON', this.centerX, this.centerY);
        this.ctx.font = '14px Orbitron';
        this.ctx.fillText('MEMORY', this.centerX, this.centerY + 25);
    }
    
    drawUI() {
        // Draw score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 30);
        this.ctx.fillText(`LEVEL: ${this.level}`, 20, 55);
        
        // Draw high score
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`HIGH: ${this.highScore}`, 380, 30);
        
        // Draw status
        this.ctx.textAlign = 'center';
        if (!this.isPlayerTurn && !this.gameOver) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText('WATCH THE SEQUENCE', 200, 470);
        } else if (this.isPlayerTurn) {
            this.ctx.fillStyle = '#00ff40';
            this.ctx.fillText('YOUR TURN', 200, 470);
        }
        
        // Draw game over message
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, 400, 500);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '32px Orbitron';
            this.ctx.fillText('GAME OVER', 200, 200);
            
            this.ctx.font = '20px Orbitron';
            this.ctx.fillText(`FINAL SCORE: ${this.score}`, 200, 250);
            this.ctx.fillText(`LEVEL REACHED: ${this.level}`, 200, 280);
            
            this.ctx.font = '16px Orbitron';
            this.ctx.fillText('Click to restart', 200, 350);
        }
    }
    
    handleInput(action) {
        switch (action) {
            case 'restart':
                if (this.gameOver) {
                    this.startNewGame();
                    if (window.neonAudio) {
                        window.neonAudio.play('start');
                    }
                }
                break;
            case 'pause':
                this.paused = !this.paused;
                break;
        }
    }
    
    destroy() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('click', this.handleClick);
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}