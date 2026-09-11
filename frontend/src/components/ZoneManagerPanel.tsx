import React, { useState, useEffect, useRef } from 'react';
import { SidebarPanel } from './SidebarPanel';
import { RestrictedArea, ZoneType } from '../types/maritime';
import {
  X,
  ShieldAlert,
  Trash2,
  Power,
  Plus,
  Clock,
  Compass,
  Edit2,
  Check,
  FileUp,
  Download,
  Layers,
} from 'lucide-react';
import {
  exportZonesToGeoJSON,
  parseGeoJSONToZones,
  INITIAL_RESTRICTED_AREAS,
} from '../data/mockRestrictedAreas';

interface ZoneManagerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  areas: RestrictedArea[];
  onToggleStatus: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onEditArea: (areaId: string, newName: string, newType: ZoneType, expiresInMin?: number) => void;
  onStartDrawing: () => void;
  onFlyToArea: (area: RestrictedArea) => void;
  onLoadGeoJSONZones?: (zones: RestrictedArea[]) => void;
}

export const ZoneManagerPanel: React.FC<ZoneManagerPanelProps> = ({
  isOpen,
  onClose,
  areas,
  onToggleStatus,
  onDeleteArea,
  onEditArea,
  onStartDrawing,
  onFlyToArea,
  onLoadGeoJSONZones,
}) => {
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<ZoneType>('RED');
  const [editExpiresIn, setEditExpiresIn] = useState<string>('10');
  const [now, setNow] = useState(Date.now());
  const [isGeoJsonMenuOpen, setIsGeoJsonMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update timer tick every second for accurate countdown displays
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (area: RestrictedArea) => {
    setEditingAreaId(area.id);
    setEditName(area.name);
    setEditType(area.zoneType || 'RED');
    setEditExpiresIn('10');
  };

  const handleSaveEdit = (areaId: string) => {
    const mins = parseInt(editExpiresIn, 10);
    onEditArea(areaId, editName, editType, isNaN(mins) ? undefined : mins);
    setEditingAreaId(null);
  };

  const handleLoadStandardGeoJson = () => {
    if (onLoadGeoJSONZones) {
      onLoadGeoJSONZones(INITIAL_RESTRICTED_AREAS);
    }
    setIsGeoJsonMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onLoadGeoJSONZones) {
        const parsed = parseGeoJSONToZones(content);
        if (parsed.length > 0) {
          onLoadGeoJSONZones(parsed);
        }
      }
    };
    reader.readAsText(file);
    setIsGeoJsonMenuOpen(false);
  };

  const handleExportGeoJson = () => {
    const jsonStr = exportZonesToGeoJSON(areas);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maritime-geofence-zones-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    setIsGeoJsonMenuOpen(false);
  };

  const formatRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return 'Permanent';
    const diffMs = new Date(expiresAt).getTime() - now;
    if (diffMs <= 0) return 'EXPIRED';
    const totalSec = Math.floor(diffMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Maritime Geofence Zones"
      badge={`${areas.filter((a) => a.status !== 'EXPIRED').length} ZONES`}
      icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
    >
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0b111e] border-b border-slate-800 text-[10px]">
        <span className="text-slate-400 font-mono text-[9.5px]">Red, Yellow & Green Zones</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsGeoJsonMenuOpen(!isGeoJsonMenuOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold transition-colors border border-slate-700"
            title="Load or Export GeoJSON Zones"
          >
            <Layers className="w-3 h-3 text-sky-400" />
            <span>GEOJSON</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartDrawing();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-xs"
            title="Draw polygon zone on the map"
          >
            <Plus className="w-3 h-3" />
            <span>DRAW NEW</span>
          </button>
        </div>
      </div>

      {/* GeoJSON Operations Dropdown / Panel */}
      {isGeoJsonMenuOpen && (
        <div className="px-3 py-2 bg-[#151f32] border-b border-slate-700 space-y-1.5 text-[10.5px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[9px] font-bold text-sky-400 uppercase tracking-wider">
            <span>GeoJSON Zone Service</span>
            <button onClick={() => setIsGeoJsonMenuOpen(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={handleLoadStandardGeoJson}
            className="w-full text-left px-2 py-1 rounded bg-[#0b111e] hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors border border-slate-800"
          >
            <span className="font-mono text-[9.5px]">Load Standard GeoJSON (Green, Yellow, Red)</span>
            <Layers className="w-3 h-3 text-emerald-400" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-2 py-1 rounded bg-[#0b111e] hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors border border-slate-800"
          >
            <span className="font-mono text-[9.5px]">Import GeoJSON File (.geojson / .json)</span>
            <FileUp className="w-3 h-3 text-sky-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleExportGeoJson}
            className="w-full text-left px-2 py-1 rounded bg-[#0b111e] hover:bg-slate-800 text-slate-200 flex items-center justify-between transition-colors border border-slate-800"
          >
            <span className="font-mono text-[9.5px]">Export Active Zones as GeoJSON</span>
            <Download className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      )}

      {/* Zone List */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-210px)] overflow-y-auto">
        {areas.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-slate-500 italic">
            No active zones. Click &quot;DRAW NEW&quot; to place a geofence.
          </div>
        ) : (
          areas.map((area) => {
            const isEditing = editingAreaId === area.id;
            const isExpired = area.status === 'EXPIRED' || (area.expiresAt && new Date(area.expiresAt).getTime() <= now);
            const remaining = formatRemainingTime(area.expiresAt);

            const badgeColor =
              area.zoneType === 'GREEN'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : area.zoneType === 'YELLOW'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-rose-950 text-rose-300 border-rose-800';

            const cardBg =
              isExpired
                ? 'bg-[#0f172a]/50 border-slate-800 opacity-60 text-slate-500'
                : area.zoneType === 'GREEN'
                ? 'bg-[#0f1816] border-emerald-950'
                : area.zoneType === 'YELLOW'
                ? 'bg-[#1a1612] border-amber-950'
                : 'bg-[#181119] border-rose-950';

            return (
              <div
                key={area.id}
                className={`p-2.5 rounded border transition-colors ${cardBg}`}
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-2 text-[10.5px]">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase font-semibold block mb-0.5">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold block mb-0.5">Zone Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as ZoneType)}
                          className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        >
                          <option value="RED">RED (Exclusion)</option>
                          <option value="YELLOW">YELLOW (Cautionary)</option>
                          <option value="GREEN">GREEN (Transit)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-semibold block mb-0.5">Expires (Min)</label>
                        <input
                          type="number"
                          value={editExpiresIn}
                          onChange={(e) => setEditExpiresIn(e.target.value)}
                          className="w-full px-2 py-1 bg-[#0b111e] border border-slate-700 rounded text-slate-200 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                          placeholder="Minutes"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingAreaId(null)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(area.id)}
                        className="px-2.5 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          {area.zoneType || 'RED'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-100">{area.name}</span>
                      </div>
                      <span className="text-[8.5px] font-mono text-slate-400">{area.id}</span>
                    </div>

                    <div className="bg-[#0b111e] p-1.5 rounded border border-slate-800/80 mb-2 space-y-1">
                      <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-sky-400" />
                          <span>Window:</span>
                        </span>
                        <span className="text-slate-300 font-medium">
                          {area.startTime ? new Date(area.startTime).toISOString().replace('T', ' ').slice(11, 16) : 'Immediate'} UTC →{' '}
                          {area.expiresAt ? new Date(area.expiresAt).toISOString().replace('T', ' ').slice(11, 16) + ' UTC' : 'Permanent'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[8.5px] font-mono">
                        <span className="text-slate-400">Status:</span>
                        <span className={isExpired ? 'text-rose-400 font-bold' : 'text-sky-300 font-semibold'}>
                          {isExpired ? 'EXPIRED' : remaining}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px]">
                      <button
                        onClick={() => onFlyToArea(area)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-sky-400 hover:text-sky-300 hover:bg-slate-800/60 transition-colors"
                        title="Center map and open Time Range details for this zone"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Select & Time Range</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(area)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit zone parameters"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(area.id)}
                          className={`px-2 py-0.5 rounded font-semibold text-[9.5px] transition-colors border ${
                            area.status === 'ACTIVE'
                              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                          title={area.status === 'ACTIVE' ? 'Deactivate zone' : 'Activate zone'}
                        >
                          <Power className="w-2.5 h-2.5 inline mr-1" />
                          {area.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          onClick={() => onDeleteArea(area.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold transition-colors"
                          title="Delete this zone"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </SidebarPanel>
  );
};
