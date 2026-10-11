import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VisualizerPanel } from './components/VisualizerPanel';
import { AnatomyMap } from './components/AnatomyMap';
import { PresetsSelector } from './components/PresetsSelector';
import { AiDiagnosisCard } from './components/AiDiagnosisCard';
import { RecordingsHistoryModal } from './components/RecordingsHistoryModal';
import { PatientContextModal } from './components/PatientContextModal';

import {
  SoundCategory,
  FilterMode,
  AuscultationSite,
  SoundPreset,
  AcousticTelemetry,
  AiDiagnosticAnalysis,
  AuscultationRecord,
} from './types/stethoscope';
import { AUSCULTATION_SITES, SOUND_PRESETS } from './data/auscultationData';
import { stethoscopeEngine } from './utils/audioEngine';

export const App: React.FC = () => {
  const [category, setCategory] = useState<SoundCategory>('heart');
  const [selectedSite, setSelectedSite] = useState<AuscultationSite>(
    AUSCULTATION_SITES.find((s) => s.id === 'mitral') || AUSCULTATION_SITES[0]
  );
  const [activePreset, setActivePreset] = useState<SoundPreset | null>(
    SOUND_PRESETS.find((p) => p.id === 'normal-heart') || null
  );
  const [filterMode, setFilterMode] = useState<FilterMode>('bell');
  const [volume, setVolume] = useState<number>(2.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Telemetry state
  const [telemetry, setTelemetry] = useState<AcousticTelemetry>({
    rate: 72,
    rhythm: 'Regular',
    peakFrequencyHz: 85,
    snrDb: 22,
    audioLevelDb: -32,
    sealQuality: 'Optimal',
    anomalyFlag: false,
    isPlaying: false,
    durationSeconds: 0,
  });

  // AI Diagnostic State
  const [analysis, setAnalysis] = useState<AiDiagnosticAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [isSavedRecord, setIsSavedRecord] = useState<boolean>(false);

  // Patient Context
  const [patientId, setPatientId] = useState<string>('PT-4921');
  const [age, setAge] = useState<string>('54');
  const [symptoms, setSymptoms] = useState<string>('Exertional dyspnea, fatigue');
  const [indication, setIndication] = useState<string>('Routine cardiovascular auscultation');

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);

  // Saved Exam Records
  const [records, setRecords] = useState<AuscultationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('stethoscope_ai_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Telemetry Poll
  useEffect(() => {
    const interval = setInterval(() => {
      const defaultRate = activePreset ? activePreset.typicalRate : (category === 'heart' ? 72 : 16);
      const live = stethoscopeEngine.computeLiveTelemetry(category, defaultRate);
      setTelemetry(live);
    }, 200);

    return () => clearInterval(interval);
  }, [category, activePreset]);

  // Sync Filter with Site or Preset
  const handleSiteSelect = (site: AuscultationSite) => {
    setSelectedSite(site);
    setFilterMode(site.recommendedFilter);
    stethoscopeEngine.setFilterMode(site.recommendedFilter);
  };

  const handleCategoryChange = (newCat: SoundCategory) => {
    if (newCat === category) return;
    stethoscopeEngine.stopCurrentSource();
    setIsPlaying(false);
    setIsMicActive(false);
    setAnalysis(null);
    setIsSavedRecord(false);

    setCategory(newCat);

    const defaultSite = AUSCULTATION_SITES.find((s) => s.category === newCat) || AUSCULTATION_SITES[0];
    setSelectedSite(defaultSite);

    const defaultPreset = SOUND_PRESETS.find((p) => p.category === newCat) || null;
    setActivePreset(defaultPreset);

    const targetFilter = defaultSite.recommendedFilter;
    setFilterMode(targetFilter);
    stethoscopeEngine.setFilterMode(targetFilter);
  };

  const handleSelectPreset = async (preset: SoundPreset) => {
    setActivePreset(preset);
    setIsMicActive(false);
    setAnalysis(null);
    setIsSavedRecord(false);

    // Auto-align site if designated
    const matchingSite = AUSCULTATION_SITES.find((s) => s.id === preset.defaultSiteId);
    if (matchingSite) {
      setSelectedSite(matchingSite);
    }

    setFilterMode(preset.filterMode);
    stethoscopeEngine.setFilterMode(preset.filterMode);

    try {
      await stethoscopeEngine.playPreset(preset.id, true);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play preset audio:', err);
    }
  };

  const handleStopAudio = () => {
    stethoscopeEngine.stopCurrentSource();
    setIsPlaying(false);
    setIsMicActive(false);
  };

  const handleToggleMic = async () => {
    if (isMicActive) {
      stethoscopeEngine.stopCurrentSource();
      setIsMicActive(false);
      setIsPlaying(false);
    } else {
      try {
        await stethoscopeEngine.startMicrophone();
        setIsMicActive(true);
        setIsPlaying(true);
        setActivePreset(null);
        setAnalysis(null);
        setIsSavedRecord(false);
      } catch (err) {
        alert('Could not access microphone. Please ensure microphone permissions are granted in your browser.');
      }
    }
  };

  const handleFilterChange = (mode: FilterMode) => {
    setFilterMode(mode);
    stethoscopeEngine.setFilterMode(mode);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    stethoscopeEngine.setVolume(vol);
  };

  const handleToggleMute = () => {
    const muted = stethoscopeEngine.toggleMute();
    setIsMuted(muted);
  };

  // Custom Audio Upload Handler
  const handleCustomAudioUpload = async (file: File) => {
    try {
      const audioCtx = await stethoscopeEngine.initAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      await stethoscopeEngine.playCustomAudioBuffer(decodedBuffer, true);
      setIsPlaying(true);
      setIsMicActive(false);
      setActivePreset({
        id: 'uploaded-file',
        title: file.name.slice(0, 24),
        category,
        subtitle: 'User Uploaded Acoustic Recording',
        description: `Imported audio track (${(decodedBuffer.duration).toFixed(1)}s, ${decodedBuffer.numberOfChannels}ch, ${decodedBuffer.sampleRate}Hz)`,
        defaultSiteId: selectedSite.id,
        typicalRate: category === 'heart' ? 74 : 18,
        filterMode,
        anomalyDetected: false,
        frequencyRange: 'Full Spectrum',
      });
      setAnalysis(null);
      setIsSavedRecord(false);
    } catch (err: any) {
      console.error('Audio decoding error:', err);
      alert('Failed to decode audio file. Please ensure it is a valid WAV, MP3, or M4A file.');
    }
  };

  // Run AI Auscultation Diagnostic
  const handleRunAiAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setIsSavedRecord(false);

    try {
      const payload = {
        soundCategory: category,
        presetName: activePreset ? activePreset.title : (isMicActive ? 'Live Stethoscope Stream' : 'Auscultation Sample'),
        auscultationSite: selectedSite.name,
        filterMode,
        estimatedRate: telemetry.rate,
        rhythmRegularity: telemetry.rhythm,
        acousticMetrics: {
          peakFrequencyHz: telemetry.peakFrequencyHz,
          snrDb: telemetry.snrDb,
          sealQuality: telemetry.sealQuality,
          anomalyFlag: activePreset ? activePreset.anomalyDetected : false,
        },
        patientContext: {
          patientId,
          age,
          symptoms,
          indication,
        },
      };

      const res = await fetch('/api/analyze-auscultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Save Record
  const handleSaveRecord = () => {
    if (!analysis) return;

    const newRecord: AuscultationRecord = {
      id: `rec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      presetName: activePreset ? activePreset.title : 'Live Recording',
      siteName: selectedSite.name,
      filterMode,
      rate: telemetry.rate,
      patientId: patientId || undefined,
      patientNotes: symptoms || undefined,
      analysis,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    try {
      localStorage.setItem('stethoscope_ai_records', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    setIsSavedRecord(true);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem('stethoscope_ai_records', JSON.stringify(updated));
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Clear all saved auscultation records?')) {
      setRecords([]);
      localStorage.removeItem('stethoscope_ai_records');
    }
  };

  const handleSelectHistoricalRecord = (record: AuscultationRecord) => {
    setCategory(record.category);
    setAnalysis(record.analysis);
    setIsSavedRecord(true);

    const site = AUSCULTATION_SITES.find((s) => s.name === record.siteName) || AUSCULTATION_SITES[0];
    setSelectedSite(site);
    setFilterMode(record.filterMode);
    stethoscopeEngine.setFilterMode(record.filterMode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      <Header
        category={category}
        onCategoryChange={handleCategoryChange}
        activeInput={isMicActive ? 'mic' : activePreset ? 'preset' : 'file'}
        onInputChange={() => {}}
        filterMode={filterMode}
        onFilterChange={handleFilterChange}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPatientModal={() => setIsPatientModalOpen(true)}
        historyCount={records.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Real-time Oscilloscope & FFT Visualizer Panel */}
        <VisualizerPanel
          telemetry={telemetry}
          category={category}
          filterMode={filterMode}
          currentSiteName={selectedSite.name}
        />

        {/* Clinical Diagnostics Section */}
        <AiDiagnosisCard
          category={category}
          activePresetTitle={activePreset ? activePreset.title : (isMicActive ? 'Live Mic Stream' : 'Auscultation Sample')}
          currentSiteName={selectedSite.name}
          filterMode={filterMode}
          analysis={analysis}
          isLoading={isLoadingAnalysis}
          onRunAnalysis={handleRunAiAnalysis}
          onSaveRecord={handleSaveRecord}
          isSaved={isSavedRecord}
        />

        {/* Anatomical Landmark Placement & Presets Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <AnatomyMap
              category={category}
              selectedSite={selectedSite}
              onSelectSite={handleSiteSelect}
            />
          </div>
          <div className="lg:col-span-7">
            <PresetsSelector
              category={category}
              activePresetId={activePreset?.id || null}
              isPlaying={isPlaying}
              onSelectPreset={handleSelectPreset}
              onStopAudio={handleStopAudio}
              onCustomAudioUpload={handleCustomAudioUpload}
            />
          </div>
        </div>
      </main>

      {/* History and Patient Modals */}
      <RecordingsHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        onSelectRecord={handleSelectHistoricalRecord}
        onDeleteRecord={handleDeleteRecord}
        onClearAll={handleClearAllRecords}
      />

      <PatientContextModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patientId={patientId}
        setPatientId={setPatientId}
        age={age}
        setAge={setAge}
        symptoms={symptoms}
        setSymptoms={setSymptoms}
        indication={indication}
        setIndication={setIndication}
      />
    </div>
  );
};

export default App;
