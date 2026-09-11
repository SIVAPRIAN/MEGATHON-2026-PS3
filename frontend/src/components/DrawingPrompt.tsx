import React from 'react';
import { Check, X, ShieldAlert, AlertTriangle, EyeOff } from 'lucide-react';

interface DrawingPromptProps {
  isDrawing: boolean;
  pointCount: number;
  hasCameraCoverage?: boolean;
  nearestCameraDistanceKm?: number;
  onFinish: () => void;
  onCancel: () => void;
}

export const DrawingPrompt: React.FC<DrawingPromptProps> = ({
  isDrawing,
  pointCount,
  hasCameraCoverage = true,
  nearestCameraDistanceKm,
  onFinish,
  onCancel,
}) => {
  if (!isDrawing) return null;

  const isBlindSpot = pointCount >= 2 && !hasCameraCoverage;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 max-w-xl select-none animate-in fade-in duration-150">
      {/* Primary Drawing Bar */}
      <div
        className={`flex items-center gap-3 bg-[#0f172a]/95 backdrop-blur-md px-3.5 py-2 rounded shadow-2xl text-slate-200 text-[11px] font-sans border transition-colors ${
          isBlindSpot ? 'border-rose-500/90 shadow-rose-950/40' : 'border-amber-500/80 shadow-amber-950/30'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isBlindSpot ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
          {isBlindSpot ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span
            className={`font-bold uppercase tracking-wider text-[10px] ${
              isBlindSpot ? 'text-rose-300' : 'text-amber-300'
            }`}
          >
            {isBlindSpot ? 'Zone Outside Camera FOV' : 'Drawing Geofence Polygon'}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <span className="text-slate-300 font-medium">
          {pointCount < 3
            ? `Click map to place vertices (${pointCount} placed, min 3)`
            : `Click first point or double-click to close (${pointCount} vertices)`}
        </span>

        <div className="flex items-center gap-1.5 ml-1">
          {pointCount >= 3 && (
            <button
              onClick={onFinish}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-white font-bold text-[10.5px] transition-colors shadow-xs ${
                isBlindSpot ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
              }`}
              title="Complete and close polygon"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>CLOSE</span>
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-[10.5px] transition-colors"
            title="Cancel drawing"
          >
            <X className="w-3 h-3" />
            <span>CANCEL</span>
          </button>
        </div>
      </div>

      {/* Live Blind Spot Camera Coverage Alert Banner */}
      {isBlindSpot && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#2a0e14]/95 border border-rose-600/90 text-rose-200 text-[10px] shadow-lg backdrop-blur-md animate-in slide-in-from-top-1 duration-200">
          <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <div className="leading-tight">
            <strong className="text-rose-300 font-bold uppercase tracking-wide">
              No Optical Camera Coverage:
            </strong>{' '}
            <span>
              This restricted zone has 0% EO camera access. Dark vessels (without AIS) cannot be optically sighted in this sector
              {nearestCameraDistanceKm !== undefined && nearestCameraDistanceKm < 999
                ? ` (nearest station is ${nearestCameraDistanceKm.toFixed(1)} km away)`
                : ''}.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
