import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookmarkPlus,
  Printer,
  ChevronRight,
  Stethoscope,
  Clock,
  HelpCircle,
  Activity
} from 'lucide-react';
import { AiDiagnosticAnalysis, SoundCategory, FilterMode } from '../types/stethoscope';

interface AiDiagnosisCardProps {
  category: SoundCategory;
  activePresetTitle: string;
  currentSiteName: string;
  filterMode: FilterMode;
  analysis: AiDiagnosticAnalysis | null;
  isLoading: boolean;
  onRunAnalysis: () => void;
  onSaveRecord: () => void;
  isSaved: boolean;
}

export const AiDiagnosisCard: React.FC<AiDiagnosisCardProps> = ({
  category,
  activePresetTitle,
  currentSiteName,
  filterMode,
  analysis,
  isLoading,
  onRunAnalysis,
  onSaveRecord,
  isSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'acoustics' | 'differentials' | 'recommendations'>('summary');

  const printReport = () => {
    window.print();
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Normal Physiological
          </span>
        );
      case 'Borderline / Minor Anomaly':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" /> Borderline / Monitor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3.5 h-3.5" /> Pathological / Abnormality
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header & Trigger CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              AI Auscultation Diagnostics
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Gemini 3.8 Flash Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Acoustic phonocardiogram analysis & clinical auscultation evaluation
            </p>
          </div>
        </div>

        <button
          onClick={onRunAnalysis}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase font-mono tracking-wider transition-all shadow-lg ${
            isLoading
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 ring-2 ring-cyan-400/30 hover:scale-[1.02]'
          }`}
        >
          {isLoading ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-cyan-400" />
              Analyzing Auscultation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run AI Diagnostic Evaluation
            </>
          )}
        </button>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center gap-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
            <Stethoscope className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">Extracting Acoustic Telemetry</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Filtering frequencies, verifying S1/S2 closure transients, analyzing systolic murmurs, and consulting medical auscultation knowledge base...
            </p>
          </div>
        </div>
      )}

      {/* Analysis Result Display */}
      {!isLoading && analysis && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Top Impression Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {getClassificationBadge(analysis.classification)}
                <span className="text-xs font-mono text-slate-400">
                  Confidence: <strong className="text-cyan-400">{analysis.confidenceScore}%</strong>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Urgency: <strong className="text-slate-200">{analysis.urgencyLevel}</strong>
                </span>
              </div>
              <h4 className="text-lg font-extrabold text-white mt-1">
                {analysis.primaryFinding}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                {analysis.diagnosticSummary}
              </p>
            </div>

            {/* Quick Actions (Save Exam, Print) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onSaveRecord}
                disabled={isSaved}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {isSaved ? 'Exam Saved' : 'Save Record'}
              </button>
              <button
                onClick={printReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-all"
                title="Print Clinical Summary"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-xs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'summary'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostic Impression
            </button>
            <button
              onClick={() => setActiveTab('acoustics')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'acoustics'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Acoustic Breakdown
            </button>
            <button
              onClick={() => setActiveTab('differentials')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'differentials'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Differential Diagnoses ({analysis.differentialDiagnoses.length})
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clinical Recommendations ({analysis.clinicalRecommendations.length})
            </button>
          </div>

          {/* Tab 1: Impression & Technique Tip */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Examination Telemetry Details
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mt-1">
                  <div>
                    <span className="text-slate-500 block">Modality:</span>
                    <strong>{category === 'heart' ? 'Cardiac PCG' : 'Pulmonary Auscultation'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Auscultation Site:</span>
                    <strong>{currentSiteName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Acoustic Filter:</span>
                    <strong className="capitalize">{filterMode} Mode</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Audio Sample:</span>
                    <strong>{activePresetTitle}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Stethoscope Repositioning Tip
                </span>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {analysis.stethoscopeRepositioningTip}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Detailed Acoustic Breakdown */}
          {activeTab === 'acoustics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Fundamental Components
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysis.acousticDetails.fundamentalSounds}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                  Adventitious Murmurs / Gallops / Sounds
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysis.acousticDetails.adventitiousSounds}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  Spectral Frequency Distribution
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysis.acousticDetails.spectralCharacteristics}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                  Rhythm & Cadence Evaluation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysis.acousticDetails.rhythmAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Differential Diagnoses */}
          {activeTab === 'differentials' && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-850 overflow-hidden">
              {analysis.differentialDiagnoses.map((diff, index) => (
                <div key={index} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {diff.condition}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          diff.probability === 'High'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800'
                            : diff.probability === 'Moderate'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {diff.probability} Probability
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {diff.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Clinical Recommendations */}
          {activeTab === 'recommendations' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Diagnostic Workup & Follow-up
              </span>
              <ul className="flex flex-col gap-2 mt-1">
                {analysis.clinicalRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical Disclaimer */}
          <div className="text-[11px] text-slate-500 italic text-center px-4">
            * Clinical Notice: Stethoscope AI is an assistive acoustic auscultation diagnostic tool intended to support registered healthcare professionals. Auscultation findings must be corroborated with full clinical examination and definitive diagnostic tests.
          </div>
        </div>
      )}

      {/* Awaiting Analysis State */}
      {!isLoading && !analysis && (
        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
          <Stethoscope className="w-8 h-8 text-slate-600 mb-1" />
          <div className="text-sm font-bold text-slate-300">
            Awaiting Auscultation Analysis
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Click "Run AI Diagnostic Evaluation" above to send the acoustic metrics and frequency profile to the Gemini 3.8 Flash Auscultation engine for full diagnostic triage.
          </p>
        </div>
      )}
    </div>
  );
};
