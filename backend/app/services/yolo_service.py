import os
import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

# Get absolute path to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")

def validate_leaf_image(image_path: str):
    """
    Validates whether the uploaded image is actually a plant/crop leaf.
    Prevents false diagnoses and misinformation when users upload non-leaf images
    (such as people, animals, cars, random objects, screenshots, or inappropriate pictures).
    """
    img = cv2.imread(image_path)
    if img is None:
        return False, "Could not decode the uploaded image file."

    h, w, _ = img.shape
    total_pixels = h * w

    # Check for blank / flat / solid color images
    color_std = float(np.std(img))
    if color_std < 14.0:
        return False, "The image appears blank or monochromatic with no natural leaf texture."

    # Convert to HSV color space to examine biological foliage pigment
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # 1. Healthy / Live Foliage: Green, Olive, Yellow-Green (Hue 25 to 88, S > 25, V > 25)
    green_mask = cv2.inRange(hsv, np.array([25, 25, 25]), np.array([88, 255, 255]))

    # 2. Diseased / Blighted / Rust Foliage: Yellow, Rust, Brown (Hue 10 to 25, S > 30, V > 30)
    decay_mask = cv2.inRange(hsv, np.array([10, 30, 30]), np.array([25, 255, 250]))

    plant_mask = cv2.bitwise_or(green_mask, decay_mask)
    plant_ratio = cv2.countNonZero(plant_mask) / total_pixels

    # Excess Green Index: 2*G - R - B
    b, g, r = cv2.split(img.astype(np.float32))
    exg = 2 * g - r - b
    positive_exg_ratio = float(np.count_nonzero(exg > 5)) / total_pixels

    # If neither foliage color nor plant pigment indices are present
    if plant_ratio < 0.08 and positive_exg_ratio < 0.08:
        return False, "The uploaded image does not contain recognized plant or leaf features."

    return True, "Valid leaf features detected."

class DiseaseDetector:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        if YOLO is None:
            print("ultralytics package is not installed yet. Disease detector model offline.")
            self.model = None
            return

        try:
            print(f"Loading YOLO model from {MODEL_PATH}...")
            self.model = YOLO(MODEL_PATH)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.model = None

    def predict(self, image_path: str):
        if not self.model:
            raise RuntimeError("YOLO Model is not loaded or ultralytics is missing.")

        # Step 1: Pre-validation to reject non-leaf or inappropriate images
        is_leaf, leaf_msg = validate_leaf_image(image_path)
        if not is_leaf:
            return {
                "status": "inappropriate_image",
                "is_leaf": False,
                "message": "Inappropriate Image: Uploaded image is not a recognized crop leaf.",
                "reason": leaf_msg,
                "predictions": []
            }

        # Step 2: Run inference
        results = self.model(image_path)

        if not results:
            return {"error": "No results returned from model"}

        # Extract predictions from the first result
        result = results[0]
        predictions = []

        # If this is a detection model, it will have boxes
        if hasattr(result, 'boxes') and result.boxes is not None and len(result.boxes) > 0:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                class_name = result.names[class_id]
                xyxy = box.xyxy[0].tolist()

                predictions.append({
                    "type": "detection",
                    "class": class_name,
                    "confidence": confidence,
                    "box": xyxy
                })

        # If this is a classification model, it will have probs
        elif hasattr(result, 'probs') and result.probs is not None:
            top_class_id = int(result.probs.top1)
            confidence = float(result.probs.top1conf.item())
            class_name = result.names[top_class_id]

            # Confidence safety threshold to avoid misinformation on ambiguous images
            if confidence < 0.40:
                return {
                    "status": "inappropriate_image",
                    "is_leaf": False,
                    "message": "Inappropriate Image: Unable to verify leaf disease with confidence.",
                    "reason": "Image lacks clear disease patterns or is not a recognized leaf.",
                    "predictions": []
                }

            predictions.append({
                "type": "classification",
                "class": class_name,
                "confidence": confidence
            })

        return {
            "status": "success",
            "is_leaf": True,
            "predictions": predictions
        }

# Singleton instance
detector = DiseaseDetector()

