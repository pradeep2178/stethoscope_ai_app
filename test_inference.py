#!/usr/bin/env python3
"""
Test inference on individual audio files.

Usage:
    python test_inference.py --model models/heart_sound_cnn.pth --audio path/to/audio.wav --classes normal abnormal
    python test_inference.py --model models/lung_sound_cnn.pth --audio path/to/audio.wav --classes normal crackles wheezes
"""

import argparse
from pathlib import Path
from src.model import AudioCNN, AudioResNet
from src.inference import AudioInference


def main():
    parser = argparse.ArgumentParser(description="Test model inference on audio file")
    parser.add_argument("--model", required=True, help="Path to trained model")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--classes", nargs="+", required=True, help="Class names")
    parser.add_argument("--model-type", default="AudioCNN", help="Model type: AudioCNN or AudioResNet")
    args = parser.parse_args()

    # Check if audio file exists
    if not Path(args.audio).exists():
        print(f"Error: Audio file not found: {args.audio}")
        return

    # Load model class
    if args.model_type == "AudioCNN":
        model_class = AudioCNN(num_classes=len(args.classes))
    else:
        model_class = AudioResNet(num_classes=len(args.classes))

    # Create inference engine
    print(f"Loading model from {args.model}...")
    inference = AudioInference(args.model, model_class)

    # Run prediction
    print(f"Predicting on {args.audio}...")
    result = inference.predict(args.audio, class_names=args.classes)

    # Display results
    print(f"\nPrediction Results:")
    print(f"Predicted Class: {result['predicted_label']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"\nAll Probabilities:")
    for class_name, prob in result["all_probabilities"].items():
        print(f"  {class_name}: {prob:.4f}")


if __name__ == "__main__":
    main()
