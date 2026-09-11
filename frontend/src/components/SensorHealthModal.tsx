import React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Radio } from 'lucide-react';
import { EOCamera } from '../types/maritime';

interface SensorHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: EOCamera[];
  isAisOnline: boolean;
  onToggleAisStatus?: () => void;
  onSelectCamera: (cam: EOCamera) => void;
}

export const SensorHealthModal: React.FC<SensorHealthModalProps> = ({
  isOpen,
  onClose,
  cameras,
  isAisOnline,
  onToggleAisStatus,
  onSelectCamera,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-3.5 top-[86px] z-30 w-80 bg-slate-900/95 backdrop-blur-md rounded border border-slate-800 p-3.5 text-slate-100 select-none shadow-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-200">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sensor Network Diagnostics</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2.5 space-y-2.5 text-xs divide-y divide-slate-800/80">
        {/* Coastal AIS Receiver Network */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-semibold text-slate-200 text-[11px]">Coastal AIS Transponder Network</div>
            <div className="text-[9.5px] text-slate-400">National DGLL coastal receivers</div>
          </div>
          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
            isAisOnline ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
          }`}>
            {isAisOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Spaceborne SAR / Radar - Explicitly Future Scope */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="font-semibold text-slate-300 text-[11px]">Spaceborne SAR / Coastal Radar</div>
            <div className="text-[9.5px] text-slate-500">Telemetry feed integration</div>
          </div>
          <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
            PLANNED
          </span>
        </div>

        {/* Coastal EO Cameras list */}
        <div className="pt-2.5">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Optical Surveillance Posts</span>
            <span className="font-mono text-slate-500">{cameras.length} STATIONS</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {cameras.slice(0, 6).map(cam => (
              <button
                key={cam.id}
                onClick={() => {
                  onSelectCamera(cam);
                  onClose();
                }}
                className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors text-left"
              >
                <span className="font-mono text-slate-300 truncate text-[10.5px]">
                  {cam.id} • <span className="text-slate-400 font-sans">{cam.name.split(' ')[0]}</span>
                </span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[8.5px] font-bold ${
                  cam.status === 'ONLINE' 
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' 
                    : cam.status === 'STALE'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {cam.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
