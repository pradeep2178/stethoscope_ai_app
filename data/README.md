# Dataset Structure

Place your downloaded datasets here.

## Heart Sounds

Download from: https://physionet.org/content/challenge-2016/1.0.0/

Structure:
```
data/heart_sounds/
├── training_data/
│   ├── normal/
│   │   ├── a0001.wav
│   │   └── ...
│   └── abnormal/
│       ├── b0001.wav
│       └── ...
└── metadata.csv
```

## Lung Sounds

Download from: https://bhichallenge.med.auth.gr/ICBHI_2017_Challenge

Structure:
```
data/lung_sounds/
├── normal/
│   ├── 101_0_0_0_0_0.wav
│   └── ...
├── crackles/
│   ├── 101_1_0_0_1_0.wav
│   └── ...
├── wheezes/
│   ├── 101_2_0_0_0_0.wav
│   └── ...
└── combined/
    ├── 101_1_1_0_0_0.wav
    └── ...
```

## Dataset Download Instructions

### Heart Sounds (PhysioNet 2016)
1. Visit https://physionet.org/content/challenge-2016/1.0.0/
2. Register or login
3. Download the entire dataset (training_data folder)
4. Extract to `data/heart_sounds/training_data/`

### Lung Sounds (ICBHI 2017)
1. Visit https://bhichallenge.med.auth.gr/ICBHI_2017_Challenge
2. Register or login
3. Download the audio files and metadata
4. Extract audio files to organized folders as shown above
5. Keep metadata CSV for labels
