import React from 'react';
import { SidebarPanel } from './SidebarPanel';
import { Play, Sliders, ShieldAlert, Radio, Trash2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (scenarioNumber: number) => void;
}

export const DemoScenariosModal: React.FC<DemoScenariosModalProps> = ({
  isOpen,
  onClose,
  onRunScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      num: 1,
      title: 'Scenario 1: Optical Detection + AIS Match',
      desc: 'Coastal station PSS Madras (CAM-04) observes VSL-003. Live AIS telemetry matches optical fix within 486m.',
      expected: 'Status: CORRELATED (Navy/Sky silhouette)',
      icon: <Radio className="w-4 h-4 text-sky-400" />,
      badge: 'CORRELATED',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      num: 2,
      title: 'Scenario 2: Optical Detection with No AIS',
      desc: 'Optical sighting CAM-04 detects an unidentified trawler with no transponder response within 5 NM search radius.',
      expected: 'Status: DARK VESSEL (Red silhouette)',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      badge: 'DARK VESSEL',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      num: 3,
      title: 'Scenario 3: Dark Target Dynamically Correlated with New AIS',
      desc: 'New AIS transponder transmission arrives for previously dark vessel. Re-evaluates spatial match and updates correlation.',
      expected: 'Transition: DARK (Red) → CORRELATED (Navy) dynamically',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      badge: 'RE-CORRELATION',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      num: 4,
      title: 'Scenario 4: Vessel Enters Active Restricted Zone',
      desc: 'Commercial ship VSL-011 transits across the perimeter of RESTRICTED AREA 01.',
      expected: 'Turns AMBER (Violation) + Generates Geofence Alert',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      badge: 'ENTRY VIOLATION',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      num: 5,
      title: 'Scenario 5: Zone Deletion & Immediate Status Recovery',
      desc: 'Operator deletes the restricted zone. Map layer instantly clears and vessels revert to normal state.',
      expected: 'Zone deleted → Amber cleared → Underlying state restored',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      badge: 'ZONE DELETION',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      num: 6,
      title: 'Scenario 6: Automatic Zone Expiry Handling',
      desc: 'Sets a 5-second auto-expiry demonstration on Cautionary Anchorage. Zone expires without page reload.',
      expected: 'Countdown expires → Zone removed → Log: ZONE_EXPIRED',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      badge: 'AUTO-EXPIRY',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      num: 7,
      title: 'Scenario 7: Operator Alert Disposition Workflow',
      desc: 'Operator investigates an active alert and applies CONFIRM / DISMISS with mandatory Reason Code.',
      expected: 'Alert state updated + Written to append-only audit trail',
      icon: <CheckCircle2 className="w-4 h-4 text-sky-400" />,
      badge: 'DISPOSITION',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
    },
  ];

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Surveillance Scenarios"
      badge="SCENARIOS 1–7"
      icon={<Sliders className="w-4 h-4 text-sky-400" />}
    >
      <div className="px-3 py-1.5 bg-[#0b111e] border-b border-slate-800 text-[10px] text-slate-400">
        Click any scenario below to execute and visibly test surveillance behavior:
      </div>

      {/* Scenarios List */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto">
        {scenarios.map((s) => (
          <div
            key={s.num}
            className="p-2.5 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {s.icon}
                <span className="text-[11px] font-bold text-slate-100">{s.title}</span>
              </div>
              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${s.badgeColor}`}>
                {s.badge}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-snug mb-1.5">{s.desc}</p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-emerald-400 font-mono text-[9px] font-semibold">{s.expected}</span>
              <button
                onClick={() => {
                  onRunScenario(s.num);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] shadow-xs transition-colors"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>EXECUTE</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </SidebarPanel>
  );
};
