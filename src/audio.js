// Central audio engine - separate from App components to avoid Fast Refresh issues
const getCtx = () => {
  if (typeof window !== 'undefined') {
    try {
      if (!window.__audioCtx) window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (window.__audioCtx.state === 'suspended') {
        window.__audioCtx.resume().catch(e => console.warn('AudioContext resume failed:', e));
      }
      return window.__audioCtx;
    } catch (e) {
      console.warn('AudioContext creation failed:', e);
      return null;
    }
  }
  return null;
};

const getVol = () => {
  if (typeof localStorage !== 'undefined') {
    const v = localStorage.getItem('phoneVolume');
    if (v !== null) return Number(v) / 100;
  }
  return 0.7;
};

export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const v = getVol();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.025);
  gain.gain.setValueAtTime(0.08 * v, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.025);
}

export function playLock() {
  const ctx = getCtx();
  if (!ctx) return;
  const v = getVol();
  [
    { freq: 1200, endFreq: 600, vol: 0.25, dur: 0.04, type: 'sine' },
    { freq: 100, endFreq: 80, vol: 0.35, dur: 0.08, type: 'triangle' },
  ].forEach(({ freq, endFreq, vol, dur, type }) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol * v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  });
}

export function playDialTone() {
  const ctx = getCtx();
  if (!ctx) return;
  const v = getVol();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 425; // Standard ringback tone frequency
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.15 * v, ctx.currentTime + 0.05); // Fade in
  g.gain.setValueAtTime(0.15 * v, ctx.currentTime + 1.0); // Play for 1 sec
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.05); // Fade out
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime);
  o.stop(ctx.currentTime + 1.1);
}

export function playKeyTone(note = 800) {
  const ctx = getCtx();
  if (!ctx) return;
  const v = getVol();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(note, ctx.currentTime);
  g.gain.setValueAtTime(0.12 * v, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  o.connect(g).connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.15);
}

// ── Text Tones (Mesaj Sesleri) ─────────────────────────────────────────────
export const TEXT_TONES = [
  { id: 'tri-tone', name: 'Tri-tone (Klasik)' },
  { id: 'pop', name: 'Pop' },
  { id: 'chord', name: 'Akor' },
  { id: 'note', name: 'Not' },
];

export function playTextTone(toneId) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const v = getVol();
  
  const playOsc = (freq, type, time, dur, vol = 0.3) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol * v, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(ctx.destination);
    o.start(time); o.stop(time + dur);
  };

  switch (toneId) {
    case 'tri-tone':
      playOsc(880, 'sine', t, 0.2, 0.4);
      playOsc(1108.73, 'sine', t + 0.15, 0.2, 0.4);
      playOsc(1318.51, 'sine', t + 0.3, 0.4, 0.4);
      break;
    case 'pop':
      playOsc(1200, 'sine', t, 0.1, 0.5);
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(400, t+0.05);
      g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.05);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+0.05);
      break;
    case 'chord':
      [523.25, 659.25, 783.99, 1046.50].forEach(f => playOsc(f, 'sine', t, 0.8, 0.15));
      break;
    case 'note':
      playOsc(880, 'triangle', t, 0.3, 0.4);
      break;
    default: // fallback to tri-tone
      playOsc(880, 'sine', t, 0.2, 0.4);
      playOsc(1108.73, 'sine', t + 0.15, 0.2, 0.4);
      playOsc(1318.51, 'sine', t + 0.3, 0.4, 0.4);
  }
}

// ── Ringtones (Zil Sesleri) ─────────────────────────────────────────────────
export const RINGTONES = [
  { id: 'marimba', name: 'Marimba (Klasik)' },
  { id: 'opening', name: 'Açılış (Modern)' },
  { id: 'reflection', name: 'Yansıma' },
  { id: 'digital', name: 'Dijital' },
  { id: 'synth', name: 'Synthwave' },
  { id: 'piano', name: 'Piyano' },
  { id: 'techno', name: 'Tekno' },
  { id: 'alarm', name: 'Klasik Alarm' },
];

let ringingInterval = null;

export function playRingtone(toneId, stop = false) {
  const ctx = getCtx();
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
  if (stop || !ctx) return;
  
  const v = getVol();

  const playOsc = (freq, type, time, dur, vol = 0.3) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol * v, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(ctx.destination);
    o.start(time); o.stop(time + dur);
  };

  const playSequence = () => {
    const t = ctx.currentTime;
    switch (toneId) {
      case 'marimba':
        // Marimba style: A5, C6, A5, E6, C6, A5
        [[880,0],[1046.5,0.15],[880,0.3],[1318.5,0.45],[1046.5,0.6],[880,0.75]].forEach(([f,d]) => {
          playOsc(f, 'sine', t + d, 0.3, 0.4);
        });
        break;
      case 'opening':
        // Modern Opening: E5, G5, C6, B5
        [[659.25,0],[783.99,0.2],[1046.5,0.4],[987.77,0.6]].forEach(([f,d]) => {
          playOsc(f, 'triangle', t + d, 0.5, 0.3);
        });
        break;
      case 'reflection':
        // Soft chime
        [[1318.5,0],[1567.98,0.2],[2093.00,0.4],[1567.98,0.6]].forEach(([f,d]) => {
          playOsc(f, 'sine', t + d, 0.6, 0.2);
        });
        break;
      case 'digital':
        // Electronic beeps
        [[1200,0],[1200,0.1],[1200,0.2],[1600,0.4],[1600,0.5]].forEach(([f,d]) => {
          playOsc(f, 'square', t + d, 0.08, 0.1);
        });
        break;
      case 'synth':
        // Synthwave arpeggio
        [[440,0],[554.37,0.1],[659.25,0.2],[880,0.3],[659.25,0.4],[554.37,0.5]].forEach(([f,d]) => {
          playOsc(f, 'square', t + d, 0.15, 0.2);
        });
        break;
      case 'piano':
        // Slow piano-like chords
        [523.25, 659.25, 783.99].forEach(f => playOsc(f, 'sine', t, 1.5, 0.3));
        [587.33, 698.46, 880].forEach(f => playOsc(f, 'sine', t + 1, 1.5, 0.3));
        break;
      case 'techno':
        // Techno lead
        [[220,0],[220,0.1],[440,0.15],[220,0.3],[660,0.45]].forEach(([f,d]) => {
          playOsc(f, 'sawtooth', t + d, 0.1, 0.15);
        });
        break;
      case 'alarm':
        // Classic alarm
        [[1000,0],[1000,0.2],[1000,0.4],[1000,0.6],[1000,0.8]].forEach(([f,d]) => {
          playOsc(f, 'square', t + d, 0.1, 0.3);
        });
        break;
      default:
        [[880,0],[1046.5,0.15],[880,0.3],[1318.5,0.45],[1046.5,0.6],[880,0.75]].forEach(([f,d]) => {
          playOsc(f, 'sine', t + d, 0.3, 0.4);
        });
    }
  };

  playSequence();
  ringingInterval = setInterval(playSequence, 2000);
}

export function playTada() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const v = getVol();
  
  const playOsc = (freq, type, time, dur, vol) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol * v, time + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g).connect(ctx.destination);
    o.start(time); o.stop(time + dur);
  };
  
  playOsc(523.25, 'triangle', t, 0.15, 0.4);
  playOsc(659.25, 'triangle', t, 0.15, 0.4);
  playOsc(783.99, 'triangle', t, 0.15, 0.4);

  playOsc(1046.50, 'triangle', t + 0.15, 0.6, 0.5);
  playOsc(1318.51, 'triangle', t + 0.15, 0.6, 0.5);
  playOsc(1567.98, 'triangle', t + 0.15, 0.6, 0.5);
}

export function playTick() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const v = getVol();
  
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.05);
  g.gain.setValueAtTime(0.4 * v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + 0.05);
}
