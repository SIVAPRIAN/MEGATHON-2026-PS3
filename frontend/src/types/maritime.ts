export type DetectionSource = 
  | 'Landsat 8/9 Optical' 
  | 'Sentinel-2 Optical' 
  | 'Sentinel-1 SAR' 
  | 'EO Camera';

export type CorrelationStatus = 
  | 'CORRELATED' 
  | 'DARK' 
  | 'UNCONFIRMED' 
  | 'INCONSISTENT' 
  | 'SUSPENDED';

export interface VesselEstimates {
  length: number; // meters
  heading: number; // degrees
  speed: number; // knots
  vesselType: 'Cargo' | 'Tanker' | 'Fishing' | 'Tug' | 'Bulk Carrier' | 'Passenger' | 'Unknown';
}

export interface CorrelationEvidence {
  confidence: number; // e.g. 93
  spatialMatchMeters: number; // e.g. 486
  timeDiffMinutes: number; // e.g. +4
  headingDiffDeg: number; // e.g. 8
  trackConsistency: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface CorrelationHistoryItem {
  time: string;
  event: string;
  detail?: string;
  badge?: string;
  statusChange?: string;
}

export interface VesselDetection {
  id: string;
  timestamp: string; // ISO string
  displayTime: string; // e.g. "2026-09-08 05:11:53 GMT"
  lat: number;
  lon: number;
  source: DetectionSource;
  sensorId?: string; // e.g. "CAM-04"
  detectionConfidence: number; // e.g. 94%
  persistenceFrames?: number; // e.g. 15 frames
  estimates: VesselEstimates;
  correlationStatus: CorrelationStatus;
  
  // Correlated fields (only present when correlated)
  vesselName?: string;
  mmsi?: string;
  imo?: string;
  flag?: string;
  callsign?: string;
  destination?: string;
  eta?: string;
  aisPosition?: [number, number]; // [lon, lat]
  correlation?: CorrelationEvidence;
  
  // Investigation & proof
  searchRadiusMeters: number; // e.g. 1500
  candidateCount: number;
  candidates?: Array<{
    mmsi: string;
    vesselName: string;
    distanceMeters: number;
    timeDiffMin: number;
    lat: number;
    lon: number;
  }>;
  
  imageUrl?: string;
  imageScaleMeters?: number;
  region: string;
  history: CorrelationHistoryItem[];
}

export interface EOCamera {
  id: string; // e.g. "PSS-001" or "PSS-056"
  name: string; // e.g. "PSS Madras"
  lat: number;
  lon: number;
  heading: number; // seaward facing heading (degrees)
  fov: number; // degrees e.g. 46
  rangeKm: number; // e.g. 12.0 or 15.0
  status: 'REFERENCE' | 'DEMO ACTIVE' | 'SELECTED' | 'ONLINE' | 'STALE' | 'OFFLINE';
  lastFrame: string; // "05:12:18 GMT"
  detectionsCount: number;
  associatedDetectionId?: string;
  associatedAisId?: string;
  imageUrl?: string;
  model: string;

  // DGLL NAIS Official Physical Shore Station (PSS) Reference Fields
  stationCode?: string;
  siteName?: string;
  fullName?: string;
  latitude?: number;
  longitude?: number;
  rawLat?: string;
  rawLon?: string;
  alolNo?: string;
  mmsi?: string;
  communication?: string;
  rcc?: string;
  state?: string;
  unionTerritory?: string;
  type?: 'Possible EO / Coastal Sensor';
  source?: 'DGLL NAIS';
  sourceUrl?: string;
}

export interface AISTrackPoint {
  time: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
}

export type VesselDisplayStatus = 'CORRELATED' | 'DARK' | 'RESTRICTED';
export type GeofenceStatus = 'OUTSIDE' | 'INSIDE_RESTRICTED';

export type ZoneType = 'RED' | 'YELLOW' | 'GREEN' | 'RESTRICTED';
export type ZoneStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface RestrictedArea {
  id: string; // unique ID
  name: string;
  zoneType: ZoneType;
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][]; // GeoJSON [lon, lat][]
  };
  status: ZoneStatus;
  createdAt: string;
  startTime?: string; // ISO timestamp or UTC string
  expiresAt?: string; // ISO timestamp
  expiresInMinutes?: number;
  timeRange?: {
    start: string;
    end: string;
  };
  createdBy: string;
}

export interface RestrictedAreaEvent {
  id: string;
  type: 'ENTRY' | 'EXIT';
  vesselId: string;
  vesselName: string;
  areaId: string;
  areaName: string;
  timestamp: string;
}

export type AuthorizationCategory = 
  | 'AUTHORISED' 
  | 'UNREGISTERED' 
  | 'DARK_VESSEL';

export interface PositionReportEvaluation {
  targetId: string;
  authorizationCategory: AuthorizationCategory;
  organisation?: string;
  permitType?: string;
  geofenceStatus: GeofenceStatus;
  displayStatus: VesselDisplayStatus;
  altitudeMeters: number;
  maxPermittedAltitude: number;
  isOutOfEnvelope: boolean;
  matchingAreas: RestrictedArea[];
  violations: string[];
}

// -----------------------------------------------------------------------------
// CENTRALIZED OVERLAY & NOTIFICATION ARCHITECTURE
// -----------------------------------------------------------------------------
export type ActiveOverlay =
  | 'status'
  | 'operator'
  | 'alert'
  | 'vesselDetail'
  | 'cameraDetail'
  | 'zoneDetail'
  | null;

export interface AppNotification {
  id: string;
  type: 'RESTRICTED_ENTRY' | 'RESTRICTED_EXIT' | 'DARK_VESSEL' | 'ALERT' | 'PATROL_DISPATCH' | 'BLIND_SPOT';
  title: string;
  targetId: string;
  targetName: string;
  zoneName?: string;
  timestamp: string;
  alertId?: string;
  vesselId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  createdAt: number;
}

// -----------------------------------------------------------------------------
// ALERT ENGINE MODELS
// -----------------------------------------------------------------------------
export type AlertStatus = 
  | 'AUTHORISED' 
  | 'UNREGISTERED' 
  | 'OUT_OF_ENVELOPE' 
  | 'LOST_LINK' 
  | 'DARK_VESSEL' 
  | 'RESTRICTED AREA ENTRY'
  | 'SENSOR_BLIND_SPOT';

export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SuggestedAction = 'MONITOR' | 'INVESTIGATE' | 'VERIFY' | 'ESCALATE';
export type AlertState = 'ACTIVE' | 'CONFIRMED' | 'DISMISSED' | 'ESCALATED';

export type DispositionReasonCode = 
  | 'CONFIRMED_CONTACT' 
  | 'FALSE_POSITIVE' 
  | 'AUTHORIZED_ACTIVITY' 
  | 'DUPLICATE_DETECTION' 
  | 'INVESTIGATION_REQUIRED' 
  | 'OTHER';

export interface MaritimeAlert {
  alertId: string;
  timestamp: string;
  targetId: string;
  targetName: string;
  status: AlertStatus;
  priority: AlertPriority;
  suggestedAction: SuggestedAction;
  evidence: {
    source: string;
    confidence?: number;
    zoneName?: string;
    details?: string;
    coordinates?: [number, number];
  };
  currentState: AlertState;
  disposition?: {
    operatorId: string;
    timestamp: string;
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE';
    reason: DispositionReasonCode;
    notes?: string;
  };
}

// -----------------------------------------------------------------------------
// APPEND-ONLY AUDIT LOG
// -----------------------------------------------------------------------------
export type AuditEventType = 
  | 'ZONE_CREATED' 
  | 'ZONE_UPDATED' 
  | 'ZONE_DELETED' 
  | 'ZONE_EXPIRED' 
  | 'VESSEL_ENTERED_ZONE' 
  | 'VESSEL_EXITED_ZONE' 
  | 'ALERT_CREATED' 
  | 'ALERT_CONFIRMED' 
  | 'ALERT_DISMISSED' 
  | 'ALERT_ESCALATED' 
  | 'CORRELATION_UPDATED'
  | 'OPTICAL_SIGHTING'
  | 'PATROL_DISPATCHED'
  | 'PATROL_RECALLED'
  | 'BLIND_SPOT_ZONE_CREATED'
  | 'REPORT_GENERATED';

export interface AuditLogEntry {
  eventId: string;
  timestamp: string;
  operatorId: string;
  eventType: AuditEventType;
  targetId: string;
  action: string;
  reason: string;
  metadata?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// TACTICAL COASTAL PATROL FLEET & DISPATCH MODELS
// -----------------------------------------------------------------------------
export type PatrolStatus = 'AVAILABLE' | 'RESPONDING' | 'BUSY' | 'ON_PATROL';

export type PatrolCraftType =
  | 'Fast Interceptor Craft'
  | 'Offshore Patrol Vessel'
  | 'Inshore Patrol Craft'
  | 'Tactical RHIB'
  | 'Marine Police Interceptor';

export interface PatrolUnit {
  id: string; // e.g., 'CP-07', 'CP-02'
  name: string; // e.g., 'ICGS C-407 Fast Interceptor'
  callsign: string; // e.g., 'VWC-07'
  station: string; // e.g., 'Madras Coast Guard Station'
  sector: string; // e.g., 'Sector 04 (Chennai Coast)'
  basePortSector?: string; // e.g., 'Sector 04 (Chennai Coast)'
  commandingOfficer?: string; // e.g., 'Asst Commandant V. Pillai'
  type: PatrolCraftType;
  craftType?: PatrolCraftType;
  lat: number;
  lon: number;
  latitude?: number;
  longitude?: number;
  heading: number;
  speedKnots: number; // Max intercept speed e.g. 35 kn
  status: PatrolStatus;
  assignedTargetId?: string; // e.g., 'DV-104'
  assignedAlertId?: string; // e.g., 'ALT-101'
  dispatchTime?: string;
  fuelPercent?: number; // e.g. 92%
  crewCount?: number; // e.g. 11
}

export interface NearestPatrolInfo {
  patrol: PatrolUnit;
  distanceKm: number;
  distanceNM: number;
  etaMinutes: number;
  isDispatchedToThisTarget: boolean;
}

// -----------------------------------------------------------------------------
// FEED INGESTION MODELS
// -----------------------------------------------------------------------------
export interface AISFeedMessage {
  mmsi: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  vesselType: string;
  vesselName?: string;
}

export interface EOFeedDetection {
  detectionId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  vesselType: 'Small Craft' | 'Fishing Boat' | 'Trawler' | 'Commercial Vessel';
  confidence: number; // 0–100%
  source: string;
  cameraId: string;
  imageEvidence?: string;
}

export interface MaritimeArea {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle' | 'circle';
  coordinates: [number, number][]; // [lon, lat]
  radiusMeters?: number; // for circle
  isTemporaryZone?: boolean;
  zoneCode?: string; // e.g. "ZONE-08"
  createdAt?: string;
  expiresAt?: string;
  expired?: boolean;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface FilterState {
  eventType: 'ALL' | 'DARK' | 'CORRELATED';
  detectionTypes: {
    optical: boolean;
    sar: boolean;
    eoCamera: boolean;
  };
  vesselTypes: {
    cargo: boolean;
    tanker: boolean;
    fishing: boolean;
    other: boolean;
  };
  searchQuery: string;
  selectedRegion: string;
}

export interface MapLayersState {
  baseStyle: 'bathymetry' | 'satellite' | 'streets';
  bathymetry: boolean;
  darkVessels: boolean;
  correlatedVessels: boolean;
  eoDetections: boolean;
  sarDetections: boolean;
  aisTracks: boolean;
  eoCameras: boolean;
  cameraFOV: boolean;
  coastline: boolean;
  ports: boolean;
  eezBoundary: boolean;
  territorial12NM: boolean;
  myAreas: boolean;
}

export interface TimeSliderState {
  window: '1h' | '6h' | '24h' | '48h' | '7d' | '30d';
  currentOffsetPercent: number; // 0 to 100
  isPlaying: boolean;
  playbackSpeed: 1 | 2;
  currentDisplayTime: string;
}

/**
 * Official Maritime Incident Dossier & Law Enforcement Report
 */
export interface IncidentReport {
  reportId: string;
  generatedAt: string;
  generatedAtIST: string;
  classification: string;
  reportingOfficer: string;
  commandAuthority: string;
  
  // Incident Core
  alertId?: string;
  incidentType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  operationalStatus: string;
  locationDescription: string;
  coordinates: {
    lat: number;
    lon: number;
    dms: string;
  };
  jurisdictionZone: string;

  // Target Vessel Intelligence
  targetVessel: {
    id: string;
    name: string;
    vesselType: string;
    status: 'DARK' | 'CORRELATED' | 'RESTRICTED';
    flag: string;
    mmsi: string;
    lengthMeters: number;
    speedKnots: number;
    courseHeadingDeg: number;
    aisBroadcastStatus: string;
    restrictedZonesViolated?: string[];
  };

  // Sensor Evidence & Telemetry
  sensorTelemetry: {
    detectingSensor: string;
    sensorType: string;
    detectionSource: string;
    sensorCoordinates?: [number, number];
    sensorAzimuthDeg?: number;
    sensorFovDeg?: number;
    sensorRangeKm?: number;
    aiModelUsed: string;
    aiConfidencePercent: number;
    correlationScorePercent: number;
  };

  // Tactical Patrol Response
  tacticalResponse: {
    patrolAssigned?: {
      id: string;
      name: string;
      unitType: string;
      baseStation: string;
      status: string;
      dispatchTime?: string;
      distanceKm?: number;
      etaMinutes?: number;
    };
    mitigationActionsTaken: string[];
    dispositionAction?: string;
    dispositionReason?: string;
    dispositionNotes?: string;
  };

  // Forensic Event Timeline
  timeline: {
    timestamp: string;
    source: string;
    event: string;
    details: string;
  }[];

  // Operator Remarks
  investigatorNotes: string;
  recommendedDirectives: string[];
  signatureVerificationCode: string;
}
