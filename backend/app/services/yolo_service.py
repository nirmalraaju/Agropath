import os
from ultralytics import YOLO

# Get absolute path to the models directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")

class DiseaseDetector:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            print(f"Loading YOLO model from {MODEL_PATH}...")
            self.model = YOLO(MODEL_PATH)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.model = None

    def predict(self, image_path: str):
        if not self.model:
            raise RuntimeError("Model is not loaded.")
        
        # Run inference
        results = self.model(image_path)
        
        if not results:
            return {"error": "No results returned from model"}

        # Extract predictions from the first result
        result = results[0]
        
        # YOLOv8/11 classification/detection results
        predictions = []
        
        # If this is a detection model, it will have boxes
        if hasattr(result, 'boxes') and result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                class_name = result.names[class_id]
                
                # Bounding box coordinates [x1, y1, x2, y2]
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
            
            predictions.append({
                "type": "classification",
                "class": class_name,
                "confidence": confidence
            })
            
        return {
            "status": "success",
            "predictions": predictions
        }

# Singleton instance
detector = DiseaseDetector()
