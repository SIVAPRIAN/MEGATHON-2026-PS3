import React from 'react';
import { X } from 'lucide-react';

export interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string | number | React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerBg?: string;
  headerBorder?: string;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  icon,
  headerAction,
  children,
  className = '',
  headerBg = 'bg-[#0f172a]',
  headerBorder = 'border-slate-800',
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label={title}
      className={`absolute right-3.5 top-3.5 z-40 w-88 max-w-[calc(100vw-72px)] max-h-[calc(100vh-68px)] flex flex-col bg-[#0c1322]/98 backdrop-blur-md border border-slate-700/80 rounded shadow-2xl text-slate-200 overflow-hidden font-sans select-none animate-in fade-in duration-150 ${className}`}
    >
      {/* Standardized Detail Header */}
      <div className={`h-10 px-3 ${headerBg} border-b ${headerBorder} flex items-center justify-between shrink-0 text-slate-100`}>
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="text-[11px] font-bold tracking-wider uppercase font-sans truncate">
            {title}
          </span>
          {badge !== undefined && badge !== null && (
            <span className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {headerAction}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Close Details"
            aria-label="Close Details"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Standardized Detail Content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-[#0c1322]/60">
        {children}
      </div>
    </aside>
  );
};
