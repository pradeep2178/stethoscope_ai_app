// Realistic Clinical Auscultation Sound Synthesizer via Web Audio API

export function synthesizeAuscultationAudio(
  audioCtx: AudioContext,
  presetId: string,
  durationSeconds: number = 8
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numFrames = sampleRate * durationSeconds;
  const buffer = audioCtx.createBuffer(1, numFrames, sampleRate);
  const data = buffer.getChannelData(0);

  // Fill with low ambient room/body baseline noise
  for (let i = 0; i < numFrames; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.003;
  }

  switch (presetId) {
    case 'normal-heart':
      generateHeartSound(data, sampleRate, {
        bpm: 72,
        hasMurmur: false,
        hasS3: false,
        hasS4: false,
        isAfib: false,
      });
      break;

    case 'aortic-stenosis':
      generateHeartSound(data, sampleRate, {
        bpm: 76,
        hasMurmur: true,
        murmurType: 'ejection',
        hasS3: false,
        hasS4: false,
        isAfib: false,
      });
      break;

    case 'mitral-regurgitation':
      generateHeartSound(data, sampleRate, {
        bpm: 78,
        hasMurmur: true,
        murmurType: 'holosystolic',
        hasS3: false,
        hasS4: false,
        isAfib: false,
      });
      break;

    case 's3-gallop':
      generateHeartSound(data, sampleRate, {
        bpm: 84,
        hasMurmur: false,
        hasS3: true,
        hasS4: false,
        isAfib: false,
      });
      break;

    case 's4-gallop':
      generateHeartSound(data, sampleRate, {
        bpm: 80,
        hasMurmur: false,
        hasS3: false,
        hasS4: true,
        isAfib: false,
      });
      break;

    case 'atrial-fibrillation':
      generateHeartSound(data, sampleRate, {
        bpm: 105,
        hasMurmur: false,
        hasS3: false,
        hasS4: false,
        isAfib: true,
      });
      break;

    case 'normal-lung':
      generateLungSound(data, sampleRate, {
        respRate: 16,
        hasWheeze: false,
        hasCrackles: 'none',
        hasStridor: false,
      });
      break;

    case 'wheezing-asthma':
      generateLungSound(data, sampleRate, {
        respRate: 22,
        hasWheeze: true,
        hasCrackles: 'none',
        hasStridor: false,
      });
      break;

    case 'fine-crackles':
      generateLungSound(data, sampleRate, {
        respRate: 20,
        hasWheeze: false,
        hasCrackles: 'fine',
        hasStridor: false,
      });
      break;

    case 'coarse-crackles':
      generateLungSound(data, sampleRate, {
        respRate: 18,
        hasWheeze: false,
        hasCrackles: 'coarse',
        hasStridor: false,
      });
      break;

    case 'inspiratory-stridor':
      generateLungSound(data, sampleRate, {
        respRate: 24,
        hasWheeze: false,
        hasCrackles: 'none',
        hasStridor: true,
      });
      break;

    default:
      generateHeartSound(data, sampleRate, {
        bpm: 72,
        hasMurmur: false,
        hasS3: false,
        hasS4: false,
        isAfib: false,
      });
  }

  // Normalize softly to prevent clipping
  let peak = 0;
  for (let i = 0; i < numFrames; i++) {
    const abs = Math.abs(data[i]);
    if (abs > peak) peak = abs;
  }
  if (peak > 0) {
    const scale = 0.85 / peak;
    for (let i = 0; i < numFrames; i++) {
      data[i] *= scale;
    }
  }

  return buffer;
}

interface HeartSoundParams {
  bpm: number;
  hasMurmur: boolean;
  murmurType?: 'ejection' | 'holosystolic';
  hasS3: boolean;
  hasS4: boolean;
  isAfib: boolean;
}

function generateHeartSound(
  data: Float32Array,
  sampleRate: number,
  params: HeartSoundParams
) {
  const totalSamples = data.length;
  let currentSample = 0;

  // Afib pseudo-random intervals generator
  const afibIntervals = [0.46, 0.62, 0.38, 0.75, 0.51, 0.42, 0.68, 0.55];
  let afibIndex = 0;

  while (currentSample < totalSamples) {
    let beatDurationSec = 60 / params.bpm;
    let beatGain = 1.0;

    if (params.isAfib) {
      beatDurationSec = afibIntervals[afibIndex % afibIntervals.length];
      beatGain = 0.65 + (Math.sin(afibIndex * 1.7) * 0.35);
      afibIndex++;
    }

    const beatSamples = Math.floor(beatDurationSec * sampleRate);
    const systoleDurationSec = Math.min(0.28, beatDurationSec * 0.38);
    const systoleSamples = Math.floor(systoleDurationSec * sampleRate);

    // Optional S4 Gallop (~0.11s prior to S1)
    if (params.hasS4) {
      const s4Offset = Math.max(0, currentSample - Math.floor(0.10 * sampleRate));
      renderValveThump(data, s4Offset, sampleRate, {
        freq: 45,
        duration: 0.08,
        amplitude: 0.35 * beatGain,
        damping: 38,
      });
    }

    // S1 (Closure of Mitral & Tricuspid) - dominant low frequency
    renderValveThump(data, currentSample, sampleRate, {
      freq: 110,
      duration: 0.11,
      amplitude: 0.75 * beatGain,
      damping: 32,
    });
    // S1 secondary harmonic component
    renderValveThump(data, currentSample, sampleRate, {
      freq: 65,
      duration: 0.13,
      amplitude: 0.45 * beatGain,
      damping: 24,
    });

    // Murmurs between S1 and S2
    if (params.hasMurmur) {
      const murmurStart = currentSample + Math.floor(0.06 * sampleRate);
      const murmurLength = Math.max(0, systoleSamples - Math.floor(0.08 * sampleRate));

      if (params.murmurType === 'ejection') {
        // Aortic Stenosis: Crescendo-Decrescendo Diamond shape
        for (let j = 0; j < murmurLength && murmurStart + j < totalSamples; j++) {
          const t = j / murmurLength;
          // Diamond envelope: sin(pi * t)
          const envelope = Math.sin(Math.PI * t);
          // Turbulent noise filtered with tonal harmonic
          const noise = (Math.random() * 2 - 1);
          const tone = Math.sin(2 * Math.PI * 220 * (j / sampleRate));
          data[murmurStart + j] += (noise * 0.7 + tone * 0.3) * envelope * 0.42 * beatGain;
        }
      } else if (params.murmurType === 'holosystolic') {
        // Mitral Regurgitation: High-pitch blowing plateau throughout systole
        for (let j = 0; j < murmurLength && murmurStart + j < totalSamples; j++) {
          const t = j / murmurLength;
          // Plateau envelope with quick rise and fall
          let envelope = 1.0;
          if (t < 0.15) envelope = t / 0.15;
          if (t > 0.85) envelope = (1.0 - t) / 0.15;

          const noise = (Math.random() * 2 - 1);
          const tone = Math.sin(2 * Math.PI * 340 * (j / sampleRate));
          data[murmurStart + j] += (noise * 0.8 + tone * 0.2) * envelope * 0.38 * beatGain;
        }
      }
    }

    // S2 (Closure of Aortic & Pulmonic) - slightly higher pitch, crisper
    const s2Offset = currentSample + systoleSamples;
    if (s2Offset < totalSamples) {
      renderValveThump(data, s2Offset, sampleRate, {
        freq: 155,
        duration: 0.085,
        amplitude: 0.65 * beatGain,
        damping: 42,
      });
      // S2 secondary component
      renderValveThump(data, s2Offset, sampleRate, {
        freq: 90,
        duration: 0.09,
        amplitude: 0.35 * beatGain,
        damping: 35,
      });
    }

    // Optional S3 Gallop (~0.14s after S2)
    if (params.hasS3) {
      const s3Offset = s2Offset + Math.floor(0.14 * sampleRate);
      if (s3Offset < totalSamples) {
        renderValveThump(data, s3Offset, sampleRate, {
          freq: 50,
          duration: 0.09,
          amplitude: 0.40 * beatGain,
          damping: 32,
        });
      }
    }

    currentSample += beatSamples;
  }
}

function renderValveThump(
  data: Float32Array,
  startSample: number,
  sampleRate: number,
  config: { freq: number; duration: number; amplitude: number; damping: number }
) {
  const numSamples = Math.floor(config.duration * sampleRate);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= data.length) break;
    const t = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * config.freq * t);
    const decay = Math.exp(-config.damping * t);
    data[idx] += wave * decay * config.amplitude;
  }
}

interface LungSoundParams {
  respRate: number;
  hasWheeze: boolean;
  hasCrackles: 'none' | 'fine' | 'coarse';
  hasStridor: boolean;
}

function generateLungSound(
  data: Float32Array,
  sampleRate: number,
  params: LungSoundParams
) {
  const totalSamples = data.length;
  let currentSample = 0;
  const cycleSec = 60 / params.respRate;
  const cycleSamples = Math.floor(cycleSec * sampleRate);

  while (currentSample < totalSamples) {
    // Phase 1: Inspiration (approx 50% of active cycle)
    const inspSec = cycleSec * 0.48;
    const inspSamples = Math.floor(inspSec * sampleRate);

    // Phase 2: Expiration (approx 40% of active cycle)
    const expSec = cycleSec * 0.42;
    const expSamples = Math.floor(expSec * sampleRate);

    // Inspiration breath sound
    for (let i = 0; i < inspSamples && currentSample + i < totalSamples; i++) {
      const t = i / inspSamples;
      // Asymmetric respiratory bell curve
      const envelope = Math.sin(Math.PI * Math.pow(t, 0.7));
      const pinkNoise = (Math.random() * 2 - 1) * 0.5 + (Math.random() * 2 - 1) * 0.3;

      // Stridor: Harsh upper airway whistling during inspiration
      let stridorTone = 0;
      if (params.hasStridor) {
        const timeSec = i / sampleRate;
        stridorTone = (
          Math.sin(2 * Math.PI * 620 * timeSec) * 0.6 +
          Math.sin(2 * Math.PI * 1240 * timeSec) * 0.3 +
          (Math.random() * 2 - 1) * 0.4
        ) * 0.6;
      }

      data[currentSample + i] += (pinkNoise * 0.28 + stridorTone) * envelope;

      // Fine Crackles (late inspiration bursts)
      if (params.hasCrackles === 'fine' && t > 0.55 && t < 0.95) {
        if (Math.random() < 0.007) {
          addCrackleBurst(data, currentSample + i, sampleRate, 750, 0.006, 0.55);
        }
      }

      // Coarse Crackles (early/mid inspiration moist bubbling)
      if (params.hasCrackles === 'coarse' && t > 0.15 && t < 0.75) {
        if (Math.random() < 0.004) {
          addCrackleBurst(data, currentSample + i, sampleRate, 280, 0.018, 0.65);
        }
      }
    }

    // Expiration breath sound
    const expStart = currentSample + inspSamples + Math.floor(0.08 * sampleRate);
    for (let i = 0; i < expSamples && expStart + i < totalSamples; i++) {
      const t = i / expSamples;
      const envelope = Math.sin(Math.PI * t) * 0.6; // Expiration normally softer
      const pinkNoise = (Math.random() * 2 - 1) * 0.5;

      // Expiratory Wheezing: High-pitched musical tones
      let wheezeTone = 0;
      if (params.hasWheeze) {
        const timeSec = i / sampleRate;
        const vibrato = 1 + 0.03 * Math.sin(2 * Math.PI * 6 * timeSec);
        wheezeTone = (
          Math.sin(2 * Math.PI * 460 * vibrato * timeSec) * 0.45 +
          Math.sin(2 * Math.PI * 690 * vibrato * timeSec) * 0.35 +
          Math.sin(2 * Math.PI * 920 * timeSec) * 0.2
        ) * 0.55;
      }

      data[expStart + i] += (pinkNoise * 0.18 + wheezeTone) * envelope;

      // Coarse crackles can also happen in expiration
      if (params.hasCrackles === 'coarse' && t > 0.2 && t < 0.7) {
        if (Math.random() < 0.003) {
          addCrackleBurst(data, expStart + i, sampleRate, 260, 0.015, 0.5);
        }
      }
    }

    currentSample += cycleSamples;
  }
}

function addCrackleBurst(
  data: Float32Array,
  startIdx: number,
  sampleRate: number,
  freq: number,
  durationSec: number,
  amplitude: number
) {
  const burstSamples = Math.floor(durationSec * sampleRate);
  for (let k = 0; k < burstSamples; k++) {
    const idx = startIdx + k;
    if (idx >= data.length) break;
    const t = k / sampleRate;
    const oscillation = Math.sin(2 * Math.PI * freq * t);
    const decay = Math.exp(-220 * t);
    data[idx] += oscillation * decay * amplitude;
  }
}
