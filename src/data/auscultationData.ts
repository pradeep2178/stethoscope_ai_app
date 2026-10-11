import { AuscultationSite, SoundPreset } from '../types/stethoscope';

export const AUSCULTATION_SITES: AuscultationSite[] = [
  // Cardiac Auscultation Landmarks
  {
    id: 'aortic',
    name: 'Aortic Area',
    shortName: 'A',
    category: 'heart',
    coords: { x: 42, y: 34 },
    anatomicalLocation: '2nd Intercostal Space, Right Sternal Border',
    clinicalSignificance: 'Best area for evaluating aortic valve closure (A2), systolic ejection murmur of Aortic Stenosis radiating to carotids, and early diastolic murmur of Aortic Regurgitation.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Crisp S2 sound, slightly louder than S1 in this area.'
  },
  {
    id: 'pulmonic',
    name: 'Pulmonic Area',
    shortName: 'P',
    category: 'heart',
    coords: { x: 58, y: 34 },
    anatomicalLocation: '2nd Intercostal Space, Left Sternal Border',
    clinicalSignificance: 'Best area for evaluating pulmonic valve closure (P2), physiological splitting of S2 with respiration, and Pulmonary Stenosis.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'S2 physiological splitting widening during inspiration and narrowing during expiration.'
  },
  {
    id: 'erbs',
    name: "Erb's Point",
    shortName: 'E',
    category: 'heart',
    coords: { x: 55, y: 42 },
    anatomicalLocation: '3rd Intercostal Space, Left Sternal Border',
    clinicalSignificance: 'Optimal acoustic zone for global heart sound evaluation, S1/S2 balance, Aortic Regurgitation murmurs, and Hypertrophic Cardiomyopathy.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'S1 and S2 approximately equal in loudness.'
  },
  {
    id: 'tricuspid',
    name: 'Tricuspid Area',
    shortName: 'T',
    category: 'heart',
    coords: { x: 52, y: 52 },
    anatomicalLocation: '4th-5th Intercostal Space, Left Lower Sternal Border',
    clinicalSignificance: 'Best area for Tricuspid Regurgitation (murmur augments with inspiration - Carvallo sign), Ventricular Septal Defect (VSD), and pericardial friction rubs.',
    recommendedFilter: 'bell',
    expectedNormal: 'S1 slightly louder than S2; clear valve closure transients.'
  },
  {
    id: 'mitral',
    name: 'Mitral Area (Apex)',
    shortName: 'M',
    category: 'heart',
    coords: { x: 65, y: 62 },
    anatomicalLocation: '5th Intercostal Space, Left Midclavicular Line',
    clinicalSignificance: 'Point of Maximal Impulse (PMI). Optimal for Mitral Stenosis (low-pitch diastolic rumble heard with Bell), Mitral Regurgitation (holosystolic radiating to axilla), and S3/S4 gallops.',
    recommendedFilter: 'bell',
    expectedNormal: 'S1 distinctly louder than S2; quiet diastole.'
  },

  // Pulmonary Auscultation Landmarks
  {
    id: 'tracheal',
    name: 'Tracheal & Laryngeal',
    shortName: 'Tr',
    category: 'lung',
    coords: { x: 50, y: 16 },
    anatomicalLocation: 'Extrathoracic Cervical Trachea & Anterior Neck',
    clinicalSignificance: 'Key site for evaluating upper airway patency, stridor, and vocal resonance.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Loud, high-pitched tubular hollow sounds with brief pause between inspiration and expiration.'
  },
  {
    id: 'lung-r-upper',
    name: 'Right Upper Lobe',
    shortName: 'RU',
    category: 'lung',
    coords: { x: 32, y: 28 },
    anatomicalLocation: 'Anterior Chest, 1st-2nd Intercostal Space Right',
    clinicalSignificance: 'Evaluates apical lung ventilation, bronchial breath sounds in consolidation, and apical tuberculosis or pneumonia.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Bronchovesicular sounds with equal inspiratory and expiratory components.'
  },
  {
    id: 'lung-l-upper',
    name: 'Left Upper Lobe',
    shortName: 'LU',
    category: 'lung',
    coords: { x: 68, y: 28 },
    anatomicalLocation: 'Anterior Chest, 1st-2nd Intercostal Space Left',
    clinicalSignificance: 'Evaluates left upper lobe airflow, early expiratory wheezes, and upper lobe infiltrates.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Gentle rustling vesicular sound without adventitious tones.'
  },
  {
    id: 'lung-r-mid',
    name: 'Right Middle Lobe',
    shortName: 'RM',
    category: 'lung',
    coords: { x: 28, y: 48 },
    anatomicalLocation: 'Anterior Chest, 4th Intercostal Space Right',
    clinicalSignificance: 'Common site for right middle lobe syndrome, aspiration pneumonia, and localized bronchial secretions.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Vesicular breath sounds; clear airflow.'
  },
  {
    id: 'lung-r-base',
    name: 'Right Lung Base',
    shortName: 'RB',
    category: 'lung',
    coords: { x: 30, y: 70 },
    anatomicalLocation: 'Lower Anterolateral Chest, 6th Intercostal Space Right',
    clinicalSignificance: 'Early detection of bibasilar fine crackles (congestive heart failure or pulmonary fibrosis) and pleural effusion dullness.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Soft vesicular sound; inspiration is longer and louder than expiration (I:E ratio 3:1).'
  },
  {
    id: 'lung-l-base',
    name: 'Left Lung Base',
    shortName: 'LB',
    category: 'lung',
    coords: { x: 70, y: 70 },
    anatomicalLocation: 'Lower Anterolateral Chest, 6th Intercostal Space Left',
    clinicalSignificance: 'Evaluates left lower lobe aeration, dependant crackles, and atelectasis.',
    recommendedFilter: 'diaphragm',
    expectedNormal: 'Soft, rustling vesicular breath sounds with quiet baseline.'
  }
];

export const SOUND_PRESETS: SoundPreset[] = [
  // Heart Sound Presets
  {
    id: 'normal-heart',
    title: 'Normal Sinus Rhythm',
    category: 'heart',
    subtitle: 'Physiological S1 & S2 (Lub-Dub)',
    description: 'Crisp physiological mitral/tricuspid closure (S1) followed by aortic/pulmonic closure (S2). Clean systolic and diastolic pauses.',
    defaultSiteId: 'mitral',
    typicalRate: 72,
    filterMode: 'bell',
    anomalyDetected: false,
    frequencyRange: '30 - 150 Hz'
  },
  {
    id: 'aortic-stenosis',
    title: 'Aortic Stenosis',
    category: 'heart',
    subtitle: 'Harsh Systolic Ejection Murmur',
    description: 'Diamond-shaped crescendo-decrescendo murmur peaking in mid-systole, originating from turbulent flow across a calcified/stenotic aortic valve.',
    defaultSiteId: 'aortic',
    typicalRate: 76,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '100 - 450 Hz'
  },
  {
    id: 'mitral-regurgitation',
    title: 'Mitral Regurgitation',
    category: 'heart',
    subtitle: 'Holosystolic Blowing Murmur',
    description: 'High-pitched plateau murmur beginning with S1 and continuing through S2, radiating toward the left axilla caused by retrograde systolic flow into the left atrium.',
    defaultSiteId: 'mitral',
    typicalRate: 78,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '150 - 600 Hz'
  },
  {
    id: 's3-gallop',
    title: 'S3 Ventricular Gallop',
    category: 'heart',
    subtitle: 'Ken-tuck-y Cadence (Volume Overload)',
    description: 'Low-frequency dull thud in early diastole (~0.15s after S2) caused by rapid decelerating ventricular filling. Characteristic of systolic heart failure.',
    defaultSiteId: 'mitral',
    typicalRate: 84,
    filterMode: 'bell',
    anomalyDetected: true,
    frequencyRange: '20 - 70 Hz'
  },
  {
    id: 's4-gallop',
    title: 'S4 Atrial Gallop',
    category: 'heart',
    subtitle: 'Ten-nes-see Cadence (Non-compliant Ventricle)',
    description: 'Low-pitch pre-systolic vibration occurring just before S1, generated by active atrial contraction against a stiff, hypertrophied ventricle (e.g. chronic hypertension).',
    defaultSiteId: 'mitral',
    typicalRate: 80,
    filterMode: 'bell',
    anomalyDetected: true,
    frequencyRange: '20 - 80 Hz'
  },
  {
    id: 'atrial-fibrillation',
    title: 'Atrial Fibrillation',
    category: 'heart',
    subtitle: 'Irregularly Irregular Rhythm',
    description: 'Variable R-R intervals with fluctuating S1 intensity and pulse deficit caused by disorganized atrial micro-reentry.',
    defaultSiteId: 'mitral',
    typicalRate: 110,
    filterMode: 'bell',
    anomalyDetected: true,
    frequencyRange: '40 - 200 Hz'
  },

  // Lung Sound Presets
  {
    id: 'normal-lung',
    title: 'Normal Vesicular Breath',
    category: 'lung',
    subtitle: 'Gentle Rustling Airflow',
    description: 'Smooth, rustling vesicular sounds over healthy peripheral lung fields. Inspiration is 3x longer and louder than quiet expiration.',
    defaultSiteId: 'lung-r-mid',
    typicalRate: 16,
    filterMode: 'diaphragm',
    anomalyDetected: false,
    frequencyRange: '100 - 300 Hz'
  },
  {
    id: 'wheezing-asthma',
    title: 'Expiratory Wheezing',
    category: 'lung',
    subtitle: 'High-Pitched Musical Whistle (Bronchospasm)',
    description: 'Continuous polyphonic whistling sounds during expiration generated by turbulent airflow through narrowed, bronchospastic airways (Asthma/COPD).',
    defaultSiteId: 'lung-l-upper',
    typicalRate: 22,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '350 - 900 Hz'
  },
  {
    id: 'fine-crackles',
    title: 'Fine Inspiratory Crackles',
    category: 'lung',
    subtitle: 'Velcro-like Explosive Micro-clicks',
    description: 'Discontinuous brief popping sounds in late inspiration caused by sudden explosive reopening of collapsed peripheral alveoli (Pulmonary Edema / Fibrosis).',
    defaultSiteId: 'lung-r-base',
    typicalRate: 20,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '250 - 800 Hz'
  },
  {
    id: 'coarse-crackles',
    title: 'Coarse Secretory Crackles',
    category: 'lung',
    subtitle: 'Low-Pitched Moist Bubbling',
    description: 'Discontinuous bubbling and gurgling sounds audible in early inspiration and expiration, caused by secretions in medium-to-large bronchi (Bronchitis/Pneumonia).',
    defaultSiteId: 'lung-r-mid',
    typicalRate: 19,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '150 - 500 Hz'
  },
  {
    id: 'inspiratory-stridor',
    title: 'Inspiratory Stridor',
    category: 'lung',
    subtitle: 'Harsh Upper Airway Obstruction',
    description: 'Loud, musical monophonic sound loudest over the extrathoracic trachea during inspiration, signaling life-threatening upper airway narrowing (Laryngeal edema/Foreign body).',
    defaultSiteId: 'tracheal',
    typicalRate: 26,
    filterMode: 'diaphragm',
    anomalyDetected: true,
    frequencyRange: '400 - 1200 Hz'
  }
];
