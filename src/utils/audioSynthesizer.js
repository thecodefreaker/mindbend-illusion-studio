// Web Audio API Synthesizer for Hypnotic Ambient Drones & Binaural Beats
// Generates mesmerizing, soothing frequencies that enhance optical illusions

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];
    this.destNode = null; // MediaStreamDestination for video recording
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  // Get a MediaStreamDestination to pipe audio into MediaRecorder
  getMediaStreamDestination() {
    this.init();
    if (!this.destNode) {
      this.destNode = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.destNode);
    }
    return this.destNode;
  }

  startHypnoticDrone(type = 'binaural') {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stop();

    const now = this.ctx.currentTime;
    this.oscillators = [];

    // Base fundamental frequency: 108Hz (Deep meditative harmonic)
    const baseFreq = 108;
    // Binaural beat frequency difference: 6Hz (Theta wave brain entrainment)
    const beatDelta = 6;

    // Left channel
    const oscLeft = this.ctx.createOscillator();
    const panLeft = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gainLeft = this.ctx.createGain();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, now);
    gainLeft.gain.setValueAtTime(0.3, now);

    // Right channel
    const oscRight = this.ctx.createOscillator();
    const panRight = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gainRight = this.ctx.createGain();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + beatDelta, now);
    gainRight.gain.setValueAtTime(0.3, now);

    // Sub-bass warm drone (54Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(baseFreq / 2, now);
    subGain.gain.setValueAtTime(0.2, now);

    // Filter to soften the drone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    // Shimmer harmonic (432Hz ambient overtone with slow LFO)
    const shimmer = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(432, now);
    shimmerGain.gain.setValueAtTime(0.04, now);

    // Connect Left
    if (panLeft) {
      panLeft.pan.setValueAtTime(-0.8, now);
      oscLeft.connect(gainLeft);
      gainLeft.connect(panLeft);
      panLeft.connect(filter);
    } else {
      oscLeft.connect(gainLeft);
      gainLeft.connect(filter);
    }

    // Connect Right
    if (panRight) {
      panRight.pan.setValueAtTime(0.8, now);
      oscRight.connect(gainRight);
      gainRight.connect(panRight);
      panRight.connect(filter);
    } else {
      oscRight.connect(gainRight);
      gainRight.connect(filter);
    }

    // Connect Sub and Shimmer
    subOsc.connect(subGain);
    subGain.connect(filter);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(filter);

    filter.connect(this.masterGain);

    // Start oscillators
    oscLeft.start(now);
    oscRight.start(now);
    subOsc.start(now);
    shimmer.start(now);

    this.oscillators = [oscLeft, oscRight, subOsc, shimmer];
    this.isPlaying = true;
  }

  stop() {
    if (this.oscillators.length > 0) {
      const now = this.ctx ? this.ctx.currentTime : 0;
      this.oscillators.forEach(osc => {
        try {
          osc.stop(now);
          osc.disconnect();
        } catch (e) {
          // Ignore already stopped
        }
      });
      this.oscillators = [];
    }
    this.isPlaying = false;
  }

  setVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }
}

export const audioSynth = new AudioSynthesizer();
