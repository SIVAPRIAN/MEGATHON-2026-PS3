import { Track, ITrack } from '../models/Track';
import { Detection, IDetection } from '../models/Detection';
import { Vessel } from '../models/Vessel';
import { Camera } from '../models/Camera';
import { AuditLog } from '../models/AuditLog';
import { evaluateGeofence } from './geospatialService';
import { createSurveillanceAlert } from './alertService';
import { correlateTargetWithAIS } from './aisCorrelationService';

export interface IngestDetectionPayload {
  trackId: string;
  cameraId: string;
  timestamp?: string | Date;
  class?: string;
  confidence: number;
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  estimatedPosition?: {
    lat: number;
    lon: number;
  };
  heading?: number;
  speed?: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface IngestDetectionResult {
  detection: IDetection;
  track: ITrack;
  geofence: {
    isInsideRestricted: boolean;
    zoneNames: string[];
    zoneIds: string[];
  };
  alertGenerated?: boolean;
  correlation?: {
    isCorrelated: boolean;
    mmsi?: string;
    vesselName?: string;
  };
}

/**
 * ML-Ready Ingestion Pipeline for camera/YOLO detections
 */
export async function processIncomingDetection(
  payload: IngestDetectionPayload
): Promise<IngestDetectionResult> {
  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

  // 1. Generate unique detection ID
  const detectionCount = await Detection.countDocuments().exec();
  const detectionId = `DET-${1000 + detectionCount + 1}`;

  // 2. Save Detection record (YOLO bounding box + class + confidence)
  const detection = await Detection.create({
    detectionId,
    trackId: payload.trackId,
    cameraId: payload.cameraId,
    timestamp,
    class: payload.class || 'vessel',
    confidence: payload.confidence,
    boundingBox: payload.boundingBox,
    estimatedPosition: payload.estimatedPosition,
    imageUrl: payload.imageUrl,
    metadata: payload.metadata,
    isSyntheticDemo: true,
  });

  // Increment detections count on camera if known
  if (payload.cameraId) {
    await Camera.findOneAndUpdate(
      { cameraId: payload.cameraId },
      { $inc: { detectionsCount: 1 }, lastFrame: timestamp.toTimeString().split(' ')[0] + ' UTC' }
    ).exec();
  }

  // 3. Fallback coordinates if estimatedPosition is provided
  const lat = payload.estimatedPosition?.lat || 13.0827;
  const lon = payload.estimatedPosition?.lon || 80.2707;
  const heading = payload.heading || 0;
  const speed = payload.speed || 0;

  // 4. Perform Geospatial Restricted Zone Check (MongoDB 2dsphere $geoIntersects)
  const geofenceResult = await evaluateGeofence(lat, lon);

  // 5. Check AIS correlation if applicable
  const correlationResult = await correlateTargetWithAIS(lat, lon, heading);

  // 6. Create or Update Track (temporary tracking identity)
  let track = await Track.findOne({ trackId: payload.trackId }).exec();

  const newPoint = {
    latitude: lat,
    longitude: lon,
    speed,
    heading,
    timestamp,
  };

  if (!track) {
    track = await Track.create({
      trackId: payload.trackId,
      vesselId: correlationResult.isCorrelated ? `VSL-${payload.trackId}` : null,
      trackingStatus: 'ACTIVE',
      firstSeen: timestamp,
      lastSeen: timestamp,
      latitude: lat,
      longitude: lon,
      heading,
      speed,
      source: 'EO Camera',
      confidence: payload.confidence,
      cameraId: payload.cameraId,
      restrictedZoneStatus: geofenceResult.isInsideRestricted ? 'INSIDE_RESTRICTED' : 'OUTSIDE',
      history: [newPoint],
      isSyntheticDemo: true,
    });
  } else {
    track.lastSeen = timestamp;
    track.latitude = lat;
    track.longitude = lon;
    track.heading = heading;
    track.speed = speed;
    track.confidence = payload.confidence;
    track.restrictedZoneStatus = geofenceResult.isInsideRestricted ? 'INSIDE_RESTRICTED' : 'OUTSIDE';
    if (payload.cameraId) track.cameraId = payload.cameraId;
    track.history.push(newPoint);
    await track.save();
  }

  // 7. Auto-Generate Alert if vessel is inside restricted zone
  let alertGenerated = false;
  if (geofenceResult.isInsideRestricted) {
    alertGenerated = true;
    const zoneName = geofenceResult.zoneNames.join(', ');
    const priority = geofenceResult.highestSeverity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';

    await createSurveillanceAlert({
      type: 'RESTRICTED_ENTRY',
      status: 'RESTRICTED AREA ENTRY',
      priority,
      title: `Unauthorized entry into ${zoneName}`,
      description: `Track ${payload.trackId} detected inside restricted maritime boundary (${zoneName}).`,
      targetId: payload.trackId,
      targetName: correlationResult.vesselName || `TRACK ${payload.trackId}`,
      trackId: payload.trackId,
      vesselId: track.vesselId || undefined,
      cameraId: payload.cameraId,
      zoneId: geofenceResult.zoneIds[0],
      latitude: lat,
      longitude: lon,
      suggestedAction: 'ESCALATE',
      evidence: {
        source: `Camera ${payload.cameraId} ML Detection`,
        confidence: payload.confidence,
        zoneName,
        details: `Bounding box: [${payload.boundingBox.x1}, ${payload.boundingBox.y1}, ${payload.boundingBox.x2}, ${payload.boundingBox.y2}]`,
        coordinates: [lon, lat],
      },
    });
  }

  return {
    detection,
    track,
    geofence: {
      isInsideRestricted: geofenceResult.isInsideRestricted,
      zoneNames: geofenceResult.zoneNames,
      zoneIds: geofenceResult.zoneIds,
    },
    alertGenerated,
    correlation: {
      isCorrelated: correlationResult.isCorrelated,
      mmsi: correlationResult.mmsi,
      vesselName: correlationResult.vesselName,
    },
  };
}
