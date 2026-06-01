import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { SculptBrush } from '../store/useBlenderStore';

export const WorkspaceSculpt: React.FC = () => {
  const sculptBrush = useBlenderStore((state) => state.sculptBrush);
  const setSculptBrush = useBlenderStore((state) => state.setSculptBrush);
  const brushRadius = useBlenderStore((state) => state.brushRadius);
  const setBrushRadius = useBlenderStore((state) => state.setBrushRadius);
  const brushStrength = useBlenderStore((state) => state.brushStrength);
  const setBrushStrength = useBlenderStore((state) => state.setBrushStrength);
  const applySculptBrush = useBlenderStore((state) => state.applySculptBrush);
  const selectedObjectId = useBlenderStore((state) => state.selectedObjectId);
  const selectedObjectName = useBlenderStore((state) =>
    state.meshes.find((mesh) => mesh.id === state.selectedObjectId)?.name ?? 'None'
  );

  const brushes: { id: SculptBrush; label: string; icon: string }[] = [
    { id: 'draw', label: 'Draw', icon: '🖎' },
    { id: 'clay', label: 'Clay', icon: '▤' },
    { id: 'crease', label: 'Crease', icon: '▲' },
    { id: 'grab', label: 'Grab', icon: '✊' },
    { id: 'smooth', label: 'Smooth', icon: '◯' },
    { id: 'flatten', label: 'Flatten', icon: '▬' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      <div className="w-full max-w-md mx-auto rounded-3xl border border-[#1D1D1D] bg-[#181818]/95 p-4 shadow-2xl backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300">Sculpt</p>
            <h2 className="text-sm font-semibold text-white">Brush Control</h2>
            <p className="text-[11px] text-gray-400">Target: {selectedObjectName}</p>
          </div>
          <button
            onClick={() => applySculptBrush(sculptBrush, brushRadius, brushStrength)}
            className="rounded-2xl bg-[#E58E35] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-[#ffb46b]"
          >
            Apply Brush
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Radius</span>
              <span className="text-[#E58E35] font-mono">{brushRadius}px</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={brushRadius}
              onChange={(e) => setBrushRadius(parseInt(e.target.value, 10))}
              className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
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

          <div className="flex flex-wrap gap-3">
            {brushes.map((brush) => (
              <button
                key={brush.id}
                onClick={() => setSculptBrush(brush.id)}
                className={`w-20 rounded-2xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  sculptBrush === brush.id
                    ? 'border-amber-500 bg-amber-400/15 text-white'
                    : 'border-[#1D1D1D] bg-[#111111] text-gray-300 hover:border-white/20'
                }`}
              >
                <span className="block text-lg">{brush.icon}</span>
                {brush.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
