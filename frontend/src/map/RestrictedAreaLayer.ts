import * as maplibregl from 'maplibre-gl';
import { RestrictedArea } from '../types/maritime';

export interface RestrictedAreaLayerOptions {
  map: maplibregl.Map;
  restrictedAreas: RestrictedArea[];
  onSelectArea?: (area: RestrictedArea | null) => void;
  onDrawingComplete?: (coords: [number, number][]) => void;
  onDrawingCancel?: () => void;
  onDrawPointsChange?: (points: [number, number][]) => void;
}

export class RestrictedAreaLayerController {
  private map: maplibregl.Map;
  private restrictedAreas: RestrictedArea[];
  private onSelectArea?: (area: RestrictedArea | null) => void;
  private onDrawingComplete?: (coords: [number, number][]) => void;
  private onDrawingCancel?: () => void;
  private onDrawPointsChange?: (points: [number, number][]) => void;

  private isDrawing = false;
  private drawPoints: [number, number][] = []; // [lon, lat]
  private cursorPoint: [number, number] | null = null;
  private isInitialized = false;
  private hoverPopup: maplibregl.Popup;

  constructor(options: RestrictedAreaLayerOptions) {
    this.map = options.map;
    this.restrictedAreas = options.restrictedAreas;
    this.onSelectArea = options.onSelectArea;
    this.onDrawingComplete = options.onDrawingComplete;
    this.onDrawingCancel = options.onDrawingCancel;
    this.onDrawPointsChange = options.onDrawPointsChange;

    this.hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'maritime-hover-popup',
    });
  }

  public init(): void {
    if (this.isInitialized || !this.map) return;

    // 1. Source for active/saved restricted area polygons
    if (!this.map.getSource('restricted-areas-source')) {
      this.map.addSource('restricted-areas-source', {
        type: 'geojson',
        data: this.getAreasGeoJSON(),
      });
    }

    // 2. Active area polygon fill: translucent color by zone type (Red, Yellow, Green)
    if (!this.map.getLayer('restricted-areas-fill')) {
      this.map.addLayer({
        id: 'restricted-areas-fill',
        type: 'fill',
        source: 'restricted-areas-source',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'status'], 'INACTIVE'], '#64748b',
            ['==', ['get', 'zoneType'], 'YELLOW'], '#eab308',
            ['==', ['get', 'zoneType'], 'GREEN'], '#10b981',
            /* default RED / RESTRICTED */ '#ea580c'
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'status'], 'ACTIVE'],
            0.12, // Subtle translucent fill, bathymetry clearly visible underneath
            0.04
          ],
        },
      });
    }

    // 3. Active area boundary outline: thin dashed line (1.5px) matching zone color
    if (!this.map.getLayer('restricted-areas-stroke')) {
      this.map.addLayer({
        id: 'restricted-areas-stroke',
        type: 'line',
        source: 'restricted-areas-source',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'status'], 'INACTIVE'], '#94a3b8',
            ['==', ['get', 'zoneType'], 'YELLOW'], '#ca8a04',
            ['==', ['get', 'zoneType'], 'GREEN'], '#059669',
            /* default RED / RESTRICTED */ '#ea580c'
          ],
          'line-width': 1.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.95,
        },
      });
    }

    // 4. Area Name Label (Subtle, visible at regional/coastal zoom)
    if (!this.map.getLayer('restricted-areas-label')) {
      this.map.addLayer({
        id: 'restricted-areas-label',
        type: 'symbol',
        source: 'restricted-areas-source',
        minzoom: 6,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 9.5,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'center',
          'text-letter-spacing': 0.08,
          'text-transform': 'uppercase',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': [
            'case',
            ['==', ['get', 'zoneType'], 'YELLOW'], '#fef08a',
            ['==', ['get', 'zoneType'], 'GREEN'], '#a7f3d0',
            /* default RED */ '#fed7aa'
          ],
          'text-halo-color': 'rgba(15, 23, 42, 0.9)',
          'text-halo-width': 1.5,
        },
      });
    }

    // 5. Source for in-progress drawing
    if (!this.map.getSource('draw-restricted-source')) {
      this.map.addSource('draw-restricted-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // 6. In-progress drawing fill
    if (!this.map.getLayer('draw-restricted-fill')) {
      this.map.addLayer({
        id: 'draw-restricted-fill',
        type: 'fill',
        source: 'draw-restricted-source',
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': 0.12,
        },
      });
    }

    // 7. In-progress drawing line
    if (!this.map.getLayer('draw-restricted-stroke')) {
      this.map.addLayer({
        id: 'draw-restricted-stroke',
        type: 'line',
        source: 'draw-restricted-source',
        paint: {
          'line-color': '#f97316',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // 8. In-progress drawing vertex handles
    if (!this.map.getLayer('draw-restricted-points')) {
      this.map.addLayer({
        id: 'draw-restricted-points',
        type: 'circle',
        source: 'draw-restricted-source',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#ea580c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });
    }

    this.bindEvents();
    this.isInitialized = true;
  }

  private getAreasGeoJSON(): GeoJSON.FeatureCollection {
    // Exclude EXPIRED zones from active map rendering
    const activeAreas = this.restrictedAreas.filter((a) => a.status !== 'EXPIRED');
    return {
      type: 'FeatureCollection',
      features: activeAreas.map((area) => ({
        type: 'Feature',
        id: area.id,
        geometry: {
          type: 'Polygon',
          coordinates: area.geometry.coordinates,
        },
        properties: {
          id: area.id,
          name: area.name,
          zoneType: area.zoneType || 'RED',
          status: area.status,
          createdAt: area.createdAt,
          expiresAt: area.expiresAt || '',
          createdBy: area.createdBy || 'OPERATOR-01',
        },
      })),
    };
  }

  public updateAreas(areas: RestrictedArea[]): void {
    this.restrictedAreas = areas;
    if (!this.map) return;

    const source = this.map.getSource('restricted-areas-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(this.getAreasGeoJSON());
    } else if (this.map.isStyleLoaded()) {
      this.init();
    }
  }

  /**
   * Enters Free-Draw Restricted Area mode
   */
  public startDrawing(): void {
    this.isDrawing = true;
    this.drawPoints = [];
    this.cursorPoint = null;
    this.hoverPopup.remove();
    this.updateDrawSource();
    if (this.onDrawPointsChange) this.onDrawPointsChange([]);

    this.map.getCanvas().style.cursor = 'crosshair';
    this.map.doubleClickZoom.disable();
  }

  private pendingPreviewCoords: [number, number][] | null = null;

  public stopDrawing(): void {
    this.isDrawing = false;
    this.cursorPoint = null;
    if (this.map) {
      this.map.getCanvas().style.cursor = '';
      this.map.doubleClickZoom.enable();
    }
  }

  public clearDrawPreview(): void {
    this.pendingPreviewCoords = null;
    this.drawPoints = [];
    this.cursorPoint = null;
    this.updateDrawSource();
    if (this.onDrawPointsChange) this.onDrawPointsChange([]);
  }

  /**
   * Cancels drawing mode and clears temp points
   */
  public cancelDrawing(): void {
    this.isDrawing = false;
    this.drawPoints = [];
    this.cursorPoint = null;
    this.pendingPreviewCoords = null;
    this.updateDrawSource();
    if (this.onDrawPointsChange) this.onDrawPointsChange([]);

    this.map.getCanvas().style.cursor = '';
    this.map.doubleClickZoom.enable();

    if (this.onDrawingCancel) {
      this.onDrawingCancel();
    }
  }

  /**
   * Closes the polygon with current vertices and keeps preview visible
   */
  public finishDrawing(): void {
    // Remove consecutive duplicate vertices (e.g. from double-click)
    const cleanPoints: [number, number][] = [];
    for (const pt of this.drawPoints) {
      if (cleanPoints.length === 0) {
        cleanPoints.push(pt);
      } else {
        const lastPt = cleanPoints[cleanPoints.length - 1];
        const dist = Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]);
        if (dist > 0.00001) {
          cleanPoints.push(pt);
        }
      }
    }

    if (cleanPoints.length >= 3) {
      const closedPoints = [...cleanPoints];
      // Close ring if not already closed
      const first = closedPoints[0];
      const last = closedPoints[closedPoints.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        closedPoints.push([first[0], first[1]]);
      }

      this.pendingPreviewCoords = closedPoints;
      this.isDrawing = false;
      this.drawPoints = [];
      this.cursorPoint = null;
      this.updateDrawSource();

      if (this.map) {
        this.map.getCanvas().style.cursor = '';
        this.map.doubleClickZoom.enable();
      }

      if (this.onDrawingComplete) {
        this.onDrawingComplete(closedPoints);
      }
      return;
    }

    this.isDrawing = false;
    this.drawPoints = [];
    this.cursorPoint = null;
    this.updateDrawSource();

    if (this.map) {
      this.map.getCanvas().style.cursor = '';
      this.map.doubleClickZoom.enable();
    }
  }

  public getIsDrawing(): boolean {
    return this.isDrawing;
  }

  public getDrawPointCount(): number {
    return this.drawPoints.length;
  }

  private updateDrawSource(): void {
    if (!this.map) return;
    const source = this.map.getSource('draw-restricted-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    // If a completed preview exists, keep it rendered on screen while modal is active!
    if (this.pendingPreviewCoords && this.pendingPreviewCoords.length >= 4) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'draw-preview-poly',
            geometry: { type: 'Polygon', coordinates: [this.pendingPreviewCoords] },
            properties: {},
          },
          {
            type: 'Feature',
            id: 'draw-preview-line',
            geometry: { type: 'LineString', coordinates: this.pendingPreviewCoords },
            properties: {},
          },
        ],
      });
      return;
    }

    const features: GeoJSON.Feature[] = [];

    // Points for all vertices
    this.drawPoints.forEach((pt, i) => {
      features.push({
        type: 'Feature',
        id: `draw-pt-${i}`,
        geometry: { type: 'Point', coordinates: pt },
        properties: { index: i },
      });
    });

    // In-progress polygon and rubber-band line
    if (this.drawPoints.length >= 1) {
      const lineCoords = [...this.drawPoints];
      if (this.cursorPoint) {
        lineCoords.push(this.cursorPoint);
      }

      if (lineCoords.length >= 2) {
        features.push({
          type: 'Feature',
          id: 'draw-line',
          geometry: { type: 'LineString', coordinates: lineCoords },
          properties: {},
        });
      }

      // Preview polygon if 2 or more vertices placed + cursor
      if (lineCoords.length >= 3) {
        const polyCoords = [...lineCoords, lineCoords[0]];
        features.push({
          type: 'Feature',
          id: 'draw-poly',
          geometry: { type: 'Polygon', coordinates: [polyCoords] },
          properties: {},
        });
      }
    }

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }

  private bindEvents(): void {
    // 1. Hover on restricted area polygon -> clean, compact tooltip (Part 14)
    this.map.on('mousemove', 'restricted-areas-fill', (e) => {
      if (this.isDrawing) return;

      // Yield priority to vessel or camera hover
      const vesselFeatures = this.map.queryRenderedFeatures(e.point, { layers: ['vessels-layer'] });
      if (vesselFeatures.length > 0) {
        this.hoverPopup.remove();
        return;
      }
      const cameraFeatures = this.map.queryRenderedFeatures(e.point, { layers: ['camera-stations-layer'] });
      if (cameraFeatures.length > 0) {
        this.hoverPopup.remove();
        return;
      }

      if (!e.features || !e.features.length) return;
      const props = e.features[0].properties;
      if (!props) return;

      this.map.getCanvas().style.cursor = 'pointer';

      const zoneName = (props.name || 'RESTRICTED AREA').toUpperCase();
      const zoneType = props.zoneType || 'RED';
      const status = props.status || 'ACTIVE';
      const expiresAt = props.expiresAt;

      let expiryText = 'Permanent';
      if (expiresAt) {
        const diff = new Date(expiresAt).getTime() - Date.now();
        if (diff > 0) {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          expiryText = `Expires: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
          expiryText = 'EXPIRED';
        }
      }

      const tagColor = zoneType === 'GREEN' ? '#047857' : zoneType === 'YELLOW' ? '#b45309' : '#c2410c';
      const borderColor = zoneType === 'GREEN' ? 'rgba(5, 150, 105, 0.5)' : zoneType === 'YELLOW' ? 'rgba(202, 138, 4, 0.5)' : 'rgba(234, 88, 12, 0.5)';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 110px; padding: 4px 7px; border-radius: 4px; background: rgba(255, 255, 255, 0.98); border: 1px solid ${borderColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); line-height: 1.25; backdrop-filter: blur(8px);">
          <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; font-weight: 700; color: #0f172a; letter-spacing: 0.04em;">${zoneName}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px;">
            <span style="font-size: 8px; font-weight: 700; color: ${tagColor}; text-transform: uppercase;">${zoneType} / ${status}</span>
            <span style="font-size: 8px; color: #64748b; font-family: ui-monospace, monospace;">${expiryText}</span>
          </div>
        </div>
      `;

      this.hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(this.map);
    });

    this.map.on('mouseleave', 'restricted-areas-fill', () => {
      if (this.isDrawing) return;
      this.map.getCanvas().style.cursor = '';
      this.hoverPopup.remove();
    });

    // 2. Click on restricted area polygon -> select zone (unless a vessel/camera was clicked)
    this.map.on('click', 'restricted-areas-fill', (e) => {
      if (this.isDrawing) return;

      const vesselFeatures = this.map.queryRenderedFeatures(e.point, { layers: ['vessels-layer'] });
      if (vesselFeatures.length > 0) return; // Vessel takes priority

      const cameraFeatures = this.map.queryRenderedFeatures(e.point, { layers: ['camera-stations-layer'] });
      if (cameraFeatures.length > 0) return; // Camera takes priority

      if (!e.features || !e.features.length) return;
      const areaId = e.features[0].properties?.id;
      const area = this.restrictedAreas.find((a) => a.id === areaId) || null;
      if (this.onSelectArea) {
        this.onSelectArea(area);
      }
    });

    // 3. Drawing Mode Map Click: Add vertex or close polygon
    this.map.on('click', (e) => {
      if (!this.isDrawing) return;

      const coord: [number, number] = [Number(e.lngLat.lng.toFixed(5)), Number(e.lngLat.lat.toFixed(5))];

      // If user clicks near the starting point (with >= 3 points), close the polygon
      if (this.drawPoints.length >= 3) {
        const startPoint = this.drawPoints[0];
        const pixelPoint = this.map.project([coord[0], coord[1]]);
        const startPixel = this.map.project([startPoint[0], startPoint[1]]);
        const dist = Math.hypot(pixelPoint.x - startPixel.x, pixelPoint.y - startPixel.y);

        if (dist < 18) {
          this.finishDrawing();
          return;
        }
      }

      this.drawPoints.push(coord);
      this.updateDrawSource();
      if (this.onDrawPointsChange) this.onDrawPointsChange([...this.drawPoints]);
    });

    // 4. Drawing Mode Double Click: Close polygon
    this.map.on('dblclick', (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      if (this.drawPoints.length >= 3) {
        this.finishDrawing();
      }
    });

    // 5. Drawing Mode Mouse Move: Update live rubber-band cursor
    this.map.on('mousemove', (e) => {
      if (!this.isDrawing) return;
      this.cursorPoint = [Number(e.lngLat.lng.toFixed(5)), Number(e.lngLat.lat.toFixed(5))];
      this.updateDrawSource();
    });
  }
}
