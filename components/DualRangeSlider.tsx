import React, { useRef, useEffect, useState } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step,
  minValue,
  maxValue,
  onChange,
  formatValue = (v) => `£${v}`
}) => {
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const value = Math.round((percentage / 100) * (max - min) + min);
    const snappedValue = Math.round(value / step) * step;

    // Determine which handle to move (closest one)
    const distToMin = Math.abs(snappedValue - minValue);
    const distToMax = Math.abs(snappedValue - maxValue);

    if (distToMin < distToMax) {
      onChange(Math.min(snappedValue, maxValue), maxValue);
    } else {
      onChange(minValue, Math.max(snappedValue, minValue));
    }
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange(Math.min(value, maxValue), maxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange(minValue, Math.max(value, minValue));
  };

  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  return (
    <div className="relative w-full">
      {/* Value Labels */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col items-start">
          <span className="text-sm text-slate-600 mb-1">Minimum</span>
          <span className="font-bold text-slate-900 text-xl">{formatValue(minValue)}/hour</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-slate-600 mb-1">Maximum</span>
          <span className="font-bold text-slate-900 text-xl">{formatValue(maxValue)}/hour</span>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative h-12 flex items-center">
        {/* Track background */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="absolute w-full h-2 bg-slate-200 rounded-full cursor-pointer"
        >
          {/* Active range highlight */}
          <div
            className="absolute h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
        </div>

        {/* Min Range Input (invisible) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          onMouseDown={() => setIsDraggingMin(true)}
          onMouseUp={() => setIsDraggingMin(false)}
          onTouchStart={() => setIsDraggingMin(true)}
          onTouchEnd={() => setIsDraggingMin(false)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer"
          style={{
            zIndex: minValue > max - (max - min) * 0.2 ? 5 : 3
          }}
        />

        {/* Max Range Input (invisible) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          onMouseDown={() => setIsDraggingMax(true)}
          onMouseUp={() => setIsDraggingMax(false)}
          onTouchStart={() => setIsDraggingMax(true)}
          onTouchEnd={() => setIsDraggingMax(false)}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none cursor-pointer"
          style={{
            zIndex: 4
          }}
        />

        {/* Custom Min Thumb */}
        <div
          className={`absolute w-6 h-6 bg-white border-3 border-brand-600 rounded-full shadow-lg cursor-pointer transition-transform ${
            isDraggingMin ? 'scale-125' : 'hover:scale-110'
          }`}
          style={{
            left: `calc(${minPercentage}% - 12px)`,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />

        {/* Custom Max Thumb */}
        <div
          className={`absolute w-6 h-6 bg-white border-3 border-brand-600 rounded-full shadow-lg cursor-pointer transition-transform ${
            isDraggingMax ? 'scale-125' : 'hover:scale-110'
          }`}
          style={{
            left: `calc(${maxPercentage}% - 12px)`,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-slate-400 mt-3">
        <span>£30</span>
        <span>£250</span>
        <span>£500+</span>
      </div>

      {/* Custom Styles for Range Inputs */}
      <style>{`
        input[type="range"] {
          pointer-events: all;
        }
        input[type="range"]::-webkit-slider-thumb {
          width: 24px;
          height: 24px;
          appearance: none;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          appearance: none;
          background: transparent;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
