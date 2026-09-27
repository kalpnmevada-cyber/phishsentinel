import os
import json
import logging
import joblib
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

class MLClassifierService:
    _instance: Optional["MLClassifierService"] = None

    def __init__(self):
        self.model = None
        self.metadata = {}
        self.evaluation_metrics = {}
        self.is_loaded = False
        self._load_model()

    @classmethod
    def get_instance(cls) -> "MLClassifierService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        ml_dir = os.path.abspath(os.path.join(base_dir, "..", "..", "ml"))
        model_path = os.path.join(ml_dir, "model.joblib")
        metrics_path = os.path.join(ml_dir, "evaluation_report.json")

        # Load metrics if available
        if os.path.exists(metrics_path):
            try:
                with open(metrics_path, "r", encoding="utf-8") as f:
                    self.evaluation_metrics = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load evaluation_report.json: {e}")

        # Load model joblib artifact
        if os.path.exists(model_path):
            try:
                artifact = joblib.load(model_path)
                if isinstance(artifact, dict) and "pipeline" in artifact:
                    self.model = artifact["pipeline"]
                    self.metadata = artifact.get("metadata", {})
                    if "metrics" in artifact and not self.evaluation_metrics:
                        self.evaluation_metrics = artifact["metrics"]
                else:
                    self.model = artifact
                    self.metadata = {"model_version": "v2.0-tfidf-linear"}
                
                self.is_loaded = True
                logger.info(f"Loaded ML model successfully. Version: {self.metadata.get('model_version', 'v2.0')}")
            except Exception as e:
                logger.error(f"Failed to load ML model artifact from {model_path}: {e}")
                self.is_loaded = False
        else:
            logger.warning(f"ML model file not found at {model_path}.")
            self.is_loaded = False

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Analyzes message text and returns spam probability, prediction label, score delta, and indicator.
        """
        if not text or not text.strip():
            return {
                "probability": 0.0,
                "label": "HAM",
                "score_delta": 0,
                "model_version": self.metadata.get("model_version", "v2.0-fallback"),
                "indicator": None,
                "fired": False
            }

        cleaned = " ".join(text.split())

        if not self.is_loaded or self.model is None:
            # Fallback deterministic estimation if model is unavailable
            prob = 0.5
            label = "UNKNOWN"
            score_delta = 0
            indicator = None
        else:
            try:
                if hasattr(self.model, "predict_proba"):
                    probs = self.model.predict_proba([cleaned])[0]
                    prob = float(probs[1])
                elif hasattr(self.model, "decision_function"):
                    df_val = float(self.model.decision_function([cleaned])[0])
                    # Sigmoid approximation for decision function
                    prob = 1.0 / (1.0 + (2.71828 ** (-df_val)))
                else:
                    pred = self.model.predict([cleaned])[0]
                    prob = 1.0 if pred == 1 else 0.0

                label = "SPAM" if prob >= 0.5 else "HAM"
            except Exception as e:
                logger.error(f"ML inference error: {e}")
                prob = 0.5
                label = "ERROR"

        # Signal score weighting per Section 4:
        # Spam prob >= 0.6 -> up to +25 (scaled by confidence)
        # Ham prob <= 0.3 -> -10 dampener (reduces score only when other signals are weak)
        score_delta = 0
        indicator = None
        fired = False

        if prob >= 0.60:
            # Scale linearly from +15 at 0.60 to +25 at 1.0
            scale = (prob - 0.60) / 0.40
            score_delta = int(round(15 + scale * 10))
            fired = True
            indicator = {
                "id": "ML_SPAM_DETECTION",
                "signal_source": "ml_classifier",
                "category": "Machine Learning Pattern Match",
                "severity": "CRITICAL" if prob >= 0.85 else "HIGH",
                "title": f"Trained Model Flagged as Scam ({prob*100:.1f}% Confidence)",
                "description": f"Statistical text classifier trained on 7,700+ multi-source SMS records identified strong linguistic markers of fraud.",
                "score_delta": score_delta
            }
        elif prob <= 0.25:
            score_delta = -10
            fired = True
            indicator = {
                "id": "ML_HAM_DAMPENER",
                "signal_source": "ml_classifier",
                "category": "Legitimate Pattern Alignment",
                "severity": "LOW",
                "title": f"Linguistic Pattern Matches Legitimate Chat ({(1-prob)*100:.1f}% Ham)",
                "description": "Text structure closely aligns with authentic non-fraudulent messaging corpora.",
                "score_delta": -10
            }

        return {
            "probability": round(prob, 4),
            "label": label,
            "score_delta": score_delta,
            "model_version": self.metadata.get("model_version", "v2.0-tfidf-linear"),
            "indicator": indicator,
            "fired": fired
        }

ml_service = MLClassifierService.get_instance()
