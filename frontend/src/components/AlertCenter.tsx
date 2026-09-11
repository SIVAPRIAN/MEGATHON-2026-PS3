import React, { useState } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { MaritimeAlert, DispositionReasonCode, PatrolUnit } from '../types/maritime';
import { Vessel } from '../data/vessels';
import { AlertTriangle, ShieldAlert, Compass, Anchor, Send, FileText } from 'lucide-react';
import { findNearestPatrol } from '../utils/patrolUtils';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: MaritimeAlert[];
  vessels?: Vessel[];
  patrolUnits?: PatrolUnit[];
  onDispositAlert: (
    alertId: string,
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE',
    reason: DispositionReasonCode,
    notes?: string
  ) => void;
  onSelectTarget: (targetId: string) => void;
  onDispatchPatrol?: (alertId: string, patrolId: string) => void;
  onRecallPatrol?: (patrolId: string) => void;
  onGenerateReport?: (alert: MaritimeAlert) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  isOpen,
  onClose,
  alerts,
  vessels = [],
  patrolUnits = [],
  onDispositAlert,
  onSelectTarget,
  onDispatchPatrol,
  onRecallPatrol,
  onGenerateReport,
}) => {
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<{
    alert: MaritimeAlert;
    action: 'CONFIRM' | 'DISMISS' | 'ESCALATE';
  } | null>(null);

  const [reasonCode, setReasonCode] = useState<DispositionReasonCode>('CONFIRMED_CONTACT');
  const [dispositionNotes, setDispositionNotes] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'RESOLVED'>('ALL');

  if (!isOpen) return null;

  const handleOpenDisposition = (alert: MaritimeAlert, action: 'CONFIRM' | 'DISMISS' | 'ESCALATE') => {
    setSelectedAlertForAction({ alert, action });
    if (action === 'DISMISS') setReasonCode('FALSE_POSITIVE');
    else if (action === 'ESCALATE') setReasonCode('INVESTIGATION_REQUIRED');
    else setReasonCode('CONFIRMED_CONTACT');
    setDispositionNotes('');
  };

  const handleConfirmDisposition = () => {
    if (!selectedAlertForAction) return;
    onDispositAlert(
      selectedAlertForAction.alert.alertId,
      selectedAlertForAction.action,
      reasonCode,
      dispositionNotes.trim() || undefined
    );
    setSelectedAlertForAction(null);
  };

  const activeAlerts = alerts.filter((a) => a.currentState === 'ACTIVE');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'CRITICAL') return a.priority === 'CRITICAL' && a.currentState === 'ACTIVE';
    if (filterSeverity === 'HIGH') return a.priority === 'HIGH' && a.currentState === 'ACTIVE';
    if (filterSeverity === 'RESOLVED') return a.currentState !== 'ACTIVE';
    return true;
  });

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Operational Alert Center"
      badge={`${activeAlerts.length} ACTIVE`}
      icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
    >
      {/* Disposition Modal Overlay */}
      {selectedAlertForAction && (
        <div className="p-3 bg-[#151f32] border-b border-slate-700 animate-in fade-in duration-150 space-y-2 text-[11px] text-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100 uppercase text-[10px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Operator Disposition: {selectedAlertForAction.action}
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {selectedAlertForAction.alert.targetId}
            </span>
          </div>

          <div>
            <label className="text-[8.5px] uppercase font-semibold text-slate-400 block mb-1">
              Mandatory Disposition Reason Code
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as DispositionReasonCode)}
              className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[10.5px] font-mono focus:border-sky-500 focus:outline-none"
            >
              <option value="CONFIRMED_CONTACT">CONFIRMED_CONTACT</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              <option value="AUTHORIZED_ACTIVITY">AUTHORIZED_ACTIVITY</option>
              <option value="DUPLICATE_DETECTION">DUPLICATE_DETECTION</option>
              <option value="INVESTIGATION_REQUIRED">INVESTIGATION_REQUIRED</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              value={dispositionNotes}
              onChange={(e) => setDispositionNotes(e.target.value)}
              placeholder="Operator notes (audit log evidence)..."
              className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[10.5px] placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={() => setSelectedAlertForAction(null)}
              className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDisposition}
              className={`px-3 py-1 rounded font-bold text-[10px] text-white shadow-xs ${
                selectedAlertForAction.action === 'CONFIRM'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : selectedAlertForAction.action === 'DISMISS'
                  ? 'bg-slate-700 hover:bg-slate-600'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              SUBMIT DISPOSITION
            </button>
          </div>
        </div>
      )}

      {/* Severity Filter Strip */}
      <div className="px-3 py-1.5 bg-[#0b111e] border-b border-slate-800 flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1">
          {(['ALL', 'CRITICAL', 'HIGH', 'RESOLVED'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterSeverity === sev
                  ? 'bg-slate-700 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-slate-500 text-[9px]">{filteredAlerts.length} ALERTS</span>
      </div>

      {/* Alert List */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-slate-500 italic">
            No alerts found in this view.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.priority === 'CRITICAL';
            const isHigh = alert.priority === 'HIGH';
            const isResolved = alert.currentState !== 'ACTIVE';

            return (
              <div
                key={alert.alertId}
                className={`p-2.5 rounded border transition-colors ${
                  isResolved
                    ? 'bg-[#0f172a]/50 border-slate-800 opacity-60 text-slate-400'
                    : isCritical
                    ? 'bg-[#181119] border-rose-900/60'
                    : isHigh
                    ? 'bg-[#1a1612] border-amber-900/60'
                    : 'bg-[#111827] border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {alert.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-100 uppercase tracking-wide">
                      {alert.status}
                    </span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400">{alert.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-200 mb-1.5">
                  <span className="font-semibold text-slate-100">{alert.targetName}</span>
                  <span className="text-[9.5px] font-mono text-slate-400">Track: {alert.targetId}</span>
                </div>

                <div className="text-[10px] text-slate-300 space-y-1 mb-2 bg-[#0b111e]/90 p-2 rounded border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Evidence Fix:</span>
                    <span className="text-slate-200 font-medium">
                      {alert.evidence.source}
                      {alert.evidence.confidence && (
                        <span className="font-mono text-sky-400 font-semibold ml-1">({alert.evidence.confidence}%)</span>
                      )}
                    </span>
                  </div>
                  {alert.evidence.zoneName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Geofence Zone:</span>
                      <span className="text-amber-300 font-medium">{alert.evidence.zoneName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[9px]">
                    <span className="text-slate-400">Suggested Action:</span>
                    <span className="font-mono font-bold text-amber-300 uppercase">
                      {alert.suggestedAction}
                    </span>
                  </div>
                </div>

                {/* Nearest Patrol Quick Action */}
                {!isResolved && (() => {
                  const targetVessel = vessels.find((v) => v.id === alert.targetId || v.name === alert.targetName);
                  // Prefers a unit already RESPONDING to this alert/target, else the closest AVAILABLE
                  // unit, so distance/ETA always describe the unit named in the row.
                  const nearestInfo = targetVessel
                    ? findNearestPatrol(targetVessel.lat, targetVessel.lon, patrolUnits, targetVessel.id, alert.alertId)
                    : null;

                  if (!nearestInfo) return null;

                  const activePatrol = nearestInfo.patrol;
                  const isAssigned = nearestInfo.isDispatchedToThisTarget;
                  const distanceKm = nearestInfo.distanceKm;
                  const etaMinutes = nearestInfo.etaMinutes;

                  return (
                    <div className="flex items-center justify-between p-1.5 rounded bg-[#071326] border border-sky-900/80 mb-2 text-[9.5px]">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Anchor className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>
                          <strong className="text-sky-300 font-mono">{activePatrol.id}</strong>{' '}
                          <span className="text-slate-400">({distanceKm.toFixed(1)} km • ETA {etaMinutes}m)</span>
                        </span>
                      </div>
                      {onDispatchPatrol && onRecallPatrol && (
                        isAssigned || activePatrol.status === 'RESPONDING' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRecallPatrol(activePatrol.id);
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-mono text-[8.5px] font-bold"
                          >
                            RECALL
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDispatchPatrol(alert.alertId, activePatrol.id);
                            }}
                            disabled={activePatrol.status === 'BUSY'}
                            className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono text-[8.5px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>DISPATCH</span>
                          </button>
                        )
                      )}
                    </div>
                  );
                })()}

                {/* Disposition Status or Action Controls */}
                {isResolved ? (
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                    <span>
                      State: <strong className="text-slate-200">{alert.currentState}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      {alert.disposition && (
                        <span className="text-slate-400">
                          {alert.disposition.action} • {alert.disposition.reason}
                        </span>
                      )}
                      {onGenerateReport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateReport(alert);
                          }}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/80 text-[8.5px] transition-colors"
                          title="Generate Incident Dossier"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>Dossier</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectTarget(alert.targetId)}
                        className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition-colors"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Locate</span>
                      </button>
                      {onGenerateReport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateReport(alert);
                          }}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/80 text-[8.5px] transition-colors"
                          title="Generate Incident Dossier"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>Report</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[9px]">
                      <button
                        onClick={() => handleOpenDisposition(alert, 'CONFIRM')}
                        className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 transition-colors"
                      >
                        CONFIRM
                      </button>
                      <button
                        onClick={() => handleOpenDisposition(alert, 'DISMISS')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                      >
                        DISMISS
                      </button>
                      <button
                        onClick={() => handleOpenDisposition(alert, 'ESCALATE')}
                        className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 transition-colors"
                      >
                        ESCALATE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
