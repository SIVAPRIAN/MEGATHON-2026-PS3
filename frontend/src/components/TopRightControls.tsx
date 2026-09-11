import React from 'react';
import { Calendar, Filter, Map, List, Download, Sliders, Radio } from 'lucide-react';

interface TopRightControlsProps {
  onToggleAreas: () => void;
  isAreasOpen: boolean;
  onOpenFilters: () => void;
  filterCount: number;
  dateRangeText: string;
  onToggleDateRange: () => void;
  onToggleEventsList: () => void;
  isEventsListOpen: boolean;
  onOpenDownload: () => void;
  onOpenScenarios: () => void;
  onOpenSensors: () => void;
  sensorCountText: string;
}

export const TopRightControls: React.FC<TopRightControlsProps> = ({
  onToggleAreas,
  isAreasOpen,
  onOpenFilters,
  filterCount,
  dateRangeText,
  onToggleDateRange,
  onToggleEventsList,
  isEventsListOpen,
  onOpenDownload,
  onOpenScenarios,
  onOpenSensors,
  sensorCountText,
}) => {
  return (
    <div className="absolute right-3.5 top-2.5 z-20 flex flex-col items-end gap-1.5 select-none">
      {/* GROUP 1 — PRIMARY MAP / FILTER CONTROLS */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* [ AREAS ] */}
        <button
          onClick={onToggleAreas}
          className={`h-[34px] flex items-center gap-1.5 px-3 rounded-full text-xs font-semibold border shadow-xs transition-all whitespace-nowrap ${
            isAreasOpen 
              ? 'bg-sky-50 text-sky-700 border-sky-300' 
              : 'bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 border-slate-200'
          }`}
        >
          <Map className="w-3.5 h-3.5 text-slate-500" />
          <span>AREAS</span>
        </button>

        {/* [ FILTERS (0) ] */}
        <button
          onClick={onOpenFilters}
          className={`h-[34px] flex items-center gap-1.5 px-3 rounded-full text-xs font-semibold border shadow-xs transition-all whitespace-nowrap ${
            filterCount > 0
              ? 'bg-sky-50 text-sky-700 border-sky-300'
              : 'bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 border-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>FILTERS ({filterCount})</span>
        </button>

        {/* [ SEP 6, 2026 – SEP 8, 2026 ] */}
        <button
          onClick={onToggleDateRange}
          className="h-[34px] flex items-center gap-1.5 px-3 rounded-full text-xs font-medium bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 border border-slate-200 shadow-xs font-sans transition-all whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="uppercase text-[11px] font-semibold tracking-tight">{dateRangeText}</span>
        </button>

        {/* [ EVENTS LIST ] */}
        <button
          onClick={onToggleEventsList}
          className={`h-[34px] flex items-center gap-1.5 px-3 rounded-full text-xs font-semibold border shadow-xs transition-all whitespace-nowrap ${
            isEventsListOpen
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white/95 backdrop-blur-xs hover:bg-white text-slate-700 border-slate-200'
          }`}
        >
          <List className="w-3.5 h-3.5 text-slate-500" />
          <span>EVENTS LIST</span>
        </button>
      </div>

      {/* GROUP 2 — UTILITY CONTROLS */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* [ DOWNLOAD ] */}
        <button
          onClick={onOpenDownload}
          className="h-[32px] flex items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-white/90 backdrop-blur-xs hover:bg-white text-slate-600 border border-slate-200/90 shadow-2xs transition-all whitespace-nowrap"
          title="Export CSV, GeoJSON, KML"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>DOWNLOAD</span>
        </button>

        {/* [ SCENARIOS ] */}
        <button
          onClick={onOpenScenarios}
          className="h-[32px] flex items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-white/90 backdrop-blur-xs hover:bg-white text-slate-600 border border-slate-200/90 shadow-2xs transition-all whitespace-nowrap"
          title="Operational Scenarios"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>SCENARIOS</span>
        </button>

        {/* [ SENSORS (6/8) ] */}
        <button
          onClick={onOpenSensors}
          className="h-[32px] flex items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-white/90 backdrop-blur-xs hover:bg-white text-slate-600 border border-slate-200/90 shadow-2xs transition-all whitespace-nowrap"
          title="Sensor Network Status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] font-semibold text-slate-700">SENSORS ({sensorCountText})</span>
        </button>
      </div>
    </div>
  );
};
