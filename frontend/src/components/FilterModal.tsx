import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '../types/maritime';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-3.5 top-[86px] z-30 w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3.5 text-slate-800 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Filter className="w-3.5 h-3.5 text-sky-600" />
          <span>Filter Detections</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="py-2.5 space-y-3.5 text-xs">
        {/* Event Type (Correlated vs Dark) */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Event Type
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'DARK', label: 'Dark Only (Red)' },
              { id: 'CORRELATED', label: 'Correlated (Black)' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ ...filters, eventType: opt.id as any })}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition-all text-center truncate ${
                  filters.eventType === opt.id
                    ? opt.id === 'DARK'
                      ? 'bg-rose-50 border-rose-500 text-rose-700'
                      : opt.id === 'CORRELATED'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-sky-50 border-sky-500 text-sky-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detection Source */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Detection Source
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.detectionTypes.optical}
                onChange={(e) => onChange({
                  ...filters,
                  detectionTypes: { ...filters.detectionTypes, optical: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">Optical</span>
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.detectionTypes.sar}
                onChange={(e) => onChange({
                  ...filters,
                  detectionTypes: { ...filters.detectionTypes, sar: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">SAR</span>
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.detectionTypes.eoCamera}
                onChange={(e) => onChange({
                  ...filters,
                  detectionTypes: { ...filters.detectionTypes, eoCamera: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">EO Camera</span>
            </label>
          </div>
        </div>

        {/* Vessel Types */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Vessel Classification
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.vesselTypes.cargo}
                onChange={(e) => onChange({
                  ...filters,
                  vesselTypes: { ...filters.vesselTypes, cargo: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">Cargo / Freight</span>
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.vesselTypes.tanker}
                onChange={(e) => onChange({
                  ...filters,
                  vesselTypes: { ...filters.vesselTypes, tanker: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">Tanker</span>
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.vesselTypes.fishing}
                onChange={(e) => onChange({
                  ...filters,
                  vesselTypes: { ...filters.vesselTypes, fishing: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">Fishing</span>
            </label>

            <label className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-200/60 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.vesselTypes.other}
                onChange={(e) => onChange({
                  ...filters,
                  vesselTypes: { ...filters.vesselTypes, other: e.target.checked }
                })}
                className="accent-sky-600 rounded"
              />
              <span className="text-[11px] font-medium text-slate-700">Other / Unclassified</span>
            </label>
          </div>
        </div>

        {/* Region Filter */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Indian Maritime Sector
          </label>
          <select
            value={filters.selectedRegion}
            onChange={(e) => onChange({ ...filters, selectedRegion: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 outline-none focus:border-sky-500"
          >
            <option value="ALL">All Indian Maritime Regions</option>
            <option value="Kerala">Kerala Coast / Kollam</option>
            <option value="Mumbai">Mumbai Offshore / Bombay High</option>
            <option value="Chennai">Chennai & Tamil Nadu Coast</option>
            <option value="Gujarat">Gujarat & Gulf of Khambhat</option>
            <option value="Bay of Bengal">Visakhapatnam & Bay of Bengal</option>
            <option value="Andaman">Andaman & Nicobar</option>
            <option value="Lakshadweep">Lakshadweep Sea</option>
          </select>
        </div>
      </div>
    </div>
  );
};
