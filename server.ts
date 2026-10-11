import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'stethoscope-ai-backend',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Auscultation Diagnostic Endpoint
app.post('/api/analyze-auscultation', async (req: Request, res: Response) => {
  try {
    const {
      soundCategory = 'heart',
      presetName = 'Custom Recording',
      auscultationSite = 'Mitral / Apex',
      filterMode = 'bell',
      estimatedRate = 72,
      rhythmRegularity = 'Regular',
      acousticMetrics = {},
      patientContext = {},
    } = req.body;

    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('MY_')) {
      try {
        const fs = await import('fs');
        const devEnvPath = '/app/.dev.env.json';
        if (fs.existsSync(devEnvPath)) {
          const devEnv = JSON.parse(fs.readFileSync(devEnvPath, 'utf-8'));
          if (devEnv.GEMINI_API_KEY) {
            apiKey = devEnv.GEMINI_API_KEY;
          }
        }
      } catch (e) {
        // Ignore fallback
      }
    }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are a world-class board-certified cardiologist and pulmonologist specializing in digital phonocardiography and electronic stethoscope acoustic auscultation.
Analyze the following digital stethoscope recording telemetry and acoustic metrics:

[AUSCULTATION SESSION METRICS]
- Acoustic Modality: ${soundCategory.toUpperCase()} Auscultation
- Recording Source / Preset: ${presetName}
- Anatomical Placement Site: ${auscultationSite}
- Acoustic Filter Band: ${filterMode} (Bell focuses 20-200Hz, Diaphragm focuses 100-1000Hz, Extended 20-2000Hz)
- Calculated Rate: ${estimatedRate} ${soundCategory === 'heart' ? 'BPM (Heart Rate)' : 'breaths/min (Respiratory Rate)'}
- Rhythm Consistency: ${rhythmRegularity}
- Acoustic Frequency Peak: ${acousticMetrics.peakFrequencyHz || 'N/A'} Hz
- Signal-to-Noise Ratio: ${acousticMetrics.snrDb || 'Normal'} dB
- Detected Murmur / Adventitious Flag: ${acousticMetrics.anomalyFlag ? 'Yes' : 'No'}
- Patient Clinical Notes: Age ${patientContext.age || 'Adult'}, Symptoms: ${patientContext.symptoms || 'Auscultatory screening'}

Provide a rigorous clinical auscultation diagnostic evaluation in valid JSON matching this exact structure:
{
  "diagnosticSummary": "A concise 1-2 sentence clinical impression of the acoustic findings",
  "classification": "Normal" | "Borderline / Minor Anomaly" | "Pathological / Significant Abnormality",
  "confidenceScore": number between 80 and 99,
  "primaryFinding": "Short title of condition e.g. Normal S1/S2 Lub-Dub or Holosystolic Murmur (Mitral Regurgitation) or Expiratory Wheezes",
  "acousticDetails": {
    "fundamentalSounds": "Description of S1/S2 or Vesicular breath sound components",
    "adventitiousSounds": "Description of any murmurs (timing, grade I-VI, pitch), gallops (S3/S4), wheezes, crackles, or rubs",
    "spectralCharacteristics": "Evaluation of frequency distribution and loudness",
    "rhythmAnalysis": "Regularity, rate cadence, and rhythm comments"
  },
  "differentialDiagnoses": [
    {
      "condition": "Condition name",
      "probability": "High" | "Moderate" | "Low",
      "rationale": "Why acoustic findings align with this diagnosis"
    }
  ],
  "clinicalRecommendations": [
    "Specific diagnostic recommendation 1 (e.g. 12-lead ECG, Transthoracic Echocardiogram, Spirometry)",
    "Specific clinical follow-up recommendation 2"
  ],
  "urgencyLevel": "Routine" | "Elective Follow-Up" | "Prompt Clinical Evaluation" | "Urgent / Immediate Attention",
  "stethoscopeRepositioningTip": "Clinical tip on optimal chest placement or patient maneuver (e.g. left lateral decubitus, full expiration)"
}

Return ONLY the raw JSON without markdown backticks or commentary.`;

        let textOutput = '';
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          textOutput = response.text?.trim() || '';
        } catch (firstErr: any) {
          console.warn('[DEBUG] gemini-3.8-flash failed:', firstErr?.message || firstErr);
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });
          textOutput = fallbackRes.text?.trim() || '';
        }

        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return res.json({
            success: true,
            source: 'gemini-ai-model',
            analysis: parsed,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, using clinical fallback engine:', geminiErr?.message);
      }
    }

    // Clinical Rule-Based Fallback Engine
    const fallback = generateClinicalFallback({
      soundCategory,
      presetName,
      auscultationSite,
      filterMode,
      estimatedRate,
      rhythmRegularity,
      acousticMetrics,
    });

    return res.json({
      success: true,
      source: 'clinical-heuristic-engine',
      analysis: fallback,
    });
  } catch (err: any) {
    console.error('Error analyzing auscultation:', err);
    return res.status(500).json({
      error: 'Failed to process auscultation analysis',
      message: err.message,
    });
  }
});

function generateClinicalFallback(params: any) {
  const { soundCategory, presetName = '', auscultationSite, estimatedRate, rhythmRegularity, acousticMetrics = {} } = params;
  const lowerPreset = presetName.toLowerCase();

  if (soundCategory === 'heart') {
    if (lowerPreset.includes('stenosis') || lowerPreset.includes('aortic stenosis')) {
      return {
        diagnosticSummary: 'Midsystolic ejection murmur heard maximally at the right second intercostal space with radiation toward the carotid vessels, highly characteristic of Aortic Valve Stenosis.',
        classification: 'Pathological / Significant Abnormality',
        confidenceScore: 94,
        primaryFinding: 'Systolic Ejection Murmur (Aortic Stenosis)',
        acousticDetails: {
          fundamentalSounds: 'S1 present. Softened or delayed A2 component of second heart sound.',
          adventitiousSounds: 'Harsh crescendo-decrescendo systolic murmur peaking in mid-to-late systole, Grade III/VI.',
          spectralCharacteristics: 'Diamond-shaped acoustic envelope with high spectral energy in the 120-400 Hz range.',
          rhythmAnalysis: `Heart rate ~${estimatedRate} BPM with ${rhythmRegularity.toLowerCase()} rhythm cadence.`
        },
        differentialDiagnoses: [
          { condition: 'Calcific Aortic Valve Stenosis', probability: 'High', rationale: 'Crescendo-decrescendo contour at aortic landmark.' },
          { condition: 'Aortic Sclerosis', probability: 'Moderate', rationale: 'Mild thickening without severe hemodynamic gradient.' },
          { condition: 'Hypertrophic Cardiomyopathy (HOCM)', probability: 'Low', rationale: 'Murmur intensity would vary with Valsalva maneuver.' }
        ],
        clinicalRecommendations: [
          'Order comprehensive Transthoracic Echocardiogram (TTE) with Doppler to calculate aortic valve area and peak gradient.',
          '12-lead ECG to evaluate for left ventricular hypertrophy (LVH) and strain pattern.',
          'Cardiology consultation for clinical staging and symptom assessment.'
        ],
        urgencyLevel: 'Prompt Clinical Evaluation',
        stethoscopeRepositioningTip: 'Have patient lean forward in full expiration while auscultating the right 2nd ICS and right carotid artery.'
      };
    }

    if (lowerPreset.includes('regurgitation') || lowerPreset.includes('mitral regurg')) {
      return {
        diagnosticSummary: 'Pansystolic blowing murmur radiating to the left axilla heard best at the cardiac apex (mitral position), consistent with Mitral Regurgitation.',
        classification: 'Pathological / Significant Abnormality',
        confidenceScore: 92,
        primaryFinding: 'Holosystolic Murmur (Mitral Regurgitation)',
        acousticDetails: {
          fundamentalSounds: 'S1 may be obscured or diminished by early systolic murmur onset; S2 physiologically split.',
          adventitiousSounds: 'High-pitched holosystolic plateau-shaped murmur lasting throughout systole up to S2.',
          spectralCharacteristics: 'Uniform spectral amplitude distribution across 150-600 Hz bandwidth.',
          rhythmAnalysis: `Heart rate ~${estimatedRate} BPM with regular sinus cadence.`
        },
        differentialDiagnoses: [
          { condition: 'Primary Mitral Valve Regurgitation (Myxomatous/MVP)', probability: 'High', rationale: 'Holosystolic apex blowing murmur radiating to axilla.' },
          { condition: 'Tricuspid Regurgitation', probability: 'Moderate', rationale: 'Usually heard better at left lower sternal border and increases on inspiration.' },
          { condition: 'Ventricular Septal Defect (VSD)', probability: 'Low', rationale: 'Typically harsher along left sternal border.' }
        ],
        clinicalRecommendations: [
          'Transthoracic Echocardiography with color Doppler to quantify regurgitant jet volume and EF.',
          'Assess for dyspnea on exertion, orthopnea, or pulmonary rales.'
        ],
        urgencyLevel: 'Prompt Clinical Evaluation',
        stethoscopeRepositioningTip: 'Position patient in the left lateral decubitus position using the bell/diaphragm at the point of maximal impulse (PMI).'
      };
    }

    if (lowerPreset.includes('gallop') || lowerPreset.includes('s3') || lowerPreset.includes('s4')) {
      const isS3 = lowerPreset.includes('s3');
      return {
        diagnosticSummary: isS3
          ? 'Low-frequency third heart sound (S3) detected in early diastole during rapid ventricular filling, consistent with ventricular volume overload or elevated left atrial pressure.'
          : 'Presystolic fourth heart sound (S4) detected immediately before S1, signifying reduced ventricular compliance and active atrial contraction against a stiff ventricle.',
        classification: 'Pathological / Significant Abnormality',
        confidenceScore: 91,
        primaryFinding: isS3 ? 'S3 Ventricular Gallop (Ken-tuck-y)' : 'S4 Atrial Gallop (Ten-nes-see)',
        acousticDetails: {
          fundamentalSounds: 'S1 and S2 present with distinct physiological intervals.',
          adventitiousSounds: isS3
            ? 'Low-pitch thud occurring ~0.12-0.18s after S2 in early diastole.'
            : 'Low-pitch vibration occurring immediately preceding S1 in late diastole.',
          spectralCharacteristics: 'Predominantly low-frequency energy (20-70 Hz) optimal for stethoscope bell acoustic filtering.',
          rhythmAnalysis: `Triphasic gallop cadence at ~${estimatedRate} BPM.`
        },
        differentialDiagnoses: [
          { condition: isS3 ? 'Congestive Heart Failure / Reduced LVEF' : 'Hypertensive Heart Disease / LV Hypertrophy', probability: 'High', rationale: 'Classic diastolic gallop acoustics.' },
          { condition: isS3 ? 'Dilated Cardiomyopathy' : 'Ischemic Heart Disease', probability: 'Moderate', rationale: 'Altered ventricular diastolic filling dynamics.' }
        ],
        clinicalRecommendations: [
          'Measure serum B-type Natriuretic Peptide (BNP or NT-proBNP).',
          'Order comprehensive 2D Echocardiogram with Doppler diastolic parameters (E/A ratio, E/e\').',
          'Evaluate for peripheral edema, JVD, and lung auscultation for pulmonary rales.'
        ],
        urgencyLevel: 'Prompt Clinical Evaluation',
        stethoscopeRepositioningTip: 'Lightly apply the bell (avoid firm pressure) at the cardiac apex with patient turned 45 degrees left lateral.'
      };
    }

    if (lowerPreset.includes('fibrillation') || rhythmRegularity.toLowerCase().includes('irregular')) {
      return {
        diagnosticSummary: 'Irregularly irregular heart cadence with beat-to-beat amplitude and interval variation, indicative of Atrial Fibrillation with variable ventricular response.',
        classification: 'Pathological / Significant Abnormality',
        confidenceScore: 93,
        primaryFinding: 'Atrial Fibrillation (Irregularly Irregular Rhythm)',
        acousticDetails: {
          fundamentalSounds: 'S1 intensity varies significantly from beat to beat due to erratic PR intervals; absent A wave filling.',
          adventitiousSounds: 'No focal murmur identified; audible pulse deficit during rapid phases.',
          spectralCharacteristics: 'Variable peak frequency spikes with inconsistent R-R interval spacing.',
          rhythmAnalysis: `Irregular rate averaging ~${estimatedRate} BPM without coordinated atrial mechanical kick.`
        },
        differentialDiagnoses: [
          { condition: 'Non-valvular Atrial Fibrillation', probability: 'High', rationale: 'Irregularly irregular acoustic cadence without distinct P-wave herald.' },
          { condition: 'Frequent Premature Atrial/Ventricular Contractions (PACs/PVCs)', probability: 'Moderate', rationale: 'Ectopic premature beats can mimic irregularity.' },
          { condition: 'Atrial Flutter with variable AV conduction', probability: 'Moderate', rationale: 'Variable block ratios produce changing cycle lengths.' }
        ],
        clinicalRecommendations: [
          'Immediate 12-lead Electrocardiogram (ECG) for definitive rhythm diagnosis.',
          'Calculate CHA2DS2-VASc stroke risk score and evaluate indication for systemic anticoagulation.',
          'Assess thyroid stimulating hormone (TSH), electrolytes, and serum creatinine.'
        ],
        urgencyLevel: 'Prompt Clinical Evaluation',
        stethoscopeRepositioningTip: 'Simultaneously palpate the radial pulse while listening to heart sounds at the apex to verify pulse deficit.'
      };
    }

    // Default Normal Heart
    return {
      diagnosticSummary: `Normal S1 and S2 heart sounds with crisp closure transients, regular sinus rhythm at ${estimatedRate} BPM, and no abnormal murmurs, gallops, or clicks.`,
      classification: 'Normal',
      confidenceScore: 97,
      primaryFinding: 'Normal Sinus Rhythm (Physiological S1 & S2)',
      acousticDetails: {
        fundamentalSounds: 'Crisp S1 (mitral/tricuspid closure) followed by physiological S2 (aortic/pulmonic closure). Normal systolic interval (0.3s) and diastolic interval (0.5s).',
        adventitiousSounds: 'No systolic or diastolic murmurs, clicks, friction rubs, or pathological third/fourth sounds identified.',
        spectralCharacteristics: 'Harmonics centered in the expected 30-150 Hz range with clean baseline between cardiac cycles.',
        rhythmAnalysis: `Steady, regular sinus cadence at ${estimatedRate} BPM with physiological respiratory rate variability.`
      },
      differentialDiagnoses: [
        { condition: 'Normal Physiological Auscultation', probability: 'High', rationale: 'Biphasic lub-dub sounds match standard healthy acoustic envelopes.' }
      ],
      clinicalRecommendations: [
        'Routine preventive cardiovascular screening.',
        'Maintain heart-healthy diet, regular physical exercise, and blood pressure monitoring.'
      ],
      urgencyLevel: 'Routine',
      stethoscopeRepositioningTip: 'Systematic auscultation across all four valve landmarks (Aortic, Pulmonic, Tricuspid, Mitral) confirms global normal acoustics.'
    };
  }

  // LUNG / RESPIRATORY AUSCULTATION
  if (lowerPreset.includes('wheez')) {
    return {
      diagnosticSummary: 'Continuous musical, high-pitched adventitious sounds heard predominantly during expiration, diagnostic of diffuse airway narrowing and bronchospasm.',
      classification: 'Pathological / Significant Abnormality',
      confidenceScore: 95,
      primaryFinding: 'Expiratory Polyphonic Wheezing (Bronchospasm)',
      acousticDetails: {
        fundamentalSounds: 'Vesicular baseline sound masked by dominant continuous musical tones. Prolonged expiratory phase (I:E ratio ~1:3).',
        adventitiousSounds: 'High-pitched polyphonic musical wheezing occurring throughout middle to end of expiration.',
        spectralCharacteristics: 'Prominent harmonic frequency peaks in the 350-900 Hz range during expiratory airflow.',
        rhythmAnalysis: `Respiratory rate ~${estimatedRate} breaths/min with noticeable expiratory effort.`
      },
      differentialDiagnoses: [
        { condition: 'Bronchial Asthma Exacerbation', probability: 'High', rationale: 'Reversible bronchoconstriction generating high-frequency laminar flutter.' },
        { condition: 'Chronic Obstructive Pulmonary Disease (COPD) Flare', probability: 'Moderate', rationale: 'Small airway inflammation and dynamic airway collapse.' },
        { condition: 'Acute Bronchitis', probability: 'Moderate', rationale: 'Transient mucosal edema and hyperreactive airways.' }
      ],
      clinicalRecommendations: [
        'Inhaled short-acting beta-2 agonist (SABA) bronchodilator trial with pre- and post-auscultation assessment.',
        'Pulse oximetry (SpO2) and peak expiratory flow (PEF) measurement.',
        'Assess for signs of respiratory distress (intercostal retractions, accessory muscle use).'
      ],
      urgencyLevel: 'Prompt Clinical Evaluation',
      stethoscopeRepositioningTip: 'Auscultate anterior and posterior lung fields during forced expiration to accentuate subtle wheezes.'
    };
  }

  if (lowerPreset.includes('crackle') || lowerPreset.includes('rale')) {
    const isFine = lowerPreset.includes('fine');
    return {
      diagnosticSummary: isFine
        ? 'Discontinuous, brief, high-pitched "velcro-like" fine crackles occurring in late inspiration at the bilateral lung bases.'
        : 'Discontinuous bubbling coarse crackles audible in early inspiration and expiration, indicative of secretions in larger airways.',
      classification: 'Pathological / Significant Abnormality',
      confidenceScore: 93,
      primaryFinding: isFine ? 'Fine Inspiratory Crackles (Rales)' : 'Coarse Secretory Crackles',
      acousticDetails: {
        fundamentalSounds: 'Inspiratory vesicular sounds punctuated by explosive, discontinuous micro-acoustic events.',
        adventitiousSounds: isFine
          ? 'Explosive sound bursts <20ms duration, late inspiratory timing, unaffected by coughing.'
          : 'Lower pitch, moist bubbling sounds >20ms duration, shifting slightly with productive cough.',
        spectralCharacteristics: 'High-frequency transient bursts in the 200-800 Hz range.',
        rhythmAnalysis: `Respiratory rate ~${estimatedRate} breaths/min.`
      },
      differentialDiagnoses: [
        { condition: isFine ? 'Congestive Heart Failure (Pulmonary Edema)' : 'Bacterial / Viral Pneumonia', probability: 'High', rationale: 'Fluid transudation in alveoli or inflammatory consolidation.' },
        { condition: isFine ? 'Idiopathic Pulmonary Fibrosis / ILD' : 'Acute or Chronic Bronchitis with retained secretions', probability: 'Moderate', rationale: 'Late-inspiratory reopening of stiffened alveoli.' }
      ],
      clinicalRecommendations: [
        'Chest Radiograph (CXR Posteroanterior and Lateral) or High-Resolution CT.',
        'Oxygen saturation monitoring and orthopnea assessment.',
        'Evaluate for fever, productive sputum, and lower extremity edema.'
      ],
      urgencyLevel: 'Prompt Clinical Evaluation',
      stethoscopeRepositioningTip: 'Auscultate the posterior lower lung bases (bases of T8-T10) while patient breathes deeply through an open mouth.'
    };
  }

  if (lowerPreset.includes('stridor')) {
    return {
      diagnosticSummary: 'Loud, high-pitched monophonic sound heard predominantly during inspiration over the extrathoracic trachea and anterior neck, signaling critical upper airway obstruction.',
      classification: 'Pathological / Significant Abnormality',
      confidenceScore: 98,
      primaryFinding: 'Inspiratory Stridor (Upper Airway Obstruction)',
      acousticDetails: {
        fundamentalSounds: 'Laminar flow severely disrupted by focal extrathoracic narrowing.',
        adventitiousSounds: 'Harsh, continuous, monophonic high-pitch sound loudest over the larynx/trachea.',
        spectralCharacteristics: 'Intense acoustic resonance centered around 450-1000 Hz during inspiratory phase.',
        rhythmAnalysis: `Tachypnea (~${estimatedRate} breaths/min) with increased work of breathing.`
      },
      differentialDiagnoses: [
        { condition: 'Laryngeal Edema / Anaphylaxis', probability: 'High', rationale: 'Acute subglottic or supraglottic narrowing.' },
        { condition: 'Foreign Body Aspiration', probability: 'Moderate', rationale: 'Focal mechanical obstruction of the trachea or mainstem bronchus.' },
        { condition: 'Epiglottitis / Croup', probability: 'Moderate', rationale: 'Severe infectious airway compromise.' }
      ],
      clinicalRecommendations: [
        'Immediate airway assessment by emergency physician or ENT specialist.',
        'Continuous pulse oximetry, humidified supplemental oxygen, and prepare airway equipment.',
        'Do not perform blind pharyngeal probing.'
      ],
      urgencyLevel: 'Urgent / Immediate Attention',
      stethoscopeRepositioningTip: 'Place the stethoscope diaphragm directly over the anterior thyroid cartilage and cervical trachea.'
    };
  }

  // Default Normal Lung
  return {
    diagnosticSummary: `Normal vesicular breath sounds heard throughout all lung fields. Clear inspiratory phase with gentle, quiet expiratory fade, and no adventitious crackles, wheezes, or pleural friction rubs.`,
    classification: 'Normal',
    confidenceScore: 96,
    primaryFinding: 'Normal Vesicular Breath Sounds',
    acousticDetails: {
      fundamentalSounds: 'Soft, rustling low-pitched vesicular breath sounds. Inspiration duration is 2.5 to 3 times longer than audible expiration (normal I:E ratio).',
      adventitiousSounds: 'No wheezes (rhonchi), crackles (crepitations), stridor, or friction rubs identified.',
      spectralCharacteristics: 'Smooth acoustic decay with energy concentrated below 250 Hz in peripheral lung parenchyma.',
      rhythmAnalysis: `Steady, unlabored respiratory cadence at ${estimatedRate} breaths/min.`
    },
    differentialDiagnoses: [
      { condition: 'Normal Pulmonary Auscultation', probability: 'High', rationale: 'Clear bilateral air entry without airway obstruction or alveolar fluid.' }
    ],
    clinicalRecommendations: [
      'Maintain standard wellness check and baseline respiratory surveillance.',
      'Encourage smoking cessation if applicable and seasonal vaccinations.'
    ],
    urgencyLevel: 'Routine',
    stethoscopeRepositioningTip: 'Compare symmetrical anatomical locations on the left and right hemithorax in a ladder-pattern for thorough exam.'
  };
}

// Development vs Production Server Setup
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Stethoscope AI] Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
