import React from 'react';
import { SidebarPanel } from './SidebarPanel';
import { Check, Layers } from 'lucide-react';

export interface MapLayersState {
  eez: boolean;
  territorialSea: boolean;
  vessels: boolean;
  cameras: boolean;
  contiguousZone: boolean;
  patrolUnits: boolean;
}

interface LayerControlPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  layers: MapLayersState;
  onToggleLayer: (layerKey: keyof MapLayersState) => void;
}

export const LayerControlPopover: React.FC<LayerControlPopoverProps> = ({
  isOpen,
  onClose,
  layers,
  onToggleLayer,
}) => {
  const layerItems: { key: keyof MapLayersState; label: string; sub?: string }[] = [
    { key: 'vessels', label: 'VESSEL TARGETS', sub: 'AIS Correlated & Uncorrelated Optical Contacts' },
    { key: 'patrolUnits', label: 'COASTAL PATROL CRAFT', sub: 'Indian Coast Guard & Marine Police Fast Interceptors' },
    { key: 'cameras', label: 'OPTICAL SENSOR SITES', sub: '87 Physical Shore Stations • DGLL NAIS' },
    { key: 'eez', label: 'EEZ BOUNDARIES (200 NM)', sub: 'Exclusive Economic Zone Outer Limits' },
    { key: 'territorialSea', label: '12 NM TERRITORIAL SEA', sub: 'Sovereign Coastal Waters' },
    { key: 'contiguousZone', label: '24 NM CONTIGUOUS ZONE', sub: 'Law Enforcement Enforcement Corridor' },
  ];

  return (
    <SidebarPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Maritime Layers & Overlays"
      badge="GIS"
      icon={<Layers className="w-4 h-4 text-sky-400" />}
    >
      <div className="p-3 bg-[#0b111e] border-b border-slate-800 text-[11px] text-slate-400">
        Toggle vector boundary overlays, vessel observation feeds, and sensor sites across the Indian Maritime Domain.
      </div>

      <div className="p-3 space-y-2">
        {layerItems.map((item) => {
          const isActive = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`w-full flex items-center justify-between p-3 rounded border text-left transition-colors ${
                isActive
                  ? 'bg-[#101b2b] border-sky-800 text-slate-100'
                  : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold block leading-tight text-slate-100">{item.label}</span>
                {item.sub && (
                  <span className="text-[9.5px] text-slate-400 block leading-tight mt-0.5">
                    {item.sub}
                  </span>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ml-2 ${
                  isActive
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'border-slate-700 bg-[#0b111e]'
                }`}
              >
                {isActive && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </SidebarPanel>
  );
};
