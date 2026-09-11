import * as maplibregl from 'maplibre-gl';
import { PatrolUnit } from '../types/maritime';
import { patrolUnitsToGeoJSON } from '../utils/patrolUtils';

/**
 * Creates a crisp 32x32px ImageData tactical coastal patrol vessel silhouette
 * Top-down high-speed law enforcement interceptor hull pointing North (0°).
 * Minimal geometry: Wave-piercing bow, stepped chine, tactical cabin, law enforcement badge center.
 * Generated synchronously via HTML5 Canvas for bulletproof WebGL texture rendering.
 */
export function createPatrolImageData(
  hullColor: string,
  strokeColor: string,
  strobeColor: string,
  size = 32
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.clearRect(0, 0, size, size);

  const w = size;
  const h = size;

  // 1. High-speed Interceptor Hull
  ctx.beginPath();
  ctx.moveTo(w * 0.50, h * 0.05); // Sharp wave-piercing bow
  ctx.lineTo(w * 0.85, h * 0.35); // Starboard chine
  ctx.lineTo(w * 0.85, h * 0.90); // Starboard transom
  ctx.lineTo(w * 0.15, h * 0.90); // Port transom
  ctx.lineTo(w * 0.15, h * 0.35); // Port chine
  ctx.closePath();

  ctx.fillStyle = hullColor;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.0;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 2. Tactical Cabin superstructure
  ctx.beginPath();
  ctx.rect(w * 0.30, h * 0.40, w * 0.40, h * 0.35);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Law Enforcement Emergency Strobe Beacon
  ctx.beginPath();
  ctx.arc(w * 0.50, h * 0.55, w * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = strobeColor;
  ctx.fill();

  // Highlight dot
  ctx.beginPath();
  ctx.arc(w * 0.48, h * 0.53, w * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

export interface InterceptVectorData {
  targetId: string;
  targetName: string;
  targetCoordinates: [number, number]; // [lon, lat]
  patrolId: string;
  patrolCoordinates: [number, number]; // [lon, lat]
  distanceKm: number;
  etaMinutes: number;
  isDispatched: boolean;
}

/**
 * Pre-computed `line-dasharray` keyframes. Cycling through them moves the gap along the
 * line, producing the marching-ants effect used for the tactical intercept vector.
 */
const INTERCEPT_DASH_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

export interface PatrolLayerOptions {
  map: maplibregl.Map;
  patrolUnits: PatrolUnit[];
  onSelectPatrol?: (patrol: PatrolUnit | null) => void;
}

export class PatrolLayerController {
  private map: maplibregl.Map;
  private patrolUnits: PatrolUnit[];
  private onSelectPatrol?: (patrol: PatrolUnit | null) => void;
  private hoverPopup: maplibregl.Popup;
  private isInitialized = false;
  private activeIntercept: InterceptVectorData | null = null;
  private selectedPatrolId: string | null = null;

  // Tactical animation loop (marching dashes on the intercept vector + strobe beacon pulse)
  private animationFrameId: number | null = null;
  private dashStep = 0;
  private lastDashAdvanceMs = 0;
  private isDestroyed = false;

  constructor(options: PatrolLayerOptions) {
    this.map = options.map;
    this.patrolUnits = options.patrolUnits;
    this.onSelectPatrol = options.onSelectPatrol;

    this.hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -12],
      className: 'maritime-hover-popup',
    });
  }

  /**
   * Initializes MapLibre sources, symbol layers, and tactical intercept route
   */
  public async init(): Promise<void> {
    if (this.isInitialized || !this.map) return;

    // 1. Register tactical patrol vessel icons
    try {
      // Available: Deep tactical navy body, vibrant cyan border, bright emerald strobe
      const availableImg = createPatrolImageData('#0c2a38', '#0ea5e9', '#10b981', 32);
      // Responding: Deep navy body, vivid orange border, bright pulsing amber strobe
      const respondingImg = createPatrolImageData('#2a1b0c', '#f59e0b', '#fbbf24', 32);
      // Busy: Dark slate body, steel border, slate strobe
      const busyImg = createPatrolImageData('#1e293b', '#64748b', '#94a3b8', 32);

      if (this.map.hasImage('patrol-unit-available')) this.map.removeImage('patrol-unit-available');
      this.map.addImage('patrol-unit-available', availableImg);

      if (this.map.hasImage('patrol-unit-responding')) this.map.removeImage('patrol-unit-responding');
      this.map.addImage('patrol-unit-responding', respondingImg);

      if (this.map.hasImage('patrol-unit-busy')) this.map.removeImage('patrol-unit-busy');
      this.map.addImage('patrol-unit-busy', busyImg);
    } catch (e) {
      console.error('Failed to register patrol canvas images', e);
    }

    // 2. Add Tactical Intercept Route Source & Layers
    if (!this.map.getSource('patrol-intercept-source')) {
      this.map.addSource('patrol-intercept-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Intercept line glow (outer)
    if (!this.map.getLayer('patrol-intercept-glow')) {
      this.map.addLayer({
        id: 'patrol-intercept-glow',
        type: 'line',
        source: 'patrol-intercept-source',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': [
            'case',
            ['get', 'isDispatched'],
            '#f59e0b', // Responding / Dispatched: Tactical Amber
            '#0ea5e9'  // Standby / Available: Cyan
          ],
          'line-width': 4.5,
          'line-opacity': 0.35,
        },
      });
    }

    // Intercept line core (dashed vector)
    if (!this.map.getLayer('patrol-intercept-line')) {
      this.map.addLayer({
        id: 'patrol-intercept-line',
        type: 'line',
        source: 'patrol-intercept-source',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': [
            'case',
            ['get', 'isDispatched'],
            '#fbbf24',
            '#38bdf8'
          ],
          'line-width': 2.0,
          'line-dasharray': [4, 3],
          'line-opacity': 0.95,
        },
      });
    }

    // Intercept midpoint label & distance badge
    if (!this.map.getLayer('patrol-intercept-label')) {
      this.map.addLayer({
        id: 'patrol-intercept-label',
        type: 'symbol',
        source: 'patrol-intercept-source',
        filter: ['==', '$type', 'Point'],
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 9.5,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 2.0,
        },
      });
    }

    // 3. Add Patrol Units GeoJSON Source
    if (!this.map.getSource('patrol-units-source')) {
      this.map.addSource('patrol-units-source', {
        type: 'geojson',
        data: patrolUnitsToGeoJSON(this.patrolUnits),
      });
    }

    // 4. Add Patrol Units Status Halo Ring Layer
    if (!this.map.getLayer('patrol-units-ring')) {
      this.map.addLayer({
        id: 'patrol-units-ring',
        type: 'circle',
        source: 'patrol-units-source',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 9,
            7, 12,
            11, 15,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': [
            'match',
            ['get', 'status'],
            'RESPONDING', '#f59e0b',
            'BUSY', '#64748b',
            /* default AVAILABLE */ '#0ea5e9'
          ],
          'circle-stroke-width': 1.6,
          'circle-stroke-opacity': 0.85,
        },
      });
    }

    // 5. Emergency Strobe Beacon halo — animated pulse driven by startAnimation().
    //    Rendered for every unit; the pulse is far stronger for RESPONDING craft.
    if (!this.map.getLayer('patrol-units-strobe')) {
      this.map.addLayer({
        id: 'patrol-units-strobe',
        type: 'circle',
        source: 'patrol-units-source',
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match',
            ['get', 'status'],
            'RESPONDING', '#fbbf24',
            'BUSY', '#94a3b8',
            /* default AVAILABLE */ '#10b981'
          ],
          'circle-opacity': 0.25,
          'circle-blur': 0.6,
        },
      });
    }

    // 6. Operator selection ring — filtered to the clicked unit.
    if (!this.map.getLayer('patrol-units-selection')) {
      this.map.addLayer({
        id: 'patrol-units-selection',
        type: 'circle',
        source: 'patrol-units-source',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 13,
            7, 17,
            11, 21,
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#f8fafc',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 0.9,
        },
      });
    }

    // 7. Add Patrol Units Symbol Layer
    if (!this.map.getLayer('patrol-units-layer')) {
      this.map.addLayer({
        id: 'patrol-units-layer',
        type: 'symbol',
        source: 'patrol-units-source',
        layout: {
          'icon-image': [
            'match',
            ['get', 'status'],
            'RESPONDING', 'patrol-unit-responding',
            'BUSY', 'patrol-unit-busy',
            /* default AVAILABLE */ 'patrol-unit-available'
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
            3.5, 0.50, // ~16px
            5.0, 0.70, // ~22px
            7.5, 0.85, // ~27px
            11, 1.0,   // ~32px
          ],
          // Unit label
          'text-field': ['get', 'id'],
          'text-size': 8.5,
          'text-offset': [0, 1.35],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#38bdf8',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 1.8,
        },
      });
    }

    this.bindEvents();
    this.bringToFront();
    this.isInitialized = true;

    // Apply any intercept vector that arrived before the style finished loading.
    if (this.activeIntercept) {
      this.setInterceptVector(this.activeIntercept);
    }
    this.setSelectedPatrol(this.selectedPatrolId);

    this.startAnimation();
  }

  /**
   * Raises all patrol tactical layers to top of layer hierarchy
   */
  public bringToFront(): void {
    if (!this.map) return;
    const layerIds = [
      'patrol-intercept-line',
      'patrol-units-ring',
      'patrol-units-strobe',
      'patrol-units-layer',
    ];
    layerIds.forEach((id) => {
      if (this.map.getLayer(id)) {
        try {
          this.map.moveLayer(id);
        } catch {
          // Ignore
        }
      }
    });
  }

  /**
   * Drives the two tactical animations with a single rAF loop:
   *  - marching dashes along the intercept vector (advanced on a fixed ~65 ms cadence)
   *  - the emergency strobe beacon pulse on each patrol craft (smooth sine)
   */
  private startAnimation(): void {
    if (this.animationFrameId !== null || this.isDestroyed) return;

    const frame = (timestamp: number) => {
      if (this.isDestroyed || !this.map) return;

      try {
        // --- Marching dashes on the intercept vector ---
        if (this.activeIntercept && this.map.getLayer('patrol-intercept-line')) {
          if (timestamp - this.lastDashAdvanceMs > 65) {
            this.lastDashAdvanceMs = timestamp;
            this.dashStep = (this.dashStep + 1) % INTERCEPT_DASH_SEQUENCE.length;
            this.map.setPaintProperty(
              'patrol-intercept-line',
              'line-dasharray',
              INTERCEPT_DASH_SEQUENCE[this.dashStep]
            );
          }
        }

        // --- Emergency strobe beacon pulse ---
        if (this.map.getLayer('patrol-units-strobe')) {
          // 1.4 s period; phase in [0, 1)
          const phase = (timestamp % 1400) / 1400;
          const pulse = (1 - Math.cos(phase * Math.PI * 2)) / 2; // 0 -> 1 -> 0

          // Responding craft strobe hard; idle craft breathe gently.
          this.map.setPaintProperty('patrol-units-strobe', 'circle-radius', [
            'match',
            ['get', 'status'],
            'RESPONDING', 11 + pulse * 13,
            'BUSY', 9,
            /* default AVAILABLE */ 10 + pulse * 3,
          ]);
          this.map.setPaintProperty('patrol-units-strobe', 'circle-opacity', [
            'match',
            ['get', 'status'],
            'RESPONDING', 0.45 - pulse * 0.35,
            'BUSY', 0.12,
            /* default AVAILABLE */ 0.2 - pulse * 0.1,
          ]);
        }
      } catch {
        // Style reloads can transiently drop layers mid-frame; skip and retry next frame.
      }

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private bindEvents(): void {
    // Hover on patrol unit -> tactical unit details tooltip
    this.map.on('mouseenter', 'patrol-units-layer', (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      if (!e.features || !e.features.length) return;

      const feature = e.features[0];
      const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const id = feature.properties?.id || 'PATROL';
      const name = feature.properties?.name || 'Fast Interceptor Craft';
      const status = feature.properties?.status || 'AVAILABLE';
      const station = feature.properties?.station || 'Coast Guard Base';
      const speed = feature.properties?.speedKnots || 32;

      const isResponding = status === 'RESPONDING';
      const isBusy = status === 'BUSY';

      const statusColor = isResponding ? '#fbbf24' : isBusy ? '#94a3b8' : '#34d399';
      const statusBg = isResponding ? 'rgba(245, 158, 11, 0.2)' : isBusy ? 'rgba(100, 116, 139, 0.2)' : 'rgba(16, 185, 129, 0.2)';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 140px; padding: 6px 9px; border-radius: 4px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(56, 189, 248, 0.4); box-shadow: 0 4px 14px rgba(0,0,0,0.5); line-height: 1.3; backdrop-filter: blur(8px);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
            <span style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; font-weight: 700; color: #38bdf8;">${id}</span>
            <span style="font-size: 8.5px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; padding: 1px 4px; border-radius: 2px; text-transform: uppercase;">
              ${status}
            </span>
          </div>
          <div style="font-size: 9.5px; color: #f1f5f9; font-weight: 600; margin-bottom: 2px;">
            ${name}
          </div>
          <div style="font-size: 8.5px; color: #94a3b8;">
            ${station} • ${speed} kn
          </div>
        </div>
      `;

      this.hoverPopup.setLngLat(coordinates).setHTML(html).addTo(this.map);
    });

    this.map.on('mouseleave', 'patrol-units-layer', () => {
      this.map.getCanvas().style.cursor = '';
      this.hoverPopup.remove();
    });

    // Click on patrol unit -> select patrol unit
    this.map.on('click', 'patrol-units-layer', (e) => {
      if (!e.features || !e.features.length) return;
      const feature = e.features[0];
      const patrolId = feature.properties?.id;
      const unit = this.patrolUnits.find((p) => p.id === patrolId) || null;

      this.selectedPatrolId = unit ? unit.id : null;
      if (this.onSelectPatrol) {
        this.onSelectPatrol(unit);
      }
    });
  }

  /**
   * Updates the tactical intercept vector line and distance badge on the map
   */
  public setInterceptVector(intercept: InterceptVectorData | null): void {
    this.activeIntercept = intercept;
    if (!this.map || !this.map.isStyleLoaded()) return;

    const source = this.map.getSource('patrol-intercept-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (!intercept) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const [tLon, tLat] = intercept.targetCoordinates;
    const [pLon, pLat] = intercept.patrolCoordinates;
    const midLon = (tLon + pLon) / 2;
    const midLat = (tLat + pLat) / 2;

    const badgeLabel = intercept.isDispatched
      ? `RESPONDING  ${intercept.patrolId} → ${intercept.targetId}
${intercept.distanceKm.toFixed(1)} km • ETA ${intercept.etaMinutes} min`
      : `NEAREST  ${intercept.patrolId}
${intercept.distanceKm.toFixed(1)} km • ETA ${intercept.etaMinutes} min`;

    const features: GeoJSON.Feature[] = [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [pLon, pLat],
            [tLon, tLat],
          ],
        },
        properties: {
          targetId: intercept.targetId,
          patrolId: intercept.patrolId,
          distanceKm: intercept.distanceKm,
          etaMinutes: intercept.etaMinutes,
          isDispatched: intercept.isDispatched,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [midLon, midLat],
        },
        properties: {
          label: badgeLabel,
          isDispatched: intercept.isDispatched,
        },
      },
    ];

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }

  /**
   * Highlights the operator-selected patrol craft with a selection ring.
   */
  public setSelectedPatrol(patrolId: string | null): void {
    this.selectedPatrolId = patrolId;
    if (!this.map || !this.map.getLayer('patrol-units-selection')) return;
    this.map.setFilter('patrol-units-selection', ['==', ['get', 'id'], patrolId ?? '']);
  }

  /**
   * Updates patrol units data dynamically
   */
  public updatePatrolUnits(patrols: PatrolUnit[]): void {
    this.patrolUnits = patrols;
    if (!this.map) return;

    const source = this.map.getSource('patrol-units-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(patrolUnitsToGeoJSON(patrols));
    } else if (this.map.isStyleLoaded()) {
      this.init();
    }
  }

  /**
   * Toggles visibility of all patrol unit layers and intercept lines
   */
  public setVisibility(visible: boolean): void {
    if (!this.map || !this.map.isStyleLoaded()) return;
    const val = visible ? 'visible' : 'none';

    [
      'patrol-units-layer',
      'patrol-units-ring',
      'patrol-units-strobe',
      'patrol-units-selection',
      'patrol-intercept-glow',
      'patrol-intercept-line',
      'patrol-intercept-label',
    ].forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', val);
      }
    });
  }

  /**
   * Stops the tactical animation loop and detaches the hover popup.
   * Must be called when the owning map is torn down, otherwise the rAF loop
   * keeps running against a removed map.
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.stopAnimation();
    this.hoverPopup.remove();
    this.isInitialized = false;
  }
}
