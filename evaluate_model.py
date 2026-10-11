#!/usr/bin/env python3
"""
Evaluation script for trained models.

Usage:
    python evaluate_model.py --model models/heart_sound_cnn.pth --data data/heart_sounds/training_data --type heart
    python evaluate_model.py --model models/lung_sound_cnn.pth --data data/lung_sounds --type lung
"""

import torch
import argparse
from pathlib import Path
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import numpy as np

from src.dataset import AudioDataset
from src.model import AudioCNN, AudioResNet


def evaluate_model(model_path, data_dir, model_type="AudioCNN"):
    """
    Evaluate a trained model on a test dataset.
    
    Args:
        model_path: Path to trained model
        data_dir: Path to dataset directory
        model_type: Model class name (AudioCNN or AudioResNet)
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Load dataset
    print(f"Loading dataset from {data_dir}...")
    dataset = AudioDataset(
        data_dir,
        sample_rate=16000,
        n_mels=64,
        n_fft=1024,
        hop_length=256,
    )
    data_loader = DataLoader(dataset, batch_size=32, shuffle=False)

    # Load model
    print(f"Loading model from {model_path}...")
    if model_type == "AudioCNN":
        model = AudioCNN(num_classes=len(dataset.class_to_idx))
    else:
        model = AudioResNet(num_classes=len(dataset.class_to_idx))

    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Evaluate
    print("\nEvaluating...")
    all_preds = []
    all_labels = []
    total_loss = 0.0
    criterion = torch.nn.CrossEntropyLoss()

    with torch.no_grad():
        for spectrograms, labels in data_loader:
            spectrograms = spectrograms.to(device)
            labels = labels.to(device)

            outputs = model(spectrograms)
            loss = criterion(outputs, labels)
            total_loss += loss.item()

            _, predicted = torch.max(outputs.data, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    # Metrics
    avg_loss = total_loss / len(data_loader)
    accuracy = accuracy_score(all_labels, all_preds)

    print(f"\nResults:")
    print(f"Loss: {avg_loss:.4f}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"\nClassification Report:")
    class_names = list(dataset.class_to_idx.keys())
    print(classification_report(all_labels, all_preds, target_names=class_names))

    print(f"\nConfusion Matrix:")
    print(confusion_matrix(all_labels, all_preds))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate trained audio classification model")
    parser.add_argument("--model", required=True, help="Path to trained model")
    parser.add_argument("--data", required=True, help="Path to test dataset")
    parser.add_argument("--type", default="AudioCNN", help="Model type: AudioCNN or AudioResNet")
    args = parser.parse_args()

    evaluate_model(args.model, args.data, args.type)
