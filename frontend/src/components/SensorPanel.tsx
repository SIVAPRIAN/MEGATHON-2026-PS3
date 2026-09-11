import React, { useState, useMemo } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { EOCamera } from '../types/maritime';
import { Radio, Search, Compass, Eye, Activity, Camera } from 'lucide-react';

interface SensorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: EOCamera[];
  onSelectCamera: (cam: EOCamera) => void;
  onViewFeed?: (cam: EOCamera) => void;
  isAisOnline?: boolean;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({
  isOpen,
  onClose,
  cameras,
  onSelectCamera,
  onViewFeed,
  isAisOnline = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE'>('ALL');

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const name = (cam.siteName || cam.name || '').toLowerCase();
      const id = cam.id.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || name.includes(term) || id.includes(term);

      if (!matchesSearch) return false;
      if (filterType === 'ACTIVE') return cam.status === 'DEMO ACTIVE';
      return true;
    });
  }, [cameras, searchTerm, filterType]);

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Optical Sensor Network"
      badge={`${cameras.length} STATIONS`}
      icon={<Radio className="w-4 h-4 text-sky-400" />}
    >
      {/* Network Telemetry Overview */}
      <div className="p-3 bg-[#0b111e] border-b border-slate-800 space-y-2 text-[11px] text-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Telemetry Feeds Status
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111827] p-2 rounded border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-[10.5px]">AIS Transponder</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
              {isAisOnline ? 'ONLINE' : 'STANDBY'}
            </span>
          </div>

          <div className="bg-[#111827] p-2 rounded border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200 text-[10.5px]">Optical Sensors</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-bold border border-sky-800">
              ONLINE
            </span>
          </div>
        </div>

        {/* Future Scope Notice */}
        <div className="flex items-center justify-between bg-[#111827] px-2 py-1 rounded border border-slate-800 text-[9.5px]">
          <span className="text-slate-400">Coastal Radar & Satellite SAR:</span>
          <span className="font-mono text-[8.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold uppercase">
            PLANNED / FUTURE
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-[#0c1322]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coastal station code or site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Stations ({cameras.length})
          </button>
          <button
            onClick={() => setFilterType('ACTIVE')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              filterType === 'ACTIVE'
                ? 'bg-sky-600 text-white'
                : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Active Focal Station
          </button>
        </div>
      </div>

      {/* Stations List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
        {filteredCameras.map((cam) => {
          const isDemoActive = cam.status === 'DEMO ACTIVE';
          const title = (cam.siteName || cam.name || 'Coastal Site').toUpperCase();

          return (
            <div
              key={cam.id}
              className={`p-2.5 rounded border transition-colors ${
                isDemoActive
                  ? 'bg-[#101b2b] border-sky-800/80'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDemoActive ? 'bg-sky-400' : 'bg-slate-500'}`} />
                  <span className="font-bold text-slate-100 text-[11px]">{title}</span>
                </div>
                <span className="font-mono text-[9px] text-slate-300 font-bold bg-slate-800 border border-slate-700 px-1 py-0.5 rounded">
                  {cam.id}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono mb-2">
                <div>Coords: {cam.lat.toFixed(4)}°N, {cam.lon.toFixed(4)}°E</div>
                <div>Heading: {cam.heading}° • Range: {cam.rangeKm} km • FOV: {cam.fov}°</div>
                <div className="text-[9.5px] text-slate-400 font-sans truncate">{cam.model || 'Coastal Optical Station'}</div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-800">
                <button
                  onClick={() => onSelectCamera(cam)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  title="Center map and show coverage on this camera"
                >
                  <Compass className="w-3 h-3 text-slate-400" />
                  <span>Locate</span>
                </button>

                {onViewFeed && (
                  <button
                    onClick={() => onViewFeed(cam)}
                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-xs"
                    title="Open optical sensor observation feed"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Optical Feed</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SidebarPanel>
  );
};
