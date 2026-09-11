import React, { useState } from 'react';
import { X, Pentagon, Square, Circle, AlertTriangle, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { MaritimeArea } from '../types/maritime';

interface AreaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  areas: MaritimeArea[];
  onAddArea: (area: MaritimeArea) => void;
  onRemoveArea: (areaId: string) => void;
  onActivateRedZone: (zoneCode: string, durationMinutes: number) => void;
  activeRedZone: { code: string; expiresAt: string; expired: boolean } | null;
}

export const AreaDrawer: React.FC<AreaDrawerProps> = ({
  isOpen,
  onClose,
  areas,
  onAddArea,
  onRemoveArea,
  onActivateRedZone,
  activeRedZone,
}) => {
  const [newAreaName, setNewAreaName] = useState('CHENNAI COASTAL AREA');
  const [areaType, setAreaType] = useState<'polygon' | 'rectangle' | 'circle'>('polygon');

  if (!isOpen) return null;

  const handleCreateSampleArea = () => {
    const newArea: MaritimeArea = {
      id: `AREA-${Date.now()}`,
      name: newAreaName || 'Custom Maritime Area',
      type: areaType,
      coordinates: [
        [80.15, 13.00],
        [80.50, 13.00],
        [80.50, 13.40],
        [80.15, 13.40],
        [80.15, 13.00],
      ],
      status: 'ACTIVE',
    };
    onAddArea(newArea);
    setNewAreaName('');
  };

  return (
    <div className="absolute right-14 top-14 z-30 w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3.5 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Geofenced Maritime Areas
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2 space-y-3 text-xs">
        {/* TEMPORARY RED ZONE (ZONE-08) SECTION */}
        <div className="bg-rose-50 border border-rose-200 rounded-md p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[11px] text-rose-800 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>TEMPORARY RED ZONE</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-rose-200/80 text-rose-900 px-1 rounded">
              ZONE-08
            </span>
          </div>

          {activeRedZone ? (
            <div className="space-y-1 mt-1 text-[11px]">
              <div className="flex justify-between text-rose-700">
                <span>Expires:</span>
                <span className="font-mono font-bold">{activeRedZone.expiresAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-600 font-medium">Status:</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  activeRedZone.expired ? 'bg-slate-200 text-slate-700' : 'bg-rose-600 text-white animate-pulse'
                }`}>
                  {activeRedZone.expired ? 'ZONE EXPIRED' : 'ACTIVE EXCLUSION'}
                </span>
              </div>
              {!activeRedZone.expired && (
                <div className="text-[10px] text-rose-700 font-semibold mt-1">
                  Alert: OUT OF ENVELOPE trigger enabled
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-rose-700 mb-2 leading-tight">
                Activate dynamic exclusion area to monitor vessel ingress violations.
              </p>
              <button
                onClick={() => onActivateRedZone('ZONE-08', 45)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-1 px-2 rounded text-[11px] transition-colors"
              >
                Activate ZONE-08 (45 min)
              </button>
            </div>
          )}
        </div>

        {/* CREATE CUSTOM AREA */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Define Area
          </span>
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setAreaType('polygon')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded border flex items-center justify-center gap-1 ${
                areaType === 'polygon' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Pentagon className="w-3 h-3" />
              <span>Polygon</span>
            </button>
            <button
              onClick={() => setAreaType('rectangle')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded border flex items-center justify-center gap-1 ${
                areaType === 'rectangle' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Square className="w-3 h-3" />
              <span>Rectangle</span>
            </button>
            <button
              onClick={() => setAreaType('circle')}
              className={`flex-1 py-1 text-[10px] font-semibold rounded border flex items-center justify-center gap-1 ${
                areaType === 'circle' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Circle className="w-3 h-3" />
              <span>Circle</span>
            </button>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. CHENNAI COASTAL AREA"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-sky-500"
            />
            <button
              onClick={handleCreateSampleArea}
              className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* CURRENT AREAS LIST */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Geofences ({areas.length})
          </span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {areas.map(a => (
              <div
                key={a.id}
                className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200/60"
              >
                <div>
                  <div className="font-semibold text-slate-800 text-[11px]">{a.name}</div>
                  <div className="text-[9px] text-slate-400 uppercase">{a.type} • {a.status}</div>
                </div>
                <button
                  onClick={() => onRemoveArea(a.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove area"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
