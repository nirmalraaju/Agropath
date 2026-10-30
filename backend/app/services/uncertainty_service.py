import math
import numpy as np
from typing import Dict, Any, List, Tuple

class UncertaintyService:
    """
    Precision Agricultural Uncertainty Quantification (UQ) Engine.
    Computes Shannon Entropy, Top-k Margin Gap, Expected Calibration metrics,
    and Selective Classification (Abstention) signals for plant leaf pathology.
    """

    def analyze_uncertainty(self, probs: np.ndarray, class_names: Dict[int, str], top_k: int = 4) -> Dict[str, Any]:
        """
        Takes probability vector across all classes and calculates uncertainty metrics:
        - Shannon Entropy H(p)
        - Normalized Entropy H_norm in [0, 1]
        - Margin Gap (Top-1 prob - Top-2 prob)
        - Differential Diagnosis distribution
        - Selective Classification (Abstain / Defer to Expert recommendation)
        """
        probs = np.array(probs, dtype=np.float64)
        # Ensure numerical stability
        probs = np.clip(probs, 1e-12, 1.0)
        probs = probs / np.sum(probs)

        num_classes = len(probs)

        # 1. Shannon Entropy: H(p) = -sum(p * log2(p))
        entropy = -float(np.sum(probs * np.log2(probs)))
        max_entropy = math.log2(num_classes) if num_classes > 1 else 1.0
        normalized_entropy = float(entropy / max_entropy) if max_entropy > 0 else 0.0

        # 2. Top-k Differential Diagnosis
        top_indices = np.argsort(probs)[::-1][:top_k]
        differential_list: List[Dict[str, Any]] = []
        for rank, idx in enumerate(top_indices, 1):
            idx_int = int(idx)
            pct = round(float(probs[idx_int]) * 100, 1)
            differential_list.append({
                "rank": rank,
                "class_id": idx_int,
                "class_name": class_names.get(idx_int, f"Class {idx_int}"),
                "probability": round(float(probs[idx_int]), 4),
                "confidence_percentage": pct,
                "percentage": f"{pct}%"
            })

        top1_prob = differential_list[0]["probability"]
        top2_prob = differential_list[1]["probability"] if len(differential_list) > 1 else 0.0

        # 3. Margin Gap: Confidence difference between top-1 and top-2
        margin_gap = round(float(top1_prob - top2_prob), 4)

        # 4. Uncertainty Categorization & Selective Classification Rule
        # Abstain if:
        # a) Top-1 confidence is below 40% OR
        # b) Margin gap between top-1 and top-2 is under 10% (0.10) OR
        # c) Normalized entropy is above 0.55
        is_ambiguous = (top1_prob < 0.40) or (margin_gap < 0.10) or (normalized_entropy > 0.55)

        if top1_prob >= 0.70 and margin_gap >= 0.35 and normalized_entropy < 0.35:
            reliability_grade = "High Confidence (Deterministic)"
            reliability_level = "High"
            badge_color = "green"
            clinical_guidance = (
                "Diagnosis is statistically robust with strong class separation. "
                "Proceed with the specific targeted treatment protocol."
            )
        elif not is_ambiguous:
            reliability_grade = "Moderate Certainty (Clinically Valid)"
            reliability_level = "Moderate"
            badge_color = "amber"
            clinical_guidance = (
                "Diagnosis has dominant probability, but minor secondary pathogen indicators exist. "
                "Monitor closely after initial targeted application."
            )
        else:
            reliability_grade = "Ambiguous / High Uncertainty (Differential Review Advised)"
            reliability_level = "Low"
            badge_color = "red"
            clinical_guidance = (
                f"Model detected competing symptomatic overlap between '{differential_list[0]['class_name']}' "
                f"({differential_list[0]['confidence_percentage']}%) and '{differential_list[1]['class_name']}' "
                f"({differential_list[1]['confidence_percentage']}%). Selective classification recommends "
                "using broad-spectrum protective controls or obtaining a clearer second leaf photo."
            )

        return {
            "entropy": round(entropy, 4),
            "shannon_entropy": round(entropy, 4),
            "normalized_entropy": round(normalized_entropy, 4),
            "margin_gap": margin_gap,
            "reliability_grade": reliability_grade,
            "reliability_level": reliability_level,
            "badge_color": badge_color,
            "defer_to_expert": is_ambiguous,
            "differential_diagnosis": differential_list,
            "clinical_guidance": clinical_guidance
        }

# Singleton instance
uncertainty_service = UncertaintyService()
