import React from 'react';
import { AuscultationSite, SoundCategory } from '../types/stethoscope';
import { AUSCULTATION_SITES } from '../data/auscultationData';
import { MapPin, Info, CheckCircle2 } from 'lucide-react';

interface AnatomyMapProps {
  category: SoundCategory;
  selectedSite: AuscultationSite;
  onSelectSite: (site: AuscultationSite) => void;
}

export const AnatomyMap: React.FC<AnatomyMapProps> = ({
  category,
  selectedSite,
  onSelectSite,
}) => {
  const visibleSites = AUSCULTATION_SITES.filter(
    (site) => site.category === category
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Anatomical Landmark Guide
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          {category === 'heart' ? 'Cardiac 5-Point Exam' : 'Pulmonary Zones'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Chest Anatomy Schematic */}
        <div className="md:col-span-6 relative w-full aspect-[4/3] max-w-sm mx-auto bg-slate-950 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden">
          {/* Subtle Torso & Ribcage SVG Background */}
          <svg
            viewBox="0 0 200 220"
            className="w-full h-full text-slate-800/40 pointer-events-none select-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* Clavicles */}
            <path d="M 50 40 Q 100 50 150 40" strokeWidth="2.5" stroke="#334155" />
            {/* Sternum / Manubrium */}
            <path d="M 100 48 L 100 135" strokeWidth="3" stroke="#475569" />
            <ellipse cx="100" cy="52" rx="10" ry="7" fill="#1e293b" />
            <path d="M 96 135 L 100 148 L 104 135 Z" fill="#475569" />

            {/* Ribcage arcs */}
            <path d="M 100 60 Q 60 70 35 90" stroke="#1e293b" />
            <path d="M 100 60 Q 140 70 165 90" stroke="#1e293b" />
            <path d="M 100 80 Q 55 95 30 115" stroke="#1e293b" />
            <path d="M 100 80 Q 145 95 170 115" stroke="#1e293b" />
            <path d="M 100 100 Q 55 118 35 140" stroke="#1e293b" />
            <path d="M 100 100 Q 145 118 165 140" stroke="#1e293b" />
            <path d="M 100 120 Q 65 140 45 165" stroke="#1e293b" />
            <path d="M 100 120 Q 135 140 155 165" stroke="#1e293b" />

            {/* Heart silhouette (if cardiac mode) */}
            {category === 'heart' && (
              <path
                d="M 100 65 C 80 50, 60 75, 80 105 C 90 120, 115 140, 125 145 C 135 130, 145 105, 130 80 C 120 65, 105 75, 100 65 Z"
                fill="rgba(244, 63, 94, 0.08)"
                stroke="rgba(244, 63, 94, 0.25)"
                strokeDasharray="3 3"
              />
            )}

            {/* Lung contours (if pulmonary mode) */}
            {category === 'lung' && (
              <>
                <path
                  d="M 55 45 C 40 75, 30 130, 45 175 C 60 180, 85 165, 85 130 C 85 85, 75 55, 55 45 Z"
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="rgba(56, 189, 248, 0.25)"
                  strokeDasharray="3 3"
                />
                <path
                  d="M 145 45 C 160 75, 170 130, 155 175 C 140 180, 115 165, 115 130 C 115 85, 125 55, 145 45 Z"
                  fill="rgba(56, 189, 248, 0.08)"
                  stroke="rgba(56, 189, 248, 0.25)"
                  strokeDasharray="3 3"
                />
              </>
            )}
          </svg>

          {/* Interactive Auscultation Target Nodes */}
          {visibleSites.map((site) => {
            const isSelected = selectedSite.id === site.id;
            return (
              <button
                key={site.id}
                onClick={() => onSelectSite(site)}
                style={{
                  left: `${site.coords.x}%`,
                  top: `${site.coords.y}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center transition-all ${
                  isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                }`}
                title={`${site.name} — ${site.anatomicalLocation}`}
              >
                {/* Ping rings if selected */}
                {isSelected && (
                  <span className="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono shadow-lg transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 ring-4 ring-cyan-400/30 shadow-cyan-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-400 hover:text-white'
                  }`}
                >
                  {site.shortName}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Landmark Clinical Card */}
        <div className="md:col-span-6 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
                Targeted Auscultation Position
              </div>
              <h4 className="text-base font-extrabold text-white mt-0.5">
                {selectedSite.name}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700">
              Filter: {selectedSite.recommendedFilter}
            </span>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            <strong className="text-slate-400">Anatomical Landmark:</strong>{' '}
            {selectedSite.anatomicalLocation}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-semibold block mb-0.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Clinical Significance:
            </span>
            {selectedSite.clinicalSignificance}
          </div>

          <div className="text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Expected Normal Acoustics:</strong> {selectedSite.expectedNormal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
