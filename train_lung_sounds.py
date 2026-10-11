#!/usr/bin/env python3
"""
Training script for lung sound classification model.

Dataset: ICBHI 2017 Respiratory Sound Challenge
URL: https://bhichallenge.med.auth.gr/ICBHI_2017_Challenge

Usage:
    python train_lung_sounds.py

Expected directory structure:
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
"""

import torch
from pathlib import Path
from src.dataset import HyperAugmentedAudioDataset
from src.model import AudioCNN, AudioResNet
from src.trainer import AudioModelTrainer


def main():
    # Configuration
    DATA_DIR = Path("data/lung_sounds")
    MODEL_SAVE_PATH = "models/lung_sound_cnn.pth"
    LOG_SAVE_PATH = "models/lung_sound_training_log.csv"

    EPOCHS = 50
    BATCH_SIZE = 32
    LEARNING_RATE = 0.001
    WEIGHT_DECAY = 1e-5

    # Check if data exists
    if not DATA_DIR.exists():
        print(f"Error: Data directory not found: {DATA_DIR}")
        print("Please download the ICBHI 2017 Respiratory Sound Challenge dataset.")
        print("Visit: https://bhichallenge.med.auth.gr/ICBHI_2017_Challenge")
        return

    # Load dataset
    print("Loading dataset...")
    dataset = HyperAugmentedAudioDataset(
        str(DATA_DIR),
        sample_rate=16000,
        n_mels=64,
        n_fft=1024,
        hop_length=256,
        augment=True,
    )

    num_classes = len(dataset.class_to_idx)
    print(f"Number of classes: {num_classes}")
    print(f"Classes: {dataset.class_to_idx}")

    # Create model
    print("\nCreating model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = AudioCNN(num_classes=num_classes)
    # Alternative: model = AudioResNet(num_classes=num_classes)

    # Create trainer
    trainer = AudioModelTrainer(
        model,
        device=device,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
    )

    # Train
    print(f"\nStarting training for {EPOCHS} epochs...\n")
    trainer.fit(
        dataset,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        val_split=0.2,
        model_save_path=MODEL_SAVE_PATH,
        log_save_path=LOG_SAVE_PATH,
    )

    print(f"\n✓ Model saved to: {MODEL_SAVE_PATH}")
    print(f"✓ Training log saved to: {LOG_SAVE_PATH}")


if __name__ == "__main__":
    main()
