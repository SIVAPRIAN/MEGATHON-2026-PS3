import React from 'react';
import { Layers } from 'lucide-react';
import { formatCoordinatesDMS } from '../utils/geoUtils';

interface CoordinateBarProps {
  cursorPos: { lat: number; lon: number };
  zoom: number;
  onToggleLegend: () => void;
  isLegendOpen: boolean;
}

export const CoordinateBar: React.FC<CoordinateBarProps> = ({
  cursorPos,
  zoom,
  onToggleLegend,
  isLegendOpen,
}) => {
  // Approximate nautical scale length display based on zoom
  const scaleText = zoom > 11 ? '1 NM' : zoom > 8 ? '5 NM' : zoom > 5 ? '10 NM' : '50 NM';

  return (
    <>
      {/* 1. Floating Maritime Boundaries & Symbology Legend */}
      {isLegendOpen && (
        <aside
          aria-label="Maritime Boundaries Legend"
          className="absolute bottom-11 right-3 z-20 w-72 bg-[#0f172a]/98 backdrop-blur-md border border-slate-700 rounded shadow-2xl p-3 text-slate-200 font-sans select-none animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">
              Maritime Symbology Legend
            </span>
            <span className="text-[9px] text-sky-400 font-mono font-semibold">GIS OVERLAY</span>
          </div>

          <div className="space-y-1.5 text-[10.5px]">
            {/* AIS Correlated Vessel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-[10px] leading-none">▲</span>
                <span className="text-slate-200 font-medium">AIS Correlated Target</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Matched</span>
            </div>

            {/* Uncorrelated / Dark Vessel Detection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-[10px] leading-none">▲</span>
                <span className="text-slate-200 font-medium">Optical Fix (No AIS)</span>
              </div>
              <span className="text-[9px] text-rose-400 font-mono font-semibold">Unidentified</span>
            </div>

            {/* Restricted Area Violation Vessel */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[10px] leading-none font-bold">▲</span>
                <span className="text-amber-200 font-medium">In Restricted Geofence</span>
              </div>
              <span className="text-[9px] text-amber-400 font-mono font-semibold">Violation</span>
            </div>

            {/* Red Zone (Restricted / Exclusion) */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-400 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-200 font-medium">Red Zone (Exclusion)</span>
              </div>
              <span className="text-[9px] text-rose-400 font-mono">Restricted</span>
            </div>

            {/* Yellow Zone (Cautionary Anchorage) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-amber-400 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-200 font-medium">Yellow Zone (Cautionary)</span>
              </div>
              <span className="text-[9px] text-amber-400 font-mono">Monitored</span>
            </div>

            {/* Green Zone (Safe Transit Corridor) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold tracking-wider text-[11px] leading-none">
                  - - -
                </span>
                <span className="text-slate-200 font-medium">Green Zone (Authorized)</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono">Transit</span>
            </div>

            {/* EEZ Boundary */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold tracking-widest text-[12px] leading-none">
                  — — —
                </span>
                <span className="text-slate-200 font-medium">EEZ Boundary (200 NM)</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Outer Limit</span>
            </div>

            {/* 12 NM Territorial Sea */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-400 font-bold tracking-wider text-[12px] leading-none">
                  - - -
                </span>
                <span className="text-slate-200 font-medium">12 NM Territorial Waters</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Sovereign</span>
            </div>

            {/* EO Coastal Sensor Station */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sky-400 text-[10px] leading-none">◉</span>
                <span className="text-slate-200 font-medium">Coastal Optical Station</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">DGLL PSS</span>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Bottom-Right Navigation & Coordinate HUD */}
      <div className="absolute bottom-2 right-3 z-20 flex items-center gap-3 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded shadow-xl text-[11px] font-mono text-slate-300 select-none">
        {/* Dynamic Cursor Coordinates */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-sans text-[10px] uppercase font-bold tracking-wider">POS:</span>
          <span className="font-semibold text-slate-100">
            {formatCoordinatesDMS(cursorPos.lat, cursorPos.lon)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
            ({cursorPos.lat.toFixed(4)}°, {cursorPos.lon.toFixed(4)}°)
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        {/* Nautical Scale Indicator */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="w-7 h-1.5 border-b-2 border-l-2 border-r-2 border-slate-400" />
          <span className="text-[10px] font-semibold">{scaleText}</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        {/* SHOW LEGEND toggle button */}
        <button
          onClick={onToggleLegend}
          className={`flex items-center gap-1 text-[11px] font-sans font-semibold transition-colors ${
            isLegendOpen ? 'text-sky-400 font-bold' : 'text-slate-300 hover:text-slate-100'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{isLegendOpen ? 'HIDE LEGEND' : 'LEGEND'}</span>
        </button>
      </div>
    </>
  );
};
