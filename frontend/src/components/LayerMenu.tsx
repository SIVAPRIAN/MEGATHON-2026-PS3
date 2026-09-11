import React from 'react';
import { X, Check, Layers } from 'lucide-react';
import { MapLayersState } from '../types/maritime';

interface LayerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  layers: MapLayersState;
  onChange: (layers: MapLayersState) => void;
}

export const LayerMenu: React.FC<LayerMenuProps> = ({
  isOpen,
  onClose,
  layers,
  onChange,
}) => {
  if (!isOpen) return null;

  const toggleLayer = (key: keyof MapLayersState) => {
    onChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  const setBase = (style: MapLayersState['baseStyle']) => {
    onChange({
      ...layers,
      baseStyle: style,
    });
  };

  return (
    <div className="absolute left-14 top-[120px] z-30 w-72 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 p-3.5 text-slate-800 select-none animate-in fade-in slide-in-from-left-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>Map Layers</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="py-2 space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
        {/* BASE MAP STYLES */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Base Map Style
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'satellite', label: 'RealWorld' },
              { id: 'bathymetry', label: 'Bathymetry' },
              { id: 'streets', label: 'Streets' },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() => setBase(style.id as any)}
                className={`py-1 px-1.5 rounded text-[11px] font-semibold border transition-all text-center ${
                  layers.baseStyle === style.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* DETECTIONS */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Vessel Detections
          </span>
          <div className="space-y-1">
            <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs border border-rose-600 bg-rose-50" />
                <span className="text-[11px] font-medium text-slate-700">Dark Vessels</span>
              </div>
              <input
                type="checkbox"
                checked={layers.darkVessels}
                onChange={() => toggleLayer('darkVessels')}
                className="accent-slate-900 rounded"
              />
            </label>

            <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs border border-slate-900 bg-slate-100" />
                <span className="text-[11px] font-medium text-slate-700">AIS Correlated</span>
              </div>
              <input
                type="checkbox"
                checked={layers.correlatedVessels}
                onChange={() => toggleLayer('correlatedVessels')}
                className="accent-slate-900 rounded"
              />
            </label>
          </div>
        </div>



        {/* SENSORS */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Coastal Sensors
          </span>
          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">EO Coastal Cameras</span>
            <input
              type="checkbox"
              checked={layers.eoCameras}
              onChange={() => toggleLayer('eoCameras')}
              className="accent-slate-900 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">Camera FOV Cones</span>
            <input
              type="checkbox"
              checked={layers.cameraFOV}
              onChange={() => toggleLayer('cameraFOV')}
              className="accent-slate-900 rounded"
            />
          </label>
        </div>

        {/* GEOGRAPHY */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Maritime Boundaries
          </span>
          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">Indian EEZ (200 NM)</span>
            <input
              type="checkbox"
              checked={layers.eezBoundary}
              onChange={() => toggleLayer('eezBoundary')}
              className="accent-slate-900 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">12 NM Territorial Sea</span>
            <input
              type="checkbox"
              checked={layers.territorial12NM}
              onChange={() => toggleLayer('territorial12NM')}
              className="accent-slate-900 rounded"
            />
          </label>

          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">Major Indian Seaports</span>
            <input
              type="checkbox"
              checked={layers.ports}
              onChange={() => toggleLayer('ports')}
              className="accent-slate-900 rounded"
            />
          </label>
        </div>

        {/* AREAS */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Custom Areas
          </span>
          <label className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer">
            <span className="text-[11px] font-medium text-slate-700">My User Areas & Zones</span>
            <input
              type="checkbox"
              checked={layers.myAreas}
              onChange={() => toggleLayer('myAreas')}
              className="accent-slate-900 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
