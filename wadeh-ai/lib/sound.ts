// wadehAI audio engine — synthesized with WebAudio, so it costs nothing,
// loads nothing, and works offline. Every sound has an on-screen text
// counterpart elsewhere in the UI (deaf-friendly by construction).

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", peak = 0.16) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(peak, c.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export type Sfx = "correct" | "wrong" | "fanfare" | "click" | "hit";

/** Play a UI sound. Call with the user's sound setting; it no-ops when off. */
export function playSfx(kind: Sfx, enabled: boolean) {
  if (!enabled) return;
  switch (kind) {
    case "correct":
      tone(659.25, 0, 0.12, "sine");
      tone(880, 0.09, 0.18, "sine");
      break;
    case "wrong":
      tone(196, 0, 0.22, "triangle", 0.12);
      break;
    case "click":
      tone(1150, 0, 0.045, "sine", 0.06);
      break;
    case "hit":
      tone(523.25, 0, 0.1, "triangle");
      tone(783.99, 0.08, 0.16, "triangle");
      break;
    case "fanfare":
      tone(523.25, 0, 0.16, "sine");
      tone(659.25, 0.12, 0.16, "sine");
      tone(783.99, 0.24, 0.16, "sine");
      tone(1046.5, 0.36, 0.42, "sine", 0.2);
      break;
  }
}

// ------------------------------------------------------------- Focus music
// A quiet generative loop: a warm drone plus a slow pentatonic oud-like
// pluck. Generated live — no files, no royalties, no network.

let musicNodes: { stop: () => void } | null = null;

const SCALE = [220, 246.94, 293.66, 329.63, 392, 440]; // A minor pentatonic-ish

export function isMusicPlaying(): boolean {
  return musicNodes !== null;
}

export function toggleFocusMusic(on: boolean) {
  if (!on) {
    musicNodes?.stop();
    musicNodes = null;
    return;
  }
  if (musicNodes) return;
  const c = ac();
  if (!c) return;

  const master = c.createGain();
  master.gain.value = 0.05;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.connect(master).connect(c.destination);

  // The drone: two softly detuned sines an octave apart.
  const d1 = c.createOscillator();
  d1.frequency.value = 110;
  const d2 = c.createOscillator();
  d2.frequency.value = 220.6;
  const dGain = c.createGain();
  dGain.gain.value = 0.5;
  d1.connect(dGain);
  d2.connect(dGain);
  dGain.connect(filter);
  d1.start();
  d2.start();

  // A slow breathing LFO on the filter.
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 320;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // Gentle plucks every few seconds.
  let step = 0;
  const pluck = () => {
    const f = SCALE[step % SCALE.length];
    step += Math.floor(1 + (step % 3));
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.2);
    osc.connect(g).connect(filter);
    osc.start();
    osc.stop(c.currentTime + 2.4);
  };
  const interval = setInterval(pluck, 3600);
  pluck();

  musicNodes = {
    stop: () => {
      clearInterval(interval);
      [d1, d2, lfo].forEach((o) => {
        try {
          o.stop();
        } catch {
          // already stopped
        }
      });
      master.disconnect();
    },
  };
}
