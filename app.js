// 0 VU reference: a full-scale square wave at this output gain sits on the 0 mark.
const VU_REF = 0.5;
const VU_SPAN = 90;

const WAVES = [
  { value: 'sine', path: 'M1 7 C4 -1, 7 -1, 10 7 S16 15, 19 7' },
  { value: 'triangle', path: 'M1 7 L5.5 2 L14.5 12 L19 7' },
  { value: 'square', path: 'M1 12 V2 H10 V12 H19 V2' },
  { value: 'sawtooth', path: 'M1 12 L10 2 V12 L19 2 V12' },
  { value: 'ramp', path: 'M1 2 L10 12 V2 L19 12 V2' },
  { value: 'random', path: 'M1 9 H4 V3 H8 V12 H11 V5 H15 V9 H19' },
];
const CARRIERS = WAVES.filter((w) => WAVE_FORMS.includes(w.value));

// Turntable, front view, in mm. Each strobe row looks still at its own speed offset (%).
// The platter side is conical (r 156 at the top, 166 at the bottom), so each row sits on a larger radius.
const PLATTER = { cx: 187 };
const STROBE_ROWS = [
  { offset: 6, dots: 168, y: 66.6, r: 157.6 },
  { offset: 3.3, dots: 172, y: 71.8, r: 159.6 },
  { offset: 0, dots: 176, y: 77, r: 161.7 },
  { offset: -3.3, dots: 180, y: 82.2, r: 163.8 },
];
const ARM = { pivot: 395, length: 212, weightOffset: 56, rest: 4, play: 37 };
// Stylus heights above the floor: on the record, resting on the rest, lifted by the cue lever.
const STYLUS = { record: 101.5, rest: 92, lifted: 112 };

// Dots on the platter side, projected on the front view: they squeeze towards the edges of the cylinder.
function strobePath(row, angle) {
  const period = (2 * Math.PI) / row.dots;
  const width = Math.PI * row.r / row.dots;
  const offset = (angle * Math.PI) / 180;
  let d = '';
  for (let j = 0; j < row.dots; j++) {
    const t = j * period + offset;
    const c = Math.cos(t);
    if (c < 0.05) continue;
    const w = width * c;
    const x = PLATTER.cx + row.r * Math.sin(t) - w / 2;
    d += `M${x.toFixed(2)} ${row.y}h${w.toFixed(2)}v2.6h${(-w).toFixed(2)}z`;
  }
  return d;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Needle position (0..1) for a linear amplitude, following the voltage-linear VU scale from -20 to +3.
function vuPosition(amplitude) {
  return (amplitude - 0.1) / (10 ** (3 / 20) - 0.1);
}

const RackUnit = {
  props: { u: { type: Number, required: true }, finish: String, seed: { type: Number, default: 1 } },
  computed: {
    screws() {
      const count = this.u === 1 ? 1 : 2;
      return Array.from({ length: count }, (_, i) => (this.seed * 53 + i * 71) % 180);
    },
  },
  template: `
    <section :class="['unit', 'finish-' + finish]" :style="{ '--units': u }">
      <div class="ear"><i v-for="(r, i) in screws" :key="i" class="screw" :style="{ '--rot': r + 'deg' }"></i></div>
      <div class="face"><slot></slot></div>
      <div class="ear"><i v-for="(r, i) in screws" :key="i" class="screw" :style="{ '--rot': (r + 37) + 'deg' }"></i></div>
    </section>`,
};

const Knob = {
  props: {
    modelValue: { type: Number, required: true },
    label: String,
    min: { type: Number, default: 0 },
    max: { type: Number, default: 1 },
    step: { type: Number, default: 0.01 },
    taper: { type: String, default: 'lin' },
    reset: Number,
    unit: { type: String, default: '' },
    scale: { type: Number, default: 1 },
    decimals: { type: Number, default: 0 },
    bipolar: Boolean,
  },
  emits: ['update:modelValue'],
  data() {
    return { dragging: false };
  },
  computed: {
    norm() {
      return this.toNorm(this.modelValue);
    },
    angle() {
      return -135 + 270 * this.norm;
    },
    display() {
      const sign = this.bipolar && this.modelValue > 0 ? '+' : '';
      return sign + (this.modelValue * this.scale).toFixed(this.decimals) + this.unit;
    },
    ticks() {
      return Array.from({ length: 11 }, (_, i) => {
        const a = ((-135 + 27 * i) * Math.PI) / 180;
        const outer = i % 5 === 0 ? 39 : 37;
        return {
          i,
          label: this.bipolar ? { 0: '−', 5: '0', 10: '+' }[i] : i % 2 === 0 ? String(i) : undefined,
          x1: 33 * Math.sin(a), y1: -33 * Math.cos(a),
          x2: outer * Math.sin(a), y2: -outer * Math.cos(a),
          tx: 45 * Math.sin(a), ty: -45 * Math.cos(a),
        };
      });
    },
  },
  methods: {
    toNorm(v) {
      const p = this.taper === 'log'
        ? Math.log(v / this.min) / Math.log(this.max / this.min)
        : (v - this.min) / (this.max - this.min);
      return clamp(p, 0, 1);
    },
    fromNorm(p) {
      p = clamp(p, 0, 1);
      const raw = this.taper === 'log'
        ? this.min * (this.max / this.min) ** p
        : this.min + p * (this.max - this.min);
      return this.quantize(raw);
    },
    quantize(v) {
      const q = Math.round(v / this.step) * this.step;
      return Number(clamp(q, this.min, this.max).toFixed(6));
    },
    emit(v) {
      if (v !== this.modelValue) this.$emit('update:modelValue', v);
    },
    // Wheel and arrow keys must always move at least one step, even where the taper is coarse.
    nudge(dir, amount) {
      const v = this.fromNorm(this.norm + dir * amount);
      this.emit(v !== this.modelValue ? v : this.quantize(this.modelValue + dir * this.step));
    },
    onPointerDown(e) {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      this.dragging = true;
      this.startY = e.clientY;
      this.startNorm = this.norm;
    },
    onPointerMove(e) {
      if (!this.dragging) return;
      const travel = e.shiftKey ? 1000 : 200;
      this.emit(this.fromNorm(this.startNorm + (this.startY - e.clientY) / travel));
    },
    onPointerUp() {
      this.dragging = false;
    },
    onWheel(e) {
      this.nudge(e.deltaY < 0 ? 1 : -1, e.shiftKey ? 0.004 : 0.02);
    },
    onKeyDown(e) {
      const keys = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
      if (e.key in keys) {
        e.preventDefault();
        const n = keys[e.key];
        this.nudge(Math.sign(n), Math.abs(n) * (e.shiftKey ? 0.002 : 0.01));
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.emit(this.min);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.emit(this.max);
      }
    },
    onReset() {
      if (this.reset !== undefined) this.emit(this.reset);
    },
  },
  template: `
    <div class="knob-wrap">
      <div class="knob-dial">
        <svg class="knob-scale" viewBox="-50 -50 100 100" aria-hidden="true">
          <line v-for="t in ticks" :key="t.i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :class="{ major: t.i % 5 === 0 }" />
          <text v-for="t in ticks.filter(t => t.label)" :key="'n' + t.i" :x="t.tx" :y="t.ty">{{ t.label }}</text>
        </svg>
        <div class="knob" role="slider" tabindex="0" :class="{ 'is-dragging': dragging }"
          :aria-label="label" :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="modelValue" :aria-valuetext="display"
          @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"
          @wheel.prevent="onWheel" @keydown="onKeyDown" @dblclick="onReset">
          <div class="knob-rotor" :style="{ transform: 'rotate(' + angle + 'deg)' }">
            <div class="knob-cap"></div>
            <div class="knob-pointer"></div>
          </div>
          <div class="knob-shine"></div>
        </div>
        <div :class="['knob-tag', { 'is-visible': dragging }]">{{ display }}</div>
      </div>
      <div class="legend">{{ label }}</div>
    </div>`,
};

// Chicken-head rotary selector.
const Selector = {
  props: {
    modelValue: String,
    label: String,
    options: { type: Array, required: true },
  },
  emits: ['update:modelValue'],
  computed: {
    index() {
      return Math.max(0, this.options.findIndex((o) => o.value === this.modelValue));
    },
    positions() {
      const n = this.options.length;
      const spread = n > 4 ? 200 : 120;
      const radius = n > 4 ? 53 : 44;
      return this.options.map((o, i) => {
        const deg = -spread / 2 + (spread * i) / (n - 1);
        const a = (deg * Math.PI) / 180;
        return {
          ...o,
          deg,
          x: 50 + radius * Math.sin(a), y: 50 - radius * Math.cos(a),
          tick: { x1: 34 * Math.sin(a), y1: -34 * Math.cos(a), x2: 38 * Math.sin(a), y2: -38 * Math.cos(a) },
        };
      });
    },
  },
  methods: {
    select(i) {
      const n = this.options.length;
      this.$emit('update:modelValue', this.options[(i + n) % n].value);
    },
    onKeyDown(e) {
      const dir = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      this.select(clamp(this.index + dir, 0, this.options.length - 1));
    },
    onWheel(e) {
      this.select(clamp(this.index + (e.deltaY < 0 ? 1 : -1), 0, this.options.length - 1));
    },
  },
  template: `
    <div class="knob-wrap">
      <div :class="['selector-dial', { many: options.length > 4 }]" role="radiogroup" :aria-label="label">
        <svg class="knob-scale" viewBox="-50 -50 100 100" aria-hidden="true">
          <line v-for="p in positions" :key="p.value" v-bind="p.tick" class="major" />
        </svg>
        <button v-for="(p, i) in positions" :key="p.value" type="button" role="radio"
          :class="['sel-opt', { on: i === index }]" :style="{ left: p.x + '%', top: p.y + '%' }"
          :aria-checked="i === index" :aria-label="p.value" :title="p.value" tabindex="-1" @click="select(i)">
          <svg viewBox="0 0 20 14"><path :d="p.path" /></svg>
        </button>
        <button type="button" class="chicken" :aria-label="label + ': ' + modelValue"
          @click="select(index + 1)" @keydown="onKeyDown" @wheel.prevent="onWheel">
          <svg viewBox="-50 -50 100 100" :style="{ transform: 'rotate(' + positions[index].deg + 'deg)' }">
            <circle r="27" cy="6" fill="url(#ch-base)" />
            <path d="M0 -47 C6 -47 9 -42 10 -34 L21 12 C25 30 14 40 0 40 C-14 40 -25 30 -21 12 L-10 -34 C-9 -42 -6 -47 0 -47 Z" fill="url(#ch-body)" />
            <path d="M0 -44 L0 -8" stroke="#f1e8cf" stroke-width="3.2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="legend">{{ label }}</div>
    </div>`,
};

const BatToggle = {
  props: { modelValue: Boolean, label: String, onLabel: { type: String, default: 'On' }, offLabel: { type: String, default: 'Off' } },
  emits: ['update:modelValue'],
  template: `
    <div class="bat-wrap">
      <span class="legend small">{{ onLabel }}</span>
      <button type="button" role="switch" :aria-checked="modelValue" :aria-label="label"
        :class="['bat', { off: !modelValue }]" @click="$emit('update:modelValue', !modelValue)">
        <span class="bat-washer"></span>
        <span class="bat-nut"></span>
        <span class="bat-arm"><span class="bat-rod"></span><span class="bat-ball"></span></span>
      </button>
      <span class="legend small">{{ offLabel }}</span>
    </div>`,
};

const engine = createEngine();

Vue.createApp({
  components: { RackUnit, Knob, Selector, BatToggle },

  data() {
    return {
      presets,
      defaults,
      waves: WAVES,
      carriers: CARRIERS,
      values: loadValues(),
      isPlaying: false,
      isClipping: false,
      isHelpOpen: false,
      isThrowing: false,
      deck: {
        playing: !matchMedia('(prefers-reduced-motion: reduce)').matches,
        speed: 33,
      },
      vuMarks: [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3].map((db) => {
        const a = ((-VU_SPAN / 2 + VU_SPAN * vuPosition(10 ** (db / 20))) * Math.PI) / 180;
        const r = db === -20 || db === -10 || db === -5 || db === 0 || db === 3 ? 96 : 100;
        return {
          db,
          label: db > 0 ? '+' + db : String(Math.abs(db)),
          hot: db > 0,
          x1: 100 + r * Math.sin(a), y1: 135 - r * Math.cos(a),
          x2: 100 + 106 * Math.sin(a), y2: 135 - 106 * Math.cos(a),
          tx: 100 + 116 * Math.sin(a), ty: 135 - 116 * Math.cos(a),
        };
      }),
    };
  },

  computed: {
    vuRedArc() {
      const a0 = ((-VU_SPAN / 2 + VU_SPAN * vuPosition(1)) * Math.PI) / 180;
      const a1 = (VU_SPAN / 2 * Math.PI) / 180;
      const r = 103;
      const p = (a) => `${100 + r * Math.sin(a)} ${135 - r * Math.cos(a)}`;
      return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
    },
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
    window.addEventListener('click', this.closeHelp);
    document.addEventListener('visibilitychange', this.stop);
    this.startMeter();
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.stop);
    window.removeEventListener('click', this.closeHelp);
    document.removeEventListener('visibilitychange', this.stop);
    cancelAnimationFrame(this.meterFrame);
  },

  methods: {
    onKeyDown(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) this.play();
        return;
      }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyE') {
        this.startThrow();
        return;
      }
      if (e.code === 'KeyR') {
        this.applyRandomPreset();
        return;
      }
      if (e.code === 'KeyT') {
        this.tapTempo();
        return;
      }
      if (e.key === '?') {
        this.isHelpOpen = !this.isHelpOpen;
        return;
      }
      if (e.key === 'Escape') {
        this.closeHelp();
        return;
      }
      const preset = this.presets[Number(e.key) - 1];
      if (preset) this.applyPreset(preset);
    },

    closeHelp() {
      this.isHelpOpen = false;
    },

    onKeyUp(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        this.stop();
      }
      if (e.code === 'KeyE') this.stopThrow();
    },

    onPointerDown(e) {
      if (e.button === 0) this.play();
    },

    // Direct-drive motor: quick spin-up, softer brake. Strobe dots are drawn as seen under the strobe light (aliased).
    spinDeck(dt) {
      const nominal = this.deck.speed === 33 ? 100 / 3 : 45;
      const target = this.deck.playing ? nominal : 0;
      this.rpm += (target - this.rpm) * (1 - Math.exp(-dt / (target > this.rpm ? 0.25 : 0.6)));

      STROBE_ROWS.forEach((row, i) => {
        const locked = nominal * (1 + row.offset / 100);
        const apparent = this.rpm < nominal / 2 ? this.rpm : this.rpm - locked;
        this.strobeAngles[i] = (this.strobeAngles[i] + apparent * 6 * dt) % 360;
        this.strobeEls[i].setAttribute('d', strobePath(row, this.strobeAngles[i]));
      });
    },

    // Cueing: lift, swing, then lower onto the record or the rest.
    moveArm(dt) {
      const arm = this.arm;
      const target = this.deck.playing ? ARM.play : ARM.rest;
      const swinging = Math.abs(arm.angle - target) > 0.3;
      const height = swinging ? STYLUS.lifted : this.deck.playing ? STYLUS.record : STYLUS.rest;
      arm.height += (height - arm.height) * (1 - Math.exp(-dt / 0.15));
      if (swinging && arm.height > STYLUS.lifted - 1) {
        arm.angle += (target - arm.angle) * (1 - Math.exp(-dt / 0.4));
      }
      this.drawArm();
    },

    drawArm() {
      const a = (this.arm.angle * Math.PI) / 180;
      const x = ARM.pivot - ARM.length * Math.sin(a);
      const y = 160 - this.arm.height - 14;
      const { armTube, armShine, armHead, armWeight } = this.$refs;
      armTube.setAttribute('x2', x);
      armTube.setAttribute('y2', y + 2);
      armShine.setAttribute('x2', x);
      armShine.setAttribute('y2', y + 1);
      armHead.setAttribute('transform', `translate(${x} ${y})`);
      const width = 38 * Math.sin(a) + 28 * Math.cos(a);
      armWeight.setAttribute('x', ARM.pivot + ARM.weightOffset * Math.sin(a) - width / 2);
      armWeight.setAttribute('width', width);
    },

    // Runs outside Vue's render cycle: the needle, the sign glow and the platter are written straight to the DOM every frame.
    startMeter() {
      this.rpm = 0;
      this.strobeEls = [...this.$refs.tower.querySelectorAll('.strobe-row')];
      this.strobeAngles = this.strobeEls.map(() => 0);
      this.springEls = [...this.$refs.tower.querySelectorAll('.spring-coil')];
      this.springShake = 0;
      this.arm = this.deck.playing ? { angle: ARM.play, height: STYLUS.record } : { angle: ARM.rest, height: STYLUS.rest };
      let needle = 0;
      let glow = 0;
      let clipUntil = 0;
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const { rms, peak } = engine.measure();

        const target = clamp(vuPosition(rms / VU_REF), -0.05, 1.08);
        needle += (target - needle) * (1 - Math.exp(-dt / 0.07));
        this.$refs.needle?.setAttribute('transform', `rotate(${-VU_SPAN / 2 + VU_SPAN * needle} 100 135)`);

        glow += (Math.min(1, rms * 2) - glow) * (1 - Math.exp(-dt / 0.12));
        this.$refs.tower?.style.setProperty('--level', glow.toFixed(3));

        if (peak >= CLIP_LEVEL) clipUntil = now + CLIP_HOLD;
        this.isClipping = now < clipUntil;
        this.spinDeck(dt);
        this.moveArm(dt);
        this.blinkTempo(now);
        this.shakeSprings(now, dt, glow);
        this.meterFrame = requestAnimationFrame(tick);
      };
      this.meterFrame = requestAnimationFrame(tick);
    },

    // Side view of a coil spring stretched between the two anchors.
    coilPath(y) {
      let d = `M14 ${y}`;
      for (let x = 14; x < 226; x += 4) d += ` q2 -7 4 0`;
      return d;
    },

    kickSpring() {
      engine.kick();
      this.springShake = this.values.isSpringEnabled ? 1 : 0.15;
    },

    startThrow() {
      this.isThrowing = true;
      engine.setThrow(true);
    },

    stopThrow() {
      if (!this.isThrowing) return;
      this.isThrowing = false;
      engine.setThrow(false);
    },

    // Average of the last few taps; a pause of 2 s starts a new count.
    tapTempo() {
      const now = performance.now();
      const taps = (this.taps ?? []).filter((t) => now - t < 2000).concat(now).slice(-4);
      this.taps = taps;
      this.tempoOrigin = now;
      if (taps.length < 2) return;
      const interval = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
      this.values.delay.time = Math.round(clamp(interval, 1, 1700));
    },

    // Lamp flashes at the echo time, like the tap LED on a delay pedal.
    blinkTempo(now) {
      const time = this.values.delay.time;
      const lit = (this.values.isDelayEnabled || this.isThrowing) && (now - (this.tempoOrigin ?? 0)) % time < Math.min(90, time * 0.45);
      this.$refs.tempo.classList.toggle('on', lit);
    },

    // Springs wobble with the reverb level and ring out after a kick.
    shakeSprings(now, dt, level) {
      const wet = this.values.isSpringEnabled ? this.values.spring.mix : 0;
      this.springShake = Math.max(this.springShake * Math.exp(-dt / 0.7), level * wet * 1.5);
      this.springEls.forEach((el, i) => {
        const y = this.springShake * 3.5 * Math.sin(now / (38 + i * 9) + i);
        el.setAttribute('transform', `translate(0 ${y.toFixed(2)})`);
      });
    },

    applyPreset(p) {
      this.values.isDelayEnabled = true;
      const values = presetValues(p);
      Object.assign(this.values.siren, values.siren);
      Object.assign(this.values.delay, values.delay);
    },

    applyRandomPreset() {
      this.values.isDelayEnabled = true;
      const siren = this.values.siren;
      siren.waveForm = LFO_SHAPES[Math.floor(Math.random() * LFO_SHAPES.length)];
      siren.tone = randomBetween(40, 1400, 10);
      siren.speed = Number(randomBetween(0.5, 12, 0.1).toFixed(1));
      // Half of the random sounds get a sweep on the attack.
      siren.sweep = Math.random() < 0.5 ? 0 : randomBetween(-24, 24, 1);
      siren.glide = Number(randomBetween(0.05, 1, 0.01).toFixed(2));
    },

    play() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      engine.start(this.values);
    },

    stop() {
      if (!this.isPlaying) return;
      this.isPlaying = false;
      engine.stop(this.values);
    },
  },
}).mount('#app');
