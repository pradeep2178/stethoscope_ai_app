import React from 'react';
import {
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sliders,
  Heart,
  Wind,
  FolderOpen,
  History,
  UserCheck
} from 'lucide-react';
import { FilterMode, SoundCategory } from '../types/stethoscope';

interface HeaderProps {
  category: SoundCategory;
  onCategoryChange: (cat: SoundCategory) => void;
  activeInput: 'preset' | 'mic' | 'file';
  onInputChange: (input: 'preset' | 'mic' | 'file') => void;
  filterMode: FilterMode;
  onFilterChange: (mode: FilterMode) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  onOpenHistory: () => void;
  onOpenPatientModal: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  category,
  onCategoryChange,
  activeInput,
  onInputChange,
  filterMode,
  onFilterChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isMicActive,
  onToggleMic,
  onOpenHistory,
  onOpenPatientModal,
  historyCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Modality Switch */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Activity className="w-5 h-5 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Stethoscope<span className="text-cyan-400">AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider bg-cyan-950/80 text-cyan-300 rounded border border-cyan-800/60">
                  PCG 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Digital Acoustic Auscultation & Diagnostic Telemetry
              </p>
            </div>
          </div>

          {/* Heart / Lung Modality Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onCategoryChange('heart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'heart'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${category === 'heart' ? 'text-rose-400 fill-rose-500/20' : ''}`} />
              Cardiac
            </button>
            <button
              onClick={() => onCategoryChange('lung')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === 'lung'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className={`w-3.5 h-3.5 ${category === 'lung' ? 'text-sky-400' : ''}`} />
              Pulmonary
            </button>
          </div>
        </div>

        {/* Central Audio Filter Selection (Bell vs Diaphragm) */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-2 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Sliders className="w-3 h-3 text-cyan-400" /> Filter:
          </span>
          <button
            onClick={() => onFilterChange('bell')}
            title="Bell Mode: 20-220 Hz low-pitch filter for heart gallops, murmurs, and diastolic sounds"
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterMode === 'bell'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bell (20-220Hz)
          </button>
          <button
            onClick={() => onFilterChange('diaphragm')}
            title="Diaphragm Mode: 100-1200 Hz high-pitch filter for lung sounds, wheezes, crackles, and regurgitant murmurs"
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterMode === 'diaphragm'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Diaphragm (100-1200Hz)
          </button>
          <button
            onClick={() => onFilterChange('extended')}
            title="Extended Wideband Mode: 20-2500 Hz full acoustic capture"
            className={`px-2.5 py-1 rounded-md font-medium transition-all hidden lg:block ${
              filterMode === 'extended'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wideband
          </button>
        </div>

        {/* Audio Controls & Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Live Mic Toggle */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isMicActive
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {isMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isMicActive ? 'Stop Mic' : 'Live Mic'}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title={`Gain: ${Math.round(volume * 100)}%`}
            />
            <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Patient Details */}
          <button
            onClick={onOpenPatientModal}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Patient Context & Clinical Metadata"
          >
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </button>

          {/* History Records */}
          <button
            onClick={onOpenHistory}
            className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Auscultation History Log"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
