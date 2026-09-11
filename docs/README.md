# Coastal Surveillance Console Documentation

Welcome to the documentation for the **Coastal Surveillance Console for Civil Law Enforcement** (`REVENANT`).

## Documentation Index

1. **[System Architecture](architecture/ARCHITECTURE.md)**
   - High-level system architecture and component interactions
   - Database schema models and spatial indexing
   - Security, environment variables, and authentication design
   - Future ML / Computer Vision ingestion pipeline design

2. **[REST API Reference](api/API_REFERENCE.md)**
   - Endpoints overview (`/api/health`, `/api/vessels`, `/api/zones`, `/api/alerts`, `/api/detections`, `/api/ais`, `/api/audit-logs`, `/api/system`)
   - Query parameters, geospatial filtering (`/api/ais/nearby`, `/api/ais/bbox`), and payload contracts
   - Request and response examples for all core endpoints

3. **[AIS Dataset Documentation](../data/README.md)**
   - 2,000 synthetic AIS observation dataset layout
   - Geospatial bounding boxes and MMSI time series
   - Batch import tool instructions (`npm run import:ais`)

4. **[ML Subsystem Architecture](../ml/README.md)**
   - YOLO vessel detector & camera tracking specifications
   - Standardized detection ingestion payload
   - Step-by-step integration guide for future ML models
