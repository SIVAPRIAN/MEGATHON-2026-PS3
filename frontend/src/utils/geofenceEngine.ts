import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { RestrictedArea, RestrictedAreaEvent, VesselDisplayStatus, GeofenceStatus } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { checkAuthorisedRegistry } from '../data/authorizedRegistry';

/**
 * Checks whether a coordinate point [lon, lat] is inside a given GeoJSON polygon.
 * Ensures the polygon ring is closed (first and last coordinate match).
 */
export function isPointInsideRestrictedPolygon(
  lon: number,
  lat: number,
  coordinates: [number, number][][]
): boolean {
  if (!coordinates || coordinates.length === 0 || coordinates[0].length < 3) {
    return false;
  }

  const ring = [...coordinates[0]];
  // Ensure polygon is closed for GeoJSON standard
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  try {
    const pt = turfPoint([lon, lat]);
    const poly = turfPolygon([ring]);
    return booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error('Error testing point in polygon', err);
    return false;
  }
}

/**
 * Checks a vessel position report against restricted areas, authorised registry,
 * and 3D altitude-envelope limits.
 */
export function evaluateVesselGeofence(
  vessel: Vessel,
  restrictedAreas: RestrictedArea[]
): {
  geofenceStatus: GeofenceStatus;
  displayStatus: VesselDisplayStatus;
  matchingAreas: RestrictedArea[];
  authorizationStatus: 'AUTHORISED' | 'UNREGISTERED' | 'DARK_VESSEL';
  organisation?: string;
  permitType?: string;
  altitudeMeters: number;
  maxPermittedAltitude: number;
  isOutOfEnvelope: boolean;
  violations: string[];
} {
  const now = Date.now();
  const activeAreas = restrictedAreas.filter((area) => {
    if (area.status !== 'ACTIVE') return false;
    if (area.startTime) {
      const start = new Date(area.startTime).getTime();
      if (!isNaN(start) && now < start) return false;
    }
    if (area.expiresAt) {
      const exp = new Date(area.expiresAt).getTime();
      if (!isNaN(exp) && now > exp) return false;
    }
    return true;
  });

  const matchingAreas = activeAreas.filter((area) =>
    isPointInsideRestrictedPolygon(vessel.lon, vessel.lat, area.geometry.coordinates)
  );

  // Authorised Registry check
  const registryEntry = checkAuthorisedRegistry(vessel.id, vessel.mmsi);
  let authorizationStatus: 'AUTHORISED' | 'UNREGISTERED' | 'DARK_VESSEL' = 'AUTHORISED';
  if (vessel.status === 'DARK') {
    authorizationStatus = 'DARK_VESSEL';
  } else if (!registryEntry && vessel.mmsi) {
    authorizationStatus = 'UNREGISTERED';
  } else if (registryEntry) {
    authorizationStatus = 'AUTHORISED';
  }

  // Altitude Envelope Check (surface vessel mast limit: 45m; drone corridor: 120m)
  const altitudeMeters = vessel.altitude ?? 0;
  const maxPermittedAltitude = registryEntry?.altitudeEnvelope.maxAltitudeMeters ?? 45;
  const isOutOfEnvelope = Boolean(vessel.isOutOfEnvelope || altitudeMeters > maxPermittedAltitude);

  const violations: string[] = [];

  // Point-in-polygon zone checks
  const matchingRedAreas = matchingAreas.filter(
    (area) => !area.zoneType || area.zoneType === 'RED' || area.zoneType === 'RESTRICTED'
  );

  // RED ZONE: Only UNRESTRICTED_NAVAL or authorized entities cleared for RED zones are permitted
  const isInsideRed = matchingRedAreas.length > 0;
  const isAuthorizedForRed = registryEntry?.allowedZoneTypes?.includes('RED') || false;

  const isGeofenceBreach = isInsideRed && !isAuthorizedForRed;
  if (isGeofenceBreach) {
    violations.push('RESTRICTED_ZONE_INCURSION');
  }
  if (isOutOfEnvelope) {
    violations.push('ALTITUDE_ENVELOPE_EXCEEDED');
  }
  if (authorizationStatus === 'UNREGISTERED') {
    violations.push('UNREGISTERED_CONTACT');
  }
  if (authorizationStatus === 'DARK_VESSEL') {
    violations.push('NO_AIS_TRANSPONDER');
  }

  const geofenceStatus: GeofenceStatus = isInsideRed ? 'INSIDE_RESTRICTED' : 'OUTSIDE';

  // PRIORITY RULE:
  // Restricted Area Incursion (Orange) > Dark Detection (Red) > Correlated (Black)
  let displayStatus: VesselDisplayStatus;
  if (isGeofenceBreach || (isInsideRed && !registryEntry)) {
    displayStatus = 'RESTRICTED';
  } else if (vessel.status === 'DARK') {
    displayStatus = 'DARK';
  } else {
    displayStatus = 'CORRELATED';
  }

  return {
    geofenceStatus,
    displayStatus,
    matchingAreas,
    authorizationStatus,
    organisation: registryEntry?.organisation,
    permitType: registryEntry?.permitType,
    altitudeMeters,
    maxPermittedAltitude,
    isOutOfEnvelope,
    violations,
  };
}

/**
 * Detects state transitions (OUTSIDE -> INSIDE: ENTRY event; INSIDE -> OUTSIDE: EXIT event)
 * Prevents repetitive alert generation every frame.
 */
export function detectGeofenceTransitions(
  currentVessels: Vessel[],
  previousGeofenceMap: Map<string, { isInside: boolean; areaIds: string[] }>,
  restrictedAreas: RestrictedArea[]
): {
  updatedGeofenceMap: Map<string, { isInside: boolean; areaIds: string[] }>;
  newEvents: RestrictedAreaEvent[];
} {
  const updatedGeofenceMap = new Map<string, { isInside: boolean; areaIds: string[] }>();
  const newEvents: RestrictedAreaEvent[] = [];
  const nowUtc = new Date().toISOString().replace('T', ' ').slice(11, 19) + ' UTC';

  currentVessels.forEach((v) => {
    const prev = previousGeofenceMap.get(v.id);
    const prevInside = prev?.isInside || false;
    const prevAreaIds = prev?.areaIds || [];

    const { geofenceStatus, matchingAreas } = evaluateVesselGeofence(v, restrictedAreas);
    const currentInside = geofenceStatus === 'INSIDE_RESTRICTED';
    const currentAreaIds = matchingAreas.map((a) => a.id);

    // State transition 1: OUTSIDE -> INSIDE (ENTRY)
    if (!prevInside && currentInside) {
      matchingAreas.forEach((area) => {
        newEvents.push({
          id: `EVT-ENTRY-${v.id}-${area.id}-${Date.now()}`,
          type: 'ENTRY',
          vesselId: v.id,
          vesselName: v.name,
          areaId: area.id,
          areaName: area.name,
          timestamp: nowUtc,
        });
      });
    }

    // State transition 2: INSIDE -> OUTSIDE (EXIT)
    if (prevInside && !currentInside) {
      prevAreaIds.forEach((areaId) => {
        const area = restrictedAreas.find((a) => a.id === areaId);
        newEvents.push({
          id: `EVT-EXIT-${v.id}-${areaId}-${Date.now()}`,
          type: 'EXIT',
          vesselId: v.id,
          vesselName: v.name,
          areaId: areaId,
          areaName: area?.name || areaId,
          timestamp: nowUtc,
        });
      });
    }

    updatedGeofenceMap.set(v.id, {
      isInside: currentInside,
      areaIds: currentAreaIds,
    });
  });

  return { updatedGeofenceMap, newEvents };
}
