import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  headerBg?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = 'max-w-md',
  headerBg = 'bg-[#0b111e]',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150 font-sans">
      <div className={`w-full ${maxWidth} bg-[#0f172a] rounded shadow-2xl border border-slate-700 overflow-hidden flex flex-col text-slate-200 animate-in zoom-in-95 duration-150`}>
        {/* Modal Header */}
        <div className={`h-10 px-3.5 ${headerBg} border-b border-slate-800 flex items-center justify-between shrink-0 text-slate-100`}>
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="text-[11px] font-bold tracking-wider uppercase font-sans truncate text-slate-100">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto bg-[#0c1322]/80">
          {children}
        </div>
      </div>
    </div>
  );
};
