const STORAGE_KEY = 'njd-siren';
const WAVE_FORMS = ['sine', 'triangle', 'square', 'sawtooth'];
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

const defaults = {
  siren: { waveForm: 'sine', carrier: 'square', tone: 700, speed: 8, depth: 200 },
  delay: { time: 600, feedback: 0.5, mix: 0.4 },
  volume: 0.3,
  isDelayEnabled: true,
};

function loadValues() {
  const values = structuredClone(defaults);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      Object.assign(values.siren, saved.siren);
      Object.assign(values.delay, saved.delay);
      if (typeof saved.volume === 'number') values.volume = saved.volume;
      if (typeof saved.isDelayEnabled === 'boolean') values.isDelayEnabled = saved.isDelayEnabled;
    }
  } catch (e) {
    // Corrupted storage, fall back to defaults
  }
  return values;
}

function randomBetween(min, max, step) {
  return Math.round((Math.random() * (max - min) + min) / step) * step;
}

// Audio graph: [carrier <- lfo * depth] -> envelope -> delay -> output -> analyser + speakers.
// Kept outside Vue on purpose: reactive proxies break AudioNode method calls.
function createEngine() {
  const ctx = new AudioContext();
  const tuna = new Tuna(ctx);

  const output = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  const samples = new Float32Array(analyser.fftSize);

  const delay = new tuna.Delay({ dryLevel: 1, cutoff: 2000 });
  delay.connect(output);
  output.connect(analyser);
  output.connect(ctx.destination);

  let voice = null;

  function target(param, value, timeConstant = SMOOTHING) {
    param.setTargetAtTime(value, ctx.currentTime, timeConstant);
  }

  return {
    apply(v) {
      target(output.gain, v.volume);
      delay.bypass = !v.isDelayEnabled;
      // Tuna's delayTime setter jumps instantly (clicks); gliding gives the tape-style pitch bend instead.
      target(delay.delayTime, v.delay.time / 1000, 0.1);
      delay.feedback = v.delay.feedback;
      delay.wetLevel = v.delay.mix;

      if (voice) {
        if (voice.osc.type !== v.siren.carrier) voice.osc.type = v.siren.carrier;
        if (voice.lfo.type !== v.siren.waveForm) voice.lfo.type = v.siren.waveForm;
        target(voice.osc.frequency, v.siren.tone);
        target(voice.lfo.frequency, v.siren.speed);
        target(voice.depth.gain, v.siren.depth);
      }
    },

    start(v) {
      // Browsers keep the context suspended until a user gesture.
      if (ctx.state !== 'running') ctx.resume();
      if (voice) return;

      const now = ctx.currentTime;
      const osc = new OscillatorNode(ctx, { type: v.siren.carrier, frequency: v.siren.tone });
      const lfo = new OscillatorNode(ctx, { type: v.siren.waveForm, frequency: v.siren.speed });
      const depth = new GainNode(ctx, { gain: v.siren.depth });
      const env = new GainNode(ctx, { gain: 0 });

      lfo.connect(depth);
      depth.connect(osc.frequency);
      osc.connect(env);
      env.connect(delay);

      env.gain.linearRampToValueAtTime(1, now + ATTACK);
      osc.start(now);
      lfo.start(now);
      voice = { osc, lfo, depth, env };
    },

    stop() {
      if (!voice) return;
      const { osc, lfo, depth, env } = voice;
      voice = null;

      // Short fade-out avoids the click of cutting a waveform mid-cycle.
      const now = ctx.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(env.gain.value, now);
      env.gain.linearRampToValueAtTime(0, now + RELEASE);
      osc.stop(now + RELEASE * 2);
      lfo.stop(now + RELEASE * 2);
      osc.onended = () => {
        env.disconnect();
        depth.disconnect();
      };
    },

    measure() {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      let peak = 0;
      for (const s of samples) {
        sum += s * s;
        peak = Math.max(peak, Math.abs(s));
      }
      return { rms: Math.sqrt(sum / samples.length), peak };
    },
  };
}

const engine = createEngine();

Vue.createApp({
  data() {
    return {
      presets,
      selectedPreset: '',
      values: loadValues(),
      isPlaying: false,
      meterValue: 0,
      isClipping: false,
    };
  },

  watch: {
    values: {
      deep: true,
      handler(v) {
        engine.apply(v);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
      },
    },
  },

  mounted() {
    engine.apply(this.values);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.stop);
    document.addEventListener('visibilitychange', this.stop);
    this.startMeter();
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.stop);
    document.removeEventListener('visibilitychange', this.stop);
    cancelAnimationFrame(this.meterFrame);
  },

  methods: {
    onKeyDown(e) {
      if (e.code === 'Space') {
        // Also stops page scroll and space toggling a focused control.
        e.preventDefault();
        if (!e.repeat) this.play();
        return;
      }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const preset = this.presets[Number(e.key) - 1];
      if (preset) this.applyPreset(preset);
    },

    onKeyUp(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        this.stop();
      }
    },

    onPointerDown(e) {
      if (e.button === 0) this.play();
    },

    startMeter() {
      let level = 0;
      let clipUntil = 0;
      const tick = (now) => {
        const { rms, peak } = engine.measure();
        level = Math.max(rms, level * 0.95);
        if (peak >= CLIP_LEVEL) clipUntil = now + CLIP_HOLD;
        this.meterValue = Math.min(100, Math.round(level * 100));
        this.isClipping = now < clipUntil;
        this.meterFrame = requestAnimationFrame(tick);
      };
      this.meterFrame = requestAnimationFrame(tick);
    },

    applyPreset(p) {
      this.values.isDelayEnabled = true;
      Object.assign(this.values.siren, p.values.siren);
      Object.assign(this.values.delay, p.values.delay);
      this.selectedPreset = p.name;
    },

    applyRandomPreset() {
      this.values.isDelayEnabled = true;
      this.values.siren.waveForm = WAVE_FORMS[Math.floor(Math.random() * WAVE_FORMS.length)];
      this.values.siren.tone = randomBetween(40, 1400, 10);
      this.values.siren.speed = Number(randomBetween(0.5, 12, 0.1).toFixed(1));
      this.selectedPreset = '';
    },

    play() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      engine.start(this.values);
    },

    stop() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      engine.stop();
    },
  },
}).mount('#app');
