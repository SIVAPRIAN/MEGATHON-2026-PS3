import { IncidentReport, MaritimeAlert, PatrolUnit, AuditLogEntry } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { MOCK_CAMERAS } from '../data/mockCameras';
import { findNearestPatrol } from './patrolUtils';

/**
 * Converts decimal latitude/longitude into human-readable maritime Degrees-Minutes-Seconds (DMS)
 */
export function formatDMS(lat: number, lon: number): string {
  const formatCoord = (deg: number, isLat: boolean) => {
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = Math.round(((abs - d) * 60 - m) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"${dir}`;
  };
  return `${formatCoord(lat, true)}, ${formatCoord(lon, false)}`;
}

/**
 * Generates an official Law Enforcement Maritime Incident Report Dossier
 */
export function generateIncidentReport(params: {
  alert?: MaritimeAlert | null;
  vessel?: Vessel | null;
  patrolUnits?: PatrolUnit[];
  auditLogs?: AuditLogEntry[];
  investigatorNotes?: string;
  reportingOfficer?: string;
}): IncidentReport {
  const {
    alert,
    vessel,
    patrolUnits = [],
    auditLogs = [],
    investigatorNotes = '',
    reportingOfficer = 'OPERATOR-01 (Maritime Tactical Command)',
  } = params;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const idSuffix = alert?.alertId ? alert.alertId.replace(/[^A-Z0-9]/gi, '') : Math.random().toString(36).substring(2, 6).toUpperCase();
  const reportId = `IR-${dateStr}-${idSuffix}`;

  const lat = vessel?.lat ?? 13.0827;
  const lon = vessel?.lon ?? 80.2707;
  const targetId = vessel?.id || alert?.targetId || 'UNKNOWN-TARGET';
  const targetName = vessel?.name || alert?.targetName || 'Unidentified Maritime Contact';

  // Determine maritime jurisdiction zone based on distance from coast / region
  let jurisdictionZone = 'EXCLUSIVE_ECONOMIC_ZONE (EEZ)';
  let locationDescription = 'Bay of Bengal — Coromandel Coast Sector';

  if (lat > 20 && lon < 72) {
    locationDescription = 'Arabian Sea — Saurashtra / Gulf of Khambhat Sector';
  } else if (lat < 10 && lon < 80) {
    locationDescription = 'Gulf of Mannar / Palk Strait Corridor';
    jurisdictionZone = 'TERRITORIAL_WATERS_12NM';
  } else if (lon > 90) {
    locationDescription = 'Andaman Sea / Ten Degree Channel Operational Sector';
  }

  // Correlate with coastal camera if available
  const matchedCamera = MOCK_CAMERAS.find(
    (c) => c.id === vessel?.detectedByCamera || c.name.toLowerCase().includes('madras')
  );

  // Resolve nearest or responding patrol unit
  const nearestInfo = findNearestPatrol(lat, lon, patrolUnits, targetId, alert?.alertId);
  const activePatrol = nearestInfo?.patrol;

  // Build forensic chronological timeline from audit logs and alerts
  const timeline: IncidentReport['timeline'] = [];

  timeline.push({
    timestamp: alert?.timestamp || now.toISOString().slice(11, 19) + ' UTC',
    source: alert?.evidence.source || 'Optical Sensor Envelope',
    event: 'INITIAL_CONTACT_DETECTED',
    details: `${targetName} (${targetId}) logged at ${formatDMS(lat, lon)}. Speed: ${vessel?.speed ?? 12} kts, Course: ${vessel?.heading ?? 90}°.`,
  });

  if (vessel?.status === 'DARK' || alert?.status === 'DARK_VESSEL') {
    timeline.push({
      timestamp: alert?.timestamp || now.toISOString().slice(11, 19) + ' UTC',
      source: 'Sensor Correlation Engine',
      event: 'AIS_NON_BROADCAST_ALARM',
      details: 'Optical sighting confirmed with zero corresponding AIS transponder radio broadcast within 5.0 NM radius.',
    });
  }

  if (alert?.evidence.zoneName || vessel?.restrictedAreaNames?.length) {
    const zName = alert?.evidence.zoneName || vessel?.restrictedAreaNames?.[0] || 'SECURITY EXCLUSION ZONE';
    timeline.push({
      timestamp: alert?.timestamp || now.toISOString().slice(11, 19) + ' UTC',
      source: 'Turf.js Geofence Monitor',
      event: 'RESTRICTED_ZONE_INCURSION',
      details: `Vessel crossed outer geofence boundary into designated ${zName}.`,
    });
  }

  if (activePatrol && (activePatrol.status === 'RESPONDING' || nearestInfo?.isDispatchedToThisTarget)) {
    timeline.push({
      timestamp: activePatrol.dispatchTime ? activePatrol.dispatchTime.slice(11, 19) + ' UTC' : '05:14:00 UTC',
      source: 'Fleet Tasking Division',
      event: 'PATROL_INTERCEPT_DISPATCHED',
      details: `Dispatched ${activePatrol.id} (${activePatrol.name}) from ${activePatrol.station}. Intercept vector range: ${(nearestInfo.distanceKm).toFixed(1)} km, ETA: ${Math.round(nearestInfo.etaMinutes)} min.`,
    });
  }

  // Append any related audit logs for this target
  const relatedLogs = auditLogs.filter((log) => log.targetId === targetId || log.targetId === alert?.alertId);
  relatedLogs.slice(-3).forEach((log) => {
    timeline.push({
      timestamp: log.timestamp.slice(11, 19) + ' UTC',
      source: log.operatorId || 'OPERATOR-01',
      event: log.eventType,
      details: `${log.action} [Reason: ${log.reason}]`,
    });
  });

  // Recommended Standard Operating Directives
  const recommendedDirectives: string[] = [
    'Maintain continuous electro-optical tracking via nearest DGLL Physical Shore Station.',
    'Issue VHF Ch. 16 marine safety warning and request vessel flag/cargo declaration.',
    'Authorize Fast Interceptor Craft to execute close-quarters shadow and boarding inspection if non-responsive.',
    'Submit intelligence packet to Joint Operations Centre (JOC) & DG Shipping NAIS network.',
  ];

  // Cryptographic signature simulation verification token
  const sigHash = Array.from(reportId + targetId)
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');

  return {
    reportId,
    generatedAt: now.toISOString(),
    generatedAtIST: new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' IST',
    classification: 'RESTRICTED // LAW ENFORCEMENT SENSITIVE',
    reportingOfficer,
    commandAuthority: 'Directorate General of Lighthouses & Lightships / Coastal Maritime Sentinel',
    
    alertId: alert?.alertId,
    incidentType: alert?.status || (vessel?.status === 'DARK' ? 'DARK_VESSEL_INCURSION' : 'MARITIME_INCIDENT'),
    priority: alert?.priority || 'HIGH',
    operationalStatus: alert?.currentState || 'UNDER_INVESTIGATION',
    locationDescription,
    coordinates: {
      lat,
      lon,
      dms: formatDMS(lat, lon),
    },
    jurisdictionZone,

    targetVessel: {
      id: targetId,
      name: targetName,
      vesselType: vessel?.vesselType || 'Commercial Vessel',
      status: vessel?.displayStatus || vessel?.status || 'DARK',
      flag: vessel?.flag || 'Unflagged / Unknown',
      mmsi: vessel?.mmsi || 'N/A (Silent Transponder)',
      lengthMeters: vessel?.length || 120,
      speedKnots: vessel?.speed || 12.0,
      courseHeadingDeg: vessel?.heading || 90,
      aisBroadcastStatus: vessel?.mmsi ? 'BROADCAST_ACTIVE' : 'NON_BROADCASTING_DARK',
      restrictedZonesViolated: vessel?.restrictedAreaNames || (alert?.evidence.zoneName ? [alert.evidence.zoneName] : []),
    },

    sensorTelemetry: {
      detectingSensor: matchedCamera?.fullName || matchedCamera?.name || 'PSS Madras Lighthouse (CAM-04)',
      sensorType: matchedCamera?.model || 'Long-Range Electro-Optical / Thermal Coastal Sensor',
      detectionSource: alert?.evidence.source || 'Optical Sighting / Fixed Shore Station',
      sensorCoordinates: matchedCamera ? [matchedCamera.lon, matchedCamera.lat] : undefined,
      sensorAzimuthDeg: matchedCamera?.heading ?? 90,
      sensorFovDeg: matchedCamera?.fov ?? 46,
      sensorRangeKm: matchedCamera?.rangeKm ?? 15,
      aiModelUsed: 'YOLO11n-SeaShips Fine-Tuned Marine Detector',
      aiConfidencePercent: alert?.evidence.confidence || vessel?.confidence || 93,
      correlationScorePercent: vessel?.status === 'DARK' ? 12 : 96,
    },

    tacticalResponse: {
      patrolAssigned: activePatrol
        ? {
            id: activePatrol.id,
            name: activePatrol.name,
            unitType: activePatrol.type,
            baseStation: activePatrol.station,
            status: activePatrol.status,
            dispatchTime: activePatrol.dispatchTime,
            distanceKm: nearestInfo ? Number(nearestInfo.distanceKm.toFixed(1)) : undefined,
            etaMinutes: nearestInfo ? Math.round(nearestInfo.etaMinutes) : undefined,
          }
        : undefined,
      mitigationActionsTaken: [
        'Electro-Optical Optical Fix Locked',
        'Geofence Perimeter Intrusion Alarm Triggered',
        activePatrol?.status === 'RESPONDING' ? `Patrol Craft ${activePatrol.id} Dispatched` : 'Standby Intercept Alert Queued',
        alert?.disposition ? `Disposition Recorded: ${alert.disposition.action}` : 'Pending Senior Duty Officer Sign-off',
      ],
      dispositionAction: alert?.disposition?.action,
      dispositionReason: alert?.disposition?.reason,
      dispositionNotes: alert?.disposition?.notes,
    },

    timeline,
    investigatorNotes: investigatorNotes || `Target exhibited non-broadcasting profile within sovereign surveillance envelope. Initial visual detection confirmed by coastal sensor station. Recommend maintaining tactical tracking and verifying physical manifest upon boarding intercept.`,
    recommendedDirectives,
    signatureVerificationCode: `SIG-REV-${sigHash}-${dateStr}`,
  };
}

/**
 * Formats an incident report as an official Markdown SITREP document
 */
export function exportReportToMarkdown(report: IncidentReport): string {
  return `# MARITIME INCIDENT DOSSIER // REVENANT-0
**Classification:** ${report.classification}
**Report ID:** ${report.reportId}
**Date/Time (UTC):** ${report.generatedAt.replace('T', ' ').slice(0, 19)} UTC
**Date/Time (IST):** ${report.generatedAtIST}
**Reporting Officer:** ${report.reportingOfficer}
**Command Authority:** ${report.commandAuthority}

---

## 1. INCIDENT OVERVIEW
- **Incident Classification:** ${report.incidentType}
- **Operational Priority:** ${report.priority}
- **Current Case Status:** ${report.operationalStatus}
- **Geographic Sector:** ${report.locationDescription}
- **Coordinates:** ${report.coordinates.dms} (${report.coordinates.lat.toFixed(5)}°, ${report.coordinates.lon.toFixed(5)}°)
- **Maritime Jurisdiction:** ${report.jurisdictionZone}

---

## 2. TARGET VESSEL DOSSIER
- **Target ID / Identifier:** ${report.targetVessel.id}
- **Vessel Name:** ${report.targetVessel.name}
- **Vessel Classification:** ${report.targetVessel.vesselType}
- **Operational Status:** ${report.targetVessel.status}
- **Flag State:** ${report.targetVessel.flag}
- **MMSI Transponder:** ${report.targetVessel.mmsi}
- **Overall Length:** ${report.targetVessel.lengthMeters} meters
- **Speed over Ground (SOG):** ${report.targetVessel.speedKnots} knots
- **Course over Ground (COG):** ${report.targetVessel.courseHeadingDeg}° True
- **AIS Broadcast Profile:** ${report.targetVessel.aisBroadcastStatus}
${report.targetVessel.restrictedZonesViolated?.length ? `- **Restricted Zones Incurred:** ${report.targetVessel.restrictedZonesViolated.join(', ')}` : ''}

---

## 3. SENSOR & AI EVIDENCE TELEMETRY
- **Detecting Shore Station:** ${report.sensorTelemetry.detectingSensor}
- **Sensor Modality:** ${report.sensorTelemetry.sensorType}
- **Detection Feed Source:** ${report.sensorTelemetry.detectionSource}
- **Boresight Azimuth / FOV:** ${report.sensorTelemetry.sensorAzimuthDeg}° True (${report.sensorTelemetry.sensorFovDeg}° Field of View)
- **Effective Optical Range:** ${report.sensorTelemetry.sensorRangeKm} km
- **Computer Vision Model:** ${report.sensorTelemetry.aiModelUsed}
- **AI Classification Confidence:** ${report.sensorTelemetry.aiConfidencePercent}%
- **Telemetry Fusion Score:** ${report.sensorTelemetry.correlationScorePercent}%

---

## 4. TACTICAL RESPONSE & PATROL TASKING
${report.tacticalResponse.patrolAssigned ? `
- **Assigned Interceptor:** ${report.tacticalResponse.patrolAssigned.id} (${report.tacticalResponse.patrolAssigned.name})
- **Craft Type:** ${report.tacticalResponse.patrolAssigned.unitType}
- **Operating Station:** ${report.tacticalResponse.patrolAssigned.baseStation}
- **Tactical Status:** ${report.tacticalResponse.patrolAssigned.status}
- **Range to Target:** ${report.tacticalResponse.patrolAssigned.distanceKm} km
- **Estimated Time of Intercept:** ~${report.tacticalResponse.patrolAssigned.etaMinutes} minutes
` : '- *No mobile patrol craft tasked at time of report generation.*'}

### Mitigation Actions Executed:
${report.tacticalResponse.mitigationActionsTaken.map((a) => `- [x] ${a}`).join('\n')}

---

## 5. FORENSIC EVENT TIMELINE
| Timestamp (UTC) | Originating Sensor / Operator | Tactical Event Code | Description |
|---|---|---|---|
${report.timeline.map((t) => `| ${t.timestamp} | ${t.source} | ${t.event} | ${t.details} |`).join('\n')}

---

## 6. INVESTIGATING OFFICER FINDINGS & DIRECTIVES
> ${report.investigatorNotes}

### Standard Operating Directives:
${report.recommendedDirectives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

---
**Verification Signature Code:** \`${report.signatureVerificationCode}\`
*Electronically generated and sealed by REVENANT Maritime Surveillance Console.*
`;
}

/**
 * Triggers a download of the report as a clean Markdown or JSON file
 */
export function downloadReportFile(filename: string, content: string, contentType = 'text/markdown'): void {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
