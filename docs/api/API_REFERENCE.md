# REST API Reference Manual

Base URL: `http://localhost:5000/api`

---

## 🏥 System Health & Dashboard
- `GET /health` — Service status check.
- `GET /dashboard/summary` — Aggregate platform statistics (active vessels, cameras, tracks, alerts, patrol fleet, and latest audit events).

---

## 🚢 Vessels (`/vessels`)
- `GET /` — List vessels (filter by `?status=CORRELATED|DARK`, `?search=...`, `?vesselType=...`).
- `GET /:id` — Retrieve vessel details by ID.
- `POST /` — Register new vessel.
- `PUT /:id` — Update vessel.
- `DELETE /:id` — Delete vessel.

---

## 🎯 Tracks (`/tracks`)
- `GET /` — List active tracks.
- `GET /:id` — Get track by ID.
- `GET /:id/history` — Get GPS coordinate breadcrumb history for trail visualization.
- `POST /:id/close` — Mark tracking identity as `CLOSED`.

---

## 🤖 ML Detections Ingestion (`/detections`)
- `POST /` — Ingest camera/YOLO detection:
  ```json
  {
    "trackId": "V-01",
    "cameraId": "CAM-01",
    "timestamp": "2026-09-11T03:00:00Z",
    "class": "vessel",
    "confidence": 94.5,
    "boundingBox": { "x1": 420, "y1": 210, "x2": 580, "y2": 360 },
    "estimatedPosition": { "lat": 13.0825, "lon": 80.3450 },
    "heading": 135,
    "speed": 8.4
  }
  ```
- `GET /` — List detections.
- `GET /track/:trackId` — List detections for a specific track.
- `GET /camera/:cameraId` — List detections from a specific camera.

---

## 📷 Cameras (`/cameras`)
- `GET /` — List all coastal EO camera towers.
- `GET /:id` — Get camera configuration.
- `PUT /:id/status` — Update camera health status (`ONLINE`, `OFFLINE`, `STALE`).

---

## 🛑 Restricted Zones (`/zones`)
- `GET /` — List all GeoJSON restricted zones (Red, Yellow, Green).
- `GET /:id` — Get single zone.
- `POST /` — Create GeoJSON zone.
- `PUT /:id` — Update zone properties/status.
- `DELETE /:id` — Delete zone.
- `POST /check-point` or `GET /check-point?lat=...&lon=...` — Geospatial point-in-polygon evaluation via MongoDB `$geoIntersects`.

---

## 🚨 Alerts & Incidents (`/alerts`)
- `GET /` — List alerts (filter by `?currentState=ACTIVE`, `?priority=CRITICAL`).
- `GET /:id` — Get alert by ID.
- `POST /` — Create alert.
- `PUT /:id/acknowledge` — Acknowledge alert.
- `PUT /:id/resolve` — Resolve alert.
- `PUT /:id/disposition` — Apply operator disposition (`CONFIRM`, `DISMISS`, `ESCALATE` + reason code + notes).

---

## 📡 AIS Broadcasts (`/ais`)
- `GET /targets` — Query active AIS targets (supports `?dataSource=DEMO`, `?search=...`, `?near=lon,lat&radiusMeters=50000`, `?limit=100`).
- `GET /targets/:mmsi` — Get latest observation for an MMSI.
- `GET /history/:mmsi` — Retrieve full time-series observation history for an MMSI.
- `POST /correlate` — Rule-based spatial correlation matching camera tracks with nearby AIS targets.
- `POST /feed` — Ingest live AIS observation feed.

---

## 🚤 Patrol Fleet (`/patrols`)
- `GET /` — List patrol fleet.
- `PUT /:id/assign` — Dispatch patrol to an active alert ID.
- `PUT /:id/release` — Release patrol back to available status.

---

## 📜 Audit Logs (`/audit-logs`)
- `GET /` — Query immutable compliance audit logs.
- `POST /` — Record audit event.
