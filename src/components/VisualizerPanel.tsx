import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Pause,
  Play,
  Volume2,
  Waves,
  ShieldCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { AcousticTelemetry, FilterMode, SoundCategory } from '../types/stethoscope';
import { stethoscopeEngine } from '../utils/audioEngine';

interface VisualizerPanelProps {
  telemetry: AcousticTelemetry;
  category: SoundCategory;
  filterMode: FilterMode;
  currentSiteName: string;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  telemetry,
  category,
  filterMode,
  currentSiteName,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'pcg' | 'fft'>('both');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  const pcgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // History buffer for scrolling Phonocardiogram (PCG)
  const historyBufferRef = useRef<number[]>([]);
  const maxHistoryPoints = 800;

  useEffect(() => {
    const renderLoop = () => {
      const analyser = stethoscopeEngine.getAnalyserNode();

      if (analyser && !isFrozen) {
        // Time domain for PCG
        const timeData = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(timeData);

        // Subsample for smooth scrolling PCG
        let subSample = 0;
        const step = Math.floor(timeData.length / 16);
        for (let i = 0; i < timeData.length; i += step) {
          subSample = timeData[i];
          historyBufferRef.current.push(subSample);
          if (historyBufferRef.current.length > maxHistoryPoints) {
            historyBufferRef.current.shift();
          }
        }

        // Draw PCG
        if (pcgCanvasRef.current) {
          drawPcgWaveform(pcgCanvasRef.current, historyBufferRef.current, category);
        }

        // Frequency domain for FFT
        if (fftCanvasRef.current) {
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(freqData);
          drawFftSpectrum(fftCanvasRef.current, freqData, filterMode);
        }
      } else if (!analyser) {
        // Idle ambient animation
        if (pcgCanvasRef.current) {
          drawIdlePcg(pcgCanvasRef.current, category);
        }
        if (fftCanvasRef.current) {
          drawIdleFft(fftCanvasRef.current);
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFrozen, category, filterMode]);

  const drawPcgWaveform = (
    canvas: HTMLCanvasElement,
    buffer: number[],
    cat: SoundCategory
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Clear background
    ctx.fillStyle = '#030712'; // deep slate
    ctx.fillRect(0, 0, width, height);

    // Draw clinical medical grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0f172a';
    const gridStepX = 40;
    const gridStepY = 25;

    for (let x = 0; x < width; x += gridStepX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStepY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Midline baseline
    ctx.strokeStyle = '#1e293b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (buffer.length < 2) return;

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = cat === 'heart' ? '#06b6d4' : '#38bdf8';

    // PCG Waveform line
    ctx.beginPath();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = cat === 'heart' ? '#22d3ee' : '#38bdf8';

    const dx = width / maxHistoryPoints;
    const startIndex = maxHistoryPoints - buffer.length;

    for (let i = 0; i < buffer.length; i++) {
      const x = (startIndex + i) * dx;
      // Scale amplitude nicely
      const amp = buffer[i] * (height * 0.44);
      const y = midY - amp;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw S1 / S2 Detection Markers for Heart
    if (cat === 'heart') {
      ctx.fillStyle = '#22d3ee';
      ctx.font = '10px JetBrains Mono, monospace';
      for (let i = 1; i < buffer.length - 1; i += 6) {
        const val = Math.abs(buffer[i]);
        if (val > 0.45 && buffer[i] > buffer[i - 1] && buffer[i] > buffer[i + 1]) {
          const x = (startIndex + i) * dx;
          ctx.beginPath();
          ctx.arc(x, 15, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Sweep cursor line
    const currentX = (startIndex + buffer.length - 1) * dx;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();
  };

  const drawFftSpectrum = (
    canvas: HTMLCanvasElement,
    freqData: Uint8Array,
    filter: FilterMode
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0f172a';
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Number of display bins (focus on 20Hz - 2000Hz)
    const numBars = 64;
    const barWidth = width / numBars;
    const binRatio = Math.floor(freqData.length / numBars / 2);

    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let k = 0; k < binRatio; k++) {
        sum += freqData[i * binRatio + k] || 0;
      }
      const avg = sum / binRatio;
      const barHeight = (avg / 255) * (height - 20);

      // Gradient color based on intensity
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, '#0284c7');
      gradient.addColorStop(0.6, '#06b6d4');
      gradient.addColorStop(1, avg > 180 ? '#f43f5e' : '#38bdf8');

      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
    }

    // Filter Passband Indicator Overlay
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    if (filter === 'bell') {
      // 20-220 Hz is approximately first 25% of spectrum
      ctx.fillRect(0, 0, width * 0.28, height);
      ctx.strokeStyle = '#06b6d4';
      ctx.strokeRect(0, 0, width * 0.28, height);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('BELL PASSBAND (20-220 Hz)', 8, 14);
    } else if (filter === 'diaphragm') {
      // 100-1200 Hz is approx 15% to 75%
      ctx.fillRect(width * 0.12, 0, width * 0.65, height);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(width * 0.12, 0, width * 0.65, height);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('DIAPHRAGM PASSBAND (100-1200 Hz)', width * 0.14, 14);
    }
  };

  const drawIdlePcg = (canvas: HTMLCanvasElement, cat: SoundCategory) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('STANDBY — Select a clinical preset or activate Live Microphone to visualize phonocardiogram', width / 2, height / 2 - 8);
    ctx.textAlign = 'left';
  };

  const drawIdleFft = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#475569';
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Awaiting acoustic input for FFT frequency analysis', width / 2, height / 2);
    ctx.textAlign = 'left';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Visualizer Top Bar & Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {/* Rate Tile */}
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${category === 'heart' ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">
                {category === 'heart' ? 'Heart Rate' : 'Resp Rate'}
              </div>
              <div className="text-lg font-extrabold font-mono text-white tracking-tight">
                {telemetry.rate}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  {category === 'heart' ? 'BPM' : 'br/m'}
                </span>
              </div>
            </div>
          </div>

          {/* Rhythm Cadence Tile */}
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Rhythm</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                {telemetry.rhythm}
              </div>
            </div>
          </div>

          {/* Peak Frequency Tile */}
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Dominant Freq</div>
              <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                {telemetry.peakFrequencyHz} Hz
              </div>
            </div>
          </div>

          {/* Stethoscope Seal Quality */}
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${telemetry.sealQuality === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {telemetry.sealQuality === 'Optimal' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Contact Seal</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                {telemetry.sealQuality}
              </div>
            </div>
          </div>
        </div>

        {/* View Controls & Freeze */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'both' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual View
            </button>
            <button
              onClick={() => setViewMode('pcg')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'pcg' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              PCG Only
            </button>
            <button
              onClick={() => setViewMode('fft')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'fft' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              FFT Only
            </button>
          </div>

          <button
            onClick={() => setIsFrozen(!isFrozen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isFrozen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isFrozen ? 'Resume' : 'Freeze Wave'}
          </button>
        </div>
      </div>

      {/* Auscultation Active Site Banner */}
      <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800/60 text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Auscultation Site: <strong className="text-cyan-300 font-sans">{currentSiteName}</strong>
        </span>
        <span className="hidden sm:inline">
          Filter: <strong className="text-slate-200 capitalize">{filterMode} mode</strong> | SNR: <strong className="text-emerald-400">{telemetry.snrDb} dB</strong>
        </span>
      </div>

      {/* Waveform Canvases */}
      <div className="grid grid-cols-1 gap-3">
        {/* Phonocardiogram (PCG) Oscilloscope Canvas */}
        {(viewMode === 'both' || viewMode === 'pcg') && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900/90 text-cyan-400 border border-cyan-800/60">
                Phonocardiogram (PCG) Waveform
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                Time (s) vs Amplitude (mV)
              </span>
            </div>
            {isFrozen && (
              <div className="absolute top-2 right-3 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                FROZEN FOR CALIPER INSPECTION
              </div>
            )}
            <canvas
              ref={pcgCanvasRef}
              width={1000}
              height={180}
              className="w-full h-44 block"
            />
          </div>
        )}

        {/* FFT Frequency Spectrum Canvas */}
        {(viewMode === 'both' || viewMode === 'fft') && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900/90 text-sky-400 border border-sky-800/60">
                FFT Frequency Spectrum
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                20 Hz - 2000 Hz Spectral Distribution
              </span>
            </div>
            <canvas
              ref={fftCanvasRef}
              width={1000}
              height={110}
              className="w-full h-28 block"
            />
          </div>
        )}
      </div>
    </div>
  );
};
