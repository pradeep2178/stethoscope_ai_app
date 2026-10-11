export type SoundCategory = 'heart' | 'lung';

export type FilterMode = 'bell' | 'diaphragm' | 'extended';

export interface AuscultationSite {
  id: string;
  name: string;
  shortName: string;
  category: SoundCategory;
  coords: { x: number; y: number }; // Percentage on chest diagram
  anatomicalLocation: string;
  clinicalSignificance: string;
  recommendedFilter: FilterMode;
  expectedNormal: string;
}

export interface SoundPreset {
  id: string;
  title: string;
  category: SoundCategory;
  subtitle: string;
  description: string;
  defaultSiteId: string;
  typicalRate: number; // BPM or Breaths/min
  filterMode: FilterMode;
  anomalyDetected: boolean;
  frequencyRange: string;
}

export interface AcousticTelemetry {
  rate: number;
  rhythm: string;
  peakFrequencyHz: number;
  snrDb: number;
  audioLevelDb: number;
  sealQuality: 'Optimal' | 'Acceptable' | 'Poor Seal' | 'Excessive Ambient Noise';
  anomalyFlag: boolean;
  isPlaying: boolean;
  durationSeconds: number;
}

export interface AiDiagnosticAnalysis {
  diagnosticSummary: string;
  classification: 'Normal' | 'Borderline / Minor Anomaly' | 'Pathological / Significant Abnormality';
  confidenceScore: number;
  primaryFinding: string;
  acousticDetails: {
    fundamentalSounds: string;
    adventitiousSounds: string;
    spectralCharacteristics: string;
    rhythmAnalysis: string;
  };
  differentialDiagnoses: Array<{
    condition: string;
    probability: 'High' | 'Moderate' | 'Low';
    rationale: string;
  }>;
  clinicalRecommendations: string[];
  urgencyLevel: 'Routine' | 'Elective Follow-Up' | 'Prompt Clinical Evaluation' | 'Urgent / Immediate Attention';
  stethoscopeRepositioningTip: string;
}

export interface AuscultationRecord {
  id: string;
  timestamp: string;
  category: SoundCategory;
  presetName: string;
  siteName: string;
  filterMode: FilterMode;
  rate: number;
  patientId?: string;
  patientNotes?: string;
  analysis: AiDiagnosticAnalysis;
}
