import React, { useRef } from 'react';
import { SoundPreset, SoundCategory } from '../types/stethoscope';
import { SOUND_PRESETS } from '../data/auscultationData';
import {
  Volume2,
  Square,
  AlertCircle,
  CheckCircle,
  Upload,
  FileAudio,
  Radio
} from 'lucide-react';

interface PresetsSelectorProps {
  category: SoundCategory;
  activePresetId: string | null;
  isPlaying: boolean;
  onSelectPreset: (preset: SoundPreset) => void;
  onStopAudio: () => void;
  onCustomAudioUpload: (file: File) => void;
}

export const PresetsSelector: React.FC<PresetsSelectorProps> = ({
  category,
  activePresetId,
  isPlaying,
  onSelectPreset,
  onStopAudio,
  onCustomAudioUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPresets = SOUND_PRESETS.filter(
    (preset) => preset.category === category
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCustomAudioUpload(file);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            {category === 'heart' ? 'Cardiac Sound Library' : 'Pulmonary Sound Library'}
          </h3>
        </div>

        {/* Upload Audio File CTA */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload Stethoscope WAV/MP3
          </button>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredPresets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const isCurrentlyPlaying = isActive && isPlaying;

          return (
            <div
              key={preset.id}
              onClick={() => {
                if (isCurrentlyPlaying) {
                  onStopAudio();
                } else {
                  onSelectPreset(preset);
                }
              }}
              className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-950/90 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {preset.title}
                </span>

                {preset.anomalyDetected ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-950/50 text-rose-300 border border-rose-800/60 flex items-center gap-1 shrink-0">
                    <AlertCircle className="w-2.5 h-2.5" /> Pathological
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 shrink-0">
                    <CheckCircle className="w-2.5 h-2.5" /> Normal
                  </span>
                )}
              </div>

              <div className="text-[11px] font-medium text-cyan-400/90 mb-1">
                {preset.subtitle}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {preset.description}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                <span>{preset.typicalRate} {preset.category === 'heart' ? 'BPM' : 'br/m'}</span>
                <span>{preset.frequencyRange}</span>

                <div
                  className={`flex items-center gap-1 font-bold ${
                    isCurrentlyPlaying ? 'text-rose-400' : 'text-cyan-400'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-rose-400" /> Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" /> Listen
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
