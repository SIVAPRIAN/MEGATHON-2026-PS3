# REVENANT System Architecture & Technical Design

## 🌐 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND APPLICATION                          │
│  React 19 • Vite • MapLibre GL • TailwindCSS • Lucide Icons             │
│  - Real-time Maritime Map & AIS Overlay                                 │
│  - Sensor & Camera Management Panels                                    │
│  - Free-Draw Geospatial Restricted Zone Creator                         │
│  - Alert Center & Operator Disposition Workflows                        │
│  - Immutable Compliance Audit Log Viewer                                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                             HTTP / JSON (REST)
                             Vite Proxy: /api -> :5000
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND REST API                             │
│  Node.js • Express 5 • TypeScript • Mongoose                            │
│  - Ingestion Pipeline: POST /api/detections (ML Ready)                  │
│  - Geospatial Restricted Zone Engine (MongoDB 2dsphere $geoIntersects)  │
│  - Rule-Based AIS ↔ Camera Track Correlation Service                    │
│  - Automated Alert & Audit Log Generator                                │
│  - Patrol Fleet Dispatch & Incident Management                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                             Mongoose Driver (TLS)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MONGODB ATLAS CLUSTER                          │
│  Database: coastal_surveillance                                         │
│  - vessels          : Surface contacts & correlated identities          │
│  - tracks           : Temporary tracking identifiers & GPS breadcrumbs  │
│  - detections       : ML bounding boxes, confidence & geolocation       │
│  - cameras          : EO/IR sensor towers, heading & FOV                │
│  - restrictedzones  : GeoJSON polygons with 2dsphere spatial index      │
│  - alerts           : Real-time incident logs with operator disposition │
│  - aisdatas         : 3 Curated DEMO + 2,000 synthetic observations     │
│  - patrolunits      : Response fleet status & dispatch assignments      │
│  - auditlogs        : Append-only compliance trail                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧭 Core Architectural Concepts

1. **Detection vs. Track vs. Vessel Identity**:
   - **Detection**: Raw camera observation (`boundingBox: {x1, y1, x2, y2}`, `class`, `confidence`).
   - **Track**: Temporal continuity identifier (`V-01`) created by the multi-object tracker with coordinate history.
   - **Vessel**: Registered maritime identity (`MMSI`, `vesselName`, `flag`, `IMO`).
2. **True Cloud Geospatial Verification**:
   - Restricted zones are stored as GeoJSON standard polygons (`[longitude, latitude]` closed loops).
   - Whenever an estimated position is ingested, the backend queries MongoDB Atlas using `$geoIntersects` with `2dsphere` indexes.
   - Breaches automatically spawn high/critical priority alerts and write to the immutable audit log.
3. **AIS Data Ingestion & Preservation**:
   - The database maintains 3 curated DEMO records (`dataSource: "DEMO"`) alongside 2,000 synthetic observations (`dataSource: "SYNTHETIC_DATASET"`).
   - Composite unique index `{ mmsi: 1, timestamp: 1 }` guarantees idempotent re-imports without duplicates.
