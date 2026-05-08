/**
 * NEON PROTOCOL - Framework Utilities
 * Helper functions shared across all games
 */

// ==================== CONSTANTS ====================
const CONSTANTS = {
    // Canvas sizing for portrait mobile
    CANVAS: {
        WIDTH: 375,   // Standard iPhone width
        HEIGHT: 600,  // ~2/3 of screen height for game area
        SCALE: 1
    },
    // Colors
    COLOR: {
        BG: '#0a0a0f',
        NEON_CYAN: '#00f0ff',
        NEON_PINK: '#ff00ff',
        NEON_BLUE: '#0060ff'
    },
    // Timing
    FPS: 60,
    MS_PER_FRAME: 1000 / 60
};

// ==================== DEVICE DETECTION ====================
const Device = {
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    isPortrait() {
        return window.innerHeight > window.innerWidth;
    },
    getScale() {
        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        return minDimension < 400 ? minDimension / 375 : 1;
    }
};

// ==================== CANVAS UTILITIES ====================
class GameCanvas {
    constructor(container, width = 375, height = 600) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.scale = Device.getScale();
        
        this.canvas.width = width * this.scale;
        this.canvas.height = height * this.scale;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.scale(this.scale, this.scale);
        
        container.appendChild(this.canvas);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    destroy() {
        this.canvas.remove();
    }
}

// ==================== INPUT MANAGER ====================
class InputManager {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.isTouch = Device.isMobile();
        this.handlers = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.longPressTimer = null;
        
        if (this.isTouch) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        } else {
            this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        }
        
        this.options = {
            swipeThreshold: 30,
            longPressDuration: 500,
            ...options
        };
    }

    on(event, handler) {
        this.handlers[event] = handler;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        
        this.longPressTimer = setTimeout(() => {
            this.trigger('longPress', { x: touch.clientX, y: touch.clientY });
        }, this.options.longPressDuration);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        const touch = e.changedTouches[0];
        const dx = touch.clientX - this.touchStartX;
        const dy = touch.clientY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.options.swipeThreshold) {
            if (duration < this.options.longPressDuration) {
                this.trigger('tap', { x: touch.clientX, y: touch.clientY });
            }
        } else {
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (absDx > absDy) {
                this.trigger(dx > 0 ? 'swipeRight' : 'swipeLeft');
            } else {
                this.trigger(dy > 0 ? 'swipeDown' : 'swipeUp');
            }
        }
    }

    handleKeyDown(e) {
        this.trigger('key', { key: e.key });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.trigger('tap', {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }

    trigger(event, data) {
        if (this.handlers[event]) {
            this.handlers[event](data);
        }
    }

    destroy() {
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('keydown', this.handleKeyDown);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    }
}

// ==================== GAME LOOP ====================
class GameLoop {
    constructor(updateFn, drawFn, fps = 60) {
        this.update = updateFn;
        this.draw = drawFn;
        this.fps = fps;
        this.interval = 1000 / fps;
        this.lastTime = 0;
        this.accumulator = 0;
        this.running = false;
        this.id = null;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    loop(time) {
        if (!this.running) return;
        
        const delta = time - this.lastTime;
        this.lastTime = time;
        this.accumulator += delta;
        
        while (this.accumulator >= this.interval) {
            this.update(this.interval);
            this.accumulator -= this.interval;
        }
        
        this.draw(delta / 1000);
        this.id = requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
        if (this.id) cancelAnimationFrame(this.id);
    }

    pause() { this.running = false; }
    resume() { 
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    }
}

// ==================== QUICK LOCALSTORAGE ====================
const Storage = {
    set(key, value) {
        try { localStorage.setItem(`neon_${key}`, JSON.stringify(value)); } catch(e) {}
    },
    get(key, defaultValue = null) {
        try { return JSON.parse(localStorage.getItem(`neon_${key}`)) ?? defaultValue; } catch(e) { return defaultValue; }
    }
};

// ==================== EXPORT ====================
if (typeof module !== 'undefined') {
    module.exports = { GameCanvas, InputManager, GameLoop, Device, Storage, CONSTANTS };
}

// Browser global exposure
if (typeof window !== 'undefined') {
    window.GameCanvas = GameCanvas;
    window.InputManager = InputManager;
    window.GameLoop = GameLoop;
    window.Device = Device;
    window.Storage = Storage;
    window.CONSTANTS = CONSTANTS;
}
