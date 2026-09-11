# Coastal Surveillance Console for Civil Law Enforcement (`REVENANT`)

A high-reliability maritime situational awareness and law enforcement surveillance console built to monitor coastal waters, detect anomalous/dark vessels, enforce dynamic exclusion zones, and integrate electro-optical camera sensors with live AIS transponder feeds.

---

## 📁 Repository Structure

The project is organized into modular subsystems:

```text
coastal-view/
├── backend/                  # REST API & MongoDB Atlas backend layer (Express + Mongoose + TypeScript)
│   ├── src/
│   │   ├── config/           # Database connection & environment configuration
│   │   ├── controllers/      # Route controllers (vessels, zones, alerts, detections, ais, audit)
│   │   ├── middleware/       # Error handlers, rate limiting, and request validation
│   │   ├── models/           # Mongoose schemas with 2dsphere GeoJSON spatial indexes
│   │   ├── routes/           # Express router endpoints
│   │   ├── services/         # Turf.js geofencing, AIS correlation & alert automation
│   │   ├── scripts/          # Database seeding, AIS dataset import, and API test scripts
│   │   └── server.ts         # Main backend server entrypoint
│   ├── package.json          # Backend-specific dependencies and scripts
│   ├── tsconfig.json         # Backend TypeScript configuration
│   └── .env.example          # Sample environment variables for backend
│
├── frontend/                 # Operator UI Console (React 19 + TypeScript + Vite + MapLibre GL)
│   ├── src/
│   │   ├── components/       # Tactical Radar Map, Vessel Details, Camera Feeds, Alert Panels
│   │   ├── hooks/            # Live polling & query hooks for backend REST APIs
│   │   ├── types/            # TypeScript interfaces & GeoJSON type definitions
│   │   ├── utils/            # Coordinate transformation, nautical calculations & Turf helpers
│   │   ├── App.tsx           # Primary Tactical Console layout
│   │   └── main.tsx          # React application root
│   ├── public/               # Static icons, nautical symbology, and assets
│   ├── package.json          # Frontend-specific dependencies and scripts
│   ├── vite.config.ts        # Vite dev server & build configuration
│   ├── tailwind.config.js    # Tailwind styling tokens & radar themes
│   └── tsconfig.json         # Frontend TypeScript configuration
│
├── data/                     # Maritime datasets & raw geospatial coordinates
│   ├── ais/
│   │   └── ais_synthetic.csv # 2,000 synthetic AIS observations (Chennai/Coromandel Coast)
│   └── README.md             # Dataset documentation, coordinate bounds, and ingestion guides
│
├── ml/                       # Future AI / Computer Vision vessel detection subsystem
│   ├── models/               # YOLO model weights (.pt / .onnx placeholders)
│   ├── datasets/             # Annotated maritime imagery & YOLO bounding box labels
│   ├── training/             # PyTorch / Ultralytics YOLO training scripts
│   ├── inference/            # Real-time RTSP/video camera frame detector
│   ├── tracking/             # DeepSORT / ByteTrack multi-vessel tracker
│   └── README.md             # Ingestion payload specifications & integration guide
│
├── docs/                     # Architectural, API reference, and deployment documentation
│   ├── architecture/
│   │   └── ARCHITECTURE.md   # Detailed system architecture, data models & security design
│   ├── api/
│   │   └── API_REFERENCE.md  # Complete REST API specifications & request examples
│   └── README.md             # Documentation directory index
│
├── .env.example              # Sample environment variable template for root
├── .gitignore                # Git ignore rules for Node, Python, and environments
├── package.json              # Root workspace orchestrator scripts
└── README.md                 # Project README
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **MongoDB Atlas**: Active MongoDB Atlas cluster connection string

### 2. Environment Setup
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```
Fill in your MongoDB Atlas connection string:
```ini
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/coastal_surveillance?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
```

---

## 💻 Running the Application

### Option A: From Root Directory
```bash
# Start backend server (port 5000)
npm run dev:backend

# Start frontend console (port 5173)
npm run dev:frontend

# Seed database with initial demo records (cameras, zones, vessels, alerts)
npm run seed

# Ingest the 2,000 synthetic AIS observation dataset into MongoDB Atlas
npm run import:ais

# Run backend API validation test suite
npm run test:api
```

### Option B: From Individual Subsystems

#### Backend:
```bash
cd backend
npm run dev       # Watch mode
npm run start     # Production start
npm run seed      # Populate initial collections
npm run import:ais# Import AIS CSV data
npm run test:api  # Run API tests
```

#### Frontend:
```bash
cd frontend
npm run dev       # Start Vite dev server on http://localhost:5173
npm run build     # Build production bundle
npm run preview   # Preview production build
```

---

## 📡 REST API & Services Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & MongoDB Atlas connection status |
| `/api/vessels` | `GET`, `POST` | Vessel tracks, statuses, and spatial queries |
| `/api/zones` | `GET`, `POST`, `DELETE` | GeoJSON exclusion zones with 2dsphere indexing |
| `/api/alerts` | `GET`, `PATCH` | Law enforcement alerts (Dark vessels, geofence breaches) |
| `/api/detections` | `POST` | Ingestion endpoint for future YOLO / ML detections |
| `/api/ais` | `GET` | Query AIS records (supports `?dataSource=DEMO` or `SYNTHETIC_DATASET`) |
| `/api/ais/targets` | `GET` | Returns latest distinct AIS vessel positions |
| `/api/ais/history/:mmsi` | `GET` | Historical track positions for specific MMSI |
| `/api/ais/nearby` | `GET` | Geospatial `$nearSphere` search (`lat`, `lon`, `maxDistanceKm`) |
| `/api/audit-logs` | `GET`, `POST` | Tamper-evident operator action audit trails |

For comprehensive payload examples and parameters, see [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md).

---

## 🤖 Future ML / YOLO Integration

The system includes a dedicated `ml/` subsystem architecture ready for YOLOv8/v11 vessel detection and DeepSORT tracking models:
- Cameras stream RTSP frames to `ml/inference/`.
- Detections are pushed to `POST /api/detections`.
- The backend automatically executes Turf.js spatial correlation against live AIS feeds to flag dark vessels.
- Complete specifications in [ml/README.md](ml/README.md).

---

## 🛡️ License & Classification

Proprietary — Developed for Maritime Surveillance & Civil Law Enforcement Operations.
