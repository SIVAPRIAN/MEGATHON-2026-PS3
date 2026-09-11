import React from 'react';
import { X, Sliders, Play, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';

export type ScenarioType = 
  | 'NORMAL' 
  | 'AIS_OFFLINE' 
  | 'AIS_STALE' 
  | 'FALSE_EO' 
  | 'AIS_INCONSISTENCY' 
  | 'TEMP_RED_ZONE';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: ScenarioType;
  onSelectScenario: (scenario: ScenarioType) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  activeScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'NORMAL' as ScenarioType,
      title: 'India Maritime Surveillance (Default)',
      desc: 'Standard live operational feed with correlated vessels, dark vessel detections, and active coastal EO cameras.',
      badge: 'STANDARD',
      color: 'sky'
    },
    {
      id: 'AIS_OFFLINE' as ScenarioType,
      title: 'AIS Source Offline',
      desc: 'Correlations are suspended with warning banner. Detections are NOT falsely marked as dark.',
      badge: 'SUSPENDED',
      color: 'amber'
    },
    {
      id: 'AIS_STALE' as ScenarioType,
      title: 'AIS Reception Stale',
      desc: 'AIS stream degraded. Dark correlations flagged as UNVERIFIED rather than confirmed dark targets.',
      badge: 'UNVERIFIED',
      color: 'amber'
    },
    {
      id: 'FALSE_EO' as ScenarioType,
      title: 'False EO Detection Rejection',
      desc: '54% confidence single-frame optical wake glitch rejected as UNCONFIRMED without raising an alarm.',
      badge: 'REJECTED',
      color: 'slate'
    },
    {
      id: 'AIS_INCONSISTENCY' as ScenarioType,
      title: 'AIS / EO Spatial Inconsistency',
      desc: 'Vessel detected by optical sensor 34 km away from its reported AIS transponder coordinates.',
      badge: 'DISCREPANCY',
      color: 'rose'
    },
    {
      id: 'TEMP_RED_ZONE' as ScenarioType,
      title: 'Temporary Red Zone (ZONE-08)',
      desc: 'Active exclusion polygon with live countdown timer. Triggers OUT OF ENVELOPE notification on vessel crossing.',
      badge: 'ZONE-08',
      color: 'rose'
    }
  ];

  return (
    <div className="absolute right-3.5 top-[86px] z-30 w-88 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3.5 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          <span>Demonstration Scenarios</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2 space-y-2 max-h-96 overflow-y-auto pr-1">
        {scenarios.map(s => {
          const isActive = activeScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                onSelectScenario(s.id);
                onClose();
              }}
              className={`w-full text-left p-2.5 rounded-md border transition-all ${
                isActive
                  ? 'bg-sky-50/90 border-sky-400 ring-1 ring-sky-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800">{s.title}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-sky-200 text-sky-900' : 'bg-slate-100 text-slate-600'
                }`}>
                  {s.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {s.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
