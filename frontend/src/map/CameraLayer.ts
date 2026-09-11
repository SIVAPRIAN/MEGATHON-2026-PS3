import * as maplibregl from 'maplibre-gl';
import { EOCamera } from '../types/maritime';
import { destinationPoint } from '../utils/geoUtils';

export interface CameraLayerOptions {
  map: maplibregl.Map;
  cameras: EOCamera[];
  onSelectCamera?: (camera: EOCamera | null) => void;
}

/**
 * Generates the rich tactical FOV wedge polygon, optical depth core, range arcs, boresight centerline, and range labels for a selected camera
 */
export function generateSelectedCameraFovGeoJSON(cam: EOCamera): GeoJSON.FeatureCollection {
  const heading = cam.heading ?? 90;
  const fov = cam.fov ?? 46;
  const rangeKm = cam.rangeKm ?? 15;
  const steps = 36;
  const startAngle = heading - fov / 2;
  const endAngle = heading + fov / 2;
  const stepAngle = (endAngle - startAngle) / steps;

  // 1. Max Range Arc Coordinates (100%)
  const outerArcCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    outerArcCoords.push(destinationPoint(cam.lon, cam.lat, rangeKm, angle));
  }

  // 2. Mid Range Arc Coordinates (66%)
  const midArcCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    midArcCoords.push(destinationPoint(cam.lon, cam.lat, rangeKm * 0.66, angle));
  }

  // 3. Near Range Arc Coordinates (33%)
  const nearArcCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    nearArcCoords.push(destinationPoint(cam.lon, cam.lat, rangeKm * 0.33, angle));
  }

  // 4. Main Sector Polygon: [origin] + outerArcCoords + [origin]
  const polygonCoords: [number, number][] = [[cam.lon, cam.lat], ...outerArcCoords, [cam.lon, cam.lat]];

  // 5. Inner Core Sector Polygon (50% range for layered visual depth)
  const innerArcCoords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + i * stepAngle;
    innerArcCoords.push(destinationPoint(cam.lon, cam.lat, rangeKm * 0.5, angle));
  }
  const innerPolygonCoords: [number, number][] = [[cam.lon, cam.lat], ...innerArcCoords, [cam.lon, cam.lat]];

  // 6. Radial Boundary Lines (Left & Right Bearing Limits)
  const leftEdgePt = outerArcCoords[0];
  const rightEdgePt = outerArcCoords[outerArcCoords.length - 1];
  const boundaryLines: [number, number][] = [leftEdgePt, [cam.lon, cam.lat], rightEdgePt];

  // 7. Optical Boresight / Centerline Axis
  const centerBoresightPt = destinationPoint(cam.lon, cam.lat, rangeKm, heading);
  const centerAxisLine: [number, number][] = [[cam.lon, cam.lat], centerBoresightPt];

  // 8. Distance and Sector Information Label Coordinates
  const outerLabelPt = destinationPoint(cam.lon, cam.lat, rangeKm * 1.03, heading);
  const midLabelPt = destinationPoint(cam.lon, cam.lat, rangeKm * 0.66, heading);
  const nearLabelPt = destinationPoint(cam.lon, cam.lat, rangeKm * 0.33, heading);

  return {
    type: 'FeatureCollection',
    features: [
      // A) Main FOV Coverage Area (Polygon Fill)
      {
        type: 'Feature',
        id: 'fov-wedge-polygon',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
        },
        properties: {
          id: cam.id,
          name: cam.name,
          rangeKm: rangeKm,
          heading: heading,
          fov: fov,
          layerType: 'primary-wedge',
        },
      },
      // B) Inner Optical Focus Core (50% Polygon Fill)
      {
        type: 'Feature',
        id: 'fov-inner-glow',
        geometry: {
          type: 'Polygon',
          coordinates: [innerPolygonCoords],
        },
        properties: {
          id: cam.id,
          layerType: 'inner-glow',
        },
      },
      // C) Outer 100% Perimeter Arc (LineString)
      {
        type: 'Feature',
        id: 'fov-outer-arc',
        geometry: {
          type: 'LineString',
          coordinates: outerArcCoords,
        },
        properties: {
          id: cam.id,
          rangeKm: rangeKm,
          layerType: 'outer-arc',
        },
      },
      // D) Mid 66% Range Arc (LineString)
      {
        type: 'Feature',
        id: 'fov-mid-arc',
        geometry: {
          type: 'LineString',
          coordinates: midArcCoords,
        },
        properties: {
          id: cam.id,
          rangeKm: Math.round(rangeKm * 0.66),
          layerType: 'intermediate-arc',
        },
      },
      // E) Near 33% Range Arc (LineString)
      {
        type: 'Feature',
        id: 'fov-near-arc',
        geometry: {
          type: 'LineString',
          coordinates: nearArcCoords,
        },
        properties: {
          id: cam.id,
          rangeKm: Math.round(rangeKm * 0.33),
          layerType: 'intermediate-arc',
        },
      },
      // F) Radial Boundary Limit Lines (LineString)
      {
        type: 'Feature',
        id: 'fov-radial-boundaries',
        geometry: {
          type: 'LineString',
          coordinates: boundaryLines,
        },
        properties: {
          id: cam.id,
          layerType: 'radial-boundary',
        },
      },
      // G) Optical Boresight Centerline (LineString)
      {
        type: 'Feature',
        id: 'fov-center-boresight',
        geometry: {
          type: 'LineString',
          coordinates: centerAxisLine,
        },
        properties: {
          id: cam.id,
          layerType: 'boresight',
        },
      },
      // H) Tactical Outer FOV Badge Label (Point)
      {
        type: 'Feature',
        id: 'fov-outer-range-label',
        geometry: {
          type: 'Point',
          coordinates: outerLabelPt,
        },
        properties: {
          label: `${rangeKm} KM MAX EO RANGE (${fov}° FOV • ${heading}° AZIMUTH)`,
          layerType: 'outer-label',
        },
      },
      // I) Mid Arc Range Label (Point)
      {
        type: 'Feature',
        id: 'fov-mid-range-label',
        geometry: {
          type: 'Point',
          coordinates: midLabelPt,
        },
        properties: {
          label: `${(rangeKm * 0.66).toFixed(1)} km`,
          layerType: 'sub-label',
        },
      },
      // J) Near Arc Range Label (Point)
      {
        type: 'Feature',
        id: 'fov-near-range-label',
        geometry: {
          type: 'Point',
          coordinates: nearLabelPt,
        },
        properties: {
          label: `${(rangeKm * 0.33).toFixed(1)} km`,
          layerType: 'sub-label',
        },
      },
    ],
  };
}

export class CameraLayerController {
  private map: maplibregl.Map;
  private cameras: EOCamera[];
  private selectedCameraId: string | null = null;
  private onSelectCamera?: (camera: EOCamera | null) => void;
  private hoverPopup: maplibregl.Popup;
  private isInitialized = false;
  private isDrawing = false;

  constructor(options: CameraLayerOptions) {
    this.map = options.map;
    this.cameras = options.cameras;
    this.onSelectCamera = options.onSelectCamera;

    this.hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -12],
      className: 'camera-hover-popup',
    });
  }

  public setIsDrawing(drawing: boolean): void {
    this.isDrawing = drawing;
    if (drawing) {
      this.hoverPopup.remove();
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !this.map) return;

    // 1. Build GeoJSON FeatureCollection for all 87 DGLL NAIS Physical Shore Stations
    const cameraPointsGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: this.cameras.map((cam) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cam.lon, cam.lat],
        },
        properties: {
          id: cam.id,
          stationCode: cam.stationCode || cam.id,
          siteName: cam.siteName || cam.name.replace(/^PSS\s+/i, ''),
          fullName: cam.fullName || cam.name,
          status: cam.status || 'REFERENCE',
          model: cam.model || 'Coastal Sensor Site',
          rangeKm: cam.rangeKm || 15,
          heading: cam.heading ?? 90,
          fov: cam.fov || 46,
          rcc: cam.rcc || 'DGLL',
          state: cam.state || 'India',
          alolNo: cam.alolNo || '-',
          mmsi: cam.mmsi || '',
          communication: cam.communication || 'VSAT',
          detectionsCount: cam.detectionsCount || 0,
          lastFrame: cam.lastFrame || '05:00:00 GMT',
          associatedDetectionId: cam.associatedDetectionId || '',
          associatedAisId: cam.associatedAisId || '',
        },
      })),
    };

    // 2. Add GeoJSON Source for Camera Beacons
    if (!this.map.getSource('camera-stations-source')) {
      this.map.addSource('camera-stations-source', {
        type: 'geojson',
        data: cameraPointsGeoJSON,
        cluster: false,
      });
    }

    // 3. Add Dynamic FOV Sources
    if (!this.map.getSource('selected-camera-fov-source')) {
      this.map.addSource('selected-camera-fov-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!this.map.getSource('selected-camera-ring-source')) {
      this.map.addSource('selected-camera-ring-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // 4. Add FOV Layers (Translucent Cyan Fill, Depth Core, Wedge Outline, Range Arcs, Boresight, Tactical Labels)
    // A) Main FOV Wedge Coverage Fill
    if (!this.map.getLayer('camera-fov-fill')) {
      this.map.addLayer({
        id: 'camera-fov-fill',
        type: 'fill',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'primary-wedge'],
        paint: {
          'fill-color': '#06b6d4',
          'fill-opacity': 0.28,
        },
      });
    }

    // B) Optical Depth Core Fill (50% Near-Zone Focus)
    if (!this.map.getLayer('camera-fov-inner-fill')) {
      this.map.addLayer({
        id: 'camera-fov-inner-fill',
        type: 'fill',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'inner-glow'],
        paint: {
          'fill-color': '#38bdf8',
          'fill-opacity': 0.18,
        },
      });
    }

    // C) Wedge Perimeter Outline
    if (!this.map.getLayer('camera-fov-wedge-outline')) {
      this.map.addLayer({
        id: 'camera-fov-wedge-outline',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'primary-wedge'],
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.6,
          'line-opacity': 0.9,
        },
      });
    }

    // D) Radial Limit Boundary Lines (Left & Right bearing edges)
    if (!this.map.getLayer('camera-fov-radial-boundaries')) {
      this.map.addLayer({
        id: 'camera-fov-radial-boundaries',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'radial-boundary'],
        paint: {
          'line-color': '#22d3ee',
          'line-width': 2.2,
          'line-opacity': 1.0,
        },
      });
    }

    // E) Optical Boresight / Centerline Axis
    if (!this.map.getLayer('camera-fov-boresight')) {
      this.map.addLayer({
        id: 'camera-fov-boresight',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'boresight'],
        paint: {
          'line-color': '#a5f3fc',
          'line-width': 1.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.95,
        },
      });
    }

    // F) Intermediate Range Arcs (33% and 66%)
    if (!this.map.getLayer('camera-fov-intermediate-arcs')) {
      this.map.addLayer({
        id: 'camera-fov-intermediate-arcs',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'intermediate-arc'],
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 1.6,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        },
      });
    }

    // G) Outer Max Range Arc (100%)
    if (!this.map.getLayer('camera-fov-range-arc')) {
      this.map.addLayer({
        id: 'camera-fov-range-arc',
        type: 'line',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'outer-arc'],
        paint: {
          'line-color': '#00f0ff',
          'line-width': 3.0,
          'line-opacity': 1.0,
        },
      });
    }

    // H) Outer Range & Azimuth Tactical Badge Label
    if (!this.map.getLayer('camera-fov-range-label')) {
      this.map.addLayer({
        id: 'camera-fov-range-label',
        type: 'symbol',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'outer-label'],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11.0,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-anchor': 'bottom',
        },
        paint: {
          'text-color': '#00f0ff',
          'text-halo-color': 'rgba(15, 23, 42, 0.98)',
          'text-halo-width': 2.2,
        },
      });
    }

    // I) Sub Range Labels (33% and 66%)
    if (!this.map.getLayer('camera-fov-sub-labels')) {
      this.map.addLayer({
        id: 'camera-fov-sub-labels',
        type: 'symbol',
        source: 'selected-camera-fov-source',
        filter: ['==', ['get', 'layerType'], 'sub-label'],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 9.5,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#7dd3fc',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 1.8,
        },
      });
    }

    // 5. Add Selection Ring Layer
    if (!this.map.getLayer('selected-camera-ring')) {
      this.map.addLayer({
        id: 'selected-camera-ring',
        type: 'circle',
        source: 'selected-camera-ring-source',
        paint: {
          'circle-radius': 14.0,
          'circle-color': 'rgba(56, 189, 248, 0.20)',
          'circle-stroke-color': '#00f0ff',
          'circle-stroke-width': 2.4,
          'circle-stroke-opacity': 1.0,
        },
      });
    }

    // 6. Native WebGL High-Visibility Coastal Sensor Beacons (GUARANTEED TO RENDER ON ALL ZOOM LEVELS)
    // A) Outer glowing halo beacon (6px to 14px)
    if (!this.map.getLayer('camera-stations-halo')) {
      this.map.addLayer({
        id: 'camera-stations-halo',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 6.0,
            6.0, 8.5,
            9.0, 11.5,
            13.0, 15.0
          ],
          'circle-color': 'rgba(6, 182, 212, 0.40)',
          'circle-stroke-color': '#00f0ff',
          'circle-stroke-width': 1.5,
          'circle-stroke-opacity': 0.95,
        },
      });
    }

    // B) Crisp Solid Center Sensor Body (4px to 9px)
    if (!this.map.getLayer('camera-stations-core')) {
      this.map.addLayer({
        id: 'camera-stations-core',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 4.0,
            6.0, 5.5,
            9.0, 7.0,
            13.0, 9.0
          ],
          'circle-color': '#0284c7',
          'circle-stroke-color': '#00f0ff',
          'circle-stroke-width': 1.6,
        },
      });
    }

    // C) Optical Lens Reflection Center Dot (1.5px to 3.5px)
    if (!this.map.getLayer('camera-stations-lens')) {
      this.map.addLayer({
        id: 'camera-stations-lens',
        type: 'circle',
        source: 'camera-stations-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 1.8,
            6.0, 2.4,
            9.0, 3.0,
            13.0, 4.0
          ],
          'circle-color': '#ffffff',
        },
      });
    }

    // D) Clear Coastal Site Labels along the Indian Coastline
    if (!this.map.getLayer('camera-stations-labels')) {
      this.map.addLayer({
        id: 'camera-stations-labels',
        type: 'symbol',
        source: 'camera-stations-source',
        layout: {
          'text-field': ['get', 'siteName'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4.5, 8.5,
            7.0, 9.5,
            11.0, 11.0
          ],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#f1f5f9',
          'text-halo-color': 'rgba(15, 23, 42, 0.98)',
          'text-halo-width': 1.8,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4.8, 0.75,
            6.0, 0.95,
            8.0, 1.0
          ],
        },
      });
    }

    this.bindEvents();
    this.bringToFront();
    this.isInitialized = true;
  }

  public bringToFront(): void {
    if (!this.map) return;
    const layerIds = [
      'camera-fov-fill',
      'camera-fov-inner-fill',
      'camera-fov-wedge-outline',
      'camera-fov-radial-boundaries',
      'camera-fov-boresight',
      'camera-fov-intermediate-arcs',
      'camera-fov-range-arc',
      'camera-fov-range-label',
      'camera-fov-sub-labels',
      'selected-camera-ring',
      'camera-stations-halo',
      'camera-stations-core',
      'camera-stations-lens',
      'camera-stations-labels',
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

  private bindEvents(): void {
    const interactiveLayers = [
      'camera-stations-core',
      'camera-stations-halo',
      'camera-stations-lens',
      'camera-stations-labels',
    ];

    interactiveLayers.forEach((layerId) => {
      // 1. Hover tooltip
      this.map.on('mouseenter', layerId, (e) => {
        if (this.isDrawing) return;
        this.map.getCanvas().style.cursor = 'pointer';
        if (!e.features || !e.features.length) return;

        const feature = e.features[0];
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feature.properties;
        if (!props) return;

        const cameraId = props.id || 'CAM-01';
        const siteName = (props.siteName || props.name || 'COASTAL SITE').toUpperCase();
        const state = props.state || 'India';
        const rangeKm = props.rangeKm || 15;
        const heading = props.heading ?? 90;
        const fov = props.fov ?? 46;
        const isDemo = props.status === 'DEMO ACTIVE';

        const html = `
          <div class="maritime-camera-popup" style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 140px; padding: 6px 9px; border-radius: 6px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(56, 189, 248, 0.6); box-shadow: 0 4px 16px rgba(0,0,0,0.6); backdrop-filter: blur(8px); line-height: 1.3;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-family: ui-monospace, monospace; font-size: 10px; font-weight: 700; color: #38bdf8;">${cameraId}</span>
              <span style="font-size: 8px; font-weight: 700; color: ${isDemo ? '#38bdf8' : '#10b981'}; background: ${isDemo ? 'rgba(2, 132, 199, 0.3)' : 'rgba(6, 78, 59, 0.8)'}; border: 1px solid ${isDemo ? '#38bdf8' : 'rgba(16, 185, 129, 0.6)'}; padding: 1px 4px; border-radius: 3px;">
                ${isDemo ? 'PRIMARY EO' : 'COASTAL PSS'}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #f8fafc;">${siteName}</div>
            <div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">${state} • Range: ${rangeKm} km • Azimuth: ${heading}° (${fov}° FOV)</div>
            <div style="font-size: 8.5px; color: #38bdf8; margin-top: 4px; border-top: 1px solid rgba(51, 65, 85, 0.8); padding-top: 3px; font-weight: 500;">
              Click to view optical field of view coverage
            </div>
          </div>
        `;

        this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
      });

      this.map.on('mouseleave', layerId, () => {
        this.map.getCanvas().style.cursor = '';
        this.hoverPopup.remove();
      });

      // 2. Click handler - Triggers immediate FOV drawing on the map
      this.map.on('click', layerId, (e: any) => {
        if (this.isDrawing) return;
        if (!e.features || !e.features.length) return;
        e._cameraClicked = true;

        const id = e.features[0].properties?.id;
        const cam = this.cameras.find((c) => c.id === id) || null;

        if (cam) {
          this.setSelectedCamera(cam);
          if (this.onSelectCamera) {
            this.onSelectCamera(cam);
          }
        }
      });
    });
  }

  /**
   * Sets or clears the active camera, updates FOV GeoJSON, and handles selection ring
   */
  public setSelectedCamera(cam: EOCamera | null): void {
    this.selectedCameraId = cam ? cam.id : null;
    if (!this.map) return;

    const fovSource = this.map.getSource('selected-camera-fov-source') as maplibregl.GeoJSONSource | undefined;
    const ringSource = this.map.getSource('selected-camera-ring-source') as maplibregl.GeoJSONSource | undefined;

    if (!cam) {
      // Clear FOV and Selection Ring
      if (fovSource) fovSource.setData({ type: 'FeatureCollection', features: [] });
      if (ringSource) ringSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    // 1. Draw FOV GeoJSON (Polygon, Inner Core, Arcs, Radial Lines, Boresight, and Range Labels)
    const fovGeoJSON = generateSelectedCameraFovGeoJSON(cam);
    if (fovSource) {
      fovSource.setData(fovGeoJSON);
    }

    // 2. Draw Selection Ring around the station
    if (ringSource) {
      ringSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [cam.lon, cam.lat],
            },
            properties: { id: cam.id },
          },
        ],
      });
    }

    // 3. Bring FOV and Station layers to top of layer hierarchy
    this.bringToFront();

    // 4. Smoothly center and focus on the seaward viewing sector
    const heading = cam.heading ?? 90;
    const rangeKm = cam.rangeKm ?? 15;
    const focalPoint = destinationPoint(cam.lon, cam.lat, rangeKm * 0.45, heading);
    this.map.easeTo({
      center: focalPoint,
      zoom: 11.2,
      duration: 700,
    });
  }

  public setVisibility(visible: boolean): void {
    if (!this.map) return;
    const val = visible ? 'visible' : 'none';

    [
      'camera-stations-halo',
      'camera-stations-core',
      'camera-stations-lens',
      'camera-stations-labels',
      'selected-camera-ring',
      'camera-fov-fill',
      'camera-fov-inner-fill',
      'camera-fov-wedge-outline',
      'camera-fov-radial-boundaries',
      'camera-fov-boresight',
      'camera-fov-intermediate-arcs',
      'camera-fov-range-arc',
      'camera-fov-range-label',
      'camera-fov-sub-labels',
    ].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }
}
