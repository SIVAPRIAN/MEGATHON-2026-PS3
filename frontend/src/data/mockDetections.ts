import { VesselDetection } from '../types/maritime';
import { isWater, ensureWaterCoordinate } from '../utils/geoValidation';

// 1. Core demonstration correlated detection (MT PACIFIC VOYAGER offshore Kerala)
export const DEMO_CORRELATED_PRIMARY: VesselDetection = {
  id: 'VSL-027', // Also referred to as DET-2026-0891
  timestamp: '2026-09-08T05:11:53Z',
  displayTime: '2026-09-08 05:11:53 GMT',
  lat: 8.7011,
  lon: 76.3400, // Verified 30 km offshore in Arabian Sea
  source: 'Landsat 8/9 Optical',
  detectionConfidence: 96,
  estimates: {
    length: 79,
    heading: 228,
    speed: 5,
    vesselType: 'Cargo'
  },
  correlationStatus: 'CORRELATED',
  vesselName: 'MT PACIFIC VOYAGER',
  mmsi: '503891240',
  imo: '9481902',
  flag: 'Panama',
  destination: 'COCHIN (IN)',
  eta: '2026-09-08 14:00',
  aisPosition: [76.3442, 8.7042],
  correlation: {
    confidence: 93,
    spatialMatchMeters: 486,
    timeDiffMinutes: 4,
    headingDiffDeg: 8,
    trackConsistency: 'HIGH'
  },
  searchRadiusMeters: 1500,
  candidateCount: 1,
  imageScaleMeters: 310,
  region: 'Kerala Coast / Kollam Offshore',
  history: [
    { time: '04:50 GMT', event: 'AIS broadcast received by coastal receiver IN-KOL-02', badge: 'AIS' },
    { time: '05:11 GMT', event: 'Landsat 8/9 Optical pass over South Kerala', badge: 'OPTICAL' },
    { time: '05:11 GMT', event: 'Spatial search within 1,500m radius', detail: 'Found 1 matching AIS broadcast' },
    { time: '05:12 GMT', event: 'Matched MT PACIFIC VOYAGER (MMSI 503891240)', statusChange: 'CORRELATED' }
  ]
};

// 2. Core demonstration dark vessel detection (Offshore Kollam, inside CAM-06 FOV cone)
export const DEMO_DARK_PRIMARY: VesselDetection = {
  id: 'DV-104', // Also known as DET-2026-0892
  timestamp: '2026-09-08T05:11:53Z',
  displayTime: '2026-09-08 05:11:53 GMT',
  lat: 8.8450,
  lon: 76.5200, // Verified in Arabian Sea, ~6.5 km offshore within CAM-06 FOV cone
  source: 'Landsat 8/9 Optical',
  sensorId: 'CAM-06',
  detectionConfidence: 94,
  estimates: {
    length: 92,
    heading: 118,
    speed: 2,
    vesselType: 'Cargo'
  },
  correlationStatus: 'DARK',
  searchRadiusMeters: 1500,
  candidateCount: 0,
  imageScaleMeters: 346,
  region: 'Kollam Coast / Arabian Sea',
  history: [
    { time: '05:11:53 GMT', event: 'Landsat 8/9 Optical frame captured', badge: 'OPTICAL' },
    { time: '05:11:55 GMT', event: 'AIS search executed (1,500 m radius)', detail: '0 AIS messages detected' },
    { time: '05:11:56 GMT', event: 'Status assigned: DARK VESSEL DETECTION', statusChange: 'DARK' }
  ]
};

// 3. CAM-04 associated detection in Chennai waters (Inside CAM-04 FOV cone at 80.355° E)
export const DEMO_CAM04_DETECTION: VesselDetection = {
  id: 'DET-CHN-004',
  timestamp: '2026-09-08T05:12:18Z',
  displayTime: '2026-09-08 05:12:18 GMT',
  lat: 13.1020,
  lon: 80.3550, // Verified offshore in Bay of Bengal, inside CAM-04 FOV cone
  source: 'EO Camera',
  sensorId: 'CAM-04',
  detectionConfidence: 96,
  estimates: {
    length: 68,
    heading: 75,
    speed: 8,
    vesselType: 'Fishing'
  },
  correlationStatus: 'DARK',
  searchRadiusMeters: 1500,
  candidateCount: 0,
  imageScaleMeters: 280,
  region: 'Chennai Coast / Bay of Bengal',
  history: [
    { time: '05:12:15 GMT', event: 'EO Camera CAM-04 optical trigger', badge: 'CAMERA' },
    { time: '05:12:18 GMT', event: 'AIS transponder search executed', detail: '0 AIS transponders found in 1,500m' },
    { time: '05:12:18 GMT', event: 'Status: DARK VESSEL DETECTION', statusChange: 'DARK' }
  ]
};

// 4. Special Scenario: AIS / EO Spatial Inconsistency (Section 54)
export const SCENARIO_INCONSISTENCY: VesselDetection = {
  id: 'DET-INC-001',
  timestamp: '2026-09-08T05:11:53Z',
  displayTime: '2026-09-08 05:14:02 GMT',
  lat: 13.0827,
  lon: 80.3400, // Verified offshore Chennai in Bay of Bengal
  source: 'Sentinel-2 Optical',
  detectionConfidence: 93,
  estimates: {
    length: 112,
    heading: 95,
    speed: 6,
    vesselType: 'Cargo'
  },
  correlationStatus: 'INCONSISTENT',
  vesselName: 'MV CHENNAI STAR',
  mmsi: '419001289',
  flag: 'India',
  aisPosition: [80.5707, 13.1827], // 34 km offset in deeper Bay of Bengal waters
  searchRadiusMeters: 1500,
  candidateCount: 1,
  region: 'Chennai Offshore Approaches',
  history: [
    { time: '05:10 GMT', event: 'AIS reported position at 13.1827° N, 80.5707° E', badge: 'AIS' },
    { time: '05:13 GMT', event: 'Sentinel-2 optical detected vessel at 13.0827° N, 80.3400° E', badge: 'OPTICAL' },
    { time: '05:14 GMT', event: 'Flagged: AIS / EO POSITION INCONSISTENCY (34.2 km delta)', statusChange: 'INCONSISTENT' }
  ]
};

// 5. Special Scenario: False EO / Single Frame Unconfirmed (Section 53)
export const SCENARIO_UNCONFIRMED: VesselDetection = {
  id: 'DET-UNCONF-001',
  timestamp: '2026-09-08T05:11:53Z',
  displayTime: '2026-09-08 05:08:12 GMT',
  lat: 18.8800,
  lon: 72.5500, // Verified offshore Mumbai in Arabian Sea
  source: 'EO Camera',
  sensorId: 'CAM-03',
  detectionConfidence: 54, // 54% single frame
  persistenceFrames: 1,
  estimates: {
    length: 42,
    heading: 180,
    speed: 3,
    vesselType: 'Unknown'
  },
  correlationStatus: 'UNCONFIRMED',
  searchRadiusMeters: 1500,
  candidateCount: 0,
  region: 'Mumbai Offshore / Arabian Sea',
  history: [
    { time: '05:08 GMT', event: 'Single-frame optical wake glitch detected', badge: 'CAMERA' },
    { time: '05:08 GMT', event: 'Confidence below confirmation threshold (54%)', detail: 'Persistence: 1 frame' },
    { time: '05:08 GMT', event: 'Discarded: UNCONFIRMED DETECTION (No event raised)', statusChange: 'UNCONFIRMED' }
  ]
};

/**
 * Strict Offshore Box Generator
 * Generates realistic vessels ONLY within verified maritime water bounds.
 */
function generateMaritimeSectorDetections(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  count: number,
  regionName: string,
  darkRatio: number,
  idPrefix: string,
  preferredHeading: number
): VesselDetection[] {
  const detections: VesselDetection[] = [];
  const vesselNames = [
    'BLUE HORIZON', 'OCEAN PEARL', 'SAMUDRA RATNA', 'KALYAN EXPRESS',
    'MALABAR STAR', 'ARABIAN BREEZE', 'NARMADA CARRIER', 'GOLDEN TRADER',
    'ORIENTAL LEADER', 'SEAWIND PIONEER', 'MARITIME GLORY', 'BAY PROWLER',
    'SAGAR KANYA', 'DESH SHANTI', 'VISHVA CHETANA', 'EVER PROSPER'
  ];
  const flags = ['India', 'Panama', 'Liberia', 'Singapore', 'Marshall Islands', 'Tuvalu'];
  const sources: VesselDetection['source'][] = [
    'Landsat 8/9 Optical',
    'Sentinel-2 Optical',
    'Sentinel-1 SAR'
  ];

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random distribution inside the offshore bounding zone
    const latProgress = (i * 17) % count / count;
    const lonProgress = (i * 31) % count / count;
    let lat = minLat + latProgress * (maxLat - minLat);
    let lon = minLon + lonProgress * (maxLon - minLon);

    // Apply strict land validation: if on land, relocate safely into verified water
    const [waterLat, waterLon] = ensureWaterCoordinate(lat, lon, regionName);
    lat = Number(waterLat.toFixed(4));
    lon = Number(waterLon.toFixed(4));

    const isDark = (i % 10) < (darkRatio * 10);
    const length = 55 + (i * 19) % 180;
    // Varied headings around maritime shipping corridors
    const heading = (preferredHeading + (i * 37) % 60 - 30 + 360) % 360;
    const speed = 3 + (i * 4) % 15;
    const type = (i % 4 === 0) ? 'Fishing' : (i % 4 === 1) ? 'Tanker' : 'Cargo';
    const source = sources[i % sources.length];
    const mmsi = `${400000000 + (i * 81711) % 99999999}`;

    if (isDark) {
      detections.push({
        id: `${idPrefix}-D${i + 1}`,
        timestamp: '2026-09-08T05:11:53Z',
        displayTime: `2026-09-08 05:${(10 + (i % 45)).toString().padStart(2, '0')}:12 GMT`,
        lat,
        lon,
        source,
        detectionConfidence: 88 + (i % 11),
        estimates: {
          length,
          heading,
          speed,
          vesselType: type as any
        },
        correlationStatus: 'DARK',
        searchRadiusMeters: 1500,
        candidateCount: 0,
        imageScaleMeters: 300 + (i % 80),
        region: regionName,
        history: [
          { time: '05:10 GMT', event: `${source} detection recorded`, badge: 'SENSOR' },
          { time: '05:11 GMT', event: 'AIS transponder search (1,500 m)', detail: '0 matches in time window' },
          { time: '05:11 GMT', event: 'Classified: DARK VESSEL DETECTION', statusChange: 'DARK' }
        ]
      });
    } else {
      const vName = vesselNames[i % vesselNames.length];
      const flag = flags[i % flags.length];
      const spatialMatch = 260 + (i * 29) % 380;
      detections.push({
        id: `${idPrefix}-C${i + 1}`,
        timestamp: '2026-09-08T05:11:53Z',
        displayTime: `2026-09-08 05:${(10 + (i % 45)).toString().padStart(2, '0')}:40 GMT`,
        lat,
        lon,
        source,
        detectionConfidence: 92 + (i % 7),
        estimates: {
          length,
          heading,
          speed,
          vesselType: type as any
        },
        correlationStatus: 'CORRELATED',
        vesselName: vName,
        mmsi,
        imo: `${9000000 + (i * 3451) % 999999}`,
        flag,
        aisPosition: [Number((lon + 0.002).toFixed(4)), Number((lat + 0.002).toFixed(4))],
        correlation: {
          confidence: 91 + (i % 8),
          spatialMatchMeters: spatialMatch,
          timeDiffMinutes: 2 + (i % 5),
          headingDiffDeg: 2 + (i % 7),
          trackConsistency: 'HIGH'
        },
        searchRadiusMeters: 1500,
        candidateCount: 1,
        imageScaleMeters: 320,
        region: regionName,
        history: [
          { time: '04:55 GMT', event: `AIS broadcast received from ${vName}`, badge: 'AIS' },
          { time: '05:11 GMT', event: `${source} optical frame processed`, badge: 'SENSOR' },
          { time: '05:12 GMT', event: `Correlated with MMSI ${mmsi}`, statusChange: 'CORRELATED' }
        ]
      });
    }
  }

  return detections;
}

// 1. Kollam / Thiruvananthapuram Offshore Shipping Lane (Strictly in Arabian Sea, lon: 75.85 to 76.50)
const KOLLAM_CLUSTER = generateMaritimeSectorDetections(
  8.35, 9.20, 75.85, 76.50, 32, 'Kollam Offshore / Kerala', 0.50, 'KLM', 330
);

// 2. Mumbai Offshore & Bombay High Field (Strictly in Arabian Sea, lon: 70.80 to 72.55)
const MUMBAI_CLUSTER = generateMaritimeSectorDetections(
  18.40, 19.80, 70.80, 72.55, 45, 'Mumbai Offshore / Bombay High', 0.45, 'BOM', 150
);

// 3. Chennai & Palk Strait Coastal Corridor (Strictly in Bay of Bengal, lon: 80.35 to 81.20)
const CHENNAI_CLUSTER = generateMaritimeSectorDetections(
  12.85, 13.60, 80.35, 81.20, 30, 'Chennai Offshore / Bay of Bengal', 0.40, 'CHN', 30
);

// 4. Gujarat / Gulf of Khambhat & Arabian Sea (Strictly in water, lon: 69.10 to 71.00)
const GUJARAT_CLUSTER = generateMaritimeSectorDetections(
  20.60, 21.80, 69.10, 71.00, 24, 'Gujarat Offshore / Arabian Sea', 0.45, 'GUJ', 210
);

// 5. Visakhapatnam & Bay of Bengal Shipping Lane (Strictly in Bay of Bengal, lon: 83.45 to 84.80)
const VIZAG_CLUSTER = generateMaritimeSectorDetections(
  17.20, 18.10, 83.45, 84.80, 22, 'Visakhapatnam / Bay of Bengal', 0.35, 'VIZ', 60
);

// 6. Andaman & Nicobar Sea (Open water, lon: 92.85 to 93.80)
const ANDAMAN_CLUSTER = generateMaritimeSectorDetections(
  11.20, 12.40, 92.85, 93.80, 16, 'Andaman Sea', 0.40, 'AND', 90
);

// 7. Lakshadweep Sea (Open water, lon: 71.80 to 73.00)
const LAKSHADWEEP_CLUSTER = generateMaritimeSectorDetections(
  10.00, 11.40, 71.80, 73.00, 15, 'Lakshadweep Sea', 0.50, 'LAK', 340
);

// Final consolidated list of all detections - GUARANTEED 100% IN WATER
export const ALL_INITIAL_DETECTIONS: VesselDetection[] = [
  DEMO_CORRELATED_PRIMARY,
  DEMO_DARK_PRIMARY,
  DEMO_CAM04_DETECTION,
  SCENARIO_INCONSISTENCY,
  SCENARIO_UNCONFIRMED,
  ...KOLLAM_CLUSTER,
  ...MUMBAI_CLUSTER,
  ...CHENNAI_CLUSTER,
  ...GUJARAT_CLUSTER,
  ...VIZAG_CLUSTER,
  ...ANDAMAN_CLUSTER,
  ...LAKSHADWEEP_CLUSTER,
];
