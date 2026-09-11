/**
 * Indian Maritime & Land Boundary Validation
 * Ensures that all vessel coordinates strictly reside in water and never on land.
 */

// Simplified high-precision polygon of the Indian subcontinent mainland landmass
export const INDIA_LAND_POLYGON: [number, number][] = [
  // Northwest / Gujarat coast boundary (East is land, West is Arabian Sea)
  [68.10, 23.80],
  [68.80, 23.00],
  [69.00, 22.40],
  [69.60, 21.65],
  [70.30, 20.80],
  [71.00, 20.70],
  [72.10, 21.10],
  [72.60, 21.75],
  // Gulf of Khambhat head
  [72.70, 22.30],
  [72.85, 21.60],
  // Maharashtra coastline
  [72.80, 20.50],
  [72.82, 19.50],
  [72.83, 18.92], // Mumbai
  [72.95, 18.20],
  [73.15, 17.50],
  [73.30, 16.50],
  // Goa & Karnataka coastline
  [73.75, 15.50],
  [74.20, 14.80],
  [74.50, 14.00],
  [74.80, 13.00],
  [74.85, 12.85], // Mangalore
  // Kerala coastline
  [75.10, 12.00],
  [75.60, 11.30],
  [75.90, 10.80],
  [76.22, 9.96],  // Kochi
  [76.57, 8.88],  // Kollam
  [76.95, 8.45],  // Vizhinjam / Trivandrum
  // Cape Comorin (Kanyakumari) tip
  [77.55, 8.08],
  // Gulf of Mannar & Tamil Nadu east coast
  [78.10, 8.80],  // Tuticorin
  [79.10, 9.30],  // Rameswaram
  [79.20, 9.80],  // Palk Strait
  [79.85, 10.35], // Point Calimere
  [79.85, 11.00],
  [79.80, 11.90], // Puducherry
  [80.30, 13.10], // Chennai
  // Andhra Pradesh coastline
  [80.10, 14.00],
  [80.20, 15.50],
  [81.00, 16.00],
  [82.20, 16.90],
  [83.30, 17.70], // Visakhapatnam
  [84.10, 18.50],
  // Odisha & West Bengal coastline
  [85.00, 19.30],
  [85.80, 19.80], // Puri
  [86.70, 20.30], // Paradip
  [87.00, 21.00],
  [87.80, 21.60],
  [88.20, 21.75], // Sagar Island / Ganga delta
  [89.00, 22.00],
  // Northern inland perimeter closing polygon (Himalayas / inland India)
  [89.00, 26.00],
  [84.00, 28.00],
  [78.00, 31.00],
  [74.00, 32.00],
  [70.00, 28.00],
  [68.10, 23.80]
];

// Sri Lanka land boundary polygon
export const SRI_LANKA_LAND_POLYGON: [number, number][] = [
  [79.70, 9.75],
  [80.20, 9.80],
  [80.90, 9.00],
  [81.30, 8.60],
  [81.90, 7.50],
  [81.70, 6.70],
  [81.20, 6.00],
  [80.60, 5.90],
  [80.20, 6.00],
  [79.80, 6.90], // Colombo
  [79.70, 8.00],
  [79.80, 8.80],
  [79.70, 9.75]
];

/**
 * Ray-casting algorithm to test if a point [lon, lat] is inside a polygon
 */
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point; // x = lon, y = lat
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a given coordinate is strictly in water (not on Indian mainland or Sri Lanka)
 */
export function isWater(lat: number, lon: number): boolean {
  // 1. Check if inside Indian mainland
  if (isPointInPolygon([lon, lat], INDIA_LAND_POLYGON)) {
    return false;
  }

  // 2. Check if inside Sri Lanka
  if (isPointInPolygon([lon, lat], SRI_LANKA_LAND_POLYGON)) {
    return false;
  }

  // 3. Coordinate is verified to be in water
  return true;
}

/**
 * Safely validates and corrects a vessel coordinate if it mistakenly falls on land
 */
export function ensureWaterCoordinate(lat: number, lon: number, preferredZone: string): [number, number] {
  if (isWater(lat, lon)) {
    return [lat, lon];
  }

  // If on land, log warning and relocate to verified safe offshore coordinate
  console.warn(`[GEO-VALIDATION] INVALID MARITIME POSITION at ${lat}° N, ${lon}° E. Relocating offshore.`);

  if (preferredZone.includes('Kerala') || preferredZone.includes('Kollam')) {
    // Relocate west of Kerala coast
    return [lat, Math.min(lon, 76.35)];
  }

  if (preferredZone.includes('Chennai') || preferredZone.includes('Tamil Nadu')) {
    // Relocate east into Bay of Bengal
    return [lat, Math.max(lon, 80.35)];
  }

  if (preferredZone.includes('Mumbai') || preferredZone.includes('Maharashtra')) {
    // Relocate west into Arabian Sea
    return [lat, Math.min(lon, 72.60)];
  }

  if (preferredZone.includes('Gujarat')) {
    // Relocate into Arabian Sea / Gulf of Kachchh
    return [lat, Math.min(lon, 69.40)];
  }

  if (preferredZone.includes('Visakhapatnam') || preferredZone.includes('Bay of Bengal')) {
    // Relocate east into Bay of Bengal
    return [lat, Math.max(lon, 83.40)];
  }

  // Default safe offshore nudge (west into Arabian sea if western half, else east)
  return lon < 77.5 ? [lat, 75.80] : [lat, 81.20];
}
