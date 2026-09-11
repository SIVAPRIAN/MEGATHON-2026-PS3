import React, { useState } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { AuditLogEntry } from '../types/maritime';
import { Download, ShieldCheck } from 'lucide-react';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ZONES' | 'ALERTS' | 'PATROL' | 'CORRELATION'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType === 'ZONES') {
      if (!log.eventType.startsWith('ZONE_') && !log.eventType.includes('ZONE')) return false;
    } else if (filterType === 'ALERTS') {
      if (!log.eventType.startsWith('ALERT_')) return false;
    } else if (filterType === 'PATROL') {
      if (!log.eventType.startsWith('PATROL_')) return false;
    } else if (filterType === 'CORRELATION') {
      if (!log.eventType.includes('CORRELATION')) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        log.eventId.toLowerCase().includes(term) ||
        log.targetId.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.reason.toLowerCase().includes(term) ||
        log.eventType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `coastal_surveillance_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Append-Only Audit Trail"
      badge={`${auditLogs.length} RECORDS`}
      icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
      headerAction={
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9.5px] font-mono text-slate-200 transition-colors shadow-xs"
          title="Export tamper-evident audit trail as JSON"
        >
          <Download className="w-2.5 h-2.5" />
          <span>EXPORT</span>
        </button>
      }
    >
      {/* Filter / Search Bar */}
      <div className="px-3 py-1.5 bg-[#0b111e] border-b border-slate-800 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1 font-mono">
          {(['ALL', 'ZONES', 'ALERTS', 'PATROL', 'CORRELATION'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === cat
                  ? 'bg-slate-700 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search records..."
          className="w-36 px-2 py-0.5 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[10px] placeholder:text-slate-500 font-mono focus:border-sky-500 focus:outline-none"
        />
      </div>

      {/* Records Table / List */}
      <div className="p-2 space-y-1.5 max-h-[calc(100vh-210px)] overflow-y-auto font-mono text-[10px]">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 italic font-sans">
            No audit records matching current filter.
          </div>
        ) : (
          [...filteredLogs].reverse().map((log) => {
            const isBlindSpot = log.eventType.startsWith('BLIND_SPOT_');
            const isPatrol = log.eventType.startsWith('PATROL_');
            const isAlert = log.eventType.startsWith('ALERT_');
            const isZone = log.eventType.startsWith('ZONE_');
            const isVessel = log.eventType.includes('VESSEL_');
            const isCorrelation = log.eventType.includes('CORRELATION');

            const eventColor = isBlindSpot
              ? 'text-rose-400'
              : isPatrol
              ? 'text-sky-300'
              : isAlert
              ? 'text-rose-400'
              : isZone
              ? 'text-amber-400'
              : isCorrelation
              ? 'text-sky-400'
              : isVessel
              ? 'text-amber-300'
              : 'text-slate-300';

            return (
              <div
                key={log.eventId}
                className="p-2 bg-[#111827] border border-slate-800 rounded hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-0.5 text-[9px]">
                  <span className={`font-bold ${eventColor}`}>{log.eventType}</span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>

                <div className="flex items-center justify-between text-slate-200 text-[10px]">
                  <span>
                    Target: <strong className="text-slate-100">{log.targetId}</strong>
                  </span>
                  <span className="text-slate-400 text-[8.5px]">OP: {log.operatorId}</span>
                </div>

                <div className="text-slate-400 text-[9px] mt-0.5 flex items-center justify-between">
                  <span className="truncate max-w-[220px]">Action: {log.action}</span>
                  {log.reason && <span className="text-amber-300 font-semibold">{log.reason}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
