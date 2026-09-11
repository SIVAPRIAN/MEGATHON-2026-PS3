import React, { useState } from 'react';
import { ShieldAlert, Check, Clock, Calendar, AlertTriangle, EyeOff } from 'lucide-react';
import { Modal } from './Modal';
import { ZoneType } from '../types/maritime';

interface SaveAreaModalProps {
  isOpen: boolean;
  defaultName: string;
  hasCameraCoverage?: boolean;
  nearestCameraDistanceKm?: number;
  onSave: (
    name: string,
    zoneType: ZoneType,
    expiresInMinutes?: number,
    startTime?: string,
    expiresAt?: string
  ) => void;
  onCancel: () => void;
}

export const SaveAreaModal: React.FC<SaveAreaModalProps> = ({
  isOpen,
  defaultName,
  hasCameraCoverage = true,
  nearestCameraDistanceKm,
  onSave,
  onCancel,
}) => {
  const [areaName, setAreaName] = useState(defaultName);
  const [zoneType, setZoneType] = useState<ZoneType>('RED');
  const [durationOption, setDurationOption] = useState<string>('NONE');
  const [startOption, setStartOption] = useState<'NOW' | '15m' | '1h' | 'CUSTOM'>('NOW');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    let startDate = new Date();
    if (startOption === '15m') {
      startDate = new Date(Date.now() + 15 * 60 * 1000);
    } else if (startOption === '1h') {
      startDate = new Date(Date.now() + 60 * 60 * 1000);
    } else if (startOption === 'CUSTOM' && customStart) {
      startDate = new Date(customStart);
    }

    let endDate: Date | undefined = undefined;
    let mins: number | undefined = undefined;

    if (durationOption === '15m') mins = 15;
    else if (durationOption === '30m') mins = 30;
    else if (durationOption === '1h') mins = 60;
    else if (durationOption === '4h') mins = 240;
    else if (durationOption === '24h') mins = 1440;
    else if (durationOption === 'CUSTOM' && customEnd) {
      const eD = new Date(customEnd);
      if (!isNaN(eD.getTime()) && eD.getTime() > startDate.getTime()) {
        endDate = eD;
        mins = Math.round((eD.getTime() - startDate.getTime()) / (60 * 1000));
      }
    }

    if (mins && !endDate) {
      endDate = new Date(startDate.getTime() + mins * 60 * 1000);
    }

    const startIso = startDate.toISOString();
    const endIso = endDate ? endDate.toISOString() : undefined;

    onSave(areaName.trim(), zoneType, mins, startIso, endIso);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Establish Maritime Geofence Zone"
      icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[11px] text-slate-200 font-sans">
        {/* Blind Spot Camera Coverage Warning Banner */}
        {!hasCameraCoverage && (
          <div className="p-2.5 rounded bg-[#200e13] border border-rose-600/90 text-rose-200 text-[10.5px] space-y-1 shadow-inner">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold uppercase tracking-wider text-[10px]">
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Camera Coverage Warning (Sensor Blind Spot)</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-tight">
              This restricted zone has <strong>0% coastal EO optical camera coverage</strong>
              {nearestCameraDistanceKm !== undefined && nearestCameraDistanceKm < 999
                ? ` (nearest sensor station is ${nearestCameraDistanceKm.toFixed(1)} km away)`
                : ''}. Dark vessels without AIS transponders cannot be optically detected in this area.
            </div>
            <div className="text-[9px] text-rose-300/90 pt-0.5 border-t border-rose-900/60 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>An unmonitored blind-spot operational alert will be automatically registered upon creation.</span>
            </div>
          </div>
        )}

        {/* Zone Name */}
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Zone Designation
          </label>
          <input
            type="text"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#0b111e] border border-slate-700 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500 transition-colors"
            placeholder="RESTRICTED AREA 01"
            autoFocus
          />
        </div>

        {/* Zone Security Classification */}
        <div>
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Zone Classification
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'RED' as ZoneType, label: 'RED', sub: 'Exclusion', border: 'border-rose-500', bg: 'bg-rose-950 text-rose-200' },
              { id: 'YELLOW' as ZoneType, label: 'YELLOW', sub: 'Cautionary', border: 'border-amber-500', bg: 'bg-amber-950 text-amber-200' },
              { id: 'GREEN' as ZoneType, label: 'GREEN', sub: 'Safe Transit', border: 'border-emerald-500', bg: 'bg-emerald-950 text-emerald-200' },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setZoneType(z.id)}
                className={`py-1.5 px-1.5 rounded border text-center transition-colors ${
                  zoneType === z.id
                    ? `${z.border} ${z.bg} font-bold`
                    : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="block text-[10px] font-mono leading-none">{z.label}</span>
                <span className="block text-[8px] text-slate-400 leading-tight mt-0.5">{z.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TIME RANGE & OPERATIONAL WINDOW CONFIGURATION                 */}
        {/* ------------------------------------------------------------- */}
        <div className="p-2.5 bg-[#0b111e] border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Operational Time Range & Validity</span>
            </label>
            <span className="text-[8px] text-slate-500 font-mono">Temporal Geofence</span>
          </div>

          {/* Start Time Mode */}
          <div>
            <span className="text-[8.5px] font-mono text-slate-400 uppercase block mb-1">
              Window Activation Time:
            </span>
            <div className="grid grid-cols-4 gap-1 font-mono text-[9px]">
              {[
                { id: 'NOW', label: 'Immediate' },
                { id: '15m', label: '+15m Delay' },
                { id: '1h', label: '+1h Delay' },
                { id: 'CUSTOM', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStartOption(opt.id as any)}
                  className={`py-1 rounded border text-center transition-colors ${
                    startOption === opt.id
                      ? 'border-sky-500 bg-sky-950 text-sky-200 font-bold'
                      : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {startOption === 'CUSTOM' && (
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full mt-1.5 px-2 py-1 bg-[#0f172a] border border-slate-700 rounded text-slate-200 font-mono text-[9.5px] focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* Validity Duration / Expiration */}
          <div>
            <span className="text-[8.5px] font-mono text-slate-400 uppercase block mb-1">
              Active Duration / Expiry:
            </span>
            <div className="grid grid-cols-7 gap-1 text-[9px] font-mono">
              {[
                { id: '15m', label: '15m' },
                { id: '30m', label: '30m' },
                { id: '1h', label: '1h' },
                { id: '4h', label: '4h' },
                { id: '24h', label: '24h' },
                { id: 'NONE', label: 'Perm' },
                { id: 'CUSTOM', label: 'Date' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDurationOption(opt.id)}
                  className={`py-1 rounded border text-center transition-colors ${
                    durationOption === opt.id
                      ? 'border-amber-500 bg-amber-950 text-amber-200 font-bold'
                      : 'border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {durationOption === 'CUSTOM' && (
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full mt-1.5 px-2 py-1 bg-[#0f172a] border border-slate-700 rounded text-slate-200 font-mono text-[9.5px] focus:outline-none focus:border-sky-500"
                placeholder="End date and time"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10.5px] font-medium transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10.5px] font-bold transition-colors shadow-xs"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            <span>SAVE GEOFENCE</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
