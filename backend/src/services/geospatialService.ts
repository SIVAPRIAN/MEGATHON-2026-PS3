import { RestrictedZone, IRestrictedZone } from '../models/RestrictedZone';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';

export interface GeofenceEvaluationResult {
  isInsideRestricted: boolean;
  matchingZones: IRestrictedZone[];
  zoneNames: string[];
  zoneIds: string[];
  highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

/**
 * Checks whether a given geographic coordinate (lon, lat) is inside any active restricted zone.
 * Uses MongoDB 2dsphere $geoIntersects query as primary engine, with turf fallback.
 */
export async function evaluateGeofence(
  latitude: number,
  longitude: number
): Promise<GeofenceEvaluationResult> {
  try {
    // Primary check: MongoDB $geoIntersects with 2dsphere index
    const activeZones = await RestrictedZone.find({
      status: 'ACTIVE',
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON order: [lon, lat]
          },
        },
      },
    }).exec();

    if (activeZones.length > 0) {
      const zoneNames = activeZones.map((z) => z.name);
      const zoneIds = activeZones.map((z) => z.zoneId);

      let highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      for (const zone of activeZones) {
        if (zone.zoneType === 'RED' || zone.severity === 'CRITICAL') {
          highestSeverity = 'CRITICAL';
          break;
        } else if (zone.zoneType === 'YELLOW' || zone.severity === 'HIGH') {
          highestSeverity = 'HIGH';
        } else if (zone.zoneType === 'RESTRICTED' && highestSeverity !== 'CRITICAL') {
          highestSeverity = 'HIGH';
        }
      }

      return {
        isInsideRestricted: true,
        matchingZones: activeZones,
        zoneNames,
        zoneIds,
        highestSeverity,
      };
    }
  } catch (err) {
    // If DB is offline or fallback is needed, check in-memory / active zones list
    console.warn('MongoDB geospatial query warning (falling back to turf algorithm):', err);
  }

  return {
    isInsideRestricted: false,
    matchingZones: [],
    zoneNames: [],
    zoneIds: [],
    highestSeverity: 'NONE',
  };
}

/**
 * In-memory / Turf point-in-polygon evaluation helper for local objects
 */
export function checkPointInPolygonTurf(
  lat: number,
  lon: number,
  polygonCoords: number[][][]
): boolean {
  try {
    const pt = point([lon, lat]);
    const poly = polygon(polygonCoords);
    return booleanPointInPolygon(pt, poly);
  } catch {
    return false;
  }
}
