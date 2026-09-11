import React from 'react';
import { X, Ship, Compass, Anchor, Navigation, Calendar, Activity } from 'lucide-react';
import { VesselDetection } from '../types/maritime';
import { MOCK_TRACKS } from '../data/mockTracks';

interface VesselModalProps {
  mmsi: string | null;
  detection: VesselDetection | null;
  onClose: () => void;
  onFocusTrack: () => void;
}

export const VesselModal: React.FC<VesselModalProps> = ({
  mmsi,
  detection,
  onClose,
  onFocusTrack,
}) => {
  if (!mmsi && !detection) return null;

  const track = mmsi ? MOCK_TRACKS[mmsi] : null;
  const vesselName = detection?.vesselName || track?.vesselName || 'MT PACIFIC VOYAGER';
  const flag = detection?.flag || 'Panama';
  const vesselType = detection?.estimates.vesselType || 'Cargo';
  const length = detection?.estimates.length || 79;
  const heading = detection?.estimates.heading || 228;
  const speed = detection?.estimates.speed || 5.0;

  return (
    <div className="absolute left-14 bottom-14 z-30 w-88 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3.5 text-slate-800 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center">
            <Ship className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              VESSEL PROFILE
            </div>
            <div className="text-xs font-black text-slate-900 truncate">
              {vesselName}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Profile Details */}
      <div className="py-2 space-y-2.5 text-xs">
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200/60">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">MMSI</span>
            <span className="font-mono font-bold text-slate-900 text-xs">{mmsi}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">FLAG</span>
            <span className="font-semibold text-slate-800">{flag}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">TYPE</span>
            <span className="font-semibold text-slate-800">{vesselType}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">DIMENSIONS</span>
            <span className="font-semibold text-slate-800">{length} m × 14 m</span>
          </div>
        </div>

        {/* Dynamic Telemetry */}
        <div className="flex justify-between items-center py-1 px-2 border border-slate-200 rounded">
          <div className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-500">Heading:</span>
            <span className="font-mono font-bold text-slate-800">{heading}°</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">Speed:</span>
            <span className="font-mono font-bold text-slate-800">{speed} kts</span>
          </div>
        </div>

        {/* Historical Track Summary */}
        <div className="border border-slate-200 rounded p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              AIS VOYAGE TRACK
            </span>
            <button
              onClick={onFocusTrack}
              className="text-[10px] font-semibold text-sky-600 hover:underline"
            >
              Highlight Route
            </button>
          </div>

          {track ? (
            <div className="space-y-1 text-[11px]">
              <div className="text-slate-500 flex justify-between">
                <span>Waypoints:</span>
                <span className="font-mono font-semibold text-slate-800">{track.points.length} fixes logged</span>
              </div>
              <div className="text-slate-500 flex justify-between">
                <span>AIS Coverage Gap:</span>
                <span className="font-mono font-semibold text-emerald-700">None (&lt;15 min interval)</span>
              </div>
              <div className="text-slate-500 flex justify-between">
                <span>Destination:</span>
                <span className="font-semibold text-slate-800">Cochin Port (INCOK)</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Interpolated coastal trajectory available on map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
