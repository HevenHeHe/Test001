/**
 * NEON PROTOCOL - Audio Engine
 * Shared Web Audio API system for all games
 */

class NeonAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized || this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(freq, duration, type = 'square', vol = 0.3) {
        if (!this.ctx || !this.enabled) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    // Preset sounds
    move() { this.play(200, 0.05, 'square', 0.2); }
    rotate() { this.play(400, 0.08, 'square', 0.2); }
    drop() { this.play(150, 0.1, 'sawtooth', 0.3); }
    clear(rows) {
        const base = rows >= 4 ? 880 : rows >= 3 ? 660 : 440;
        for (let i = 0; i < Math.min(rows, 4); i++) {
            setTimeout(() => this.play(base + i * 110, 0.15, 'square', 0.4), i * 80);
        }
    }
    hardDrop() {
        this.play(100, 0.15, 'sawtooth', 0.5);
        this.play(200, 0.1, 'square', 0.3);
    }
    gameOver() {
        [880, 660, 440, 220].forEach((f, i) => {
            setTimeout(() => this.play(f, 0.4, 'sawtooth', 0.4), i * 150);
        });
    }
    land() { this.play(120, 0.05, 'triangle', 0.2); }
    win() {
        [880, 1100, 1320].forEach((f, i) => {
            setTimeout(() => this.play(f, 0.3, 'sine', 0.4), i * 150);
        });
    }
    boom() {
        this.play(80, 0.3, 'sawtooth', 0.8);
        setTimeout(() => this.play(40, 0.4, 'sawtooth', 0.6), 50);
    }
    reveal() { this.play(440, 0.05, 'sine', 0.3); }
    flag() { this.play(600, 0.08, 'square', 0.25); }
    unflag() { this.play(350, 0.08, 'square', 0.2); }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global instance
window.neonAudio = new NeonAudio();
