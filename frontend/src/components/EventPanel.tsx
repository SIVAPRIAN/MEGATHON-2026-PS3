import React, { useState } from 'react';
import { X, Play, RefreshCw } from 'lucide-react';
import { VesselDetection } from '../types/maritime';

interface EventPanelProps {
  event: VesselDetection | null;
  onClose: () => void;
  onSimulateAisMatch?: (eventId: string) => void;
  onShowSearchRadius?: (show: boolean) => void;
  isSearchRadiusActive?: boolean;
  onOpenVesselDetails?: (mmsi: string) => void;
  onFocusCoordinates?: (lat: number, lon: number) => void;
}

export const EventPanel: React.FC<EventPanelProps> = ({
  event,
  onClose,
  onSimulateAisMatch,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  if (!event) return null;

  const isDark = event.correlationStatus === 'DARK';

  const handleSimulate = () => {
    if (!onSimulateAisMatch) return;
    setIsSimulating(true);
    setTimeout(() => {
      onSimulateAisMatch(event.id);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-4 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-rose-600' : 'bg-slate-900'}`} />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-800">
            {isDark ? 'DARK VESSEL DETECTION' : 'AIS CORRELATED VESSEL DETECTION'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          title="Close card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timestamp & Coordinate */}
      <div className="space-y-0.5 mb-3 font-mono text-[11px] text-slate-600">
        <div>{event.displayTime || event.timestamp}</div>
        <div className="font-semibold text-slate-800">
          {event.lat.toFixed(4)}° N, {event.lon.toFixed(4)}° E
        </div>
        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
          {event.source}
        </div>
      </div>

      {/* Correlated Vessel Identified Block */}
      {!isDark && (
        <div className="mb-3 p-2.5 bg-slate-50 rounded border border-slate-200/80">
          <div className="text-[9px] font-bold tracking-wider uppercase text-slate-400 mb-1">
            VESSEL IDENTIFIED
          </div>
          <div className="font-bold text-sm text-slate-900">
            {event.vesselName || 'MT PACIFIC VOYAGER'}
          </div>
          <div className="text-xs text-slate-600 font-medium">
            {event.estimates.vesselType} • {event.flag || 'Panama'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            MMSI: <span className="font-semibold text-slate-700">{event.mmsi || '503891240'}</span>
          </div>
        </div>
      )}

      {/* Estimates */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Estimates
        </div>
        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500">Length:</span>
            <span className="font-mono font-semibold text-slate-800">{event.estimates.length} m</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500">Heading:</span>
            <span className="font-mono font-semibold text-slate-800">{event.estimates.heading}°</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500">Speed:</span>
            <span className="font-mono font-semibold text-slate-800">{event.estimates.speed} kts</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500">Type:</span>
            <span className="font-semibold text-slate-800 truncate">{event.estimates.vesselType}</span>
          </div>
        </div>
      </div>

      {/* Status & Confidence */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          {isDark ? (
            <div>
              <div className="font-bold text-rose-600 font-mono text-[11px]">AIS: NO MATCH</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Detection confidence: {event.detectionConfidence}%
              </div>
            </div>
          ) : (
            <div>
              <div className="font-bold text-slate-800 font-mono text-[11px]">
                AIS Correlation: {event.correlation?.confidence || 93}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Detection confidence: {event.detectionConfidence}%
              </div>
            </div>
          )}
        </div>

        {/* Action button for dark vessel */}
        {isDark && onSimulateAisMatch && (
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
            title="Simulate incoming AIS broadcast"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>MATCHING...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-sky-400 fill-sky-400" />
                <span>SIMULATE AIS</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
