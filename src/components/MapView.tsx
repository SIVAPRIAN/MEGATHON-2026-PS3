import React, { useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Vessel } from '../data/vessels';
import { MOCK_CAMERAS } from '../data/mockCameras';
import { EOCamera, RestrictedArea } from '../types/maritime';
import { VesselLayerController } from '../map/VesselLayer';
import { MaritimeBoundaryLayerController } from '../map/MaritimeBoundaryLayer';
import { CameraLayerController } from '../map/CameraLayer';
import { RestrictedAreaLayerController } from '../map/RestrictedAreaLayer';
import { MapLayersState } from './LayerControlPopover';

interface MapViewProps {
  vessels: Vessel[];
  selectedVesselId: string | null;
  selectedCamera: EOCamera | null;
  onSelectVessel: (vessel: Vessel | null) => void;
  onSelectCamera: (camera: EOCamera | null) => void;
  onCursorMove: (pos: { lat: number; lon: number }) => void;
  onZoomChange: (zoom: number) => void;
  mapInstanceRef: React.MutableRefObject<maplibregl.Map | null>;
  layers: MapLayersState;

  // Restricted Area Features
  restrictedAreas: RestrictedArea[];
  selectedRestrictedArea: RestrictedArea | null;
  onSelectRestrictedArea: (area: RestrictedArea | null) => void;
  isDrawingRestricted: boolean;
  pendingPolygonCoords?: [number, number][] | null;
  onDrawingComplete: (coords: [number, number][]) => void;
  onDrawingCancel: () => void;
  onFinishDrawingRef?: React.MutableRefObject<(() => void) | null>;
  drawPointCount?: number;
  onPointCountChange?: (count: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  vessels,
  selectedVesselId,
  selectedCamera,
  onSelectVessel,
  onSelectCamera,
  onCursorMove,
  onZoomChange,
  mapInstanceRef,
  layers,
  restrictedAreas,
  selectedRestrictedArea,
  onSelectRestrictedArea,
  isDrawingRestricted,
  pendingPolygonCoords,
  onDrawingComplete,
  onDrawingCancel,
  onFinishDrawingRef,
  onPointCountChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const vesselControllerRef = useRef<VesselLayerController | null>(null);
  const boundaryControllerRef = useRef<MaritimeBoundaryLayerController | null>(null);
  const cameraControllerRef = useRef<CameraLayerController | null>(null);
  const restrictedControllerRef = useRef<RestrictedAreaLayerController | null>(null);

  // Esri World Imagery (Terrain, bathymetry, coastlines)
  const getTileSources = useCallback(() => {
    return {
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 18,
    };
  }, []);

  // Refs to avoid stale closures in MapLibre event listeners
  const onSelectVesselRef = useRef(onSelectVessel);
  onSelectVesselRef.current = onSelectVessel;

  const onSelectCameraRef = useRef(onSelectCamera);
  onSelectCameraRef.current = onSelectCamera;

  const onSelectRestrictedAreaRef = useRef(onSelectRestrictedArea);
  onSelectRestrictedAreaRef.current = onSelectRestrictedArea;

  const onDrawingCompleteRef = useRef(onDrawingComplete);
  onDrawingCompleteRef.current = onDrawingComplete;

  const onDrawingCancelRef = useRef(onDrawingCancel);
  onDrawingCancelRef.current = onDrawingCancel;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;

    const baseSource = getTileSources();

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'base-raster': {
            type: 'raster',
            ...baseSource,
          },
        },
        layers: [
          {
            id: 'base-layer',
            type: 'raster',
            source: 'base-raster',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [78.9629, 12.0000], // Centered on Southern India & Indian Ocean
      zoom: 5.4,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('mousemove', (e: any) => {
      onCursorMove({ lat: e.lngLat.lat, lon: e.lngLat.lng });
      if (restrictedControllerRef.current && onPointCountChange) {
        onPointCountChange(restrictedControllerRef.current.getDrawPointCount());
      }
    });

    map.on('zoom', () => {
      onZoomChange(map.getZoom());
    });

    // Map click: cooperative deselect
    map.on('click', (e) => {
      if (restrictedControllerRef.current?.getIsDrawing()) return;
      const cameraFeatures = map.queryRenderedFeatures(e.point, { layers: ['camera-stations-layer'] });
      const vesselFeatures = map.queryRenderedFeatures(e.point, { layers: ['vessels-layer'] });
      const areaFeatures = map.queryRenderedFeatures(e.point, { layers: ['restricted-areas-fill'] });

      if (cameraFeatures.length === 0 && vesselFeatures.length === 0 && areaFeatures.length === 0) {
        if (onSelectVesselRef.current) onSelectVesselRef.current(null);
        if (onSelectCameraRef.current) onSelectCameraRef.current(null);
        if (onSelectRestrictedAreaRef.current) onSelectRestrictedAreaRef.current(null);
      }
    });

    map.on('load', async () => {
      // 1. Initialize Maritime Boundaries (Global EEZ WMS, India EEZ Vector, 12 NM Territorial Sea)
      try {
        const boundaryController = new MaritimeBoundaryLayerController({ map });
        boundaryController.init();
        boundaryControllerRef.current = boundaryController;
      } catch (err) {
        console.error('Error initializing maritime boundaries:', err);
      }

      // 2. Initialize Coastal EO Cameras & FOVs (only selected camera shows FOV)
      try {
        const cameraController = new CameraLayerController({
          map,
          cameras: MOCK_CAMERAS,
          onSelectCamera: (cam) => {
            if (onSelectCameraRef.current) onSelectCameraRef.current(cam);
          },
        });
        await cameraController.init();
        cameraController.setSelectedCamera(selectedCamera);
        cameraControllerRef.current = cameraController;
      } catch (err) {
        console.error('Error initializing camera layer:', err);
      }

      // 3. Initialize Map-Native Vessel Tracking Layer (8–18px symbols, clusters, tracks)
      try {
        const vesselController = new VesselLayerController({
          map,
          vessels,
          onSelectVessel: (vsl) => {
            if (onSelectVesselRef.current) onSelectVesselRef.current(vsl);
          },
        });
        await vesselController.init();
        vesselController.setSelectedVessel(selectedVesselId);
        vesselControllerRef.current = vesselController;
      } catch (err) {
        console.error('Error initializing vessel layer:', err);
      }

      // 4. Initialize Restricted Areas Layer (GeoJSON polygon, free-draw tool)
      try {
        const restrictedController = new RestrictedAreaLayerController({
          map,
          restrictedAreas,
          onSelectArea: (area) => {
            if (onSelectRestrictedAreaRef.current) onSelectRestrictedAreaRef.current(area);
          },
          onDrawingComplete: (coords) => {
            if (onDrawingCompleteRef.current) onDrawingCompleteRef.current(coords);
          },
          onDrawingCancel: () => {
            if (onDrawingCancelRef.current) onDrawingCancelRef.current();
          },
        });
        restrictedController.init();
        restrictedControllerRef.current = restrictedController;

        if (onFinishDrawingRef) {
          onFinishDrawingRef.current = () => {
            restrictedController.finishDrawing();
          };
        }
      } catch (err) {
        console.error('Error initializing restricted areas layer:', err);
      }

      // Apply initial layer toggles
      if (boundaryControllerRef.current) {
        boundaryControllerRef.current.setEezVisible(layers.eez);
        boundaryControllerRef.current.setTerritorialSeaVisible(layers.territorialSea);
        boundaryControllerRef.current.setContiguousZoneVisible(layers.contiguousZone);
      }
      if (cameraControllerRef.current) {
        cameraControllerRef.current.setVisibility(layers.cameras);
      }
      if (vesselControllerRef.current) {
        vesselControllerRef.current.setVisibility(layers.vessels);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      vesselControllerRef.current = null;
      boundaryControllerRef.current = null;
      cameraControllerRef.current = null;
      restrictedControllerRef.current = null;
    };
  }, []);

  // Update vessels when dataset changes
  useEffect(() => {
    if (vesselControllerRef.current) {
      vesselControllerRef.current.updateVessels(vessels);
    }
  }, [vessels]);

  // Update selected vessel
  useEffect(() => {
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setSelectedVessel(selectedVesselId);
    }
  }, [selectedVesselId]);

  // Update selected camera
  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setSelectedCamera(selectedCamera);
    }
  }, [selectedCamera]);

  // Update restricted areas
  useEffect(() => {
    if (restrictedControllerRef.current) {
      restrictedControllerRef.current.updateAreas(restrictedAreas);
    }
  }, [restrictedAreas]);

  // Toggle drawing mode
  useEffect(() => {
    if (restrictedControllerRef.current) {
      if (isDrawingRestricted) {
        restrictedControllerRef.current.startDrawing();
      } else {
        restrictedControllerRef.current.stopDrawing();
      }
    }
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setIsDrawing(isDrawingRestricted);
    }
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setIsDrawing(isDrawingRestricted);
    }
  }, [isDrawingRestricted]);

  // Clear draw preview when pending coordinates are cleared (after save or cancel)
  useEffect(() => {
    if (restrictedControllerRef.current && !pendingPolygonCoords) {
      restrictedControllerRef.current.clearDrawPreview();
    }
  }, [pendingPolygonCoords]);

  // Sync layer toggles dynamically
  useEffect(() => {
    if (boundaryControllerRef.current) {
      boundaryControllerRef.current.setEezVisible(layers.eez);
      boundaryControllerRef.current.setTerritorialSeaVisible(layers.territorialSea);
      boundaryControllerRef.current.setContiguousZoneVisible(layers.contiguousZone);
    }
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setVisibility(layers.cameras);
    }
    if (vesselControllerRef.current) {
      vesselControllerRef.current.setVisibility(layers.vessels);
    }
  }, [layers]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
