import React, { useState } from 'react';
import {
  IncidentReport,
  MaritimeAlert,
  PatrolUnit,
  AuditLogEntry,
} from '../types/maritime';
import { Vessel } from '../data/vessels';
import {
  exportReportToMarkdown,
  downloadReportFile,
} from '../utils/reportGenerator';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  ShieldAlert,
  Ship,
  Radio,
  Navigation,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  Award,
  Edit3,
} from 'lucide-react';

export interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IncidentReport | null;
  onUpdateNotes?: (notes: string) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sensor' | 'tactical' | 'timeline' | 'printable'>('overview');
  const [notes, setNotes] = useState(report?.investigatorNotes || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopySitrep = () => {
    const sitrep = `[TACTICAL SITREP // REVENANT-0]
REPORT: ${report.reportId}
CLASSIFICATION: ${report.classification}
DATE: ${report.generatedAt.slice(0, 19)} UTC (${report.generatedAtIST})
INCIDENT: ${report.incidentType} (PRIORITY: ${report.priority})
TARGET: ${report.targetVessel.name} [${report.targetVessel.id}] (${report.targetVessel.status})
POS: ${report.coordinates.dms} [${report.locationDescription}]
SOG/COG: ${report.targetVessel.speedKnots} KTS / ${report.targetVessel.courseHeadingDeg}° TRUE
SENSOR: ${report.sensorTelemetry.detectingSensor} (AI CONF: ${report.sensorTelemetry.aiConfidencePercent}%)
TASKED UNIT: ${report.tacticalResponse.patrolAssigned ? `${report.tacticalResponse.patrolAssigned.id} (ETA: ${report.tacticalResponse.patrolAssigned.etaMinutes} MIN)` : 'NONE'}
DIRECTIVES: ${report.recommendedDirectives.join('; ')}
SEAL: ${report.signatureVerificationCode}`;

    navigator.clipboard.writeText(sitrep);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const md = exportReportToMarkdown({ ...report, investigatorNotes: notes });
    downloadReportFile(`${report.reportId}.md`, md, 'text/markdown');
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify({ ...report, investigatorNotes: notes }, null, 2);
    downloadReportFile(`${report.reportId}.json`, jsonStr, 'application/json');
  };

  const handlePrint = () => {
    window.print();
  };

  const isCritical = report.priority === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 select-none animate-in fade-in duration-150">
      {/* Print styles injected for clean PDF generation */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-incident-dossier, #printable-incident-dossier * {
            visibility: visible !important;
          }
          #printable-incident-dossier {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 24px !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b1329] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#070d1d] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/50 text-cyan-400 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider uppercase text-slate-100 font-mono">
                  MARITIME INCIDENT DOSSIER
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
                  {report.reportId}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  isCritical ? 'bg-rose-900/80 text-rose-300 border border-rose-500/50' : 'bg-amber-900/80 text-amber-300 border border-amber-500/50'
                }`}>
                  {report.priority} PRIORITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {report.commandAuthority} • {report.generatedAtIST}
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Print official document or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Export formatted Markdown dossier"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Markdown</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Export structured JSON intelligence packet"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleCopySitrep}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copy rapid tactical SitRep for transmission"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY SITREP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Classification Banner */}
        <div className="px-5 py-1 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/30 flex items-center justify-between text-[10px] font-mono tracking-widest text-amber-300 font-bold uppercase">
          <span>CLASSIFICATION: {report.classification}</span>
          <span className="hidden sm:inline">SECTOR: {report.locationDescription}</span>
          <span>AUTH: {report.reportingOfficer}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-[#0d172e] border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Target & Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('sensor')}
            className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'sensor'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Sensor & AI Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('tactical')}
            className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'tactical'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Tactical Intercept</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'timeline'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('printable')}
            className={`pb-2.5 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'printable'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Complete Formal Dossier</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW & TARGET */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Executive Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Case Status</span>
                  <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {report.operationalStatus}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Incident Type</span>
                  <div className="text-sm font-bold text-cyan-400 mt-1 truncate">
                    {report.incidentType}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Jurisdiction</span>
                  <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                    {report.jurisdictionZone.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Target Status</span>
                  <div className="text-sm font-bold mt-1 text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {report.targetVessel.status}
                  </div>
                </div>
              </div>

              {/* Target Vessel Intelligence Profile */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Target Vessel Intelligence Dossier
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {report.targetVessel.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Vessel Name</span>
                    <span className="font-bold text-slate-100 text-sm">{report.targetVessel.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Vessel Type</span>
                    <span className="font-semibold text-slate-200">{report.targetVessel.vesselType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Flag State</span>
                    <span className="font-semibold text-slate-200">{report.targetVessel.flag}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">MMSI Transponder</span>
                    <span className="font-mono text-slate-200">{report.targetVessel.mmsi}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Speed over Ground</span>
                    <span className="font-semibold text-cyan-400">{report.targetVessel.speedKnots} kts</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Course over Ground</span>
                    <span className="font-semibold text-slate-200">{report.targetVessel.courseHeadingDeg}° True</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Vessel Length</span>
                    <span className="font-semibold text-slate-200">{report.targetVessel.lengthMeters} m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">AIS Broadcast</span>
                    <span className="font-mono text-rose-400 font-bold">{report.targetVessel.aisBroadcastStatus}</span>
                  </div>
                </div>

                {/* Location Box */}
                <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-mono font-bold text-slate-100">{report.coordinates.dms}</span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        ({report.coordinates.lat.toFixed(5)}°, {report.coordinates.lon.toFixed(5)}°)
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {report.locationDescription}
                  </span>
                </div>
              </div>

              {/* Investigator Remarks Box */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    Investigating Officer Findings & Operational Directives
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Officer: {report.reportingOfficer}
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    onUpdateNotes?.(e.target.value);
                  }}
                  rows={3}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400 leading-relaxed resize-none font-sans"
                  placeholder="Enter investigating officer remarks, operational recommendations, or court-admissible testimony..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: SENSOR & AI EVIDENCE */}
          {activeTab === 'sensor' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Primary Coastal Optical Shore Station Telemetry
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {report.sensorTelemetry.detectingSensor}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Sensor Modality</span>
                    <span className="font-semibold text-slate-100">{report.sensorTelemetry.sensorType}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Boresight Azimuth & FOV</span>
                    <span className="font-semibold text-cyan-400">
                      {report.sensorTelemetry.sensorAzimuthDeg}° True ({report.sensorTelemetry.sensorFovDeg}° Wedge)
                    </span>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Effective Range</span>
                    <span className="font-semibold text-slate-100">{report.sensorTelemetry.sensorRangeKm} km offshore</span>
                  </div>
                </div>

                {/* Computer Vision Classification */}
                <div className="p-3.5 rounded bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-xs text-slate-200">
                        {report.sensorTelemetry.aiModelUsed}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {report.sensorTelemetry.aiConfidencePercent}% CONFIDENCE
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${report.sensorTelemetry.aiConfidencePercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Target silhouette was automatically segmented and tracked by real-time neural network vision models. Sighting correlated with coastal radar track with 0 matching AIS broadcast fixes within 5.0 NM radius.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TACTICAL INTERCEPT */}
          {activeTab === 'tactical' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Law Enforcement Patrol Tasking & Intercept Status
                    </span>
                  </div>
                  {report.tacticalResponse.patrolAssigned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                      {report.tacticalResponse.patrolAssigned.status}
                    </span>
                  )}
                </div>

                {report.tacticalResponse.patrolAssigned ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">Assigned Patrol Craft</span>
                      <span className="font-bold text-slate-100 text-sm">
                        {report.tacticalResponse.patrolAssigned.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {report.tacticalResponse.patrolAssigned.name}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">Home Base Station</span>
                      <span className="font-semibold text-slate-200">
                        {report.tacticalResponse.patrolAssigned.baseStation}
                      </span>
                    </div>

                    <div className="p-3 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">Distance to Target</span>
                      <span className="font-bold text-cyan-400 text-sm">
                        {report.tacticalResponse.patrolAssigned.distanceKm} km
                      </span>
                    </div>

                    <div className="p-3 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[11px] block">Estimated Intercept</span>
                      <span className="font-bold text-amber-400 text-sm">
                        ~{report.tacticalResponse.patrolAssigned.etaMinutes} mins
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded bg-slate-950/70 border border-slate-800 text-center text-slate-400 text-xs">
                    No active patrol craft dispatched to this target. Standby units available at Sector Base.
                  </div>
                )}

                {/* Mitigation Directives Checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Mitigation Actions Executed
                  </span>
                  <div className="space-y-1.5">
                    {report.tacticalResponse.mitigationActionsTaken.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FORENSIC TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Chronological Event Sequence & Forensic Audit Trail
                </span>

                <div className="space-y-2.5">
                  {report.timeline.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded bg-slate-950/80 border border-slate-800/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-cyan-400 text-[11px] font-bold shrink-0 mt-0.5">
                          {item.timestamp}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                            <span>{item.event}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                              {item.source}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLETE PRINTABLE / PDF PREVIEW */}
          {activeTab === 'printable' && (
            <div
              id="printable-incident-dossier"
              className="p-6 sm:p-8 rounded-lg bg-white text-slate-900 shadow-xl space-y-6 font-serif border border-slate-300"
            >
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-[10px] tracking-widest font-mono font-bold uppercase text-slate-600 mb-1">
                  GOVERNMENT OF INDIA • MINISTRY OF PORTS, SHIPPING & WATERWAYS
                </div>
                <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900 font-sans">
                  DIRECTORATE GENERAL OF LIGHTHOUSES AND LIGHTSHIPS
                </h1>
                <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-700 font-sans mt-0.5">
                  NATIONAL AUTOMATIC IDENTIFICATION SYSTEM (NAIS) • MARITIME INCIDENT DOSSIER
                </h2>
                <div className="mt-2 inline-block px-3 py-1 bg-red-100 border border-red-400 text-red-800 font-mono text-xs font-bold uppercase tracking-wider">
                  SECURITY CLASSIFICATION: {report.classification}
                </div>
              </div>

              {/* Dossier Meta Table */}
              <table className="w-full text-xs font-sans border-collapse border border-slate-400">
                <tbody>
                  <tr className="bg-slate-100">
                    <td className="p-2 border border-slate-400 font-bold w-1/4">REPORT IDENTIFIER:</td>
                    <td className="p-2 border border-slate-400 font-mono font-bold text-sky-900">{report.reportId}</td>
                    <td className="p-2 border border-slate-400 font-bold w-1/4">DATE / TIME (UTC):</td>
                    <td className="p-2 border border-slate-400 font-mono">{report.generatedAt.replace('T', ' ').slice(0, 19)} UTC</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-400 font-bold">CASE STATUS:</td>
                    <td className="p-2 border border-slate-400 font-bold">{report.operationalStatus}</td>
                    <td className="p-2 border border-slate-400 font-bold">TIME (IST):</td>
                    <td className="p-2 border border-slate-400 font-mono">{report.generatedAtIST}</td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td className="p-2 border border-slate-400 font-bold">GEOGRAPHIC SECTOR:</td>
                    <td className="p-2 border border-slate-400">{report.locationDescription}</td>
                    <td className="p-2 border border-slate-400 font-bold">COORDINATES:</td>
                    <td className="p-2 border border-slate-400 font-mono">{report.coordinates.dms}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-400 font-bold">JURISDICTION ZONE:</td>
                    <td className="p-2 border border-slate-400">{report.jurisdictionZone}</td>
                    <td className="p-2 border border-slate-400 font-bold">INVESTIGATING DESK:</td>
                    <td className="p-2 border border-slate-400">{report.reportingOfficer}</td>
                  </tr>
                </tbody>
              </table>

              {/* Section 1: Target Profile */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans border-b border-slate-300 pb-1 text-slate-800">
                  SECTION 1: TARGET VESSEL IDENTIFICATION & TELEMETRY
                </h3>
                <table className="w-full text-xs font-sans border-collapse border border-slate-300">
                  <tbody>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 w-1/4">Target ID:</td>
                      <td className="p-1.5 border border-slate-300 font-mono">{report.targetVessel.id}</td>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50 w-1/4">Vessel Name:</td>
                      <td className="p-1.5 border border-slate-300 font-bold">{report.targetVessel.name}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">Vessel Classification:</td>
                      <td className="p-1.5 border border-slate-300">{report.targetVessel.vesselType}</td>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">Operational Status:</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-red-700">{report.targetVessel.status}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">Speed (SOG):</td>
                      <td className="p-1.5 border border-slate-300">{report.targetVessel.speedKnots} knots</td>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">Course (COG):</td>
                      <td className="p-1.5 border border-slate-300">{report.targetVessel.courseHeadingDeg}° True</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">MMSI Transponder:</td>
                      <td className="p-1.5 border border-slate-300 font-mono">{report.targetVessel.mmsi}</td>
                      <td className="p-1.5 border border-slate-300 font-bold bg-slate-50">AIS Status:</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-red-600">{report.targetVessel.aisBroadcastStatus}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Sensor Evidence */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans border-b border-slate-300 pb-1 text-slate-800">
                  SECTION 2: SENSOR TELEMETRY & COMPUTER VISION EVIDENCE
                </h3>
                <p className="text-xs leading-relaxed text-slate-700">
                  Contact verified by shore station <strong>{report.sensorTelemetry.detectingSensor}</strong> with optical boresight azimuth at {report.sensorTelemetry.sensorAzimuthDeg}° ({report.sensorTelemetry.sensorFovDeg}° FOV). Automated computer vision model <em>{report.sensorTelemetry.aiModelUsed}</em> confirmed target classification with <strong>{report.sensorTelemetry.aiConfidencePercent}% confidence</strong>.
                </p>
              </div>

              {/* Section 3: Officer Findings & Directives */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans border-b border-slate-300 pb-1 text-slate-800">
                  SECTION 3: INVESTIGATING OFFICER FINDINGS & DIRECTIVES
                </h3>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 italic leading-relaxed">
                  "{notes || report.investigatorNotes}"
                </div>

                <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 mt-2">
                  {report.recommendedDirectives.map((dir, i) => (
                    <li key={i}>{dir}</li>
                  ))}
                </ol>
              </div>

              {/* Section 4: Signature Block */}
              <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs font-sans">
                <div>
                  <div className="font-mono text-[10px] text-slate-500">ELECTRONIC VERIFICATION CODE:</div>
                  <div className="font-mono font-bold text-slate-800">{report.signatureVerificationCode}</div>
                  <div className="text-[10px] text-slate-500 mt-1">REVENANT-0 MARITIME INTELLIGENCE PLATFORM</div>
                </div>

                <div className="text-right">
                  <div className="w-48 border-b border-slate-800 pb-1 mb-1 text-center font-serif italic text-sm">
                    OPERATOR-01
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-700 text-center">
                    DUTY WATCH OFFICER / INVESTIGATING OFFICER
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-5 py-2.5 bg-[#070d1d] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>ELECTRONIC SEAL: {report.signatureVerificationCode}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
            >
              Print / Save PDF
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadMarkdown}
              className="text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer"
            >
              Download Markdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
