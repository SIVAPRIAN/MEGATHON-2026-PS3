import { AISData, IAISData } from '../models/AISData';
import { Vessel } from '../models/Vessel';
import { AuditLog } from '../models/AuditLog';

/**
 * Calculates great-circle distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
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

export interface CorrelationResult {
  isCorrelated: boolean;
  mmsi?: string;
  vesselName?: string;
  confidence: number;
  distanceMeters?: number;
  matchedAisTarget?: IAISData | null;
  candidates: Array<{
    mmsi: string;
    vesselName: string;
    distanceMeters: number;
    lat: number;
    lon: number;
  }>;
}

/**
 * Rule-based spatial correlation between an optical/camera detection coordinate and active AIS targets
 */
export async function correlateTargetWithAIS(
  lat: number,
  lon: number,
  heading?: number,
  maxRadiusMeters = 2000
): Promise<CorrelationResult> {
  const aisTargets = await AISData.find().exec();

  const candidates: Array<{
    mmsi: string;
    vesselName: string;
    distanceMeters: number;
    lat: number;
    lon: number;
    target: IAISData;
  }> = [];

  for (const target of aisTargets) {
    const dist = calculateDistanceMeters(lat, lon, target.latitude, target.longitude);
    if (dist <= maxRadiusMeters) {
      candidates.push({
        mmsi: target.mmsi,
        vesselName: target.vesselName || `AIS-${target.mmsi}`,
        distanceMeters: Math.round(dist),
        lat: target.latitude,
        lon: target.longitude,
        target,
      });
    }
  }

  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters);

  if (candidates.length > 0) {
    const bestMatch = candidates[0];
    // Calculate correlation confidence based on proximity (closer = higher confidence, e.g. 100m -> 98%, 2000m -> 70%)
    const confidence = Math.max(60, Math.min(99, Math.round(100 - (bestMatch.distanceMeters / maxRadiusMeters) * 35)));

    return {
      isCorrelated: true,
      mmsi: bestMatch.mmsi,
      vesselName: bestMatch.vesselName,
      confidence,
      distanceMeters: bestMatch.distanceMeters,
      matchedAisTarget: bestMatch.target,
      candidates: candidates.map(({ mmsi, vesselName, distanceMeters, lat, lon }) => ({
        mmsi,
        vesselName,
        distanceMeters,
        lat,
        lon,
      })),
    };
  }

  return {
    isCorrelated: false,
    confidence: 0,
    candidates: [],
  };
}
