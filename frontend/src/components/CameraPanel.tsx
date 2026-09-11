import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { EOCamera } from '../types/maritime';

interface CameraPanelProps {
  camera: EOCamera | null;
  onClose: () => void;
  onViewAssociatedDetection?: (detectionId: string) => void;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  camera,
  onClose,
}) => {
  const [showEOModal, setShowEOModal] = useState(false);

  if (!camera) return null;

  return (
    <>
      <div className="absolute top-4 right-4 z-30 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-4 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            EO CAMERA
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            title="Close camera card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Identifiers */}
        <div className="mb-3">
          <div className="font-mono text-base font-bold text-slate-900">{camera.id}</div>
          <div className="text-xs text-slate-600">{camera.name}</div>
          <div className="mt-1">
            <span className="text-[11px] font-bold text-emerald-600 font-mono tracking-wider">
              ONLINE
            </span>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="space-y-1 text-xs mb-4 font-mono">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500 font-sans">Heading:</span>
            <span className="font-semibold text-slate-800">{camera.heading.toString().padStart(3, '0')}°</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500 font-sans">FOV:</span>
            <span className="font-semibold text-slate-800">{camera.fov}°</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-500 font-sans">Range:</span>
            <span className="font-semibold text-slate-800">{camera.rangeKm} km</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowEOModal(true)}
          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>VIEW EO</span>
        </button>
      </div>

      {/* Optical Frame Inspection Modal */}
      {showEOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-4 py-2 bg-slate-900 text-white flex items-center justify-between text-xs font-mono font-bold">
              <span>{camera.id} • OPTICAL SENSOR FRAME</span>
              <button onClick={() => setShowEOModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex flex-col items-center">
              <div className="relative w-full aspect-video bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-800">
                <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400">
                  LIVE OPTICAL SENSOR • AZIMUTH {camera.heading}°
                </div>
                <div className="text-slate-400 text-xs font-mono text-center">
                  <div className="w-12 h-12 border border-emerald-500/80 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  </div>
                  SECTOR SURVEILLANCE ACTIVE
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">
                  COASTAL COVERAGE: {camera.rangeKm} KM
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
