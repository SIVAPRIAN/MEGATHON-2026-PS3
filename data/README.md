# Maritime Surveillance Datasets

This directory contains synthetic operational and surveillance datasets used for testing and demonstration.

---

## 📂 Directory Structure

```text
data/
│
├── ais/
│   └── ais_synthetic.csv     ← 2,000 synthetic AIS vessel observations
│
└── README.md
```

---

## 🚢 Synthetic AIS Dataset (`data/ais/ais_synthetic.csv`)

- **Format:** CSV (Comma-Separated Values)
- **Observations:** 2,000 observations
- **Geographic Extent:** Indian maritime waters (Arabian Sea, Bay of Bengal, Indian Ocean, Andaman Sea)
  - Latitude Range: `8.45069` to `23.48281`
  - Longitude Range: `68.50951` to `93.29857`
- **Fields:**
  - `mmsi`: Maritime Mobile Service Identity (unique vessel transmitter ID)
  - `Date`, `Time`: Observation timestamp (UTC)
  - `longitude`, `latitude`: Geographic position
  - `sog`: Speed Over Ground (knots)
  - `cog`: Course Over Ground (degrees)
  - `heading`: Vessel compass heading (0–359°)
  - `vessel_name`: Vessel name
  - `imo`: International Maritime Organization registration number
  - `call_sign`: Radio callsign
  - `vessel_type`: Standard AIS numeric classification code
  - `status`: Navigational status
  - `length`, `width`, `draft`: Physical vessel dimensions in meters
  - `cargo`: Cargo category code
  - `transceiver`: Transponder class (`A` / `B`)

---

## 📥 Importing into MongoDB Atlas

To import these observations into the `aisdatas` collection:

```bash
# From project root:
npm run import:ais

# Or from backend directory:
cd backend
npm run import:ais
```
