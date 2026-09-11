"""
REVENANT Maritime Surveillance - Real YOLO11n Vessel Detector
Loads fine-tuned 'revenant_vessel_detector.pt' once on startup.
Performs vessel detection, classification across 6 SeaShips classes,
and generates tactical annotated images with bounding boxes.
"""

import os
import torch
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO

# Official SeaShips 6-Class Maritime Taxonomy
VESSEL_CLASSES = {
    0: 'general_cargo_ship',
    1: 'bulk_cargo_carrier',
    2: 'fishing_boat',
    3: 'ore_carrier',
    4: 'container_ship',
    5: 'passenger_ship',
}

# Tactical styling colors (BGR for OpenCV)
CLASS_COLORS = {
    'general_cargo_ship': (0, 165, 255),   # Orange
    'bulk_cargo_carrier': (0, 215, 255),   # Gold
    'fishing_boat': (0, 255, 0),          # Green / Inshore
    'ore_carrier': (255, 144, 30),         # Deep Sky Blue
    'container_ship': (255, 0, 0),         # Blue
    'passenger_ship': (255, 0, 255),       # Magenta
}

class VesselDetector:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(VesselDetector, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_path: str = None):
        if getattr(self, '_initialized', False):
            return

        # Determine model path
        if model_path is None:
            possible_paths = [
                Path(__file__).parent / 'revenant_vessel_detector.pt',
                Path(__file__).parent.parent / 'ml' / 'revenant_vessel_detector.pt',
                Path(__file__).parent.parent.parent / 'ml' / 'revenant_vessel_detector.pt',
            ]
            for p in possible_paths:
                if p.exists():
                    model_path = str(p)
                    break

        if not model_path or not os.path.exists(model_path):
            raise FileNotFoundError(f"revenant_vessel_detector.pt model file not found. Checked: {model_path}")

        # Choose best available device: CUDA GPU -> MPS -> CPU
        if torch.cuda.is_available():
            self.device = 'cuda'
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            self.device = 'mps'
        else:
            self.device = 'cpu'

        print(f"[ML INIT] Loading real YOLO11n weights from: {model_path}")
        print(f"[ML INIT] Target Device: {self.device}")

        # Load real YOLO11n fine-tuned model once
        self.model = YOLO(model_path)
        self.model_path = model_path
        self.class_names = getattr(self.model, 'names', VESSEL_CLASSES)
        self._initialized = True
        print(f"[ML INIT] Model loaded successfully! Classes: {self.class_names}")

    def predict(
        self,
        image_path: str,
        confidence_threshold: float = 0.40
    ) -> Tuple[List[Dict[str, Any]], Tuple[int, int]]:
        """
        Runs real YOLO inference on image.
        Returns:
            - list of detected vessels
            - image dimensions (width, height)
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Input image not found: {image_path}")

        # Run real inference with specified confidence threshold
        results = self.model.predict(
            source=image_path,
            conf=confidence_threshold,
            device=self.device,
            verbose=False,
            imgsz=640
        )

        detections: List[Dict[str, Any]] = []
        result = results[0]
        orig_shape = result.orig_shape  # (height, width)
        img_h, img_w = orig_shape[0], orig_shape[1]

        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for idx, box in enumerate(boxes, start=1):
                cls_id = int(box.cls[0].item())
                vessel_type = self.class_names.get(cls_id, f'vessel_class_{cls_id}')
                conf = float(box.conf[0].item())

                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]

                # Center pixel (x, y)
                center_x = (x1 + x2) / 2.0
                center_y = (y1 + y2) / 2.0

                detection_item = {
                    "vessel_id": idx,
                    "class_id": cls_id,
                    "vessel_type": vessel_type,
                    "confidence": round(conf, 4),
                    "bounding_box": {
                        "x1": round(x1, 1),
                        "y1": round(y1, 1),
                        "x2": round(x2, 1),
                        "y2": round(y2, 1),
                    },
                    "bounding_box_arr": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                    "center_pixel": {
                        "x": round(center_x, 1),
                        "y": round(center_y, 1),
                    },
                    "center_pixel_arr": [round(center_x, 1), round(center_y, 1)],
                }
                detections.append(detection_item)

        return detections, (img_w, img_h)

    def annotate_image(
        self,
        input_image_path: str,
        output_image_path: str,
        detections: List[Dict[str, Any]]
    ) -> str:
        """
        Draws tactical maritime bounding boxes and class overlays onto the image.
        Uses OpenCV with high contrast maritime HUD styling.
        """
        img = cv2.imread(input_image_path)
        if img is None:
            raise ValueError(f"Unable to read image at {input_image_path} for annotation")

        h, w, _ = img.shape

        for det in detections:
            v_type = det["vessel_type"]
            conf = det["confidence"]
            bb = det["bounding_box"]
            x1, y1, x2, y2 = int(bb["x1"]), int(bb["y1"]), int(bb["x2"]), int(bb["y2"])
            cx, cy = int(det["center_pixel"]["x"]), int(det["center_pixel"]["y"])

            color = CLASS_COLORS.get(v_type, (0, 255, 255))

            # Bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

            # Center target crosshair
            cv2.circle(img, (cx, cy), 4, (0, 0, 255), -1)
            cv2.drawMarker(img, (cx, cy), color, markerType=cv2.MARKER_CROSS, markerSize=12, thickness=1)

            # Label banner
            label = f"#{det['vessel_id']} {v_type.replace('_', ' ').upper()} ({conf*100:.1f}%)"
            (label_w, label_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)

            # Draw background box for text
            label_y1 = max(y1 - label_h - 8, 0)
            label_y2 = label_y1 + label_h + 8
            label_x2 = min(x1 + label_w + 10, w)

            cv2.rectangle(img, (x1, label_y1), (label_x2, label_y2), (15, 23, 42), -1)
            cv2.rectangle(img, (x1, label_y1), (label_x2, label_y2), color, 1)

            # Text
            cv2.putText(
                img,
                label,
                (x1 + 5, label_y2 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

        # Tactical REVENANT HUD watermark in top-right
        hud_text = f"REVENANT YOLO11n | {len(detections)} CONTACT(S) VERIFIED"
        cv2.putText(
            img,
            hud_text,
            (15, 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 255),
            1,
            cv2.LINE_AA
        )

        os.makedirs(os.path.dirname(output_image_path), exist_ok=True)
        cv2.imwrite(output_image_path, img)
        return output_image_path
