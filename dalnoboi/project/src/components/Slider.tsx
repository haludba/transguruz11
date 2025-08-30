import React, { useState, useRef, useCallback } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  trackColor?: string;
  thumbColor?: string;
  className?: string;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  trackColor = '#d1d5db',
  thumbColor = '#06b6d4',
  className = '',
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Calculate percentage position of the thumb
  const percentage = ((value - min) / (max - min)) * 100;

  // Handle mouse down on thumb
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = min + (percentage / 100) * (max - min);
      
      // Round to nearest step
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));
      
      onChange(clampedValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [min, max, step, onChange, disabled]);

  // Handle click on track
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    
    // Round to nearest step
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    onChange(clampedValue);
  }, [min, max, step, onChange, disabled, isDragging]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Track */}
      <div
        ref={sliderRef}
        className={`relative h-2 rounded-lg cursor-pointer ${disabled ? 'opacity-50' : ''}`}
        style={{
          backgroundColor: trackColor,
          border: '2px solid #374151',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8), inset 0 1px 3px rgba(0, 0, 0, 0.3)'
        }}
        onClick={handleTrackClick}
      >
        {/* Filled track */}
        <div
          className="absolute top-0 left-0 h-full rounded-lg transition-all duration-150"
          style={{
            width: `${percentage}%`,
            backgroundColor: `${thumbColor}40`, // 25% opacity
            border: 'none'
          }}
        />
        
        {/* Thumb */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full border-3 border-white shadow-lg cursor-pointer transition-all duration-200 ${
            isDragging ? 'scale-110' : 'hover:scale-110'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{
            left: `calc(${percentage}% - 12px)`,
            background: `linear-gradient(135deg, ${thumbColor}, ${thumbColor}dd)`,
            boxShadow: isDragging 
              ? `0 6px 16px rgba(0, 0, 0, 0.9), 0 0 0 3px ${thumbColor}80`
              : `0 4px 12px rgba(0, 0, 0, 0.8), 0 0 0 2px ${thumbColor}60`,
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

export default Slider;