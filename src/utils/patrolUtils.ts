import { PatrolUnit, NearestPatrolInfo } from '../types/maritime';

/**
 * Calculates Great-Circle Haversine distance in kilometers between two coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts kilometers to nautical miles
 */
export function kmToNM(km: number): number {
  return km * 0.539957;
}

/**
 * Calculates Estimated Time of Arrival (ETA) in minutes
 * based on tactical intercept speed (in knots) plus standard launch/course correction overhead
 */
export function calculateInterceptETA(distanceKm: number, speedKnots: number): number {
  const speedKmh = Math.max(10, speedKnots * 1.852);
  const transitMinutes = (distanceKm / speedKmh) * 60;
  // Tactical reaction overhead: 1.5 - 2 min
  const totalETA = Math.round(transitMinutes + 1.8);
  return Math.max(1, totalETA);
}

/**
 * Finds the nearest available patrol unit for a target coordinate/alert.
 * If a patrol is already dispatched to this target, returns that assigned patrol.
 */
export function findNearestPatrol(
  targetLat: number,
  targetLon: number,
  patrolUnits: PatrolUnit[] = [],
  targetId?: string,
  alertId?: string
): NearestPatrolInfo | null {
  if (!patrolUnits || patrolUnits.length === 0) return null;

  // 1. Check if a patrol is already dispatched/responding to this target or alert
  const assignedPatrol = patrolUnits.find(
    (p) =>
      p.status === 'RESPONDING' &&
      ((targetId && p.assignedTargetId === targetId) ||
        (alertId && p.assignedAlertId === alertId))
  );

  if (assignedPatrol) {
    const pLat = assignedPatrol.lat ?? assignedPatrol.latitude ?? 0;
    const pLon = assignedPatrol.lon ?? assignedPatrol.longitude ?? 0;
    const distKm = calculateHaversineDistanceKm(pLat, pLon, targetLat, targetLon);
    return {
      patrol: assignedPatrol,
      distanceKm: Math.round(distKm * 10) / 10,
      distanceNM: Math.round(kmToNM(distKm) * 10) / 10,
      etaMinutes: calculateInterceptETA(distKm, assignedPatrol.speedKnots),
      isDispatchedToThisTarget: true,
    };
  }

  // 2. Compute distance for all available patrol units
  const availableUnits = patrolUnits.filter((p) => p.status === 'AVAILABLE');
  const candidatePool = availableUnits.length > 0 ? availableUnits : patrolUnits;

  let nearestUnit: PatrolUnit | null = null;
  let minDistanceKm = Infinity;

  for (const unit of candidatePool) {
    const uLat = unit.lat ?? unit.latitude ?? 0;
    const uLon = unit.lon ?? unit.longitude ?? 0;
    const dKm = calculateHaversineDistanceKm(uLat, uLon, targetLat, targetLon);
    if (dKm < minDistanceKm) {
      minDistanceKm = dKm;
      nearestUnit = unit;
    }
  }

  if (!nearestUnit) return null;

  return {
    patrol: nearestUnit,
    distanceKm: Math.round(minDistanceKm * 10) / 10,
    distanceNM: Math.round(kmToNM(minDistanceKm) * 10) / 10,
    etaMinutes: calculateInterceptETA(minDistanceKm, nearestUnit.speedKnots),
    isDispatchedToThisTarget: false,
  };
}

/**
 * Converts PatrolUnit array to a standard MapLibre GeoJSON FeatureCollection
 */
export function patrolUnitsToGeoJSON(
  patrols: PatrolUnit[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: patrols.map((p) => ({
      type: 'Feature',
      id: p.id,
      geometry: {
        type: 'Point',
        coordinates: [p.lon, p.lat], // [lon, lat]
      },
      properties: {
        id: p.id,
        name: p.name,
        callsign: p.callsign,
        station: p.station,
        sector: p.sector,
        type: p.type,
        heading: p.heading,
        speedKnots: p.speedKnots,
        status: p.status,
        assignedTargetId: p.assignedTargetId || '',
        assignedAlertId: p.assignedAlertId || '',
        fuelPercent: p.fuelPercent || 90,
        crewCount: p.crewCount || 10,
      },
    })),
  };
}
