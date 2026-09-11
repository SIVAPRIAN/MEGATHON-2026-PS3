import React, { useEffect, useState } from 'react';
import { RestrictedAreaEvent } from '../types/maritime';
import { ShieldAlert, Eye, X } from 'lucide-react';

interface RestrictedAreaNotificationProps {
  latestEvent: RestrictedAreaEvent | null;
  onDismiss: () => void;
  onSelectVessel?: (vesselId: string) => void;
}

export const RestrictedAreaNotification: React.FC<RestrictedAreaNotificationProps> = ({
  latestEvent,
  onDismiss,
  onSelectVessel,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latestEvent) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 6500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [latestEvent, onDismiss]);

  if (!visible || !latestEvent) return null;

  const isEntry = latestEvent.type === 'ENTRY';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    onDismiss();
    if (onSelectVessel) {
      onSelectVessel(latestEvent.vesselId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`absolute top-3.5 right-3.5 z-45 w-84 max-w-[calc(100vw-72px)] bg-slate-900/95 border border-slate-800 border-l-4 ${
        isEntry ? 'border-l-amber-500' : 'border-l-sky-500'
      } rounded shadow-2xl p-3 text-slate-100 font-sans select-none cursor-pointer transition-all hover:border-slate-700 backdrop-blur-md`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isEntry ? 'bg-amber-400' : 'bg-sky-400'
            }`}
          />
          <ShieldAlert
            className={`w-3.5 h-3.5 shrink-0 ${isEntry ? 'text-amber-400' : 'text-sky-400'}`}
          />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 truncate leading-none">
            {isEntry ? 'RESTRICTED AREA ENTRY' : 'RESTRICTED AREA EXIT'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleClick}
            className="px-2.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-bold tracking-wider transition-colors uppercase flex items-center gap-1 shadow-xs"
            title="View alert and target details"
          >
            <Eye className="w-2.5 h-2.5 text-slate-300" />
            <span>VIEW</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
              onDismiss();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[12.5px] font-bold text-slate-900 leading-tight truncate mb-2">
        {latestEvent.vesselName}{' '}
        <span className="font-mono text-slate-500 text-[11px] font-semibold">({latestEvent.vesselId})</span>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-500">
        <div className="truncate pr-1">
          <span>Zone: </span>
          <strong className="text-slate-800 font-semibold">{latestEvent.areaName}</strong>
        </div>
        <span className="font-mono text-slate-400 shrink-0">{latestEvent.timestamp}</span>
      </div>
    </div>
  );
};
