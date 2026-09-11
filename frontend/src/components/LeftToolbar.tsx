import React from 'react';
import {
  Plus,
  Minus,
  Compass,
  Crosshair,
  Camera,
  Layers as LayersIcon,
  Pentagon,
  Play,
  Pause,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Radio,
  Scan,
  FileText,
} from 'lucide-react';
import { MapLayersState } from './LayerControlPopover';

export type ActiveSidebarPanel = 'areas' | 'events' | 'sensors' | 'filters' | 'audit' | 'scenarios' | null;

export interface LeftToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateIndia: () => void;
  onResetNorth: () => void;
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
  isDrawingRestricted: boolean;
  onToggleDrawRestricted: () => void;
  isSimulating?: boolean;
  onToggleSimulation?: () => void;
  activeAlertCount?: number;
  activePanel: ActiveSidebarPanel;
  onTogglePanel: (panel: ActiveSidebarPanel) => void;
  onOpenAIDetector?: () => void;
  onOpenReports?: () => void;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onLocateIndia,
  onResetNorth,
  layers,
  onToggleLayer,
  isDrawingRestricted,
  onToggleDrawRestricted,
  isSimulating = false,
  onToggleSimulation,
  activeAlertCount = 0,
  activePanel,
  onTogglePanel,
  onOpenAIDetector,
  onOpenReports,
}) => {
  return (
    <div className="absolute left-3.5 top-3.5 z-20 flex flex-col items-start gap-2 select-none">
      {/* Zoom, Navigation & GIS Controls */}
      <div className="flex flex-col bg-[#0f172a]/95 backdrop-blur-md rounded border border-slate-700/80 shadow-2xl overflow-hidden divide-y divide-slate-800">
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Reset North */}
        <button
          onClick={onResetNorth}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Reset Bearing (North Up)"
          aria-label="Reset Bearing"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Locate India */}
        <button
          onClick={onLocateIndia}
          className="w-[34px] h-[34px] flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Center on Indian Maritime Domain"
          aria-label="Center on India"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Vessel Toggle Button */}
        <button
          onClick={() => onToggleLayer('vessels')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            layers.vessels
              ? 'bg-slate-800 text-sky-400'
              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-400'
          }`}
          title={layers.vessels ? 'Hide Vessels' : 'Show All Vessels (AIS Correlated & Uncorrelated Targets)'}
          aria-label="Toggle All Vessels"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 1.5 L9.5 5 L9.5 13 L2.5 13 L2.5 5 Z"
              fill={layers.vessels ? '#38bdf8' : '#475569'}
              stroke={layers.vessels ? '#0284c7' : '#334155'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 4.5 L14.5 7.5 L14.5 14.5 L8.5 14.5 L8.5 7.5 Z"
              fill={layers.vessels ? '#ef4444' : '#64748b'}
              stroke={layers.vessels ? '#b91c1c' : '#475569'}
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={() => onToggleLayer('cameras')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            layers.cameras
              ? 'bg-slate-800 text-sky-400'
              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-400'
          }`}
          title={layers.cameras ? 'Hide Coastal Cameras' : 'Show All Coastal Optical Stations (87 DGLL Sites)'}
          aria-label="Toggle All Coastal Cameras"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Draw Restricted Area */}
        <button
          onClick={onToggleDrawRestricted}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            isDrawingRestricted
              ? 'bg-amber-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
          }`}
          title="Draw Restricted Geofence Polygon"
          aria-label="Draw Restricted Area"
        >
          <Pentagon className="w-4 h-4" />
        </button>

        {/* 1. AREAS PANEL (Maritime Geofence Zones) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'areas' ? null : 'areas')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'areas'
              ? 'bg-slate-800 text-amber-400 border-l-2 border-amber-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
          }`}
          title="Areas: Manage Maritime Geofence Zones"
          aria-label="Areas Panel"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>

        {/* 2. EVENTS PANEL (Alert Center) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'events' ? null : 'events')}
          className={`relative w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'events'
              ? 'bg-slate-800 text-rose-400 border-l-2 border-rose-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-rose-400'
          }`}
          title="Events: Operational Alert Center"
          aria-label="Events Panel"
        >
          <AlertTriangle className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {/* 3. SENSORS PANEL (Optical Sensor Network & 87 EO Sites) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'sensors' ? null : 'sensors')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'sensors'
              ? 'bg-slate-800 text-sky-400 border-l-2 border-sky-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-sky-400'
          }`}
          title="Sensors: Network Status & Coastal EO Sensor Stations"
          aria-label="Sensors Panel"
        >
          <Radio className="w-4 h-4" />
        </button>

        {/* 4. FILTERS & LAYERS PANEL */}
        <button
          onClick={() => onTogglePanel(activePanel === 'filters' ? null : 'filters')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'filters'
              ? 'bg-slate-800 text-sky-400 border-l-2 border-sky-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Filters: Maritime GIS Boundaries & Overlays"
          aria-label="Filters Panel"
        >
          <LayersIcon className="w-4 h-4" />
        </button>

        {/* 5. SCENARIOS PANEL (Surveillance Scenarios 1–7) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'scenarios' ? null : 'scenarios')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'scenarios'
              ? 'bg-slate-800 text-sky-400 border-l-2 border-sky-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-sky-400'
          }`}
          title="Scenarios: Surveillance Track Evaluation Scenarios (1–7)"
          aria-label="Scenarios Panel"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* 6. AUDIT PANEL (Append-Only Audit Trail) */}
        <button
          onClick={() => onTogglePanel(activePanel === 'audit' ? null : 'audit')}
          className={`w-[34px] h-[34px] flex items-center justify-center transition-colors ${
            activePanel === 'audit'
              ? 'bg-slate-800 text-emerald-400 border-l-2 border-emerald-500'
              : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-400'
          }`}
          title="Audit: Append-Only Immutable Event Trail"
          aria-label="Audit Panel"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* 7. AI VESSEL DETECTOR (YOLO11n SeaShips) */}
        {onOpenAIDetector && (
          <button
            onClick={onOpenAIDetector}
            className="w-[34px] h-[34px] flex items-center justify-center text-sky-400 hover:bg-sky-950/60 hover:text-sky-300 transition-colors relative group"
            title="AI Vessel Detector: Run real fine-tuned YOLO11n on optical camera images"
            aria-label="AI Vessel Detector"
          >
            <Scan className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-400" />
          </button>
        )}

        {/* 8. MARITIME INCIDENT REPORTS */}
        {onOpenReports && (
          <button
            onClick={onOpenReports}
            className="w-[34px] h-[34px] flex items-center justify-center text-indigo-400 hover:bg-indigo-950/60 hover:text-indigo-300 transition-colors relative group"
            title="Incident Reports: Generate formal Maritime Incident Dossier, SITREP and PDF"
            aria-label="Maritime Incident Reports"
          >
            <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </button>
        )}
      </div>

      {/* Demo Scenario Simulation Play/Pause */}
      {onToggleSimulation && (
        <button
          onClick={onToggleSimulation}
          className={`w-[34px] h-[34px] flex items-center justify-center rounded border shadow-md transition-colors ${
            isSimulating
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-[#0f172a]/95 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-amber-400'
          }`}
          title={isSimulating ? 'Pause Traffic Simulation' : 'Run Traffic Simulation'}
          aria-label="Toggle Traffic Simulation"
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>
      )}
    </div>
  );
};
