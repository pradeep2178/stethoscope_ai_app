import React from 'react';
import { X, UserCheck, Check } from 'lucide-react';

interface PatientContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  setPatientId: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
  symptoms: string;
  setSymptoms: (val: string) => void;
  indication: string;
  setIndication: (val: string) => void;
}

export const PatientContextModal: React.FC<PatientContextModalProps> = ({
  isOpen,
  onClose,
  patientId,
  setPatientId,
  age,
  setAge,
  symptoms,
  setSymptoms,
  indication,
  setIndication,
}) => {
  if (!isOpen) return null;

  const quickSymptoms = [
    'Dyspnea on exertion',
    'Substernal chest tightness',
    'Palpitations',
    'Productive cough',
    'Wheezing',
    'Orthopnea',
    'Lower extremity edema',
    'Fever & chills',
  ];

  const toggleSymptom = (s: string) => {
    if (symptoms.includes(s)) {
      setSymptoms(
        symptoms
          .split(', ')
          .filter((item) => item !== s)
          .join(', ')
      );
    } else {
      setSymptoms(symptoms ? `${symptoms}, ${s}` : s);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Patient Clinical Examination Context
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Patient ID / Medical Record #
              </label>
              <input
                type="text"
                placeholder="e.g. PT-88219"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Age
              </label>
              <input
                type="text"
                placeholder="e.g. 58"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Clinical Indication / Exam Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Cardiac murmur evaluation, dyspnea workup"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Quick Presenting Symptoms:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickSymptoms.map((s) => {
                const isSelected = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <textarea
              placeholder="Additional clinical symptoms or past medical history..."
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          >
            <Check className="w-4 h-4" /> Save Context
          </button>
        </div>
      </div>
    </div>
  );
};
