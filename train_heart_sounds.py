#!/usr/bin/env python3
"""
Training script for heart sound classification model.

Dataset: PhysioNet 2016 Heart Sound Challenge
URL: https://physionet.org/content/challenge-2016/1.0.0/

Usage:
    python train_heart_sounds.py

Expected directory structure:
    data/heart_sounds/training_data/
    ├── normal/
    │   ├── a0001.wav
    │   └── ...
    └── abnormal/
        ├── b0001.wav
        └── ...
"""

import torch
from pathlib import Path
from src.dataset import HyperAugmentedAudioDataset
from src.model import AudioCNN, AudioResNet
from src.trainer import AudioModelTrainer


def main():
    # Configuration
    DATA_DIR = Path("data/heart_sounds/training_data")
    MODEL_SAVE_PATH = "models/heart_sound_cnn.pth"
    LOG_SAVE_PATH = "models/heart_sound_training_log.csv"

    EPOCHS = 50
    BATCH_SIZE = 32
    LEARNING_RATE = 0.001
    WEIGHT_DECAY = 1e-5

    # Check if data exists
    if not DATA_DIR.exists():
        print(f"Error: Data directory not found: {DATA_DIR}")
        print("Please download the PhysioNet 2016 Heart Sound Challenge dataset.")
        print("Visit: https://physionet.org/content/challenge-2016/1.0.0/")
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
