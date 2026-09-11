import React, { useState, useEffect } from 'react';
import { Radio, Video, Activity, CheckCircle2 } from 'lucide-react';

export const FeedHealthBar: React.FC = () => {
  const [aisRate, setAisRate] = useState(38);
  const [eoFps, setEoFps] = useState(4.2);

  // Subtle live telemetry pulse to show live ingestion
  useEffect(() => {
    const interval = setInterval(() => {
      setAisRate(Math.floor(36 + Math.random() * 8));
      setEoFps(Number((4.0 + Math.random() * 0.6).toFixed(1)));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700/70 px-2.5 py-1 rounded text-[9.5px] text-slate-300 font-mono select-none">
      {/* AIS Feed Indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Radio className="w-3 h-3 text-sky-400" />
        <span className="text-slate-400">AIS FEED:</span>
        <span className="text-emerald-300 font-bold">INGESTING</span>
        <span className="text-slate-500">({aisRate} tx/s)</span>
      </div>

      <div className="h-3 w-px bg-slate-700" />

      {/* EO Camera Sensor Feed Indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        <Video className="w-3 h-3 text-sky-400" />
        <span className="text-slate-400">EO SENSORS:</span>
        <span className="text-sky-300 font-bold">87 SITES</span>
        <span className="text-slate-500">({eoFps} FPS)</span>
      </div>
    </div>
  );
};
