const STORAGE_KEY = 'njd-siren';
const WAVE_FORMS = ['sine', 'triangle', 'square', 'sawtooth'];
// Extra LFO shapes, built as periodic waves: falling ramp and random steps (sample & hold).
const LFO_SHAPES = [...WAVE_FORMS, 'ramp', 'random'];
const RANDOM_STEPS = 8;
// The normalized tank comes out about 7 dB under the dry siren; this brings 50 % mix close to balanced.
const SPRING_MAKEUP = 1.8;
const KICK_LEVEL = 20;
const SMOOTHING = 0.02;
const ATTACK = 0.005;
const RELEASE = 0.01;
const CLIP_LEVEL = 0.98;
const CLIP_HOLD = 750;

const presets = [
  {
    name: 'P1',
    values: {
      siren: { waveForm: 'sine', carrier: 'square', tone: 1000, speed: 6, depth: 200 },
      delay: { time: 1200, feedback: 0.3, mix: 0.4 },
    },
  },
  {
    name: 'P2',
    values: {
      siren: { waveForm: 'sawtooth', carrier: 'square', tone: 900, speed: 4, depth: 200 },
      delay: { time: 1500, feedback: 0.3, mix: 0.4 },
    },
  },
  {
    name: 'P3',
    values: {
      siren: { waveForm: 'sawtooth', carrier: 'square', tone: 400, speed: 2, depth: 200 },
      delay: { time: 200, feedback: 0.3, mix: 0.4 },
    },
  },
  {
    name: 'P4',
    values: {
      siren: { waveForm: 'square', carrier: 'square', tone: 350, speed: 3, depth: 200 },
      delay: { time: 600, feedback: 0.3, mix: 0.4 },
    },
  },
  {
    name: 'P5',
    values: {
      siren: { waveForm: 'triangle', carrier: 'square', tone: 800, speed: 9, depth: 200 },
      delay: { time: 950, feedback: 0.5, mix: 0.4 },
    },
  },
];

// sweep: semitones the tone starts away from on each press (+ drops from above, - rises from below), over glide seconds.
// release: fade-out in seconds after letting go. delay.tone: low-pass on the repeats.
const defaults = {
  siren: { waveForm: 'sine', carrier: 'square', tone: 700, speed: 8, depth: 200, sweep: 0, glide: 0.3, release: 0.01 },
  // wow: tape-style wobble of the echo time (0..1). pingPong: repeats bounce left/right.
  delay: { time: 600, feedback: 0.5, mix: 0.4, tone: 2000, wow: 0, pingPong: false },
  // drive: soft saturation (0..1). cutoff/resonance: low-pass (Hz / dB). mod: LFO to cutoff, in octaves.
  filter: { drive: 0, cutoff: 12000, resonance: 0, mod: 0 },
  // dwell: how hard the tank is driven (0..1). tone: low-pass on the reverb. mix: reverb level.
  spring: { dwell: 0.5, tone: 3000, mix: 0.3 },
  volume: 0.3,
  isDelayEnabled: true,
  isSpringEnabled: true,
};

function loadValues() {
  const values = structuredClone(defaults);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      Object.assign(values.siren, saved.siren);
      Object.assign(values.delay, saved.delay);
      Object.assign(values.spring, saved.spring);
      Object.assign(values.filter, saved.filter);
      if (typeof saved.volume === 'number') values.volume = saved.volume;
      if (typeof saved.isDelayEnabled === 'boolean') values.isDelayEnabled = saved.isDelayEnabled;
      if (typeof saved.isSpringEnabled === 'boolean') values.isSpringEnabled = saved.isSpringEnabled;
    }
  } catch (e) {
    // Corrupted storage, fall back to defaults
  }
  return values;
}

// Presets only store what they care about; everything else falls back to the defaults.
function presetValues(p) {
  return {
    siren: { ...defaults.siren, ...p.values.siren },
    delay: { ...defaults.delay, ...p.values.delay },
  };
}

function randomBetween(min, max, step) {
  return Math.round((Math.random() * (max - min) + min) / step) * step;
}

// Fourier series of one cycle of fn (phase 0..1), for OscillatorNode.setPeriodicWave.
function periodicWave(ctx, fn, harmonics = 64) {
  const n = 1024;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let k = 0; k < n; k++) {
    const y = fn(k / n);
    for (let h = 1; h <= harmonics; h++) {
      const a = (2 * Math.PI * h * k) / n;
      real[h] += (2 / n) * y * Math.cos(a);
      imag[h] += (2 / n) * y * Math.sin(a);
    }
  }
  return new PeriodicWave(ctx, { real, imag });
}

// Synthesized spring tank: a train of dispersive "drip" chirps (one per trip along the spring)
// over a diffuse noise tail, each channel with its own spring length for some width.
function springImpulse(ctx, seconds = 2.6) {
  const rate = ctx.sampleRate;
  const length = Math.floor(seconds * rate);
  const buffer = ctx.createBuffer(2, length, rate);
  const chirpLength = Math.floor(0.025 * rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const decay = (t) => 10 ** ((-3 * t) / seconds);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12 * decay(i / rate);
    }
    const period = 0.031 + ch * 0.0045;
    for (let k = 1; k * period < seconds; k++) {
      const start = Math.floor(k * period * rate);
      const amp = 0.9 * decay(k * period);
      let phase = 0;
      for (let j = 0; j < chirpLength && start + j < length; j++) {
        const tau = j / rate;
        phase += (2 * Math.PI * 3200 * Math.exp(-tau * 90)) / rate;
        const window = Math.sin((Math.PI * j) / chirpLength);
        data[start + j] += amp * Math.sin(phase) * window;
      }
    }
  }
  return buffer;
}

// tanh saturation, normalized so full scale stays full scale; tiny drive is practically linear.
function softClipCurve(drive = 2.5) {
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
  }
  return curve;
}

// Audio graph:
//   voices [carrier <- lfo * depth] -> envelope -> drive -> filter (cutoff <- lfo * mod)
//   -> dry + echo (send -> two delay lines, mono or ping-pong, wow on their times)
//   -> spring (dry + tank) -> output -> analyser + speakers.
// Kept outside Vue on purpose: reactive proxies break AudioNode method calls.
function createEngine() {
  const ctx = new AudioContext();

  const output = new GainNode(ctx);
  const analyser = new AnalyserNode(ctx, { fftSize: 2048 });
  const samples = new Float32Array(analyser.fftSize);
  output.connect(analyser);
  output.connect(ctx.destination);

  // Drive and filter are shared by every voice.
  const drive = new WaveShaperNode(ctx, { curve: softClipCurve(0.001), oversample: '4x' });
  const driveOut = new GainNode(ctx);
  const filter = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: defaults.filter.cutoff, Q: 0 });
  drive.connect(driveOut);
  driveOut.connect(filter);

  // Echo: the send is open while the echo is on or while Throw is held; repeats always ring out.
  const echoIn = new GainNode(ctx);
  const send = new GainNode(ctx, { gain: 0 });
  filter.connect(echoIn);
  echoIn.connect(send);
  const [left, right] = [0, 1].map(() => {
    const line = new DelayNode(ctx, { maxDelayTime: 2 });
    const tone = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: defaults.delay.tone });
    const wet = new GainNode(ctx, { gain: 0 });
    const pan = new StereoPannerNode(ctx);
    line.connect(tone);
    tone.connect(wet);
    wet.connect(pan);
    return { line, tone, wet, pan };
  });
  // Mono: the left line feeds itself. Ping-pong: left and right feed each other.
  const selfFeedback = new GainNode(ctx, { gain: 0 });
  const toRight = new GainNode(ctx, { gain: 0 });
  const toLeft = new GainNode(ctx, { gain: 0 });
  send.connect(left.line);
  left.tone.connect(selfFeedback);
  selfFeedback.connect(left.line);
  left.tone.connect(toRight);
  toRight.connect(right.line);
  right.tone.connect(toLeft);
  toLeft.connect(left.line);

  // Wow: two slow, unrelated sines wobbling both delay times, like a worn tape transport.
  const wowDepth = new GainNode(ctx, { gain: 0 });
  for (const frequency of [0.55, 0.23]) {
    const wow = new OscillatorNode(ctx, { frequency });
    wow.connect(wowDepth);
    wow.start();
  }
  wowDepth.connect(left.line.delayTime);
  wowDepth.connect(right.line.delayTime);

  // Spring: dwell drives a soft clipper into the tank, a high-pass keeps it thin like a real spring.
  const springIn = new GainNode(ctx);
  const dwell = new GainNode(ctx);
  const thin = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 180 });
  const clip = new WaveShaperNode(ctx, { curve: softClipCurve(), oversample: '2x' });
  const tank = new ConvolverNode(ctx, { buffer: springImpulse(ctx) });
  const springTone = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: defaults.spring.tone });
  const springWet = new GainNode(ctx, { gain: 0 });
  echoIn.connect(springIn);
  left.pan.connect(springIn);
  right.pan.connect(springIn);
  springIn.connect(output);
  springIn.connect(dwell);
  dwell.connect(thin);
  thin.connect(clip);
  clip.connect(tank);
  tank.connect(springTone);
  springTone.connect(springWet);
  springWet.connect(output);

  let voice = null;
  let echoOn = false;
  let throwing = false;
  let driveAmount = -1;
  const rampWave = periodicWave(ctx, (p) => 1 - 2 * p);

  function target(param, value, timeConstant = SMOOTHING) {
    param.setTargetAtTime(value, ctx.currentTime, timeConstant);
  }

  function updateSend() {
    target(send.gain, echoOn || throwing ? 1 : 0, 0.005);
  }

  // Random steps get a fresh pattern every time the shape is (re)selected, so each press sounds different.
  function setShape(lfo, shape) {
    if (WAVE_FORMS.includes(shape)) {
      lfo.type = shape;
    } else if (shape === 'ramp') {
      lfo.setPeriodicWave(rampWave);
    } else {
      const steps = Array.from({ length: RANDOM_STEPS }, () => Math.random() * 2 - 1);
      lfo.setPeriodicWave(periodicWave(ctx, (p) => steps[Math.floor(p * RANDOM_STEPS)]));
    }
  }

  return {
    apply(v) {
      target(output.gain, v.volume);

      if (v.filter.drive !== driveAmount) {
        driveAmount = v.filter.drive;
        drive.curve = softClipCurve(0.001 + driveAmount * 25);
      }
      // Saturation raises the average level; pull it back a little so Drive is not just a volume knob.
      target(driveOut.gain, 1 / (1 + v.filter.drive * 0.5));
      target(filter.frequency, v.filter.cutoff);
      target(filter.Q, v.filter.resonance);

      echoOn = v.isDelayEnabled;
      updateSend();
      // Gliding the time gives the tape-style pitch bend when it changes.
      const time = v.delay.time / 1000;
      const feedback = Math.min(0.99, v.delay.feedback);
      const ping = v.delay.pingPong;
      for (const { line, tone, wet } of [left, right]) {
        target(line.delayTime, time, 0.1);
        target(tone.frequency, v.delay.tone);
        target(wet.gain, v.delay.mix);
      }
      target(right.wet.gain, ping ? v.delay.mix : 0);
      target(selfFeedback.gain, ping ? 0 : feedback);
      target(toRight.gain, ping ? feedback : 0);
      target(toLeft.gain, ping ? feedback : 0);
      target(left.pan.pan, ping ? -0.85 : 0);
      target(right.pan.pan, ping ? 0.85 : 0);
      target(wowDepth.gain, v.delay.wow * 0.006);

      target(dwell.gain, 0.3 * (4 / 0.3) ** v.spring.dwell);
      target(springTone.frequency, v.spring.tone);
      target(springWet.gain, v.isSpringEnabled ? v.spring.mix * SPRING_MAKEUP : 0, 0.05);

      if (voice) {
        if (voice.osc.type !== v.siren.carrier) voice.osc.type = v.siren.carrier;
        if (voice.shape !== v.siren.waveForm) {
          setShape(voice.lfo, v.siren.waveForm);
          voice.shape = v.siren.waveForm;
        }
        target(voice.osc.frequency, v.siren.tone);
        target(voice.lfo.frequency, v.siren.speed);
        target(voice.depth.gain, v.siren.depth);
        target(voice.filterMod.gain, v.filter.mod * 1200);
      }
    },

    start(v) {
      // Browsers keep the context suspended until a user gesture.
      if (ctx.state !== 'running') ctx.resume();
      if (voice) return;

      const now = ctx.currentTime;
      const osc = new OscillatorNode(ctx, { type: v.siren.carrier, frequency: v.siren.tone });
      const lfo = new OscillatorNode(ctx, { frequency: v.siren.speed });
      setShape(lfo, v.siren.waveForm);
      const depth = new GainNode(ctx, { gain: v.siren.depth });
      // The filter's detune is in cents, so the LFO sweeps the cutoff in octaves.
      const filterMod = new GainNode(ctx, { gain: v.filter.mod * 1200 });
      const env = new GainNode(ctx, { gain: 0 });

      lfo.connect(depth);
      depth.connect(osc.frequency);
      lfo.connect(filterMod);
      filterMod.connect(filter.detune);
      osc.connect(env);
      env.connect(drive);

      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(1, now + ATTACK);

      if (v.siren.sweep) {
        osc.frequency.setValueAtTime(v.siren.tone * 2 ** (v.siren.sweep / 12), now);
        osc.frequency.exponentialRampToValueAtTime(v.siren.tone, now + v.siren.glide);
      }

      osc.start(now);
      lfo.start(now);
      voice = { osc, lfo, depth, filterMod, env, shape: v.siren.waveForm };
    },

    // A released voice keeps fading on its own, so a new press can start while the tail rings out.
    stop(v) {
      if (!voice) return;
      const { osc, lfo, depth, filterMod, env } = voice;
      voice = null;

      // Even the shortest fade avoids the click of cutting a waveform mid-cycle.
      const release = Math.max(RELEASE, v?.siren.release ?? RELEASE);
      const now = ctx.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(Math.max(env.gain.value, 0.0001), now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + release);
      env.gain.linearRampToValueAtTime(0, now + release + RELEASE);
      osc.stop(now + release + RELEASE * 2);
      lfo.stop(now + release + RELEASE * 2);
      osc.onended = () => {
        env.disconnect();
        depth.disconnect();
        filterMod.disconnect();
      };
    },

    // Throw: open the echo send only while held, the dub way of catching a phrase.
    setThrow(on) {
      if (ctx.state !== 'running') ctx.resume();
      throwing = on;
      updateSend();
    },

    // Kicking the tank: a short noise burst straight into the springs, after the clipper so it stays punchy.
    kick() {
      if (ctx.state !== 'running') ctx.resume();
      const length = Math.floor(ctx.sampleRate * 0.06);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp((-5 * i) / length);
      const burst = new AudioBufferSourceNode(ctx, { buffer });
      const gain = new GainNode(ctx, { gain: KICK_LEVEL });
      burst.connect(gain);
      gain.connect(tank);
      burst.onended = () => gain.disconnect();
      burst.start();
    },

    measure() {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      let peak = 0;
      for (const x of samples) {
        sum += x * x;
        peak = Math.max(peak, Math.abs(x));
      }
      return { rms: Math.sqrt(sum / samples.length), peak };
    },
  };
}
