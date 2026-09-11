/**
 * Centralized REST API Service Client for Coastal Surveillance Console (REVENANT)
 * Connects frontend UI components to the Express / MongoDB Atlas backend.
 */

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`[API] HTTP ${response.status} from ${endpoint}:`, errorData.message || response.statusText);
      return null;
    }

    const json: ApiResponse<T> = await response.json();
    return json.data;
  } catch (error) {
    console.warn(`[API] Network error communicating with ${endpoint}:`, error);
    return null;
  }
}

// ==========================================
// Dashboard Metrics API
// ==========================================
export async function getDashboardSummary() {
  return request<any>('/dashboard/summary');
}

// ==========================================
// Vessels API
// ==========================================
export async function getVesselsApi(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request<any[]>(`/vessels${qs}`);
}

export async function createVesselApi(vesselData: any) {
  return request<any>('/vessels', {
    method: 'POST',
    body: JSON.stringify(vesselData),
  });
}

export async function updateVesselApi(id: string, updates: any) {
  return request<any>(`/vessels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ==========================================
// Cameras API
// ==========================================
export async function getCamerasApi() {
  return request<any[]>('/cameras');
}

export async function updateCameraStatusApi(id: string, status: string, operatorId = 'OPERATOR_1') {
  return request<any>(`/cameras/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, operatorId }),
  });
}

// ==========================================
// Restricted Zones API
// ==========================================
export async function getRestrictedZonesApi() {
  return request<any[]>('/zones');
}

export async function createRestrictedZoneApi(zoneData: any) {
  return request<any>('/zones', {
    method: 'POST',
    body: JSON.stringify(zoneData),
  });
}

export async function updateRestrictedZoneApi(id: string, updates: any) {
  return request<any>(`/zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteRestrictedZoneApi(id: string) {
  return request<any>(`/zones/${id}`, {
    method: 'DELETE',
  });
}

export async function checkPointInZoneApi(lat: number, lon: number) {
  return request<{ isInsideRestricted: boolean; matchingZoneNames: string[]; highestSeverity: string }>(
    `/zones/check-point?lat=${lat}&lon=${lon}`
  );
}

// ==========================================
// Alerts API
// ==========================================
export async function getAlertsApi() {
  return request<any[]>('/alerts');
}

export async function createAlertApi(alertData: any) {
  return request<any>('/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

export async function acknowledgeAlertApi(id: string, operatorId = 'OPERATOR_1') {
  return request<any>(`/alerts/${id}/acknowledge`, {
    method: 'PUT',
    body: JSON.stringify({ operatorId }),
  });
}

export async function resolveAlertApi(id: string, operatorId = 'OPERATOR_1', notes?: string) {
  return request<any>(`/alerts/${id}/resolve`, {
    method: 'PUT',
    body: JSON.stringify({ operatorId, notes }),
  });
}

export async function dispositAlertApi(
  id: string,
  action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
  reason: string,
  notes?: string,
  operatorId = 'OPERATOR_1'
) {
  return request<any>(`/alerts/${id}/disposition`, {
    method: 'PUT',
    body: JSON.stringify({ action, reason, notes, operatorId }),
  });
}

// ==========================================
// Audit Logs API
// ==========================================
export async function getAuditLogsApi() {
  return request<any[]>('/audit-logs');
}

export async function createAuditLogApi(logData: any) {
  return request<any>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify(logData),
  });
}

// ==========================================
// Patrol Units API
// ==========================================
export async function getPatrolsApi() {
  return request<any[]>('/patrols');
}

export async function assignPatrolApi(patrolId: string, alertId: string, operatorId = 'OPERATOR_1') {
  return request<any>(`/patrols/${patrolId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ alertId, operatorId }),
  });
}

export async function releasePatrolApi(patrolId: string, operatorId = 'OPERATOR_1') {
  return request<any>(`/patrols/${patrolId}/release`, {
    method: 'PUT',
    body: JSON.stringify({ operatorId }),
  });
}

// ==========================================
// AIS Feeds & Correlation API
// ==========================================
export async function getAISTargetsApi(params?: {
  search?: string;
  dataSource?: string;
  near?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.dataSource) query.append('dataSource', params.dataSource);
  if (params?.near) query.append('near', params.near);
  if (params?.limit) query.append('limit', String(params.limit));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return request<any[]>(`/ais/targets${qs}`);
}

export async function getAISTargetByMmsiApi(mmsi: string) {
  return request<any>(`/ais/targets/${mmsi}`);
}

export async function getAISHistoryApi(mmsi: string, limit = 100) {
  return request<any>(`/ais/history/${mmsi}?limit=${limit}`);
}

export async function correlateAISApi(lat: number, lon: number, heading?: number) {
  return request<any>('/ais/correlate', {
    method: 'POST',
    body: JSON.stringify({ lat, lon, heading }),
  });
}

// ==========================================
// ML Detection Ingestion (Future Pipeline & Test Detections)
// ==========================================
export async function submitDetectionApi(detectionPayload: {
  trackId: string;
  cameraId: string;
  confidence: number;
  boundingBox: { x1: number; y1: number; x2: number; y2: number };
  estimatedPosition?: { lat: number; lon: number };
  class?: string;
  imageUrl?: string;
}) {
  return request<any>('/detections', {
    method: 'POST',
    body: JSON.stringify(detectionPayload),
  });
}

