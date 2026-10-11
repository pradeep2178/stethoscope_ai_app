import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import numpy as np
from pathlib import Path
from tqdm import tqdm
import csv
from datetime import datetime


class AudioModelTrainer:
    """
    Trainer class for audio classification models.
    Handles training, validation, and model persistence.
    """

    def __init__(
        self,
        model,
        device="cuda" if torch.cuda.is_available() else "cpu",
        learning_rate=0.001,
        weight_decay=1e-5,
    ):
        self.model = model.to(device)
        self.device = device
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
        self.scheduler = optim.lr_scheduler.StepLR(self.optimizer, step_size=10, gamma=0.5)
        self.training_log = []

        print(f"Using device: {device}")
        print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    def train_epoch(self, train_loader):
        """Train for one epoch."""
        self.model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        with tqdm(train_loader, desc="Training", leave=False) as pbar:
            for spectrograms, labels in pbar:
                spectrograms = spectrograms.to(self.device)
                labels = labels.to(self.device)

                # Forward pass
                outputs = self.model(spectrograms)
                loss = self.criterion(outputs, labels)

                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.optimizer.step()

                # Metrics
                total_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)

                pbar.set_postfix({"loss": f"{loss.item():.4f}"})

        avg_loss = total_loss / len(train_loader)
        accuracy = 100 * correct / total
        return avg_loss, accuracy

    def validate(self, val_loader):
        """Validate the model."""
        self.model.eval()
        total_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            with tqdm(val_loader, desc="Validating", leave=False) as pbar:
                for spectrograms, labels in pbar:
                    spectrograms = spectrograms.to(self.device)
                    labels = labels.to(self.device)

                    outputs = self.model(spectrograms)
                    loss = self.criterion(outputs, labels)

                    total_loss += loss.item()
                    _, predicted = torch.max(outputs.data, 1)
                    correct += (predicted == labels).sum().item()
                    total += labels.size(0)

                    pbar.set_postfix({"loss": f"{loss.item():.4f}"})

        avg_loss = total_loss / len(val_loader)
        accuracy = 100 * correct / total
        return avg_loss, accuracy

    def fit(
        self,
        train_dataset,
        epochs=50,
        batch_size=32,
        val_split=0.2,
        model_save_path="models/model.pth",
        log_save_path="models/training_log.csv",
    ):
        """
        Train the model.

        Args:
            train_dataset: PyTorch Dataset
            epochs: Number of epochs
            batch_size: Batch size
            val_split: Validation split ratio
            model_save_path: Path to save best model
            log_save_path: Path to save training logs
        """
        # Split dataset
        val_size = int(len(train_dataset) * val_split)
        train_size = len(train_dataset) - val_size
        train_set, val_set = random_split(train_dataset, [train_size, val_size])

        train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False, num_workers=0)

        print(f"Training set: {len(train_set)} samples")
        print(f"Validation set: {len(val_set)} samples")
        print(f"Total epochs: {epochs}, Batch size: {batch_size}")

        best_val_acc = 0.0
        Path(model_save_path).parent.mkdir(parents=True, exist_ok=True)

        for epoch in range(1, epochs + 1):
            print(f"\nEpoch {epoch}/{epochs}")

            # Train
            train_loss, train_acc = self.train_epoch(train_loader)

            # Validate
            val_loss, val_acc = self.validate(val_loader)

            # Scheduler step
            self.scheduler.step()

            # Log
            log_entry = {
                "epoch": epoch,
                "train_loss": train_loss,
                "train_acc": train_acc,
                "val_loss": val_loss,
                "val_acc": val_acc,
                "lr": self.optimizer.param_groups[0]["lr"],
            }
            self.training_log.append(log_entry)

            print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")

            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                self.save_model(model_save_path)
                print(f"✓ Best model saved (Val Acc: {val_acc:.2f}%)")

        # Save training log
        self.save_log(log_save_path)
        print(f"\n✓ Training complete. Best validation accuracy: {best_val_acc:.2f}%")
        return self.training_log

    def save_model(self, path):
        """Save model checkpoint."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        torch.save({
            "model_state_dict": self.model.state_dict(),
            "model_class": self.model.__class__.__name__,
            "timestamp": datetime.now().isoformat(),
        }, path)

    def load_model(self, path):
        """Load model checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Model loaded from {path}")

    def save_log(self, path):
        """Save training log to CSV."""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=self.training_log[0].keys())
            writer.writeheader()
            writer.writerows(self.training_log)
        print(f"Training log saved to {path}")
