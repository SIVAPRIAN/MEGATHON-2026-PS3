import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { VesselDetection } from '../types/maritime';

interface QuickEventsProps {
  events: VesselDetection[];
  onSelectEvent: (event: VesselDetection) => void;
  selectedEventId?: string;
}

export const QuickEvents: React.FC<QuickEventsProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Take first 6 key events
  const displayEvents = events.slice(0, 6);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Floating Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-[34px] flex items-center gap-1.5 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 border border-slate-200 px-3 rounded-full shadow-xs text-xs font-semibold tracking-wide transition-all whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span>EVENTS ({events.length})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Compact Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-10 w-76 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 text-left">
          <div className="px-3 py-1 flex items-center justify-between border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Maritime Events
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/70">
            {displayEvents.map((evt) => {
              const isDark = evt.correlationStatus === 'DARK';
              const isSelected = selectedEventId === evt.id;

              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    onSelectEvent(evt);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-start justify-between transition-colors ${
                    isSelected ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Reticle icon */}
                    <div className="mt-0.5">
                      {isDark ? (
                        <div className="w-3.5 h-3.5 border border-rose-500 rounded-xs flex items-center justify-center bg-rose-50">
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 border border-slate-800 rounded-xs flex items-center justify-center bg-slate-100">
                          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">
                        {isDark ? 'DARK VESSEL DETECTION' : 'AIS CORRELATED VESSEL'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {evt.displayTime.split(' ')[1]} • {evt.region}
                      </div>
                      {evt.vesselName && (
                        <div className="text-[10px] font-medium text-sky-700">
                          {evt.vesselName}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
