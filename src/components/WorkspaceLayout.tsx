import React, { useState } from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { TransformMode } from '../store/useBlenderStore';

export const WorkspaceLayout: React.FC = () => {
  const transformMode = useBlenderStore((state) => state.transformMode);
  const setTransformMode = useBlenderStore((state) => state.setTransformMode);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [numericValue, setNumericValue] = useState(1.0);

  const tools: { id: TransformMode; label: string; icon: string }[] = [
    { id: 'select', label: 'Select', icon: '⬈' },
    { id: 'translate', label: 'Move', icon: '✛' },
    { id: 'rotate', label: 'Rotate', icon: '⟳' },
    { id: 'scale', label: 'Scale', icon: '⤗' },
    { id: 'extrude', label: 'Extrude', icon: '⇪' },
    { id: 'bevel', label: 'Bevel', icon: '⬘' },
    { id: 'loopcut', label: 'LoopCut', icon: '⊞' },
    { id: 'inset', label: 'Inset', icon: '回' },
  ];

  const handleToolTap = (mode: TransformMode) => {
    setTransformMode(mode);
    if (['extrude', 'bevel', 'inset', 'translate', 'rotate', 'scale'].includes(mode)) {
      setShowBottomSheet(true);
    } else {
      setShowBottomSheet(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      <div className="flex flex-col space-y-2 pointer-events-auto bg-[#303030]/80 p-2 rounded-xl backdrop-blur-md border border-[#1D1D1D] w-14">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolTap(tool.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
              transformMode === tool.id ? 'bg-[#E58E35] text-black font-bold' : 'bg-[#1D1D1D] text-gray-300'
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {showBottomSheet && (
        <div className="w-full bg-[#303030] border border-[#1D1D1D] rounded-2xl p-4 space-y-4 pointer-events-auto shadow-2xl max-w-md mx-auto mb-16">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E58E35] capitalize">
              {transformMode} Operation Parameters
            </span>
            <button onClick={() => setShowBottomSheet(false)} className="text-gray-400 text-sm font-bold px-2">✕</button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Factor Matrix Delta</span>
              <span className="text-white font-mono">{numericValue.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.05"
              value={numericValue}
              onChange={(e) => setNumericValue(parseFloat(e.target.value))}
              className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
            />
          </div>
          <button 
            onClick={() => {
              setShowBottomSheet(false);
              useBlenderStore.getState().pushHistory();
            }}
            className="w-full h-11 bg-[#E58E35] text-black font-bold rounded-lg text-sm transition-colors"
          >
            Confirm Operation
          </button>
        </div>
      )}
    </div>
  );
};
