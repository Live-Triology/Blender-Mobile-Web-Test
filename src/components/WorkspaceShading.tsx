import React from 'react';
import { useBlenderStore } from '../store/useBlenderStore';
import type { ShadingPreset } from '../store/useBlenderStore';

export const WorkspaceShading: React.FC = () => {
  const meshes = useBlenderStore((state) => state.meshes);
  const selectedObjectId = useBlenderStore((state) => state.selectedObjectId);
  const shadingPreset = useBlenderStore((state) => state.shadingPreset);
  const setShadingPreset = useBlenderStore((state) => state.setShadingPreset);
  const setMaterialProperties = useBlenderStore((state) => state.setMaterialProperties);

  const presets: { id: ShadingPreset; label: string; color: string }[] = [
    { id: 'default', label: 'Default Gray', color: 'bg-gray-500' },
    { id: 'glass', label: 'Glass BSDF', color: 'bg-cyan-200/40 border border-cyan-300' },
    { id: 'rubber', label: 'Matte Rubber', color: 'bg-stone-800' },
    { id: 'gold', label: 'Polished Gold', color: 'bg-amber-400' },
    { id: 'carpaint', label: 'Metallic Car Paint', color: 'bg-red-600 shadow-inner' },
  ];

  const activeMesh = meshes.find((m) => m.id === selectedObjectId) || meshes[0];
  const [baseColor, setBaseColor] = React.useState('#b8b8b8');

  React.useEffect(() => {
    if (!activeMesh?.material?.baseColor) return;
    const [r, g, b] = activeMesh.material.baseColor;
    setBaseColor(
      `#${[r, g, b]
        .map((value) => Math.round(value * 255).toString(16).padStart(2, '0'))
        .join('')}`
    );
  }, [activeMesh]);

  const updateColor = (value: string) => {
    const r = parseInt(value.slice(1, 3), 16) / 255;
    const g = parseInt(value.slice(3, 5), 16) / 255;
    const b = parseInt(value.slice(5, 7), 16) / 255;
    setBaseColor(value);
    setMaterialProperties(selectedObjectId, { baseColor: [r, g, b, activeMesh.material.baseColor[3]] });
  };

  const updateRoughness = (value: number) => {
    setMaterialProperties(selectedObjectId, { roughness: value });
  };

  const updateMetallic = (value: number) => {
    setMaterialProperties(selectedObjectId, { metallic: value });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-[40%] bg-[#212121] border-t border-[#1D1D1D] pointer-events-auto flex flex-col overflow-hidden pb-14">
      <div className="h-10 bg-[#303030] border-b border-[#1D1D1D] px-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500">Shading</p>
          <h2 className="text-sm font-semibold text-white">Material Editor</h2>
        </div>
        <div className="text-[10px] bg-[#1D1D1D] px-2 py-0.5 rounded text-amber-500 font-mono">
          Target: {activeMesh ? activeMesh.name : 'None'}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#141414] grid grid-cols-1 gap-4 items-start">
        <div className="w-full bg-[#303030] border border-[#E58E35] rounded-xl p-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-[#1D1D1D] pb-1.5 mb-2">
            <span className="text-xs font-bold text-[#E58E35]">Principled BSDF</span>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Base Color</span>
              <input
                type="color"
                value={baseColor}
                onChange={(event) => updateColor(event.target.value)}
                className="h-8 w-16 cursor-pointer rounded-lg border border-[#1D1D1D] bg-[#1D1D1D]"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Metallic</span>
                <span className="font-mono text-gray-300">{activeMesh.material.metallic.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeMesh.material.metallic}
                onChange={(e) => updateMetallic(parseFloat(e.target.value))}
                className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Roughness</span>
                <span className="font-mono text-gray-300">{activeMesh.material.roughness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={activeMesh.material.roughness}
                onChange={(e) => updateRoughness(parseFloat(e.target.value))}
                className="w-full accent-[#E58E35] bg-[#1D1D1D] h-2 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        <div className="w-full bg-[#303030] border border-gray-600 rounded-xl p-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-[#1D1D1D] pb-1.5 mb-2">
            <span className="text-xs font-bold text-gray-300">Shader Presets Library</span>
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setShadingPreset(preset.id)}
                className={`h-12 rounded-lg p-2 flex items-center space-x-2 border text-left transition-all ${
                  shadingPreset === preset.id ? 'border-[#E58E35] bg-[#1D1D1D]' : 'border-[#1D1D1D] bg-[#252525]'
                }`}
              >
                <div className={`w-5 h-5 rounded-md shrink-0 ${preset.color}`} />
                <span className="text-[11px] font-medium text-gray-200 truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
