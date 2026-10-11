import { FilterMode, AcousticTelemetry } from '../types/stethoscope';
import { synthesizeAuscultationAudio } from './audioSynthesis';

export class StethoscopeAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: AudioNode | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private micStream: MediaStream | null = null;

  // Filter chain
  private biquadFilter1: BiquadFilterNode | null = null;
  private biquadFilter2: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private currentFilterMode: FilterMode = 'bell';
  private currentVolume: number = 2.0; // Stethoscopes need standard amplification
  private isMuted: boolean = false;

  // Telemetry smoothing
  private beatDetectorPeaks: number[] = [];
  private lastPeakTime: number = 0;
  private estimatedRate: number = 72;
  private smoothedPeakFreq: number = 80;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public async initAudioContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    this.setupProcessingChain();
    return this.audioCtx;
  }

  private setupProcessingChain() {
    if (!this.audioCtx) return;

    // Filter 1
    this.biquadFilter1 = this.audioCtx.createBiquadFilter();
    // Filter 2 for steeper acoustic rolloff
    this.biquadFilter2 = this.audioCtx.createBiquadFilter();
    // Gain / Volume
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.currentVolume;
    // Analyser Node
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.applyFilterConfiguration(this.currentFilterMode);

    // Chain: Source -> Filter1 -> Filter2 -> Gain -> Analyser -> Destination
    this.biquadFilter1.connect(this.biquadFilter2);
    this.biquadFilter2.connect(this.gainNode);
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);
  }

  public setFilterMode(mode: FilterMode) {
    this.currentFilterMode = mode;
    this.applyFilterConfiguration(mode);
  }

  private applyFilterConfiguration(mode: FilterMode) {
    if (!this.biquadFilter1 || !this.biquadFilter2) return;

    switch (mode) {
      case 'bell':
        // Bell: Low frequencies 20 - 220 Hz (S1, S2, S3, S4, mitral rumble)
        this.biquadFilter1.type = 'lowpass';
        this.biquadFilter1.frequency.value = 220;
        this.biquadFilter1.Q.value = 1.0;

        this.biquadFilter2.type = 'highpass';
        this.biquadFilter2.frequency.value = 25;
        this.biquadFilter2.Q.value = 0.7;
        break;

      case 'diaphragm':
        // Diaphragm: High frequencies 100 - 1200 Hz (Lung sounds, wheezes, crackles, regurgitant murmurs)
        this.biquadFilter1.type = 'highpass';
        this.biquadFilter1.frequency.value = 110;
        this.biquadFilter1.Q.value = 0.8;

        this.biquadFilter2.type = 'lowpass';
        this.biquadFilter2.frequency.value = 1200;
        this.biquadFilter2.Q.value = 0.7;
        break;

      case 'extended':
        // Extended: Wideband 20 - 2500 Hz
        this.biquadFilter1.type = 'highpass';
        this.biquadFilter1.frequency.value = 20;
        this.biquadFilter1.Q.value = 0.5;

        this.biquadFilter2.type = 'lowpass';
        this.biquadFilter2.frequency.value = 2500;
        this.biquadFilter2.Q.value = 0.5;
        break;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(volume, 5.0));
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.currentVolume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.currentVolume;
    }
    return this.isMuted;
  }

  public async playPreset(presetId: string, loop: boolean = true): Promise<void> {
    await this.initAudioContext();
    this.stopCurrentSource();

    if (!this.audioCtx || !this.biquadFilter1) return;

    const buffer = synthesizeAuscultationAudio(this.audioCtx, presetId, 10);
    this.bufferSource = this.audioCtx.createBufferSource();
    this.bufferSource.buffer = buffer;
    this.bufferSource.loop = loop;
    this.bufferSource.connect(this.biquadFilter1);
    this.bufferSource.start();
    this.sourceNode = this.bufferSource;
  }

  public async playCustomAudioBuffer(buffer: AudioBuffer, loop: boolean = true): Promise<void> {
    await this.initAudioContext();
    this.stopCurrentSource();

    if (!this.audioCtx || !this.biquadFilter1) return;

    this.bufferSource = this.audioCtx.createBufferSource();
    this.bufferSource.buffer = buffer;
    this.bufferSource.loop = loop;
    this.bufferSource.connect(this.biquadFilter1);
    this.bufferSource.start();
    this.sourceNode = this.bufferSource;
  }

  public async startMicrophone(): Promise<void> {
    await this.initAudioContext();
    this.stopCurrentSource();

    if (!this.audioCtx || !this.biquadFilter1) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      micSource.connect(this.biquadFilter1);
      this.sourceNode = micSource;
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      throw err;
    }
  }

  public stopCurrentSource() {
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch (e) {
        // Source might already have stopped
      }
      this.bufferSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Disconnect safe
      }
      this.sourceNode = null;
    }
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  // Telemetry computation (live BPM/rate, dB level, peak frequency, seal quality)
  public computeLiveTelemetry(category: 'heart' | 'lung', defaultRate: number = 72): AcousticTelemetry {
    if (!this.analyserNode || !this.audioCtx) {
      return {
        rate: defaultRate,
        rhythm: 'Regular',
        peakFrequencyHz: category === 'heart' ? 80 : 320,
        snrDb: 18,
        audioLevelDb: -60,
        sealQuality: 'Optimal',
        anomalyFlag: false,
        isPlaying: false,
        durationSeconds: 0,
      };
    }

    const timeBuffer = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(timeBuffer);

    const freqBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(freqBuffer);

    // Calculate RMS & Decibel Level
    let sumSquares = 0;
    for (let i = 0; i < timeBuffer.length; i++) {
      sumSquares += timeBuffer[i] * timeBuffer[i];
    }
    const rms = Math.sqrt(sumSquares / timeBuffer.length);
    const audioLevelDb = Math.round(20 * Math.log10(Math.max(rms, 0.0001)));

    // Find Peak Frequency
    let maxBinVal = 0;
    let maxBinIdx = 0;
    for (let i = 2; i < freqBuffer.length; i++) {
      if (freqBuffer[i] > maxBinVal) {
        maxBinVal = freqBuffer[i];
        maxBinIdx = i;
      }
    }
    const binHz = (this.audioCtx.sampleRate / 2) / freqBuffer.length;
    const peakFreq = Math.round(maxBinIdx * binHz);
    this.smoothedPeakFreq = Math.round(this.smoothedPeakFreq * 0.85 + peakFreq * 0.15);

    // Simple peak detection for beat estimation
    const now = this.audioCtx.currentTime;
    const threshold = category === 'heart' ? 0.22 : 0.15;
    if (rms > threshold && now - this.lastPeakTime > (category === 'heart' ? 0.35 : 1.2)) {
      this.beatDetectorPeaks.push(now);
      this.lastPeakTime = now;
      if (this.beatDetectorPeaks.length > 8) {
        this.beatDetectorPeaks.shift();
      }

      if (this.beatDetectorPeaks.length >= 3) {
        const intervals: number[] = [];
        for (let j = 1; j < this.beatDetectorPeaks.length; j++) {
          intervals.push(this.beatDetectorPeaks[j] - this.beatDetectorPeaks[j - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avgInterval > 0) {
          const rawRate = Math.round(60 / avgInterval);
          if (category === 'heart' && rawRate >= 45 && rawRate <= 180) {
            this.estimatedRate = Math.round(this.estimatedRate * 0.7 + rawRate * 0.3);
          } else if (category === 'lung' && rawRate >= 10 && rawRate <= 40) {
            this.estimatedRate = Math.round(this.estimatedRate * 0.7 + rawRate * 0.3);
          }
        }
      }
    }

    // Seal quality calculation
    let sealQuality: 'Optimal' | 'Acceptable' | 'Poor Seal' | 'Excessive Ambient Noise' = 'Optimal';
    if (audioLevelDb < -45) {
      sealQuality = 'Poor Seal';
    } else if (audioLevelDb > -8) {
      sealQuality = 'Excessive Ambient Noise';
    } else if (audioLevelDb < -35) {
      sealQuality = 'Acceptable';
    }

    const isPlaying = Boolean(this.sourceNode);

    return {
      rate: this.estimatedRate || defaultRate,
      rhythm: Math.abs(this.estimatedRate - defaultRate) > 15 ? 'Mildly Irregular' : 'Regular',
      peakFrequencyHz: this.smoothedPeakFreq || (category === 'heart' ? 95 : 340),
      snrDb: Math.min(32, Math.max(12, Math.round(audioLevelDb + 48))),
      audioLevelDb,
      sealQuality,
      anomalyFlag: false,
      isPlaying,
      durationSeconds: now,
    };
  }

  public dispose() {
    this.stopCurrentSource();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const stethoscopeEngine = new StethoscopeAudioEngine();
