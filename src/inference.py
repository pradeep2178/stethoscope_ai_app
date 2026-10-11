import torch
import numpy as np
import librosa
from pathlib import Path


class AudioInference:
    """
    Inference engine for audio classification.
    Loads a trained model and performs predictions on audio data.
    """

    def __init__(self, model_path, model_class, device="cuda" if torch.cuda.is_available() else "cpu"):
        """
        Args:
            model_path: Path to saved model checkpoint
            model_class: Model class (AudioCNN or AudioResNet)
            device: Device to run inference on
        """
        self.device = device
        self.model = model_class.to(device)
        self.model.eval()

        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Model loaded from {model_path}")

        self.sample_rate = 16000
        self.n_mels = 64
        self.n_fft = 1024
        self.hop_length = 256

    def preprocess_audio(self, audio_input, sr=None):
        """
        Convert audio to Mel spectrogram.

        Args:
            audio_input: Either numpy array or path to audio file
            sr: Sample rate (optional, for arrays)

        Returns:
            Mel spectrogram as torch tensor
        """
        # Load from file if string path
        if isinstance(audio_input, str):
            audio, sr = librosa.load(audio_input, sr=self.sample_rate, mono=True)
        else:
            audio = audio_input
            if sr is None:
                sr = self.sample_rate

        # Resample if necessary
        if sr != self.sample_rate:
            audio = librosa.resample(audio, orig_sr=sr, target_sr=self.sample_rate)

        # Normalize
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

        # Convert to dB
        mel_db = librosa.power_to_db(spectrogram, ref=np.max)

        # Normalize
        mel_db = (mel_db + 80) / 80.0
        mel_db = np.clip(mel_db, -1.0, 1.0)

        # Add batch and channel dimensions
        mel_db = np.expand_dims(mel_db, axis=0)
        mel_db = np.expand_dims(mel_db, axis=0)

        return torch.from_numpy(mel_db).float().to(self.device)

    def predict(self, audio_input, class_names=None):
        """
        Predict class label and confidence.

        Args:
            audio_input: Audio array or file path
            class_names: List of class names (optional)

        Returns:
            Dictionary with prediction and confidence
        """
        spectrogram = self.preprocess_audio(audio_input)

        with torch.no_grad():
            outputs = self.model(spectrogram)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0, predicted_class].item()

        if class_names is None:
            class_names = [f"Class {i}" for i in range(len(probabilities[0]))]

        result = {
            "predicted_class": predicted_class,
            "predicted_label": class_names[predicted_class],
            "confidence": confidence,
            "all_probabilities": {
                class_names[i]: probabilities[0, i].item()
                for i in range(len(class_names))
            },
        }
        return result

    def predict_batch(self, audio_list, class_names=None):
        """
        Predict on a batch of audio samples.

        Args:
            audio_list: List of audio arrays or file paths
            class_names: List of class names (optional)

        Returns:
            List of prediction dictionaries
        """
        results = []
        for audio in audio_list:
            results.append(self.predict(audio, class_names))
        return results
