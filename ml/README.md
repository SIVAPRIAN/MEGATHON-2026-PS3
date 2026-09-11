# Machine Learning & Computer Vision Module (Future YOLO Integration)

This directory is reserved for the future AI/ML pipeline for optical vessel detection, tracking, and camera-to-geographic coordinate mapping.

---

## 🏗️ Future Pipeline Architecture

```text
Camera RTSP Video Stream
         ↓
OpenCV Video Capture / Preprocessing
         ↓
YOLO11n Object Detection (Bounding Box + Confidence)
         ↓
Multi-Object Tracker (Track ID: e.g. V-01)
         ↓
Camera Geolocation & Horizon Ray-Intersection (Estimated lat/lon)
         ↓
HTTP POST /api/detections
         ↓
REVENANT Backend (MongoDB Atlas + Geospatial Geofence Engine)
```

---

## 📂 Subdirectories Overview

- `models/`: Trained model weights (e.g. `yolo11n_maritime.pt`, `onnx` exports).
- `datasets/`: Maritime training/validation dataset annotations (VOC/YOLO format).
- `training/`: Training and hyperparameter tuning scripts.
- `inference/`: Live video feed capture and inference scripts (OpenCV + Ultralytics).
- `tracking/`: Multi-object tracker algorithms (ByteTrack / DeepSORT) producing persistent `trackId`s.

---

## 📡 Backend Ingestion Payload Specification

When the ML detection service is ready, it communicates with the backend via `POST /api/detections`:

```json
{
  "trackId": "V-01",
  "cameraId": "CAM-01",
  "timestamp": "2026-09-11T03:00:00Z",
  "class": "vessel",
  "confidence": 94.5,
  "boundingBox": {
    "x1": 420,
    "y1": 210,
    "x2": 580,
    "y2": 360
  },
  "estimatedPosition": {
    "lat": 13.0825,
    "lon": 80.3450
  },
  "heading": 135,
  "speed": 8.4,
  "imageUrl": "https://..."
}
```

The backend REST API automatically:
1. Records the detection bounding box in `detections`.
2. Updates track breadcrumb GPS history in `tracks`.
3. Runs MongoDB `2dsphere` `$geoIntersects` check on active `restrictedzones`.
4. Triggers automatic high/critical priority alerts in `alerts` if a restricted perimeter is breached.
