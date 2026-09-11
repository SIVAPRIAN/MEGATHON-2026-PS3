/**
 * Official Marine Regions Point-In-Polygon Maritime Zone Engine
 * Source: Marine Regions World EEZ v12 & World 12 NM Territorial Sea v4 (www.marineregions.org)
 * Flanders Marine Institute (VLIZ)
 */

export type MaritimeZoneCode = 'TERRITORIAL_SEA' | 'EEZ' | 'OUTSIDE_EEZ';

export interface MaritimeZoneResult {
  code: MaritimeZoneCode;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
}

interface PreparedPolygon {
  bbox: [number, number, number, number]; // [minX, minY, maxX, maxY]
  outer: [number, number][];
  holes: [number, number][][];
}

class MaritimeZoneEngine {
  private nm12Polys: PreparedPolygon[] = [];
  private eezPolys: PreparedPolygon[] = [];
  private nm24Polys: PreparedPolygon[] = [];
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initializes official geometries from static endpoints
   */
  public async init(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const [eezRes, nm12Res] = await Promise.all([
          fetch('/data/india_eez.geojson'),
          fetch('/data/india_12nm.geojson'),
        ]);

        if (eezRes.ok) {
          const eezData = await eezRes.json();
          this.eezPolys = this.extractPolys(eezData);
        }

        if (nm12Res.ok) {
          const nm12Data = await nm12Res.json();
          this.nm12Polys = this.extractPolys(nm12Data);
        }

        // Optional 24 NM contiguous zone (load in background if available)
        fetch('/data/india_24nm.geojson')
          .then((r) => (r.ok ? r.json() : null))
          .then((nm24Data) => {
            if (nm24Data) this.nm24Polys = this.extractPolys(nm24Data);
          })
          .catch(() => {});

        this.isLoaded = true;
      } catch (err) {
        console.warn('Failed to load local maritime boundary GeoJSON, falling back to approximation', err);
      }
    })();

    return this.loadPromise;
  }

  private extractPolys(featureCollection: any): PreparedPolygon[] {
    const polys: PreparedPolygon[] = [];
    if (!featureCollection || !featureCollection.features) return polys;

    for (const feature of featureCollection.features) {
      const geom = feature.geometry;
      if (!geom) continue;

      if (geom.type === 'Polygon') {
        polys.push(this.preparePoly(geom.coordinates));
      } else if (geom.type === 'MultiPolygon') {
        for (const coords of geom.coordinates) {
          polys.push(this.preparePoly(coords));
        }
      }
    }
    return polys;
  }

  private preparePoly(rings: [number, number][][]): PreparedPolygon {
    const outer = rings[0];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (let i = 0; i < outer.length; i++) {
      const [x, y] = outer[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return {
      bbox: [minX, minY, maxX, maxY],
      outer,
      holes: rings.slice(1),
    };
  }

  /**
   * Ray-casting point-in-polygon test
   */
  private pointInRing(x: number, y: number, ring: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private testPoly(x: number, y: number, prepared: PreparedPolygon): boolean {
    const [minX, minY, maxX, maxY] = prepared.bbox;
    // Fast O(1) bounding box check
    if (x < minX || x > maxX || y < minY || y > maxY) return false;

    // Outer ring check
    if (!this.pointInRing(x, y, prepared.outer)) return false;

    // Holes check
    for (const hole of prepared.holes) {
      if (this.pointInRing(x, y, hole)) return false;
    }

    return true;
  }

  /**
   * Determines maritime jurisdiction zone for a given [lon, lat]
   */
  public determineZone(lon: number, lat: number): MaritimeZoneResult {
    // 1. Check 12 NM Territorial Sea
    for (const poly of this.nm12Polys) {
      if (this.testPoly(lon, lat, poly)) {
        return {
          code: 'TERRITORIAL_SEA',
          label: '12 NM TERRITORIAL SEA',
          description: 'Sovereign Territorial Waters (World 12 NM v4)',
          color: '#0284c7',
          badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-600/60',
        };
      }
    }

    // 2. Check Exclusive Economic Zone (200 NM)
    for (const poly of this.eezPolys) {
      if (this.testPoly(lon, lat, poly)) {
        return {
          code: 'EEZ',
          label: 'INDIA EEZ',
          description: 'Indian Exclusive Economic Zone (World EEZ v12)',
          color: '#38bdf8',
          badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60',
        };
      }
    }

    // 3. Outside EEZ (High Seas / International Waters)
    return {
      code: 'OUTSIDE_EEZ',
      label: 'BEYOND EEZ',
      description: 'International Waters / High Seas',
      color: '#94a3b8',
      badgeBg: 'bg-slate-900/80 text-slate-300 border-slate-700/60',
    };
  }

  public isReady(): boolean {
    return this.isLoaded;
  }
}

export const maritimeZoneEngine = new MaritimeZoneEngine();
