import * as maplibregl from 'maplibre-gl';

export interface MaritimeBoundaryOptions {
  map: maplibregl.Map;
  onHoverZone?: (zoneName: string | null) => void;
}

/**
 * Curated geographic label points for maritime jurisdictions and major oceanic waterbodies
 */
const MARITIME_LABELS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export class MaritimeBoundaryLayerController {
  private map: maplibregl.Map;
  private isInitialized = false;

  constructor(options: MaritimeBoundaryOptions) {
    this.map = options.map;
  }

  public init(): void {
    if (this.isInitialized || !this.map) return;

    // 1. Global World EEZ v12 (Official Marine Regions WMS Raster)
    // Renders subtle boundary lines across all global waters on top of bathymetry
    if (!this.map.getSource('marine-regions-global-eez')) {
      this.map.addSource('marine-regions-global-eez', {
        type: 'raster',
        tiles: [
          'https://geo.vliz.be/geoserver/MarineRegions/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=MarineRegions:eez_boundaries&STYLES=&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}',
        ],
        tileSize: 256,
        attribution: 'EEZ data © Marine Regions / Flanders Marine Institute (www.marineregions.org)',
      });
    }

    if (!this.map.getLayer('global-eez-wms-layer')) {
      this.map.addLayer(
        {
          id: 'global-eez-wms-layer',
          type: 'raster',
          source: 'marine-regions-global-eez',
          paint: {
            'raster-opacity': 0.60,
          },
        },
        // Insert right above the base bathymetry raster layer
        this.map.getLayer('base-layer') ? undefined : undefined
      );
    }

    // 2. India EEZ (Official World EEZ v12 Vector GeoJSON)
    if (!this.map.getSource('india-eez-source')) {
      this.map.addSource('india-eez-source', {
        type: 'geojson',
        data: '/data/india_eez.geojson',
      });
    }

    if (!this.map.getLayer('india-eez-fill')) {
      this.map.addLayer({
        id: 'india-eez-fill',
        type: 'fill',
        source: 'india-eez-source',
        paint: {
          'fill-color': '#38bdf8',
          'fill-opacity': 0.025,
        },
      });
    }

    if (!this.map.getLayer('india-eez-line')) {
      this.map.addLayer({
        id: 'india-eez-line',
        type: 'line',
        source: 'india-eez-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.4,
          'line-dasharray': [5, 4],
          'line-opacity': 0.88,
        },
      });
    }

    // 3. India 12 NM Territorial Sea (Official World 12 NM Zone v4 Vector GeoJSON)
    if (!this.map.getSource('india-12nm-source')) {
      this.map.addSource('india-12nm-source', {
        type: 'geojson',
        data: '/data/india_12nm.geojson',
      });
    }

    if (!this.map.getLayer('india-12nm-fill')) {
      this.map.addLayer({
        id: 'india-12nm-fill',
        type: 'fill',
        source: 'india-12nm-source',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.035,
        },
      });
    }

    if (!this.map.getLayer('india-12nm-line')) {
      this.map.addLayer({
        id: 'india-12nm-line',
        type: 'line',
        source: 'india-12nm-source',
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 1.6,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      });
    }

    // 4. Prepared Architecture for 24 NM Contiguous Zone (Off by default)
    if (!this.map.getSource('india-24nm-source')) {
      this.map.addSource('india-24nm-source', {
        type: 'geojson',
        data: '/data/india_24nm.geojson',
      });
    }

    if (!this.map.getLayer('india-24nm-line')) {
      this.map.addLayer({
        id: 'india-24nm-line',
        type: 'line',
        source: 'india-24nm-source',
        layout: {
          visibility: 'none', // Not displayed by default
        },
        paint: {
          'line-color': '#6366f1',
          'line-width': 1.2,
          'line-dasharray': [3, 3],
          'line-opacity': 0.8,
        },
      });
    }

    // 5. Maritime Geographic Area Labels
    if (!this.map.getSource('maritime-labels-source')) {
      this.map.addSource('maritime-labels-source', {
        type: 'geojson',
        data: MARITIME_LABELS_GEOJSON,
      });
    }

    if (!this.map.getLayer('maritime-labels-layer')) {
      this.map.addLayer({
        id: 'maritime-labels-layer',
        type: 'symbol',
        source: 'maritime-labels-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'match',
            ['get', 'type'],
            'ocean', 12,
            'eez', 10.5,
            /* territorial */ 9.5
          ],
          'text-letter-spacing': 0.22,
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': [
            'match',
            ['get', 'type'],
            'eez', '#7dd3fc',
            'territorial', '#38bdf8',
            /* ocean */ '#94a3b8'
          ],
          'text-halo-color': 'rgba(15, 23, 42, 0.90)',
          'text-halo-width': 1.4,
        },
      });
    }

    this.isInitialized = true;
  }

  /**
   * Toggles visibility of EEZ layers (Global WMS + India Vector + Labels)
   */
  public setEezVisible(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    ['global-eez-wms-layer', 'india-eez-fill', 'india-eez-line'].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }

  /**
   * Toggles visibility of 12 NM Territorial Sea layers
   */
  public setTerritorialSeaVisible(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    ['india-12nm-fill', 'india-12nm-line'].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }

  /**
   * Toggles optional 24 NM Contiguous Zone layer
   */
  public setContiguousZoneVisible(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    if (this.map.getLayer('india-24nm-line')) {
      this.map.setLayoutProperty('india-24nm-line', 'visibility', val);
    }
  }

  /**
   * Toggles base bathymetry raster layer
   */
  public setBathymetryVisible(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    if (this.map.getLayer('base-layer')) {
      this.map.setLayoutProperty('base-layer', 'visibility', val);
    }
  }
}
