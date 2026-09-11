"""
REVENANT FastAPI ML Router
Exposes POST /api/ml/detect-vessels and auxiliary model status / history endpoints.
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional
from backend.services.detection_service import DetectionService
from backend.database.mongodb import db_manager

router = APIRouter(prefix="/api/ml", tags=["Vessel Detection ML"])
detection_service = DetectionService()

@router.post("/detect-vessels")
async def detect_vessels(
    image: UploadFile = File(..., description="Uploaded coastal/optical vessel image"),
    confidence_threshold: float = Form(0.40, description="Minimum detection confidence threshold (0.05 to 0.95)"),
    camera_id: Optional[str] = Form(None),
    camera_lat: Optional[float] = Form(None),
    camera_lon: Optional[float] = Form(None),
    camera_heading: Optional[float] = Form(None),
    camera_fov: Optional[float] = Form(None),
    camera_range_km: Optional[float] = Form(None),
):
    """
    Ingests an optical camera image and runs real fine-tuned YOLO11n vessel detection
    (revenant_vessel_detector.pt). Returns detected vessels, classes, bounding boxes,
    center pixels, geolocation (if camera metadata provided), and annotated image URL.
    """
    if not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    # Read image bytes
    contents = await image.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty")

    camera_metadata = None
    if camera_lat is not None and camera_lon is not None:
        camera_metadata = {
            "camera_id": camera_id or "CAM_USER",
            "lat": camera_lat,
            "lon": camera_lon,
            "heading": camera_heading if camera_heading is not None else 90.0,
            "fov": camera_fov if camera_fov is not None else 60.0,
            "range_km": camera_range_km if camera_range_km is not None else 15.0,
        }

    try:
        result = await detection_service.analyze_image(
            file_bytes=contents,
            filename=image.filename,
            confidence_threshold=confidence_threshold,
            camera_metadata=camera_metadata
        )
        return result
    except Exception as e:
        print(f"[ML ROUTE ERROR] Error executing vessel detection: {e}")
        raise HTTPException(status_code=500, detail=f"Vessel detection failure: {str(e)}")

@router.get("/analyses")
async def get_recent_analyses(limit: int = 20):
    """
    Retrieves recent vessel detection analyses from MongoDB Atlas.
    """
    records = db_manager.get_recent_analyses(limit=limit)
    return {
        "success": True,
        "count": len(records),
        "analyses": records
    }

@router.get("/health")
async def get_ml_health():
    """
    Returns real YOLO11n model initialization status, device, and MongoDB Atlas status.
    """
    detector = detection_service.detector
    return {
        "status": "ONLINE",
        "service": "REVENANT YOLO11n Vessel Detection Engine",
        "model_file": "revenant_vessel_detector.pt",
        "target_device": detector.device,
        "classes": detector.class_names,
        "class_count": len(detector.class_names),
        "mongodb_connected": db_manager.is_connected(),
        "database": db_manager.db.name if db_manager.db is not None else None,
    }
