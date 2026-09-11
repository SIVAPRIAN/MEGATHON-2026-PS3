import React, { useState } from 'react';
import { DetailDrawer } from './DetailDrawer';
import { MaritimeAlert, DispositionReasonCode, PatrolUnit } from '../types/maritime';
import { Vessel } from '../data/vessels';
import {
  ShieldAlert,
  Navigation,
  Radio,
  ArrowRight,
  Anchor,
  Send,
  CheckCircle2,
  Ship,
  Ruler,
  Timer,
  MapPin,
  FileText,
} from 'lucide-react';
import { findNearestPatrol, kmToNM } from '../utils/patrolUtils';

export interface AlertDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alert: MaritimeAlert | null;
  vessel: Vessel | null;
  patrolUnits?: PatrolUnit[];
  onDispositAlert: (
    alertId: string,
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
    reason: DispositionReasonCode,
    notes?: string
  ) => void;
  onViewVesselTelemetry?: (vesselId: string) => void;
  onSimulateAisMatch?: (vesselId: string) => void;
  onDispatchPatrol?: (alertId: string, patrolId: string) => void;
  onRecallPatrol?: (patrolId: string) => void;
  onGenerateReport?: (alert: MaritimeAlert) => void;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  isOpen,
  onClose,
  alert,
  vessel,
  patrolUnits = [],
  onDispositAlert,
  onViewVesselTelemetry,
  onSimulateAisMatch,
  onDispatchPatrol,
  onRecallPatrol,
  onGenerateReport,
}) => {
  const [dispositionAction, setDispositionAction] = useState<'CONFIRM' | 'DISMISS' | 'ESCALATE'>('CONFIRM');
  const [reasonCode, setReasonCode] = useState<DispositionReasonCode>('CONFIRMED_CONTACT');
  const [dispositionNotes, setDispositionNotes] = useState('');

  if (!isOpen || !alert) return null;

  const isCritical = alert.priority === 'CRITICAL';
  const isResolved = alert.currentState !== 'ACTIVE';
  const isDark = vessel?.status === 'DARK' || alert.status === 'DARK_VESSEL';

  // Resolve the tasked patrol craft for this alert. findNearestPatrol prefers a unit already
  // RESPONDING to this alert/target, and otherwise selects the closest AVAILABLE unit — so the
  // distance and ETA always belong to the unit actually shown on the card.
  const nearestInfo = vessel
    ? findNearestPatrol(vessel.lat, vessel.lon, patrolUnits, vessel.id, alert.alertId)
    : null;

  const activePatrol = nearestInfo?.patrol;
  const isPatrolAssigned = nearestInfo?.isDispatchedToThisTarget === true;
  const patrolDistanceKm = nearestInfo?.distanceKm;
  const patrolEtaMinutes = nearestInfo?.etaMinutes;

  const handleActionChange = (action: 'CONFIRM' | 'DISMISS' | 'ESCALATE') => {
    setDispositionAction(action);
    if (action === 'DISMISS') setReasonCode('FALSE_POSITIVE');
    else if (action === 'ESCALATE') setReasonCode('INVESTIGATION_REQUIRED');
    else setReasonCode('CONFIRMED_CONTACT');
  };

  const handleConfirmDisposition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDispositAlert(
      alert.alertId,
      dispositionAction,
      reasonCode,
      dispositionNotes.trim() || undefined
    );
  };

  const zoneName =
    alert.evidence.zoneName ||
    vessel?.restrictedAreaNames?.join(', ') ||
    'RESTRICTED AREA 01';

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={alert.status}
      badge={vessel?.id || alert.targetId}
      icon={<ShieldAlert className={`w-4 h-4 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />}
      headerBg="bg-[#0f172a]"
      headerBorder="border-slate-800"
    >
      <div className="p-3 space-y-2.5 text-[11px] font-sans text-slate-200" onClick={(e) => e.stopPropagation()}>
        {/* Alert Priority & Status Banner */}
        <div
          className={`p-2.5 rounded border space-y-1 ${
            isCritical
              ? 'bg-[#181119] border-rose-900/70'
              : 'bg-[#1a1612] border-amber-900/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isCritical ? 'text-rose-300' : 'text-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} />
              {alert.status}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                  isCritical
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                {alert.priority}
              </span>
              <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {alert.currentState}
              </span>
            </div>
          </div>
          <div className="text-[9.5px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
            <span>Alert ID: <strong className="font-mono text-slate-200">{alert.alertId}</strong></span>
            <span>Sensor Fix: <strong className="text-slate-200">{alert.evidence.source}</strong></span>
          </div>
        </div>

        {/* Vessel Identification Section */}
        <div className="bg-[#111827] p-2.5 rounded border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider">Target ID</span>
            <span className="text-[12px] font-bold text-slate-100 font-mono">
              {vessel?.id || alert.targetId}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Target Name:</span>
            <span className="font-semibold text-slate-200">
              {vessel?.name || alert.targetName}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Surveillance Status:</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9.5px] border ${
                isDark
                  ? 'text-rose-300 bg-rose-950 border-rose-800'
                  : 'text-amber-300 bg-amber-950 border-amber-800'
              }`}
            >
              {vessel?.displayStatus || (isDark ? 'DARK' : 'RESTRICTED')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Geofence Zone:</span>
            <span className="font-medium text-amber-300">{zoneName}</span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Vessel Type:</span>
            <span className="font-medium text-slate-300">{vessel?.vesselType || 'Cargo / Commercial'}</span>
          </div>
        </div>

        {/* Event Time & Geolocation Section */}
        <div className="bg-[#111827] p-2.5 rounded border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Detection Timestamp:</span>
            <span className="font-mono text-slate-200">{alert.timestamp}</span>
          </div>
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-slate-400">Coordinates:</span>
            <span className="font-mono text-slate-200">
              {vessel ? `${vessel.lat.toFixed(4)}° N, ${vessel.lon.toFixed(4)}° E` : 'Inshore Corridor'}
            </span>
          </div>
          {vessel && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px] text-slate-300">
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3 text-slate-400" style={{ transform: `rotate(${vessel.heading}deg)` }} />
                <span>Heading: <strong className="font-mono text-slate-100">{vessel.heading}°</strong></span>
              </div>
              <div>
                <span>Speed: <strong className="font-mono text-slate-100">{vessel.speed} kn</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* DEDICATED MITIGATION PROCESS & ACTION PLAN
            Vessel-directed steps, so it is suppressed for target-less alerts such as
            SENSOR_BLIND_SPOT zone notices, which have no contact to hail or intercept. */}
        {vessel && (
          <div className="p-2.5 rounded bg-[#101b2b] border border-cyan-800/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Recommended Mitigation Process
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                {alert.status === 'RESTRICTED AREA ENTRY' ? 'ZONE MITIGATION' : 'TACTICAL RESPONSE'}
              </span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              {/* Step 1: Radio Challenge */}
              <div className="p-1.5 rounded bg-[#07111e] border border-cyan-950/80 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-900/70 text-cyan-200 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  1
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-slate-200 text-[10.5px]">Broadcast Radio Challenge & Warning</div>
                  <div className="text-slate-400 text-[9.5px] leading-tight">
                    Hail target vessel on <strong>VHF Marine Ch 16 (156.8 MHz)</strong> & DSC Ch 70. Issue immediate instruction to alter course and exit {zoneName}.
                  </div>
                </div>
              </div>

              {/* Step 2: Contact Nearest Patrol Vessel */}
              {activePatrol && patrolDistanceKm !== undefined && (
                <div className="p-1.5 rounded bg-[#07111e] border border-cyan-950/80 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-900/70 text-emerald-200 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    2
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-bold text-slate-200 text-[10.5px] flex items-center gap-1 flex-wrap">
                      <span>Task Nearby Patrol Unit:</span>
                      <strong className="text-cyan-300 font-mono">{activePatrol.id}</strong>
                      <span className="text-slate-400 font-normal text-[9.5px]">— {activePatrol.name}</span>
                    </div>
                    <div className="text-slate-300 text-[9.5px] leading-tight">
                      Task nearest patrol craft available in {activePatrol.sector} at{' '}
                      <strong className="font-mono">{patrolDistanceKm.toFixed(1)} km</strong> away (ETA:{' '}
                      <strong className="text-emerald-300 font-mono font-bold">{patrolEtaMinutes} min</strong>).
                      Contact commanding officer on <strong>VHF Tactical Ch 12 (Callsign: {activePatrol.callsign})</strong> to
                      initiate immediate intercept and verification vector.
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Tactical Boarding & Enforcement */}
              <div className="p-1.5 rounded bg-[#07111e] border border-cyan-950/80 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-900/70 text-cyan-200 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  3
                </span>
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-slate-200 text-[10.5px]">Escort & Compliance Verification</div>
                  <div className="text-slate-400 text-[9.5px] leading-tight">
                    Deploy boarding party if contact fails to respond within 5 minutes. Log telemetry fix and file civil law enforcement non-compliance report.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEAREST PATROL INTERCEPT COMMAND CARD */}
        {activePatrol && patrolDistanceKm !== undefined && patrolEtaMinutes !== undefined && (
          <div className="p-2.5 rounded bg-[#0b1528] border border-sky-800/80 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-sky-400" />
                Nearest Coastal Patrol
              </span>
              <span
                className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
                  isPatrolAssigned || activePatrol.status === 'RESPONDING'
                    ? 'bg-sky-950 text-sky-300 border-sky-600 animate-pulse'
                    : activePatrol.status === 'AVAILABLE'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPatrolAssigned || activePatrol.status === 'RESPONDING'
                      ? 'bg-sky-400'
                      : activePatrol.status === 'AVAILABLE'
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
                {isPatrolAssigned || activePatrol.status === 'RESPONDING'
                  ? 'RESPONDING'
                  : activePatrol.status}
              </span>
            </div>

            <div className="bg-[#070e1c] p-2 rounded border border-sky-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  {activePatrol.id} <span className="font-normal text-slate-400">({activePatrol.name})</span>
                </span>
                <span className="text-[8.5px] font-mono text-sky-300 font-semibold px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-900">
                  {activePatrol.type || activePatrol.craftType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-sky-900/40">
                <div className="flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-400">Distance:</span>
                  <strong className="font-mono text-sky-200">
                    {patrolDistanceKm.toFixed(1)} km
                  </strong>
                  <span className="text-[8.5px] text-slate-400 font-mono">({kmToNM(patrolDistanceKm).toFixed(1)} NM)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-400">ETA:</span>
                  <strong className="font-mono text-emerald-300 font-bold">
                    {patrolEtaMinutes} min
                  </strong>
                  <span className="text-[8.5px] text-slate-400 font-mono">(@ {activePatrol.speedKnots} kn)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-sky-900/30">
                <span className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  Station: <strong className="text-slate-300">{activePatrol.station || activePatrol.sector}</strong>
                </span>
                <span>Callsign: <strong className="text-slate-300 font-mono">{activePatrol.callsign}</strong></span>
              </div>
            </div>

            {/* Dispatch / Recall Action Button */}
            {onDispatchPatrol && onRecallPatrol && (
              <div>
                {isPatrolAssigned || activePatrol.status === 'RESPONDING' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecallPatrol(activePatrol.id);
                    }}
                    className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>[ RECALL / STAND DOWN PATROL ]</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatchPatrol(alert.alertId, activePatrol.id);
                    }}
                    disabled={activePatrol.status === 'BUSY'}
                    className={`w-full py-1.5 px-2 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-colors ${
                      activePatrol.status === 'BUSY'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-mono tracking-wider'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>[ DISPATCH PATROL ]</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Operator Disposition Section */}
        <div className="p-2.5 bg-[#111827] rounded border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Operator Disposition
            </span>
            {isResolved && (
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                RESOLVED
              </span>
            )}
          </div>

          {isResolved ? (
            <div className="p-2 bg-[#0b111e] rounded border border-slate-800 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono font-bold text-emerald-400">{alert.disposition?.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reason Code:</span>
                <span className="font-mono text-slate-200">{alert.disposition?.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operator:</span>
                <span className="font-mono text-slate-300">{alert.disposition?.operatorId || 'OPERATOR-01'}</span>
              </div>
              {alert.disposition?.notes && (
                <div className="pt-1 border-t border-slate-800 text-slate-300 italic">
                  "{alert.disposition.notes}"
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Action Selector: CONFIRM / DISMISS / ESCALATE */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('CONFIRM');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-colors ${
                    dispositionAction === 'CONFIRM'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#0b111e] hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  CONFIRM
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('DISMISS');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-colors ${
                    dispositionAction === 'DISMISS'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-[#0b111e] hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  DISMISS
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionChange('ESCALATE');
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-center border transition-colors ${
                    dispositionAction === 'ESCALATE'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-[#0b111e] hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  ESCALATE
                </button>
              </div>

              {/* Mandatory Reason Code */}
              <div>
                <label className="text-[8.5px] uppercase font-semibold text-slate-400 block mb-1">
                  Reason Code
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => {
                    e.stopPropagation();
                    setReasonCode(e.target.value as DispositionReasonCode);
                  }}
                  className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[10px] font-mono focus:border-sky-500 focus:outline-none"
                >
                  <option value="CONFIRMED_CONTACT">CONFIRMED_CONTACT</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                  <option value="AUTHORIZED_ACTIVITY">AUTHORIZED_ACTIVITY</option>
                  <option value="DUPLICATE_DETECTION">DUPLICATE_DETECTION</option>
                  <option value="INVESTIGATION_REQUIRED">INVESTIGATION_REQUIRED</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              {/* Operational Notes */}
              <div>
                <input
                  type="text"
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Operator notes (audit log reference)..."
                  className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[10px] placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Submit Disposition */}
              <button
                type="button"
                onClick={handleConfirmDisposition}
                className={`w-full py-1.5 px-2 rounded font-bold text-[10px] text-white shadow-xs transition-colors ${
                  dispositionAction === 'CONFIRM'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : dispositionAction === 'DISMISS'
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                SUBMIT DISPOSITION
              </button>
            </>
          )}
        </div>

        {/* Link to Vessel Telemetry */}
        {vessel && onViewVesselTelemetry && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewVesselTelemetry(vessel.id);
            }}
            className="w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Full Target Telemetry</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {/* Dynamic Target Re-Correlation (Scenario 3) */}
        {isDark && onSimulateAisMatch && vessel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSimulateAisMatch(vessel.id);
            }}
            className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            title="Ingest live AIS transponder message to correlate this contact"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>INGEST MATCHING AIS TELEMETRY</span>
          </button>
        )}

        {/* Generate Incident Report Dossier */}
        {onGenerateReport && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateReport(alert);
            }}
            className="w-full py-2 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
            title="Generate official Maritime Incident Dossier, SITREP and PDF"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-200" />
            <span className="tracking-wide">GENERATE INCIDENT REPORT</span>
          </button>
        )}

        {/* Attribution Footnote */}
        <div className="pt-1 text-[8.5px] text-slate-500 flex items-center justify-between border-t border-slate-800">
          <span>Surveillance Engine</span>
          <span className="text-slate-400 font-mono">REVENANT-0</span>
        </div>
      </div>
    </DetailDrawer>
  );
};
