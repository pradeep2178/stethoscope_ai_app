import os
import librosa
import numpy as np
from pathlib import Path
from torch.utils.data import Dataset
import warnings

warnings.filterwarnings('ignore')


class AudioDataset(Dataset):
    """
    PyTorch Dataset for audio files with labels.
    Loads WAV files and converts them to Mel spectrograms.
    """

    def __init__(self, data_dir, sample_rate=16000, n_mels=64, n_fft=1024, hop_length=256):
        """
        Args:
            data_dir: Path to directory containing subdirectories for each class
            sample_rate: Audio sample rate (Hz)
            n_mels: Number of Mel frequency bins
            n_fft: FFT window size
            hop_length: Number of samples between successive frames
        """
        self.data_dir = Path(data_dir)
        self.sample_rate = sample_rate
        self.n_mels = n_mels
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.files = []
        self.labels = []
        self.class_to_idx = {}

        # Discover classes and files
        self._load_dataset()

    def _load_dataset(self):
        """Recursively load all WAV files and assign labels."""
        class_idx = 0
        for class_dir in sorted(self.data_dir.iterdir()):
            if not class_dir.is_dir():
                continue
            class_name = class_dir.name
            self.class_to_idx[class_name] = class_idx

            for audio_file in sorted(class_dir.glob("*.wav")):
                self.files.append(str(audio_file))
                self.labels.append(class_idx)

            print(f"Loaded class '{class_name}': {len([f for f in self.files if self.labels[self.files.index(f)] == class_idx])} files")
            class_idx += 1

        print(f"Total files: {len(self.files)}")
        print(f"Classes: {self.class_to_idx}")

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        """Load audio, convert to spectrogram, return as tensor."""
        audio_path = self.files[idx]
        label = self.labels[idx]

        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)

            # Normalize audio
            max_abs = np.max(np.abs(audio))
            if max_abs > 0:
                audio = audio / max_abs

            # Compute Mel spectrogram
            spectrogram = librosa.feature.melspectrogram(
                y=audio,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels,
                fmin=20,
                fmax=2000,
            )

            # Convert to dB scale
            mel_db = librosa.power_to_db(spectrogram, ref=np.max)

            # Normalize to [-1, 1]
            mel_db = (mel_db + 80) / 80.0  # Typical dB range is -80 to 0
            mel_db = np.clip(mel_db, -1.0, 1.0)

            # Add channel dimension (1, n_mels, time_steps)
            mel_db = np.expand_dims(mel_db, axis=0).astype(np.float32)

            return mel_db, label
        except Exception as e:
            print(f"Error loading {audio_path}: {e}")
            # Return a zero tensor on error
            return np.zeros((1, self.n_mels, 100), dtype=np.float32), 0


class HyperAugmentedAudioDataset(AudioDataset):
    """
    Extended AudioDataset with data augmentation.
    Applies random transformations to improve model robustness.
    """

    def __init__(self, data_dir, sample_rate=16000, n_mels=64, n_fft=1024, hop_length=256, augment=True):
        super().__init__(data_dir, sample_rate, n_mels, n_fft, hop_length)
        self.augment = augment

    def __getitem__(self, idx):
        """Load audio with optional augmentation."""
        mel_db, label = super().__getitem__(idx)

        if self.augment:
            mel_db = self._augment_spectrogram(mel_db)

        return mel_db, label

    def _augment_spectrogram(self, spectrogram):
        """
        Apply random augmentations to spectrogram.
        Includes: time shift, frequency shift, intensity scaling, noise injection.
        """
        spec = spectrogram.copy()

        # Time shift: shift spectrogram along time axis
        if np.random.rand() < 0.3:
            shift = np.random.randint(-5, 5)
            if shift != 0:
                spec = np.roll(spec, shift, axis=2)

        # Frequency shift: shift along frequency axis
        if np.random.rand() < 0.3:
            shift = np.random.randint(-3, 3)
            if shift != 0:
                spec = np.roll(spec, shift, axis=1)

        # Intensity scaling
        if np.random.rand() < 0.4:
            scale = np.random.uniform(0.8, 1.2)
            spec = spec * scale
            spec = np.clip(spec, -1.0, 1.0)

        # Gaussian noise
        if np.random.rand() < 0.2:
            noise = np.random.normal(0, 0.05, spec.shape)
            spec = spec + noise
            spec = np.clip(spec, -1.0, 1.0)

        # SpecAugment: randomly mask time/frequency bins
        if np.random.rand() < 0.3:
            # Mask time steps
            t_mask_size = np.random.randint(1, 10)
            t_mask_start = np.random.randint(0, max(1, spec.shape[2] - t_mask_size))
            spec[:, :, t_mask_start:t_mask_start + t_mask_size] = 0.0

        if np.random.rand() < 0.3:
            # Mask frequency bins
            f_mask_size = np.random.randint(1, 8)
            f_mask_start = np.random.randint(0, max(1, spec.shape[1] - f_mask_size))
            spec[:, f_mask_start:f_mask_start + f_mask_size, :] = 0.0

        return spec.astype(np.float32)
