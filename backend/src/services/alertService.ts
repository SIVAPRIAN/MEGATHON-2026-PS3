import { Alert, IAlert } from '../models/Alert';
import { AuditLog } from '../models/AuditLog';

export interface CreateAlertParams {
  type?: string;
  status?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description?: string;
  targetId: string;
  targetName?: string;
  trackId?: string;
  vesselId?: string;
  cameraId?: string;
  zoneId?: string;
  latitude?: number;
  longitude?: number;
  suggestedAction?: 'MONITOR' | 'INVESTIGATE' | 'VERIFY' | 'ESCALATE';
  evidence?: {
    source: string;
    confidence?: number;
    zoneName?: string;
    details?: string;
    coordinates?: [number, number];
  };
}

export async function createSurveillanceAlert(params: CreateAlertParams): Promise<IAlert> {
  const alertCount = await Alert.countDocuments().exec();
  const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const alertId = `ALT-${100 + alertCount + 1}-${randSuffix}`;

  const newAlert = new Alert({
    alertId,
    type: params.type || 'RESTRICTED_ENTRY',
    status: params.status || 'RESTRICTED AREA ENTRY',
    priority: params.priority || 'HIGH',
    title: params.title,
    description: params.description,
    targetId: params.targetId,
    targetName: params.targetName || `TARGET ${params.targetId}`,
    trackId: params.trackId,
    vesselId: params.vesselId,
    cameraId: params.cameraId,
    zoneId: params.zoneId,
    latitude: params.latitude,
    longitude: params.longitude,
    currentState: 'ACTIVE',
    suggestedAction: params.suggestedAction || 'INVESTIGATE',
    evidence: params.evidence || {
      source: 'Automated Geofence Detection',
      confidence: 95,
      coordinates: params.longitude && params.latitude ? [params.longitude, params.latitude] : undefined,
    },
  });

  const savedAlert = await newAlert.save();

  // Append to immutable audit log
  const logCount = await AuditLog.countDocuments().exec();
  const evtRand = Math.random().toString(36).substring(2, 6).toUpperCase();
  await AuditLog.create({
    eventId: `EVT-${100 + logCount + 1}-${evtRand}`,
    operatorId: 'SYSTEM',
    eventType: 'ALERT_CREATED',
    targetId: savedAlert.alertId,
    action: `Generated ${savedAlert.priority} priority alert: ${savedAlert.title}`,
    reason: savedAlert.type,
    metadata: {
      alertId: savedAlert.alertId,
      targetId: savedAlert.targetId,
      priority: savedAlert.priority,
      zoneId: savedAlert.zoneId,
    },
  });

  return savedAlert;
}

export async function applyAlertDisposition(
  alertId: string,
  operatorId: string,
  action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
  reason: string,
  notes?: string
): Promise<IAlert | null> {
  const alert = await Alert.findOne({ alertId }).exec();
  if (!alert) return null;

  const stateMap: Record<string, 'CONFIRMED' | 'DISMISSED' | 'ESCALATED'> = {
    CONFIRM: 'CONFIRMED',
    DISMISS: 'DISMISSED',
    ESCALATE: 'ESCALATED',
  };

  alert.currentState = stateMap[action] || 'CONFIRMED';
  alert.disposition = {
    operatorId,
    timestamp: new Date(),
    action,
    reason,
    notes,
  };

  const updatedAlert = await alert.save();

  // Append to audit log
  const logCount = await AuditLog.countDocuments().exec();
  const evtRand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const eventTypeMap = {
    CONFIRM: 'ALERT_CONFIRMED',
    DISMISS: 'ALERT_DISMISSED',
    ESCALATE: 'ALERT_ESCALATED',
  };

  await AuditLog.create({
    eventId: `EVT-${100 + logCount + 1}-${evtRand}`,
    operatorId,
    eventType: eventTypeMap[action] || 'ALERT_CONFIRMED',
    targetId: alert.alertId,
    action: `Operator ${action.toLowerCase()}ed alert ${alert.alertId} (${reason})`,
    reason,
    metadata: {
      alertId: alert.alertId,
      action,
      notes,
      targetId: alert.targetId,
    },
  });

  return updatedAlert;
}
