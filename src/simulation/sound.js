class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.ambientGain = null;
    this.sirenNode = null;
    this.sirenTimer = null;
    this.hornCooldown = 0;
    this.enabled = false;
    this.volume = 0.6;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
  }

  setEnabled(on) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.enabled = on;
    if (on) {
      this.startAmbient();
      // Immediate confirmation beep so user knows sound works
      this.beep(660, 0.12, 0.25);
    } else {
      this.stopAmbient();
      this.stopSiren();
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) {
      this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  // ---------- Ambient engine rumble (louder) ----------
  startAmbient() {
    if (this.ambient) return;
    const ctx = this.ctx;

    // Noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    filter.Q.value = 0.8;

    // Low rumble tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.25;

    // Second harmonic for body
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 90;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.08;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    noise.connect(filter).connect(gain);
    osc.connect(oscGain).connect(gain);
    osc2.connect(osc2Gain).connect(gain);
    gain.connect(this.master);

    noise.start();
    osc.start();
    osc2.start();

    // Fade in faster, louder
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.8);

    this.ambient = { noise, osc, osc2, gain };
    this.ambientGain = gain;
  }

  stopAmbient() {
    if (!this.ambient) return;
    const { noise, osc, osc2, gain } = this.ambient;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    setTimeout(() => {
      try { noise.stop(); osc.stop(); osc2.stop(); } catch {}
    }, 500);
    this.ambient = null;
  }

  updateTrafficIntensity(count) {
    if (!this.ambient || !this.enabled) return;
    // 0.15 base to 0.45 max — clearly audible
    const target = Math.min(0.45, 0.15 + (count / 30) * 0.30);
    this.ambientGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
  }

  // ---------- Short beeps ----------
  beep(freq = 800, duration = 0.12, vol = 0.25) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  signalChangeBeep() {
    this.beep(880, 0.15, 0.22);
    setTimeout(() => this.beep(1200, 0.10, 0.18), 60);
  }

  uiClick() { this.beep(1300, 0.05, 0.15); }

  // ---------- Car horn — frequent, varied, punchy ----------
  horn() {
    if (!this.enabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.hornCooldown < 700) return;
    this.hornCooldown = now;

    const t = this.ctx.currentTime;
    const baseFreq = 380 + Math.random() * 120;

    // Two oscillators for a richer horn tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = baseFreq;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = baseFreq * 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.20, t + 0.015);
    gain.gain.setValueAtTime(0.20, t + 0.18);
    gain.gain.linearRampToValueAtTime(0, t + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 550;
    filter.Q.value = 4;

    const mixGain = this.ctx.createGain();
    mixGain.gain.value = 0.5;

    osc1.connect(mixGain);
    osc2.connect(mixGain);
    mixGain.connect(filter).connect(gain).connect(this.master);

    osc1.start(t); osc2.start(t);
    osc1.stop(t + 0.3); osc2.stop(t + 0.3);
  }

  // ---------- Stop thud ----------
  stopThud() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // ---------- Emergency siren ----------
  startSiren() {
    if (!this.enabled || !this.ctx || this.sirenNode) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start();
    this.sirenTimer = setInterval(() => {
      if (!this.sirenNode) return;
      const t = ctx.currentTime;
      const f = osc.frequency.value;
      osc.frequency.linearRampToValueAtTime(f < 900 ? 1000 : 700, t + 0.55);
    }, 600);
    this.sirenNode = { osc, gain };
  }

  stopSiren() {
    if (!this.sirenNode) return;
    const { osc, gain } = this.sirenNode;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    setTimeout(() => { try { osc.stop(); } catch {} }, 500);
    if (this.sirenTimer) { clearInterval(this.sirenTimer); this.sirenTimer = null; }
    this.sirenNode = null;
  }
}

export const sound = new SoundEngine();