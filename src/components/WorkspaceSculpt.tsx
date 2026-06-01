import React from 'react';
import { useBlenderStore, SculptBrush } from '../store/useBlenderStore';

export const WorkspaceSculpt: React.FC = () => {
  const { sculptBrush, setSculptBrush, brushRadius, setBrushRadius, brushStrength, setBrushStrength } = useBlenderStore();

  const brushes: { id: SculptBrush; label: string; icon: string }[] = [
    { id: 'draw', label: 'Draw', icon: '🖎' },
    { id: 'clay', label: 'Clay Strips', icon: '▤' },
    { id: 'crease', label: 'Crease', icon: '▲' },
    { id: 'grab', label: 'Grab', icon: '✊' },
    { id: 'smooth', label: 'Smooth', icon: '◯' },
    { id: 'flatten', label: 'Flatten', icon: '▬' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      <div className="w-full max-w-md mx-auto bg-[#303030]/90 border border-[#1D1D1D] rounded-xl p-3 backdrop-blur-md space-y-3 pointer-events-auto">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Radius (px)</span>
            <span className="text-[#E58E35] font-mono">{brushRadius}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            value={brushRadius}
            onChange={(e) => setBrushRadius(parseInt(e.target.value))}
            className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Strength</span>
            <span className="text-[#E58E35] font-mono">{brushStrength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={brushStrength}
            onChange={(e) => setBrushStrength(parseFloat(e.target.value))}
            className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto pointer-events-auto pb-14">
        <div className="flex space-x-3 px-2 w-max mx-auto">
          {brushes.map((brush) => (
            <button
              key={brush.id}
              onClick={() => setSculptBrush(brush.id)}
              className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center space-y-1 shadow-xl transition-all border ${
                sculptBrush === brush.id
                  ? 'bg-[#E58E35] text-black border-transparent'
                  : 'bg-[#303030] text-gray-300 border-[#1D1D1D]'
              }`}
            >
              <span className="text-xl">{brush.icon}</span>
              <span className="text-[9px] font-bold tracking-tight uppercase truncate max-w-[60px]">
                {brush.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
