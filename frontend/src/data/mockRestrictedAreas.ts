import { RestrictedArea } from '../types/maritime';

/**
 * Pre-seeded demonstration zones across Chennai coastal waters:
 * - Red Zone (RA-001): High Security Exclusion Zone (Restricted)
 * - Yellow Zone (ZONE-02): Cautionary Anchorage / Pilot Zone (Temporary, 10 min auto-expiry demonstration)
 * - Green Zone (ZONE-03): Authorized Safe Transit & Fishing Corridor
 * All real GeoJSON Polygons with [longitude, latitude] coordinates.
 */
export const INITIAL_RESTRICTED_AREAS: RestrictedArea[] = [
  {
    id: 'RA-001',
    name: 'RESTRICTED AREA 01',
    zoneType: 'RED',
    status: 'ACTIVE',
    createdAt: '14:10 UTC',
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdBy: 'OPERATOR-01',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.355, 13.080],
          [80.395, 13.080],
          [80.395, 13.118],
          [80.355, 13.118],
          [80.355, 13.080],
        ],
      ],
    },
  },
  {
    id: 'ZONE-02',
    name: 'YELLOW CAUTIONARY ANCHORAGE',
    zoneType: 'YELLOW',
    status: 'ACTIVE',
    createdAt: '14:20 UTC',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 30 minutes total validity window
    expiresInMinutes: 30,
    timeRange: {
      start: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      end: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    },
    createdBy: 'OPERATOR-01',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.410, 13.040],
          [80.460, 13.040],
          [80.460, 13.078],
          [80.410, 13.078],
          [80.410, 13.040],
        ],
      ],
    },
  },
  {
    id: 'ZONE-03',
    name: 'GREEN SAFE TRANSIT CORRIDOR',
    zoneType: 'GREEN',
    status: 'ACTIVE',
    createdAt: '14:00 UTC',
    startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    createdBy: 'OPERATOR-01',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.330, 12.980],
          [80.380, 12.980],
          [80.380, 13.030],
          [80.330, 13.030],
          [80.330, 12.980],
        ],
      ],
    },
  },
];

/**
 * Exports current active zones to a standard GeoJSON FeatureCollection
 */
export function exportZonesToGeoJSON(areas: RestrictedArea[]): string {
  const featureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: areas.map((a) => ({
      type: 'Feature',
      id: a.id,
      geometry: {
        type: 'Polygon',
        coordinates: a.geometry.coordinates,
      },
      properties: {
        id: a.id,
        name: a.name,
        zoneType: a.zoneType,
        status: a.status,
        createdAt: a.createdAt,
        expiresAt: a.expiresAt,
        createdBy: a.createdBy,
      },
    })),
  };
  return JSON.stringify(featureCollection, null, 2);
}

/**
 * Parses an incoming GeoJSON FeatureCollection or Feature into RestrictedArea objects
 */
export function parseGeoJSONToZones(geoJsonContent: string): RestrictedArea[] {
  try {
    const parsed = JSON.parse(geoJsonContent);
    const features: GeoJSON.Feature[] =
      parsed.type === 'FeatureCollection'
        ? parsed.features
        : parsed.type === 'Feature'
        ? [parsed]
        : [];

    const newZones: RestrictedArea[] = [];
    features.forEach((feat, idx) => {
      if (feat.geometry && feat.geometry.type === 'Polygon') {
        const rawType = (feat.properties?.zoneType || feat.properties?.type || '').toUpperCase();
        const zoneType =
          rawType === 'GREEN' ? 'GREEN' : rawType === 'YELLOW' ? 'YELLOW' : 'RED';

        const name =
          feat.properties?.name ||
          feat.properties?.title ||
          `${zoneType} ZONE ${(idx + 1).toString().padStart(2, '0')}`;

        newZones.push({
          id: feat.properties?.id || `GEOJSON-${Date.now().toString(36).toUpperCase()}-${idx}`,
          name,
          zoneType,
          status: 'ACTIVE',
          createdAt: new Date().toISOString().slice(11, 16) + ' UTC',
          expiresAt: feat.properties?.expiresAt,
          createdBy: feat.properties?.createdBy || 'GEOJSON-LOADER',
          geometry: {
            type: 'Polygon',
            coordinates: feat.geometry.coordinates as [number, number][][],
          },
        });
      }
    });

    return newZones;
  } catch (err) {
    console.error('Error parsing GeoJSON zones:', err);
    return [];
  }
}

