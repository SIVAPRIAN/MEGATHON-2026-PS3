import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { TimeSliderState } from '../types/maritime';

interface TimeSliderProps {
  sliderState: TimeSliderState;
  onChange: (newState: Partial<TimeSliderState>) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  sliderState,
  onChange,
}) => {
  const windows: Array<TimeSliderState['window']> = ['1h', '6h', '24h', '48h', '7d', '30d'];

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none">
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-skylight border border-slate-200 px-3 py-1.5 flex items-center gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange({ currentOffsetPercent: Math.max(0, sliderState.currentOffsetPercent - 10) })}
            className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Step backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onChange({ isPlaying: !sliderState.isPlaying })}
            className="p-1 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-full transition-colors"
            title={sliderState.isPlaying ? 'Pause' : 'Play timeline'}
          >
            {sliderState.isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onChange({ currentOffsetPercent: Math.min(100, sliderState.currentOffsetPercent + 10) })}
            className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Step forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed button */}
        <button
          onClick={() => onChange({ playbackSpeed: sliderState.playbackSpeed === 1 ? 2 : 1 })}
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          title="Toggle playback speed"
        >
          {sliderState.playbackSpeed}x
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Temporal Slider Track */}
        <div className="flex flex-col w-48 sm:w-64">
          <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
            <span>T-{sliderState.window}</span>
            <span className="font-semibold text-slate-700">{sliderState.currentDisplayTime}</span>
            <span>NOW</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderState.currentOffsetPercent}
            onChange={(e) => onChange({ currentOffsetPercent: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Time Window Presets */}
        <div className="flex items-center space-x-1">
          {windows.map(w => (
            <button
              key={w}
              onClick={() => onChange({ window: w })}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                sliderState.window === w
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
