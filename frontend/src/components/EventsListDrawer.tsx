import React from 'react';
import { X, ChevronRight, Filter } from 'lucide-react';
import { VesselDetection } from '../types/maritime';

interface EventsListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: VesselDetection[];
  onSelectEvent: (event: VesselDetection) => void;
  selectedEventId?: string;
}

export const EventsListDrawer: React.FC<EventsListDrawerProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  selectedEventId,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="fixed left-3 top-24 bottom-14 z-20 w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 flex flex-col select-none animate-in fade-in slide-in-from-left-3 duration-200">
      <div className="h-10 px-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
          Indian Maritime Events ({events.length})
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
        {events.map((evt) => {
          const isDark = evt.correlationStatus === 'DARK';
          const isSelected = selectedEventId === evt.id;

          return (
            <button
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className={`w-full p-2.5 text-left flex items-start justify-between transition-colors ${
                isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {isDark ? (
                    <div className="w-3.5 h-3.5 border border-rose-600 bg-rose-50 rounded-xs flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 border border-slate-900 bg-slate-100 rounded-xs flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-800">
                    {isDark ? 'DARK VESSEL DETECTION' : 'AIS CORRELATED VESSEL'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {evt.displayTime}
                  </div>
                  {evt.vesselName && (
                    <div className="text-[11px] font-semibold text-sky-700">
                      {evt.vesselName}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {evt.region} • {evt.estimates.vesselType} ({evt.estimates.length}m)
                  </div>
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0" />
            </button>
          );
        })}
      </div>
    </aside>
  );
};
