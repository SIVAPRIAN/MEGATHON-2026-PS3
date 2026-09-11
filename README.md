# REVENANT — Maritime Domain Awareness & Sensor Fusion System

> **Advanced Coastal Surveillance, AIS/Electro-Optical Correlation & Dynamic Geofence Engine**  
> *Developed for the MEGATHON Maritime Surveillance Challenge (PS-03)*

---

## 🧭 Executive Summary

**REVENANT** is an operational Maritime Domain Awareness (MDA) and Command & Control platform designed to monitor, detect, correlate, and secure India’s **7,516 km coastline** and **2.0 million sq. km Exclusive Economic Zone (EEZ)**.

Modern maritime security faces acute vulnerabilities:
1. **Dark Vessels**: Illicit crafts switching off AIS transponders or transmitting spoofed identifiers.
2. **Restricted Zone Incursions**: Unregistered or unauthorized vessels penetrating sensitive defense corridors, marine reserves, or critical infrastructure anchorage areas.
3. **Sensor Disconnection**: Disparate optical shore cameras and coastal radars lacking real-time spatial correlation with AIS telemetry.

**REVENANT** solves these challenges by unifying **87 DGLL NAIS physical coastal radar/optical sensor stations**, **107 live-tracked maritime vessels**, UNCLOS maritime boundaries (12 NM Territorial Sea, 24 NM Contiguous Zone, 200 NM EEZ), an **in-browser Turf.js geofencing engine**, and an **append-only immutable audit trail**.

---

## 🚀 Quick Start for Judges & Evaluators

### 1. Running Locally
```bash
# Clone the repository
git clone https://github.com/SIVAPRIAN/demo-coastal-view.git
cd demo-coastal-view

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser (Google Chrome or Edge recommended).

### 2. Production Build Verification
```bash
# Compile and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎮 How to Operate the Command Center

Upon loading, REVENANT presents a light-theme maritime GIS map centered on the Indian subcontinent and Indian Ocean.

```
+---------------------------------------------------------------------------------------+
|  REVENANT           [• SYSTEM ONLINE]   [🔔 Alerts (5)]   [02:00:00 UTC]   [OPERATOR-01] |
+---------------------------------------------------------------------------------------+
| [+] |                                                                                 |
| [-] |                                                                                 |
| 🧭  |                                                                                 |
| 🚢  |   [INTERACTIVE MARITIME GIS MAP]                                  [FLYOUT       |
| 📷  |   • 107 Maritime Vessels (Black / Red / Orange)                    DETAIL       |
| ⬡   |   • 87 DGLL Coastal Stations (Sensor Nodes)                        PANELS]      |
| ⚠️  |   • 12 NM, 24 NM, EEZ Boundaries                                                |
| 📶  |   • Translucent Restricted Zones                                                |
| ⚙️  |                                                                                 |
| ▶️  |                                                                                 |
+---------------------------------------------------------------------------------------+
| POS: 13°05'22.14"N 80°18'45.32"E   ZOOM: 5.4   [==== 50 nm ====]   [📖 SHOW LEGEND]  |
+---------------------------------------------------------------------------------------+
```

### Left Toolbar Navigation:
| Icon | Tool | Description |
| :--- | :--- | :--- |
| **`+` / `-`** | Zoom Controls | Smooth map zoom in and zoom out. |
| **Compass** | Recenter India | Instantly flies and frames the entire Indian coastal corridor. |
| **North** | Reset North | Resets map pitch and rotates bearing back to 0° North. |
| **Ship** | Toggle Vessels | Shows or hides all 107 vessel vector contacts. |
| **Camera** | Toggle Cameras | Shows or hides all 87 DGLL coastal optical stations. |
| **Polygon (⬡)** | Free-Draw Zone | Enters free-draw mode to define custom exclusion polygons. |
| **Shield (🛡️)** | Zone Manager | Opens the Zone Manager sidebar to edit, inspect, or toggle zones. |
| **Alert (⚠️)** | Alert Center | Opens the operational Alert Center and disposition console. |
| **Radio (📶)** | Sensors Panel | Browse all 87 DGLL shore sensor stations, ranges, and live optical feeds. |
| **Layers (🥞)** | GIS Layers | Toggle 12 NM Territorial Sea, 200 NM EEZ, or 24 NM Contiguous zones. |
| **Audit (📋)** | Audit Trail | Opens the append-only, immutable operator audit trail log. |
| **Play (▶️)** | **Demo Scenarios** | **Primary Evaluation Tool**: Executes automated test scenarios 1–7. |

---

## 🧪 Evaluator Scenarios Walkthrough (Scenarios 1–7)

Click the **Play (▶️) button** on the left toolbar to open the **Demonstration Scenarios Panel**. Click **RUN DEMO** on any scenario to test the system in real time:

---

### Scenario 1: EO Sensor Detection + AIS Match → CORRELATED (Black)
* **Goal**: Validate automated spatial and temporal correlation between an optical fix and an AIS broadcast.
* **Mechanism**: Camera **PSS Madras (CAM-04)** captures an optical sighting off the Chennai coast. The correlation engine cross-references live AIS transponders within a 5 NM search window and matches `VSL-003 (MAERSK DHARWAD)` within 486 meters (93% confidence).
* **Expected Result**: 
  - Map auto-focuses on Chennai / PSS Madras.
  - Camera FOV wedge illuminates seaward.
  - Vessel icon displays as **Black/Navy Pointed Silhouette**.
  - Detail drawer confirms AIS MMSI, speed, heading, and sensor correlation.

---

### Scenario 2: EO Optical Fix with No AIS → DARK VESSEL (Red)
* **Goal**: Detect suspicious unregistered maritime contacts operating with AIS transmitters disabled.
* **Mechanism**: PSS Madras optical tracking system detects an unidentified trawler (`VSL-008`). The system polls coastal transponders: zero matches within the 5 NM radius.
* **Expected Result**: 
  - System flags vessel as **DARK VESSEL**.
  - Vessel icon changes to high-contrast **Red Silhouette** with a dashed historical tracking vector.
  - High-priority operational alert `ALT-101` is generated in the Alert Center.

---

### Scenario 3: Dark Vessel Dynamically Correlated with New AIS
* **Goal**: Test live dynamic recovery and re-correlation when a dark craft turns on its transponder.
* **Mechanism**: Vessel `VSL-008` broadcasts a fresh AIS message. The engine matches the coordinates against the open dark detection.
* **Expected Result**: 
  - Contact instantly flips from **Red (Dark)** to **Black (Correlated)** without page reload.
  - System logs an append-only audit event: `CORRELATION_ESTABLISHED`.
  - Notification toast confirms transponder acquisition.

---

### Scenario 4: Vessel Enters Active Restricted Zone → ORANGE (Violation)
* **Goal**: Demonstrate zero-latency point-in-polygon geofencing and automatic breach alerts.
* **Mechanism**: Container vessel `VSL-011 (CHENNAI TRADER)` is routed across the boundary into **RESTRICTED AREA 01**.
* **Expected Result**: 
  - Vessel icon immediately transitions from **Black** to **Orange (Restricted Violation)**.
  - Perimeter entry event is recorded once (no alert spam).
  - High-priority toast notification appears: *"RESTRICTED AREA ENTRY: VSL-011 entered RESTRICTED AREA 01"*.
  - Audit event `ZONE_VIOLATION_DETECTED` is recorded.

---

### Scenario 5: Zone Deletion & Immediate Status Recovery
* **Goal**: Confirm that vessel states recover immediately when an exclusion zone is decommissioned.
* **Mechanism**: Both a correlated vessel (`VSL-011`) and a dark vessel (`DV-104`) are situated inside a temporary red zone. The operator deletes the zone.
* **Expected Result**: 
  - The polygon boundary instantly clears from the map canvas.
  - The vessels immediately revert to their underlying states: `VSL-011` reverts to **Black**, while `DV-104` reverts to **Red**.
  - Audit event `ZONE_DELETED` is logged with operator ID.

---

### Scenario 6: Automatic Zone Expiry (5-Second Countdown)
* **Goal**: Demonstrate temporary operational corridors and automated expiry garbage collection.
* **Mechanism**: A temporary cautionary anchorage with a 5-second lifespan is established over contact `VSL-011`.
* **Expected Result**: 
  - Contact turns **Orange** for the duration of the 5-second active window.
  - At expiration, the zone auto-deletes from the map and state without user intervention.
  - Contact `VSL-011` returns to **Black**.
  - Append-only audit log records event `ZONE_EXPIRED`.

---

### Scenario 7: Operator Alert Disposition Workflow
* **Goal**: Test Human-in-the-Loop (HITL) triage and mandatory reason code validation.
* **Mechanism**: Operator selects an active alert from the Alert Center and executes triage.
* **Expected Result**: 
  - Operator can select **CONFIRM**, **DISMISS**, or **ESCALATE**.
  - Form strictly enforces selection of an operational Reason Code (`CONFIRMED_THREAT`, `FALSE_POSITIVE`, `ROUTINE_TRAFFIC`, etc.).
  - The alert status transitions, badge color updates, and an immutable log entry is committed.

---

## 🎨 Map Symbology & Color Guide

| Visual Symbol | Meaning | Tactical Significance |
| :--- | :--- | :--- |
| **▲ Black / Navy** | Correlated Vessel | Verified AIS transponder fix matching radar/EO sighting. |
| **▲ Red** | Dark Vessel | Optical/radar detection with NO active AIS broadcast (Suspicious). |
| **▲ Orange** | Geofence Violation | Craft located inside active Red or Yellow restricted perimeter. |
| **📷 Blue / Navy** | Coastal Sensor Node | Physical DGLL NAIS station (click to view live FOV arc & optical stream). |
| **Cyan Sector Arc** | Camera FOV Cone | 10–25 km seaward electro-optical observation corridor. |
| **Red Polygon** | Exclusion Zone | Strict military/naval exclusion zone (all civilian vessels flag Orange). |
| **Yellow Polygon** | Cautionary Anchorage | Temporary maritime advisory anchorage. |
| **Dashed Cyan Line** | 12 NM Territorial Sea | Sovereign waters under UNCLOS Article 3. |
| **Dashed Blue Line** | 200 NM Indian EEZ | Sovereign resource & economic jurisdiction zone. |

---

## 🛠️ Architecture & Technical Implementation

```
src/
├── components/
│   ├── MapView.tsx              # MapLibre GL instance, viewport HUD, and layer coordinator
│   ├── LeftToolbar.tsx          # Centralized dock toolbar with single-active-panel state
│   ├── Header.tsx               # Status HUD, active alert count pill, operator metadata
│   ├── VesselDetailCard.tsx     # Contextual vessel telemetry, AIS transponder info & camera links
│   ├── CameraPopupCard.tsx      # Coastal station profile, range, bearing, and live stream launcher
│   ├── CameraFeedModal.tsx      # High-fidelity optical EO simulated camera stream
│   ├── AlertCenter.tsx          # Triage console for operational maritime alerts
│   ├── AlertDetailDrawer.tsx    # Evidence dossier and mandatory reason-code disposition
│   ├── ZoneManagerPanel.tsx     # Zone lifecycle management, GeoJSON export, and drawing prompt
│   ├── AuditLogDrawer.tsx       # Immutable append-only operational audit trail
│   ├── DemoScenariosModal.tsx   # Automated scenarios runner (Scenarios 1–7)
│   └── NotificationContainer.tsx# Queued non-overlapping notifications container
├── data/
│   ├── vessels.ts               # 107 validated vessels strictly in water along Indian coastline
│   ├── mockCameras.ts           # 87 DGLL NAIS physical stations (lighthouses & sensor towers)
│   └── mockRestrictedAreas.ts   # Tiered exclusion, cautionary, and transit zones
├── map/
│   ├── VesselLayer.ts           # High-DPI Canvas 2D rasterized vessel symbols & tracks
│   ├── CameraLayer.ts           # Sensor markers, dynamic FOV wedge sectors & selection rings
│   ├── RestrictedAreaLayer.ts   # Interactive polygon editor, hover tooltips, and stroke renders
│   └── MaritimeBoundaryLayer.ts # Global WMS raster & local vector GeoJSON (12 NM, 24 NM, EEZ)
└── utils/
    ├── geofenceEngine.ts        # In-browser Turf.js point-in-polygon verification
    ├── geoUtils.ts              # Great-circle destination, Vincenty distance, and bearing math
    └── geoValidation.ts         # Coastal bounding box and water-surface coordinate validator
```

### Key Technical Highlights:
1. **Zero-Overlap Centralized Docking System**: Only one primary overlay or sidebar panel can be active at any time, keeping the tactical map clutter-free.
2. **Synchronous Canvas 2D Image Shaders**: Eliminates fragile SVG Blob URLs and asynchronous decoding race conditions by generating native `ImageData` at `pixelRatio: 2` directly for MapLibre WebGL textures.
3. **Dedicated Web Worker Threading**: Standalone `maplibre-gl-worker.mjs` and `maplibre-gl-shared.mjs` deployed statically to process GeoJSON spatial datasets off the main UI thread.
4. **Append-Only Immutable Audit Trail**: Every zone creation, deletion, transition, and alert disposition is permanently stamped with UTC timestamps, operator ID, event type, and reason codes.

---

## ⚖️ License
Developed for educational, research, and evaluation purposes during the MEGATHON Hackathon. All maritime datasets conform to official DGLL station coordinates and UNCLOS maritime boundary baselines.
