import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, ChevronDown, Sun, Moon } from 'lucide-react';
import { ActiveOverlay } from '../types/maritime';

export interface HeaderProps {
  activeAlertCount?: number;
  onOpenAlerts?: () => void;
  systemStatus?: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeOverlay?: ActiveOverlay;
  onToggleOverlay?: (overlay: ActiveOverlay) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertCount = 0,
  onOpenAlerts,
  systemStatus = 'ONLINE',
  activeOverlay = null,
  onToggleOverlay,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().slice(11, 19));
  const controlsRef = useRef<HTMLDivElement>(null);

  const isOperatorOpen = activeOverlay === 'operator';

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close active header dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        if (isOperatorOpen) {
          onToggleOverlay?.(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOperatorOpen, onToggleOverlay]);

  const handleToggleOperator = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOverlay?.(isOperatorOpen ? null : 'operator');
  };

  const handleAlertsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleOverlay?.(null);
    if (onOpenAlerts) {
      onOpenAlerts();
    }
  };

  return (
    <header className="relative z-30 h-10 w-full bg-[#0b111e] border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 font-sans text-slate-200 transition-colors">
      {/* Extreme Left: Product Brand & Console Title */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold tracking-widest text-slate-100 uppercase leading-none font-sans">
          REVENANT
        </span>
        <span className="h-3.5 w-px bg-slate-800 hidden sm:block" />
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase hidden sm:block">
          COASTAL SURVEILLANCE CONSOLE
        </span>
        <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700 font-medium">
          CIVIL LAW ENFORCEMENT
        </span>
      </div>

      {/* Extreme Right: Professional Operator Controls */}
      <div ref={controlsRef} className="relative flex items-center gap-1 font-sans">
        {/* THEME TOGGLE (DARK / LIGHT) */}
        <div className="flex items-center p-0.5 rounded border theme-toggle-container bg-slate-900/90 border-slate-800">
          <button
            type="button"
            onClick={() => theme !== 'dark' && onToggleTheme?.()}
            className={`h-6 px-2 flex items-center gap-1.5 rounded text-[10px] font-mono uppercase font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="Switch to Dark Theme"
          >
            <Moon className="w-3 h-3 text-cyan-400" />
            <span>DARK</span>
          </button>
          <button
            type="button"
            onClick={() => theme !== 'light' && onToggleTheme?.()}
            className={`h-6 px-2 flex items-center gap-1.5 rounded text-[10px] font-mono uppercase font-semibold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
            title="Switch to Light Theme"
          >
            <Sun className="w-3 h-3 text-amber-500" />
            <span>LIGHT</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-800 mx-1" />

        {/* 2. ALERTS */}
        <button
          onClick={handleAlertsClick}
          className={`h-7 px-2.5 flex items-center gap-1.5 rounded transition-colors text-[11px] font-medium border ${
            activeAlertCount > 0
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/50'
              : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
          title={activeAlertCount > 0 ? `${activeAlertCount} Active Maritime Alerts` : 'Alert Center (0 Alerts)'}
          aria-label="Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="font-mono text-[10px] font-bold tracking-wider">
            {activeAlertCount > 0 ? `${activeAlertCount} ALERTS` : 'ALERTS'}
          </span>
        </button>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-800 mx-1" />

        {/* 3. UTC OPERATIONAL CLOCK */}
        <div
          className="h-7 px-2 flex items-center font-mono text-[11px] text-slate-300 select-none tracking-tight font-medium"
          title="Operational Time (Coordinated Universal Time)"
        >
          {utcTime} UTC
        </div>

        {/* Separator */}
        <div className="h-3.5 w-px bg-slate-800 mx-1" />

        {/* 4. OPERATOR */}
        <div className="relative">
          <button
            onClick={handleToggleOperator}
            className={`h-7 px-2 flex items-center gap-1.5 rounded transition-colors text-[11px] font-sans border ${
              isOperatorOpen
                ? 'bg-slate-800 text-slate-100 border-slate-700'
                : 'border-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
            title="Operator credentials and duty session"
            aria-expanded={isOperatorOpen}
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[10.5px] font-bold tracking-wide uppercase text-slate-200">
              OPERATOR-01
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Operator Dropdown */}
          {isOperatorOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 w-48 bg-[#0f172a] border border-slate-700 rounded shadow-xl p-3 text-slate-200 select-none z-40 animate-in fade-in duration-150 font-sans text-[11px]"
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="w-7 h-7 rounded bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-[11px] font-mono shrink-0">
                  01
                </div>
                <div>
                  <div className="font-bold text-slate-100 leading-tight">Operator-01</div>
                  <div className="text-[10px] text-slate-400">Duty Watch Officer</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 py-1">
                <span>Session:</span>
                <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Station:</span>
                <span className="font-mono text-slate-300">CONSOLE-01</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
