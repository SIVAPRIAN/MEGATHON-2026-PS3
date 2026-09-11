import React from 'react';
import { EOCamera } from '../types/maritime';
import { X, Scan } from 'lucide-react';
import { SatelliteImage } from './SatelliteImage';

interface CameraFeedModalProps {
  camera: EOCamera | null;
  onClose: () => void;
  onAnalyzeWithML?: (camera: EOCamera) => void;
}

export const CameraFeedModal: React.FC<CameraFeedModalProps> = ({ camera, onClose, onAnalyzeWithML }) => {
  if (!camera) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0b111e] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sky-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-100 tracking-wide">
                  OPTICAL SENSOR OBSERVATION
                </span>
                <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[8.5px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase">
                  SIMULATED CAMERA FEED
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Station: {camera.id} ({camera.siteName || camera.name})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Close Feed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optical Sensor Image Observation View */}
        <div className="p-3 bg-[#080d17]">
          <SatelliteImage
            confidence={94}
            scaleMeters={180}
            source={`${camera.model}`}
            isDark={true}
            vesselLength={92}
            vesselHeading={camera.heading}
          />
        </div>

        {/* Observation Telemetry Summary */}
        <div className="px-3.5 pb-3 text-[11px] space-y-2">
          <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2.5 rounded border border-slate-800 text-slate-300">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">Detected Target ID</span>
              <span className="font-mono font-bold text-rose-400 text-[11px]">
                {camera.associatedDetectionId || 'V-08'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">AIS Transponder</span>
              <span className="font-mono font-bold text-slate-200 text-[11px]">
                {camera.associatedAisId ? `MATCHED (${camera.associatedAisId})` : 'NO AIS SIGNAL (DARK)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Range: {camera.rangeKm} km • Azimuth: {camera.heading}°</span>
            <span className="text-sky-400 font-mono font-semibold">12 NM Territorial Waters</span>
          </div>

          {onAnalyzeWithML && (
            <button
              type="button"
              onClick={() => onAnalyzeWithML(camera)}
              className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold text-[11px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>RUN REAL YOLO11n VESSEL DETECTOR</span>
            </button>
          )}

          <div className="text-[8.5px] text-slate-500 bg-[#0b111e] p-1.5 rounded border border-slate-800 text-center">
            Coastal optical feed with real-time YOLO11n SeaShips detector & geolocation calibration.
          </div>
        </div>
      </div>
    </div>
  );
};
