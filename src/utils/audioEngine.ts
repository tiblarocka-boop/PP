import { EQBand, ToneSettings, LimiterSettings, SpatialSettings } from '../types/audio';
import { STANDARD_FREQUENCIES_10, STANDARD_FREQUENCIES_16, STANDARD_FREQUENCIES_32 } from './presets';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Nodes
  private inputNode: GainNode | null = null;
  private preampGainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private compressorNode: DynamicsCompressorNode | null = null;
  private masterGainNode: GainNode | null = null;
  private bypassGainProcessed: GainNode | null = null;
  private bypassGainDry: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Mid/Side Stereo Widener
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private midGain: GainNode | null = null;
  private sideGain: GainNode | null = null;

  // Ambience / Reverb
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;

  // Source management
  private currentSourceType: 'synth' | 'file' | 'mic' | 'system' | 'none' = 'none';
  private audioElement: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private systemStream: MediaStream | null = null;
  private systemSource: MediaStreamAudioSourceNode | null = null;
  private wakeLockSentinel: any = null;

  // Synthetic loop generator (Builtin tracks)
  private synthInterval: number | null = null;
  private synthStep = 0;
  private isSynthPlaying = false;
  private synthTrackId = 'synth_bass';

  // Current parameters cache
  private isBypassed = false;
  private preampDb = 0;
  private masterVol = 0.85;

  private tone: ToneSettings = {
    bassGain: 0,
    bassFreq: 100,
    trebleGain: 0,
    trebleFreq: 10000,
  };

  private limiter: LimiterSettings = {
    enabled: true,
    threshold: -3,
    knee: 12,
    ratio: 12,
    attack: 0.003,
    release: 0.15,
  };

  private spatial: SpatialSettings = {
    stereoWidth: 1.0,
    reverbMix: 0.0,
    tempo: 1.0,
    pitch: 0,
  };

  private currentBands: EQBand[] = [];

  constructor() {
    this.currentBands = this.createDefaultBands('10');
  }

  public createDefaultBands(mode: '10' | '16' | '32'): EQBand[] {
    const freqs =
      mode === '10'
        ? STANDARD_FREQUENCIES_10
        : mode === '16'
        ? STANDARD_FREQUENCIES_16
        : STANDARD_FREQUENCIES_32;

    const q = mode === '10' ? 1.41 : mode === '16' ? 2.5 : 4.3;

    return freqs.map((f, i) => ({
      id: `band_${i}_${f}`,
      frequency: f,
      gain: 0,
      q,
      type: 'peaking',
    }));
  }

  public async initContext(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // 1. Input Node
    this.inputNode = this.ctx.createGain();

    // 2. Dry / Wet Bypass routing
    this.bypassGainDry = this.ctx.createGain();
    this.bypassGainProcessed = this.ctx.createGain();
    this.bypassGainDry.gain.value = 0;
    this.bypassGainProcessed.gain.value = 1;

    // Connect input to dry path
    this.inputNode.connect(this.bypassGainDry);

    // 3. Preamp
    this.preampGainNode = this.ctx.createGain();
    this.setPreamp(this.preampDb);
    this.inputNode.connect(this.preampGainNode);

    // 4. Bass & Treble tone filters
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = this.tone.bassFreq;
    this.bassFilter.gain.value = this.tone.bassGain;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = this.tone.trebleFreq;
    this.trebleFilter.gain.value = this.tone.trebleGain;

    this.preampGainNode.connect(this.bassFilter);
    this.bassFilter.connect(this.trebleFilter);

    // 5. Build EQ filter chain
    this.rebuildEQFilters(this.currentBands);

    // 6. Stereo Widener (Mid-Side matrix)
    this.setupStereoWidener();

    // 7. Compressor / Limiter
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.applyLimiterSettings();

    // Connect last stage of EQ to Compressor
    const lastFilter = this.eqFilters[this.eqFilters.length - 1];
    if (lastFilter) {
      lastFilter.connect(this.compressorNode);
    }

    // 8. Reverb Ambience
    this.setupReverb();

    // 9. Master Volume & Analyser
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.value = this.masterVol;

    this.compressorNode.connect(this.bypassGainProcessed);

    // Merge Dry + Processed to Master
    this.bypassGainProcessed.connect(this.masterGainNode);
    this.bypassGainDry.connect(this.masterGainNode);

    // Analyser Node
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  private setupStereoWidener(): void {
    if (!this.ctx) return;
    // Simple stereo enhancer using ChannelSplitter / ChannelMerger
    // For web audio, standard stereo panning/widening:
    this.splitter = this.ctx.createChannelSplitter(2);
    this.merger = this.ctx.createChannelMerger(2);
    this.midGain = this.ctx.createGain();
    this.sideGain = this.ctx.createGain();

    this.midGain.gain.value = 1.0;
    this.sideGain.gain.value = this.spatial.stereoWidth;
  }

  private setupReverb(): void {
    if (!this.ctx) return;
    // Generate synthetic studio impulse response
    const rate = this.ctx.sampleRate;
    const length = rate * 1.5;
    const decay = 2.0;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = this.spatial.reverbMix;
  }

  public rebuildEQFilters(bands: EQBand[]): void {
    this.currentBands = bands;
    if (!this.ctx || !this.trebleFilter) return;

    // Disconnect old filters
    this.eqFilters.forEach((f) => {
      try {
        f.disconnect();
      } catch {
        // ignore
      }
    });
    this.eqFilters = [];

    let prevNode: AudioNode = this.trebleFilter;

    bands.forEach((b) => {
      if (!this.ctx) return;
      const filter = this.ctx.createBiquadFilter();
      filter.type = b.type;
      filter.frequency.value = b.frequency;
      filter.Q.value = b.q;
      filter.gain.value = b.gain;

      prevNode.connect(filter);
      prevNode = filter;
      this.eqFilters.push(filter);
    });

    if (this.compressorNode) {
      prevNode.connect(this.compressorNode);
    }
  }

  public setBandGain(index: number, gainDb: number): void {
    if (this.currentBands[index]) {
      this.currentBands[index].gain = gainDb;
    }
    const filter = this.eqFilters[index];
    if (filter && this.ctx) {
      filter.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.02);
    }
  }

  public setBandFrequency(index: number, freq: number): void {
    if (this.currentBands[index]) {
      this.currentBands[index].frequency = freq;
    }
    const filter = this.eqFilters[index];
    if (filter && this.ctx) {
      filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
    }
  }

  public setBandQ(index: number, q: number): void {
    if (this.currentBands[index]) {
      this.currentBands[index].q = q;
    }
    const filter = this.eqFilters[index];
    if (filter && this.ctx) {
      filter.Q.setTargetAtTime(q, this.ctx.currentTime, 0.02);
    }
  }

  public setAllBands(bands: EQBand[]): void {
    this.currentBands = bands;
    if (this.eqFilters.length !== bands.length) {
      this.rebuildEQFilters(bands);
    } else {
      bands.forEach((b, i) => {
        this.setBandGain(i, b.gain);
      });
    }
  }

  public setPreamp(db: number): void {
    this.preampDb = db;
    if (this.preampGainNode && this.ctx) {
      const linear = Math.pow(10, db / 20);
      this.preampGainNode.gain.setTargetAtTime(linear, this.ctx.currentTime, 0.02);
    }
  }

  public setTone(settings: Partial<ToneSettings>): void {
    this.tone = { ...this.tone, ...settings };
    if (!this.ctx) return;

    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(this.tone.bassGain, this.ctx.currentTime, 0.02);
      this.bassFilter.frequency.setTargetAtTime(this.tone.bassFreq, this.ctx.currentTime, 0.02);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(this.tone.trebleGain, this.ctx.currentTime, 0.02);
      this.trebleFilter.frequency.setTargetAtTime(this.tone.trebleFreq, this.ctx.currentTime, 0.02);
    }
  }

  public setLimiter(settings: Partial<LimiterSettings>): void {
    this.limiter = { ...this.limiter, ...settings };
    this.applyLimiterSettings();
  }

  private applyLimiterSettings(): void {
    if (!this.compressorNode || !this.ctx) return;
    if (!this.limiter.enabled) {
      // transparent limiter
      this.compressorNode.threshold.setTargetAtTime(0, this.ctx.currentTime, 0.02);
      this.compressorNode.ratio.setTargetAtTime(1, this.ctx.currentTime, 0.02);
    } else {
      this.compressorNode.threshold.setTargetAtTime(this.limiter.threshold, this.ctx.currentTime, 0.02);
      this.compressorNode.knee.setTargetAtTime(this.limiter.knee, this.ctx.currentTime, 0.02);
      this.compressorNode.ratio.setTargetAtTime(this.limiter.ratio, this.ctx.currentTime, 0.02);
      this.compressorNode.attack.setTargetAtTime(this.limiter.attack, this.ctx.currentTime, 0.02);
      this.compressorNode.release.setTargetAtTime(this.limiter.release, this.ctx.currentTime, 0.02);
    }
  }

  public setSpatial(settings: Partial<SpatialSettings>): void {
    this.spatial = { ...this.spatial, ...settings };
    if (this.sideGain && this.ctx) {
      this.sideGain.gain.setTargetAtTime(this.spatial.stereoWidth, this.ctx.currentTime, 0.02);
    }
    if (this.reverbWetGain && this.ctx) {
      this.reverbWetGain.gain.setTargetAtTime(this.spatial.reverbMix, this.ctx.currentTime, 0.02);
    }
    if (this.audioElement) {
      this.audioElement.playbackRate = this.spatial.tempo;
    }
  }

  public setBypass(bypass: boolean): void {
    this.isBypassed = bypass;
    if (!this.ctx || !this.bypassGainDry || !this.bypassGainProcessed) return;

    if (bypass) {
      this.bypassGainDry.gain.setTargetAtTime(1, this.ctx.currentTime, 0.03);
      this.bypassGainProcessed.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    } else {
      this.bypassGainDry.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      this.bypassGainProcessed.gain.setTargetAtTime(1, this.ctx.currentTime, 0.03);
    }
  }

  public setMasterVolume(vol: number): void {
    this.masterVol = vol;
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
    }
  }

  // Calculate composite EQ response for visual curve
  public getCompositeFrequencyResponse(freqCount = 120): { freqs: Float32Array; dbs: Float32Array } {
    const freqs = new Float32Array(freqCount);
    // Logarithmic scale 20Hz to 20,000Hz
    const minF = 20;
    const maxF = 20000;
    for (let i = 0; i < freqCount; i++) {
      freqs[i] = minF * Math.pow(maxF / minF, i / (freqCount - 1));
    }

    const totalMag = new Float32Array(freqCount).fill(1.0);
    const totalPhase = new Float32Array(freqCount);

    if (this.isBypassed) {
      const dbs = new Float32Array(freqCount).fill(0);
      return { freqs, dbs };
    }

    // Multiply preamp
    const preampLinear = Math.pow(10, this.preampDb / 20);
    for (let i = 0; i < freqCount; i++) {
      totalMag[i] *= preampLinear;
    }

    const tempMag = new Float32Array(freqCount);
    const tempPhase = new Float32Array(freqCount);

    // Bass tone filter response
    if (this.bassFilter) {
      this.bassFilter.getFrequencyResponse(freqs, tempMag, tempPhase);
      for (let i = 0; i < freqCount; i++) {
        totalMag[i] *= tempMag[i];
      }
    }

    // Treble tone filter response
    if (this.trebleFilter) {
      this.trebleFilter.getFrequencyResponse(freqs, tempMag, tempPhase);
      for (let i = 0; i < freqCount; i++) {
        totalMag[i] *= tempMag[i];
      }
    }

    // Band filters response
    this.eqFilters.forEach((filter) => {
      filter.getFrequencyResponse(freqs, tempMag, tempPhase);
      for (let i = 0; i < freqCount; i++) {
        totalMag[i] *= tempMag[i];
      }
    });

    const dbs = new Float32Array(freqCount);
    for (let i = 0; i < freqCount; i++) {
      dbs[i] = 20 * Math.log10(Math.max(totalMag[i], 1e-4));
    }

    return { freqs, dbs };
  }

  // Real-time Analyser data
  public getByteFrequencyData(targetArray: Uint8Array<ArrayBuffer>): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(targetArray);
    }
  }

  public getByteTimeDomainData(targetArray: Uint8Array<ArrayBuffer>): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(targetArray);
    }
  }

  public getGainReduction(): number {
    if (this.compressorNode && this.limiter.enabled) {
      return this.compressorNode.reduction;
    }
    return 0;
  }

  // --- AUDIO SOURCES ---

  // 1. Synthetic Groove Generator (Runs directly inside Web Audio Context)
  public async playSyntheticTrack(trackId: string): Promise<void> {
    await this.initContext();
    this.stopAllSources();
    this.synthTrackId = trackId;
    this.isSynthPlaying = true;
    this.currentSourceType = 'synth';
    this.synthStep = 0;

    // Tempo in ms (120 bpm = 125ms 16th note)
    const bpm = trackId === 'sub_rumble' ? 90 : trackId === 'electro_groove' ? 128 : 110;
    const intervalMs = (60 / bpm / 4) * 1000;

    this.synthInterval = window.setInterval(() => {
      if (!this.isSynthPlaying || !this.ctx || !this.inputNode) return;
      this.renderSynthStep(this.synthStep, this.synthTrackId);
      this.synthStep = (this.synthStep + 1) % 32;
    }, intervalMs);
  }

  private renderSynthStep(step: number, trackId: string): void {
    if (!this.ctx || !this.inputNode) return;
    const now = this.ctx.currentTime;

    // Bass notes progression
    const bassScale = [43.65, 43.65, 51.91, 58.27, 43.65, 65.41, 58.27, 49.0]; // F1, G#1, A#1 etc.
    const noteFreq = bassScale[Math.floor(step / 4) % bassScale.length];

    // Kick / 808 Sub Kick on steps 0, 4, 8, 12, 16, 20, 24, 28
    if (step % 8 === 0 || (trackId === 'electro_groove' && step % 4 === 0)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (trackId === 'sub_rumble' ? 0.45 : 0.22));

      osc.connect(gain);
      gain.connect(this.inputNode);
      osc.start(now);
      osc.stop(now + 0.5);
    }

    // Snare / Clap on step 4, 12, 20, 28
    if (step % 8 === 4) {
      // Noise burst
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1200;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      gain.connect(this.inputNode);
      noise.start(now);
    }

    // Hi-hats on off-beats
    if (step % 2 === 1 || trackId === 'electro_groove') {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }
      const hat = this.ctx.createBufferSource();
      hat.buffer = buffer;
      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.value = 7500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(step % 4 === 2 ? 0.35 : 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      hat.connect(hatFilter);
      hatFilter.connect(gain);
      gain.connect(this.inputNode);
      hat.start(now);
    }

    // Deep Synth Bassline (Great for testing 31Hz - 250Hz bands!)
    if (step % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = trackId === 'synth_bass' ? 'sawtooth' : 'triangle';
      bassOsc.frequency.setValueAtTime(noteFreq, now);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(trackId === 'synth_bass' ? 650 : 350, now);

      bassGain.gain.setValueAtTime(0.5, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.inputNode);
      bassOsc.start(now);
      bassOsc.stop(now + 0.25);
    }

    // Synth chord pad on step 0, 8, 16, 24
    if (step % 8 === 0) {
      const chordFreqs = [noteFreq * 2, noteFreq * 2.5, noteFreq * 3];
      chordFreqs.forEach((f) => {
        if (!this.ctx || !this.inputNode) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(g);
        g.connect(this.inputNode);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    }
  }

  // 2. Play File from Mobile Device (MP3, WAV, etc.)
  public async playFile(file: File): Promise<HTMLAudioElement> {
    await this.initContext();
    this.stopAllSources();

    const url = URL.createObjectURL(file);
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.loop = true;
    }

    this.audioElement.src = url;
    this.audioElement.playbackRate = this.spatial.tempo;

    if (!this.mediaElementSource && this.ctx && this.inputNode) {
      this.mediaElementSource = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaElementSource.connect(this.inputNode);
    }

    await this.audioElement.play();
    this.currentSourceType = 'file';
    return this.audioElement;
  }

  // 3. Microphone Passthrough Mode
  public async enableMicrophone(): Promise<void> {
    await this.initContext();
    this.stopAllSources();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported on this browser');
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    if (this.ctx && this.inputNode) {
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.inputNode);
    }
    this.currentSourceType = 'mic';
  }

  // 4. System / Streaming Apps Capture (YouTube, Spotify, Other Players)
  public async enableSystemAudioCapture(): Promise<void> {
    await this.initContext();
    this.stopAllSources();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error(
        'System audio capture is not supported by this browser. Use Chrome on Android with desktop site or a PWA loopback.'
      );
    }

    try {
      this.systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Check if audio track exists
      const audioTracks = this.systemStream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.stopAllSources();
        throw new Error('No audio track selected. Make sure to check "Share audio" when selecting the tab or app!');
      }

      // Stop video tracks to save phone battery & CPU
      this.systemStream.getVideoTracks().forEach((vt) => vt.stop());

      if (this.ctx && this.inputNode) {
        this.systemSource = this.ctx.createMediaStreamSource(this.systemStream);
        this.systemSource.connect(this.inputNode);
      }
      this.currentSourceType = 'system';
    } catch (err) {
      this.stopAllSources();
      throw err;
    }
  }

  // Haptic feedback trigger (tactile clicks on mobile knobs & sliders)
  public triggerHaptic(duration = 6): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // ignore
      }
    }
  }

  // WakeLock API to keep phone screen awake
  public async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
    }
  }

  public stopAllSources(): void {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.isSynthPlaying = false;

    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {
        // ignore
      }
      this.micSource = null;
    }

    if (this.systemStream) {
      this.systemStream.getTracks().forEach((t) => t.stop());
      this.systemStream = null;
    }

    if (this.systemSource) {
      try {
        this.systemSource.disconnect();
      } catch {
        // ignore
      }
      this.systemSource = null;
    }

    this.currentSourceType = 'none';
  }

  public resumeAudioContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getCurrentSourceType(): 'synth' | 'file' | 'mic' | 'system' | 'none' {
    return this.currentSourceType;
  }

  public getIsPlaying(): boolean {
    if (this.currentSourceType === 'synth') return this.isSynthPlaying;
    if (this.currentSourceType === 'file' && this.audioElement) {
      return !this.audioElement.paused;
    }
    if (this.currentSourceType === 'mic' || this.currentSourceType === 'system') return true;
    return false;
  }
}

export const audioEngine = new AudioEngine();
