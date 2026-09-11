import * as maplibregl from 'maplibre-gl';
import { 
  Vessel, 
  vesselsToGeoJSON, 
  VESSEL_TRACKS, 
  DARK_OBSERVATION_TRAILS 
} from '../data/vessels';
import { maritimeZoneEngine } from '../utils/maritimeZones';

/**
 * Creates a compact 16x16px SVG ship image element for MapLibre symbol layer.
 * Top-down maritime vessel silhouette pointing North (0°).
 * Pure minimal geometry: Pointed bow (▲), angled flare (/ \), straight sides (| |), flat stern (|_|).
 * Perfectly symmetric and centered at (8, 8) for wobble-free map rotation.
 */
export function createShipImageData(fillColor: string, strokeColor: string): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;

  // Symmetric top-down vessel icon pointing north
  ctx.beginPath();
  ctx.moveTo(16, 2);   // Bow
  ctx.lineTo(26, 11);  // Starboard flare
  ctx.lineTo(26, 30);  // Starboard stern
  ctx.lineTo(6, 30);   // Port stern
  ctx.lineTo(6, 11);   // Port flare
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wheelhouse cabin
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(13, 17, 6, 6);

  return ctx.getImageData(0, 0, 32, 32);
}

export function createShipSvgImage(fillColor: string, strokeColor: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallbackImg = new Image();
      resolve(fallbackImg);
      return;
    }
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(26, 11);
    ctx.lineTo(26, 30);
    ctx.lineTo(6, 30);
    ctx.lineTo(6, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 17, 6, 6);

    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = canvas.toDataURL('image/png');
  });
}

export interface VesselLayerOptions {
  map: maplibregl.Map;
  vessels: Vessel[];
  onSelectVessel?: (vessel: Vessel | null) => void;
}

export class VesselLayerController {
  private map: maplibregl.Map;
  private vessels: Vessel[];
  private selectedVesselId: string | null = null;
  private onSelectVessel?: (vessel: Vessel | null) => void;
  private hoverPopup: maplibregl.Popup;
  private isInitialized = false;
  private isDrawing = false;

  constructor(options: VesselLayerOptions) {
    this.map = options.map;
    this.vessels = options.vessels;
    this.onSelectVessel = options.onSelectVessel;

    this.hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -10],
      className: 'maritime-hover-popup',
    });
  }

  /**
   * Raises all vessel layers to the top of the layer hierarchy
   */
  public bringToFront(): void {
    if (!this.map) return;
    const layerIds = [
      'ais-track-line',
      'ais-track-points',
      'dark-track-line',
      'dark-track-points',
      'selected-vessel-ring',
      'vessels-core-dot',
      'vessels-layer',
    ];
    layerIds.forEach((id) => {
      if (this.map.getLayer(id)) {
        try {
          this.map.moveLayer(id);
        } catch {
          // Ignore if cannot move
        }
      }
    });
  }

  /**
   * Initializes MapLibre sources, layers, and event listeners
   */
  public async init(): Promise<void> {
    if (this.isInitialized || !this.map) return;

    // 1. Register vector ship icons synchronously via ImageData
    try {
      const correlatedImg = createShipImageData('#0f172a', '#38bdf8'); // Dark Navy with Cyan outline
      const darkImg = createShipImageData('#dc2626', '#fca5a5');       // Red (Dark vessel detection)
      const restrictedImg = createShipImageData('#f97316', '#fed7aa'); // Orange (Restricted Area Violation)

      if (this.map.hasImage('vessel-correlated')) {
        this.map.removeImage('vessel-correlated');
      }
      this.map.addImage('vessel-correlated', correlatedImg);

      if (this.map.hasImage('vessel-dark')) {
        this.map.removeImage('vessel-dark');
      }
      this.map.addImage('vessel-dark', darkImg);

      if (this.map.hasImage('vessel-restricted')) {
        this.map.removeImage('vessel-restricted');
      }
      this.map.addImage('vessel-restricted', restrictedImg);
    } catch (e) {
      console.error('Failed to register vessel SVG images', e);
    }

    // 2. Add GeoJSON Vessel Source (Direct individual rendering, no clustering)
    const geojsonData = vesselsToGeoJSON(this.vessels);
    if (!this.map.getSource('vessels-source')) {
      this.map.addSource('vessels-source', {
        type: 'geojson',
        data: geojsonData,
        cluster: false,
      });
    }

    // 3. Add High-Visibility Base Vessel Dots (Ensures immediate 100% visibility)
    if (!this.map.getLayer('vessels-core-dot')) {
      this.map.addLayer({
        id: 'vessels-core-dot',
        type: 'circle',
        source: 'vessels-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 3.8,
            6, 5.0,
            9, 6.0,
            13, 7.5
          ],
          'circle-color': [
            'match',
            ['get', 'displayStatus'],
            'RESTRICTED',
            '#ea580c',
            'DARK',
            '#dc2626',
            /* default */ '#0284c7'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.2,
          'circle-opacity': 0.95,
        },
      });
    }

    // 5. Add Georeferenced Selection Ring Layer (subtle 1.2px ring tightly encircling small vessel)
    if (!this.map.getSource('selected-vessel-source')) {
      this.map.addSource('selected-vessel-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!this.map.getLayer('selected-vessel-ring')) {
      this.map.addLayer({
        id: 'selected-vessel-ring',
        type: 'circle',
        source: 'selected-vessel-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 5.5,
            5, 7.0,
            7, 8.5,
            9, 10.0,
            11, 11.0,
            13, 12.0,
            18, 12.0
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 1.2,
          'circle-stroke-opacity': 0.95,
        },
      });
    }

    // 6. Add AIS Track Layer (Thin track ending exactly at vessel coordinates)
    if (!this.map.getSource('ais-track-source')) {
      this.map.addSource('ais-track-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!this.map.getLayer('ais-track-line')) {
      this.map.addLayer({
        id: 'ais-track-line',
        type: 'line',
        source: 'ais-track-source',
        paint: {
          'line-color': '#0f172a',
          'line-width': 1.0,
          'line-opacity': 0.8,
        },
      });
    }

    if (!this.map.getLayer('ais-track-points')) {
      this.map.addLayer({
        id: 'ais-track-points',
        type: 'circle',
        source: 'ais-track-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 1.8,
          'circle-color': '#0f172a',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.6,
        },
      });
    }

    // 7. Add Dark Vessel EO Detection History Layer (Short observation history)
    if (!this.map.getSource('dark-track-source')) {
      this.map.addSource('dark-track-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!this.map.getLayer('dark-track-line')) {
      this.map.addLayer({
        id: 'dark-track-line',
        type: 'line',
        source: 'dark-track-source',
        paint: {
          'line-color': '#dc2626',
          'line-width': 1.0,
          'line-dasharray': [2, 2],
          'line-opacity': 0.85,
        },
      });
    }

    if (!this.map.getLayer('dark-track-points')) {
      this.map.addLayer({
        id: 'dark-track-points',
        type: 'circle',
        source: 'dark-track-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 1.8,
          'circle-color': '#dc2626',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.6,
        },
      });
    }

    // 8. Add Individual Vessel Symbol Layer (Direct rendering at all zoom levels)
    // Small map-native symbols: 8-12px at regional/India zoom, 10-16px at coastal, max 18px at close zoom
    if (!this.map.getLayer('vessels-layer')) {
      this.map.addLayer({
        id: 'vessels-layer',
        type: 'symbol',
        source: 'vessels-source',
        layout: {
          'icon-image': [
            'match',
            ['get', 'displayStatus'],
            'RESTRICTED',
            'vessel-restricted',
            'DARK',
            'vessel-dark',
            'vessel-correlated'
          ],
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.50,   // ~8.0px
            5, 0.65,   // ~10.4px (India / regional zoom: 8-12px)
            7, 0.78,   // ~12.5px
            9, 0.90,   // ~14.4px (closer coastal zoom: 10-16px)
            11, 1.00,  // ~16.0px (10-16px)
            13, 1.10,  // ~17.6px (max ~18px)
            18, 1.10   // ~17.6px (flat cap: never exceeds 18px)
          ],
        },
      });
    }

    this.bindEvents();
    this.bringToFront();
    this.isInitialized = true;
  }

  /**
   * Binds user interaction handlers (click, hover, pan/zoom stability)
   */
  private bindEvents(): void {
    // Hover on vessel -> compact, clean, non-intrusive maritime identification tooltip
    this.map.on('mouseenter', 'vessels-layer', (e) => {
      if (this.isDrawing) return;
      this.map.getCanvas().style.cursor = 'pointer';
      if (!e.features || !e.features.length) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const vesselId = feature.properties?.id || 'VESSEL';
      const vesselType = feature.properties?.vesselType || 'Commercial Vessel';
      const status = feature.properties?.status;
      const displayStatus = feature.properties?.displayStatus;

      const isRestricted = displayStatus === 'RESTRICTED';
      const isDark = !isRestricted && status === 'DARK';

      const statusText = isRestricted
        ? 'RESTRICTED'
        : isDark
        ? 'DARK VESSEL'
        : 'CORRELATED';

      const dotColor = isRestricted ? '#ea580c' : isDark ? '#dc2626' : '#059669';
      const textColor = isRestricted ? '#c2410c' : isDark ? '#b91c1c' : '#047857';
      const borderColor = isRestricted ? 'rgba(251, 146, 60, 0.8)' : isDark ? 'rgba(248, 113, 113, 0.8)' : 'rgba(203, 213, 225, 0.9)';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 105px; padding: 4px 7px; border-radius: 4px; background: rgba(255, 255, 255, 0.98); border: 1px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); line-height: 1.25; backdrop-filter: blur(8px);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
            <span style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; font-weight: 700; color: #0f172a; letter-spacing: 0.04em;">${vesselId}</span>
            <span style="display: flex; align-items: center; gap: 3.5px; font-size: 8px; font-weight: 700; color: ${textColor}; text-transform: uppercase;">
              <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${dotColor};"></span>
              ${statusText}
            </span>
          </div>
          <div style="font-size: 9px; color: #64748b; font-weight: 500;">
            ${vesselType}
          </div>
        </div>
      `;

      this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
    });

    this.map.on('mouseleave', 'vessels-layer', () => {
      this.map.getCanvas().style.cursor = '';
      this.hoverPopup.remove();
    });

    // Click on vessel -> select vessel (full contextual investigation)
    this.map.on('click', 'vessels-layer', (e) => {
      if (this.isDrawing) return;
      if (!e.features || !e.features.length) return;
      const feature = e.features[0];
      const vesselId = feature.properties?.id;
      const vessel = this.vessels.find((v) => v.id === vesselId) || null;

      this.setSelectedVessel(vessel ? vessel.id : null);
      if (this.onSelectVessel) {
        this.onSelectVessel(vessel);
      }
    });
  }

  /**
   * Updates the selected vessel ID and manages geographic selection ring + tracks
   */
  public setSelectedVessel(vesselId: string | null): void {
    this.selectedVesselId = vesselId;
    if (!this.map || !this.map.isStyleLoaded()) return;

    const ringSource = this.map.getSource('selected-vessel-source') as maplibregl.GeoJSONSource;
    const aisSource = this.map.getSource('ais-track-source') as maplibregl.GeoJSONSource;
    const darkSource = this.map.getSource('dark-track-source') as maplibregl.GeoJSONSource;

    if (!vesselId) {
      if (ringSource) ringSource.setData({ type: 'FeatureCollection', features: [] });
      if (aisSource) aisSource.setData({ type: 'FeatureCollection', features: [] });
      if (darkSource) darkSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const vessel = this.vessels.find((v) => v.id === vesselId);
    if (!vessel) return;

    // 1. Update selection ring at [vessel.lon, vessel.lat]
    if (ringSource) {
      ringSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [vessel.lon, vessel.lat],
            },
            properties: { id: vessel.id },
          },
        ],
      });
    }

    // 2. Update track lines
    if (vessel.status === 'CORRELATED') {
      if (darkSource) darkSource.setData({ type: 'FeatureCollection', features: [] });

      if (aisSource) {
        // Retrieve predefined track or compute approach vector ending EXACTLY at vessel position
        let points = VESSEL_TRACKS[vessel.id];
        if (!points) {
          const revRad = ((vessel.heading + 180) % 360) * (Math.PI / 180);
          const p1: [number, number] = [
            vessel.lon + Math.sin(revRad) * 0.15,
            vessel.lat + Math.cos(revRad) * 0.15,
          ];
          const p2: [number, number] = [
            vessel.lon + Math.sin(revRad) * 0.07,
            vessel.lat + Math.cos(revRad) * 0.07,
          ];
          points = [p1, p2, [vessel.lon, vessel.lat]];
        }

        const features: GeoJSON.Feature[] = [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: points,
            },
            properties: { id: vessel.id },
          },
          ...points.slice(0, -1).map((pt) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: pt,
            },
            properties: { id: vessel.id },
          })),
        ];

        aisSource.setData({
          type: 'FeatureCollection',
          features,
        });
      }
    } else {
      // Dark vessel: show only short EO detection history
      if (aisSource) aisSource.setData({ type: 'FeatureCollection', features: [] });

      if (darkSource) {
        let points = DARK_OBSERVATION_TRAILS[vessel.id];
        if (!points) {
          const revRad = ((vessel.heading + 180) % 360) * (Math.PI / 180);
          const p1: [number, number] = [
            vessel.lon + Math.sin(revRad) * 0.04,
            vessel.lat + Math.cos(revRad) * 0.04,
          ];
          points = [p1, [vessel.lon, vessel.lat]];
        }

        const features: GeoJSON.Feature[] = [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: points,
            },
            properties: { id: vessel.id },
          },
          ...points.map((pt) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: pt,
            },
            properties: { id: vessel.id },
          })),
        ];

        darkSource.setData({
          type: 'FeatureCollection',
          features,
        });
      }
    }
  }

  /**
   * Sets drawing mode to suppress hover popups during polygon creation
   */
  public setIsDrawing(drawing: boolean): void {
    this.isDrawing = drawing;
    if (drawing) {
      this.hoverPopup.remove();
    }
  }

  /**
   * Updates vessel data dynamically
   */
  public updateVessels(vessels: Vessel[]): void {
    this.vessels = vessels;
    if (!this.map) return;

    const source = this.map.getSource('vessels-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(vesselsToGeoJSON(vessels));
    } else if (this.map.isStyleLoaded()) {
      this.init();
    }
  }

  /**
   * Toggles visibility of all vessel symbols, clusters, tracks, and selection rings
   */
  public setVisibility(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    [
      'vessels-layer',
      'selected-vessel-ring',
      'ais-track-line',
      'ais-track-points',
      'dark-track-line',
      'dark-track-points',
    ].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }
}
