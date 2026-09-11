import React from 'react';
import { X } from 'lucide-react';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-10 right-3 z-30 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3 text-slate-800 select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Maritime Symbology & Bathymetry
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Detection Markers */}
      <div className="py-2.5 border-b border-slate-100 space-y-2 text-xs">
        <div className="text-[10px] font-bold uppercase text-slate-400">Detection Types</div>
        
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-6 flex items-center justify-center shrink-0">
            <svg width="15" height="20" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 1.5 C10.8 4.5 16 8 16 13.5 L16 21.5 C16 22 15.5 22.5 15 22.5 L3 22.5 C2.5 22.5 2 22 2 21.5 L2 13.5 C2 8 7.2 4.5 9 1.5 Z"
                fill="#0f172a"
                stroke="#020617"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <rect x="6.5" y="14" width="5" height="3" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-[11px]">AIS Correlated Vessel</div>
            <div className="text-[10px] text-slate-500">Dark ship silhouette • Matched with active AIS transponder</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-5 h-6 flex items-center justify-center shrink-0">
            <svg width="15" height="20" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 1.5 C10.8 4.5 16 8 16 13.5 L16 21.5 C16 22 15.5 22.5 15 22.5 L3 22.5 C2.5 22.5 2 22 2 21.5 L2 13.5 C2 8 7.2 4.5 9 1.5 Z"
                fill="#e11d48"
                stroke="#9f1239"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <rect x="6.5" y="14" width="5" height="3" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-rose-700 text-[11px]">Dark Vessel Detection</div>
            <div className="text-[10px] text-slate-500">Red ship silhouette • No matching AIS broadcast in 1,500m</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 bg-sky-900 text-sky-200 rounded flex items-center justify-center text-[10px] font-mono shrink-0">
            CAM
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-[11px]">Coastal EO Camera</div>
            <div className="text-[10px] text-slate-500">Fixed coastal optical/MWIR surveillance post</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-4 h-1 bg-sky-500/80 rounded shrink-0" />
          <div>
            <div className="font-semibold text-slate-800 text-[11px]">Indian EEZ (200 NM)</div>
            <div className="text-[10px] text-slate-500">Exclusive Economic Zone boundary</div>
          </div>
        </div>
      </div>

      {/* Bathymetric Depth Scale */}
      <div className="pt-2.5">
        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">
          Bathymetric Depth Gradient (GEBCO)
        </div>
        
        <div className="h-3 w-full rounded bg-gradient-to-r from-[#d0f0fd] via-[#7dd3fc] via-[#0284c7] to-[#082f49] shadow-inner" />
        
        <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-1">
          <span>0 m</span>
          <span>100 m</span>
          <span>500 m</span>
          <span>1,000 m</span>
          <span>5,000 m</span>
        </div>
        <div className="text-[9px] text-slate-400 text-center mt-1">
          Continental Shelf Shading • High-Resolution Depth Contours
        </div>
      </div>
    </div>
  );
};
