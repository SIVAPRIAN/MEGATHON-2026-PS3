"""
REVENANT Detection Service Orchestrator
Coordinates image receipt, YOLO11n inference, annotation rendering,
geolocation resolution, and MongoDB Atlas database storage.
"""

import os
import uuid
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from backend.ml.vessel_detector import VesselDetector
from backend.services.geolocation_service import GeolocationService
from backend.database.mongodb import db_manager

BASE_DIR = Path(__file__).parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "results"

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

class DetectionService:
    def __init__(self):
        self.detector = VesselDetector()

    async def analyze_image(
        self,
        file_bytes: bytes,
        filename: str,
        confidence_threshold: float = 0.40,
        camera_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end maritime vessel detection workflow.
        """
        unique_id = uuid.uuid4().hex[:8]
        timestamp_str = datetime.now(timezone.utc).isoformat()
        analysis_id = f"ANL-{int(time.time())}-{unique_id.upper()}"

        # Clean filename
        safe_filename = "".join([c if c.isalnum() or c in "._-" else "_" for c in filename])
        if not safe_filename:
            safe_filename = "upload.jpg"

        input_filename = f"{unique_id}_{safe_filename}"
        input_path = str(UPLOADS_DIR / input_filename)
        output_filename = f"{unique_id}_annotated_{safe_filename}"
        output_path = str(RESULTS_DIR / output_filename)

        # 1. Save uploaded file to disk
        with open(input_path, "wb") as f:
            f.write(file_bytes)

        # 2. Run real fine-tuned YOLO11n vessel detection
        detections, (img_w, img_h) = self.detector.predict(
            image_path=input_path,
            confidence_threshold=confidence_threshold
        )

        # 3. Separate Geolocation resolution (only if camera metadata provided)
        for det in detections:
            cx = det["center_pixel"]["x"]
            cy = det["center_pixel"]["y"]

            coords = GeolocationService.estimate_coordinates(
                center_x=cx,
                center_y=cy,
                image_width=img_w,
                image_height=img_h,
                camera_metadata=camera_metadata
            )

            if coords:
                det["latitude"] = coords["latitude"]
                det["longitude"] = coords["longitude"]
                det["geolocation"] = coords
            else:
                det["latitude"] = None
                det["longitude"] = None
                det["geolocation"] = None

        # 4. Generate tactical annotated output image
        try:
            self.detector.annotate_image(
                input_image_path=input_path,
                output_image_path=output_path,
                detections=detections
            )
            annotated_url = f"/results/{output_filename}"
        except Exception as e:
            print(f"[ANNOTATION ERROR] Could not annotate image: {e}")
            annotated_url = f"/uploads/{input_filename}"

        # 5. Persist complete analysis record to MongoDB Atlas
        analysis_record = {
            "analysis_id": analysis_id,
            "timestamp": timestamp_str,
            "image_reference": input_filename,
            "annotated_image_url": annotated_url,
            "image_dimensions": {"width": img_w, "height": img_h},
            "detected_vessel_count": len(detections),
            "confidence_threshold": confidence_threshold,
            "vessels": detections,
            "camera_metadata": camera_metadata,
            "analysis_status": "COMPLETED" if len(detections) > 0 else "NO_VESSELS_DETECTED",
            "model": "revenant_vessel_detector.pt",
        }

        persisted = db_manager.insert_analysis(analysis_record)

        # 6. Format exact response expected by user & frontend
        return {
            "success": True,
            "analysis_id": analysis_id,
            "timestamp": timestamp_str,
            "image": annotated_url,
            "annotated_image_url": annotated_url,
            "vessel_count": len(detections),
            "vessels": detections,
            "confidence_threshold": confidence_threshold,
            "camera_metadata": camera_metadata,
            "status": "COMPLETED" if len(detections) > 0 else "NO_VESSELS_DETECTED",
            "mongodb_persisted": persisted,
            "model_version": "revenant_vessel_detector.pt (SeaShips YOLO11n 6-class)",
        }
