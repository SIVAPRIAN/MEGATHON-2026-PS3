import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { Vessel } from '../models/Vessel';
import { Camera } from '../models/Camera';
import { RestrictedZone } from '../models/RestrictedZone';
import { Alert } from '../models/Alert';
import { AISData } from '../models/AISData';
import { PatrolUnit } from '../models/PatrolUnit';
import { Track } from '../models/Track';
import { AuditLog } from '../models/AuditLog';
import { Detection } from '../models/Detection';

const SEED_VESSELS = [
  {
    vesselId: 'VSL-001',
    name: 'DEMO CARGO ALPHA',
    status: 'CORRELATED',
    lat: 13.11472,
    lon: 80.38042,
    heading: 90,
    speed: 8.5,
    length: 195,
    vesselType: 'Cargo',
    mmsi: '503891240',
    flag: 'Singapore',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-01',
    geofenceStatus: 'OUTSIDE',
    displayStatus: 'CORRELATED',
    authorizationStatus: 'AUTHORISED',
    isSyntheticDemo: true,
  },
  {
    vesselId: 'VSL-002',
    name: 'DEMO TANKER BETA',
    status: 'CORRELATED',
    lat: 13.0652,
    lon: 80.3621,
    heading: 180,
    speed: 12.0,
    length: 220,
    vesselType: 'Tanker',
    mmsi: '419001234',
    flag: 'India',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-02',
    geofenceStatus: 'OUTSIDE',
    displayStatus: 'CORRELATED',
    authorizationStatus: 'AUTHORISED',
    isSyntheticDemo: true,
  },
  {
    vesselId: 'VSL-008',
    name: 'SYNTHETIC UNIDENTIFIED TRAWLER',
    status: 'DARK',
    lat: 13.0825,
    lon: 80.3450,
    heading: 135,
    speed: 6.2,
    length: 32,
    vesselType: 'Fishing',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-01',
    geofenceStatus: 'INSIDE_RESTRICTED',
    restrictedAreaIds: ['RA-001'],
    restrictedAreaNames: ['HIGH SECURITY CORRIDOR'],
    displayStatus: 'RESTRICTED',
    authorizationStatus: 'DARK_VESSEL',
    isSyntheticDemo: true,
  },
  {
    vesselId: 'VSL-011',
    name: 'DEMO FAST SKIFF',
    status: 'CORRELATED',
    lat: 13.095,
    lon: 80.365,
    heading: 45,
    speed: 18.0,
    length: 14,
    vesselType: 'Skiff',
    mmsi: '419009988',
    flag: 'India',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-01',
    geofenceStatus: 'OUTSIDE',
    displayStatus: 'CORRELATED',
    authorizationStatus: 'AUTHORISED',
    isSyntheticDemo: true,
  },
  {
    vesselId: 'VSL-015',
    name: 'DEMO TUG BRAVO',
    status: 'CORRELATED',
    lat: 13.042,
    lon: 80.328,
    heading: 270,
    speed: 5.4,
    length: 28,
    vesselType: 'Tug',
    mmsi: '419004567',
    flag: 'India',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-03',
    geofenceStatus: 'OUTSIDE',
    displayStatus: 'CORRELATED',
    authorizationStatus: 'AUTHORISED',
    isSyntheticDemo: true,
  },
  {
    vesselId: 'VSL-025',
    name: 'DEMO UNREGISTERED SKIFF',
    status: 'DARK',
    lat: 13.031,
    lon: 80.315,
    heading: 310,
    speed: 14.5,
    length: 12,
    vesselType: 'Skiff',
    detectionSource: 'EO Camera',
    detectedByCamera: 'CAM-03',
    geofenceStatus: 'OUTSIDE',
    displayStatus: 'DARK',
    authorizationStatus: 'UNREGISTERED',
    isSyntheticDemo: true,
  },
];

const SEED_CAMERAS = [
  {
    cameraId: 'CAM-01',
    name: 'COASTAL EO SENSOR 01 (NORTH PORT)',
    location: 'Sector North Shore Tower',
    latitude: 13.110,
    longitude: 80.298,
    altitude: 35,
    cameraType: 'EO/IR Long-Range PTZ',
    status: 'ONLINE',
    heading: 85,
    fov: 46,
    rangeKm: 14.0,
    model: 'SURV-PTZ-4K-HD',
    stationCode: 'PSS-001',
    lastFrame: '05:12:18 UTC',
    detectionsCount: 42,
    isSyntheticDemo: true,
  },
  {
    cameraId: 'CAM-02',
    name: 'COASTAL EO SENSOR 02 (CENTRAL HARBOR)',
    location: 'Central Breakwater Lighthouse',
    latitude: 13.075,
    longitude: 80.302,
    altitude: 40,
    cameraType: 'EO/IR Dual Spectrum',
    status: 'ONLINE',
    heading: 95,
    fov: 52,
    rangeKm: 16.0,
    model: 'SURV-PTZ-4K-HD',
    stationCode: 'PSS-002',
    lastFrame: '05:12:20 UTC',
    detectionsCount: 58,
    isSyntheticDemo: true,
  },
  {
    cameraId: 'CAM-03',
    name: 'COASTAL EO SENSOR 03 (SOUTH ANCHORAGE)',
    location: 'South Coastal Ridge Tower',
    latitude: 13.015,
    longitude: 80.278,
    altitude: 30,
    cameraType: 'Fixed High-Res Optical',
    status: 'ONLINE',
    heading: 90,
    fov: 60,
    rangeKm: 12.0,
    model: 'OPTICAL-SURV-1080P',
    stationCode: 'PSS-003',
    lastFrame: '05:12:15 UTC',
    detectionsCount: 19,
    isSyntheticDemo: true,
  },
  {
    cameraId: 'CAM-04',
    name: 'COASTAL EO SENSOR 04 (OUTER REEF)',
    location: 'Offshore Sentinel Pylon',
    latitude: 12.980,
    longitude: 80.260,
    altitude: 25,
    cameraType: 'EO PTZ Optical',
    status: 'ONLINE',
    heading: 100,
    fov: 45,
    rangeKm: 15.0,
    model: 'SURV-PTZ-4K-HD',
    stationCode: 'PSS-004',
    lastFrame: '05:12:10 UTC',
    detectionsCount: 31,
    isSyntheticDemo: true,
  },
];

const SEED_ZONES = [
  {
    zoneId: 'RA-001',
    name: 'RESTRICTED AREA 01 - HIGH SECURITY CORRIDOR',
    zoneType: 'RED',
    description: 'Critical maritime exclusion perimeter around major harbor approach.',
    status: 'ACTIVE',
    severity: 'CRITICAL',
    createdBy: 'SYSTEM_ADMIN',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.320, 13.070],
          [80.370, 13.070],
          [80.370, 13.110],
          [80.320, 13.110],
          [80.320, 13.070], // closed loop
        ],
      ],
    },
    isSyntheticDemo: true,
  },
  {
    zoneId: 'RA-002',
    name: 'RESTRICTED AREA 02 - CAUTIONARY INSHORE SECTOR',
    zoneType: 'YELLOW',
    description: 'Monitored transit channel for regulated vessels only.',
    status: 'ACTIVE',
    severity: 'HIGH',
    createdBy: 'OPERATOR_1',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.330, 13.010],
          [80.380, 13.010],
          [80.380, 13.055],
          [80.330, 13.055],
          [80.330, 13.010],
        ],
      ],
    },
    isSyntheticDemo: true,
  },
  {
    zoneId: 'RA-003',
    name: 'ANCHORAGE DESIGNATED ZONE',
    zoneType: 'GREEN',
    description: 'Permitted waiting and bunkering anchorage area.',
    status: 'ACTIVE',
    severity: 'LOW',
    createdBy: 'PORT_CONTROL',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.380, 13.120],
          [80.440, 13.120],
          [80.440, 13.170],
          [80.380, 13.170],
          [80.380, 13.120],
        ],
      ],
    },
    isSyntheticDemo: true,
  },
];

const SEED_ALERTS = [
  {
    alertId: 'ALT-101',
    type: 'DARK_VESSEL',
    status: 'DARK_VESSEL',
    priority: 'CRITICAL',
    title: 'Dark Vessel Detected in Approach Corridor',
    description: 'Optical sighting without matching AIS transponder fix within 5 NM',
    targetId: 'VSL-008',
    targetName: 'UNIDENTIFIED TRAWLER',
    cameraId: 'CAM-01',
    latitude: 13.0825,
    longitude: 80.3450,
    currentState: 'ACTIVE',
    suggestedAction: 'VERIFY',
    evidence: {
      source: 'EO Optical Fix (CAM-01)',
      confidence: 94,
      details: 'Optical sighting without matching AIS transponder fix within 5 NM',
      coordinates: [80.3450, 13.0825],
    },
    isSyntheticDemo: true,
  },
  {
    alertId: 'ALT-102',
    type: 'UNREGISTERED',
    status: 'UNREGISTERED',
    priority: 'HIGH',
    title: 'Unregistered Craft in Regulated Channel',
    description: 'Operating in inshore corridor without registered authorization',
    targetId: 'VSL-025',
    targetName: 'DEMO UNREGISTERED SKIFF',
    cameraId: 'CAM-03',
    latitude: 13.031,
    longitude: 80.315,
    currentState: 'ACTIVE',
    suggestedAction: 'INVESTIGATE',
    evidence: {
      source: 'Coastal Radar / Optical Sighting',
      confidence: 88,
      details: 'Operating in inshore corridor without registration prefix',
      coordinates: [80.315, 13.031],
    },
    isSyntheticDemo: true,
  },
];

const SEED_AIS = [
  {
    mmsi: '503891240',
    vesselName: 'DEMO CARGO ALPHA',
    latitude: 13.11472,
    longitude: 80.38042,
    position: { type: 'Point', coordinates: [80.38042, 13.11472] },
    speed: 8.5,
    sog: 8.5,
    heading: 90,
    vesselType: 'Cargo',
    destination: 'CHENNAI PORT',
    imo: '9123456',
    callSign: '9V8812',
    callsign: '9V8812',
    flag: 'Singapore',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO',
    isSyntheticDemo: true,
  },
  {
    mmsi: '419001234',
    vesselName: 'DEMO TANKER BETA',
    latitude: 13.0652,
    longitude: 80.3621,
    position: { type: 'Point', coordinates: [80.3621, 13.0652] },
    speed: 12.0,
    sog: 12.0,
    heading: 180,
    vesselType: 'Tanker',
    destination: 'ENNORE TERMINAL',
    imo: '9345678',
    callSign: 'AW1234',
    callsign: 'AW1234',
    flag: 'India',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO',
    isSyntheticDemo: true,
  },
  {
    mmsi: '419009988',
    vesselName: 'DEMO FAST SKIFF',
    latitude: 13.095,
    longitude: 80.365,
    position: { type: 'Point', coordinates: [80.365, 13.095] },
    speed: 18.0,
    sog: 18.0,
    heading: 45,
    vesselType: 'Skiff',
    destination: 'INSHORE PATROL',
    flag: 'India',
    timestamp: new Date('2026-09-08T05:12:18.000Z'),
    dataSource: 'DEMO',
    isSyntheticDemo: true,
  },
];

const SEED_PATROLS = [
  {
    patrolId: 'PATROL-01',
    name: 'INTERCEPTOR CRAFT C-101',
    status: 'AVAILABLE',
    latitude: 13.090,
    longitude: 80.310,
    heading: 90,
    speed: 0,
    availability: true,
    baseStation: 'Chennai Coast Base',
    isSyntheticDemo: true,
  },
  {
    patrolId: 'PATROL-02',
    name: 'OFFSHORE PATROL VESSEL ICGS-402',
    status: 'ON_PATROL',
    latitude: 13.140,
    longitude: 80.410,
    heading: 180,
    speed: 14.2,
    availability: false,
    baseStation: 'Sector Command South',
    isSyntheticDemo: true,
  },
  {
    patrolId: 'PATROL-03',
    name: 'FAST RESPONSE CUTTER ICGS-215',
    status: 'AVAILABLE',
    latitude: 13.020,
    longitude: 80.290,
    heading: 45,
    speed: 0,
    availability: true,
    baseStation: 'Inshore Unit Point',
    isSyntheticDemo: true,
  },
];

const SEED_TRACKS = [
  {
    trackId: 'V-01',
    vesselId: 'VSL-001',
    trackingStatus: 'ACTIVE',
    firstSeen: new Date(Date.now() - 3600000),
    lastSeen: new Date(),
    latitude: 13.11472,
    longitude: 80.38042,
    heading: 90,
    speed: 8.5,
    source: 'EO Camera',
    confidence: 94,
    cameraId: 'CAM-01',
    restrictedZoneStatus: 'OUTSIDE',
    history: [
      { latitude: 13.110, longitude: 80.370, speed: 8.0, heading: 90, timestamp: new Date(Date.now() - 1800000) },
      { latitude: 13.11472, longitude: 80.38042, speed: 8.5, heading: 90, timestamp: new Date() },
    ],
    isSyntheticDemo: true,
  },
  {
    trackId: 'V-02',
    vesselId: null, // Unidentified track demonstrating tracking before identity correlation
    trackingStatus: 'ACTIVE',
    firstSeen: new Date(Date.now() - 1200000),
    lastSeen: new Date(),
    latitude: 13.0825,
    longitude: 80.3450,
    heading: 135,
    speed: 6.2,
    source: 'EO Camera',
    confidence: 91,
    cameraId: 'CAM-01',
    restrictedZoneStatus: 'INSIDE_RESTRICTED',
    history: [
      { latitude: 13.090, longitude: 80.335, speed: 6.0, heading: 130, timestamp: new Date(Date.now() - 600000) },
      { latitude: 13.0825, longitude: 80.3450, speed: 6.2, heading: 135, timestamp: new Date() },
    ],
    isSyntheticDemo: true,
  },
];

const SEED_AUDIT_LOGS = [
  {
    eventId: 'EVT-001',
    timestamp: new Date(Date.now() - 7200000),
    operatorId: 'SYSTEM',
    eventType: 'ZONE_CREATED',
    targetId: 'RA-001',
    action: 'Initialized default exclusion zone RESTRICTED AREA 01 (High Security Corridor)',
    reason: 'SYSTEM_BOOT',
    metadata: { zoneType: 'RED', coordinatesCount: 5 },
    isSyntheticDemo: true,
  },
  {
    eventId: 'EVT-002',
    timestamp: new Date(Date.now() - 3600000),
    operatorId: 'SYSTEM',
    eventType: 'ALERT_CREATED',
    targetId: 'ALT-101',
    action: 'Generated CRITICAL priority alert: Dark Vessel in Approach Corridor',
    reason: 'DARK_VESSEL',
    metadata: { alertId: 'ALT-101', targetId: 'VSL-008' },
    isSyntheticDemo: true,
  },
];

export async function runSeed(): Promise<boolean> {
  const uri = ENV.MONGODB_URI;
  if (!uri || uri.includes('<cluster-url>') || uri.includes('<username>') || uri.includes('<password>')) {
    console.error('\n❌ SEED SCRIPT ABORTED:');
    console.error('   Please provide a valid MONGODB_URI in your .env file before seeding.');
    console.error('   Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/coastal_surveillance\n');
    return false;
  }

  try {
    console.log('Connecting to MongoDB Atlas for seeding...');
    await mongoose.connect(uri, { dbName: ENV.DB_NAME });
    console.log('Connected. Populating demo datasets...');

    // Clean existing synthetic demo data (preserving imported AIS dataset records)
    await Promise.all([
      Vessel.deleteMany({ isSyntheticDemo: true }),
      Camera.deleteMany({ isSyntheticDemo: true }),
      RestrictedZone.deleteMany({ isSyntheticDemo: true }),
      Alert.deleteMany({ isSyntheticDemo: true }),
      AISData.deleteMany({ dataSource: 'DEMO' }),
      PatrolUnit.deleteMany({ isSyntheticDemo: true }),
      Track.deleteMany({ isSyntheticDemo: true }),
      AuditLog.deleteMany({ isSyntheticDemo: true }),
      Detection.deleteMany({ isSyntheticDemo: true }),
    ]);

    // Insert new synthetic demo collections
    await Vessel.insertMany(SEED_VESSELS);
    await Camera.insertMany(SEED_CAMERAS);
    await RestrictedZone.insertMany(SEED_ZONES);
    await Alert.insertMany(SEED_ALERTS);
    await AISData.insertMany(SEED_AIS);
    await PatrolUnit.insertMany(SEED_PATROLS);
    await Track.insertMany(SEED_TRACKS);
    await AuditLog.insertMany(SEED_AUDIT_LOGS);

    // Create 2dsphere indexes explicitly
    await RestrictedZone.collection.createIndex({ geometry: '2dsphere' });
    await AISData.collection.createIndex({ position: '2dsphere' });
    await AISData.collection.createIndex({ mmsi: 1, timestamp: 1 }, { unique: true });

    console.log('\n========================================================================');
    console.log('✅ DATABASE SEEDING COMPLETE');
    console.log(`   - Vessels:          ${SEED_VESSELS.length} demo records`);
    console.log(`   - Cameras:          ${SEED_CAMERAS.length} demo records`);
    console.log(`   - Restricted Zones: ${SEED_ZONES.length} GeoJSON zones (2dsphere indexed)`);
    console.log(`   - Alerts:           ${SEED_ALERTS.length} demo records`);
    console.log(`   - AIS Targets:      ${SEED_AIS.length} demo records`);
    console.log(`   - Patrol Units:     ${SEED_PATROLS.length} demo records`);
    console.log(`   - Tracks:           ${SEED_TRACKS.length} demo records`);
    console.log(`   - Audit Logs:       ${SEED_AUDIT_LOGS.length} demo records`);
    console.log('========================================================================\n');

    await mongoose.connection.close();
    return true;
  } catch (error: any) {
    console.error('❌ Database seeding failed:', error.message || error);
    await mongoose.connection.close();
    return false;
  }
}

if (process.argv[1]?.includes('seed')) {
  runSeed().then((success) => process.exit(success ? 0 : 1));
}
