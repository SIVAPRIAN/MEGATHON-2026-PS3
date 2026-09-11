import React from 'react';
import { X, FileText, Database, MapPin, Download } from 'lucide-react';
import { VesselDetection } from '../types/maritime';
import { exportToCSV, exportToGeoJSON, exportToKML } from '../utils/exportUtils';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleDetections: VesselDetection[];
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  visibleDetections,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-3 top-14 z-30 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Export Detections</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2.5 space-y-1.5 text-xs">
        <div className="text-[10px] text-slate-500 mb-1">
          Exporting <span className="font-bold text-slate-800">{visibleDetections.length}</span> visible maritime events:
        </div>

        <button
          onClick={() => {
            exportToCSV(visibleDetections);
            onClose();
          }}
          className="w-full flex items-center justify-between p-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">CSV Spreadsheet</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">.csv</span>
        </button>

        <button
          onClick={() => {
            exportToGeoJSON(visibleDetections);
            onClose();
          }}
          className="w-full flex items-center justify-between p-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-800">GeoJSON Vectors</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">.geojson</span>
        </button>

        <button
          onClick={() => {
            exportToKML(visibleDetections);
            onClose();
          }}
          className="w-full flex items-center justify-between p-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-slate-800">Google Earth KML</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">.kml</span>
        </button>
      </div>
    </div>
  );
};
