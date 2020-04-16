// Init the audio context
var audioContext = new AudioContext()

// Init the Tuna library
var tuna = new Tuna(audioContext);

// Define the wave forms
const waveForms = ['sine', 'square', 'sawtooth', 'triangle'];

// Set the presets
const presets = [
  {
    name: "P1",
    values: {
      siren: {
        waveForm: 'sine',
        tone: 1000,
        speed: 6,
      },   
      delay: {
        time: 1200,
        feedback: 0.30,
        mix: 0.4
      }
    }
  },
  {
    name: "P2",
    values: {
      siren: {
        waveForm: 'sawtooth',
        tone: 900,
        speed: 4,
      },   
      delay: {
        time: 1500,
        feedback: 0.30,
        mix: 0.4
      }
    }
  },
  {
    name: "P3",
    values: {
      siren: {
        waveForm: 'sawtooth',
        tone: 400,
        speed: 2,
      },   
      delay: {
        time: 200,
        feedback: 0.30,
        mix: 0.4
      }
    }
  },
  {
    name: "P4",
    values: {
      siren: {
        waveForm: 'square',
        tone: 350,
        speed: 3,
      },   
      delay: {
        time: 600,
        feedback: 0.30,
        mix: 0.4
      }
    }
  },
  {
    name: "P5",
    values: {
      siren: {
        waveForm: 'triangle',
        tone: 800,
        speed: 9,
      },   
      delay: {
        time: 950,
        feedback: 0.5,
        mix: 0.4
      }
    }
  }
]

var vm = new Vue({
  el: '#app',
  data: {
    ctx: audioContext,
    mainOscillator: null,
    lfoOscillator: null,
    outputGain: null,
    lfoGain: null,
    delay: null,
    meter: null,
    meterValue: 0,
    isClipping: false,
    presets: presets,
    selectedPreset: '',
    values: {
      siren: {
        waveForm: 'sine',
        tone: 700,
        speed: 8,
      },   
      delay: {
        time: 600,
        feedback: 0.5,
        mix: 0.4
      },
      volume: 0.3,
      isDelayEnabled: true,
    },
    isPlaying: false,
    isLoading: false,
  },
  created: function(){
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('keydown', this.keyDown);
  },
  beforeDestroy: function() {
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('keydown', this.keyDown);
  },
  beforeCreate: function(){
    this.isLoading = true;
  },
  mounted: function(){
    this.isLoading = false;

    // Init the output gain and the LFO gain
    this.outputGain = this.ctx.createGain()
    this.lfoGain = this.ctx.createGain()

    // Create a new volume meter and connect it.
    this.meter = createAudioMeter(this.ctx);
    this.outputGain.connect(this.meter);

    // Refresh
    this.interval = setInterval(() => this.updateMeter(), 100);
  },
  methods: {
    keyUp: function(e){
      if (e.keyCode === 32) {
        this.stop();
      }
    },
    keyDown: function(e){
      if (e.keyCode === 32) {
        this.play();
      }
    },
    updateMeter: function(){
      this.meterValue = Math.floor(this.meter.volume * 100);
      this.isClipping = this.meter.checkClipping();
    },
    applyPreset: function (p) {
      // Enable delay
      this.values.isDelayEnabled = true;

      // Set values
      this.values.siren.waveForm = p.values.siren.waveForm;
      this.values.siren.tone = p.values.siren.tone;
      this.values.siren.speed = p.values.siren.speed;

      this.selectedPreset = p.name;
    },
    applyRandomPreset: function () {
      // Enable delay
      this.values.isDelayEnabled = true;

      // Set values
      this.values.siren.waveForm =  waveForms[Math.floor(Math.random() * (waveForms.length -1))];
      this.values.siren.tone = Math.floor(Math.random() * (1400 - 40) + 40);
      this.values.siren.speed = Math.floor(Math.random() * (12 - 0.1) + 0.1);

      this.selectedPreset = '';
    },
    play: function () {
      // Return if already playing
      if (this.isPlaying){
        return
      }

      this.isPlaying = true;

      // Init the delay
      this.delay = new tuna.Delay({
        feedback: this.values.delay.feedback,
        delayTime: this.values.delay.time,
        wetLevel: this.values.delay.mix,
        dryLevel: 1,
        cutoff: 2000,
        bypass: 0
      })

      // Create the main oscillator
      this.mainOscillator = this.ctx.createOscillator();
      this.mainOscillator.type = 'square';
      this.mainOscillator.frequency.value = this.values.siren.tone;

      // Create the LFO oscillator
      this.lfoOscillator = this.ctx.createOscillator();
      this.lfoOscillator.type = this.values.siren.waveForm;
      this.lfoOscillator.frequency.value = this.values.siren.speed;

      // Set the volumes
      this.outputGain.gain.value = this.values.volume;
      this.lfoGain.gain.value = 200;

      // Connect the LFO oscillator to its gain
      this.lfoOscillator.connect(this.lfoGain);

      // Connect the gain of the LFO to the frequency of the main oscillator. This is what we call `modulation`.
      this.lfoGain.connect(this.mainOscillator.frequency);

      // Connect the main oscillator to output gain
      this.mainOscillator.connect(this.outputGain)

      // Connect the delay if enabled
      if(this.values.isDelayEnabled){
        // Connect the oscillator gain to delay
        this.mainOscillator.connect(this.delay);

        // Connect the delay to the context destination
        this.delay.connect(this.outputGain);
      }

      // Connect the output gain to the context destination
      this.outputGain.connect(this.ctx.destination);
      
      // Start oscillators
      this.mainOscillator.start();
      this.lfoOscillator.start();
    },
    stop: function () {
      // Return if already stopped
      if (!this.isPlaying){
        return
      }

      // Disconnect the gain of the LFO from the main oscillator frequency
      this.lfoGain.disconnect(this.mainOscillator.frequency);

      // Disconnect all oscillators
      this.mainOscillator.disconnect();
      this.lfoOscillator.disconnect();
    
      // Stop all oscilators
      this.mainOscillator.stop();
      this.lfoOscillator.stop();

      this.isPlaying = false;
    }
  }
})
