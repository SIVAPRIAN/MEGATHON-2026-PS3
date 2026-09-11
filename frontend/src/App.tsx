import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Vessel, INITIAL_VESSELS, logStartupVesselValidationReport } from './data/vessels';
import {
  EOCamera,
  RestrictedArea,
  RestrictedAreaEvent,
  MaritimeAlert,
  AuditLogEntry,
  ZoneType,
  DispositionReasonCode,
  AlertState,
  ActiveOverlay,
  AppNotification,
  PatrolUnit,
  IncidentReport,
} from './types/maritime';
import { INITIAL_RESTRICTED_AREAS } from './data/mockRestrictedAreas';
import { evaluateVesselGeofence, detectGeofenceTransitions } from './utils/geofenceEngine';
import { INITIAL_PATROL_UNITS } from './data/patrolUnits';
import { findNearestPatrol, calculateHaversineDistanceKm, calculateInterceptETA } from './utils/patrolUtils';
import { checkCameraCoverage } from './utils/geoUtils';
import { MOCK_CAMERAS } from './data/mockCameras';
import { generateIncidentReport } from './utils/reportGenerator';

// UI Components
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { LeftToolbar, ActiveSidebarPanel } from './components/LeftToolbar';
import { CoordinateBar } from './components/CoordinateBar';
import { VesselDetailCard } from './components/VesselDetailCard';
import { CameraPopupCard } from './components/CameraPopupCard';
import { CameraFeedModal } from './components/CameraFeedModal';
import { LayerControlPopover, MapLayersState } from './components/LayerControlPopover';
import { SensorPanel } from './components/SensorPanel';
import { DrawingPrompt } from './components/DrawingPrompt';
import { SaveAreaModal } from './components/SaveAreaModal';
import { RestrictedAreaPopupCard } from './components/RestrictedAreaPopupCard';
import { NotificationContainer } from './components/NotificationContainer';
import { AlertDetailDrawer } from './components/AlertDetailDrawer';
import { ZoneManagerPanel } from './components/ZoneManagerPanel';
import { AlertCenter } from './components/AlertCenter';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { DemoScenariosModal } from './components/DemoScenariosModal';
import { AIVesselDetectionModal, DetectedVessel } from './components/AIVesselDetectionModal';
import { IncidentReportModal } from './components/IncidentReportModal';

import { X } from 'lucide-react';

export const App: React.FC = () => {
  // Master vessels dataset (strictly validated in water)
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);

  // Active selected vessel (defaults to null: clean map on load)
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);

  // Active selected coastal EO camera
  const [selectedCamera, setSelectedCamera] = useState<EOCamera | null>(null);

  // Active camera EO observation feed modal
  const [activeFeedCamera, setActiveFeedCamera] = useState<EOCamera | null>(null);

  // Restricted Areas State (Red, Yellow, Green Zones)
  const [restrictedAreas, setRestrictedAreas] = useState<RestrictedArea[]>(INITIAL_RESTRICTED_AREAS);
  const [selectedRestrictedArea, setSelectedRestrictedArea] = useState<RestrictedArea | null>(null);

  // Centralized Active Floating Overlay System (Requirements 1, 3, 9, 14, 17)
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);
  const [selectedAlert, setSelectedAlert] = useState<MaritimeAlert | null>(null);

  // Queued Temporary Notifications (Requirements 5, 11, 12, 13)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Real YOLO11n AI Vessel Detector State
  const [isAIDetectorOpen, setIsAIDetectorOpen] = useState(false);
  const [aiDetectorCamera, setAiDetectorCamera] = useState<EOCamera | null>(null);

  // Maritime Incident Dossier & Reporting Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<IncidentReport | null>(null);

  // Active Scenario Execution Banner
  const [activeScenarioBanner, setActiveScenarioBanner] = useState<{
    scenarioNum: number;
    title: string;
    stepDescription: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
  } | null>(null);

  // Single Active Sidebar Panel State (Requirement 2 & 7)
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<ActiveSidebarPanel>(null);

  // Free-Draw mode state
  const [isDrawingRestricted, setIsDrawingRestricted] = useState(false);
  const [drawPointCount, setDrawPointCount] = useState(0);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [pendingPolygonCoords, setPendingPolygonCoords] = useState<[number, number][] | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const onFinishDrawingRef = useRef<(() => void) | null>(null);

  // Live Optical Camera Coverage Evaluation during drawing & saving
  const drawingCoverageReport = useMemo(() => {
    return checkCameraCoverage(drawPoints, MOCK_CAMERAS);
  }, [drawPoints]);

  const pendingCoverageReport = useMemo(() => {
    return checkCameraCoverage(pendingPolygonCoords || [], MOCK_CAMERAS);
  }, [pendingPolygonCoords]);

  // Events & Notifications
  const [events, setEvents] = useState<RestrictedAreaEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RestrictedAreaEvent | null>(null);
  const previousGeofenceMapRef = useRef<Map<string, { isInside: boolean; areaIds: string[] }>>(new Map());

  // Operational Alert Engine State (Pre-populated with rich Maritime Demo Alerts)
  const [alerts, setAlerts] = useState<MaritimeAlert[]>([
    {
      alertId: 'ALT-101',
      timestamp: '05:12:18 UTC',
      targetId: 'DV-104',
      targetName: 'UNIDENTIFIED CONTACT 104',
      status: 'DARK_VESSEL',
      priority: 'CRITICAL',
      suggestedAction: 'VERIFY',
      evidence: {
        source: 'EO Optical Fix (CAM-04 / PSS Madras)',
        confidence: 94,
        details: 'Optical sighting without matching AIS transponder fix within 5 NM',
      },
      currentState: 'ACTIVE',
    },
    {
      alertId: 'ALT-102',
      timestamp: '05:10:45 UTC',
      targetId: 'DV-112',
      targetName: 'UNIDENTIFIED CONTACT 112',
      status: 'UNREGISTERED',
      priority: 'HIGH',
      suggestedAction: 'INVESTIGATE',
      evidence: {
        source: 'Optical Sighting / Visual Detection',
        confidence: 88,
        details: 'Operating in inshore corridor without registration prefix',
      },
      currentState: 'ACTIVE',
    },
    {
      alertId: 'ALT-103',
      timestamp: '05:08:30 UTC',
      targetId: 'VSL-011',
      targetName: 'CHENNAI TRADER',
      status: 'RESTRICTED AREA ENTRY',
      priority: 'HIGH',
      suggestedAction: 'INVESTIGATE',
      evidence: {
        source: 'Turf.js Geofence Engine',
        zoneName: 'RESTRICTED AREA 01',
        details: 'Vessel entered active security exclusion polygon',
      },
      currentState: 'ACTIVE',
    },
    {
      alertId: 'ALT-104',
      timestamp: '05:05:12 UTC',
      targetId: 'VSL-003',
      targetName: 'MAERSK DHARWAD',
      status: 'OUT_OF_ENVELOPE',
      priority: 'MEDIUM',
      suggestedAction: 'MONITOR',
      evidence: {
        source: 'AIS ↔ Optical Correlation',
        confidence: 94,
        details: 'Fused: CAM-04 optical sighting matched with MMSI 503891240 (< 240m delta)',
      },
      currentState: 'ACTIVE',
    },
    {
      alertId: 'ALT-105',
      timestamp: '05:01:00 UTC',
      targetId: 'VSL-015',
      targetName: 'PULICAT NAVIGATOR',
      status: 'LOST_LINK',
      priority: 'LOW',
      suggestedAction: 'INVESTIGATE',
      evidence: {
        source: 'Inshore Patrol Watch',
        confidence: 85,
        details: 'Irregular loitering observed outside Pulicat bar mouth',
      },
      currentState: 'ACTIVE',
    },
  ]);

  // Append-Only Immutable Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      eventId: 'EVT-001',
      timestamp: '2026-09-08 05:00:00 GMT',
      operatorId: 'SYSTEM',
      eventType: 'ZONE_CREATED',
      targetId: 'RA-001',
      action: 'Initialized default exclusion zone RESTRICTED AREA 01',
      reason: 'SYSTEM_BOOT',
      metadata: { zoneType: 'RED', coordinatesCount: 4 },
    },
    {
      eventId: 'EVT-002',
      timestamp: '2026-09-08 05:10:00 GMT',
      operatorId: 'SYSTEM',
      eventType: 'ZONE_CREATED',
      targetId: 'ZONE-02',
      action: 'Initialized temporary cautionary anchorage ZONE-02',
      reason: 'SYSTEM_BOOT',
      metadata: { zoneType: 'YELLOW', expiresInMinutes: 10 },
    },
    {
      eventId: 'EVT-003',
      timestamp: '2026-09-08 05:12:18 GMT',
      operatorId: 'CAM-04',
      eventType: 'ALERT_CREATED',
      targetId: 'DV-104',
      action: 'Optical detection unconfirmed by AIS transponder',
      reason: 'DARK_VESSEL_DETECTED',
      metadata: { confidence: 94, sensor: 'PSS Madras (CAM-04)' },
    },
  ]);

  const addAuditLog = (entry: Omit<AuditLogEntry, 'eventId' | 'timestamp' | 'operatorId'>) => {
    const newEntry: AuditLogEntry = {
      eventId: `EVT-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      operatorId: 'OPERATOR-01',
      ...entry,
    };
    setAuditLogs((prev) => [...prev, newEntry]);
  };

  // Demo Traffic Movement Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationStepRef = useRef(0);

  // Maritime Layer Toggles (EEZ, 12 NM TERRITORIAL SEA, VESSELS, EO CAMERAS, PATROL CRAFT)
  const [layers, setLayers] = useState<MapLayersState>({
    eez: true,
    territorialSea: true,
    vessels: true,
    cameras: true,
    patrolUnits: true,
    contiguousZone: false,
  });

  // Coastal Patrol Fleet State (10 realistic ICG / Marine Police Units)
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>(INITIAL_PATROL_UNITS);
  const [selectedPatrolId, setSelectedPatrolId] = useState<string | null>(null);

  // Legend visibility
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Live coordinate HUD
  const [cursorPos, setCursorPos] = useState({ lat: 8.5188, lon: 80.951 });
  const [currentZoom, setCurrentZoom] = useState(5.4);

  // Reference to MapLibre instance
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // Startup Vessel & Camera Validation Report
  useEffect(() => {
    logStartupVesselValidationReport(vessels);
  }, []);

  // Evaluate Geofence Status for all vessels dynamically
  const evaluatedVessels = useMemo(() => {
    return vessels.map((v) => {
      const evaluation = evaluateVesselGeofence(v, restrictedAreas);
      return {
        ...v,
        geofenceStatus: evaluation.geofenceStatus,
        displayStatus: evaluation.displayStatus,
        restrictedAreaIds: evaluation.matchingAreas.map((a) => a.id),
        restrictedAreaNames: evaluation.matchingAreas.map((a) => a.name),
        authorizationStatus: evaluation.authorizationStatus,
        organisation: evaluation.organisation,
        altitude: evaluation.altitudeMeters,
        isOutOfEnvelope: evaluation.isOutOfEnvelope,
      };
    });
  }, [vessels, restrictedAreas]);

  // Transition Detection: Generates RESTRICTED AREA ENTRY & EXIT alerts and audit entries
  useEffect(() => {
    const { updatedGeofenceMap, newEvents } = detectGeofenceTransitions(
      evaluatedVessels,
      previousGeofenceMapRef.current,
      restrictedAreas
    );
    previousGeofenceMapRef.current = updatedGeofenceMap;

    if (newEvents.length > 0) {
      setEvents((prev) => [...prev, ...newEvents]);
      setLatestEvent(newEvents[newEvents.length - 1]);

      newEvents.forEach((evt) => {
        if (evt.type === 'ENTRY') {
          const alertId = `ALT-${Date.now().toString(36).toUpperCase().slice(-5)}`;
          const newAlert: MaritimeAlert = {
            alertId,
            timestamp: evt.timestamp,
            targetId: evt.vesselId,
            targetName: evt.vesselName,
            status: 'RESTRICTED AREA ENTRY',
            priority: 'HIGH',
            suggestedAction: 'INVESTIGATE',
            evidence: {
              source: 'Turf.js Geofence Engine',
              zoneName: evt.areaName,
              details: `Contact crossed perimeter into ${evt.areaName}`,
            },
            currentState: 'ACTIVE',
          };
          setAlerts((prev) => [newAlert, ...prev]);

          // Centralized notification queue item (Requirements 5, 11)
          const newNotif: AppNotification = {
            id: `NOTIF-${Date.now()}-${evt.vesselId}`,
            type: 'RESTRICTED_ENTRY',
            title: 'RESTRICTED AREA ENTRY',
            targetId: evt.vesselId,
            targetName: evt.vesselName,
            zoneName: evt.areaName,
            timestamp: evt.timestamp,
            vesselId: evt.vesselId,
            alertId,
            severity: 'HIGH',
            createdAt: Date.now(),
          };
          setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);

          addAuditLog({
            eventType: 'VESSEL_ENTERED_ZONE',
            targetId: evt.vesselId,
            action: `Ingress into ${evt.areaName}`,
            reason: 'GEOFENCE_INTRUSION',
            metadata: { areaId: evt.areaId, areaName: evt.areaName },
          });
        } else if (evt.type === 'EXIT') {
          addAuditLog({
            eventType: 'VESSEL_EXITED_ZONE',
            targetId: evt.vesselId,
            action: `Egress from ${evt.areaName}`,
            reason: 'GEOFENCE_CLEAR',
            metadata: { areaId: evt.areaId, areaName: evt.areaName },
          });
        }
      });
    }
  }, [evaluatedVessels, restrictedAreas]);

  // ---------------------------------------------------------------------------
  // AUTOMATIC EXPIRY ENGINE (Requirement 5 & 16)
  // Runs every 1 second, checks zones, automatically expires and cleans up without refresh
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRestrictedAreas((prevAreas) => {
        let changed = false;
        const updated = prevAreas.map((area) => {
          if (area.status === 'ACTIVE' && area.expiresAt) {
            const expTime = new Date(area.expiresAt).getTime();
            if (!isNaN(expTime) && expTime <= now) {
              changed = true;
              addAuditLog({
                eventType: 'ZONE_EXPIRED',
                targetId: area.id,
                action: `Zone expired automatically: ${area.name}`,
                reason: 'AUTOMATIC_EXPIRY',
                metadata: { expiredAt: area.expiresAt, zoneType: area.zoneType },
              });
              return { ...area, status: 'EXPIRED' as const };
            }
          }
          return area;
        });
        return changed ? updated : prevAreas;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Demo Traffic Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setVessels((prevVessels) => {
        return prevVessels.map((v) => {
          if (v.id === 'VSL-011') {
            simulationStepRef.current = (simulationStepRef.current + 1) % 40;
            // Transit path from lon 80.340 (outside) -> 80.370 (inside) -> 80.410 (outside)
            const step = simulationStepRef.current;
            const startLon = 80.340;
            const targetLon = startLon + step * 0.002;
            return {
              ...v,
              lon: Number(targetLon.toFixed(5)),
            };
          }
          return v;
        });
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Drawing Handlers
  const handleToggleDrawRestricted = () => {
    if (isDrawingRestricted) {
      setIsDrawingRestricted(false);
      setDrawPointCount(0);
    } else {
      setIsDrawingRestricted(true);
      setDrawPointCount(0);
      setSelectedRestrictedArea(null);
    }
  };

  const handleDrawingComplete = (coords: [number, number][]) => {
    setPendingPolygonCoords(coords);
    setIsDrawingRestricted(false);
    setIsSaveModalOpen(true);
    setDrawPointCount(0);
  };

  const handleDrawingCancel = () => {
    setIsDrawingRestricted(false);
    setPendingPolygonCoords(null);
    setIsSaveModalOpen(false);
    setDrawPointCount(0);
  };

  // ---------------------------------------------------------------------------
  // SAVE ZONE (Requirement 2: Pure application state object with unique ID)
  // ---------------------------------------------------------------------------
  const handleSaveArea = (
    name: string,
    zoneType: ZoneType,
    expiresInMinutes?: number,
    startTime?: string,
    expiresAt?: string
  ) => {
    if (!pendingPolygonCoords) return;

    const newId = `ZONE-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const nowTime = new Date().toISOString().replace('T', ' ').slice(11, 16) + ' UTC';
    const finalExpiresAt =
      expiresAt ||
      (expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString() : undefined);
    const finalStartTime = startTime || new Date().toISOString();

    const newArea: RestrictedArea = {
      id: newId,
      name,
      zoneType,
      status: 'ACTIVE',
      createdAt: nowTime,
      startTime: finalStartTime,
      expiresAt: finalExpiresAt,
      expiresInMinutes,
      timeRange: finalExpiresAt ? { start: finalStartTime, end: finalExpiresAt } : undefined,
      createdBy: 'OPERATOR-01',
      geometry: {
        type: 'Polygon',
        coordinates: [pendingPolygonCoords],
      },
    };

    const savedCoords = [...pendingPolygonCoords];
    setRestrictedAreas((prev) => [...prev, newArea]);
    setIsSaveModalOpen(false);
    setPendingPolygonCoords(null);
    setDrawPoints([]);

    // Check optical camera coverage for the newly established restricted zone
    const coverage = checkCameraCoverage(savedCoords, MOCK_CAMERAS);

    // If the restricted zone has NO camera access, generate an operational blind spot alert!
    if (!coverage.hasCoverage) {
      const blindAlertId = `ALT-BLIND-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const blindAlert: MaritimeAlert = {
        alertId: blindAlertId,
        timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
        targetId: newId,
        targetName: `${name.toUpperCase()} (NO CAMERA ACCESS)`,
        status: 'SENSOR_BLIND_SPOT',
        priority: 'HIGH',
        suggestedAction: 'INVESTIGATE',
        evidence: {
          source: 'Optical Sensor Envelope Audit',
          confidence: 99,
          zoneName: name,
          details: `Zone established in optical blind spot (${coverage.nearestDistanceKm} km from nearest PSS station). Optical camera access is unavailable to detect dark vessels. Task mobile patrol unit to establish radar/visual coverage.`,
        },
        currentState: 'ACTIVE',
      };

      setAlerts((prev) => [blindAlert, ...prev]);

      // Add high priority notification toast
      const newNotif: AppNotification = {
        id: `NOTIF-BLIND-${Date.now()}`,
        type: 'BLIND_SPOT',
        title: 'SENSOR BLIND SPOT ZONE CREATED',
        targetId: newId,
        targetName: `${name} — 0% Camera Coverage`,
        zoneName: name,
        timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
        alertId: blindAlertId,
        severity: 'HIGH',
        createdAt: Date.now(),
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);

      // Immutable audit record of the sensor blind spot, separate from the zone-creation record.
      addAuditLog({
        eventType: 'BLIND_SPOT_ZONE_CREATED',
        targetId: newId,
        action: `Restricted zone "${name}" established in optical sensor blind spot — 0% EO camera coverage (nearest shore station ${coverage.nearestDistanceKm} km away)`,
        reason: 'NO_OPTICAL_COVERAGE',
        metadata: {
          zoneName: name,
          zoneType,
          alertId: blindAlertId,
          hasCameraCoverage: false,
          nearestSensorDistanceKm: coverage.nearestDistanceKm,
          nearestSensorId: coverage.nearestCamera?.id ?? null,
          coordinates: savedCoords,
        },
      });
    }

    addAuditLog({
      eventType: 'ZONE_CREATED',
      targetId: newId,
      action: `Created ${zoneType} zone: ${name} (Camera Access: ${coverage.hasCoverage ? 'COVERED' : 'BLIND SPOT'})`,
      reason: 'OPERATOR_CREATION',
      metadata: {
        name,
        zoneType,
        expiresInMinutes,
        startTime: finalStartTime,
        expiresAt: finalExpiresAt,
        hasCameraCoverage: coverage.hasCoverage,
        nearestSensorDistanceKm: coverage.nearestDistanceKm,
      },
    });
  };

  const handleToggleAreaStatus = (areaId: string) => {
    let toggledArea: RestrictedArea | undefined;
    setRestrictedAreas((prev) =>
      prev.map((a) => {
        if (a.id === areaId) {
          const nextStatus = a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          toggledArea = { ...a, status: nextStatus };
          return toggledArea;
        }
        return a;
      })
    );

    if (selectedRestrictedArea?.id === areaId && toggledArea) {
      setSelectedRestrictedArea(toggledArea);
    }

    if (toggledArea) {
      addAuditLog({
        eventType: 'ZONE_UPDATED',
        targetId: areaId,
        action: `Toggled status to ${toggledArea.status}`,
        reason: 'OPERATOR_TOGGLE',
        metadata: { status: toggledArea.status },
      });
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE ZONE (Requirement 2 & 16)
  // ---------------------------------------------------------------------------
  const handleDeleteArea = (areaId: string) => {
    const areaToDelete = restrictedAreas.find((a) => a.id === areaId);

    // 1. Remove from state immediately
    setRestrictedAreas((prev) => prev.filter((a) => a.id !== areaId));

    if (selectedRestrictedArea?.id === areaId) {
      setSelectedRestrictedArea(null);
    }

    // 2. Clear alerts related to this zone
    if (areaToDelete) {
      setAlerts((prev) => prev.filter((a) => a.evidence.zoneName !== areaToDelete.name));
    }

    // 3. Append to immutable audit log (never deleted)
    addAuditLog({
      eventType: 'ZONE_DELETED',
      targetId: areaId,
      action: `Deleted zone ${areaToDelete?.name || areaId}`,
      reason: 'OPERATOR_DELETION',
      metadata: { areaName: areaToDelete?.name, zoneType: areaToDelete?.zoneType },
    });
  };

  const handleEditArea = (areaId: string, newName: string, newType: ZoneType, expiresInMin?: number) => {
    const expiresAt = expiresInMin ? new Date(Date.now() + expiresInMin * 60 * 1000).toISOString() : undefined;
    setRestrictedAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, name: newName, zoneType: newType, expiresAt, expiresInMinutes: expiresInMin }
          : a
      )
    );

    addAuditLog({
      eventType: 'ZONE_UPDATED',
      targetId: areaId,
      action: `Updated zone properties: ${newName}`,
      reason: 'OPERATOR_EDIT',
      metadata: { newName, newType, expiresInMin },
    });
  };

  const handleUpdateTimeRange = (
    areaId: string,
    startTime?: string,
    expiresAt?: string,
    expiresInMinutes?: number
  ) => {
    let updatedArea: RestrictedArea | undefined;
    setRestrictedAreas((prev) =>
      prev.map((a) => {
        if (a.id === areaId) {
          const sTime = startTime || a.startTime || new Date().toISOString();
          updatedArea = {
            ...a,
            startTime: sTime,
            expiresAt,
            expiresInMinutes,
            timeRange: sTime && expiresAt ? { start: sTime, end: expiresAt } : undefined,
            status: 'ACTIVE' as const, // re-activate when time window is extended
          };
          return updatedArea;
        }
        return a;
      })
    );

    if (selectedRestrictedArea?.id === areaId && updatedArea) {
      setSelectedRestrictedArea(updatedArea);
    }

    addAuditLog({
      eventType: 'ZONE_UPDATED',
      targetId: areaId,
      action: `Configured operational time range: ${startTime ? new Date(startTime).toISOString().slice(11, 19) : 'Immediate'} UTC to ${expiresAt ? new Date(expiresAt).toISOString().slice(11, 19) + ' UTC' : 'Permanent'}`,
      reason: 'OPERATOR_TIME_RANGE_CONFIG',
      metadata: { areaId, startTime, expiresAt, expiresInMinutes },
    });
  };

  const handleLoadGeoJSONZones = (newZones: RestrictedArea[]) => {
    setRestrictedAreas((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const filtered = newZones.filter((z) => !existingIds.has(z.id));
      return [...filtered, ...prev];
    });

    newZones.forEach((z) => {
      addAuditLog({
        eventType: 'ZONE_CREATED',
        targetId: z.id,
        action: `Loaded GeoJSON ${z.zoneType} zone: ${z.name}`,
        reason: 'GEOJSON_SERVICE_INGEST',
        metadata: { name: z.name, zoneType: z.zoneType, status: z.status },
      });
    });
  };

  // ---------------------------------------------------------------------------
  // DYNAMIC RE-CORRELATION: DARK -> CORRELATED (Scenario 3)
  // ---------------------------------------------------------------------------
  const handleSimulateAisMatch = (vesselId: string) => {
    setVessels((prev) =>
      prev.map((v) => {
        if (v.id === vesselId) {
          return {
            ...v,
            status: 'CORRELATED',
            mmsi: v.mmsi || '419008921',
            name: v.name.includes('UNIDENTIFIED') ? 'SURVEILLANCE CONTACT (CORRELATED)' : `${v.name} (AIS MATCHED)`,
            confidence: 96,
            detectionSource: 'Fused: Optical EO Fix + AIS Telemetry Stream',
          };
        }
        return v;
      })
    );

    addAuditLog({
      eventType: 'CORRELATION_UPDATED',
      targetId: vesselId,
      action: `Dark contact dynamically correlated with live AIS transponder message`,
      reason: 'AIS_BROADCAST_MATCH',
      metadata: { spatialTolerance: '< 500m', correlationConfidence: '96%' },
    });
  };

  // ---------------------------------------------------------------------------
  // REAL YOLO11n AI VESSEL DETECTOR MAP PROJECTION
  // ---------------------------------------------------------------------------
  const handlePlotAIVessel = (vsl: DetectedVessel) => {
    if (!vsl.latitude || !vsl.longitude) return;

    const newVessel: Vessel = {
      id: `DV-AI-${vsl.vessel_id.toString().padStart(2, '0')}`,
      name: `AI DETECTED (${vsl.vessel_type.replace(/_/g, ' ').toUpperCase()})`,
      vesselType: vsl.vessel_type.replace(/_/g, ' ').toUpperCase(),
      lat: vsl.latitude,
      lon: vsl.longitude,
      heading: vsl.geolocation?.bearing_deg || 90,
      speed: 12.0,
      status: 'DARK',
      length: 85,
      mmsi: 'NONE (OPTICAL DETECTION)',
      flag: 'UNKNOWN',
      detectedByCamera: vsl.geolocation?.calibrated_camera_id,
      confidence: Math.round(vsl.confidence * 100),
      detectionSource: 'YOLO11n SeaShips Fine-Tuned Model',
    };

    setVessels((prev) => {
      const exists = prev.some((v) => v.id === newVessel.id);
      return exists ? prev.map((v) => (v.id === newVessel.id ? newVessel : v)) : [newVessel, ...prev];
    });

    flyToLocation(vsl.latitude, vsl.longitude, 11);
    setSelectedVesselId(newVessel.id);
    setIsAIDetectorOpen(false);

    addAuditLog({
      eventType: 'OPTICAL_SIGHTING',
      targetId: newVessel.id,
      action: `YOLO11n Model Classified ${vsl.vessel_type.toUpperCase()} (${(vsl.confidence * 100).toFixed(1)}% conf)`,
      reason: 'OPTICAL_SIGHTING',
      metadata: {
        model: 'revenant_vessel_detector.pt',
        confidence: vsl.confidence,
        boundingBox: vsl.bounding_box,
        centerPixel: vsl.center_pixel,
        geolocation: vsl.geolocation,
      },
    });
  };

  // ---------------------------------------------------------------------------
  // ALERT DISPOSITION HANDLER (Requirement 10)
  // ---------------------------------------------------------------------------
  const handleDispositAlert = (
    alertId: string,
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
    reason: DispositionReasonCode,
    notes?: string
  ) => {
    const targetAlert = alerts.find((a) => a.alertId === alertId);
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.alertId === alertId) {
          const nextState: AlertState =
            action === 'CONFIRM' ? 'CONFIRMED' : action === 'DISMISS' ? 'DISMISSED' : 'ESCALATED';
          return {
            ...a,
            currentState: nextState,
            disposition: {
              operatorId: 'OPERATOR-01',
              timestamp: new Date().toISOString().replace('T', ' ').slice(11, 19) + ' UTC',
              action,
              reason,
              notes,
            },
          };
        }
        return a;
      })
    );

    const eventType =
      action === 'CONFIRM' ? 'ALERT_CONFIRMED' : action === 'DISMISS' ? 'ALERT_DISMISSED' : 'ALERT_ESCALATED';

    addAuditLog({
      eventType,
      targetId: targetAlert?.targetId || alertId,
      action: `${action} alert ${alertId} (${targetAlert?.status})`,
      reason,
      metadata: { alertId, notes },
    });
  };

  // ---------------------------------------------------------------------------
  // NEAREST PATROL DISPATCH & RECALL ACTIONS
  // ---------------------------------------------------------------------------
  const handleDispatchPatrol = (alertId: string, patrolId: string, targetIdOverride?: string) => {
    const targetAlert = alerts.find((a) => a.alertId === alertId);
    const resolvedTargetId = targetAlert?.targetId ?? targetIdOverride;

    setPatrolUnits((prev) =>
      prev.map((p) => {
        if (p.id === patrolId) {
          return {
            ...p,
            status: 'RESPONDING',
            assignedAlertId: targetAlert ? alertId : undefined,
            assignedTargetId: resolvedTargetId,
            dispatchTime: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    const patrol = patrolUnits.find((p) => p.id === patrolId);
    const unitName = patrol ? `${patrol.id} (${patrol.name})` : patrolId;
    const targetName =
      targetAlert?.targetName ||
      evaluatedVessels.find((v) => v.id === resolvedTargetId)?.name ||
      resolvedTargetId ||
      'Contact';

    addAuditLog({
      eventType: 'PATROL_DISPATCHED',
      targetId: patrolId,
      action: `Dispatched ${unitName} to intercept ${targetName}`,
      reason: 'OPERATIONAL_INTERCEPT',
      metadata: { alertId: targetAlert ? alertId : null, targetId: resolvedTargetId, patrolId },
    });

    const newNotif: AppNotification = {
      id: `NOTIF-PATROL-${Date.now()}`,
      type: 'PATROL_DISPATCH',
      title: 'PATROL INTERCEPT DISPATCHED',
      targetId: patrolId,
      targetName: `${unitName} ➔ ${targetName}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(11, 19) + ' UTC',
      severity: 'HIGH',
      createdAt: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);
  };

  const handleRecallPatrol = (patrolId: string) => {
    setPatrolUnits((prev) =>
      prev.map((p) => {
        if (p.id === patrolId) {
          return {
            ...p,
            status: 'AVAILABLE',
            assignedAlertId: undefined,
            assignedTargetId: undefined,
          };
        }
        return p;
      })
    );

    const patrol = patrolUnits.find((p) => p.id === patrolId);
    const unitName = patrol ? `${patrol.id} (${patrol.name})` : patrolId;

    addAuditLog({
      eventType: 'PATROL_RECALLED',
      targetId: patrolId,
      action: `Recalled ${unitName} to base station`,
      reason: 'STAND_DOWN',
      metadata: { patrolId },
    });
  };

  /**
   * Dispatch initiated from the Vessel Inspection Drawer, where the operator is looking at a
   * contact rather than an alert. Binds to the vessel's own ACTIVE alert when one exists so the
   * alert drawer and the vessel drawer stay in sync, otherwise tasks the unit to the raw contact.
   */
  const handleDispatchPatrolToVessel = (vesselId: string, patrolId: string) => {
    const vesselAlert = alerts.find((a) => a.targetId === vesselId && a.currentState === 'ACTIVE');
    handleDispatchPatrol(vesselAlert?.alertId ?? '', patrolId, vesselId);
  };

  /**
   * Generates and opens a complete Maritime Incident Dossier with PDF print, SITREP, and audit trail.
   */
  const handleOpenIncidentReport = (targetAlert?: MaritimeAlert | null, targetVessel?: Vessel | null) => {
    const alertObj = targetAlert || selectedAlert || alerts[0] || null;
    const vesselObj =
      targetVessel ||
      (alertObj ? evaluatedVessels.find((v) => v.id === alertObj.targetId) : null) ||
      selectedVessel ||
      evaluatedVessels[0] ||
      null;

    const assignedPatrol =
      patrolUnits.find(
        (p) =>
          p.assignedTargetId === (alertObj?.alertId || alertObj?.targetId || vesselObj?.id) ||
          p.status === 'RESPONDING'
      ) || null;

    const nearestCam = vesselObj
      ? MOCK_CAMERAS.find(
          (c) => calculateHaversineDistanceKm(vesselObj.lat, vesselObj.lon, c.lat, c.lon) < 50
        ) || MOCK_CAMERAS[0]
      : MOCK_CAMERAS[0];

    const report = generateIncidentReport({
      alert: alertObj,
      vessel: vesselObj,
      patrolUnits,
      auditLogs,
    });

    addAuditLog({
      eventType: 'REPORT_GENERATED',
      targetId: alertObj?.alertId || vesselObj?.id || 'INCIDENT',
      action: `Generated Maritime Incident Dossier ${report.reportId} for ${report.targetVessel.name}`,
      reason: 'INCIDENT_DOCUMENTATION',
      metadata: { reportId: report.reportId, securityClassification: report.classification },
    });

    setActiveReport(report);
    setIsReportModalOpen(true);
  };

  // Compute active tactical intercept line for MapView
  const activeIntercept = useMemo(() => {
    // 1. Responding patrol unit takes highest priority
    const respondingPatrol = patrolUnits.find(
      (p) => p.status === 'RESPONDING' && (p.assignedTargetId || p.assignedAlertId)
    );
    if (respondingPatrol) {
      const targetVessel = evaluatedVessels.find(
        (v) =>
          v.id === respondingPatrol.assignedTargetId ||
          (respondingPatrol.assignedAlertId &&
            alerts.find((a) => a.alertId === respondingPatrol.assignedAlertId)?.targetId === v.id)
      );
      if (targetVessel) {
        const pLat = respondingPatrol.lat ?? respondingPatrol.latitude ?? 0;
        const pLon = respondingPatrol.lon ?? respondingPatrol.longitude ?? 0;
        const distKm = calculateHaversineDistanceKm(
          targetVessel.lat,
          targetVessel.lon,
          pLat,
          pLon
        );
        const eta = calculateInterceptETA(distKm, respondingPatrol.speedKnots);
        return {
          patrolCoordinates: [pLon, pLat] as [number, number],
          targetCoordinates: [targetVessel.lon, targetVessel.lat] as [number, number],
          patrolId: respondingPatrol.id,
          targetId: targetVessel.id,
          targetName: targetVessel.name || targetVessel.id,
          distanceKm: distKm,
          etaMinutes: eta,
          isDispatched: true,
        };
      }
    }

    // 2. Active selected alert drawer
    if (activeOverlay === 'alert' && selectedAlert) {
      const targetVessel = evaluatedVessels.find(
        (v) => v.id === selectedAlert.targetId || v.name === selectedAlert.targetName
      );
      if (targetVessel) {
        const nearest = findNearestPatrol(targetVessel.lat, targetVessel.lon, patrolUnits);
        if (nearest) {
          const pLat = nearest.patrol.lat ?? nearest.patrol.latitude ?? 0;
          const pLon = nearest.patrol.lon ?? nearest.patrol.longitude ?? 0;
          return {
            patrolCoordinates: [pLon, pLat] as [number, number],
            targetCoordinates: [targetVessel.lon, targetVessel.lat] as [number, number],
            patrolId: nearest.patrol.id,
            targetId: targetVessel.id,
            targetName: targetVessel.name || targetVessel.id,
            distanceKm: nearest.distanceKm,
            etaMinutes: nearest.etaMinutes,
            isDispatched: false,
          };
        }
      }
    }

    // 3. Selected critical or dark vessel
    if (activeOverlay === 'vesselDetail' && selectedVesselId) {
      const targetVessel = evaluatedVessels.find((v) => v.id === selectedVesselId);
      if (
        targetVessel &&
        (targetVessel.status === 'DARK' ||
          targetVessel.geofenceStatus === 'INSIDE_RESTRICTED' ||
          targetVessel.displayStatus === 'RESTRICTED')
      ) {
        const nearest = findNearestPatrol(targetVessel.lat, targetVessel.lon, patrolUnits);
        if (nearest) {
          const pLat = nearest.patrol.lat ?? nearest.patrol.latitude ?? 0;
          const pLon = nearest.patrol.lon ?? nearest.patrol.longitude ?? 0;
          return {
            patrolCoordinates: [pLon, pLat] as [number, number],
            targetCoordinates: [targetVessel.lon, targetVessel.lat] as [number, number],
            patrolId: nearest.patrol.id,
            targetId: targetVessel.id,
            targetName: targetVessel.name || targetVessel.id,
            distanceKm: nearest.distanceKm,
            etaMinutes: nearest.etaMinutes,
            isDispatched: false,
          };
        }
      }
    }

    return null;
  }, [patrolUnits, evaluatedVessels, alerts, activeOverlay, selectedAlert, selectedVesselId]);

  // Helper to fly/center
  const flyToLocation = (lat: number, lon: number, zoom: number = 8) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [lon, lat],
        zoom,
        essential: true,
        duration: 1400,
      });
    }
  };

  const locateIndia = () => {
    flyToLocation(12.0, 78.96, 5.4);
  };

  // ---------------------------------------------------------------------------
  // NOTIFICATION SELECTION & DISMISSAL (Requirements 2, 6, 7, 11, 12, 13, 14)
  // ---------------------------------------------------------------------------
  const handleSelectNotification = (notif: AppNotification) => {
    // 1. Consume/remove clicked notification from temporary container
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setLatestEvent(null);

    // 2. Locate and select the target vessel
    const targetVslId = notif.vesselId || notif.targetId;
    const vsl = vessels.find((v) => v.id === targetVslId);
    if (vsl) {
      setSelectedVesselId(vsl.id);
      flyToLocation(vsl.lat, vsl.lon, 10.5);
    }

    // 3. Resolve the matching maritime alert
    const matchingAlert =
      alerts.find(
        (a) => (notif.alertId && a.alertId === notif.alertId) || a.targetId === targetVslId
      ) || {
        alertId: notif.alertId || `ALT-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        timestamp: notif.timestamp,
        targetId: targetVslId,
        targetName: notif.targetName,
        status: (notif.title as any) || 'RESTRICTED AREA ENTRY',
        priority: notif.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        suggestedAction: 'INVESTIGATE',
        evidence: {
          source: 'Turf.js Geofence Engine',
          zoneName: notif.zoneName || 'RESTRICTED AREA 01',
          details: `Contact crossed perimeter into ${notif.zoneName || 'RESTRICTED AREA 01'}`,
        },
        currentState: 'ACTIVE',
      };

    setSelectedAlert(matchingAlert);
    setSelectedCamera(null);
    setSelectedRestrictedArea(null);

    // 4. Panel Replacement Rule: Close any open header dropdown or other floating panel and open Alert Detail Drawer
    setActiveOverlay('alert');
  };

  const handleDismissNotification = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setLatestEvent(null);
  };

  // ---------------------------------------------------------------------------
  // DEMO SCENARIOS RUNNER (Scenarios 1–7)
  // Complete deterministic multi-step executions matching competition specifications
  // ---------------------------------------------------------------------------
  const handleRunScenario = (scenarioNum: number) => {
    switch (scenarioNum) {
      case 1: {
        // SCENARIO 1: EO Sensor Detection + AIS Match -> CORRELATED
        flyToLocation(13.1147, 80.3804, 11);
        setSelectedVesselId('VSL-003');
        setActiveScenarioBanner({
          scenarioNum: 1,
          title: 'Scenario 1: EO Detection + AIS Match',
          stepDescription: 'Optical contact sighted by CAM-04 (PSS Madras). Querying AIS transponders within 1500m...',
          status: 'IN_PROGRESS',
        });

        setTimeout(() => {
          setVessels((prev) =>
            prev.map((v) =>
              v.id === 'VSL-003'
                ? {
                    ...v,
                    status: 'CORRELATED',
                    mmsi: '503891240',
                    confidence: 94,
                    detectionSource: 'EO / Optical Fix (PSS Madras / CAM-04)',
                    detectedByCamera: 'CAM-04',
                  }
                : v
            )
          );

          addAuditLog({
            eventType: 'CORRELATION_UPDATED',
            targetId: 'VSL-003',
            action: 'Optical detection CAM-04 matched with AIS MMSI 503891240 (MAERSK DHARWAD)',
            reason: 'SPATIAL_TEMPORAL_MATCH',
            metadata: { spatialDelta: '240m', correlationConfidence: '94%' },
          });

          setActiveScenarioBanner({
            scenarioNum: 1,
            title: 'Scenario 1: EO Detection + AIS Match',
            stepDescription: 'MATCH FOUND: MMSI 503891240. Status: CORRELATED (Black ship silhouette). Evidence recorded.',
            status: 'COMPLETED',
          });
        }, 1200);
        break;
      }

      case 2: {
        // SCENARIO 2: EO Sensor Detection with No AIS -> DARK VESSEL
        flyToLocation(13.096, 80.371, 11);
        setSelectedVesselId('DV-104');
        setActiveScenarioBanner({
          scenarioNum: 2,
          title: 'Scenario 2: EO Detection with No AIS (Dark Vessel)',
          stepDescription: 'Optical contact sighted by CAM-04. Searching AIS transponders across 5 NM...',
          status: 'IN_PROGRESS',
        });

        setTimeout(() => {
          setVessels((prev) =>
            prev.map((v) =>
              v.id === 'DV-104'
                ? {
                    ...v,
                    status: 'DARK',
                    mmsi: undefined,
                    confidence: 94,
                    detectionSource: 'EO / Optical Fix (PSS Madras / CAM-04)',
                    detectedByCamera: 'CAM-04',
                  }
                : v
            )
          );

          // Ensure ALT-101 alert is active
          setAlerts((prev) => {
            const exists = prev.some((a) => a.alertId === 'ALT-101');
            if (exists) return prev;
            return [
              {
                alertId: 'ALT-101',
                timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
                targetId: 'DV-104',
                targetName: 'UNIDENTIFIED CONTACT 104',
                status: 'DARK_VESSEL',
                priority: 'CRITICAL',
                suggestedAction: 'VERIFY',
                evidence: {
                  source: 'EO Optical Fix (CAM-04 / PSS Madras)',
                  confidence: 94,
                  details: 'Optical sighting without matching AIS transponder fix within 5 NM',
                },
                currentState: 'ACTIVE',
              },
              ...prev,
            ];
          });

          // Queue Dark Vessel notification for temporary container (Requirements 5, 11)
          const darkNotif: AppNotification = {
            id: `NOTIF-${Date.now()}-DV-104`,
            type: 'DARK_VESSEL',
            title: 'DARK VESSEL DETECTED',
            targetId: 'DV-104',
            targetName: 'UNIDENTIFIED CONTACT 104',
            timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
            vesselId: 'DV-104',
            alertId: 'ALT-101',
            severity: 'CRITICAL',
            createdAt: Date.now(),
          };
          setNotifications((prev) => [darkNotif, ...prev.slice(0, 2)]);

          addAuditLog({
            eventType: 'ALERT_CREATED',
            targetId: 'DV-104',
            action: 'Optical contact confirmed with NO matching AIS. Flagged as DARK_VESSEL.',
            reason: 'DARK_VESSEL_DETECTED',
            metadata: { sensor: 'CAM-04', searchRadius: '5 NM', confidence: 94 },
          });

          setActiveScenarioBanner({
            scenarioNum: 2,
            title: 'Scenario 2: EO Detection with No AIS (Dark Vessel)',
            stepDescription: 'NO MATCHING AIS OBSERVATION: Status: DARK VESSEL (Red ship silhouette). Alert ALT-101 active.',
            status: 'COMPLETED',
          });
        }, 1200);
        break;
      }

      case 3: {
        // SCENARIO 3: Dark Vessel Dynamically Correlated with New AIS (DARK -> CORRELATED)
        flyToLocation(13.096, 80.371, 11);
        setVessels((prev) =>
          prev.map((v) =>
            v.id === 'DV-104'
              ? { ...v, status: 'DARK', mmsi: undefined, name: 'UNIDENTIFIED CONTACT 104' }
              : v
          )
        );
        setSelectedVesselId('DV-104');
        setActiveScenarioBanner({
          scenarioNum: 3,
          title: 'Scenario 3: Dynamic Re-Correlation',
          stepDescription: 'Target DV-104 is currently DARK (Red). Listening for incoming AIS broadcast...',
          status: 'IN_PROGRESS',
        });

        // Incoming AIS message arrives -> Run dynamic correlation
        setTimeout(() => {
          setVessels((prev) =>
            prev.map((v) =>
              v.id === 'DV-104'
                ? {
                    ...v,
                    status: 'CORRELATED',
                    mmsi: '419088102',
                    name: 'COROMANDEL PEARL (CORRELATED)',
                    vesselType: 'Fishing Trawler',
                    confidence: 96,
                    detectionSource: 'Fused: CAM-04 Optical Fix + AIS Transponder (MMSI: 419088102)',
                  }
                : v
            )
          );

          addAuditLog({
            eventType: 'CORRELATION_UPDATED',
            targetId: 'DV-104',
            action: 'Dark contact DV-104 dynamically correlated with incoming AIS message 419088102',
            reason: 'DYNAMIC_AIS_MATCH',
            metadata: { spatialTolerance: '180m', timeTolerance: '+0.5m', correlationConfidence: '96%' },
          });

          setActiveScenarioBanner({
            scenarioNum: 3,
            title: 'Scenario 3: Dynamic Re-Correlation',
            stepDescription: 'CORRELATED: New AIS broadcast matched! Marker turned RED → BLACK. Confidence: 96%.',
            status: 'COMPLETED',
          });
        }, 1500);
        break;
      }

      case 4: {
        // SCENARIO 4: Vessel Enters Active Restricted Zone (ORANGE + ENTRY ALERT)
        // Ensure RA-001 exists
        setRestrictedAreas((prev) => {
          if (prev.some((a) => a.id === 'RA-001')) return prev;
          return [INITIAL_RESTRICTED_AREAS[0], ...prev];
        });

        // Step 1: Position VSL-011 outside Western perimeter [lon: 80.342, lat: 13.095]
        setVessels((prev) =>
          prev.map((v) =>
            v.id === 'VSL-011'
              ? { ...v, lon: 80.342, lat: 13.095, status: 'CORRELATED' }
              : v
          )
        );
        flyToLocation(13.095, 80.355, 11);
        setSelectedVesselId('VSL-011');
        setActiveScenarioBanner({
          scenarioNum: 4,
          title: 'Scenario 4: Vessel Enters Restricted Zone',
          stepDescription: 'VSL-011 (CHENNAI TRADER) is outside RESTRICTED AREA 01 (Display: BLACK). Transiting eastward...',
          status: 'IN_PROGRESS',
        });

        // Step 2: Transit VSL-011 across the boundary to [lon: 80.368, lat: 13.095] (INSIDE)
        setTimeout(() => {
          setVessels((prev) =>
            prev.map((v) =>
              v.id === 'VSL-011'
                ? { ...v, lon: 80.368, lat: 13.095 }
                : v
            )
          );

          setActiveScenarioBanner({
            scenarioNum: 4,
            title: 'Scenario 4: Vessel Enters Restricted Zone',
            stepDescription: 'BOUNDARY CROSSED! VSL-011 entered RESTRICTED AREA 01. Display: ORANGE. Alert generated.',
            status: 'COMPLETED',
          });
        }, 1500);
        break;
      }

      case 5: {
        // SCENARIO 5: Zone Deletion & Status Recovery (BLACK -> ORANGE -> BLACK, RED -> ORANGE -> RED)
        const demoZoneId = 'DEMO-ZONE-05';
        const demoZone: RestrictedArea = {
          id: demoZoneId,
          name: 'HIGH SECURITY NAVAL ZONE',
          zoneType: 'RED',
          status: 'ACTIVE',
          createdAt: new Date().toISOString().slice(11, 16) + ' UTC',
          createdBy: 'OPERATOR-01',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [80.340, 13.075],
                [80.385, 13.075],
                [80.385, 13.115],
                [80.340, 13.115],
                [80.340, 13.075],
              ],
            ],
          },
        };

        // Position both VSL-011 (Correlated) and DV-104 (Dark) inside this zone
        setRestrictedAreas((prev) => [demoZone, ...prev.filter((a) => a.id !== demoZoneId)]);
        setVessels((prev) =>
          prev.map((v) => {
            if (v.id === 'VSL-011') return { ...v, lon: 80.365, lat: 13.095, status: 'CORRELATED' };
            if (v.id === 'DV-104') return { ...v, lon: 80.360, lat: 13.090, status: 'DARK' };
            return v;
          })
        );
        flyToLocation(13.095, 80.365, 11);
        setSelectedVesselId('VSL-011');
        setActiveScenarioBanner({
          scenarioNum: 5,
          title: 'Scenario 5: Zone Deletion & Immediate Status Recovery',
          stepDescription: 'Zone active: Correlated VSL-011 and Dark DV-104 are both INSIDE (Both display ORANGE). Deleting zone now...',
          status: 'IN_PROGRESS',
        });

        // Step 2: Delete zone after 2.0 seconds -> instantly clears map and restores both vessels
        setTimeout(() => {
          handleDeleteArea(demoZoneId);
          setActiveScenarioBanner({
            scenarioNum: 5,
            title: 'Scenario 5: Zone Deletion & Immediate Status Recovery',
            stepDescription: 'ZONE DELETED! Polygon removed without reload. VSL-011 restored to BLACK, DV-104 restored to RED.',
            status: 'COMPLETED',
          });
        }, 2200);
        break;
      }

      case 6: {
        // SCENARIO 6: Automatic Zone Expiry Handling
        const expId = `TEMP-EXP-${Date.now().toString(36).toUpperCase().slice(-4)}`;
        const expArea: RestrictedArea = {
          id: expId,
          name: 'TEMPORARY 5S EXCLUSION ZONE',
          zoneType: 'RED',
          status: 'ACTIVE',
          createdAt: new Date().toISOString().slice(11, 16) + ' UTC',
          expiresAt: new Date(Date.now() + 5000).toISOString(),
          expiresInMinutes: 0.08,
          createdBy: 'OPERATOR-01',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [80.340, 13.075],
                [80.385, 13.075],
                [80.385, 13.115],
                [80.340, 13.115],
                [80.340, 13.075],
              ],
            ],
          },
        };

        // Position VSL-011 inside so it turns orange
        setRestrictedAreas((prev) => [expArea, ...prev]);
        setVessels((prev) =>
          prev.map((v) => (v.id === 'VSL-011' ? { ...v, lon: 80.365, lat: 13.095, status: 'CORRELATED' } : v))
        );
        flyToLocation(13.095, 80.365, 11);
        setSelectedVesselId('VSL-011');
        setActiveSidebarPanel('areas');

        setActiveScenarioBanner({
          scenarioNum: 6,
          title: 'Scenario 6: Automatic Zone Expiry (5s Countdown)',
          stepDescription: 'Temporary zone active. VSL-011 is ORANGE. Auto-expiring in 5 seconds...',
          status: 'IN_PROGRESS',
        });

        addAuditLog({
          eventType: 'ZONE_CREATED',
          targetId: expId,
          action: 'Created temporary exclusion zone with 5-second automatic expiry',
          reason: 'EXPIRY_DEMO',
          metadata: { expiresAt: expArea.expiresAt },
        });

        setTimeout(() => {
          setActiveScenarioBanner({
            scenarioNum: 6,
            title: 'Scenario 6: Automatic Zone Expiry (5s Countdown)',
            stepDescription: 'ZONE EXPIRED! Removed from map. VSL-011 restored to BLACK. Audit event ZONE_EXPIRED recorded.',
            status: 'COMPLETED',
          });
        }, 5500);
        break;
      }

      case 7: {
        // SCENARIO 7: Operator Alert Disposition Workflow
        setActiveSidebarPanel('events');
        setActiveOverlay(null);
        setActiveScenarioBanner({
          scenarioNum: 7,
          title: 'Scenario 7: Operator Alert Disposition Workflow',
          stepDescription: 'Alert Center opened. Select CONFIRM, DISMISS, or ESCALATE with mandatory Reason Code to test disposition.',
          status: 'COMPLETED',
        });
        break;
      }

      default:
        break;
    }
  };

  // Theme State: 'dark' (default tactical console) or 'light' (daylight operational console)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('revenant_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('revenant_theme', next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  const handleToggleLayer = (key: keyof MapLayersState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedVessel = evaluatedVessels.find((v) => v.id === selectedVesselId) || null;
  const activeAlertCount = alerts.filter((a) => a.currentState === 'ACTIVE').length;

  return (
    <div className={`relative w-screen h-screen ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'theme-dark bg-[#0a0e17] text-slate-100'} antialiased overflow-hidden font-sans select-none flex flex-col transition-colors`}>
      <Header
        activeAlertCount={activeAlertCount}
        onOpenAlerts={() => {
          setActiveSidebarPanel(activeSidebarPanel === 'events' ? null : 'events');
          setActiveOverlay(null);
        }}
        systemStatus="ONLINE"
        activeOverlay={activeOverlay}
        onToggleOverlay={setActiveOverlay}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
      <div className="relative w-full flex-1 overflow-hidden">
        {/* Floating Demo Scenario Execution Banner */}
      {activeScenarioBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border border-slate-700 rounded shadow-2xl backdrop-blur-md max-w-xl text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                activeScenarioBanner.status === 'COMPLETED'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-mono font-bold tracking-wider text-cyan-400 uppercase text-[11px]">
              SCENARIO {activeScenarioBanner.scenarioNum}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-slate-100">{activeScenarioBanner.title}</span>
            <span className="text-[11px] text-slate-400 leading-tight">{activeScenarioBanner.stepDescription}</span>
          </div>
          <button
            onClick={() => setActiveScenarioBanner(null)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map-Native Maritime Surveillance View */}
      <MapView
        vessels={evaluatedVessels}
        selectedVesselId={selectedVesselId}
        selectedCamera={selectedCamera}
        onSelectVessel={(vessel) => {
          setSelectedVesselId(vessel ? vessel.id : null);
          if (vessel) {
            setSelectedCamera(null);
            setSelectedRestrictedArea(null);
            setSelectedAlert(null);
            setActiveOverlay('vesselDetail');
          } else {
            if (activeOverlay === 'vesselDetail' || activeOverlay === 'alert') {
              setActiveOverlay(null);
            }
          }
        }}
        onSelectCamera={(cam) => {
          setSelectedCamera(cam);
          if (cam) {
            setSelectedVesselId(null);
            setSelectedRestrictedArea(null);
            setSelectedAlert(null);
            setActiveOverlay('cameraDetail');
          } else {
            if (activeOverlay === 'cameraDetail') {
              setActiveOverlay(null);
            }
          }
        }}
        onCursorMove={setCursorPos}
        onZoomChange={setCurrentZoom}
        mapInstanceRef={mapInstanceRef}
        layers={layers}
        restrictedAreas={restrictedAreas}
        selectedRestrictedArea={selectedRestrictedArea}
        onSelectRestrictedArea={(area) => {
          setSelectedRestrictedArea(area);
          if (area) {
            setSelectedVesselId(null);
            setSelectedCamera(null);
            setSelectedAlert(null);
            setActiveOverlay('zoneDetail');
          } else {
            if (activeOverlay === 'zoneDetail') {
              setActiveOverlay(null);
            }
          }
        }}
        isDrawingRestricted={isDrawingRestricted}
        pendingPolygonCoords={pendingPolygonCoords}
        onDrawingComplete={handleDrawingComplete}
        onDrawingCancel={handleDrawingCancel}
        onFinishDrawingRef={onFinishDrawingRef}
        drawPointCount={drawPointCount}
        onPointCountChange={setDrawPointCount}
        onDrawPointsChange={setDrawPoints}
        patrolUnits={patrolUnits}
        selectedPatrolId={selectedPatrolId}
        onSelectPatrol={(patrol) => {
          setSelectedPatrolId(patrol?.id || null);
        }}
        activeIntercept={activeIntercept}
      />

      {/* Primary Maritime GIS Toolbar */}
      <LeftToolbar
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onLocateIndia={locateIndia}
        onResetNorth={() => mapInstanceRef.current?.resetNorthPitch()}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        isDrawingRestricted={isDrawingRestricted}
        onToggleDrawRestricted={handleToggleDrawRestricted}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        activeAlertCount={activeAlertCount}
        activePanel={activeSidebarPanel}
        onTogglePanel={setActiveSidebarPanel}
        onOpenAIDetector={() => {
          setAiDetectorCamera(null);
          setIsAIDetectorOpen(true);
        }}
        onOpenReports={() => handleOpenIncidentReport()}
      />

      {/* 1. SINGLE ACTIVE SIDEBAR PANEL SYSTEM (Requirements 1–7) */}
      {/* Areas: Zone Manager Panel */}
      <ZoneManagerPanel
        isOpen={activeSidebarPanel === 'areas'}
        onClose={() => setActiveSidebarPanel(null)}
        areas={restrictedAreas}
        onToggleStatus={handleToggleAreaStatus}
        onDeleteArea={handleDeleteArea}
        onEditArea={handleEditArea}
        onStartDrawing={handleToggleDrawRestricted}
        onLoadGeoJSONZones={handleLoadGeoJSONZones}
        onFlyToArea={(area) => {
          const coords = area.geometry.coordinates[0];
          if (coords && coords.length > 0) {
            flyToLocation(coords[0][1], coords[0][0], 10.5);
          }
          setSelectedRestrictedArea(area);
          setSelectedVesselId(null);
          setSelectedCamera(null);
          setSelectedAlert(null);
          setActiveOverlay('zoneDetail');
        }}
      />

      {/* Events: Operational Alert Center */}
      <AlertCenter
        isOpen={activeSidebarPanel === 'events'}
        onClose={() => setActiveSidebarPanel(null)}
        alerts={alerts}
        vessels={evaluatedVessels}
        patrolUnits={patrolUnits}
        onDispositAlert={handleDispositAlert}
        onDispatchPatrol={handleDispatchPatrol}
        onRecallPatrol={handleRecallPatrol}
        onGenerateReport={(targetAlert) => handleOpenIncidentReport(targetAlert, null)}
        onSelectTarget={(targetId) => {
          const vsl = vessels.find((v) => v.id === targetId);
          if (vsl) {
            flyToLocation(vsl.lat, vsl.lon, 10.5);
            setSelectedVesselId(vsl.id);
            setSelectedCamera(null);
            setSelectedRestrictedArea(null);
            const matchingAlert = alerts.find((a) => a.targetId === targetId);
            if (matchingAlert) {
              setSelectedAlert(matchingAlert);
              setActiveOverlay('alert');
            } else {
              setActiveOverlay('vesselDetail');
            }
          }
        }}
      />

      {/* Sensors: Sensor Network & 87 EO Stations */}
      <SensorPanel
        isOpen={activeSidebarPanel === 'sensors'}
        onClose={() => setActiveSidebarPanel(null)}
        cameras={MOCK_CAMERAS as EOCamera[]}
        onSelectCamera={(cam) => {
          flyToLocation(cam.lat, cam.lon, 11);
          setLayers((prev) => ({ ...prev, cameras: true }));
          setSelectedCamera(cam);
          setSelectedVesselId(null);
          setSelectedRestrictedArea(null);
          setSelectedAlert(null);
          setActiveOverlay('cameraDetail');
        }}
        onViewFeed={(cam) => setActiveFeedCamera(cam)}
      />

      {/* Filters: Maritime GIS Layers & Filters */}
      <LayerControlPopover
        isOpen={activeSidebarPanel === 'filters'}
        onClose={() => setActiveSidebarPanel(null)}
        layers={layers}
        onToggleLayer={handleToggleLayer}
      />

      {/* Scenarios: Demo Scenarios Runner (1–7) */}
      <DemoScenariosModal
        isOpen={activeSidebarPanel === 'scenarios'}
        onClose={() => setActiveSidebarPanel(null)}
        onRunScenario={handleRunScenario}
      />

      {/* Audit: Append-Only Immutable Audit Trail */}
      <AuditLogDrawer
        isOpen={activeSidebarPanel === 'audit'}
        onClose={() => setActiveSidebarPanel(null)}
        auditLogs={auditLogs}
      />

      {/* 2. OBJECT DETAIL PANELS (RIGHT-SIDE DETAIL DRAWER - Requirements 1, 4, 8, 14) */}
      {/* Alert Detail Drawer (Requirement 8) */}
      <AlertDetailDrawer
        isOpen={activeOverlay === 'alert'}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedAlert(null);
        }}
        alert={selectedAlert}
        vessel={selectedVessel}
        patrolUnits={patrolUnits}
        onDispositAlert={handleDispositAlert}
        onViewVesselTelemetry={(vslId) => {
          setSelectedVesselId(vslId);
          setActiveOverlay('vesselDetail');
        }}
        onSimulateAisMatch={handleSimulateAisMatch}
        onDispatchPatrol={handleDispatchPatrol}
        onRecallPatrol={handleRecallPatrol}
        onGenerateReport={(alert) => handleOpenIncidentReport(alert, selectedVessel)}
      />

      {/* Selected Vessel Contextual Card */}
      <VesselDetailCard
        vessel={activeOverlay === 'vesselDetail' ? selectedVessel : null}
        patrolUnits={patrolUnits}
        onDispatchPatrol={handleDispatchPatrolToVessel}
        onRecallPatrol={handleRecallPatrol}
        onGenerateReport={(vsl) => handleOpenIncidentReport(null, vsl)}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedVesselId(null);
        }}
        onSimulateAisMatch={handleSimulateAisMatch}
        onViewAlert={(vslId) => {
          const matchingAlert = alerts.find((a) => a.targetId === vslId);
          if (matchingAlert) {
            setSelectedAlert(matchingAlert);
          }
          setActiveOverlay('alert');
        }}
      />

      {/* Selected Camera Contextual Card */}
      <CameraPopupCard
        camera={activeOverlay === 'cameraDetail' ? selectedCamera : null}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedCamera(null);
        }}
        onViewEo={(cam) => setActiveFeedCamera(cam)}
        vessels={evaluatedVessels}
      />

      {/* Selected Restricted Area Contextual Card */}
      <RestrictedAreaPopupCard
        area={activeOverlay === 'zoneDetail' ? selectedRestrictedArea : null}
        vessels={evaluatedVessels}
        onClose={() => {
          setActiveOverlay(null);
          setSelectedRestrictedArea(null);
        }}
        onToggleStatus={handleToggleAreaStatus}
        onDeleteArea={handleDeleteArea}
        onUpdateTimeRange={handleUpdateTimeRange}
      />

      {/* 3. CENTERED MODALS (Requirement 10) */}
      {/* Save Restricted Area Confirmation Modal */}
      <SaveAreaModal
        isOpen={isSaveModalOpen}
        defaultName={`RESTRICTED AREA ${(restrictedAreas.length + 1).toString().padStart(2, '0')}`}
        hasCameraCoverage={pendingCoverageReport.hasCoverage}
        nearestCameraDistanceKm={pendingCoverageReport.nearestDistanceKm}
        onSave={handleSaveArea}
        onCancel={() => {
          setIsSaveModalOpen(false);
          setPendingPolygonCoords(null);
        }}
      />

      {/* Contextual EO Observation Feed Modal */}
      <CameraFeedModal
        camera={activeFeedCamera}
        onClose={() => setActiveFeedCamera(null)}
        onAnalyzeWithML={(cam) => {
          setAiDetectorCamera(cam);
          setIsAIDetectorOpen(true);
        }}
      />

      {/* Real Fine-Tuned YOLO11n AI Vessel Detection & Geolocation Modal */}
      <AIVesselDetectionModal
        isOpen={isAIDetectorOpen}
        onClose={() => {
          setIsAIDetectorOpen(false);
          setAiDetectorCamera(null);
        }}
        preselectedCamera={aiDetectorCamera}
        onPlotVesselOnMap={handlePlotAIVessel}
      />

      {/* Formal Maritime Incident Dossier & Reporting Modal */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={activeReport}
      />

      {/* Drawing Mode Status & Close Prompt */}
      <DrawingPrompt
        isDrawing={isDrawingRestricted}
        pointCount={drawPointCount}
        hasCameraCoverage={drawingCoverageReport.hasCoverage}
        nearestCameraDistanceKm={drawingCoverageReport.nearestDistanceKm}
        onFinish={() => {
          if (onFinishDrawingRef.current) {
            onFinishDrawingRef.current();
          }
        }}
        onCancel={handleDrawingCancel}
      />

      {/* Dedicated Contextual Notification Container (Requirements 5, 11, 12, 13) */}
      <NotificationContainer
        notifications={notifications}
        onSelectNotification={handleSelectNotification}
        onDismissNotification={handleDismissNotification}
      />

        {/* Geographic Coordinate HUD, Feed Health & Maritime Legend */}
        <CoordinateBar
          cursorPos={cursorPos}
          zoom={currentZoom}
          onToggleLegend={() => setIsLegendOpen(!isLegendOpen)}
          isLegendOpen={isLegendOpen}
        />
      </div>
    </div>
  );
};

export default App;
