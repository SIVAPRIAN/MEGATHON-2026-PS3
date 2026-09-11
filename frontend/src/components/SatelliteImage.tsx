import React from 'react';
import { Compass, Maximize2 } from 'lucide-react';

interface SatelliteImageProps {
  confidence: number;
  scaleMeters?: number;
  source: string;
  isDark?: boolean;
  vesselLength?: number;
  vesselHeading?: number;
}

export const SatelliteImage: React.FC<SatelliteImageProps> = ({
  confidence = 94,
  scaleMeters = 346,
  source = 'Landsat 8/9 Optical',
  isDark = false,
  vesselLength = 92,
  vesselHeading = 118,
}) => {
  return (
    <div className="relative w-full rounded-md overflow-hidden bg-[#0c2438] border border-slate-200 select-none shadow-inner">
      {/* Ocean surface simulation with subtle deep water texture */}
      <div 
        className="w-full h-52 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, #173d59 0%, #0c2438 70%, #081724 100%)'
        }}
      >
        {/* Optical wave ripple patterns */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <filter id="water-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
          </filter>
          <rect width="100%" height="100%" filter="url(#water-filter)" fill="#1e4e6b" opacity="0.4" />
        </svg>

        {/* Vessel silhouette and wake */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
          style={{ transform: `translate(-50%, -50%) rotate(${vesselHeading}deg)` }}
        >
          {/* Hydrodynamic stern wake foam */}
          <div className="w-4 h-24 -mt-20 -ml-1 bg-gradient-to-t from-white/30 via-sky-200/15 to-transparent blur-[1.5px] rounded-full mx-auto" />

          {/* Hull silhouette */}
          <div 
            className="relative bg-slate-800 border border-slate-600/80 rounded-sm shadow-md"
            style={{
              width: `${Math.max(16, Math.round(vesselLength / 6))}px`,
              height: `${Math.max(48, Math.round(vesselLength / 2))}px`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)'
            }}
          >
            {/* Superstructure / bridge deck */}
            <div className="absolute bottom-2 left-1 right-1 h-3 bg-slate-300/80 rounded-xs" />
            {/* Cargo hold hatch covers */}
            <div className="absolute top-4 left-1.5 right-1.5 h-2 bg-slate-500/60 rounded-xs" />
            <div className="absolute top-7 left-1.5 right-1.5 h-2 bg-slate-500/60 rounded-xs" />
          </div>
        </div>

        {/* Detection Bounding Box Overlay */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-dashed border-emerald-400/90 pointer-events-none rounded-xs">
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400" />

          {/* Detection Label Badge */}
          <div className="absolute -top-5 left-0 bg-white/95 text-emerald-800 border border-emerald-400 px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded-xs shadow-xs flex items-center gap-1">
            <span>VESSEL</span>
            <span className="text-emerald-900 font-bold">{confidence}%</span>
          </div>
        </div>

        {/* Top-Right Compass Orientation Indicator */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-slate-800 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border border-slate-200 shadow-xs">
          <Compass className="w-3 h-3 text-sky-600" />
          <span className="font-semibold">N ↑  E →</span>
        </div>

        {/* Top-Left Sensor Source Tag */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border border-slate-200 shadow-xs">
          {source}
        </div>

        {/* Bottom Scale Indicator */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-slate-700 shadow-xs">
          <div className="w-12 h-1 border-b-2 border-l-2 border-r-2 border-slate-700" />
          <span className="font-semibold">{scaleMeters} m</span>
        </div>

        {/* Bottom-Right Classification Status */}
        <div className="absolute bottom-2 right-2">
          {isDark ? (
            <span className="bg-rose-100/95 border border-rose-300 text-rose-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shadow-xs">
              DARK VESSEL
            </span>
          ) : (
            <span className="bg-sky-100/95 border border-sky-300 text-sky-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shadow-xs">
              AIS CORRELATED
            </span>
          )}
        </div>
      </div>

      <div className="bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500 border-t border-slate-200 flex justify-between items-center font-mono">
        <span>GSD: 10.0m • Band: RGB/NIR</span>
        <span className="text-slate-600 font-semibold">{vesselLength}m • {vesselHeading}°</span>
      </div>
    </div>
  );
};
