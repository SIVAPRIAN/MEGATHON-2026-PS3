import React, { useState, useEffect } from 'react';
import { DetailDrawer } from './DetailDrawer';
import { RestrictedArea } from '../types/maritime';
import { Vessel } from '../data/vessels';
import {
  X,
  ShieldAlert,
  Trash2,
  Power,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  AlertCircle,
  Timer
} from 'lucide-react';

interface RestrictedAreaPopupCardProps {
  area: RestrictedArea | null;
  vessels: Vessel[];
  onClose: () => void;
  onToggleStatus: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onUpdateTimeRange?: (
    areaId: string,
    startTime?: string,
    expiresAt?: string,
    expiresInMinutes?: number
  ) => void;
}

export const RestrictedAreaPopupCard: React.FC<RestrictedAreaPopupCardProps> = ({
  area,
  vessels,
  onClose,
  onToggleStatus,
  onDeleteArea,
  onUpdateTimeRange,
}) => {
  const [now, setNow] = useState(Date.now());
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 1-second timer tick for live countdown and progress bar
  useEffect(() => {
    if (!area) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [area]);

  // Sync custom inputs when area changes
  useEffect(() => {
    if (area) {
      const formatToInput = (iso?: string) => {
        if (!iso) return '';
        try {
          const d = new Date(iso);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().slice(0, 16);
        } catch {
          return '';
        }
      };

      setCustomStart(formatToInput(area.startTime) || new Date().toISOString().slice(0, 16));
      setCustomEnd(formatToInput(area.expiresAt));
    }
  }, [area?.id, area?.startTime, area?.expiresAt]);

  if (!area) return null;

  const isActive = area.status === 'ACTIVE';

  // Count vessels inside this specific area
  const vesselsInside = vessels.filter((v) =>
    v.restrictedAreaIds?.includes(area.id)
  );

  // Time Range Analysis
  const startTimeMs = area.startTime ? new Date(area.startTime).getTime() : null;
  const expiresTimeMs = area.expiresAt ? new Date(area.expiresAt).getTime() : null;

  const isFuture = startTimeMs !== null && !isNaN(startTimeMs) && startTimeMs > now;
  const isExpired =
    area.status === 'EXPIRED' ||
    (expiresTimeMs !== null && !isNaN(expiresTimeMs) && expiresTimeMs <= now);

  // Compute remaining time string
  const formatRemaining = () => {
    if (isFuture && startTimeMs) {
      const diffSec = Math.floor((startTimeMs - now) / 1000);
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      return `Starts in ${m}m ${s.toString().padStart(2, '0')}s`;
    }
    if (!expiresTimeMs || isNaN(expiresTimeMs)) {
      return 'Permanent (No Expiry)';
    }
    if (expiresTimeMs <= now) {
      return 'Expired';
    }
    const diffSec = Math.floor((expiresTimeMs - now) / 1000);
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s.toString().padStart(2, '0')}s remaining`;
    }
    return `${m}m ${s.toString().padStart(2, '0')}s remaining`;
  };

  // Compute progress percentage if both start and end exist
  let progressPercent = 0;
  if (startTimeMs && expiresTimeMs && expiresTimeMs > startTimeMs) {
    if (now >= expiresTimeMs) {
      progressPercent = 100;
    } else if (now <= startTimeMs) {
      progressPercent = 0;
    } else {
      progressPercent = Math.min(100, Math.max(0, Math.round(((now - startTimeMs) / (expiresTimeMs - startTimeMs)) * 100)));
    }
  }

  // Quick Preset Handler
  const handleQuickPreset = (minutes: number | null) => {
    if (!onUpdateTimeRange) return;
    const startIso = new Date().toISOString();
    if (minutes === null) {
      // Permanent
      onUpdateTimeRange(area.id, startIso, undefined, undefined);
    } else {
      const endIso = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      onUpdateTimeRange(area.id, startIso, endIso, minutes);
    }
  };

  // Custom Range Submit
  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateTimeRange) return;

    const sDate = customStart ? new Date(customStart) : new Date();
    const eDate = customEnd ? new Date(customEnd) : null;

    if (eDate && eDate.getTime() <= sDate.getTime()) {
      alert('End time must be later than start time.');
      return;
    }

    const startIso = sDate.toISOString();
    const endIso = eDate ? eDate.toISOString() : undefined;
    const mins = eDate ? Math.round((eDate.getTime() - sDate.getTime()) / (60 * 1000)) : undefined;

    onUpdateTimeRange(area.id, startIso, endIso, mins);
    setIsCustomRangeOpen(false);
  };

  const formatDisplayTime = (iso?: string) => {
    if (!iso) return 'Not Set';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toISOString().replace('T', ' ').slice(11, 19) + ' UTC';
    } catch {
      return iso;
    }
  };

  return (
    <DetailDrawer
      isOpen={!!area}
      onClose={onClose}
      title={`${area.id} • ${area.name}`}
      badge={area.zoneType || 'RED'}
      icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
      headerBg="bg-slate-900/90"
      headerBorder="border-slate-800"
    >
      {/* Body */}
      <div className="p-3 space-y-2.5 text-[11px] select-none">
        {/* Status & Established Summary */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded border border-slate-800">
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold tracking-wider">
              Geofence Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isExpired
                    ? 'bg-rose-500'
                    : isFuture
                    ? 'bg-amber-400'
                    : isActive
                    ? 'bg-emerald-500'
                    : 'bg-slate-600'
                }`}
              />
              <span
                className={`font-bold font-mono text-[10.5px] ${
                  isExpired
                    ? 'text-rose-400'
                    : isFuture
                    ? 'text-amber-300'
                    : isActive
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {isExpired ? 'EXPIRED' : isFuture ? 'SCHEDULED' : area.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase block font-semibold tracking-wider">
              Established
            </span>
            <span className="font-mono text-slate-300 block mt-1 font-medium">{area.createdAt}</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TIME RANGE & OPERATIONAL VALIDITY WINDOW (Requirement)        */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#0b1220] border border-sky-950/70 p-2.5 rounded text-[10.5px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sky-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[9.5px] font-bold uppercase tracking-wider">
                Operational Time Range
              </span>
            </div>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                isExpired
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                  : isFuture
                  ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                  : expiresTimeMs
                  ? 'bg-sky-950/70 text-sky-300 border-sky-800/80'
                  : 'bg-slate-800/70 text-slate-400 border-slate-700/80'
              }`}
            >
              {formatRemaining()}
            </span>
          </div>

          {/* Start & End Times Grid */}
          <div className="grid grid-cols-2 gap-2 bg-[#080d17] p-2 rounded border border-slate-800/80">
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase font-mono block">
                Window Start Time
              </span>
              <span className="font-mono text-[10px] text-slate-200 font-semibold block mt-0.5">
                {area.startTime ? formatDisplayTime(area.startTime) : 'Active from creation'}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase font-mono block">
                Window End / Expiry
              </span>
              <span className="font-mono text-[10px] text-slate-200 font-semibold block mt-0.5">
                {area.expiresAt ? formatDisplayTime(area.expiresAt) : 'Permanent (Indefinite)'}
              </span>
            </div>
          </div>

          {/* Progress Bar (if expiring) */}
          {expiresTimeMs && !isExpired && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                <span>Active Validity Progress</span>
                <span className="text-sky-300 font-bold">{progressPercent}% Elapsed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercent > 80
                      ? 'bg-amber-500'
                      : progressPercent > 95
                      ? 'bg-rose-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Preset Selector */}
          {onUpdateTimeRange && (
            <div className="pt-1 border-t border-slate-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-[8.5px] text-slate-400">
                <span className="font-bold uppercase tracking-wider">Set / Extend Time Window:</span>
                <button
                  type="button"
                  onClick={() => setIsCustomRangeOpen(!isCustomRangeOpen)}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5 font-semibold"
                >
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{isCustomRangeOpen ? 'Close Custom' : 'Custom Dates'}</span>
                  {isCustomRangeOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-6 gap-1 font-mono text-[9px]">
                {[
                  { label: '+15m', mins: 15 },
                  { label: '+30m', mins: 30 },
                  { label: '+1h', mins: 60 },
                  { label: '+4h', mins: 240 },
                  { label: '+24h', mins: 1440 },
                  { label: 'Perm', mins: null },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleQuickPreset(preset.mins)}
                    className="py-1 px-1 rounded bg-[#111928] hover:bg-sky-900/60 hover:text-sky-200 border border-slate-800 hover:border-sky-700 text-slate-300 font-semibold text-center transition-colors active:scale-95"
                    title={`Set validity range to ${preset.label}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date/Time Range Form */}
              {isCustomRangeOpen && (
                <form
                  onSubmit={handleApplyCustomRange}
                  className="mt-2 p-2 bg-[#090e18] border border-sky-900/60 rounded space-y-2 animate-in fade-in duration-150"
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase font-mono block mb-0.5">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#0f172a] border border-slate-700 rounded text-slate-200 font-mono text-[9px] focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase font-mono block mb-0.5">
                        End / Expiry Time
                      </label>
                      <input
                        type="datetime-local"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#0f172a] border border-slate-700 rounded text-slate-200 font-mono text-[9px] focus:outline-none focus:border-sky-500"
                        placeholder="Leave blank for permanent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomRangeOpen(false)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[9px] shadow-xs"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>Apply Time Range</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Vessels Inside Area */}
        <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded text-[10.5px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Targets Within Boundary
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                vesselsInside.length > 0
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                  : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              {vesselsInside.length} ACTIVE
            </span>
          </div>

          {vesselsInside.length === 0 ? (
            <span className="text-[9px] text-slate-500 italic block py-1">
              No tracked targets currently inside polygon.
            </span>
          ) : (
            <div className="space-y-1 pt-1 divide-y divide-slate-800/60">
              {vesselsInside.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between text-slate-300 text-[10px] pt-1 first:pt-0"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-mono text-slate-200">{v.name}</span>
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {v.speed} kn
                  </span>
                </div>
              ))}
              {vesselsInside.length > 4 && (
                <div className="text-[8.5px] text-slate-500 text-right pt-1 font-mono">
                  +{vesselsInside.length - 4} additional targets
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions: Toggle Active / Delete */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onToggleStatus(area.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[10.5px] font-semibold transition-colors ${
              isActive
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
          </button>

          <button
            onClick={() => onDeleteArea(area.id)}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-[10.5px] font-semibold transition-colors"
            title="Delete this restricted area"
          >
            <Trash2 className="w-3 h-3" />
            <span>DELETE</span>
          </button>
        </div>
      </div>
    </DetailDrawer>
  );
};
