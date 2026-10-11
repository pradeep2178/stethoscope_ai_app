import React from 'react';
import { AuscultationRecord } from '../types/stethoscope';
import { X, Calendar, Download, Trash2, Heart, Wind, Stethoscope, ChevronRight } from 'lucide-react';

interface RecordingsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AuscultationRecord[];
  onSelectRecord: (record: AuscultationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const RecordingsHistoryModal: React.FC<RecordingsHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const exportAllJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `stethoscope_ai_records_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Patient Auscultation Examination History ({records.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {records.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No saved auscultation records yet.</p>
              <p className="text-xs mt-1 text-slate-600">
                Run an AI diagnostic evaluation and click "Save Record" to log findings here.
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 hover:border-cyan-500/50 flex items-center justify-between gap-3 group transition-all"
              >
                <div
                  onClick={() => {
                    onSelectRecord(rec);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {rec.category === 'heart' ? (
                      <Heart className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Wind className="w-4 h-4 text-sky-400" />
                    )}
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {rec.analysis.primaryFinding}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        rec.analysis.classification === 'Normal'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {rec.analysis.classification}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(rec.timestamp).toLocaleString()}
                    </span>
                    <span>Site: {rec.siteName}</span>
                    <span>Rate: {rec.rate} {rec.category === 'heart' ? 'BPM' : 'br/m'}</span>
                    {rec.patientId && <span>Patient ID: {rec.patientId}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      onSelectRecord(rec);
                      onClose();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRecord(rec.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {records.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
            <button
              onClick={exportAllJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-200 hover:text-white border border-slate-800"
            >
              <Download className="w-3.5 h-3.5" /> Export All Records (JSON)
            </button>
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Clear All Records
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
