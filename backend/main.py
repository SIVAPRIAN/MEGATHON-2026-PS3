"""
REVENANT Coastal Surveillance - Python ML Microservice
Serves real-time YOLO11n vessel detection model (revenant_vessel_detector.pt),
generates annotated imagery, connects to MongoDB Atlas, and resolves geolocations.
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routes.ml import router as ml_router

app = FastAPI(
    title="REVENANT ML Vessel Detection Service",
    description="Fine-tuned YOLO11n (SeaShips 6-class) Maritime Surveillance API",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
RESULTS_DIR = BASE_DIR / "results"
UPLOADS_DIR = BASE_DIR / "uploads"

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files for serving annotated outputs and raw uploads
app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include ML detection routes
app.include_router(ml_router)

@app.get("/")
def root():
    return {
        "service": "REVENANT ML Vessel Detection Service",
        "model": "revenant_vessel_detector.pt",
        "status": "ONLINE",
        "endpoints": {
            "detect_vessels": "POST /api/ml/detect-vessels",
            "recent_analyses": "GET /api/ml/analyses",
            "health": "GET /api/ml/health",
            "annotated_results": "/results/{filename}"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ML_PORT", "8000"))
    print(f"\n========================================================================")
    print(f"🚀 REVENANT ML Microservice starting on port {port}")
    print(f"📡 API Endpoint: http://localhost:{port}/api/ml/detect-vessels")
    print(f"========================================================================\n")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
